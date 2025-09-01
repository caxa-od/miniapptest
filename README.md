# 🚗 Telegram Mini App - Автострахование

Современное веб-приложение для оформления автострахования, интегрированное в Telegram.

## 🚀 Возможности

### 🔧 Основной функционал
- **Калькулятор страхования** - расчет ОСАГО и КАСКО
- **Управление полисами** - просмотр, обновление, продление
- **Страховые случаи** - подача и отслеживание заявок
- **Профиль пользователя** - управление личными данными
- **Платежи** - интеграция с Telegram Payments

### 📱 Telegram Integration
- Аутентификация через Telegram
- Нативные UI элементы (кнопки, попапы)
- Haptic Feedback для iOS/Android
- Поддержка тем (светлая/темная)
- Адаптация под iOS Safe Area

### 🏗️ Архитектура
- **Модульная структура** - легкое масштабирование
- **TypeScript** - типобезопасность
- **React + React Router** - современный UI
- **Zustand** - управление состоянием
- **React Query** - кеширование и синхронизация данных
- **Vite** - быстрая сборка и разработка

## 📁 Структура проекта

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── common/         # Общие компоненты (Layout, Navigation)
│   └── insurance/      # Компоненты для страхования
├── pages/              # Страницы приложения
├── modules/            # Бизнес-модули
│   ├── car-info/       # Информация об автомобиле
│   ├── insurance-calculator/  # Калькулятор
│   ├── policy-management/     # Управление полисами
│   ├── claims/         # Страховые случаи
│   └── payment/        # Платежи
├── services/           # API и внешние сервисы
├── store/              # Глобальное состояние
├── hooks/              # Пользовательские хуки
├── utils/              # Утилиты и хелперы
├── types/              # TypeScript типы
└── styles/             # Стили и темы
```

## 🛠️ Установка и запуск

### Предварительные требования
- Node.js 18+
- npm или yarn

### Установка зависимостей
```bash
npm install
```

### Запуск в режиме разработки
```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

### Сборка для продакшена
```bash
npm run build
```

### Предварительный просмотр сборки
```bash
npm run preview
```

## 🌐 Настройка для разработки на iOS

### 1. Локальный HTTPS (рекомендуется)
```bash
# Установка mkcert для создания локальных SSL сертификатов
brew install mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1

# Обновите vite.config.ts для использования HTTPS
```

### 2. Ngrok для внешнего доступа
```bash
# Установка ngrok
npm install -g ngrok

# Запуск туннеля
ngrok http 3000
```

### 3. Настройка бота в Telegram
1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен бота
3. Настройте Mini App URL в настройках бота

## 🔧 Конфигурация

### Переменные окружения
Создайте файл `.env.local`:

```env
VITE_API_URL=https://your-api-url.com
VITE_BOT_TOKEN=your_telegram_bot_token
VITE_ENV=development
```

### TypeScript настройки
Проект настроен с строгими правилами TypeScript:
- Strict mode включен
- Path mapping для удобных импортов
- Проверка неиспользуемых переменных

## 📦 Основные зависимости

### Продакшен
- **React 18** - UI библиотека
- **React Router DOM** - маршрутизация
- **@twa-dev/sdk** - Telegram Web App SDK
- **Zustand** - управление состоянием
- **React Query** - работа с API
- **Axios** - HTTP клиент
- **React Hook Form + Zod** - работа с формами
- **Framer Motion** - анимации
- **Date-fns** - работа с датами

### Разработка
- **Vite** - сборщик и dev сервер
- **TypeScript** - типизация
- **ESLint** - линтинг кода
- **Vite PWA Plugin** - Progressive Web App

## 🎨 Дизайн система

### Цвета
Приложение автоматически адаптируется к теме Telegram:
- `--tg-bg-color` - основной фон
- `--tg-text-color` - основной текст
- `--tg-hint-color` - вторичный текст
- `--tg-link-color` - ссылки и акценты
- `--tg-button-color` - кнопки

### Адаптивность
- Mobile-first подход
- Оптимизация для iOS Safari
- Поддержка Safe Area
- Минимальные размеры касания 44px

## 🔒 Безопасность

### Аутентификация
- Проверка `initData` от Telegram
- Валидация подписи запросов
- Автоматическое добавление токенов в API запросы

### Данные
- Локальное хранение минимальных данных
- Шифрование чувствительной информации
- Валидация всех пользовательских данных

## 🚀 Деплой

### Vercel (рекомендуется)
```bash
npm install -g vercel
vercel --prod
```

### Netlify
```bash
npm run build
# Загрузите папку dist в Netlify
```

### Railway
```bash
# Подключите GitHub репозиторий к Railway
# Настройте переменные окружения
```

## 🧪 Тестирование

### Запуск тестов
```bash
npm run test
```

### Проверка типов
```bash
npm run type-check
```

### Линтинг
```bash
npm run lint
```

## 📱 Тестирование в Telegram

### 1. Локальная разработка
1. Запустите проект локально
2. Используйте ngrok для публичного доступа
3. Обновите URL в настройках бота

### 2. Тестирование на устройстве
1. Откройте бота в Telegram
2. Нажмите кнопку Mini App
3. Тестируйте функционал

### 3. Debug режим
Добавьте `?tgWebAppDebug=1` к URL для отладки

## 🔄 CI/CD

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run deploy
```

## 📈 Мониторинг

### Аналитика
- Интеграция с Yandex.Metrica
- Отслеживание пользовательских действий
- Метрики производительности

### Логирование
- Централизованное логирование ошибок
- Отчеты о производительности
- Мониторинг API запросов

## 🤝 Вклад в проект

1. Fork репозиторий
2. Создайте feature ветку
3. Внесите изменения
4. Добавьте тесты
5. Создайте Pull Request

## 📄 Лицензия

MIT License - подробности в файле [LICENSE](LICENSE)

## 📞 Поддержка

- GitHub Issues для багов и предложений
- Telegram канал для обновлений
- Email: support@example.com

---

**Создано с ❤️ для Telegram Mini Apps**
