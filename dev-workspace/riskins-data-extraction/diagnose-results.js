/**
 * ДИАГНОСТИКА СЕЛЕКТОРОВ РЕЗУЛЬТАТОВ
 * Проверим что происходит после отправки формы
 */

const puppeteer = require('puppeteer');

async function diagnoseResultSelectors() {
    console.log('🔍 ДИАГНОСТИКА СЕЛЕКТОРОВ РЕЗУЛЬТАТОВ');
    console.log('=' .repeat(50));

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Видимый режим
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

        console.log('🕒 Выбираем период 6 месяцев...');
        await page.waitForSelector('#coverageTime', { timeout: 10000 });
        await page.click('#coverageTime');
        await page.waitForTimeout(500);
        
        const labels = await page.$$('#coverageTime .Select__option');
        for (const label of labels) {
            const text = await label.evaluate(el => el.textContent.trim());
            if (text === '6 місяців') {
                await label.click();
                console.log('✅ Выбран период: 6 месяцев');
                break;
            }
        }

        console.log('🔍 Отправляем запрос...');
        await page.click('#btnCalculateNumber');

        console.log('⏳ Ждем 10 секунд и сканируем страницу...');
        await page.waitForTimeout(10000);

        // Сканируем все возможные селекторы результатов
        const analysis = await page.evaluate(() => {
            const results = {
                url: window.location.href,
                title: document.title,
                allClasses: [],
                allIds: [],
                possibleResultSelectors: [],
                offerElements: [],
                priceElements: [],
                errorElements: []
            };

            // Собираем все классы и ID
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.className && typeof el.className === 'string') {
                    el.className.split(' ').forEach(cls => {
                        if (cls && !results.allClasses.includes(cls)) {
                            results.allClasses.push(cls);
                        }
                    });
                }
                if (el.id && !results.allIds.includes(el.id)) {
                    results.allIds.push(el.id);
                }
            });

            // Ищем элементы связанные с результатами
            const resultKeywords = ['offer', 'result', 'price', 'company', 'list', 'insurance', 'card'];
            results.allClasses.forEach(cls => {
                const lowerCls = cls.toLowerCase();
                if (resultKeywords.some(keyword => lowerCls.includes(keyword))) {
                    results.possibleResultSelectors.push(`.${cls}`);
                }
            });

            results.allIds.forEach(id => {
                const lowerId = id.toLowerCase();
                if (resultKeywords.some(keyword => lowerId.includes(keyword))) {
                    results.possibleResultSelectors.push(`#${id}`);
                }
            });

            // Ищем элементы с ценами
            allElements.forEach(el => {
                const text = el.textContent?.trim() || '';
                if (text.match(/\d+.*₴|₴.*\d+|\d+\s*грн|грн\s*\d+/)) {
                    results.priceElements.push({
                        tag: el.tagName,
                        className: el.className,
                        id: el.id,
                        text: text.substring(0, 100),
                        selector: el.id ? `#${el.id}` : 
                                 el.className ? `.${el.className.split(' ')[0]}` :
                                 el.tagName.toLowerCase()
                    });
                }
            });

            // Ищем элементы с названиями компаний
            allElements.forEach(el => {
                const text = el.textContent?.trim() || '';
                if (text.length > 3 && text.length < 50 && 
                    (text.toLowerCase().includes('страх') || 
                     text.toLowerCase().includes('insurance') ||
                     text.toLowerCase().includes('компан'))) {
                    results.offerElements.push({
                        tag: el.tagName,
                        className: el.className,
                        id: el.id,
                        text: text.substring(0, 100),
                        selector: el.id ? `#${el.id}` : 
                                 el.className ? `.${el.className.split(' ')[0]}` :
                                 el.tagName.toLowerCase()
                    });
                }
            });

            // Ищем ошибки
            allElements.forEach(el => {
                const text = el.textContent?.trim() || '';
                if (text.toLowerCase().includes('ошибка') ||
                    text.toLowerCase().includes('error') ||
                    text.toLowerCase().includes('помилка') ||
                    text.toLowerCase().includes('не найден')) {
                    results.errorElements.push({
                        tag: el.tagName,
                        text: text.substring(0, 200)
                    });
                }
            });

            return results;
        });

        console.log('\n📊 РЕЗУЛЬТАТЫ ДИАГНОСТИКИ:');
        console.log('=' .repeat(40));
        console.log(`URL: ${analysis.url}`);
        console.log(`Заголовок: ${analysis.title}`);

        console.log(`\n🔍 Найдено классов: ${analysis.allClasses.length}`);
        console.log(`🔍 Найдено ID: ${analysis.allIds.length}`);

        if (analysis.possibleResultSelectors.length > 0) {
            console.log('\n📋 ВОЗМОЖНЫЕ СЕЛЕКТОРЫ РЕЗУЛЬТАТОВ:');
            analysis.possibleResultSelectors.slice(0, 10).forEach(selector => {
                console.log(`   ${selector}`);
            });
        }

        if (analysis.priceElements.length > 0) {
            console.log('\n💰 ЭЛЕМЕНТЫ С ЦЕНАМИ:');
            analysis.priceElements.slice(0, 5).forEach(el => {
                console.log(`   ${el.selector}: "${el.text}"`);
            });
        }

        if (analysis.offerElements.length > 0) {
            console.log('\n🏢 ЭЛЕМЕНТЫ С КОМПАНИЯМИ:');
            analysis.offerElements.slice(0, 5).forEach(el => {
                console.log(`   ${el.selector}: "${el.text}"`);
            });
        }

        if (analysis.errorElements.length > 0) {
            console.log('\n❌ ЭЛЕМЕНТЫ С ОШИБКАМИ:');
            analysis.errorElements.forEach(el => {
                console.log(`   ${el.tag}: "${el.text}"`);
            });
        }

        console.log('\n⏱️ Ждем 10 секунд для наблюдения...');
        await page.waitForTimeout(10000);

        return analysis;

    } catch (error) {
        console.error('❌ Ошибка диагностики:', error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Запуск диагностики
if (require.main === module) {
    diagnoseResultSelectors()
        .then((result) => {
            console.log('\n🎉 ДИАГНОСТИКА ЗАВЕРШЕНА!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { diagnoseResultSelectors };
