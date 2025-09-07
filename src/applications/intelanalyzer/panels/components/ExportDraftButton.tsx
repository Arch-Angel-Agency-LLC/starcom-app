import React from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useBoards } from '../../state/BoardsContext';
import ExportDraftDialog, { ExportDraftConfig } from './ExportDraftDialog';
import DraftBuilder from '../../services/DraftBuilder';
import { intelReportService } from '../../../../services/intel/IntelReportService';
import { emitExportEvent } from '../../services/telemetry';

export const ExportDraftButton: React.FC<{ source: 'board' | 'inspector' } & React.ComponentProps<typeof Button>> = ({ source, ...btnProps }) => {
  const { boards, activeBoardId } = useBoards();
  const active = boards.find(b => b.id === activeBoardId) || null;
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleConfirm = async (cfg: ExportDraftConfig) => {
    if (!active) { setOpen(false); return; }
    emitExportEvent({ type: 'export_started', source, boardId: active.id });
    try {
      const built = DraftBuilder.buildFromBoard(active, cfg);
      // Create draft in workspace
  const created = await intelReportService.createReport({
        title: built.report.title,
        content: built.report.content,
        classification: built.report.classification,
        category: built.report.category,
        tags: built.report.tags,
        status: 'DRAFT'
      }, 'ANALYST');

  // Add citation list and propagate deep-link
  const citationBlock = ['\n\n## Citations', ...built.citations.map(c => `- [${c.type}] ${c.title || c.id} (id: ${c.id}${c.timestamp ? ` @ ${c.timestamp}` : ''})`)].join('\n');
  await intelReportService.saveReport({ ...created, content: created.content + citationBlock, analysisDeepLink: built.report.analysisDeepLink });

      emitExportEvent({ type: 'export_completed', source, boardId: active.id, draftId: created.id });

      // Navigate to IntelDashboard with created draft id
  const params = new URLSearchParams();
  params.set('from', 'intelanalyzer');
  params.set('draft', created.id);
  navigate(`/intel?${params.toString()}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      emitExportEvent({ type: 'export_failed', source, boardId: active?.id || undefined, error: msg });
    } finally {
      setOpen(false);
    }
  };

  if (!active) {
    return <Button {...btnProps} disabled title="Save a board first" />;
  }

  return (
    <>
      <Button {...btnProps} onClick={() => setOpen(true)} />
      <ExportDraftDialog
        open={open}
        initialTitle={active.name}
  boardId={active.id}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </>
  );
};

export default ExportDraftButton;
