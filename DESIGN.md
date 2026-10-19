---
name: Liam's Case-File Cabinet
description: A detective's notebook kept as a filing cabinet of case files, with a lamp-lit case desk on the cover; the site is its own portfolio piece.
colors:
  case-50: "#fdfaf3"
  case-100: "#f7efd9"
  case-200: "#ecdfbd"
  case-300: "#dcc89a"
  case-400: "#c2a877"
  case-500: "#a3865a"
  case-600: "#8a6d45"
  case-700: "#6b5336"
  case-800: "#4a3925"
  case-900: "#2c2118"
  case-950: "#120d0a"
  stamp-50: "#fdf1ef"
  stamp-100: "#f9d9d5"
  stamp-200: "#f0b3ac"
  stamp-300: "#e28277"
  stamp-400: "#cf5a4c"
  stamp-500: "#b3362b"
  stamp-600: "#922a21"
  stamp-700: "#74211a"
  stamp-night: "#e2574a"
  stamp-night-strong: "#f2795e"
  cream-100: "#f4ead2"
  phosphor-300: "#ffd98a"
  phosphor-400: "#f0b429"
  phosphor-600: "#b9860a"
  desk-manila: "#d4ad6e"
  desk-paper: "#f2e7cf"
  desk-leather: "#1d5a43"
  manila-guide: "#c9a465"
  index-stock: "#f8f1df"
  index-stock-night: "#e7dbc0"
  index-rule: "rgba(90, 130, 170, 0.18)"
  note-yellow: "#f3dc8a"
  brass: "#b8904f"
  brass-deep: "#8a6a36"
typography:
  display:
    fontFamily: "'Special Elite', 'LXGW WenKai TC', ui-monospace, Menlo, monospace"
    fontSize: "clamp(3rem, 8vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  headline:
    fontFamily: "'Special Elite', 'LXGW WenKai TC', ui-monospace, Menlo, monospace"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1.25
  title:
    fontFamily: "'Special Elite', 'LXGW WenKai TC', ui-monospace, Menlo, monospace"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
  card-title:
    fontFamily: "'Special Elite', 'LXGW WenKai TC', ui-monospace, Menlo, monospace"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.375
  tab:
    fontFamily: "'Special Elite', 'LXGW WenKai TC', ui-monospace, Menlo, monospace"
    fontSize: "0.9rem"
    fontWeight: 400
    letterSpacing: "0.2em"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "'Share Tech Mono', ui-monospace, Menlo, monospace"
    fontSize: "0.7rem"
    fontWeight: 400
    letterSpacing: "0.1em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "96px"
components:
  cabinet-tab:
    backgroundColor: "{colors.desk-manila}"
    textColor: "{colors.case-900}"
    typography: "{typography.tab}"
    rounded: "{rounded.md}"
    padding: "14px 9px 14px 12px"
  cabinet-tab-active:
    backgroundColor: "{colors.desk-paper}"
    textColor: "{colors.case-900}"
  index-card:
    backgroundColor: "{colors.index-stock}"
    textColor: "{colors.case-900}"
    rounded: "{rounded.sm}"
    padding: "16px 20px 20px"
  index-card-night:
    backgroundColor: "{colors.index-stock-night}"
    textColor: "{colors.case-900}"
  date-stamp:
    textColor: "{colors.stamp-500}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 7px"
  page-stamp:
    textColor: "{colors.stamp-500}"
    rounded: "{rounded.sm}"
    padding: "2px 10px"
  guide-tab:
    backgroundColor: "{colors.desk-manila}"
    textColor: "{colors.case-900}"
    rounded: "{rounded.md}"
    padding: "7px 14px 6px"
  tool-button:
    backgroundColor: "{colors.case-50}"
    textColor: "{colors.case-900}"
    rounded: "{rounded.md}"
    size: "40px"
  icon-button:
    backgroundColor: "{colors.case-50}"
    textColor: "{colors.case-600}"
    rounded: "{rounded.full}"
    size: "40px"
  icon-button-hover:
    backgroundColor: "{colors.case-50}"
    textColor: "{colors.stamp-500}"
  button-primary:
    backgroundColor: "{colors.case-900}"
    textColor: "{colors.cream-100}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-outline:
    textColor: "{colors.case-900}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
  button-stamp:
    backgroundColor: "{colors.stamp-500}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "6px 16px"
  button-stamp-hover:
    backgroundColor: "{colors.stamp-600}"
  input-inquiry:
    textColor: "{colors.case-900}"
    padding: "4px 0"
  input-search:
    backgroundColor: "{colors.case-50}"
    textColor: "{colors.case-900}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  chip-tag:
    textColor: "{colors.case-600}"
    rounded: "{rounded.md}"
    padding: "2px 8px"
  chip-filter:
    textColor: "{colors.stamp-500}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  case-card:
    backgroundColor: "{colors.case-50}"
    textColor: "{colors.case-900}"
    rounded: "{rounded.2xl}"
    padding: "20px"
