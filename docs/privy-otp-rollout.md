# Privy email OTP beta — rollout notes

Nest's current production email authentication uses **Circle User-Controlled Wallets**.
The Circle verification iframe and its PIN challenge cannot be replaced by a
Privy OTP without changing the wallet provider and thus the account identity.

The beta offers two intentionally separate and explicit choices:

- **New email wallet (Privy):** Privy emails and verifies a six-digit code.
  Nest renders its own six responsive boxes via `input-otp`. A verified
  Privy account automatically receives a Privy-controlled EVM embedded wallet
  and joins Nest's wagmi contract flows as that wallet address.
- **Existing Circle wallet:** the current Circle email, Google, recovery,
  and onchain wallet flows remain unchanged, including their hosted security
  challenges. Returning Circle users must choose this option.

The same email in Privy and Circle **does not imply the same onchain address**.
The beta does not silently migrate ownership or transfer assets. Circle
Gas Station sponsorship and Circle transaction-signing APIs are **not** applied
to the Privy wallet. Operations requiring a Circle user-controlled SCA must
stay on the existing Circle path until a separate sponsored-wallet integration
has been tested.

## Deployment configuration

1. In the Privy Dashboard, create a Privy app, enable **email** authentication,
   authorize the production or preview Nest domain, and configure any necessary
   domain/CORS restrictions.
2. Add `VITE_PRIVY_APP_ID` (a public client identifier, never the Privy app
   secret) to the deployment environment.
3. Enable `VITE_ENABLE_PRIVY_OTP=true` **only in a staging deployment** at first.
   With the switch unset, the current Circle-only experience remains.
4. Install dependencies, commit a regenerated `bun.lock`, and pass TypeScript,
   frontend build, and contract tests before merging the feature branch.
5. Test six-digit typing, full-code paste/autofill, wrong and expired codes,
   resend cooldown, mobile keyboard, reload/reconnect, and sign-out.
6. On Arc Testnet, verify that a newly created Privy wallet can sign an
   actual onchain workspace operation, and verify that an existing Circle
   address, workspace, and balance remain accessible without change.
7. Validate unsigned gas costs and sponsor policies. Do not advertise Circle
   gasless actions to Privy wallets without a compatible paymaster.

Keep Privy and Circle App IDs distinct, do not put API secrets in `VITE_`
variables, and never accept client-provided wallet address or email alone as
proof of authorization in server functions. Privy OTP only authenticates a
Privy account; it is not an authorization token for Circle W3S APIs.

## Release gate

This is a guarded beta until real provider credentials and the staging smoke
tests above are available. Do not automatically replace Circle for established
users, infer wallet equivalence from their email, or force an automatic
transfer of their funds.
