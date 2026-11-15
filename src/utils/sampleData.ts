import { StoryboardProject, StoryboardScene } from '../types/storyboard';

export const DEMO_SCENES: StoryboardScene[] = [
  {
    id: 'demo_scene_01',
    sceneNumber: '01 [DEMO]',
    sceneTitle: 'Cybernetic Foundry Dawn',
    startTime: '00:00:00',
    endTime: '00:00:04',
    narration: 'Neo-Kyoto awakens in a shroud of amber smog and iridescent rain.',
    imagePrompt: 'Cinematic wide shot of a futuristic cyberpunk factory roof overlooking Neo-Kyoto skyline at dawn, golden sun beams piercing through thick industrial haze, holographic neon reflections on wet metallic walkways, photorealistic 8k, anamorphic aspect --ar 16:9',
    videoPrompt: 'Cinematic slow drone dolly forward glides through rising steam vents, tilt down to reveal worker silhouettes below, smooth fluid motion 24fps.',
    suggestedUse: 'Opening establishing wide, 16:9 cinematic',
    imageStatus: 'ready',
    videoStatus: 'pending',
    notes: 'Sample storyboard scene 1 of 3 (Demo data)'
  },
  {
    id: 'demo_scene_02',
    sceneNumber: '02 [DEMO]',
    sceneTitle: 'The Automaton Engineer',
    startTime: '00:00:04',
    endTime: '00:00:08',
    narration: 'Deep in Sector 4, master engineer Jin solders a bio-synthetic neural node.',
    imagePrompt: 'Medium close-up portrait of an elderly cybernetic engineer wearing multi-lens brass optical loupes, fine blue laser sparks illuminating his weathered face and metallic prosthetic fingers, moody dark workshop bokeh --ar 16:9',
    videoPrompt: 'Slow rack focus from dancing electric welding sparks in foreground to the artisan’s intense eyes, subtle handheld camera vibration.',
    suggestedUse: 'Character close-up, dramatic lighting',
    imageStatus: 'ready',
    videoStatus: 'pending',
    notes: 'Sample storyboard scene 2 of 3 (Demo data)'
  },
  {
    id: 'demo_scene_03',
    sceneNumber: '03 [DEMO]',
    sceneTitle: 'The Quantum Pulse',
    startTime: '00:00:08',
    endTime: '00:00:12',
    narration: 'A surge of pure cobalt energy flares through the core conduit.',
    imagePrompt: 'Macro shot of an intricate glass sphere containing an azure plasma core flaring to life, crystalline refractions, sparks of quantum light, rich dark vignette, cinematic hyper-detail --ar 16:9',
    videoPrompt: 'Dramatic high-speed camera zoom-in toward center of glass core as energy shockwaves ripple outward into darkness, cinematic motion blur.',
    suggestedUse: 'Climax macro shot, high energy VFX',
    imageStatus: 'ready',
    videoStatus: 'pending',
    notes: 'Sample storyboard scene 3 of 3 (Demo data)'
  }
];

export const DEMO_PROJECT: StoryboardProject = {
  metadata: {
    id: 'project_demo_default',
    name: 'Neo-Kyoto Genesis [DEMO]',
    fileName: 'neo_kyoto_demo.xlsx',
    fileType: 'demo',
    importedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
    version: '1.0'
  },
  scenes: DEMO_SCENES,
  mapping: {
    sceneNumber: 'Scene Number',
    sceneTitle: 'Scene Title',
    startTime: 'Start Time',
    endTime: 'End Time',
    narration: 'Narration',
    imagePrompt: 'Image Prompt',
    videoPrompt: 'Video Prompt',
    suggestedUse: 'Suggested Use'
  }
};
