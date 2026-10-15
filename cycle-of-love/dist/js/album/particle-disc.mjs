export function initParticleDisc(tracks) {
  const host=document.getElementById('particle-tray'),canvas=document.getElementById('particle-disc'),button=document.getElementById('particle-open'),nav=document.getElementById('particle-tracks');
  const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let expanded=false,blend=0,width=1,height=1,time=0,last=0,active=-1;
  // Deterministic distribution: the same five groups form the disc and the song lines.
  let seed=73;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const points=Array.from({length:2800},(_,i)=>({group:i%tracks.length,angle:random()*Math.PI*2,radius:Math.sqrt(.035+random()*.965),along:random(),spread:(random()-.5),size:.55+random()*1.1,phase:random()*Math.PI*2,alpha:.25+random()*.7}));
  tracks.forEach((track,i)=>{
    const link=document.createElement('a');link.href=`#track/${track.id}`;
    link.setAttribute('aria-label',`${track.title}${track.status==='available'?'':', coming soon'}`);
    const number=document.createElement('span');number.textContent=track.number;
    const name=document.createElement('strong');name.textContent=track.title.toLowerCase();
    const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
    link.append(number,name,arrow);nav.append(link);
    link.addEventListener('pointerenter',()=>active=i);link.addEventListener('focus',()=>active=i);
    link.addEventListener('pointerleave',()=>active=-1);link.addEventListener('blur',()=>active=-1);
  });
  button.addEventListener('click',()=>{
    expanded=!expanded;host.classList.toggle('is-expanded',expanded);button.setAttribute('aria-expanded',String(expanded));
    button.firstElementChild.textContent=expanded?'↶ BACK TO DISC':'OPEN THE DISC +';
    nav.hidden=!expanded;active=-1;
    if(reduced.matches)blend=Number(expanded);
  });
  host.addEventListener('keydown',event=>{if(event.key==='Escape'&&expanded){button.click();button.focus();event.stopPropagation();}});
  function resize(){const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);}
  new ResizeObserver(resize).observe(host);resize();
  function draw(now){
    requestAnimationFrame(draw);
    if(!ctx||document.hidden||document.body.dataset.page!=='album'){last=now;return;}
    const dt=Math.min((now-(last||now))/1000,.05);last=now;
    const paused=document.body.classList.contains('motion-paused');
    if(!paused&&!reduced.matches)time+=dt;
    blend=reduced.matches?Number(expanded):blend+(Number(expanded)-blend)*(1-Math.exp(-dt*4.8));
    const mix=blend*blend*(3-2*blend),radius=Math.min(width*.44,height*.4),cx=width*.5,cy=height*.48;
    ctx.clearRect(0,0,width,height);
    const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,radius*1.3);halo.addColorStop(0,'rgba(203,223,192,.02)');halo.addColorStop(.65,'rgba(203,223,192,.09)');halo.addColorStop(1,'rgba(203,223,192,0)');ctx.fillStyle=halo;ctx.fillRect(0,0,width,height);
    for(const p of points){
      const angle=p.angle+time*.065;
      const ripple=Math.sin(time*.7+p.phase)*1.2;
      const dx=cx+Math.cos(angle)*(p.radius*radius+ripple),dy=cy+Math.sin(angle)*(p.radius*radius+ripple);
      const lineWidth=Math.min(width*.8,860),lx=(width-lineWidth)/2+p.along*lineWidth,ly=height*(.25+p.group*.12)+p.spread*(active===p.group?7:3)+Math.sin(p.along*12+time*1.1+p.group)*3;
      const x=dx+(lx-dx)*mix,y=dy+(ly-dy)*mix;
      const focus=active<0||active===p.group;
      ctx.globalAlpha=p.alpha*(focus?1:.32);ctx.fillStyle=active===p.group?'#efffe0':'#d8e9cd';
      ctx.beginPath();ctx.arc(x,y,p.size*(active===p.group?1.25:1),0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=(1-mix)*.4;ctx.strokeStyle='#d8e9cd';ctx.lineWidth=.65;
    for(const r of [radius*.18,radius*1.02]){ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();}
    ctx.globalAlpha=1;
  }
  requestAnimationFrame(draw);
}
