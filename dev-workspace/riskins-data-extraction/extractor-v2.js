/**
 * Улучшенная версия экстрактора с адаптивным поиском результатов
 */

const puppeteer = require('puppeteer');

class RiskinsDataExtractorV2 {
    constructor(options = {}) {
        this.baseUrl = 'https://riskins-insurance.eua.in.ua/';
        this.options = {
            headless: false, // Показываем браузер для отладки
            timeout: 60000,
            ...options
        };
    }

    async getInsuranceOffers(vehicleNumber, period = '12') {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: this.options.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                devtools: !this.options.headless
            });

            const page = await browser.newPage();
            
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            await page.setViewport({ width: 1366, height: 768 });

            console.log('🚀 Открываем страницу Riskins...');
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

            console.log('📝 Заполняем форму...');
            await this.fillForm(page, vehicleNumber);

            console.log('🔍 Отправляем форму...');
            await this.submitForm(page);

            console.log('📊 Ищем результаты...');
            const allOffers = await this.extractOffers(page);

            console.log('📄 Проверяем пагинацию...');
            const additionalOffers = await this.handlePagination(page);
            const finalOffers = [...allOffers, ...additionalOffers];

            console.log(`✅ Найдено ${finalOffers.length} предложений`);
            
            if (!this.options.headless) {
                console.log('💡 Браузер остается открытым для изучения...');
                console.log('⚠️  Закройте браузер вручную когда закончите');
                return {
                    success: true,
                    offers: finalOffers,
                    vehicleNumber,
                    timestamp: new Date().toISOString(),
                    totalOffers: finalOffers.length,
                    debug: true
                };
            }

            return {
                success: true,
                offers: finalOffers,
                vehicleNumber,
                timestamp: new Date().toISOString(),
                totalOffers: finalOffers.length
            };

        } catch (error) {
            console.error('❌ Ошибка при извлечении данных:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            if (browser && this.options.headless) {
                await browser.close();
            }
        }
    }

    async fillForm(page, vehicleNumber) {
        // Ждем загрузки формы
        await page.waitForSelector('#autoNumberSearch', { timeout: 15000 });

        // Очищаем поле и заполняем номер
        await page.click('#autoNumberSearch');
        await page.keyboard.down('Meta'); // Cmd на Mac
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Meta');
        await page.type('#autoNumberSearch', vehicleNumber);

        await page.waitForTimeout(1000);
    }

    async submitForm(page) {
        // Ищем кнопку отправки
        const submitButton = await page.$('#btnCalculateNumber, #btnCalculateSearch');
        if (!submitButton) {
            throw new Error('Кнопка "Розрахувати" не найдена');
        }

        await submitButton.click();

        // Ждем изменения содержимого страницы
        console.log('⏱️  Ждем загрузки результатов...');
        await page.waitForTimeout(5000);

        // Пытаемся дождаться появления любого нового контента
        try {
            await page.waitForFunction(
                () => {
                    // Ищем любые элементы, которые могут содержать результаты
                    const potentialResults = document.querySelectorAll(
                        '[class*="result"], [class*="offer"], [class*="company"], [class*="price"], [class*="insurance"]'
                    );
                    return potentialResults.length > 0;
                },
                { timeout: 10000 }
            );
        } catch (error) {
            console.log('⚠️  Стандартное ожидание не сработало, продолжаем анализ...');
        }
    }

    async extractOffers(page) {
        // Анализируем страницу на предмет результатов
        const pageAnalysis = await page.evaluate(() => {
            const analysis = {
                url: window.location.href,
                title: document.title,
                allElements: [],
                potentialOffers: [],
                priceElements: [],
                companyElements: []
            };

            // Собираем все элементы с потенциально релевантными классами
            const allEls = document.querySelectorAll('*');
            allEls.forEach((el, index) => {
                if (el.className && typeof el.className === 'string') {
                    const className = el.className.toLowerCase();
                    if (className.includes('result') || 
                        className.includes('offer') || 
                        className.includes('company') ||
                        className.includes('price') ||
                        className.includes('insurance') ||
                        className.includes('item') ||
                        className.includes('card')) {
                        
                        analysis.allElements.push({
                            index,
                            tagName: el.tagName,
                            className: el.className,
                            textContent: el.textContent?.substring(0, 100),
                            id: el.id
                        });
                    }
                }
            });

            // Ищем элементы с числами (потенциальные цены)
            const priceRegex = /\d{3,5}\s*(грн|₴)/i;
            document.querySelectorAll('*').forEach((el) => {
                if (el.textContent && priceRegex.test(el.textContent)) {
                    analysis.priceElements.push({
                        tagName: el.tagName,
                        className: el.className,
                        textContent: el.textContent.trim(),
                        id: el.id
                    });
                }
            });

            // Ищем названия страховых компаний
            const companyNames = ['USG', 'ARX', 'КНЯЖА', 'ЕТАЛОН', 'КРЕДО', 'ОРАНТА', 'УПСК'];
            companyNames.forEach(name => {
                const elements = Array.from(document.querySelectorAll('*')).filter(el => 
                    el.textContent && el.textContent.includes(name)
                );
                elements.forEach(el => {
                    analysis.companyElements.push({
                        companyName: name,
                        tagName: el.tagName,
                        className: el.className,
                        textContent: el.textContent.trim(),
                        id: el.id
                    });
                });
            });

            return analysis;
        });

        console.log('🔍 Анализ страницы:');
        console.log(`   URL: ${pageAnalysis.url}`);
        console.log(`   Найдено потенциальных элементов: ${pageAnalysis.allElements.length}`);
        console.log(`   Найдено цен: ${pageAnalysis.priceElements.length}`);
        console.log(`   Найдено компаний: ${pageAnalysis.companyElements.length}`);

        // Выводим найденные цены
        if (pageAnalysis.priceElements.length > 0) {
            console.log('\n💰 Найденные цены:');
            pageAnalysis.priceElements.slice(0, 5).forEach((price, index) => {
                console.log(`   ${index + 1}. ${price.textContent}`);
            });
        }

        // Выводим найденные компании
        if (pageAnalysis.companyElements.length > 0) {
            console.log('\n🏢 Найденные компании:');
            pageAnalysis.companyElements.slice(0, 5).forEach((company, index) => {
                console.log(`   ${index + 1}. ${company.companyName} - ${company.textContent.substring(0, 50)}...`);
            });
        }

        // Формируем предложения из найденных данных
        const offers = [];
        
        // Простая логика: объединяем компании с ценами
        pageAnalysis.companyElements.forEach((company, index) => {
            if (index < pageAnalysis.priceElements.length) {
                const price = pageAnalysis.priceElements[index];
                const priceValue = parseInt(price.textContent.replace(/[^\d]/g, '')) || 0;
                
                offers.push({
                    id: `offer_${index + 1}`,
                    companyName: company.companyName,
                    price: priceValue,
                    currency: 'грн',
                    rating: 5,
                    status: 'Доступно',
                    features: [],
                    debug: {
                        companyElement: company.textContent.substring(0, 50),
                        priceElement: price.textContent
                    }
                });
            }
        });

        return offers;
    }

    async handlePagination(page) {
        const additionalOffers = [];
        
        try {
            // Ищем кнопку "Показать больше" различными способами
            const moreButtonSelectors = [
                'button:contains("більше")',
                'button:contains("больше")',
                '.show-more',
                '.load-more',
                '[class*="more"]',
                'button[class*="more"]'
            ];

            for (const selector of moreButtonSelectors) {
                const moreButton = await page.$(selector);
                if (moreButton) {
                    console.log(`🔄 Найдена кнопка пагинации: ${selector}`);
                    await moreButton.click();
                    await page.waitForTimeout(3000);
                    
                    const newOffers = await this.extractOffers(page);
                    additionalOffers.push(...newOffers);
                    break;
                }
            }
        } catch (error) {
            console.log('⚠️  Пагинация не найдена или не работает');
        }
        
        return additionalOffers;
    }
}

// Пример использования
async function testV2() {
    console.log('🧪 Тестируем улучшенную версию экстрактора...\n');
    
    const extractor = new RiskinsDataExtractorV2({
        headless: false // Показываем браузер
    });
    
    const result = await extractor.getInsuranceOffers('AA1234AA');
    
    if (result.success) {
        console.log('\n✅ Результат:');
        console.log(JSON.stringify(result, null, 2));
    } else {
        console.log('\n❌ Ошибка:', result.error);
    }
}

if (require.main === module) {
    testV2();
}

module.exports = RiskinsDataExtractorV2;
