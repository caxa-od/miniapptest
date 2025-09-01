# Telegram Mini App - Автострахование

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/caxa-od/miniapptest/releases/tag/v1.0.0)
[![Deploy](https://github.com/caxa-od/miniapptest/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/caxa-od/miniapptest/actions)

Простое веб-приложение для страхования автомобилей, интегрированное с Telegram Bot.

## 🚀 Текущая версия: v1.0.0

**Стабильная базовая версия** с навигацией и основной структурой приложения.

## Особенности

- 🏠 Главная страница с сервисами
- 🧮 Калькулятор ОСАГО (в разработке)
- 📋 Управление полисами (в разработке)
- 👤 Профиль пользователя (в разработке)
- 📱 Адаптивный дизайн для мобильных устройств
- 🎨 Поддержка темной темы Telegram
- ⚡ Быстрая загрузка (vanilla JavaScript)

## Технологии

- HTML5
- CSS3 (с поддержкой переменных темы Telegram)
- Vanilla JavaScript
- Telegram Web App SDK

## Структура проекта

```
├── index.html       # Главный HTML файл
├── style.css        # Стили приложения
├── script.js        # JavaScript логика
├── README.md        # Документация
├── CHANGELOG.md     # История изменений
└── .github/
    └── workflows/
        └── deploy.yml # GitHub Actions для деплоя
```

## 🔗 Ссылки

- **Приложение**: https://caxa-od.github.io/miniapptest/
- **Репозиторий**: https://github.com/caxa-od/miniapptest
- **Releases**: https://github.com/caxa-od/miniapptest/releases

## Настройка в Telegram

1. Создайте бота через @BotFather
2. Получите токен бота: `8269217157:AAG5lkinbzL_8UL_rmdq9k42-_boAYMouic`
3. Настройте Web App URL: `https://caxa-od.github.io/miniapptest/`
4. Добавьте команды в меню бота

## 📋 История версий

Посмотрите [CHANGELOG.md](./CHANGELOG.md) для подробной истории изменений.

## 🚧 Планы развития

- v1.1.0: Функциональный калькулятор ОСАГО
- v1.2.0: Управление полисами и локальное хранение
- v1.3.0: Интеграция с API и уведомления
