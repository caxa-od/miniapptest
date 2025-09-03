/**
 * ДИАГНОСТИКА HEADLESS VS ВИДИМЫЙ РЕЖИМ
 * Сравниваем что находится в разных режимах браузера
 */

const puppeteer = require('puppeteer');

async function compareHeadlessVsVisible(plateNumber, months) {
    console.log(`🔍 СРАВНЕНИЕ РЕЖИМОВ БРАУЗЕРА`);
    console.log(`Номер: ${plateNumber}, Период: ${months} месяцев`);
    console.log('=' .repeat(60));

    const results = {};

    // Тест в ВИДИМОМ режиме
    console.log('\n👁️ ТЕСТ В ВИДИМОМ РЕЖИМЕ:');
    console.log('-' .repeat(30));
    results.visible = await testMode(plateNumber, months, false);

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Тест в СКРЫТОМ режиме
    console.log('\n🕶️ ТЕСТ В СКРЫТОМ РЕЖИМЕ:');
    console.log('-' .repeat(30));
    results.headless = await testMode(plateNumber, months, true);

    // Сравнение результатов
    console.log('\n📊 СРАВНЕНИЕ РЕЗУЛЬТАТОВ:');
    console.log('=' .repeat(40));
    console.log(`Видимый режим: ${results.visible.offers.length} предложений`);
    console.log(`Скрытый режим: ${results.headless.offers.length} предложений`);

    if (results.visible.offers.length !== results.headless.offers.length) {
        console.log('\n⚠️ РАЗЛИЧИЯ ОБНАРУЖЕНЫ!');
        console.log('\nВидимый режим находит:');
        results.visible.offers.forEach((offer, i) => {
            console.log(`   ${i+1}. ${offer.price}`);
        });
        
        console.log('\nСкрытый режим находит:');
        results.headless.offers.forEach((offer, i) => {
            console.log(`   ${i+1}. ${offer.price}`);
        });

        console.log('\n🔍 ДЕТАЛЬНАЯ ДИАГНОСТИКА:');
        console.log(`Видимый: элементов с ценами = ${results.visible.diagnostics.priceElements}`);
        console.log(`Скрытый: элементов с ценами = ${results.headless.diagnostics.priceElements}`);
        console.log(`Видимый: всего .Table__cell = ${results.visible.diagnostics.tableCells}`);
        console.log(`Скрытый: всего .Table__cell = ${results.headless.diagnostics.tableCells}`);
    } else {
        console.log('✅ Результаты одинаковые в обоих режимах');
    }

    return results;
}

async function testMode(plateNumber, months, headless) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: headless,
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
        await page.type('#autoNumberSearch', plateNumber);

        // Выбираем период
        if (months !== 12) {
            console.log(`🕒 Выбираем период: ${months} месяцев...`);
            await page.waitForSelector('#coverageTime', { timeout: 10000 });
            await page.click('#coverageTime');
            await page.waitForTimeout(500);
            
            const targetText = `${months} місяців`;
            const labels = await page.$$('#coverageTime .Select__option');
            
            for (const label of labels) {
                const text = await label.evaluate(el => el.textContent.trim());
                if (text === targetText) {
                    await label.click();
                    await page.waitForTimeout(1000);
                    console.log(`✅ Выбран период: ${targetText}`);
                    break;
                }
            }
        } else {
            console.log('🕒 Используем период по умолчанию (12 месяцев)');
        }

        console.log('🔍 Отправляем запрос...');
        await page.click('#btnCalculateNumber');

        console.log('⏳ Ждем результаты...');
        await page.waitForSelector('.Table__cell', { timeout: 45000 });
        
        // Ждем дольше для полной загрузки
        console.log('⏳ Дополнительное ожидание загрузки...');
        await page.waitForTimeout(5000);

        // Детальная диагностика страницы
        console.log('📊 Анализируем страницу...');
        const analysis = await page.evaluate(() => {
            const diagnostics = {
                tableCells: document.querySelectorAll('.Table__cell').length,
                tableRows: document.querySelectorAll('.Table__row').length,
                priceElements: 0,
                allPriceTexts: [],
                uniquePrices: new Set()
            };

            // Ищем все элементы с ценами
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const text = el.textContent?.trim() || '';
                if (text.match(/^\d{4,5}\s*грн$/)) {
                    diagnostics.priceElements++;
                    diagnostics.allPriceTexts.push({
                        text: text,
                        tag: el.tagName,
                        className: el.className,
                        id: el.id,
                        parent: el.parentElement?.tagName
                    });
                    
                    const price = text.replace(/\s*грн$/, '');
                    diagnostics.uniquePrices.add(price);
                }
            });

            // Собираем уникальные цены для результата
            const offers = [];
            Array.from(diagnostics.uniquePrices).forEach((price, index) => {
                offers.push({
                    company: `Предложение ${index + 1}`,
                    price: price + '₴',
                    index: index + 1
                });
            });

            return {
                offers: offers,
                diagnostics: {
                    ...diagnostics,
                    uniquePrices: Array.from(diagnostics.uniquePrices)
                }
            };
        });

        console.log(`✅ Найдено ${analysis.offers.length} уникальных цен`);
        console.log(`📋 Диагностика: .Table__cell=${analysis.diagnostics.tableCells}, элементов с ценами=${analysis.diagnostics.priceElements}`);
        
        analysis.offers.forEach(offer => {
            console.log(`   ${offer.index}. ${offer.price}`);
        });

        return analysis;

    } catch (error) {
        console.error(`❌ Ошибка в режиме ${headless ? 'headless' : 'visible'}: ${error.message}`);
        return {
            offers: [],
            diagnostics: { error: error.message }
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Запуск сравнения
if (require.main === module) {
    const plateNumber = process.argv[2] || 'AA1111AA';
    const months = parseInt(process.argv[3]) || 6;
    
    compareHeadlessVsVisible(plateNumber, months)
        .then(results => {
            console.log('\n🎉 СРАВНЕНИЕ ЗАВЕРШЕНО!');
            
            // Сохраняем детальный отчет
            const fs = require('fs');
            const filename = `mode_comparison_${plateNumber}_${months}m_${Date.now()}.json`;
            fs.writeFileSync(filename, JSON.stringify(results, null, 2));
            console.log(`💾 Детальный отчет: ${filename}`);
            
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ошибка:', error);
            process.exit(1);
        });
}

module.exports = { compareHeadlessVsVisible };
