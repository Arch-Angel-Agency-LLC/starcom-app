import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { IntelReportOverlayMarker } from '../../../interfaces/IntelReportOverlay';
import { IntelReportPopup } from './IntelReportPopup';

interface IntelReportPopupPortalProps {
  reports: IntelReportOverlayMarker[];
  initialPubkey: string;
  onClose: () => void;
  onCloseComplete?: () => void;
  onReportChange?: (report: IntelReportOverlayMarker | null) => void;
}

export const IntelReportPopupPortal: React.FC<IntelReportPopupPortalProps> = ({
  reports,
  initialPubkey,
  onClose,
  onCloseComplete,
  onReportChange
}) => {
  const initialIndex = useMemo(() => {
    if (!reports.length) return -1;
    const foundIndex = reports.findIndex(report => report.pubkey === initialPubkey);
    return foundIndex >= 0 ? foundIndex : 0;
  }, [reports, initialPubkey]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const currentReport = reports[currentIndex] ?? null;

  useEffect(() => {
    onReportChange?.(currentReport ?? null);
  }, [currentReport, onReportChange]);

  const handleClose = useCallback(() => {
    onClose();
    onCloseComplete?.();
  }, [onClose, onCloseComplete]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev < 0) return prev;
      return Math.min(prev + 1, reports.length - 1);
    });
  }, [reports.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev < 0) return prev;
      return Math.max(prev - 1, 0);
    });
  }, []);

  useEffect(() => {
    if (!currentReport) {
      handleClose();
    }
  }, [currentReport, handleClose]);

  if (!currentReport) {
    return null;
  }

  return (
    <IntelReportPopup
      report={currentReport}
      visible={true}
      onClose={handleClose}
      onPrevious={reports.length > 1 ? handlePrevious : undefined}
      onNext={reports.length > 1 ? handleNext : undefined}
      hasPrevious={currentIndex > 0}
      hasNext={currentIndex < reports.length - 1}
    />
  );
};
