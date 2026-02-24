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
            <Route index element={<Navigate to="/run" replace />} />
            <Route path="run" element={<RunSessionPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="sessions/:id" element={<SessionDetailPage />} />
            <Route path="*" element={<Navigate to="/run" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RunSessionProvider>
  )
}
