import React, { useState, useRef, useMemo } from 'react';
import { useIntelWorkspace } from '../../services/intel/IntelWorkspaceContext';
import styles from './IntelWorkspaceConsole.module.css';
import { intelWorkspaceManager } from '../../services/intel/IntelWorkspaceManager';
import { intelReportService } from '../../services/intel/IntelReportService';
import ReportDetailPanel from './ReportDetailPanel';
import ReportEditPanel from './ReportEditPanel';
import { IntelReportUI } from '../../types/intel/IntelReportUI';
import { parseReport } from '../../services/intel/serialization/intelReportSerialization';
import { validateReport } from '../../services/intel/validation/reportValidation';
import { buildIndex, search as searchReports } from '../../services/intel/search/reportSearchIndex';

// Placeholder console bringing together Reports & Intel lists side by side.
// Future: tabs, detail panel, create/edit drawers.

export const IntelWorkspaceConsole: React.FC = () => {
  const { reports, intelItems, loading } = useIntelWorkspace();
  const [view, setView] = useState<'reports' | 'intel'>('reports');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IntelReportUI | null>(null);
  const [form, setForm] = useState({
    title: '', content: '', classification: 'UNCLASSIFIED', category: 'GENERAL', tags: '', type: 'OBSERVATION', source: 'UNKNOWN', reliability: 'C', confidence: 0.5
  });
  const [creating, setCreating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResults, setImportResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStrategy, setImportStrategy] = useState<'newId'|'overwrite'|'skip'>('newId');
  const [query, setQuery] = useState('');

  const searchIndex = useMemo(()=> buildIndex(reports), [reports]);
  const filteredReports = useMemo(()=> {
    if (!query.trim()) return reports;
    const results = searchReports(searchIndex, query.trim());
    const orderMap = new Map(results.map((r,i)=> [r.id, i]));
    return reports.filter(r => orderMap.has(r.id)).sort((a,b)=> (orderMap.get(a.id)! - orderMap.get(b.id)!));
  }, [query, reports, searchIndex]);

  if (loading) return <div className={styles.loading}>Loading workspace...</div>;

  const create = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setCreating(true);
    try {
      if (isReportView) {
        const r = await intelReportService.createReport({
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category,
          tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
          classification: form.classification as any
        }, 'anonymous');
        setSelectedReport(r);
      } else {
        intelWorkspaceManager.addIntelItem({
          title: form.title.trim(),
          type: form.type,
          classification: form.classification as any,
          source: form.source,
          reliability: form.reliability as any,
          confidence: form.confidence,
          tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
          categories: form.category ? [form.category] : [],
          content: form.content.trim()
        });
      }
      setForm({ title: '', content: '', classification: 'UNCLASSIFIED', category: 'GENERAL', tags: '', type: 'OBSERVATION', source: 'UNKNOWN', reliability: 'C', confidence: 0.5 });
      setShowCreate(false);
    } finally { setCreating(false); }
  };

  const handleParseImport = () => {
    setImportResults([]);
    const trimmed = importText.trim();
    if (!trimmed) return;
    try {
      const obj = JSON.parse(trimmed);
      const { report, warnings, errors } = parseReport(obj);
      if (errors.length) {
        setImportResults([{ id: 'N/A', status: 'ERROR', errors }]);
      } else if (report) {
        const issues = validateReport(report, { mode: 'import' });
        setImportResults([{ id: report.id, status: errors.length ? 'ERROR' : (issues.some(i=>i.severity==='ERROR')?'ERROR': (issues.some(i=>i.severity==='WARN')?'WARN':'OK')), warnings: [...warnings, ...issues.filter(i=>i.severity!=='ERROR').map(i=>i.message)], errors: issues.filter(i=>i.severity==='ERROR').map(i=>i.message), report }]);
      }
    } catch (e:any) {
      setImportResults([{ id: 'N/A', status: 'ERROR', errors: ['JSON parse failure: '+e.message] }]);
    }
  };

  const handleImportCommit = async () => {
    const successful = importResults.filter(r => r.report && r.status !== 'ERROR');
    for (const r of successful) {
      await intelReportService.importReport(r.report, { strategy: importStrategy });
    }
    setShowImport(false);
    setImportText('');
    setImportResults([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(String(reader.result||''));
    };
    reader.readAsText(file);
  };

  const isReportView = view === 'reports';

  return (
    <div className={styles.consoleRoot}>
      <div className={styles.sidebar}>
        <h2>Workspace</h2>
        <button className={view==='reports'?styles.activeTab:styles.tab} onClick={()=>{setView('reports'); setShowCreate(false); setSelectedReport(null);}}>Reports ({reports.length})</button>
        <button className={view==='intel'?styles.activeTab:styles.tab} onClick={()=>{setView('intel'); setShowCreate(false); setSelectedReport(null);}}>Intel ({intelItems.length})</button>
        <button className={styles.actionButton} onClick={()=>setShowCreate(s=>!s)}>+ New {isReportView ? 'Report' : 'Intel'}</button>
        {isReportView && <button className={styles.actionButton} onClick={()=> setShowImport(true)}>Import</button>}
        {isReportView && <input className={styles.searchInput} placeholder="Search reports..." value={query} onChange={e=> setQuery(e.target.value)} />}
      </div>
      <div className={styles.withDetail}>
        <div className={styles.main + ' ' + styles.listColumn}>
          {showCreate && (
            <div className={styles.createPanel}>
              <h3>Create {isReportView ? 'Report' : 'Intel Item'}</h3>
              <div className={styles.formRow}>
                <input placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
                <select value={form.classification} onChange={e=>setForm({...form,classification:e.target.value})}>
                  <option>UNCLASSIFIED</option><option>CONFIDENTIAL</option><option>SECRET</option><option>TOP_SECRET</option>
                </select>
                <input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
              </div>
              {!isReportView && (
                <div className={styles.formRow}>
                  <input placeholder="Type" value={form.type} onChange={e=>setForm({...form,type:e.target.value})} />
                  <input placeholder="Source" value={form.source} onChange={e=>setForm({...form,source:e.target.value})} />
                  <select value={form.reliability} onChange={e=>setForm({...form,reliability:e.target.value})}>
                    <option>A</option><option>B</option><option>C</option><option>D</option><option>E</option><option>F</option>
                  </select>
                  <input type="number" step="0.05" min={0} max={1} value={form.confidence} onChange={e=>setForm({...form,confidence:parseFloat(e.target.value)})} />
                </div>
              )}
              <textarea placeholder={isReportView ? 'Report content...' : 'Intel markdown content...'} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={5} />
              <input placeholder="tags (comma separated)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
              <div className={styles.formActions}>
                <button onClick={()=>setShowCreate(false)} className={styles.cancelBtn}>Cancel</button>
                <button onClick={create} disabled={creating || !form.title.trim() || !form.content.trim()} className={styles.saveBtn}>{creating ? 'Saving...' : 'Create'}</button>
              </div>
            </div>
          )}
          {showImport && (
            <div className={styles.createPanel}>
              <h3>Import Report (.intelReport.json)</h3>
              <div className={styles.formRow}>
                <textarea rows={6} placeholder="Paste JSON here" value={importText} onChange={e=>setImportText(e.target.value)} />
              </div>
              <div className={styles.formRow}>
                <input type="file" accept="application/json" ref={fileInputRef} onChange={handleFileSelect} />
              </div>
              <div className={styles.formRow}>
                <label>Strategy: </label>
                <select value={importStrategy} onChange={e=>setImportStrategy(e.target.value as any)}>
                  <option value="newId">New ID</option>
                  <option value="overwrite">Overwrite</option>
                  <option value="skip">Skip if exists</option>
                </select>
                <button onClick={handleParseImport} disabled={!importText.trim()}>Parse</button>
              </div>
              {importResults.length>0 && (
                <div className={styles.importResults}>
                  <h4>Results</h4>
                  <ul className={styles.list}>
                    {importResults.map((r,i)=>(
                      <li key={i} className={styles.listItem}>
                        <div className={styles.itemTitle}>{r.id} - {r.status}</div>
                        {r.errors && r.errors.length>0 && <div className={styles.errorBox}>{r.errors.join('; ')}</div>}
                        {r.warnings && r.warnings.length>0 && <div className={styles.warningBox}>{r.warnings.join('; ')}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className={styles.formActions}>
                <button className={styles.cancelBtn} onClick={()=>{setShowImport(false); setImportResults([]); setImportText('');}}>Close</button>
                <button className={styles.saveBtn} disabled={!importResults.some(r=>r.report && r.status!=='ERROR')} onClick={handleImportCommit}>Import</button>
              </div>
            </div>
          )}
          {view === 'reports' && (
            <div className={styles.listSection}>
              <h3>Reports {query && <span className={styles.small}>({filteredReports.length} results)</span>}</h3>
              <ul className={styles.list}>
                {filteredReports.map(r => (
                  <li key={r.id} className={styles.listItem} onClick={()=> setSelectedReport(r)}>
                    <div className={styles.itemTitle}>{r.title}</div>
                    <div className={styles.itemMeta}>{r.status} · {r.classification} · {r.category}</div>
                  </li>
                ))}
              </ul>
              {query && filteredReports.length === 0 && <div className={styles.empty}>No matches.</div>}
            </div>
          )}
          {view === 'intel' && (
            <div className={styles.listSection}>
              <h3>Intel Items</h3>
              {intelItems.length === 0 && <div className={styles.empty}>No Intel items yet.</div>}
              <ul className={styles.list}>
                {intelItems.map(i => (
                  <li key={i.id} className={styles.listItem}>
                    <div className={styles.itemTitle}>{i.title}</div>
                    <div className={styles.itemMeta}>{i.type} · {i.classification} · {Math.round(i.confidence*100)}% conf</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {view === 'reports' && !editMode && <ReportDetailPanel report={selectedReport} onClose={()=>{setSelectedReport(null); setEditMode(false);}} onEnterEdit={()=> setEditMode(true)} />}
        {view === 'reports' && editMode && <ReportEditPanel report={selectedReport} onCancel={()=> setEditMode(false)} onSaved={(r)=>{setSelectedReport(r); setEditMode(false);}} onStatusChanged={(r)=>{setSelectedReport(r);}} />}
      </div>
    </div>
  );
};

export default IntelWorkspaceConsole;
