import Stripe from 'stripe'

// Cliente de Stripe del lado del servidor. SOLO se importa desde rutas
// API (app/api/stripe/*) -- nunca desde código que corra en el navegador,
// porque usa la llave secreta.
const secretKey = process.env.STRIPE_SECRET_KEY

export function getStripeServerClient() {
  if (!secretKey) {
    throw new Error('Falta configurar STRIPE_SECRET_KEY en el servidor.')
  }
  return new Stripe(secretKey)
}