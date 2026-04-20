import React, { useState } from 'react';
import { 
  Search, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Globe, 
  FileText, 
  BarChart3, 
  ShieldCheck, 
  Image as ImageIcon,
  AlertTriangle,
  Layers,
  PhoneCall,
  Zap,
  Lightbulb,
  AlertCircle,
  Info
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
    status ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-rose-500" />;

  const getPerfTextColor = (score: string) => {
    switch (score) {
      case 'Excellent': return 'text-emerald-600';
      case 'Good': return 'text-[#FF4C00]';
      default: return 'text-rose-600';
    }
  };

  const getPerfBadgeColor = (score: string) => {
    switch (score) {
      case 'Excellent': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Good': return 'bg-[#FF4C00]/10 text-[#FF4C00] border-[#FF4C00]/20';
      default: return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-slate-900 antialiased flex flex-col justify-center selection:bg-[#FF4C00]/20 selection:text-[#FF4C00]">
      <main className="py-12 px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={handleAudit} className="mb-12">
            <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Введите URL сайта (например: vash-sait.ru)"
                  className="block w-full pl-12 pr-4 py-3.5 sm:py-4 bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-900 placeholder:text-slate-400 text-base sm:text-lg"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url}
                className="px-8 py-3.5 sm:py-4 bg-[#FF4C00] text-white font-semibold rounded-lg hover:bg-[#e64400] focus:outline-none focus:ring-4 focus:ring-[#FF4C00]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-base sm:text-lg shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
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
            <div className="space-y-8">
              
              {/* 1. Техническое состояние */}
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Layers className="h-6 w-6 text-slate-900" />
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">Техническое состояние</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Скорость загрузки</h3>
                        <div className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide border ${getPerfBadgeColor(data.performance.score)}`}>
                          {data.performance.score === 'Excellent' ? 'Отличная' : data.performance.score === 'Good' ? 'Средняя' : 'Низкая'}
                        </div>
                      </div>
                      <div className="flex items-end gap-2">
                        <p className={`text-4xl font-bold tracking-tight leading-none ${getPerfTextColor(data.performance.score)}`}>{data.performance.lcp}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                      <span className="text-sm font-medium text-slate-500">
                        Оценка Google PageSpeed
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {data.performance.scoreValue} <span className="text-slate-400 font-normal">/ 100</span>
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Нерабочие ссылки</h3>
                        <StatusIcon status={(data.technical.links.brokenUrls?.length || 0) === 0} />
                      </div>
                      <p className={`text-4xl font-bold tracking-tight ${(data.technical.links.brokenUrls?.length || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {data.technical.links.brokenUrls?.length || 0}
                      </p>
                    </div>
                    {data.technical.links.brokenUrls && data.technical.links.brokenUrls.length > 0 ? (
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <button
                          onClick={() => setShowBrokenLinks(!showBrokenLinks)}
                          className="text-sm font-semibold text-[#FF4C00] hover:text-[#e64400] transition-colors"
                        >
                          {showBrokenLinks ? 'Скрыть список' : 'Показать список'}
                        </button>
                        {showBrokenLinks && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 max-h-48 overflow-y-auto">
                            <ul className="space-y-2">
                              {data.technical.links.brokenUrls.map((linkUrl, idx) => (
                                <li key={idx} className="text-sm text-slate-600 break-all bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                                  <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#FF4C00] hover:underline">
                                    {linkUrl}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <span className="text-sm font-medium text-slate-500">Битых ссылок не найдено</span>
                      </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-shadow">
                    <h3 className="text-sm font-medium text-slate-500 mb-4">Системы аналитики</h3>
                    <div className="grid grid-cols-1 gap-2 flex-1 content-start">
                      {Object.entries(data.marketing.analytics).map(([key, value]) => (
                        <div key={key} className={`flex items-center justify-between p-2.5 rounded-lg border ${value ? 'bg-emerald-50/30 border-emerald-100/60' : 'bg-slate-50/50 border-slate-100'}`}>
                          <span className={`text-sm font-medium ${value ? 'text-emerald-900' : 'text-slate-500'}`}>
                            {key === 'yandexMetrika' ? 'Яндекс.Метрика' : 
                             key === 'vkPixel' ? 'Пиксель ВК' : 
                             key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                          <StatusIcon status={value} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-slate-500">Подмена номера</h3>
                        <StatusIcon status={data.marketing.callTracking.present} />
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className={`p-3 rounded-xl ${data.marketing.callTracking.present ? 'bg-emerald-50' : 'bg-slate-50 border border-slate-100'}`}>
                          <PhoneCall className={`h-7 w-7 ${data.marketing.callTracking.present ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <p className={`text-xl font-bold tracking-tight ${data.marketing.callTracking.present ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {data.marketing.callTracking.present ? 'Найдено' : 'Не найдено'}
                          </p>
                          <p className={`text-sm font-medium mt-0.5 ${data.marketing.callTracking.present ? 'text-emerald-700/80' : 'text-slate-500'}`}>
                            {data.marketing.callTracking.method}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-500 leading-relaxed">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                  {/* Meta */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-slate-500 mb-2">Title</h3>
                      <p className="text-slate-900 font-medium text-base leading-relaxed">{data.seo.title}</p>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-slate-500 mb-2">Description</h3>
                      <p className="text-slate-900 font-medium text-base leading-relaxed">{data.seo.description}</p>
                    </div>
                  </div>

                  {/* H1 */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-slate-500">H1 Заголовки</h3>
                      <StatusIcon status={data.seo.h1.count === 1 && !data.seo.h1.hasDuplicates} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-3xl font-bold tracking-tight ${data.seo.h1.count === 1 && !data.seo.h1.hasDuplicates ? 'text-emerald-600' : 'text-rose-600'}`}>{data.seo.h1.count}</span>
                      {data.seo.h1.hasDuplicates && (
                        <div className="flex items-center gap-1 text-[#FF4C00] bg-[#FF4C00]/5 px-2 py-1 rounded-md border border-[#FF4C00]/20">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">Дубли</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Images */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-slate-500">Без Alt-тегов</h3>
                      <StatusIcon status={data.seo.images.missingAlt === 0} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-3xl font-bold tracking-tight ${data.seo.images.missingAlt === 0 ? 'text-emerald-600' : 'text-[#FF4C00]'}`}>{data.seo.images.missingAlt}</span>
                      <span className="text-sm font-medium text-slate-400">из {data.seo.images.total}</span>
                    </div>
                  </div>

                  {/* Favicon */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-slate-500">Фавикон</h3>
                      <StatusIcon status={data.technical.favicon} />
                    </div>
                    <p className={`text-xl font-bold tracking-tight ${data.technical.favicon ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {data.technical.favicon ? 'Установлен' : 'Отсутствует'}
                    </p>
                  </div>
                  
                  {/* CTA */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${data.seo.cta.isEnough ? 'bg-emerald-50' : 'bg-[#FF4C00]/5'}`}>
                        <Zap className={`h-6 w-6 ${data.seo.cta.isEnough ? 'text-emerald-600' : 'text-[#FF4C00]'}`} />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-500 mb-1">Призывы к действию (CTA)</h3>
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
                  <div className="p-6 md:p-8 space-y-4">
                    {generateRecommendations(data).map((rec, index) => (
                      <div key={index} className={`flex items-start gap-3 p-4 rounded-xl border ${
                        rec.type === 'error' ? 'bg-rose-50/50 border-rose-100 text-rose-900' :
                        rec.type === 'warning' ? 'bg-[#FF4C00]/5 border-[#FF4C00]/20 text-slate-900' :
                        rec.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' :
                        'bg-slate-50 border-slate-200 text-slate-900'
                      }`}>
                        <div className="shrink-0 mt-0.5">
                          {rec.type === 'error' && <AlertCircle className="h-5 w-5 text-rose-500" />}
                          {rec.type === 'warning' && <AlertTriangle className="h-5 w-5 text-[#FF4C00]" />}
                          {rec.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                          {rec.type === 'info' && <Info className="h-5 w-5 text-slate-400" />}
                        </div>
                        <p className="font-medium text-sm leading-relaxed">{rec.text}</p>
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
