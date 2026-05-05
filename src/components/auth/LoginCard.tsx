import type * as React from "react"
import { Link } from "react-router-dom"
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Input, type InputProps } from "@/components/ui/Input"
import { cn } from "@/lib/utils"

interface LoginCardProps {
  email: string
  password: string
  loading: boolean
  error: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

interface LoginInputProps extends Omit<InputProps, "onChange" | "value" | "icon"> {
  value: string
  icon: React.ReactNode
  onChange: (value: string) => void
}

function LoginInput({ value, icon, className, onChange, ...props }: LoginInputProps) {
  return (
    <Input
      value={value}
      icon={icon}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-14 rounded-2xl border-white/10 bg-[#111827]/80 px-4 text-base text-white shadow-inner shadow-black/20 outline-none placeholder:text-zinc-500",
        "focus:border-[#22C55E]/70 focus:bg-[#111827] focus:ring-4 focus:ring-[#22C55E]/15",
        "disabled:opacity-60",
        value && "border-[#22C55E]/30 bg-[#101923]",
        className,
      )}
      {...props}
    />
  )
}

interface LoginButtonProps {
  loading: boolean
}

function LoginButton({ loading }: LoginButtonProps) {
  return (
    <Button
      type="submit"
      size="lg"
      loading={false}
      disabled={loading}
      className="h-14 w-full rounded-2xl bg-[#22C55E] text-base font-semibold text-[#04110A] shadow-[0_18px_40px_rgba(34,197,94,0.22)] transition duration-200 hover:bg-[#35D46E] focus-visible:ring-4 focus-visible:ring-[#22C55E]/25 disabled:opacity-70"
    >
      <span className="inline-flex min-w-[92px] items-center justify-center gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {loading ? "Entrando" : "Entrar"}
      </span>
    </Button>
  )
}

export function LoginCard({
  email,
  password,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full"
      aria-labelledby="login-title"
    >
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B0F1A] to-[#111827] shadow-[0_0_30px_rgba(34,197,94,0.3)] ring-2 ring-[#22C55E]/50 transition-all duration-300 hover:ring-[#22C55E]/80 hover:shadow-[0_0_40px_rgba(34,197,94,0.5)]">
          <img src="/icons/logo.png" alt="VSFit" className="h-full w-full object-contain" />
        </div>
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-[#22C55E]">VSFit Gym</p>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[#0B0F1A] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-7">
        <div className="mb-6 text-center">
          <h1 id="login-title" className="text-2xl font-semibold tracking-normal text-white">
            Bem-vindo de volta
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Entre para continuar seu treino.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div
            role="alert"
            aria-live="polite"
            className={cn(
              "flex min-h-[48px] items-center gap-3 rounded-2xl border px-4 text-sm leading-5 transition",
              error
                ? "border-red-400/30 bg-red-500/10 text-red-200 opacity-100"
                : "border-transparent bg-transparent text-transparent opacity-0",
            )}
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error || "Sem erro"}</span>
          </div>

          <LoginInput
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            placeholder="Email"
            icon={<Mail className="h-5 w-5" aria-hidden="true" />}
            value={email}
            onChange={onEmailChange}
            disabled={loading}
            required
          />

          <LoginInput
            type="password"
            autoComplete="current-password"
            placeholder="Senha"
            icon={<Lock className="h-5 w-5" aria-hidden="true" />}
            value={password}
            onChange={onPasswordChange}
            disabled={loading}
            required
          />

          <LoginButton loading={loading} />
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-zinc-500">Nao tem conta? </span>
          <Link to="/register" className="font-medium text-[#22C55E] transition hover:text-[#35D46E]">
            Criar conta
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
