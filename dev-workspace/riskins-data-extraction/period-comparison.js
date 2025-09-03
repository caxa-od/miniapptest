/**
 * ТОЧНОЕ СРАВНЕНИЕ ЦЕН НА 6 И 12 МЕСЯЦЕВ
 * Ручной контроль каждого этапа
 */

const puppeteer = require('puppeteer');

class PeriodComparison {
    constructor() {
        this.results = {
            month6: null,
            month12: null,
            comparison: null
        };
    }

    async comparePeriods(vehicleNumber = 'AA1234AA') {
        console.log('🎯 ТОЧНОЕ СРАВНЕНИЕ ПЕРИОДОВ СТРАХОВАНИЯ');
        console.log('═'.repeat(60));
        console.log(`🚗 Номер: ${vehicleNumber}`);
        console.log('');

        // Тест 1: 6 месяцев
        console.log('📅 ЭТАП 1: ТЕСТИРУЕМ 6 МЕСЯЦЕВ');
        console.log('─'.repeat(50));
        this.results.month6 = await this.testPeriod(vehicleNumber, 6);
        
        console.log('\n⏸️  Нажмите Enter для продолжения...');
        await this.waitForEnter();

        // Тест 2: 12 месяцев
        console.log('\n📅 ЭТАП 2: ТЕСТИРУЕМ 12 МЕСЯЦЕВ');
        console.log('─'.repeat(50));
        this.results.month12 = await this.testPeriod(vehicleNumber, 12);

        // Сравнение
        console.log('\n📊 ЭТАП 3: СРАВНЕНИЕ РЕЗУЛЬТАТОВ');
        console.log('─'.repeat(50));
        this.compareResults();

        return this.results;
    }

