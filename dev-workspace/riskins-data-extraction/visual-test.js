/**
 * Визуальный тест для отладки процесса заполнения формы
 */

const puppeteer = require('puppeteer');

async function visualTest() {
    console.log('👀 Запускаем визуальный тест...\n');
    
    const browser = await puppeteer.launch({
        headless: false,     // Показываем браузер
        devtools: true,      // DevTools для отладки
        slowMo: 500,        // Замедляем действия для наблюдения
        args: ['--start-maximized']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    try {
        console.log('🌐 Открываем страницу...');
        await page.goto('https://riskins-insurance.eua.in.ua/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        console.log('⏱️  Пауза для наблюдения...');
        await page.waitForTimeout(3000);

        console.log('🔍 Ищем поле для номера автомобиля...');
        await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
        console.log('✅ Поле найдено!');

        console.log('📝 Заполняем номер AA1234AA...');
        await page.type('#autoNumberSearch', 'AA1234AA');

        console.log('⏱️  Пауза после заполнения...');
        await page.waitForTimeout(2000);

        console.log('🔍 Ищем кнопку расчета...');
        const submitButton = await page.$('#btnCalculateNumber, #btnCalculateSearch');
        if (submitButton) {
            console.log('✅ Кнопка найдена!');
            
            console.log('🖱️  Нажимаем кнопку...');
            await submitButton.click();
            
            console.log('⏱️  Ждем результатов...');
            await page.waitForTimeout(5000);
            
            // Попробуем найти любые результаты
            console.log('🔍 Анализируем страницу после отправки...');
            const pageContent = await page.evaluate(() => {
                return {
                    title: document.title,
                    url: window.location.href,
                    hasResults: document.querySelectorAll('.result, .offer, .company, .price').length > 0,
                    allClasses: Array.from(new Set(
                        Array.from(document.querySelectorAll('*'))
                            .map(el => el.className)
                            .filter(className => className && className.includes && 
                                (className.includes('result') || 
                                 className.includes('offer') || 
                                 className.includes('company') ||
                                 className.includes('price') ||
                                 className.includes('insurance')))
                    )).slice(0, 10)
                };
            });
            
            console.log('📊 Результат анализа:');
            console.log(`   URL: ${pageContent.url}`);
            console.log(`   Title: ${pageContent.title}`);
            console.log(`   Найдены результаты: ${pageContent.hasResults}`);
            console.log(`   Релевантные классы: ${pageContent.allClasses.join(', ')}`);
            
        } else {
            console.log('❌ Кнопка расчета не найдена!');
        }

        console.log('\n💡 Браузер остается открытым для изучения...');
        console.log('⚠️  Закройте браузер вручную когда закончите');
        
        // НЕ закрываем браузер
        // await browser.close();

    } catch (error) {
        console.error('❌ Ошибка:', error);
        await browser.close();
    }
}

if (require.main === module) {
    visualTest();
}
