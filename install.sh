#!/bin/bash

echo "🚀 Установка зависимостей для Telegram Mini App - Автострахование"
echo "================================================================"

# Переход в директорию проекта
cd "/Users/caxa/Desktop/Страховка/v.0.3/telegram-miniapp"

# Установка зависимостей
echo "📦 Устанавливаем зависимости..."
npm install

echo ""
echo "✅ Установка завершена!"
echo ""
echo "🛠️ Доступные команды:"
echo "  npm run dev      - Запуск в режиме разработки"
echo "  npm run build    - Сборка для продакшена"
echo "  npm run preview  - Предварительный просмотр сборки"
echo "  npm run lint     - Проверка кода"
echo ""
echo "🌐 Для работы на iOS рекомендуется использовать:"
echo "  1. ngrok для внешнего доступа: ngrok http 3000"
echo "  2. HTTPS сертификаты для локальной разработки"
echo ""
echo "📚 Документация доступна в файле README.md"
echo "🏗️ Архитектура описана в docs/ARCHITECTURE.md"
