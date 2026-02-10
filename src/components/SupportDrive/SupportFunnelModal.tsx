import React, { useEffect, useRef } from 'react';
import styles from './SupportFunnelModal.module.css';

export type SupportFunnelModalProps = {
  isOpen: boolean;
  headline: string;
  subhead: string;
  disclosure: string;
  onClose: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
  onOpenNostr: () => void;
  onOpenFund: () => void;
  onLearnMore: () => void;
  onCopyInvite: () => void;
  onRequestInvite: () => void;
  fallbackLink: string | null;
  learnMoreOpen: boolean;
  learnMoreBody: string;
  copyToast: boolean;
  offline: boolean;
  disableNostr?: boolean;
  disableFund?: boolean;
  devWarning?: string | null;
  forceReducedMotion?: boolean;
};

const SupportFunnelModal: React.FC<SupportFunnelModalProps> = ({
  isOpen,
  headline,
  subhead,
  disclosure,
  onClose,
  onSnooze,
  onDismiss,
  onOpenNostr,
  onOpenFund,
  onLearnMore,
  onCopyInvite,
  onRequestInvite,
  fallbackLink,
  learnMoreOpen,
  learnMoreBody,
  copyToast,
  offline,
  disableNostr = false,
  disableFund = false,
  devWarning = null,
  forceReducedMotion = undefined,
}) => {
  const learnBodyId = 'support-learn-body';
  const modalRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const reducedMotion = forceReducedMotion ?? prefersReducedMotion;

  useEffect(() => {
    if (!isOpen) return;
    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab' && focusable && focusable.length > 0) {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    first?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={headline} data-reduced-motion={reducedMotion ? 'true' : 'false'}>
      <div className={styles.modal} ref={modalRef}>
        <div className={styles.scanlines} aria-hidden="true" />
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{headline}</h2>
            <p className={styles.subhead}>{subhead}</p>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>Earth Intelligence</span>
              <span className={styles.badge}>Uncaptured Stack</span>
              <span className={styles.badge}>Nostr Ops Ready</span>
            </div>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close support modal">
            ✕
          </button>
        </div>

        {offline && <div className={styles.offlineNotice}>Offline: links may need connectivity. You can still copy the invite.</div>}

        <div className={styles.ctaRow}>
          <button type="button" className={styles.primaryButton} onClick={onOpenNostr} disabled={disableNostr}>
            Join the Nostr Ops Channel
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onOpenFund} disabled={disableFund}>
            Fuel the Stack
          </button>
        </div>
        <ul className={styles.ctaBullets}>
          <li>Starcom runs decentralized comms, OSINT pipelines, and operatives on open networks.</li>
          <li>Nostr access is invite-gated to keep the signal clean.</li>
          <li>Funding keeps relays online and the uncaptured stack resilient.</li>
        </ul>
        <div className={styles.panelDivider} aria-hidden="true" />

        <div className={styles.secondaryActions}>
          <button type="button" className={styles.tertiaryButton} onClick={onRequestInvite}>
            Request invite
          </button>
          <button type="button" className={styles.tertiaryButton} onClick={onCopyInvite}>
            Copy invite link
          </button>
          <button type="button" className={styles.tertiaryButton} onClick={onSnooze}>
            Remind me later
          </button>
          <button type="button" className={styles.tertiaryButton} onClick={onDismiss}>
            No thanks
          </button>
        </div>

        {copyToast && (
          <div className={styles.copyToast} role="status" aria-live="polite">
            Invite copied
          </div>
        )}

        {devWarning && <div className={styles.copyToast}>{devWarning}</div>}

        {fallbackLink && (
          <a className={styles.fallbackLink} href={fallbackLink} target="_blank" rel="noreferrer">
            Pop-up blocked—open link
          </a>
        )}

        <div className={styles.disclosure}>{disclosure}</div>

        <div className={styles.learnMore} data-open={learnMoreOpen ? 'true' : 'false'}>
          <button
            type="button"
            className={styles.learnHeading}
            onClick={onLearnMore}
            aria-expanded={learnMoreOpen}
            aria-controls={learnBodyId}
          >
            <span>Why this matters</span>
            <span aria-hidden="true">{learnMoreOpen ? '−' : '+'}</span>
          </button>
          {learnMoreOpen && (
            <div className={styles.learnGlow}>
              <div className={styles.learnBody} id={learnBodyId}>
                {learnMoreBody}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportFunnelModal;
