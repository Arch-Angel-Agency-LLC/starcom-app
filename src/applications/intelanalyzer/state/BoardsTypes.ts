import type { FilterState } from './FilterContext';
import type { SelectionItem } from './SelectionContext';

export type WorkbenchView = 'timeline' | 'map' | 'graph' | 'table';

export type PinnedItem = { id: string; type: SelectionItem['type']; title?: string };

export interface BoardState {
  id: string;
  name: string;
  savedAt: number;
  state: {
    view: WorkbenchView;
    filters: FilterState;
    selection: Pick<SelectionItem, 'id' | 'type'> | null;
    layout?: { leftRailWidth?: number };
    notes?: string;
    pins?: PinnedItem[];
  watch?: { entities: string[]; tags: string[] };
  };
}
