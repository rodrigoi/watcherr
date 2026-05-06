# Notification Email Design

**Date:** 2026-05-02
**Scope:** `src/notification.tsx` — a React Email template that lists downloads removed by watcherr.

## Context

Watcherr scans Sonarr's queue, cross-references each item against qBittorrent's file list, and removes downloads whose files have invalid extensions (defined in `src/constants.ts`: `.exe`, `.scr`, `.zip`, `.bat`, `.cmd`, `.msi`, `.ps1`, `.jar`, `.vbs`, `.lnk`).

The project already has `react-email` and `resend` installed, plus a `dev:email` script that previews templates from `./src` on port 3003. `src/notification.tsx` exists but is empty.

This spec covers the template only. Wiring `index.ts` to render and send the email via Resend is out of scope.

## Component API

```ts
import type { SonarrQueueItem } from "@/schemas";

type Removal = {
  item: SonarrQueueItem;
  triggeringFile: string;  // path within the torrent that flagged it
  extension: string;       // e.g. ".exe" — the invalid extension found
};

type NotificationProps = { removals: Removal[] };

export default function Notification(props: NotificationProps): JSX.Element;
```

Reusing `SonarrQueueItem` keeps the call site simple — `index.ts` already has these objects in scope when it decides to remove.

## Visual Structure

Top to bottom, using react-email primitives only — no custom `style={}` props.

- `<Html>`
  - `<Head>`
  - `<Preview>`: `"Watcherr removed N download(s)"`
  - `<Body>`
    - `<Container>`
      - `<Heading>`: `"Watcherr removed N download(s)"`
      - `<Hr/>`
      - For each removal in `removals`, separated by `<Hr/>`:
        - `<Text>` with bold child: `item.title ?? "(untitled)"`
        - `<Text>`: `Triggered by: <triggeringFile>`
        - `<Text>`: `Reason: invalid file extension <extension>`

`N` is `removals.length`. Pluralization: `"download"` if `N === 1`, otherwise `"downloads"`.

## Edge Cases

- **Missing title.** `SonarrQueueItem.title` is `string | null | undefined`. Render `"(untitled)"` as fallback.
- **Empty `removals`.** Render heading ("0 downloads") with no removal blocks. The caller shouldn't send an email with zero removals, but the component shouldn't throw.

## Out of Scope

- Email subject line — caller decides.
- Sending the email (Resend integration, calling code in `index.ts`).
- Localization, dark mode, custom theming.
- Unit tests — this is a visual template, previewed via `bun run dev:email`.

## Verification

Run `bun run dev:email` and open `http://localhost:3003`. Confirm:
- Heading and preview text reflect the removal count.
- Each removal block shows title (bold), triggering file, and extension reason.
- Untitled item falls back to `"(untitled)"`.
- Empty `removals` renders the heading without crashing.
