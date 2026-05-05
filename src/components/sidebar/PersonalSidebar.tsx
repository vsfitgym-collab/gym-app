import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import { 
  LayoutDashboard, 
  Users, 
  Dumbbell, 
  CreditCard, 
  MessageSquare, 
  Award,
  User,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Activity,
  FileText
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { getInitials } from "@/lib/utils"

const navItems = [
  { path: "/trainer", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/trainer/students", icon: Users, label: "Alunos" },
  { path: "/trainer/workouts", icon: Dumbbell, label: "Treinos" },
  { path: "/trainer/exercises", icon: Activity, label: "Exercícios" },
  { path: "/trainer/plans", icon: FileText, label: "Planos" },
  { path: "/trainer/payments", icon: CreditCard, label: "Pagamentos" },
  { path: "/trainer/chat", icon: MessageSquare, label: "Chat" },
  { path: "/trainer/achievements", icon: Award, label: "Conquistas" },
  { path: "/trainer/progress", icon: Users, label: "Progresso" },
  { path: "/trainer/profile", icon: User, label: "Perfil" },
]

export function PersonalSidebar({ className }: { className?: string }) {
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
          const isSubPath = item.path !== "/trainer" && location.pathname.startsWith(item.path + "/")
          const isActive = isActivePath || isSubPath
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-fluid-sm font-medium transition-all duration-200 min-h-[44px]",
                isActive 
                  ? "bg-amber-500/20 text-amber-400" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400"
                />
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-medium">
            {user?.full_name ? getInitials(user.full_name) : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.full_name || "Personal"}</p>
            <p className="text-xs text-muted-foreground">Personal Trainer</p>
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
      {/* Botão hamburger */}
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
              <p className="text-xs text-muted-foreground">Trainer</p>
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
              <p className="text-xs text-muted-foreground">Trainer</p>
            </div>
          </div>
        </div>
        {content}
      </aside>
    </>
  )
}