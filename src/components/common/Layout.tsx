import React, { ReactNode } from 'react'
import { TelegramUser, TelegramThemeParams } from '@/types'
import Navigation from './Navigation'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
  user: TelegramUser | null
  themeParams: TelegramThemeParams
}

const Layout: React.FC<LayoutProps> = ({ children, user, themeParams }) => {
  const style = {
    '--tg-bg-color': themeParams.bg_color || '#ffffff',
    '--tg-text-color': themeParams.text_color || '#000000',
    '--tg-hint-color': themeParams.hint_color || '#707579',
    '--tg-link-color': themeParams.link_color || '#2481cc',
    '--tg-button-color': themeParams.button_color || '#2481cc',
    '--tg-button-text-color': themeParams.button_text_color || '#ffffff',
    '--tg-secondary-bg-color': themeParams.secondary_bg_color || '#f1f1f1'
  } as React.CSSProperties

  return (
    <div className="app-layout" style={style}>
      <header className="app-header">
        {user && (
          <div className="user-info">
            <span className="user-name">
              Привет, {user.first_name}! 👋
            </span>
          </div>
        )}
      </header>
      
      <main className="app-main">
        {children}
      </main>
      
      <Navigation />
    </div>
  )
}

export default Layout
