import React, { useState, useEffect } from 'react';
import { ActiveScreen } from '../../types/scanner';
import {
  Sparkles,
  Scan,
  Smartphone,
  Monitor,
  Terminal,
  Database,
  CheckCircle2,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';
import {
  getSupabaseConfig,
  configureSupabaseRuntimeKey,
  ensureSupabaseUserId,
} from '../../services/supabaseService';

interface Props {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  isMobileDeviceFrame: boolean;
  onToggleDeviceFrame: () => void;
  onOpenApiConsole: () => void;
}

export const Header: React.FC<Props> = ({
  activeScreen,
  onNavigate,
  isMobileDeviceFrame,
  onToggleDeviceFrame,
  onOpenApiConsole,
}) => {
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [sbConnected, setSbConnected] = useState(() => getSupabaseConfig().isConfigured);
  const [keyInput, setKeyInput] = useState(() => {
    const cfg = getSupabaseConfig();
    return cfg.isConfigured ? cfg.key : '';
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    setSbConnected(getSupabaseConfig().isConfigured);
  }, []);

  const handleSaveSupabaseKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyInput.trim();
    if (!cleanKey) return;

    setIsConnecting(true);
    setStatusMessage('Connecting to https://yolzjswhzhylduujkyrn.supabase.co...');

    try {
      // Throws if a Secret / service_role key was pasted
      configureSupabaseRuntimeKey(cleanKey);
      const userId = await ensureSupabaseUserId();
      setSbConnected(true);
      setStatusMessage(
        userId
          ? '✅ Connected! Your scan history will now be saved privately to the database.'
          : '⚠️ Key saved, but anonymous sign-in failed. Enable "Allow anonymous sign-ins" in Supabase → Authentication.'
      );
    } catch (err: any) {
      setStatusMessage(err?.message || 'Could not verify connection. Check that your Publishable Key is valid.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg py-1 px-1.5"
              aria-label="SafeScan AI home"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-800 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-950/20 group-hover:scale-105 transition-transform">
                <Sparkles size={18} className="text-emerald-100" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-stone-900 group-hover:text-emerald-800 transition-colors">
                  SafeScan AI
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  Health Scanner
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Clean single-line nav links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <button
              onClick={() => onNavigate('home')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer hover:text-stone-900 ${
                activeScreen === 'home' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onNavigate('scan')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer hover:text-stone-900 ${
                activeScreen === 'scan' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
              }`}
            >
              Scanner
            </button>
            <button
              onClick={() => onNavigate('compare')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer hover:text-stone-900 ${
                activeScreen === 'compare' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
              }`}
            >
              Compare
            </button>
            <button
              onClick={() => onNavigate('history')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer hover:text-stone-900 ${
                activeScreen === 'history' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
              }`}
            >
              History
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className={`whitespace-nowrap transition-colors py-1 cursor-pointer hover:text-stone-900 ${
                activeScreen === 'profile' ? 'text-emerald-800 font-semibold border-b-2 border-emerald-800' : ''
              }`}
            >
              Preferences
            </button>
          </nav>

          {/* Zone 3: Primary Actions & Supabase DB Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowSupabaseModal(true)}
              title="Connect Supabase Database"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                sbConnected
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200'
              }`}
            >
              <Database size={14} className={sbConnected ? 'text-emerald-700' : 'text-amber-700'} />
              <span>{sbConnected ? 'Supabase Connected' : 'Connect Supabase Key'}</span>
            </button>

            <button
              onClick={onOpenApiConsole}
              title="Open Interactive REST API Console"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors cursor-pointer"
              aria-label="Open API Console"
            >
              <Terminal size={14} className="text-emerald-700" />
              <span className="hidden sm:inline">API Console</span>
            </button>

            <button
              onClick={onToggleDeviceFrame}
              title={isMobileDeviceFrame ? 'Switch to Full Desktop View' : 'Switch to Mobile Device Frame View'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle mobile device frame"
            >
              {isMobileDeviceFrame ? (
                <>
                  <Monitor size={14} className="text-stone-600" />
                  <span className="hidden sm:inline">Desktop</span>
                </>
              ) : (
                <>
                  <Smartphone size={14} className="text-emerald-700" />
                  <span className="hidden sm:inline">Mobile Frame</span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigate('scan')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Scan size={15} />
              <span>Scan Product</span>
            </button>
          </div>
        </div>
      </header>

      {/* Interactive Supabase Key Setup Modal (Works directly inside Canvas Preview!) */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900">
                    Supabase Database Connection
                  </h3>
                  <p className="text-[11px] text-stone-500 font-mono">
                    https://yolzjswhzhylduujkyrn.supabase.co
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1.5">
              <div className="font-bold text-stone-900 flex items-center justify-between">
                <span>Where to copy your Publishable Key:</span>
                <a
                  href="https://supabase.com/dashboard/project/yolzjswhzhylduujkyrn/settings/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-bold"
                >
                  <span>Open Supabase API Keys</span>
                  <ExternalLink size={11} />
                </a>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Copy the <strong>Publishable key</strong> (starts with <code>sb_publishable_...</code>) or the <strong>anon public</strong> key (starts with <code>eyJ...</code>) and paste it below.
              </p>
            </div>

            <form onSubmit={handleSaveSupabaseKey} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Supabase Publishable / Anon Public Key
                </label>
                <input
                  type="text"
                  placeholder="Paste sb_publishable_... or eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  autoFocus
                />
              </div>

              {statusMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2 font-medium">
                  <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowSupabaseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isConnecting || !keyInput.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Connecting &amp; Seeding...</span>
                    </>
                  ) : (
                    <span>Connect &amp; Seed Supabase</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
