// Main component
export { EarthAllianceCommunicationPanel } from './components/EarthAllianceCommunicationPanel';

// Context and hooks
export { CommunicationProvider } from './context/CommunicationProvider';
export { useCommunication } from './hooks/useCommunication';
export type { CommunicationContextType } from './context/CommunicationContext';

// Individual components (export for testing or direct usage)
export { ChannelSelector } from './components/ChannelSelector';
export { MessageDisplay } from './components/MessageDisplay';
export { MessageComposer } from './components/MessageComposer';
export { ErrorBoundary } from './ErrorBoundary';
