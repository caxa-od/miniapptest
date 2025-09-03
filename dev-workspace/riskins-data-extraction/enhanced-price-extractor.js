/**
 * УЛУЧШЕННЫЙ ЭКСТРАКТОР С ПОЛНЫМИ И СКИДОЧНЫМИ ЦЕНАМИ
 * Извлекает и полную цену, и цену со скидкой для каждого предложения
 */

const puppeteer = require('puppeteer');

class EnhancedPriceExtractor {
    
    static async extractSinglePeriodWithDiscounts(plateNumber, months, headless = true) {
        console.log(`\n💰 ИЗВЛЕЧЕНИЕ ${months} МЕСЯЦЕВ (ПОЛНЫЕ + СКИДОЧНЫЕ ЦЕНЫ)`);
        console.log('=' .repeat(55));

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
            await page.waitForTimeout(5000);

            console.log('📊 Извлекаем полные и скидочные цены...');
            const offers = await page.evaluate(() => {
                const results = [];
                
                // Анализируем строки таблицы
                const rows = document.querySelectorAll('.Table__row');
                
                rows.forEach((row, rowIndex) => {
                    const priceCell = row.querySelector('.Table__cell_price');
                    if (!priceCell) return;
                    
                    const fullText = priceCell.textContent.trim();
                    let originalPrice = null;
                    let discountedPrice = null;
                    let discountPercent = null;
                    
                    // Ищем элемент со скидкой
                    const discountElement = priceCell.querySelector('.Table__discount');
                    
                    if (discountElement) {
                        // Есть скидка
                        const discountText = discountElement.textContent.trim();
                        
                        // Извлекаем процент скидки
                        const percentMatch = discountText.match(/(\d+)%/);
                        if (percentMatch) {
                            discountPercent = parseInt(percentMatch[1]);
                        }
                        
                        // Извлекаем оригинальную цену из элемента скидки
                        const originalPriceMatch = discountText.match(/(\d{4,5})\s*грн/);
                        if (originalPriceMatch) {
                            originalPrice = parseInt(originalPriceMatch[1]);
                        }
                        
                        // Извлекаем цену со скидкой из полного текста
                        // Ищем цену которая идет после скидки
                        const allPrices = fullText.match(/(\d{4,5})\s*грн/g);
                        if (allPrices && allPrices.length >= 2) {
                            const discountedMatch = allPrices[1].match(/(\d{4,5})/);
                            if (discountedMatch) {
                                discountedPrice = parseInt(discountedMatch[1]);
                            }
                        }
                    } else {
                        // Нет скидки, только одна цена
                        const priceMatch = fullText.match(/(\d{4,5})\s*грн/);
                        if (priceMatch) {
                            originalPrice = parseInt(priceMatch[1]);
                            discountedPrice = originalPrice; // Цена со скидкой = оригинальная цена
                            discountPercent = 0;
                        }
                    }
                    
                    if (originalPrice) {
                        const savings = originalPrice - discountedPrice;
                        
                        results.push({
                            index: results.length + 1,
                            company: `Предложение ${results.length + 1}`,
                            originalPrice: originalPrice,
                            discountedPrice: discountedPrice,
                            discountPercent: discountPercent,
                            savings: savings,
                            originalPriceFormatted: `${originalPrice}₴`,
                            discountedPriceFormatted: `${discountedPrice}₴`,
                            savingsFormatted: savings > 0 ? `${savings}₴` : '0₴'
                        });
                    }
                });

                return results;
            });

            // Вычисляем статистику
            const originalPrices = offers.map(o => o.originalPrice);
            const discountedPrices = offers.map(o => o.discountedPrice);
            
            const avgOriginal = originalPrices.length > 0 ? Math.round(originalPrices.reduce((a, b) => a + b) / originalPrices.length) : 0;
            const avgDiscounted = discountedPrices.length > 0 ? Math.round(discountedPrices.reduce((a, b) => a + b) / discountedPrices.length) : 0;
            const totalSavings = avgOriginal - avgDiscounted;

            console.log(`✅ Найдено ${offers.length} предложений:`);
            offers.forEach(offer => {
                if (offer.discountPercent > 0) {
                    console.log(`   ${offer.index}. ${offer.originalPriceFormatted} → ${offer.discountedPriceFormatted} (скидка ${offer.discountPercent}%, экономия ${offer.savingsFormatted})`);
                } else {
                    console.log(`   ${offer.index}. ${offer.originalPriceFormatted} (без скидки)`);
                }
            });
            
            console.log(`📊 Средние цены: ${avgOriginal}₴ → ${avgDiscounted}₴ (экономия ${totalSavings}₴)`);

            return {
                success: true,
                plateNumber: plateNumber,
                period: months,
                offers: offers,
                statistics: {
                    avgOriginalPrice: avgOriginal,
                    avgDiscountedPrice: avgDiscounted,
                    avgSavings: totalSavings,
                    offersCount: offers.length
                },
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

    static async comparePeriodsWithDiscounts(plateNumber, headless = true) {
        console.log(`\n🤖 ПОЛНОЕ СРАВНЕНИЕ С УЧЕТОМ СКИДОК`);
        console.log(`🚗 Номер: ${plateNumber}`);
        console.log('=' .repeat(60));

        // Извлекаем 6 месяцев
        const result6 = await this.extractSinglePeriodWithDiscounts(plateNumber, 6, headless);
        
        // Пауза между запросами
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Извлекаем 12 месяцев
        const result12 = await this.extractSinglePeriodWithDiscounts(plateNumber, 12, headless);

        // Анализируем результаты
        console.log('\n📊 ДЕТАЛЬНОЕ СРАВНЕНИЕ:');
        console.log('=' .repeat(50));

        const analysis = {
            plateNumber: plateNumber,
            period6: result6,
            period12: result12,
            comparison: null,
            timestamp: new Date().toISOString()
        };

        if (result6.success && result12.success) {
            const stats6 = result6.statistics;
            const stats12 = result12.statistics;

            console.log(`✅ Оба периода успешно обработаны`);
            console.log(`\n💰 ПОЛНЫЕ ЦЕНЫ (без скидки):`);
            console.log(`   6 месяцев:  ${stats6.avgOriginalPrice}₴ (${stats6.offersCount} предложений)`);
            console.log(`   12 месяцев: ${stats12.avgOriginalPrice}₴ (${stats12.offersCount} предложений)`);
            
            console.log(`\n💸 ЦЕНЫ СО СКИДКОЙ:`);
            console.log(`   6 месяцев:  ${stats6.avgDiscountedPrice}₴ (экономия ${stats6.avgSavings}₴)`);
            console.log(`   12 месяцев: ${stats12.avgDiscountedPrice}₴ (экономия ${stats12.avgSavings}₴)`);

            const originalDiff = stats12.avgOriginalPrice - stats6.avgOriginalPrice;
            const discountedDiff = stats12.avgDiscountedPrice - stats6.avgDiscountedPrice;
            const originalPercent = stats6.avgOriginalPrice > 0 ? Math.round((originalDiff / stats6.avgOriginalPrice) * 100) : 0;
            const discountedPercent = stats6.avgDiscountedPrice > 0 ? Math.round((discountedDiff / stats6.avgDiscountedPrice) * 100) : 0;

            console.log(`\n📈 РАЗНИЦА:`);
            console.log(`   Полные цены: ${originalDiff}₴ (${originalPercent > 0 ? '+' : ''}${originalPercent}%)`);
            console.log(`   Со скидкой:  ${discountedDiff}₴ (${discountedPercent > 0 ? '+' : ''}${discountedPercent}%)`);

            let recommendation;
            if (Math.abs(discountedPercent) < 5) {
                recommendation = 'Цены со скидкой примерно одинаковые, выбирайте удобный период';
            } else if (discountedPercent > 0) {
                recommendation = `12-месячная страховка со скидкой дороже на ${discountedPercent}%. Рассмотрите 6-месячную.`;
            } else {
                recommendation = `6-месячная страховка со скидкой дороже на ${Math.abs(discountedPercent)}%. Лучше взять 12-месячную.`;
            }

            console.log(`💡 Рекомендация: ${recommendation}`);

            analysis.comparison = {
                avgOriginalPrice6: stats6.avgOriginalPrice,
                avgOriginalPrice12: stats12.avgOriginalPrice,
                avgDiscountedPrice6: stats6.avgDiscountedPrice,
                avgDiscountedPrice12: stats12.avgDiscountedPrice,
                originalDifference: originalDiff,
                discountedDifference: discountedDiff,
                originalPercent: originalPercent,
                discountedPercent: discountedPercent,
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
    
    console.log('🎯 УЛУЧШЕННАЯ АВТОМАТИЗАЦИЯ С УЧЕТОМ СКИДОК');
    console.log('Извлекает полные цены и цены со скидкой');
    
    EnhancedPriceExtractor.comparePeriodsWithDiscounts(plateNumber, true)
        .then(result => {
            console.log('\n🎉 УЛУЧШЕННАЯ АВТОМАТИЗАЦИЯ ЗАВЕРШЕНА!');
            
            // Сохраняем результат в файл
            const fs = require('fs');
            const filename = `enhanced_comparison_${plateNumber.replace(/[^A-Z0-9]/g, '')}_${new Date().toISOString().split('T')[0]}.json`;
            fs.writeFileSync(filename, JSON.stringify(result, null, 2));
            console.log(`💾 Детальный результат сохранен: ${filename}`);
            
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { EnhancedPriceExtractor };
