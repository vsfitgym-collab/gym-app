import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/authStore"
import { LoginCard } from "@/components/auth/LoginCard"

const LOGIN_TIMEOUT_MS = 12000

function withTimeout<T>(promise: Promise<T>, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => reject(new Error(timeoutMessage)), LOGIN_TIMEOUT_MS)

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timeoutId))
  })
}

function getLoginErrorMessage(error: unknown) {
  const fallback = "Nao foi possivel entrar. Verifique os dados e tente novamente."
  const message = error instanceof Error ? error.message : fallback
  const normalized = message.toLowerCase()

  if (normalized.includes("invalid login credentials")) {
    return "Email ou senha invalidos."
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme seu email antes de entrar."
  }

  if (normalized.includes("too many") || normalized.includes("rate limit")) {
    return "Muitas tentativas. Aguarde um pouco e tente novamente."
  }

  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Sem conexao com o servidor. Confira sua internet."
  }

  return message || fallback
}

export function LoginPage() {
  const navigate = useNavigate()
  const fetchUser = useAuthStore((state) => state.fetchUser)
  const [loading, setLoadingLocal] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    setLoadingLocal(true)
    setError("")

    try {
      const email = formData.email.trim()
      const { data, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password: formData.password,
        }),
        "Tempo limite excedido. Tente novamente."
      )

      if (signInError) throw signInError
      if (!data.user) throw new Error("Nao foi possivel identificar o usuario autenticado.")

      await withTimeout(fetchUser(), "Tempo limite ao carregar seu perfil. Tente novamente.")

      const user = useAuthStore.getState().user
      const profileExtended = useAuthStore.getState().profileExtended

      if (!user) throw new Error("Erro ao carregar perfil do usuario.")

      if (user.role === "trainer") {
        navigate("/trainer")
        return
      }

      if (profileExtended && !profileExtended.onboarding_completed) {
        navigate("/onboarding")
        return
      }

      navigate("/dashboard")
    } catch (err: unknown) {
      setError(getLoginErrorMessage(err))
    } finally {
      setLoadingLocal(false)
    }
  }

  return (
    <LoginCard
      email={formData.email}
      password={formData.password}
      loading={loading}
      error={error}
      onEmailChange={(email) => setFormData((current) => ({ ...current, email }))}
      onPasswordChange={(password) => setFormData((current) => ({ ...current, password }))}
      onSubmit={handleSubmit}
    />
  )
}
