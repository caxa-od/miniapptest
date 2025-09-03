/**
 * ОКОНЧАТЕЛЬНО РАБОЧИЙ ЭКСТРАКТОР ПЕРИОДОВ
 * На основе реального мониторинга - точные селекторы найдены!
 */

const puppeteer = require('puppeteer');

class WorkingPeriodExtractor {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async init(headless = true) {
        console.log(`🚀 Инициализация (headless: ${headless})...`);
        
        this.browser = await puppeteer.launch({
            headless: headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1366, height: 768 });
    }

    async selectPeriod(months) {
        if (months === 12) {
            console.log('🕒 Используем период по умолчанию (12 месяцев)');
            return true;
        }

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

    async extractData(plateNumber, months) {
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

            console.log('⏳ Ждем появления результатов...');
            // Ждем появления таблицы с результатами (найдено мониторингом)
            await this.page.waitForSelector('.Table__cell', { timeout: 45000 });
            
            // Дополнительное время для полной загрузки всех результатов
            await this.page.waitForTimeout(3000);

            console.log('📊 Извлекаем данные из таблицы...');
            const offers = await this.page.evaluate(() => {
                const results = [];

                // Ищем все строки таблицы с ценами
                const rows = document.querySelectorAll('.Table__row');
                
                rows.forEach((row, index) => {
                    try {
                        // Ищем цену в строке - должна быть в формате "XXXX грн"
                        const priceElements = row.querySelectorAll('.Table__cell');
                        let price = 'Не найдена';
                        let company = `Компания ${index + 1}`;

                        // Ищем ячейку с ценой
                        priceElements.forEach(cell => {
                            const text = cell.textContent.trim();
                            
                            // Ищем основную цену (например "4015 грн")
                            const priceMatch = text.match(/(\d{4,5})\s*грн/);
                            if (priceMatch && !text.includes('+')) {
                                price = priceMatch[1] + '₴';
                            }
                            
                            // Пытаемся найти название компании
                            if (text.length > 5 && text.length < 50 && 
                                !text.includes('грн') && !text.includes('%') &&
                                !text.includes('см3') && !text.includes('Змінити')) {
                                company = text;
                            }
                        });

                        // Также проверяем span внутри discount элементов
                        const discountSpans = row.querySelectorAll('.Table__discount span');
                        discountSpans.forEach(span => {
                            const text = span.textContent.trim();
                            const priceMatch = text.match(/^(\d{4,5})\s*грн$/);
                            if (priceMatch) {
                                price = priceMatch[1] + '₴';
                            }
                        });

                        if (price !== 'Не найдена') {
                            results.push({
                                company: company,
                                price: price,
                                index: results.length + 1
                            });
                        }

                    } catch (error) {
                        console.error(`Ошибка обработки строки ${index}:`, error);
                    }
                });

                // Дополнительный поиск по всем элементам с классом Table__cell
                const allCells = document.querySelectorAll('.Table__cell');
                const foundPrices = new Set();
                
                allCells.forEach(cell => {
                    const text = cell.textContent.trim();
                    const priceMatch = text.match(/^(\d{4,5})\s*грн$/);
                    if (priceMatch && !foundPrices.has(priceMatch[1])) {
                        foundPrices.add(priceMatch[1]);
                        
                        // Если это цена которую мы еще не добавили
                        const priceValue = priceMatch[1] + '₴';
                        if (!results.some(r => r.price === priceValue)) {
                            results.push({
                                company: `Предложение ${results.length + 1}`,
                                price: priceValue,
                                index: results.length + 1
                            });
                        }
                    }
                });

                return results;
            });

            console.log(`✅ Найдено ${offers.length} предложений для ${months} месяцев:`);
            offers.forEach((offer) => {
                console.log(`   ${offer.index}. ${offer.company}: ${offer.price}`);
            });

            // Вычисляем статистику
            const prices = offers.map(o => parseInt(o.price.replace('₴', ''))).filter(p => p > 0);
            const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b) / prices.length) : 0;
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

            console.log(`📊 Статистика: мин=${minPrice}₴, макс=${maxPrice}₴, среднее=${avgPrice}₴`);

