import React from 'react';
import { Clapperboard, ExternalLink, Sparkles, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { StoryboardStore } from '../hooks/useStoryboardStore';

export const Navbar: React.FC<{ store: StoryboardStore }> = ({ store }) => {
  const { project, settings, validation, setIsAssistantOpen, setIsColumnMapperOpen, activeScene } = store;

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0 border border-amber-400/30">
            <Clapperboard className="w-4 h-4 text-zinc-950 stroke-[2.2]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-extrabold tracking-tight text-white truncate uppercase">
                Flow Bulk Studio
              </h1>
              <span className="hidden sm:inline-block text-[9px] uppercase font-bold px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                v1.0
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 truncate">
              <span className="truncate max-w-[120px] sm:max-w-[200px] text-zinc-300 font-medium">
                {project.metadata.name}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400 font-mono text-[10px]">
                {project.scenes.length} {project.scenes.length === 1 ? 'scene' : 'scenes'}
              </span>
              {validation.hasErrors && (
                <span className="inline-flex items-center gap-0.5 text-[9px] text-red-400 font-medium bg-red-950/60 px-1 rounded border border-red-800/40">
                  <AlertCircle className="w-2.5 h-2.5" />
                  Issue
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Adjust Mapping if raw headers exist */}
          {store.rawHeaders.length > 0 && (
            <button
              onClick={() => setIsColumnMapperOpen(true)}
              className="hidden md:flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-zinc-700/60 transition-colors"
              title="Manual Column Mapping"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Map Columns</span>
            </button>
          )}

          {/* Launch Google Flow (Safe <a> tag with target="_blank") */}
          <a
            href={settings.defaultFlowUrl || 'https://labs.google/flow'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/70 transition-colors active:scale-95 shadow-sm"
            title="Open official Google Flow in new tab"
          >
            <span>Flow</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>

          {/* Assistant Trigger Button */}
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="relative flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            aria-label="Open Flow Assistant Panel"
          >
            <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
            <span className="font-bold">Assistant</span>
            {activeScene && (
              <span className="hidden sm:inline-block text-[10px] px-1 rounded bg-zinc-950/20 text-zinc-900 font-mono">
                #{activeScene.sceneNumber}
              </span>
            )}
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