    async testPeriod(vehicleNumber, months) {
        console.log(`🚀 Тестируем ${months} месяцев...`);
        
        const browser = await puppeteer.launch({
            headless: false, // Визуальный режим для контроля
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: null
        });

        try {
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

            console.log('  🌐 Открываем сайт...');
            await page.goto('https://riskins-insurance.eua.in.ua/', { 
                waitUntil: 'networkidle2' 
            });

            console.log(`  📝 Заполняем номер ${vehicleNumber}...`);
            await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
            await page.click('#autoNumberSearch');
            // Правильный способ выделить весь текст
            await page.keyboard.down('Meta');
            await page.keyboard.press('KeyA');
            await page.keyboard.up('Meta');
            await page.type('#autoNumberSearch', vehicleNumber);

            console.log(`  📅 ВЫБЕРИТЕ ${months} МЕСЯЦЕВ в dropdown "Період дії"`);
            console.log('  🎯 После выбора нажмите "Розрахувати"');
            console.log('  ⏸️  Затем нажмите пробел когда увидите результаты...');

            // Ждем нажатия пробела как сигнал что результаты готовы
            await page.waitForFunction(() => {
                return new Promise(resolve => {
                    const handler = (e) => {
                        if (e.code === 'Space') {
                            document.removeEventListener('keydown', handler);
                            resolve(true);
                        }
                    };
                    document.addEventListener('keydown', handler);
                });
            }, { timeout: 120000 }); // 2 минуты на ручные действия

            console.log('  📊 Извлекаем данные...');

            // Определяем выбранный период
            const selectedPeriod = await page.evaluate(() => {
                const selects = document.querySelectorAll('select');
                for (const select of selects) {
                    const selectedOption = select.options[select.selectedIndex];
                    if (selectedOption && selectedOption.text.includes('місяц')) {
                        return selectedOption.text.trim();
                    }
                }
                return 'Неопределено';
            });

            // Извлекаем все предложения
            const offers = await page.evaluate(() => {
                const results = [];
                
                // Ищем все строки таблицы с результатами
                const tableRows = document.querySelectorAll('table tr, .Table tr');
                
                tableRows.forEach((row, index) => {
                    const rowText = row.textContent;
                    
                    // Пропускаем заголовки
                    if (!rowText || rowText.includes('Ціна') || rowText.includes('Компанія') || 
                        rowText.includes('Рейтинг') || rowText.length < 20) {
                        return;
                    }

                    // Ищем цены в гривнах
                    const priceMatches = rowText.match(/(\d{3,5})\s*грн/g);
                    if (priceMatches && priceMatches.length > 0) {
                        // Извлекаем все цены из строки
                        const prices = priceMatches.map(p => parseInt(p.replace(/\D/g, '')));
                        const currentPrice = Math.min(...prices);
                        const oldPrice = prices.length > 1 ? Math.max(...prices) : null;
                        
                        // Ищем скидку
                        const discountMatch = rowText.match(/(\d+)%/);
                        const discount = discountMatch ? parseInt(discountMatch[1]) : null;
                        
                        // Определяем компанию по ключевым словам
                        let companyName = `Компания ${results.length + 1}`;
                        const companyPatterns = {
                            'USG': /USG/i,
                            'ARX': /ARX/i,
                            'КНЯЖА': /(КНЯЖА|KNYAZHA)/i,
                            'ЕТАЛОН': /(ЕТАЛОН|ETALON)/i,
                            'КРЕДО': /(КРЕДО|KREDO)/i,
                            'ОРАНТА': /(ОРАНТА|ORANTA)/i,
                            'УПСК': /УПСК/i,
                            'PZU': /PZU/i,
                            'УНІКА': /(УНІКА|UNIKA)/i,
                            'ІНГО': /(ІНГО|INGO)/i,
                            'ПРОВІДНА': /(ПРОВІДНА|PROVIDNA)/i,
                            'АЛЬФА': /(АЛЬФА|ALFA)/i
                        };

                        for (const [company, pattern] of Object.entries(companyPatterns)) {
                            if (pattern.test(rowText)) {
                                companyName = company;
                                break;
                            }
                        }

                        if (currentPrice > 500) { // Фильтр разумных цен
                            results.push({
                                id: `period_${months}_${index}`,
                                companyName,
                                price: currentPrice,
                                oldPrice,
                                discount,
                                currency: 'грн',
                                rawText: rowText.substring(0, 200),
                                elementType: row.tagName,
                                className: row.className
                            });
                        }
                    }
                });

                return results;
            });

            const result = {
                success: true,
                period: months,
                selectedPeriod,
                vehicleNumber,
                offers,
                totalOffers: offers.length,
                timestamp: new Date().toISOString(),
                statistics: this.calculateStatistics(offers)
            };

            console.log(`  ✅ Найдено ${offers.length} предложений для ${months} месяцев`);
            if (offers.length > 0) {
                console.log(`  💰 Цены: ${offers.map(o => o.price + '₴').join(', ')}`);
                console.log(`  📊 Средняя: ${result.statistics.avgPrice}₴`);
            }

            return result;

        } catch (error) {
            console.error(`  ❌ Ошибка для ${months} месяцев:`, error.message);
            return {
                success: false,
                period: months,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            await browser.close();
        }
    }

    calculateStatistics(offers) {
        if (offers.length === 0) {
            return { minPrice: 0, maxPrice: 0, avgPrice: 0 };
        }

        const prices = offers.map(o => o.price);
        return {
            minPrice: Math.min(...prices),
            maxPrice: Math.max(...prices),
            avgPrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length)
        };
    }

