# Vercel hosting - publish an approved prototype

Use only after the user explicitly agrees to make a finished browser prototype public. Publishing is an
optional PROTOTYPE exit, not delivery `Done`.

## Protect before publishing

- Use an isolated Vercel project. Never replace or attach to an existing production project unless the user
  explicitly names it and approves that impact.
- Inspect the deployable files. Remove secrets, private data, production credentials, write-capable endpoints,
  analytics, billing hooks, and internal-only content.
- Explain that a public deployment can be visited, shared, and indexed. Stop if safe public visibility is not
  proven.

## Prepare the CLI

Check for an existing CLI first:

```bash
vercel --version
```

If it is missing, ask before installing or downloading tooling. Vercel's documented global install is:

```bash
pnpm i -g vercel@latest
```

Do not install silently. A one-off package runner is also a download and needs the same approval.

## Authenticate the user

Check the active Vercel identity:

```bash
vercel whoami
```

If no user is authenticated, run:

```bash
vercel login
```

Let the user complete Vercel's interactive browser/email or provider flow. Never ask them to paste a password,
one-time code, session cookie, or access token into chat. If the agent cannot complete an interactive login,
ask the user to run `vercel login` in their own terminal, then re-run `vercel whoami`. Confirm the account and
team scope before creating anything.

## Link an isolated project

From the prototype root, run:

```bash
vercel link
```

Choose the intended account/team and create or select the isolated Vercel project approved for this prototype.
Keep `.vercel/` ignored and out of commits because it contains local project linkage metadata.

## Inspect, deploy, and verify

With a current CLI, inspect the upload without creating a deployment:

```bash
vercel deploy --dry
```

Review framework detection, included files, size, and unexpected content. Fix any unsafe or unintended upload
before continuing. Then deploy the isolated project to its stable production URL:

```bash
vercel deploy --prod
```

Do not add `--public`: that flag exposes deployment source at `/_src`; it does not control whether visitors can
open the site.

Capture the returned URL, then verify it without Vercel credentials:

1. Open the URL in a signed-out browser and exercise the prototype's main path.
2. Check responsive rendering and the browser console/network for failures.
3. Confirm the viewer is not redirected to Vercel login or an access-request screen.

If Deployment Protection blocks anonymous visitors, do not call the result public. Explain the current setting
and ask the user whether to make this isolated project's production domain public in Vercel's Project Settings
under Deployment Protection. If the user prefers access only by link, create a Vercel Shareable Link instead and
report that it is shareable but not public. Never expose a protection-bypass secret in a URL or message.

## Handoff

Report the public or shareable URL, Vercel account/team and project name, deployment type, anonymous-access
check, and any remaining limitation. Keep calling it a prototype. Removing the deployment or project requires
separate explicit confirmation.

## Current Vercel references

- CLI install and command overview: https://vercel.com/docs/cli
- Login: https://vercel.com/docs/cli/login
- Project linking: https://vercel.com/docs/cli/link
- Deploy: https://vercel.com/docs/cli/deploy
- Deployment Protection: https://vercel.com/docs/deployment-protection
- Sharing deployments: https://vercel.com/docs/deployments/sharing-deployments
