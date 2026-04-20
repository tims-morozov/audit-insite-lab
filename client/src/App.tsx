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
  Zap
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
  visual: {
    screenshot: string;
    mobileFriendly: boolean;
  };
}

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
    status ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-400" />;

  const getPerformanceColor = (score: string) => {
    switch (score) {
      case 'Excellent': return 'text-green-600 bg-green-50 border-green-100';
      case 'Good': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-red-600 bg-red-50 border-red-100';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Audit Insite Lab
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Профессиональный экспресс-аудит маркетинга и SEO с использованием Puppeteer
          </p>
        </div>

        <form onSubmit={handleAudit} className="mb-12">
          <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="vash-sait.ru"
                className="block w-full pl-12 pr-4 py-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white shadow-sm transition-all text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url}
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Анализируем...
                </>
              ) : (
                <>
                  <Search className="h-6 w-6" />
                  Начать аудит
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 mb-8 bg-red-50 border border-red-100 rounded-2xl text-red-700 flex items-center gap-3 animate-shake max-w-3xl mx-auto">
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
                  <Layers className="h-6 w-6 text-purple-600" />
                  <h2 className="text-xl font-bold text-slate-900">Техническое состояние</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-6 rounded-3xl shadow-sm border-2 transition-all flex flex-col justify-center ${getPerformanceColor(data.performance.score)}`}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Google PageSpeed</p>
                    <div className="flex items-end gap-3">
                      <p className="text-5xl font-black leading-none">{data.performance.scoreValue}</p>
                      <p className="text-sm font-bold opacity-70 mb-1">/ 100</p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter border-2 border-current">
                        {data.performance.score}
                      </div>
                      <span className="text-xs font-semibold opacity-70 ml-2">
                        LCP: {data.performance.lcp}
                      </span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Нерабочие ссылки</p>
                        <p className="text-4xl font-black text-slate-900">{data.technical.links.brokenUrls?.length || 0}</p>
                      </div>
                      <StatusIcon status={(data.technical.links.brokenUrls?.length || 0) === 0} />
                    </div>
                    {data.technical.links.brokenUrls && data.technical.links.brokenUrls.length > 0 && (
                      <div className="mt-4">
                        <button
                          onClick={() => setShowBrokenLinks(!showBrokenLinks)}
                          className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {showBrokenLinks ? 'Скрыть список' : 'Показать список'}
                        </button>
                        {showBrokenLinks && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 max-h-48 overflow-y-auto">
                            <ul className="space-y-2">
                              {data.technical.links.brokenUrls.map((linkUrl, idx) => (
                                <li key={idx} className="text-xs text-slate-600 break-all bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                                  <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                                    {linkUrl}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* 2. Маркетинг и Аналитика */}
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-slate-900">Маркетинг и Аналитика</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Системы аналитики</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(data.marketing.analytics).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-50 bg-slate-50/50">
                          <span className="text-sm font-semibold text-slate-700">
                            {key === 'yandexMetrika' ? 'Яндекс.Метрика' : 
                             key === 'vkPixel' ? 'Пиксель ВК' : 
                             key.charAt(0).toUpperCase() + key.slice(1)}
                          </span>
                          <StatusIcon status={value} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Подмена номера</h3>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                        <PhoneCall className={`h-6 w-6 ${data.marketing.callTracking.present ? 'text-blue-600' : 'text-slate-300'}`} />
                        <div>
                          <p className="font-bold text-slate-900">{data.marketing.callTracking.present ? 'Найдено' : 'Не найдено'}</p>
                          <p className="text-xs text-slate-500">{data.marketing.callTracking.method}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed italic">
                      Автоматический поиск скриптов коллтрекинга и специфических классов в коде.
                    </p>
                  </div>
                </div>
              </section>

              {/* 3. SEO */}
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <FileText className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-xl font-bold text-slate-900">SEO-аудит</h2>
                </div>
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Заголовок страницы (Title)</label>
                        <p className="text-slate-900 mt-1.5 font-semibold text-lg leading-tight">{data.seo.title}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Мета-описание (Description)</label>
                        <p className="text-slate-600 mt-1.5 text-sm leading-relaxed">{data.seo.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                        <p className="text-xs font-bold text-indigo-400 uppercase">H1 Заголовки</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-2xl font-black text-indigo-700">{data.seo.h1.count}</span>
                          {data.seo.h1.hasDuplicates && (
                            <div className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-0.5 rounded-lg border border-red-100">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase tracking-tighter">Дубль!</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                        <p className="text-xs font-bold text-amber-500 uppercase">Картинки без Alt</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-2xl font-black ${data.seo.images.missingAlt > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                            {data.seo.images.missingAlt} <span className="text-sm font-normal text-slate-400">из {data.seo.images.total}</span>
                          </span>
                          <ImageIcon className={`h-5 w-5 ${data.seo.images.missingAlt > 0 ? 'text-amber-500' : 'text-green-500'}`} />
                        </div>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">CTA (Кнопки призыва к действию)</h3>
                      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${data.seo.cta.isEnough ? 'bg-green-50/50 border-green-100' : 'bg-amber-50/50 border-amber-100'}`}>
                        <Zap className={`h-6 w-6 shrink-0 ${data.seo.cta.isEnough ? 'text-green-600' : 'text-amber-500'}`} />
                        <div>
                          <p className="font-bold text-slate-900">
                            {data.seo.cta.isEnough 
                                ? 'Оценка CTA: OK' 
                                : 'Оценка CTA: Рекомендуется увеличить количество CTA'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>

            {/* Right Column: Visual & Mobile (Temporarily Hidden) 
            <div className="space-y-8 mt-8">
              
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <Eye className="h-6 w-6 text-emerald-600" />
                  <h2 className="text-xl font-bold text-slate-900">Визуальный аудит</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${data.visual.mobileFriendly ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        <Smartphone className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Адаптивность</p>
                        <p className="font-bold text-slate-900">{data.visual.mobileFriendly ? 'Оптимизировано' : 'Нет meta viewport'}</p>
                      </div>
                    </div>
                    <StatusIcon status={data.visual.mobileFriendly} />
                  </div>

                  <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 overflow-hidden group">
                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-slate-100">
                      <img 
                        src={data.visual.screenshot} 
                        alt="Site Screenshot" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button className="bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm shadow-xl">
                          Увеличить
                        </button>
                      </div>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Скриншот главной страницы</p>
                    </div>
                  </div>
                </div>
              </section>

            </div>
            */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
