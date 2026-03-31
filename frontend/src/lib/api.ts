// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserOut {
  id: string
  email: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface CategoryInfo {
  id: string
  name: string
  icon: string | null
  category_type: string   // 'EXPENSE' | 'INCOME' | 'BOTH'
}

export interface CategoryCreate {
  name: string
  icon?: string | null
  category_type: string
}

export interface Transaction {
  id: string
  amount: number
  type: 'EXPENSE' | 'INCOME'
  category: CategoryInfo | null
  month: number
  year: number
  note: string | null
  created_at: string
}

export interface TransactionCreate {
  amount: number
  type: 'EXPENSE' | 'INCOME'
  category_id?: string | null
  month: number
  year: number
  note?: string | null
}

export interface MonthHistoryItem {
  label: string
  month: number
  year: number
  total: number | null
}

export interface BudgetOut {
  id: string
  category_id: string
  category_name: string
  amount_limit: number
  spent: number
  percentage: number
  month: number
  year: number
}

export interface BudgetCreate {
  category_id: string
  amount_limit: number
  month: number
  year: number
}

export interface InstallmentOut {
  id: string
  name: string
  category: string | null
  total_amount: number
  months_total: number
  months_paid: number
  first_payment_date: string | null
  next_billing_date: string | null
  created_at: string
}

export interface InstallmentCreate {
  name: string
  category?: string | null
  total_amount: number
  months_total: number
  first_payment_date?: string | null
  next_billing_date?: string | null
}

export interface BudgetItem {
  category_name: string
  spent: number
  limit: number
  percentage: number
}

export interface CategoryBreakdown {
  category: string
  percentage: number
  amount: number
  prev_amount: number
  trend_amount: number   // positive = spent more, negative = spent less
  trend_pct: number      // % change vs previous period
}

export interface DashboardSummary {
  total_assets: number
  net_income: number
  total_debt: number
  outflow_percentage: number
  trend_percentage: number
  budget_list: BudgetItem[]
  category_breakdown: CategoryBreakdown[]
}

// ─── Token — persisted in sessionStorage ──────────────────────────────────────
// sessionStorage survives page refreshes but clears when the browser tab closes.

const TOKEN_KEY = 'barth_token'

export const setToken = (t: string) => {
  sessionStorage.setItem(TOKEN_KEY, t)
}
export const getToken = (): string | null => {
  return sessionStorage.getItem(TOKEN_KEY)
}
export const clearToken = () => {
  sessionStorage.removeItem(TOKEN_KEY)
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isForm = false,
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  let bodyInit: BodyInit | undefined
  if (isForm && body) {
    const fd = new URLSearchParams()
    for (const [k, v] of Object.entries(body as Record<string, string>)) {
      fd.append(k, v)
    }
    bodyInit = fd
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  } else if (body !== undefined) {
    bodyInit = JSON.stringify(body)
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: bodyInit })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }

  // 204 No Content — return undefined cast as T
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const auth = {
  register: (email: string, password: string) =>
    request<UserOut>('POST', '/auth/register', { email, password }),

  login: (email: string, password: string) =>
    request<Token>('POST', '/auth/login', { username: email, password }, true),
}

export const transactionsApi = {
  list: (month: number, year: number) =>
    request<Transaction[]>('GET', `/transactions?month=${month}&year=${year}`),

  create: (data: TransactionCreate) =>
    request<Transaction>('POST', '/transactions', data),

  delete: (id: string) =>
    request<void>('DELETE', `/transactions/${id}`),

  history: (categoryId: string, month: number, year: number) =>
    request<MonthHistoryItem[]>(
      'GET',
      `/transactions/history?category_id=${categoryId}&month=${month}&year=${year}`,
    ),
}

export const budgetsApi = {
  list: (month: number, year: number) =>
    request<BudgetOut[]>('GET', `/budgets?month=${month}&year=${year}`),

  create: (data: BudgetCreate) =>
    request<BudgetOut>('POST', '/budgets', data),
}

export const installmentsApi = {
  list: () => request<InstallmentOut[]>('GET', '/installments'),

  create: (data: InstallmentCreate) =>
    request<InstallmentOut>('POST', '/installments', data),

  pay: (id: string) =>
    request<InstallmentOut>('PATCH', `/installments/${id}/pay`),
}

export const dashboardApi = {
  summary: (month: number, year: number, period: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' = 'MONTHLY') =>
    request<DashboardSummary>('GET', `/dashboard/summary?month=${month}&year=${year}&period=${period}`),
}

export const categoriesApi = {
  list: () => request<CategoryInfo[]>('GET', '/categories'),

  create: (data: CategoryCreate) =>
    request<CategoryInfo>('POST', '/categories', data),
}

export interface ChecklistItemOut {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export interface MonthChecklistResponse {
  items: string[]    // ordered item names
  is_past: boolean   // frozen historical month
  is_current: boolean
}

export const checklistApi = {
  /** Master list */
  list: () => request<ChecklistItemOut[]>('GET', '/checklist'),
  update: (items: string[]) =>
    request<ChecklistItemOut[]>('PUT', '/checklist', { items }),

  /** Per-month view (respects frozen past months) */
  getMonth: (month: number, year: number) =>
    request<MonthChecklistResponse>('GET', `/checklist/month?month=${month}&year=${year}`),
}

// ─── Helper: format currency ──────────────────────────────────────────────────

export function formatMoney(n: number): string {
  return '฿' + new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}
