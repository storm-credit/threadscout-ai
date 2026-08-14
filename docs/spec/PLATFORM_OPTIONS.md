# Platform Options Review v1

Status: DESIGN ONLY.

## Goal

Choose the first delivery platform for ThreadScout without prematurely committing to duplicate native-app implementations.

## Option A — desktop-first web application

### Description

Primary experience targets large desktop screens; mobile becomes a reduced companion view.

### Strengths

- easiest for dense research and evidence inspection
- efficient keyboard/mouse review
- simplest information-dense layouts

### Weaknesses

- weak fit for quick product review, photo capture, link checking, and approval while away from a desk
- risks turning a short daily workflow into a desktop-only operation

### Decision

Rejected as the primary platform. Desktop remains supported.

## Option B — native iOS + native Android

### Description

Separate native applications are first-class from MVP.

### Strengths

- strongest device integration
- mature push/background capabilities
- best camera/file integration when implemented deeply

### Weaknesses

- duplicated product surface and release process
- app-store review and deployment overhead
- slower iteration while the core workflow is still being validated
- requires platform-specific edge-case handling before product value is proven

### Decision

Rejected for MVP.

## Option C — cross-platform native app

### Description

Use a shared mobile framework and treat web/desktop as secondary or separate.

### Strengths

- one primary mobile codebase
- better native feel than a browser-only design
- future device integration remains practical

### Weaknesses

- still adds app-store packaging, native build, signing, upgrade, and release complexity
- desktop research experience becomes a second concern
- unnecessary before validating daily product-selection and approval behavior

### Decision

Deferred.

## Option D — mobile-first responsive web app, PWA-ready

### Description

One responsive web application is authoritative. Mobile narrow-width is the primary design target, desktop is fully supported, and the architecture remains PWA-ready without requiring installability for MVP success.

### Strengths

- one product surface across mobile and desktop
- fastest iteration for a personal workflow
- supports PC research + mobile approval using the same backend/state model
- can later add installability, push, share-target, or native shells when justified
- avoids app-store dependency for the first validated release

### Weaknesses

- browser/PWA background behavior varies by browser and OS
- push/installability cannot be assumed everywhere
- heavy camera/share-sheet workflows may eventually justify a native shell
- mobile browser tab/session lifecycle must be designed carefully

### Decision

**Selected for ThreadScout v1.**

## Selected platform statement

> ThreadScout v1 is a mobile-first responsive web application. It is PWA-ready and desktop-supported. Native iOS/Android applications are not part of MVP and require a later evidence-based decision.

## Revisit conditions

Native application work is reconsidered only if validated usage shows that one or more of these are materially limiting the workflow:

- camera/media capture friction
- OS share-sheet integration
- push/background delivery reliability
- deep-link or credential/session friction
- offline requirements
- repeated mobile browser usability failures

A native app is not justified merely because the product is used on a phone.
