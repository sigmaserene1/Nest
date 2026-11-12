# Roadmap

## Current
- [x] Modernize landing example tables and cards with aligned amounts, clearer member rows and consistent surfaces; phone/tablet/desktop checks pass in both themes, including receipt previews and launch popup.
- [x] Prepare Docs at docs.nestarc.xyz, update links and permanently redirect the old address; three tests and phone/desktop subdomain checks pass.
- [x] Move Docs to a separate project — owner confirmed the move; the subdomain is no longer connected here.
- [x] Remove local Docs content and hostname rewrites; first-tap external navigation, permanent legacy redirect and three regression tests pass.
- [x] Modernize landing typography, composition and product preview; verified phone/tablet/desktop in both themes, navigation, live/reduced motion and bill-preview-to-sign-in flow.
- [x] Restyle the landing headline with staggered typography and a flowing accent underline; verified phone and desktop in both themes, reduced motion and launch popup.
- [x] Refine landing hierarchy and simplify its illustrative ledger; verified phone, tablet and desktop in both themes, no overflow or browser errors, and launch popup opens.
- [x] Replace the landing background picture with continuously flowing live light ribbons; verified changing frames, reduced-motion pause, phone layout and sign-in popup.
- [x] Refresh only the landing with colorful flowing lights, richer motion and a cleaner composition; phone/desktop artwork, motion, reduced-motion and launch popup verified. Real-device frame rate remains unverified.
- [x] Refresh the landing with full-width interactive 3D Nest artwork and polished typography; desktop/mobile/light/dark rendering, launch popup and docs link verified.
- [x] Resolve SEO metadata conflicts and incomplete page-specific search/share tags; verified all 21 content routes and rendered public-page metadata.
- [ ] Resolve the missing share image — deferred at the user's request; no suitable existing cover image is available.
- [x] Make light/dark changes atomic without color fades; give dark navigation white icons, labels and selected buttons.
- [x] Restore viewport-anchored mobile bottom navigation and content clearance; checked fixed positioning while scrolling at phone width.
- [x] Verify and configure the existing Arc Mainnet ExpenseManager deployment; chain 5042 code first appears at block 21213840 and configuration tests pass.
- [ ] Simplify email sign-in to Privy OTP and wallet only; match the popup and square PIN boxes to Nest.
- [x] Replace the Privy-to-Circle email flow with native Privy EVM wallet creation and restoration.
- [x] Verify the preview and sign-in dialog load without browser errors; resolve wallet connector type errors.
- [ ] Verify real OTP completion, wallet creation/restoration and app entry — blocked by access to the email verification code.

## Done
- [x] Polish Settlement Assistant (clear status header, small on/off switch, plain-language limits, highlighted action)
- [x] Polish Syndicate mode (highlighted mode selector, simple revenue split, clearer payout rows)
- [x] Bridge panel: source chain, destination chain, token and amount selection with a clear confirm action
- [x] USDC transfers enabled; EURC shown as clearly unavailable (Circle testnet transfer service rejects EURC burns)

## Notes
- Live wallet-connected screens can only be checked by a signed-in wallet in the browser.
