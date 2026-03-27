import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  children: React.ReactNode
  className?: string
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'font-headline font-black uppercase tracking-widest text-xs px-6 py-3 transition-transform active:scale-[0.98] cursor-pointer border-0 outline-none'

  const variants = {
    primary:
      'bg-black text-white hover:bg-white hover:text-black hover:border-2 hover:border-black border-2 border-black',
    secondary:
      'bg-white text-black border-2 border-black hover:bg-black hover:text-white',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
