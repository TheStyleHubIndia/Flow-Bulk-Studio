import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { StoryboardProject, StoryboardScene } from '../types/storyboard';

export function exportProjectToJson(project: StoryboardProject): string {
  return JSON.stringify(project, null, 2);
}

export function exportScenesToCsv(scenes: StoryboardScene[]): string {
  const rows = scenes.map(s => ({
    'Scene Number': s.sceneNumber,
    'Scene Title': s.sceneTitle,
    'Start Time': s.startTime,
    'End Time': s.endTime,
    'Narration': s.narration,
    'Image Prompt': s.imagePrompt,
    'Image Status': s.imageStatus,
    'Video Prompt': s.videoPrompt,
    'Video Status': s.videoStatus,
    'Suggested Use': s.suggestedUse,
    'Failure Reason': s.failureReason || '',
    'Notes': s.notes || ''
  }));

  return Papa.unparse(rows);
}

export function exportPromptsAsText(
  scenes: StoryboardScene[],
  type: 'image' | 'video' | 'both',
  delimiter: 'newline' | 'numbered' | 'markdown' = 'numbered'
): string {
  return scenes
    .filter(s => (type === 'image' ? s.imagePrompt : type === 'video' ? s.videoPrompt : (s.imagePrompt || s.videoPrompt)))
    .map((s, index) => {
      const img = s.imagePrompt || '(None)';
      const vid = s.videoPrompt || '(None)';
      const sId = s.sceneNumber || String(index + 1);

      if (type === 'image') {
        if (delimiter === 'newline') return s.imagePrompt;
        if (delimiter === 'numbered') return `[Scene ${sId}] ${s.imagePrompt}`;
        return `### Scene ${sId}: ${s.sceneTitle || 'Untitled'}\n**Image Prompt:** ${s.imagePrompt}\n`;
      }

      if (type === 'video') {
        if (delimiter === 'newline') return s.videoPrompt;
        if (delimiter === 'numbered') return `[Scene ${sId}] ${s.videoPrompt}`;
        return `### Scene ${sId}: ${s.sceneTitle || 'Untitled'}\n**Video Motion:** ${s.videoPrompt}\n`;
      }

      // Both
      if (delimiter === 'newline') return `--- Scene ${sId} ---\nIMAGE: ${img}\nVIDEO: ${vid}\n`;
      if (delimiter === 'numbered') return `[Scene ${sId}]\nImage: ${img}\nVideo: ${vid}\n`;
      return `### Scene ${sId}: ${s.sceneTitle || 'Untitled'}\n- **Image Prompt:** ${img}\n- **Video Motion:** ${vid}\n`;
    })
    .join('\n\n');
}

export function downloadFile(content: string | Blob, fileName: string, contentType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function generateTemplateCsv(): string {
  const sample = [
    {
      'Scene Number': '01',
      'Scene Title': 'Neon Metropolis Awakening',
      'Start Time': '00:00:00',
      'End Time': '00:00:04',
      'Narration': 'In the heart of Neo-Kyoto, dawn breaks through holographic fog.',
      'Image Prompt': 'Cinematic wide shot of a futuristic cyberpunk city bathed in golden morning sun and cyan neon reflections, hyper-detailed architecture, volumetric mist, anamorphic lens flare, 8k resolution, cinematic lighting --ar 16:9',
      'Video Prompt': 'Slow forward camera push-in glides over wet pavement, reflecting passing drone traffic overhead, subtle atmospheric steam rises gently, smooth 24fps cinematic motion.',
      'Suggested Use': '16:9 Widescreen, Cinematic Sci-Fi Opening'
    },
    {
      'Scene Number': '02',
      'Scene Title': 'The Cybernetic Artisan',
      'Start Time': '00:00:04',
      'End Time': '00:00:08',
      'Narration': 'Master Jin adjusts the optical nerve filaments of an antique automaton.',
      'Image Prompt': 'Intimate close-up portrait of an elderly cybernetic craftsman with glowing copper magnifying loupes over one eye, carefully soldering delicate brass clockwork gear, moody warm tungsten bokeh, tactile depth of field --ar 16:9',
      'Video Prompt': 'Slow rack focus from trembling brass tweezers in foreground to craftsman’s intense focused eyes, slight camera orbit around workpiece.',
      'Suggested Use': 'Character Introduction, Micro Detail'
    },
    {
      'Scene Number': '03',
      'Scene Title': 'The Awakening Spark',
      'Start Time': '00:00:08',
      'End Time': '00:00:12',
      'Narration': 'A single azure pulse courses through the neural conduit. Life begins anew.',
      'Image Prompt': 'Macro shot of an intricate glass sphere containing an azure plasma core flaring to life, crystalline refractions, sparks of quantum light, rich dark vignette --ar 16:9',
      'Video Prompt': 'Dynamic slow-motion zoom into the plasma flare as energy rings ripple outward, camera tilts upward with the rising heat waves.',
      'Suggested Use': 'Climactic Reveal, High Energy FX'
    }
  ];

  return Papa.unparse(sample);
}

export function generateTemplateXlsx(): Blob {
  const csvContent = generateTemplateCsv();
  const parsed = Papa.parse(csvContent, { header: true });
  const worksheet = XLSX.utils.json_to_sheet(parsed.data as any[]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Storyboard');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
