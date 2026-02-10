# Support Drive Copy Deck

1. Purpose
- Central source for funnel copy: headlines, subheads, CTA labels, secondary text, and disclosures. Coordinate with ux-spec.md and tracking.md.

2. Tone and voice
- Urgent, rallying, heroic; decentralized, anti-capture. Strength-first, not pity.
- Crisp sentences; avoid jargon unless mission-critical. Avoid surveillance or defeatist language.

3. Headlines (variants)
- H1-A: "Join the Earth Alliance."
- H1-B: "Fuel the mission. Stay uncaptured."
- H1-C: "Rise as a Net Runner—decentralize and defend."
- H1-D: "Signal with us. Fund the ops."
- H1-E: "This is the resistance line."

4. Subheads (short)
- S1: "Tap in on Nostr, power the ops, keep the network free."
- S2: "Decentralized comms, uncaptured funding, community-first."
- S3: "Your signal grows the alliance; your support keeps it moving."
- S4: "Join the chat, back the build, stay sovereign."

5. Primary CTA labels
- CTA1 (nostr): "Join the Nostr Ops"
- CTA1 alt: "Open navcom chat"
- CTA2 (fundraiser): "Fund the Mission"
- CTA2 alt: "Open the Fundraiser"

6. Secondary actions
- Learn more: "Learn more"
- Copy/share invite: "Copy invite link"
- Snooze: "Remind me later"
- Dismiss: "No thanks"

7. Microcopy
- Copy confirmation: "Invite copied"
- Pop-up blocked fallback: "Pop-up blocked—open link"
- Snooze confirm: "We’ll remind you later"
- Dismiss confirm (optional toast): "Support prompt hidden—use Support in the menu to reopen"

8. Footers/disclosures (placeholder)
- Placeholder: "Support is processed via [fundraiser name]. Not tax-deductible unless stated." (Replace once legal approves.)
- Placeholder: "Navcom chat opens in a new tab on navcom.app."

9. Per-ICP nudge lines (optional swaps)
- Crypto-native activists: "Signal on Nostr. Build anti-capture comms."
- Open-source allies: "Open tools need open backers. Join and keep it uncaptured."
- Humanitarian donors: "Transparent ops. Your backing keeps aid uncaptured."

10. Long-body option (if space allows)
- "We are building decentralized comms and intel for the Earth Alliance. Join the Nostr ops chat to coordinate, and fund the mission to keep the network uncaptured."

11. Banned phrases
- No pity framing ("we’re desperate").
- No guaranteed outcomes ("your gift ensures victory").
- Avoid surveillance connotations ("we track you").

12. Locale/i18n notes
- Keep strings short; avoid embedding numbers that change (use variables when localized later).

13. Tracking alignment
- Event names should mirror CTA labels: cta_nostr, cta_fund, cta_learn_more, cta_copy_invite, action_snooze, action_dismiss.

14. URL labels (for analytics context)
- nostr_url_label: "navcom_app"
- fundraiser_url_label: "fundraiser_site"

15. Error text
- Missing URL: "Link unavailable—tell the team to set the fundraiser URL."

16. Future localization placeholders
- Keep a section for translated variants once locales are added; note string IDs.

17. Change management
- Update this file when any label/headline changes; notify tracking and ux owners.

18. Changelog
- Add dated entries for copy updates and approvals.
