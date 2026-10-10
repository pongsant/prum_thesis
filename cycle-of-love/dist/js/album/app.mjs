import {project,tracks} from '../../data/album.mjs';
import {discCanvas,coverCanvas} from './art.mjs';
import {formatTime,lyricAt,available,parseRoute} from './core.mjs';

const $=id=>document.getElementById(id),audio=$('audio'),player=new window.MusicPlayer(audio);
let route=parseRoute(location.hash,tracks),stage=null,current=0,loaded=-1,opened=false,movieState='selection',preview=0,operation=0,noticeTimer;
const thumbs=tracks.map(t=>discCanvas(t,320).toDataURL());
const pages=['album','track','movie','about'];
function text(id,value){if($(id).textContent!==value)$(id).textContent=value;}
function notice(message){clearTimeout(noticeTimer);text('notice',message);$('notice').hidden=false;noticeTimer=setTimeout(()=>$('notice').hidden=true,6500);}
function stop(){operation++;audio.pause();audio.volume=1;stage?.cancel();stage?.loadMedia(null);}
function load(index){
  current=index;
  if(loaded===index)return;
  audio.pause();loaded=index;
  if(available(tracks[index]))player.load(tracks[index]);
  else {audio.removeAttribute('src');audio.load();}
}
async function playPause(){
  if(!available(tracks[current]))return;
  if(!audio.paused){audio.pause();return;}
  const token=operation;
  try{await player.play();if(token!==operation)audio.pause();}
  catch{if(token===operation)notice('Playback could not start. Press Play to try again.');}
}
function artwork(image,track){
  const fallback=coverCanvas(project,track).toDataURL();image.onerror=()=>{image.onerror=null;image.src=fallback;};image.src=track.cover||fallback;image.alt=`${track.title} cover artwork`;
}
function setOpen(value){opened=value;$('open-case').setAttribute('aria-expanded',String(opened));$('track-list').inert=!opened;document.body.classList.toggle('album-open',opened);stage?.setOpen(opened);$('open-case').firstChild.textContent=opened?'Close the album ':'Open the album ';text('case-hint',opened?'SELECT A DISC TO LISTEN':'CLICK THE CASE TO OPEN');}
function previewAlbum(i){
  const t=tracks[i];$('disc-preview').replaceChildren();const small=document.createElement('span');small.className='micro';small.textContent=`${t.number} / ${t.title} — ${available(t)?'AVAILABLE':'COMING SOON'}`;const p=document.createElement('p');p.textContent=t.description;$('disc-preview').append(small,p);
  document.querySelectorAll('.track-link').forEach((a,j)=>a.classList.toggle('hovered',j===i));
}
function previewMovie(i){
  if(movieState!=='selection')return;preview=i;stage?.setPreview(i);
  text('movie-preview-number',`DISC ${tracks[i].number} / ${available(tracks[i])?'AVAILABLE':'COMING SOON'}`);text('movie-preview-title',tracks[i].title);text('movie-preview-description',tracks[i].description);
  document.querySelectorAll('.movie-disc').forEach((b,j)=>b.setAttribute('aria-current',String(i===j)));
  text('tv-fallback-screen',tracks[i].title);
}
function renderTrack(index){
  const t=tracks[index];load(index);text('track-status',available(t)?'AVAILABLE TO LISTEN':'COMING SOON');text('track-number',`TRACK ${t.number}`);text('art-number',t.number);text('track-title',t.title);text('track-description',t.description);text('track-concept',t.concept);text('timing-note',t.timingNote||'');text('track-count',`${t.number} / 05`);
  $('track-player').hidden=!available(t);$('track-unavailable').hidden=available(t);$('track-movie').href=`#movie/${t.id}`;
  $('full-lyrics').hidden=!t.lyricSections?.length;
  text('full-lyrics-heading',`${t.title} / LYRICS`);
  $('lyric-sections').replaceChildren();
  for(const part of t.lyricSections||[]){
    const section=document.createElement('section'),heading=document.createElement('h3'),words=document.createElement('p');
    heading.textContent=part.title;words.textContent=part.text;section.append(heading,words);$('lyric-sections').append(section);
  }
  artwork($('track-cover'),t);
  const prev=tracks[(index+4)%5],next=tracks[(index+1)%5];$('previous-track').href=`#track/${prev.id}`;$('next-track').href=`#track/${next.id}`;text('previous-track',`← ${prev.number} / ${prev.title}`);text('next-track',`${next.number} / ${next.title} →`);
  if(stage)stage.setTrack(index);else{$('track-stage').replaceChildren();const img=document.createElement('img');img.src=thumbs[index];img.alt=t.discLabel;$('track-stage').append(img);}
  updatePlayer();
}
function movieUI(){
  const selecting=movieState==='selection',busy=['inserting','ejecting'].includes(movieState);
  document.body.dataset.movieState=movieState;$('movie-discs').inert=!selecting;$('movie-discs').setAttribute('aria-hidden',String(!selecting));$('movie-controls').hidden=selecting;$('movie-selection-note').hidden=!selecting;
  $('tv-insert').disabled=!selecting;$('tv-eject').disabled=selecting||busy;$('tv-toggle').disabled=selecting||busy||!available(tracks[current]);
  $('eject').disabled=busy;text('eject',movieState==='inserting'?'READING DISC…':movieState==='ejecting'?'EJECTING…':'⏏ EJECT');
  text('movie-instruction',selecting?'Choose a disc.\nMake yourself at home.':'A moment, just for listening.');
  text('movie-now-number',`DISC ${tracks[current].number}`);text('movie-now-title',tracks[current].title);$('movie-detail').href=`#track/${tracks[current].id}`;
  $('movie-play').hidden=!available(tracks[current]);$('movie-play').disabled=busy;document.querySelector('#movie-controls .timeline').hidden=!available(tracks[current]);
}
async function insert(index){
  if(movieState!=='selection')return;
  const token=++operation;current=index;preview=index;loaded=-1;load(index);movieState='inserting';movieUI();audio.volume=0;
  // Begin playback from the click gesture, silently during the physical insertion.
  // After insertion, rewind and reveal the audio. This respects mobile autoplay policy.
  const sound=available(tracks[index])?player.play().then(()=>{if(token!==operation){if(loaded===index)audio.pause();return false;}return true;}).catch(()=>false):Promise.resolve(false);
  const animation=stage?stage.animate('insert',index):new Promise(r=>setTimeout(()=>r(true),450));
  const [started,finished]=await Promise.all([sound,animation]);
  if(token!==operation||!finished)return;
  if(started){audio.currentTime=0;audio.volume=1;}else audio.volume=1;
  movieState='playing';stage?.loadMedia(tracks[index].movie);movieUI();updatePlayer();$('tv-eject').focus({preventScroll:true});
  if(available(tracks[index])&&!started)notice('The disc is ready. Press Play to start the recording.');
}
async function eject(){
  if(movieState!=='playing')return;
  const token=++operation;audio.pause();movieState='ejecting';movieUI();stage?.loadMedia(null);
  const finished=stage?await stage.animate('eject',current):await new Promise(r=>setTimeout(()=>r(true),450));
  if(token!==operation||!finished)return;
  if(available(tracks[current]))audio.currentTime=0;
  movieState='selection';movieUI();previewMovie(current);document.querySelectorAll('.movie-disc')[current].focus({preventScroll:true});
}
function navigate(){
  stop();route=parseRoute(location.hash,tracks);document.body.dataset.page=route.page;movieState='selection';
  pages.forEach(name=>$(name+'-page').hidden=name!==route.page);
  document.querySelectorAll('[data-nav]').forEach(a=>{const active=a.dataset.nav===(route.page==='track'?'album':route.page);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(route.page==='track')renderTrack(route.index);
  if(route.page==='movie'){current=route.index;movieUI();previewMovie(route.index);}
  if(stage&&route.page!=='about'){stage.mount($(route.page+'-stage'),route.page);if(route.page==='album')stage.setOpen(opened);if(route.page==='movie')stage.setPreview(route.index);}
  document.title=route.page==='track'?`${tracks[route.index].title} — ${project.title}`:`${project.title} — ${route.page==='movie'?'Sound & picture':project.artist}`;
  window.scrollTo({top:0,behavior:'instant'});
}
function updatePlayer(){
  const t=tracks[current],duration=Number.isFinite(audio.duration)?audio.duration:t.duration;
  const time=loaded===current&&available(t)?audio.currentTime:0;
  for(const prefix of ['track','movie']){
    text(prefix+'-current',formatTime(time));text(prefix+'-duration',formatTime(duration));
    $(prefix+'-progress').value=duration?time/duration*100:0;$(prefix+'-progress').setAttribute('aria-valuetext',`${formatTime(time)} of ${formatTime(duration)}`);
    text(prefix+'-play',audio.paused?'PLAY  ▶':'PAUSE  Ⅱ');$(prefix+'-play').setAttribute('aria-label',`${audio.paused?'Play':'Pause'} ${t.title}`);
  }
  const cue=available(t)?lyricAt(t,time,duration||Infinity):null;
  const words=!available(t)?'LYRICS COMING SOON':cue?.text||(t.instrumental?'An instrumental opening. Just listen.':audio.ended?'Thank you for listening.':'The words arrive with the music.');
  if($('track-lyric').textContent!==words){text('track-lyric',words);$('track-lyric').classList.remove('lyric-arrives');void $('track-lyric').offsetWidth;$('track-lyric').classList.add('lyric-arrives');}
  $('track-lyric').classList.toggle('emphasis',!!cue?.emphasis);
  const subtitle=route.page==='movie'&&movieState==='playing'?(available(t)?cue?.text||'':'COMING SOON'):'';text('movie-accessible-lyric',subtitle);
  if(stage&&route.page==='movie')stage.setPlayback({track:movieState==='selection'?preview:current,line:cue?.text||'',time,energy:0,state:movieState});
  if(route.page==='movie')text('tv-fallback-screen',movieState==='selection'?tracks[preview].title:!available(t)?'COMING SOON':cue?.text||t.visualTheme.idleText);
}

// Build data-driven navigation once. All five tracks are always reachable.
tracks.forEach((t,i)=>{
  const a=document.createElement('a');a.href=`#track/${t.id}`;a.className='track-link';a.setAttribute('aria-label',`${t.number} ${t.title}, ${available(t)?'available':'coming soon'}`);
  const img=document.createElement('img');img.src=thumbs[i];img.alt='';const number=document.createElement('span');number.className='micro';number.textContent=t.number;const name=document.createElement('strong');name.textContent=t.title;const state=document.createElement('small');state.textContent=available(t)?'LISTEN ↗':'COMING SOON';a.append(img,number,name,state);a.addEventListener('pointerenter',()=>{previewAlbum(i);if(stage)stage.hover=i;});a.addEventListener('focus',()=>previewAlbum(i));a.addEventListener('pointerleave',()=>{if(stage)stage.hover=-1;});$('track-list').append(a);
  const b=document.createElement('button');b.className='movie-disc';b.setAttribute('aria-label',`Insert ${t.title}${available(t)?'':', coming soon'}`);const disc=document.createElement('img');disc.src=thumbs[i];disc.alt='';const label=document.createElement('span');const title=document.createElement('strong');title.textContent=`${t.number} / ${t.title}`;const status=document.createElement('small');status.textContent=available(t)?'INSERT DISC ↗':'COMING SOON';label.append(title,status);b.append(disc,label);b.addEventListener('pointerenter',()=>previewMovie(i));b.addEventListener('focus',()=>previewMovie(i));b.addEventListener('click',()=>insert(i));$('movie-discs').append(b);
});
$('wordmark').firstChild.textContent=project.title.toUpperCase();$('wordmark').lastChild.textContent='BY '+project.artist.toUpperCase();text('edition',project.edition.toUpperCase());
$('album-title').replaceChildren();project.statement.split('\n').forEach((line,i)=>{if(i)$('album-title').append(document.createElement('br'));const span=document.createElement(i?'em':'span');span.textContent=line;$('album-title').append(span);});text('album-description',project.description);text('about-summary',project.description);text('footer-title',`${project.title.toUpperCase()} — ${project.artist.toUpperCase()}`);text('footer-note',project.footer);
project.about.forEach((section,i)=>{const row=document.createElement('section');const number=document.createElement('span');number.className='micro';number.textContent=String(i+1).padStart(2,'0');const heading=document.createElement('h2');heading.textContent=section.title;const p=document.createElement('p');p.textContent=section.text;row.append(number,heading,p);$('about-sections').append(row);});
$('track-list').inert=true;
$('album-stage').addEventListener('click',()=>{if(!stage)setOpen(!opened);});
$('tv-insert').addEventListener('click',()=>insert(preview));$('tv-eject').addEventListener('click',eject);$('tv-toggle').addEventListener('click',playPause);
$('open-case').addEventListener('click',()=>setOpen(!opened));$('track-play').addEventListener('click',playPause);$('movie-play').addEventListener('click',playPause);$('eject').addEventListener('click',eject);
for(const prefix of ['track','movie'])$(prefix+'-progress').addEventListener('input',e=>{if(Number.isFinite(audio.duration)&&available(tracks[current])){audio.currentTime=Number(e.target.value)/100*audio.duration;updatePlayer();}});
['timeupdate','seeked','loadedmetadata','durationchange','play','pause','ended'].forEach(event=>audio.addEventListener(event,updatePlayer));
audio.addEventListener('error',()=>{if(audio.hasAttribute('src'))notice('The recording could not load. Check the audio path in data/album.mjs.');});
addEventListener('hashchange',navigate);addEventListener('keydown',event=>{if(event.metaKey||event.ctrlKey||event.altKey||['INPUT','TEXTAREA','BUTTON','A'].includes(document.activeElement.tagName))return;if(event.code==='Space'&&(route.page==='track'||route.page==='movie'&&movieState==='playing')){event.preventDefault();playPause();}if(event.key==='Escape'&&route.page==='movie'&&movieState==='playing')eject();});
navigate();
// The renderer loads after the functional pages and audio controls are available.
import('./stage.mjs').then(({AlbumStage})=>{
  stage=new AlbumStage({project,tracks,onOpen:()=>setOpen(!opened),onSelect:i=>location.hash=`track/${tracks[i].id}`,onHover:previewAlbum,onError:notice});
  document.body.classList.add('has-3d');
  if(route.page!=='about'){stage.mount($(route.page+'-stage'),route.page);if(route.page==='track')stage.setTrack(route.index);if(route.page==='movie')stage.setPreview(preview);stage.setOpen(opened);}
}).catch(error=>{console.warn('3D unavailable',error);notice('3D is unavailable here. You can still explore all five tracks and use the audio and visual controls.');});
function react(){
  requestAnimationFrame(react);if(!stage||route.page!=='movie'||document.hidden)return;
  const t=tracks[current],cue=lyricAt(t,audio.currentTime,audio.duration||Infinity),levels=player.levels();
  stage.setPlayback({track:movieState==='selection'?preview:current,line:cue?.text||'',time:audio.currentTime,energy:movieState==='playing'?levels.amplitude+levels.bass*.1:0,state:movieState});
}
requestAnimationFrame(react);
