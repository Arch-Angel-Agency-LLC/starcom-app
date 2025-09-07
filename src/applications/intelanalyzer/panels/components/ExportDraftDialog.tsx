import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControlLabel, Checkbox, MenuItem } from '@mui/material';
import type { IntelClassification } from '../../../../types/intel/IntelReportUI';

export interface ExportDraftConfig {
  title: string;
  classification: IntelClassification;
  includeFilters: boolean;
  includeWatchlists: boolean;
  redactSensitive: boolean;
}

export const ExportDraftDialog: React.FC<{
  open: boolean;
  initialTitle: string;
  boardId?: string;
  onClose: () => void;
  onConfirm: (cfg: ExportDraftConfig) => void;
}> = ({ open, initialTitle, boardId, onClose, onConfirm }) => {
  const [title, setTitle] = React.useState(initialTitle || 'Draft Report');
  const [classification, setClassification] = React.useState<IntelClassification>('UNCLASSIFIED');
  const [includeFilters, setIncludeFilters] = React.useState(true);
  const [includeWatchlists, setIncludeWatchlists] = React.useState(true);
  const [redactSensitive, setRedactSensitive] = React.useState(false);

  React.useEffect(() => { setTitle(initialTitle || 'Draft Report'); }, [initialTitle]);

  // Autosave last used config per board
  const STORAGE_KEY = 'intelAnalyzer.exportConfig.v1';
  React.useEffect(() => {
    if (!boardId) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const all = JSON.parse(raw) as Record<string, ExportDraftConfig>;
      const cfg = all[boardId];
      if (cfg) {
        setClassification(cfg.classification);
        setIncludeFilters(!!cfg.includeFilters);
        setIncludeWatchlists(!!cfg.includeWatchlists);
        setRedactSensitive(!!cfg.redactSensitive);
      }
    } catch {/* ignore */}
  }, [boardId]);

  const persist = (cfg: ExportDraftConfig) => {
    if (!boardId) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const all: Record<string, ExportDraftConfig> = raw ? JSON.parse(raw) : {};
      all[boardId] = cfg;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {/* ignore */}
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export to Draft</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Title"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          select
          margin="dense"
          label="Classification"
          value={classification}
          onChange={(e) => setClassification(e.target.value as IntelClassification)}
          fullWidth
        >
          {(['UNCLASSIFIED','CONFIDENTIAL','SECRET','TOP_SECRET'] as IntelClassification[]).map(c => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>
        <FormControlLabel control={<Checkbox checked={includeFilters} onChange={(e) => setIncludeFilters(e.target.checked)} />} label="Include active filters" />
        <FormControlLabel control={<Checkbox checked={includeWatchlists} onChange={(e) => setIncludeWatchlists(e.target.checked)} />} label="Include watchlists" />
        <FormControlLabel control={<Checkbox checked={redactSensitive} onChange={(e) => setRedactSensitive(e.target.checked)} />} label="Redact sensitive (entities)" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
  <Button variant="contained" onClick={() => { const cfg = { title: title.trim() || 'Draft Report', classification, includeFilters, includeWatchlists, redactSensitive }; persist(cfg); onConfirm(cfg); }}>Export</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDraftDialog;
