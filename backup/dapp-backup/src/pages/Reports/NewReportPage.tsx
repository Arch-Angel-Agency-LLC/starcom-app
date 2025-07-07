import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { anchorService } from '../../services/anchor/AnchorService';
import { IPFSContentOrchestrator } from '../../services/IPFSContentOrchestrator';

const NewReportPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [timestamp, setTimestamp] = useState('');

  const handleSubmit = async () => {
    // Minimal implementation: chain Anchor and IPFS calls
    if (!teamId) return;
    const report = {
      title,
      content,
      tags: tags.split(',').map(t => t.trim()),
      teamId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp
    };
    try {
      // Create report and upload package
      const sig = await anchorService.createIntelReport(report);
      // Use static orchestrator method to upload
      await IPFSContentOrchestrator.uploadIntelPackage({ ...report, id: sig });
      navigate(`/team/${teamId}`);
    } catch (error) {
      console.error('Report creation failed', error);
    }
  };

  return (
    <div>
      <h2>New Intel Report</h2>
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea placeholder="Content" value={content} onChange={e => setContent(e.target.value)} />
      <input placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} />
      <input placeholder="Latitude" value={latitude} onChange={e => setLatitude(e.target.value)} />
      <input placeholder="Longitude" value={longitude} onChange={e => setLongitude(e.target.value)} />
      <input placeholder="Timestamp" type="datetime-local" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default NewReportPage;
