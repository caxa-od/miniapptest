/**
 * Решение для извлечения данных из Riskins Insurance с помощью Puppeteer
 * Поскольку API закрытый, используем автоматизацию браузера
 */

const puppeteer = require('puppeteer');

class RiskinsDataExtractor {
    constructor(options = {}) {
        this.baseUrl = 'https://riskins-insurance.eua.in.ua/';
        this.options = {
            headless: true,
            timeout: 30000,
            ...options
        };
    }

    async getInsuranceOffers(vehicleNumber, period = '12') {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: this.options.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            
            // Настройка страницы
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            await page.setViewport({ width: 1366, height: 768 });

            console.log('🚀 Открываем страницу Riskins...');
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

            // Заполняем форму
            console.log('📝 Заполняем форму...');
            await this.fillForm(page, vehicleNumber, period);

            // Отправляем форму и ждем результатов
            console.log('🔍 Отправляем форму...');
            await this.submitForm(page);

            // Извлекаем первую порцию данных
            console.log('📊 Извлекаем данные...');
            let allOffers = await this.extractOffers(page);

            // Обрабатываем пагинацию
            console.log('📄 Проверяем пагинацию...');
            const additionalOffers = await this.handlePagination(page);
            allOffers = [...allOffers, ...additionalOffers];

            console.log(`✅ Найдено ${allOffers.length} предложений`);
            return {
                success: true,
                offers: allOffers,
                vehicleNumber,
                timestamp: new Date().toISOString(),
                totalOffers: allOffers.length
            };

        } catch (error) {
            console.error('❌ Ошибка при извлечении данных:', error);
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

    async fillForm(page, vehicleNumber, period) {
        // Ждем загрузки формы (используем реальные селекторы)
        await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });

        // Заполняем номер автомобиля
        await page.type('#autoNumberSearch', vehicleNumber);

        // Добавляем небольшую задержку для обработки формы
        await page.waitForTimeout(1000);
    }

    async submitForm(page) {
        // Ищем кнопку отправки формы (используем реальные селекторы)
        const submitButton = await page.$('#btnCalculateNumber, #btnCalculateSearch');
        if (!submitButton) {
            throw new Error('Кнопка "Розрахувати" не найдена');
        }

        // Нажимаем кнопку
        await submitButton.click();

        // Ждем появления результатов
        await page.waitForSelector('.insurance-offer, .offer-item, .result-item', { 
            timeout: 15000 
        });

        // Дополнительная задержка для полной загрузки контента
        await page.waitForTimeout(2000);
    }

    async extractOffers(page) {
        return await page.evaluate(() => {
            const offers = [];
            
            // Ищем контейнеры с предложениями (адаптируем селекторы под реальную структуру)
            const offerElements = document.querySelectorAll('.insurance-offer, .offer-item, .result-item, .company-offer');
            
            offerElements.forEach((element, index) => {
                try {
                    // Извлекаем название компании
                    const companyName = element.querySelector('.company-name, .insurer-name, h3, .title')?.textContent?.trim() || `Company_${index + 1}`;
                    
                    // Извлекаем цену
                    const priceElement = element.querySelector('.price, .cost, .amount');
                    const priceText = priceElement?.textContent?.trim() || '';
                    const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;
                    
                    // Извлекаем старую цену (если есть скидка)
                    const oldPriceElement = element.querySelector('.old-price, .original-price, .was-price');
                    const oldPrice = oldPriceElement ? parseInt(oldPriceElement.textContent.replace(/[^\d]/g, '')) : null;
                    
                    // Извлекаем рейтинг
                    const ratingElement = element.querySelector('.rating, .stars');
                    let rating = 5; // По умолчанию
                    if (ratingElement) {
                        const ratingText = ratingElement.textContent;
                        const ratingMatch = ratingText.match(/(\d+)/);
                        rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;
                    }
                    
                    // Извлекаем статус
                    const statusElement = element.querySelector('.status, .conditions, .terms');
                    const status = statusElement?.textContent?.trim() || 'Без обмежень';
                    
                    // Извлекаем логотип
                    const logoElement = element.querySelector('img');
                    const logo = logoElement?.src || '';
                    
                    // Извлекаем ссылку на покупку
                    const buyElement = element.querySelector('a[href*="buy"], .buy-btn, .purchase-btn');
                    const buyUrl = buyElement?.href || '';

                    offers.push({
                        id: `offer_${index + 1}`,
                        companyName,
                        logo,
                        price,
                        oldPrice,
                        currency: 'грн',
                        rating,
                        status,
                        features: [],
                        buyUrl,
                        rawElement: element.outerHTML.substring(0, 200) // Для отладки
                    });
                } catch (error) {
                    console.error('Ошибка при извлечении предложения:', error);
                }
            });
            
            return offers;
        });
    }

    async handlePagination(page) {
        const additionalOffers = [];
        
        try {
            // Ищем кнопку "Показать больше"
            const moreButton = await page.$('.show-more, .load-more, button:contains("більше")');
            
            if (moreButton) {
                console.log('🔄 Найдена кнопка "Показать больше", загружаем дополнительные предложения...');
                
                // Нажимаем кнопку
                await moreButton.click();
                
                // Ждем загрузки новых предложений
                await page.waitForTimeout(3000);
                
                // Извлекаем все предложения заново и отфильтровываем новые
                const allOffersAfterClick = await this.extractOffers(page);
                
                // Возвращаем только новые предложения (простая логика)
                // В реальном проекте лучше сравнивать по ID или другим уникальным полям
                return allOffersAfterClick.slice(5); // Предполагаем, что первые 5 уже были
            }
        } catch (error) {
            console.error('Ошибка при обработке пагинации:', error);
        }
        
        return additionalOffers;
    }
}

// Пример использования
async function example() {
    const extractor = new RiskinsDataExtractor({
        headless: false // Для отладки показываем браузер
    });
    
    const result = await extractor.getInsuranceOffers('AB1234CD');
    console.log(JSON.stringify(result, null, 2));
}

// Экспорт для использования в других модулях
module.exports = RiskinsDataExtractor;

// Запуск примера, если файл выполняется напрямую
if (require.main === module) {
    example();
}
