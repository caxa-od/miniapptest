/**
 * ПРИМЕРЫ АВТОМАТИЧЕСКОГО ИСПОЛЬЗОВАНИЯ ЭКСТРАКТОРА RISKINS
 */

const RiskinsAPI = require('./riskins-api.js');

// Пример 1: Простое получение данных
async function getQuotesExample() {
    console.log('🔍 Автоматическое получение котировок...');
    
    const api = new RiskinsAPI();
    const result = await api.getInsuranceQuotes('AA1234AA');
    
    if (!result.success) {
        console.error('❌ Ошибка:', result.error);
        return [];
    }
    
    const quotes = result.offers || [];
    console.log(`✅ Получено ${quotes.length} предложений`);
    quotes.forEach((quote, i) => {
        console.log(`${i+1}. ${quote.companyName}: ${quote.price}₴`);
    });
    
    return quotes;
}

// Пример 2: Поиск самого дешевого предложения
async function findCheapestExample() {
    console.log('💰 Поиск самого дешевого предложения...');
    
    const api = new RiskinsAPI();
    const result = await api.getInsuranceQuotes('AA1234AA');
    
    if (!result.success) {
        console.error('❌ Ошибка:', result.error);
        return null;
    }
    
    const quotes = result.offers || [];
    if (quotes.length === 0) {
        console.log('❌ Предложения не найдены');
        return null;
    }
    
    const cheapest = quotes.reduce((min, quote) => 
        quote.price < min.price ? quote : min
    );
    
    console.log(`🏆 Лучшее предложение: ${cheapest.companyName} - ${cheapest.price}₴`);
    
    return cheapest;
}

// Пример 3: Массовая обработка нескольких номеров
async function processBatchExample() {
    console.log('📋 Массовая обработка номеров...');
    
    const vehicleNumbers = ['AA1234AA', 'BB5678BB', 'CC9012CC'];
    const api = new RiskinsAPI();
    const results = [];
    
    for (const number of vehicleNumbers) {
        console.log(`🔄 Обрабатываем ${number}...`);
        try {
            const quotes = await api.getInsuranceQuotes(number);
            const cheapest = api.getCheapestQuote(quotes);
            
            results.push({
                vehicleNumber: number,
                totalQuotes: quotes.length,
                cheapestPrice: cheapest.price,
                cheapestCompany: cheapest.companyName,
                allQuotes: quotes
            });
            
            console.log(`  ✅ ${number}: ${quotes.length} предложений, от ${cheapest.price}₴`);
            
            // Пауза между запросами для избежания блокировки
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error(`  ❌ ${number}: ${error.message}`);
            results.push({
                vehicleNumber: number,
                error: error.message
            });
        }
    }
    
    return results;
}

// Пример 4: Автоматический мониторинг с интервалом
async function startMonitoringExample() {
    console.log('🔄 Запуск автоматического мониторинга...');
    
    const api = new RiskinsAPI();
    const vehicleNumber = 'AA1234AA';
    
    setInterval(async () => {
        try {
            console.log(`\n⏰ ${new Date().toLocaleTimeString()} - Проверяем цены...`);
            
            const quotes = await api.getInsuranceQuotes(vehicleNumber);
            const stats = api.calculateStatistics(quotes);
            
            console.log(`📊 Средняя цена: ${stats.avgPrice}₴`);
            console.log(`📈 Диапазон: ${stats.minPrice}₴ - ${stats.maxPrice}₴`);
            
            // Можно добавить логику оповещений при изменении цен
            
        } catch (error) {
            console.error('❌ Ошибка мониторинга:', error.message);
        }
    }, 30000); // Каждые 30 секунд
}

// Пример 5: Экспорт данных в JSON
async function exportDataExample() {
    console.log('💾 Экспорт данных в JSON...');
    
    const api = new RiskinsAPI();
    const result = await api.getInsuranceQuotes('AA1234AA');
    
    if (!result.success) {
        console.error('❌ Ошибка:', result.error);
        return null;
    }
    
    const quotes = result.offers || [];
    const exportData = {
        timestamp: new Date().toISOString(),
        vehicleNumber: 'AA1234AA',
        totalQuotes: quotes.length,
        quotes: quotes,
        statistics: calculateStats(quotes)
    };
    
    // Сохранение в файл
    const fs = require('fs');
    const filename = `riskins_data_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`✅ Данные сохранены в ${filename}`);
    
    return exportData;
}

// Вспомогательная функция для статистики
function calculateStats(quotes) {
    if (quotes.length === 0) return {};
    
    const prices = quotes.map(q => q.price);
    return {
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    };
}

// Демонстрация всех примеров
async function runAllExamples() {
    console.log('🚀 ДЕМОНСТРАЦИЯ АВТОМАТИЧЕСКИХ ВОЗМОЖНОСТЕЙ');
    console.log('=' .repeat(60));
    
    try {
        // Простое получение
        await getQuotesExample();
        console.log('\n' + '-'.repeat(40) + '\n');
        
        // Поиск дешевого
        await findCheapestExample();
        console.log('\n' + '-'.repeat(40) + '\n');
        
        // Экспорт данных
        await exportDataExample();
        console.log('\n' + '-'.repeat(40) + '\n');
        
        console.log('🎉 Все примеры выполнены успешно!');
        console.log('💡 Для массовой обработки и мониторинга раскомментируйте соответствующие функции');
        
    } catch (error) {
        console.error('❌ Ошибка демонстрации:', error.message);
    }
}

// Запуск демонстрации
if (require.main === module) {
    runAllExamples();
}

module.exports = {
    getQuotesExample,
    findCheapestExample,
    processBatchExample,
    startMonitoringExample,
    exportDataExample
};
