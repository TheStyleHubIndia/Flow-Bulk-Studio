import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';
import { StoryboardScene } from '../types/storyboard';

interface BulkActionModalProps {
  store: StoryboardStore;
  isOpen: boolean;
  onClose: () => void;
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({ store, isOpen, onClose }) => {
  const {
    project,
    settings,
    selectedSceneIds,
    updateScene,
    copyText,
    showToast
  } = store;

  // Scenes to process
  const targetScenes: StoryboardScene[] = project.scenes.filter(s =>
    selectedSceneIds.size > 0 ? selectedSceneIds.has(s.id) : true
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState<'image' | 'video' | 'both'>('image');
  const [confirmedSteps, setConfirmedSteps] = useState<number>(0);

  if (!isOpen) return null;

  const currentScene: StoryboardScene | undefined = targetScenes[currentIndex];

  const handleNextStep = () => {
    if (!currentScene) return;

    // Mark current scene completed
    updateScene(currentScene.id, {
      imageStatus: mode === 'image' || mode === 'both' ? 'completed' : currentScene.imageStatus,
      videoStatus: mode === 'video' || mode === 'both' ? 'completed' : currentScene.videoStatus
    });

    setConfirmedSteps(prev => prev + 1);

    if (currentIndex < targetScenes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
      showToast(`Finished queue pass over ${targetScenes.length} scenes!`, 'success');
    }
  };

  const handleSkipStep = () => {
    if (currentIndex < targetScenes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
    }
  };

  const handleCopyCurrentPrompt = async () => {
    if (!currentScene) return;
    const text = mode === 'image'
      ? currentScene.imagePrompt
      : mode === 'video'
      ? currentScene.videoPrompt
      : `Image: ${currentScene.imagePrompt}\nVideo: ${currentScene.videoPrompt}`;

    await copyText(text, `Scene ${currentScene.sceneNumber} Prompt`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="queue-modal-title"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Play className="w-4 h-4" />
            </div>
            <div>
              <h2 id="queue-modal-title" className="text-sm sm:text-base font-bold text-white">
                Interactive Local Queue Runner
              </h2>
              <p className="text-xs text-zinc-400">
                Controlled step-by-step queue execution for Google Flow.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Safety Disclaimer Banner (Requirement 9) */}
        <div className="p-3 bg-amber-950/30 border-b border-amber-900/30 text-amber-200 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Manual Confirmation Required</span>
            <p className="text-[11px] text-amber-300/80 mt-0.5 leading-snug">
              In accordance with Google Flow policy, generation credits are never automatically spent. You manually confirm each prompt submission.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Queue mode & target */}
          <div className="flex items-center justify-between text-xs bg-zinc-950/60 p-3 rounded-xl border border-zinc-850">
            <span className="text-zinc-400">Queue Target:</span>
            <span className="font-bold text-white font-mono">
              {targetScenes.length} scenes {selectedSceneIds.size > 0 ? '(Selected subset)' : '(Full storyboard)'}
            </span>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2">
            {(['image', 'video', 'both'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                  mode === m
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Current Staged Scene Card */}
          {currentScene ? (
            <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                    Scene #{currentScene.sceneNumber}
                  </span>
                  <span className="text-xs font-bold text-white truncate max-w-[200px]">
                    {currentScene.sceneTitle || 'Untitled'}
                  </span>
                </div>
                <span className="text-xs font-mono text-zinc-400">
                  {currentIndex + 1} / {targetScenes.length}
                </span>
              </div>

              {/* Prompt Text Preview */}
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-200">
                <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">
                  {mode === 'image' ? 'Image Prompt' : mode === 'video' ? 'Video Motion' : 'Current Prompt'}
                </span>
                <p className="line-clamp-4 leading-relaxed">
                  {mode === 'image'
                    ? currentScene.imagePrompt || '(No Image Prompt)'
                    : mode === 'video'
                    ? currentScene.videoPrompt || '(No Video Prompt)'
                    : `Image: ${currentScene.imagePrompt}\n\nVideo: ${currentScene.videoPrompt}`}
                </p>
              </div>

              {/* Action Buttons for this scene */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleCopyCurrentPrompt}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-zinc-700"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy Prompt</span>
                </button>

                <a
                  href={settings.defaultFlowUrl || 'https://labs.google/flow'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-zinc-700"
                >
                  <span>Flow Tab</span>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-400 text-xs">
              No scenes to process.
            </div>
          )}

          {/* Progress Indicator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>Step Progress</span>
              <span>{confirmedSteps} confirmed / {targetScenes.length} total</span>
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(confirmedSteps / (targetScenes.length || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer Navigation & Manual Confirmation */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-between gap-2">
          <button
            onClick={handleSkipStep}
            className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
          >
            Skip Scene
          </button>

          <button
            onClick={handleNextStep}
            disabled={!currentScene}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Confirm & Advance</span>
          </button>
        </div>
      </div>
    </div>
  );
};
