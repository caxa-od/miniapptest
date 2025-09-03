/**
 * МОНИТОРИНГ ПОЯВЛЕНИЯ РЕЗУЛЬТАТОВ В РЕАЛЬНОМ ВРЕМЕНИ
 * Отслеживаем что именно появляется после выбора 6 месяцев
 */

const puppeteer = require('puppeteer');

async function monitorResultsAppearance() {
    console.log('👁️ МОНИТОРИНГ ПОЯВЛЕНИЯ РЕЗУЛЬТАТОВ');
    console.log('=' .repeat(50));

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Видимый режим для наблюдения
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
        await page.waitForTimeout(1000);

        // Сохраняем состояние страницы ДО нажатия кнопки
        console.log('📷 Сохраняем состояние страницы ДО нажатия...');
        const beforeState = await page.evaluate(() => {
            return {
                bodyHTML: document.body.innerHTML.length,
                allElements: document.querySelectorAll('*').length,
                visibleElements: Array.from(document.querySelectorAll('*')).filter(el => 
                    el.offsetWidth > 0 && el.offsetHeight > 0
                ).length
            };
        });

        console.log(`   Элементов до: ${beforeState.allElements} (видимых: ${beforeState.visibleElements})`);

        // Настраиваем мониторинг изменений
        await page.evaluate(() => {
            window.changesLog = [];
            
            // Мониторим добавление новых элементов
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                const element = node;
                                const text = element.textContent?.trim() || '';
                                const hasPrice = text.match(/\d+.*₴|₴.*\d+|\d+\s*грн|грн\s*\d+/);
                                
                                if (hasPrice || element.className || element.id || text.length > 10) {
                                    window.changesLog.push({
                                        timestamp: Date.now(),
                                        type: 'added',
                                        tag: element.tagName,
                                        id: element.id,
                                        className: element.className,
                                        text: text.substring(0, 100),
                                        hasPrice: !!hasPrice,
                                        selector: element.id ? `#${element.id}` : 
                                                 element.className ? `.${element.className.split(' ')[0]}` :
                                                 element.tagName.toLowerCase()
                                    });
                                }
                            }
                        });
                    }
                });
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            console.log('🎯 MutationObserver запущен');
        });

        console.log('\n🔍 НАЖИМАЕМ КНОПКУ И МОНИТОРИМ...');
        await page.click('#btnCalculateNumber');

        // Мониторим изменения каждые 2 секунды в течение 30 секунд
        const monitoringDuration = 30000; // 30 секунд
        const checkInterval = 2000; // каждые 2 секунды
        let elapsed = 0;

        while (elapsed < monitoringDuration) {
            await page.waitForTimeout(checkInterval);
            elapsed += checkInterval;

            const currentState = await page.evaluate((currentElapsed) => {
                const changes = window.changesLog.slice(); // копируем лог
                window.changesLog = []; // очищаем для следующей итерации
                
                return {
                    timestamp: Date.now(),
                    elapsed: currentElapsed,
                    bodyHTML: document.body.innerHTML.length,
                    allElements: document.querySelectorAll('*').length,
                    visibleElements: Array.from(document.querySelectorAll('*')).filter(el => 
                        el.offsetWidth > 0 && el.offsetHeight > 0
                    ).length,
                    newChanges: changes,
                    currentPrices: Array.from(document.querySelectorAll('*')).filter(el => {
                        const text = el.textContent?.trim() || '';
                        return text.match(/^\d+\s*₴$|^\d+\s*грн$/) && text.length < 20;
                    }).map(el => ({
                        text: el.textContent.trim(),
                        tag: el.tagName,
                        className: el.className,
                        id: el.id
                    }))
                };
            }, elapsed);

            console.log(`\n⏰ ${elapsed/1000}s - Элементов: ${currentState.allElements} (видимых: ${currentState.visibleElements})`);

            if (currentState.newChanges.length > 0) {
                console.log(`   📝 Новых изменений: ${currentState.newChanges.length}`);
                currentState.newChanges.forEach((change, i) => {
                    if (change.hasPrice || change.text.length > 20) {
                        console.log(`      ${i+1}. ${change.tag} ${change.selector}: "${change.text}"`);
                    }
                });
            }

            if (currentState.currentPrices.length > 0) {
                console.log(`   💰 Текущие цены на странице:`);
                currentState.currentPrices.forEach((price, i) => {
                    console.log(`      ${i+1}. ${price.text} (${price.tag}${price.className ? '.' + price.className.split(' ')[0] : ''})`);
                });
            }

            // Если нашли цены, можем остановиться раньше
            if (currentState.currentPrices.length >= 3) {
                console.log('\n🎉 НАЙДЕНО ДОСТАТОЧНО ЦЕН! Останавливаем мониторинг...');
                break;
            }
        }

        // Финальный анализ страницы
        console.log('\n📊 ФИНАЛЬНЫЙ АНАЛИЗ СТРАНИЦЫ:');
        const finalAnalysis = await page.evaluate(() => {
            // Ищем все возможные элементы с ценами
            const priceElements = [];
            const allElements = document.querySelectorAll('*');
            
            allElements.forEach(el => {
                const text = el.textContent?.trim() || '';
                if (text.match(/\d+.*₴|₴.*\d+|\d+\s*грн|грн\s*\d+/) && text.length < 50) {
                    priceElements.push({
                        text: text,
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        selector: el.id ? `#${el.id}` : 
                                 el.className ? `.${el.className.split(' ')[0]}` :
                                 el.tagName.toLowerCase(),
                        parentSelector: el.parentElement?.id ? `#${el.parentElement.id}` :
                                       el.parentElement?.className ? `.${el.parentElement.className.split(' ')[0]}` :
                                       el.parentElement?.tagName.toLowerCase()
                    });
                }
            });

            return {
                totalPriceElements: priceElements.length,
                priceElements: priceElements,
                url: window.location.href,
                title: document.title
            };
        });

        console.log(`   💰 Всего элементов с ценами: ${finalAnalysis.totalPriceElements}`);
        if (finalAnalysis.priceElements.length > 0) {
            console.log('   📋 НАЙДЕННЫЕ ЦЕНЫ:');
            finalAnalysis.priceElements.forEach((price, i) => {
                console.log(`      ${i+1}. "${price.text}" - ${price.selector} (parent: ${price.parentSelector})`);
            });
        }

        console.log('\n⏱️ Ждем еще 10 секунд для наблюдения...');
        await page.waitForTimeout(10000);

        return finalAnalysis;

    } catch (error) {
        console.error('❌ Ошибка мониторинга:', error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Запуск мониторинга
if (require.main === module) {
    monitorResultsAppearance()
        .then((result) => {
            console.log('\n🎉 МОНИТОРИНГ ЗАВЕРШЕН!');
            if (result && result.totalPriceElements > 0) {
                console.log(`✅ Найдено ${result.totalPriceElements} элементов с ценами`);
            } else {
                console.log('❌ Элементы с ценами не найдены');
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { monitorResultsAppearance };
