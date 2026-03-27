import { Link } from 'react-router-dom'
import Button from './Button'

interface SidebarProps {
  activeMonth: string
}

const ALL_MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

function getMonthsUpToCurrent(): string[] {
  const now = new Date()
  const currentMonthIndex = now.getMonth() // 0-based
  return ALL_MONTHS.slice(0, currentMonthIndex + 1)
}

export default function Sidebar({ activeMonth }: SidebarProps) {
  const months = getMonthsUpToCurrent()

  return (
    <aside className="hidden md:flex flex-col w-48 fixed left-0 top-20 bottom-0 border-r-2 border-black bg-white z-40 overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b-2 border-black">
        <p className="font-label text-xs uppercase tracking-widest text-black/50 mb-1">
          MONTHLY
        </p>
        <p className="font-headline font-black text-lg uppercase tracking-tight">
          ARCHIVE
        </p>
      </div>

      {/* Month List */}
      <ul className="flex-1 py-2">
        {months.map((month) => {
          const isActive = activeMonth.toUpperCase() === month
          return (
            <li key={month}>
              <button
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  'font-label text-xs font-bold uppercase tracking-widest',
                  isActive
                    ? 'bg-black text-white'
                    : 'text-black hover:bg-black/5',
                ].join(' ')}
              >
                <span className="material-symbols-outlined text-sm flex-shrink-0">
                  calendar_month
                </span>
                <span className="truncate">{month}</span>
              </button>
            </li>
          )
        })}
      </ul>

      {/* Bottom Section */}
      <div className="border-t-2 border-black p-4 flex flex-col gap-2">
        <Button variant="primary" className="w-full justify-center text-xs py-3">
          + NEW ENTRY
        </Button>

        <Link
          to="/settings"
          className="flex items-center gap-2 px-2 py-2 font-label text-xs font-bold uppercase tracking-widest text-black/60 hover:text-black transition-colors"
        >
          <span className="material-symbols-outlined text-sm">settings</span>
          SETTINGS
        </Link>

        <button className="flex items-center gap-2 px-2 py-2 font-label text-xs font-bold uppercase tracking-widest text-black/60 hover:text-black transition-colors w-full text-left">
          <span className="material-symbols-outlined text-sm">logout</span>
          LOGOUT
        </button>
      </div>
    </aside>
  )
}
