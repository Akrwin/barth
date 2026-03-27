import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import NavBar from '../components/ui/NavBar'
import Sidebar from '../components/ui/Sidebar'
import ProgressBar from '../components/ui/ProgressBar'
import { transactionsApi, type Transaction } from '../lib/api'

const NOW = new Date()
const CURRENT_MONTH = NOW.getMonth() + 1
const CURRENT_YEAR = NOW.getFullYear()

const MONTH_NAMES = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                     'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']

const ICON_MAP: Record<string, string> = {
  SHOPPING: 'shopping_cart', DINING: 'restaurant', TRANSPORT: 'directions_car',
  HOUSING: 'home', BILLS: 'receipt_long', HEALTH: 'favorite',
  FITNESS: 'fitness_center', OTHER: 'more_horiz',
  SALARY: 'payments', FREELANCE: 'work',
}
function iconFor(cat: string | null | undefined) {
  if (!cat) return 'receipt_long'
  return ICON_MAP[cat.toUpperCase()] ?? 'receipt_long'
}

function groupByDay(txns: Transaction[]): { label: string; date: string; items: Transaction[] }[] {
  const today = new Date(); today.setHours(0,0,0,0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  const groups: Record<string, Transaction[]> = {}
  for (const t of txns) {
    const d = new Date(t.created_at); d.setHours(0,0,0,0)
    const ts = d.getTime()
    const key = ts === today.getTime() ? 'TODAY'
               : ts === yesterday.getTime() ? 'YESTERDAY'
               : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  }

  return Object.entries(groups).map(([label, items]) => ({
    label,
    date: new Date(items[0].created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase(),
    items,
  }))
}

function TransactionRow({ txn, onDelete }: { txn: Transaction; onDelete: (id: string) => void }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isIncome = txn.type === 'INCOME'
  const icon = iconFor(txn.category?.name)
  const amount = Math.abs(txn.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })

  return (
    <div className="flex items-center gap-4 border-2 border-black p-5 hover:bg-black hover:text-white group transition-colors">
      <div className="w-11 h-11 border-2 border-black group-hover:border-white flex items-center justify-center flex-shrink-0 transition-colors">
        <span className="material-symbols-outlined text-xl">{icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-label font-bold uppercase tracking-wider text-sm truncate">
          {txn.note ?? txn.category?.name ?? 'TRANSACTION'}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`font-label font-bold text-[10px] uppercase tracking-widest px-2 py-0.5 border ${
            isIncome
              ? 'border-black group-hover:border-white'
              : 'border-black/40 group-hover:border-white/50 text-black/60 group-hover:text-white/60'
          }`}>
            {txn.type}
          </span>
          <span className="text-[10px] text-black/40 group-hover:text-white/50 uppercase tracking-widest font-label transition-colors">
            {txn.category?.name ?? '—'} • {new Date(txn.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div className={`font-headline tracking-tighter flex-shrink-0 text-right ${isIncome ? 'text-2xl font-black' : 'text-xl font-bold'}`}>
        {isIncome ? '+' : '-'}฿{amount}
      </div>

      {confirmDelete ? (
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => onDelete(txn.id)}
            className="font-label font-bold text-[10px] uppercase tracking-widest px-3 py-2 bg-black text-white group-hover:bg-white group-hover:text-black border-2 border-black group-hover:border-white transition-colors">
            CONFIRM
          </button>
          <button onClick={() => setConfirmDelete(false)}
            className="font-label font-bold text-[10px] uppercase tracking-widest px-3 py-2 border-2 border-black group-hover:border-white transition-colors">
            CANCEL
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(true)}
          className="w-9 h-9 flex items-center justify-center flex-shrink-0 border-2 border-black group-hover:border-white hover:bg-white hover:text-black group-hover:hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
          title="Delete">
          <span className="material-symbols-outlined text-base">delete</span>
        </button>
      )}
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-black/10 animate-pulse ${className}`} />
}

export default function Activity() {
  const queryClient = useQueryClient()
  const [activeFilter, setActiveFilter] = useState<string>('ALL')
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH)
  const [selectedYear] = useState(CURRENT_YEAR)

  const { data: allTxns = [], isLoading } = useQuery({
    queryKey: ['transactions', selectedMonth, selectedYear],
    queryFn: () => transactionsApi.list(selectedMonth, selectedYear),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    },
  })

  // ── Dynamic filters: derive from actual categories in loaded transactions ──
  const dynamicCategories = Array.from(
    new Set(allTxns.map(t => t.category?.name).filter(Boolean) as string[])
  ).sort()
  const filters = ['ALL', ...dynamicCategories]

  // Reset filter to ALL if current filter no longer exists in new month's data
  const validFilter = filters.includes(activeFilter) ? activeFilter : 'ALL'

  const filtered = allTxns.filter(t => {
    if (validFilter === 'ALL') return true
    return (t.category?.name?.toUpperCase() ?? '') === validFilter.toUpperCase()
  })

  const groups = groupByDay(filtered)

  const totalOutflow = allTxns.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const totalIncome  = allTxns.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const utilization  = totalIncome > 0 ? Math.round((totalOutflow / totalIncome) * 100) : 0

  const prevMonth = () => setSelectedMonth(m => m === 1 ? 12 : m - 1)
  const nextMonth = () => {
    // Allow any month within the current year; stop at December
    if (selectedYear >= CURRENT_YEAR && selectedMonth >= 12) return
    setSelectedMonth(m => m === 12 ? 1 : m + 1)
  }

  return (
    <div className="font-body bg-white text-black min-h-screen">
      <NavBar activePage="activity" />
      <Sidebar activeMonth={MONTH_NAMES[selectedMonth - 1]} />

      <main className="pt-20 md:pl-48 pb-16 md:pb-0 min-h-screen">
        <div className="max-w-[1440px] border-r-2 border-black min-h-screen">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row justify-between items-end p-12 border-b-2 border-black gap-6">
            <div>
              <h1 className="font-headline font-black text-8xl uppercase tracking-tighter leading-none">ACTIVITY</h1>
              <p className="font-label text-xs font-bold uppercase tracking-widest text-black/40 mt-2">
                REAL-TIME FINANCIAL LEDGER
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={prevMonth}
                className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <div className="font-headline font-black text-sm uppercase tracking-widest min-w-[160px] text-center border-2 border-black px-4 py-2">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </div>
              <button onClick={nextMonth}
                className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>

          {/* ── Dynamic filter bar ── */}
          <div className="flex flex-wrap items-center gap-3 px-12 py-5 border-b-2 border-black">
            <span className="font-label text-xs font-bold uppercase tracking-widest text-black/40">FILTER:</span>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              filters.map(f => (
                <button key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`font-label font-bold text-xs uppercase tracking-widest px-4 py-2 border-2 border-black transition-colors ${
                    (f === validFilter) ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
                  {f}
                </button>
              ))
            )}
            {!isLoading && dynamicCategories.length === 0 && (
              <span className="font-label text-xs font-bold uppercase tracking-widest text-black/30">
                NO TRANSACTIONS THIS MONTH
              </span>
            )}
          </div>

          {/* ── Transaction list ── */}
          <div className="p-12 space-y-10">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : groups.length === 0 ? (
              <p className="font-label text-xs font-bold uppercase tracking-widest text-black/30 py-12 text-center">
                NO TRANSACTIONS FOR {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </p>
            ) : (
              groups.map(g => (
                <div key={g.label}>
                  <div className="flex justify-between items-baseline mb-6">
                    <h2 className="font-headline font-black text-4xl uppercase tracking-tighter">{g.label}</h2>
                    <span className="font-label text-xs font-bold uppercase tracking-widest text-black/40">{g.date}</span>
                  </div>
                  <div className="border-t-2 border-black space-y-0">
                    {g.items.map(txn => (
                      <TransactionRow key={txn.id} txn={txn} onDelete={(id) => deleteMutation.mutate(id)} />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Bottom summary ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-t-2 border-black">
            <div className="p-12 border-r-2 border-black">
              <p className="font-label text-xs font-bold uppercase tracking-widest text-black/40 mb-2">MONTHLY VOLUME</p>
              <p className="font-headline font-black text-6xl tracking-tighter mb-2">
                ฿{totalOutflow.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
              </p>
              <p className="font-label text-xs font-bold uppercase tracking-widest text-black/40 mb-4">TOTAL OUTFLOW</p>
              <ProgressBar percentage={Math.min(utilization, 100)} />
            </div>
            <div className="p-12 bg-black text-white">
              <p className="font-label text-xs font-bold uppercase tracking-widest text-white/40 mb-2">BUDGET STATUS</p>
              <p className="font-headline font-black text-6xl tracking-tighter mb-3">{utilization}%</p>
              <p className="font-label text-xs font-bold uppercase tracking-wider text-white/60 mb-8">
                UTILIZATION FOR {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
              </p>
              <button className="font-headline font-black text-xs uppercase tracking-widest px-6 py-3 border-2 border-white text-white hover:bg-white hover:text-black transition-colors">
                ADJUST LIMITS
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
