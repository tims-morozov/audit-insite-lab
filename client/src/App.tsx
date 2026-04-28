import React, { useState } from 'react';
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  ExternalLink,
  FileText, 
  BarChart3, 
  AlertTriangle,
  Layers,
  PhoneCall,
  Zap,
  Lightbulb,
  Monitor,
  Smartphone,
  Link,
  Copy,
  Filter,
  ArrowUpDown,
  Check
} from 'lucide-react';

interface AuditData {
  url: string;
  marketing: {
    metrics: {
      yandexMetrika: boolean;
      googleAnalytics: boolean;
      vkPixel: boolean;
    };
    e2e: {
      roistat: boolean;
      calltouch: boolean;
      comagic: boolean;
      mango: boolean;
      callibri: boolean;
    };
    callTracking: {
      present: boolean;
      method: string;
    };
  };
  seo: {
    title: string;
    description: string;
    ogTags?: {
      title?: string;
      description?: string;
      image?: string;
      type?: string;
    };
    h1: {
      count: number;
      items: string[];
      hasDuplicates: boolean;
      pagesChecked?: number;
      pagesWithIssues?: number;
      allH1s?: string[];
    };
    h2: {
      count: number;
      items: string[];
    };
    images: {
      total: number;
      missingAlt: number;
    };
    cta: {
      count: number;
      blocksCount: number;
      hasFixedCta: boolean;
      isEnough: boolean;
      required: number;
    };
    allPages?: {
      url: string;
      title: string;
      description: string;
      h1: string[];
      images: { total: number, missingAlt: number };
    }[];
  };
  technical: {
    links: {
      total: number;
      empty: number;
      checkedCount?: number;
      brokenUrls: { 
        url: string; 
        text: string; 
        context?: string; 
        statusCode?: number; 
        type?: 'internal' | 'external';
        errorCode?: string;
      }[];
    };
    favicon: boolean;
    ssl: boolean;
    indexing?: {
      robots: { present: boolean; url: string };
      sitemap: { present: boolean; url: string };
    };
  };
  performance: {
    desktop: {
      scoreValue: number;
      lcp: string;
      score: 'Excellent' | 'Good' | 'Poor';
      apiError?: boolean;
    };
    mobile: {
      scoreValue: number;
      lcp: string;
      score: 'Excellent' | 'Good' | 'Poor';
      apiError?: boolean;
    };
  };
}

