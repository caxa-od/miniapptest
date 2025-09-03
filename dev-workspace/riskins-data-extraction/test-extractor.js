/**
 * Тестовый файл для проверки работы экстрактора данных Riskins
 */

const RiskinsDataExtractor = require('./puppeteer-solution');

async function testExtractor() {
    console.log('🧪 Начинаем тестирование экстрактора Riskins...\n');
    
    const extractor = new RiskinsDataExtractor({
        headless: false, // Показываем браузер для отладки
        timeout: 60000
    });

    // Тестовые данные
    const testCases = [
        {
            vehicleNumber: 'AA1234AA',
            description: 'Правильный формат номера (как в placeholder)'
        },
        {
            vehicleNumber: 'BC5678EF', 
            description: 'Альтернативный номер'
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n📋 Тест: ${testCase.description}`);
        console.log(`🚗 Номер автомобиля: ${testCase.vehicleNumber}`);
        console.log('─'.repeat(50));

        try {
            const startTime = Date.now();
            const result = await extractor.getInsuranceOffers(testCase.vehicleNumber);
            const duration = Date.now() - startTime;

            if (result.success) {
                console.log(`✅ Успешно! Время выполнения: ${duration}ms`);
                console.log(`📊 Найдено предложений: ${result.offers.length}`);
                
                // Показываем детали первых 3 предложений
                result.offers.slice(0, 3).forEach((offer, index) => {
                    console.log(`\n${index + 1}. ${offer.companyName}`);
                    console.log(`   💰 Цена: ${offer.price} ${offer.currency}`);
                    if (offer.oldPrice) {
                        console.log(`   🏷️  Была: ${offer.oldPrice} ${offer.currency}`);
                    }
                    console.log(`   ⭐ Рейтинг: ${offer.rating}/5`);
                    console.log(`   📝 Статус: ${offer.status}`);
                });

                if (result.offers.length > 3) {
                    console.log(`\n   ... и еще ${result.offers.length - 3} предложений`);
                }

                // Проверка качества данных
                const validOffers = result.offers.filter(offer => 
                    offer.companyName && 
                    offer.price > 0 && 
                    offer.companyName !== 'Company_1'
                );

                console.log(`\n📈 Качество данных: ${validOffers.length}/${result.offers.length} валидных предложений`);
                
                if (validOffers.length < result.offers.length) {
                    console.log('⚠️  Некоторые предложения требуют доработки селекторов');
                }

            } else {
                console.log(`❌ Ошибка: ${result.error}`);
            }

        } catch (error) {
            console.error(`💥 Критическая ошибка:`, error.message);
        }

        console.log('\n' + '═'.repeat(50));
    }

    console.log('\n🏁 Тестирование завершено!');
}

// Функция для быстрого теста с одним номером
async function quickTest(vehicleNumber = 'AA1234AA') {
    console.log(`🚀 Быстрый тест с номером: ${vehicleNumber}\n`);
    
    const extractor = new RiskinsDataExtractor({
        headless: true, // Скрытый режим для скорости
        timeout: 30000
    });

    const result = await extractor.getInsuranceOffers(vehicleNumber);
    
    if (result.success) {
        console.log('✅ Данные успешно извлечены!');
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log('❌ Ошибка:', result.error);
    }
}

// Запуск тестов
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--quick')) {
        const vehicleNumber = args[args.indexOf('--quick') + 1] || 'AA1234AA';
        quickTest(vehicleNumber);
    } else {
        testExtractor();
    }
}

module.exports = { testExtractor, quickTest };
