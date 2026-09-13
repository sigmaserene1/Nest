# Polish the CCTP bridge

## Goal
Make the existing bridge feel like a professional DEX while preserving its current real CCTP transfer flow and wallet-scoped history.

## Changes
- Refine the bridge layout into a clean swap-style panel with distinct source and destination sections, a centered route-reversal control, and a clearer amount entry.
- Show authentic logos for Arc, Ethereum, Avalanche, Optimism, Arbitrum, Base, Polygon, and USDC, with reliable visual fallbacks.
- Add concise testnet details to every chain choice: network name, testnet badge, chain ID, CCTP domain, estimated transfer time, and native-USDC status.
- Improve action states so the primary button clearly communicates connect, invalid amount, insufficient balance, approval, burn, attestation, mint, success, and error states.
- Polish the route summary, estimated received amount, fees, recipient input, transfer progress, and per-wallet recent transfer rows.
- Preserve all existing onchain transaction logic, supported routes, wallet isolation, pages, and navigation.

## Validation
- Type-check the app.
- Verify the bridge at desktop and mobile sizes, including chain selection, route reversal, disabled states, and no browser errors.
