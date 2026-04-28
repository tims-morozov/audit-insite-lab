require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 5000;

// Агент для игнорирования ошибок SSL
const httpsAgent = new https.Agent({  
  rejectUnauthorized: false,
  keepAlive: true,
  ciphers: 'ALL'
});

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 screenshots

app.post('/api/audit', async (req, res) => {
    let { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }

    try {
        // 1. Статический анализ через Cheerio (быстро)
        const fetchStartTime = Date.now();
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            },
            timeout: 30000,
            httpsAgent: httpsAgent,
            maxRedirects: 10,
            validateStatus: (status) => status < 500
        });
        const htmlFetchTimeMs = Date.now() - fetchStartTime;

        const html = response.data;
        const $ = cheerio.load(html);

        // Маркетинг и Аналитика
        const scripts = $('script').map((i, el) => $(el).attr('src') || $(el).html()).get().join(' ');
        
        const metrics = {
            yandexMetrika: scripts.includes('mc.yandex.ru') || scripts.includes('ym('),
            googleAnalytics: scripts.includes('google-analytics.com') || scripts.includes('googletagmanager.com/gtag/js') || scripts.includes('ga(') || scripts.includes('gtag('),
            vkPixel: scripts.includes('vk.com/js/api/openapi.js') || scripts.includes('vk-pixel') || scripts.includes('VK.Retargeting'),
        };

        const e2e = {
            roistat: scripts.includes('roistat'),
            calltouch: scripts.includes('calltouch'),
            comagic: scripts.includes('comagic') || scripts.includes('uiscom'),
            mango: scripts.includes('mango-office'),
            callibri: scripts.includes('callibri')
        };

        const hasCallTrackingScript = e2e.roistat || e2e.calltouch || e2e.comagic || e2e.mango || e2e.callibri;
        const phoneClasses = ['.roistat-phone', '.lptracker-phone', '[class*="phone"]', '[id*="phone"]'];
        let phoneElementsFound = false;
        phoneClasses.forEach(selector => {
            if ($(selector).length > 0) phoneElementsFound = true;
        });

        const marketing = {
            metrics,
            e2e,
            callTracking: {
                present: hasCallTrackingScript || phoneElementsFound,
                method: hasCallTrackingScript ? 'Script detected' : (phoneElementsFound ? 'Phone classes detected' : 'Not detected')
            }
        };

        // SEO (Initial assessment of the main page)
        const h1s = $('h1').map((i, el) => $(el).text().trim()).get();
        const h2s = $('h2').map((i, el) => $(el).text().trim()).get();
        const images = $('img');
        const imagesWithoutAlt = images.filter((i, el) => !$(el).attr('alt')).length;

        // Open Graph tags
        const ogTags = {
            title: $('meta[property="og:title"]').attr('content') || $('meta[name="og:title"]').attr('content'),
            description: $('meta[property="og:description"]').attr('content') || $('meta[name="og:description"]').attr('content'),
            image: $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content'),
            type: $('meta[property="og:type"]').attr('content') || $('meta[name="og:type"]').attr('content'),
        };

        const hasOgTags = !!(ogTags.title || ogTags.description || ogTags.image);

        // robots.txt and sitemap.xml check
        const checkIndexingFiles = async () => {
            const results = {
                robots: { present: false, url: `${baseUrl}/robots.txt` },
                sitemap: { present: false, url: `${baseUrl}/sitemap.xml` }
            };

            try {
                const robotsRes = await axios.get(results.robots.url, { timeout: 5000, httpsAgent });
                results.robots.present = robotsRes.status === 200;
            } catch (e) {
                results.robots.present = false;
            }

            try {
                const sitemapRes = await axios.get(results.sitemap.url, { timeout: 5000, httpsAgent });
                results.sitemap.present = sitemapRes.status === 200;
            } catch (e) {
                // Also check if sitemap is mentioned in robots.txt
                try {
                    const robotsTextRes = await axios.get(results.robots.url, { timeout: 5000, httpsAgent });
                    if (robotsTextRes.data && robotsTextRes.data.toLowerCase().includes('sitemap:')) {
                        const match = robotsTextRes.data.match(/sitemap:\s*(https?:\/\/[^\s]+)/i);
                        if (match) {
                            results.sitemap.url = match[1];
                            const sitemapCheck = await axios.get(results.sitemap.url, { timeout: 5000, httpsAgent });
                            results.sitemap.present = sitemapCheck.status === 200;
                        }
                    }
                } catch (e2) {}
            }

            return results;
        };

        // CTA Assessment
        // Count typical CTA elements based on tags, classes and text content
        const ctaElements = $('button, a[class*="btn"], a[class*="button"], .btn, .button, [role="button"], input[type="submit"]').filter(function() {
            const text = $(this).text().toLowerCase();
            const val = $(this).attr('value') ? $(this).attr('value').toLowerCase() : '';
            return text.includes('купить') || text.includes('заказать') || text.includes('оставить') || 
                   text.includes('заявк') || text.includes('звонок') || text.includes('связаться') || 
                   text.includes('консультаци') || text.includes('получить') || text.includes('отправить') ||
                   val.includes('купить') || val.includes('заказать') || val.includes('оставить') || val.includes('отправить');
        });

        const ctaCount = ctaElements.length;
        let hasFixedCta = false;

        ctaElements.each(function() {
            let current = $(this);
            for(let level = 0; level < 5; level++) {
                if (!current || current.length === 0 || current.get(0).tagName === 'html') break;
                const cStyle = current.attr('style') || '';
                const cClass = current.attr('class') || '';
                const cId = current.attr('id') || '';
                
                if (cStyle.includes('position: fixed') || cStyle.includes('position: sticky') || 
                    cStyle.includes('position:fixed') || cStyle.includes('position:sticky') ||
                    cClass.includes('fixed') || cClass.includes('sticky') || cClass.includes('floating') ||
                    cId.includes('fixed') || cId.includes('sticky') || cId.includes('floating')) {
                    hasFixedCta = true;
                    break;
                }
                current = current.parent();
            }
        });

        // Approximate number of visual blocks
        const blocksCount = $('section, main > div, .section, .container, article').length || 1;
        const requiredCtas = Math.max(1, Math.floor(blocksCount / 3));

        // Техническое состояние
        const allLinks = $('a');
        
        // Сбор уникальных ссылок для проверки
        const urlObj = new URL(url);
        const baseUrl = urlObj.origin;
        const baseHost = urlObj.hostname.replace('www.', '');

        const linksMap = new Map(); // URL -> { url, text, context }
        allLinks.each((i, el) => {
            let href = $(el).attr('href');
            if (!href) return;
            href = href.trim();
            if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') return;
            try {
                const absoluteUrl = new URL(href, baseUrl).href;
                if (absoluteUrl.startsWith('http')) {
                    if (!linksMap.has(absoluteUrl)) {
                        const linkText = $(el).text().trim() || $(el).attr('title') || 'Без текста';
                        
                        // Получаем контекст (текст родительского элемента или ближайшего блока)
                        let context = '';
                        const parent = $(el).parent();
                        if (parent.length > 0) {
                            context = parent.text().trim().substring(0, 150);
                        }

                        linksMap.set(absoluteUrl, { 
                            url: absoluteUrl, 
                            text: linkText.length > 100 ? linkText.substring(0, 100) + '...' : linkText,
                            context: context && context !== linkText ? context + '...' : ''
                        });
                    }
                }
            } catch (e) {
                // Игнорируем невалидные URL
            }
        });
        const linksToCheck = Array.from(linksMap.values()).slice(0, 150); // Проверяем до 150 уникальных ссылок

        // --- Глубокий краулер для сбора ВСЕХ страниц и SEO анализа ---
        const crawledPages = new Map(); // URL -> SEO Data
        const pagesToCrawl = [url];
        const maxPages = 15; // ОПТИМИЗАЦИЯ: Уменьшено со 150 до 15 для мгновенного аудита
        const allUniqueLinks = new Map(); // URL -> { text, context }
        
        const crawlAllPages = async () => {
            const queue = [url];
            const visited = new Set();
            const concurrency = 5; // Оптимально для скорости
            let activeWorkers = 0;

            const processPage = async () => {
                if (queue.length === 0 || crawledPages.size >= maxPages) return;
                
                const currentUrl = queue.shift();
                if (!currentUrl || visited.has(currentUrl)) {
                    return processPage();
                }
                
                visited.add(currentUrl);
                activeWorkers++;

                try {
                    const res = await axios.get(currentUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
                        timeout: 5000, // Сокращено до 5с
                        httpsAgent: httpsAgent
                    });

                    const $page = cheerio.load(res.data);
                    
                    const pageH1s = $page('h1').map((_, el) => $page(el).text().trim()).get().filter(t => t.length > 0);
                    const pageImages = $page('img');
                    const pageImagesWithoutAlt = pageImages.filter((_, el) => !$page(el).attr('alt')).length;

                    crawledPages.set(currentUrl, {
                        url: currentUrl,
                        title: $page('title').text().trim() || 'Не найден',
                        description: $page('meta[name="description"]').attr('content') || 'Не найден',
                        h1: pageH1s,
                        images: {
                            total: pageImages.length,
                            missingAlt: pageImagesWithoutAlt
                        }
                    });

                    $page('a').each((_, el) => {
                        let href = $page(el).attr('href');
                        if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') return;
                        
                        try {
                            const absoluteUrl = new URL(href, baseUrl).href.split('#')[0];
                            if (!absoluteUrl.startsWith('http')) return;

                            const isInternal = new URL(absoluteUrl).hostname.replace('www.', '') === baseHost;
                            
                            if (!allUniqueLinks.has(absoluteUrl)) {
                                allUniqueLinks.set(absoluteUrl, {
                                    url: absoluteUrl,
                                    text: $page(el).text().trim() || $page(el).attr('title') || 'Без текста',
                                    context: $page(el).parent().text().trim().substring(0, 100)
                                });
                            }

                            if (isInternal && !absoluteUrl.match(/\.(jpg|jpeg|png|gif|svg|pdf|zip|webp|css|js)$/i)) {
                                if (!visited.has(absoluteUrl) && !queue.includes(absoluteUrl) && (visited.size + queue.length) < maxPages * 2) {
                                    queue.push(absoluteUrl);
                                }
                            }
                        } catch (e) {}
                    });
                } catch (e) {
                    crawledPages.set(currentUrl, { url: currentUrl, error: true });
                } finally {
                    activeWorkers--;
                    await processPage();
                }
            };

            const workers = Array(concurrency).fill(null).map(() => processPage());
            await Promise.all(workers);
            
            return Array.from(crawledPages.values()).filter(p => !p.error);
        };

        const checkLinks = async (customLinks) => {
            let linksToProcess = customLinks || linksToCheck;
            
            // ОПТИМИЗАЦИЯ: Ограничиваем до 100 уникальных ссылок (приоритет внутренним)
            if (linksToProcess.length > 100) {
                const internal = linksToProcess.filter(l => {
                    try { return new URL(l.url).hostname.replace('www.', '').includes(baseHost); } catch(e) { return false; }
                });
                const external = linksToProcess.filter(l => !internal.includes(l));
                linksToProcess = [...internal, ...external].slice(0, 100);
            }

            const brokenUrls = []; 
            let checkedCount = 0;
            const commonHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': url,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            };

            const axiosConfig = {
                timeout: 10000, 
                maxRedirects: 5,
                httpsAgent: httpsAgent,
                headers: commonHeaders,
                validateStatus: () => true 
            };

            const MAX_EXECUTION_TIME = 90000; // ЛИМИТ: 1.5 минуты на все ссылки
            const startTime = Date.now();
            const CONCURRENCY = 10; // Снижаем до 10 для стабильности

            // Вспомогательная функция для запроса
            const performRequest = async (linkUrl, method, currentConfig) => {
                try {
                    if (method === 'HEAD') {
                        return await axios.head(linkUrl, currentConfig);
                    } else {
                        // Используем GET с лимитом данных для экономии ресурсов
                        const r = await axios.get(linkUrl, { 
                            ...currentConfig, 
                            responseType: 'stream' 
                        });
                        if (r.data && typeof r.data.destroy === 'function') {
                            r.data.destroy();
                        }
                        return r;
                    }
                } catch (err) {
                    return { status: err.response?.status || 0, error: err.message };
                }
            };

            for (let i = 0; i < linksToProcess.length; i += CONCURRENCY) {
                if (Date.now() - startTime > MAX_EXECUTION_TIME) break;

                const chunk = linksToProcess.slice(i, i + CONCURRENCY);
                await Promise.all(chunk.map(async (linkObj) => {
                    checkedCount++;
                    let link = linkObj.url;
                    
                    // Декодируем URL, если он закодирован (для корректной проверки кириллицы и спецсимволов)
                    try {
                        if (link.includes('%')) {
                            link = decodeURI(link);
                        }
                    } catch (e) {
                        // Если декодирование не удалось, используем оригинал
                    }
                    
                    let isInternal = false;
                    try {
                        isInternal = new URL(link).hostname.replace('www.', '').includes(baseHost);
                    } catch(e) {}
                    
                    const linkData = { ...linkObj, type: isInternal ? 'internal' : 'external' };

                    try {
                        // 1. Пробуем HEAD запрос
                        let res = await performRequest(link, 'HEAD', axiosConfig);
                        console.log(`Checking link: ${link} | HEAD status: ${res.status}`);
                        
                        // 2. Если HEAD не удался, пробуем GET
                        if (!res || (res.status !== 200 && res.status !== 301 && res.status !== 302)) {
                            res = await performRequest(link, 'GET', axiosConfig);
                            console.log(`Checking link: ${link} | GET status: ${res.status}`);
                        }
                        
                        // 3. Если 404, пробуем альтернативный URL (со слешем или без)
                        if (res.status === 404) {
                            const alternativeLink = link.endsWith('/') ? link.slice(0, -1) : link + '/';
                            const resAlt = await performRequest(alternativeLink, 'GET', axiosConfig);
                            console.log(`Checking link: ${alternativeLink} (alt) | GET status: ${resAlt.status}`);
                            if (resAlt.status === 200 || resAlt.status === 301 || resAlt.status === 302) {
                                res = resAlt;
                            }
                        }

                        // 4. Финальная проверка: если все еще 404, подождем немного и попробуем еще раз
                        // (защита от временных блокировок или лагов сервера)
                        if (res.status === 404) {
                            await new Promise(r => setTimeout(r, 1000));
                            res = await performRequest(link, 'GET', axiosConfig);
                        }

                        linkData.statusCode = res.status;

                        // БИТЫМИ считаем ТОЛЬКО 404 и 410
                        if (res.status === 404 || res.status === 410) {
                            brokenUrls.push(linkData);
                        }
                    } catch (e) {}
                }));

                // Небольшая пауза между батчами для снижения нагрузки на целевой сервер
                await new Promise(r => setTimeout(r, 200));
            }
            return { brokenUrls, checkedCount };
        };

        const technical = {
            links: {
                total: allLinks.length,
                empty: allLinks.filter((i, el) => {
                    const href = $(el).attr('href');
                    return !href || href === '#' || href === '' || href.startsWith('javascript:');
                }).length,
                brokenUrls: [] // Будет заполнено позже
            },
            favicon: $('link[rel*="icon"]').length > 0,
            ssl: url.startsWith('https')
        };

        // 2. Динамический анализ (Google PageSpeed API)
        const runPageSpeed = async (strategy = 'desktop') => {
            try {
                // Если URL ведет на localhost или 127.0.0.1, API Google не сможет его проверить
                if (url.includes('localhost') || url.includes('127.0.0.1')) {
                    throw new Error('Google PageSpeed API cannot check local addresses (localhost)');
                }

                const apiKey = process.env.PAGESPEED_API_KEY;
                if (!apiKey) {
                    console.warn('PAGESPEED_API_KEY is not defined in .env');
                }
                const apiKeyParam = apiKey ? `&key=${apiKey}` : '';
                
                // Увеличиваем таймаут до 60 секунд, так как Google API может быть медленным
                const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance${apiKeyParam}`;
                
                console.log(`Running PageSpeed (${strategy})...`);
                const psiResponse = await axios.get(psiUrl, { timeout: 60000 });
                const lighthouse = psiResponse.data.lighthouseResult;
                
                const score = lighthouse.categories.performance.score * 100;
                const lcp = lighthouse.audits['largest-contentful-paint'].displayValue;

                return {
                    scoreValue: Math.round(score),
                    lcp: lcp,
                    score: score >= 90 ? 'Excellent' : score >= 50 ? 'Good' : 'Poor'
                };
            } catch (e) {
                console.error(`PageSpeed API error (${strategy}):`, e.message);
                if (e.response && e.response.data && e.response.data.error) {
                    console.error('PageSpeed API details:', JSON.stringify(e.response.data.error, null, 2));
                }
                
                if (e.code === 'ETIMEDOUT' || e.code === 'ECONNABORTED') {
                    console.error(`PageSpeed API timed out for ${strategy} after 60s`);
                }
                
                // Более реалистичный расчет для заглушки
                let fallbackScore = 50;
                if (htmlFetchTimeMs < 500) fallbackScore = 90;
                else if (htmlFetchTimeMs < 1200) fallbackScore = 75;
                else if (htmlFetchTimeMs < 2500) fallbackScore = 55;
                else if (htmlFetchTimeMs < 5000) fallbackScore = 35;
                else fallbackScore = 15;

                // Мобильная версия обычно медленнее
                if (strategy === 'mobile') {
                    fallbackScore = Math.max(5, fallbackScore - 15);
                }

                // Умеренные коэффициенты: LCP обычно в 1.2-1.8 раза больше TTFB
                const multiplier = strategy === 'mobile' ? 1.8 : 1.2;
                let fallbackLcpValue = (htmlFetchTimeMs / 1000 * multiplier);
                
                // Ограничиваем разумным пределом для оценки
                if (fallbackLcpValue > 15) fallbackLcpValue = 15 + (fallbackLcpValue - 15) * 0.2;
                
                const fallbackLcp = fallbackLcpValue.toFixed(1) + ' s';

                // Возвращаем резервную оценку вместо падения всего аудита
                return {
                    scoreValue: fallbackScore,
                    lcp: fallbackLcp,
                    score: fallbackScore >= 90 ? 'Excellent' : fallbackScore >= 50 ? 'Good' : 'Poor',
                    apiError: true
                };
            }
        };

        const [psiDesktop, psiMobile, seoPages, indexing] = await Promise.all([
            runPageSpeed('desktop'),
            runPageSpeed('mobile'),
            crawlAllPages(),
            checkIndexingFiles()
        ]);

        // Проверка ссылок на битость со всего сайта (берем до 300 уникальных ссылок для проверки)
        const linksResult = await checkLinks(Array.from(allUniqueLinks.values()).slice(0, 300));
        
        technical.links.brokenUrls = linksResult.brokenUrls;
        technical.links.checkedCount = linksResult.checkedCount;
        technical.indexing = indexing;

        // Агрегация SEO данных со всех страниц
        const allH1s = seoPages.flatMap(p => p.h1);
        const pagesWithH1Issues = seoPages.filter(p => p.h1.length !== 1).length;
        const totalImages = seoPages.reduce((acc, p) => acc + p.images.total, 0);
        const totalMissingAlt = seoPages.reduce((acc, p) => acc + p.images.missingAlt, 0);

        const seo = {
            title: seoPages[0]?.title || $('title').text().trim(),
            description: seoPages[0]?.description || $('meta[name="description"]').attr('content'),
            ogTags,
            h1: {
                count: h1s.length, 
                items: h1s,
                hasDuplicates: pagesWithH1Issues > 0,
                pagesChecked: seoPages.length,
                pagesWithIssues: pagesWithH1Issues,
                totalIssues: pagesWithH1Issues, // Явное поле для фронтенда
                allH1s: allH1s
            },
            h2: {
                count: h2s.length,
                items: h2s
            },
            images: {
                total: totalImages,
                missingAlt: totalMissingAlt
            },
            cta: {
                count: ctaCount,
                blocksCount: blocksCount,
                hasFixedCta: hasFixedCta,
                isEnough: hasFixedCta || ctaCount >= requiredCtas,
                required: requiredCtas
            },
            allPages: seoPages
        };

        const performance = {
            desktop: psiDesktop,
            mobile: psiMobile
        };

        res.json({
            url,
            marketing,
            seo,
            technical,
            performance,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Audit error:', error.message);
        if (error.code) console.error('Error code:', error.code);
        
        let errorMessage = 'Не удалось получить данные с сайта. ';
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            errorMessage += 'Сайт отвечает слишком медленно (таймаут). Попробуйте позже.';
        } else if (error.response) {
            errorMessage += `Сервер сайта вернул ошибку ${error.response.status}.`;
        } else if (error.code === 'ENOTFOUND') {
            errorMessage += 'Сайт не найден. Проверьте правильность написания URL.';
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage += 'Соединение отклонено сервером сайта.';
        } else {
            errorMessage += `Ошибка: ${error.message || 'Проверьте корректность URL или доступность сайта.'}`;
        }

        res.status(500).json({ 
            error: errorMessage,
            details: error.message,
            code: error.code
        });
    }
});

// Отдаем статические файлы React-приложения
app.use(express.static(path.join(__dirname, '../client/dist')));

// Любой другой запрос (не к API) направляем на React Router
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
