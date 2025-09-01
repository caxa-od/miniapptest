# 🚀 Быстрый старт

## 🤖 Ваш бот готов!

**Токен бота:** `8269217157:AAG5lkinbzL_8UL_rmdq9k42-_boAYMouic`

## 📋 Пошаговый запуск:

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка бота (опционально)
```bash
npm run setup-bot
```

### 3. Запуск в режиме разработки
```bash
npm run dev
```

### 4. Открытие внешнего доступа для iOS
```bash
# В новом терминале:
npx ngrok http 3000
```

## 🔧 Настройка Mini App в Telegram:

### Через @BotFather:
1. Отправь `/mybots` боту [@BotFather](https://t.me/botfather)
2. Выбери своего бота из списка
3. Нажми **"Bot Settings"** → **"Menu Button"**
4. Выбери **"Configure menu button"**
5. Введи URL: `https://your-ngrok-url.ngrok.io`

### Альтернативный способ через команды:
1. Отправь `/setmenubutton` боту [@BotFather](https://t.me/botfather)
2. Выбери своего бота
3. Введи текст кнопки: `🚗 Автострахование`
4. Введи URL приложения

## 🌐 URL адреса:

- **Локальная разработка:** `http://localhost:3000`
- **Ngrok туннель:** `https://xxxx-xx-xx-xx-xx.ngrok.io` (получишь после запуска ngrok)
- **Продакшен:** После деплоя на Vercel/Netlify

## 📱 Тестирование:

1. Найди своего бота в Telegram
2. Нажми `/start`
3. Нажми кнопку меню (🚗 Автострахование)
4. Mini App откроется внутри Telegram!

## 🎯 Полезные команды:

```bash
# Разработка
npm run dev              # Запуск локального сервера
npm run setup-bot        # Настройка команд бота

# Сборка
npm run build           # Сборка для продакшена  
npm run preview         # Предварительный просмотр

# Проверка кода
npm run lint            # Проверка кода ESLint
npm run type-check      # Проверка типов TypeScript

# Деплой
npm run deploy:vercel   # Деплой на Vercel
npm run deploy:netlify  # Деплой на Netlify
```

## 🔍 Отладка:

### Включение debug режима:
- Добавь `?tgWebAppDebug=1` к URL
- Или добавь в `.env.local`: `VITE_DEBUG=true`

### Проблемы с iOS:
- Используй HTTPS (ngrok автоматически предоставляет)
- Проверь, что viewport настроен правильно
- Убедись что используешь физическое устройство (не симулятор)

## 🎊 Готово!

Теперь у тебя есть полноценный Telegram Mini App для автострахования!

**Следующие шаги:**
1. Запусти проект локально
2. Настрой URL в @BotFather  
3. Протестируй в Telegram
4. Начинай разработку функций! 🚗💨
