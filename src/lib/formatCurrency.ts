export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return 'R$ 0,00'
  }
  
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return '0'
  }
  
  return value.toLocaleString('pt-BR')
}

export function formatPercentage(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return '0%'
  }
  
  return `${Math.round(value)}%`
}