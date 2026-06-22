import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStripeServerClient } from '@/app/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Borra un método de pago guardado. Si tiene una tarjeta de Stripe
// asociada, primero la "detach" del Customer en Stripe (si no, la tarjeta
// se queda viva del lado de Stripe aunque ya no aparezca aquí). Si es un
// método sin tarjeta (Efectivo, Transferencia SPEI...), solo borra la fila.
export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return badRequest('Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor.', 500)
  }

  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return badRequest('Falta el token de sesión.', 401)

  const body = await request.json().catch(() => null) as { metodoId?: string } | null
  if (!body?.metodoId) return badRequest('Falta indicar qué método de pago borrar.')

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: authData, error: authError } = await admin.auth.getUser(token)
  if (authError || !authData.user) return badRequest('Sesión no válida o expirada.', 401)

  const { data: usuarioRow, error: usuarioError } = await admin
    .from('usuarios')
    .select('id')
    .eq('auth_id', authData.user.id)
    .maybeSingle()
  if (usuarioError || !usuarioRow) return badRequest('No se encontró el perfil de usuario.', 404)

  // Confirmar que el método es del usuario en sesión antes de tocar nada
  // -- nunca se confía en que el metodoId mandado sea suyo solo porque lo
  // mandó el cliente.
  const { data: metodoRow, error: metodoError } = await admin
    .from('metodos_pago_usuario')
    .select('id, usuario_id, stripe_payment_method_id')
    .eq('id', body.metodoId)
    .maybeSingle()
  if (metodoError || !metodoRow || metodoRow.usuario_id !== usuarioRow.id) {
    return badRequest('El método de pago indicado no es válido.', 403)
  }

  try {
    if (metodoRow.stripe_payment_method_id) {
      const stripe = getStripeServerClient()
      await stripe.paymentMethods.detach(metodoRow.stripe_payment_method_id).catch(e => {
        // Si Stripe ya no tiene esa tarjeta (p. ej. se borró desde el
        // dashboard de Stripe), no bloquea el borrado del registro local.
        console.error('No se pudo desvincular la tarjeta en Stripe:', e)
      })
    }

    const { error: deleteError } = await admin.from('metodos_pago_usuario').delete().eq('id', metodoRow.id)
    if (deleteError) throw deleteError

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error eliminando método de pago:', e)
    return badRequest('No se pudo eliminar el método de pago.', 500)
  }
}