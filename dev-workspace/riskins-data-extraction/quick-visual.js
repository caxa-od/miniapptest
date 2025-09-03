/**
 * БЫСТРЫЙ ВИЗУАЛЬНЫЙ ТЕСТ ФИНАЛЬНОЙ ВЕРСИИ
 */

const puppeteer = require('puppeteer');

async function quickVisualTest() {
    console.log('🧪 БЫСТРЫЙ ВИЗУАЛЬНЫЙ ТЕСТ');
    console.log('═'.repeat(50));
    
    const browser = await puppeteer.launch({
        headless: false, // ВИЗУАЛЬНЫЙ режим
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    try {
        console.log('🚀 Открываем Riskins Insurance...');
        await page.goto('https://riskins-insurance.eua.in.ua/', { waitUntil: 'networkidle2' });

        console.log('📝 Заполняем номер AA1234AA...');
        await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
        await page.click('#autoNumberSearch');
        await page.keyboard.down('Meta');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Meta');
        await page.type('#autoNumberSearch', 'AA1234AA');

        console.log('🔍 Нажимаем кнопку расчета...');
        const submitButton = await page.$('#btnCalculateNumber');
        if (submitButton) {
            await submitButton.click();
            console.log('✅ Кнопка нажата!');
        } else {
            console.log('❌ Кнопка не найдена');
        }

        console.log('⏱️  Ждем результаты 15 секунд...');
        await page.waitForTimeout(15000);

        console.log('📊 Извлекаем цены...');
        const prices = await page.evaluate(() => {
            const results = [];
            
            // Ищем элементы с ценами
            const priceElements = document.querySelectorAll('.Table__cell_price');
            priceElements.forEach((el, i) => {
                results.push({
                    selector: '.Table__cell_price',
                    index: i,
                    text: el.textContent.trim(),
                    innerHTML: el.innerHTML
                });
            });

            // Ищем альтернативные цены
            const altPrices = document.querySelectorAll('td[class*="price"], .price');
            altPrices.forEach((el, i) => {
                results.push({
                    selector: 'td[class*="price"]/.price',
                    index: i,
                    text: el.textContent.trim(),
                    innerHTML: el.innerHTML
                });
            });

            // Ищем все элементы с "грн"
            const allPrices = document.querySelectorAll('*');
            const grn = [];
            allPrices.forEach(el => {
                if (el.textContent.includes('грн') && el.textContent.match(/\d+/)) {
                    grn.push({
                        tag: el.tagName,
                        className: el.className,
                        text: el.textContent.trim().substring(0, 100)
                    });
                }
            });

            return { specific: results, withGrn: grn.slice(0, 10) };
        });

        console.log('\n💰 НАЙДЕННЫЕ ЦЕНЫ:');
        console.log('─'.repeat(40));
        
        if (prices.specific.length > 0) {
            prices.specific.forEach((price, i) => {
                console.log(`${i + 1}. ${price.selector}:`);
                console.log(`   Текст: "${price.text}"`);
                console.log(`   HTML: ${price.innerHTML.substring(0, 100)}...`);
                console.log('');
            });
        } else {
            console.log('❌ Специфичные селекторы не нашли цены');
        }

        console.log('\n💵 ЭЛЕМЕНТЫ С "грн":');
        console.log('─'.repeat(40));
        prices.withGrn.forEach((item, i) => {
            console.log(`${i + 1}. ${item.tag}.${item.className}:`);
            console.log(`   "${item.text}"`);
            console.log('');
        });

        console.log('\n🎯 РЕКОМЕНДАЦИИ:');
        console.log('─'.repeat(40));
        console.log('1. Проверьте страницу визуально');
        console.log('2. Найдите таблицу с результатами');
        console.log('3. Скопируйте правильные селекторы из DevTools');
        console.log('4. Браузер остается открытым для анализа');

    } catch (error) {
        console.error('❌ Ошибка:', error);
    }

    // НЕ закрываем браузер для визуального анализа
    console.log('\n🔍 Браузер открыт для анализа. Закройте вручную.');
}

quickVisualTest();
