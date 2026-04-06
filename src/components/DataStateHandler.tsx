import React from 'react'
import { RefreshCw, Inbox, AlertCircle } from 'lucide-react'
import './DataStateHandler.css'

export type DataState = 'loading' | 'error' | 'empty' | 'success'

interface DataStateHandlerProps {
  state: DataState
  loadingComponent?: React.ReactNode
  errorMessage?: string
  errorAction?: {
    label: string
    onClick: () => void
  }
  emptyTitle?: string
  emptyMessage?: string
  emptyAction?: {
    label: string
    onClick: () => void
  }
  children?: React.ReactNode
}

export default function DataStateHandler({
  state,
  loadingComponent,
  errorMessage = 'Erro ao carregar dados',
  errorAction,
  emptyTitle = 'Nenhum dado encontrado',
  emptyMessage,
  emptyAction,
  children,
}: DataStateHandlerProps) {
  if (state === 'loading') {
    return loadingComponent || (
      <div className="data-state-loading">
        <div className="data-state-spinner" />
        <span>Carregando...</span>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="data-state-error">
        <div className="error-icon">
          <AlertCircle size={48} />
        </div>
        <h3>{errorMessage}</h3>
        {errorAction && (
          <button className="error-action-btn" onClick={errorAction.onClick}>
            <RefreshCw size={16} />
            {errorAction.label}
          </button>
        )}
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className="data-state-empty">
        <div className="empty-icon">
          <Inbox size={48} />
        </div>
        <h3>{emptyTitle}</h3>
        {emptyMessage && <p>{emptyMessage}</p>}
        {emptyAction && (
          <button className="empty-action-btn" onClick={emptyAction.onClick}>
            {emptyAction.label}
          </button>
        )}
      </div>
    )
  }

  return <>{children}</>
}

export function useDataState<T>(initialData: T[] = []) {
  const [data, setData] = React.useState<T[]>(initialData)
  const [state, setState] = React.useState<DataState>('loading')
  const [error, setError] = React.useState<string | null>(null)

  const setLoading = () => setState('loading')
  
  const setErrorState = (message: string) => {
    setError(message)
    setState('error')
  }

  const setSuccess = (newData: T[]) => {
    setData(newData)
    setError(null)
    setState(newData.length === 0 ? 'empty' : 'success')
  }

  const setEmpty = () => {
    setData([])
    setError(null)
    setState('empty')
  }

  return {
    data,
    state,
    error,
    setLoading,
    setErrorState,
    setSuccess,
    setEmpty,
    isLoading: state === 'loading',
    isError: state === 'error',
    isEmpty: state === 'empty',
    isSuccess: state === 'success',
  }
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action && (
        <button className="empty-state-btn" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Erro ao carregar dados', onRetry }: ErrorStateProps) {
  return (
    <div className="error-state">
      <AlertCircle size={48} />
      <h3>{message}</h3>
      {onRetry && (
        <button className="error-state-btn" onClick={onRetry}>
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      )}
    </div>
  )
}
