/* EDIT YOUR ALBUM HERE. Paths are relative to dist/index.html.
   cover: null or 'media/your-cover.jpg'
   lyrics: [{time:12, end:18, text:'Your words', emphasis:false}]
   movie: null or {type:'video', src:'video/self.mp4', loop:true, showLyrics:true}
          or {type:'image', src:'media/self.jpg', showLyrics:true}
   SELF uses the preserved original cue sheet. Replace its lyrics field here if desired.
*/
export const project = {
  title: 'Cycle of Love', artist: 'Prum', edition: 'An independent music project',
  statement: 'Five chapters,\none journey.',
  description: 'A collection of songs exploring memory, love, change, and self-reflection.',
  cover: null, coverTitle: 'CYCLE\nOF LOVE',
  footer: 'We return to ourselves. Never quite the same.',
  about: [
    { title: 'Project', text: 'An original music thesis by Prum. Five tracks presented as a physical album and a digital listening experience.' },
    { title: 'Concept', text: 'How do different experiences of love shape the way we understand ourselves?' },
    { title: 'Process', text: 'Songs, words, and moving images. This section will document the making of the project.' },
    { title: 'Research', text: 'Research notes and references will be added here.' },
    { title: 'Credits', text: 'Original music — Prum. Full production and visual credits to follow.' }
  ]
};
export const tracks = [
  {id:'intro',number:'01',title:'INTRO',status:'available',discLabel:'INTRO',
   audio:'audio/intro.m4a',duration:76.615,cover:null,
   description:'Opening atmosphere and introduction to the project.',
   concept:'A little space to arrive, before the words begin.',
   lyrics:[],instrumental:true,movie:null,
   visualTheme:{background:'#77807b',ink:'#e5e7db',accent:'#b8b4a4',idleText:'Before the words.'}},
  {id:'self',number:'02',title:'SELF',status:'available',discLabel:'SELF',
   audio:'audio/self.m4a',duration:196,cover:null,
   description:'A song about identity, growth, dreams, and looking back at myself.',
   concept:'The person I was. The person I’m becoming.',
   lyrics:window.SELF_LYRICS,instrumental:false,movie:null,
   timingNote:'Lyric timings are a draft and will be refined against the final vocal.',
   visualTheme:{background:'#61737e',ink:'#e3e9e7',accent:'#afc0c4',idleText:'The person I’m becoming.'}},
  {id:'family',number:'03',title:'FAMILY',status:'coming-soon',discLabel:'FAMILY',
   audio:null,duration:null,cover:null,
   description:'A song about family, understanding, memory, and gratitude.',
   concept:'More of this chapter will be shared soon.',lyrics:[],movie:null,
   visualTheme:{background:'#837c6d',ink:'#e9e5d8',accent:'#c4bda8',idleText:'Things I understand now.'}},
  {id:'future-love',number:'04',title:'FUTURE LOVE',status:'coming-soon',discLabel:'FUTURE LOVE',
   audio:null,duration:null,cover:null,
   description:'A song about waiting, hope, uncertainty, and imagining future love.',
   concept:'More of this chapter will be shared soon.',lyrics:[],movie:null,
   visualTheme:{background:'#777582',ink:'#e6e3e9',accent:'#c0bacb',idleText:'Someone I haven’t met yet.'}},
  {id:'letting-go',number:'05',title:'LETTING GO',status:'coming-soon',discLabel:'LETTING GO',
   audio:null,duration:null,cover:null,
   description:'A song about attachment, acceptance, love, and learning to let go.',
   concept:'More of this chapter will be shared soon.',lyrics:[],movie:null,
   visualTheme:{background:'#707976',ink:'#e5e6df',accent:'#bac2b7',idleText:'Loving without holding on.'}}
];
