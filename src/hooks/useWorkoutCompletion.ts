import { useState, useCallback, useEffect } from 'react';

export interface CompletionRecord {
  workoutId: string;
  completedAt: string;
  duration?: number;
  exercisesCompleted?: number;
}

export function useWorkoutCompletion() {
  const [completedWorkouts, setCompletedWorkouts] = useState<CompletionRecord[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    const saved = localStorage.getItem('vsfit_completed_workouts');
    if (saved) {
      try {
        setCompletedWorkouts(JSON.parse(saved));
      } catch (e) {
        console.error('Erro ao carregar treinos concluídos:', e);
      }
    }
  }, []);

  const completeWorkout = useCallback((record: CompletionRecord) => {
    setCompletedWorkouts(prev => {
      // Evitar duplicidade no mesmo dia (opcional, mas bom para UX)
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const alreadyDoneToday = prev.some(w => 
        w.workoutId === record.workoutId && 
        w.completedAt.split('T')[0] === today
      );

      if (alreadyDoneToday) return prev;

      const updated = [...prev, record];
      localStorage.setItem('vsfit_completed_workouts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isWorkoutCompleted = useCallback((workoutId: string) => {
    return completedWorkouts.some(w => w.workoutId === workoutId);
  }, [completedWorkouts]);

  const getCompletionStats = useCallback((totalAvailable: number) => {
    const uniqueCompleted = new Set(completedWorkouts.map(w => w.workoutId)).size;
    const percentage = totalAvailable > 0 ? Math.round((uniqueCompleted / totalAvailable) * 100) : 0;
    
    return {
      completedCount: uniqueCompleted,
      totalCount: totalAvailable,
      percentage
    };
  }, [completedWorkouts]);

  return {
    completedWorkouts,
    completeWorkout,
    isWorkoutCompleted,
    getCompletionStats
  };
}
