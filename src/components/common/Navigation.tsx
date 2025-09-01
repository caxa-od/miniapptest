import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import './Navigation.css'

const Navigation: React.FC = () => {
  const location = useLocation()
  const { hapticFeedback } = useTelegramWebApp()

  const navItems = [
    { path: '/', label: 'Главная', icon: '🏠' },
    { path: '/calculator', label: 'Расчет', icon: '🧮' },
    { path: '/policies', label: 'Полисы', icon: '📋' },
    { path: '/claims', label: 'Заявки', icon: '🚨' },
    { path: '/profile', label: 'Профиль', icon: '👤' }
  ]

  const handleNavClick = () => {
    hapticFeedback.selection()
  }

  return (
    <nav className="bottom-navigation">
      {navItems.map(item => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={handleNavClick}
          className={({ isActive }) => 
            `nav-item ${isActive ? 'nav-item--active' : ''}`
          }
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default Navigation
