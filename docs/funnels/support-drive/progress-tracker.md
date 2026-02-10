# Support Drive Funnel Progress Tracker

Use this checklist to track implementation. Numbers are fixed IDs; do not renumber. Mark with [x] when done.

Note: Replace placeholder fundraiser and navcom URLs with final approved production/staging targets before launch sign-off.

1. [x] Stage: Foundations
   1.1 [x] Phase: Inputs Locked
       1.1.1 [x] Step: URLs Confirmed
           1.1.1.1 [x] Task: Set fundraiser URL (prod/stage)
               1.1.1.1.1 [x] Subtask: Confirm production fundraiser domain and path
               1.1.1.1.2 [x] Subtask: Confirm staging fundraiser domain and path
               1.1.1.1.3 [x] Subtask: Add ?src=app_modal tagging if approved
           1.1.1.2 [x] Task: Set navcom/nostr URL or invite payload
               1.1.1.2.1 [x] Subtask: Confirm navcom.app route or nip19 invite
               1.1.1.2.2 [x] Subtask: Validate deep-link opens in new tab
               1.1.1.2.3 [x] Subtask: Provide copyable invite string fallback
       1.1.2 [x] Step: Legal/Disclosure
           1.1.2.1 [x] Task: Provide disclosure text for footer
               1.1.2.1.1 [x] Subtask: Draft non-profit/for-profit status line
               1.1.2.1.2 [x] Subtask: Add processor/beneficiary naming if required
               1.1.2.1.3 [x] Subtask: Review with legal/compliance
           1.1.2.2 [x] Task: Confirm tax/jurisdiction language
               1.1.2.2.1 [x] Subtask: Clarify deductibility statement
               1.1.2.2.2 [x] Subtask: Add jurisdiction caveat if needed
               1.1.2.2.3 [x] Subtask: Approve final wording for copy-deck footer
       1.1.3 [x] Step: Branding
           1.1.3.1 [x] Task: Approve Aldrich usage + fallback body font
               1.1.3.1.1 [x] Subtask: Confirm font licensing/source
               1.1.3.1.2 [x] Subtask: Define fallback body font for readability
               1.1.3.1.3 [x] Subtask: Verify heading and body sizes/line-height
           1.1.3.2 [x] Task: Approve holographic palette tokens
               1.1.3.2.1 [x] Subtask: Validate contrast pairs for AA
               1.1.3.2.2 [x] Subtask: Lock primary/secondary usage rules
               1.1.3.2.3 [x] Subtask: Document focus ring and hover states
   1.2 [x] Phase: Flags & Config
       1.2.1 [x] Step: Feature Flags
           1.2.1.1 [x] Task: Add enableSupportFunnel flag per env
               1.2.1.1.1 [x] Subtask: Wire to runtime config for dev/stage/prod
               1.2.1.1.2 [x] Subtask: Add default false for prod until launch
               1.2.1.1.3 [x] Subtask: Document flag in implementation-notes.md
           1.2.1.2 [x] Task: Add snoozeDays config (default 30)
               1.2.1.2.1 [x] Subtask: Expose override in env/config file
               1.2.1.2.2 [x] Subtask: Add validation for min/max days
               1.2.1.2.3 [x] Subtask: Document default in ux-spec and faq
       1.2.2 [x] Step: Routing/Entry Point
           1.2.2.1 [x] Task: Choose entry point location in UI chrome
               1.2.2.1.1 [x] Subtask: Prototype placement in header/sidebar
               1.2.2.1.2 [x] Subtask: Verify accessibility label and tab order
               1.2.2.1.3 [x] Subtask: Confirm persistent visibility rules
           1.2.2.2 [x] Task: Define learn-more destination (route/accordion)
               1.2.2.2.1 [x] Subtask: Decide internal route vs in-modal accordion
               1.2.2.2.2 [x] Subtask: Prepare content snippet/source
               1.2.2.2.3 [x] Subtask: Add analytics target label

