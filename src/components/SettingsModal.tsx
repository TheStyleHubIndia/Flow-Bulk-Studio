import React from 'react';
import {
  Settings as SettingsIcon,
  RotateCcw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Sliders,
  Check
} from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';

export const SettingsModal: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const { settings, setSettings, resetToDemo, showToast } = store;

  const handleUpdate = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    showToast('Settings saved.', 'info');
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all stored storyboard data? This will reset the app back to the initial demo state.')) {
      try {
        localStorage.clear();
      } catch (_) {}
      resetToDemo();
      showToast('All local storage data cleared.', 'info');
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-amber-400" />
          <span>Studio Settings & Preferences</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Customize navigation behavior, Google Flow URLs, tactile feedback, and queue execution defaults.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Google Flow Integration Settings */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <ExternalLink className="w-4 h-4 text-amber-400" />
            <span>Google Flow Link Endpoint</span>
          </div>
          <p className="text-xs text-zinc-400">
            Target URL opened when launching Google Flow from the app header or Assistant panel:
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={settings.defaultFlowUrl}
              onChange={(e) => handleUpdate('defaultFlowUrl', e.target.value)}
              placeholder="https://labs.google/flow"
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
            />
            <button
              onClick={() => handleUpdate('defaultFlowUrl', 'https://labs.google/flow')}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold whitespace-nowrap"
            >
              Reset to Default
            </button>
          </div>
        </div>

        {/* Mobile Tactile & Workflow Controls */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Mobile-First Android Chrome Options</span>
          </div>

          <div className="space-y-3">
            {/* Auto Advance */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-zinc-200 block">
                  Auto-Advance in Assistant
                </span>
                <span className="text-[11px] text-zinc-400">
                  Automatically jump to next scene when tapping "Mark Completed"
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoAdvanceOnComplete}
                onChange={(e) => handleUpdate('autoAdvanceOnComplete', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700 focus:ring-amber-500"
              />
            </label>

            {/* Haptic Vibrations */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-zinc-200 block">
                  Tactile Haptic Feedback
                </span>
                <span className="text-[11px] text-zinc-400">
                  Trigger slight vibration on copy and button presses on Android devices
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.enableHaptics}
                onChange={(e) => handleUpdate('enableHaptics', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-zinc-800 border-zinc-700 focus:ring-amber-500"
              />
            </label>
          </div>
        </div>

        {/* Policy & Safety Transparency */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Safety & Google Flow Integration Guidelines</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Flow Bulk Studio is completely client-side. It stages storyboard prompts from Excel (.xlsx) and CSV files up to 75 scenes. It never bypasses Google Flow terms, never sends unauthenticated requests to internal Google APIs, and never automatically drains your generation credits.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-950/20 border border-red-900/40 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-red-400">
            Storage & Project Reset
          </h3>
          <p className="text-xs text-zinc-400">
            Reset current storyboard back to the sample demo scenes or wipe all local storage cache.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={resetToDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reload 3-Scene Demo</span>
            </button>

            <button
              onClick={handleClearAllData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-950/70 hover:bg-red-900/80 text-red-300 text-xs font-semibold border border-red-800/50 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Local Storage</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
