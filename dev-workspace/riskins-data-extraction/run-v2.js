/**
 * Простой запуск улучшенной версии экстрактора
 */

const RiskinsDataExtractorV2 = require('./extractor-v2');

async function runV2() {
    console.log('🚀 Запуск улучшенной версии экстрактора V2\n');
    
    const extractor = new RiskinsDataExtractorV2({
        headless: false, // Показываем браузер для наблюдения
        timeout: 60000
    });
    
    try {
        const result = await extractor.getInsuranceOffers('AA1234AA');
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:');
        console.log('='.repeat(50));
        
        if (result.success) {
            console.log('✅ Статус: УСПЕШНО');
            console.log(`📋 Номер автомобиля: ${result.vehicleNumber}`);
            console.log(`🕐 Время: ${result.timestamp}`);
            console.log(`📊 Найдено предложений: ${result.totalOffers}`);
            
            if (result.offers && result.offers.length > 0) {
                console.log('\n💰 НАЙДЕННЫЕ ПРЕДЛОЖЕНИЯ:');
                result.offers.forEach((offer, index) => {
                    console.log(`\n${index + 1}. ${offer.companyName}`);
                    console.log(`   💵 Цена: ${offer.price} ${offer.currency}`);
                    console.log(`   ⭐ Рейтинг: ${offer.rating}/5`);
                    console.log(`   📝 Статус: ${offer.status}`);
                    if (offer.debug) {
                        console.log(`   🔍 Отладка: ${offer.debug.companyElement}`);
                    }
                });
            } else {
                console.log('\n⚠️  Предложения не найдены, но форма работает!');
                console.log('   Возможно, нужно дополнительное время или другие селекторы');
            }
        } else {
            console.log('❌ Статус: ОШИБКА');
            console.log(`📝 Ошибка: ${result.error}`);
        }
        
        console.log('\n' + '='.repeat(50));
        
    } catch (error) {
        console.error('💥 Критическая ошибка:', error.message);
    }
}

runV2();
