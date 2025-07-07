import React from 'react';

interface Conflict {
  id: number;
  conflict_name: string;
  country: string;
  region: string;
  deaths_a: number;
  deaths_b: number;
  type_of_violence: number;
}

interface ConflictListProps {
  conflicts: Conflict[];
}

// TODO: Implement message threading and conversation organization - PRIORITY: MEDIUM
const ConflictList: React.FC<ConflictListProps> = ({ conflicts }) => (
  <div>
    <h2>Conflict List</h2>
    <ul>
      {conflicts.map(conflict => (
        <li key={conflict.id}>
          <h3>{conflict.conflict_name}</h3>
          <p>Country: {conflict.country}</p>
          <p>Region: {conflict.region}</p>
          <p>Violence Type: {conflict.type_of_violence}</p>
          <p>Deaths (Side A + Side B): {conflict.deaths_a + conflict.deaths_b}</p>
        </li>
      ))}
    </ul>
  </div>
);

export default ConflictList;