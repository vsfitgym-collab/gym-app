export interface NotificationPrefs {
  enabled: boolean
  time: string // HH:MM format
  message: string
}

const PREFS_KEY = 'gym_notification_prefs'
const SCHEDULED_KEY = 'gym_notification_scheduled_date'

export const defaultPrefs: NotificationPrefs = {
  enabled: false,
  time: '08:00',
  message: '🔥 Hora de treinar! Não perca o foco na sua jornada.',
}

export const getNotificationPrefs = (): NotificationPrefs => {
  const stored = localStorage.getItem(PREFS_KEY)
  return stored ? JSON.parse(stored) : defaultPrefs
}

export const saveNotificationPrefs = (prefs: NotificationPrefs): void => {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export const requestPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('Este navegador não suporta notificações.')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export const scheduleNotification = (prefs: NotificationPrefs): void => {
  if (!prefs.enabled) return

  const [hours, minutes] = prefs.time.split(':').map(Number)
  const now = new Date()
  const scheduledTime = new Date()
  scheduledTime.setHours(hours, minutes, 0, 0)

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }

  const delay = scheduledTime.getTime() - now.getTime()

  console.log(`Notificação agendada para ${scheduledTime.toLocaleString()} (em ${Math.round(delay / 60000)} min)`)

  setTimeout(() => {
    sendNotification(prefs.message)
    
    // Re-schedule for next day
    localStorage.setItem(SCHEDULED_KEY, new Date().toDateString())
    scheduleNotification(prefs)
  }, delay)
}

export const sendNotification = (message: string): void => {
  if (Notification.permission === 'granted') {
    new Notification('VSFit Gym', {
      body: message,
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: 'workout-reminder',
      requireInteraction: true,
    })
  }
}

export const initNotifications = (): void => {
  const prefs = getNotificationPrefs()
  if (prefs.enabled) {
    requestPermission().then(granted => {
      if (granted) {
        scheduleNotification(prefs)
      }
    })
  }
}