            return {
                success: true,
                plateNumber: plateNumber,
                period: `${months} месяцев`,
                offersCount: offers.length,
                offers: offers,
                statistics: {
                    avgPrice: avgPrice,
                    minPrice: minPrice,
                    maxPrice: maxPrice
                },
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

    async comparePeriods(plateNumber, headless = true) {
        console.log(`\n🔄 СРАВНЕНИЕ ПЕРИОДОВ ДЛЯ ${plateNumber}`);
        console.log('=' .repeat(60));

        await this.init(headless);

        const results = {};

        try {
            // Извлекаем данные для 6 месяцев
            results.period6 = await this.extractData(plateNumber, 6);
            
            // Пауза между запросами
            await this.page.waitForTimeout(2000);
            
            // Извлекаем данные для 12 месяцев
            results.period12 = await this.extractData(plateNumber, 12);

            // Анализ результатов
            console.log('\n📊 СРАВНИТЕЛЬНЫЙ АНАЛИЗ:');
            console.log('=' .repeat(40));

            if (results.period6.success && results.period12.success) {
                console.log('✅ Оба периода успешно обработаны');
                
                const avg6 = results.period6.statistics.avgPrice;
                const avg12 = results.period12.statistics.avgPrice;
                const diff = avg12 - avg6;
                const diffPercent = avg6 > 0 ? Math.round((diff / avg6) * 100) : 0;

                console.log(`\n💰 Средние цены:`);
                console.log(`   6 месяцев:  ${avg6}₴`);
                console.log(`   12 месяцев: ${avg12}₴`);
                console.log(`   Разница:    ${diff}₴ (${diffPercent > 0 ? '+' : ''}${diffPercent}%)`);

                results.comparison = {
                    avgPrice6: avg6,
                    avgPrice12: avg12,
                    difference: diff,
                    differencePercent: diffPercent,
                    recommendation: diff > 0 ? 
                        `12-месячная страховка дороже на ${diff}₴ (${diffPercent}%)` :
                        `6-месячная страховка дороже на ${Math.abs(diff)}₴ (${Math.abs(diffPercent)}%)`
                };
            } else {
                console.log('❌ Ошибка в одном или обоих периодах');
            }

        } finally {
            await this.close();
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

// Быстрый тест одного периода
async function quickTest(plateNumber, months = 6, headless = false) {
    const extractor = new WorkingPeriodExtractor();
    
    try {
        await extractor.init(headless);
        const result = await extractor.extractData(plateNumber, months);
        return result;
    } finally {
        await extractor.close();
    }
}

// Полное сравнение периодов
async function fullComparison(plateNumber, headless = true) {
    const extractor = new WorkingPeriodExtractor();
    const result = await extractor.comparePeriods(plateNumber, headless);
    return result;
}

// Экспорт и запуск
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
        const plateNumber = args[args.indexOf('--test') + 1] || 'AA1111AA';
        const months = parseInt(args[args.indexOf('--months') + 1]) || 6;
        
        console.log(`🧪 ТЕСТ ${months} МЕСЯЦЕВ ДЛЯ ${plateNumber}`);
        quickTest(plateNumber, months, false)
            .then(result => {
                console.log('\n🎯 РЕЗУЛЬТАТ:');
                console.log(JSON.stringify(result, null, 2));
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Ошибка:', error);
                process.exit(1);
            });
            
    } else if (args.includes('--compare')) {
        const plateNumber = args[args.indexOf('--compare') + 1] || 'AA1111AA';
        
        console.log(`🔄 СРАВНЕНИЕ ПЕРИОДОВ ДЛЯ ${plateNumber}`);
        fullComparison(plateNumber, true)
            .then(result => {
                console.log('\n🎯 ПОЛНОЕ СРАВНЕНИЕ:');
                console.log(JSON.stringify(result, null, 2));
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Ошибка:', error);
                process.exit(1);
            });
            
    } else {
        console.log('🚀 РАБОЧИЙ ЭКСТРАКТОР ПЕРИОДОВ');
        console.log('');
        console.log('Использование:');
        console.log('  node working-extractor.js --test AA1111AA --months 6');
        console.log('  node working-extractor.js --compare AA1111AA');
    }
}

module.exports = { WorkingPeriodExtractor, quickTest, fullComparison };
