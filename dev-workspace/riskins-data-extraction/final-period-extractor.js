/**
 * ФИНАЛЬНЫЙ АВТОМАТИЧЕСКИЙ ЭКСТРАКТОР С ПЕРИОДАМИ
 * Полностью рабочая версия с автоматическим выбором 6 или 12 месяцев
 */

const puppeteer = require('puppeteer');

class FinalPeriodExtractor {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init(headless = true) {
        console.log(`🚀 Инициализация браузера (headless: ${headless})...`);
        
        this.browser = await puppeteer.launch({
            headless: headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1366, height: 768 });
    }

    async selectPeriod(months) {
        console.log(`🕒 Выбираем период: ${months} месяцев...`);
        
        try {
            await this.page.waitForSelector('#coverageTime', { timeout: 10000 });
            
            // Открываем селектор
            await this.page.click('#coverageTime');
            await this.page.waitForTimeout(500);
            
            // Ищем и кликаем по нужной опции
            const targetText = `${months} місяців`;
            const labels = await this.page.$$('#coverageTime .Select__option');
            
            for (const label of labels) {
                const text = await label.evaluate(el => el.textContent.trim());
                if (text === targetText) {
                    await label.click();
                    await this.page.waitForTimeout(1000);
                    console.log(`✅ Выбран период: ${targetText}`);
                    return true;
                }
            }
            
            throw new Error(`Период "${targetText}" не найден`);
        } catch (error) {
            console.error(`❌ Ошибка выбора периода: ${error.message}`);
            return false;
        }
    }

