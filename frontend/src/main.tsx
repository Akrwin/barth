import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import Dashboard    from './pages/Dashboard'
import Activity     from './pages/Activity'
import Add          from './pages/Add'
import Installments from './pages/Installments'
import Login        from './pages/Login'
import Register     from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/activity" element={
            <ProtectedRoute><Activity /></ProtectedRoute>
          } />
          <Route path="/add" element={
            <ProtectedRoute><Add /></ProtectedRoute>
          } />
          <Route path="/installments" element={
            <ProtectedRoute><Installments /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
