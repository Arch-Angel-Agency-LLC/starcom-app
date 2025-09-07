import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Button,
  Box,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import { intelReportService } from '../../../services/intel/IntelReportService';
import { composeInputFromDraft } from '../../../services/exchange/adapters/reportToCompose';
import { packageComposer } from '../../../services/exchange/PackageComposer';
import type { ComposeInput, ComposeResult, LicenseType } from '../../../services/exchange/types';
import { publishAdapter } from '../../../services/exchange/PublishAdapter';
import { emitComposeEvent } from '../../../services/exchange/telemetry';

type Props = {
  open: boolean;
  onClose: () => void;
  onPublished?: (res: { id: string; url?: string }) => void;
};

const steps = ['Source', 'Metadata', 'Redaction', 'Review', 'Publish'];

const classifications: Array<'UNCLASSIFIED' | 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET'> = [
  'UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'
];

const licenses: LicenseType[] = ['CC-BY', 'CC0', 'PROPRIETARY', 'OPEN'];

export const ComposerWizard: React.FC<Props> = ({ open, onClose, onPublished }) => {
  const [activeStep, setActiveStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reportSummary, setReportSummary] = React.useState<{ id: string; title: string } | null>(null);
  const [sourceOption, setSourceOption] = React.useState<'draft' | 'boardPins' | 'manual'>('draft');
  const [manualItems, setManualItems] = React.useState<Array<{ id: string; title: string; content: string }>>([]);
  const [manualDraft, setManualDraft] = React.useState<{ id: string; title: string; content: string }>({ id: '', title: '', content: '' });
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [license, setLicense] = React.useState<LicenseType>('OPEN');
  const [classification, setClassification] = React.useState<typeof classifications[number]>('UNCLASSIFIED');
  const [stripDeepLink, setStripDeepLink] = React.useState(false);
  const [maskEmails, setMaskEmails] = React.useState(true);
  const [maskNumbers, setMaskNumbers] = React.useState(false);
  const [signEnabled, setSignEnabled] = React.useState(false);
  const [privateKeyHex, setPrivateKeyHex] = React.useState('');
  const isValidHex = (s: string) => /^[0-9a-fA-F]+$/.test(s);
  const isValidEd25519PrivHex = (s: string) => {
    const t = s.trim();
    if (!isValidHex(t)) return false;
    return t.length === 64 || t.length === 128;
  };
  const signingInvalid = signEnabled && !isValidEd25519PrivHex(privateKeyHex);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        // Preload latest draft info for default view
  if (sourceOption === 'draft') {
          const params = new URLSearchParams(window.location.search);
          let draftId = params.get('draft');
          let report = draftId ? await intelReportService.getReport(draftId) : null;
          if (!report) {
            const reports = await intelReportService.listReports();
            if (!reports.length) throw new Error('No drafts or reports found. Export a draft from Analyzer first.');
            const sorted = [...reports].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
            report = sorted.find(r => r.status === 'DRAFT') || sorted[0];
            draftId = report.id;
          }
          if (cancelled) return;
          setReportSummary({ id: report.id, title: report.title });
          setName(report.title);
          setDescription(report.summary || 'Draft exported from IntelAnalyzer');
          setClassification(report.classification as typeof classifications[number]);
  } else if (sourceOption === 'boardPins') {
          // board pins path: set neutral defaults; we’ll finalize at publish
          setReportSummary(null);
          setName('Package from Board Pins');
          setDescription('Evidence pinned on the active board');
        } else {
          // manual path defaults
          setReportSummary(null);
          setName('Custom Package');
          setDescription('Manually curated evidence items');
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, [open, sourceOption]);

  const handleNext = () => setActiveStep(s => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep(s => Math.max(s - 1, 0));

  type LocalBoard = { id: string; name: string; savedAt: number; state?: { pins?: Array<{ id: string; title?: string; type?: string }> } };
  const loadActiveBoard = (): LocalBoard | null => {
    try {
      const raw = localStorage.getItem('intelAnalyzer.boards');
      if (!raw) return null;
      const boards: LocalBoard[] = JSON.parse(raw);
      if (!boards || boards.length === 0) return null;
      const params = new URLSearchParams(window.location.search);
      const boardId = params.get('board');
      if (boardId) {
        const match = boards.find(b => b.id === boardId);
        if (match) return match;
      }
      // fallback to most recently saved
      return [...boards].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0] || null;
    } catch {
      return null;
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    try {
      emitComposeEvent({ type: 'compose_started', timestamp: new Date().toISOString() });
      let input: ComposeInput;
      if (sourceOption === 'boardPins') {
        const board = loadActiveBoard();
        if (!board) throw new Error('No boards found in local storage. Save a board in IntelAnalyzer first.');
        const pins = board.state?.pins || [];
        if (pins.length === 0) throw new Error('Active board has no pinned items.');
        input = {
          name: name || `Board Pins — ${board.name}`,
          description: description || `Pinned evidence from board ${board.name}`,
          classification,
          license,
          author: 'Analyst',
          reports: [],
          intel: pins.map(p => ({ id: p.id, title: p.title ?? p.id, content: `Pinned (${p.type ?? 'item'}): ${p.title ?? p.id}` })),
          assets: [],
        };
      } else if (sourceOption === 'manual') {
        if (manualItems.length === 0) throw new Error('Add at least one manual item before publishing.');
        input = {
          name: name || 'Custom Package',
          description: description || 'Manually curated evidence items',
          classification,
          license,
          author: 'Analyst',
          reports: [],
          intel: manualItems.map(mi => ({ id: mi.id, title: mi.title, content: mi.content })),
          assets: [],
        };
      } else {
        const params = new URLSearchParams(window.location.search);
        const draftId = params.get('draft');
        let report = draftId ? await intelReportService.getReport(draftId) : null;
        if (!report) {
          const reports = await intelReportService.listReports();
          if (!reports.length) throw new Error('No drafts or reports found.');
          const sorted = [...reports].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          report = sorted.find(r => r.status === 'DRAFT') || sorted[0];
        }
        input = composeInputFromDraft(report);
      }
      input.name = name || input.name;
      input.description = description || input.description;
      input.license = license;
      input.classification = classification;
      const t0 = performance.now();
  input.redaction = { stripDeepLink, maskEmails, maskNumbers };
  if (signEnabled && privateKeyHex.trim()) {
    input.signing = { enabled: true, privateKeyHex: privateKeyHex.trim() };
  }
  const { manifest, blob } = await packageComposer.composeZip(input);
      emitComposeEvent({ type: 'compose_validated', timestamp: new Date().toISOString(), manifestId: manifest.id, sizes: { assets: manifest.assets.length, blobBytes: blob.size } });
      const res = await publishAdapter.publish({ manifest, blob } as ComposeResult);
      emitComposeEvent({ type: 'compose_published', timestamp: new Date().toISOString(), manifestId: manifest.id, durationMs: performance.now() - t0 });
      onPublished?.(res);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
  const msg = e instanceof Error ? e.message : String(e);
  emitComposeEvent({ type: 'compose_failed', timestamp: new Date().toISOString(), error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Exchange Composer</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 2 }}>
          {steps.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Working…</Typography>
          </Box>
        )}

        {activeStep === 0 && (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>Source</Typography>
            <Box sx={{ display: 'grid', gap: 1, mb: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" name="source" value="draft" checked={sourceOption === 'draft'} onChange={() => setSourceOption('draft')} />
                Use current/latest Draft
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" name="source" value="boardPins" checked={sourceOption === 'boardPins'} onChange={() => setSourceOption('boardPins')} />
                Use active Board pins (from IntelAnalyzer)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" name="source" value="manual" checked={sourceOption === 'manual'} onChange={() => setSourceOption('manual')} />
                Manual pick list (add items)
              </label>
            </Box>
            {reportSummary ? (
              <Alert severity="info">Using draft/report: {reportSummary.title} ({reportSummary.id})</Alert>
            ) : (
              <Alert severity="info">When using Board pins, name/description will apply to pinned items. Manual mode lets you add custom items below.</Alert>
            )}
            {sourceOption === 'manual' && (
              <Box sx={{ display: 'grid', gap: 1, mt: 2 }}>
                <TextField label="Item ID" value={manualDraft.id} onChange={e => setManualDraft(d => ({ ...d, id: e.target.value }))} fullWidth />
                <TextField label="Title" value={manualDraft.title} onChange={e => setManualDraft(d => ({ ...d, title: e.target.value }))} fullWidth />
                <TextField label="Content" value={manualDraft.content} onChange={e => setManualDraft(d => ({ ...d, content: e.target.value }))} fullWidth multiline minRows={2} />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button variant="outlined" onClick={() => {
                    if (!manualDraft.id.trim() || !manualDraft.content.trim()) {
                      setError('Manual item requires at least an ID and Content.');
                      return;
                    }
                    setManualItems(items => [...items, { id: manualDraft.id.trim(), title: manualDraft.title.trim() || manualDraft.id.trim(), content: manualDraft.content }]);
                    setManualDraft({ id: '', title: '', content: '' });
                  }}>Add item</Button>
                  <Typography variant="body2">{manualItems.length} item(s) added</Typography>
                </Box>
                {manualItems.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {manualItems.map((mi, idx) => (
                      <Box key={mi.id + idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #ddd', borderRadius: 1, p: 1, mb: 1 }}>
                        <Typography variant="body2"><strong>{mi.title}</strong> — {mi.id}</Typography>
                        <Button size="small" onClick={() => setManualItems(items => items.filter((_, i) => i !== idx))}>Remove</Button>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Name" value={name} onChange={e => setName(e.target.value)} fullWidth />
            <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline minRows={3} />
            <TextField select label="License" value={license} onChange={e => setLicense(e.target.value as LicenseType)} fullWidth>
              {licenses.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
            </TextField>
            <TextField select label="Classification" value={classification} onChange={e => setClassification(e.target.value as typeof classifications[number])} fullWidth>
              {classifications.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2">Redaction Options</Typography>
            <Box sx={{ display: 'grid', gap: 1 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={stripDeepLink} onChange={e => setStripDeepLink(e.target.checked)} />
                Strip Analyzer deep link from manifest
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={maskEmails} onChange={e => setMaskEmails(e.target.checked)} />
                Mask emails in content
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={maskNumbers} onChange={e => setMaskNumbers(e.target.checked)} />
                Mask long digit sequences (&ge; 9)
              </label>
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }}>Signing (optional)</Typography>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={signEnabled} onChange={e => setSignEnabled(e.target.checked)} />
              Sign manifest with Ed25519
            </label>
            {signEnabled && (
              <TextField
                label="Private Key (hex)"
                value={privateKeyHex}
                onChange={e => setPrivateKeyHex(e.target.value)}
                fullWidth
                placeholder="ed25519 private key in hex"
                error={signingInvalid}
                helperText={signingInvalid ? 'Provide a hex key of length 64 or 128 characters' : undefined}
              />
            )}
          </Box>
        )}

        {activeStep === 3 && (
          <Box sx={{ display: 'grid', gap: 1 }}>
            <Typography variant="body2"><strong>Name:</strong> {name}</Typography>
            <Typography variant="body2"><strong>Description:</strong> {description}</Typography>
            <Typography variant="body2"><strong>License:</strong> {license}</Typography>
            <Typography variant="body2"><strong>Classification:</strong> {classification}</Typography>
            <Typography variant="body2"><strong>Redaction:</strong> stripDeepLink={String(stripDeepLink)}, maskEmails={String(maskEmails)}, maskNumbers={String(maskNumbers)}</Typography>
            <Typography variant="body2"><strong>Signing:</strong> {signEnabled ? 'Enabled' : 'Disabled'}</Typography>
            {reportSummary && <Typography variant="body2"><strong>Draft:</strong> {reportSummary.title} ({reportSummary.id})</Typography>}
          </Box>
        )}

        {activeStep === 4 && (
          <Alert severity="info">Click Publish to compose and publish the package.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
  {activeStep < steps.length - 1 && <Button variant="contained" onClick={handleNext} disabled={loading}>Next</Button>}
  {activeStep === steps.length - 1 && <Button variant="contained" onClick={handlePublish} disabled={loading || signingInvalid}>Publish</Button>}
      </DialogActions>
    </Dialog>
  );
};

export default ComposerWizard;
