import { supabase } from './supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ueixrbdbtjpyuortrniz.supabase.co'

export interface PixPaymentResponse {
  success: boolean
  payment_id: number
  qr_code: string
  qr_code_base64: string
  ticket_url: string
  error?: string
}

export interface PaymentStatus {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  plan?: string
}

export const createPixPayment = async (plan: string): Promise<PixPaymentResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }

    const { data: edgeFunctions } = await supabase.functions.invoke('create-pix-payment', {
      body: { plan },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })

    if (!edgeFunctions) {
      throw new Error('Failed to create payment')
    }

    return edgeFunctions as PixPaymentResponse
  } catch (error: any) {
    console.error('Error creating PIX payment:', error)
    return {
      success: false,
      payment_id: 0,
      qr_code: '',
      qr_code_base64: '',
      ticket_url: '',
      error: error.message,
    }
  }
}

export const checkPaymentStatus = async (paymentId: number): Promise<PaymentStatus | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    const webhookUrl = `${SUPABASE_URL}/functions/v1/mp-webhook?payment_id=${paymentId}`
    
    const response = await fetch(webhookUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session?.access_token || ''}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error checking payment status:', error)
    return null
  }
}

export const pollPaymentStatus = async (
  paymentId: number,
  onStatusChange: (status: PaymentStatus) => void,
  maxAttempts: number = 60,
  intervalMs: number = 3000
): Promise<void> => {
  let attempts = 0

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      attempts++
      
      const status = await checkPaymentStatus(paymentId)
      
      if (status) {
        onStatusChange(status)
        
        if (status.status === 'approved' || status.status === 'rejected' || status.status === 'cancelled') {
          clearInterval(interval)
          resolve()
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        resolve()
      }
    }, intervalMs)
  })
}
