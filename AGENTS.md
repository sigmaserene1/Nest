<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Page-entrance wrappers must not animate transforms or retain animation stacking contexts; nested fixed payment and expense overlays must stay viewport-anchored above navigation.
- Build scripts set NODE_OPTIONS max-old-space-size and Privy loads browser-only (lazy) — the wallet/auth SDKs otherwise exhaust memory in the server build.
