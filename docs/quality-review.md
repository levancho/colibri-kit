# Colibri Kit quality review — 2026-11-02

Review scope: live landing page and component gallery, repository CSS/token architecture, key behavior controllers, package manifests, build output, installation documentation, and existing tests. This is a targeted engineering review, not an exhaustive accessibility certification or security audit.

## Judgment

Keep the platform-first direction. The small CSS core, semantic markup contract, layout primitives, native dialogs and dependency-free behavior controllers are useful foundations. No Tailwind or replacement utility-class system was added.

The implementation did not consistently fulfill that direction. The optional UI theme and its appearance controls had accumulated broad descendant selectors, repeated declarations and `!important` overrides. The core theme's font token was invalid in its font shorthands. More catalog entries would have amplified these weaknesses. Correctness, readable defaults and reproducible checks were the higher-value investment.

## Implemented fixes

| Finding | Result |
|---|---|
| Core `--ui-font: inherit` leaves font shorthands without a usable font family | Valid system font stack; explicit consistent trigger typography |
| Accordion mixes separator rows, filled headers and an appended guide rail; heading/direct triggers differ | Single owned-part rule set, aligned content, consistent labels, no default guide rail |
| Tabs and accordion themes/looks override descendants with competing important rules | Theme and look differences expressed as component tokens; structural rules live in one place |
| Broad accordion/tab selectors reach into nested components | Direct ownership selectors isolate headers, panels and rails |
| Tab rails can exceed their container without a page reset | Component box sizing and bounded horizontal scrolling |
| Reset removes dialog centering and `.stack` reveals closed dialogs | Preserve native centering and closed-dialog visibility; bound dialog cards to viewport |
| Custom tab IDs are not reflected in ARIA ID references | Wire relationships to the actual IDs |
| Disabled/removed/default tabs and RTL navigation have gaps | Disabled filtering, safe selection fallback, refresh recovery, RTL arrows and manual-activation regressions |
| Combobox chips interpolate labels/custom values into HTML | DOM construction with `textContent` and attribute setters; injection regression test |
| Core dark primary buttons use nearly white text on a light accent | Scheme-aware foreground token |
| Scoped hue claims do not match inherited derived-token behavior | Explicit `data-colibri-theme` boundary recomputes the local palette |
| Forced-colors input focus relies on suppressed shadows | System-color outline fallback |
| Code highlighting covers landing-page Copy buttons | Explicit button stacking; clipboard error feedback |
| Storage exceptions can break landing-page controls | Optional storage; validated language/theme values |
| Gallery `content-visibility` changes floating-layer positioning | Disable containment while an owned layer is open |
| Package metadata disagrees with documented names; themes are not exported | Align source package name, export optional themes, retain auto/CSS side effects and restrict package contents |
| Installation examples reference unpublished npm releases | Source-checkout installation instructions; no registry publication performed |
| Catalog/size metrics drift from shipped files | Generate public metrics and README catalog from the build |
| Tests lack reproducible install/CI and built-site coverage | Lockfile, patched browser-test dependency, self-contained browser servers and CI |

## Verification and limits

- Unit suite: 60 tests covering existing behavior plus added tab and chip regressions.
- Existing browser flows: component gallery, conversation/auth/sidebar blocks and rendered FreeMarker output.
- New browser foundations: built landing page at 320/768/1440px; modal hiding/placement/focus; full and minified CSS palette behavior; forced-colors focus; denied storage/clipboard.
- New style matrix: core, Glacier, Ember and Midnight; light/dark; 320/1100px; default plus three accordion and three tab looks. Checks include typography, target dimensions, bounded rails and nested component isolation. Screenshots were inspected for the revised core and Ember defaults.
- Package dry run excludes site/build/test artifacts. npm audit after the browser dependency update reported zero known vulnerabilities; the initial development tree reported nine high-severity entries. This does not establish absence of application vulnerabilities.
- CI configuration is included; local results do not establish that remote CI has run.
- Changes are prepared as a repository branch. This review does not activate production or publish npm packages.

## Remaining work, in order

1. Extend the same ownership/token discipline to other UI theme sections and the remaining appearance knobs. The whole optional UI stylesheet has not been converted to layers; saying all user CSS always wins would still be misleading. Keep normal CSS core overrides distinct from deliberate visibility/touch safeguards.
2. Exercise React wrappers under Strict Mode, rerenders, dynamic children and controller teardown. React was source-reviewed, not integration-tested in this pass. The wrapper imports the full registry and is not equivalent to a minimal per-controller import.
3. Add Firefox and WebKit coverage, real screen-reader checks, and contrast checks for arbitrary custom palettes and every theme. Chrome viewport tests do not establish cross-browser or assistive-technology conformance.
4. Review other generated markup/data boundaries and component teardown on HTMX swaps. The confirmed combobox injection path is fixed; this was not a complete security audit.
5. Establish a versioned distribution/release process before advertising registry installation or using the mutable demo host as a production CDN. Both `@colibri-kit/ui` and `@colibri-kit/css` returned npm-registry 404 during this review.

The automatic initializer imports the full controller registry. For a page with only a few controls, use explicit imports such as `@colibri-kit/ui/core/tabs` and initialize those roots directly. A small CSS file does not establish a small total behavior payload.
