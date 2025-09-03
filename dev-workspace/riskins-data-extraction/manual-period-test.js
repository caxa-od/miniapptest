/**
 * БЫСТРЫЙ ТЕСТ С РУЧНЫМ ВЫБОРОМ ПЕРИОДА
 * Позволяет вручную выбрать период и сравнить результаты
 */

const puppeteer = require('puppeteer');

async function manualPeriodTest() {
    console.log('🎮 РУЧНОЙ ТЕСТ ВЫБОРА ПЕРИОДА');
    console.log('═'.repeat(50));
    console.log('📝 Инструкции:');
    console.log('1. Сначала проверим 6 месяцев');
    console.log('2. Потом проверим 12 месяцев');
    console.log('3. Сравним результаты');
    console.log('');

    const results = {};

    // Тест 1: 6 месяцев
    console.log('📅 ТЕСТ 1: 6 МЕСЯЦЕВ');
    console.log('─'.repeat(30));
    results.month6 = await testSpecificPeriod(6);
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Тест 2: 12 месяцев  
    console.log('\n📅 ТЕСТ 2: 12 МЕСЯЦЕВ');
    console.log('─'.repeat(30));
    results.month12 = await testSpecificPeriod(12);

    // Сравнение результатов
    console.log('\n📊 СРАВНЕНИЕ РЕЗУЛЬТАТОВ:');
    console.log('═'.repeat(50));
    
    if (results.month6.success && results.month12.success) {
        console.log('6 месяцев:');
        console.log(`  📦 Предложений: ${results.month6.offers.length}`);
        console.log(`  💰 Цены: ${results.month6.offers.map(o => o.price + '₴').join(', ')}`);
        
        console.log('\n12 месяцев:');
        console.log(`  📦 Предложений: ${results.month12.offers.length}`);
        console.log(`  💰 Цены: ${results.month12.offers.map(o => o.price + '₴').join(', ')}`);
        
        // Анализируем разницу
        const avg6 = results.month6.offers.reduce((s, o) => s + o.price, 0) / results.month6.offers.length;
        const avg12 = results.month12.offers.reduce((s, o) => s + o.price, 0) / results.month12.offers.length;
        
        console.log(`\n🔍 АНАЛИЗ:`);
        console.log(`Средняя цена 6 мес: ${Math.round(avg6)}₴`);
        console.log(`Средняя цена 12 мес: ${Math.round(avg12)}₴`);
        console.log(`Разница: ${Math.round(avg12 - avg6)}₴ (${Math.round(((avg12 - avg6) / avg6) * 100)}%)`);
        
        if (Math.abs(avg12 - avg6) < 10) {
            console.log('💡 Цены практически одинаковые - возможно период не влияет');
        } else {
            console.log('✅ Найдена разница в ценах!');
        }
    } else {
        console.log('❌ Не удалось получить данные для сравнения');
    }
    
    console.log('\n🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!');
}

async function testSpecificPeriod(months) {
    console.log(`🚀 Тестируем ${months} месяцев...`);
    
    const browser = await puppeteer.launch({
        headless: false, // Визуальный режим для ручного выбора
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

        console.log('  📝 Заполняем номер AA1234AA...');
        await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
        await page.click('#autoNumberSearch');
        await page.type('#autoNumberSearch', 'AA1234AA');

        console.log(`  📅 ВЫБЕРИТЕ ВРУЧНУЮ ${months} МЕСЯЦЕВ в поле "Період дії"`);
        console.log('  ⏸️  Нажмите Enter когда выберете период...');
        
        // Ждем нажатия Enter
        await page.waitForFunction(() => {
            return new Promise(resolve => {
                const handler = (e) => {
                    if (e.key === 'Enter') {
                        document.removeEventListener('keydown', handler);
                        resolve(true);
                    }
                };
                document.addEventListener('keydown', handler);
            });
        });

        console.log('  ✅ Период выбран, отправляем форму...');
        const submitButton = await page.$('#btnCalculateNumber');
        if (submitButton) {
            await submitButton.click();
        }

        console.log('  ⏱️  Ждем результаты 15 секунд...');
        await page.waitForTimeout(15000);

        console.log('  📊 Извлекаем данные...');
        const offers = await page.evaluate(() => {
            const results = [];
            const rows = document.querySelectorAll('table tr, .Table tr');
            
            rows.forEach(row => {
                const text = row.textContent;
                if (text.includes('грн') && !text.includes('Ціна')) {
                    const priceMatch = text.match(/(\d{3,5})\s*грн/);
                    if (priceMatch) {
                        results.push({
                            price: parseInt(priceMatch[1]),
                            text: text.trim().substring(0, 100)
                        });
                    }
                }
            });
            
            return results;
        });

        console.log(`  ✅ Найдено ${offers.length} предложений`);
        
        return {
            success: true,
            months,
            offers,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error(`  ❌ Ошибка: ${error.message}`);
        return {
            success: false,
            months,
            error: error.message
        };
    } finally {
        await browser.close();
    }
}

manualPeriodTest();
