import React, { useMemo, useState } from 'react';
import { ClipboardPaste, X, Image as ImageIcon, Film, AlertCircle } from 'lucide-react';
import { StoryboardScene, ColumnMapping } from '../types/storyboard';

interface PastePromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (scenes: StoryboardScene[]) => void;
}

const splitPrompts = (value: string): string[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  // Prefer explicit scene labels when present (Scene 001:, Scene 1 - ...).
  const labelled = trimmed.split(/(?=^\s*(?:scene\s*)?\d{1,3}\s*[:.)-]\s*)/im)
    .map(part => part.trim())
    .filter(Boolean);

  const blocks = labelled.length > 1
    ? labelled
    : trimmed.split(/\n\s*\n+/).map(part => part.trim()).filter(Boolean);

  return blocks.map((block, index) =>
    block.replace(/^\s*(?:scene\s*)?\d{1,3}\s*[:.)-]\s*/i, '').trim()
  ).filter(Boolean);
};

export const PastePromptsModal: React.FC<PastePromptsModalProps> = ({ isOpen, onClose, onImport }) => {
  const [imageText, setImageText] = useState('');
  const [videoText, setVideoText] = useState('');

  const imagePrompts = useMemo(() => splitPrompts(imageText), [imageText]);
  const videoPrompts = useMemo(() => splitPrompts(videoText), [videoText]);

  if (!isOpen) return null;

  const handleImport = () => {
    if (imagePrompts.length === 0) return;
    if (imagePrompts.length > 75 || videoPrompts.length > 75) return;
    if (videoPrompts.length > 0 && videoPrompts.length !== imagePrompts.length) return;

    const now = new Date().toISOString();
    const scenes: StoryboardScene[] = imagePrompts.map((prompt, index) => {
      const number = String(index + 1).padStart(3, '0');
      return {
        id: `scene_paste_${Date.now()}_${index}`,
        sceneNumber: number,
        sceneTitle: `Scene ${number}`,
        startTime: '',
        endTime: '',
        narration: '',
        imagePrompt: prompt,
        videoPrompt: videoPrompts[index] || '',
        suggestedUse: '16:9 Widescreen',
        imageStatus: 'ready',
        videoStatus: videoPrompts[index] ? 'ready' : 'pending',
        lastUpdated: now
      };
    });

    onImport(scenes);
    setImageText('');
    setVideoText('');
    onClose();
  };

  const videoCountMismatch = videoPrompts.length > 0 && videoPrompts.length !== imagePrompts.length;
  const tooMany = imagePrompts.length > 75 || videoPrompts.length > 75;

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-2xl max-h-[94vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-amber-400" /> Paste up to 75 prompts
            </h2>
            <p className="text-[11px] text-zinc-400 mt-1">One prompt per blank-line-separated block. Scene numbers are assigned automatically.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-amber-400" /> Image prompts (required)</label>
              <span className={`text-[11px] font-mono ${imagePrompts.length > 75 ? 'text-red-400' : 'text-zinc-400'}`}>{imagePrompts.length}/75</span>
            </div>
            <textarea value={imageText} onChange={e => setImageText(e.target.value)} rows={8}
              placeholder={'Scene 001: Cinematic 16:9 image prompt...\n\nScene 002: Next image prompt...'}
              className="w-full resize-y rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-xs leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500" />
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200 flex items-center gap-2"><Film className="w-4 h-4 text-cyan-400" /> Video prompts (optional)</label>
              <span className="text-[11px] font-mono text-zinc-400">{videoPrompts.length}/75</span>
            </div>
            <textarea value={videoText} onChange={e => setVideoText(e.target.value)} rows={5}
              placeholder={'Optional: paste matching video prompts in the same order...'}
              className="w-full resize-y rounded-xl bg-zinc-900 border border-zinc-700 p-3 text-xs leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500" />
          </section>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-[11px] text-zinc-400 space-y-1">
            <p>• Imported scenes receive IDs Scene 001–075 and a 16:9 Widescreen setting.</p>
            <p>• This replaces the currently loaded storyboard in this browser. Existing saved data is not deleted from GitHub.</p>
            <p>• This creates a prompt queue; it does not submit prompts to Google Flow automatically.</p>
          </div>

          {(tooMany || videoCountMismatch) && (
            <p className="text-xs text-red-400 flex items-center gap-2"><AlertCircle className="w-4 h-4" />
              {tooMany ? 'Maximum 75 prompts allowed in each field.' : 'Video prompt count must match the image prompt count, or leave video prompts empty.'}
            </p>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold">Cancel</button>
            <button onClick={handleImport} disabled={imagePrompts.length === 0 || tooMany || videoCountMismatch}
              className="flex-1 py-3 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed">
              Import {imagePrompts.length} Scenes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
