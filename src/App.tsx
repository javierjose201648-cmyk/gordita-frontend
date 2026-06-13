import { useAuth } from './context/AuthContext'
import LoginScreen    from './components/LoginScreen'
import OrderScreen    from './components/OrderScreen'
import KitchenScreen  from './components/KitchenScreen'

export default function App() {
  if (window.location.hash === '#cocina') return <KitchenScreen />
  return <MainApp />
}

function MainApp() {
  const { user } = useAuth()
  return user ? <OrderScreen /> : <LoginScreen />
}
