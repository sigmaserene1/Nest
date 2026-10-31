# Roadmap

## Current
- [ ] Refresh only the landing with colorful flowing lights, richer motion and a cleaner composition; verify phone/desktop and sign-in.
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
