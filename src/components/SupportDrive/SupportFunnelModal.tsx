import React, { useEffect, useRef } from 'react';
import styles from './SupportFunnelModal.module.css';
import { DiscordIcon, TelegramIcon, GitHubIcon } from './SupportSocialIcons';

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
  onOpenDiscord: () => void;
  onOpenTelegram: () => void;
  onOpenGitHub: () => void;
  fallbackLink: string | null;
  learnMoreOpen: boolean;
  learnMoreBody: React.ReactNode;
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
  onOpenDiscord,
  onOpenTelegram,
  onOpenGitHub,
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
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close support modal">
          ✕
        </button>
        <div className={styles.scanlines} aria-hidden="true" />
        <div className={styles.modalContent}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{headline}</h2>
              <p className={styles.subhead}>{subhead}</p>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>Earth Alliance</span>
                <span className={styles.badge}>Decentralized Network</span>
                <span className={styles.badge}>Mission Ready</span>
              </div>
            </div>
          </div>

          {offline && <div className={styles.offlineNotice}>Offline: links may need connectivity. You can still copy the invite.</div>}

          <div className={styles.ctaRow}>
            <button type="button" className={styles.primaryButton} onClick={onOpenNostr} disabled={disableNostr}>
              Join Coms Uplink
            </button>
            <button type="button" className={styles.secondaryButton} onClick={onOpenFund} disabled={disableFund}>
              Fund The Alliance
            </button>
          </div>
          <ul className={styles.ctaBullets}>
            <li>Starcom runs secure, independent communications, public info gathering tools, and a global network of operatives.</li>
            <li>Access to the ops channel is invite-only to keep conversations focused and protected.</li>
            <li>Your support keeps our servers running and the network strong against interference.</li>
          </ul>
          <div className={styles.panelDivider} aria-hidden="true" />

          <div className={styles.sectionLabel}>More Ways to Act</div>
          <div className={styles.secondaryActions}>
            <button type="button" className={styles.tertiaryButton} onClick={onRequestInvite}>
              <span className={styles.buttonIcon} aria-hidden="true">➤</span>
              <span><strong>Request Access</strong> to Ops</span>
            </button>
            <button type="button" className={styles.tertiaryButton} onClick={onCopyInvite}>
              <span className={styles.buttonIcon} aria-hidden="true">⇱</span>
              <span><strong>Share</strong> the Ops Channel</span>
            </button>
            <button type="button" className={styles.tertiaryButton} onClick={onSnooze}>
              <span className={styles.buttonIcon} aria-hidden="true">⧗</span>
              <span>I’ll Return When Ready</span>
            </button>
            <button type="button" className={styles.tertiaryButton} onClick={onDismiss}>
              <span className={styles.buttonIcon} aria-hidden="true">⊘</span>
              <span>Not This Time</span>
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

          <div className={styles.sectionLabel}>Join the Channels</div>
          <div className={styles.socialActions}>
            <button type="button" className={`${styles.tertiaryButton} ${styles.socialButton}`} onClick={onOpenDiscord} aria-label="Open Discord">
              <span className={styles.buttonIcon} aria-hidden="true">
                <DiscordIcon />
              </span>
            </button>
            <button type="button" className={`${styles.tertiaryButton} ${styles.socialButton}`} onClick={onOpenTelegram} aria-label="Open Telegram">
              <span className={styles.buttonIcon} aria-hidden="true">
                <TelegramIcon />
              </span>
            </button>
            <button type="button" className={`${styles.tertiaryButton} ${styles.socialButton}`} onClick={onOpenGitHub} aria-label="Open GitHub">
              <span className={styles.buttonIcon} aria-hidden="true">
                <GitHubIcon />
              </span>
            </button>
          </div>

          <div className={styles.learnMore} data-open={learnMoreOpen ? 'true' : 'false'}>
            <button
              type="button"
              className={styles.learnHeading}
              onClick={onLearnMore}
              aria-expanded={learnMoreOpen}
              aria-controls={learnBodyId}
            >
              <span className={styles.learnHeadingIcon} aria-hidden="true">{learnMoreOpen ? '−' : '+'}</span>
              <span className={styles.learnHeadingText}>Why this matters</span>
            </button>
            {learnMoreOpen && (
              <div className={styles.learnGlow}>
                <div className={styles.learnBody} id={learnBodyId}>
                  {learnMoreBody}
                  <div className={styles.learnDivider} aria-hidden="true" />
                  <div className={styles.disclosure}>{disclosure}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportFunnelModal;
