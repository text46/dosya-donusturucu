import React from 'react';
import { Image as ImageIcon, FileSpreadsheet, Layers, History } from 'lucide-react';

export type AppTab = 'photo' | 'office' | 'tools' | 'history';

interface BottomTabBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  historyCount?: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  historyCount = 0,
}) => {
  const tabs = [
    {
      id: 'photo' as AppTab,
      label: 'Fotoğraf',
      icon: ImageIcon,
    },
    {
      id: 'office' as AppTab,
      label: 'Office',
      icon: FileSpreadsheet,
    },
    {
      id: 'tools' as AppTab,
      label: 'Araçlar',
      icon: Layers,
    },
    {
      id: 'history' as AppTab,
      label: 'Geçmiş',
      icon: History,
      badge: historyCount > 0 ? historyCount : undefined,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 py-1.5 pb-safe shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-4 items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all active:scale-95 cursor-pointer min-h-[48px] ${
                isActive
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
