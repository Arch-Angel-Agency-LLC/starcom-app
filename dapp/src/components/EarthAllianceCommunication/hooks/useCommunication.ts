import { useContext } from 'react';
import { CommunicationContext } from '../context/CommunicationContext';

// Custom hook to use the communication context
export const useCommunication = () => {
  const context = useContext(CommunicationContext);
  if (!context) {
    throw new Error('useCommunication must be used within a CommunicationProvider');
  }
  return context;
};
