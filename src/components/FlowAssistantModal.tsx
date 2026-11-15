import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  Copy,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  HelpCircle,
  Film,
  Image as ImageIcon,
  Video,
  Check,
  RefreshCw
} from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';

export const FlowAssistantModal: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const {
    project,
    settings,
    activeScene,
    isAssistantOpen,
    setIsAssistantOpen,
    nextAssistantScene,
    prevAssistantScene,
    updateScene,
    copyText,
    showToast
  } = store;

  const [copiedType, setCopiedType] = useState<'image' | 'video' | null>(null);
  const [activeTab, setActiveTab] = useState<'both' | 'image' | 'video'>('both');
  const [failureNote, setFailureNote] = useState('');
  const [showFailureInput, setShowFailureInput] = useState(false);

  if (!isAssistantOpen || !activeScene) return null;

  const currentIndex = project.scenes.findIndex(s => s.id === activeScene.id);
  const total = project.scenes.length;
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= total - 1;

  const handleCopy = async (type: 'image' | 'video') => {
    const text = type === 'image' ? activeScene.imagePrompt : activeScene.videoPrompt;
    if (!text) {
      showToast(`No ${type} prompt in this scene.`, 'warning');
      return;
    }
    const success = await copyText(text, `Scene ${activeScene.sceneNumber} ${type === 'image' ? 'Image' : 'Video'} Prompt`);
    if (success) {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const handleMarkCompleted = () => {
    updateScene(activeScene.id, {
      imageStatus: activeScene.imagePrompt ? 'completed' : activeScene.imageStatus,
      videoStatus: activeScene.videoPrompt ? 'completed' : activeScene.videoStatus
    });
    showToast(`Scene ${activeScene.sceneNumber} marked as Completed!`, 'success');

    if (settings.autoAdvanceOnComplete && !isLast) {
      nextAssistantScene();
    }
  };

  const handleMarkFailed = () => {
    updateScene(activeScene.id, {
      imageStatus: activeScene.imagePrompt ? 'failed' : activeScene.imageStatus,
      videoStatus: activeScene.videoPrompt ? 'failed' : activeScene.videoStatus,
      failureReason: failureNote.trim() || 'Generation rejected / failed in Flow'
    });
    showToast(`Scene ${activeScene.sceneNumber} marked as Failed.`, 'error');
    setShowFailureInput(false);
    setFailureNote('');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="flow-assistant-title"
    >
      <div className="bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-950/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Sparkles className="w-4 h-4 fill-zinc-950" />
            </div>
            <div className="min-w-0">
              <h2 id="flow-assistant-title" className="text-sm sm:text-base font-extrabold text-white truncate flex items-center gap-2">
                <span>Google Flow Assistant</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {currentIndex + 1} of {total}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400 truncate">
                Scene #{activeScene.sceneNumber}: {activeScene.sceneTitle || 'Untitled'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Official Flow Web Link */}
            <a
              href={settings.defaultFlowUrl || 'https://labs.google/flow'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-semibold transition active:scale-95 shadow-sm"
              title="Open Google Flow website in new tab"
            >
              <span>Open Flow</span>
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            </a>

            <button
              onClick={() => setIsAssistantOpen(false)}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition active:scale-95"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stepper Navigation */}
        <div className="bg-zinc-950/40 px-4 py-2 border-b border-zinc-800/80 flex items-center justify-between text-xs">
          <button
            onClick={prevAssistantScene}
            disabled={isFirst}
            className="flex items-center gap-1 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none px-2 py-1 rounded hover:bg-zinc-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Scene</span>
          </button>

          <span className="font-mono text-zinc-400 text-[11px]">
            {activeScene.startTime ? `${activeScene.startTime} - ${activeScene.endTime || ''}` : 'Timecode not set'}
          </span>

          <button
            onClick={nextAssistantScene}
            disabled={isLast}
            className="flex items-center gap-1 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none px-2 py-1 rounded hover:bg-zinc-800 transition"
          >
            <span>Next Scene</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Transparency Disclaimer Notice (Requirement 7) */}
          <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Copy prompts here and paste into Google Flow. We do not submit directly or consume generation credits without your direct interaction.
            </p>
          </div>

          {/* Narration script context */}
          {activeScene.narration && (
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block mb-1">
                Audio Script / Voiceover
              </span>
              <p className="text-xs text-zinc-300 italic font-sans leading-relaxed">
                "{activeScene.narration}"
              </p>
            </div>
          )}

          {/* Image Prompt Card */}
          <div className="rounded-xl bg-zinc-950/80 border border-amber-500/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image Prompt</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
                activeScene.imageStatus === 'completed'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {activeScene.imageStatus}
              </span>
            </div>

            <p className="text-xs font-mono text-zinc-200 select-all leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-850">
              {activeScene.imagePrompt || <span className="text-zinc-500 italic">No image prompt specified</span>}
            </p>

            <button
              onClick={() => handleCopy('image')}
              disabled={!activeScene.imagePrompt}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-sm ${
                copiedType === 'image'
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
              }`}
            >
              {copiedType === 'image' ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Copied Image Prompt!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Image Prompt</span>
                </>
              )}
            </button>
          </div>

          {/* Video Prompt Card */}
          <div className="rounded-xl bg-zinc-950/80 border border-cyan-500/20 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wide">
                <Video className="w-3.5 h-3.5" />
                <span>Video Motion Prompt</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase ${
                activeScene.videoStatus === 'completed'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {activeScene.videoStatus}
              </span>
            </div>

            <p className="text-xs font-mono text-zinc-200 select-all leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-850">
              {activeScene.videoPrompt || <span className="text-zinc-500 italic">No video prompt specified</span>}
            </p>

            <button
              onClick={() => handleCopy('video')}
              disabled={!activeScene.videoPrompt}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-sm ${
                copiedType === 'video'
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-zinc-950'
              }`}
            >
              {copiedType === 'video' ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Copied Video Prompt!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Video Prompt</span>
                </>
              )}
            </button>
          </div>

          {/* Suggested Use */}
          {activeScene.suggestedUse && (
            <div className="text-[11px] text-zinc-400 font-mono bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-850">
              Suggested Specs: <span className="text-zinc-200">{activeScene.suggestedUse}</span>
            </div>
          )}

          {/* Failure Feedback Area */}
          {showFailureInput && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 space-y-2">
              <label className="text-xs font-semibold text-red-300 block">
                Reason for generation failure in Flow:
              </label>
              <input
                type="text"
                value={failureNote}
                onChange={(e) => setFailureNote(e.target.value)}
                placeholder="e.g. Safety filter trigger, Artifact glitch, Prompt timeout"
                className="w-full bg-zinc-900 border border-red-700/60 rounded-lg p-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowFailureInput(false)}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkFailed}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Failed
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Completion Controls */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/95 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFailureInput(prev => !prev)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-red-400 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 transition active:scale-95"
            >
              Report Issue
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <button
              onClick={handleMarkCompleted}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Mark Completed & Next</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
