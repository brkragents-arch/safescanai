import React from 'react';
import { ActiveScreen } from '../../types/scanner';
import { Home, Scan, Scale, History, User } from 'lucide-react';

interface Props {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
}

export const BottomNav: React.FC<Props> = ({ activeScreen, onNavigate }) => {
  const tabs = [
    { id: 'home' as ActiveScreen, label: 'Home', icon: Home },
    { id: 'scan' as ActiveScreen, label: 'Scan', icon: Scan },
    { id: 'compare' as ActiveScreen, label: 'Compare', icon: Scale },
    { id: 'history' as ActiveScreen, label: 'History', icon: History },
    { id: 'profile' as ActiveScreen, label: 'Profile', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 shadow-lg shadow-stone-900/5 transition-all md:hidden"
      aria-label="Bottom Navigation"
    >
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeScreen === tab.id ||
            (tab.id === 'home' && (activeScreen === 'product-detail' || activeScreen === 'ingredient-detail'));

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] min-w-[44px] py-1 cursor-pointer transition-colors relative ${
                isActive ? 'text-emerald-800 font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.id === 'scan' ? (
                <div className="relative -mt-4 w-12 h-12 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-md shadow-emerald-900/30 active:scale-95 transition-transform">
                  <Scan size={22} />
                </div>
              ) : (
                <div className="relative flex items-center justify-center w-6 h-6">
                  <Icon size={20} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                  {isActive && (
                    <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-emerald-800" aria-hidden="true" />
                  )}
                </div>
              )}
              <span className={`text-[10px] tracking-tight mt-1 whitespace-nowrap ${tab.id === 'scan' ? 'font-semibold text-emerald-800' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
