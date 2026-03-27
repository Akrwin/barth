import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { auth, setToken } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const token = await auth.login(email, password)
      setToken(token.access_token)
      navigate('/')
    } catch {
      setError('INVALID CREDENTIALS')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-black font-body flex flex-col">
      {/* Logo */}
      <div className="px-8 py-6 border-b-2 border-black">
        <span className="font-headline font-black text-2xl uppercase tracking-widest">BARTH</span>
      </div>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md border-2 border-black p-16">
          <h1 className="font-headline font-black text-5xl uppercase tracking-tighter mb-2">SIGN IN.</h1>
          <p className="font-label text-xs font-bold uppercase tracking-widest text-black/40 mb-12">
            ACCESS YOUR FINANCIAL LEDGER
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            {/* Email */}
            <div>
              <p className="font-label text-xs font-bold uppercase tracking-widest mb-3">EMAIL ADDRESS</p>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                className={`w-full border-b-2 border-black outline-none px-2 py-4 font-body text-sm transition-colors
                  ${emailFocused ? 'bg-black text-white' : 'bg-white text-black'}`}
              />
            </div>

            {/* Password */}
            <div>
              <p className="font-label text-xs font-bold uppercase tracking-widest mb-3">PASSWORD</p>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                className={`w-full border-b-2 border-black outline-none px-2 py-4 font-body text-sm transition-colors
                  ${passFocused ? 'bg-black text-white' : 'bg-white text-black'}`}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="font-label text-xs font-bold uppercase tracking-widest text-black">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-headline font-black text-lg uppercase tracking-[0.3em] py-6 border-2 border-black hover:scale-[0.98] active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? 'ENTERING...' : 'ENTER →'}
            </button>

            {/* Register link */}
            <p className="text-center">
              <Link
                to="/register"
                className="font-label text-xs font-bold uppercase tracking-widest underline hover:no-underline"
              >
                CREATE AN ACCOUNT
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
