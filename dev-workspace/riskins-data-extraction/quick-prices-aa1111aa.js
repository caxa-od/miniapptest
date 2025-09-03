/**
 * БЫСТРОЕ ПОЛУЧЕНИЕ ЦЕН ДЛЯ AA1111AA В АВТОМАТИЧЕСКОМ РЕЖИМЕ
 */

const RiskinsAPI = require('./riskins-api.js');

async function getQuickPricesAA1111AA() {
    console.log('🔍 АВТОМАТИЧЕСКОЕ ПОЛУЧЕНИЕ ЦЕН ДЛЯ AA1111AA');
    console.log('=' .repeat(50));
    console.log('🤖 Фоновый режим - браузер не откроется');
    console.log('📅 По умолчанию: 12 месяцев\n');
    
    const api = new RiskinsAPI();
    const vehicleNumber = 'AA1111AA';
    
    try {
        console.log(`🚗 Номер: ${vehicleNumber}`);
        console.log('⏳ Получаем данные...');
        
        const result = await api.getInsuranceQuotes(vehicleNumber);
        
        if (!result.success) {
            console.error('❌ Ошибка:', result.error);
            return null;
        }
        
        const quotes = result.offers || [];
        
        console.log(`\n✅ Найдено ${quotes.length} предложений:`);
        console.log('=' .repeat(40));
        
        quotes.forEach((quote, i) => {
            let priceInfo = `${quote.price}₴`;
            if (quote.oldPrice && quote.oldPrice > quote.price) {
                priceInfo += ` (было ${quote.oldPrice}₴)`;
            }
            if (quote.discount) {
                priceInfo += ` [-${quote.discount}%]`;
            }
            console.log(`${i+1}. ${quote.companyName}: ${priceInfo}`);
        });
        
        // Статистика
        const prices = quotes.map(q => q.price).sort((a, b) => a - b);
        const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        
        console.log('\n📊 СТАТИСТИКА:');
        console.log(`   💰 Самая дешевая: ${Math.min(...prices)}₴`);
        console.log(`   💸 Самая дорогая: ${Math.max(...prices)}₴`);
        console.log(`   📈 Средняя цена: ${avgPrice}₴`);
        console.log(`   📊 Диапазон: ${Math.max(...prices) - Math.min(...prices)}₴`);
        
        // Лучшее предложение
        const cheapest = quotes.reduce((min, quote) => 
            quote.price < min.price ? quote : min
        );
        
        console.log('\n🏆 ЛУЧШЕЕ ПРЕДЛОЖЕНИЕ:');
        console.log(`   🎯 ${cheapest.companyName}`);
        console.log(`   💰 Цена: ${cheapest.price}₴`);
        if (cheapest.discount) {
            console.log(`   🎁 Скидка: ${cheapest.discount}%`);
        }
        
        return {
            vehicleNumber,
            period: '12 месяцев (по умолчанию)',
            totalOffers: quotes.length,
            prices: prices,
            avgPrice,
            cheapest: {
                company: cheapest.companyName,
                price: cheapest.price,
                discount: cheapest.discount
            },
            allOffers: quotes
        };
        
    } catch (error) {
        console.error('❌ Ошибка получения данных:', error.message);
        return null;
    }
}

// Запуск
if (require.main === module) {
    getQuickPricesAA1111AA()
        .then((result) => {
            if (result) {
                console.log('\n🎉 Данные получены успешно!');
                console.log('💡 Это цены по умолчанию (обычно 12 месяцев)');
                console.log('📝 Для получения цен на 6 месяцев нужен ручной выбор периода');
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { getQuickPricesAA1111AA };
