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
  {id:'intro',number:'01',title:'BEGINNING',status:'available',discLabel:'BEGINNING',
   audio:'audio/intro.m4a',duration:76.615,cover:null,
   description:"## MUSIC\n\n**BEGINNING is the beginning of my whole project.** I wanted the music to feel like the opening of a movie, so I used violin and piano to make it emotional and cinematic. This kind of music also reminds me of my mom and dad because when I was young, they liked to play classical music at home.\n\nI also used the real voices of my parents in the background. The audio comes from an old MiniDV camcorder video they recorded during a trip to Paris when I was young. They speak in Thai and talk directly to me through the camera, almost like an old vlog or a message to me in the future. Sometimes they say my name and ask me things like, **“Prumprum, do you see this right now?”**\n\nI took the sound from that old video and put it into the music because I wanted the beginning to feel really personal, almost like an old memory coming back to life. Their voices are from the past, but I am listening to them again now and turning that memory into something new.\n\n## VISUAL\n\nFor the visual, I created an audio-reactive particle system in TouchDesigner. The particles react to the music and begin from small points before growing, connecting, disappearing, and creating new forms again.\n\nFor me, the particles represent how different experiences of love can begin from something very small. It could be a person, a moment, a memory, or something unexpected. That small beginning can create a new feeling and start a new cycle.\n\nThese experiences can happen again and again in different ways, but every feeling and experience eventually comes back to us and becomes part of who we are.\n\nI also see this visual almost like the beginning of a universe. The particles start from almost nothing and slowly create a world. BEGINNING is the beginning of the universe of my project before the audience enters the different songs and experiences that come after it.",
   concept:'',
   lyrics:[],instrumental:true,movie:{type:'video',src:'video/intro-4k.mp4',loop:true,showLyrics:false},
   visualTheme:{background:'#77807b',ink:'#e5e7db',accent:'#b8b4a4',idleText:'Before the words.'}},
  {id:'self',number:'02',title:'SELF',status:'available',discLabel:'SELF',
   audio:'audio/self.m4a',duration:196,cover:null,
   description:"**SELF is a song about me trying to understand who I really am and not forget what I actually want from my life.**\n\nSometimes I feel like society puts a lot of pressure on us to be a certain type of person. We want people to like us, accept us, or think we are doing well, so sometimes we start doing things that are not really who we are. If you keep forcing yourself to become someone just for other people, you can slowly forget what you actually want.\n\nThis song is me talking to myself and reminding myself not to forget my own dreams. I still want to see different places, make music, meet people, fall in love, and build the life that I want. But I want to do those things because they really mean something to me, not because I am trying to prove something to other people.\n\nIn the song I say, **“I thought I needed more, but maybe I already had enough.”** That line is about how I used to think I always needed something more to feel successful or complete. But now I am starting to think maybe some of the things I was looking for were already there.\n\nAnother important line for me is **“Been searching in so many places / For something right in front of me.”** I like this line because it can have many meanings. It could be about happiness, love, success, or even your own identity. Maybe the thing I was looking for was myself. Maybe I was looking so far away that I forgot to look at who I already am.\n\n**The song is also a reminder to not forget to love yourself.** Sometimes we care so much about what other people think, what they want from us, or whether they accept us, that we forget to care about ourselves. I think loving yourself also means accepting who you are, listening to what you really want, and not changing yourself just to make other people happy.\n\nThe line **“Before I run out of time”** is important to me because life keeps moving, and I do not want to realize one day that I forgot the dreams I really cared about.\n\nAt the end I say, **“I know my destination, see?”** For me, it means I may not know exactly how I will get there, and my direction can still change, but deep down I know the kind of life I want to live.\n\nFor me, this song is about growing up, understanding myself more, loving myself, and trying not to lose who I am while chasing my future. Sometimes what we are looking for might not be somewhere far away. It might already be part of us.",
   concept:'',
   lyricSections:[
  {
    "title": "Verse 1",
    "text": "I don’t miss who I was\nBut I think about him sometimes\nThat kid had no idea\nWhat was waiting down the line\nI thought I needed more\nBut maybe I\nalready had enough\nNow I’m just tryna live my life"
  },
  {
    "title": "Hook",
    "text": "Before I run out of time\nBefore I lose all of my mind\nBefore I leave this life behind\nBefore i have to say goodbye\nI know where I gotta go\nThough the road feels dam so cold\nI been chasing after dreams\nWondering what they really mean"
  },
  {
    "title": "Verse 2",
    "text": "Still got places I wanna see\nWanna watch the sunrise by the sea\nTake a train through the cities\nFind a place that feels like home\nMaybe one day I’ll fall in love\nAnd Meet someone that I dream of\nWrite some songs that people can sing along\nAnd build a life from all these dreams\nThere’s still so much\nthings left\nfor me to see"
  },
  {
    "title": "Bridge",
    "text": "What they really mean to me\nI ask myself quietly\nBeen searching in so many places\nFor something right\nin front of me\nMaybe all these\nhighs and lows Were\nnever meant to set me free\nI know my destination See"
  }
],
   lyrics:window.SELF_LYRICS,instrumental:false,movie:null,
   timingNote:'Lyrics timed to this recording with local word alignment; fine adjustments may still be needed.',
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
