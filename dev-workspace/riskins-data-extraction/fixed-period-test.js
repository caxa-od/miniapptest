/**
 * ИСПРАВЛЕННЫЙ ТЕСТ ПЕРИОДОВ - использует рабочие селекторы из final-extractor.js
 */

const puppeteer = require('puppeteer');

class FixedPeriodTester {
    constructor() {
        this.baseUrl = 'https://riskins-insurance.eua.in.ua/';
    }

    async testPeriod(vehicleNumber, months) {
        let browser;
        
        try {
            console.log(`\n🔄 Тест для ${months} месяцев...`);
            
            browser = await puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
            await page.setViewport({ width: 1366, height: 768 });

            console.log('  🌐 Открываем сайт...');
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });

            console.log(`  📝 Заполняем номер ${vehicleNumber}...`);
            await page.waitForSelector('#autoNumberSearch', { timeout: 10000 });
            await page.click('#autoNumberSearch');
            await page.keyboard.down('Meta');
            await page.keyboard.press('KeyA');
            await page.keyboard.up('Meta');
            await page.type('#autoNumberSearch', vehicleNumber);

            console.log(`  📅 ИНСТРУКЦИЯ: Выберите ${months} месяцев в поле "Період дії"`);
            console.log('  🎯 Затем нажмите "Розрахувати"');
            console.log('  ⏸️  После появления результатов нажмите ПРОБЕЛ...');

            // Ждем нажатия пробела как сигнал готовности
            await page.waitForFunction(() => {
                return new Promise(resolve => {
                    const handler = (e) => {
                        if (e.code === 'Space') {
                            document.removeEventListener('keydown', handler);
                            resolve(true);
                        }
                    };
                    document.addEventListener('keydown', handler);
                });
            }, { timeout: 120000 });

            console.log('  📊 Извлекаем данные...');

            // ИСПОЛЬЗУЕМ ТОЧНО ТЕ ЖЕ СЕЛЕКТОРЫ что и в final-extractor.js
            const offers = await page.evaluate(() => {
                const offers = [];

                // Ищем строки таблицы с результатами
                const tableRows = document.querySelectorAll('table tr, .Table tr');
                
                tableRows.forEach((row, index) => {
                    const rowText = row.textContent;
                    
                    // Пропускаем заголовки и пустые строки (ТОЧНО как в final-extractor.js)
                    if (!rowText || rowText.includes('Ціна') || rowText.includes('Компанія')) {
                        return;
                    }

                    // Извлекаем данные из строки (ТОЧНО как в final-extractor.js)
                    const priceCell = row.querySelector('.Table__cell_price, td[class*="price"], .price');
                    const discountCell = row.querySelector('.Table__discount, .discount');
                    
                    if (priceCell || rowText.includes('грн')) {
                        // Извлекаем цену (ТОЧНО как в final-extractor.js)
                        let currentPrice = 0;
                        let oldPrice = null;
                        
                        const priceText = priceCell ? priceCell.textContent : rowText;
                        const priceMatch = priceText.match(/(\d{3,5})\s*грн/g);
                        
                        if (priceMatch) {
                            // Если найдены цены
                            const prices = priceMatch.map(p => parseInt(p.replace(/\D/g, '')));
                            currentPrice = Math.min(...prices); // Текущая цена - минимальная
                            if (prices.length > 1) {
                                oldPrice = Math.max(...prices); // Старая цена - максимальная
                            }
                        }

                        // Извлекаем скидку (ТОЧНО как в final-extractor.js)
                        let discount = null;
                        if (discountCell) {
                            const discountMatch = discountCell.textContent.match(/(\d+)%/);
                            if (discountMatch) {
                                discount = parseInt(discountMatch[1]);
                            }
                        }

                        // Определяем название компании (ТОЧНО как в final-extractor.js)
                        let companyName = `Компания ${offers.length + 1}`;
                        const companyKeywords = {
                            'USG': /USG/i,
                            'ARX': /ARX/i,
                            'КНЯЖА': /(КНЯЖА|KNYAZHA)/i,
                            'ЕТАЛОН': /(ЕТАЛОН|ETALON)/i,
                            'КРЕДО': /(КРЕДО|KREDO)/i,
                            'ОРАНТА': /(ОРАНТА|ORANTA)/i,
                            'УПСК': /УПСК/i,
                            'PZU': /PZU/i,
                            'УНІКА': /(УНІКА|UNIKA)/i,
                            'ІНГО': /(ІНГО|INGO)/i,
                            'ПРОВІДНА': /(ПРОВІДНА|PROVIDNA)/i,
                            'АЛЬФА': /(АЛЬФА|ALFA)/i
                        };

                        for (const [company, pattern] of Object.entries(companyKeywords)) {
                            if (pattern.test(rowText)) {
                                companyName = company;
                                break;
                            }
                        }

                        // Фильтр разумных цен (ТОЧНО как в final-extractor.js)
                        if (currentPrice >= 1000 && currentPrice <= 20000) {
                            offers.push({
                                id: `offer_${index}`,
                                companyName,
                                price: currentPrice,
                                oldPrice,
                                discount,
                                currency: 'грн',
                                rawText: rowText.substring(0, 100)
                            });
                        }
                    }
                });

                return offers;
            });

