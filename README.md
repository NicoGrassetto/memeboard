# memeboard

A local copy-paste board for your favorite memes, built with HTML, minimal CSS,
HTMX and JavaScript. No backend, account, build step or package installation is
required.

## Run

Open `index.html` in a modern browser. For a consistent local-storage origin,
you can instead serve this directory with Python:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. This is only a static file server, not an
application backend. HTMX is bundled locally, so no internet connection is needed.

## Use

- Upload an image or paste one from your clipboard anywhere on the page.
- Optionally enter a description, then select **Add meme**.
- Saved memes appear newest first in a responsive grid.
- Select **Delete** on a meme to remove it.

PNG, JPEG, GIF, WebP and AVIF images up to 3 MiB are supported. Descriptions are
limited to 500 characters. Text-only clipboard content remains normal text input.
HTMX handles add/delete interactions and DOM swaps without reloading the page;
JavaScript intercepts its requests and saves locally, so images are never uploaded.

## Storage and privacy

Images and descriptions are saved in `localStorage` under `memeboard.memes`.
They persist across browser sessions on the same browser profile and origin
(protocol, host and port). Opening the file directly may have browser-dependent
storage behavior; use the static server if persistence is unavailable.

Browser storage is limited (often around 5 MiB, including base64 image overhead).
If it fills up, an error is shown and the board is left unchanged. Delete an
existing meme or use smaller images to free space. Private browsing or browser
settings may disable persistence. Unreadable saved data is not overwritten.
Clearing site data removes your memes; there is no backup or cross-device sync.
Other scripts or pages on the same origin can access this storage, so use a
dedicated local origin and avoid storing sensitive images.

## Files

- `index.html` — page and accessible input form.
- `styles.css` — minimal responsive styling.
- `app.js` — clipboard/upload handling, storage and local HTMX interactions.
- `vendor/htmx.min.js` — HTMX 2.0.11, distributed under the 0BSD license
  included in `vendor/HTMX-LICENSE`.

There is no build, lint or test framework. To check changes, serve the directory
and exercise upload, clipboard paste, add, delete and reload in your browser.
