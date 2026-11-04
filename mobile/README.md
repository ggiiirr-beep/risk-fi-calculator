# Purpose Fi iOS

The existing calculator is the product source for both the free website and the
app. `mobile/build.mjs` bundles it with Capacitor, adds phone styling and native
Preferences storage, and generates all calculator and policy routes locally.
It does not fetch the website or podcast feed. There are no accounts, sync,
analytics, payments, remote updates, or CloudKit capabilities.

## Build and run

Requires Node 22+, Xcode 26+, and the iOS simulator runtime. From the repository:

```sh
npm ci
npm run ios:sync
npm run ios:open
```

In Xcode, select the **App** scheme and an iPhone simulator, then Run. The app
appears as **Purpose Fi**. After changing shared calculator files, run
`npm run ios:sync` before building again. Website publication and app-store
releases remain separate; website deployment does not update installed apps.
Do not publish this development branch to the website as part of app testing.

For a physical iPhone, select the owner's Apple developer team under Signing &
Capabilities and connect the authorized device. The initial bundle ID is
`com.frompaycheckstopurpose.purposefi`; verify its availability before registering
it. No developer team, signing credentials, or provisioning profiles are stored
in this repository. Installing on a physical device, registering an app,
uploading to TestFlight, and submitting to the App Store require owner direction.

Unsigned command-line checks:

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -derivedDataPath .build-ios CODE_SIGNING_ALLOWED=NO build
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release -sdk iphoneos -derivedDataPath .build-ios CODE_SIGNING_ALLOWED=NO build
```

## Profiles and local data (build 4)

The app and website share `profiles.js`, `profile-ui.js`, and the calculator
startup module. The app uses native Preferences; the website uses localStorage.
Profile 1 exists from first launch and automatically saves the calculator's
persisted inputs/settings. Additional named profiles keep separate numbers. Selecting a
profile flushes pending changes before changing identity and reloading. Failed
saves block switching, with a Retry saving action. Profile names are text-only;
blank and duplicate names are rejected. Theme remains device/browser-wide.

The compact profile selector has a single ellipsis menu for new, rename, reset, delete current and delete all. Profile 1 is created automatically when no profiles remain. The three
destructive operations each use a modal confirmation with Cancel initially
focused; Escape cancels, and focus stays inside the dialog. Reset replaces all
calculator and guardrail settings with defaults while retaining the name. Delete
current selects another remaining profile or starts a fresh Profile 1. Delete
all clears every profile, current values and theme. Temporary scenario comparison
drafts are not part of persistent profiles.

One versioned record owns the active profile, profile data and theme. Native
writes are serialized. Browser writes use a Web Lock where available and check
the previously read value to reject stale tabs. There is no account, cross-device
or app/website sync. OS backups may include native app data.

First startup converts legacy remembered work to My profile and imports every
old app saved copy as a separate profile. Duplicate names are disambiguated.
The new record is written before old keys are removed; failed migration never
removes the old data. An empty record remains after Delete all solely as a schema
marker so old data cannot reappear. The app privacy manifest declares UserDefaults
use for this app's own data (CA92.1).

## Verification and remaining release work

November 3, 2026: 207 automated tests pass, including seven profile tests covering
migration, independence, autosave/reopen, reset/delete scopes, write failures and
stale browser tabs. Both mobile and website bundles build. The mobile preview
migrated the previous test copies; editing to 654,321, switching away and back
restored that value automatically. All three confirmation dialogs and their
Cancel actions were checked. A separate website preview restored 246,810 after
reload. The profile menu was visually checked at a 390px phone width.

Physical-device interaction, VoiceOver, larger text, rotation and iPad layout
remain release acceptance work. Signing/installing a development build does not
establish App Store readiness. Store listing, screenshots, pricing, TestFlight
and submission remain separate. Device Hub is not operated because the owner
may have concurrent testing there.

The app icon is an opaque 1024px square derived from the sun/compass mark.
Do not substitute the website PNG; its white corners are hidden by CSS on the
website but remain visible under the iOS icon mask.

## Later Android support

The mobile bundle and Preferences adapter already use cross-platform Capacitor
APIs. Add `@capacitor/android` on the matching major version, run `npx cap add
android`, then build the same mobile bundle and sync Android. Android-specific
Back-button behavior, keyboard/layout checks, signing and store testing remain
necessary. No Android project is generated in this iOS-first change.

Simulator follow-up (build 6): Device Hub smoke checks cover the main calculator
screens, profile creation/selection/relaunch, confirmations and cancellation,
privacy navigation, dark mode, and landscape menu scrolling. Native page reloads
use a root asset base because Capacitor may serve index.html for directory routes.
Privacy/terms links point to bundled HTML files. After explicit owner approval, signed build 6 was installed in place on the
physical iPhone; signing and installed-version checks passed. The app was not
launched on the physical phone.
