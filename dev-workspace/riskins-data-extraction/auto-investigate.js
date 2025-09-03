/**
 * АВТОМАТИЧЕСКОЕ ИССЛЕДОВАНИЕ СЕЛЕКТОРОВ ПЕРИОДА
 * Полностью автоматический анализ без ручного вмешательства
 */

const puppeteer = require('puppeteer');

async function autoInvestigatePeriod() {
    console.log('🔍 АВТОМАТИЧЕСКОЕ ИССЛЕДОВАНИЕ СЕЛЕКТОРОВ ПЕРИОДА');
    console.log('=' .repeat(60));
    console.log('🤖 Полностью автоматический режим\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true, // Скрытый режим
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

        console.log('🔍 Сканируем все элементы страницы...');
        
        // Глубокий анализ всех элементов
        const analysis = await page.evaluate(() => {
            const results = {
                selects: [],
                radioButtons: [],
                clickableElements: [],
                periodRelated: [],
                allFormElements: []
            };

            // 1. Все SELECT элементы
            const selects = document.querySelectorAll('select');
            selects.forEach((select, index) => {
                const options = Array.from(select.options).map(opt => ({
                    value: opt.value,
                    text: opt.text.trim(),
                    selected: opt.selected
                }));
                
                results.selects.push({
                    index,
                    selector: `select:nth-of-type(${index + 1})`,
                    id: select.id,
                    name: select.name,
                    className: select.className,
                    optionsCount: options.length,
                    options: options,
                    hasMonthOptions: options.some(opt => 
                        opt.text.includes('місяц') || 
                        opt.text.includes('month') ||
                        opt.text.includes('6') || 
                        opt.text.includes('12') ||
                        opt.text.includes('рік')
                    )
                });
            });

            // 2. Все RADIO BUTTON элементы
            const radios = document.querySelectorAll('input[type="radio"]');
            radios.forEach((radio, index) => {
                const label = document.querySelector(`label[for="${radio.id}"]`);
                const labelText = label ? label.textContent.trim() : '';
                
                results.radioButtons.push({
                    index,
                    selector: `input[type="radio"]:nth-of-type(${index + 1})`,
                    id: radio.id,
                    name: radio.name,
                    value: radio.value,
                    checked: radio.checked,
                    labelText: labelText,
                    hasPeriodText: labelText.includes('місяц') || labelText.includes('6') || labelText.includes('12')
                });
            });

            // 3. Элементы содержащие текст периода
            const allElements = document.querySelectorAll('*');
            allElements.forEach((el, index) => {
                const text = el.textContent?.trim() || '';
                const lowerText = text.toLowerCase();
                
                if ((lowerText.includes('період') || 
                     lowerText.includes('6 місяц') || 
                     lowerText.includes('12 місяц') ||
                     lowerText.includes('виберіть')) && 
                    text.length < 200) {
                    
                    results.periodRelated.push({
                        index,
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        text: text,
                        isClickable: el.onclick !== null || 
                                    el.style.cursor === 'pointer' ||
                                    el.getAttribute('role') === 'button',
                        selector: el.id ? `#${el.id}` : 
                                 el.className ? `.${el.className.split(' ')[0]}` :
                                 el.tagName.toLowerCase()
                    });
                }
            });

            // 4. Кликабельные элементы с текстом "6" или "12"
            allElements.forEach((el, index) => {
                const text = el.textContent?.trim() || '';
                if ((text === '6' || text === '12' || 
                     text.includes('6 місяц') || 
                     text.includes('12 місяц')) &&
                    (el.onclick !== null || 
                     el.style.cursor === 'pointer' ||
                     el.getAttribute('role') === 'button' ||
                     el.tagName === 'BUTTON' ||
                     el.tagName === 'A' ||
                     el.className.includes('btn') ||
                     el.className.includes('click'))) {
                    
                    results.clickableElements.push({
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        text: text,
                        selector: el.id ? `#${el.id}` : 
                                 el.className ? `.${el.className.split(' ')[0]}` :
                                 `${el.tagName.toLowerCase()}:contains("${text}")`,
                        parentText: el.parentElement?.textContent?.trim().substring(0, 100)
                    });
                }
            });

            // 5. Все элементы формы
            const formElements = document.querySelectorAll('input, select, button, textarea');
            formElements.forEach((el, index) => {
                results.allFormElements.push({
                    index,
                    tag: el.tagName,
                    type: el.type || 'none',
                    id: el.id,
                    name: el.name,
                    className: el.className,
                    value: el.value || '',
                    text: el.textContent?.trim() || ''
                });
            });

            return results;
        });

        console.log('\n📊 РЕЗУЛЬТАТЫ СКАНИРОВАНИЯ:');
        console.log('=' .repeat(40));

        // Анализ SELECT элементов
        console.log('\n🔽 SELECT ЭЛЕМЕНТЫ:');
        if (analysis.selects.length === 0) {
            console.log('   ❌ Select элементы не найдены');
        } else {
            analysis.selects.forEach(select => {
                console.log(`\n   Select #${select.index}:`);
                console.log(`     Селектор: ${select.selector}`);
                console.log(`     ID: "${select.id}"`);
                console.log(`     Class: "${select.className}"`);
                console.log(`     Содержит периоды: ${select.hasMonthOptions ? '✅ ДА' : '❌ НЕТ'}`);
                
                if (select.hasMonthOptions) {
                    console.log('     📅 ОПЦИИ ПЕРИОДА:');
                    select.options.forEach(opt => {
                        const marker = opt.selected ? '👉' : '  ';
                        console.log(`       ${marker} "${opt.text}" (value: "${opt.value}")`);
                    });
                }
            });
        }

        // Анализ RADIO BUTTON элементов
        console.log('\n🔘 RADIO BUTTON ЭЛЕМЕНТЫ:');
        const periodRadios = analysis.radioButtons.filter(r => r.hasPeriodText);
        if (periodRadios.length === 0) {
            console.log('   ❌ Radio buttons с периодами не найдены');
        } else {
            periodRadios.forEach(radio => {
                console.log(`\n   Radio #${radio.index}:`);
                console.log(`     Селектор: ${radio.selector}`);
                console.log(`     ID: "${radio.id}"`);
                console.log(`     Name: "${radio.name}"`);
                console.log(`     Label: "${radio.labelText}"`);
                console.log(`     Checked: ${radio.checked ? '✅' : '❌'}`);
            });
        }

        // Анализ элементов с текстом периода
        console.log('\n📝 ЭЛЕМЕНТЫ С ТЕКСТОМ ПЕРИОДА:');
        analysis.periodRelated.forEach((el, i) => {
            console.log(`\n   Элемент #${i + 1}:`);
            console.log(`     Tag: <${el.tag}>`);
            console.log(`     ID: "${el.id}"`);
            console.log(`     Class: "${el.className}"`);
            console.log(`     Селектор: ${el.selector}`);
            console.log(`     Кликабельный: ${el.isClickable ? '✅' : '❌'}`);
            console.log(`     Текст: "${el.text}"`);
        });

        // Анализ кликабельных элементов
        console.log('\n🖱️ КЛИКАБЕЛЬНЫЕ ЭЛЕМЕНТЫ С "6" ИЛИ "12":');
        if (analysis.clickableElements.length === 0) {
            console.log('   ❌ Кликабельные элементы не найдены');
        } else {
            analysis.clickableElements.forEach((el, i) => {
                console.log(`\n   Кликабельный #${i + 1}:`);
                console.log(`     Tag: <${el.tag}>`);
                console.log(`     Селектор: ${el.selector}`);
                console.log(`     Текст: "${el.text}"`);
                console.log(`     Контекст: "${el.parentText}"`);
            });
        }

        // Поиск наиболее вероятных селекторов
        console.log('\n🎯 РЕКОМЕНДУЕМЫЕ СЕЛЕКТОРЫ ДЛЯ АВТОМАТИЗАЦИИ:');
        const recommendations = [];

        // Проверяем select с периодами
        const periodSelects = analysis.selects.filter(s => s.hasMonthOptions);
        if (periodSelects.length > 0) {
            recommendations.push({
                type: 'SELECT',
                selector: periodSelects[0].selector,
                method: 'Выбор опции в select',
                confidence: 'Высокая'
            });
        }

        // Проверяем radio buttons
        if (periodRadios.length > 0) {
            recommendations.push({
                type: 'RADIO',
                selector: periodRadios[0].selector,
                method: 'Клик по radio button',
                confidence: 'Высокая'
            });
        }

        // Проверяем кликабельные элементы
        if (analysis.clickableElements.length > 0) {
            recommendations.push({
                type: 'CLICKABLE',
                selector: analysis.clickableElements[0].selector,
                method: 'Клик по элементу',
                confidence: 'Средняя'
            });
        }

        if (recommendations.length === 0) {
            console.log('   ❌ Автоматические селекторы не найдены');
            console.log('   💡 Возможно поле периода загружается динамически');
        } else {
            recommendations.forEach((rec, i) => {
                console.log(`\n   Вариант #${i + 1}:`);
                console.log(`     Тип: ${rec.type}`);
                console.log(`     Селектор: ${rec.selector}`);
                console.log(`     Метод: ${rec.method}`);
                console.log(`     Уверенность: ${rec.confidence}`);
            });
        }

        return {
            success: true,
            analysis,
            recommendations
        };

    } catch (error) {
        console.error('❌ Ошибка исследования:', error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Запуск исследования
if (require.main === module) {
    autoInvestigatePeriod()
        .then((result) => {
            console.log('\n🎉 АВТОМАТИЧЕСКОЕ ИССЛЕДОВАНИЕ ЗАВЕРШЕНО!');
            if (result.success && result.recommendations.length > 0) {
                console.log('✅ Найдены возможные селекторы для автоматизации');
            } else {
                console.log('⚠️ Автоматические селекторы не найдены');
                console.log('💡 Возможно нужен другой подход');
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { autoInvestigatePeriod };