            // Определяем выбранный период
            const selectedPeriod = await page.evaluate(() => {
                const selects = document.querySelectorAll('select');
                for (const select of selects) {
                    const selectedOption = select.options[select.selectedIndex];
                    if (selectedOption && selectedOption.text.includes('місяц')) {
                        return selectedOption.text.trim();
                    }
                }
                return 'Неопределено';
            });

            const result = {
                success: true,
                period: months,
                selectedPeriod,
                vehicleNumber,
                offers,
                totalOffers: offers.length,
                timestamp: new Date().toISOString()
            };

            console.log(`  ✅ Найдено ${offers.length} предложений для ${months} месяцев`);
            console.log(`  📅 Выбранный период: ${selectedPeriod}`);
            
            if (offers.length > 0) {
                console.log(`  💰 Цены: ${offers.map(o => o.price + '₴').join(', ')}`);
                const avgPrice = Math.round(offers.reduce((sum, o) => sum + o.price, 0) / offers.length);
                console.log(`  📊 Средняя: ${avgPrice}₴`);
            }

            return result;

        } catch (error) {
            console.error(`  ❌ Ошибка для ${months} месяцев:`, error.message);
            return {
                success: false,
                period: months,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async compareAllPeriods(vehicleNumber = 'AA1234AA') {
        console.log('🔍 ИСПРАВЛЕННОЕ СРАВНЕНИЕ ПЕРИОДОВ');
        console.log('=' .repeat(50));
        console.log('✨ Использует рабочие селекторы из final-extractor.js');
        console.log('');

        const periods = [6, 12];
        const results = [];

        for (const months of periods) {
            const result = await this.testPeriod(vehicleNumber, months);
            results.push(result);
            
            // Пауза между тестами
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n📊 СРАВНЕНИЕ РЕЗУЛЬТАТОВ:');
        console.log('=' .repeat(50));

        results.forEach(result => {
            if (result.success) {
                console.log(`\n📅 ${result.period} месяцев (${result.selectedPeriod}):`);
                console.log(`   ✅ Найдено: ${result.totalOffers} предложений`);
                if (result.offers.length > 0) {
                    const prices = result.offers.map(o => o.price).sort((a, b) => a - b);
                    console.log(`   💰 Цены: ${prices.join('₴, ')}₴`);
                    console.log(`   📈 Диапазон: ${Math.min(...prices)}₴ - ${Math.max(...prices)}₴`);
                }
            } else {
                console.log(`\n❌ ${result.period} месяцев: ${result.error}`);
            }
        });

        const successful = results.filter(r => r.success && r.offers.length > 0);
        if (successful.length >= 2) {
            console.log('\n🎯 ВЫВОДЫ:');
            const [result6, result12] = successful;
            
            const avg6 = result6.offers.reduce((sum, o) => sum + o.price, 0) / result6.offers.length;
            const avg12 = result12.offers.reduce((sum, o) => sum + o.price, 0) / result12.offers.length;
            
            console.log(`   📊 Средняя цена 6 мес: ${Math.round(avg6)}₴`);
            console.log(`   📊 Средняя цена 12 мес: ${Math.round(avg12)}₴`);
            console.log(`   📈 Разница: ${Math.round(Math.abs(avg12 - avg6))}₴`);
            
            if (Math.abs(avg12 - avg6) < 50) {
                console.log('   💡 Периоды не влияют на базовые цены');
            } else {
                console.log('   📊 Периоды влияют на ценообразование');
            }
        }

        return results;
    }
}

// Запуск тестирования
if (require.main === module) {
    const tester = new FixedPeriodTester();
    tester.compareAllPeriods('AA1234AA')
        .then(() => {
            console.log('\n🎉 Исправленное тестирование завершено!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ошибка тестирования:', error);
            process.exit(1);
        });
}

module.exports = FixedPeriodTester;
