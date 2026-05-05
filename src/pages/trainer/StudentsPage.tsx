import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { useAuthStore } from "@/stores/authStore"
import { supabase } from "@/lib/supabase"
import { motion } from "framer-motion"
import { Search, User, Mail, Calendar, Trash2, Edit, TrendingUp } from "lucide-react"
import { getInitials } from "@/lib/utils"

interface Student {
  id: string
  full_name: string
  email: string
  created_at: string
  profile?: {
    objective?: string
    level?: string
    days_per_week?: number
  }
}

export function TrainerStudentsPage() {
  const { user } = useAuthStore()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      if (data) {
        const studentsWithProfile = await Promise.all(
          data.map(async (student) => {
            const { data: profile } = await supabase
              .from('user_profiles_extended')
              .select('objective, level, days_per_week')
              .eq('user_id', student.id)
              .single()

            return { ...student, profile }
          })
        )
        setStudents(studentsWithProfile)
      }
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return

    try {
      await supabase.from('profiles').delete().eq('id', selectedStudent.id)
      setStudents(students.filter(s => s.id !== selectedStudent.id))
      setShowDeleteModal(false)
      setSelectedStudent(null)
    } catch (error) {
      console.error("Error deleting student:", error)
    }
  }

  const handleOpenChat = async (studentId: string, studentName: string, studentEmail: string) => {
    if (!user) return
    
    try {
      const chatIdsResult = await supabase
        .from("chat_participants")
        .select("chat_id")
        .eq("user_id", user.id)
      
      if (chatIdsResult.data && chatIdsResult.data.length > 0) {
        const chatIds = chatIdsResult.data.map(c => c.chat_id)
        
        const participantResult = await supabase
          .from("chat_participants")
          .select("chat_id")
          .eq("user_id", studentId)
          .in("chat_id", chatIds)
          .limit(1)
        
        if (participantResult.data && participantResult.data.length > 0) {
          window.location.href = `/trainer/chat?chatId=${participantResult.data[0].chat_id}&name=${encodeURIComponent(studentName)}&email=${encodeURIComponent(studentEmail)}`
          return
        }
      }
      
      const { data: newChat } = await supabase
        .from("chats")
        .insert({})
        .select()
        .single()
      
      if (newChat) {
        await supabase.from("chat_participants").insert([
          { chat_id: newChat.id, user_id: user.id },
          { chat_id: newChat.id, user_id: studentId }
        ])
        window.location.href = `/trainer/chat?chatId=${newChat.id}&name=${encodeURIComponent(studentName)}&email=${encodeURIComponent(studentEmail)}`
      }
    } catch (error) {
      console.error("Error opening chat:", error)
    }
  }

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Meus Alunos</h1>
            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium">
              {students.length} {students.length === 1 ? "aluno" : "alunos"}
            </span>
          </div>
          <p className="text-muted-foreground mt-1">Gerencie e acompanhe seus alunos</p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mb-6">
            <User className="w-10 h-10 text-zinc-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {search ? "Nenhum resultado encontrado" : "Você ainda não tem alunos"}
          </h3>
          <p className="text-zinc-400 text-center mb-6 max-w-sm">
            {search 
              ? "Tente buscar com outros termos ou filtros diferentes" 
              : "Comece a adicionar alunos para gerenciar seus treinamentos"}
          </p>
          {!search && (
            <Button className="bg-gradient-to-r from-primary to-teal-600">
              <User className="w-4 h-4 mr-2" />
              Adicionar primeiro aluno
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student, idx) => {
            const level = student.profile?.level || "iniciante"
            const levelColors = {
              iniciante: "bg-blue-500/10 text-blue-400",
              intermediário: "bg-yellow-500/10 text-yellow-400",
              avançado: "bg-red-500/10 text-red-400",
            }
            const levelColor = levelColors[level as keyof typeof levelColors] || levelColors.iniciante
            
            return (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:bg-zinc-800/60 hover:border-white/10 transition-all duration-200"
              >
                <div className="grid grid-cols-[auto,1fr] gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(student.full_name)}
                  </div>
                  
                  <div className="flex flex-col justify-between min-w-0">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-white truncate">
                        {student.full_name}
                      </p>
                      <p className="text-sm text-zinc-400 truncate">
                        {student.email}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelColor} capitalize`}>
                          {level}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Calendar className="w-3 h-3" />
                          <span>{student.profile?.days_per_week || 3}x/semana</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedStudent(student)
                          }}
                          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student)
                            setShowDeleteModal(true)
                          }}
                          className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5">
                  <Button 
                    className="w-full justify-center"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Ver aluno
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={!!selectedStudent && !showDeleteModal}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.full_name}
        className="max-w-lg"
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-teal-600 flex items-center justify-center text-2xl font-bold text-white">
                {getInitials(selectedStudent.full_name)}
              </div>
              <div>
                <p className="font-semibold text-lg">{selectedStudent.full_name}</p>
                <p className="text-muted-foreground">{selectedStudent.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Objetivo</span>
                <span className="font-medium capitalize">{selectedStudent.profile?.objective || "Não definido"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Nível</span>
                <span className="font-medium capitalize">{selectedStudent.profile?.level || "Iniciante"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Frequência</span>
                <span className="font-medium">{selectedStudent.profile?.days_per_week || 3} dias/semana</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Membro desde</span>
                <span className="font-medium">{new Date(selectedStudent.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => window.location.href = `/trainer/progress/${selectedStudent.id}`}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Ver Progresso
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleOpenChat(selectedStudent.id, selectedStudent.full_name, selectedStudent.email)}>
                <Mail className="w-4 h-4 mr-2" />
                Enviar Mensagem
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedStudent(null)
        }}
        title="Excluir Aluno"
        description="Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
        className="max-w-md"
      >
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => {
            setShowDeleteModal(false)
            setSelectedStudent(null)
          }}>
            Cancelar
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleDeleteStudent}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </Modal>
    </div>
  )
}