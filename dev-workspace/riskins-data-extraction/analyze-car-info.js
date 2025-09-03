/**
 * АНАЛИЗАТОР ИНФОРМАЦИИ ОБ АВТОМОБИЛЕ
 * Находим где отображается марка, модель и характеристики автомобиля
 */

const puppeteer = require('puppeteer');

async function analyzeCarInfo(plateNumber) {
    console.log(`🚗 АНАЛИЗ ИНФОРМАЦИИ ОБ АВТОМОБИЛЕ`);
    console.log(`Номер: ${plateNumber}`);
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

        console.log('🔍 Ищем информацию об автомобиле...');
        const carInfo = await page.evaluate(() => {
            const results = {
                carInfoElements: [],
                possibleCarInfo: [],
                allRelevantText: []
            };

            // Ищем элементы с информацией об автомобиле
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const text = el.textContent?.trim() || '';
                
                // Ищем элементы с информацией об автомобиле
                if (text.length > 20 && text.length < 200 && 
                    (text.includes('легковий') || 
                     text.includes('вантажний') ||
                     text.includes('см3') ||
                     text.includes('MERCEDES') ||
                     text.includes('BMW') ||
                     text.includes('TOYOTA') ||
                     text.includes('VOLKSWAGEN') ||
                     text.includes('м. Київ') ||
                     text.includes('Україна') ||
                     text.includes('автомобіль'))) {
                    
                    results.carInfoElements.push({
                        tag: el.tagName,
                        className: el.className,
                        id: el.id,
                        text: text,
                        selector: el.id ? `#${el.id}` : 
                                 el.className ? `.${el.className.split(' ')[0]}` :
                                 el.tagName.toLowerCase()
                    });
                }

                // Ищем текст с маркой автомобиля
                if (text.match(/[A-Z]{2,}\s*[A-Z0-9\s\-]+/) && text.length < 100) {
                    results.possibleCarInfo.push({
                        text: text,
                        tag: el.tagName,
                        className: el.className
                    });
                }

                // Собираем весь релевантный текст
                if (text.includes('см3') || text.includes('автомобіль') || 
                    text.match(/\d{4}\s*-\s*\d{4}/) || text.includes('м. Київ')) {
                    results.allRelevantText.push(text);
                }
            });

            // Ищем специфические селекторы
            const specificSelectors = [
                '.decor-bottom',
                '.car-info',
                '.vehicle-info', 
                '.auto-info',
                '.result-header',
                '.calculation-info'
            ];

            specificSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    const text = el.textContent?.trim();
                    if (text && text.length > 10) {
                        results.carInfoElements.push({
                            selector: selector,
                            text: text,
                            found: true
                        });
                    }
                });
            });

            return results;
        });

        console.log('\n📋 РЕЗУЛЬТАТЫ АНАЛИЗА:');
        console.log(`Найдено элементов с информацией об авто: ${carInfo.carInfoElements.length}`);
        console.log(`Найдено возможной информации: ${carInfo.possibleCarInfo.length}`);
        console.log(`Найдено релевантного текста: ${carInfo.allRelevantText.length}`);

        if (carInfo.carInfoElements.length > 0) {
            console.log('\n🚗 ЭЛЕМЕНТЫ С ИНФОРМАЦИЕЙ ОБ АВТОМОБИЛЕ:');
            carInfo.carInfoElements.forEach((info, i) => {
                console.log(`\n${i + 1}. ${info.selector || info.tag}:`);
                console.log(`   "${info.text}"`);
            });
        }

        if (carInfo.possibleCarInfo.length > 0) {
            console.log('\n🔍 ВОЗМОЖНАЯ ИНФОРМАЦИЯ О МАРКЕ:');
            carInfo.possibleCarInfo.slice(0, 5).forEach((info, i) => {
                console.log(`${i + 1}. "${info.text}"`);
            });
        }

        if (carInfo.allRelevantText.length > 0) {
            console.log('\n📝 ВЕСЬ РЕЛЕВАНТНЫЙ ТЕКСТ:');
            carInfo.allRelevantText.slice(0, 5).forEach((text, i) => {
                console.log(`${i + 1}. "${text}"`);
            });
        }

        console.log('\n⏱️ Ждем 10 секунд для наблюдения...');
        await page.waitForTimeout(10000);

        return carInfo;

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
    
    analyzeCarInfo(plateNumber)
        .then(result => {
            console.log('\n🎉 АНАЛИЗ ЗАВЕРШЕН!');
            if (result) {
                // Сохраняем результат
                const fs = require('fs');
                const filename = `car_info_${plateNumber.replace(/[^A-Z0-9]/g, '')}.json`;
                fs.writeFileSync(filename, JSON.stringify(result, null, 2));
                console.log(`💾 Информация сохранена: ${filename}`);
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ошибка:', error);
            process.exit(1);
        });
}

module.exports = { analyzeCarInfo };
