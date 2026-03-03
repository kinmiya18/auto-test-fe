import './App.css'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components'
import { RunSessionPage, SessionsPage, SessionDetailPage } from './pages'
import { RunSessionProvider } from './contexts/RunSessionContext'

export default function App() {
  return (
    <RunSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<RunSessionPage />} />
            <Route path="history" element={<SessionsPage />} />
            <Route path="history/:id" element={<SessionDetailPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RunSessionProvider>
  )
}
