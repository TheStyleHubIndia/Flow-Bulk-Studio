import React, { useState } from 'react';
import { useStoryboardStore } from './hooks/useStoryboardStore';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { SceneManagerView } from './components/SceneManagerView';
import { ImageQueueView } from './components/ImageQueueView';
import { VideoQueueView } from './components/VideoQueueView';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { FlowAssistantModal } from './components/FlowAssistantModal';
import { ColumnMapperModal } from './components/ColumnMapperModal';
import { SceneEditModal } from './components/SceneEditModal';
import { BulkActionModal } from './components/BulkActionModal';
import { Toast } from './components/Toast';
import { Sparkles, Play } from 'lucide-react';

export default function App() {
  const store = useStoryboardStore();
  const [isBulkQueueOpen, setIsBulkQueueOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Toast Notifications */}
      <Toast toast={store.toast} onClose={() => store.setToast(null)} />

      {/* Main Top Header */}
      <Navbar store={store} />

      {/* Main Screen Content View */}
      <main className="flex-1 px-3 sm:px-6 py-4 max-w-7xl w-full mx-auto">
        {store.activeTab === 'dashboard' && <DashboardView store={store} />}
        {store.activeTab === 'scenes' && <SceneManagerView store={store} />}
        {store.activeTab === 'images' && <ImageQueueView store={store} />}
        {store.activeTab === 'videos' && <VideoQueueView store={store} />}
        {store.activeTab === 'export' && <ExportModal store={store} />}
        {store.activeTab === 'settings' && <SettingsModal store={store} />}
      </main>

      {/* Floating Action Buttons for Flow Assistant / Queue Runner */}
      <div className="fixed bottom-20 right-3 sm:right-6 z-20 flex flex-col items-end gap-2 pointer-events-none">
        <button
          onClick={() => setIsBulkQueueOpen(true)}
          className="pointer-events-auto flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 shadow-xl backdrop-blur-md text-xs font-bold transition-all active:scale-95"
          aria-label="Launch Queue Runner"
          title="Interactive Queue Runner"
        >
          <Play className="w-3.5 h-3.5 fill-amber-400" />
          <span className="hidden sm:inline">Runner</span>
        </button>

        <button
          onClick={() => store.setIsAssistantOpen(true)}
          className="pointer-events-auto flex items-center justify-center gap-2 p-2.5 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-xl shadow-amber-500/25 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 border border-amber-300/40"
          aria-label="Open Flow Assistant"
        >
          <Sparkles className="w-4 h-4 fill-zinc-950" />
          <span className="hidden sm:inline">Assistant</span>
        </button>
      </div>

      {/* Modals and Overlays */}
      <FlowAssistantModal store={store} />
      <ColumnMapperModal store={store} />
      <SceneEditModal store={store} />
      <BulkActionModal store={store} isOpen={isBulkQueueOpen} onClose={() => setIsBulkQueueOpen(false)} />

      {/* Android Chrome Bottom Navigation Bar */}
      <BottomNav store={store} />
    </div>
  );
}
