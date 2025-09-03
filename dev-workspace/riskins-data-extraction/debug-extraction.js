const RiskinsExtractorFinal = require('./final-extractor.js');

async function debugExtraction() {
    console.log('🔍 Отладка извлечения данных');
    console.log('=' .repeat(50));
    
    const extractor = new RiskinsExtractorFinal();
    
    try {
        console.log('🚀 Запускаем основной экстрактор...');
        const result = await extractor.getInsuranceOffers('AA1234AA');
        
        console.log('\n📊 РЕЗУЛЬТАТ ОСНОВНОГО ЭКСТРАКТОРА:');
        console.log(`✅ Статус: ${result.success ? 'Успех' : 'Ошибка'}`);
        console.log(`📈 Найдено предложений: ${result.totalOffers || 0}`);
        
        if (result.offers && result.offers.length > 0) {
            console.log('\n💰 НАЙДЕННЫЕ ПРЕДЛОЖЕНИЯ:');
            result.offers.forEach((offer, i) => {
                console.log(`${i+1}. ${offer.companyName} - ${offer.price}₴`);
            });
            
            console.log('\n📋 Цены в порядке возрастания:');
            const sortedPrices = result.offers
                .map(o => o.price)
                .sort((a, b) => a - b);
            console.log(sortedPrices.join('₴, ') + '₴');
        } else {
            console.log('❌ Предложения не найдены');
        }
        
    } catch (error) {
        console.error('❌ Ошибка отладки:', error.message);
    }
}

debugExtraction().then(() => {
    console.log('\n🔍 Отладка завершена');
    process.exit(0);
});
