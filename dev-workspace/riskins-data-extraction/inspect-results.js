/**
 * Специальный инспектор для анализа результатов страхования
 */

const puppeteer = require('puppeteer');

async function inspectResults() {
    console.log('🔍 Анализируем результаты страхования...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        slowMo: 1000,
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

        console.log('📝 Заполняем форму номером AA1234AA...');
        await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
        
        // Очищаем и заполняем поле
        await page.click('#autoNumberSearch');
        await page.keyboard.down('Meta');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Meta');
        await page.type('#autoNumberSearch', 'AA1234AA');

        console.log('🔍 Отправляем форму...');
        const submitButton = await page.$('#btnCalculateNumber, #btnCalculateSearch');
        if (submitButton) {
            await submitButton.click();
        }

        console.log('⏱️  Ждем результатов (15 секунд)...');
        await page.waitForTimeout(15000);

        console.log('🔍 Анализируем страницу после загрузки результатов...\n');

        // Анализируем DOM после загрузки результатов
        const resultsAnalysis = await page.evaluate(() => {
            const analysis = {
                allTexts: [],
                numbersFound: [],
                companyNames: [],
                potentialResults: [],
                classesWithNumbers: [],
                screenshot: window.location.href
            };

            // Ищем все текстовые элементы с цифрами
            const allElements = document.querySelectorAll('*');
            allElements.forEach((el, index) => {
                const text = el.textContent?.trim();
                if (text && text.length > 0 && text.length < 200) {
                    // Ищем числа, похожие на цены
                    if (/\d{3,5}/.test(text)) {
                        analysis.numbersFound.push({
                            text: text,
                            tagName: el.tagName,
                            className: el.className,
                            id: el.id,
                            index: index
                        });
                    }

                    // Ищем названия страховых компаний
                    const companyPatterns = ['USG', 'ARX', 'КНЯЖА', 'ЕТАЛОН', 'КРЕДО', 'ОРАНТА', 'УПСК', 'PZU', 'УНІКА', 'ІНГО'];
                    companyPatterns.forEach(company => {
                        if (text.includes(company)) {
                            analysis.companyNames.push({
                                company: company,
                                text: text,
                                tagName: el.tagName,
                                className: el.className,
                                id: el.id,
                                index: index
                            });
                        }
                    });

                    // Ищем слово "грн"
                    if (text.includes('грн') || text.includes('₴')) {
                        analysis.allTexts.push({
                            text: text,
                            tagName: el.tagName,
                            className: el.className,
                            id: el.id
                        });
                    }
                }

                // Анализируем классы элементов с числами
                if (el.className && /\d{3,5}/.test(el.textContent)) {
                    analysis.classesWithNumbers.push({
                        className: el.className,
                        text: el.textContent?.substring(0, 50),
                        tagName: el.tagName
                    });
                }
            });

            // Ищем структурированные блоки результатов
            const potentialContainers = [
                'div[class*="result"]',
                'div[class*="offer"]', 
                'div[class*="company"]',
                'div[class*="insurance"]',
                'div[class*="tariff"]',
                'div[class*="price"]',
                'div[class*="card"]',
                'div[class*="item"]',
                'table tr',
                '.listing tr'
            ];

            potentialContainers.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    analysis.potentialResults.push({
                        selector: selector,
                        count: elements.length,
                        firstElementText: elements[0]?.textContent?.substring(0, 100),
                        className: elements[0]?.className
                    });
                }
            });

            return analysis;
        });

        // Выводим результаты анализа
        console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
        console.log('='.repeat(60));

        console.log(`\n💰 НАЙДЕНО ЭЛЕМЕНТОВ С ЧИСЛАМИ: ${resultsAnalysis.numbersFound.length}`);
        resultsAnalysis.numbersFound.slice(0, 10).forEach((item, index) => {
            console.log(`${index + 1}. "${item.text}" (${item.tagName}.${item.className})`);
        });

        console.log(`\n🏢 НАЙДЕНО СТРАХОВЫХ КОМПАНИЙ: ${resultsAnalysis.companyNames.length}`);
        resultsAnalysis.companyNames.forEach((item, index) => {
            console.log(`${index + 1}. ${item.company}: "${item.text}" (${item.tagName}.${item.className})`);
        });

        console.log(`\n💵 ЭЛЕМЕНТЫ С "грн": ${resultsAnalysis.allTexts.length}`);
        resultsAnalysis.allTexts.slice(0, 5).forEach((item, index) => {
            console.log(`${index + 1}. "${item.text}" (${item.tagName}.${item.className})`);
        });

        console.log(`\n📦 ПОТЕНЦИАЛЬНЫЕ КОНТЕЙНЕРЫ РЕЗУЛЬТАТОВ:`);
        resultsAnalysis.potentialResults.forEach((item, index) => {
            if (item.count > 0) {
                console.log(`${index + 1}. ${item.selector}: ${item.count} элементов`);
                console.log(`   Пример: "${item.firstElementText}"`);
            }
        });

        console.log(`\n🔍 КЛАССЫ С ЧИСЛАМИ (топ 10):`);
        const uniqueClasses = [...new Map(resultsAnalysis.classesWithNumbers.map(item => [item.className, item])).values()];
        uniqueClasses.slice(0, 10).forEach((item, index) => {
            console.log(`${index + 1}. ${item.className} (${item.tagName}): "${item.text}"`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('💡 РЕКОМЕНДАЦИИ ДЛЯ СЕЛЕКТОРОВ:');
        
        // Автоматические рекомендации
        if (resultsAnalysis.companyNames.length > 0) {
            const firstCompany = resultsAnalysis.companyNames[0];
            console.log(`✅ Для компаний: .${firstCompany.className} или ${firstCompany.tagName}[class*="${firstCompany.className.split(' ')[0]}"]`);
        }

        if (resultsAnalysis.numbersFound.length > 0) {
            const firstNumber = resultsAnalysis.numbersFound[0];
            console.log(`✅ Для цен: .${firstNumber.className} или ${firstNumber.tagName}[class*="${firstNumber.className.split(' ')[0]}"]`);
        }

        const bestContainer = resultsAnalysis.potentialResults.find(item => item.count >= 3 && item.count <= 10);
        if (bestContainer) {
            console.log(`✅ Лучший контейнер: ${bestContainer.selector} (${bestContainer.count} элементов)`);
        }

        console.log('\n🌐 Браузер остается открытым для ручного исследования...');
        console.log('🔍 Откройте DevTools и изучите структуру результатов');
        console.log('⚠️  Закройте браузер вручную когда закончите');

    } catch (error) {
        console.error('❌ Ошибка:', error);
        await browser.close();
    }
}

if (require.main === module) {
    inspectResults();
}
