/* YOUR EP SETTINGS. Replace titles, audio, descriptions and colors here.
   background: null | {type:'video', src:'media/your-visual.mp4'}
                    | {type:'image', src:'media/your-photo.jpg'}
   MP4/WebM backgrounds are silent loops. Music comes only from audio below. */
window.PROJECT = { title: 'Cycle of Love', artist: 'Prum' };
window.SONGS = [
  { id: 'intro', number: '00', title: 'INTRO', available: true,
    audio: 'audio/intro.m4a', duration: 76.615, lyrics: [],
    subtitle: 'Before the words.', mood: 'A MOMENT BEFORE EVERYTHING',
    description: 'An instrumental opening. A little space to arrive, slow down, and let the outside world fall away.',
    color: '#bdad91', glow: [143, 116, 78], background: null },
  { id: 'self', number: '01', title: 'SELF', available: true,
    audio: 'audio/self.m4a', duration: 196, lyrics: window.SELF_LYRICS,
    subtitle: 'The person I was. The person I’m becoming.', mood: 'REFLECTION / HOPE / BECOMING',
    description: 'Looking back at my younger self, the dreams I carried, and the ways I have changed. A conversation between who I was and who I am still becoming.',
    color: '#a6bdce', glow: [75, 119, 153], background: null,
    timingNote: 'This prototype uses draft lyric timings. The vocal alignment is still being refined.' },
  { id: 'family', number: '02', title: 'FAMILY', available: false,
    audio: '', lyrics: [], subtitle: 'Learning to understand.',
    description: 'Growing older, understanding my parents, and finding gratitude in the love that has always been there.',
    color: '#d9b18b', glow: [162, 116, 71], background: null },
  { id: 'future-love', number: '03', title: 'FUTURE LOVE', available: false,
    audio: '', lyrics: [], subtitle: 'Somewhere, someone.',
    description: 'Imagining a life with someone I have not met, and learning that love arrives in its own time.',
    color: '#ac9ccb', glow: [105, 82, 155], background: null },
  { id: 'letting-go', number: '04', title: 'LETTING GO', available: false,
    audio: '', lyrics: [], subtitle: 'Maybe loving you means letting you go.',
    description: 'Loving someone deeply while accepting that I cannot make them stay. Returning to myself, carrying something new.',
    color: '#b89899', glow: [121, 83, 92], background: null }
];
