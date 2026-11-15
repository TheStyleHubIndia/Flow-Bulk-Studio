import test from 'node:test';
import assert from 'node:assert/strict';
import { detectColumnMappings } from './columnDetector';
import { validateScenes } from './validator';
import { parseRowsToScenes } from './spreadsheetParser';
import { exportScenesToCsv, exportPromptsAsText } from './exporter';
import { StoryboardScene } from '../types/storyboard';

test('detectColumnMappings detects standard and alternative header synonyms', () => {
  const headers = [
    'Scene #',
    'Title',
    'Start TC',
    'End TC',
    'VO Script',
    'Visual Prompt',
    'Camera Movement',
    'Aspect Ratio'
  ];

  const { mapping, detectedCount } = detectColumnMappings(headers);

  assert.equal(detectedCount, 8);
  assert.equal(mapping.sceneNumber, 'Scene #');
  assert.equal(mapping.sceneTitle, 'Title');
  assert.equal(mapping.startTime, 'Start TC');
  assert.equal(mapping.endTime, 'End TC');
  assert.equal(mapping.narration, 'VO Script');
  assert.equal(mapping.imagePrompt, 'Visual Prompt');
  assert.equal(mapping.videoPrompt, 'Camera Movement');
  assert.equal(mapping.suggestedUse, 'Aspect Ratio');
});

test('validateScenes detects duplicate scene numbers, missing prompts, and empty rows', () => {
  const testScenes: StoryboardScene[] = [
    {
      id: '1',
      sceneNumber: '01',
      sceneTitle: 'Opening',
      startTime: '',
      endTime: '',
      narration: 'Hello',
      imagePrompt: 'A futuristic city',
      videoPrompt: '', // Missing video prompt!
      suggestedUse: '',
      imageStatus: 'ready',
      videoStatus: 'pending'
    },
    {
      id: '2',
      sceneNumber: '01', // Duplicate scene number!
      sceneTitle: 'Duplicate scene',
      startTime: '',
      endTime: '',
      narration: 'World',
      imagePrompt: '', // Missing image prompt!
      videoPrompt: 'Camera pan right',
      suggestedUse: '',
      imageStatus: 'pending',
      videoStatus: 'ready'
    },
    {
      id: '3',
      sceneNumber: '', // Empty row
      sceneTitle: '',
      startTime: '',
      endTime: '',
      narration: '',
      imagePrompt: '',
      videoPrompt: '',
      suggestedUse: '',
      imageStatus: 'pending',
      videoStatus: 'pending'
    }
  ];

  const result = validateScenes(testScenes);

  assert.equal(result.hasErrors, true);
  assert.deepEqual(result.duplicateScenes, ['01']);
  assert.equal(result.emptyRowsCount, 1);
  assert.ok(result.missingVideoPrompts.includes('01'));
  assert.ok(result.missingImagePrompts.includes('01'));
});

test('parseRowsToScenes preserves up to 75 scenes and marks truncated if exceeds', () => {
  const rawRows = Array.from({ length: 80 }, (_, i) => ({
    'Scene #': `${i + 1}`,
    'Prompt': `Prompt text ${i + 1}`
  }));

  const mapping = {
    sceneNumber: 'Scene #',
    sceneTitle: '',
    startTime: '',
    endTime: '',
    narration: '',
    imagePrompt: 'Prompt',
    videoPrompt: '',
    suggestedUse: ''
  };

  const { scenes, truncated } = parseRowsToScenes(rawRows, mapping, 75);

  assert.equal(scenes.length, 75);
  assert.equal(truncated, true);
  assert.equal(scenes[0].sceneNumber, '1');
  assert.equal(scenes[0].imagePrompt, 'Prompt text 1');
});

test('exportScenesToCsv and exportPromptsAsText format correctly', () => {
  const sample: StoryboardScene[] = [
    {
      id: 's1',
      sceneNumber: '01',
      sceneTitle: 'Intro',
      startTime: '00:00',
      endTime: '00:05',
      narration: 'Voiceover line',
      imagePrompt: 'Cinematic wide shot',
      videoPrompt: 'Push in',
      suggestedUse: '16:9',
      imageStatus: 'ready',
      videoStatus: 'pending'
    }
  ];

  const csv = exportScenesToCsv(sample);
  assert.ok(csv.includes('Scene Number'));
  assert.ok(csv.includes('Cinematic wide shot'));
  assert.ok(csv.includes('Push in'));

  const numberedText = exportPromptsAsText(sample, 'image', 'numbered');
  assert.equal(numberedText, '[Scene 01] Cinematic wide shot');
});
