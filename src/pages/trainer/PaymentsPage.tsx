import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { Modal } from "@/components/ui/Modal"
import { supabase } from "@/lib/supabase"
import { getAllPayments, confirmPayment, getPlansFromDB, type PaymentWithUser, type PlanFromDB } from "@/lib/payments"
import { motion, AnimatePresence } from "framer-motion"
import { DollarSign, Check, X, Clock, User, Copy, CheckCircle, QrCode, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/Input"
import { getInitials } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import { PaymentCard } from "@/components/features/PaymentCard"

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "pending", label: "Pendente" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
]

function generateQRCodeDataUrl(pixCode: string): string {
  if (!pixCode) return ""
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`
}

export function TrainerPaymentsPage() {
  const { user } = useAuthStore()
  const [payments, setPayments] = useState<PaymentWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithUser | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showPixModal, setShowPixModal] = useState(false)
  const [pixCopied, setPixCopied] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [plans, setPlans] = useState<PlanFromDB[]>([])

  useEffect(() => {
    fetchPayments()
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const data = await getPlansFromDB()
      setPlans(data)
    } catch (error) {
      console.error("Error fetching plans:", error)
    }
  }

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllPayments()
      setPayments(data)
    } catch (error) {
      console.error("Error fetching payments:", error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleApprovePayment = async () => {
    if (!selectedPayment || !user) return

    setProcessing(true)
    try {
      const result = await confirmPayment(selectedPayment.id, user.id)
      
      if (result.success) {
        await fetchPayments()
        setShowConfirmModal(false)
        setSelectedPayment(null)
      }
    } catch (error) {
      console.error("Error approving payment:", error)
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectPayment = async () => {
    if (!selectedPayment) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from("payments")
        .update({ status: "rejected" })
        .eq("id", selectedPayment.id)

      if (error) throw error

      await fetchPayments()
      setShowConfirmModal(false)
      setSelectedPayment(null)
    } catch (error) {
      console.error("Error rejecting payment:", error)
    } finally {
      setProcessing(false)
    }
  }

  const copyPixKey = () => {
    if (selectedPayment?.pix_code) {
      navigator.clipboard.writeText(selectedPayment.pix_code)
      setPixCopied(true)
      setTimeout(() => setPixCopied(false), 2000)
    }
  }

  const pendingPayments = payments.filter(p => p.status === "pending")
  const approvedPayments = payments.filter(p => p.status === "approved")

  const totalPending = pendingPayments.reduce((acc, p) => acc + Number(p.amount), 0)
  const totalApproved = approvedPayments.reduce((acc, p) => acc + Number(p.amount), 0)

  const filteredPayments = payments
    .filter(p => !filterStatus || p.status === filterStatus)
    .filter(p => {
      if (!searchTerm) return true
      const search = searchTerm.toLowerCase()
      const planName = plans.find(pl => pl.id === p.plan)?.name || p.plan
      return (
        p.user_name?.toLowerCase().includes(search) ||
        p.user_email?.toLowerCase().includes(search) ||
        planName.toLowerCase().includes(search)
      )
    })

  const getPlanName = (planId: string) => {
    return plans.find(p => p.id === planId)?.name || planId
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendente"
      case "approved": return "Aprovado"
      case "rejected": return "Rejeitado"
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/20 text-amber-500"
      case "approved": return "bg-emerald-500/20 text-emerald-500"
      case "rejected": return "bg-red-500/20 text-red-500"
      default: return "bg-zinc-500/20 text-zinc-400"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pagamentos</h1>
          <p className="text-muted-foreground">Gerencie os pagamentos dos alunos</p>
        </div>
        <Button onClick={fetchPayments} variant="outline">
          <Loader2 className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-2xl font-bold">R$ {totalPending.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{pendingPayments.length} pagamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recebido</p>
                <p className="text-2xl font-bold">R$ {totalApproved.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{approvedPayments.length} pagamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-violet-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">R$ {(totalPending + totalApproved).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{payments.length} transações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 flex-wrap">
        <Select
          options={statusOptions}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-40"
        />
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Buscar por nome, email ou plano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pagamento encontrado
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredPayments.map((payment, idx) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="grid grid-cols-[auto,1fr] gap-3 p-4 rounded-2xl bg-zinc-900 border border-white/5 hover:bg-zinc-800/60 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-semibold">
                      {payment.user_name ? getInitials(payment.user_name) : "?"}
                    </div>
                    
                    <div className="flex flex-col justify-between min-w-0">
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-white truncate">
                          {payment.user_name || "Aluno"}
                        </p>
                        <p className="text-sm text-zinc-400 truncate">
                          {payment.user_email || "Email não disponível"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {getPlanName(payment.plan)} • {new Date(payment.created_at).toLocaleDateString("pt-BR", { 
                            day: "2-digit", 
                            month: "short", 
                            hour: "2-digit", 
                            minute: "2-digit" 
                          })}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-left">
                          <p className="text-lg font-bold text-white">
                            R$ {Number(payment.amount).toFixed(2)}
                          </p>
                          {payment.approved_at && (
                            <p className="text-xs text-zinc-500">
                              Aprovado em {new Date(payment.approved_at).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          payment.status === "approved" ? "bg-green-500/10 text-green-400" :
                          payment.status === "rejected" ? "bg-red-500/10 text-red-400" :
                          "bg-amber-500/10 text-amber-400"
                        }`}>
                          {getStatusLabel(payment.status)}
                        </div>
                      </div>
                    </div>
                    
                    {payment.status === "pending" && (
                      <div className="col-span-full flex gap-2 mt-3 pt-3 border-t border-white/5">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPayment(payment)
                            setShowPixModal(true)
                          }}
                          className="gap-1"
                        >
                          <QrCode className="w-4 h-4" />
                          QR
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment)
                            setShowConfirmModal(true)
                          }}
                          className="bg-gradient-to-r from-violet-600 to-fuchsia-600"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Confirmar
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false)
          setSelectedPayment(null)
        }}
        title="Confirmar Pagamento"
        description="Confirme o recebimento do pagamento para ativar o plano do aluno."
        className="max-w-md"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-white/10 text-center">
              <p className="text-3xl font-bold">R$ {Number(selectedPayment.amount).toFixed(2)}</p>
              <p className="text-muted-foreground mt-2">{selectedPayment.user_name}</p>
              <p className="text-sm text-muted-foreground">{getPlanName(selectedPayment.plan)}</p>
            </div>

            {selectedPayment.pix_code && (
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-xl">
                  <img 
                    src={generateQRCodeDataUrl(selectedPayment.pix_code)} 
                    alt="QR Code PIX"
                    className="w-32 h-32"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={handleRejectPayment}
                disabled={processing}
              >
                <X className="w-4 h-4 mr-2" />
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rejeitar"}
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                onClick={handleApprovePayment}
                disabled={processing}
              >
                <Check className="w-4 h-4 mr-2" />
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aprovar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal do QR Code */}
      <Modal
        isOpen={showPixModal}
        onClose={() => {
          setShowPixModal(false)
          setSelectedPayment(null)
        }}
        title="Dados do Pagamento"
        className="max-w-md"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 text-center">
              <p className="text-lg font-medium">{selectedPayment.user_name}</p>
              <p className="text-3xl font-bold mt-2">R$ {Number(selectedPayment.amount).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">{getPlanName(selectedPayment.plan)}</p>
            </div>

            {selectedPayment.pix_code && (
              <div className="flex justify-center p-4 bg-white rounded-2xl">
                <img 
                  src={generateQRCodeDataUrl(selectedPayment.pix_code)} 
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
            )}

            {selectedPayment.pix_code && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground text-center font-medium">PIX Copia e Cola</p>
                <div className="flex items-center gap-2 p-3 bg-black/30 rounded-xl">
                  <code className="text-xs text-emerald-400 flex-1 break-all font-mono">
                    {selectedPayment.pix_code.length > 60 
                      ? selectedPayment.pix_code.substring(0, 60) + "..." 
                      : selectedPayment.pix_code}
                  </code>
                  <button 
                    onClick={copyPixKey}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {pixCopied ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setShowPixModal(false)
                  setSelectedPayment(null)
                }}
              >
                Fechar
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600"
                onClick={() => {
                  setShowPixModal(false)
                  setSelectedPayment(selectedPayment)
                  setShowConfirmModal(true)
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}