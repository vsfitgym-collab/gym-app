import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import { 
  LayoutDashboard, 
  Dumbbell, 
  TrendingUp, 
  Award, 
  MessageSquare, 
  User,
  Zap,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Activity
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getInitials } from "@/lib/utils"

const navItems = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/workouts", icon: Dumbbell, label: "Treinos" },
  { path: "/exercises", icon: Activity, label: "Exercícios" },
  { path: "/progress", icon: TrendingUp, label: "Progresso" },
  { path: "/plans", icon: Zap, label: "Planos" },
  { path: "/achievements", icon: Award, label: "Conquistas" },
  { path: "/aluno/chat", icon: MessageSquare, label: "Chat" },
  { path: "/profile", icon: User, label: "Perfil" },
]

export function StudentSidebar({ className }: { className?: string }) {
  const { user, signOut } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate("/login", { replace: true })
  }

  const closeSidebar = () => setIsOpen(false)

  const content = (
    <>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActivePath = location.pathname === item.path
          const isSubPath = item.path !== "/dashboard" && location.pathname.startsWith(item.path + "/")
          const isActive = isActivePath || isSubPath
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-fluid-sm font-medium transition-all duration-200 min-h-[44px]",
                isActive 
                  ? "bg-primary/20 text-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-medium">
            {user?.full_name ? getInitials(user.full_name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || "Usuário"}</p>
            <p className="text-xs text-muted-foreground">Aluno</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            handleSignOut()
            closeSidebar()
          }}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-fluid-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 min-h-[44px]"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair da conta</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Botão hamburger - only on mobile when sidebar is hidden */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn("fixed top-4 left-4 z-50 p-2 rounded-lg bg-white/10 backdrop-blur-lg touch-manipulation", className)}
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer sidebar */}
      <motion.aside
        className={cn(
          "mobile-drawer fixed inset-y-0 left-0 z-50 w-72 glass border-r border-white/10 flex flex-col",
          isOpen ? "open" : ""
        )}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/logo.png" alt="VSFit" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h1 className="font-bold text-lg">VSFit</h1>
              <p className="text-xs text-muted-foreground">Gym</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {content}
      </motion.aside>

      {/* Desktop sidebar - always visible */}
      <aside className="desktop-sidebar hidden lg:flex w-64 h-screen fixed left-0 top-0 glass border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/icons/logo.png" alt="VSFit" className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h1 className="font-bold text-lg">VSFit</h1>
              <p className="text-xs text-muted-foreground">Gym</p>
            </div>
          </div>
        </div>
        {content}
      </aside>
    </>
  )
}