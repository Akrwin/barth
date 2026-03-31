import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import NavBar from '../components/ui/NavBar'
import Sidebar from '../components/ui/Sidebar'
import {
  transactionsApi, categoriesApi, checklistApi,
  type CategoryInfo, type CategoryCreate,
} from '../lib/api'

type MonthKey = 'JAN'|'FEB'|'MAR'|'APR'|'MAY'|'JUN'|'JUL'|'AUG'|'SEP'|'OCT'|'NOV'|'DEC'
const MONTHS: MonthKey[] = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
const MONTH_NAMES = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                     'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']

const NOW = new Date()
const CURRENT_MONTH_IDX = NOW.getMonth()
const CURRENT_YEAR = NOW.getFullYear()

const ICON_OPTIONS = [
  'shopping_cart', 'restaurant', 'directions_car', 'home', 'receipt_long',
  'favorite', 'fitness_center', 'more_horiz', 'payments', 'work',
  'school', 'flight', 'local_hospital', 'sports_esports', 'pets',
  'coffee', 'music_note', 'movie', 'beach_access', 'savings',
]

// ── Add Custom Category Modal ─────────────────────────────────────────────────
function AddCustomModal({
  defaultType, onClose, onSave, isLoading,
}: { defaultType: 'EXPENSE'|'INCOME'; onClose: () => void; onSave: (d: CategoryCreate) => void; isLoading: boolean }) {
  const [name, setName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('more_horiz')
  const [catType, setCatType] = useState<'EXPENSE'|'INCOME'>(defaultType)
  const [focused, setFocused] = useState(false)
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white border-2 border-black w-full max-w-lg">
        <div className="flex justify-between items-center px-8 py-6 border-b-2 border-black">
          <span className="font-headline font-black text-2xl uppercase tracking-tighter">ADD CUSTOM CATEGORY</span>
          <button onClick={onClose} className="w-10 h-10 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="p-8 space-y-8">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest mb-3">CATEGORY TYPE</p>
            <div className="flex">
              {(['EXPENSE','INCOME'] as const).map(t => (
                <button key={t} onClick={() => setCatType(t)}
                  className={`font-headline font-black text-xs uppercase tracking-widest px-6 py-3 border-2 border-black transition-colors ${catType === t ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest mb-3">CATEGORY NAME</p>
            <input type="text" placeholder="E.G. SUBSCRIPTIONS" value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              className={`w-full border-b-2 border-black outline-none px-2 py-3 font-label font-bold text-sm uppercase tracking-widest placeholder:text-black/20 transition-colors ${focused ? 'bg-black text-white placeholder:text-white/20' : 'bg-white text-black'}`}
            />
          </div>
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-widest mb-3">CHOOSE ICON</p>
            <div className="grid grid-cols-10 gap-0">
              {ICON_OPTIONS.map(icon => (
                <button key={icon} onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 border border-black flex items-center justify-center transition-colors ${selectedIcon === icon ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
                  <span className="material-symbols-outlined text-base">{icon}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className="font-label text-xs font-bold uppercase tracking-widest text-black/40">SELECTED:</span>
              <span className="material-symbols-outlined text-xl">{selectedIcon}</span>
            </div>
          </div>
        </div>
        <div className="px-8 pb-8 flex gap-4">
          <button onClick={() => name.trim() && onSave({ name: name.trim(), icon: selectedIcon, category_type: catType })}
            disabled={!name.trim() || isLoading}
            className="flex-1 bg-black text-white font-headline font-black text-sm uppercase tracking-widest py-4 border-2 border-black hover:scale-[0.98] active:scale-95 transition-transform disabled:opacity-50">
            {isLoading ? 'SAVING...' : 'CREATE CATEGORY →'}
          </button>
          <button onClick={onClose} className="px-6 py-4 border-2 border-black font-headline font-black text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}

// ── 3-Month History Panel ─────────────────────────────────────────────────────
function HistoryPanel({ categoryId, categoryName, month, year }: { categoryId: string; categoryName: string; month: number; year: number }) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['tx-history', categoryId, month, year],
    queryFn: () => transactionsApi.history(categoryId, month, year),
    enabled: !!categoryId,
  })
  return (
    <div className="bg-black text-white border-2 border-black mb-12">
      <div className="flex items-center gap-3 px-8 py-5 border-b border-white/20">
        <span className="material-symbols-outlined text-lg">history</span>
        <span className="font-label font-bold text-xs uppercase tracking-widest">{categoryName}: 3-MONTH HISTORY</span>
      </div>
      <div className="grid grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`px-8 py-6 ${i < 2 ? 'border-r border-white/20' : ''}`}>
                <div className="h-4 bg-white/10 animate-pulse mb-2" /><div className="h-8 bg-white/10 animate-pulse" />
              </div>
            ))
          : history.length === 0
          ? <div className="col-span-3 px-8 py-6 text-white/40 font-label text-xs font-bold uppercase tracking-widest">NO HISTORY DATA</div>
          : history.map((h, i) => (
              <div key={h.label} className={`px-8 py-6 ${i < 2 ? 'border-r border-white/20' : ''}`}>
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{h.label}</p>
                <p className="font-headline font-black text-2xl tracking-tighter">
                  {h.total != null ? `฿${h.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}` : '—'}
                </p>
              </div>
            ))
        }
      </div>
    </div>
  )
}

// ── Monthly Checklist Panel ───────────────────────────────────────────────────
function ChecklistPanel({ monthIdx, year }: { monthIdx: number; year: number }) {
  const queryClient = useQueryClient()
  const month = monthIdx + 1   // 1-based

  const [isEditing, setIsEditing] = useState(false)
  const [draftItems, setDraftItems] = useState<string[]>([])
  const newItemRef = useRef<HTMLInputElement>(null)

  // Per-month checklist: returns items[], is_past, is_current
  const { data: monthData, isLoading } = useQuery({
    queryKey: ['checklist-month', month, year],
    queryFn: () => checklistApi.getMonth(month, year),
  })

  const { data: txns = [] } = useQuery({
    queryKey: ['transactions', month, year],
    queryFn: () => transactionsApi.list(month, year),
  })

  const saveMutation = useMutation({
    mutationFn: (items: string[]) => checklistApi.update(items),
    onSuccess: () => {
      // Invalidate all month views so they regenerate from new master
      queryClient.invalidateQueries({ queryKey: ['checklist-month'] })
      setIsEditing(false)
    },
  })

  const items = monthData?.items ?? []
  const isPast = monthData?.is_past ?? false

  // Match paid items: note of any transaction matches item name (case-insensitive)
  const paidSet = new Set(
    txns
      .map(t => t.note?.trim().toUpperCase())
      .filter(Boolean) as string[]
  )
  const isItemPaid = (name: string) => paidSet.has(name.trim().toUpperCase())

  const paidCount = items.filter(name => isItemPaid(name)).length
  const totalCount = items.length

  const startEditing = () => {
    setDraftItems([...items])
    setIsEditing(true)
  }
  const addDraftItem = () => {
    const val = newItemRef.current?.value.trim()
    if (!val) return
    setDraftItems(prev => [...prev, val])
    if (newItemRef.current) newItemRef.current.value = ''
    newItemRef.current?.focus()
  }
  const removeDraft = (idx: number) => setDraftItems(prev => prev.filter((_, i) => i !== idx))
  const saveEdits = () => saveMutation.mutate(draftItems.filter(Boolean))

  return (
    <div className="border-l-2 border-black min-h-full">

      {/* Header */}
      <div className="border-b-2 border-black px-8 py-6 flex justify-between items-center">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-black/40 mb-1">
            {isPast ? 'FROZEN CHECKLIST' : 'MONTHLY CHECKLIST'}
          </p>
          <p className="font-headline font-black text-xl uppercase tracking-tighter">
            {MONTH_NAMES[monthIdx]} {year}
          </p>
        </div>
        {/* Show EDIT button only for current/future months */}
        {!isPast && !isLoading && (
          <button
            onClick={isEditing ? saveEdits : startEditing}
            disabled={saveMutation.isPending}
            className={`font-label font-bold text-[10px] uppercase tracking-widest px-4 py-2 border-2 border-black transition-colors ${
              isEditing ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
            {isEditing ? (saveMutation.isPending ? 'SAVING...' : 'SAVE LIST') : 'EDIT LIST'}
          </button>
        )}
        {/* Frozen badge for past months */}
        {isPast && (
          <span className="font-label font-bold text-[9px] uppercase tracking-widest px-3 py-2 bg-black/8 text-black/40 border border-black/20">
            FROZEN
          </span>
        )}
      </div>

      {/* Progress bar */}
      {!isEditing && totalCount > 0 && (
        <div className="px-8 py-4 border-b-2 border-black">
          <div className="flex justify-between font-label text-[10px] font-bold uppercase tracking-widest text-black/40 mb-2">
            <span>PROGRESS</span>
            <span>{paidCount} / {totalCount} PAID</span>
          </div>
          <div className="h-[2px] w-full bg-black/10">
            <div className="h-full bg-black transition-all duration-300"
              style={{ width: totalCount > 0 ? `${(paidCount / totalCount) * 100}%` : '0%' }} />
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading ? (
        <div className="p-8 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-black/5 animate-pulse" />
          ))}
        </div>

      ) : isEditing ? (
        /* ── Edit mode ── */
        <div className="p-8">
          <p className="font-label text-[10px] font-bold uppercase tracking-widest text-black/40 mb-1">
            MASTER LIST
          </p>
          <p className="font-label text-[9px] font-bold uppercase tracking-widest text-black/30 mb-6">
            CHANGES APPLY TO ALL CURRENT &amp; FUTURE MONTHS
          </p>
          <div className="space-y-2 mb-6">
            {draftItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 border-2 border-black px-4 py-3 group hover:bg-black hover:text-white transition-colors">
                <span className="flex-1 font-label font-bold text-xs uppercase tracking-widest truncate">{item}</span>
                <button onClick={() => removeDraft(idx)}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center border border-black group-hover:border-white transition-colors">
                  <span className="material-symbols-outlined text-xs" style={{ fontSize: '14px' }}>close</span>
                </button>
              </div>
            ))}
          </div>
          {/* New item input */}
          <div className="flex gap-2">
            <input
              ref={newItemRef}
              type="text"
              placeholder="ADD ITEM..."
              onKeyDown={e => e.key === 'Enter' && addDraftItem()}
              className="flex-1 border-b-2 border-black outline-none px-2 py-3 font-label font-bold text-xs uppercase tracking-widest placeholder:text-black/20 bg-white focus:bg-black focus:text-white focus:placeholder:text-white/20 transition-colors"
            />
            <button onClick={addDraftItem}
              className="px-4 py-3 border-2 border-black font-headline font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors flex-shrink-0">
              + ADD
            </button>
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={saveEdits} disabled={saveMutation.isPending}
              className="flex-1 bg-black text-white font-headline font-black text-xs uppercase tracking-widest py-3 border-2 border-black disabled:opacity-50 hover:scale-[0.98] transition-transform">
              {saveMutation.isPending ? 'SAVING...' : 'SAVE →'}
            </button>
            <button onClick={() => setIsEditing(false)}
              className="px-4 py-3 border-2 border-black font-headline font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
              CANCEL
            </button>
          </div>
        </div>

      ) : items.length === 0 ? (
        /* ── Empty state ── */
        <div className="p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-black/20 mb-4 block">checklist</span>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-black/30 mb-6">
            {isPast ? 'NO CHECKLIST DATA FOR THIS MONTH' : 'NO ITEMS YET'}
          </p>
          {!isPast && (
            <button onClick={startEditing}
              className="font-headline font-black text-xs uppercase tracking-widest px-6 py-3 border-2 border-black hover:bg-black hover:text-white transition-colors">
              + SET UP CHECKLIST
            </button>
          )}
        </div>

      ) : (
        /* ── Item list ── */
        <div className="divide-y divide-black/10">
          {items.map((name, idx) => {
            const paid = isItemPaid(name)
            const matchTxn = paid
              ? txns.find(t => t.note?.trim().toUpperCase() === name.trim().toUpperCase())
              : null
            return (
              <div key={idx}
                className={`px-8 py-5 flex items-center gap-4 transition-colors ${paid ? 'bg-black/5' : 'hover:bg-black/[0.03]'}`}>
                {/* Checkbox */}
                <div className={`w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  paid ? 'border-black bg-black' : 'border-black/30'}`}>
                  {paid && <span className="material-symbols-outlined text-white" style={{ fontSize: '12px' }}>check</span>}
                </div>
                {/* Name + amount */}
                <div className="flex-1 min-w-0">
                  <p className={`font-label font-bold text-xs uppercase tracking-widest transition-colors ${
                    paid ? 'line-through text-black/40' : 'text-black'}`}>
                    {name}
                  </p>
                  {matchTxn && (
                    <p className="font-label text-[10px] font-bold uppercase tracking-widest text-black/40 mt-0.5">
                      ฿{matchTxn.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
                {/* Status badge */}
                {paid ? (
                  <span className="font-label font-bold text-[9px] uppercase tracking-widest px-2 py-1 bg-black text-white flex-shrink-0">
                    PAID
                  </span>
                ) : (
                  <span className="font-label font-bold text-[9px] uppercase tracking-widest px-2 py-1 border border-black/20 text-black/30 flex-shrink-0">
                    PENDING
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Add() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [checklistOpen, setChecklistOpen] = useState(false)
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(CURRENT_MONTH_IDX)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [txType, setTxType] = useState<'EXPENSE'|'INCOME'>('EXPENSE')
  const [note, setNote] = useState('')
  const [amountFocused, setAmountFocused] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showCustomModal, setShowCustomModal] = useState(false)

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
  })

  const expenseCategories = categories.filter((c: CategoryInfo) => c.category_type === 'EXPENSE' || c.category_type === 'BOTH')
  const incomeCategories  = categories.filter((c: CategoryInfo) => c.category_type === 'INCOME'  || c.category_type === 'BOTH')
  const displayedCategories = txType === 'INCOME' ? incomeCategories : expenseCategories
  const selectedCategory = categories.find((c: CategoryInfo) => c.id === selectedCategoryId)

  const mutation = useMutation({
    mutationFn: () => transactionsApi.create({
      amount: parseFloat(amount) || 0,
      type: txType,
      category_id: selectedCategoryId ?? undefined,
      month: selectedMonthIdx + 1,
      year: CURRENT_YEAR,
      note: note || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
      queryClient.invalidateQueries({ queryKey: ['checklist-month'] })
      navigate('/activity')
    },
    onError: () => setSaveError('SAVE FAILED — CHECK YOUR INPUT'),
  })

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryCreate) => categoriesApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setShowCustomModal(false) },
    onError: () => setSaveError('FAILED TO CREATE CATEGORY'),
  })

  const handleTypeChange = (type: 'EXPENSE'|'INCOME') => {
    setTxType(type)
    if (selectedCategoryId) {
      const cat = categories.find((c: CategoryInfo) => c.id === selectedCategoryId)
      if (cat) {
        const valid = type === 'INCOME'
          ? cat.category_type === 'INCOME' || cat.category_type === 'BOTH'
          : cat.category_type === 'EXPENSE' || cat.category_type === 'BOTH'
        if (!valid) setSelectedCategoryId(null)
      }
    }
  }

  return (
    <div className="font-body bg-white text-black min-h-screen">
      <NavBar activePage="add" />
      <Sidebar activeMonth={MONTHS[CURRENT_MONTH_IDX]} />

      {showCustomModal && (
        <AddCustomModal
          defaultType={txType}
          onClose={() => setShowCustomModal(false)}
          onSave={(data) => createCategoryMutation.mutate(data)}
          isLoading={createCategoryMutation.isPending}
        />
      )}

      <main className="pt-20 md:pl-48 pb-16 md:pb-0 min-h-screen">
        {/* Two-column layout: form (left) + checklist (right) */}
        <div className="max-w-[1440px] grid grid-cols-1 lg:grid-cols-[1fr_340px] min-h-screen">

          {/* ── LEFT: FORM ── */}
          <div className="border-r-2 border-black">
            <div className="p-5 md:p-12">

              {/* Header */}
              <div className="border-b-2 border-black pb-5 mb-5 md:pb-12 md:mb-12">
                <h1 className="font-headline font-black text-[clamp(2.5rem,8vw,6rem)] uppercase tracking-tighter leading-none">NEW RECORD</h1>
                <p className="font-label text-xs font-bold uppercase tracking-[0.2em] text-black/40 mt-3">
                  TRANSACTION ENTRY — {CURRENT_YEAR}
                </p>
              </div>

              {/* Type toggle */}
              <div className="border-b-2 border-black pb-5 mb-5 md:pb-12 md:mb-12">
                <p className="font-label text-xs font-bold uppercase tracking-widest mb-4">TRANSACTION TYPE</p>
                <div className="flex">
                  {(['EXPENSE','INCOME'] as const).map(t => (
                    <button key={t} onClick={() => handleTypeChange(t)}
                      className={`font-headline font-black text-xs uppercase tracking-widest px-8 py-3 border-2 border-black transition-colors ${txType === t ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className="border-b-2 border-black pb-5 mb-5 md:pb-12 md:mb-12">
                <p className="font-label text-xs font-bold uppercase tracking-widest mb-4">AMOUNT (THB)</p>
                <div className={`flex items-baseline gap-2 border-b-2 border-black px-2 py-4 transition-colors ${amountFocused ? 'bg-black text-white' : 'bg-white text-black'}`}>
                  <span className="font-headline font-black text-[clamp(2.5rem,10vw,5rem)] tracking-tighter leading-none">฿</span>
                  <input type="text" inputMode="decimal" placeholder="0.00" value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onFocus={() => setAmountFocused(true)} onBlur={() => setAmountFocused(false)}
                    className={`font-headline font-black text-[clamp(2.5rem,10vw,5rem)] tracking-tighter leading-none bg-transparent outline-none w-full placeholder:text-black/20 ${amountFocused ? 'placeholder:text-white/20 text-white' : ''}`}
                  />
                </div>
              </div>

              {/* Month Selector */}
              <div className="border-b-2 border-black pb-5 mb-5 md:pb-12 md:mb-12">
                <p className="font-label text-xs font-bold uppercase tracking-widest mb-6">TRANSACTION MONTH</p>
                <div className="grid grid-cols-6 gap-0">
                  {MONTHS.map((m, i) => (
                    <button key={m} onClick={() => setSelectedMonthIdx(i)}
                      className={`border border-black px-4 py-3 font-label font-bold text-xs uppercase tracking-widest transition-colors ${selectedMonthIdx === i ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selector */}
              <div className="border-b-2 border-black pb-5 mb-5 md:pb-12 md:mb-12">
                <div className="flex justify-between items-center mb-6">
                  <p className="font-label text-xs font-bold uppercase tracking-widest">
                    {txType === 'INCOME' ? 'INCOME SOURCE' : 'EXPENSE CATEGORY'}
                  </p>
                  <button onClick={() => setShowCustomModal(true)} className="font-label text-xs font-bold uppercase underline tracking-widest hover:no-underline">
                    + ADD CUSTOM
                  </button>
                </div>
                {categories.length === 0 ? (
                  <div className="grid grid-cols-4 gap-0">
                    {Array.from({ length: 8 }).map((_, i) => <div key={i} className="border border-black p-4 h-20 bg-black/5 animate-pulse" />)}
                  </div>
                ) : displayedCategories.length === 0 ? (
                  <p className="font-label text-xs font-bold uppercase tracking-widest text-black/30 py-4">
                    NO {txType} CATEGORIES — USE + ADD CUSTOM
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-0">
                    {displayedCategories.map((cat: CategoryInfo) => (
                      <button key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id)}
                        className={`border border-black p-4 flex flex-col items-center gap-2 transition-colors ${selectedCategoryId === cat.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
                        <span className="material-symbols-outlined text-2xl">{cat.icon ?? 'more_horiz'}</span>
                        <span className="font-label font-bold text-[10px] uppercase tracking-widest">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3-Month History */}
              {selectedCategory && selectedCategoryId && (
                <HistoryPanel
                  categoryId={selectedCategoryId}
                  categoryName={selectedCategory.name}
                  month={selectedMonthIdx + 1}
                  year={CURRENT_YEAR}
                />
              )}

              {/* Note */}
              <div className="border-b-2 border-black pb-5 mb-5 md:pb-12 md:mb-12">
                <p className="font-label text-xs font-bold uppercase tracking-widest mb-4">NOTE / DESCRIPTION</p>
                <p className="font-label text-[10px] font-bold uppercase tracking-widest text-black/30 mb-3">
                  MATCHES CHECKLIST ITEMS AUTOMATICALLY
                </p>
                <input type="text" placeholder="E.G. RENT, NETFLIX, PHONE BILL"
                  value={note} onChange={e => setNote(e.target.value)}
                  className="w-full border-b-2 border-black outline-none px-2 py-3 font-label font-bold text-sm uppercase tracking-widest placeholder:text-black/20 bg-white focus:bg-black focus:text-white transition-colors"
                />
              </div>

              {saveError && <p className="font-label text-xs font-bold uppercase tracking-widest text-black mb-6">{saveError}</p>}

              <button
                onClick={() => { setSaveError(''); mutation.mutate() }}
                disabled={mutation.isPending || !amount}
                className="w-full bg-black text-white font-headline font-black text-xl uppercase tracking-[0.3em] py-8 border-2 border-black hover:scale-[0.98] active:scale-95 transition-transform disabled:opacity-50">
                {mutation.isPending ? 'SAVING...' : 'SAVE →'}
              </button>

            </div>
          </div>

          {/* ── RIGHT: CHECKLIST (desktop) ── */}
          <div className="hidden lg:block">
            <ChecklistPanel monthIdx={selectedMonthIdx} year={CURRENT_YEAR} />
          </div>

        </div>
      </main>

      {/* ── Mobile: floating checklist button ── */}
      <button
        onClick={() => setChecklistOpen(true)}
        className="fixed right-4 bottom-24 z-30 lg:hidden w-12 h-12 bg-black text-white border-2 border-black flex items-center justify-center shadow-lg"
        title="Checklist"
      >
        <span className="material-symbols-outlined text-xl">checklist</span>
      </button>

      {/* ── Mobile: checklist drawer backdrop ── */}
      {checklistOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setChecklistOpen(false)}
        />
      )}

      {/* ── Mobile: checklist drawer ── */}
      <div className={`fixed right-0 top-0 h-full w-80 bg-white z-50 transition-transform duration-300 lg:hidden overflow-y-auto ${checklistOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex justify-between items-center px-5 py-4 border-b-2 border-black sticky top-0 bg-white">
          <span className="font-headline font-black text-lg uppercase tracking-tighter">NOTEBOOK</span>
          <button
            onClick={() => setChecklistOpen(false)}
            className="w-9 h-9 border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
        <ChecklistPanel monthIdx={selectedMonthIdx} year={CURRENT_YEAR} />
      </div>
    </div>
  )
}
