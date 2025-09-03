/**
 * ТЕСТ НОМЕРА AA1111AA НА РАЗНЫЕ ПЕРИОДЫ
 */

const RiskinsAPI = require('./riskins-api.js');
const FixedPeriodTester = require('./fixed-period-test.js');

async function testAA1111AA() {
    console.log('🔍 ТЕСТ ЦЕН ДЛЯ НОМЕРА AA1111AA');
    console.log('=' .repeat(50));
    
    const vehicleNumber = 'AA1111AA';
    const tester = new FixedPeriodTester();
    
    console.log(`🚗 Номер: ${vehicleNumber}`);
    console.log('📊 Сравниваем цены на 6 и 12 месяцев...\n');
    
    try {
        // Получаем данные для разных периодов
        const results = await tester.compareAllPeriods(vehicleNumber);
        
        console.log('\n📋 ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ:');
        console.log('=' .repeat(50));
        
        const successful = results.filter(r => r.success && r.offers && r.offers.length > 0);
        
        if (successful.length >= 2) {
            const [result6, result12] = successful;
            
            console.log(`\n📅 6 МЕСЯЦЕВ:`);
            console.log(`   ✅ Найдено: ${result6.totalOffers} предложений`);
            console.log(`   💰 Цены: ${result6.offers.map(o => o.price + '₴').join(', ')}`);
            
            const prices6 = result6.offers.map(o => o.price).sort((a, b) => a - b);
            const avg6 = Math.round(prices6.reduce((a, b) => a + b, 0) / prices6.length);
            console.log(`   📊 Диапазон: ${Math.min(...prices6)}₴ - ${Math.max(...prices6)}₴`);
            console.log(`   📈 Средняя: ${avg6}₴`);
            
            console.log(`\n📅 12 МЕСЯЦЕВ:`);
            console.log(`   ✅ Найдено: ${result12.totalOffers} предложений`);
            console.log(`   💰 Цены: ${result12.offers.map(o => o.price + '₴').join(', ')}`);
            
            const prices12 = result12.offers.map(o => o.price).sort((a, b) => a - b);
            const avg12 = Math.round(prices12.reduce((a, b) => a + b, 0) / prices12.length);
            console.log(`   📊 Диапазон: ${Math.min(...prices12)}₴ - ${Math.max(...prices12)}₴`);
            console.log(`   📈 Средняя: ${avg12}₴`);
            
            console.log(`\n🎯 СРАВНЕНИЕ:`);
            console.log(`   💲 Разница в средней цене: ${Math.abs(avg12 - avg6)}₴`);
            console.log(`   📊 Разница в %: ${Math.round(((avg12 - avg6) / avg6) * 100)}%`);
            
            if (avg12 > avg6) {
                console.log(`   💡 12 месяцев дороже на ${avg12 - avg6}₴`);
            } else if (avg6 > avg12) {
                console.log(`   💡 6 месяцев дороже на ${avg6 - avg12}₴`);
            } else {
                console.log(`   💡 Цены одинаковые`);
            }
            
            // Лучшие предложения
            console.log(`\n🏆 ЛУЧШИЕ ПРЕДЛОЖЕНИЯ:`);
            const cheapest6 = result6.offers.reduce((min, offer) => offer.price < min.price ? offer : min);
            const cheapest12 = result12.offers.reduce((min, offer) => offer.price < min.price ? offer : min);
            
            console.log(`   📅 6 мес: ${cheapest6.companyName} - ${cheapest6.price}₴`);
            console.log(`   📅 12 мес: ${cheapest12.companyName} - ${cheapest12.price}₴`);
            
        } else {
            console.log('❌ Не удалось получить данные для сравнения');
            results.forEach(result => {
                if (!result.success) {
                    console.log(`❌ ${result.period} месяцев: ${result.error}`);
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Ошибка тестирования:', error.message);
    }
}

// Запуск теста
if (require.main === module) {
    testAA1111AA()
        .then(() => {
            console.log('\n🎉 Тест завершен!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { testAA1111AA };
