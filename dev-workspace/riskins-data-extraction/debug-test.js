/**
 * ОТЛАДОЧНАЯ ВЕРСИЯ - ПРОСТОЙ АНАЛИЗ СТРАНИЦЫ
 */

const puppeteer = require('puppeteer');

async function debugTest() {
    console.log('🔍 ОТЛАДОЧНЫЙ ТЕСТ');
    console.log('═'.repeat(30));
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox'],
        defaultViewport: null
    });

    const page = await browser.newPage();
    
    try {
        await page.goto('https://riskins-insurance.eua.in.ua/');
        
        await page.waitForSelector('#autoNumberSearch');
        await page.type('#autoNumberSearch', 'AA1234AA');
        
        console.log('📝 Номер заполнен');
        console.log('🎯 Выберите период и нажмите Розрахувати');
        console.log('⏱️  Ждем 30 секунд...');
        
        await page.waitForTimeout(30000);
        
        // Анализ содержимого страницы
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                hasTable: document.querySelector('table') !== null,
                hasGrn: document.body.textContent.includes('грн'),
                textLength: document.body.textContent.length,
                elementCount: document.querySelectorAll('*').length,
                bodyText: document.body.textContent.substring(0, 500)
            };
        });
        
        console.log('\n📊 АНАЛИЗ СТРАНИЦЫ:');
        console.log('─'.repeat(30));
        console.log(`URL: ${pageInfo.url}`);
        console.log(`Заголовок: ${pageInfo.title}`);
        console.log(`Есть таблица: ${pageInfo.hasTable ? '✅' : '❌'}`);
        console.log(`Есть "грн": ${pageInfo.hasGrn ? '✅' : '❌'}`);
        console.log(`Элементов: ${pageInfo.elementCount}`);
        console.log(`Длина текста: ${pageInfo.textLength}`);
        console.log(`\nТекст страницы (первые 500 символов):`);
        console.log(pageInfo.bodyText);
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
    
    console.log('\n⏸️  Браузер останется открытым. Закройте вручную.');
}

debugTest();
