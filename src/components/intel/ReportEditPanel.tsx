import React, { useState, useMemo } from 'react';
import styles from './ReportEditPanel.module.css';
import { IntelReportUI, IntelReportStatus, IntelReportPriority } from '../../types/intel/IntelReportUI';
import { intelReportService } from '../../services/intel/IntelReportService';

interface Props {
  report: IntelReportUI | null;
  onCancel: () => void;
  onSaved: (r: IntelReportUI) => void;
  onStatusChanged: (r: IntelReportUI) => void;
}

const statusLabels: IntelReportStatus[] = ['DRAFT','SUBMITTED','REVIEWED','APPROVED','ARCHIVED'];

const ReportEditPanel: React.FC<Props> = ({ report, onCancel, onSaved, onStatusChanged }) => {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(() => (report ? { ...report } : null));

  const changed = useMemo(() => {
    if (!report || !form) return false;
    const before = {
      title: report.title,
      summary: report.summary,
      content: report.content,
      category: report.category,
      tags: report.tags,
      conclusions: report.conclusions,
      recommendations: report.recommendations,
      methodology: report.methodology,
      confidence: report.confidence,
      priority: report.priority,
      targetAudience: report.targetAudience,
      sourceIntelIds: report.sourceIntelIds,
      latitude: report.latitude,
      longitude: report.longitude
    };
    const after = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      category: form.category,
      tags: form.tags,
      conclusions: form.conclusions,
      recommendations: form.recommendations,
      methodology: form.methodology,
      confidence: form.confidence,
      priority: form.priority,
      targetAudience: form.targetAudience,
      sourceIntelIds: form.sourceIntelIds,
      latitude: form.latitude,
      longitude: form.longitude
    };
    return JSON.stringify(after) !== JSON.stringify(before);
  }, [form, report]);

  const validation = useMemo(() => {
    if (!form) return [] as string[];
    const errs: string[] = [];
    if (!form.title.trim()) errs.push('Title required');
    if (form.title.length > 200) errs.push('Title too long');
    if (!form.content.trim()) errs.push('Content required');
    if (form.content.length < 10) errs.push('Content too short');
    if (form.confidence != null && (form.confidence < 0 || form.confidence > 1)) errs.push('Confidence must be 0..1');
    if (form.latitude != null && Number.isNaN(form.latitude)) errs.push('Latitude must be a number');
    if (form.longitude != null && Number.isNaN(form.longitude)) errs.push('Longitude must be a number');
    return errs;
  }, [form]);

  const updateArrayField = (key: keyof IntelReportUI, value: string) => {
    const list = value.split(',').map(v => v.trim()).filter(Boolean);
    setForm(prev => (prev ? { ...prev, [key]: list } as IntelReportUI : prev));
  };

  const save = async () => {
    if (validation.length) { setError('Fix validation errors'); return; }
    if (!changed) { onCancel(); return; }
    setWorking(true); setError(null);
    try {
      await intelReportService.saveReport(form as IntelReportUI);
      const refreshed = await intelReportService.getReport(form.id);
      if (refreshed) onSaved(refreshed);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Save failed';
      setError(message);
    } finally { setWorking(false); }
  };

  const attemptStatusChange = async (next: IntelReportStatus) => {
    setWorking(true); setError(null);
    try {
      const updated = await intelReportService.updateStatus(form.id, next);
      if (updated) { setForm(updated); onStatusChanged(updated); }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Status change failed';
      setError(message);
    } finally { setWorking(false); }
  };

  const attemptDelete = async () => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
    setWorking(true); setError(null);
    try {
      await intelReportService.deleteReport(form.id);
      onStatusChanged({ ...form, status: form.status }); // trigger refresh externally
      onCancel();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Delete failed';
      setError(message);
    } finally { setWorking(false); }
  };

  const nextStatuses = useMemo(() => {
    if (!form) return [] as IntelReportStatus[];
    return statusLabels.filter(s => s !== form.status);
  }, [form]);

  // highlight helper
  const fieldChanged = (key: keyof IntelReportUI) => {
    if (!report || !form) return false;
    const before = report[key];
    const after = form[key];
    return changed && JSON.stringify(after) !== JSON.stringify(before);
  };

  if (!report || !form) return null;

  return (
    <div className={styles.panelRoot}>
      <div className={styles.header}>
        <h3>Edit Report</h3>
        <div className={styles.actions}>
          <button className={styles.button} onClick={onCancel}>Close</button>
        </div>
      </div>
      <div className={styles.formGrid}>
        <label style={fieldChanged('title') ? {borderLeft:'3px solid #0f6', paddingLeft:5}:undefined}>Title
          <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
        </label>
        <label style={fieldChanged('summary') ? {borderLeft:'3px solid #0f6', paddingLeft:5}:undefined}>Summary
          <textarea rows={2} value={form.summary || ''} onChange={e=>setForm({...form, summary:e.target.value, manualSummary: !!e.target.value})} />
        </label>
        <label style={fieldChanged('content') ? {borderLeft:'3px solid #0f6', paddingLeft:5}:undefined}>Content
          <textarea rows={6} value={form.content} onChange={e=>setForm({...form, content:e.target.value})} />
        </label>
        <div className={styles.row}>
          <label>Category
            <input value={form.category} onChange={e=>setForm({...form, category:e.target.value})} />
          </label>
          <label>Priority
            <select value={form.priority || 'ROUTINE'} onChange={e=>setForm({...form, priority: e.target.value as IntelReportPriority})}>
              <option value="ROUTINE">ROUTINE</option>
              <option value="PRIORITY">PRIORITY</option>
              <option value="IMMEDIATE">IMMEDIATE</option>
            </select>
          </label>
        </div>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>GEOINT Coordinates</h4>
          <div className={styles.row}>
            <label style={fieldChanged('latitude') ? {borderLeft:'3px solid #0f6', paddingLeft:5}:undefined}>Latitude
              <input
                type="number"
                step="0.0001"
                value={form.latitude ?? ''}
                onChange={e=>setForm({...form, latitude: e.target.value === '' ? undefined : parseFloat(e.target.value)})}
              />
            </label>
            <label style={fieldChanged('longitude') ? {borderLeft:'3px solid #0f6', paddingLeft:5}:undefined}>Longitude
              <input
                type="number"
                step="0.0001"
                value={form.longitude ?? ''}
                onChange={e=>setForm({...form, longitude: e.target.value === '' ? undefined : parseFloat(e.target.value)})}
              />
            </label>
          </div>
        </div>
        <div className={styles.row}>
          <label>Tags
            <input value={form.tags.join(', ')} onChange={e=>updateArrayField('tags', e.target.value)} />
          </label>
          <label>Target Audience
            <input value={(form.targetAudience||[]).join(', ')} onChange={e=>updateArrayField('targetAudience', e.target.value)} />
          </label>
        </div>
        <div className={styles.row}>
          <label>Confidence
            <input type="number" min={0} max={1} step="0.05" value={form.confidence ?? 0.5} onChange={e=>setForm({...form, confidence: parseFloat(e.target.value)})} />
          </label>
          <label>Source Intel IDs
            <input value={(form.sourceIntelIds||[]).join(', ')} onChange={e=>updateArrayField('sourceIntelIds', e.target.value)} />
          </label>
        </div>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Conclusions</h4>
          <textarea rows={2} value={(form.conclusions||[]).join('\n')} onChange={e=>setForm({...form, conclusions: e.target.value.split(/\n+/).map(l=>l.trim()).filter(Boolean)})} />
        </div>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Recommendations</h4>
          <textarea rows={2} value={(form.recommendations||[]).join('\n')} onChange={e=>setForm({...form, recommendations: e.target.value.split(/\n+/).map(l=>l.trim()).filter(Boolean)})} />
        </div>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Methodology</h4>
          <textarea rows={2} value={(form.methodology||[]).join('\n')} onChange={e=>setForm({...form, methodology: e.target.value.split(/\n+/).map(l=>l.trim()).filter(Boolean)})} />
        </div>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Status Transitions</h4>
          <div className={styles.statusRow}>
            <span className={styles.msg}>Current: {form.status}</span>
            {nextStatuses.map(s => (
              <button key={s} className={styles.button} disabled={working} onClick={()=>attemptStatusChange(s)}>{s}</button>
            ))}
          </div>
        </div>
        {validation.length>0 && <div className={styles.msg} style={{color:'#f93'}}>{validation.join(' | ')}</div>}
        {error && <div className={styles.msg} style={{color:'#f55'}}>{error}</div>}
      </div>
      <div className={styles.actions}>
        <button className={styles.button + ' danger'} disabled={working} onClick={attemptDelete}>Delete</button>
        <button className={styles.button} onClick={onCancel}>Cancel</button>
        <button className={styles.button + ' primary'} disabled={working || !changed || validation.length>0} onClick={save}>{working ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </div>
  );
};

export default ReportEditPanel;
