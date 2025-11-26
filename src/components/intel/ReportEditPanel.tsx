import React, { useState, useMemo, useEffect } from 'react';
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

const hintContent = {
  title: {
    hover: 'Short headline for the report',
    detail: 'Provide a concise name that operators will see in lists, search results, and globe overlays.'
  },
  summary: {
    hover: 'Executive summary',
    detail: 'Use the summary to highlight key findings; it appears in condensed views and can be auto-generated when left blank.'
  },
  content: {
    hover: 'Full analytical body',
    detail: 'Capture the full narrative, supporting evidence, and analytical detail for this report. Supports markdown formatting.'
  },
  category: {
    hover: 'Operational category',
    detail: 'Classify the report for filtering and dashboards (e.g., GENERAL, CYBER, GEOINT).'
  },
  priority: {
    hover: 'Urgency level',
    detail: 'Set the urgency to control ordering, alerting, and workflow escalation.'
  },
  geoint: {
    hover: 'Geospatial anchor',
    detail: 'Latitude and longitude place this report on the CyberCommand globe and other spatial views.'
  },
  latitude: {
    hover: 'North / South coordinate',
    detail: 'Decimal degrees between -90 and 90. Positive values are north of the equator.'
  },
  longitude: {
    hover: 'East / West coordinate',
    detail: 'Decimal degrees between -180 and 180. Positive values are east of Greenwich.'
  },
  tags: {
    hover: 'Searchable keywords',
    detail: 'Comma-separated tags drive search facets and automation triggers.'
  },
  targetAudience: {
    hover: 'Intended recipients',
    detail: 'List teams or stakeholders who should act on this report (comma separated).'
  },
  confidence: {
    hover: 'Analyst confidence score',
    detail: 'Set a value between 0 and 1 to convey confidence in the findings.'
  },
  sourceIntelIds: {
    hover: 'Linked source IDs',
    detail: 'Reference related source intel or collection IDs to maintain provenance.'
  },
  conclusions: {
    hover: 'Key takeaways',
    detail: 'Capture concise conclusions, one per line, to summarise analytical outcomes.'
  },
  recommendations: {
    hover: 'Actionable steps',
    detail: 'List recommended actions or mitigations derived from the analysis (one per line).'
  },
  methodology: {
    hover: 'How the analysis was produced',
    detail: 'Document methods, data sources, and analytical frameworks used to reach the findings.'
  },
  statusTransitions: {
    hover: 'Workflow controls',
    detail: 'Advance the report through review states. Only valid forward transitions are enabled here.'
  }
} as const;

type HintKey = keyof typeof hintContent;

