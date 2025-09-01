import React from 'react'
import { Link } from 'react-router-dom'
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp'
import './HomePage.css'

const HomePage: React.FC = () => {
  const { user, hapticFeedback } = useTelegramWebApp()

  const quickActions = [
    {
      title: 'Рассчитать ОСАГО',
      description: 'Быстрый расчет стоимости обязательного страхования',
      icon: '🛡️',
      link: '/calculator?type=osago',
      color: '#ff6b6b'
    },
    {
      title: 'Рассчитать КАСКО',
      description: 'Полное страхование вашего автомобиля',
      icon: '🚗',
      link: '/calculator?type=kasko',
      color: '#4ecdc4'
    },
    {
      title: 'Мои полисы',
      description: 'Управление действующими полисами',
      icon: '📋',
      link: '/policies',
      color: '#45b7d1'
    },
    {
      title: 'Подать заявку',
      description: 'Заявление о страховом случае',
      icon: '🚨',
      link: '/claims/new',
      color: '#f9ca24'
    }
  ]

  const handleActionClick = () => {
    hapticFeedback.impact('light')
  }

  return (
    <div className="home-page">
      <section className="welcome-section">
        <h1 className="welcome-title">
          Автострахование 🚗
        </h1>
        <p className="welcome-subtitle">
          {user 
            ? `${user.first_name}, выберите нужную услугу`
            : 'Страхование автомобилей онлайн'
          }
        </p>
      </section>

      <section className="quick-actions">
        <h2 className="section-title">Быстрые действия</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="action-card"
              onClick={handleActionClick}
              style={{ '--accent-color': action.color } as React.CSSProperties}
            >
              <div className="action-icon">{action.icon}</div>
              <h3 className="action-title">{action.title}</h3>
              <p className="action-description">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="info-section">
        <h2 className="section-title">Наши преимущества</h2>
        <div className="benefits-list">
          <div className="benefit-item">
            <span className="benefit-icon">⚡</span>
            <span className="benefit-text">Быстрое оформление за 3 минуты</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">💰</span>
            <span className="benefit-text">Лучшие цены на рынке</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">📱</span>
            <span className="benefit-text">Управление через Telegram</span>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">🛡️</span>
            <span className="benefit-text">Надежная защита 24/7</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
