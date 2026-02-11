import React, { useEffect, useMemo, useState } from 'react';
import { getSupportFunnelConfig } from '../../config/supportFunnelConfig';
import { useSupportFunnelState } from '../../hooks/useSupportFunnelState';
import { trackSupportEvent } from '../../services/supportFunnelTracking';
import { getExperimentContext } from '../../services/supportFunnelExperiments';
import SupportEntryButton from './SupportEntryButton';
import SupportFunnelModal from './SupportFunnelModal';
import styles from './SupportFunnelModal.module.css';

const HEADLINE = 'Intelligence Reborn. Join the Starcom Initiative. Become the Spark that Ignites the Earth Intelligence Network.';
const SUBHEAD = 'Join the secure ops channel. Help build the Earth Intelligence Network. Strengthen our defenses against control.';
const DISCLOSURE = 'Contributions to Starcom are personal support for an independent open-source project. They are not tax-deductible and are not processed as charitable donations. No goods, services, or benefits are provided in exchange. Subject to U.S. law; treated as voluntary personal gifts.';
const DISCORD_URL = 'https://discord.gg/Mea5v8pQmt';
const TELEGRAM_URL = 'https://t.me/starcomintelgroup';
const GITHUB_URL = 'https://github.com/Arch-Angel-Agency-LLC/starcom-app';
const SURVEY_URL = 'https://app.formbricks.com/s/cmlhj2oar01rdti011yl3hu2u';
const LEARN_BODY = (
  <>
    <div className={styles.learnTldr}>
      Your support keeps our communications alive, our operatives resourced, and the mission completely uncaptured.<br />
      Every contribution directly strengthens the Earth Alliance we are building right now.
    </div>
    <div className={styles.learnMedium}>
      <p>Starcom is not a company or a charity — it is an independent open-source project run by people who refuse to let centralized control win.</p>
      <p>When you join the ops channel you add real eyes, real minds, and real signal to a network that cannot be shut down.</p>
      <p>When you support the network you keep the relays online, the servers running, and the intelligence pipelines protected from interference — so the operatives on the ground can keep working.</p>
      <p>This is how we turn “someone should do something” into “we are the ones doing it.”</p>
      <ul className={styles.learnBullets}>
        <li>Start the chain reaction that ends the long dark.</li>
        <li>Build the base that lets the whole alliance stand tall.</li>
        <li>Shine so others can find their way to the alliance.</li>
        <li>Lay the first stones of a network no one can shut down.</li>
      </ul>
    </div>
    <div className={styles.learnDepth}>
      <p>We are living in a rare window where the old systems of control are being exposed faster than they can adapt. Files are dropping, alliances are forming across old lines, and millions of people are waking up to the same realization: if we do not build our own uncaptured networks now, we will not get another chance.</p>
      <p>Starcom is being built right now to become one of the few truly operational, decentralized projects—running real OSINT pipelines and operative communications without asking permission.</p>
      <p>The Earth Intelligence Network exists to take back intelligence from captured institutions and place it in the hands of the people. For too long we have been at the mercy of corruption; it is time to take responsibility. This is a critical step to establishing the Earth Alliance and freeing humanity from the looming global oppression.</p>
      <p>Every dollar, every relay kept alive, every new operative who joins is a brick in a wall that the old powers cannot tear down. This is not hope. This is infrastructure for the next phase of human freedom.</p>
      <p>The Earth Alliance is not coming. It is being built — right now, by us.</p>
      <p>That is why this matters.</p>
    </div>
  </>
);

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

  const openWindow = (url: string, target: 'nostr' | 'fund' | 'discord' | 'telegram' | 'github' | 'survey') => {
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

  const handleOpenDiscord = () => {
    trackSupportEvent({ event: 'cta_external_click', target: 'discord', variant, sessionId, env });
    markAction('discord');
    openWindow(DISCORD_URL, 'discord');
  };

  const handleOpenTelegram = () => {
    trackSupportEvent({ event: 'cta_external_click', target: 'telegram', variant, sessionId, env });
    markAction('telegram');
    openWindow(TELEGRAM_URL, 'telegram');
  };

  const handleOpenGitHub = () => {
    trackSupportEvent({ event: 'cta_external_click', target: 'github', variant, sessionId, env });
    markAction('github');
    openWindow(GITHUB_URL, 'github');
  };

  const handleLearnMore = () => {
    setLearnOpen(prev => !prev);
    trackSupportEvent({ event: 'cta_learn_more', target: 'learn', variant, sessionId, env });
    markAction('learn');
  };

  const handleRequestInvite = () => {
    trackSupportEvent({ event: 'cta_request_invite', target: 'request_invite', variant, sessionId, env });
    markAction('request_invite');
    openWindow(SURVEY_URL, 'survey');
    setOpen(false);
    setSessionClosed(true);
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
        onOpenDiscord={handleOpenDiscord}
        onOpenTelegram={handleOpenTelegram}
        onOpenGitHub={handleOpenGitHub}
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
