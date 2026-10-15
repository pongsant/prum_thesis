# Cycle of Love — interactive album

A complete buildless HTML/CSS/JavaScript prototype with a real Three.js jewel case, five selectable CD-R discs, reusable track pages, a CRT visual player, and About page.

## Run locally

Run `python3 serve.py` here and open http://localhost:4173. Use HTTP rather than opening HTML directly. No npm install or build step is required; Three.js and its license are included in `dist/vendor/`.

## Edit the project

Start with **`dist/data/album.mjs`**. It contains the project title, cover title, introduction, About sections, and all five tracks. Each track defines its title, number, handwritten disc label, status, description, concept, audio path, cover path, lyrics, movie media, and visual palette.

- BEGINNING and SELF reuse the existing M4A recordings, unchanged.
- FAMILY, FUTURE LOVE, and LETTING GO have complete pages and visual experiences marked coming soon. To enable one, add its audio file and change `status` to `available`.
- Set `project.cover` or a track's `cover` to an image path, such as `images/self-cover.jpg`. Leave `null` to use generated placeholder artwork.
- SELF references the preserved cue sheet in `dist/data/lyrics.js`. You can instead put `{ time: 12, text: 'Your lyric' }` objects directly in its `lyrics` field. Optional `end` and `emphasis` fields are supported. Times are seconds. The existing timings are drafts and need final vocal alignment.
- BEGINNING is instrumental; it does not invent lyric lines.
- Set `movie` to `{ type: 'video', src: 'video/self.mp4', loop: true, showLyrics: true }` for a silent MP4/WebM visual, or `{ type: 'image', src: 'images/self.jpg' }` for a still. Use `showLyrics: false` for a video with its own titles. Only the selected visual loads. Background video loops independently of the audio timeline.
- All media paths are relative to `dist/`. Keep videos compressed and reasonably sized for mobile.

## Files

| File | Purpose |
| --- | --- |
| `dist/index.html` | Four accessible page templates and shared audio element. |
| `dist/data/album.mjs` | Editable project and track content. |
| `dist/data/lyrics.js` | Preserved SELF lyric cue sheet. |
| `dist/js/album/app.mjs` | Navigation, track controls, previews, insertion/ejection, and lyric updates. |
| `dist/js/album/core.mjs` | Routing, time formatting, and lyric lookup. |
| `dist/js/album/art.mjs` | Procedural silver discs and placeholder covers. |
| `dist/js/album/stage.mjs` | Real 3D case, discs, CRT, materials, animation, and screen rendering. |
| `dist/js/audio.js` | Preserved audio player and Web Audio analyser. |
| `dist/styles/album.css` | Editorial layout, responsive styles, and lyric transitions. |
| `dist/audio/` | Preserved listening copies. Original WAV files remain outside this folder. |
| `tests/album.test.mjs` | Route, track availability, duration, and lyric boundary checks. |

## Interaction

Click the case or “Open the album,” then choose a disc. All tracks also have normal keyboard-accessible links. Track pages have Play/Pause, seeking, previous/next, and visual mode. In Movie mode, hovering or focusing a disc previews it silently; selecting it inserts it and starts the available recording. Eject stops audio, shuts down the CRT, and returns to selection. Navigation stops playback, and a single audio element prevents overlapping songs.

Space toggles playback when focus is outside a control. Escape ejects during visual playback when focus is outside a control. Standard Enter/Space activate focused buttons. Reduced-motion preferences simplify motion and disable audio-driven animation. If WebGL is unavailable, navigation, audio, lyrics, and visual-mode controls remain functional with flat artwork.

## Preservation and verification

The previous walkable prototype remains at `/room-prototype.html` with its supporting source files. The new homepage does not load those scripts. The original BEGINNING/SELF recordings, lyrics, and audio logic were checked against their pre-rebuild checksums.

Run `node --test tests/album.test.mjs`. Safari desktop checks cover case opening, track navigation, real audio playback, seeking and timed lyrics, CRT insertion, and eject. Responsive CSS includes compact phone layouts; physical-device testing is still recommended.
