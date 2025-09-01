# 🚀 Деплой на GitHub Pages

## Быстрый способ без GitHub Actions

Давайте используем простой способ деплоя на GitHub Pages:

### 1. Создайте репозиторий на GitHub:
- Перейдите на https://github.com/new
- Назовите репозиторий: `telegram-miniapp`
- Сделайте его публичным
- НЕ добавляйте README, .gitignore или LICENSE (у нас уже есть)

### 2. Инициализируйте Git в проекте:
```bash
cd "/Users/caxa/Desktop/Страховка/v.0.3/telegram-miniapp"
git init
git add .
git commit -m "Initial commit: Telegram Mini App для автострахования"
```

### 3. Подключите к GitHub:
```bash
# Замените YOUR_USERNAME на ваш GitHub username
git remote add origin https://github.com/YOUR_USERNAME/telegram-miniapp.git
git branch -M main
git push -u origin main
```

### 4. Установите gh-pages для деплоя:
```bash
npm install --save-dev gh-pages
```

### 5. Обновите package.json:
Добавьте в scripts:
```json
"deploy": "npm run build && gh-pages -d dist"
```

### 6. Задеплойте на GitHub Pages:
```bash
npm run deploy
```

### 7. URL вашего приложения будет:
```
https://YOUR_USERNAME.github.io/telegram-miniapp/
```

## 🤖 Настройка бота в Telegram:

1. Перейдите к [@BotFather](https://t.me/botfather)
2. Отправьте `/mybots`
3. Выберите бота "Strahovka miniapp"
4. Нажмите "Bot Settings" → "Menu Button"
5. Выберите "Configure menu button"
6. Введите URL: `https://YOUR_USERNAME.github.io/telegram-miniapp/`
7. Текст кнопки: `🚗 Автострахование`

## ✅ Готово!

Теперь ваш Mini App доступен по ссылке и работает в Telegram!

## 🔄 Обновление приложения:

Для обновления просто выполните:
```bash
git add .
git commit -m "Update app"
git push
npm run deploy
```
