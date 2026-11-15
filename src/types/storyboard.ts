export type SceneStatus = 'pending' | 'ready' | 'in_progress' | 'completed' | 'failed';

export interface StoryboardScene {
  id: string; // internal unique id (uuid or timestamp-index)
  sceneNumber: string; // user-facing scene identifier e.g. "1", "1A", "02"
  sceneTitle: string;
  startTime: string;
  endTime: string;
  narration: string;
  imagePrompt: string;
  videoPrompt: string;
  suggestedUse: string; // aspect ratio, camera style, or use case
  imageStatus: SceneStatus;
  videoStatus: SceneStatus;
  failureReason?: string;
  notes?: string;
  lastUpdated?: string;
}

export interface ColumnMapping {
  sceneNumber: string;
  sceneTitle: string;
  startTime: string;
  endTime: string;
  narration: string;
  imagePrompt: string;
  videoPrompt: string;
  suggestedUse: string;
}

export interface ValidationError {
  type: 'error' | 'warning';
  sceneIndex: number;
  sceneId?: string;
  sceneNumber?: string;
  field?: string;
  message: string;
}

export interface ValidationSummary {
  hasErrors: boolean;
  hasWarnings: boolean;
  emptyRowsCount: number;
  duplicateScenes: string[];
  missingImagePrompts: string[];
  missingVideoPrompts: string[];
  errors: ValidationError[];
}

export interface ProjectMetadata {
  id: string;
  name: string;
  fileName?: string;
  fileType?: 'xlsx' | 'csv' | 'json' | 'demo';
  importedAt: string;
  lastSavedAt: string;
  version: string;
}

export interface StoryboardProject {
  metadata: ProjectMetadata;
  scenes: StoryboardScene[];
  mapping: ColumnMapping;
}

export interface QueueProgressState {
  isActive: boolean;
  isPaused: boolean;
  currentSceneIndex: number;
  mode: 'image' | 'video' | 'both';
  completedCount: number;
  failedCount: number;
}