---

# Design System: Liam's Case-File Cabinet

## Overview

**Creative North Star: "The Case-File Cabinet"**

The site is a detective's filing cabinet. Every section is a drawer, every page is a case-file cover, and every post is a ruled index card filed in that drawer. Manila tabs stick out of the left edge of the screen, and red rubber stamps mark each file. The cover (homepage) still opens on the lamp-lit WebGL case desk: a green leather blotter with brass corners, a manila case file, a banker's lamp and a brass magnifier that reads Liam's dossier at 2.4x. Below the desk, the work is laid out as paper on that desk: fanned index cards, taped sticky notes, a red thread with brass pins, and a manila envelope. The craft is the proof. Interaction quality is part of what the site says.

The world is built from physical stationery, not app chrome. Paper objects (index cards, manila tabs, envelopes, sticky notes, brass fittings) keep their real colours in both themes, the way a card on a desk does not change colour when the room light changes. The page ground around them follows the theme. In light mode it is daylight on case paper. In dark mode it is warm night ink (`case-950`), with the lamp lighting the scene. Reading pages stay calm. Atmosphere (dust motes, the dark-mode flashlight) sits behind content and never covers text.

The user rejected the earlier floating pill navbar with hover mega-menus because it looked too much like koimsurai.com. The cabinet replaced it. The world also refuses the avatar-circle + gradient-blob hero. With the user's approval, the decorative CSS colour orbs, CRT scanlines, giant "LIAM" watermark and hero emoji were removed. `AmbientBackground.svelte` is still on disk but is not mounted, and it is not part of the system.

**Key Characteristics:**
- Navigation is a cabinet: vertical manila index tabs on the left edge, each pulling out a ruled index card of that drawer's contents.
- Paper objects in fixed colours (cream index stock, manila, sticky-note yellow, brass) sit on a theme-aware page ground of warm case paper or night ink.
- There is one chromatic accent, rubber-stamp red. It appears as stamps, head rules, date stamps, the red thread and interaction states. Lamp amber appears only as light.
- Typewriter display (Special Elite, with LXGW WenKai TC for CJK) for every title and label on an object, system sans for reading, and Share Tech Mono for typed data.
- Motion is physical: tabs slide out, cards file in and pull up out of the drawer, stamps press down, the thread draws itself. Every motion has a reduced-motion path.

