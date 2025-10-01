import React from 'react';
import styles from './ReportDetailPanel.module.css';
import { IntelReportUI } from '../../types/intel/IntelReportUI';
import { serializeReport } from '../../services/intel/serialization/intelReportSerialization';

interface Props {
  report: IntelReportUI | null;
  onClose: () => void;
  onEnterEdit: () => void;
}

const ReportDetailPanel: React.FC<Props> = ({ report, onClose, onEnterEdit }) => {
  if (!report) return null;

  const handleExport = () => {
    if (!report) return;
    const serialized = serializeReport(report);
    const blob = new Blob([JSON.stringify(serialized, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `report-${report.id}-v${report.version || 1}.intelReport.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 100);
  };

  return (
    <div className={styles.panelRoot}>
      <div className={styles.header}>
        <h3 className={styles.title}>{report.title}</h3>
        <div className={styles.actions}>
          <button className={styles.button} onClick={handleExport}>Export</button>
          <button className={styles.button} onClick={onEnterEdit}>Edit</button>
          <button className={styles.button} onClick={onClose}>×</button>
        </div>
      </div>
      <div className={styles.metaRow}>
        <span className={`${styles.badge} status-${report.status}`}>{report.status}</span>
        {report.priority && <span className={`${styles.badge} priority-${report.priority}`}>{report.priority}</span>}
        <span className={styles.badge}>v{report.version || 1}</span>
      </div>
      {report.tags && report.tags.length>0 && (
        <div className={styles.tagRow}>
          {report.tags.map(t=> <span key={t} className={styles.tag}>{t}</span>)}
        </div>
      )}
      {report.summary && (
        <div className={styles.section}>
          <h4>Summary</h4>
          <div className={styles.contentBox}>{report.summary}</div>
        </div>
      )}
      <div className={styles.section}>
        <h4>Content</h4>
        <div className={styles.contentBox}>{report.content}</div>
      </div>
      {report.conclusions && report.conclusions.length>0 && (
        <div className={styles.section}>
          <h4>Conclusions</h4>
          <ul className={styles.list}>{report.conclusions.map((c,i)=><li key={i}>{c}</li>)}</ul>
        </div>
      )}
      {report.recommendations && report.recommendations.length>0 && (
        <div className={styles.section}>
          <h4>Recommendations</h4>
          <ul className={styles.list}>{report.recommendations.map((r,i)=><li key={i}>{r}</li>)}</ul>
        </div>
      )}
      <div className={styles.section}>
        <h4>Metadata</h4>
        <div className={styles.small}>Author: {report.author}</div>
        <div className={styles.small}>Category: {report.category}</div>
        {report.latitude !== undefined && report.longitude !== undefined && (
          <div className={styles.small}>Location: {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</div>
        )}
        {report.confidence !== undefined && <div className={styles.small}>Confidence: {Math.round((report.confidence||0)*100)}%</div>}
        {report.targetAudience && report.targetAudience.length>0 && <div className={styles.small}>Audience: {report.targetAudience.join(', ')}</div>}
        <div className={styles.small}>Created: {report.createdAt.toLocaleString()}</div>
        <div className={styles.small}>Updated: {report.updatedAt.toLocaleString()}</div>
      </div>
      {report.history && report.history.length>0 && (
        <div className={styles.section}>
          <h4>History</h4>
          <ul className={styles.list}>
            {report.history.slice().reverse().map((h,i)=>(
              <li key={i}>{h.action} {h.fromStatus && ' '+h.fromStatus+'→'+h.toStatus} <span className={styles.small}>@ {new Date(h.timestamp).toLocaleString()}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReportDetailPanel;
