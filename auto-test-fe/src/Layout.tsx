import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="navbar-brand">Autotest</div>
        <div className="navbar-links">
          <NavLink to="/run" className={({ isActive }) => (isActive ? 'active' : '')}>
            Run
          </NavLink>
          <NavLink to="/sessions" className={({ isActive }) => (isActive ? 'active' : '')}>
            Sessions
          </NavLink>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
