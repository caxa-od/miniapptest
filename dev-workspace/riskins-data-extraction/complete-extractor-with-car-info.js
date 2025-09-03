const puppeteer = require('puppeteer');

class CompleteRiskinsExtractor {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize(headless = true) {
        this.browser = await puppeteer.launch({
            headless: headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1280, height: 720 }
        });
        this.page = await this.browser.newPage();
        
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    async extractCarInfo() {
        try {
            // Ищем информацию о машине в разных элементах
            const carInfoSelectors = [
                '.Listing__selected span',
                '.Listing__selected', 
                '.FormGroup__content span'
            ];

            for (const selector of carInfoSelectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        const text = await element.evaluate(el => el.textContent.trim());
                        
                        // Проверяем, содержит ли текст информацию об автомобиле
                        if (this.isCarInfoText(text)) {
                            return this.parseCarInfo(text);
                        }
                    }
                } catch (error) {
                    // Продолжаем поиск в других селекторах
                    continue;
                }
            }

            return {
                city: 'Не найдено',
                country: 'Не найдено',
                vehicleType: 'Не найдено',
                engineVolume: 'Не найдено',
                brand: 'Не найдено',
                model: 'Не найдено',
                raw: 'Информация об автомобиле не найдена'
            };
        } catch (error) {
            console.error('Ошибка извлечения информации об автомобиле:', error);
            return {
                city: 'Ошибка',
                country: 'Ошибка',
                vehicleType: 'Ошибка',
                engineVolume: 'Ошибка',
                brand: 'Ошибка',
                model: 'Ошибка',
                raw: error.message
            };
        }
    }

    isCarInfoText(text) {
        // Проверяем признаки информации об автомобиле
        const carIndicators = [
            'см3',           // объем двигуна
            'автомобіль',    // тип транспорта
            'MERCEDES',      // марки авто
            'BMW',
            'AUDI',
            'VOLKSWAGEN',
            'TOYOTA',
            'Україна',       // страна
            'м. Київ',       // город
            'м. Львів',
            'м. Харків'
        ];

        return carIndicators.some(indicator => 
            text.toLowerCase().includes(indicator.toLowerCase())
        );
    }

    parseCarInfo(text) {
        // Парсим информацию: "м. Київ, Україна, легковий автомобіль - 2001 - 3000 см3, MERCEDES-BENZ S 400"
        const info = {
            city: 'Не найдено',
            country: 'Не найдено', 
            vehicleType: 'Не найдено',
            engineVolume: 'Не найдено',
            brand: 'Не найдено',
            model: 'Не найдено',
            raw: text
        };

        // Извлекаем город
        const cityMatch = text.match(/м\.\s*([^,]+)/);
        if (cityMatch) {
            info.city = cityMatch[1].trim();
        }

        // Извлекаем страну
        if (text.includes('Україна')) {
            info.country = 'Україна';
        }

        // Извлекаем тип транспорта и объем двигателя
        const vehicleMatch = text.match(/(легковий автомобіль|вантажний автомобіль|автобус|мотоцикл)\s*-\s*([^,]+)/);
        if (vehicleMatch) {
            info.vehicleType = vehicleMatch[1];
            
            // Извлекаем объем двигателя
            const engineMatch = vehicleMatch[2].match(/(\d+\s*-\s*\d+\s*см3|\d+\s*см3|електромобіль)/);
            if (engineMatch) {
                info.engineVolume = engineMatch[1];
            }
        }

        // Извлекаем марку и модель автомобиля
        const brandModelMatch = text.match(/([A-Z-]+)\s+([A-Z0-9\s]+)$/);
        if (brandModelMatch) {
            info.brand = brandModelMatch[1];
            info.model = brandModelMatch[2].trim();
        }

        return info;
    }

    async extractSinglePeriodWithCarInfo(plateNumber, period = 6) {
        try {
            console.log(`🚗 Извлекаем данные для номера ${plateNumber} на ${period} месяцев...`);
            
            await this.page.goto('https://riskins-insurance.eua.in.ua/', { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });

            // Вводим номер автомобиля
            await this.page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
            await this.page.click('#autoNumberSearch');
            await this.page.type('#autoNumberSearch', plateNumber);

            // Выбираем период (используем проверенный метод)
            await this.page.waitForSelector('#coverageTime', { timeout: 5000 });
            await this.page.click('#coverageTime');
            await this.page.waitForTimeout(1000);
            
            // Ждем появления выпадающего списка
            await this.page.waitForSelector('.Select__option', { timeout: 5000 });
            
            // Ищем нужную опцию по тексту
            const targetText = period === 6 ? '6 місяців' : '12 місяців';
            const options = await this.page.$$('.Select__option');
            let optionFound = false;
            
            for (const option of options) {
                const text = await option.evaluate(el => el.textContent.trim());
                if (text.includes(targetText)) {
                    await option.click();
                    optionFound = true;
                    break;
                }
            }
            
            if (!optionFound) {
                throw new Error(`Не удалось найти опцию для ${period} месяцев`);
            }

            // Нажимаем кнопку расчета
            await this.page.click('#btnCalculateNumber');
            
            // Ждем загрузки результатов
            await this.page.waitForSelector('.Table__row', { timeout: 15000 });
            await this.page.waitForTimeout(3000);

            // Извлекаем информацию об автомобиле
            const carInfo = await this.extractCarInfo();

            // Извлекаем данные о ценах
            const offers = await this.page.evaluate(() => {
                const rows = document.querySelectorAll('.Table__row');
                const results = [];

                rows.forEach(row => {
                    try {
                        // Извлекаем логотип/название компании
                        const logoImg = row.querySelector('.Table__cell_logo img');
                        let company = 'Unknown';
                        if (logoImg) {
                            company = logoImg.alt || logoImg.src.split('/').pop().split('.')[0] || 'Unknown';
                        }

                        // Извлекаем основную цену
                        const priceCell = row.querySelector('.Table__cell_price');
                        if (!priceCell) return;

                        // Ищем цену со скидкой и полную цену
                        const discountElement = row.querySelector('.Table__discount');
                        let fullPrice = null;
                        let discountedPrice = null;
                        let discountPercentage = null;

                        if (discountElement) {
                            // Есть информация о скидке
                            const discountSpans = discountElement.querySelectorAll('span');
                            if (discountSpans.length >= 2) {
                                // Первый span - цена со скидкой (красный)
                                const discountedText = discountSpans[0].textContent.trim();
                                const discountedMatch = discountedText.match(/(\d+(?:\s*\d+)*)\s*грн/);
                                if (discountedMatch) {
                                    discountedPrice = parseInt(discountedMatch[1].replace(/\s/g, ''));
                                }

                                // Второй span - полная цена (серый, зачеркнутый)  
                                const fullText = discountSpans[1].textContent.trim();
                                const fullMatch = fullText.match(/(\d+(?:\s*\d+)*)\s*грн/);
                                if (fullMatch) {
                                    fullPrice = parseInt(fullMatch[1].replace(/\s/g, ''));
                                }
                            }

                            // Извлекаем процент скидки из предыдущего элемента
                            const percentElement = discountElement.previousElementSibling;
                            if (percentElement) {
                                const percentMatch = percentElement.textContent.match(/(\d+)%/);
                                if (percentMatch) {
                                    discountPercentage = parseInt(percentMatch[1]);
                                }
                            }
                        } else {
                            // Нет скидки, только обычная цена
                            const priceText = priceCell.textContent.trim();
                            const priceMatch = priceText.match(/(\d+(?:\s*\d+)*)\s*грн/);
                            if (priceMatch) {
                                fullPrice = parseInt(priceMatch[1].replace(/\s/g, ''));
                                discountedPrice = fullPrice; // Цена без скидки
                            }
                        }

                        if (fullPrice !== null || discountedPrice !== null) {
                            const savings = fullPrice && discountedPrice ? fullPrice - discountedPrice : 0;
                            
                            results.push({
                                company: company,
                                fullPrice: fullPrice,
                                discountedPrice: discountedPrice,
                                discountPercentage: discountPercentage,
                                savings: savings,
                                currency: 'грн'
                            });
                        }
                    } catch (error) {
                        console.error('Ошибка обработки строки:', error);
                    }
                });

                return results;
            });

            if (offers.length === 0) {
                throw new Error('Предложения не найдены');
            }

            // Вычисляем статистику
            const validOffers = offers.filter(offer => offer.discountedPrice > 0);
            const prices = validOffers.map(offer => offer.discountedPrice);
            const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
            const min = Math.min(...prices);
            const max = Math.max(...prices);

            const result = {
                plateNumber: plateNumber,
                period: period,
                timestamp: new Date().toISOString(),
                carInfo: carInfo,
                offers: validOffers,
                statistics: {
                    totalOffers: validOffers.length,
                    averagePrice: Math.round(average),
                    minPrice: min,
                    maxPrice: max,
                    priceRange: max - min
                }
            };

            console.log(`✅ Найдено ${validOffers.length} предложений`);
            console.log(`📊 Средняя цена: ${Math.round(average)}₴`);
            console.log(`🚗 Автомобиль: ${carInfo.brand} ${carInfo.model} (${carInfo.engineVolume})`);
            
            return result;

        } catch (error) {
            console.error(`❌ Ошибка извлечения данных для ${plateNumber}:`, error);
            throw error;
        }
    }

    async comparePeriodsWithCarInfo(plateNumber) {
        console.log(`🔄 Сравниваем цены для ${plateNumber} на 6 и 12 месяцев...`);
        
        const results = {};
        
        try {
            // Получаем данные для 6 месяцев
            console.log('\n📅 Получаем данные для 6 месяцев...');
            results.sixMonths = await this.extractSinglePeriodWithCarInfo(plateNumber, 6);
            
            // Ждем немного между запросами
            await this.page.waitForTimeout(2000);
            
            // Получаем данные для 12 месяцев
            console.log('\n📅 Получаем данные для 12 месяцев...');
            results.twelveMonths = await this.extractSinglePeriodWithCarInfo(plateNumber, 12);
            
            // Анализируем разницу
            const sixMonthAvg = results.sixMonths.statistics.averagePrice;
            const twelveMonthAvg = results.twelveMonths.statistics.averagePrice;
            const difference = twelveMonthAvg - sixMonthAvg;
            const percentageDifference = ((difference / sixMonthAvg) * 100).toFixed(1);

            results.comparison = {
                plateNumber: plateNumber,
                carInfo: results.sixMonths.carInfo, // Информация об автомобиле
                sixMonthAverage: sixMonthAvg,
                twelveMonthAverage: twelveMonthAvg,
                difference: difference,
                percentageDifference: parseFloat(percentageDifference),
                recommendation: difference > 0 ? 
                    `12 месяцев дороже на ${difference}₴ (${percentageDifference}%)` :
                    `12 месяцев дешевле на ${Math.abs(difference)}₴ (${Math.abs(percentageDifference)}%)`
            };

            console.log('\n📈 СРАВНЕНИЕ ПЕРИОДОВ:');
            console.log(`🚗 Автомобиль: ${results.comparison.carInfo.brand} ${results.comparison.carInfo.model}`);
            console.log(`📍 Регистрация: ${results.comparison.carInfo.city}, ${results.comparison.carInfo.country}`);
            console.log(`⚙️ Двигатель: ${results.comparison.carInfo.engineVolume}`);
            console.log(`📅 6 месяцев: ${sixMonthAvg}₴ (среднее)`);
            console.log(`📅 12 месяцев: ${twelveMonthAvg}₴ (среднее)`);
            console.log(`💰 Разница: ${results.comparison.recommendation}`);

            return results;
            
        } catch (error) {
            console.error('❌ Ошибка сравнения периодов:', error);
            throw error;
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

module.exports = CompleteRiskinsExtractor;

// Пример использования
if (require.main === module) {
    async function testExtractor() {
        const extractor = new CompleteRiskinsExtractor();
        
        try {
            await extractor.initialize(true); // headless mode
            
            // Тестируем с номером AA1111AA
            const result = await extractor.comparePeriodsWithCarInfo('AA1111AA');
            
            // Сохраняем результат
            const fs = require('fs');
            fs.writeFileSync(
                `complete_result_${result.comparison.plateNumber}.json`, 
                JSON.stringify(result, null, 2)
            );
            
            console.log('\n💾 Результаты сохранены в файл');
            
        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            await extractor.close();
        }
    }
    
    testExtractor();
}
