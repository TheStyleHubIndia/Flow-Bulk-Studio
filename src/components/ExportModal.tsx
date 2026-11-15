import React, { useRef } from 'react';
import {
  DownloadCloud,
  FileSpreadsheet,
  FileCode,
  Copy,
  Upload,
  CheckCircle2,
  Share2,
  FileText
} from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';
import {
  exportProjectToJson,
  exportScenesToCsv,
  exportPromptsAsText,
  generateTemplateCsv,
  generateTemplateXlsx,
  downloadFile
} from '../utils/exporter';
import { parseJsonProject } from '../utils/spreadsheetParser';

export const ExportModal: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const { project, loadImportedProject, copyText, showToast } = store;
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleExportCsv = () => {
    const csvData = exportScenesToCsv(project.scenes);
    const fileName = `${project.metadata.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_storyboard.csv`;
    downloadFile(csvData, fileName, 'text/csv');
    showToast(`Exported ${project.scenes.length} scenes to CSV.`, 'success');
  };

  const handleExportJson = () => {
    const jsonData = exportProjectToJson(project);
    const fileName = `${project.metadata.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_project.json`;
    downloadFile(jsonData, fileName, 'application/json');
    showToast('Exported full studio project backup as JSON.', 'success');
  };

  const handleCopyAllPrompts = async (type: 'image' | 'video' | 'both') => {
    const text = exportPromptsAsText(project.scenes, type, 'numbered');
    await copyText(text, `All ${type} prompts`);
  };

  const handleReimportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const loaded = parseJsonProject(content);
      loadImportedProject(
        loaded.scenes,
        loaded.metadata.name || file.name,
        'json',
        loaded.mapping || project.mapping
      );
      showToast(`Re-imported project "${loaded.metadata.name}" successfully!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Invalid JSON file.', 'error');
    } finally {
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <DownloadCloud className="w-5 h-5 text-amber-400" />
          <span>Export & Project Backup</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-xl">
          Save your current storyboard with updated scene statuses, export prompt batches, or backup and restore projects.
        </p>
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CSV Export */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Export Updated Storyboard (CSV)
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Exports all {project.scenes.length} scenes with timecodes, narration, image/video prompts, and generation statuses (Completed, Failed, Pending) back to a CSV table.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs uppercase tracking-wide transition shadow-md shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Download Storyboard CSV</span>
          </button>
        </div>

        {/* JSON Full Backup */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              Export Full Project (JSON Backup)
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Complete project snapshot containing column mappings, scene notes, custom edits, failure reasons, and timestamps. Can be re-imported anytime.
            </p>
          </div>
          <button
            onClick={handleExportJson}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wide transition shadow-md shadow-amber-500/10 active:scale-95 flex items-center justify-center gap-2"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Download Project JSON</span>
          </button>
        </div>
      </div>

      {/* Copy Prompts Quick Action Cards */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Copy className="w-4 h-4 text-cyan-400" />
          <span>Quick Copy Prompts to Clipboard</span>
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Instantly copy batch prompts formatted scene-by-scene for quick pasting.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() => handleCopyAllPrompts('image')}
            className="p-3 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-amber-500/30 text-left transition active:scale-95 group"
          >
            <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300 block mb-1">
              All Image Prompts
            </span>
            <span className="text-[11px] text-zinc-400">
              Numbered list of visual prompts
            </span>
          </button>

          <button
            onClick={() => handleCopyAllPrompts('video')}
            className="p-3 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-cyan-500/30 text-left transition active:scale-95 group"
          >
            <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 block mb-1">
              All Video Prompts
            </span>
            <span className="text-[11px] text-zinc-400">
              Numbered list of motion prompts
            </span>
          </button>

          <button
            onClick={() => handleCopyAllPrompts('both')}
            className="p-3 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-700 text-left transition active:scale-95 group"
          >
            <span className="text-xs font-bold text-zinc-200 group-hover:text-white block mb-1">
              Combined Script & Prompts
            </span>
            <span className="text-[11px] text-zinc-400">
              Full scene package (Image + Video)
            </span>
          </button>
        </div>
      </div>

      {/* Re-import Project JSON */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white mb-0.5">
            Re-import Saved Project JSON
          </h4>
          <p className="text-xs text-zinc-400">
            Restore a previous session from an exported <code className="text-zinc-300 font-mono">.json</code> backup.
          </p>
        </div>

        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          onChange={handleReimportJson}
          className="hidden"
          id="reimport-json-input"
        />

        <label
          htmlFor="reimport-json-input"
          className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold uppercase tracking-wider transition active:scale-95 shrink-0"
        >
          <Upload className="w-4 h-4 text-amber-400" />
          <span>Upload Project JSON</span>
        </label>
      </div>

      {/* Template Downloads */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-850 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-zinc-400">
          Need a blank Google Flow storyboard template?
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csv = generateTemplateCsv();
              downloadFile(csv, 'flow_storyboard_template.csv', 'text/csv');
              showToast('Downloaded CSV template.', 'success');
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 hover:border-amber-500/40 transition"
          >
            Download .CSV
          </button>
          <button
            onClick={() => {
              const blob = generateTemplateXlsx();
              downloadFile(blob, 'flow_storyboard_template.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
              showToast('Downloaded Excel template.', 'success');
            }}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-zinc-800 hover:border-amber-500/40 transition"
          >
            Download .XLSX
          </button>
        </div>
      </div>
    </div>
  );
};
