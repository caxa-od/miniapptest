#!/usr/bin/env node

/**
 * Скрипт для настройки Telegram бота и Mini App
 * Запуск: node setup-bot.js
 */

const BOT_TOKEN = '8269217157:AAG5lkinbzL_8UL_rmdq9k42-_boAYMouic'
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

console.log('🤖 Настройка Telegram бота для Mini App')
console.log('==========================================')

// Функция для выполнения API запросов к Telegram
async function telegramRequest(method, params = {}) {
  const url = `${TELEGRAM_API}/${method}`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error(`❌ Ошибка при вызове ${method}:`, error.message)
    return null
  }
}

// Проверяем токен бота
async function checkBot() {
  console.log('\n📋 Проверяем токен бота...')
  
  const result = await telegramRequest('getMe')
  
  if (result && result.ok) {
    const bot = result.result
    console.log(`✅ Бот найден: @${bot.username} (${bot.first_name})`)
    console.log(`   ID: ${bot.id}`)
    console.log(`   Поддержка Mini Apps: ${bot.supports_inline_queries ? 'Да' : 'Нет'}`)
    return bot
  } else {
    console.log('❌ Ошибка: Неверный токен бота')
    return null
  }
}

// Настраиваем команды бота
async function setupCommands() {
  console.log('\n⚙️ Настраиваем команды бота...')
  
  const commands = [
    {
      command: 'start',
      description: 'Запустить приложение автострахования'
    },
    {
      command: 'calculator',
      description: 'Открыть калькулятор страхования'
    },
    {
      command: 'policies',
      description: 'Мои полисы'
    },
    {
      command: 'help',
      description: 'Помощь и поддержка'
    }
  ]
  
  const result = await telegramRequest('setMyCommands', { commands })
  
  if (result && result.ok) {
    console.log('✅ Команды бота настроены')
    commands.forEach(cmd => {
      console.log(`   /${cmd.command} - ${cmd.description}`)
    })
  } else {
    console.log('❌ Ошибка при настройке команд')
  }
}

// Инструкции для настройки Mini App
function showMiniAppInstructions() {
  console.log('\n🌐 Настройка Mini App:')
  console.log('======================')
  console.log('1. Для локальной разработки:')
  console.log('   • Запустите: npm run dev')
  console.log('   • Используйте ngrok: ngrok http 3000')
  console.log('   • URL будет: https://xxxx-xx-xx-xx-xx.ngrok.io')
  console.log('')
  console.log('2. Настройка в @BotFather:')
  console.log('   • Отправьте /mybots')
  console.log('   • Выберите своего бота')
  console.log('   • Нажмите "Bot Settings" → "Menu Button"')
  console.log('   • Выберите "Configure menu button"')
  console.log('   • Введите URL вашего Mini App')
  console.log('')
  console.log('3. Для продакшена:')
  console.log('   • Деплой на Vercel/Netlify/Railway')
  console.log('   • Обновите URL в настройках бота')
  console.log('')
  console.log('🔧 Полезные ссылки:')
  console.log('   • @BotFather: https://t.me/botfather')
  console.log('   • Ngrok: https://ngrok.com/')
  console.log('   • Vercel: https://vercel.com/')
}

// Основная функция
async function main() {
  // Проверяем доступность fetch (для Node.js < 18)
  if (typeof fetch === 'undefined') {
    console.log('❌ Ошибка: fetch не поддерживается')
    console.log('Решение: npm install node-fetch или используйте Node.js 18+')
    return
  }
  
  const bot = await checkBot()
  if (!bot) return
  
  await setupCommands()
  showMiniAppInstructions()
  
  console.log('\n🎉 Настройка завершена!')
  console.log('Теперь можно тестировать Mini App в Telegram')
}

// Запускаем скрипт
main().catch(console.error)
