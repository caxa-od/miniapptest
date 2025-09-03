/**
 * ИСПРАВЛЕННЫЙ ФИНАЛЬНЫЙ ЭКСТРАКТОР
 * С правильными селекторами на основе диагностики
 */

const puppeteer = require('puppeteer');

class FixedPeriodExtractor {
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

            // Выбираем период ТОЛЬКО если это не 12 месяцев (по умолчанию)
            if (months !== 12) {
                const periodSelected = await this.selectPeriod(months);
                if (!periodSelected) {
                    throw new Error(`Не удалось выбрать период ${months} месяцев`);
                }
            } else {
                console.log('🕒 Используем период по умолчанию (12 месяцев)');
            }

            console.log('🔍 Отправляем запрос...');
            await this.page.click('#btnCalculateNumber');

            console.log('⏳ Ожидаем результаты...');
            
            // Пробуем разные селекторы результатов
            const resultSelectors = [
                '.Listing',
                '.Listing__table',
                '.Table__cell_price',
                '.offersList',
                '.offers',
                '.insurance-offers',
                '.results'
            ];

            let resultsFound = false;
            let waitTime = 0;
            const maxWaitTime = 60000; // 60 секунд максимум

            while (!resultsFound && waitTime < maxWaitTime) {
                for (const selector of resultSelectors) {
                    try {
                        await this.page.waitForSelector(selector, { timeout: 2000 });
                        console.log(`✅ Найдены результаты с селектором: ${selector}`);
                        resultsFound = true;
                        break;
                    } catch (e) {
                        // Селектор не найден, пробуем следующий
                    }
                }
                
                if (!resultsFound) {
                    console.log(`⏳ Ждем еще 3 секунды... (${waitTime/1000}s)`);
                    await this.page.waitForTimeout(3000);
                    waitTime += 3000;
                }
            }

            if (!resultsFound) {
                throw new Error('Результаты не загрузились за отведенное время');
            }

            // Ждем дополнительное время для полной загрузки
            await this.page.waitForTimeout(5000);

            console.log('📊 Извлекаем данные...');
            const offers = await this.page.evaluate(() => {
                const results = [];

                // Пробуем разные варианты селекторов для извлечения данных
                const possibleSelectors = [
                    '.Listing .Table__cell_price',
                    '.offers .offer',
                    '.insurance-offer',
                    '.result-item',
                    '[class*="price"]',
                    '[class*="offer"]'
                ];

                // Ищем элементы с ценами
                const priceElements = [];
                possibleSelectors.forEach(selector => {
                    try {
                        const elements = document.querySelectorAll(selector);
                        elements.forEach(el => {
                            const text = el.textContent?.trim() || '';
                            if (text.match(/\d+.*₴|₴.*\d+|\d+\s*грн|грн\s*\d+/)) {
                                priceElements.push(el);
                            }
                        });
                    } catch (e) {
                        // Игнорируем ошибки селекторов
                    }
                });

                // Если нашли элементы с ценами
                if (priceElements.length > 0) {
                    priceElements.forEach((el, index) => {
                        const text = el.textContent.trim();
                        const priceMatch = text.match(/(\d+(?:\s?\d+)*)/);
                        const price = priceMatch ? priceMatch[1].replace(/\s/g, '') + '₴' : text;
                        
                        results.push({
                            company: `Компания ${index + 1}`,
                            price: price,
                            index: index + 1,
                            fullText: text
                        });
                    });
                } else {
                    // Если не нашли стандартные элементы, ищем любые элементы с ценами
                    const allElements = document.querySelectorAll('*');
                    allElements.forEach((el, index) => {
                        const text = el.textContent?.trim() || '';
                        if (text.length > 2 && text.length < 50 && 
                            text.match(/^\d+\s*₴$|^\d+\s*грн$/)) {
                            results.push({
                                company: `Найдено ${results.length + 1}`,
                                price: text,
                                index: results.length + 1,
                                tag: el.tagName
                            });
                        }
                    });
                }

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

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Браузер закрыт');
        }
    }
}

// Быстрый тест
async function quickTestFixed(plateNumber, months = 12) {
    const extractor = new FixedPeriodExtractor();
    
    try {
        await extractor.init(false); // Видимый режим
        const result = await extractor.extractDataForPeriod(plateNumber, months);
        
        console.log('\n🎯 РЕЗУЛЬТАТ:');
        console.log(JSON.stringify(result, null, 2));
        
        return result;
    } finally {
        await extractor.close();
    }
}

// Экспорт и запуск
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        const plateNumber = args[0] || 'AA1111AA';
        const months = parseInt(args[1]) || 12;
        
        quickTestFixed(plateNumber, months)
            .then(() => process.exit(0))
            .catch(error => {
                console.error('❌ Ошибка:', error);
                process.exit(1);
            });
    } else {
        console.log('🚀 ИСПРАВЛЕННЫЙ ЭКСТРАКТОР');
        console.log('Использование: node fixed-extractor.js AA1111AA 12');
    }
}

module.exports = { FixedPeriodExtractor, quickTestFixed };
