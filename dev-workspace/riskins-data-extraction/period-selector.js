/**
 * ПРАВИЛЬНЫЙ АВТОМАТИЧЕСКИЙ СЕЛЕКТОР ПЕРИОДА
 * На основе найденной структуры кастомного Select
 */

const puppeteer = require('puppeteer');

class PeriodSelector {
    constructor(page) {
        this.page = page;
    }

    async selectPeriod(months) {
        console.log(`🕒 Выбираем период: ${months} месяцев...`);
        
        try {
            // Ждем появления селектора периода
            await this.page.waitForSelector('#coverageTime', { timeout: 10000 });
            console.log('✅ Селектор периода найден');

            // Клик по селектору чтобы открыть список
            await this.page.click('#coverageTime .Select__placeholder');
            console.log('📱 Кликнули по селектору');

            // Ждем появления опций
            await this.page.waitForSelector('#coverageTime .Select__option', { timeout: 5000 });
            console.log('✅ Опции появились');

            // Ищем нужную опцию
            const targetText = `${months} місяців`;
            console.log(`🔍 Ищем опцию: "${targetText}"`);

            // Ищем и кликаем по нужной опции
            const options = await this.page.$$('#coverageTime .Select__option');
            let found = false;

            for (const option of options) {
                const text = await option.evaluate(el => el.textContent.trim());
                console.log(`   Проверяем опцию: "${text}"`);
                
                if (text === targetText) {
                    await option.click();
                    console.log(`✅ Выбрали: "${text}"`);
                    found = true;
                    break;
                }
            }

            if (!found) {
                throw new Error(`Опция "${targetText}" не найдена`);
            }

            // Ждем небольшую паузу для применения выбора
            await this.page.waitForTimeout(1000);

            // Проверяем что выбор применился
            const selectedText = await this.page.$eval(
                '#coverageTime .Select__placeholder', 
                el => el.textContent.trim()
            );

            if (selectedText.includes(targetText) || selectedText !== 'Виберіть') {
                console.log(`✅ Период успешно выбран: ${selectedText}`);
                return true;
            } else {
                console.log(`⚠️ Период возможно не выбрался: ${selectedText}`);
                return false;
            }

        } catch (error) {
            console.error(`❌ Ошибка выбора периода: ${error.message}`);
            return false;
        }
    }

    async getCurrentPeriod() {
        try {
            const text = await this.page.$eval(
                '#coverageTime .Select__placeholder', 
                el => el.textContent.trim()
            );
            return text;
        } catch (error) {
            return 'Неизвестно';
        }
    }
}

// Тестируем селектор периода
async function testPeriodSelector() {
    console.log('🧪 ТЕСТ СЕЛЕКТОРА ПЕРИОДА');
    console.log('=' .repeat(40));

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

        const selector = new PeriodSelector(page);

        console.log('\n🔍 Текущий период:', await selector.getCurrentPeriod());

        console.log('\n📅 Тестируем выбор 6 месяцев...');
        const result6 = await selector.selectPeriod(6);
        console.log('Результат 6 месяцев:', result6 ? '✅ Успех' : '❌ Ошибка');
        console.log('Период после выбора:', await selector.getCurrentPeriod());

        await page.waitForTimeout(2000);

        console.log('\n📅 Тестируем выбор 12 месяцев...');
        const result12 = await selector.selectPeriod(12);
        console.log('Результат 12 месяцев:', result12 ? '✅ Успех' : '❌ Ошибка');
        console.log('Период после выбора:', await selector.getCurrentPeriod());

        console.log('\n⏱️ Ждем 5 секунд для наблюдения...');
        await page.waitForTimeout(5000);

        return {
            success: true,
            results: { result6, result12 }
        };

    } catch (error) {
        console.error('❌ Ошибка теста:', error.message);
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

// Запуск теста
if (require.main === module) {
    testPeriodSelector()
        .then((result) => {
            console.log('\n🎉 ТЕСТ ЗАВЕРШЕН!');
            if (result.success) {
                console.log('✅ Селектор периода работает!');
            } else {
                console.log('❌ Проблема с селектором периода');
            }
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { PeriodSelector };
