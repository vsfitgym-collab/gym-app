import { useState, useEffect } from 'react'
import { Bell, BellOff, Clock, Save, X, Check } from 'lucide-react'
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  requestPermission,
  scheduleNotification,
  initNotifications,
  type NotificationPrefs,
} from '../lib/notificationManager'
import './NotificationSettings.css'

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(getNotificationPrefs())
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [saved, setSaved] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (prefs.enabled) {
      initNotifications()
    }
  }, [])

  const handleToggle = async () => {
    if (!prefs.enabled) {
      const granted = await requestPermission()
      if (granted) {
        setPermission('granted')
        setPrefs(prev => ({ ...prev, enabled: true }))
        scheduleNotification({ ...prefs, enabled: true })
      }
    } else {
      setPrefs(prev => ({ ...prev, enabled: false }))
    }
  }

  const handleSave = () => {
    saveNotificationPrefs(prefs)
    if (prefs.enabled) {
      scheduleNotification(prefs)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="notification-settings">
      <button className="notification-bell-btn" onClick={() => setIsOpen(!isOpen)}>
        {prefs.enabled ? <Bell size={20} className="bell-active" /> : <BellOff size={20} />}
        {prefs.enabled && <span className="notification-dot" />}
      </button>

      {isOpen && (
        <div className="notification-panel" onClick={e => e.stopPropagation()}>
          <div className="panel-header">
            <h3>Notificações</h3>
            <button className="panel-close" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="panel-body">
            <div className="pref-toggle">
              <div className="toggle-info">
                <span className="toggle-label">Lembretes de treino</span>
                <span className="toggle-desc">Receba notificações para não perder o treino</span>
              </div>
              <button
                className={`toggle-switch ${prefs.enabled ? 'active' : ''}`}
                onClick={handleToggle}
                disabled={permission === 'denied'}
              >
                <div className="toggle-knob" />
              </button>
            </div>

            {permission === 'denied' && (
              <div className="permission-warning">
                <span>Notificações bloqueadas. Habilite nas configurações do navegador.</span>
              </div>
            )}

            {prefs.enabled && (
              <div className="pref-options">
                <div className="pref-option">
                  <label>
                    <Clock size={14} />
                    Horário do lembrete
                  </label>
                  <input
                    type="time"
                    value={prefs.time}
                    onChange={e => setPrefs(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>

                <div className="pref-option">
                  <label>Mensagem</label>
                  <textarea
                    value={prefs.message}
                    onChange={e => setPrefs(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Sua mensagem personalizada..."
                    rows={2}
                  />
                </div>

                <div className="pref-preview">
                  <span className="preview-label">Prévia:</span>
                  <div className="preview-notification">
                    <span className="preview-icon">🔔</span>
                    <div className="preview-content">
                      <span className="preview-title">VSFit Gym</span>
                      <span className="preview-text">{prefs.message}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="panel-footer">
            <button className="btn-save" onClick={handleSave}>
              {saved ? (
                <>
                  <Check size={14} />
                  Salvo!
                </>
              ) : (
                <>
                  <Save size={14} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
