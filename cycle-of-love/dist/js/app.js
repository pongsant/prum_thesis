/* Navigation wraps the original player;
 song and lyric data remain unchanged. */
(() => {
const $=id=>document.getElementById(id), audio=$('audio'), ambient=$('ambient');

const player=new MusicPlayer(audio), atmosphere=new Atmosphere($('atmosphere'),player);

let world = null;

const rooms=SPACES.rooms.filter(r=>SONGS.some(s=>s.id===r.songId&&s.available));

let space='intro',selected=0,current=SONGS.find(s=>s.id===rooms[0].songId),busy=false,lyricIndex=-2,lyricsVisible=true,timer,request=0;

const time=n=>{n=Number.isFinite(n)?Math.max(0,n):0;
return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
};

// Keep the arrival title editable through PROJECT in songs.js.
const titleWords=PROJECT.title.toUpperCase().split(' ');

$('landing-title').replaceChildren(document.createTextNode(titleWords.shift()),document.createElement('br'),document.createTextNode(titleWords.join(' ')));

const star=document.createElement('span');
star.className='title-star';
star.textContent='✳';
$('landing-title').append(star);

document.title=PROJECT.title+' — Memory rooms';
$('home').firstChild.textContent=PROJECT.title.toUpperCase()+' ';

function notice(text){clearTimeout(timer);
$('status').textContent=text;
$('status').hidden=false;
timer=setTimeout(()=>$('status').hidden=true,6000);
}
function select(i,focus=false){selected=(i+rooms.length)%rooms.length;
[...$('doors').children].forEach((d,j)=>d.setAttribute('aria-current',String(j===selected)));
const song=SONGS.find(s=>s.id===rooms[selected].songId);
$('door-description').textContent=song.subtitle;
atmosphere.setSong(song);
if(focus)$('doors').children[selected].focus();
}
rooms.forEach((r,i)=>{const song=SONGS.find(s=>s.id===r.songId),d=document.createElement('button');
d.className='door';
d.setAttribute('aria-label',`Enter Room ${r.number}: ${song.title}`);
const n=document.createElement('span');
n.className='door-number';
n.textContent=r.number;
const label=document.createElement('span');
label.className='door-label';
label.textContent='ROOM '+r.number;
const name=document.createElement('strong');
name.textContent=song.title;
const small=document.createElement('small');
small.textContent='APPROACH / ENTER ↗';
label.append(name,small);
d.append(n,label);
d.addEventListener('pointerenter',()=>{if(!busy)select(i);
});
d.addEventListener('focus',()=>{if(!busy)select(i);
});
d.addEventListener('click',()=>{select(i);
go('room');
});
$('doors').append(d);
});

function media(host,c){host.replaceChildren();
if(!c||c.enabled===false||!c.src||!['video','image'].includes(c.type))return;
const m=document.createElement(c.type==='video'?'video':'img');
if(c.type==='video'){m.muted=true;
m.loop=true;
m.playsInline=true;
m.autoplay=true;
m.preload='metadata';
}else m.alt='';
m.addEventListener('error',()=>{host.replaceChildren();
notice('This visual could not load. The music remains available.');
},{once:true});
m.src=c.src;
host.append(m);
if(c.type==='video')m.play().catch(()=>{});
}
function updateLyrics(){const next=current.lyrics.findIndex((l,i)=>audio.currentTime>=l.time&&audio.currentTime<(l.end??current.lyrics[i+1]?.time??audio.duration));
if(next!==lyricIndex){lyricIndex=next;
const l=current.lyrics[next];
$('lyric').textContent=l?.text||'';
$('lyric-section').textContent=l?.section||'';
$('lyric').className=l?.emphasis?'emphasis':'';
if(l){void $('lyric').offsetWidth;
$('lyric').classList.add('arriving');
}}$('lyric').hidden=!lyricsVisible;
$('lyric-section').hidden=!lyricsVisible;
$('instrumental-note').hidden=current.lyrics.length>0;
world?.setLyric(selected, lyricsVisible ? (current.lyrics[next]?.text || '') : '', current.lyrics[next]?.emphasis);
}
function updateProgress(){const d=Number.isFinite(audio.duration)?audio.duration:current.duration||0;
$('current-time').textContent=time(audio.currentTime);
$('duration').textContent=time(d);
$('progress').value=d?audio.currentTime/d*100:0;
$('progress').setAttribute('aria-valuetext',`${time(audio.currentTime)} of ${time(d)}`);
updateLyrics();
}
function updatePlaying(){const playing=!audio.paused;
$('play').textContent=playing?'[ PAUSE ]':'[ PLAY ]';
$('play').setAttribute('aria-label',`${playing?'Pause':'Play'} ${current.title}`);
$('play-state').textContent=playing?'MEMORY ACTIVE':audio.ended?'END OF MEMORY':audio.currentTime?'PAUSED':'READY WHEN YOU ARE';
}
async function beginPlayback(){const token=request;
try{await player.play();
if(space!=='room'||token!==request)audio.pause();
}catch(e){if(token===request&&e.name!=='AbortError')notice('Playback could not start. Press Play to try again.');
}}
function loadRoom(){const r=rooms[selected];
current=SONGS.find(s=>s.id===r.songId);
request++;
lyricIndex=-2;
player.load(current);
atmosphere.setSong(current);
document.documentElement.style.setProperty('--accent',current.color);
$('song-title').textContent=current.title;
$('song-subtitle').textContent=current.subtitle;
$('chapter-label').textContent=`ROOM ${r.number} / MEMORY ${r.number}`;
$('chapter-mood').textContent=current.mood||'';
$('lyrics-toggle').hidden=!current.lyrics.length;
if (!world) {
media($('background-media'),r.background||current.background);
media($('screen-media'),r.screen);
}
$('objects').replaceChildren();
r.objects.slice(0,3).forEach(o=>{const b=document.createElement('button');
b.className='memory-object';
b.setAttribute('aria-label','Explore '+o.label);
const l=document.createElement('span');
l.textContent=o.label+' +';
b.append(l);
b.addEventListener('click',()=>showInfo(o.label,[o.text],'A MEMORY / '+r.number));
$('objects').append(b);
});
updateProgress();
updatePlaying();
}
async function go(next){
if (busy) return;
if (world && space !== 'intro' && next !== 'intro') {
  world.navigate(next === 'room' ? selected : -1);
  notice('Walking to ' + (next === 'room' ? 'Room ' + rooms[selected].number : 'the hallway') + '. WASD cancels the guided walk.');
  return;
}
if(next===space)return;
busy=true;
request++;
audio.pause();
ambient.pause();
if(space==='intro'&&next==='hallway'&&SPACES.intro.enabled){ambient.src=SPACES.intro.audio;
ambient.play().catch(()=>notice('Ambient recording unavailable. Continue in silence.'));
}document.body.classList.add('transitioning');
await new Promise(r=>setTimeout(r,matchMedia('(prefers-reduced-motion: reduce)').matches?0:550));
space=next;
if(world){world.reset();world.setActive(space!=='intro');$('walk-controls').hidden=space==='intro';}
document.body.dataset.space=space;
$('landing').hidden=space!=='intro';
$('hallway').hidden=space!=='hallway';
$('experience').hidden=space!=='room';
$('back').hidden=space==='intro';
$('location').textContent=space==='intro'?'00 / ARRIVAL':space==='hallway'?'01 / PASSAGE':`02 / ROOM ${rooms[selected].number}`;
if(space==='room')loadRoom();
else{media($('background-media'),null);
media($('screen-media'),null);
atmosphere.setSong({glow:[111,145,157]});
}document.body.classList.remove('transitioning');
busy=false;
if(space==='intro')$('enter').focus();
else if(space==='hallway')$('doors').children[selected].focus();
else $('song-title').focus();
}
function back(){go(space==='room'?'hallway':'intro');
}
$('enter').addEventListener('click',()=>go('hallway'));
$('home').addEventListener('click',()=>go('intro'));
$('back').addEventListener('click',back);
$('play').addEventListener('click',()=>audio.paused?beginPlayback():audio.pause());

$('progress').addEventListener('input',e=>{if(Number.isFinite(audio.duration)){audio.currentTime=Number(e.target.value)/100*audio.duration;
updateProgress();
}});

$('mute').addEventListener('click',()=>{audio.muted=!audio.muted;
$('mute').textContent=audio.muted?'SOUND OFF':'SOUND ON';
$('mute').setAttribute('aria-pressed',String(audio.muted));
$('mute').setAttribute('aria-label',audio.muted?'Unmute':'Mute');
});

$('lyrics-toggle').addEventListener('click',()=>{lyricsVisible=!lyricsVisible;
$('lyrics-toggle').textContent=lyricsVisible?'LYRICS ON':'LYRICS OFF';
$('lyrics-toggle').setAttribute('aria-pressed',String(lyricsVisible));
updateLyrics();
});

['timeupdate','loadedmetadata','seeked','durationchange'].forEach(e=>audio.addEventListener(e,updateProgress));
['play','pause','ended','playing'].forEach(e=>audio.addEventListener(e,updatePlaying));
audio.addEventListener('waiting',()=>{if(!audio.paused)$('play-state').textContent='LOADING AUDIO';
});
audio.addEventListener('error',()=>{if(space==='room')notice('Recording unavailable. Return to the hallway and enter again to retry.');
});
audio.addEventListener('ended',()=>notice('This memory has ended. Return to the hallway when you’re ready.'));

function showInfo(title,paragraphs,kicker='MEMORY ARCHIVE'){
world?.suspend(true);
$('info-kicker').textContent=kicker;
$('info-title').textContent=title;
$('info-body').replaceChildren();
paragraphs.filter(Boolean).forEach(text=>{const p=document.createElement('p');
p.textContent=text;
$('info-body').append(p);
});
$('info-dialog').showModal();
}
$('about').addEventListener('click',()=>showInfo(PROJECT.title,['How do different experiences of love shape the way we understand ourselves?','An original music project about love, memory, and change. Move through two connected rooms; take the time you need in each.','We return to ourselves, changed by every experience.']));
$('song-info').addEventListener('click',()=>showInfo(current.title,[current.description,current.timingNote],`ROOM ${rooms[selected].number}`));
$('close-info').addEventListener('click',()=>$('info-dialog').close());

$('info-dialog').addEventListener('close',()=>world?.suspend(false));
addEventListener('keydown',e=>{if($('info-dialog').open||busy)return;
if(world && space!=='intro') {
  if(e.key==='Escape') {
    if(world.locked){world.unlock();return;}
    if(performance.now()-(world.lastUnlock||0)<350)return;
    world.keys.clear(); world.path=[];
    return;
  }
  if(e.code==='Space' && space==='room' && !['BUTTON','INPUT'].includes(document.activeElement.tagName)){
    e.preventDefault(); audio.paused?beginPlayback():audio.pause();
  }
  return;
}
if(e.key==='Escape'){e.preventDefault();
back();
return;
}if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
if(space==='hallway'&&['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();
select(selected+(['ArrowRight','ArrowDown'].includes(e.key)?1:-1),true);
}if(e.key==='Enter'&&(document.activeElement.tagName!=='BUTTON'||document.activeElement.classList.contains('door'))){e.preventDefault();
if(space==='intro')go('hallway');
else if(space==='hallway')go('room');
}if(e.code==='Space'&&space==='room'&&document.activeElement.tagName!=='BUTTON'){e.preventDefault();
audio.paused?beginPlayback():audio.pause();
}});

select(0);
atmosphere.setSong({glow:[111,145,157]});

// 3D is progressive enhancement: the room/audio interface remains if WebGL fails.
function syncWorldZone(index) {
  if (space === 'intro') return;
  request++;
  audio.pause();
  ambient.pause();
  space = index < 0 ? 'hallway' : 'room';
  document.body.dataset.space = space;
  $('hallway').hidden = index >= 0;
  $('experience').hidden = index < 0;
  $('location').textContent = index < 0 ? '01 / PASSAGE' : '02 / ROOM ' + rooms[index].number;
  if (index >= 0) { selected = index; loadRoom(); }
  else { world.setLyric(-1, ''); }
  $('back').textContent = index < 0 ? '[ LEAVE ARCHIVE ]' : '[ WALK TO HALLWAY ]';
}
function failWorld(message) {
  if(world) { world.setActive(false); world=null; }
  document.body.classList.remove('world-ready','mouse-locked');
  $('walk-controls').hidden=true;
  notice(message);
}
import('./world/world.mjs').then(({MemoryWorld})=>{
  world = new MemoryWorld({
    canvas: $('world'), rooms, player,
    onZone: syncWorldZone,
    onMemory: (memory,index)=>showInfo(memory.label,[memory.text],'A MEMORY / '+rooms[index].number),
    onHint: label=>{
      $('interact').hidden=!label;
      $('interact').textContent=label ? '[ E / INSPECT ] '+label : '';
      $('crosshair').classList.toggle('nearby',!!label);
    },
    onLock: locked=>{
      document.body.classList.toggle('mouse-locked',locked);
      $('mouse-look').textContent=locked?'[ RELEASE MOUSE ]':'[ MOUSE LOOK ]';
      $('walk-state').textContent=locked?'WASD WALK / E INSPECT / ESC RELEASE':'WASD WALK / DRAG TO LOOK';
    },
    onError: notice,
    onFatal: failWorld
  });
  document.body.classList.add('world-ready');
  $('back').textContent='[ LEAVE ARCHIVE ]';
  $('hall-title').innerHTML='A memory<br>you can walk into.';
  document.querySelector('.hall-caption').lastElementChild.textContent='WALK THROUGH A DOOR / OR USE A GUIDED WALK';
  [...$('doors').children].forEach(button=>button.querySelector('small').textContent='GUIDED WALK ↗');
  world.setActive(space!=='intro');
  $('walk-controls').hidden=space==='intro';
  if(space==='room') { space='hallway'; $('experience').hidden=true; $('hallway').hidden=false;audio.pause();world.navigate(selected); }
}).catch(error=>{console.error('3D unavailable',error);failWorld('3D is unavailable in this browser. The two music rooms still work. Open via the local server and try a WebGL-capable browser.');});
$('mouse-look').addEventListener('click',()=>world?.locked?world.unlock():world?.lock());
$('interact').addEventListener('click',()=>world?.interact());
$('walk-help').addEventListener('click',()=>showInfo('Take your time.',[
  'W / A / S / D to walk. Arrow up/down move; arrow left/right turn. Drag the scene to look around.',
  'Mouse Look locks the pointer for free looking. Escape releases it. Click Mouse Look to resume. Space plays or pauses the current song.',
  'Walk through either open doorway. Music waits for Play. Look at a nearby object and press E, or click it, to uncover a memory.',
  'On a touch screen, hold the arrow buttons to walk and drag the scene to look. Tap an object or the Inspect button to open it.',
  'Guided Walk and Walk to Hallway move you along a route. Any movement key cancels the route. Leave Archive returns to the opening.'
],'MOVEMENT / LISTENING'));

})();
