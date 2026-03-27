import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth, setToken } from '../lib/api'

export default function Register() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('PASSWORDS DO NOT MATCH')
      return
    }
    setLoading(true)
    try {
      await auth.register(email, password)
      const token = await auth.login(email, password)
      setToken(token.access_token)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message.toUpperCase() : 'REGISTRATION FAILED')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: string) =>
    `w-full border-b-2 border-black outline-none px-2 py-4 font-body text-sm transition-colors
    ${focused === field ? 'bg-black text-white' : 'bg-white text-black'}`

  const fields = [
    { id: 'email',    label: 'EMAIL ADDRESS',    type: 'email',    val: email,    set: setEmail },
    { id: 'password', label: 'PASSWORD',         type: 'password', val: password, set: setPassword },
    { id: 'confirm',  label: 'CONFIRM PASSWORD', type: 'password', val: confirm,  set: setConfirm },
  ] as const

  return (
    <div className="min-h-screen bg-white text-black font-body flex flex-col">
      <div className="px-8 py-6 border-b-2 border-black">
        <span className="font-headline font-black text-2xl uppercase tracking-widest">BARTH</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md border-2 border-black p-16">
          <h1 className="font-headline font-black text-5xl uppercase tracking-tighter mb-2">CREATE.</h1>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-black/40 mb-12">
            REGISTER YOUR FINANCIAL ACCOUNT
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {fields.map(f => (
              <div key={f.id}>
                <p className="font-label text-xs font-bold uppercase tracking-widest mb-3">{f.label}</p>
                <input
                  type={f.type}
                  required
                  value={f.val}
                  onChange={e => f.set(e.target.value)}
                  onFocus={() => setFocused(f.id)}
                  onBlur={() => setFocused(null)}
                  className={inputClass(f.id)}
                />
              </div>
            ))}

            {error && (
              <p className="font-label text-xs font-bold uppercase tracking-widest text-black">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-headline font-black text-lg uppercase tracking-[0.3em] py-6 border-2 border-black hover:scale-[0.98] active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? 'CREATING...' : 'CREATE ACCOUNT →'}
            </button>

            <p className="text-center">
              <Link
                to="/login"
                className="font-label text-xs font-bold uppercase tracking-widest underline hover:no-underline"
              >
                ALREADY HAVE AN ACCOUNT
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
