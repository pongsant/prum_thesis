# Cycle of Love

An audiovisual EP exhibition. Open `dist/index.html` directly, or run `python3 serve.py` from this folder and visit http://localhost:4173.

## Structure

- `dist/index.html` — landing, chapter navigation, playback and information panel.
- `dist/styles/main.css` — layout, type, transitions and mobile styles.
- `dist/data/songs.js` — change titles, audio paths, descriptions, palettes and background media here.
- `dist/data/lyrics.js` — SELF lyrics, with editable start/end times in seconds. Initial timings are a draft, not verified vocal alignment.
- `dist/js/audio.js` — one audio player and Web Audio analyser.
- `dist/js/visuals.js` — lightweight atmospheric canvas; replace or extend for WebGL.
- `dist/js/app.js` — chapter changes, controls, timed lyrics and information.
- `dist/audio/` — listening copies of your original WAV recordings.
- `dist/media/` — add your TouchDesigner exports and photographs here.

The original WAV recordings remain untouched outside this project. The site uses 192 kbps AAC listening copies (about 6.6 MB combined). No music starts until a visitor clicks Enter or Play. Only one track plays at a time. INTRO continues into SELF; SELF ends without jumping into an unavailable chapter.

## Update the EP

Edit `dist/data/songs.js`. For a future chapter, set `available: true`, provide its audio path and add its lyrics array. The navigation updates automatically. To rename the project, edit `PROJECT.title` in that file.

Lyrics use `{time: 12, end: 16, text: 'Your line', section: 'Verse 1', emphasis: false}`. Times refer to the song audio, in seconds. Empty gaps show no lyric. Pausing freezes the current lyric; seeking recalculates it immediately. Review the draft SELF times against your vocal before presenting as fully synchronized.

Background media accepts `{type: 'video', src: 'media/self.webm'}` or `{type: 'image', src: 'media/photo.jpg'}`; `null` uses the atmospheric canvas. Videos loop silently, independently of the song. Use MP4 (H.264) or WebM, short loops and compressed exports. The canvas is also available below media for future custom WebGL visuals.

Keyboard: Space plays/pauses outside other controls. All chapter, playback and information controls are keyboard accessible. Reduced motion is respected. The prototype is a cinematic chapter interface, not yet a WASD 3D world.
