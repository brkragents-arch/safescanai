import React, { useState, useEffect } from 'react';
import { Terminal, Send, Check, Copy, Code, ExternalLink, X, RefreshCw, Sparkles, Server } from 'lucide-react';
import { SafeScanAPI, HealthResponse } from '../../services/apiClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiExplorerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/health');
  const [requestBody, setRequestBody] = useState<string>('');
  const [responseOutput, setResponseOutput] = useState<string>('Click "Send Request" to test this endpoint live.');
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);

  const endpoints = [
    {
      id: 'GET /api/health',
      method: 'GET',
      path: '/api/health',
      description: 'Check backend server status and active AI capabilities.',
      defaultBody: '',
    },
    {
      id: 'GET /api/products',
      method: 'GET',
      path: '/api/products?type=food',
      description: 'List food and cosmetic products with optional query filters.',
      defaultBody: '',
    },
    {
      id: 'GET /api/barcode',
      method: 'GET',
      path: '/api/barcode/079357318924',
      description: 'Lookup product by UPC/EAN barcode in indexed catalog.',
      defaultBody: '',
    },
    {
      id: 'POST /api/analyze',
      method: 'POST',
      path: '/api/analyze',
      description: 'Live toxicological & allergen analysis on custom ingredient text using Gemini 3.8 Flash.',
      defaultBody: JSON.stringify(
        {
          text: 'Water, Glycerin, Niacinamide, Squalane, Phenoxyethanol, Fragrance, Red 40',
          type: 'cosmetics',
          productName: 'Custom Radiant Serum',
          brand: 'Independent Skincare',
        },
        null,
        2
      ),
    },
    {
      id: 'POST /api/compare',
      method: 'POST',
      path: '/api/compare',
      description: 'Side-by-side comparative analysis of 2 or more products.',
      defaultBody: JSON.stringify(
        {
          productIds: ['food_granola_berries', 'food_granola_sprouted'],
        },
        null,
        2
      ),
    },
    {
      id: 'GET /api/ingredient-of-the-day',
      method: 'GET',
      path: '/api/ingredient-of-the-day',
      description: 'Retrieve current educational ingredient monograph.',
      defaultBody: '',
    },
  ];

  const currentDef = endpoints.find((e) => e.id === selectedEndpoint) || endpoints[0];

  useEffect(() => {
    if (isOpen) {
      SafeScanAPI.getHealth()
        .then(setHealthStatus)
        .catch(() => setHealthStatus(null));
      setRequestBody(currentDef.defaultBody);
    }
  }, [isOpen, selectedEndpoint]);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseOutput('Executing request against SafeScan API...');
    setStatusCode(null);

    const startTime = performance.now();
    try {
      let res: globalThis.Response;
      if (currentDef.method === 'GET') {
        res = await fetch(currentDef.path);
      } else {
        res = await fetch(currentDef.path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody || '{}',
        });
      }

      setStatusCode(res.status);
      const data = await res.json();
      const duration = Math.round(performance.now() - startTime);
      setResponseOutput(`// HTTP Status: ${res.status} ${res.statusText} (${duration}ms)\n` + JSON.stringify(data, null, 2));
    } catch (err: any) {
      setStatusCode(500);
      setResponseOutput(`// Network or Client Error\n${err?.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCurl = () => {
    const origin = window.location.origin;
    if (currentDef.method === 'GET') {
      return `curl -X GET "${origin}${currentDef.path}"`;
    }
    const escapedBody = (requestBody || '{}').replace(/'/g, "'\\''");
    return `curl -X POST "${origin}${currentDef.path}" \\\n  -H "Content-Type: application/json" \\\n  -d '${escapedBody}'`;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(generateCurl());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-stone-900 text-stone-100 rounded-3xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 flex items-center justify-between gap-4 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Server size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">SafeScan REST API Console</h2>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded">
                  v1.2.0
                </span>
                {healthStatus?.aiEngineActive && (
                  <span className="text-[10px] font-medium bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded flex items-center gap-1">
                    <Sparkles size={10} /> Gemini 3.8 Active
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">
                Interactive API Explorer for food & cosmetics toxicological screening
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close API console"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid lg:grid-cols-12 gap-5">
          {/* Left Column: Endpoint List */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400 block font-semibold">
              Available Endpoints
            </span>

            <div className="space-y-1.5">
              {endpoints.map((ep) => {
                const isSelected = selectedEndpoint === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setSelectedEndpoint(ep.id);
                      setRequestBody(ep.defaultBody);
                      setStatusCode(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/80 border-emerald-600 text-white shadow-xs'
                        : 'bg-stone-950/40 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          ep.method === 'GET'
                            ? 'bg-blue-900/70 text-blue-300'
                            : 'bg-emerald-900/70 text-emerald-300'
                        }`}
                      >
                        {ep.method}
                      </span>
                      <span className="font-semibold text-stone-200 truncate">{ep.path.split('?')[0]}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 font-sans line-clamp-2 leading-relaxed">
                      {ep.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Quick cURL command box */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                <span className="font-mono">cURL Command</span>
                <button
                  onClick={handleCopyCurl}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer font-sans"
                >
                  {copiedCurl ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-xl bg-black border border-stone-800 text-[10px] font-mono text-stone-300 overflow-x-auto whitespace-pre-wrap break-all">
                {generateCurl()}
              </pre>
            </div>
          </div>

          {/* Right Column: Interactive Tester */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Request Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                      currentDef.method === 'GET' ? 'bg-blue-900 text-blue-200' : 'bg-emerald-900 text-emerald-200'
                    }`}
                  >
                    {currentDef.method}
                  </span>
                  <span className="text-xs font-mono text-stone-200 font-bold">{currentDef.path}</span>
                </div>

                <button
                  onClick={handleExecute}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs shadow-md shadow-emerald-950/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  <span>Send Request</span>
                </button>
              </div>

              {/* Request Body Editor if POST */}
              {currentDef.method === 'POST' && (
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-stone-400 block font-semibold">
                    JSON Request Payload:
                  </span>
                  <textarea
                    rows={6}
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black border border-stone-800 text-xs font-mono text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Response Viewer */}
            <div className="flex-1 flex flex-col space-y-1 min-h-[220px]">
              <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                <div className="flex items-center gap-2">
                  <span>Live API Response</span>
                  {statusCode !== null && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        statusCode >= 200 && statusCode < 300
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {statusCode}
                    </span>
                  )}
                </div>
                <span>application/json</span>
              </div>

              <pre className="flex-1 p-3 rounded-2xl bg-black border border-stone-800 text-xs font-mono text-stone-200 overflow-y-auto max-h-[280px] leading-relaxed whitespace-pre-wrap">
                {responseOutput}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-stone-800 bg-stone-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>
              LLM API: <strong className="text-stone-200">gemini-3.8-flash</strong> active via server-side <code className="text-emerald-400">@google/genai</code>. Your API key can be configured in the <strong className="text-stone-200">Settings &gt; Secrets</strong> panel.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
