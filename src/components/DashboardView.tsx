import React, { useRef, useState } from 'react';
import {
  Upload,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Film,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  ArrowRight,
  Download,
  RotateCcw,
  Layers,
  HelpCircle
} from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';
import { parseCsvFile, parseExcelFile, parseJsonProject } from '../utils/spreadsheetParser';
import { generateTemplateCsv, generateTemplateXlsx, downloadFile } from '../utils/exporter';

export const DashboardView: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const {
    project,
    metrics,
    validation,
    setActiveTab,
    loadImportedProject,
    resetToDemo,
    setIsColumnMapperOpen,
    setIsAssistantOpen,
    showToast
  } = store;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsProcessingFile(true);
    setUploadError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'csv') {
        const result = await parseCsvFile(file);
        loadImportedProject(
          result.scenes,
          result.fileName,
          'csv',
          result.mapping,
          result.headers,
          result.rawRows
        );
        if (result.detectedCount < 2) {
          setIsColumnMapperOpen(true);
          showToast('Some columns could not be identified automatically. Please review column mappings.', 'warning');
        }
        if (result.truncated) {
          showToast('Import contained over 75 scenes. Truncated to the maximum 75 scenes as requested.', 'info');
        }
      } else if (ext === 'xlsx' || ext === 'xls') {
        const result = await parseExcelFile(file);
        loadImportedProject(
          result.scenes,
          result.fileName,
          'xlsx',
          result.mapping,
          result.headers,
          result.rawRows
        );
        if (result.detectedCount < 2) {
          setIsColumnMapperOpen(true);
          showToast('Some columns could not be identified automatically. Please review column mappings.', 'warning');
        }
        if (result.truncated) {
          showToast('Import contained over 75 scenes. Truncated to the maximum 75 scenes as requested.', 'info');
        }
      } else if (ext === 'json') {
        const text = await file.text();
        const jsonProject = parseJsonProject(text);
        loadImportedProject(
          jsonProject.scenes,
          jsonProject.metadata.name || file.name,
          'json',
          jsonProject.mapping || {
            sceneNumber: 'Scene Number',
            sceneTitle: 'Scene Title',
            startTime: 'Start Time',
            endTime: 'End Time',
            narration: 'Narration',
            imagePrompt: 'Image Prompt',
            videoPrompt: 'Video Prompt',
            suggestedUse: 'Suggested Use'
          }
        );
        showToast(`Imported project "${jsonProject.metadata.name}" successfully!`, 'success');
      } else {
        throw new Error('Unsupported file format. Please upload a .xlsx, .csv, or .json file.');
      }
    } catch (err: any) {
      console.error('File parse error:', err);
      setUploadError(err.message || 'Failed to parse storyboard file.');
      showToast(err.message || 'Error parsing file.', 'error');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto">
      {/* Cinematic Studio Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-5 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Flow Storyboard Suite</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {project.metadata.name}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Parse Excel/CSV storyboards up to 75 scenes. Stage image & video prompt queues, inspect validation warnings, and navigate prompts into Google Flow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAssistantOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wide transition shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-zinc-950" />
              <span>Flow Assistant</span>
            </button>
            <button
              onClick={resetToDemo}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 text-xs font-medium transition active:scale-95"
              title="Reset to 3 demo scenes"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Demo</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 font-mono">
            <span>Overall Completion</span>
            <span className="font-bold text-amber-400">{metrics.completionRate}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${metrics.completionRate}%` }}
              title={`Completed: ${metrics.completedCount}`}
            />
            {metrics.failedCount > 0 && (
              <div
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${(metrics.failedCount / (metrics.totalScenes || 1)) * 100}%` }}
                title={`Failed: ${metrics.failedCount}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* 6 Key Metrics Grid (Requirement 4) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total Scenes</span>
            <Film className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-white font-mono">{metrics.totalScenes}</span>
            <span className="text-[11px] text-zinc-400 font-mono">/ 75 max</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Image Ready</span>
            <ImageIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-400 font-mono">{metrics.imagePromptsReady}</span>
            <span className="text-[11px] text-zinc-400 font-mono">prompts</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Video Ready</span>
            <Video className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-cyan-400 font-mono">{metrics.videoPromptsReady}</span>
            <span className="text-[11px] text-zinc-400 font-mono">prompts</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-400 font-mono">{metrics.completedCount}</span>
            <span className="text-[11px] text-zinc-400 font-mono">scenes</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Pending</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-zinc-300 font-mono">{metrics.pendingCount}</span>
            <span className="text-[11px] text-zinc-400 font-mono">queued</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Failed</span>
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-red-400 font-mono">{metrics.failedCount}</span>
            <span className="text-[11px] text-zinc-400 font-mono">errors</span>
          </div>
        </div>
      </div>

      {/* Validation Warnings Banner (Requirement 3) */}
      {(validation.hasErrors || validation.hasWarnings) && (
        <div className={`p-4 rounded-xl border ${validation.hasErrors ? 'bg-red-950/40 border-red-800/50 text-red-200' : 'bg-amber-950/40 border-amber-800/50 text-amber-200'}`}>
          <div className="flex items-start gap-3">
            {validation.hasErrors ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-bold tracking-tight">
                  {validation.hasErrors ? 'Validation Issues Detected' : 'Storyboard Warnings'}
                </h4>
                <button
                  onClick={() => setActiveTab('scenes')}
                  className="text-xs font-semibold underline hover:text-white flex items-center gap-1"
                >
                  <span>Review in Scenes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-2 space-y-1 text-xs">
                {validation.duplicateScenes.length > 0 && (
                  <p className="flex items-center gap-1.5 font-medium text-red-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Duplicate scene numbers detected: {validation.duplicateScenes.join(', ')}
                  </p>
                )}
                {validation.missingImagePrompts.length > 0 && (
                  <p className="flex items-center gap-1.5 text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Missing Image Prompts in {validation.missingImagePrompts.length} scene(s): {validation.missingImagePrompts.slice(0, 5).join(', ')}{validation.missingImagePrompts.length > 5 ? '...' : ''}
                  </p>
                )}
                {validation.missingVideoPrompts.length > 0 && (
                  <p className="flex items-center gap-1.5 text-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Missing Video Prompts in {validation.missingVideoPrompts.length} scene(s): {validation.missingVideoPrompts.slice(0, 5).join(', ')}{validation.missingVideoPrompts.length > 5 ? '...' : ''}
                  </p>
                )}
                {validation.emptyRowsCount > 0 && (
                  <p className="flex items-center gap-1.5 text-zinc-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    {validation.emptyRowsCount} empty row(s) preserved (never silently discarded).
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dropzone (Requirement 2 & 1) */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
            : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv, .json"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
          className="hidden"
          id="storyboard-file-input"
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-amber-400 mb-3 shadow-lg">
            {isProcessingFile ? (
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>

          <h3 className="text-base font-bold text-white mb-1">
            {isProcessingFile ? 'Parsing Storyboard...' : 'Upload Storyboard Spreadsheet'}
          </h3>
          <p className="text-xs text-zinc-400 mb-4 max-w-sm">
            Support for <span className="text-zinc-200 font-semibold">.xlsx</span>, <span className="text-zinc-200 font-semibold">.csv</span> and project <span className="text-zinc-200 font-semibold">.json</span>. Max 75 scenes parsed client-side with SheetJS and PapaParse.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <label
              htmlFor="storyboard-file-input"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-zinc-950" />
              <span>Browse File</span>
            </label>

            {store.rawHeaders.length > 0 && (
              <button
                onClick={() => setIsColumnMapperOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-medium transition active:scale-95"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Adjust Mappings</span>
              </button>
            )}
          </div>

          {uploadError && (
            <p className="mt-3 text-xs text-red-400 bg-red-950/60 px-3 py-1.5 rounded-lg border border-red-800/40">
              {uploadError}
            </p>
          )}

          {/* Quick template download helpers */}
          <div className="mt-5 pt-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400">
            <span>Need a formatted file?</span>
            <button
              onClick={() => {
                const csv = generateTemplateCsv();
                downloadFile(csv, 'flow_storyboard_template.csv', 'text/csv');
                showToast('Downloaded sample CSV template.', 'success');
              }}
              className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 hover:underline"
            >
              <Download className="w-3 h-3" />
              <span>Download CSV Template</span>
            </button>
            <span>•</span>
            <button
              onClick={() => {
                const blob = generateTemplateXlsx();
                downloadFile(blob, 'flow_storyboard_template.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                showToast('Downloaded sample XLSX template.', 'success');
              }}
              className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 hover:underline"
            >
              <Download className="w-3 h-3" />
              <span>Download Excel Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('images')}
          className="group text-left p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/70 border border-zinc-800 hover:border-amber-500/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                Image Queue
              </h4>
              <p className="text-xs text-zinc-400 font-mono">
                {metrics.imagePromptsReady} ready to copy
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className="group text-left p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/70 border border-zinc-800 hover:border-cyan-500/40 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                Video Queue
              </h4>
              <p className="text-xs text-zinc-400 font-mono">
                {metrics.videoPromptsReady} ready to copy
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
        </button>

        <button
          onClick={() => setActiveTab('scenes')}
          className="group text-left p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/70 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center border border-zinc-700 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors">
                Scene Manager
              </h4>
              <p className="text-xs text-zinc-400 font-mono">
                Inspect and edit all {project.scenes.length}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Transparent Disclaimer / Guidelines Banner (Requirement 7) */}
      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-zinc-300">
            Google Flow Workflow Protocol
          </p>
          <p className="leading-relaxed">
            Flow Bulk Studio is an offline-capable queue and prompt staging tool. Prompts are never automatically submitted without user direction, and no generation credits are spent automatically. Use the Flow Assistant panel alongside the official Google Flow tool.
          </p>
        </div>
      </div>
    </div>
  );
};
