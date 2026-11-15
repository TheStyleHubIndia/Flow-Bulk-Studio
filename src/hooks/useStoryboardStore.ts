import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StoryboardProject,
  StoryboardScene,
  ColumnMapping,
  ValidationSummary,
  QueueProgressState,
  SceneStatus
} from '../types/storyboard';
import { DEMO_PROJECT } from '../utils/sampleData';
import { validateScenes } from '../utils/validator';
import { parseRowsToScenes } from '../utils/spreadsheetParser';

const STORAGE_KEY = 'flow_bulk_studio_project_v1';
const SETTINGS_KEY = 'flow_bulk_studio_settings_v1';

export interface StudioSettings {
  defaultFlowUrl: string;
  enableHaptics: boolean;
  copyDelimiter: 'newline' | 'numbered' | 'markdown';
  autoAdvanceOnComplete: boolean;
  queueDelaySeconds: number;
}

export const DEFAULT_SETTINGS: StudioSettings = {
  defaultFlowUrl: 'https://labs.google/flow',
  enableHaptics: true,
  copyDelimiter: 'numbered',
  autoAdvanceOnComplete: true,
  queueDelaySeconds: 2
};

export function useStoryboardStore() {
  // Load initial project from localStorage or DEMO_PROJECT
  const [project, setProject] = useState<StoryboardProject>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.scenes)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved project from localStorage:', e);
    }
    return DEMO_PROJECT;
  });

  const [settings, setSettings] = useState<StudioSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scenes' | 'images' | 'videos' | 'export' | 'settings'>('dashboard');

  // Multi-selection state
  const [selectedSceneIds, setSelectedSceneIds] = useState<Set<string>>(new Set());

  // Assistant panel state
  const [assistantSceneId, setAssistantSceneId] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Column mapper state
  const [isColumnMapperOpen, setIsColumnMapperOpen] = useState(false);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // Editing scene in modal
  const [editingScene, setEditingScene] = useState<StoryboardScene | null>(null);

  // Queue runner state
  const [queueState, setQueueState] = useState<QueueProgressState>({
    isActive: false,
    isPaused: false,
    currentSceneIndex: 0,
    mode: 'both',
    completedCount: 0,
    failedCount: 0
  });

  // Toast feedback
  const [toast, setToast] = useState<{ id: number; message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToast({ id: Date.now(), message, type });
    if (settings.enableHaptics && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(30);
      } catch (_) {}
    }
  }, [settings.enableHaptics]);

  // Persist project on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (err) {
      console.error('Error saving project to localStorage:', err);
    }
  }, [project]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }, [settings]);

  // Compute validation on current scenes
  const validation: ValidationSummary = useMemo(() => {
    return validateScenes(project.scenes);
  }, [project.scenes]);

  // Metrics summary
  const metrics = useMemo(() => {
    const totalScenes = project.scenes.length;
    let imagePromptsReady = 0;
    let videoPromptsReady = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    project.scenes.forEach(s => {
      if (s.imagePrompt && s.imagePrompt.trim().length > 0) imagePromptsReady++;
      if (s.videoPrompt && s.videoPrompt.trim().length > 0) videoPromptsReady++;

      const isCompleted = s.imageStatus === 'completed' || s.videoStatus === 'completed';
      const isFailed = s.imageStatus === 'failed' || s.videoStatus === 'failed';
      const isPending = s.imageStatus === 'pending' && s.videoStatus === 'pending';

      if (isCompleted) completedCount++;
      if (isFailed) failedCount++;
      if (isPending) pendingCount++;
    });

    return {
      totalScenes,
      imagePromptsReady,
      videoPromptsReady,
      completedCount,
      pendingCount,
      failedCount,
      completionRate: totalScenes > 0 ? Math.round((completedCount / totalScenes) * 100) : 0
    };
  }, [project.scenes]);

  // Single scene update
  const updateScene = useCallback((sceneId: string, updates: Partial<StoryboardScene>) => {
    setProject(prev => ({
      ...prev,
      metadata: { ...prev.metadata, lastSavedAt: new Date().toISOString() },
      scenes: prev.scenes.map(s => s.id === sceneId ? { ...s, ...updates, lastUpdated: new Date().toISOString() } : s)
    }));
  }, []);

  // Add new scene
  const addScene = useCallback(() => {
    const nextNumber = `${project.scenes.length + 1}`;
    const newScene: StoryboardScene = {
      id: `scene_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sceneNumber: nextNumber,
      sceneTitle: `Scene ${nextNumber}`,
      startTime: '',
      endTime: '',
      narration: '',
      imagePrompt: '',
      videoPrompt: '',
      suggestedUse: '16:9 Widescreen',
      imageStatus: 'pending',
      videoStatus: 'pending',
      lastUpdated: new Date().toISOString()
    };

    setProject(prev => ({
      ...prev,
      metadata: { ...prev.metadata, lastSavedAt: new Date().toISOString() },
      scenes: [...prev.scenes, newScene]
    }));
    showToast(`Scene ${nextNumber} added.`, 'success');
  }, [project.scenes.length, showToast]);

  // Delete scene
  const deleteScene = useCallback((sceneId: string) => {
    setProject(prev => ({
      ...prev,
      metadata: { ...prev.metadata, lastSavedAt: new Date().toISOString() },
      scenes: prev.scenes.filter(s => s.id !== sceneId)
    }));
    setSelectedSceneIds(prev => {
      const next = new Set(prev);
      next.delete(sceneId);
      return next;
    });
    showToast('Scene deleted.', 'info');
  }, [showToast]);

  // Load new imported scenes
  const loadImportedProject = useCallback((
    newScenes: StoryboardScene[],
    fileName: string,
    fileType: 'xlsx' | 'csv' | 'json',
    mapping: ColumnMapping,
    headers: string[] = [],
    rows: Record<string, any>[] = []
  ) => {
    const newProject: StoryboardProject = {
      metadata: {
        id: `project_${Date.now()}`,
        name: fileName.replace(/\.[^/.]+$/, ''),
        fileName,
        fileType,
        importedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        version: '1.0'
      },
      scenes: newScenes,
      mapping
    };

    setProject(newProject);
    setRawHeaders(headers);
    setRawRows(rows);
    setSelectedSceneIds(new Set());
    setActiveTab('dashboard');
    showToast(`Loaded ${newScenes.length} scenes from ${fileName}`, 'success');
  }, [showToast]);

  // Re-apply column mapping
  const reapplyColumnMapping = useCallback((newMapping: ColumnMapping) => {
    if (rawRows.length === 0) {
      showToast('No raw rows available to re-map.', 'warning');
      return;
    }
    const { scenes } = parseRowsToScenes(rawRows, newMapping, 75);
    setProject(prev => ({
      ...prev,
      mapping: newMapping,
      scenes,
      metadata: { ...prev.metadata, lastSavedAt: new Date().toISOString() }
    }));
    setIsColumnMapperOpen(false);
    showToast(`Re-mapped columns successfully across ${scenes.length} scenes.`, 'success');
  }, [rawRows, showToast]);

  // Restore Demo Data
  const resetToDemo = useCallback(() => {
    setProject({
      ...DEMO_PROJECT,
      metadata: {
        ...DEMO_PROJECT.metadata,
        id: `project_demo_${Date.now()}`,
        importedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString()
      }
    });
    setSelectedSceneIds(new Set());
    setRawHeaders([]);
    setRawRows([]);
    showToast('Reset to demo storyboard (3 scenes).', 'info');
  }, [showToast]);

  // Selection helpers
  const toggleSelectScene = useCallback((sceneId: string) => {
    setSelectedSceneIds(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) next.delete(sceneId);
      else next.add(sceneId);
      return next;
    });
  }, []);

  const selectAllScenes = useCallback(() => {
    setSelectedSceneIds(new Set(project.scenes.map(s => s.id)));
  }, [project.scenes]);

  const deselectAllScenes = useCallback(() => {
    setSelectedSceneIds(new Set());
  }, []);

  const invertSelection = useCallback(() => {
    setSelectedSceneIds(prev => {
      const next = new Set<string>();
      project.scenes.forEach(s => {
        if (!prev.has(s.id)) next.add(s.id);
      });
      return next;
    });
  }, [project.scenes]);

  // Batch status updater
  const batchUpdateStatus = useCallback((
    targetType: 'image' | 'video' | 'both',
    newStatus: SceneStatus,
    targetIds?: string[]
  ) => {
    const idsToUpdate = targetIds || Array.from(selectedSceneIds);
    if (idsToUpdate.length === 0) {
      showToast('No scenes selected for bulk update.', 'warning');
      return;
    }

    const idSet = new Set(idsToUpdate);
    setProject(prev => ({
      ...prev,
      metadata: { ...prev.metadata, lastSavedAt: new Date().toISOString() },
      scenes: prev.scenes.map(s => {
        if (!idSet.has(s.id)) return s;
        return {
          ...s,
          imageStatus: targetType === 'image' || targetType === 'both' ? newStatus : s.imageStatus,
          videoStatus: targetType === 'video' || targetType === 'both' ? newStatus : s.videoStatus,
          lastUpdated: new Date().toISOString()
        };
      })
    }));

    showToast(`Updated ${idsToUpdate.length} scenes to "${newStatus}".`, 'success');
  }, [selectedSceneIds, showToast]);

  // Batch delete
  const batchDelete = useCallback((targetIds?: string[]) => {
    const idsToDelete = targetIds || Array.from(selectedSceneIds);
    if (idsToDelete.length === 0) return;

    const idSet = new Set(idsToDelete);
    setProject(prev => ({
      ...prev,
      metadata: { ...prev.metadata, lastSavedAt: new Date().toISOString() },
      scenes: prev.scenes.filter(s => !idSet.has(s.id))
    }));
    setSelectedSceneIds(new Set());
    showToast(`Deleted ${idsToDelete.length} scenes.`, 'info');
  }, [selectedSceneIds, showToast]);

  // Copy helper
  const copyText = useCallback(async (text: string, label: string = 'Prompt') => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`Copied ${label} to clipboard!`, 'success');
      return true;
    } catch (err) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast(`Copied ${label} to clipboard!`, 'success');
        return true;
      } catch (e) {
        document.body.removeChild(textarea);
        showToast('Failed to copy to clipboard.', 'error');
        return false;
      }
    }
  }, [showToast]);

  // Assistant active scene
  const activeScene = useMemo(() => {
    if (!assistantSceneId) {
      return project.scenes[0] || null;
    }
    return project.scenes.find(s => s.id === assistantSceneId) || project.scenes[0] || null;
  }, [assistantSceneId, project.scenes]);

  const openAssistantForScene = useCallback((sceneId: string) => {
    setAssistantSceneId(sceneId);
    setIsAssistantOpen(true);
  }, []);

  const nextAssistantScene = useCallback(() => {
    if (!activeScene) return;
    const currentIndex = project.scenes.findIndex(s => s.id === activeScene.id);
    if (currentIndex >= 0 && currentIndex < project.scenes.length - 1) {
      setAssistantSceneId(project.scenes[currentIndex + 1].id);
    }
  }, [activeScene, project.scenes]);

  const prevAssistantScene = useCallback(() => {
    if (!activeScene) return;
    const currentIndex = project.scenes.findIndex(s => s.id === activeScene.id);
    if (currentIndex > 0) {
      setAssistantSceneId(project.scenes[currentIndex - 1].id);
    }
  }, [activeScene, project.scenes]);

  return {
    project,
    settings,
    setSettings,
    activeTab,
    setActiveTab,
    selectedSceneIds,
    toggleSelectScene,
    selectAllScenes,
    deselectAllScenes,
    invertSelection,
    validation,
    metrics,
    updateScene,
    addScene,
    deleteScene,
    loadImportedProject,
    reapplyColumnMapping,
    resetToDemo,
    batchUpdateStatus,
    batchDelete,
    copyText,
    // Assistant
    activeScene,
    assistantSceneId,
    setAssistantSceneId,
    isAssistantOpen,
    setIsAssistantOpen,
    openAssistantForScene,
    nextAssistantScene,
    prevAssistantScene,
    // Modals
    isColumnMapperOpen,
    setIsColumnMapperOpen,
    rawHeaders,
    rawRows,
    setRawHeaders,
    setRawRows,
    editingScene,
    setEditingScene,
    // Queue runner
    queueState,
    setQueueState,
    // Toast
    toast,
    setToast,
    showToast
  };
}

export type StoryboardStore = ReturnType<typeof useStoryboardStore>;
