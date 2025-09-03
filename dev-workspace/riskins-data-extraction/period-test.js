/**
 * ТЕСТ ЭКСТРАКТОРА С РАЗНЫМИ ПЕРИОДАМИ СТРАХОВАНИЯ
 * Сравнение цен на 6 и 12 месяцев
 */

const puppeteer = require('puppeteer');

class PeriodTestExtractor {
    constructor(options = {}) {
        this.baseUrl = 'https://riskins-insurance.eua.in.ua/';
        this.options = {
            headless: false, // Включаем визуальный режим для отладки
            timeout: 30000,
            ...options
        };
    }

    async testInsurancePeriods(vehicleNumber, periods = [6, 12]) {
        console.log(`🧪 ТЕСТИРОВАНИЕ ПЕРИОДОВ СТРАХОВАНИЯ для ${vehicleNumber}`);
        console.log('═'.repeat(60));
        
        const results = [];
        
        for (const monthsPeriod of periods) {
            console.log(`\n📅 Тестируем период: ${monthsPeriod} месяцев`);
            console.log('─'.repeat(50));
            
            const result = await this.getOffersForPeriod(vehicleNumber, monthsPeriod);
            results.push({
                period: monthsPeriod,
                ...result
            });
            
            // Пауза между тестами
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        return this.compareResults(results);
    }

    async getOffersForPeriod(vehicleNumber, months) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: this.options.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: null
            });

            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

            console.log('🚀 Открываем Riskins Insurance...');
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

            console.log('📝 Заполняем номер:', vehicleNumber);
            await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
            await page.click('#autoNumberSearch');
            await page.keyboard.down('Meta');
            await page.keyboard.press('KeyA');
            await page.keyboard.up('Meta');
            await page.type('#autoNumberSearch', vehicleNumber);

            console.log(`📅 Выбираем период: ${months} месяцев`);
            await this.selectInsurancePeriod(page, months);

            console.log('🔍 Отправляем форму...');
            const submitButton = await page.$('#btnCalculateNumber, #btnCalculateSearch');
            if (!submitButton) {
                throw new Error('Кнопка расчета не найдена');
            }
            await submitButton.click();

            console.log('⏱️  Ждем загрузки результатов...');
            await page.waitForTimeout(15000); // Увеличиваем время ожидания

            console.log('📊 Извлекаем данные...');
            const offers = await this.extractInsuranceData(page);

            console.log(`✅ Найдено ${offers.length} предложений для ${months} месяцев`);

            return {
                success: true,
                vehicleNumber,
                months,
                offers,
                totalOffers: offers.length,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Ошибка для ${months} месяцев:`, error.message);
            return {
                success: false,
                months,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async selectInsurancePeriod(page, months) {
        try {
            // Ищем поле выбора периода - попробуем разные селекторы
            const periodSelectors = [
                'select[name*="period"]',
                'select[name*="month"]',
                'select[name*="срок"]',
                '.Select select',
                '#insurancePeriod',
                '#period',
                '[id*="period"]',
                '[name*="period"]'
            ];

            let periodField = null;
            for (const selector of periodSelectors) {
                try {
                    periodField = await page.$(selector);
                    if (periodField) {
                        console.log(`✅ Найден селектор периода: ${selector}`);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }

            if (periodField) {
                // Выбираем период
                const value = months === 6 ? '6' : '12';
                await page.select(await page.evaluate(el => el.getAttribute('name') || el.getAttribute('id'), periodField), value);
                console.log(`✅ Выбран период: ${months} месяцев`);
            } else {
                // Если не нашли селект, попробуем найти радио-кнопки или другие элементы
                console.log('🔍 Ищем альтернативные способы выбора периода...');
                
                const periodTexts = [`${months} мес`, `${months} месяц`, months.toString()];
                for (const text of periodTexts) {
                    try {
                        const element = await page.$x(`//*[contains(text(), '${text}')]`);
                        if (element.length > 0) {
                            await element[0].click();
                            console.log(`✅ Выбран период через текст: ${text}`);
                            return;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                console.log('⚠️  Селектор периода не найден, используем значение по умолчанию');
            }
        } catch (error) {
            console.log('⚠️  Ошибка при выборе периода:', error.message);
        }
    }

    async extractInsuranceData(page) {
        return await page.evaluate(() => {
            const offers = [];
            const tableRows = document.querySelectorAll('table tr, .Table tr');
            
            tableRows.forEach((row, index) => {
                const rowText = row.textContent;
                
                if (!rowText || rowText.includes('Ціна') || rowText.includes('Компанія')) {
                    return;
                }

                const priceCell = row.querySelector('.Table__cell_price, td[class*="price"], .price');
                
                if (priceCell || rowText.includes('грн')) {
                    let currentPrice = 0;
                    let oldPrice = null;
                    
                    const priceText = priceCell ? priceCell.textContent : rowText;
                    const priceMatch = priceText.match(/(\d{3,5})\s*грн/g);
                    
                    if (priceMatch) {
                        const prices = priceMatch.map(p => parseInt(p.replace(/\D/g, '')));
                        currentPrice = Math.min(...prices);
                        if (prices.length > 1) {
                            oldPrice = Math.max(...prices);
                        }
                    }

                    let discount = null;
                    const discountMatch = rowText.match(/(\d+)%/);
                    if (discountMatch) {
                        discount = parseInt(discountMatch[1]);
                    }

                    let companyName = `Компания ${offers.length + 1}`;
                    const companyPatterns = {
                        'USG': /USG/i,
                        'ARX': /ARX/i,
                        'КНЯЖА': /КНЯЖА/i,
                        'ЕТАЛОН': /ЕТАЛОН/i,
                        'КРЕДО': /КРЕДО/i,
                        'ОРАНТА': /ОРАНТА/i,
                        'УПСК': /УПСК/i,
                        'PZU': /PZU/i,
                        'УНІКА': /УНІКА/i,
                        'ІНГО': /ІНГО/i
                    };

                    for (const [company, pattern] of Object.entries(companyPatterns)) {
                        if (pattern.test(rowText)) {
                            companyName = company;
                            break;
                        }
                    }

                    if (currentPrice > 0) {
                        offers.push({
                            id: `riskins_${Date.now()}_${index}`,
                            companyName,
                            price: currentPrice,
                            oldPrice,
                            discount,
                            currency: 'грн',
                            status: 'Доступно',
                            source: 'Riskins Insurance'
                        });
                    }
                }
            });

            return offers;
        });
    }

    compareResults(results) {
        console.log('\n📊 СРАВНЕНИЕ РЕЗУЛЬТАТОВ ПО ПЕРИОДАМ');
        console.log('═'.repeat(60));
        
        const comparison = {
            vehicleNumber: results[0]?.vehicleNumber,
            timestamp: new Date().toISOString(),
            periods: results,
            analysis: {}
        };

        const successful = results.filter(r => r.success && r.offers.length > 0);
        
        if (successful.length >= 2) {
            const period6 = successful.find(r => r.months === 6);
            const period12 = successful.find(r => r.months === 12);
            
            if (period6 && period12) {
                // Сравниваем средние цены
                const avg6 = period6.offers.reduce((sum, o) => sum + o.price, 0) / period6.offers.length;
                const avg12 = period12.offers.reduce((sum, o) => sum + o.price, 0) / period12.offers.length;
                
                // Находим минимальные цены
                const min6 = Math.min(...period6.offers.map(o => o.price));
                const min12 = Math.min(...period12.offers.map(o => o.price));
                
                comparison.analysis = {
                    averagePrices: {
                        month6: Math.round(avg6),
                        month12: Math.round(avg12),
                        difference: Math.round(avg12 - avg6),
                        percentDifference: Math.round(((avg12 - avg6) / avg6) * 100)
                    },
                    minimumPrices: {
                        month6: min6,
                        month12: min12,
                        difference: min12 - min6,
                        percentDifference: Math.round(((min12 - min6) / min6) * 100)
                    },
                    offersCount: {
                        month6: period6.offers.length,
                        month12: period12.offers.length
                    }
                };
                
                console.log('\n💰 АНАЛИЗ ЦЕН:');
                console.log('─'.repeat(40));
                console.log(`6 месяцев - средняя: ${Math.round(avg6)}₴, минимум: ${min6}₴`);
                console.log(`12 месяцев - средняя: ${Math.round(avg12)}₴, минимум: ${min12}₴`);
                console.log(`Разница в средней цене: ${Math.round(avg12 - avg6)}₴ (${Math.round(((avg12 - avg6) / avg6) * 100)}%)`);
                console.log(`Разница в минимальной цене: ${min12 - min6}₴ (${Math.round(((min12 - min6) / min6) * 100)}%)`);
            }
        }
        
        return comparison;
    }
}

// Запуск тестирования
async function runPeriodTest() {
    const extractor = new PeriodTestExtractor({ headless: true });
    
    console.log('🧪 ЗАПУСК ТЕСТИРОВАНИЯ ПЕРИОДОВ СТРАХОВАНИЯ\n');
    
    const testNumber = 'AA1234AA';
    const periods = [6, 12];
    
    const results = await extractor.testInsurancePeriods(testNumber, periods);
    
    console.log('\n📋 ИТОГОВЫЕ РЕЗУЛЬТАТЫ:');
    console.log('═'.repeat(60));
    console.log(JSON.stringify(results, null, 2));
    
    console.log('\n🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!');
}

// Экспорт
module.exports = PeriodTestExtractor;

// Запуск тестов
if (require.main === module) {
    runPeriodTest();
}
