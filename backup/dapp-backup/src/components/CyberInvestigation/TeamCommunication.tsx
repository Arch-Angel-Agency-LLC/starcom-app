import React from 'react';
import DecentralizedCollabPanel from '../Teams/DecentralizedCollabPanel';

// AI-NOTE: Team communication for cyber investigation teams
// This is now a wrapper around the DecentralizedCollabPanel component
// Fully decentralized: Gun.js + IPFS + WebRTC (no servers required)

interface TeamCommunicationProps {
  teamId: string;
  onlineStatus?: boolean; // No longer needed but kept for backward compatibility
}

const TeamCommunication: React.FC<TeamCommunicationProps> = ({
  teamId
}) => {
  return (
    <DecentralizedCollabPanel teamId={teamId} />
  );
};

export default TeamCommunication;