const generateRecommendations = (data: AuditData) => {
  const recs: { type: 'error' | 'warning' | 'info' | 'success'; text: string }[] = [];
  
  // Performance Desktop
  if (data.performance.desktop.scoreValue < 50) recs.push({ type: 'error', text: 'Критически низкая скорость загрузки на ПК. По Google PageSpeed оценка ниже 50.' });
  else if (data.performance.desktop.scoreValue < 90) recs.push({ type: 'warning', text: 'Увеличьте скорость загрузки на ПК. По Google PageSpeed оценка ниже 90.' });

  // Performance Mobile
  if (data.performance.mobile.scoreValue < 50) recs.push({ type: 'error', text: 'Критически низкая скорость загрузки на мобильных. По Google PageSpeed оценка ниже 50.' });
  else if (data.performance.mobile.scoreValue < 90) recs.push({ type: 'warning', text: 'Увеличьте скорость загрузки на мобильных. По Google PageSpeed оценка ниже 90.' });
  
  // SEO
  if (!data.seo.title || data.seo.title === 'Not found') recs.push({ type: 'error', text: 'Добавьте тег Title. Это критически важно для SEO.' });
  else if (data.seo.title.length < 30 || data.seo.title.length > 65) recs.push({ type: 'warning', text: 'Скорректируйте длину Title (оптимально 30-65 символов).' });
  
  if (!data.seo.description || data.seo.description === 'Not found') recs.push({ type: 'error', text: 'Добавьте мета-тег Description для улучшения кликабельности (CTR) в поиске.' });
  
  if (data.seo.h1.pagesWithIssues && data.seo.h1.pagesWithIssues > 0) {
    recs.push({ 
      type: 'error', 
      text: `Проблемы с H1 на ${data.seo.h1.pagesWithIssues} из ${data.seo.h1.pagesChecked} страниц. На каждой странице должен быть ровно один H1.` 
    });
  } else if (data.seo.h1.count === 0) {
    recs.push({ type: 'error', text: 'На главной странице отсутствует тег H1. Обязательно добавьте главный заголовок.' });
  } else if (data.seo.h1.hasDuplicates) {
    recs.push({ type: 'warning', text: 'На главной странице несколько тегов H1. Рекомендуется оставить только один.' });
  }
  
  if (data.seo.images.missingAlt > 0) recs.push({ type: 'warning', text: `Добавьте атрибут alt для ${data.seo.images.missingAlt} изображений. Это полезно для поиска по картинкам и доступности.` });
  if (!data.seo.cta.isEnough) recs.push({ type: 'info', text: 'Рекомендуется добавить больше кнопок призыва к действию (CTA) для повышения конверсии.' });
  
  // Technical
  if (data.technical.links.brokenUrls && data.technical.links.brokenUrls.length > 0) recs.push({ type: 'error', text: `Исправьте или удалите битые ссылки (${data.technical.links.brokenUrls.length} шт.). Они негативно влияют на SEO.` });
  if (!data.technical.favicon) recs.push({ type: 'warning', text: 'Добавьте фавикон для улучшения узнаваемости сайта во вкладках браузера.' });
  
  // Marketing
  const hasMetrics = Object.values(data.marketing.metrics).some(v => v);
  const hasE2E = Object.values(data.marketing.e2e).some(v => v);
  if (!hasMetrics) recs.push({ type: 'warning', text: 'Установите системы аналитики (например, Яндекс.Метрику или Google Analytics) для отслеживания посетителей.' });
  if (!hasE2E) recs.push({ type: 'info', text: 'Рассмотрите возможность подключения систем сквозной аналитики (например, Roistat или Calltouch) для лучшего понимания эффективности маркетинга.' });
  
  if (!data.marketing.callTracking.present) recs.push({ type: 'warning', text: 'Установите коллтрекинг (например, Calltouch или Comagic) для отслеживания эффективности рекламных каналов по звонкам.' });

  if (recs.length === 0) recs.push({ type: 'success', text: 'Отличная работа! Сайт хорошо оптимизирован, критических проблем не найдено.' });

  return recs;
};

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBrokenLinks, setShowBrokenLinks] = useState(false);
  const [showH1Details, setShowH1Details] = useState(false);
  const [linkFilter, setLinkFilter] = useState<'all' | 'internal' | 'external'>('all');
  const [linkSearch, setLinkSearch] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setData(null);
    setShowBrokenLinks(false);

    try {
      // Используем относительный путь, так как фронт и бэк теперь на одном домене
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.startsWith('http') ? url : `https://${url}` }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'Failed to run audit');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }: { status: boolean }) =>
    status ? (
      <CheckCircle2 className="h-5 w-5 text-emerald-600" strokeWidth={1.5} />
    ) : (
      <XCircle className="h-5 w-5 text-rose-600" strokeWidth={1.5} />
    );

  const getPerfTextColor = (score: string) => {
    switch (score) {
      case 'Excellent': return 'text-emerald-600';
      case 'Good': return 'text-orange-600';
      default: return 'text-rose-600';
    }
  };

  const getPerfBadgeColor = (score: string) => {
    switch (score) {
      case 'Excellent': return 'bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full text-xs';
      case 'Good': return 'bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full text-xs';
      default: return 'bg-rose-100 text-rose-700 font-medium px-2 py-0.5 rounded-full text-xs';
    }
  };

  const overlineClass = 'text-[11px] font-bold uppercase tracking-wider text-slate-400';
  const footerTextClass = 'text-[11px] font-medium text-slate-400 antialiased';
  const kpiNumberClass = 'text-3xl font-bold tracking-tight tabular-nums';
  const kpiDenomClass = 'text-base font-medium leading-none text-slate-300 tabular-nums';
  /** SEO mini-cards: narrower columns — one step smaller than technical KPIs for visual parity */
  const seoKpiNumberClass = 'text-2xl font-bold tracking-tight tabular-nums';
  const seoKpiDenomClass = 'text-sm font-medium leading-none text-slate-300 tabular-nums';
  const statusPositiveClass = 'text-xl font-bold tracking-tight leading-none text-emerald-600';
  const statusNegativeClass = 'text-xl font-bold tracking-tight leading-none text-rose-600';
  const statCardShellClass =
    'bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow';
  const seoKpiCardClass =
    'bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition-shadow';
  const formatLcp = (lcp: string) => lcp.replace(/s$/i, ' s');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased tabular-nums flex flex-col selection:bg-[#FF4C00]/20 selection:text-[#FF4C00]">
      <main className="py-12 px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleAudit} className="mb-12">
            <div className="max-w-2xl mx-auto flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-stretch">
              <div className="relative min-h-0 flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Globe className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Введите URL сайта (например: vash-sait.ru)"
                  className="h-12 w-full rounded-lg border-0 bg-transparent py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url}
                className="inline-flex shrink-0 items-center justify-center gap-2 self-stretch rounded-lg bg-[#FF4C00] px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#e64400] focus:outline-none focus:ring-4 focus:ring-[#FF4C00]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[3rem]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Проверить
                  </>
                )}
              </button>
            </div>
          </form>

          {loading && (
            <div className="max-w-2xl mx-auto mb-8 text-center animate-pulse">
              <p className="text-sm font-medium text-slate-500">
                Проводим глубокое сканирование всех страниц и проверку ссылок...
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Это может занять до 2 минут для больших сайтов. Пожалуйста, не закрывайте вкладку.
              </p>
            </div>
          )}

        {error && (
          <div className="p-4 mb-8 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-3 animate-shake max-w-3xl mx-auto">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {data && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Analysis Results */}
            <div className="space-y-12">
              {/* 1. Техническое состояние */}
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Layers className="h-6 w-6 text-slate-900" />
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">Техническое состояние</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                  {/* Desktop Speed */}
                  <div className={statCardShellClass}>
                    <div className="flex shrink-0 items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-slate-400" />
                        <h3 className={overlineClass}>СКОРОСТЬ (ПК)</h3>
                      </div>
                      <div className={`${getPerfBadgeColor(data.performance.desktop.score)}`}>
                        {data.performance.desktop.score === 'Excellent' ? 'Отличная' : data.performance.desktop.score === 'Good' ? 'Средняя' : 'Низкая'}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p
                        className={`${kpiNumberClass} leading-none ${
                          data.performance.desktop.scoreValue < 90 && data.performance.desktop.scoreValue >= 50
                            ? 'text-orange-600'
                            : getPerfTextColor(data.performance.desktop.score)
                        }`}
                      >
                        {data.performance.desktop.scoreValue}
                      </p>
                      <p className={kpiDenomClass}>/ 100</p>
                    </div>
                    <footer className="mt-auto pt-4 border-t border-slate-50">
                      <p className={footerTextClass}>
                        Загрузка: {formatLcp(data.performance.desktop.lcp)}
                      </p>
                    </footer>
                  </div>

                  {/* Mobile Speed */}
                  <div className={statCardShellClass}>
                    <div className="flex shrink-0 items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-slate-400" />
                        <h3 className={overlineClass}>СКОРОСТЬ (МОБ)</h3>
                      </div>
                      <div className={`${getPerfBadgeColor(data.performance.mobile.score)}`}>
                        {data.performance.mobile.score === 'Excellent' ? 'Отличная' : data.performance.mobile.score === 'Good' ? 'Средняя' : 'Низкая'}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p
                        className={`${kpiNumberClass} leading-none ${
                          data.performance.mobile.scoreValue < 90 && data.performance.mobile.scoreValue >= 50
                            ? 'text-orange-600'
                            : getPerfTextColor(data.performance.mobile.score)
                        }`}
                      >
                        {data.performance.mobile.scoreValue}
                      </p>
                      <p className={kpiDenomClass}>/ 100</p>
                    </div>
                    <footer className="mt-auto pt-4 border-t border-slate-50">
                      <p className={footerTextClass}>
                        Загрузка: {formatLcp(data.performance.mobile.lcp)}
                      </p>
                    </footer>
                  </div>

                  {/* Broken Links */}
                  <div className={statCardShellClass}>
                    <div className="flex shrink-0 items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${(data.technical.links.brokenUrls?.length || 0) > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
                        <h3 className={overlineClass}>НЕРАБОЧИЕ ССЫЛКИ</h3>
                      </div>
                      <StatusIcon status={(data.technical.links.brokenUrls?.length || 0) === 0} />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p className={`${kpiNumberClass} ${(data.technical.links.brokenUrls?.length || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {data.technical.links.brokenUrls?.length || 0}
                      </p>
                      <p className={kpiDenomClass}>шт.</p>
                    </div>

                    {data.technical.links.brokenUrls && data.technical.links.brokenUrls.length > 0 ? (
                      <footer className="mt-auto pt-4 border-t border-slate-50 flex flex-col items-start w-full">
                        <button
                          onClick={() => setShowBrokenLinks(!showBrokenLinks)}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF4C00] hover:text-[#e64400] transition-colors group"
                        >
                          {showBrokenLinks ? 'Скрыть список' : 'Показать список'}
                          <Layers className={`h-3.5 w-3.5 transition-transform ${showBrokenLinks ? 'rotate-180' : ''}`} />
                        </button>
                      </footer>
                    ) : (
                      <footer className="mt-auto pt-4 border-t border-slate-50">
                        <p className={footerTextClass}>Все ссылки работают корректно</p>
                      </footer>
                    )}
                  </div>
                </div>
              </section>

              {/* 2. Маркетинг и Аналитика */}
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <BarChart3 className="h-6 w-6 text-slate-900" />
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">Маркетинг и Аналитика</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                  {/* Метрики */}
                  <div className={statCardShellClass}>
                    <h3 className={`${overlineClass} mb-4`}>МЕТРИКИ</h3>
                    <div className="space-y-1">
                      {Object.entries(data.marketing.metrics).filter(([_, value]) => value).length > 0 ? (
                        Object.entries(data.marketing.metrics)
                          .filter(([_, value]) => value)
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between py-1.5">
                              <span className="text-sm font-medium text-slate-700">
                                {key === 'yandexMetrika' ? 'Яндекс.Метрика' : key === 'googleAnalytics' ? 'Google Analytics' : key === 'vkPixel' ? 'Пиксель ВК' : key.charAt(0).toUpperCase() + key.slice(1)}
                              </span>
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                          ))
                      ) : (
                        <div className="flex items-center gap-2 py-2 text-slate-400">
                          <XCircle className="h-4 w-4 opacity-40" />
                          <p className="text-sm font-medium">Не обнаружено</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Сквозная аналитика */}
                  <div className={statCardShellClass}>
                    <h3 className={`${overlineClass} mb-4`}>СКВОЗНАЯ АНАЛИТИКА</h3>
                    <div className="space-y-1">
                      {Object.entries(data.marketing.e2e).filter(([_, value]) => value).length > 0 ? (
                        Object.entries(data.marketing.e2e)
                          .filter(([_, value]) => value)
                          .map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between py-1.5">
                              <span className="text-sm font-medium text-slate-700">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </span>
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                          ))
                      ) : (
                        <div className="flex items-center gap-2 py-2 text-slate-400">
                          <XCircle className="h-4 w-4 opacity-40" />
                          <p className="text-sm font-medium">Не обнаружено</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Телефония (Подмена номера) */}
                  <div className={statCardShellClass}>
                    <div className="flex shrink-0 items-center justify-between mb-4">
                      <h3 className={overlineClass}>ПОДМЕНА НОМЕРА</h3>
                      <StatusIcon status={data.marketing.callTracking.present} />
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <p className={data.marketing.callTracking.present ? statusPositiveClass : statusNegativeClass}>
                        {data.marketing.callTracking.present ? 'Найдено' : 'Не найдено'}
                      </p>
                    </div>
                    <footer className="mt-auto pt-4 border-t border-slate-50">
                      <p className={footerTextClass}>Поиск скриптов коллтрекинга</p>
                    </footer>
                  </div>
                </div>
              </section>

              {/* 3. SEO */}
              <section>
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-6 w-6 text-slate-900" />
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">SEO-аудит</h2>
                  </div>
                </div>
                <div className="flex flex-col gap-6">
                  {/* Meta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    <div className={statCardShellClass}>
                      <div className="flex shrink-0 items-center justify-between mb-4">
                        <h3 className={overlineClass}>TITLE</h3>
                        <StatusIcon status={!!data.seo.title && data.seo.title !== 'Not found'} />
                      </div>
                      <div className="flex-1">
                        {data.seo.title && data.seo.title !== 'Not found' ? (
                          <p className="text-sm font-medium text-slate-700 leading-relaxed break-words">{data.seo.title}</p>
                        ) : (
                          <p className="text-sm font-medium text-rose-600 flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4" />
                            Отсутствует
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={statCardShellClass}>
                      <div className="flex shrink-0 items-center justify-between mb-4">
                        <h3 className={overlineClass}>DESCRIPTION</h3>
                        <StatusIcon status={!!data.seo.description && data.seo.description !== 'Not found'} />
                      </div>
                      <div className="flex-1">
                        {data.seo.description && data.seo.description !== 'Not found' ? (
                          <p className="text-sm font-medium text-slate-700 leading-relaxed break-words">{data.seo.description}</p>
                        ) : (
                          <p className="text-sm font-medium text-rose-600 flex items-center gap-1.5">
                            <AlertTriangle className="h-4 w-4" />
                            Отсутствует
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3 sm:gap-6">
                  {/* H1 */}
                  <div className={seoKpiCardClass}>
                    <div className="flex shrink-0 items-center justify-between mb-2">
                      <h3 className={overlineClass}>H1 ЗАГОЛОВКИ</h3>
                      <StatusIcon status={data.seo.h1.pagesWithIssues === 0} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`${seoKpiNumberClass} leading-none ${data.seo.h1.pagesWithIssues === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {data.seo.h1.pagesWithIssues === 0 ? 'OK' : `${data.seo.h1.pagesWithIssues}`}
                      </span>
                      {data.seo.h1.pagesWithIssues !== 0 ? (
                        <span className={seoKpiDenomClass}>ошибок</span>
                      ) : (
                        <span className={seoKpiDenomClass}>из {data.seo.h1.pagesChecked || 0} стр.</span>
                      )}
                    </div>
                    
                    {data.seo.h1.pagesWithIssues && data.seo.h1.pagesWithIssues > 0 ? (
                      <footer className="mt-auto pt-4 border-t border-slate-50 flex flex-col items-start w-full">
                        <button
                          onClick={() => setShowH1Details(!showH1Details)}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF4C00] hover:text-[#e64400] transition-colors group"
                        >
                          {showH1Details ? 'Скрыть детали' : 'Показать детали'}
                          <Layers className={`h-3.5 w-3.5 transition-transform ${showH1Details ? 'rotate-180' : ''}`} />
                        </button>
                      </footer>
                    ) : (
                      <footer className="mt-auto pt-2 border-t border-slate-50">
                        <p className={footerTextClass}>Заголовки настроены верно</p>
                      </footer>
                    )}
                  </div>

                  {/* Images */}
                  <div className={seoKpiCardClass}>
                    <div className="flex shrink-0 items-center justify-between mb-2">
                      <h3 className={overlineClass}>ИЗОБРАЖЕНИЯ</h3>
                      <StatusIcon status={data.seo.images.missingAlt === 0} />
                    </div>
                    <div className="flex items-baseline tabular-nums gap-1.5">
                      <span className={`${seoKpiNumberClass} leading-none ${data.seo.images.missingAlt === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{data.seo.images.missingAlt}</span>
                      <span className={seoKpiDenomClass}>/ {data.seo.images.total}</span>
                    </div>
                    <footer className="mt-auto pt-2 border-t border-slate-50">
                      <p className={footerTextClass}>Пропущено атрибутов ALT</p>
                    </footer>
                  </div>

                  {/* SSL & Favicon */}
                  <div className={seoKpiCardClass}>
                    <div className="flex shrink-0 items-center justify-between mb-4">
                      <h3 className={overlineClass}>ПАРАМЕТРЫ</h3>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">SSL</span>
                        <StatusIcon status={data.technical.ssl} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-600">Favicon</span>
                        <StatusIcon status={data.technical.favicon} />
                      </div>
                    </div>
                  </div>
                  </div>

                  {/* CTA */}
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-between gap-4 hover:shadow-md transition-shadow sm:flex-row">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl border ${data.seo.cta.isEnough ? 'bg-emerald-50 border-emerald-100' : 'bg-[#FF4C00]/5 border-[#FF4C00]/20'}`}>
                        <Zap className={`h-5 w-5 ${data.seo.cta.isEnough ? 'text-emerald-600' : 'text-[#FF4C00]'}`} />
                      </div>
                      <div>
                        <h3 className={`${overlineClass} mb-0.5`}>ПРИЗЫВЫ К ДЕЙСТВИЮ</h3>
                        <p className="font-bold text-slate-700 text-sm">{data.seo.cta.isEnough ? 'Оценка: Отлично' : 'Нужно больше кнопок'}</p>
                      </div>
                    </div>
                    <StatusIcon status={data.seo.cta.isEnough} />
                  </div>
                </div>
              </section>

              {/* 4. Recommendations */}
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Lightbulb className="h-6 w-6 text-slate-900" />
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">Резюме и рекомендации</h2>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 md:p-6 space-y-3">
                    {generateRecommendations(data).map((rec, index) => {
                      const getStyles = (type: string) => {
                        switch (type) {
                          case 'error': return { border: 'border-l-rose-500', bg: 'bg-rose-50/30', text: 'text-rose-700', icon: <XCircle className="h-5 w-5 text-rose-500" strokeWidth={1.5} /> };
                          case 'warning': return { border: 'border-l-amber-500', bg: 'bg-amber-50/30', text: 'text-amber-700', icon: <AlertTriangle className="h-5 w-5 text-amber-500" strokeWidth={1.5} /> };
                          case 'success': return { border: 'border-l-emerald-500', bg: 'bg-emerald-50/30', text: 'text-emerald-700', icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" strokeWidth={1.5} /> };
                          default: return { border: 'border-l-blue-500', bg: 'bg-blue-50/30', text: 'text-blue-700', icon: <Lightbulb className="h-5 w-5 text-blue-500" strokeWidth={1.5} /> };
                        }
                      };
                      const styles = getStyles(rec.type);
                      return (
                        <div key={index} className={`flex items-start gap-3 p-4 rounded-xl border border-slate-100 border-l-4 ${styles.border} ${styles.bg}`}>
                          <div className="shrink-0 mt-0.5">
                            {styles.icon}
                          </div>
                          <p className={`font-medium text-sm leading-relaxed ${styles.text}`}>{rec.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Modals moved outside animated containers to fix backdrop positioning */}
      {data && (
        <>
          {/* Модальное окно: Детали H1 */}
          {showH1Details && data.seo.allPages && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
              <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white p-6">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">Страницы с ошибками H1</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      Найдено {data.seo.h1.pagesWithIssues} страниц с некорректным количеством H1
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {data.seo.allPages
                    .filter(page => page.h1.length !== 1)
                    .map((page, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="min-w-0 flex-1">
                            <a
                              href={page.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-[#FF4C00] hover:underline flex items-center gap-1.5 truncate"
                            >
                              {page.url}
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            </a>
                          </div>
                          <div className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${page.h1.length === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            {page.h1.length === 0 ? 'Отсутствует H1' : `${page.h1.length} заголовка H1`}
                          </div>
                        </div>
                        {page.h1.length > 0 && (
                          <div className="space-y-1.5 mt-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Найденные заголовки:</p>
                            {page.h1.map((text, hIdx) => (
                              <div key={hIdx} className="flex items-start gap-2 text-xs text-slate-600 bg-white p-2 rounded border border-slate-100 italic">
                                <span className="text-slate-300 font-bold">#</span>
                                {text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                <div className="border-t border-slate-100 p-6 shrink-0 bg-slate-50/50">
                  <button
                    onClick={() => setShowH1Details(false)}
                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Модальное окно со списком ссылок */}
          {showBrokenLinks && data.technical.links.brokenUrls && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              {/* Overlay */}
              <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setShowBrokenLinks(false)}
              />

              {/* Modal Content */}
              <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between border-b border-slate-100 p-6 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">Нерабочие ссылки</h4>
                      <p className="text-xs font-medium text-slate-400">Найдено {data.technical.links.brokenUrls.length} проблемных элементов</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-y-auto p-6 space-y-3 custom-scrollbar">
                  {data.technical.links.brokenUrls.map((item, idx) => (
                    <div key={idx} className="group flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-[#FF4C00]/20 hover:shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col min-w-0 flex-1 gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Битый URL</span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="break-all text-xs font-semibold text-rose-600 hover:underline"
                          >
                            {item.url}
                          </a>
                        </div>
                        <div className="shrink-0 pt-1">
                          <a
                            href={`${data.url}#:~:text=${encodeURIComponent(item.text)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF4C00]/5 px-3 py-1.5 text-xs font-bold text-[#FF4C00] transition-all hover:bg-[#FF4C00] hover:text-white"
                          >
                            Найти <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Текст:</span>
                        <span className="text-xs text-slate-600 truncate italic">
                          {item.text && item.text !== 'Без текста' ? `"${item.text}"` : <span className="text-slate-300 not-italic">Текст отсутствует</span>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 p-6 shrink-0 bg-slate-50/50 rounded-b-3xl">
                  <button
                    onClick={() => setShowBrokenLinks(false)}
                    className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
