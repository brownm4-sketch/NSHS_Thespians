import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-blue-700 text-orange-300' : 'text-blue-100 hover:bg-blue-800 hover:text-orange-200'
  }`

export function Navbar() {
  const { session, profile, isOfficer, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  async function handleSignOut() {
    await signOut()
    closeMenu()
    navigate('/')
  }

  return (
    <header className="bg-blue-900 shadow-md">
      <nav className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-white" onClick={closeMenu}>
            <span className="inline-block h-3 w-3 rounded-full bg-orange-500" />
            NSHS Thespians
          </NavLink>

          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink to="/officers" className={linkClass}>
              Officers
            </NavLink>
            <NavLink to="/apply" className={linkClass}>
              Apply
            </NavLink>
            {session && (
              <NavLink to="/dashboard" className={linkClass}>
                My Dashboard
              </NavLink>
            )}
            {isOfficer && (
              <NavLink to="/admin" className={linkClass}>
                Admin Panel
              </NavLink>
            )}
            {session ? (
              <button
                onClick={handleSignOut}
                className="ml-2 rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-blue-900 transition-colors hover:bg-orange-400"
              >
                Sign Out{profile?.full_name ? ` (${profile.full_name.split(' ')[0]})` : ''}
              </button>
            ) : (
              <NavLink
                to="/login"
                className="ml-2 rounded-md bg-orange-500 px-3 py-2 text-sm font-semibold text-blue-900 transition-colors hover:bg-orange-400"
              >
                Member Login
              </NavLink>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-md p-2 text-white md:hidden"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="mt-3 flex flex-col gap-1 border-t border-blue-800 pt-3 md:hidden">
            <NavLink to="/" className={linkClass} end onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink to="/officers" className={linkClass} onClick={closeMenu}>
              Officers
            </NavLink>
            <NavLink to="/apply" className={linkClass} onClick={closeMenu}>
              Apply
            </NavLink>
            {session && (
              <NavLink to="/dashboard" className={linkClass} onClick={closeMenu}>
                My Dashboard
              </NavLink>
            )}
            {isOfficer && (
              <NavLink to="/admin" className={linkClass} onClick={closeMenu}>
                Admin Panel
              </NavLink>
            )}
            {session ? (
              <button
                onClick={handleSignOut}
                className="mt-1 rounded-md bg-orange-500 px-3 py-2 text-center text-sm font-semibold text-blue-900 transition-colors hover:bg-orange-400"
              >
                Sign Out{profile?.full_name ? ` (${profile.full_name.split(' ')[0]})` : ''}
              </button>
            ) : (
              <NavLink
                to="/login"
                onClick={closeMenu}
                className="mt-1 block rounded-md bg-orange-500 px-3 py-2 text-center text-sm font-semibold text-blue-900 transition-colors hover:bg-orange-400"
              >
                Member Login
              </NavLink>
            )}
          </div>
        )}
      </nav>
    </header>
  )
}
