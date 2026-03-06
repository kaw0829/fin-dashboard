import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="members" element={<div className="text-slate-700">Members — coming soon</div>} />
          <Route path="transactions" element={<div className="text-slate-700">Transactions — coming soon</div>} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
