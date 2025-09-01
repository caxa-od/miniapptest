import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import type { TelegramUser, TelegramThemeParams } from '@/types'

export const useTelegramWebApp = () => {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [themeParams, setThemeParams] = useState<TelegramThemeParams>({})
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Инициализация Telegram Web App
    WebApp.ready()
    
    // Получение данных пользователя
    if (WebApp.initDataUnsafe.user) {
      setUser(WebApp.initDataUnsafe.user as TelegramUser)
    }

    // Получение темы
    setThemeParams(WebApp.themeParams)

    // Настройка основных параметров
    WebApp.expand()
    WebApp.enableClosingConfirmation()
    
    // Настройка кнопки "Назад"
    WebApp.BackButton.onClick(() => {
      window.history.back()
    })

    // Настройка главной кнопки
    WebApp.MainButton.setParams({
      text: 'Рассчитать стоимость',
      color: '#2481cc',
      text_color: '#ffffff'
    })

    setIsReady(true)

    // Обработчик изменения темы
    const handleThemeChanged = () => {
      setThemeParams(WebApp.themeParams)
    }

    WebApp.onEvent('themeChanged', handleThemeChanged)

    return () => {
      WebApp.offEvent('themeChanged', handleThemeChanged)
    }
  }, [])

  const showMainButton = (text: string, onClick: () => void) => {
    WebApp.MainButton.setParams({ text })
    WebApp.MainButton.onClick(onClick)
    WebApp.MainButton.show()
  }

  const hideMainButton = () => {
    WebApp.MainButton.hide()
  }

  const showBackButton = () => {
    WebApp.BackButton.show()
  }

  const hideBackButton = () => {
    WebApp.BackButton.hide()
  }

  const showAlert = (message: string) => {
    WebApp.showAlert(message)
  }

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      WebApp.showConfirm(message, resolve)
    })
  }

  const hapticFeedback = {
    impact: (style: 'light' | 'medium' | 'heavy') => {
      WebApp.HapticFeedback.impactOccurred(style)
    },
    notification: (type: 'error' | 'success' | 'warning') => {
      WebApp.HapticFeedback.notificationOccurred(type)
    },
    selection: () => {
      WebApp.HapticFeedback.selectionChanged()
    }
  }

  return {
    user,
    themeParams,
    isReady,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    showAlert,
    showConfirm,
    hapticFeedback,
    close: () => WebApp.close(),
    openLink: (url: string) => WebApp.openLink(url),
    openTelegramLink: (url: string) => WebApp.openTelegramLink(url)
  }
}
