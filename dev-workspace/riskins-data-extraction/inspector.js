/**
 * Инспектор для изучения реальной структуры сайта Riskins
 */

const puppeteer = require('puppeteer');

async function inspectRiskinsStructure() {
    console.log('🔍 Запускаем инспектор структуры Riskins...\n');
    
    const browser = await puppeteer.launch({
        headless: false, // Показываем браузер
        devtools: true,  // Открываем DevTools
        args: ['--start-maximized']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    console.log('🌐 Открываем страницу https://riskins-insurance.eua.in.ua/');
    await page.goto('https://riskins-insurance.eua.in.ua/', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
    });

    console.log('⏱️  Даем 5 секунд на изучение страницы...');
    await page.waitForTimeout(5000);

    // Извлекаем информацию о форме
    console.log('📋 Анализируем структуру формы...\n');
    
    const formInfo = await page.evaluate(() => {
        const info = {
            forms: [],
            inputs: [],
            buttons: [],
            selects: []
        };

        // Находим все формы
        document.querySelectorAll('form').forEach((form, index) => {
            info.forms.push({
                index,
                id: form.id,
                className: form.className,
                action: form.action,
                method: form.method
            });
        });

        // Находим все поля ввода
        document.querySelectorAll('input').forEach((input, index) => {
            info.inputs.push({
                index,
                type: input.type,
                name: input.name,
                id: input.id,
                className: input.className,
                placeholder: input.placeholder,
                value: input.value
            });
        });

        // Находим все кнопки
        document.querySelectorAll('button, input[type="submit"]').forEach((btn, index) => {
            info.buttons.push({
                index,
                type: btn.type,
                textContent: btn.textContent?.trim(),
                className: btn.className,
                id: btn.id
            });
        });

        // Находим все селекты
        document.querySelectorAll('select').forEach((select, index) => {
            info.selects.push({
                index,
                name: select.name,
                id: select.id,
                className: select.className,
                options: Array.from(select.options).map(opt => ({
                    value: opt.value,
                    text: opt.textContent
                }))
            });
        });

        return info;
    });

    // Выводим результат анализа
    console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА:');
    console.log('='.repeat(50));
    
    console.log('\n🏷️  ФОРМЫ:');
    formInfo.forms.forEach(form => {
        console.log(`  ${form.index}: id="${form.id}" class="${form.className}"`);
        console.log(`       action="${form.action}" method="${form.method}"`);
    });

    console.log('\n📝 ПОЛЯ ВВОДА:');
    formInfo.inputs.forEach(input => {
        console.log(`  ${input.index}: type="${input.type}" name="${input.name}"`);
        console.log(`       id="${input.id}" class="${input.className}"`);
        console.log(`       placeholder="${input.placeholder}"`);
    });

    console.log('\n🔘 КНОПКИ:');
    formInfo.buttons.forEach(btn => {
        console.log(`  ${btn.index}: "${btn.textContent}" type="${btn.type}"`);
        console.log(`       class="${btn.className}" id="${btn.id}"`);
    });

    console.log('\n📊 СЕЛЕКТЫ:');
    formInfo.selects.forEach(select => {
        console.log(`  ${select.index}: name="${select.name}" id="${select.id}"`);
        console.log(`       class="${select.className}"`);
        console.log(`       options: ${select.options.length} штук`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('🎯 РЕКОМЕНДАЦИИ ДЛЯ СЕЛЕКТОРОВ:');
    
    // Анализируем и предлагаем селекторы
    const recommendations = [];
    
    // Ищем поле для номера автомобиля
    const vehicleInput = formInfo.inputs.find(input => 
        input.placeholder?.toLowerCase().includes('номер') ||
        input.name?.toLowerCase().includes('number') ||
        input.name?.toLowerCase().includes('vehicle') ||
        input.id?.toLowerCase().includes('number')
    );
    
    if (vehicleInput) {
        recommendations.push(`Номер автомобиля: input[name="${vehicleInput.name}"] или #${vehicleInput.id}`);
    } else {
        recommendations.push('Номер автомобиля: НЕ НАЙДЕН - проверьте вручную');
    }

    // Ищем кнопку отправки
    const submitBtn = formInfo.buttons.find(btn =>
        btn.type === 'submit' ||
        btn.textContent?.toLowerCase().includes('розрахувати') ||
        btn.textContent?.toLowerCase().includes('розрахунок') ||
        btn.textContent?.toLowerCase().includes('calculate')
    );
    
    if (submitBtn) {
        recommendations.push(`Кнопка отправки: button содержащая "${submitBtn.textContent}"`);
    } else {
        recommendations.push('Кнопка отправки: НЕ НАЙДЕНА - проверьте вручную');
    }

    recommendations.forEach(rec => console.log(`✅ ${rec}`));

    console.log('\n🔧 Теперь можно скорректировать селекторы в puppeteer-solution.js');
    console.log('💡 Браузер остается открытым для ручного исследования...');
    console.log('⚠️  Закройте браузер вручную когда закончите изучение');

    // НЕ закрываем браузер автоматически
    // await browser.close();
    
    return formInfo;
}

// Запуск инспектора
if (require.main === module) {
    inspectRiskinsStructure().catch(console.error);
}

module.exports = { inspectRiskinsStructure };
