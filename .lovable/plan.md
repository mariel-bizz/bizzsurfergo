
# Recommended onboarding checklist

## Why this shape

The app is already gamified — XP, streak, badges in `AppShell` — but the only first-run surface is `SplashScreen`. New users land on Home with no clear "what do I do first?" path. A short, persistent checklist on Home that ties into the existing XP system converts curiosity into activation without feeling like a tutorial.

Keep it short (5 items max), mobile-first, dismissible, and progress-tracked across sessions. Each completed step awards XP so it reinforces the existing game loop instead of competing with it.

## Recommended checklist (5 steps)

1. **Meet your AI co-pilot** — open the Chat tab and send the first message. Highest-value "aha" moment in the product.
2. **Run the Reality Check** — take the 60-second pain/ROI assessment on Home. Personalises everything that follows.
3. **Explore an Agentic playbook** — visit the Marketplace and open one listing. Surfaces the catalogue.
4. **Save a next event** — RSVP or add one event to calendar from the Events tab. Drives recurring engagement.
5. **Complete your profile** — name + role + company size on Profile tab. Unlocks personalised recommendations and email value.

Optional 6th (only if signed in): **Connect one integration** — but gate behind auth so it doesn't block anonymous first-run.

Each step rewards +25 XP. Finishing all 5 awards a "Launch Crew" badge and a one-time +100 XP bonus — fits the existing badge model (`Consistency` is already there).

## UX placement

- **Home tab, top of page**, directly under the streak/XP header, above "Reality check".
- Collapsible card titled "Get started — 1 of 5 done". Progress ring on the left.
- Each row: icon, label, short helper text, status (todo / done / locked).
- Tapping a row deep-links to the relevant tab/route and auto-marks done when the action fires.
- "Dismiss" turns it into a small `Show checklist` chip on Profile so users can re-open it (mirrors the existing `Show welcome screen` pattern).
- Auto-hides permanently once all 5 are done (or after explicit dismiss).

## Tracking model

Extend the existing localStorage `bizzsurfer_state` (in `AppShell.tsx`) with:

```ts
onboarding: {
  steps: { chat: boolean; reality: boolean; marketplace: boolean; events: boolean; profile: boolean };
  dismissed: boolean;
  completedAt: string | null;
}
```

Mark steps from the relevant components:
- `chat` → on first message send in `ChatTab` / `FloatingChat`.
- `reality` → on `PainTracker` submit.
- `marketplace` → on first listing route visit (`/marketplace/$listingId`).
- `events` → on RSVP confirm or "Add to calendar" click.
- `profile` → when name + role + company size are all set.

Fire `trackEvent("onboarding_step_completed", { step })` on each so we can measure activation funnel. Fire `onboarding_completed` when all 5 are true.

## What I'd skip

- **Modal walkthroughs / tooltip tours.** They block the UI and have low completion on mobile.
- **Auth gating the whole checklist.** Anonymous users should be able to finish 4 of 5 steps; only "complete profile" requires sign-in.
- **A separate `/onboarding` route.** It fragments the experience — Home is already where the Reality Check and tiles live.

## Files this would touch (when implemented)

- `src/components/AppShell.tsx` — extend `GameState` with `onboarding`.
- `src/components/tabs/HomeTab.tsx` — render the checklist card.
- `src/components/tabs/ChatTab.tsx`, `PainTracker.tsx`, `MarketplaceTab.tsx`, `EventsTab.tsx`, `ProfileTab.tsx` — fire step-completion calls.
- `src/lib/analytics.ts` — no change, reuse `trackEvent`.

Want me to build this as proposed, or adjust the steps / XP rewards / placement first?
