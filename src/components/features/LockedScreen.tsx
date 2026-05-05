import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface LockedScreenProps {
  title?: string
  message?: string
  fullScreen?: boolean
  featureName?: string
}

export function LockedScreen({ 
  title = 'Recurso bloqueado', 
  message = 'Esse recurso está disponível apenas em planos superiores',
  fullScreen = false,
  featureName
}: LockedScreenProps) {
  const navigate = useNavigate()

  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <div className="relative z-10 p-8 md:p-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20"
        >
          <Lock className="w-10 h-10 md:w-12 md:h-12 text-amber-400" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl md:text-3xl font-bold text-white mb-3"
        >
          {title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-base md:text-lg mb-8 max-w-md mx-auto"
        >
          {featureName ? (
            <>
              Para acessar <span className="text-white font-medium">"{featureName}"</span>, 
              {' '}{message.toLowerCase()}
            </>
          ) : (
            message
          )}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button 
            size="lg"
            variant="gradient"
            onClick={() => navigate('/upgrade')}
            className="shadow-lg shadow-primary/25"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Ver planos
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate('/aluno/assistant')}
            className="border-white/20"
          >
            Falar com atendente
          </Button>
        </motion.div>
      </div>
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-background to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative w-full max-w-lg">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[400px] flex items-center justify-center p-6 rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/50" />
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md">
        {content}
      </div>
    </div>
  )
}