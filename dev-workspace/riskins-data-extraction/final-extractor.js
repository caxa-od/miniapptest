/**
 * ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ ЭКСТРАКТОРА RISKINS INSURANCE
 * Основана на результатах анализа реальной структуры сайта
 */

const puppeteer = require('puppeteer');

class RiskinsExtractorFinal {
    constructor(options = {}) {
        this.baseUrl = 'https://riskins-insurance.eua.in.ua/';
        this.options = {
            headless: true,
            timeout: 30000,
            ...options
        };
    }

    async getInsuranceOffers(vehicleNumber) {
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

            console.log('📝 Заполняем номер:', vehicleNumber);
            await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
            await page.click('#autoNumberSearch');
            await page.keyboard.down('Meta');
            await page.keyboard.press('KeyA');
            await page.keyboard.up('Meta');
            await page.type('#autoNumberSearch', vehicleNumber);

            console.log('🔍 Отправляем форму...');
            const submitButton = await page.$('#btnCalculateNumber, #btnCalculateSearch');
            if (!submitButton) {
                throw new Error('Кнопка расчета не найдена');
            }
            await submitButton.click();

            console.log('⏱️  Ждем загрузки результатов...');
            await page.waitForTimeout(10000);

            console.log('📊 Извлекаем данные страховых предложений...');
            const offers = await this.extractInsuranceData(page);

            console.log(`✅ Успешно извлечено ${offers.length} предложений`);

            return {
                success: true,
                vehicleNumber,
                offers,
                totalOffers: offers.length,
                timestamp: new Date().toISOString(),
                extractedAt: 'Riskins Insurance Ukraine'
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
                    
                    // Ищем известные названия компаний
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

                    // Добавляем предложение если есть цена
                    if (currentPrice > 0) {
                        offers.push({
                            id: `riskins_${Date.now()}_${index}`,
                            companyName,
                            price: currentPrice,
                            oldPrice,
                            discount,
                            currency: 'грн',
                            rating: 5, // По умолчанию
                            status: 'Доступно',
                            features: [],
                            source: 'Riskins Insurance',
                            rawData: rowText.substring(0, 200) // Для отладки
                        });
                    }
                }
            });

            // Если таблица не найдена, пробуем другие селекторы
            if (offers.length === 0) {
                const priceElements = document.querySelectorAll('.Table__cell_price, [class*="price"]');
                priceElements.forEach((el, index) => {
                    const priceText = el.textContent;
                    const priceMatch = priceText.match(/(\d{3,5})/);
                    
                    if (priceMatch) {
                        offers.push({
                            id: `riskins_alt_${Date.now()}_${index}`,
                            companyName: `Предложение ${index + 1}`,
                            price: parseInt(priceMatch[1]),
                            currency: 'грн',
                            rating: 5,
                            status: 'Доступно',
                            source: 'Riskins Insurance (альтернативный парсинг)',
                            rawData: priceText
                        });
                    }
                });
            }

            return offers;
        });
    }
}

// Тестирование
async function testFinalExtractor() {
    console.log('🧪 ТЕСТИРОВАНИЕ ФИНАЛЬНОЙ ВЕРСИИ ЭКСТРАКТОРА\n');
    
    const extractor = new RiskinsExtractorFinal({
        headless: true // Скрытый режим для продакшена
    });
    
    const testNumbers = ['AA1234AA', 'BB5678CC', 'DD9999EE'];
    
    for (const number of testNumbers) {
        console.log(`\n🚗 Тестируем номер: ${number}`);
        console.log('─'.repeat(50));
        
        const result = await extractor.getInsuranceOffers(number);
        
        if (result.success) {
            console.log(`✅ Успешно извлечено ${result.totalOffers} предложений:`);
            
            result.offers.forEach((offer, index) => {
                console.log(`\n${index + 1}. ${offer.companyName}`);
                console.log(`   💰 Цена: ${offer.price} ${offer.currency}`);
                if (offer.oldPrice) {
                    console.log(`   🏷️  Была: ${offer.oldPrice} ${offer.currency}`);
                }
                if (offer.discount) {
                    console.log(`   🎯 Скидка: ${offer.discount}%`);
                }
                console.log(`   📝 Статус: ${offer.status}`);
            });
            
            // Вывод JSON для интеграции
            console.log('\n📋 JSON для интеграции:');
            console.log(JSON.stringify(result, null, 2));
            
        } else {
            console.log(`❌ Ошибка: ${result.error}`);
        }
    }
    
    console.log('\n🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!');
}

// Экспорт
module.exports = RiskinsExtractorFinal;

// Запуск тестов
if (require.main === module) {
    testFinalExtractor();
}
