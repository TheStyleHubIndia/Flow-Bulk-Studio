import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ColumnMapping, StoryboardProject, StoryboardScene } from '../types/storyboard';
import { detectColumnMappings } from './columnDetector';

export interface ParseResult {
  fileName: string;
  fileType: 'xlsx' | 'csv' | 'json';
  headers: string[];
  rawRows: Record<string, any>[];
  mapping: ColumnMapping;
  detectedCount: number;
  scenes: StoryboardScene[];
  totalRawRows: number;
  truncated: boolean;
}

export function parseRowsToScenes(
  rawRows: Record<string, any>[],
  mapping: ColumnMapping,
  maxScenes: number = 75
): { scenes: StoryboardScene[]; truncated: boolean } {
  const truncated = rawRows.length > maxScenes;
  const rowsToProcess = rawRows.slice(0, maxScenes);

  const scenes: StoryboardScene[] = rowsToProcess.map((row, index) => {
    const sceneNumber = mapping.sceneNumber && row[mapping.sceneNumber] !== undefined
      ? String(row[mapping.sceneNumber]).trim()
      : String(index + 1);

    const sceneTitle = mapping.sceneTitle && row[mapping.sceneTitle] !== undefined
      ? String(row[mapping.sceneTitle]).trim()
      : '';

    const startTime = mapping.startTime && row[mapping.startTime] !== undefined
      ? String(row[mapping.startTime]).trim()
      : '';

    const endTime = mapping.endTime && row[mapping.endTime] !== undefined
      ? String(row[mapping.endTime]).trim()
      : '';

    const narration = mapping.narration && row[mapping.narration] !== undefined
      ? String(row[mapping.narration]).trim()
      : '';

    const imagePrompt = mapping.imagePrompt && row[mapping.imagePrompt] !== undefined
      ? String(row[mapping.imagePrompt]).trim()
      : '';

    const videoPrompt = mapping.videoPrompt && row[mapping.videoPrompt] !== undefined
      ? String(row[mapping.videoPrompt]).trim()
      : '';

    const suggestedUse = mapping.suggestedUse && row[mapping.suggestedUse] !== undefined
      ? String(row[mapping.suggestedUse]).trim()
      : '';

    // Check if imported row already had status
    const imageStatus = (row['Image Status'] || row['image_status'] || (imagePrompt ? 'ready' : 'pending')) as any;
    const videoStatus = (row['Video Status'] || row['video_status'] || (videoPrompt ? 'ready' : 'pending')) as any;

    return {
      id: `scene_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      sceneNumber,
      sceneTitle,
      startTime,
      endTime,
      narration,
      imagePrompt,
      videoPrompt,
      suggestedUse,
      imageStatus: ['pending', 'ready', 'completed', 'failed'].includes(imageStatus) ? imageStatus : (imagePrompt ? 'ready' : 'pending'),
      videoStatus: ['pending', 'ready', 'completed', 'failed'].includes(videoStatus) ? videoStatus : (videoPrompt ? 'ready' : 'pending'),
      failureReason: row['Failure Reason'] || row['failure_reason'] || undefined,
      notes: row['Notes'] || row['notes'] || undefined,
      lastUpdated: new Date().toISOString()
    };
  });

  return { scenes, truncated };
}

export async function parseCsvFile(file: File | string): Promise<ParseResult> {
  const isString = typeof file === 'string';
  const fileName = isString ? 'imported.csv' : file.name;

  return new Promise((resolve, reject) => {
    Papa.parse(file as any, {
      header: true,
      skipEmptyLines: false, // Do not silently discard empty rows!
      complete: (results) => {
        try {
          const rawRows = results.data as Record<string, any>[];
          const headers = results.meta.fields || (rawRows.length > 0 ? Object.keys(rawRows[0]) : []);
          
          const { mapping, detectedCount } = detectColumnMappings(headers);
          const { scenes, truncated } = parseRowsToScenes(rawRows, mapping, 75);

          resolve({
            fileName,
            fileType: 'csv',
            headers,
            rawRows,
            mapping,
            detectedCount,
            scenes,
            totalRawRows: rawRows.length,
            truncated
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export async function parseExcelFile(file: File | ArrayBuffer): Promise<ParseResult> {
  let arrayBuffer: ArrayBuffer;
  let fileName = 'storyboard.xlsx';

  if (file instanceof File) {
    fileName = file.name;
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
  }

  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('Excel workbook contains no sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Parse with raw strings to keep empty rows preserved
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    defval: '',
    blankrows: true
  });

  // Extract headers from top row or sheet_to_json keys
  let headers: string[] = [];
  if (rawRows.length > 0) {
    headers = Object.keys(rawRows[0]);
  } else {
    // If empty rows, try reading header range
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
      if (cell && cell.v) headers.push(String(cell.v));
    }
  }

  const { mapping, detectedCount } = detectColumnMappings(headers);
  const { scenes, truncated } = parseRowsToScenes(rawRows, mapping, 75);

  return {
    fileName,
    fileType: 'xlsx',
    headers,
    rawRows,
    mapping,
    detectedCount,
    scenes,
    totalRawRows: rawRows.length,
    truncated
  };
}

export function parseJsonProject(jsonString: string): StoryboardProject {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.scenes)) {
    throw new Error('Invalid Flow Bulk Studio project JSON file.');
  }
  return parsed as StoryboardProject;
}
