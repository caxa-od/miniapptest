/**
 * ТЕСТ АВТОМАТИЧЕСКОГО ПОЛУЧЕНИЯ ЦЕН НА 6 И 12 МЕСЯЦЕВ ДЛЯ AA1111AA
 * Полностью автоматический режим - без открытия браузера
 */

const AutoPeriodExtractor = require('./auto-period-extractor.js');

async function testAutoPeriods() {
    console.log('🤖 АВТОМАТИЧЕСКОЕ ПОЛУЧЕНИЕ ЦЕН ДЛЯ AA1111AA');
    console.log('=' .repeat(55));
    console.log('🎯 Тестируем 6 и 12 месяцев в headless режиме');
    console.log('🚫 Браузер не откроется - полностью автоматически\n');

    const extractor = new AutoPeriodExtractor();
    const vehicleNumber = 'AA1111AA';
    const results = [];

    // Тест 12 месяцев
    console.log('📅 ТЕСТ 1: 12 МЕСЯЦЕВ');
    console.log('-' .repeat(30));
    try {
        const result12 = await extractor.getInsuranceOffers(vehicleNumber, 12);
        results.push({ period: 12, ...result12 });
        
        if (result12.success) {
            console.log(`✅ 12 месяцев: ${result12.totalOffers} предложений`);
            const prices12 = result12.offers.map(o => o.price).sort((a, b) => a - b);
            console.log(`💰 Цены: ${prices12.join('₴, ')}₴`);
            const avg12 = Math.round(prices12.reduce((a, b) => a + b, 0) / prices12.length);
            console.log(`📊 Средняя: ${avg12}₴`);
        } else {
            console.log(`❌ 12 месяцев: ${result12.error}`);
        }
    } catch (error) {
        console.error(`❌ Ошибка 12 месяцев: ${error.message}`);
    }

    console.log('\n⏱️ Пауза между запросами...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Тест 6 месяцев
    console.log('\n📅 ТЕСТ 2: 6 МЕСЯЦЕВ');
    console.log('-' .repeat(30));
    try {
        const result6 = await extractor.getInsuranceOffers(vehicleNumber, 6);
        results.push({ period: 6, ...result6 });
        
        if (result6.success) {
            console.log(`✅ 6 месяцев: ${result6.totalOffers} предложений`);
            const prices6 = result6.offers.map(o => o.price).sort((a, b) => a - b);
            console.log(`💰 Цены: ${prices6.join('₴, ')}₴`);
            const avg6 = Math.round(prices6.reduce((a, b) => a + b, 0) / prices6.length);
            console.log(`📊 Средняя: ${avg6}₴`);
        } else {
            console.log(`❌ 6 месяцев: ${result6.error}`);
        }
    } catch (error) {
        console.error(`❌ Ошибка 6 месяцев: ${error.message}`);
    }

    // Сравнение результатов
    const successful = results.filter(r => r.success && r.offers && r.offers.length > 0);
    
    if (successful.length >= 2) {
        console.log('\n📊 СРАВНЕНИЕ АВТОМАТИЧЕСКИХ РЕЗУЛЬТАТОВ:');
        console.log('=' .repeat(50));

        const result6 = successful.find(r => r.period === 6);
        const result12 = successful.find(r => r.period === 12);

        if (result6 && result12) {
            const prices6 = result6.offers.map(o => o.price);
            const prices12 = result12.offers.map(o => o.price);
            
            const avg6 = Math.round(prices6.reduce((a, b) => a + b, 0) / prices6.length);
            const avg12 = Math.round(prices12.reduce((a, b) => a + b, 0) / prices12.length);

            console.log(`\n📅 6 месяцев:`);
            console.log(`   💰 Диапазон: ${Math.min(...prices6)}₴ - ${Math.max(...prices6)}₴`);
            console.log(`   📈 Средняя: ${avg6}₴`);
            console.log(`   📋 Фактический период: ${result6.selectedPeriod}`);

            console.log(`\n📅 12 месяцев:`);
            console.log(`   💰 Диапазон: ${Math.min(...prices12)}₴ - ${Math.max(...prices12)}₴`);
            console.log(`   📈 Средняя: ${avg12}₴`);
            console.log(`   📋 Фактический период: ${result12.selectedPeriod}`);

            const difference = Math.abs(avg12 - avg6);
            const percentDiff = Math.round((difference / avg6) * 100);

            console.log(`\n🎯 АНАЛИЗ:`);
            console.log(`   💲 Разница в средней цене: ${difference}₴`);
            console.log(`   📊 Разница в процентах: ${percentDiff}%`);
            
            if (avg12 > avg6) {
                console.log(`   💡 12 месяцев дороже на ${avg12 - avg6}₴`);
            } else if (avg6 > avg12) {
                console.log(`   💡 6 месяцев дороже на ${avg6 - avg12}₴`);
            } else {
                console.log(`   💡 Цены одинаковые`);
            }

            // Лучшие предложения
            const cheapest6 = result6.offers.reduce((min, offer) => offer.price < min.price ? offer : min);
            const cheapest12 = result12.offers.reduce((min, offer) => offer.price < min.price ? offer : min);

            console.log(`\n🏆 ЛУЧШИЕ ПРЕДЛОЖЕНИЯ:`);
            console.log(`   📅 6 мес: ${cheapest6.companyName} - ${cheapest6.price}₴`);
            console.log(`   📅 12 мес: ${cheapest12.companyName} - ${cheapest12.price}₴`);
        }
    } else {
        console.log('\n❌ Недостаточно данных для сравнения');
        results.forEach(result => {
            if (!result.success) {
                console.log(`❌ ${result.period} месяцев: ${result.error}`);
            }
        });
    }

    return results;
}

// Запуск тестирования
if (require.main === module) {
    testAutoPeriods()
        .then((results) => {
            console.log('\n🎉 АВТОМАТИЧЕСКОЕ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!');
            console.log('✨ Все данные получены без открытия браузера');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { testAutoPeriods };
