/* Edit spaces here. Song IDs refer to songs.js; original music data stays intact.
   Set enabled:true after adding a video/image/audio file. Paths are relative to dist/.
   Backgrounds and screens accept type:'video' (MP4/WebM) or type:'image'. */
window.SPACES = {
  intro: { audio: 'audio/intro.mp3', enabled: false },
  rooms: [
    { songId: 'intro', number: '01', name: 'Before the words',
      screen: { type: 'video', src: 'video/room01-preview.mp4', enabled: false },
      background: null,
      objects: [
        { label: 'A trace of home', text: 'Some memories arrive as a feeling, before they become words.' },
        { label: 'An opening', text: 'Take a little space to arrive. There is nothing to solve here.' }
      ] },
    { songId: 'self', number: '02', name: 'The person I’m becoming',
      screen: { type: 'video', src: 'video/room02-preview.mp4', enabled: false },
      background: null,
      objects: [
        { label: 'A distant horizon', text: 'The places I have not been. The person I have not become.' },
        { label: 'A reflection', text: 'We return to ourselves. Never quite the same.' }
      ] }
  ]
};
