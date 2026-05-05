import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { User, Mail, Award, LogOut, Settings, Camera, Loader2 } from "lucide-react"
import { getInitials } from "@/lib/utils"

export function TrainerProfilePage() {
  const { user, signOut, setUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.full_name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar_url || null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.full_name)
      setEmail(user.email)
      const localAvatar = localStorage.getItem(`avatar_${user.id}`)
      setAvatarPreview(user.avatar_url || localAvatar || null)
    }
  }, [user])

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.match(/^image\/(jpg|jpeg|png)$/)) {
        alert("Por favor, selecione uma imagem nos formatos JPG, JPEG ou PNG")
        return
      }
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      let avatarUrl = user.avatar_url || ""

      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        const file = fileInputRef.current?.files?.[0]
        if (file) {
          try {
            const fileExt = file.name.split(".").pop()
            const fileName = `${user.id}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            const { error: uploadError } = await supabase.storage
              .from("avatars")
              .upload(filePath, file)

            if (uploadError) {
              console.warn("Storage não disponível, usando localStorage:", uploadError.message)
              const reader = new FileReader()
              reader.onload = () => {
                localStorage.setItem(`avatar_${user.id}`, reader.result as string)
              }
              reader.readAsDataURL(file)
            } else {
              const { data: urlData } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath)
              avatarUrl = urlData.publicUrl
            }
          } catch {
            console.warn("Storage não disponível, usando localStorage")
            const reader = new FileReader()
            reader.onload = () => {
              localStorage.setItem(`avatar_${user.id}`, reader.result as string)
            }
            reader.readAsDataURL(file)
          }
        }
      } else if (avatarPreview === null && user?.avatar_url) {
        avatarUrl = ""
        localStorage.removeItem(`avatar_${user.id}`)
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          email: email,
          avatar_url: avatarUrl || null,
        })
        .eq("id", user.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setUser(data)
        localStorage.setItem("gymapp_user", JSON.stringify(data))
      }

      setIsEditing(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error("Erro ao salvar perfil:", error)
      alert("Erro ao salvar perfil. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setName(user?.full_name || "")
    setEmail(user?.email || "")
    setAvatarPreview(user?.avatar_url || null)
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Suas informações e configurações</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Editar perfil
            </Button>
          )}
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400"
        >
          Perfil atualizado com sucesso!
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="glass" className="p-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div
                className={`w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center text-3xl font-bold transition-all ${
                  isEditing ? "cursor-pointer hover:ring-2 hover:ring-primary ring-4 ring-primary/50" : ""
                } ${
                  avatarPreview
                    ? "bg-transparent"
                    : "bg-gradient-to-br from-amber-500 to-orange-600"
                }`}
                onClick={handleAvatarClick}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.full_name ? getInitials(user.full_name) : "?"
                )}
              </div>
              {isEditing && (
                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-2">
                  <Camera className="w-4 h-4" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="text-2xl font-bold"
                  />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu email"
                    className="text-muted-foreground"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{user?.full_name}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </>
              )}
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-medium">
                  Personal Trainer
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
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    {isEditing ? (
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium">{user?.full_name || "Não informado"}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    {isEditing ? (
                      <Input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium">{user?.email || "Não informado"}</p>
                    )}
                  </div>
                </div>
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
                <Award className="w-5 h-5 text-primary" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-muted-foreground">Total de alunos</span>
                  <span className="font-bold text-xl">24</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-muted-foreground">Treinos criados</span>
                  <span className="font-bold text-xl">15</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <span className="text-muted-foreground">Membro desde</span>
                  <span className="font-medium">Jan 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}