    compareResults() {
        const { month6, month12 } = this.results;

        if (!month6?.success || !month12?.success) {
            console.log('❌ Недостаточно данных для сравнения');
            return;
        }

        if (month6.offers.length === 0 || month12.offers.length === 0) {
            console.log('❌ Нет предложений для сравнения');
            return;
        }

        console.log('\n💰 ДЕТАЛЬНОЕ СРАВНЕНИЕ:');
        console.log('═'.repeat(60));

        // Сравнение по периодам
        console.log(`📅 6 месяцев (${month6.selectedPeriod}):`);
        console.log(`   📦 Предложений: ${month6.totalOffers}`);
        console.log(`   💰 Цены: ${month6.statistics.minPrice}₴ - ${month6.statistics.maxPrice}₴`);
        console.log(`   📊 Средняя: ${month6.statistics.avgPrice}₴`);

        console.log(`\n📅 12 месяцев (${month12.selectedPeriod}):`);
        console.log(`   📦 Предложений: ${month12.totalOffers}`);
        console.log(`   💰 Цены: ${month12.statistics.minPrice}₴ - ${month12.statistics.maxPrice}₴`);
        console.log(`   📊 Средняя: ${month12.statistics.avgPrice}₴`);

        // Анализ различий
        const priceDiff = month12.statistics.avgPrice - month6.statistics.avgPrice;
        const percentDiff = month6.statistics.avgPrice > 0 ? 
            Math.round((priceDiff / month6.statistics.avgPrice) * 100) : 0;

        console.log('\n🔍 АНАЛИЗ РАЗЛИЧИЙ:');
        console.log('─'.repeat(40));
        console.log(`💲 Разница в средней цене: ${priceDiff}₴ (${percentDiff}%)`);
        console.log(`📈 Разница мин. цен: ${month12.statistics.minPrice - month6.statistics.minPrice}₴`);
        console.log(`📈 Разница макс. цен: ${month12.statistics.maxPrice - month6.statistics.maxPrice}₴`);

        if (Math.abs(priceDiff) < 50) {
            console.log('💡 Цены практически одинаковые - период слабо влияет на стоимость');
        } else if (priceDiff > 0) {
            console.log('📈 12 месяцев дороже - есть значимая разница!');
        } else {
            console.log('📉 6 месяцев дороже - неожиданный результат!');
        }

        // Поиск одинаковых компаний
        console.log('\n🏢 СРАВНЕНИЕ ПО КОМПАНИЯМ:');
        console.log('─'.repeat(40));
        
        const companies6 = new Map();
        month6.offers.forEach(offer => {
            companies6.set(offer.companyName, offer.price);
        });

        const companies12 = new Map();
        month12.offers.forEach(offer => {
            companies12.set(offer.companyName, offer.price);
        });

        const commonCompanies = [...companies6.keys()].filter(company => 
            companies12.has(company)
        );

        if (commonCompanies.length > 0) {
            commonCompanies.forEach(company => {
                const price6 = companies6.get(company);
                const price12 = companies12.get(company);
                const diff = price12 - price6;
                console.log(`${company}: ${price6}₴ → ${price12}₴ (${diff > 0 ? '+' : ''}${diff}₴)`);
            });
        } else {
            console.log('❓ Общих компаний не найдено - возможно разные названия');
        }

        // Сохраняем результат сравнения
        this.results.comparison = {
            priceDifference: priceDiff,
            percentDifference: percentDiff,
            commonCompanies: commonCompanies.length,
            conclusion: Math.abs(priceDiff) < 50 ? 'Цены практически одинаковые' : 
                       priceDiff > 0 ? '12 месяцев дороже' : '6 месяцев дороже'
        };

        console.log('\n📋 JSON РЕЗУЛЬТАТ:');
        console.log('═'.repeat(40));
        console.log(JSON.stringify(this.results, null, 2));
    }

    async waitForEnter() {
        return new Promise(resolve => {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on('data', () => {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                resolve();
            });
        });
    }
}

// Запуск сравнения
async function runComparison() {
    const comparator = new PeriodComparison();
    
    console.log('🎯 ЗАПУСК ТОЧНОГО СРАВНЕНИЯ ПЕРИОДОВ');
    console.log('═'.repeat(60));
    console.log('📝 ИНСТРУКЦИИ:');
    console.log('1. Для каждого периода откроется браузер');
    console.log('2. Выберите нужный период в dropdown');
    console.log('3. Нажмите "Розрахувати"');
    console.log('4. Когда увидите результаты - нажмите ПРОБЕЛ');
    console.log('5. Браузер закроется автоматически');
    console.log('');
    console.log('⏸️  Нажмите Enter для начала...');
    
    await comparator.waitForEnter();
    
    const results = await comparator.comparePeriods('AA1234AA');
    
    console.log('\n🎉 СРАВНЕНИЕ ЗАВЕРШЕНО!');
    return results;
}

// Экспорт и запуск
module.exports = PeriodComparison;

if (require.main === module) {
    runComparison();
}
