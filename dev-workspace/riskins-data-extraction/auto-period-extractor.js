/**
 * АВТОМАТИЧЕСКИЙ ЭКСТРАКТОР С ВЫБОРОМ ПЕРИОДА (6 ИЛИ 12 МЕСЯЦЕВ)
 * Полностью headless режим - браузер не открывается
 */

const puppeteer = require('puppeteer');

class AutoPeriodExtractor {
    constructor(options = {}) {
        this.baseUrl = 'https://riskins-insurance.eua.in.ua/';
        this.options = {
            headless: true,
            timeout: 30000,
            ...options
        };
    }

    async getInsuranceOffers(vehicleNumber, periodMonths = 12) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: this.options.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            await page.setViewport({ width: 1366, height: 768 });

            console.log('🚀 Открываем Riskins Insurance...');
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

            console.log(`📝 Заполняем номер: ${vehicleNumber}`);
            await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
            await page.click('#autoNumberSearch');
            // Правильный способ выделить весь текст
            await page.keyboard.down('Meta');
            await page.keyboard.press('KeyA');
            await page.keyboard.up('Meta');
            await page.type('#autoNumberSearch', vehicleNumber);

            // АВТОМАТИЧЕСКИЙ ВЫБОР ПЕРИОДА
            console.log(`📅 Автоматически выбираем период: ${periodMonths} месяцев`);
            await this.selectPeriod(page, periodMonths);

            console.log('🔍 Отправляем форму...');
            await page.click('#btnCalculateNumber');

            console.log('⏱️ Ждем загрузки результатов...');
            await page.waitForTimeout(5000);

            // Ждем появления результатов
            await page.waitForFunction(() => {
                const tables = document.querySelectorAll('table tr, .Table tr');
                return tables.length > 3; // Должно быть больше чем просто заголовки
            }, { timeout: 15000 });

            console.log('📊 Извлекаем данные страховых предложений...');
            const offers = await this.extractInsuranceData(page);

            console.log(`✅ Успешно извлечено ${offers.length} предложений`);

            // Определяем фактически выбранный период
            const selectedPeriod = await page.evaluate(() => {
                const selects = document.querySelectorAll('select');
                for (const select of selects) {
                    const selectedOption = select.options[select.selectedIndex];
                    if (selectedOption && selectedOption.text.includes('місяц')) {
                        return selectedOption.text.trim();
                    }
                }
                return `${document.querySelector('select') ? 'Период найден' : 'Период не найден'}`;
            });

            return {
                success: true,
                vehicleNumber,
                requestedPeriod: `${periodMonths} месяцев`,
                selectedPeriod,
                offers,
                totalOffers: offers.length,
                timestamp: new Date().toISOString(),
                extractedAt: 'Riskins Insurance Ukraine (Auto Period)'
            };

        } catch (error) {
            console.error('❌ Ошибка:', error.message);
            return {
                success: false,
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
            // Ищем select элемент для периода
            const periodSelector = await page.evaluate(() => {
                const selects = document.querySelectorAll('select');
                for (const select of selects) {
                    // Проверяем есть ли опции с месяцами
                    const hasMonthOptions = Array.from(select.options).some(option => 
                        option.text.includes('місяц') || option.text.includes('month')
                    );
                    if (hasMonthOptions) {
                        return true;
                    }
                }
                return false;
            });

            if (periodSelector) {
                // Выбираем нужный период
                await page.evaluate((targetMonths) => {
                    const selects = document.querySelectorAll('select');
                    for (const select of selects) {
                        const options = Array.from(select.options);
                        const hasMonthOptions = options.some(option => 
                            option.text.includes('місяц') || option.text.includes('month')
                        );
                        
                        if (hasMonthOptions) {
                            // Ищем опцию с нужным количеством месяцев
                            const targetOption = options.find(option => {
                                const text = option.text.toLowerCase();
                                if (targetMonths === 6) {
                                    return text.includes('6') && text.includes('місяц');
                                } else if (targetMonths === 12) {
                                    return text.includes('12') || text.includes('рік') || 
                                           (text.includes('місяц') && !text.includes('6'));
                                }
                                return false;
                            });
                            
                            if (targetOption) {
                                select.value = targetOption.value;
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                                console.log(`Выбран период: ${targetOption.text}`);
                                return true;
                            }
                        }
                    }
                    return false;
                }, months);

                await page.waitForTimeout(1000); // Даем время на обновление
            } else {
                console.log('⚠️ Селектор периода не найден, используется период по умолчанию');
            }
        } catch (error) {
            console.log('⚠️ Ошибка выбора периода:', error.message);
            console.log('📅 Используется период по умолчанию');
        }
    }

    async extractInsuranceData(page) {
        return await page.evaluate(() => {
            const offers = [];

            // Ищем строки таблицы с результатами
            const tableRows = document.querySelectorAll('table tr, .Table tr');
            
            tableRows.forEach((row, index) => {
                const rowText = row.textContent;
                
                // Пропускаем заголовки и пустые строки
                if (!rowText || rowText.includes('Ціна') || rowText.includes('Компанія')) {
                    return;
                }

                // Извлекаем данные из строки
                const priceCell = row.querySelector('.Table__cell_price, td[class*="price"], .price');
                const discountCell = row.querySelector('.Table__discount, .discount');
                
                if (priceCell || rowText.includes('грн')) {
                    // Извлекаем цену
                    let currentPrice = 0;
                    let oldPrice = null;
                    
                    const priceText = priceCell ? priceCell.textContent : rowText;
                    const priceMatch = priceText.match(/(\d{3,5})\s*грн/g);
                    
                    if (priceMatch) {
                        // Если найдены цены
                        const prices = priceMatch.map(p => parseInt(p.replace(/\D/g, '')));
                        currentPrice = Math.min(...prices); // Текущая цена - минимальная
                        if (prices.length > 1) {
                            oldPrice = Math.max(...prices); // Старая цена - максимальная
                        }
                    }

                    // Извлекаем скидку
                    let discount = null;
                    if (discountCell) {
                        const discountMatch = discountCell.textContent.match(/(\d+)%/);
                        if (discountMatch) {
                            discount = parseInt(discountMatch[1]);
                        }
                    }

                    // Определяем название компании
                    let companyName = `Компания ${offers.length + 1}`;
                    const companyKeywords = {
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

                    for (const [company, pattern] of Object.entries(companyKeywords)) {
                        if (pattern.test(rowText)) {
                            companyName = company;
                            break;
                        }
                    }

                    // Фильтр разумных цен
                    if (currentPrice >= 1000 && currentPrice <= 20000) {
                        offers.push({
                            id: `auto_period_${Date.now()}_${index}`,
                            companyName,
                            price: currentPrice,
                            oldPrice,
                            discount,
                            currency: 'грн',
                            rating: 5,
                            status: 'Доступно',
                            features: [],
                            source: 'Riskins Insurance',
                            rawData: rowText.substring(0, 200)
                        });
                    }
                }
            });

            return offers;
        });
    }
}

module.exports = AutoPeriodExtractor;
