import React, { useState } from 'react';
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  FileText, 
  BarChart3, 
  AlertTriangle,
  Layers,
  PhoneCall,
  Zap,
  Lightbulb
} from 'lucide-react';

interface AuditData {
  url: string;
  marketing: {
    analytics: {
      yandexMetrika: boolean;
      vkPixel: boolean;
      roistat: boolean;
      calltouch: boolean;
      comagic: boolean;
      mango: boolean;
    };
    callTracking: {
      present: boolean;
      method: string;
    };
  };
  seo: {
    title: string;
    description: string;
    h1: {
      count: number;
      items: string[];
      hasDuplicates: boolean;
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
  };
  technical: {
    links: {
      total: number;
      empty: number;
      brokenUrls: string[];
    };
    favicon: boolean;
    ssl: boolean;
  };
  performance: {
    scoreValue: number;
    lcp: string;
    score: 'Excellent' | 'Good' | 'Poor';
  };
}

const generateRecommendations = (data: AuditData) => {
  const recs: { type: 'error' | 'warning' | 'info' | 'success'; text: string }[] = [];
  
  // Performance
  if (data.performance.scoreValue < 50) recs.push({ type: 'error', text: 'Критически низкая скорость загрузки сайта. По Google PageSpeed оценка ниже 50.' });
  else if (data.performance.scoreValue < 90) recs.push({ type: 'warning', text: 'Увеличьте скорость загрузки сайта. По Google PageSpeed оценка ниже 90 (в "желтой" зоне).' });
  
  // SEO
  if (!data.seo.title || data.seo.title === 'Not found') recs.push({ type: 'error', text: 'Добавьте тег Title. Это критически важно для SEO.' });
  else if (data.seo.title.length < 30 || data.seo.title.length > 65) recs.push({ type: 'warning', text: 'Скорректируйте длину Title (оптимально 30-65 символов).' });
  
  if (!data.seo.description || data.seo.description === 'Not found') recs.push({ type: 'error', text: 'Добавьте мета-тег Description для улучшения кликабельности (CTR) в поиске.' });
  
  if (data.seo.h1.count === 0) recs.push({ type: 'error', text: 'На странице отсутствует тег H1. Обязательно добавьте главный заголовок.' });
  else if (data.seo.h1.hasDuplicates) recs.push({ type: 'warning', text: 'На странице несколько тегов H1. Рекомендуется оставить только один.' });
  
  if (data.seo.images.missingAlt > 0) recs.push({ type: 'warning', text: `Добавьте атрибут alt для ${data.seo.images.missingAlt} изображений. Это полезно для поиска по картинкам и доступности.` });
  if (!data.seo.cta.isEnough) recs.push({ type: 'info', text: 'Рекомендуется добавить больше кнопок призыва к действию (CTA) для повышения конверсии.' });
  
  // Technical
  if (data.technical.links.brokenUrls && data.technical.links.brokenUrls.length > 0) recs.push({ type: 'error', text: `Исправьте или удалите битые ссылки (${data.technical.links.brokenUrls.length} шт.). Они негативно влияют на SEO.` });
  if (!data.technical.favicon) recs.push({ type: 'warning', text: 'Добавьте фавикон для улучшения узнаваемости сайта во вкладках браузера.' });
  
  // Marketing
  const hasAnalytics = Object.values(data.marketing.analytics).some(v => v);
  if (!hasAnalytics) recs.push({ type: 'warning', text: 'Установите системы аналитики (например, Яндекс.Метрику или VK Pixel) для отслеживания посетителей.' });
  
  if (!data.marketing.callTracking.present) recs.push({ type: 'info', text: 'Если вы принимаете звонки, рассмотрите подключение коллтрекинга для анализа источников звонков.' });

  if (recs.length === 0) recs.push({ type: 'success', text: 'Отличная работа! Сайт хорошо оптимизирован, критических проблем не найдено.' });

  return recs;
};

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showBrokenLinks, setShowBrokenLinks] = useState(false);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setData(null);
    setShowBrokenLinks(false);

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.startsWith('http') ? url : `https://${url}` }),
      });

      if (!response.ok) {
        throw new Error('Failed to run audit');
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

  const overlineClass = 'text-[11px] font-bold uppercase tracking-[0.05em] text-slate-400';
  const footerTextClass = 'text-xs font-medium text-slate-500 antialiased';
  const kpiNumberClass = 'text-4xl font-bold tracking-tighter tabular-nums';
  const kpiDenomClass = 'text-lg font-medium leading-none text-slate-400 tabular-nums';
  /** SEO mini-cards: narrower columns — one step smaller than technical KPIs for visual parity */
  const seoKpiNumberClass = 'text-3xl font-bold tracking-tight tabular-nums';
  const seoKpiDenomClass = 'text-base font-medium leading-none text-slate-400 tabular-nums';
  const statusPositiveClass = 'text-2xl font-bold tracking-tight leading-none text-emerald-600';
  const statusNegativeClass = 'text-2xl font-bold tracking-tight leading-none text-rose-600';
  const statCardShellClass =
    'bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full min-h-[180px] hover:shadow-md transition-shadow';
  const seoKpiCardClass =
    'bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2 hover:shadow-md transition-shadow';
  const formattedLcp = data?.performance.lcp.replace(/s$/i, ' s');

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased tabular-nums flex flex-col justify-center selection:bg-[#FF4C00]/20 selection:text-[#FF4C00]">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
                  <div className={statCardShellClass}>
                    <div className="flex min-h-0 flex-1 grow flex-col gap-2">
                      <div className="flex shrink-0 items-center justify-between">
                        <h3 className={overlineClass}>СКОРОСТЬ ЗАГРУЗКИ</h3>
                        <div className={`${getPerfBadgeColor(data.performance.score)}`}>
                          {data.performance.score === 'Excellent' ? 'Отличная' : data.performance.score === 'Good' ? 'Средняя' : 'Низкая'}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-1.5">
                          <p
                            className={`${kpiNumberClass} leading-none ${
                              data.performance.scoreValue < 90 && data.performance.scoreValue >= 50
                                ? 'text-orange-600'
                                : getPerfTextColor(data.performance.score)
                            }`}
                          >
                            {data.performance.scoreValue}
                          </p>
                          <p className={kpiDenomClass}>/ 100</p>
                        </div>
                      </div>
                    </div>
                    <footer className="mt-auto pt-4">
                      <p className={footerTextClass}>
                        Время загрузки: {formattedLcp}
                      </p>
                    </footer>
                  </div>
                  <div className={statCardShellClass}>
                    <div className="flex min-h-0 flex-1 grow flex-col gap-2">
                      <div className="flex shrink-0 items-center justify-between">
                        <h3 className={overlineClass}>НЕРАБОЧИЕ ССЫЛКИ</h3>
                        <StatusIcon status={(data.technical.links.brokenUrls?.length || 0) === 0} />
                      </div>
                      <p className={`${kpiNumberClass} ${(data.technical.links.brokenUrls?.length || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {data.technical.links.brokenUrls?.length || 0}
                      </p>
                      {data.technical.links.brokenUrls && data.technical.links.brokenUrls.length > 0 ? (
                        <div className="mt-5">
                          <button
                            onClick={() => setShowBrokenLinks(!showBrokenLinks)}
                            className="text-sm font-semibold text-[#FF4C00] hover:text-[#e64400] transition-colors"
                          >
                            {showBrokenLinks ? 'Скрыть список' : 'Показать список'}
                          </button>
                          {showBrokenLinks && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto">
                              <ul className="space-y-2">
                                {data.technical.links.brokenUrls.map((linkUrl, idx) => (
                                  <li key={idx} className="text-sm text-slate-600 break-all bg-white p-2 rounded-lg shadow-sm border border-slate-200">
                                    <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF4C00] hover:underline">
                                      {linkUrl}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    {(!data.technical.links.brokenUrls || data.technical.links.brokenUrls.length === 0) && (
                      <footer className="mt-auto pt-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  <div className={statCardShellClass}>
                    <h3 className={`${overlineClass} mb-4`}>СИСТЕМЫ АНАЛИТИКИ</h3>
                    <div className="flex flex-col flex-1 content-start">
                      {Object.entries(data.marketing.analytics).map(([key, value], index) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between py-2 px-2 ${index > 0 ? 'border-t border-slate-200' : ''}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <StatusIcon status={value} />
                            <span className={`text-sm font-medium ${value ? 'text-slate-800' : 'text-slate-600'}`}>
                              {key === 'yandexMetrika' ? 'Яндекс.Метрика' : 
                               key === 'vkPixel' ? 'Пиксель ВК' : 
                               key.charAt(0).toUpperCase() + key.slice(1)}
                            </span>
                          </div>
                          {value && (
                            <span className="bg-emerald-50 text-emerald-700 font-medium px-2 py-0.5 rounded-full text-xs">
                              Найдено
                            </span>
                          )}
                          {!value && (
                            <span className="bg-slate-50 text-slate-400 font-medium px-2 py-0.5 rounded-full text-xs">Не найдено</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={statCardShellClass}>
                    <div className="flex min-h-0 flex-1 flex-col gap-2">
                      <div className="flex shrink-0 items-center justify-between mb-2">
                        <h3 className={overlineClass}>ПОДМЕНА НОМЕРА</h3>
                        <StatusIcon status={data.marketing.callTracking.present} />
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 flex shrink-0 items-center justify-center rounded-lg border ${data.marketing.callTracking.present ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                          <PhoneCall className={`h-5 w-5 ${data.marketing.callTracking.present ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                        <div className="min-w-0">
                          <p className={data.marketing.callTracking.present ? statusPositiveClass : statusNegativeClass}>
                            {data.marketing.callTracking.present ? 'Найдено' : 'Не найдено'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto border-t border-slate-100 pt-4">
                      <p className="text-[13px] leading-relaxed text-slate-600">
                        Поиск скриптов коллтрекинга и специфических классов в коде.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. SEO */}
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <FileText className="h-6 w-6 text-slate-900" />
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">SEO-аудит</h2>
                </div>
                <div className="flex flex-col gap-6">
                  {/* Meta */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-6 hover:shadow-md transition-shadow md:flex-row">
                    <div className="flex-1">
                      <h3 className={`${overlineClass} mb-2`}>TITLE</h3>
                      <p className="font-medium text-slate-700 text-base leading-relaxed truncate max-w-full">{data.seo.title}</p>
                    </div>
                    <div className="flex-1">
                      <h3 className={`${overlineClass} mb-2`}>DESCRIPTION</h3>
                      <p className="font-medium text-slate-700 text-base leading-relaxed line-clamp-2 max-w-full">{data.seo.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3 sm:gap-6">
                  {/* H1 */}
                  <div className={seoKpiCardClass}>
                    <div className="flex shrink-0 items-center justify-between">
                      <h3 className={overlineClass}>H1 ЗАГОЛОВКИ</h3>
                      <StatusIcon status={data.seo.h1.count === 1 && !data.seo.h1.hasDuplicates} />
                    </div>
                    <div className="flex w-full items-baseline justify-between gap-3">
                      <span className={`${seoKpiNumberClass} leading-none ${data.seo.h1.count === 1 && !data.seo.h1.hasDuplicates ? 'text-emerald-600' : 'text-rose-600'}`}>{data.seo.h1.count}</span>
                      {data.seo.h1.hasDuplicates && (
                        <div className="flex shrink-0 items-center gap-1 text-[#FF4C00] bg-[#FF4C00]/5 px-2 py-1 rounded-md border border-[#FF4C00]/20">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">Дубли</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Images */}
                  <div className={seoKpiCardClass}>
                    <div className="flex shrink-0 items-center justify-between">
                      <h3 className={overlineClass}>ИЗОБРАЖЕНИЯ БЕЗ ALT</h3>
                      <StatusIcon status={data.seo.images.missingAlt === 0} />
                    </div>
                    <div className="flex items-baseline tabular-nums">
                      <span className={`${seoKpiNumberClass} leading-none ${data.seo.images.missingAlt === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{data.seo.images.missingAlt}</span>
                      <span className={`ml-2 ${seoKpiDenomClass}`}>/ {data.seo.images.total}</span>
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className={seoKpiCardClass}>
                    <div className="flex shrink-0 items-center justify-between">
                      <h3 className={overlineClass}>ФАВИКОН</h3>
                      <StatusIcon status={data.technical.favicon} />
                    </div>
                    <p className={`text-2xl font-bold tracking-tight leading-none ${data.technical.favicon ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {data.technical.favicon ? 'Установлен' : 'Отсутствует'}
                    </p>
                  </div>
                  </div>

                  {/* CTA */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-between gap-4 hover:shadow-md transition-shadow sm:flex-row">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg border ${data.seo.cta.isEnough ? 'bg-emerald-50 border-emerald-100' : 'bg-[#FF4C00]/5 border-[#FF4C00]/20'}`}>
                        <Zap className={`h-6 w-6 ${data.seo.cta.isEnough ? 'text-emerald-600' : 'text-[#FF4C00]'}`} />
                      </div>
                      <div>
                        <h3 className={`${overlineClass} mb-1`}>ПРИЗЫВЫ К ДЕЙСТВИЮ (CTA)</h3>
                        <p className="font-medium text-slate-900 text-base">{data.seo.cta.isEnough ? 'Оценка CTA: OK' : 'Рекомендуется добавить больше CTA'}</p>
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 md:p-6 space-y-4">
                    {generateRecommendations(data).map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 border-l-4 border-l-amber-400 bg-white">
                        <div className="shrink-0 mt-0.5">
                          <AlertTriangle className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
                        </div>
                        <p className="font-medium text-sm leading-relaxed text-slate-700">{rec.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default App;
