import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/stores/authStore"
import { motion } from "framer-motion"
import { 
  User, 
  Mail, 
  Phone, 
  Target, 
  Calendar, 
  Dumbbell, 
  Clock,
  AlertCircle,
  Sparkles,
  LogOut,
  Settings
} from "lucide-react"
import { getInitials } from "@/lib/utils"

const objectiveLabels: Record<string, string> = {
  emagrecimento: "Emagrecimento",
  hipertrofia: "Hipertrofia",
  forca: "Força",
  condicionamento: "Condicionamento",
  saude: "Saúde geral",
}

const levelLabels: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
}

export function ProfilePage() {
  const { user, profileExtended, signOut, fetchUser } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const infoItems = [
    { icon: User, label: "Nome", value: user?.full_name || "Não informado" },
    { icon: Mail, label: "Email", value: user?.email || "Não informado" },
    { icon: Target, label: "Objetivo", value: profileExtended?.objective ? objectiveLabels[profileExtended.objective] : "Não definido" },
    { icon: Calendar, label: "Idade", value: profileExtended?.age ? `${profileExtended.age} anos` : "Não informada" },
    { icon: Dumbbell, label: "Peso", value: profileExtended?.weight ? `${profileExtended.weight} kg` : "Não informado" },
    { icon: Calendar, label: "Altura", value: profileExtended?.height ? `${profileExtended.height} m` : "Não informada" },
    { icon: Target, label: "Nível", value: profileExtended?.level ? levelLabels[profileExtended.level] : "Não definido" },
    { icon: Calendar, label: "Dias por semana", value: profileExtended?.days_per_week ? `${profileExtended.days_per_week} dias` : "Não definido" },
    { icon: Clock, label: "Tempo por treino", value: profileExtended?.training_time ? `${profileExtended.training_time} min` : "Não definido" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Suas informações e configurações</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" className="p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-3xl font-bold">
              {user?.full_name ? getInitials(user.full_name) : "?"}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.full_name}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
                  Aluno
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {infoItems.slice(0, 2).map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Ficha Técnica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {infoItems.slice(2).map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Lesões e Limitações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {profileExtended?.injuries || "Nenhuma lesão registrada"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Preferências
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {profileExtended?.preferences || "Nenhuma preferência registrada"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
