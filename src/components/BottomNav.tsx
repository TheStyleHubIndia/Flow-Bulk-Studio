import React from 'react';
import {
  LayoutDashboard,
  Film,
  Image as ImageIcon,
  Video,
  DownloadCloud,
  Settings as SettingsIcon,
  AlertTriangle
} from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';

interface NavItem {
  id: StoryboardStore['activeTab'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  badgeColor?: string;
}

export const BottomNav: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const { activeTab, setActiveTab, validation, metrics } = store;

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: validation.hasErrors ? '!' : null,
      badgeColor: 'bg-red-500'
    },
    {
      id: 'scenes',
      label: 'Scenes',
      icon: Film,
      badge: validation.hasWarnings ? `${validation.missingImagePrompts.length + validation.missingVideoPrompts.length}` : null,
      badgeColor: 'bg-amber-500'
    },
    {
      id: 'images',
      label: 'Images',
      icon: ImageIcon,
      badge: `${metrics.imagePromptsReady}`,
      badgeColor: 'bg-zinc-700'
    },
    {
      id: 'videos',
      label: 'Videos',
      icon: Video,
      badge: `${metrics.videoPromptsReady}`,
      badgeColor: 'bg-zinc-700'
    },
    {
      id: 'export',
      label: 'Export',
      icon: DownloadCloud,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      badge: null,
      badgeColor: ''
    }
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1"
      aria-label="Main Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-6 gap-0.5">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[52px] select-none active:scale-95 ${
                isActive
                  ? 'text-amber-400 font-semibold bg-amber-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.3]' : 'stroke-[1.8]'}`} />
                {item.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full ${item.badgeColor} text-[9px] font-bold text-white flex items-center justify-center shadow`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight leading-none ${isActive ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