    async extractDataForPeriod(plateNumber, months) {
        console.log(`\n💰 ИЗВЛЕЧЕНИЕ ДАННЫХ ДЛЯ ${months} МЕСЯЦЕВ`);
        console.log('=' .repeat(50));

        try {
            console.log('🌐 Открываем сайт...');
            await this.page.goto('https://riskins-insurance.eua.in.ua/', { waitUntil: 'networkidle2' });

            console.log('📝 Заполняем номер...');
            await this.page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
            await this.page.click('#autoNumberSearch');
            await this.page.keyboard.down('Meta');
            await this.page.keyboard.press('KeyA');
            await this.page.keyboard.up('Meta');
            await this.page.type('#autoNumberSearch', plateNumber);

            // Выбираем период
            const periodSelected = await this.selectPeriod(months);
            if (!periodSelected) {
                throw new Error(`Не удалось выбрать период ${months} месяцев`);
            }

            console.log('🔍 Отправляем запрос...');
            await this.page.click('#btnCalculateNumber');

            console.log('⏳ Ожидаем результаты...');
            await this.page.waitForSelector('.offersList', { timeout: 30000 });

            // Ждем полной загрузки всех предложений
            await this.page.waitForTimeout(3000);

            console.log('📊 Извлекаем данные...');
            const offers = await this.page.evaluate(() => {
                const offerElements = document.querySelectorAll('.offersList .offer');
                const results = [];

                offerElements.forEach((offer, index) => {
                    try {
                        const companyElement = offer.querySelector('.company-logo img, .company-name, .offer-company');
                        const priceElement = offer.querySelector('.offer-price, .price, .cost');

                        const company = companyElement ? 
                            (companyElement.alt || companyElement.textContent || 'Неизвестно').trim() : 
                            `Компания ${index + 1}`;

                        let price = 'Цена не найдена';
                        if (priceElement) {
                            const priceText = priceElement.textContent.trim();
                            const priceMatch = priceText.match(/(\d+(?:\s?\d+)*)/);
                            if (priceMatch) {
                                price = priceMatch[1].replace(/\s/g, '') + '₴';
                            }
                        }

                        results.push({
                            company: company,
                            price: price,
                            index: index + 1
                        });
                    } catch (error) {
                        console.error(`Ошибка обработки предложения ${index + 1}:`, error);
                        results.push({
                            company: `Компания ${index + 1}`,
                            price: 'Ошибка извлечения',
                            index: index + 1
                        });
                    }
                });

                return results;
            });

            console.log(`✅ Найдено ${offers.length} предложений для ${months} месяцев:`);
            offers.forEach((offer, i) => {
                console.log(`   ${i + 1}. ${offer.company}: ${offer.price}`);
            });

            return {
                success: true,
                plateNumber: plateNumber,
                period: `${months} месяцев`,
                offersCount: offers.length,
                offers: offers,
                extractedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Ошибка извлечения для ${months} месяцев: ${error.message}`);
            return {
                success: false,
                plateNumber: plateNumber,
                period: `${months} месяцев`,
                error: error.message,
                extractedAt: new Date().toISOString()
            };
        }
    }

    async comparePeriods(plateNumber) {
        console.log(`\n🔄 СРАВНЕНИЕ ПЕРИОДОВ ДЛЯ ${plateNumber}`);
        console.log('=' .repeat(60));

        const results = {};

        // Извлекаем данные для 6 месяцев
        results.period6 = await this.extractDataForPeriod(plateNumber, 6);
        
        // Небольшая пауза между запросами
        await this.page.waitForTimeout(2000);
        
        // Извлекаем данные для 12 месяцев
        results.period12 = await this.extractDataForPeriod(plateNumber, 12);

        // Анализ результатов
        console.log('\n📊 СРАВНИТЕЛЬНЫЙ АНАЛИЗ:');
        console.log('=' .repeat(40));

        if (results.period6.success && results.period12.success) {
            console.log('✅ Оба периода успешно обработаны');
            
            const prices6 = results.period6.offers.map(o => 
                parseInt(o.price.replace(/[^\d]/g, '')) || 0
            ).filter(p => p > 0);
            
            const prices12 = results.period12.offers.map(o => 
                parseInt(o.price.replace(/[^\d]/g, '')) || 0
            ).filter(p => p > 0);

            if (prices6.length > 0 && prices12.length > 0) {
                const avg6 = Math.round(prices6.reduce((a, b) => a + b) / prices6.length);
                const avg12 = Math.round(prices12.reduce((a, b) => a + b) / prices12.length);
                const diff = avg12 - avg6;
                const diffPercent = Math.round((diff / avg6) * 100);

                console.log(`\n💰 Средние цены:`);
                console.log(`   6 месяцев:  ${avg6}₴`);
                console.log(`   12 месяцев: ${avg12}₴`);
                console.log(`   Разница:    ${diff}₴ (${diffPercent > 0 ? '+' : ''}${diffPercent}%)`);

                results.analysis = {
                    avgPrice6: avg6,
                    avgPrice12: avg12,
                    difference: diff,
                    differencePercent: diffPercent
                };
            }
        } else {
            console.log('❌ Ошибка в одном или обоих периодах');
        }

        return results;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Браузер закрыт');
        }
    }
}

// Быстрый тест одного номера
async function quickTest(plateNumber, months = 6) {
    const extractor = new FinalPeriodExtractor();
    
    try {
        await extractor.init(false); // Видимый режим для теста
        const result = await extractor.extractDataForPeriod(plateNumber, months);
        
        console.log('\n🎯 РЕЗУЛЬТАТ БЫСТРОГО ТЕСТА:');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
    } finally {
        await extractor.close();
    }
}

// Полное сравнение периодов
async function fullComparison(plateNumber) {
    const extractor = new FinalPeriodExtractor();
    
    try {
        await extractor.init(true); // Скрытый режим для автоматизации
        const result = await extractor.comparePeriods(plateNumber);
        
        console.log('\n🎯 ПОЛНОЕ СРАВНЕНИЕ:');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
    } finally {
        await extractor.close();
    }
}

// Экспорт и запуск
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--quick')) {
        const plateNumber = args[args.indexOf('--quick') + 1] || 'AA1111AA';
        const months = parseInt(args[args.indexOf('--months') + 1]) || 6;
        
        quickTest(plateNumber, months)
            .then(() => process.exit(0))
            .catch(error => {
                console.error('❌ Ошибка теста:', error);
                process.exit(1);
            });
    } else if (args.includes('--compare')) {
        const plateNumber = args[args.indexOf('--compare') + 1] || 'AA1111AA';
        
        fullComparison(plateNumber)
            .then(() => process.exit(0))
            .catch(error => {
                console.error('❌ Ошибка сравнения:', error);
                process.exit(1);
            });
    } else {
        console.log('🚀 ФИНАЛЬНЫЙ ПЕРИОД-ЭКСТРАКТОР');
        console.log('');
        console.log('Использование:');
        console.log('  node final-period-extractor.js --quick AA1111AA --months 6');
        console.log('  node final-period-extractor.js --compare AA1111AA');
    }
}

module.exports = { FinalPeriodExtractor, quickTest, fullComparison };
