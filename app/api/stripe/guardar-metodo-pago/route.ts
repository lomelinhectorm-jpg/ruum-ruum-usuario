import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeServerClient } from '@/app/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Segundo paso: el navegador ya confirmó el SetupIntent con Stripe.js
// (la tarjeta ya quedó tokenizada del lado de Stripe). Aquí se verifica
// del lado del servidor que ese SetupIntent en verdad se completó y
// pertenece al Customer de este usuario -- nunca se confía en el
// setupIntentId por sí solo -- y se lee la marca/últimos 4 dígitos
// directo de la respuesta de Stripe, nunca de lo que mande el formulario.
export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return badRequest('Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.', 500)
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return badRequest('Falta el token de sesión.', 401)

  const body = await request.json().catch(() => null) as {
    setupIntentId?: string; metodoPagoId?: string; alias?: string
  } | null
  if (!body?.setupIntentId) return badRequest('Falta el identificador de la captura de tarjeta.')
  if (!body?.metodoPagoId) return badRequest('Falta indicar el método de pago del catálogo.')

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData.user) return badRequest('Sesión no válida o expirada.', 401)

  const { data: usuarioRow, error: usuarioError } = await admin
    .from('usuarios')
    .select('id, stripe_customer_id')
    .eq('auth_id', authData.user.id)
    .maybeSingle()
  if (usuarioError || !usuarioRow?.stripe_customer_id) return badRequest('No se encontró el perfil de usuario.', 404)

  let stripe
  try {
    stripe = getStripeServerClient()
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Stripe no está configurado.', 500)
  }

  try {
    const setupIntent = await stripe.setupIntents.retrieve(body.setupIntentId)

    if (setupIntent.status !== 'succeeded') {
      return badRequest('La captura de la tarjeta no se completó correctamente.')
    }
    if (setupIntent.customer !== usuarioRow.stripe_customer_id) {
      return badRequest('La tarjeta capturada no corresponde a este usuario.', 403)
    }

    const paymentMethodId = typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id
    if (!paymentMethodId) return badRequest('No se encontró la tarjeta capturada.')

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    const card = paymentMethod.card
    if (!card) return badRequest('El método capturado no es una tarjeta.')

    const { data: nuevo, error: insertError } = await admin
      .from('metodos_pago_usuario')
      .insert({
        usuario_id: usuarioRow.id,
        metodo_pago_id: body.metodoPagoId,
        alias: body.alias?.trim().toUpperCase() || null,
        titular: paymentMethod.billing_details?.name?.toUpperCase() || null,
        ultimos_digitos: card.last4,
        marca: card.brand,
        stripe_payment_method_id: paymentMethodId,
      })
      .select(`
        id, metodo_pago_id, alias, titular, ultimos_digitos, marca,
        predeterminado, activo, created_at,
        metodos_pago(nombre, descripcion)
      `)
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ ok: true, metodo: nuevo })
  } catch (e) {
    console.error('Error guardando método de pago de Stripe:', e)
    return badRequest('No se pudo guardar la tarjeta.', 500)
  }
}