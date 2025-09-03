/**
 * УЛУЧШЕННЫЙ ЭКСТРАКТОР С ВЫБОРОМ ПЕРИОДА СТРАХОВАНИЯ
 * Основан на найденном поле "Період дії"
 */

const puppeteer = require('puppeteer');

class PeriodAwareExtractor {
    constructor(options = {}) {
        this.baseUrl = 'https://riskins-insurance.eua.in.ua/';
        this.options = {
            headless: true,
            timeout: 30000,
            ...options
        };
    }

    async getInsuranceQuotes(vehicleNumber, periodMonths = 12) {
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

            console.log(`📅 Выбираем период: ${periodMonths} месяцев`);
            await this.selectPeriod(page, periodMonths);

            console.log('🔍 Отправляем форму...');
            const submitButton = await page.$('#btnCalculateNumber');
            if (!submitButton) {
                throw new Error('Кнопка расчета не найдена');
            }
            await submitButton.click();

            console.log('⏱️  Ждем загрузки результатов...');
            await page.waitForTimeout(15000);

            console.log('📊 Извлекаем данные...');
            const offers = await this.extractOffers(page);

            return {
                success: true,
                vehicleNumber,
                periodMonths,
                offers,
                totalOffers: offers.length,
                timestamp: new Date().toISOString(),
                source: 'Riskins Insurance Ukraine'
            };

        } catch (error) {
            console.error('❌ Ошибка:', error.message);
            return {
                success: false,
                vehicleNumber,
                periodMonths,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async selectPeriod(page, months) {
        try {
            // Возможные селекторы для поля периода
            const periodSelectors = [
                'select[name*="period"]',
                'select[name*="Period"]',
                'select[name*="період"]',
                'select[name*="месяц"]',
                'select[name*="місяц"]',
                '#period',
                '#insurancePeriod',
                '[id*="period"]',
                '[name*="period"]',
                '.Select select',
                'select'
            ];

            let periodSelected = false;

            for (const selector of periodSelectors) {
                try {
                    const selectElement = await page.$(selector);
                    if (selectElement) {
                        // Получаем все опции
                        const options = await page.evaluate((sel) => {
                            const element = document.querySelector(sel);
                            if (!element) return [];
                            return Array.from(element.options).map(opt => ({
                                value: opt.value,
                                text: opt.textContent.trim()
                            }));
                        }, selector);

                        console.log(`🎛️  Найден селект: ${selector}`);
                        console.log(`📋 Опции: ${options.map(o => `"${o.text}"`).join(', ')}`);

                        // Ищем подходящую опцию для нужного периода
                        const targetOption = this.findPeriodOption(options, months);
                        
                        if (targetOption) {
                            await page.select(selector, targetOption.value);
                            console.log(`✅ Выбран период: "${targetOption.text}" (${months} мес)`);
                            periodSelected = true;
                            break;
                        }
                    }
                } catch (e) {
                    continue;
                }
            }

            if (!periodSelected) {
                // Пробуем найти через текст
                console.log('🔍 Ищем период через текст...');
                const periodTexts = [
                    `${months} місяців`,
                    `${months} месяцев`,
                    `${months} мес`,
                    months.toString()
                ];

                for (const text of periodTexts) {
                    try {
                        const xpath = `//*[contains(text(), '${text}')]`;
                        const elements = await page.$x(xpath);
                        if (elements.length > 0) {
                            await elements[0].click();
                            console.log(`✅ Выбран период через текст: "${text}"`);
                            periodSelected = true;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
            }

            if (!periodSelected) {
                console.log('⚠️  Не удалось найти селектор периода, используем значение по умолчанию');
            }

        } catch (error) {
            console.log('⚠️  Ошибка при выборе периода:', error.message);
        }
    }

    findPeriodOption(options, targetMonths) {
        // Ищем опцию, которая соответствует нужному периоду
        for (const option of options) {
            const text = option.text.toLowerCase();
            
            // Проверяем точное совпадение
            if (text.includes(`${targetMonths} місяц`) || 
                text.includes(`${targetMonths} месяц`) ||
                text.includes(`${targetMonths} мес`)) {
                return option;
            }
            
            // Для 6 месяцев ищем также "півроку"
            if (targetMonths === 6 && (text.includes('півроку') || text.includes('полгода'))) {
                return option;
            }
            
            // Для 12 месяцев ищем также "рік", "год"
            if (targetMonths === 12 && (text.includes('рік') || text.includes('год') || text.includes('year'))) {
                return option;
            }
        }
        
        return null;
    }

    async extractOffers(page) {
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

    async comparePeriods(vehicleNumber, periods = [6, 12]) {
        console.log(`🔄 СРАВНЕНИЕ ПЕРИОДОВ для ${vehicleNumber}`);
        console.log('═'.repeat(50));
        
        const results = [];
        
        for (const period of periods) {
            console.log(`\n📅 Получаем данные для ${period} месяцев...`);
            const result = await this.getInsuranceQuotes(vehicleNumber, period);
            results.push(result);
            
            // Пауза между запросами
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        return this.analyzeComparison(results);
    }

    analyzeComparison(results) {
        const successful = results.filter(r => r.success && r.offers.length > 0);
        
        if (successful.length < 2) {
            return {
                success: false,
                message: 'Недостаточно данных для сравнения',
                results
            };
        }

        const analysis = {
            success: true,
            vehicleNumber: results[0].vehicleNumber,
            comparison: successful.map(result => ({
                period: result.periodMonths,
                totalOffers: result.totalOffers,
                minPrice: Math.min(...result.offers.map(o => o.price)),
                maxPrice: Math.max(...result.offers.map(o => o.price)),
                avgPrice: Math.round(result.offers.reduce((sum, o) => sum + o.price, 0) / result.offers.length),
                offers: result.offers
            })),
            results
        };

        // Добавляем детальное сравнение если есть данные для 6 и 12 месяцев
        const period6 = analysis.comparison.find(c => c.period === 6);
        const period12 = analysis.comparison.find(c => c.period === 12);
        
        if (period6 && period12) {
            analysis.detailed = {
                priceDifference: {
                    min: period12.minPrice - period6.minPrice,
                    max: period12.maxPrice - period6.maxPrice,
                    avg: period12.avgPrice - period6.avgPrice
                },
                percentDifference: {
                    min: Math.round(((period12.minPrice - period6.minPrice) / period6.minPrice) * 100),
                    avg: Math.round(((period12.avgPrice - period6.avgPrice) / period6.avgPrice) * 100)
                }
            };
        }

        return analysis;
    }
}

// Тестирование
async function testPeriodExtractor() {
    console.log('🧪 ТЕСТИРОВАНИЕ ЭКСТРАКТОРА С ВЫБОРОМ ПЕРИОДА\n');
    
    const extractor = new PeriodAwareExtractor({ headless: true });
    
    const vehicleNumber = 'AA1234AA';
    
    // Тест 1: Сравнение периодов
    console.log('📊 Тест 1: Сравнение 6 и 12 месяцев');
    console.log('─'.repeat(50));
    
    const comparison = await extractor.comparePeriods(vehicleNumber, [6, 12]);
    
    if (comparison.success) {
        console.log('\n💰 РЕЗУЛЬТАТЫ СРАВНЕНИЯ:');
        comparison.comparison.forEach(period => {
            console.log(`\n${period.period} месяцев:`);
            console.log(`  📦 Предложений: ${period.totalOffers}`);
            console.log(`  💰 Цены: ${period.minPrice}₴ - ${period.maxPrice}₴`);
            console.log(`  📊 Средняя: ${period.avgPrice}₴`);
        });
        
        if (comparison.detailed) {
            console.log('\n🔍 ДЕТАЛЬНОЕ СРАВНЕНИЕ:');
            console.log(`  Разница в минимальной цене: ${comparison.detailed.priceDifference.min}₴ (${comparison.detailed.percentDifference.min}%)`);
            console.log(`  Разница в средней цене: ${comparison.detailed.priceDifference.avg}₴ (${comparison.detailed.percentDifference.avg}%)`);
        }
    } else {
        console.log('❌ Сравнение не удалось:', comparison.message);
    }
    
    console.log('\n🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!');
}

module.exports = PeriodAwareExtractor;

if (require.main === module) {
    testPeriodExtractor();
}
