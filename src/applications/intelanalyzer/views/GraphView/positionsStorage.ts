// Analyzer GraphView — Layout positions storage (v1)
// Key: analyzer:graph:v1:${workspaceHash}:positions

export interface LayoutMap { [nodeId: string]: { x: number; y: number } }

export function positionsKey(workspaceHash: string) {
  return `analyzer:graph:v1:${workspaceHash}:positions`;
}

export function loadPositions(workspaceHash: string): LayoutMap | null {
  try {
    const raw = localStorage.getItem(positionsKey(workspaceHash));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LayoutMap;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (e) {
    console.warn('positionsStorage.loadPositions failed', e);
    return null;
  }
}

export function savePositions(workspaceHash: string, map: LayoutMap) {
  try {
    localStorage.setItem(positionsKey(workspaceHash), JSON.stringify(map));
  } catch (e) {
    console.warn('positionsStorage.savePositions failed', e);
  }
}

export function clearPositions(workspaceHash: string) {
  try {
    localStorage.removeItem(positionsKey(workspaceHash));
  } catch (e) {
    console.warn('positionsStorage.clearPositions failed', e);
  }
}
