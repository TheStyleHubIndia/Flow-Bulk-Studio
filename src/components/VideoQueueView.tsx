import React, { useState } from 'react';
import {
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Video,
  CheckSquare,
  Square,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';
import { exportPromptsAsText } from '../utils/exporter';
import { SceneStatus } from '../types/storyboard';

export const VideoQueueView: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const {
    project,
    updateScene,
    openAssistantForScene,
    copyText,
    selectedSceneIds,
    toggleSelectScene,
    selectAllScenes,
    deselectAllScenes,
    batchUpdateStatus,
    showToast
  } = store;

  const [filter, setFilter] = useState<'all' | 'ready' | 'completed' | 'failed' | 'pending'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCopyAllModal, setShowCopyAllModal] = useState(false);
  const [delimiterFormat, setDelimiterFormat] = useState<'numbered' | 'newline' | 'markdown'>('numbered');

  const videoScenes = project.scenes.filter(s => s.videoPrompt && s.videoPrompt.trim().length > 0);

  const filteredScenes = videoScenes.filter(s => {
    if (filter === 'all') return true;
    return s.videoStatus === filter;
  });

  const handleCopyPrompt = async (id: string, promptText: string, sceneNumber: string) => {
    const success = await copyText(promptText, `Scene ${sceneNumber} Video Motion Prompt`);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    const text = exportPromptsAsText(project.scenes, 'video', delimiterFormat);
    await copyText(text, `All ${filteredScenes.length} Video Prompts`);
    setShowCopyAllModal(false);
  };

  const handleStatusChange = (sceneId: string, newStatus: SceneStatus) => {
    updateScene(sceneId, {
      videoStatus: newStatus,
      failureReason: newStatus === 'failed' ? 'Video generation error' : undefined
    });
    showToast(`Video prompt marked as ${newStatus}.`, 'info');
  };

  const hasSelected = selectedSceneIds.size > 0;

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto">
      {/* Header Bar */}
      <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Video Generation Queue</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-semibold border border-cyan-500/20">
              {filteredScenes.length} prompts
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Stage motion prompts and camera directions for Google Flow Video mode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCopyAllModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Copy className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Copy All Prompts</span>
          </button>
        </div>
      </div>

      {/* Filter and Selection Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'ready', 'pending', 'completed', 'failed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition ${
                filter === tab
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Batch Selection for Video Generation */}
        <div className="flex items-center gap-2 text-xs bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800 shrink-0">
          <button
            onClick={hasSelected ? deselectAllScenes : selectAllScenes}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white font-medium"
          >
            {hasSelected ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4 text-zinc-500" />
            )}
            <span>{hasSelected ? `${selectedSceneIds.size} Selected` : 'Select Scenes for Batch'}</span>
          </button>

          {hasSelected && (
            <button
              onClick={() => batchUpdateStatus('video', 'completed')}
              className="ml-2 px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40 hover:bg-cyan-900 font-semibold text-[11px]"
            >
              Mark Done
            </button>
          )}
        </div>
      </div>

      {/* Video Cards */}
      <div className="space-y-3">
        {filteredScenes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-zinc-900/30 rounded-xl border border-zinc-800">
            <Video className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-300">No video prompts found</p>
            <p className="text-xs text-zinc-500 mt-1">Make sure storyboard rows contain Video/Motion prompts.</p>
          </div>
        ) : (
          filteredScenes.map((scene, idx) => {
            const isCopied = copiedId === scene.id;
            const isCompleted = scene.videoStatus === 'completed';
            const isFailed = scene.videoStatus === 'failed';
            const isSelected = selectedSceneIds.has(scene.id);

            return (
              <div
                key={scene.id}
                className={`rounded-xl border p-4 transition-all ${
                  isSelected
                    ? 'border-cyan-500/60 bg-zinc-900/90 shadow-md shadow-cyan-500/5'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : isFailed
                    ? 'bg-red-950/20 border-red-800/40'
                    : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {/* Scene Meta */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => toggleSelectScene(scene.id)}
                      className="p-1 -ml-1 text-zinc-400 hover:text-cyan-400"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-600" />
                      )}
                    </button>

                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-zinc-700">
                      Scene #{scene.sceneNumber}
                    </span>
                    <h3 className="text-sm font-bold text-white truncate max-w-[150px] sm:max-w-md">
                      {scene.sceneTitle || 'Untitled Scene'}
                    </h3>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={scene.videoStatus}
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
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>

                    <button
                      onClick={() => openAssistantForScene(scene.id)}
                      className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition active:scale-95"
                      title="Open in Flow Assistant"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prompt Box */}
                <div className="relative mt-2 rounded-lg bg-zinc-950 p-3 border border-zinc-800 font-mono text-xs text-zinc-200 leading-relaxed group">
                  <div className="flex items-center gap-2 mb-1 text-[10px] text-cyan-400 font-sans uppercase font-bold tracking-wider">
                    <Video className="w-3 h-3" />
                    <span>Camera Motion & Dynamics</span>
                  </div>
                  <p className="select-all pr-12 break-words">{scene.videoPrompt}</p>

                  <button
                    onClick={() => handleCopyPrompt(scene.id, scene.videoPrompt, scene.sceneNumber)}
                    className={`absolute top-2 right-2 p-2 rounded-lg transition active:scale-90 ${
                      isCopied
                        ? 'bg-cyan-500 text-zinc-950'
                        : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700'
                    }`}
                    title="Copy Video Prompt"
                  >
                    {isCopied ? (
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Paired Image Context Preview */}
                {scene.imagePrompt && (
                  <div className="mt-2 text-[11px] text-zinc-400 bg-zinc-950/40 p-2 rounded border border-zinc-850 truncate">
                    <span className="text-amber-400 font-medium">Image Reference: </span>
                    <span>{scene.imagePrompt}</span>
                  </div>
                )}

                {/* Failure Note */}
                {isFailed && (
                  <div className="mt-2 text-xs text-red-300 bg-red-950/50 p-2 rounded border border-red-800/40 flex items-center justify-between">
                    <span>Failure tracked: {scene.failureReason || 'Video error'}</span>
                    <button
                      onClick={() => handleStatusChange(scene.id, 'ready')}
                      className="underline hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                )}
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
              <Copy className="w-4 h-4 text-cyan-400" />
              <span>Copy All Video Prompts</span>
            </h3>

            <p className="text-xs text-zinc-400">
              Select formatting style to copy all {filteredScenes.length} video motion prompts:
            </p>

            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  delimiterFormat === 'numbered'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-300'
                }`}
              >
                <input
                  type="radio"
                  name="v-delimiter"
                  checked={delimiterFormat === 'numbered'}
                  onChange={() => setDelimiterFormat('numbered')}
                  className="mt-0.5 text-cyan-500"
                />
                <div>
                  <span className="text-xs font-bold block">Numbered by Scene</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    [Scene 01] Slow forward camera push-in...
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  delimiterFormat === 'newline'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-300'
                }`}
              >
                <input
                  type="radio"
                  name="v-delimiter"
                  checked={delimiterFormat === 'newline'}
                  onChange={() => setDelimiterFormat('newline')}
                  className="mt-0.5 text-cyan-500"
                />
                <div>
                  <span className="text-xs font-bold block">Plain Line-by-Line</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    Slow forward camera push-in...
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  delimiterFormat === 'markdown'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-300'
                }`}
              >
                <input
                  type="radio"
                  name="v-delimiter"
                  checked={delimiterFormat === 'markdown'}
                  onChange={() => setDelimiterFormat('markdown')}
                  className="mt-0.5 text-cyan-500"
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
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold transition shadow"
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
