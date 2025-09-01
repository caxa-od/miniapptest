// Инициализация Telegram Web App
let tg = window.Telegram?.WebApp;

// Функция для инициализации приложения
function initApp() {
    console.log('Инициализация приложения...');
    
    // Настройки Telegram Web App
    if (tg) {
        tg.ready();
        tg.expand();
        
        // Применяем тему Telegram
        applyTelegramTheme();
        
        // Показываем информацию о пользователе
        displayUserInfo();
        
        // Включаем главную кнопку если нужно
        tg.MainButton.hide();
    }
    
    // Инициализируем навигацию
    initNavigation();
    
    // Добавляем обработчики для карточек сервисов
    initServiceCards();
}

// Применение темы Telegram
function applyTelegramTheme() {
    if (tg && tg.colorScheme) {
        document.body.setAttribute('data-theme', tg.colorScheme);
    }
    
    // Применяем цветовые переменные Telegram
    if (tg && tg.themeParams) {
        const root = document.documentElement;
        Object.entries(tg.themeParams).forEach(([key, value]) => {
            root.style.setProperty(`--tg-theme-${key.replace(/_/g, '-')}`, value);
        });
    }
}

// Отображение информации о пользователе
function displayUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        const name = user.first_name || 'Пользователь';
        userInfoElement.textContent = `Привет, ${name}! 👋`;
    } else {
        userInfoElement.textContent = 'Добро пожаловать в приложение!';
    }
}

// Инициализация навигации
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pages = document.querySelectorAll('.page');
    
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPageId = button.getAttribute('data-page');
            
            // Убираем активный класс у всех кнопок и страниц
            navButtons.forEach(btn => btn.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));
            
            // Добавляем активный класс к выбранной кнопке и странице
            button.classList.add('active');
            document.getElementById(targetPageId).classList.add('active');
            
            // Вибрация при нажатии (если доступно)
            if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }
            
            console.log(`Переход на страницу: ${targetPageId}`);
        });
    });
}

// Инициализация карточек сервисов
function initServiceCards() {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            const serviceName = card.querySelector('h3').textContent;
            
            // Вибрация при нажатии
            if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('medium');
            }
            
            // Показываем уведомление
            if (tg && tg.showAlert) {
                tg.showAlert(`Вы выбрали: ${serviceName}\n\nЭта функция будет доступна в следующих версиях.`);
            } else {
                alert(`Вы выбрали: ${serviceName}\n\nЭта функция будет доступна в следующих версиях.`);
            }
            
            console.log(`Выбран сервис: ${serviceName}`);
        });
    });
}

// Функция для отправки данных в Telegram бота
function sendDataToBot(data) {
    if (tg && tg.sendData) {
        tg.sendData(JSON.stringify(data));
    }
}

// Обработка закрытия приложения
function handleAppClose() {
    if (tg && tg.close) {
        tg.close();
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initApp);

// Обработка события готовности Telegram Web App
if (tg) {
    tg.onEvent('mainButtonClicked', () => {
        console.log('Главная кнопка нажата');
    });
    
    tg.onEvent('backButtonClicked', () => {
        console.log('Кнопка назад нажата');
    });
}

// Для отладки - глобальные функции
window.telegramApp = {
    sendData: sendDataToBot,
    close: handleAppClose,
    tg: tg
};
