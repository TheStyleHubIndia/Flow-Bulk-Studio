import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Layers,
  CheckSquare,
  Square,
  FileSpreadsheet
} from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';
import { SceneStatus, StoryboardScene } from '../types/storyboard';

export const SceneManagerView: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const {
    project,
    validation,
    selectedSceneIds,
    toggleSelectScene,
    selectAllScenes,
    deselectAllScenes,
    invertSelection,
    batchUpdateStatus,
    batchDelete,
    addScene,
    deleteScene,
    setEditingScene,
    openAssistantForScene,
    copyText,
    setIsColumnMapperOpen,
    rawHeaders
  } = store;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'warnings' | 'completed' | 'pending' | 'failed'>('all');
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Filter scenes
  const filteredScenes = useMemo(() => {
    return project.scenes.filter((scene) => {
      // Status filtering
      if (statusFilter === 'completed') {
        if (scene.imageStatus !== 'completed' && scene.videoStatus !== 'completed') return false;
      } else if (statusFilter === 'pending') {
        if (scene.imageStatus !== 'pending' && scene.videoStatus !== 'pending') return false;
      } else if (statusFilter === 'failed') {
        if (scene.imageStatus !== 'failed' && scene.videoStatus !== 'failed') return false;
      } else if (statusFilter === 'warnings') {
        const isMissingImg = !scene.imagePrompt || scene.imagePrompt.trim().length === 0;
        const isMissingVid = !scene.videoPrompt || scene.videoPrompt.trim().length === 0;
        const isDup = validation.duplicateScenes.includes(scene.sceneNumber);
        if (!isMissingImg && !isMissingVid && !isDup) return false;
      }

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        scene.sceneNumber.toLowerCase().includes(q) ||
        scene.sceneTitle.toLowerCase().includes(q) ||
        scene.narration.toLowerCase().includes(q) ||
        scene.imagePrompt.toLowerCase().includes(q) ||
        scene.videoPrompt.toLowerCase().includes(q) ||
        scene.suggestedUse.toLowerCase().includes(q)
      );
    });
  }, [project.scenes, statusFilter, searchQuery, validation]);

  const hasSelected = selectedSceneIds.size > 0;

  return (
    <div className="space-y-4 pb-24 max-w-5xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Scene Manager</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 font-mono font-medium border border-zinc-700">
              {filteredScenes.length} / {project.scenes.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Edit scene details, inspect validation alerts, and select scenes for bulk actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {rawHeaders.length > 0 && (
            <button
              onClick={() => setIsColumnMapperOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
              title="Change Column Mappings"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Mapping</span>
            </button>
          )}

          <button
            onClick={addScene}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Scene</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scene number, title, narration, prompts..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['all', 'warnings', 'completed', 'pending', 'failed'] as const).map(tab => {
            const isActive = statusFilter === tab;
            return (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition capitalize ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {tab === 'warnings' ? (
                  <span className="flex items-center gap-1">
                    <span>Warnings</span>
                    {(validation.duplicateScenes.length > 0 || validation.missingImagePrompts.length > 0 || validation.missingVideoPrompts.length > 0) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </span>
                ) : (
                  tab
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bulk Selection Action Bar (Requirement 9) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-2 rounded-xl text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={hasSelected ? deselectAllScenes : selectAllScenes}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white font-medium"
          >
            {hasSelected ? (
              <CheckSquare className="w-4 h-4 text-amber-400" />
            ) : (
              <Square className="w-4 h-4 text-zinc-500" />
            )}
            <span>
              {hasSelected ? `${selectedSceneIds.size} Selected` : 'Select All'}
            </span>
          </button>

          {hasSelected && (
            <button
              onClick={invertSelection}
              className="text-zinc-500 hover:text-zinc-300 underline text-[11px]"
            >
              Invert
            </button>
          )}
        </div>

        {hasSelected && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => batchUpdateStatus('both', 'completed')}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/80 font-medium active:scale-95 transition"
            >
              Mark Completed
            </button>
            <button
              onClick={() => batchUpdateStatus('both', 'pending')}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-750 font-medium active:scale-95 transition"
            >
              Mark Pending
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete ${selectedSceneIds.size} selected scenes?`)) {
                  batchDelete();
                }
              }}
              className="px-2 py-1 rounded-lg bg-red-950/60 text-red-300 border border-red-800/40 hover:bg-red-900/80 font-medium active:scale-95 transition"
              title="Delete Selected"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Scene List Cards */}
      <div className="space-y-3">
        {filteredScenes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/80">
            <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-zinc-300">No scenes match your filter</p>
            <p className="text-xs text-zinc-500 mt-1">Try resetting filters or adding a new scene.</p>
          </div>
        ) : (
          filteredScenes.map((scene, idx) => {
            const isSelected = selectedSceneIds.has(scene.id);
            const isMissingImg = !scene.imagePrompt || scene.imagePrompt.trim().length === 0;
            const isMissingVid = !scene.videoPrompt || scene.videoPrompt.trim().length === 0;
            const isDup = validation.duplicateScenes.includes(scene.sceneNumber);

            return (
              <div
                key={scene.id}
                className={`relative rounded-xl border transition-all p-3.5 sm:p-4 ${
                  isSelected
                    ? 'bg-zinc-900/90 border-amber-500/50 shadow-md shadow-amber-500/5'
                    : 'bg-zinc-900/50 hover:bg-zinc-900/80 border-zinc-800/90'
                }`}
              >
                {/* Scene Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => toggleSelectScene(scene.id)}
                      className="p-1 -ml-1 text-zinc-400 hover:text-amber-400"
                      aria-label={`Select scene ${scene.sceneNumber}`}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-600" />
                      )}
                    </button>

                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700 shrink-0">
                      #{scene.sceneNumber || `Row ${idx + 1}`}
                    </span>

                    <h3 className="text-sm font-bold text-white truncate">
                      {scene.sceneTitle || 'Untitled Scene'}
                    </h3>

                    {(scene.startTime || scene.endTime) && (
                      <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                        {scene.startTime || '00:00'} → {scene.endTime || '00:00'}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openAssistantForScene(scene.id)}
                      className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition active:scale-95"
                      title="Open in Flow Assistant"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingScene(scene)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition active:scale-95"
                      title="Edit scene information"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteScene(scene.id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-300 border border-zinc-700 hover:border-red-800/40 transition active:scale-95"
                      title="Delete scene"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Validation Warnings */}
                {(isDup || isMissingImg || isMissingVid) && (
                  <div className="mb-2.5 flex flex-wrap gap-1.5">
                    {isDup && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/50">
                        <AlertCircle className="w-3 h-3" />
                        Duplicate Scene #{scene.sceneNumber}
                      </span>
                    )}
                    {isMissingImg && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/40">
                        No Image Prompt
                      </span>
                    )}
                    {isMissingVid && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/40">
                        No Video Prompt
                      </span>
                    )}
                  </div>
                )}

                {/* Narration Preview if available */}
                {scene.narration && (
                  <p className="text-xs text-zinc-400 italic line-clamp-2 mb-2 bg-zinc-950/40 p-2 rounded-lg border border-zinc-800/50">
                    "{scene.narration}"
                  </p>
                )}

                {/* Prompts Previews */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {/* Image Prompt preview */}
                  <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <span>Image Prompt</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                          scene.imageStatus === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {scene.imageStatus}
                        </span>
                      </span>
                      {scene.imagePrompt && (
                        <button
                          onClick={() => copyText(scene.imagePrompt, `Image Prompt #${scene.sceneNumber}`)}
                          className="text-zinc-500 hover:text-amber-300 flex items-center gap-1"
                          title="Copy Image Prompt"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-zinc-300 line-clamp-2 font-mono text-[11px] leading-relaxed">
                      {scene.imagePrompt || <span className="text-zinc-600 italic">None provided</span>}
                    </p>
                  </div>

                  {/* Video Prompt preview */}
                  <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-cyan-400 font-semibold flex items-center gap-1">
                        <span>Video Motion</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                          scene.videoStatus === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {scene.videoStatus}
                        </span>
                      </span>
                      {scene.videoPrompt && (
                        <button
                          onClick={() => copyText(scene.videoPrompt, `Video Prompt #${scene.sceneNumber}`)}
                          className="text-zinc-500 hover:text-cyan-300 flex items-center gap-1"
                          title="Copy Video Prompt"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-zinc-300 line-clamp-2 font-mono text-[11px] leading-relaxed">
                      {scene.videoPrompt || <span className="text-zinc-600 italic">None provided</span>}
                    </p>
                  </div>
                </div>

                {/* Footer specs */}
                {scene.suggestedUse && (
                  <div className="mt-2 text-[10px] text-zinc-500 font-mono">
                    Use: <span className="text-zinc-400">{scene.suggestedUse}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
