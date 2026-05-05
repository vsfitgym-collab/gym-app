interface AuthLayoutProps {
  children?: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen min-h-[100svh] overflow-hidden bg-[#05070D] bg-[linear-gradient(180deg,#05070D_0%,#0B0F1A_52%,#05070D_100%)] text-white">
      <div className="mx-auto flex min-h-screen min-h-[100svh] w-full max-w-[400px] items-center justify-center px-5 py-8 sm:px-0">
        {children}
      </div>
    </div>
  )
}
