import { Navigate } from 'react-router-dom'
import { getToken } from '../lib/api'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  if (!getToken()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