2. [ ] Stage: Build
   2.1 [ ] Phase: State & Logic
       2.1.1 [x] Step: State Store
           2.1.1.1 [x] Task: Implement impression/snooze/dismiss state with storage fallback
               2.1.1.1.1 [x] Subtask: Namespaced keys and versioning
               2.1.1.1.2 [x] Subtask: Memory fallback for private mode
               2.1.1.1.3 [ ] Subtask: Clear/migrate on schema change
           2.1.1.2 [x] Task: Implement eligibility checks (flags + timers)
               2.1.1.2.1 [x] Subtask: Combine flag, dismiss, snooze expiry gates
               2.1.1.2.2 [x] Subtask: Add first-load gating (post-preloader)
               2.1.1.2.3 [x] Subtask: Unit test edge timings
       2.1.2 [x] Step: Experiment Wiring
           2.1.2.1 [x] Task: Add variant assignment and exposure logging
               2.1.2.1.1 [x] Subtask: Stable session-based seeding
               2.1.2.1.2 [x] Subtask: Log variant_exposure on impression
               2.1.2.1.3 [x] Subtask: Respect feature flag to disable experiments
           2.1.2.2 [x] Task: Add variant propagation to events
               2.1.2.2.1 [x] Subtask: Append variant id to all funnel events when present
               2.1.2.2.2 [x] Subtask: Ensure null/undefined omitted cleanly
               2.1.2.2.3 [x] Subtask: Verify analytics schema accepts variant field
   2.2 [ ] Phase: UI Components
       2.2.1 [x] Step: Modal
           2.2.1.1 [x] Task: Build modal layout (headline, subhead, dual CTAs, secondary actions)
               2.2.1.1.1 [x] Subtask: Desktop layout with side-by-side primaries
               2.2.1.1.2 [x] Subtask: Mobile layout stacking primaries
               2.2.1.1.3 [x] Subtask: Footer slot for disclosure line
           2.2.1.2 [x] Task: Add focus trap, ESC close, return-focus
               2.2.1.2.1 [x] Subtask: Implement trap library/util
               2.2.1.2.2 [x] Subtask: Restore focus to entry point/trigger
               2.2.1.2.3 [x] Subtask: Keyboard order validation
           2.2.1.3 [x] Task: Add reduced-motion handling
               2.2.1.3.1 [x] Subtask: Prefers-reduced-motion media query guards
               2.2.1.3.2 [x] Subtask: Disable glow/pulse animations conditionally
               2.2.1.3.3 [x] Subtask: Ensure instant open/close fallback
       2.2.2 [x] Step: Entry Point
           2.2.2.1 [x] Task: Add persistent Support entry control
               2.2.2.1.1 [x] Subtask: Implement button/link with icon state
               2.2.2.1.2 [x] Subtask: Show active/available states visually
               2.2.2.1.3 [x] Subtask: Ensure it does not get hidden on scroll
           2.2.2.2 [x] Task: Ensure keyboard activation and labeling
               2.2.2.2.1 [x] Subtask: Set aria-label and tooltip text
               2.2.2.2.2 [x] Subtask: Verify SPACE/ENTER activation
               2.2.2.2.3 [x] Subtask: Tab order fits existing chrome
       2.2.3 [x] Step: Copy/Theme
           2.2.3.1 [x] Task: Wire copy-deck strings and variants
               2.2.3.1.1 [x] Subtask: Centralize string map for modal
               2.2.3.1.2 [x] Subtask: Support headline variant selection
               2.2.3.1.3 [x] Subtask: Add placeholder for legal footer string
           2.2.3.2 [x] Task: Apply holographic palette tokens and Aldrich headings
               2.2.3.2.1 [x] Subtask: Map color tokens to CSS vars
               2.2.3.2.2 [x] Subtask: Set Aldrich for headings/CTAs; fallback body
               2.2.3.2.3 [x] Subtask: Verify contrast on buttons and text
   2.3 [ ] Phase: Error/Edge Handling
       2.3.1 [x] Step: Pop-up Block Fallback
           2.3.1.1 [x] Task: Detect blocked open and show inline link/copy
               2.3.1.1.1 [x] Subtask: Catch window.open failure
               2.3.1.1.2 [x] Subtask: Render fallback link with copy action
               2.3.1.1.3 [x] Subtask: Log fallback_open_link event
       2.3.2 [ ] Step: Missing URL Guards
           2.3.2.1 [x] Task: Disable CTA and show dev warning when URL absent (non-prod)
               2.3.2.1.1 [x] Subtask: Gate warning to non-prod builds
               2.3.2.1.2 [x] Subtask: Provide inline message copy
               2.3.2.1.3 [x] Subtask: Ensure no crash when null URL
       2.3.3 [x] Step: Offline Note
           2.3.3.1 [x] Task: Show subtle offline warning; keep copy action
               2.3.3.1.1 [x] Subtask: Detect offline via navigator.onLine
               2.3.3.1.2 [x] Subtask: Display non-blocking notice near CTAs
               2.3.3.1.3 [x] Subtask: Keep copy invite available offline

