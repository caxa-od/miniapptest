/**
 * УПРОЩЕННЫЙ ТЕСТ ПЕРИОДОВ - БЕЗ ОЖИДАНИЯ ENTER
 * Просто ждет появления результатов после ручного выбора
 */

const puppeteer = require('puppeteer');

async function simplePeriodTest() {
    console.log('🎮 УПРОЩЕННЫЙ ТЕСТ ПЕРИОДОВ СТРАХОВАНИЯ');
    console.log('═'.repeat(50));
    console.log('📝 Инструкции:');
    console.log('1. Выберите период в dropdown');
    console.log('2. Нажмите "Розрахувати"');
    console.log('3. Скрипт автоматически извлечет результаты');
    console.log('');

    const results = {};

    // Тест 1: Текущие настройки (какой период выбран)
    console.log('📅 ТЕСТ: ИЗВЛЕЧЕНИЕ РЕЗУЛЬТАТОВ');
    console.log('─'.repeat(40));
    
    const browser = await puppeteer.launch({
        headless: false, // Визуальный режим
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

        console.log('🚀 Открываем сайт...');
        await page.goto('https://riskins-insurance.eua.in.ua/', { 
            waitUntil: 'networkidle2' 
        });

        console.log('📝 Заполняем номер AA1234AA...');
        await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
        await page.click('#autoNumberSearch');
        await page.type('#autoNumberSearch', 'AA1234AA');

        console.log('🎯 ВЫБЕРИТЕ ПЕРИОД И НАЖМИТЕ "РОЗРАХУВАТИ"');
        console.log('⏱️  Скрипт будет ждать появления результатов...');

        // Ждем появления результатов (таблицы с ценами)
        await page.waitForFunction(() => {
            // Ищем элементы с ценами в гривнах
            const priceElements = document.querySelectorAll('*');
            let foundPrices = 0;
            
            priceElements.forEach(el => {
                if (el.textContent.includes('грн') && el.textContent.match(/\d{3,5}/)) {
                    foundPrices++;
                }
            });
            
            return foundPrices >= 3; // Ждем минимум 3 элемента с ценами
        }, { timeout: 60000 }); // Увеличиваем таймаут до 60 секунд

        console.log('✅ Результаты загружены! Извлекаем данные...');

        // Определяем выбранный период
        const selectedPeriod = await page.evaluate(() => {
            // Ищем select с периодом
            const selects = document.querySelectorAll('select');
            for (const select of selects) {
                const options = Array.from(select.options);
                const selectedOption = options.find(opt => opt.selected);
                if (selectedOption && (selectedOption.text.includes('місяц') || 
                    selectedOption.text.includes('month') || selectedOption.text.includes('мес'))) {
                    return selectedOption.text.trim();
                }
            }
            return 'Неизвестно';
        });

        // Извлекаем результаты
        const offers = await page.evaluate(() => {
            const results = [];
            const rows = document.querySelectorAll('table tr, .Table tr');
            
            rows.forEach((row, index) => {
                const text = row.textContent;
                if (text.includes('грн') && !text.includes('Ціна') && !text.includes('Компанія')) {
                    const priceCell = row.querySelector('.Table__cell_price, td[class*="price"], .price');
                    const priceText = priceCell ? priceCell.textContent : text;
                    
                    // Извлекаем цены
                    const priceMatches = priceText.match(/(\d{3,5})\s*грн/g);
                    if (priceMatches) {
                        const prices = priceMatches.map(p => parseInt(p.replace(/\D/g, '')));
                        const currentPrice = Math.min(...prices);
                        const oldPrice = prices.length > 1 ? Math.max(...prices) : null;
                        
                        // Извлекаем скидку
                        const discountMatch = text.match(/(\d+)%/);
                        const discount = discountMatch ? parseInt(discountMatch[1]) : null;
                        
                        // Определяем компанию
                        let companyName = `Компания ${results.length + 1}`;
                        const companies = ['USG', 'ARX', 'КНЯЖА', 'ЕТАЛОН', 'КРЕДО', 'ОРАНТА', 'УПСК', 'PZU', 'УНІКА', 'ІНГО'];
                        for (const company of companies) {
                            if (text.includes(company)) {
                                companyName = company;
                                break;
                            }
                        }
                        
                        results.push({
                            companyName,
                            price: currentPrice,
                            oldPrice,
                            discount,
                            currency: 'грн',
                            rawText: text.substring(0, 150)
                        });
                    }
                }
            });
            
            return results;
        });

        console.log('\n📊 РЕЗУЛЬТАТЫ:');
        console.log('═'.repeat(40));
        console.log(`🎛️  Выбранный период: ${selectedPeriod}`);
        console.log(`📦 Найдено предложений: ${offers.length}`);
        
        if (offers.length > 0) {
            console.log('\n💰 ЦЕНЫ:');
            offers.forEach((offer, i) => {
                console.log(`${i + 1}. ${offer.companyName}: ${offer.price}₴`);
                if (offer.oldPrice) {
                    console.log(`   Была: ${offer.oldPrice}₴ (скидка ${offer.discount}%)`);
                }
            });
            
            const minPrice = Math.min(...offers.map(o => o.price));
            const maxPrice = Math.max(...offers.map(o => o.price));
            const avgPrice = Math.round(offers.reduce((s, o) => s + o.price, 0) / offers.length);
            
            console.log(`\n📈 СТАТИСТИКА:`);
            console.log(`   Минимум: ${minPrice}₴`);
            console.log(`   Максимум: ${maxPrice}₴`);
            console.log(`   Среднее: ${avgPrice}₴`);
            
            // Сохраняем результаты в JSON
            const result = {
                selectedPeriod,
                timestamp: new Date().toISOString(),
                vehicleNumber: 'AA1234AA',
                totalOffers: offers.length,
                minPrice,
                maxPrice,
                avgPrice,
                offers
            };
            
            console.log('\n📋 JSON РЕЗУЛЬТАТ:');
            console.log(JSON.stringify(result, null, 2));
            
        } else {
            console.log('❌ Предложения не найдены');
        }
        
        console.log('\n🎯 РЕКОМЕНДАЦИЯ:');
        console.log('─'.repeat(30));
        console.log('1. Попробуйте выбрать другой период');
        console.log('2. Запустите скрипт еще раз');
        console.log('3. Сравните результаты');
        
        console.log('\n🔍 Браузер остается открытым для анализа...');
        console.log('⏸️  Закройте браузер когда закончите');
        
        // Ждем 2 минуты для анализа
        await page.waitForTimeout(120000);

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        await browser.close();
    }
    
    console.log('\n🎉 ТЕСТ ЗАВЕРШЕН!');
}

simplePeriodTest();
