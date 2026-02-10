import React, { useEffect, useMemo, useState } from 'react';
import { getSupportFunnelConfig } from '../../config/supportFunnelConfig';
import { useSupportFunnelState } from '../../hooks/useSupportFunnelState';
import { trackSupportEvent } from '../../services/supportFunnelTracking';
import { getExperimentContext } from '../../services/supportFunnelExperiments';
import SupportEntryButton from './SupportEntryButton';
import SupportFunnelModal from './SupportFunnelModal';

const HEADLINE = 'Uncaptured Intelligence. Keep the Grid Awake.';
const SUBHEAD = 'Join the Nostr ops channel. Fuel the Earth Intelligence Network. Harden the stack against capture.';
const DISCLOSURE = 'Support is processed by Arch Angel Agency LLC (for-profit). Contributions are not tax-deductible. Beneficiary: Starcom Initiative. Subject to US/WA law; no charitable tax treatment.';
const LEARN_BODY = 'Your action keeps agents resourced, relays alive, and the mission uncaptured. We are building the Earth Alliance — operatives needed now.';

const SupportFunnelRoot: React.FC = () => {
  const config = useMemo(() => getSupportFunnelConfig(), []);
  const { eligible, markImpression, markSnooze, markDismiss, markAction } = useSupportFunnelState(config);
  const { sessionId, variant } = useMemo(() => getExperimentContext(config), [config]);

  const [open, setOpen] = useState(false);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);
  const [lastImpressionAt, setLastImpressionAt] = useState<number>(0);
  const [variantExposed, setVariantExposed] = useState(false);

  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const mode = typeof import.meta !== 'undefined' ? (import.meta as any).env?.MODE : 'production';
  const isDevLike = mode !== 'production';
  const env = mode || 'production';
  const disableFund = !config.fundraiserUrl;
  const disableNostr = !config.nostrUrl;
  const devWarning = isDevLike && (disableFund || disableNostr)
    ? 'Support funnel URLs missing: check VITE_SUPPORT_FUNNEL_FUND_URL / VITE_SUPPORT_FUNNEL_NOSTR_URL.'
    : null;

  useEffect(() => {
    if (eligible && !sessionClosed && !open) {
      setOpen(true);
    }
  }, [eligible, sessionClosed, open]);

  useEffect(() => {
    if (!open) return;
    const nowTs = Date.now();
    if (nowTs - lastImpressionAt < 3000) return;
    setLastImpressionAt(nowTs);
    markImpression();
    trackSupportEvent({ event: 'funnel_impression', variant, sessionId, env });
    if (!variantExposed && variant) {
      trackSupportEvent({ event: 'variant_exposure', variant, sessionId, env });
      setVariantExposed(true);
    }
  }, [env, lastImpressionAt, markImpression, open, sessionId, variant, variantExposed]);

  const handleClose = () => {
    setOpen(false);
    setSessionClosed(true);
    setFallbackLink(null);
    markAction('close');
    trackSupportEvent({ event: 'action_dismiss', target: 'dismiss', variant, sessionId, env });
  };

  const handleSnooze = () => {
    markSnooze();
    setOpen(false);
    setSessionClosed(true);
    setFallbackLink(null);
    trackSupportEvent({ event: 'action_snooze', target: 'snooze', variant, sessionId, env });
  };

  const handleDismiss = () => {
    markDismiss();
    setOpen(false);
    setSessionClosed(true);
    setFallbackLink(null);
    trackSupportEvent({ event: 'action_dismiss', target: 'dismiss', variant, sessionId, env });
  };

  const openWindow = (url: string, target: 'nostr' | 'fund') => {
    const win = window.open(url, '_blank', 'noopener');
    const blocked = !win || win.closed;
    if (blocked) {
      setFallbackLink(url);
      trackSupportEvent({ event: 'fallback_open_link', target, variant, sessionId, env, reason: 'popup_blocked' });
    } else {
      setFallbackLink(null);
    }
  };

  const handleOpenNostr = () => {
    markAction('nostr');
    trackSupportEvent({ event: 'cta_nostr_click', target: 'nostr', variant, sessionId, env });
    openWindow(config.nostrUrl, 'nostr');
    setOpen(false);
    setSessionClosed(true);
  };

  const handleOpenFund = () => {
    markAction('fund');
    trackSupportEvent({ event: 'cta_fund_click', target: 'fund', variant, sessionId, env });
    openWindow(config.fundraiserUrl, 'fund');
    setOpen(false);
    setSessionClosed(true);
  };

  const handleLearnMore = () => {
    setLearnOpen(prev => !prev);
    trackSupportEvent({ event: 'cta_learn_more', target: 'learn', variant, sessionId, env });
    markAction('learn');
  };

  const handleRequestInvite = () => {
    setLearnOpen(true);
    trackSupportEvent({ event: 'cta_request_invite', target: 'request_invite', variant, sessionId, env });
    markAction('request_invite');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(config.inviteCopy);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 1800);
      trackSupportEvent({ event: 'copy_invite', target: 'copy', variant, sessionId, env });
      markAction('copy');
    } catch (_err) {
      // Swallow; user can still use fallback link if present
    }
  };

  const handleEntryOpen = () => {
    setSessionClosed(false);
    setOpen(true);
    setFallbackLink(null);
    trackSupportEvent({ event: 'entry_open', target: 'entry', variant, sessionId, env });
  };

  // If feature disabled, render nothing
  if (!config.enabled) {
    return null;
  }

  return (
    <>
      <SupportEntryButton onOpen={handleEntryOpen} />
      <SupportFunnelModal
        isOpen={open}
        headline={HEADLINE}
        subhead={SUBHEAD}
        disclosure={DISCLOSURE}
        onClose={handleClose}
        onSnooze={handleSnooze}
        onDismiss={handleDismiss}
        onOpenNostr={handleOpenNostr}
        onOpenFund={handleOpenFund}
        onLearnMore={handleLearnMore}
        onCopyInvite={handleCopy}
        onRequestInvite={handleRequestInvite}
        fallbackLink={fallbackLink}
        learnMoreOpen={learnOpen}
        learnMoreBody={LEARN_BODY}
        copyToast={copyToast}
        offline={offline}
        disableFund={disableFund}
        disableNostr={disableNostr}
        devWarning={devWarning}
      />
    </>
  );
};

export default SupportFunnelRoot;
