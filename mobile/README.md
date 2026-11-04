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

## Local data

Remember Numbers remains an explicit choice. The web version keeps browser
storage. The app hydrates a synchronous calculator cache from Capacitor
Preferences before importing the calculator, then serializes complete snapshots
to one native preference. Clear Saved Data also disables saving. Existing
on-screen entries remain until reload, matching website behavior. Read failures
stop startup without overwriting saved data; write failures show a visible error.
System backups may include local app data; no app-level sync is implemented.

The app privacy manifest declares UserDefaults use for this app's own data
(CA92.1). App Store privacy answers still require a final review of the shipped
binary and any future SDK changes.

## Verification and remaining release work

November 3, 2026: shared calculator regression suite passed (202 tests); focused
native storage and opt-in tests passed (5 tests, including two existing tests).
Both Debug simulator and unsigned Release iPhone builds passed; the Release
bundle includes the validated privacy manifest. Bundled HTML links/assets were
checked for missing files. The simulator build launched and rendered the calculator in an isolated iPhone
17e / iOS 27 simulator named Purpose Fi Development. Device Hub interaction was
stopped after the owner reported concurrent testing of another app.

Before distribution, verify actual iPhone keyboard dismissal, navigation through
all tools, saved numbers after force quit/relaunch, clearing, offline behavior,
VoiceOver, larger text, rotation and iPad layout. Unit tests exercise storage
ordering and reopen behavior with a Preferences double; they do not establish
physical-device persistence or interaction acceptance. Store listing, screenshots,
pricing, signing, TestFlight and submission are not completed by this build.
The app icon is a full-bleed opaque 1024px square derived from the existing
sun/compass mark. Do not substitute the website PNG: its white rounded corners
are hidden by CSS on the website but remain visible under the iOS icon mask.

## Later Android support

The mobile bundle and Preferences adapter already use cross-platform Capacitor
APIs. Add `@capacitor/android` on the matching major version, run `npx cap add
android`, then build the same mobile bundle and sync Android. Android-specific
Back-button behavior, keyboard/layout checks, signing and store testing remain
necessary. No Android project is generated in this iOS-first change.

## Named saved sets (build 3)

Open Saved sets of numbers near the top of the calculator. Enter a name and
choose Save new copy. Each copy includes shared assets, future changes, FI goals,
and the persisted settings for all calculators and guardrails. Temporary
comparison drafts are not included. Theme remains a device preference.

Select a copy to load, update, rename, or delete it. Copies are explicit snapshots,
not automatically updated by later edits. Loading confirms replacement of the
current numbers, writes the snapshot atomically, enables Remember Numbers, and
reloads the calculator. Save your current work as a copy before switching if you
want to keep it. Remember Numbers still controls the current working plan;
Clear current numbers and turning saving off do not delete named copies. Delete
selected removes only that named copy. Copies are local, with no sync or export.

The named library uses a separate Preferences key. Failed save/delete operations
leave its prior durable contents intact. Existing current-plan storage is not
migrated or cleared. Tests cover independent copies, reopen, rename, update,
deletion, duplicate/empty names, failed writes and atomic current-plan loading.
The full suite passes 208 tests. Browser preview confirmed saving two copies and restoring the baseline amount
after loading it (1,000,000 restored after editing to 123,456). The dialog
automation initially timed out, but the reload and restored field were verified.
Physical-device interaction and relaunch checks remain owner acceptance work.
