/**
 * ВИЗУАЛЬНЫЙ ПОИСК СЕЛЕКТОРА ПЕРИОДА СТРАХОВАНИЯ
 */

const puppeteer = require('puppeteer');

async function findPeriodSelector() {
    console.log('🔍 ПОИСК СЕЛЕКТОРА ПЕРИОДА СТРАХОВАНИЯ');
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
        await page.goto('https://riskins-insurance.eua.in.ua/', { 
            waitUntil: 'networkidle2' 
        });

        console.log('📝 Заполняем номер AA1234AA...');
        await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
        await page.click('#autoNumberSearch');
        await page.keyboard.down('Meta');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Meta');
        await page.type('#autoNumberSearch', 'AA1234AA');

        console.log('🔍 Анализируем все элементы формы...');
        
        // Ищем все возможные селекторы и поля
        const allFormElements = await page.evaluate(() => {
            const elements = [];
            
            // Ищем все select элементы
            const selects = document.querySelectorAll('select');
            selects.forEach((el, i) => {
                elements.push({
                    type: 'select',
                    index: i,
                    id: el.id,
                    name: el.name,
                    className: el.className,
                    options: Array.from(el.options).map(opt => ({
                        value: opt.value,
                        text: opt.textContent.trim()
                    })),
                    outerHTML: el.outerHTML.substring(0, 200)
                });
            });

            // Ищем все input элементы
            const inputs = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
            inputs.forEach((el, i) => {
                const label = el.closest('label') || document.querySelector(`label[for="${el.id}"]`);
                elements.push({
                    type: 'input',
                    inputType: el.type,
                    index: i,
                    id: el.id,
                    name: el.name,
                    value: el.value,
                    labelText: label ? label.textContent.trim() : '',
                    outerHTML: el.outerHTML.substring(0, 200)
                });
            });

            // Ищем элементы с текстом про период/месяц/срок
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const text = el.textContent.toLowerCase();
                if ((text.includes('месяц') || text.includes('срок') || text.includes('период') || 
                     text.includes('6') || text.includes('12')) && 
                    el.children.length === 0 && text.length < 100) {
                    elements.push({
                        type: 'text',
                        tagName: el.tagName,
                        className: el.className,
                        text: el.textContent.trim(),
                        outerHTML: el.outerHTML.substring(0, 200)
                    });
                }
            });

            return elements;
        });

        console.log('\n📋 НАЙДЕННЫЕ ЭЛЕМЕНТЫ ФОРМЫ:');
        console.log('─'.repeat(50));

        // Выводим select элементы
        const selects = allFormElements.filter(el => el.type === 'select');
        if (selects.length > 0) {
            console.log('\n🎛️ SELECT ЭЛЕМЕНТЫ:');
            selects.forEach((sel, i) => {
                console.log(`${i + 1}. #${sel.id || 'no-id'} .${sel.className}`);
                console.log(`   Имя: ${sel.name || 'нет'}`);
                console.log(`   Опции: ${sel.options.map(o => `"${o.text}"`).join(', ')}`);
                console.log('');
            });
        }

        // Выводим radio/checkbox элементы
        const inputs = allFormElements.filter(el => el.type === 'input');
        if (inputs.length > 0) {
            console.log('\n📻 RADIO/CHECKBOX ЭЛЕМЕНТЫ:');
            inputs.forEach((inp, i) => {
                console.log(`${i + 1}. ${inp.inputType} #${inp.id || 'no-id'}`);
                console.log(`   Имя: ${inp.name || 'нет'}`);
                console.log(`   Значение: ${inp.value || 'нет'}`);
                console.log(`   Лейбл: "${inp.labelText}"`);
                console.log('');
            });
        }

        // Выводим текстовые элементы с ключевыми словами
        const textElements = allFormElements.filter(el => el.type === 'text');
        if (textElements.length > 0) {
            console.log('\n📝 ЭЛЕМЕНТЫ С КЛЮЧЕВЫМИ СЛОВАМИ:');
            textElements.slice(0, 10).forEach((txt, i) => {
                console.log(`${i + 1}. ${txt.tagName}.${txt.className}`);
                console.log(`   Текст: "${txt.text}"`);
                console.log('');
            });
        }

        console.log('\n🎯 РЕКОМЕНДАЦИИ:');
        console.log('─'.repeat(40));
        console.log('1. Проверьте форму визуально в браузере');
        console.log('2. Найдите поле выбора периода страхования');
        console.log('3. Скопируйте его селектор из DevTools');
        console.log('4. Возможно период выбирается после отправки формы');
        
        console.log('\n🔍 Браузер остается открытым для анализа...');
        console.log('⏸️  Закройте браузер вручную когда закончите исследование');

    } catch (error) {
        console.error('❌ Ошибка:', error);
        await browser.close();
    }

    // НЕ закрываем браузер для визуального анализа
}

findPeriodSelector();
