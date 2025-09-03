/**
 * УЛУЧШЕННЫЙ СЕЛЕКТОР ПЕРИОДА
 * Пробуем разные методы взаимодействия с кастомным Select
 */

const puppeteer = require('puppeteer');

class AdvancedPeriodSelector {
    constructor(page) {
        this.page = page;
    }

    async selectPeriodMethod1(months) {
        console.log(`🔄 Метод 1: Клик по label опции (${months} месяцев)`);
        
        try {
            await this.page.waitForSelector('#coverageTime', { timeout: 10000 });
            
            // Открываем селектор
            await this.page.click('#coverageTime');
            await this.page.waitForTimeout(500);
            
            // Ищем label с нужным текстом
            const targetText = `${months} місяців`;
            const labels = await this.page.$$('#coverageTime .Select__option');
            
            for (const label of labels) {
                const text = await label.evaluate(el => el.textContent.trim());
                if (text === targetText) {
                    await label.click();
                    await this.page.waitForTimeout(1000);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error(`❌ Метод 1 ошибка: ${error.message}`);
            return false;
        }
    }

    async selectPeriodMethod2(months) {
        console.log(`🔄 Метод 2: Поиск radio input (${months} месяцев)`);
        
        try {
            await this.page.waitForSelector('#coverageTime', { timeout: 10000 });
            
            // Открываем селектор
            await this.page.click('#coverageTime');
            await this.page.waitForTimeout(500);
            
            // Ищем скрытые radio inputs
            const targetText = `${months} місяців`;
            const result = await this.page.evaluate((text) => {
                const radios = document.querySelectorAll('#coverageTime input[type="radio"]');
                for (const radio of radios) {
                    const label = radio.parentElement?.textContent?.trim();
                    if (label && label.includes(text)) {
                        radio.click();
                        return true;
                    }
                }
                return false;
            }, targetText);
            
            await this.page.waitForTimeout(1000);
            return result;
        } catch (error) {
            console.error(`❌ Метод 2 ошибка: ${error.message}`);
            return false;
        }
    }

    async selectPeriodMethod3(months) {
        console.log(`🔄 Метод 3: Прямой click по тексту (${months} месяцев)`);
        
        try {
            await this.page.waitForSelector('#coverageTime', { timeout: 10000 });
            
            // Открываем селектор
            await this.page.click('#coverageTime');
            await this.page.waitForTimeout(500);
            
            // Клик по тексту опции
            const targetText = `${months} місяців`;
            const clicked = await this.page.evaluate((text) => {
                const elements = Array.from(document.querySelectorAll('#coverageTime *'));
                for (const el of elements) {
                    if (el.textContent?.trim() === text) {
                        el.click();
                        return true;
                    }
                }
                return false;
            }, targetText);
            
            await this.page.waitForTimeout(1000);
            return clicked;
        } catch (error) {
            console.error(`❌ Метод 3 ошибка: ${error.message}`);
            return false;
        }
    }

    async selectPeriodMethod4(months) {
        console.log(`🔄 Метод 4: Событие change (${months} месяцев)`);
        
        try {
            await this.page.waitForSelector('#coverageTime', { timeout: 10000 });
            
            const targetText = `${months} місяців`;
            const result = await this.page.evaluate((text) => {
                const coverageTime = document.querySelector('#coverageTime');
                if (!coverageTime) return false;
                
                // Пробуем изменить значение и вызвать события
                const event = new Event('change', { bubbles: true });
                const clickEvent = new Event('click', { bubbles: true });
                
                coverageTime.dispatchEvent(clickEvent);
                
                // Ищем элементы с текстом
                const elements = coverageTime.querySelectorAll('*');
                for (const el of elements) {
                    if (el.textContent?.trim() === text) {
                        el.click();
                        el.dispatchEvent(clickEvent);
                        el.dispatchEvent(event);
                        return true;
                    }
                }
                return false;
            }, targetText);
            
            await this.page.waitForTimeout(1000);
            return result;
        } catch (error) {
            console.error(`❌ Метод 4 ошибка: ${error.message}`);
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

    async testAllMethods(months) {
        console.log(`\n🧪 ТЕСТИРУЕМ ВСЕ МЕТОДЫ ДЛЯ ${months} МЕСЯЦЕВ`);
        console.log('-'.repeat(50));

        const methods = [
            { name: 'Метод 1', func: this.selectPeriodMethod1 },
            { name: 'Метод 2', func: this.selectPeriodMethod2 },
            { name: 'Метод 3', func: this.selectPeriodMethod3 },
            { name: 'Метод 4', func: this.selectPeriodMethod4 }
        ];

        for (const method of methods) {
            console.log(`\n📝 Период до: ${await this.getCurrentPeriod()}`);
            const result = await method.func.call(this, months);
            console.log(`📝 Период после: ${await this.getCurrentPeriod()}`);
            console.log(`${method.name}: ${result ? '✅ Успех' : '❌ Неудача'}`);
            
            if (result) {
                console.log(`🎉 ${method.name} СРАБОТАЛ!`);
                return true;
            }
            
            await this.page.waitForTimeout(1000);
        }

        return false;
    }
}

// Тестируем все методы
async function testAllPeriodMethods() {
    console.log('🧪 ТЕСТ ВСЕХ МЕТОДОВ СЕЛЕКТОРА ПЕРИОДА');
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

        const selector = new AdvancedPeriodSelector(page);

        // Тестируем 6 месяцев
        const result6 = await selector.testAllMethods(6);
        
        await page.waitForTimeout(2000);
        
        // Тестируем 12 месяцев
        const result12 = await selector.testAllMethods(12);

        console.log('\n📊 РЕЗУЛЬТАТЫ:');
        console.log(`6 месяцев: ${result6 ? '✅ Найден рабочий метод' : '❌ Все методы неудачны'}`);
        console.log(`12 месяцев: ${result12 ? '✅ Найден рабочий метод' : '❌ Все методы неудачны'}`);

        console.log('\n⏱️ Ждем 5 секунд...');
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
    testAllPeriodMethods()
        .then((result) => {
            console.log('\n🎉 ПОЛНЫЙ ТЕСТ ЗАВЕРШЕН!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { AdvancedPeriodSelector };
