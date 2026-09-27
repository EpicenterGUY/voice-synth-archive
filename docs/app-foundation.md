# VocaDive App Foundation

Version: **39.62.0**

This document describes the foundation for turning the existing VocaDive web/PWA codebase into a native Android/iOS app without rewriting the application from scratch.

## What is in place

### Native packaging

The repository now includes a Capacitor foundation.

- `package.json`
- `capacitor.config.json`
- `scripts/build-app.mjs`

`npm run build:app` creates a clean static bundle in `dist/app`. Capacitor uses that folder as its `webDir`.

The provisional application id is:

`app.vocadive.mobile`

Do not publish a production build before deciding whether this package id should be permanent. Changing it after store release creates a different app identity.

### Runtime platform layer

`app-platform-v3962.js` is the single place where web/PWA/native differences should be hidden.

The rest of VocaDive should ask `window.VocaDivePlatform` for capabilities instead of directly checking Android, iOS, PWA or browser state.

Current bridge responsibilities:

- platform detection
- installed/native detection
- native/browser external-link opening
- haptic capability hook
- Preferences/localStorage abstraction
- platform-ready event

This file intentionally falls back to ordinary browser behavior so the existing website stays functional.

### Free / Pro entitlement layer

`entitlements-v3962.js` defines a feature registry and an entitlement API.

Existing VocaDive features remain free in this foundation release. Nothing is newly paywalled.

Current future-Pro placeholders:

- `pro.cloud_sync`
- `pro.detective_unlimited`
- `pro.dive_deep_bridge`
- `pro.analytics_advanced`
- `pro.library_plus`
- `pro.export_plus`
- `pro.theme_pack`

Use:

```js
VocaDiveEntitlements.has("pro.cloud_sync")
VocaDiveEntitlements.guard("pro.cloud_sync", onAllowed, onBlocked)
```

The browser is **not** the authority for purchases. A later server endpoint must validate store purchases and return the entitlement state.

### Account / cloud abstraction

`account-v3962.js` provides:

- anonymous device id
- account session abstraction
- future backend URL configuration
- `/app/bootstrap` contract
- sync envelope
- `GET /app/sync/:namespace`
- `PUT /app/sync/:namespace`

No login provider has been selected yet. This prevents the current codebase from being coupled to one provider before the account flow is designed.

### Backend schema

`worker/app-schema-v1.sql` is a future D1 schema for:

- users
- devices
- entitlements
- purchase records
- per-user sync documents
- sync conflict records

It is separate from the existing detective index schema. Do not apply it to production until the account API is implemented.

## Android development flow

Install Node.js 20 or newer, then:

```bash
npm install
npm run build:app
npx cap add android
npx cap sync android
npx cap open android
```

After the Android project already exists, the normal update loop is:

```bash
npm run cap:sync
npm run cap:open:android
```

## iOS later

The same web bundle is prepared for iOS:

```bash
npm run build:app
npx cap add ios
npx cap sync ios
npx cap open ios
```

An actual iOS build requires macOS/Xcode and Apple signing.

## Rules for future monetization work

1. Playback and access to third-party music must not be treated as VocaDive-owned paid content.
2. Pro should unlock VocaDive-created value: analysis, personalization, sync, advanced discovery, storage and similar app features.
3. Store purchase receipts/tokens must be verified server-side.
4. The client should only render the entitlement state returned by the trusted backend.
5. Never place store secrets or verification credentials in the web bundle.
6. Existing free features should not silently become paid during foundation work.

## Next implementation milestones

1. Native Android shell smoke test.
2. Back-button / lifecycle / mini-player behavior in a real WebView.
3. Account provider selection and `/app/bootstrap` implementation.
4. Cloud sync migration for library/history/settings.
5. Store billing adapter with server verification.
6. Only after the above is stable, decide which *new* advanced features become Pro.
