import { useMemo, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useUserPlan } from './useUserPlan'
import type { UserRole, UserPermissions, Plan } from '../types'

const PERMISSIONS: Record<UserRole, Record<Plan, UserPermissions>> = {
  personal: {
    free: {
      canCreateWorkout: true,
      canEditWorkout: true,
      canDeleteWorkout: true,
      canViewAnalytics: true,
      canManageExercises: true,
      canManageStudents: true,
      canViewFinance: true,
      canManagePayments: true,
      maxWorkouts: 5,
      maxExercises: 50
    },
    basic: {
      canCreateWorkout: true,
      canEditWorkout: true,
      canDeleteWorkout: true,
      canViewAnalytics: true,
      canManageExercises: true,
      canManageStudents: true,
      canViewFinance: true,
      canManagePayments: true,
      maxWorkouts: 20,
      maxExercises: 200
    },
    premium: {
      canCreateWorkout: true,
      canEditWorkout: true,
      canDeleteWorkout: true,
      canViewAnalytics: true,
      canManageExercises: true,
      canManageStudents: true,
      canViewFinance: true,
      canManagePayments: true,
      maxWorkouts: Infinity,
      maxExercises: Infinity
    }
  },
  aluno: {
    free: {
      canCreateWorkout: false,
      canEditWorkout: false,
      canDeleteWorkout: false,
      canViewAnalytics: false,
      canManageExercises: false,
      canManageStudents: false,
      canViewFinance: false,
      canManagePayments: false,
      maxWorkouts: 2,
      maxExercises: 20
    },
    basic: {
      canCreateWorkout: false,
      canEditWorkout: false,
      canDeleteWorkout: false,
      canViewAnalytics: true,
      canManageExercises: false,
      canManageStudents: false,
      canViewFinance: false,
      canManagePayments: false,
      maxWorkouts: 5,
      maxExercises: 100
    },
    premium: {
      canCreateWorkout: false,
      canEditWorkout: false,
      canDeleteWorkout: false,
      canViewAnalytics: true,
      canManageExercises: false,
      canManageStudents: false,
      canViewFinance: false,
      canManagePayments: false,
      maxWorkouts: Infinity,
      maxExercises: Infinity
    }
  }
}

export function useUserRole() {
  const { role: authRole } = useAuth()
  const { plan, isPremium, isBasic, loading: planLoading } = useUserPlan()

  const permissions = useMemo((): UserPermissions => {
    if (planLoading) {
      return PERMISSIONS[authRole]?.free || PERMISSIONS.aluno.free
    }
    return PERMISSIONS[authRole]?.[plan] || PERMISSIONS.aluno.free
  }, [authRole, plan, planLoading])

  const hasPermission = useCallback((permission: keyof UserPermissions): boolean => {
    return permissions[permission] as boolean
  }, [permissions])

  const canAccess = useCallback((requiredRole: UserRole): boolean => {
    if (authRole === 'personal' && requiredRole === 'personal') return true
    if (authRole === 'aluno' && requiredRole === 'aluno') return true
    return false
  }, [authRole])

  const isPersonal = authRole === 'personal'
  const isAluno = authRole === 'aluno'

  return {
    role: authRole,
    plan,
    isPersonal,
    isAluno,
    isPremium,
    isBasic,
    isFree: plan === 'free',
    loading: planLoading,
    permissions,
    hasPermission,
    canAccess
  }
}

export function useRequireRole(requiredRole: UserRole): {
  allowed: boolean
  loading: boolean
  userId: string | null
} {
  const { role, user } = useAuth()
  
  const allowed = useMemo(() => {
    return role === requiredRole
  }, [role, requiredRole])

  return {
    allowed,
    loading: !user,
    userId: user?.id || null
  }
}

export function useRequireAnyRole(roles: UserRole[]): {
  allowed: boolean
  loading: boolean
  userId: string | null
} {
  const { role, user } = useAuth()
  
  const allowed = useMemo(() => {
    return roles.includes(role)
  }, [role, roles])

  return {
    allowed,
    loading: !user,
    userId: user?.id || null
  }
}
