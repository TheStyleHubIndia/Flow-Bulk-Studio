import { ColumnMapping } from '../types/storyboard';

const SYNONYMS: Record<keyof ColumnMapping, string[]> = {
  sceneNumber: [
    'scene number', 'scene_number', 'scenenumber', 'scene #', 'sc #', 'sc#',
    'scene id', 'scene_id', 'scene', 'shot', 'shot #', 'cut', 'scene_no', 'scene no',
    'scene no.', 'number', 'no', 'seq', 'sequence', 'index'
  ],
  sceneTitle: [
    'scene title', 'scene_title', 'scenetitle', 'title', 'scene name', 'scene_name',
    'name', 'heading', 'slug', 'slugline', 'headline', 'caption', 'description'
  ],
  startTime: [
    'start time', 'start_time', 'starttime', 'start', 'in', 'timecode in',
    'timecode_in', 'tc in', 'tc_in', 'start tc', 'start_tc', 'from', 'in point'
  ],
  endTime: [
    'end time', 'end_time', 'endtime', 'end', 'out', 'timecode out',
    'timecode_out', 'tc out', 'tc_out', 'end tc', 'end_tc', 'duration', 'to', 'out point', 'length'
  ],
  narration: [
    'narration', 'voiceover', 'voice over', 'voice-over', 'vo', 'v.o.', 'v.o',
    'audio', 'dialogue', 'dialog', 'script', 'speech', 'audio script', 'audio_script',
    'speaker', 'lines', 'story'
  ],
  imagePrompt: [
    'image prompt', 'image_prompt', 'imageprompt', 'img prompt', 'img_prompt',
    'visual prompt', 'visual_prompt', 'flow image prompt', 'flow_image_prompt',
    'image gen prompt', 'midjourney prompt', 'dalle prompt', 'image_generation_prompt',
    'image description', 'visual description', 'image_desc', 'prompt', 'visual'
  ],
  videoPrompt: [
    'video prompt', 'video_prompt', 'videoprompt', 'motion prompt', 'motion_prompt',
    'camera movement', 'camera_movement', 'flow video prompt', 'flow_video_prompt',
    'video gen prompt', 'animation prompt', 'camera motion', 'video_motion',
    'camera prompt', 'motion', 'video action', 'camera direction'
  ],
  suggestedUse: [
    'suggested use', 'suggested_use', 'suggesteduse', 'use', 'aspect ratio',
    'aspect_ratio', 'ratio', 'mode', 'model', 'generation type', 'generation_type',
    'format', 'style', 'notes', 'tags', 'target platform'
  ]
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[_\-\.]+/g, ' ')
    .replace(/\s+/g, ' ');
}

export function detectColumnMappings(availableHeaders: string[]): {
  mapping: ColumnMapping;
  detectedCount: number;
} {
  const mapping: ColumnMapping = {
    sceneNumber: '',
    sceneTitle: '',
    startTime: '',
    endTime: '',
    narration: '',
    imagePrompt: '',
    videoPrompt: '',
    suggestedUse: '',
  };

  const usedHeaders = new Set<string>();
  const normalizedHeaders = availableHeaders.map(h => ({
    original: h,
    normalized: normalizeHeader(h)
  }));

  const fields: (keyof ColumnMapping)[] = [
    // Look for more specific fields first to avoid 'prompt' stealing 'videoPrompt' or 'imagePrompt'
    'imagePrompt',
    'videoPrompt',
    'sceneNumber',
    'sceneTitle',
    'startTime',
    'endTime',
    'narration',
    'suggestedUse'
  ];

  let detectedCount = 0;

  for (const field of fields) {
    const synonyms = SYNONYMS[field];
    let matchedHeader = '';

    // Exact synonym match
    for (const syn of synonyms) {
      const match = normalizedHeaders.find(
        h => !usedHeaders.has(h.original) && (h.normalized === syn || h.normalized === syn.replace(/\s+/g, ''))
      );
      if (match) {
        matchedHeader = match.original;
        break;
      }
    }

    // Substring match if exact match not found
    if (!matchedHeader) {
      for (const syn of synonyms) {
        const match = normalizedHeaders.find(
          h => !usedHeaders.has(h.original) && (
            h.normalized.includes(syn) || 
            syn.includes(h.normalized)
          )
        );
        if (match) {
          matchedHeader = match.original;
          break;
        }
      }
    }

    if (matchedHeader) {
      mapping[field] = matchedHeader;
      usedHeaders.add(matchedHeader);
      detectedCount++;
    }
  }

  // Fallbacks: If only one prompt column exists and wasn't claimed, assign to imagePrompt
  if (!mapping.imagePrompt && !mapping.videoPrompt) {
    const promptMatch = normalizedHeaders.find(
      h => !usedHeaders.has(h.original) && h.normalized.includes('prompt')
    );
    if (promptMatch) {
      mapping.imagePrompt = promptMatch.original;
      usedHeaders.add(promptMatch.original);
      detectedCount++;
    }
  }

  return { mapping, detectedCount };
}
