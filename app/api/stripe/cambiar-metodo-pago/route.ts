import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeServerClient } from '@/app/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Primer paso para guardar una tarjeta real: crea (o reutiliza) el
// Customer de Stripe del usuario y abre un SetupIntent. El navegador usa
// el client_secret que regresa esto para capturar la tarjeta directo con
// Stripe.js (Elements) -- el número de tarjeta nunca llega a este
// servidor ni a Supabase, solo pasa por la API de Stripe.
export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return badRequest('Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.', 500)
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return badRequest('Falta el token de sesión.', 401)

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData.user) return badRequest('Sesión no válida o expirada.', 401)

  const { data: usuarioRow, error: usuarioError } = await admin
    .from('usuarios')
    .select('id, nombre, apellido, email, stripe_customer_id')
    .eq('auth_id', authData.user.id)
    .maybeSingle()
  if (usuarioError || !usuarioRow) return badRequest('No se encontró el perfil de usuario.', 404)

  let stripe
  try {
    stripe = getStripeServerClient()
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : 'Stripe no está configurado.', 500)
  }

  try {
    let stripeCustomerId = usuarioRow.stripe_customer_id as string | null

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: usuarioRow.email ?? undefined,
        name: `${usuarioRow.nombre ?? ''} ${usuarioRow.apellido ?? ''}`.trim() || undefined,
        metadata: { usuario_id: usuarioRow.id },
      })
      stripeCustomerId = customer.id

      const { error: updateError } = await admin
        .from('usuarios')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', usuarioRow.id)
      if (updateError) throw updateError
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
    })

    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (e) {
    console.error('Error creando SetupIntent de Stripe:', e)
    return badRequest('No se pudo iniciar la captura de la tarjeta con Stripe.', 500)
  }
}