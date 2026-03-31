import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import NavBar from '../components/ui/NavBar'
import Sidebar from '../components/ui/Sidebar'
import { installmentsApi, type InstallmentOut, type InstallmentCreate } from '../lib/api'

const NOW = new Date()
const MONTH_NAMES = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                     'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']

function ThinProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-[2px] w-full bg-black/10">
      <div className="h-full bg-black" style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-black/10 animate-pulse ${className}`} />
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
}

// ── Add New Installment Modal ─────────────────────────────────────────────────
function AddInstallmentModal({
  onClose,
  onSave,
  isLoading,
}: {
  onClose: () => void
  onSave: (data: InstallmentCreate) => void
  isLoading: boolean
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [monthsTotal, setMonthsTotal] = useState('')
  const [firstPaymentDate, setFirstPaymentDate] = useState('')
  const [billingDate, setBillingDate] = useState('')
  const [error, setError] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  // Auto-calculate months_paid from first_payment_date
  const calcMonthsPaid = (): number => {
    if (!firstPaymentDate) return 0
    const start = new Date(firstPaymentDate)
    const now = new Date()
    const diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
    return Math.max(0, diff)
  }

  const handleSave = () => {
    if (!name.trim()) { setError('NAME IS REQUIRED'); return }
    const amt = parseFloat(totalAmount)
    if (!amt || amt <= 0) { setError('ENTER A VALID AMOUNT'); return }
    const months = parseInt(monthsTotal)
    if (!months || months < 1) { setError('ENTER VALID NUMBER OF MONTHS'); return }
    onSave({
      name: name.trim().toUpperCase(),
      category: category.trim().toUpperCase() || null,
      total_amount: amt,
      months_total: months,
      first_payment_date: firstPaymentDate || null,
      next_billing_date: billingDate || null,
    })
  }

  const inputClass = (field: string) =>
    `w-full border-b-2 border-black outline-none px-2 py-3 font-label font-bold text-sm uppercase tracking-widest placeholder:text-black/20 transition-colors ${
      focusedField === field ? 'bg-black text-white placeholder:text-white/20' : 'bg-white text-black'
    }`

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b-2 border-black">
          <span className="font-headline font-black text-2xl uppercase tracking-tighter">NEW INSTALLMENT PLAN</span>
          <button onClick={onClose}
            className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Plan Name */}
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest mb-3">PLAN NAME *</p>
            <input type="text" placeholder="E.G. MACBOOK PRO INSTALLMENT"
              value={name} onChange={e => setName(e.target.value)}
              onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
              className={inputClass('name')}
            />
          </div>

          {/* Category */}
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest mb-3">CATEGORY (OPTIONAL)</p>
            <input type="text" placeholder="E.G. TECH / HOME / AUTO"
              value={category} onChange={e => setCategory(e.target.value)}
              onFocus={() => setFocusedField('category')} onBlur={() => setFocusedField(null)}
              className={inputClass('category')}
            />
          </div>

          {/* Total Amount */}
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest mb-3">TOTAL AMOUNT (THB) *</p>
            <div className={`flex items-baseline gap-2 border-b-2 border-black px-2 py-2 transition-colors ${focusedField === 'amount' ? 'bg-black text-white' : 'bg-white text-black'}`}>
              <span className="font-headline font-black text-4xl tracking-tighter leading-none">฿</span>
              <input type="text" inputMode="decimal" placeholder="0.00"
                value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
                onFocus={() => setFocusedField('amount')} onBlur={() => setFocusedField(null)}
                className={`font-headline font-black text-4xl tracking-tighter leading-none bg-transparent outline-none w-full placeholder:text-black/20 ${focusedField === 'amount' ? 'placeholder:text-white/20 text-white' : ''}`}
              />
            </div>
          </div>

          {/* Months Total */}
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest mb-3">NUMBER OF MONTHS *</p>
            <input type="number" min="1" max="360" placeholder="E.G. 12"
              value={monthsTotal} onChange={e => setMonthsTotal(e.target.value)}
              onFocus={() => setFocusedField('months')} onBlur={() => setFocusedField(null)}
              className={inputClass('months')}
            />
            {totalAmount && monthsTotal && (
              <p className="font-label text-xs font-bold uppercase tracking-widest text-black/40 mt-2">
                = ฿{(parseFloat(totalAmount) / parseInt(monthsTotal) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })} / MONTH
              </p>
            )}
          </div>

          {/* First Payment Date */}
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest mb-1">วันที่จ่ายงวดแรก (OPTIONAL)</p>
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-black/40 mb-3">
              ระบุเพื่อคำนวณงวดที่เหลือและ forecast อัตโนมัติ
            </p>
            <input type="date"
              value={firstPaymentDate} onChange={e => setFirstPaymentDate(e.target.value)}
              onFocus={() => setFocusedField('firstPayment')} onBlur={() => setFocusedField(null)}
              className={inputClass('firstPayment')}
            />
            {firstPaymentDate && monthsTotal && (() => {
              const paid = calcMonthsPaid()
              const total = parseInt(monthsTotal) || 0
              const remaining = Math.max(0, total - paid)
              return (
                <p className="font-label text-xs font-bold uppercase tracking-widest text-black/50 mt-2">
                  จ่ายแล้ว {paid} งวด → เหลืออีก {remaining} งวด
                </p>
              )
            })()}
          </div>

          {/* Next Billing Date */}
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest mb-1">NEXT BILLING DATE (OPTIONAL)</p>
            <p className="font-label text-[10px] font-bold uppercase tracking-widest text-black/40 mb-3">
              ใช้เป็นวันเริ่มต้นงวดแรก หากไม่ได้ระบุวันจ่ายงวดแรก
            </p>
            <input type="date"
              value={billingDate} onChange={e => setBillingDate(e.target.value)}
              onFocus={() => setFocusedField('date')} onBlur={() => setFocusedField(null)}
              className={inputClass('date')}
            />
          </div>

          {error && (
            <p className="font-label text-xs font-bold uppercase tracking-widest text-black">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 flex gap-4">
          <button onClick={handleSave} disabled={isLoading}
            className="flex-1 bg-black text-white font-headline font-black text-sm uppercase tracking-widest py-4 border-2 border-black hover:scale-[0.98] active:scale-95 transition-transform disabled:opacity-50">
            {isLoading ? 'SAVING...' : 'CREATE PLAN →'}
          </button>
          <button onClick={onClose}
            className="px-6 py-4 border-2 border-black font-headline font-black text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Installments() {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['installments'],
    queryFn: () => installmentsApi.list(),
  })

  const payMutation = useMutation({
    mutationFn: (id: string) => installmentsApi.pay(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['installments'] }),
  })

  const createMutation = useMutation({
    mutationFn: (data: InstallmentCreate) => installmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      setShowAddModal(false)
    },
  })

  // ── Helper: get start (year, month) for an installment ──────────────────────
  // Priority: first_payment_date → next_billing_date → created_at
  function getStartYM(item: InstallmentOut): { y: number; m: number } {
    const src = item.first_payment_date ?? item.next_billing_date ?? item.created_at
    const d = new Date(src)
    return { y: d.getFullYear(), m: d.getMonth() } // 0-indexed month
  }

  // ── Helper: check if installment is active in a given (year, month0) ─────────
  function isActiveIn(item: InstallmentOut, targetY: number, targetM: number): boolean {
    const { y: sy, m: sm } = getStartYM(item)
    const offset = (targetY - sy) * 12 + (targetM - sm)
    // Active if: offset is within the unpaid range [months_paid, months_total)
    return offset >= item.months_paid && offset < item.months_total
  }

  // ── Per-installment monthly amount ───────────────────────────────────────────
  function monthlyAmt(item: InstallmentOut): number {
    return item.months_total > 0 ? item.total_amount / item.months_total : 0
  }

  // ── Current month total (only active plans this month) ───────────────────────
  const monthlyTotal = items.reduce((sum: number, item: InstallmentOut) => {
    return isActiveIn(item, NOW.getFullYear(), NOW.getMonth())
      ? sum + monthlyAmt(item)
      : sum
  }, 0)

  const totalOutstanding = items.reduce((sum: number, i: InstallmentOut) => {
    const remaining = i.total_amount * (i.months_total - i.months_paid) / i.months_total
    return sum + remaining
  }, 0)

  // ── Calculate last month any installment is still active ────────────────────
  const lastActiveOffset = items.reduce((maxOffset: number, item: InstallmentOut) => {
    const { y: sy, m: sm } = getStartYM(item)
    // The last active month offset from NOW is: start + months_total - 1, relative to NOW
    const endOffsetFromNow =
      (sy - NOW.getFullYear()) * 12 + (sm - NOW.getMonth()) + item.months_total - 1
    return Math.max(maxOffset, endOffsetFromNow)
  }, 0)

  // Always show at least 6 months, up to however long plans run
  const forecastLength = Math.max(6, lastActiveOffset + 1)

  // ── Build forecast: all months until last plan finishes ──────────────────────
  const forecastMonths = Array.from({ length: forecastLength }, (_, idx) => {
    const d = new Date(NOW.getFullYear(), NOW.getMonth() + idx, 1)
    const ty = d.getFullYear()
    const tm = d.getMonth()
    const total = items.reduce((sum: number, item: InstallmentOut) => {
      return isActiveIn(item, ty, tm) ? sum + monthlyAmt(item) : sum
    }, 0)
    return {
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase(),
      total,
      hasPayments: total > 0,
    }
  })

  return (
    <div className="font-body bg-white text-black min-h-screen">
      <NavBar activePage="installments" />
      <Sidebar activeMonth={MONTH_NAMES[NOW.getMonth()]} />

      {showAddModal && (
        <AddInstallmentModal
          onClose={() => setShowAddModal(false)}
          onSave={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      <main className="pt-20 md:pl-48 pb-16 md:pb-0 min-h-screen">
        <div className="max-w-[1440px] border-r-2 border-black min-h-screen">
          <div className="p-5 md:p-12">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-black pb-5 md:pb-12 gap-4 md:gap-6">
              <div>
                <h1 className="font-headline font-black text-[clamp(2.5rem,8vw,6rem)] uppercase tracking-tighter leading-none">ACTIVE</h1>
                <h1 className="font-headline font-black text-[clamp(2.5rem,8vw,6rem)] uppercase tracking-tighter leading-none">PLANS.</h1>
                <p className="font-label text-xs font-bold uppercase tracking-widest text-black/40 mt-3">
                  AGGREGATE EXPOSURE & REPAYMENT
                </p>
              </div>
              <div className="text-right">
                <p className="font-label text-xs font-bold uppercase tracking-widest text-black/40 mb-2">THIS MONTH DUE</p>
                {isLoading
                  ? <Skeleton className="h-12 w-44 ml-auto" />
                  : <p className="font-headline font-black text-3xl md:text-5xl tracking-tighter">
                      ฿{monthlyTotal.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                }
              </div>
            </div>

            {/* ── Two-column layout ── */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 border-b-2 border-black">

              {/* LEFT — Installment list */}
              <div className="md:col-span-3 border-r-2 border-black">
                <div className="flex justify-between items-center p-8 border-b-2 border-black">
                  <span className="font-label text-xs font-bold uppercase tracking-widest">CURRENT INSTALLMENTS</span>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="font-headline font-black text-xs uppercase tracking-widest px-4 py-2 border-2 border-black hover:bg-black hover:text-white transition-colors">
                    + ADD NEW INSTALLMENT PLAN
                  </button>
                </div>

                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full border-b border-black" />)
                ) : items.length === 0 ? (
                  <div className="p-8">
                    <p className="font-label text-xs font-bold uppercase tracking-widest text-black/30 mb-4">
                      NO ACTIVE INSTALLMENTS
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="font-headline font-black text-xs uppercase tracking-widest px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors">
                      + CREATE FIRST PLAN
                    </button>
                  </div>
                ) : (
                  items.map((item: InstallmentOut) => {
                    const pct = item.months_total > 0
                      ? Math.round((item.months_paid / item.months_total) * 100)
                      : 0
                    const remaining = item.total_amount * (item.months_total - item.months_paid) / item.months_total
                    const monthlyAmt = item.months_total > 0 ? item.total_amount / item.months_total : 0
                    return (
                      <div key={item.id}
                        className="px-8 py-8 border-b border-black hover:bg-black hover:text-white group transition-colors cursor-pointer"
                        onClick={() => payMutation.mutate(item.id)}
                        title="Click to mark next payment"
                      >
                        <div className="mb-4">
                          <p className="font-headline font-black text-3xl uppercase tracking-tighter leading-tight">{item.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="font-label text-xs font-bold uppercase tracking-widest text-black/40 group-hover:text-white/50 transition-colors">
                              {item.category ?? 'GENERAL'}
                            </p>
                            <span className="font-label text-xs font-bold uppercase tracking-widest text-black/40 group-hover:text-white/50">
                              ฿{monthlyAmt.toLocaleString('th-TH', { minimumFractionDigits: 2 })}/MO
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="font-label text-xs font-bold uppercase tracking-widest text-black/40 group-hover:text-white/50 transition-colors">
                              {item.months_paid}/{item.months_total} MONTHS PAID
                            </span>
                            <span className="font-label text-xs font-bold uppercase tracking-widest">
                              REMAINING ฿{remaining.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <ThinProgressBar pct={pct} />
                          <div className="text-right">
                            <span className="font-label text-xs font-bold uppercase tracking-widest text-black/40 group-hover:text-white/50 transition-colors">
                              NEXT BILLING {formatDate(item.next_billing_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* RIGHT — Two stacked cards */}
              <div className="md:col-span-2 flex flex-col">

                {/* CARD 1 — Repayment Forecast (real data) */}
                <div className="border-b-2 border-black flex-1">
                  <div className="p-8 border-b border-black">
                    <p className="font-label text-xs font-bold uppercase tracking-widest">REPAYMENT FORECAST</p>
                  </div>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="px-8 py-5 border-b border-black">
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ))
                  ) : items.length === 0 ? (
                    <div className="px-8 py-5">
                      <p className="font-label text-xs font-bold uppercase tracking-widest text-black/30">
                        ADD PLANS TO SEE FORECAST
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-[420px]">
                      {forecastMonths.map((f, i) => (
                        <div key={f.label}
                          className={`flex justify-between items-center px-8 py-4 ${i < forecastMonths.length - 1 ? 'border-b border-black' : ''} ${f.hasPayments ? 'hover:bg-black hover:text-white group' : 'opacity-30'} transition-colors`}>
                          <span className="font-label text-xs font-bold uppercase tracking-widest text-black/60 group-hover:text-white/60">{f.label}</span>
                          <div className="flex items-center gap-2">
                            {f.hasPayments ? (
                              <>
                                <span className="font-headline font-black text-xl tracking-tighter">
                                  ฿{f.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                              </>
                            ) : (
                              <span className="font-label text-xs font-bold uppercase tracking-widest text-black/30">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* CARD 2 — Total Debt Architecture (inverted) */}
                <div className="bg-black text-white p-8">
                  <p className="font-label text-xs font-bold uppercase tracking-widest text-white/40 mb-6">TOTAL DEBT ARCHITECTURE</p>
                  <p className="font-label text-xs font-bold uppercase tracking-widest text-white/40 mb-2">TOTAL OUTSTANDING</p>
                  {isLoading
                    ? <Skeleton className="h-12 w-40 bg-white/10 mb-6" />
                    : <p className="font-headline font-black text-4xl tracking-tighter mb-6">
                        ฿{totalOutstanding.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                  }
                  {items.length > 0 ? (
                    <>
                      <div className="flex h-3 mb-3 border border-white/20">
                        {items.map((item: InstallmentOut, idx: number) => {
                          const rem = item.total_amount * (item.months_total - item.months_paid) / item.months_total
                          const pct = totalOutstanding > 0 ? (rem / totalOutstanding) * 100 : 0
                          const opacities = ['bg-white', 'bg-white/60', 'bg-white/40', 'bg-white/20']
                          return (
                            <div key={item.id}
                              className={opacities[idx % opacities.length]}
                              style={{ width: `${pct}%` }}
                            />
                          )
                        })}
                      </div>
                      <p className="font-label text-[10px] font-bold uppercase tracking-widest text-white/40">
                        {items.map((item: InstallmentOut) => item.name).join(' / ')}
                      </p>
                    </>
                  ) : (
                    <p className="font-label text-[10px] font-bold uppercase tracking-widest text-white/40">
                      NO ACTIVE INSTALLMENTS
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex flex-col md:flex-row justify-between items-start pt-12 gap-8">
              <div className="max-w-lg">
                <h3 className="font-headline font-black text-3xl uppercase tracking-tighter mb-4">THE BARTH PROTOCOL</h3>
                <p className="font-body text-sm leading-relaxed text-black/60 uppercase tracking-wider">
                  Installment cycles are calculated on a binary clearing basis.
                  All totals represent principal plus fixed architectural fees.
                  No hidden interest. No floating variables. Pure financial structure.
                </p>
              </div>
              <div className="flex gap-0">
                {['shield', 'verified_user', 'account_balance_wallet'].map(icon => (
                  <button key={icon} className="w-14 h-14 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
