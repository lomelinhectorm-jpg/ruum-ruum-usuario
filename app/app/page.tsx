import { AppProvider } from '@/context/AppContext'
import MobileApp from '@/components/MobileApp'

export default function Home() {
  return (
    <AppProvider>
      <MobileApp />
    </AppProvider>
  )
}
