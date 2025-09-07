export type ExportEvent =
  | { type: 'export_started'; source: 'board' | 'inspector'; boardId?: string }
  | { type: 'export_completed'; source: 'board' | 'inspector'; boardId?: string; draftId: string }
  | { type: 'export_failed'; source: 'board' | 'inspector'; boardId?: string; error: string };

export function emitExportEvent(event: ExportEvent) {
  try {
  // Minimal stub: log and dispatch a custom event for potential listeners
  // In real telemetry, integrate with analytics pipeline
    console.info('[Telemetry]', event);
    window.dispatchEvent(new CustomEvent('intelAnalyzer.telemetry', { detail: event }));
  } catch {
    // ignore
  }
}
