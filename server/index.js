require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 screenshots

app.get('/', (req, res) => {
    res.json({ message: 'Audit Insite Lab Server is running' });
});

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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        const htmlFetchTimeMs = Date.now() - fetchStartTime;

        const html = response.data;
        const $ = cheerio.load(html);

        // Маркетинг и Аналитика
        const scripts = $('script').map((i, el) => $(el).attr('src') || $(el).html()).get().join(' ');
        const analytics = {
            yandexMetrika: scripts.includes('mc.yandex.ru') || scripts.includes('ym('),
            vkPixel: scripts.includes('vk.com/js/api/openapi.js') || scripts.includes('vk-pixel') || scripts.includes('VK.Retargeting'),
            roistat: scripts.includes('roistat'),
            calltouch: scripts.includes('calltouch'),
            comagic: scripts.includes('comagic') || scripts.includes('uiscom'),
            mango: scripts.includes('mango-office')
        };

        const hasCallTrackingScript = analytics.roistat || analytics.calltouch || analytics.comagic || analytics.mango;
        const phoneClasses = ['.roistat-phone', '.lptracker-phone', '[class*="phone"]', '[id*="phone"]'];
        let phoneElementsFound = false;
        phoneClasses.forEach(selector => {
            if ($(selector).length > 0) phoneElementsFound = true;
        });

        const marketing = {
            analytics,
            callTracking: {
                present: hasCallTrackingScript || phoneElementsFound,
                method: hasCallTrackingScript ? 'Script detected' : (phoneElementsFound ? 'Phone classes detected' : 'Not detected')
            }
        };

        // SEO
        const h1s = $('h1').map((i, el) => $(el).text().trim()).get();
        const h2s = $('h2').map((i, el) => $(el).text().trim()).get();
        const images = $('img');
        const imagesWithoutAlt = images.filter((i, el) => !$(el).attr('alt')).length;

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

        const seo = {
            title: $('title').text().trim() || 'Not found',
            description: $('meta[name="description"]').attr('content') || 'Not found',
            h1: {
                count: h1s.length,
                items: h1s,
                hasDuplicates: h1s.length > 1
            },
            h2: {
                count: h2s.length,
                items: h2s
            },
            images: {
                total: images.length,
                missingAlt: imagesWithoutAlt
            },
            cta: {
                count: ctaCount,
                blocksCount: blocksCount,
                hasFixedCta: hasFixedCta,
                isEnough: hasFixedCta || ctaCount >= requiredCtas,
                required: requiredCtas
            }
        };

        // Техническое состояние
        const allLinks = $('a');
        
        // Сбор уникальных ссылок для проверки
        const baseUrl = new URL(url).origin;
        const uniqueLinks = new Set();
        allLinks.each((i, el) => {
            let href = $(el).attr('href');
            if (!href) return;
            href = href.trim();
            if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') return;
            try {
                const absoluteUrl = new URL(href, baseUrl).href;
                if (absoluteUrl.startsWith('http')) {
                    uniqueLinks.add(absoluteUrl);
                }
            } catch (e) {
                // Игнорируем невалидные URL
            }
        });
        const linksToCheck = Array.from(uniqueLinks).slice(0, 150); // Проверяем до 150 уникальных ссылок

        const checkLinks = async () => {
            const brokenUrls = [];
            const axiosConfig = {
                timeout: 6000,
                maxRedirects: 3,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                },
                validateStatus: () => true // Resolve promise on any status code
            };

            const MAX_EXECUTION_TIME = 15000; // Максимум 15 секунд на всю проверку
            const startTime = Date.now();

            // Разбиваем на батчи по 15 ссылок, чтобы не перегружать целевой сервер (Rate Limit)
            for (let i = 0; i < linksToCheck.length; i += 15) {
                // Если мы уже потратили больше 15 секунд на проверку ссылок — прерываемся
                if (Date.now() - startTime > MAX_EXECUTION_TIME) {
                    console.log('Link checking reached time limit, stopping early');
                    break;
                }

                const chunk = linksToCheck.slice(i, i + 15);
                await Promise.all(chunk.map(async (link) => {
                    try {
                        let res = await axios.head(link, axiosConfig);
                        
                        // Если сервер блокирует HEAD-запросы или отдает 500, пробуем GET
                        if (res.status === 405 || res.status === 403 || res.status === 406 || res.status >= 500) {
                            res = await axios.get(link, { ...axiosConfig, responseType: 'stream' });
                            // Уничтожаем стрим сразу после получения заголовков, чтобы не качать всё тело
                            if (res.data && typeof res.data.destroy === 'function') {
                                res.data.destroy();
                            }
                        }

                        // Считаем ссылку битой при ошибках 404, 410, 403 (защита типа Cloudflare) или серверных >= 500
                        // Ошибки 401 (авторизация) обычно игнорируются, но 403 (доступ запрещен) - частый показатель "битой" для пользователя
                        if (res.status === 404 || res.status === 403 || res.status === 410 || res.status >= 500) {
                            brokenUrls.push(link);
                        }
                    } catch (e) {
                        // Если домен не существует, либо сервер сбросил соединение/таймаут
                        if (e.code === 'ENOTFOUND' || e.code === 'ERR_NAME_NOT_RESOLVED' || e.code === 'ECONNREFUSED' || e.code === 'ETIMEDOUT' || e.code === 'ECONNABORTED') {
                            brokenUrls.push(link);
                        }
                    }
                }));
            }
            return brokenUrls;
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
        const runPageSpeed = async () => {
            try {
                const apiKeyParam = process.env.PAGESPEED_API_KEY ? `&key=${process.env.PAGESPEED_API_KEY}` : '';
                // Запрашиваем метрики
                const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=desktop&category=performance${apiKeyParam}`;
                const psiResponse = await axios.get(psiUrl);
                const lighthouse = psiResponse.data.lighthouseResult;
                
                const score = lighthouse.categories.performance.score * 100;
                const lcp = lighthouse.audits['largest-contentful-paint'].displayValue;

                return {
                    scoreValue: Math.round(score),
                    lcp: lcp,
                    score: score >= 90 ? 'Excellent' : score >= 50 ? 'Good' : 'Poor'
                };
            } catch (e) {
                console.error('PageSpeed API error:', e.message);
                if (e.response && e.response.data && e.response.data.error) {
                    console.error('PageSpeed API details:', e.response.data.error.message);
                }
                
                // Рассчитываем примерные баллы на основе времени ответа сервера (TTFB + HTML Load)
                // Это не полноценный LCP, но дает базовое представление о скорости сайта
                let fallbackScore = 50;
                if (htmlFetchTimeMs < 300) fallbackScore = 95;
                else if (htmlFetchTimeMs < 800) fallbackScore = 80;
                else if (htmlFetchTimeMs < 1500) fallbackScore = 60;
                else if (htmlFetchTimeMs < 3000) fallbackScore = 40;
                else fallbackScore = 20;

                const fallbackLcp = (htmlFetchTimeMs / 1000 * 1.5).toFixed(1) + ' s';

                // Возвращаем резервную оценку вместо падения всего аудита
                return {
                    scoreValue: fallbackScore,
                    lcp: `~${fallbackLcp} (Оценка)`,
                    score: fallbackScore >= 90 ? 'Excellent' : fallbackScore >= 50 ? 'Good' : 'Poor',
                    apiError: true
                };
            }
        };

        const [psiResult, brokenUrls] = await Promise.all([
            runPageSpeed(),
            checkLinks()
        ]);

        technical.links.brokenUrls = brokenUrls;

        const performance = {
            scoreValue: psiResult.scoreValue,
            lcp: psiResult.lcp,
            score: psiResult.score
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
        res.status(500).json({ 
            error: 'Failed to fetch the website', 
            details: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
