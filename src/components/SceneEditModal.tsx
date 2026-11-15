import React, { useState, useEffect } from 'react';
import { X, Check, Edit3, Image as ImageIcon, Video, Clock, FileText } from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';
import { StoryboardScene, SceneStatus } from '../types/storyboard';

export const SceneEditModal: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const { editingScene, setEditingScene, updateScene, showToast } = store;

  const [form, setForm] = useState<StoryboardScene | null>(null);

  useEffect(() => {
    if (editingScene) {
      setForm({ ...editingScene });
    } else {
      setForm(null);
    }
  }, [editingScene]);

  if (!editingScene || !form) return null;

  const handleChange = (field: keyof StoryboardScene, value: any) => {
    setForm(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = () => {
    if (!form) return;
    updateScene(form.id, form);
    setEditingScene(null);
    showToast(`Scene ${form.sceneNumber} updated.`, 'success');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-scene-title"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="edit-scene-title" className="text-sm sm:text-base font-bold text-white">
                Edit Scene #{form.sceneNumber}
              </h2>
              <p className="text-xs text-zinc-400">
                Modify prompts, audio script, timecodes and status.
              </p>
            </div>
          </div>

          <button
            onClick={() => setEditingScene(null)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Row 1: Scene Number and Title */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Scene Number *
              </label>
              <input
                type="text"
                value={form.sceneNumber}
                onChange={(e) => handleChange('sceneNumber', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Scene Title
              </label>
              <input
                type="text"
                value={form.sceneTitle}
                onChange={(e) => handleChange('sceneTitle', e.target.value)}
                placeholder="e.g. Neon Dawn Over Neo-Tokyo"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Row 2: Timecodes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>Start Time / In Point</span>
              </label>
              <input
                type="text"
                value={form.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                placeholder="00:00:00"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>End Time / Out Point</span>
              </label>
              <input
                type="text"
                value={form.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                placeholder="00:00:04"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Narration */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-zinc-500" />
              <span>Narration / Voiceover Script</span>
            </label>
            <textarea
              rows={2}
              value={form.narration}
              onChange={(e) => handleChange('narration', e.target.value)}
              placeholder="Script or voiceover lines corresponding to this scene..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Image Prompt */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <div className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image Prompt (Flow Image)</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                {form.imagePrompt.length} chars
              </span>
            </div>
            <textarea
              rows={3}
              value={form.imagePrompt}
              onChange={(e) => handleChange('imagePrompt', e.target.value)}
              placeholder="Cinematic wide shot of..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-400"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Status:</span>
              <select
                value={form.imageStatus}
                onChange={(e) => handleChange('imageStatus', e.target.value as SceneStatus)}
                className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white"
              >
                <option value="pending">Pending</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Video Prompt */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
              <div className="flex items-center gap-1">
                <Video className="w-3.5 h-3.5" />
                <span>Video Prompt (Flow Motion)</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono">
                {form.videoPrompt.length} chars
              </span>
            </div>
            <textarea
              rows={3}
              value={form.videoPrompt}
              onChange={(e) => handleChange('videoPrompt', e.target.value)}
              placeholder="Camera slowly pushes in..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-400"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Status:</span>
              <select
                value={form.videoStatus}
                onChange={(e) => handleChange('videoStatus', e.target.value as SceneStatus)}
                className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-white"
              >
                <option value="pending">Pending</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Suggested Use / Aspect Ratio */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Suggested Use / Format
            </label>
            <input
              type="text"
              value={form.suggestedUse}
              onChange={(e) => handleChange('suggestedUse', e.target.value)}
              placeholder="16:9 Cinematic, Establishing shot, Macro detail"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Failure Notes */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">
              Internal Notes / Failure Reason
            </label>
            <input
              type="text"
              value={form.failureReason || ''}
              onChange={(e) => handleChange('failureReason', e.target.value)}
              placeholder="e.g. Needs higher contrast, re-run with different seed"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-end gap-2">
          <button
            onClick={() => setEditingScene(null)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5 shadow"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Save Scene</span>
          </button>
        </div>
      </div>
    </div>
  );
};
