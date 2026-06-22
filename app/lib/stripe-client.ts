import { loadStripe, type Stripe } from '@stripe/stripe-js'

// Cliente de Stripe del lado del navegador. Usa la llave PÚBLICA
// (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) -- esta sí puede viajar al
// navegador, a diferencia de la llave secreta en lib/stripe.ts.
let stripePromise: Promise<Stripe | null> | null = null

export function getStripeBrowserClient() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    if (!key) {
      console.error('Falta configurar NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.')
      return Promise.resolve(null)
    }
    stripePromise = loadStripe(key)
  }
  return stripePromise
}