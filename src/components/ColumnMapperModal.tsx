import React, { useState } from 'react';
import { Layers, X, Check, HelpCircle, Table } from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';
import { ColumnMapping } from '../types/storyboard';
import { detectColumnMappings } from '../utils/columnDetector';

export const ColumnMapperModal: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const {
    isColumnMapperOpen,
    setIsColumnMapperOpen,
    project,
    rawHeaders,
    rawRows,
    reapplyColumnMapping
  } = store;

  const [currentMapping, setCurrentMapping] = useState<ColumnMapping>(project.mapping);

  if (!isColumnMapperOpen) return null;

  const handleFieldChange = (field: keyof ColumnMapping, value: string) => {
    setCurrentMapping(prev => ({ ...prev, [field]: value }));
  };

  const handleResetAuto = () => {
    if (rawHeaders.length > 0) {
      const { mapping } = detectColumnMappings(rawHeaders);
      setCurrentMapping(mapping);
    }
  };

  const handleApply = () => {
    reapplyColumnMapping(currentMapping);
  };

  const fields: { key: keyof ColumnMapping; label: string; required: boolean; hint: string }[] = [
    { key: 'sceneNumber', label: 'Scene Number', required: true, hint: 'Scene #, Scene ID, Shot #, Number' },
    { key: 'sceneTitle', label: 'Scene Title', required: false, hint: 'Title, Name, Headline, Slugline' },
    { key: 'startTime', label: 'Start Time', required: false, hint: 'Start TC, Timecode In, From' },
    { key: 'endTime', label: 'End Time', required: false, hint: 'End TC, Timecode Out, Duration, To' },
    { key: 'narration', label: 'Narration / Script', required: false, hint: 'Voiceover, VO, Dialogue, Audio' },
    { key: 'imagePrompt', label: 'Image Prompt', required: true, hint: 'Visual Prompt, Flow Image, Art Prompt' },
    { key: 'videoPrompt', label: 'Video Prompt', required: false, hint: 'Motion Prompt, Camera Direction' },
    { key: 'suggestedUse', label: 'Suggested Use', required: false, hint: 'Aspect Ratio, Notes, Style' },
  ];

  // Options for select
  const headerOptions = ['', ...rawHeaders];

  // Preview first 3 raw rows
  const previewRows = rawRows.slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mapper-modal-title"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 id="mapper-modal-title" className="text-sm sm:text-base font-bold text-white">
                Manual Column Mapping
              </h2>
              <p className="text-xs text-zinc-400">
                Match your spreadsheet columns to Google Flow storyboard fields.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsColumnMapperOpen(false)}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map(({ key, label, required, hint }) => {
              const selectedValue = currentMapping[key] || '';
              const sampleVal = previewRows[0] && selectedValue ? String(previewRows[0][selectedValue] || '') : '';

              return (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-zinc-200 flex items-center gap-1">
                      <span>{label}</span>
                      {required && <span className="text-amber-400">*</span>}
                    </label>
                    <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                      {hint}
                    </span>
                  </div>

                  <select
                    value={selectedValue}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                  >
                    <option value="">-- Do Not Map --</option>
                    {rawHeaders.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>

                  {sampleVal && (
                    <p className="text-[10px] text-zinc-400 font-mono truncate">
                      Sample: <span className="text-zinc-300 font-normal">"{sampleVal}"</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Raw Table Preview */}
          {previewRows.length > 0 && (
            <div className="mt-4 pt-3 border-t border-zinc-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 mb-2">
                <Table className="w-3.5 h-3.5 text-amber-400" />
                <span>Uploaded Spreadsheet Preview (First {previewRows.length} rows)</span>
              </div>
              <div className="overflow-x-auto rounded-lg border border-zinc-800 max-h-36">
                <table className="w-full text-[11px] text-left text-zinc-300 font-mono">
                  <thead className="bg-zinc-800/80 text-zinc-400 uppercase text-[10px] sticky top-0">
                    <tr>
                      {rawHeaders.map(h => (
                        <th key={h} className="p-2 border-b border-zinc-700 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 bg-zinc-950">
                    {previewRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-900/50">
                        {rawHeaders.map(h => (
                          <td key={h} className="p-2 truncate max-w-[150px]">{String(row[h] || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between">
          <button
            onClick={handleResetAuto}
            className="text-xs font-medium text-amber-400 hover:text-amber-300 underline"
          >
            Auto-Detect Columns
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsColumnMapperOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wide transition shadow active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Apply Mappings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
