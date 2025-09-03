/**
 * АНАЛИЗАТОР СТРУКТУРЫ ЦЕН
 * Проверяем как отображаются полные цены и цены со скидкой
 */

const puppeteer = require('puppeteer');

async function analyzePriceStructure(plateNumber) {
    console.log(`🔍 АНАЛИЗ СТРУКТУРЫ ЦЕН ДЛЯ ${plateNumber}`);
    console.log('=' .repeat(50));

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Видимый режим для анализа
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

        console.log('⏳ Ждем результаты...');
        await page.waitForSelector('.Table__cell', { timeout: 45000 });
        await page.waitForTimeout(5000);

        console.log('📊 Анализируем структуру цен...');
        const priceAnalysis = await page.evaluate(() => {
            const analysis = {
                tableRows: [],
                allPriceElements: [],
                discountElements: [],
                cellStructure: []
            };

            // Анализируем строки таблицы
            const rows = document.querySelectorAll('.Table__row');
            rows.forEach((row, rowIndex) => {
                const rowData = {
                    rowIndex: rowIndex,
                    cells: [],
                    allText: row.textContent.trim()
                };

                const cells = row.querySelectorAll('.Table__cell');
                cells.forEach((cell, cellIndex) => {
                    const cellData = {
                        cellIndex: cellIndex,
                        text: cell.textContent.trim(),
                        className: cell.className,
                        innerHTML: cell.innerHTML,
                        hasDiscount: cell.querySelector('.Table__discount') !== null,
                        discountInfo: null
                    };

                    // Анализируем скидки
                    const discountEl = cell.querySelector('.Table__discount');
                    if (discountEl) {
                        cellData.discountInfo = {
                            discountText: discountEl.textContent.trim(),
                            spans: Array.from(discountEl.querySelectorAll('span')).map(span => span.textContent.trim())
                        };
                    }

                    rowData.cells.push(cellData);
                });

                analysis.tableRows.push(rowData);
            });

            // Ищем все элементы с ценами
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const text = el.textContent?.trim() || '';
                
                // Ищем цены в гривнах
                if (text.match(/\d+\s*грн/) && text.length < 100) {
                    analysis.allPriceElements.push({
                        tag: el.tagName,
                        className: el.className,
                        text: text,
                        parent: el.parentElement?.className || '',
                        hasPercent: text.includes('%')
                    });
                }

                // Ищем элементы со скидками
                if (text.includes('%') && text.match(/\d+%/) && text.length < 50) {
                    analysis.discountElements.push({
                        tag: el.tagName,
                        className: el.className,
                        text: text,
                        parent: el.parentElement?.className || ''
                    });
                }
            });

            return analysis;
        });

        console.log('\n📋 АНАЛИЗ СТРУКТУРЫ:');
        console.log(`Найдено строк таблицы: ${priceAnalysis.tableRows.length}`);
        console.log(`Найдено элементов с ценами: ${priceAnalysis.allPriceElements.length}`);
        console.log(`Найдено элементов со скидками: ${priceAnalysis.discountElements.length}`);

        console.log('\n💰 СТРУКТУРА СТРОК ТАБЛИЦЫ:');
        priceAnalysis.tableRows.forEach((row, i) => {
            if (row.cells.length > 0) {
                console.log(`\nСтрока ${i + 1}:`);
                row.cells.forEach((cell, j) => {
                    if (cell.text.includes('грн') || cell.hasDiscount) {
                        console.log(`   Ячейка ${j + 1} (${cell.className}):`);
                        console.log(`     Текст: "${cell.text}"`);
                        if (cell.discountInfo) {
                            console.log(`     Скидка: "${cell.discountInfo.discountText}"`);
                            console.log(`     Spans: [${cell.discountInfo.spans.join(', ')}]`);
                        }
                    }
                });
            }
        });

        console.log('\n🏷️ ЭЛЕМЕНТЫ СО СКИДКАМИ:');
        priceAnalysis.discountElements.forEach((el, i) => {
            console.log(`${i + 1}. ${el.className}: "${el.text}"`);
        });

        console.log('\n⏱️ Ждем 10 секунд для наблюдения...');
        await page.waitForTimeout(10000);

        return priceAnalysis;

    } catch (error) {
        console.error('❌ Ошибка анализа:', error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Запуск анализа
if (require.main === module) {
    const plateNumber = process.argv[2] || 'AA1111AA';
    
    analyzePriceStructure(plateNumber)
        .then(result => {
            console.log('\n🎉 АНАЛИЗ ЗАВЕРШЕН!');
            if (result) {
                // Сохраняем результат
                const fs = require('fs');
                const filename = `price_structure_${plateNumber.replace(/[^A-Z0-9]/g, '')}.json`;
                fs.writeFileSync(filename, JSON.stringify(result, null, 2));
                console.log(`💾 Структура сохранена: ${filename}`);
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ошибка:', error);
            process.exit(1);
        });
}

module.exports = { analyzePriceStructure };