3. [ ] Stage: Instrumentation & QA
   3.1 [ ] Phase: Tracking
       3.1.1 [x] Step: Events
           3.1.1.1 [x] Task: Fire events per tracking.md (impression, CTAs, copy, learn, snooze, dismiss, entry, fallback)
               3.1.1.1.1 [x] Subtask: Wire to tracking hook with fire-and-forget
               3.1.1.1.2 [x] Subtask: Debounce impression per modal open
               3.1.1.1.3 [x] Subtask: Verify targets map to event schema
           3.1.1.2 [x] Task: Add variant id to events when active
               3.1.1.2.1 [x] Subtask: Pass variant to tracking hook
               3.1.1.2.2 [x] Subtask: Ensure null variant handled gracefully
                    3.1.1.2.3 [x] Subtask: Test with experiments disabled/enabled
        3.1.2 [ ] Step: Storage Validation
            3.1.2.1 [ ] Task: Verify snooze/dismiss persistence and session fallback
                    3.1.2.1.1 [x] Subtask: Test localStorage path
                    3.1.2.1.2 [x] Subtask: Test private-mode fallback
                    3.1.2.1.3 [x] Subtask: Validate timestamp math for snooze expiry
   3.2 [ ] Phase: Testing
       3.2.1 [ ] Step: Unit/Logic
                    3.2.1.1 [x] Task: Eligibility logic tests (flags, snooze, dismiss)
                        3.2.1.1.1 [x] Subtask: Flag disabled => no show
                        3.2.1.1.2 [x] Subtask: Snooze active => suppressed
                        3.2.1.1.3 [x] Subtask: Dismissed => suppressed
                    3.2.1.2 [x] Task: URL guard tests
                        3.2.1.2.1 [x] Subtask: Fundraiser URL missing => CTA disabled
                        3.2.1.2.2 [x] Subtask: Nostr URL missing => CTA disabled
                        3.2.1.2.3 [x] Subtask: Fallback message displayed
       3.2.2 [ ] Step: Accessibility
            3.2.2.1 [x] Task: Keyboard traversal, focus trap, ESC close
                3.2.2.1.1 [x] Subtask: TAB/SHIFT+TAB loops correctly
                3.2.2.1.2 [x] Subtask: ESC closes and returns focus
                3.2.2.1.3 [x] Subtask: Screen reader labels validated
            3.2.2.2 [x] Task: Reduced-motion behavior
                3.2.2.2.1 [x] Subtask: Animations disabled when prefers-reduced-motion
                3.2.2.2.2 [x] Subtask: No pulsing/glow under reduced-motion
                3.2.2.2.3 [x] Subtask: Instant open/close confirmed
       3.2.3 [ ] Step: Interaction
           3.2.3.1 [ ] Task: CTA opens correct URL; fallback path works
               3.2.3.1.1 [ ] Subtask: Nostr CTA opens navcom URL/new tab
               3.2.3.1.2 [ ] Subtask: Fund CTA opens fundraiser URL/new tab
               3.2.3.1.3 [ ] Subtask: Pop-up blocked fallback link functions
           3.2.3.2 [ ] Task: Entry point reopens modal after dismiss
               3.2.3.2.1 [ ] Subtask: Dismiss sets flag; entry bypasses
               3.2.3.2.2 [ ] Subtask: Snooze respects timer; entry bypasses
               3.2.3.2.3 [ ] Subtask: Focus returns to entry after close
   3.3 [ ] Phase: Review & Launch
       3.3.1 [ ] Step: Visual/Content QA
           3.3.1.1 [ ] Task: Verify copy variants and spacing on mobile/desktop
               3.3.1.1.1 [ ] Subtask: Headline lengths fit without clipping
               3.3.1.1.2 [ ] Subtask: Mobile stacking keeps CTAs visible
               3.3.1.1.3 [ ] Subtask: Disclosure line fits without overflow
           3.3.1.2 [ ] Task: Contrast check on buttons/text
               3.3.1.2.1 [ ] Subtask: Primaries meet AA on dark base
               3.3.1.2.2 [ ] Subtask: Secondary/meta text meets AA
               3.3.1.2.3 [ ] Subtask: Focus ring visible and distinct
       3.3.2 [ ] Step: Approvals
           3.3.2.1 [ ] Task: Design sign-off (UX/visual/motion)
               3.3.2.1.1 [ ] Subtask: UX review of flows and edge cases
               3.3.2.1.2 [ ] Subtask: Visual review of palette/typography
               3.3.2.1.3 [ ] Subtask: Motion review with reduced-motion check
           3.3.2.2 [ ] Task: Product/legal sign-off (disclosures/URLs)
               3.3.2.2.1 [ ] Subtask: Confirm final URLs
               3.3.2.2.2 [ ] Subtask: Approve disclosure text
               3.3.2.2.3 [ ] Subtask: Record approvals in decision log
       3.3.3 [ ] Step: Deploy
           3.3.3.1 [ ] Task: Stage deploy and smoke test
               3.3.3.1.1 [ ] Subtask: Validate flags/URLs in stage
               3.3.3.1.2 [ ] Subtask: Run manual QA (a11y, links, tracking)
               3.3.3.1.3 [ ] Subtask: Capture screenshots for reference
           3.3.3.2 [ ] Task: Production flag on, monitor early metrics
               3.3.3.2.1 [ ] Subtask: Enable flag in prod with canary window
               3.3.3.2.2 [ ] Subtask: Monitor events for first 24–48h
               3.3.3.2.3 [ ] Subtask: Rollback plan ready if regressions
