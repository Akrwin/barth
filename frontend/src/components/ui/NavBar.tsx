import { Link } from 'react-router-dom'

type ActivePage = 'dashboard' | 'activity' | 'add' | 'installments'

interface NavBarProps {
  activePage: ActivePage
}

const navLinks: { id: ActivePage; label: string; href: string }[] = [
  { id: 'dashboard',    label: 'DASHBOARD',    href: '/' },
  { id: 'activity',     label: 'ACTIVITY',     href: '/activity' },
  { id: 'add',          label: 'ADD',          href: '/add' },
  { id: 'installments', label: 'INSTALLMENTS', href: '/installments' },
]

export default function NavBar({ activePage }: NavBarProps) {
  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-20 bg-white border-b-2 border-black items-center px-8 justify-between">
        {/* Logo */}
        <span className="font-headline font-black text-2xl uppercase tracking-widest select-none">
          BARTH
        </span>

        {/* Center Links */}
        <div className="flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.id}
              to={link.href}
              className={[
                'font-label font-bold text-xs uppercase tracking-widest pb-1 transition-colors',
                activePage === link.id
                  ? 'border-b-4 border-black text-black'
                  : 'text-black/60 hover:text-black border-b-4 border-transparent',
              ].join(' ')}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">account_circle</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 bg-white border-t-2 border-black flex items-center justify-around">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 ${activePage === 'dashboard' ? 'text-black' : 'text-black/40'}`}
        >
          <span className="material-symbols-outlined text-2xl">grid_view</span>
        </Link>
        <Link
          to="/activity"
          className={`flex flex-col items-center gap-1 p-2 ${activePage === 'activity' ? 'text-black' : 'text-black/40'}`}
        >
          <span className="material-symbols-outlined text-2xl">query_stats</span>
        </Link>
        <Link
          to="/add"
          className={`flex flex-col items-center gap-1 p-2 ${activePage === 'add' ? 'text-black' : 'text-black/40'}`}
        >
          <span className="material-symbols-outlined text-2xl">add_box</span>
        </Link>
        <Link
          to="/installments"
          className={`flex flex-col items-center gap-1 p-2 ${activePage === 'installments' ? 'text-black' : 'text-black/40'}`}
        >
          <span className="material-symbols-outlined text-2xl">person</span>
        </Link>
      </nav>
    </>
  )
}
