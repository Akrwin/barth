import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import NavBar from '../components/ui/NavBar'
import ProgressBar from '../components/ui/ProgressBar'
import { dashboardApi, formatMoney, type BudgetItem, type CategoryBreakdown } from '../lib/api'

type Period = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

const NOW = new Date()
const MONTH_NAMES = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
]

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-black/10 animate-pulse ${className}`} />
}

function ChartBar({
  pct, label, value, trendAmt, trendPct, prevAmt,
}: {
  pct: number
  label: string
  value: string
  trendAmt?: number
  trendPct?: number
  prevAmt?: number
}) {
  const hasTrend = trendAmt !== undefined && (trendAmt !== 0 || (prevAmt !== undefined && prevAmt > 0))
  const isUp   = (trendAmt ?? 0) > 0
  const isDown = (trendAmt ?? 0) < 0
  const isFlat = (trendAmt ?? 0) === 0

  const trendColor = isUp ? 'text-black' : isDown ? 'text-black/50' : 'text-black/30'
  const trendIcon  = isUp ? 'arrow_upward' : isDown ? 'arrow_downward' : 'remove'
  const trendSign  = isUp ? '+' : ''

  const fmtAmt = (n: number) =>
    '฿' + Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div>
      {/* Top row: label + amount + trend badge */}
      <div className="flex justify-between items-start font-label text-xs font-bold uppercase mb-2 gap-4">
        <span className="flex-1 truncate">{label}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          {hasTrend && (
            <span className={`flex items-center gap-0.5 ${trendColor}`}>
              <span className="material-symbols-outlined text-[11px]" style={{ fontSize: '11px' }}>
                {trendIcon}
              </span>
              {!isFlat && (
                <span className="text-[10px] tracking-tight">
                  {trendSign}{fmtAmt(trendAmt!)}
                  {trendPct !== 0 && (
                    <span className="opacity-60 ml-1">({trendSign}{trendPct}%)</span>
                  )}
                </span>
              )}
              {isFlat && prevAmt === 0 && (
                <span className="text-[10px] tracking-tight opacity-50">NEW</span>
              )}
              {isFlat && (prevAmt ?? 0) > 0 && (
                <span className="text-[10px] tracking-tight opacity-50">NO CHANGE</span>
              )}
            </span>
          )}
          <span>{value}</span>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-[2px] w-full bg-black/10">
        <div className="h-full bg-black" style={{ width: `${pct}%` }} />
      </div>
      {/* Previous period label */}
      {hasTrend && (prevAmt ?? 0) > 0 && (
        <p className="text-[10px] text-black/30 font-label font-bold uppercase tracking-widest mt-1">
          PREV {fmtAmt(prevAmt!)}
        </p>
      )}
    </div>
  )
}

function BudgetItemRow({ item }: { item: BudgetItem }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <span className="font-headline font-extrabold text-xl uppercase tracking-tight">
          {item.category_name}
        </span>
        <span className="text-xs text-black/60 font-label font-bold uppercase">
          {formatMoney(item.spent)} / {formatMoney(item.limit)}
        </span>
      </div>
      <ProgressBar percentage={item.percentage} />
    </div>
  )
}

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState(NOW.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(NOW.getFullYear())
  const [period, setPeriod] = useState<Period>('MONTHLY')

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary', selectedMonth, selectedYear, period],
    queryFn: () => dashboardApi.summary(selectedMonth, selectedYear, period),
  })

  const assetsInt = summary ? Math.floor(summary.total_assets).toLocaleString('th-TH') : null
  const assetsDec = summary ? (summary.total_assets % 1).toFixed(2).slice(1) : null
  const trendPrefix = summary && summary.trend_percentage >= 0 ? '+' : ''
  const outflowPct = summary?.outflow_percentage ?? 0
  const breakdown: CategoryBreakdown[] = summary?.category_breakdown ?? []

  const prevMonth = () => {
    if (selectedMonth === 1) { setSelectedMonth(12); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }
  const nextMonth = () => {
    // Allow any month within the current year; stop at December
    if (selectedYear >= NOW.getFullYear() && selectedMonth >= 12) return
    if (selectedMonth === 12) { setSelectedMonth(1); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  const periodLabel = period === 'MONTHLY'
    ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
    : period === 'QUARTERLY'
    ? `Q${Math.ceil(selectedMonth / 3)} ${selectedYear}`
    : `${selectedYear}`

  return (
    <div className="font-body bg-white text-black min-h-screen">
      <NavBar activePage="dashboard" />

      <main className="pt-20 pb-16 md:pb-0 min-h-screen">
        <div className="max-w-[1440px] mx-auto border-x-2 border-black grid grid-cols-1 md:grid-cols-12 gap-0">

          {/* ── HERO ── */}
          <section className="md:col-span-12 py-20 px-8 border-b-2 border-black flex flex-col md:flex-row justify-between items-end gap-8">
            <div>
              <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-black/60 mb-4">
                TOTAL ASSETS / LIQUIDITY
              </p>
              {isLoading ? (
                <Skeleton className="h-28 w-96 mb-2" />
              ) : (
                <div className="font-headline font-extrabold text-[clamp(4rem,10vw,9rem)] leading-none tracking-tighter">
                  ฿{assetsInt}.
                  <span className="text-[0.45em] align-super">{assetsDec?.slice(1)}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <p className="font-label text-xs font-bold uppercase tracking-widest text-black/60">LAST 30 DAYS</p>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">
                  {summary && summary.trend_percentage < 0 ? 'trending_down' : 'trending_up'}
                </span>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <span className="font-headline font-black text-2xl tracking-tighter">
                    {trendPrefix}{summary?.trend_percentage ?? 0}%
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* ── OVERVIEW (col-span-8) ── */}
          <section className="md:col-span-8 border-r-2 border-black">
            <div className="p-12 border-b-2 border-black">

              {/* Header row: title + period buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h2 className="font-headline font-black text-4xl uppercase tracking-tighter">
                  {period} / OVERVIEW
                </h2>
                <div className="flex gap-2">
                  {(['MONTHLY', 'QUARTERLY', 'YEARLY'] as Period[]).map(p => (
                    <button key={p} onClick={() => setPeriod(p)}
                      className={`font-headline font-black text-xs uppercase tracking-widest px-4 py-2 border-2 border-black transition-colors
                        ${period === p ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
                      {p === 'MONTHLY' ? 'MO' : p === 'QUARTERLY' ? 'QTR' : 'YR'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Month navigator — compact arrow + label */}
              <div className="flex items-center gap-3 mb-10">
                <button onClick={prevMonth}
                  className="w-9 h-9 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <div className="border-2 border-black px-6 py-2 font-label font-bold text-xs uppercase tracking-widest min-w-[180px] text-center">
                  {periodLabel}
                </div>
                <button onClick={nextMonth}
                  className="w-9 h-9 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors flex-shrink-0">
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>

              {/* Donut + bars */}
              <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="relative flex-shrink-0" style={{ width: 200, height: 200, borderRadius: '50%', border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '18px solid transparent', borderTopColor: '#000', transform: 'rotate(45deg)' }} />
                  <div style={{ width: 136, height: 136, borderRadius: '50%', border: '1px solid #000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="font-label text-[9px] font-bold uppercase tracking-widest text-black/60">OUTFLOW</span>
                    <span className="font-headline font-black text-xl tracking-tighter">{outflowPct}%</span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-8">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
                  ) : breakdown.length > 0 ? (
                    breakdown.map(b => (
                      <ChartBar
                        key={b.category}
                        pct={b.percentage}
                        label={b.category}
                        value={`${b.percentage}%`}
                        trendAmt={b.trend_amount}
                        trendPct={b.trend_pct}
                        prevAmt={b.prev_amount}
                      />
                    ))
                  ) : (
                    <ChartBar pct={0} label="NO EXPENSE DATA" value="—" />
                  )}
                </div>
              </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-12 border-r-2 border-black border-b-2 md:border-b-0">
                <p className="font-label text-xs font-bold uppercase tracking-widest text-black/60 mb-3">NET INCOME</p>
                {isLoading ? <Skeleton className="h-14 w-56 mb-4" /> : (
                  <p className="font-headline font-black text-5xl tracking-tighter mb-4">
                    {formatMoney(summary?.net_income ?? 0)}
                  </p>
                )}
                <p className="text-xs text-black/40 font-body uppercase tracking-wider">{periodLabel} period</p>
              </div>

              <div className="p-12">
                <p className="font-label text-xs font-bold uppercase tracking-widest text-black/60 mb-3">TOTAL DEBT</p>
                {isLoading ? <Skeleton className="h-14 w-56 mb-4" /> : (
                  <p className="font-headline font-black text-5xl tracking-tighter mb-4">
                    {formatMoney(summary?.total_debt ?? 0)}
                  </p>
                )}
                <p className="text-xs text-black/40 font-body uppercase tracking-wider">Outstanding installments</p>
              </div>
            </div>
          </section>

          {/* ── RIGHT PANEL (col-span-4) ── */}
          <section className="md:col-span-4">
            <div className="p-12 border-b-2 border-black">
              <h2 className="font-headline font-black text-2xl uppercase tracking-tighter mb-12">
                BUDGET PROGRESS
              </h2>
              <div className="space-y-12">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : summary?.budget_list.length ? (
                  summary.budget_list.map(item => <BudgetItemRow key={item.category_name} item={item} />)
                ) : (
                  <p className="font-label text-xs font-bold uppercase tracking-widest text-black/30">
                    NO BUDGET DATA FOR THIS PERIOD
                  </p>
                )}
              </div>
            </div>

            <div className="p-12 flex flex-col gap-6">
              <button className="w-full font-headline font-black text-lg uppercase tracking-widest py-6 bg-black text-white border-2 border-black hover:scale-[0.98] active:scale-95 transition-transform">
                GENERATE REPORT
              </button>
              <p className="text-[10px] uppercase tracking-wider text-black/40 text-center font-label font-bold leading-relaxed">
                Data synchronized with Barth Ledger Core<br />
                Last updated: {new Date().toLocaleString('en-GB').replace(',', '')}
              </p>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
