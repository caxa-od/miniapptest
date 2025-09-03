/**
 * ИССЛЕДОВАНИЕ СЕЛЕКТОРОВ ПЕРИОДА ДЛЯ АВТОМАТИЗАЦИИ
 */

const puppeteer = require('puppeteer');

async function investigatePeriodSelectors() {
    console.log('🔍 ИССЛЕДОВАНИЕ СЕЛЕКТОРОВ ПЕРИОДА');
    console.log('=' .repeat(50));
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Открываем браузер для визуального анализа
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });

        console.log('🌐 Открываем сайт...');
        await page.goto('https://riskins-insurance.eua.in.ua/', { waitUntil: 'networkidle2' });

        console.log('📝 Заполняем номер...');
        await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
        await page.click('#autoNumberSearch');
        await page.keyboard.down('Meta');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Meta');
        await page.type('#autoNumberSearch', 'AA1111AA');

        console.log('🔍 Анализируем все элементы формы...');
        
        // Анализируем все select элементы
        const selectAnalysis = await page.evaluate(() => {
            const results = [];
            const selects = document.querySelectorAll('select');
            
            selects.forEach((select, index) => {
                const options = Array.from(select.options).map(option => ({
                    value: option.value,
                    text: option.text.trim(),
                    selected: option.selected
                }));
                
                results.push({
                    index,
                    id: select.id,
                    name: select.name,
                    className: select.className,
                    optionsCount: options.length,
                    options: options,
                    hasMonthOptions: options.some(opt => 
                        opt.text.includes('місяц') || 
                        opt.text.includes('month') ||
                        opt.text.includes('6') || 
                        opt.text.includes('12')
                    )
                });
            });
            
            return results;
        });

        console.log('\n📊 НАЙДЕННЫЕ SELECT ЭЛЕМЕНТЫ:');
        selectAnalysis.forEach(select => {
            console.log(`\nSelect #${select.index}:`);
            console.log(`  ID: "${select.id}"`);
            console.log(`  Name: "${select.name}"`);
            console.log(`  Class: "${select.className}"`);
            console.log(`  Опций: ${select.optionsCount}`);
            console.log(`  Содержит месяцы: ${select.hasMonthOptions ? 'ДА' : 'НЕТ'}`);
            
            if (select.hasMonthOptions) {
                console.log('  🎯 ОПЦИИ ПЕРИОДА:');
                select.options.forEach((option, i) => {
                    const marker = option.selected ? '👉' : '  ';
                    console.log(`    ${marker} "${option.text}" (value: "${option.value}")`);
                });
            }
        });

        // Анализируем другие возможные элементы периода
        const otherElements = await page.evaluate(() => {
            const results = [];
            
            // Ищем по тексту "період"
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const text = el.textContent?.toLowerCase() || '';
                if (text.includes('період') || text.includes('period')) {
                    results.push({
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        text: el.textContent?.trim().substring(0, 100)
                    });
                }
            });
            
            return results;
        });

        console.log('\n🔎 ЭЛЕМЕНТЫ СОДЕРЖАЩИЕ "ПЕРІОД":');
        otherElements.forEach((el, i) => {
            console.log(`  ${i+1}. <${el.tag}> id="${el.id}" class="${el.className}"`);
            console.log(`     Текст: "${el.text}"`);
        });

        console.log('\n⏸️ Браузер остается открытым для ручного анализа...');
        console.log('💡 Найдите поле периода и посмотрите его селекторы в DevTools');
        console.log('🔍 Нажмите Enter когда закончите анализ...');

        // Ждем нажатия Enter
        await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });

    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Запуск исследования
if (require.main === module) {
    investigatePeriodSelectors()
        .then(() => {
            console.log('\n🎉 Исследование завершено!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ошибка исследования:', error);
            process.exit(1);
        });
}

module.exports = { investigatePeriodSelectors };
