import { useAuth } from './context/AuthContext'
import LoginScreen from './components/LoginScreen'
import OrderScreen from './components/OrderScreen'

export default function App() {
  const { user } = useAuth()
  return user ? <OrderScreen /> : <LoginScreen />
}
