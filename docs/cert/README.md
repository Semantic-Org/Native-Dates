# Local HTTPS Certificates

When `local.nativedates.dev.pem` and its private key exist in this folder, the dev server listens on port 443 at `https://local.nativedates.dev`. HTTPS is required off `localhost` so the interactive playground service worker can register.

Generate a certificate signed by your local development CA via `DEV_CA_DIR`:

```sh
npm run cert
```

Point `local.nativedates.dev` at `127.0.0.1` in `/etc/hosts`, or at your dev machine's IP when testing from another device.

Without a certificate, `npm run dev` serves HTTP on port 4321. Generated `.pem` files are ignored by Git.
