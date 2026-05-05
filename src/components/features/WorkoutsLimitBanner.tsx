import { useNavigate } from 'react-router-dom'
import { Clock, Lock } from 'lucide-react'
import { useWorkoutsLimitCheck } from '@/hooks/useFeatureAccess'
import { Button } from '@/components/ui/Button'

export function WorkoutsLimitBanner() {
  const navigate = useNavigate()
  const { canDoWorkout, remainingWorkouts, isUnlimited, loading } = useWorkoutsLimitCheck()

  if (loading || isUnlimited) return null

  return (
    <div className={`p-4 rounded-xl border mb-4 ${
      canDoWorkout 
        ? 'bg-amber-500/10 border-amber-500/20' 
        : 'bg-red-500/10 border-red-500/20'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            canDoWorkout ? 'bg-amber-500/20' : 'bg-red-500/20'
          }`}>
            {canDoWorkout ? (
              <Clock className={`w-5 h-5 ${canDoWorkout ? 'text-amber-500' : 'text-red-500'}`} />
            ) : (
              <Lock className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div>
            <p className="font-medium">
              {canDoWorkout 
                ? `Restam ${remainingWorkouts} treino${remainingWorkouts !== 1 ? 's' : ''} esta semana`
                : 'Limite de treinos atingido'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {canDoWorkout 
                ? 'Plano básico - faça upgrade para treinos ilimitados'
                : 'Atualize seu plano para continuar treinando'
              }
            </p>
          </div>
        </div>
        
        {!canDoWorkout && (
          <Button size="sm" onClick={() => navigate('/plans')}>
            Upgrade
          </Button>
        )}
      </div>
    </div>
  )
}

export function WorkoutsLimitGuard({ children }: { children: React.ReactNode }) {
  const { canDoWorkout, loading } = useWorkoutsLimitCheck()

  if (loading) return <>{children}</>

  if (!canDoWorkout) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">Limite de Treinos Atingido</h3>
        <p className="text-muted-foreground mb-4">
          Você atingiu o limite de treinos do seu plano nesta semana.
        </p>
        <Button onClick={() => window.location.href = '/plans'}>
          fazer Upgrade
        </Button>
      </div>
    )
  }

  return <>{children}</>
}