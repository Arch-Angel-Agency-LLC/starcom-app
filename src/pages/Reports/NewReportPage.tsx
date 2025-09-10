import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { intelReportService } from '../../services/intel/IntelReportService';
import type { CreateIntelReportInput } from '../../types/intel/IntelReportUI';

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
    // Create via centralized intelReportService
    if (!teamId) return;
    const input: CreateIntelReportInput = {
      title,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      category: 'OSINT',
      classification: 'UNCLASSIFIED',
      status: 'DRAFT',
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
      summary: '',
      conclusions: [],
      recommendations: [],
      methodology: [],
      confidence: 0.5,
      priority: 'ROUTINE',
      targetAudience: [],
      sourceIntelIds: []
    };
    try {
      await intelReportService.createReport(input, teamId);
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
