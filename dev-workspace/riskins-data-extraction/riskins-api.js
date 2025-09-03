/**
 * ПРОСТОЙ ИНТЕРФЕЙС ДЛЯ ИСПОЛЬЗОВАНИЯ ЭКСТРАКТОРА RISKINS
 */

const RiskinsExtractorFinal = require('./final-extractor');

class RiskinsAPI {
    constructor(options = {}) {
        this.extractor = new RiskinsExtractorFinal(options);
    }

    /**
     * Получить страховые предложения для номера авто
     * @param {string} vehicleNumber - Номер в формате AA1234AA
     * @returns {Promise<Object>} Результат с предложениями
     */
    async getInsuranceQuotes(vehicleNumber) {
        // Валидация формата номера
        if (!this.isValidVehicleNumber(vehicleNumber)) {
            return {
                success: false,
                error: 'Неверный формат номера. Используйте формат AA1234AA',
                validFormat: 'AA1234AA (2 буквы + 4 цифры + 2 буквы)'
            };
        }

        return await this.extractor.getInsuranceOffers(vehicleNumber);
    }

    /**
     * Проверка формата номера автомобиля
     * @param {string} number - Номер для проверки
     * @returns {boolean} true если формат правильный
     */
    isValidVehicleNumber(number) {
        const pattern = /^[A-Z]{2}\d{4}[A-Z]{2}$/;
        return pattern.test(number);
    }

    /**
     * Получить самое дешевое предложение
     * @param {string} vehicleNumber - Номер авто
     * @returns {Promise<Object>} Самое дешевое предложение
     */
    async getCheapestQuote(vehicleNumber) {
        const result = await this.getInsuranceQuotes(vehicleNumber);
        
        if (!result.success || result.offers.length === 0) {
            return result;
        }

        const cheapest = result.offers.reduce((min, offer) => 
            offer.price < min.price ? offer : min
        );

        return {
            success: true,
            vehicleNumber,
            cheapestOffer: cheapest,
            savings: cheapest.oldPrice ? cheapest.oldPrice - cheapest.price : 0,
            totalOffersFound: result.totalOffers
        };
    }

    /**
     * Сравнить цены для нескольких номеров
     * @param {string[]} vehicleNumbers - Массив номеров
     * @returns {Promise<Object>} Сравнение цен
     */
    async compareQuotes(vehicleNumbers) {
        const results = [];
        
        for (const number of vehicleNumbers) {
            console.log(`🔍 Обработка ${number}...`);
            const result = await this.getInsuranceQuotes(number);
            results.push(result);
            
            // Пауза между запросами
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return {
            success: true,
            comparison: results,
            summary: this.createComparisonSummary(results)
        };
    }

    /**
     * Создать сводку сравнения
     * @private
     */
    createComparisonSummary(results) {
        const successful = results.filter(r => r.success && r.offers.length > 0);
        
        if (successful.length === 0) {
            return { message: 'Нет успешных результатов для сравнения' };
        }

        const allOffers = successful.flatMap(r => 
            r.offers.map(offer => ({ ...offer, vehicleNumber: r.vehicleNumber }))
        );

        const cheapest = allOffers.reduce((min, offer) => 
            offer.price < min.price ? offer : min
        );

        const mostExpensive = allOffers.reduce((max, offer) => 
            offer.price > max.price ? offer : max
        );

        return {
            totalVehiclesProcessed: results.length,
            successfulQuotes: successful.length,
            totalOffersFound: allOffers.length,
            cheapestOverall: {
                vehicleNumber: cheapest.vehicleNumber,
                company: cheapest.companyName,
                price: cheapest.price,
                currency: cheapest.currency
            },
            mostExpensive: {
                vehicleNumber: mostExpensive.vehicleNumber,
                company: mostExpensive.companyName,
                price: mostExpensive.price,
                currency: mostExpensive.currency
            },
            priceRange: {
                min: cheapest.price,
                max: mostExpensive.price,
                difference: mostExpensive.price - cheapest.price
            }
        };
    }
}

// Примеры использования
async function examples() {
    console.log('🚀 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ RISKINS API\n');
    
    const api = new RiskinsAPI({ headless: true });
    
    // Пример 1: Получить предложения для одного номера
    console.log('📋 Пример 1: Одно авто');
    console.log('─'.repeat(40));
    const single = await api.getInsuranceQuotes('AA1234AA');
    if (single.success) {
        console.log(`✅ Найдено ${single.totalOffers} предложений`);
        console.log(`💰 Цены: ${single.offers.map(o => o.price + '₴').join(', ')}`);
    }
    
    // Пример 2: Самое дешевое предложение
    console.log('\n💰 Пример 2: Самое дешевое');
    console.log('─'.repeat(40));
    const cheapest = await api.getCheapestQuote('AA1234AA');
    if (cheapest.success) {
        console.log(`🎯 Лучшая цена: ${cheapest.cheapestOffer.price}₴`);
        console.log(`🏢 Компания: ${cheapest.cheapestOffer.companyName}`);
        if (cheapest.savings > 0) {
            console.log(`💸 Экономия: ${cheapest.savings}₴`);
        }
    }
    
    console.log('\n🎉 Примеры завершены!');
}

module.exports = RiskinsAPI;

// Запуск примеров
if (require.main === module) {
    examples();
}
