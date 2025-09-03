/**
 * ФИНАЛЬНАЯ АВТОМАТИЗАЦИЯ СРАВНЕНИЯ ПЕРИОДОВ
 * Полностью рабочая версия с отдельными браузерами для каждого периода
 */

const puppeteer = require('puppeteer');

class FinalAutomation {
    
    static async extractSinglePeriod(plateNumber, months, headless = true) {
        console.log(`\n💰 ИЗВЛЕЧЕНИЕ ${months} МЕСЯЦЕВ`);
        console.log('=' .repeat(40));

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

            // Выбираем период только если не 12 месяцев
            if (months !== 12) {
                console.log(`🕒 Выбираем период: ${months} месяцев...`);
                await page.waitForSelector('#coverageTime', { timeout: 10000 });
                await page.click('#coverageTime');
                await page.waitForTimeout(500);
                
                const targetText = `${months} місяців`;
                const labels = await page.$$('#coverageTime .Select__option');
                
                let found = false;
                for (const label of labels) {
                    const text = await label.evaluate(el => el.textContent.trim());
                    if (text === targetText) {
                        await label.click();
                        await page.waitForTimeout(1000);
                        console.log(`✅ Выбран период: ${targetText}`);
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    throw new Error(`Период "${targetText}" не найден`);
                }
            } else {
                console.log('🕒 Используем период по умолчанию (12 месяцев)');
            }

            console.log('🔍 Отправляем запрос...');
            await page.click('#btnCalculateNumber');

            console.log('⏳ Ждем результаты...');
            await page.waitForSelector('.Table__cell', { timeout: 45000 });
            await page.waitForTimeout(5000); // Увеличиваем время ожидания

            console.log('📊 Извлекаем данные...');
            const offers = await page.evaluate(() => {
                const results = [];
                const foundPrices = new Set();
                
                // Ищем все элементы с ценами (не только Table__cell)
                const allElements = document.querySelectorAll('*');
                allElements.forEach(el => {
                    const text = el.textContent?.trim() || '';
                    // Более гибкий поиск цен в формате "XXXX грн"
                    const priceMatch = text.match(/(\d{4,5})\s*грн/);
                    if (priceMatch && !foundPrices.has(priceMatch[1])) {
                        // Проверяем что это не часть большого текста с несколькими ценами
                        if (text.length < 50 || text.match(/^\d{4,5}\s*грн$/)) {
                            foundPrices.add(priceMatch[1]);
                            results.push({
                                company: `Предложение ${results.length + 1}`,
                                price: priceMatch[1] + '₴',
                                index: results.length + 1
                            });
                        }
                    }
                });

                return results;
            });

            const prices = offers.map(o => parseInt(o.price.replace('₴', '')));
            const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b) / prices.length) : 0;

            console.log(`✅ Найдено ${offers.length} предложений:`);
            offers.forEach(offer => {
                console.log(`   ${offer.index}. ${offer.price}`);
            });
            console.log(`📊 Среднее: ${avgPrice}₴`);

            return {
                success: true,
                plateNumber: plateNumber,
                period: months,
                offers: offers,
                avgPrice: avgPrice,
                extractedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error(`❌ Ошибка ${months} месяцев: ${error.message}`);
            return {
                success: false,
                error: error.message,
                period: months
            };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    static async comparePeriodsAutomated(plateNumber, headless = true) {
        console.log(`\n🤖 АВТОМАТИЧЕСКОЕ СРАВНЕНИЕ ПЕРИОДОВ`);
        console.log(`🚗 Номер: ${plateNumber}`);
        console.log('=' .repeat(60));

        // Извлекаем 6 месяцев
        const result6 = await this.extractSinglePeriod(plateNumber, 6, headless);
        
        // Пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Извлекаем 12 месяцев
        const result12 = await this.extractSinglePeriod(plateNumber, 12, headless);

        // Анализируем результаты
        console.log('\n📊 СРАВНИТЕЛЬНЫЙ АНАЛИЗ:');
        console.log('=' .repeat(40));

        const analysis = {
            plateNumber: plateNumber,
            period6: result6,
            period12: result12,
            comparison: null,
            timestamp: new Date().toISOString()
        };

        if (result6.success && result12.success) {
            const diff = result12.avgPrice - result6.avgPrice;
            const diffPercent = result6.avgPrice > 0 ? Math.round((diff / result6.avgPrice) * 100) : 0;

            console.log(`✅ Оба периода успешно обработаны`);
            console.log(`\n💰 Результаты:`);
            console.log(`   6 месяцев:  ${result6.avgPrice}₴ (${result6.offers.length} предложений)`);
            console.log(`   12 месяцев: ${result12.avgPrice}₴ (${result12.offers.length} предложений)`);
            console.log(`   Разница:    ${diff}₴ (${diffPercent > 0 ? '+' : ''}${diffPercent}%)`);

            let recommendation;
            if (Math.abs(diffPercent) < 5) {
                recommendation = 'Цены примерно одинаковые, выбирайте удобный период';
            } else if (diffPercent > 0) {
                recommendation = `12-месячная страховка дороже на ${diffPercent}%. Рассмотрите 6-месячную.`;
            } else {
                recommendation = `6-месячная страховка дороже на ${Math.abs(diffPercent)}%. Лучше взять 12-месячную.`;
            }

            console.log(`💡 Рекомендация: ${recommendation}`);

            analysis.comparison = {
                avgPrice6: result6.avgPrice,
                avgPrice12: result12.avgPrice,
                difference: diff,
                differencePercent: diffPercent,
                recommendation: recommendation
            };

        } else {
            console.log('❌ Ошибка в одном или обоих периодах');
            if (!result6.success) console.log(`   6 месяцев: ${result6.error}`);
            if (!result12.success) console.log(`   12 месяцев: ${result12.error}`);
        }

        return analysis;
    }
}

// Экспорт и запуск
if (require.main === module) {
    const args = process.argv.slice(2);
    const plateNumber = args[0] || 'AA1111AA';
    
    console.log('🎯 ФИНАЛЬНАЯ АВТОМАТИЗАЦИЯ СРАВНЕНИЯ ПЕРИОДОВ');
    console.log('Полностью автоматический скрытый режим');
    
    FinalAutomation.comparePeriodsAutomated(plateNumber, true)
        .then(result => {
            console.log('\n🎉 АВТОМАТИЗАЦИЯ ЗАВЕРШЕНА!');
            
            // Сохраняем результат в файл
            const fs = require('fs');
            const filename = `comparison_${plateNumber.replace(/[^A-Z0-9]/g, '')}_${new Date().toISOString().split('T')[0]}.json`;
            fs.writeFileSync(filename, JSON.stringify(result, null, 2));
            console.log(`💾 Результат сохранен: ${filename}`);
            
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { FinalAutomation };
