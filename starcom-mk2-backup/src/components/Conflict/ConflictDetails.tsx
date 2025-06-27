import React from 'react';

interface ConflictDetailsProps {
  conflict: {
    id: number;
    conflict_name: string;
    country: string;
    region: string;
    type_of_violence: number;
    deaths_a: number;
    deaths_b: number;
    deaths_civilians: number;
    date_start: string;
    date_end: string;
  };
}

const ConflictDetails: React.FC<ConflictDetailsProps> = ({ conflict }) => (
  <div>
    <h2>Conflict Details: {conflict.conflict_name}</h2>
    <p>Country: {conflict.country}</p>
    <p>Region: {conflict.region}</p>
    <p>Type of Violence: {conflict.type_of_violence}</p>
    <p>Deaths (Side A): {conflict.deaths_a}</p>
    <p>Deaths (Side B): {conflict.deaths_b}</p>
    <p>Civilian Deaths: {conflict.deaths_civilians}</p>
    <p>Start Date: {conflict.date_start}</p>
    <p>End Date: {conflict.date_end}</p>
  </div>
);

export default ConflictDetails;