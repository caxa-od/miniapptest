/**
 * ВИЗУАЛЬНЫЙ ТЕСТ СЕЛЕКТОРА ПЕРИОДА
 * Детальный анализ поля "Період дії"
 */

const puppeteer = require('puppeteer');

async function visualPeriodTest() {
    console.log('👀 ВИЗУАЛЬНЫЙ ТЕСТ СЕЛЕКТОРА ПЕРИОДА');
    console.log('═'.repeat(50));

    const browser = await puppeteer.launch({
        headless: false, // ВИЗУАЛЬНЫЙ режим
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

    try {
        console.log('🚀 Открываем сайт...');
        await page.goto('https://riskins-insurance.eua.in.ua/', { 
            waitUntil: 'networkidle2' 
        });

        console.log('📝 Заполняем номер...');
        await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
        await page.click('#autoNumberSearch');
        await page.type('#autoNumberSearch', 'AA1234AA');

        console.log('🔍 Анализируем поле периода...');
        
        // Ждем чтобы страница полностью загрузилась
        await page.waitForTimeout(2000);

        // Анализируем все элементы формы
        const formAnalysis = await page.evaluate(() => {
            const results = {
                selectElements: [],
                inputElements: [],
                periodRelatedElements: [],
                allFormElements: []
            };

            // Ищем все select элементы
            const selects = document.querySelectorAll('select');
            selects.forEach((select, i) => {
                const options = Array.from(select.options).map(opt => ({
                    value: opt.value,
                    text: opt.textContent.trim(),
                    selected: opt.selected
                }));
                
                results.selectElements.push({
                    index: i,
                    id: select.id || `select-${i}`,
                    name: select.name || '',
                    className: select.className,
                    options: options,
                    selectedValue: select.value,
                    visible: select.offsetParent !== null,
                    outerHTML: select.outerHTML.substring(0, 300)
                });
            });

            // Ищем все input элементы
            const inputs = document.querySelectorAll('input');
            inputs.forEach((input, i) => {
                if (input.type !== 'text' && input.type !== 'hidden') {
                    const label = input.closest('label') || 
                                document.querySelector(`label[for="${input.id}"]`);
                    
                    results.inputElements.push({
                        index: i,
                        type: input.type,
                        id: input.id || `input-${i}`,
                        name: input.name || '',
                        value: input.value,
                        checked: input.checked,
                        labelText: label ? label.textContent.trim() : '',
                        visible: input.offsetParent !== null
                    });
                }
            });

            // Ищем элементы связанные с периодом
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const text = el.textContent.toLowerCase();
                if ((text.includes('період') || text.includes('місяц') || 
                     text.includes('терм') || text.includes('срок')) && 
                    el.children.length <= 2 && text.length < 200) {
                    
                    results.periodRelatedElements.push({
                        tagName: el.tagName,
                        id: el.id || '',
                        className: el.className,
                        text: el.textContent.trim().substring(0, 100),
                        visible: el.offsetParent !== null,
                        clickable: el.onclick !== null || el.addEventListener !== undefined
                    });
                }
            });

            // Ищем все элементы формы
            const formElements = document.querySelectorAll('form *');
            let formCount = 0;
            formElements.forEach(el => {
                if (formCount < 20 && (el.tagName === 'SELECT' || el.tagName === 'INPUT' || 
                    el.tagName === 'BUTTON' || el.tagName === 'TEXTAREA')) {
                    results.allFormElements.push({
                        tagName: el.tagName,
                        type: el.type || '',
                        id: el.id || '',
                        name: el.name || '',
                        className: el.className,
                        value: el.value || '',
                        text: el.textContent ? el.textContent.trim().substring(0, 50) : '',
                        visible: el.offsetParent !== null
                    });
                    formCount++;
                }
            });

            return results;
        });

        console.log('\n📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
        console.log('═'.repeat(50));

        // Выводим найденные select элементы
        if (formAnalysis.selectElements.length > 0) {
            console.log('\n🎛️ SELECT ЭЛЕМЕНТЫ:');
            formAnalysis.selectElements.forEach((sel, i) => {
                console.log(`\n${i + 1}. ${sel.id} (${sel.visible ? 'видимый' : 'скрытый'})`);
                console.log(`   Класс: ${sel.className}`);
                console.log(`   Имя: ${sel.name}`);
                console.log(`   Выбрано: ${sel.selectedValue}`);
                console.log(`   Опции:`);
                sel.options.forEach((opt, j) => {
                    const mark = opt.selected ? ' ✓' : '  ';
                    console.log(`    ${mark} "${opt.text}" (${opt.value})`);
                });
            });
        } else {
            console.log('\n❌ SELECT элементы не найдены');
        }

        // Выводим элементы связанные с периодом
        if (formAnalysis.periodRelatedElements.length > 0) {
            console.log('\n📅 ЭЛЕМЕНТЫ С "ПЕРІОД":');
            formAnalysis.periodRelatedElements.forEach((el, i) => {
                console.log(`\n${i + 1}. ${el.tagName} (${el.visible ? 'видимый' : 'скрытый'})`);
                console.log(`   ID: ${el.id}`);
                console.log(`   Класс: ${el.className}`);
                console.log(`   Текст: "${el.text}"`);
            });
        }

        // Выводим все элементы формы
        if (formAnalysis.allFormElements.length > 0) {
            console.log('\n📋 ВСЕ ЭЛЕМЕНТЫ ФОРМЫ:');
            formAnalysis.allFormElements.forEach((el, i) => {
                if (el.visible) {
                    console.log(`${i + 1}. ${el.tagName}${el.type ? `[${el.type}]` : ''} #${el.id} "${el.text}"`);
                }
            });
        }

        console.log('\n🎯 РЕКОМЕНДАЦИИ:');
        console.log('─'.repeat(40));
        if (formAnalysis.selectElements.length > 0) {
            console.log('✅ Найдены select элементы - изучите их опции');
            console.log('💡 Попробуйте выбрать разные значения в DevTools');
        } else {
            console.log('❌ Select элементы не найдены');
            console.log('💡 Возможно период выбирается по-другому');
        }

        console.log('\n🔍 Браузер открыт для ручного исследования...');
        console.log('⏸️  Закройте браузер когда закончите');

        // Пауза на 60 секунд для ручного исследования
        await page.waitForTimeout(60000);

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await browser.close();
    }
}

visualPeriodTest();
