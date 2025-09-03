# Техническая реализация извлечения данных

## 🎯 Рекомендуемый подход

**✅ Результат анализа: API закрытый**

**Приоритет 1: Browser Automation (Puppeteer)**
- Наиболее надежный для закрытых API
- Обрабатывает JavaScript и динамический контент
- Поддерживает пагинацию автоматически
- Можно запускать headless для производительности

**Приоритет 2: DOM Parsing + HTTP клиент**
- Для случаев когда нужна максимальная скорость
- Требует больше анализа для обработки динамического контента
- Может потребовать эмуляцию браузерных заголовков

## 🛠️ Планируемая реализация

### Этап 1: Network Analysis
```javascript
// Исследование запросов
// URL: https://riskins-insurance.eua.in.ua/
// Метод: POST/GET
// Параметры: vehicleNumber, period, isNotForTransport
// Ответ: JSON с массивом предложений
```

### Этап 2: Прототип API клиента
```javascript
async function getRiskinsQuotes(vehicleNumber, period, isNotForTransport) {
    const response = await fetch('API_ENDPOINT', {
        method: 'POST',
        headers: { /* заголовки */ },
        body: JSON.stringify({ /* параметры */ })
    });
    
    return await response.json();
}
```

### Этап 2: Парсинг данных
```javascript
function parseRiskinsData(apiResponse) {
    return apiResponse.offers.map(offer => ({
        company: offer.companyName,
        logo: offer.logoUrl,
        price: offer.currentPrice,
        oldPrice: offer.originalPrice,
        rating: offer.rating,
        status: offer.restrictions,
        features: offer.additionalInfo
    }));
}
```

### Этап 3: Обработка пагинации
```javascript
async function getAllRiskinsOffers(vehicleNumber, period, isNotForTransport) {
    let allOffers = [];
    let hasMore = true;
    let page = 1;
    
    while (hasMore) {
        const response = await getRiskinsQuotes(vehicleNumber, period, isNotForTransport, page);
        allOffers = [...allOffers, ...response.offers];
        hasMore = response.hasMore || response.showMoreButton;
        page++;
    }
    
    return allOffers;
}
```

### Этап 4: Интеграция
```javascript
// Интеграция в основное приложение
// Вызов из калькулятора ОСАГО
// Обработка ошибок и fallback
```

### Этап 4: Интеграция
```javascript
// Интеграция в основное приложение
// Вызов из калькулятора ОСАГО
// Обработка ошибок и fallback
```

## 📊 Структура данных

### Входные параметры:
```typescript
interface RiskinsRequest {
    vehicleNumber: string;    // "AA1234AA"
    period: number;          // 12 (месяцев)
    isNotForTransport: boolean; // true/false
}
```

### Выходные данные:
```typescript
interface RiskinsOffer {
    id: string;
    companyName: string;     // "USG", "ARX", "КНЯЖА"
    logo: string;           // URL логотипа или код
    price: number;          // 3349
    oldPrice?: number;      // 4086 (если есть скидка)
    currency: string;       // "грн"
    rating: number;         // 5 (звезд)
    status: string;         // "Без обмежень"
    features: string[];     // Дополнительные условия
    buyUrl?: string;        // Ссылка на покупку
}

interface RiskinsResponse {
    success: boolean;
    offers: RiskinsOffer[];
    vehicleInfo: string;    // "м. Київ, Україна, легковий автомобіль"
    timestamp: string;
    hasMore: boolean;       // Есть ли еще предложения
    totalOffers: number;    // Общее количество доступных предложений
    currentPage: number;    // Текущая страница
}
```

## 🔍 Следующие шаги

1. **Network Analysis** - изучить сетевые запросы
2. **API Discovery** - найти endpoint и формат
3. **Prototype** - создать тестовый клиент
4. **Integration** - встроить в основное приложение
5. **Error Handling** - обработка ошибок и fallback

## 🚨 Потенциальные проблемы

- **CORS** - могут быть ограничения на кросс-доменные запросы
- **Rate Limiting** - ограничения на частоту запросов
- **Captcha** - защита от автоматических запросов
- **API Changes** - изменения в API структуре

## 💡 Решения проблем

- **Proxy сервер** - для обхода CORS
- **Throttling** - задержки между запросами
- **User-Agent rotation** - смена идентификации
- **Fallback методы** - запасные способы получения данных
