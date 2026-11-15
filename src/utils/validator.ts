import { StoryboardScene, ValidationError, ValidationSummary } from '../types/storyboard';

export function validateScenes(scenes: StoryboardScene[]): ValidationSummary {
  const errors: ValidationError[] = [];
  const sceneNumberCounts = new Map<string, number>();
  const duplicateScenesSet = new Set<string>();
  const missingImagePrompts: string[] = [];
  const missingVideoPrompts: string[] = [];
  let emptyRowsCount = 0;

  scenes.forEach((scene, index) => {
    const sNum = (scene.sceneNumber || '').trim();
    const isTotallyBlank =
      !sNum &&
      !scene.sceneTitle.trim() &&
      !scene.narration.trim() &&
      !scene.imagePrompt.trim() &&
      !scene.videoPrompt.trim();

    if (isTotallyBlank) {
      emptyRowsCount++;
      errors.push({
        type: 'warning',
        sceneIndex: index,
        sceneId: scene.id,
        sceneNumber: sNum || `Row ${index + 1}`,
        message: `Scene at row ${index + 1} is empty (all fields blank).`
      });
      return;
    }

    // Track scene numbers for duplicates
    if (sNum) {
      const count = (sceneNumberCounts.get(sNum) || 0) + 1;
      sceneNumberCounts.set(sNum, count);
      if (count > 1) {
        duplicateScenesSet.add(sNum);
      }
    } else {
      errors.push({
        type: 'warning',
        sceneIndex: index,
        sceneId: scene.id,
        message: `Scene at row ${index + 1} has no Scene Number assigned.`
      });
    }

    // Check prompts
    const hasImagePrompt = Boolean(scene.imagePrompt && scene.imagePrompt.trim().length > 0);
    const hasVideoPrompt = Boolean(scene.videoPrompt && scene.videoPrompt.trim().length > 0);

    if (!hasImagePrompt) {
      missingImagePrompts.push(sNum || `Row ${index + 1}`);
      errors.push({
        type: 'warning',
        sceneIndex: index,
        sceneId: scene.id,
        sceneNumber: sNum,
        field: 'imagePrompt',
        message: `Scene ${sNum || index + 1} is missing an Image Prompt.`
      });
    }

    if (!hasVideoPrompt) {
      missingVideoPrompts.push(sNum || `Row ${index + 1}`);
      errors.push({
        type: 'warning',
        sceneIndex: index,
        sceneId: scene.id,
        sceneNumber: sNum,
        field: 'videoPrompt',
        message: `Scene ${sNum || index + 1} is missing a Video Prompt.`
      });
    }
  });

  // Add explicit duplicate errors
  duplicateScenesSet.forEach(dup => {
    errors.push({
      type: 'error',
      sceneIndex: -1,
      sceneNumber: dup,
      message: `Duplicate Scene Number found: "${dup}". Consider re-numbering for clear tracking in Flow.`
    });
  });

  const duplicateScenes = Array.from(duplicateScenesSet);

  return {
    hasErrors: duplicateScenes.length > 0,
    hasWarnings: missingImagePrompts.length > 0 || missingVideoPrompts.length > 0 || emptyRowsCount > 0,
    emptyRowsCount,
    duplicateScenes,
    missingImagePrompts,
    missingVideoPrompts,
    errors
  };
}
