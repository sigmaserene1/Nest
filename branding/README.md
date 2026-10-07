# Nest Circle OTP email branding

The live OTP email is controlled by Circle's User-Controlled Wallet email configuration, not by the Nest frontend.

## Circle Console settings

Go to:

`Wallets -> User Controlled -> Configurator -> Authentication Methods -> Email OTP`

Use:

**Sender name**
`Nest`

**From address**
`auth@nestarc.xyz`

**Subject**
`{{code}} is your Nest verification code`

**HTML body**
Paste the contents of `branding/nest-otp-email.html`.

Do not change Circle's merge variables:

- `{{code}}`
- `{{expiry_long}}`

The old `{code}` subject syntax does not interpolate the code and should not be used.

Keep the public product name as **Nest**, not **NestARC**.