const ReportEditPanel: React.FC<Props> = ({ report, onCancel, onSaved, onStatusChanged }) => {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<IntelReportUI | null>(() => (report ? { ...report } : null));
  const [activeHint, setActiveHint] = useState<HintKey | null>(null);

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

  useEffect(() => {
    if (!activeHint) return;
    const handleClick = () => setActiveHint(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [activeHint]);

  const InfoHint: React.FC<{ id: HintKey }> = ({ id }) => {
    const info = hintContent[id];
    const isOpen = activeHint === id;

    if (!info) return null;

    return (
      <span className={styles.infoWrapper}>
        <button
          type="button"
          className={styles.infoIcon}
          title={info.hover}
          aria-label={`${info.hover} (help)`}
          onClick={(event) => {
            event.stopPropagation();
            setActiveHint(isOpen ? null : id);
          }}
        >
          ?
        </button>
        {isOpen && (
          <div
            className={styles.infoPopover}
            role="tooltip"
            aria-live="polite"
            onClick={(event) => event.stopPropagation()}
          >
            <p>{info.detail}</p>
            <button
              type="button"
              className={styles.closePopover}
              onClick={(event) => {
                event.stopPropagation();
                setActiveHint(null);
              }}
            >
              Got it
            </button>
          </div>
        )}
      </span>
    );
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
        <label style={fieldChanged('title') ? {borderLeft:'3px solid #0f6', paddingLeft:5}:undefined}>
          <span className={styles.labelHeader}>Title <InfoHint id="title" /></span>
          <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
        </label>
        <label style={fieldChanged('summary') ? {borderLeft:'3px solid #0f6', paddingLeft:5}:undefined}>
          <span className={styles.labelHeader}>Summary <InfoHint id="summary" /></span>
          <textarea rows={2} value={form.summary || ''} onChange={e=>setForm({...form, summary:e.target.value, manualSummary: !!e.target.value})} />
        </label>
        <label style={fieldChanged('content') ? {borderLeft:'3px solid #0f6', paddingLeft:5}:undefined}>
          <span className={styles.labelHeader}>Content <InfoHint id="content" /></span>
          <textarea rows={6} value={form.content} onChange={e=>setForm({...form, content:e.target.value})} />
        </label>
        <div className={styles.row}>
          <label>
            <span className={styles.labelHeader}>Category <InfoHint id="category" /></span>
            <input value={form.category} onChange={e=>setForm({...form, category:e.target.value})} />
          </label>
          <label>
            <span className={styles.labelHeader}>Priority <InfoHint id="priority" /></span>
            <select value={form.priority || 'ROUTINE'} onChange={e=>setForm({...form, priority: e.target.value as IntelReportPriority})}>
              <option value="ROUTINE">ROUTINE</option>
              <option value="PRIORITY">PRIORITY</option>
              <option value="IMMEDIATE">IMMEDIATE</option>
            </select>
          </label>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionHeading}>
            <h4 className={styles.sectionTitle}>GEOINT Coordinates</h4>
            <InfoHint id="geoint" />
          </div>
          <div className={styles.row}>
            <label style={fieldChanged('latitude') ? {borderLeft:'3px solid #0f6', paddingLeft:5}:undefined}>
              <span className={styles.labelHeader}>Latitude <InfoHint id="latitude" /></span>
              <input
                type="number"
                step="0.0001"
                value={form.latitude ?? ''}
                onChange={e=>setForm({...form, latitude: e.target.value === '' ? undefined : parseFloat(e.target.value)})}
              />
            </label>
            <label style={fieldChanged('longitude') ? {borderLeft:'3px solid #0f6', paddingLeft:5}:undefined}>
              <span className={styles.labelHeader}>Longitude <InfoHint id="longitude" /></span>
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
          <label>
            <span className={styles.labelHeader}>Tags <InfoHint id="tags" /></span>
            <input value={form.tags.join(', ')} onChange={e=>updateArrayField('tags', e.target.value)} />
          </label>
          <label>
            <span className={styles.labelHeader}>Target Audience <InfoHint id="targetAudience" /></span>
            <input value={(form.targetAudience||[]).join(', ')} onChange={e=>updateArrayField('targetAudience', e.target.value)} />
          </label>
        </div>
        <div className={styles.row}>
          <label>
            <span className={styles.labelHeader}>Confidence <InfoHint id="confidence" /></span>
            <input type="number" min={0} max={1} step="0.05" value={form.confidence ?? 0.5} onChange={e=>setForm({...form, confidence: parseFloat(e.target.value)})} />
          </label>
          <label>
            <span className={styles.labelHeader}>Source Intel IDs <InfoHint id="sourceIntelIds" /></span>
            <input value={(form.sourceIntelIds||[]).join(', ')} onChange={e=>updateArrayField('sourceIntelIds', e.target.value)} />
          </label>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionHeading}>
            <h4 className={styles.sectionTitle}>Conclusions</h4>
            <InfoHint id="conclusions" />
          </div>
          <textarea rows={2} value={(form.conclusions||[]).join('\n')} onChange={e=>setForm({...form, conclusions: e.target.value.split(/\n+/).map(l=>l.trim()).filter(Boolean)})} />
        </div>
        <div className={styles.section}>
          <div className={styles.sectionHeading}>
            <h4 className={styles.sectionTitle}>Recommendations</h4>
            <InfoHint id="recommendations" />
          </div>
          <textarea rows={2} value={(form.recommendations||[]).join('\n')} onChange={e=>setForm({...form, recommendations: e.target.value.split(/\n+/).map(l=>l.trim()).filter(Boolean)})} />
        </div>
        <div className={styles.section}>
          <div className={styles.sectionHeading}>
            <h4 className={styles.sectionTitle}>Methodology</h4>
            <InfoHint id="methodology" />
          </div>
          <textarea rows={2} value={(form.methodology||[]).join('\n')} onChange={e=>setForm({...form, methodology: e.target.value.split(/\n+/).map(l=>l.trim()).filter(Boolean)})} />
        </div>
        <div className={styles.section}>
          <div className={styles.sectionHeading}>
            <h4 className={styles.sectionTitle}>Status Transitions</h4>
            <InfoHint id="statusTransitions" />
          </div>
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
