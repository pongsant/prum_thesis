/* DOM components: chapter navigation, audio controls, lyric stage and information dialog. */
(() => {
  const $=id=>document.getElementById(id), audio=$('audio');
  const player=new MusicPlayer(audio), atmosphere=new Atmosphere($('atmosphere'),player);
  let current=SONGS[0], entered=false, lyricsVisible=true, lyricIndex=-2, selection=0, statusTimer;
  const time=n=>{n=Number.isFinite(n)?Math.max(0,n):0;return `${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;};
  document.title=`${PROJECT.title} — An audiovisual EP`;
  $('home').firstChild.textContent=PROJECT.title.toUpperCase();
  $('landing-title').textContent='';
  const titleParts=PROJECT.title.split(' '),em=document.createElement('em');em.textContent=titleParts.pop().toLowerCase()+'.';
  $('landing-title').append(titleParts.join(' ')+' ',em);
  document.querySelector('.landing-meta span:last-child').textContent=`AN EXPLORATION BY ${PROJECT.artist.toUpperCase()}`;
  function notice(message){clearTimeout(statusTimer);$('status').textContent=message;$('status').hidden=false;statusTimer=setTimeout(()=>$('status').hidden=true,6500);}
  function renderChapters(){
    $('chapters').replaceChildren();
    SONGS.forEach(song=>{
      const button=document.createElement('button');button.className='chapter';button.disabled=!song.available;
      button.setAttribute('aria-current',String(song.id===current.id));button.setAttribute('aria-label',`${song.title}${song.available?'':', coming soon'}`);
      const number=document.createElement('span');number.className='chapter-number';number.textContent=song.number;
      const name=document.createElement('span');name.className='chapter-name';name.textContent=song.title;
      const small=document.createElement('small');small.textContent=song.available?(song.id==='intro'?'Instrumental':'Listen'):'Coming soon';
      name.append(small);button.append(number,name);button.addEventListener('click',()=>selectSong(song,true));$('chapters').append(button);
    });
  }
  function renderMedia(song){
    const host=$('background-media');host.replaceChildren();if(!song.background)return;
    const {type,src}=song.background;
    if(type!=='video'&&type!=='image')return;
    const media=document.createElement(type==='video'?'video':'img');
    if(type==='video'){media.muted=true;media.loop=true;media.playsInline=true;media.autoplay=true;}else media.alt='';
    media.src=src;media.addEventListener('error',()=>{host.replaceChildren();notice('The background could not load. The music is still available.');},{once:true});host.append(media);
    if(type==='video')media.play().catch(()=>{});
  }
  function updateLyrics(){
    const at=audio.currentTime;
    const next=current.lyrics.findIndex(line=>at>=line.time&&at<line.end);
    if(next!==lyricIndex){
      lyricIndex=next;const line=current.lyrics[next];
      $('lyric').textContent=line?.text||'';$('lyric-section').textContent=line?.section||'';
      $('lyric').className='lyric'+(line?.emphasis?' emphasis':'');
      if(line){void $('lyric').offsetWidth;$('lyric').classList.add('arriving');}
    }
    $('lyric').hidden=!lyricsVisible;$('lyric-section').hidden=!lyricsVisible;
    $('instrumental-note').hidden=current.lyrics.length>0;
  }
  function updateProgress(){
    const duration=Number.isFinite(audio.duration)?audio.duration:current.duration||0;
    $('current-time').textContent=time(audio.currentTime);$('duration').textContent=time(duration);
    const percent=duration?audio.currentTime/duration*100:0;
    $('progress').value=percent;$('progress').style.setProperty('--progress',`${percent}%`);
    $('progress').setAttribute('aria-valuetext',`${time(audio.currentTime)} of ${time(duration)}`);updateLyrics();
  }
  function updatePlaying(){
    const playing=!audio.paused;
    $('play').innerHTML=playing?'<span class="pause-icon" aria-hidden="true"></span>':'<span class="play-triangle" aria-hidden="true"></span>';
    $('play').setAttribute('aria-label',`${playing?'Pause':'Play'} ${current.title}`);
    $('play-state').textContent=playing?'NOW PLAYING':audio.ended?'END OF CHAPTER':audio.currentTime?'PAUSED':'READY WHEN YOU ARE';
  }
  async function beginPlayback(){
    const request=selection;
    try{await player.play();}catch(error){if(request!==selection||error.name==='AbortError')return;notice('Playback could not start. Press Play to try again.');updatePlaying();}
  }
  function selectSong(song,autoplay=false){
    if(!song.available)return;
    selection++;current=song;lyricIndex=-2;
    player.load(song);atmosphere.setSong(song);renderMedia(song);
    document.documentElement.style.setProperty('--accent',song.color);
    $('song-title').textContent=song.title;$('song-subtitle').textContent=song.subtitle;
    $('chapter-label').textContent=`${song.id==='intro'?'PRELUDE':'CHAPTER'} / ${song.number}`;
    $('chapter-mood').textContent=song.mood||'';$('lyrics-toggle').hidden=!song.lyrics.length;
    renderChapters();updateProgress();updatePlaying();
    $('experience').classList.remove('changing');void $('experience').offsetWidth;$('experience').classList.add('changing');
    if(autoplay)beginPlayback();
  }
  function enter(){entered=true;$('landing').hidden=true;$('experience').hidden=false;selectSong(current,true);$('song-title').focus({preventScroll:true});}
  $('enter').addEventListener('click',enter);
  $('home').addEventListener('click',()=>{audio.pause();entered=false;selection++;$('landing').hidden=false;$('experience').hidden=true;atmosphere.setSong(SONGS[0]);$('background-media').replaceChildren();$('enter').focus();});
  $('play').addEventListener('click',()=>audio.paused?beginPlayback():audio.pause());
  $('progress').addEventListener('input',e=>{if(Number.isFinite(audio.duration)){audio.currentTime=Number(e.target.value)/100*audio.duration;updateProgress();}});
  $('mute').addEventListener('click',()=>{audio.muted=!audio.muted;$('mute').setAttribute('aria-pressed',String(audio.muted));$('mute').setAttribute('aria-label',audio.muted?'Unmute':'Mute');});
  $('lyrics-toggle').addEventListener('click',()=>{lyricsVisible=!lyricsVisible;$('lyrics-toggle').textContent=lyricsVisible?'Lyrics on':'Lyrics off';$('lyrics-toggle').setAttribute('aria-pressed',String(lyricsVisible));updateLyrics();});
  ['timeupdate','loadedmetadata','seeked','durationchange'].forEach(event=>audio.addEventListener(event,updateProgress));
  ['play','pause','ended'].forEach(event=>audio.addEventListener(event,updatePlaying));
  audio.addEventListener('waiting',()=>{if(!audio.paused)$('play-state').textContent='LOADING AUDIO';});
  audio.addEventListener('playing',updatePlaying);
  audio.addEventListener('error',()=>{if(entered){$('play-state').textContent='AUDIO UNAVAILABLE';notice('This recording could not load. Please try selecting the song again.');}});
  audio.addEventListener('ended',()=>{
    const index=SONGS.findIndex(s=>s.id===current.id),next=SONGS[index+1];
    if(next?.available){selectSong(next,true);}
    else if(current.id==='letting-go'&&SONGS.find(s=>s.id==='self')?.available){selectSong(SONGS.find(s=>s.id==='self'),false);atmosphere.target=[110,149,175];notice('Back to yourself. A little changed.');}
    else {notice('Thank you for listening. The next chapters are still becoming.');}
  });
  const dialog=$('info-dialog');
  function showInfo(song){
    $('info-kicker').textContent=song?`CHAPTER ${song.number}`:'ABOUT THE PROJECT';
    $('info-title').textContent=song?song.title:PROJECT.title;
    $('info-body').replaceChildren();
    const paragraphs=song?[song.description,...(song.timingNote?[song.timingNote]:[])]:[
      'How do different experiences of love shape the way we understand ourselves?',
      'An original EP about personal memories, love, change, and self-reflection.',
      'Self. Family. Future love. Letting go. Each experience brings us back to ourselves, but never as exactly the same person. Every experience leaves something with us.',
      'This exhibition is still becoming. The instrumental opening and SELF are here; three more chapters will follow.'
    ];
    paragraphs.forEach((text,i)=>{const p=document.createElement('p');p.textContent=text;if(!song&&i===0)p.className='thesis-question';if(song&&i===1)p.className='timing-note';$('info-body').append(p);});dialog.showModal();
  }
  $('about').addEventListener('click',()=>showInfo());$('song-info').addEventListener('click',()=>showInfo(current));$('close-info').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  addEventListener('keydown',e=>{if(e.code==='Space'&&entered&&!dialog.open&&!['BUTTON','INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();audio.paused?beginPlayback():audio.pause();}});
  renderChapters();
})();
