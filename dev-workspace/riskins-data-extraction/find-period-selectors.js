/**
 * УЛУЧШЕННЫЙ ПОИСК СЕЛЕКТОРОВ ПЕРИОДА
 */

const puppeteer = require('puppeteer');

async function findPeriodSelectors() {
    console.log('🔍 ПОИСК КЛИКАБЕЛЬНЫХ ЭЛЕМЕНТОВ ПЕРИОДА');
    console.log('=' .repeat(50));
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false,
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

        console.log('🔍 Ищем элементы с текстом о периоде...');
        
        // Поиск всех элементов содержащих "6 місяців" или "12 місяців"
        const periodElements = await page.evaluate(() => {
            const results = [];
            const allElements = document.querySelectorAll('*');
            
            allElements.forEach((el, index) => {
                const text = el.textContent || '';
                const hasMonthText = text.includes('6 місяц') || text.includes('12 місяц') || 
                                   text.includes('6 міс') || text.includes('12 міс');
                
                if (hasMonthText) {
                    const rect = el.getBoundingClientRect();
                    const isVisible = rect.width > 0 && rect.height > 0 && 
                                    window.getComputedStyle(el).display !== 'none';
                    
                    results.push({
                        index,
                        tagName: el.tagName,
                        id: el.id,
                        className: el.className,
                        text: text.trim().substring(0, 150),
                        isClickable: el.onclick !== null || el.style.cursor === 'pointer' || 
                                   ['BUTTON', 'A', 'INPUT', 'SELECT'].includes(el.tagName),
                        isVisible,
                        hasChildren: el.children.length > 0,
                        rect: {
                            x: Math.round(rect.x),
                            y: Math.round(rect.y),
                            width: Math.round(rect.width),
                            height: Math.round(rect.height)
                        }
                    });
                }
            });
            
            return results.filter(el => el.isVisible);
        });

        console.log('\n📋 ЭЛЕМЕНТЫ ПЕРИОДА:');
        periodElements.forEach((el, i) => {
            console.log(`\n${i+1}. <${el.tagName}> ${el.isClickable ? '🖱️ ' : ''}${el.isVisible ? '👁️ ' : ''}`);
            console.log(`   ID: "${el.id}"`);
            console.log(`   Class: "${el.className}"`);
            console.log(`   Размер: ${el.rect.width}x${el.rect.height} (${el.rect.x}, ${el.rect.y})`);
            console.log(`   Кликабельный: ${el.isClickable ? 'ДА' : 'НЕТ'}`);
            console.log(`   Текст: "${el.text}"`);
        });

        // Поиск input[type="radio"] или подобных элементов
        const radioElements = await page.evaluate(() => {
            const radios = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
            const results = [];
            
            radios.forEach(radio => {
                const label = document.querySelector(`label[for="${radio.id}"]`) || 
                            radio.closest('label') ||
                            radio.parentElement;
                
                const labelText = label ? label.textContent.trim() : '';
                const hasMonthText = labelText.includes('6 місяц') || labelText.includes('12 місяц') ||
                                   labelText.includes('6 міс') || labelText.includes('12 міс') ||
                                   radio.value.includes('6') || radio.value.includes('12');
                
                if (hasMonthText) {
                    results.push({
                        type: radio.type,
                        id: radio.id,
                        name: radio.name,
                        value: radio.value,
                        checked: radio.checked,
                        labelText: labelText.substring(0, 100)
                    });
                }
            });
            
            return results;
        });

        console.log('\n🔘 RADIO/CHECKBOX ЭЛЕМЕНТЫ:');
        radioElements.forEach((radio, i) => {
            console.log(`\n${i+1}. INPUT[type="${radio.type}"] ${radio.checked ? '✅' : '⭕'}`);
            console.log(`   ID: "${radio.id}"`);
            console.log(`   Name: "${radio.name}"`);
            console.log(`   Value: "${radio.value}"`);
            console.log(`   Label: "${radio.labelText}"`);
        });

        // Поиск возможных Vue.js компонентов или data-* атрибутов
        const vueElements = await page.evaluate(() => {
            const results = [];
            const allElements = document.querySelectorAll('[data-period], [data-month], [v-model], [data-value*="6"], [data-value*="12"]');
            
            allElements.forEach(el => {
                results.push({
                    tagName: el.tagName,
                    id: el.id,
                    className: el.className,
                    attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`),
                    text: el.textContent.trim().substring(0, 100)
                });
            });
            
            return results;
        });

        console.log('\n⚛️ VUE/DATA ЭЛЕМЕНТЫ:');
        vueElements.forEach((el, i) => {
            console.log(`\n${i+1}. <${el.tagName}>`);
            console.log(`   ID: "${el.id}"`);
            console.log(`   Class: "${el.className}"`);
            console.log(`   Атрибуты: ${el.attributes.join(', ')}`);
            console.log(`   Текст: "${el.text}"`);
        });

        console.log('\n⏸️ Попробуйте вручную найти и кликнуть на элементы периода...');
        console.log('🔍 Откройте DevTools и исследуйте структуру');
        console.log('📝 Нажмите Enter когда найдете рабочие селекторы...');

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

// Запуск поиска
if (require.main === module) {
    findPeriodSelectors()
        .then(() => {
            console.log('\n🎉 Поиск завершен!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ошибка поиска:', error);
            process.exit(1);
        });
}

module.exports = { findPeriodSelectors };
