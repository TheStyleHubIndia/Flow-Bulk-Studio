import React, { useState } from 'react';
import {
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronDown,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';
import { exportPromptsAsText } from '../utils/exporter';
import { SceneStatus } from '../types/storyboard';

export const ImageQueueView: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const {
    project,
    settings,
    updateScene,
    openAssistantForScene,
    copyText,
    batchUpdateStatus,
    showToast
  } = store;

  const [filter, setFilter] = useState<'all' | 'ready' | 'completed' | 'failed'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCopyAllModal, setShowCopyAllModal] = useState(false);
  const [delimiterFormat, setDelimiterFormat] = useState<'numbered' | 'newline' | 'markdown'>('numbered');

  const filteredScenes = project.scenes.filter(s => {
    if (!s.imagePrompt || s.imagePrompt.trim().length === 0) return false;
    if (filter === 'all') return true;
    return s.imageStatus === filter;
  });

  const handleCopyPrompt = async (id: string, promptText: string, sceneNumber: string) => {
    const success = await copyText(promptText, `Scene ${sceneNumber} Image Prompt`);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    const text = exportPromptsAsText(project.scenes, 'image', delimiterFormat);
    await copyText(text, `All ${filteredScenes.length} Image Prompts`);
    setShowCopyAllModal(false);
  };

  const handleStatusChange = (sceneId: string, newStatus: SceneStatus) => {
    updateScene(sceneId, {
      imageStatus: newStatus,
      failureReason: newStatus === 'failed' ? 'Marked failed manually' : undefined
    });
    showToast(`Image prompt marked as ${newStatus}.`, 'info');
  };

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Image Generation Queue</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono font-semibold border border-amber-500/20">
              {filteredScenes.length} prompts
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Stage and copy image prompts for Google Flow Image mode (up to 75 scenes).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCopyAllModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Copy All Prompts</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['all', 'ready', 'completed', 'failed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition ${
              filter === tab
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Prompts Cards */}
      <div className="space-y-3">
        {filteredScenes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-zinc-900/30 rounded-xl border border-zinc-800">
            <p className="text-sm font-semibold text-zinc-300">No image prompts in this filter</p>
            <p className="text-xs text-zinc-500 mt-1">Make sure scenes have an Image Prompt column or text.</p>
          </div>
        ) : (
          filteredScenes.map((scene, idx) => {
            const isCopied = copiedId === scene.id;
            const isCompleted = scene.imageStatus === 'completed';
            const isFailed = scene.imageStatus === 'failed';

            return (
              <div
                key={scene.id}
                className={`rounded-xl border p-4 transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : isFailed
                    ? 'bg-red-950/20 border-red-800/40'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Scene Meta */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                      Scene #{scene.sceneNumber}
                    </span>
                    <h3 className="text-sm font-bold text-white truncate max-w-[180px] sm:max-w-md">
                      {scene.sceneTitle || 'Untitled Scene'}
                    </h3>
                  </div>

                  {/* Status Dropdown / Toggle */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={scene.imageStatus}
                      onChange={(e) => handleStatusChange(scene.id, e.target.value as SceneStatus)}
                      className={`text-xs px-2 py-1 rounded-lg font-medium border bg-zinc-900 focus:outline-none transition ${
                        isCompleted
                          ? 'text-emerald-400 border-emerald-700/60 bg-emerald-950/60'
                          : isFailed
                          ? 'text-red-400 border-red-700/60 bg-red-950/60'
                          : 'text-zinc-300 border-zinc-700'
                      }`}
                    >
                      <option value="ready">Ready</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="pending">Pending</option>
                    </select>

                    <button
                      onClick={() => openAssistantForScene(scene.id)}
                      className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition active:scale-95"
                      title="Open in Flow Assistant"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prompt Text Box */}
                <div className="relative mt-2 rounded-lg bg-zinc-950 p-3 border border-zinc-800 font-mono text-xs text-zinc-200 leading-relaxed group">
                  <p className="select-all pr-12 break-words">{scene.imagePrompt}</p>

                  <button
                    onClick={() => handleCopyPrompt(scene.id, scene.imagePrompt, scene.sceneNumber)}
                    className={`absolute top-2 right-2 p-2 rounded-lg transition active:scale-90 ${
                      isCopied
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700'
                    }`}
                    title="Copy Prompt"
                  >
                    {isCopied ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Failure Note or Extra Info */}
                {isFailed && (
                  <div className="mt-2 text-xs text-red-300 bg-red-950/50 p-2 rounded border border-red-800/40 flex items-center justify-between">
                    <span>Failure tracked: {scene.failureReason || 'Generation issue'}</span>
                    <button
                      onClick={() => handleStatusChange(scene.id, 'ready')}
                      className="underline hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                )}

                {/* Specs */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>{scene.imagePrompt.length} chars</span>
                  {scene.suggestedUse && <span>{scene.suggestedUse}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Copy All Prompts Modal */}
      {showCopyAllModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Copy className="w-4 h-4 text-amber-400" />
              <span>Copy All Image Prompts</span>
            </h3>

            <p className="text-xs text-zinc-400">
              Select formatting style to copy all {filteredScenes.length} image prompts at once:
            </p>

            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  delimiterFormat === 'numbered'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-300'
                }`}
              >
                <input
                  type="radio"
                  name="delimiter"
                  checked={delimiterFormat === 'numbered'}
                  onChange={() => setDelimiterFormat('numbered')}
                  className="mt-0.5 text-amber-500"
                />
                <div>
                  <span className="text-xs font-bold block">Numbered by Scene</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    [Scene 01] Cinematic wide shot...
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  delimiterFormat === 'newline'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-300'
                }`}
              >
                <input
                  type="radio"
                  name="delimiter"
                  checked={delimiterFormat === 'newline'}
                  onChange={() => setDelimiterFormat('newline')}
                  className="mt-0.5 text-amber-500"
                />
                <div>
                  <span className="text-xs font-bold block">Plain Line-by-Line</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Cinematic wide shot...
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  delimiterFormat === 'markdown'
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-300'
                }`}
              >
                <input
                  type="radio"
                  name="delimiter"
                  checked={delimiterFormat === 'markdown'}
                  onChange={() => setDelimiterFormat('markdown')}
                  className="mt-0.5 text-amber-500"
                />
                <div>
                  <span className="text-xs font-bold block">Markdown Headings</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    ### Scene 01...
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCopyAllModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCopyAll}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