### Process disclosures
- **No seed key (original refinement).** The concept-seed direction roll was skipped. That pass refined an established, user-confirmed world (the detective's notebook), so no seed key exists. The user chose the 3D direction ("A 深夜辦案桌", late-night case desk) from three proposed options.
- **No seed key (cabinet restructuring).** The cabinet restructuring was also a user-chosen direction. The user picked option A ("case-file cabinet") of three proposed own-world directions, after saying the UI looked too much like koimsurai.com. No concept-seed roll was made for it. The user also asked for detective-themed page names (URLs unchanged).
- **Font delivery.** Special Elite, Share Tech Mono and LXGW WenKai TC (400/700) load from Google Fonts with `display=swap` (see `src/app.html`). This matches the project's existing font delivery. They are not self-hosted.
- **Known open item.** On the hero dossier, the paper fibre and crease texture does not read at viewport scale. Only the coffee ring and the manila tone register. The finish review marked this fix as partial.
- **Shipped but not canonized.** The typed overline above titles ships in three places: the hero line "CASE FILE · No.… · 調查中", the PageHeader line "FILE № nnnn — drawer", and the footer label holder's "DRAWER · 檔案總覽". These are eyebrow lines, which the craft floor refuses. They are recorded here as defects in the build, not as a pattern for new surfaces.

## Colors

The palette is aged paper and ink with one red stamp. Manila, cream card stock and brass are materials, not accents. Lamp amber is light, not paint.

### Primary
- **Rubber-Stamp Red** (`stamp-500`; in dark mode the page accent becomes `stamp-night`): the accent token (`--color-accent`). It is used for the PageHeader rubber stamp, the 2px head rule on index cards (`stamp-400` at 60 to 70%), date stamps, the red thread on the home case line, the active dot on cabinet tabs and index-card lines, hovered links, focus outlines, the caret and the selection tint. `stamp-600` / `stamp-night-strong` are the pressed or strong variant (`--color-accent-strong`).

### Secondary
- **Lamp Amber** (`phosphor-300`, `phosphor-400`, `phosphor-600`): fixed values that dark mode does not swap. They are used only where light is depicted: tilt-card glare, the dark-mode flashlight pool, the warm end of the reading-progress hairline, dust motes in dark mode, and the lamp in 3D.

### Tertiary (object stock)
- **Manila** (`desk-manila`): cabinet index tabs, the case label (brand), the phone "檔案" tab, the selected category guide tab, and the contact envelope. Inactive guide tabs mix it 55% into `surface-alt`. Tabs carry a faint SVG noise grain.
- **Pulled Manila** (`desk-paper`): the active cabinet tab, which reads as pulled forward into the light.
- **Guide-Card Manila** (`manila-guide`): month guide cards and their tabs in the blog drawer.
- **Index Stock** (`index-stock`; `index-stock-night` in dark mode): ruled index cards, the nav's index cards, the profile menu, and the footer label holder. Ruled with `index-rule` lines every 28px.
- **Sticky-Note Yellow** (`note-yellow`): the 現場筆記 notes on the homepage.
- **Brass** (`brass`, `brass-deep`): the footer label-holder frame and drawer handle, and the pin heads on the case line.
- **Green Leather** (`desk-leather`): the 3D blotter only.

### Neutral
- **Case Paper** (`case-50`): the light page ground (`--color-surface`).
- **Manila Wash** (`case-100`): the light alt surface (`--color-surface-alt`). It is the blog drawer interior, the footer drawer front, list-row hovers and comment bubbles.
- **Folder Edge** (`case-300`): light borders (`--color-border-case`) and the PageHeader perforation dots.
- **Faded Ink** (`case-600`): muted page text in light mode (`--color-ink-muted`), and the typed metadata on paper objects in both themes.
- **Carbon Ink** (`case-900`): body text in light mode (`--color-ink`), the text on every paper object in both themes, the dark alt surface, the phone drawer sheet and the envelope's ink button.
- **Warm Night Ink** (`case-950`): the dark page ground.
- **Lamplit Cream** (`cream-100`): body text in dark mode and text on the ink button and phone sheet.

### Named Rules
**The One Stamp Rule.** Stamp red is the only chromatic accent. It marks stamps, head rules, threads and interaction, never large fills. Its largest fill is the small comment submit button. The faint blue ruling on index cards is a property of the paper, not an accent.

**The Light Is Amber Rule.** Phosphor amber appears only as light (glare, flashlight, lamp, progress glow). It never fills a surface or colours text.

**The Object Stock Rule.** Page grounds, page text and page chrome use the semantic tokens (`surface`, `surface-alt`, `ink`, `ink-muted`, `border-case`, `accent`), so dark mode swaps them in one place. Paper objects keep fixed stock colours in both themes, and the text printed on them uses fixed ramp steps (`case-900`, `case-700`, `case-600`), so a cream card stays a cream card with dark ink on a dark page.

## Typography

**Display Font:** Special Elite, with LXGW WenKai TC for CJK glyphs (fallback ui-monospace, Menlo, monospace)
**Body Font:** System sans (Tailwind default `ui-sans-serif, system-ui`)
**Label/Mono Font:** Share Tech Mono (`font-mono-hack`)

**Character:** A worn typewriter for anything printed or typed on a file: titles, tabs, card heads, stamps. A hand-brushed 文楷 carries Chinese at the same pitch. A neutral system sans carries reading text, so long posts never fight the costume.

### Hierarchy
- **Display** (400, 3rem rising to 4.5rem at `sm`, line-height 1): the hero name, typed in by the Typewriter component.
- **Headline** (400, 2.25rem rising to 3rem at `sm`, leading tight): PageHeader titles, which type in by clip-path steps. Post-body `h1` to `h3` in `.prose` use the display face at weight 400 with letter-spacing 0.
- **Title** (400, 1.5rem rising to 1.875rem at `sm`, display face): home section headings (最新卷宗, 現場筆記, 案件線, 最新證詞). Older index pages still use system sans bold here.
- **Card title** (400, 1.125rem to 1.25rem, display face): index-card heads and nav index-card headings.
- **Tab** (400, 0.9rem, display face, tracking 0.2em): cabinet tabs, set vertically (`writing-mode: vertical-rl`, upright glyphs), and blog guide tabs, set horizontally.
- **Body** (400, 0.875rem to 1rem, leading 1.625 to 1.75): excerpts, notes, testimony and descriptions. PageHeader descriptions are capped at `max-w-2xl`.
- **Label** (Share Tech Mono, 0.65rem to 0.75rem, tracking 0.1em to 0.3em): typed data on objects. This covers date stamps, card counts ("6 份"), card notes, kind and tag lines, the inquiry form labels, month guide labels, and the footer's "本案於 … 立案".

### Named Rules
**The Typewriter Speaks Titles Rule.** The display face is for titles, page headers, prose headings, tabs, stamps and index-card heads. Reading text, form input text and dense lists stay in system sans, and typed data stays in Share Tech Mono.

**The Same Voice In Two Scripts Rule.** Every display stack lists Special Elite first and LXGW WenKai TC second, so Latin and CJK in one title share a voice. Never put a system CJK face in a display role.

## Layout

The page is a desk beside a cabinet. On desktop (`lg`, 1024px and up), the cabinet tabs are fixed to the left edge starting 96px from the top, and `main` carries 40px of left padding to clear them. The manila case label (brand) is fixed 16px from the top-left corner, and the tool buttons are fixed 16px from the top-right. There is no top bar.

- **Phone (below `lg`):** the tabs and case label are hidden. A single "檔案" tab rises from the bottom-left corner (16px in). It opens the whole cabinet as a dark drawer sheet from the bottom (max 82vh), listing each drawer as an index card with its contents inline. The footer adds 64px of bottom padding so the tab never covers it.
- **Page header:** left-aligned, with 112px of top padding (128px at `sm`) and 40px below.
- **Containers:** `max-w-6xl` for the hero, `max-w-5xl` for home sections and the footer, and `max-w-4xl` for the blog catalog. Horizontal padding is 24px.
- **Home:** sections are separated by 96px. The three latest files fan across three columns at `md`, the outer two overlapping the middle by 24px. Sticky notes sit in three columns at `sm`. Testimony and the envelope share a two-column row at `md`.
- **Blog catalog:** a single column. Category guide tabs stand in a row above the drawer, then the drawer holds month guide cards and overlapping index cards (each card overlaps the one above by about 10px).
- **Footer:** contents in four columns at `lg` and two at `sm`.
- **Spacing rhythm:** 8, 12, 16, 24 and 40px inside components, and 96px between sections. A global `scroll-margin-top: 6rem` keeps anchors clear of the fixed chrome.

### Named Rules
**The One Site Map Rule.** The cabinet tabs, the phone drawer sheet and the footer contents all read from the `drawers` list in `src/lib/site-nav.ts`. A page is registered once there, as a card in a drawer, and appears everywhere.

## Elevation & Depth

Depth comes from objects resting on surfaces. Paper objects carry a soft contact shadow at rest, as stationery does on a desk. Flat page UI (legacy case cards, the search field) stays flat at rest. Under the pointer, objects rise, straighten and cast a deeper shadow. Drawers are recessed: the blog drawer and the footer drawer front darken at their top edge with an inset shadow, so cards sit down inside them. Real depth lives in the WebGL hero desk, whose lighting follows the theme (hemisphere light 0.85 in light mode and 0.22 in dark, with the lamp spot at 38 and 70). A sitewide layer of dust motes sits at three depths behind content.

### Shadow Vocabulary
- **Card at rest** (`box-shadow: 0 1px 0 rgba(255,255,255,0.6) inset, 0 18px 40px -18px rgba(20,12,6,0.55)`): every index card.
- **Card pulled** (`box-shadow: 0 1px 0 rgba(255,255,255,0.6) inset, 0 30px 40px -22px rgba(20,12,6,0.65)`; fanned home cards use `0 36px 50px -24px rgba(20,12,6,0.6)`): a card lifted out of the drawer on hover.
- **Manila tab** (`box-shadow: 0 1px 0 rgba(255,255,255,0.35) inset, 0 6px 14px -8px rgba(44,33,24,0.55)`): cabinet tabs and the case label. The phone tab casts upward (`0 -8px 20px -10px rgba(44,33,24,0.6)`).
- **Drawer recess** (`box-shadow: inset 0 14px 18px -12px rgba(0,0,0,0.35), inset 0 -1px 0 rgba(255,255,255,0.05)`): the blog drawer interior.
- **Brass frame** (`box-shadow: 0 0 0 3px #b8904f, 0 0 0 4px #8a6a36, 0 8px 16px -8px rgba(0,0,0,0.5)`): the footer label holder.
- **Sticky note** (`box-shadow: 0 14px 24px -14px rgba(40,25,5,0.55)`) and **envelope** (`box-shadow: 0 20px 40px -24px rgba(20,12,6,0.6)`).
- **Stamp lift** (`box-shadow: 0 8px 20px -8px color-mix(in srgb, var(--color-accent) 35%, transparent)`): hover on legacy `.case-card`, with a 2px rise and an accent border.
- **Lamp halo** (`box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-accent) 12%, transparent), 0 10px 20px -10px color-mix(in srgb, var(--color-accent) 60%, transparent)`): hover on a round icon button.
- **Ink button** (`box-shadow: 0 10px 24px -12px rgba(0,0,0,0.6)`): the envelope's mail button.

### Named Rules
**The Earned Lift Rule.** Nothing rises at rest. Paper objects sit with a soft contact shadow, and flat UI sits with none. Rise, straightening and a deeper shadow appear only under the pointer.

**The Atmosphere Behind Text Rule.** Dust, flashlight and desk layers sit at negative z or behind content, and are `aria-hidden` and pointer-transparent. Nothing atmospheric covers reading text.

## Shapes

The form language is cut paper. Cabinet objects have barely rounded corners: index cards, stamps, date stamps, the label holder and envelope buttons use 3 to 4px. Tabs are rounded only on their free edge: cabinet tabs at 0 6px 6px 0, guide tabs at 6px 6px 0 0, month guide labels at 5px 5px 0 0. Tool buttons are 6px squares. The blog drawer closes at 8px on its bottom corners, and the phone sheet opens at 12px on its top corners. Full round is kept for the 40px social icon buttons, the punch hole, pin heads and the incumbent pills on older pages (comment controls, bookshelf search, filter chips). The PageHeader rule is a tear-off perforation of 1.2px dots every 10px, not a hairline. Paper objects are set at small tilts (fanned cards and sticky notes at about ±2deg, date stamps at -4deg, page stamps at -9deg) and straighten under the pointer.

### Named Rules
**The Cut-Paper Corner Rule.** New cabinet objects use 3 to 6px corners, rounded only where paper would be cut. A full pill is reserved for round icon buttons and the incumbent controls that already use it.

## Components

### Navigation (Cabinet)
Manila index tabs stand out of the left edge, one per drawer: 封面, 案件簿, 現場筆記, 證物室, 檔案室, 證詞. The text runs vertically in the display face.
- **Rest:** each tab is tucked 10px off-screen. Each tab down the stack is 2.5% darker, like real guide tabs.
- **Hover / focus:** the tab slides fully out (0.35s, expo ease-out), and that drawer's index card flies in beside it (16px, 260ms, cubicOut). The card is ruled, with the drawer name in the display face over a 2px stamp-red head rule, a mono count ("4 份"), and one line per card: label in sans medium, a typed note in mono, and a punch hole at the bottom. Lines nudge 4px right on hover. The current line carries a 6px red dot. The card closes 160ms after the pointer leaves, or on Escape.
- **Active:** the tab pulls 4px further out, turns `desk-paper`, and carries a 5px red dot.
- **Brand:** a manila case label in the top-left corner, "No.YY-0819" in mono plus "Liam 偵探手記" in the display face.
- **Phone:** the "檔案" tab (it adds "· drawer" when inside one) opens a `case-900` drawer sheet over a blurred 40% `case-950` scrim. The current drawer shows "目前位置" in stamp red.
- **Tools:** search (Ctrl/⌘ K), theme and account are 40px stamped squares in the top-right. On hover they rise 2px, rotate -3deg, and take an accent border. The account menu opens as a small index card.

### Page Header (Case-File Cover)
Every section page opens on a case-file cover, aligned left.
- **Title:** display face, typed in by clip-path in 14 steps over 0.9s. A paper-clip SVG in `case-500` clips the top-left corner and drops in at 0.2s.
- **Stamp:** a rubber stamp (prop `stamp`, default "歸檔", best at 2 to 4 characters) sits on the right end of the title row. It has a 3px double accent border, display face, 0.25em tracking, 85% opacity, a -9deg tilt and an SVG noise mask for uneven ink. It presses down at 0.95s (0.45s, scale 2.1 to 0.96 to 1 on `cubic-bezier(0.2, 0.9, 0.3, 1.2)`). Pages choose their own word: 調查中, 速記, 館藏, 清點, 機密, 結案, 受理中, 公開.
- **Below:** an optional muted description, then the perforation line, then optional children (the blog inquiry form, stats).

### Index Card (signature)
Cream ruled card stock with a pale blue line every 28px, 4px corners, and the card-at-rest shadow. Inside: a display-face head over a 2px stamp-red rule, a red date stamp at the top-right, a mono kind and tag line, a sans excerpt (two lines) in `case-800`, mono counts with Lucide icons, and a 12px punch hole centred at the bottom (inset shadow, filled with `surface-alt`). The whole card is the link, through a stretched pseudo-element.
- **Blog catalog:** cards overlap in the drawer and file in from 28px below on load (0.6s, staggered 70ms after a 200ms delay, capped at 8). On hover a card pulls up 14px, tilts -0.4deg and takes the card-pulled shadow.
- **Home 最新卷宗:** three cards fanned at small tilts. On hover a card straightens, rises 18px and scales to 1.02.
- **Testimony:** a single card with "證人：… · 案件《…》" in mono over the quoted body. It rises 4px on hover.

### Date Stamp
Red ink in a 1.5px stamp-red border, 3px corners, Share Tech Mono at 0.72rem with 0.08em tracking, rotated -4deg at 85% opacity. Dates are set as `YYYY.MM.DD`.

### Blog Catalog Controls
- **Inquiry form:** typed lines in mono, "查詢：", "排序：", "線索：". The query field is a dashed bottom border only, with sans input text, and the border turns accent on focus. Sorts are plain words separated by "/"; the current one is underlined with a 2px accent line. Clues are `#tag` words with a small count. A selected clue turns accent and is struck through, as if crossed off.
- **Category guide tabs:** manila tabs standing up out of the drawer's top edge (6px top corners, display face). Inactive tabs sit 6px down and rise 4px on hover. The selected tab is full manila and fully raised.
- **Month guide cards:** a 0.9rem `manila-guide` strip with a tab carrying "YYYY · MM" in mono. The tab alternates left and right down the drawer.

### Home Objects
- **Sticky notes:** `note-yellow` squares at small tilts, each with a strip of translucent tape. They straighten and rise 6px on hover.
- **Case line:** "{year} 案件線" is a red thread drawn across the year (1.6s draw-in), with brass pins at each post's date. Hovering or focusing a pin lifts its head and shows a small index card with the title and date. Month ticks sit below in mono.
- **Envelope:** a manila envelope with a folded flap, addressed "TO: Liam · 線索收件". It holds an ink button (`case-900` fill, cream text, 4px corners) and an outline button (`case-700` at 50% border, turning stamp on hover). Both are magnetic.

### Footer (Bottom Drawer)
The cabinet's bottom drawer: a `surface-alt` front with a darkened top edge, a cream label holder in a brass frame reading "Liam 偵探手記", and a brass drawer handle below it. Under it, every drawer's contents are typed out as columns, with the drawer name in the display face and links in sans that draw an underline from the left on hover (0.3s). A dashed rule separates the closing line, "本案於 {date} 立案 · © {year} Liam" in mono, from the 36px round social icon buttons.

### Buttons
- **Icon button:** a 40px round lamp-lit button with a 1px `border-case` border, `surface` at 70%, and `ink-muted` icons. On hover it springs up 4px on `cubic-bezier(0.25, 1.35, 0.5, 1)`, the icon scales to 1.15 and rotates -8deg, colour and border turn accent, and the lamp halo appears. On press it scales to 0.92 in 0.08s. It is used for the hero socials and the footer (36px).
- **Tool button:** a 40px square with 6px corners, `surface` at 85% and a `border-case` border. See Navigation.
- **Ink / outline (envelope):** see Home Objects. Both are 10px by 20px with 4px corners.
- **Stamp (form submit):** an `accent` pill with white text, 6px by 16px, becoming `accent-strong` on hover. It is the comment submit.
- **Focus:** global `:focus-visible` uses a 2px accent outline, offset 3px, with a 6px radius.

### Incumbent Page UI (older pages)
Comments, the post page, and the older index pages (articles, moods, portfolio, watch, tags, bookshelf, setup) have not moved into the cabinet. They keep the earlier paper-UI layer, which is still valid system:
- **Case card:** 16px corners, `surface` at 70 to 75% with `backdrop-blur-sm`, a 1px `border-case` border at 70%, and 16 to 20px padding. It is flat at rest. On hover it gets the stamp lift and an accent border, plus optional tilt (up to 6deg, `perspective(900px)`, amber soft-light glare, mouse only).
- **Search pill:** `surface/70` with a `border-case` border; on focus-within the border turns accent.
- **Chips:** tags at 6px with a 1px border, turning accent on hover. Filter chips are accent at 10% on a full pill.
- **Comment composer and bubbles:** 16px corners on `surface-alt`. Bubbles keep a 2px top-left corner like a speech tab.

### Hero Case Desk (signature)
A Three.js scene behind the hero text: a green leather blotter with brass corners, a manila folder holding an ivory dossier typed with the real post count, word count and active days, a coffee ring, a banker's lamp with green glass, and a brass magnifier.
- **Intro:** the lamp clicks on with two flickers over about 940ms. At 800ms the folder cover swings open.
- **Loupe:** the magnifier follows the pointer over the file plane and renders the dossier at 2.4x (lens 640px on desktop, 384px on phones).
- **Click:** toggles the folder cover. **Scroll:** as the hero leaves, the lamp dims to 15% and the camera lifts. **Theme:** lighting re-tunes on `data-theme`.
- **Reduced motion:** a static frame with the lamp on and the cover open.
- Over it: the typed name, a Chinese introduction, a typed progress line in mono, the round social buttons, and a mono instruction line at bottom right.

### Motion Grammar
- **Entrance:** rise 18px from blur(6px) over 0.8s on `cubic-bezier(0.16, 1, 0.3, 1)`, staggered by `--d`. Scroll reveals rise 8 to 24px over 0.5s, staggered 80 to 90ms.
- **Page transition:** View Transitions rack focus. The old page blurs out (6px, -8px, scale 0.99) over 0.22s, and the new page blurs in (8px, +10px, scale 1.01) over 0.28s.
- **Paper physics:** tabs slide and cards pull on expo ease-out (0.3 to 0.45s). Stamps press with an overshoot. The thread draws by dash offset.
- **Reading progress:** on post pages, a fixed 2px hairline running from accent to amber.
- **Flashlight:** in dark mode only, a 420px amber pool at 9% follows the mouse.
- **Reduced motion:** every entrance, file-in, stamp, thread draw, tab slide, tilt, magnetic pull, spring, transition and the desk animation turns off. Content stays visible.

## Do's and Don'ts

### Do:
- **Do** register every new page once, as a card in a drawer in `src/lib/site-nav.ts`, so the tabs, phone sheet and footer stay in sync.
- **Do** open every section page with the PageHeader case-file cover and give it a 2 to 4 character stamp word that fits the page.
- **Do** present listed items as index cards: `.index-card` stock, a display head over a stamp-red rule, a `.date-stamp`, and a `.punch` hole.
- **Do** keep paper objects in their fixed stock colours with fixed ink (`case-900`, `case-700`, `case-600`) in both themes, and build page grounds and page text from the semantic tokens.
- **Do** keep stamp red for stamps, rules, threads and interaction, and lamp amber for depicted light only.
- **Do** set titles, tabs and object heads in the display stack (Special Elite then LXGW WenKai TC) at weight 400, reading text in system sans, and typed data in Share Tech Mono.
- **Do** keep 3 to 6px cut-paper corners on new cabinet objects.
- **Do** let objects rest with a soft contact shadow and earn rise, straightening and deeper shadow under the pointer.
- **Do** give every new motion a `prefers-reduced-motion` path that leaves content fully visible.
- **Do** keep atmospheric layers `aria-hidden`, pointer-transparent and behind text.
- **Do** feed the hero dossier real site data only, and depict real objects with their real materials when extending the 3D desk.

### Don't:
- **Don't** bring back a floating pill navbar with hover mega-menus. The user rejected it as too close to koimsurai.com, and the cabinet replaced it.
- **Don't** use an avatar circle with a gradient blob as a hero. The desk replaced it.
- **Don't** reintroduce decorative colour orbs, CRT scanlines, giant name watermarks or emoji in the hero. These were removed with the user's approval.
- **Don't** use manila, index stock or brass as a page ground or for page text. They are object stock for tabs, cards, labels and envelopes.
- **Don't** let dust, flashlight or desk effects sit over reading text.
- **Don't** invent metrics for the dossier. It shows only real post count, word count and active days.
