import React from "react"
import { motion } from "framer-motion"
import { Check, X, QrCode, Clock } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { getInitials } from "@/lib/utils"

interface PaymentCardProps {
  name: string
  email: string
  plan: string
  date: string
  amount: string | number
  status: "pending" | "approved" | "rejected"
  onConfirm?: () => void
  onViewPix?: () => void
}

export function PaymentCard({ 
  name, 
  email, 
  plan, 
  date, 
  amount, 
  status, 
  onConfirm, 
  onViewPix 
}: PaymentCardProps) {
  const statusConfig = {
    pending: {
      label: "Pendente",
      color: "bg-amber-500/10 text-amber-400",
      icon: <Clock className="w-3 h-3" />,
    },
    approved: {
      label: "Aprovado",
      color: "bg-green-500/10 text-green-400",
      icon: <Check className="w-3 h-3" />,
    },
    rejected: {
      label: "Rejeitado",
      color: "bg-red-500/10 text-red-400",
      icon: <X className="w-3 h-3" />,
    },
  }

  const config = statusConfig[status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-2xl border border-white/5 bg-zinc-900 p-4 shadow-sm transition-all duration-200 hover:bg-zinc-800/60"
    >
      <div className="grid grid-cols-[auto,1fr] gap-3">
        {/* Avatar */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-bold text-white">
          {getInitials(name)}
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between min-w-0">
          {/* Top: Info Block */}
          <div className="space-y-1">
            <p className="text-base font-semibold text-white truncate">
              {name}
            </p>
            <p className="text-sm text-zinc-400 truncate">
              {email}
            </p>
            <p className="text-xs text-zinc-500">
              {plan} • {date}
            </p>
          </div>

          {/* Bottom: Financial Block */}
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-white">
                R$ {Number(amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}>
                {config.icon}
                {config.label}
              </div>
            </div>

            {status === "pending" && (
              <div className="flex items-center gap-2 mt-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={onViewPix}
                  className="h-8 px-2 text-xs gap-1.5 hover:bg-white/10"
                >
                  <QrCode className="w-3 h-3" />
                  PIX
                </Button>
                <Button 
                  size="sm" 
                  onClick={onConfirm}
                  className="h-8 px-3 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Confirmar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
