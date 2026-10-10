import * as THREE from '../../vendor/three.module.js';
import {discCanvas,coverCanvas} from './art.mjs';

const smooth=t=>t*t*(3-2*t);
export class AlbumStage {
  constructor({project,tracks,onOpen,onSelect,onHover,onError}) {
    Object.assign(this,{project,tracks,onOpen,onSelect,onHover,onError});
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.setClearColor(0x000000,0);
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
    this.renderer.shadowMap.enabled=false;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.canvas=this.renderer.domElement;this.canvas.setAttribute('aria-hidden','true');
    this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-6,6,4,-4,.1,80);this.camera.position.set(0,1.2,15);this.camera.lookAt(0,0,0);
    this.scene.add(new THREE.HemisphereLight('#fffef6','#a0a59d',2.8));
    const light=new THREE.DirectionalLight('#fffdf5',3.4);light.position.set(-4,7,8);light.castShadow=true;light.shadow.mapSize.set(1024,1024);Object.assign(light.shadow.camera,{left:-10,right:10,top:8,bottom:-8,near:1,far:30});light.shadow.normalBias=.025;light.shadow.radius=4;this.scene.add(light);
    const fill=new THREE.DirectionalLight('#d9e3e4',2);fill.position.set(6,1,4);this.scene.add(fill);
    const env=document.createElement('canvas');env.width=512;env.height=256;const ec=env.getContext('2d');ec.fillStyle='#a0a5a1';ec.fillRect(0,0,512,256);ec.fillStyle='#fafaf3';ec.fillRect(10,10,140,190);ec.fillRect(320,30,65,145);ec.fillStyle='#454d4b';ec.fillRect(220,0,30,256);
    const et=new THREE.CanvasTexture(env);et.mapping=THREE.EquirectangularReflectionMapping;et.colorSpace=THREE.SRGBColorSpace;
    const generator=new THREE.PMREMGenerator(this.renderer);this.environment=generator.fromEquirectangular(et);this.scene.environment=this.environment.texture;et.dispose();generator.dispose();
    const shadow=document.createElement('canvas');shadow.width=128;shadow.height=128;
    const sc=shadow.getContext('2d'),sg=sc.createRadialGradient(64,64,0,64,64,64);sg.addColorStop(0,'rgba(65,72,66,.16)');sg.addColorStop(1,'rgba(65,72,66,0)');sc.fillStyle=sg;sc.fillRect(0,0,128,128);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(9,4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadow),transparent:true,depthWrite:false}));floor.rotation.x=-Math.PI/2;floor.position.y=-2.55;this.scene.add(floor);
    this.album=new THREE.Group();this.detail=new THREE.Group();this.tv=new THREE.Group();this.scene.add(this.album,this.detail,this.tv);
    this.albumOpen=false;this.openValue=0;this.hover=-1;this.mode='album';this.preview=0;this.movieState='selection';this.lyric='';this.energy=0;this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.ray=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    this.tilt=new THREE.Vector2();this.spin=new THREE.Vector2();this.drag=null;this.suppressClick=false;
    this.buildAlbum();this.buildTV();this.setTrack(0);
    this.canvas.style.touchAction='none';
    this.canvas.addEventListener('pointerdown',e=>{
      this.suppressClick=false;
      if(this.mode!=='album'||this.albumOpen||e.button!==0)return;
      this.drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove',e=>{
      const d=this.drag;
      if(d&&d.id===e.pointerId){
        if(Math.hypot(e.clientX-d.startX,e.clientY-d.startY)>5)d.moved=true;
        if(d.moved){this.spin.x+=(e.clientX-d.x)*.012;this.spin.y+=(e.clientY-d.y)*.012;this.tilt.set(0,0);this.canvas.style.cursor='grabbing';}
        d.x=e.clientX;d.y=e.clientY;return;
      }
      this.hit(e,false);
    });
    const endDrag=e=>{if(!this.drag||this.drag.id!==e.pointerId)return;this.suppressClick=this.drag.moved||e.type==='pointercancel';this.drag=null;if(this.canvas.hasPointerCapture(e.pointerId))this.canvas.releasePointerCapture(e.pointerId);this.canvas.style.cursor='grab';};
    this.canvas.addEventListener('pointerup',endDrag);
    this.canvas.addEventListener('pointercancel',endDrag);
    this.canvas.addEventListener('lostpointercapture',()=>{if(this.drag){this.suppressClick=true;this.drag=null;}});
    this.canvas.addEventListener('pointerleave',()=>{this.hover=-1;this.tilt.set(0,0);this.canvas.style.cursor='default';});
    this.canvas.addEventListener('click',e=>{if(this.suppressClick){this.suppressClick=false;return;}this.hit(e,true);});
    window.addEventListener('blur',()=>{this.tilt.set(0,0);this.drag=null;});
    this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.failed=true;this.onError('3D graphics paused. The track links and audio controls remain available.');});
    this.observer=new ResizeObserver(()=>this.resize());this.last=0;this.draw=this.draw.bind(this);requestAnimationFrame(this.draw);
  }
  material(color,extra={}){return new THREE.MeshStandardMaterial({color,roughness:.38,metalness:.22,...extra});}
  box(parent,w,h,d,x,y,z,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  texture(canvas){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
  makeDisc(track){
    const group=new THREE.Group(),map=this.texture(discCanvas(track));
    const disc=new THREE.Mesh(new THREE.RingGeometry(.135,1,96),this.material('#e5e8e3',{map,metalness:.65,roughness:.25,side:THREE.DoubleSide}));disc.castShadow=true;group.add(disc);
    const edge=new THREE.Mesh(new THREE.TorusGeometry(.992,.012,6,96),this.material('#b0b9b5',{metalness:.8,roughness:.2}));group.add(edge);
    const hub=new THREE.Mesh(new THREE.RingGeometry(.136,.22,64),this.material('#dce0d9',{transparent:true,opacity:.5,side:THREE.DoubleSide,metalness:.2}));hub.position.z=.008;group.add(hub);
    group.userData.index=this.tracks.indexOf(track);group.traverse(o=>o.userData.index=group.userData.index);return group;
  }
  artwork(parent,project,track,w,h,x,y,z){
    const mat=new THREE.MeshStandardMaterial({map:this.texture(coverCanvas(project,track)),roughness:.95,metalness:0,side:THREE.DoubleSide});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);plane.position.set(x,y,z);parent.add(plane);
    const path=track?.cover||project.cover;if(path)new THREE.TextureLoader().load(path,t=>{t.colorSpace=THREE.SRGBColorSpace;mat.map.dispose();mat.map=t;mat.needsUpdate=true;},undefined,()=>this.onError('Artwork unavailable. Showing the editable placeholder cover.'));
    return plane;
  }
  buildAlbum(){
    this.case=new THREE.Group();this.album.add(this.case);this.case.rotation.set(-.12,-.22,.07);
    const clear=new THREE.MeshPhysicalMaterial({color:'#e4eeeb',metalness:.05,roughness:.12,transmission:.65,thickness:.06,transparent:true,opacity:.65,ior:1.47,side:THREE.DoubleSide,depthWrite:false});
    const rim=this.material('#bdc7c4',{metalness:.45,roughness:.23,transparent:true,opacity:.6});
    this.box(this.case,3.45,3.25,.12,0,0,-.13,clear);
    for(const y of [-1.62,1.62])this.box(this.case,3.45,.055,.43,0,y,.06,rim);
    for(const x of [-1.72,1.72])this.box(this.case,.055,3.25,.43,x,0,.06,rim);
    this.box(this.case,.22,3.23,.35,-1.56,0,.08,this.material('#87918a',{roughness:.4,metalness:.15}));
    this.hinge=new THREE.Group();this.hinge.position.set(-1.72,0,.31);this.case.add(this.hinge);
    this.box(this.hinge,3.44,3.24,.055,1.72,0,0,clear);this.artwork(this.hinge,this.project,null,3.06,3.05,1.8,0,.035);
    for(const y of [-1.61,1.61])this.box(this.hinge,3.44,.045,.1,1.72,y,.03,rim);
    for(let j=0;j<15;j++)this.box(this.hinge,.025,3.18,.025,.10+j*.013,0,.04,rim);
    this.discs=this.tracks.map((track,i)=>{const d=this.makeDisc(track);this.album.add(d);d.position.set(.10,0,-.08+i*.04);d.scale.setScalar(.96);return d;});
    this.case.position.z=.5;
  }
  buildTV(){
    const silver=this.material('#a9b2bb',{metalness:.78,roughness:.3}),plastic=this.material('#7f8993',{metalness:.35,roughness:.48}),dark=this.material('#313a38',{metalness:.1,roughness:.5});
    const brushing=document.createElement('canvas');brushing.width=256;brushing.height=256;const bc=brushing.getContext('2d');
    bc.fillStyle='#888';bc.fillRect(0,0,256,256);for(let y=0;y<256;y++){bc.fillStyle=`rgba(255,255,255,${.035+.025*Math.sin(y*23.73)})`;bc.fillRect(0,y,256,1);}
    silver.bumpMap=new THREE.CanvasTexture(brushing);silver.bumpScale=.009;
    const outline=new THREE.Shape();outline.moveTo(-2.31,-1.635);outline.lineTo(2.31,-1.635);outline.quadraticCurveTo(2.4,-1.635,2.4,-1.545);outline.lineTo(2.4,1.545);outline.quadraticCurveTo(2.4,1.635,2.31,1.635);outline.lineTo(-2.31,1.635);outline.quadraticCurveTo(-2.4,1.635,-2.4,1.545);outline.lineTo(-2.4,-1.545);outline.quadraticCurveTo(-2.4,-1.635,-2.31,-1.635);
    const shell=new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{depth:1.37,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.065,bevelThickness:.065,curveSegments:8}),silver);shell.position.set(0,.3,-.685);this.tv.add(shell);
    this.box(this.tv,3.65,2.8,1.6,0,.3,-.9,plastic);
    this.box(this.tv,4.39,3.33,.14,0,.25,.85,dark);
    this.screenCanvas=document.createElement('canvas');this.screenCanvas.width=960;this.screenCanvas.height=720;this.screenTexture=this.texture(this.screenCanvas);
    const geometry=new THREE.PlaneGeometry(4.253333,3.19,32,24),pos=geometry.attributes.position;
    for(let i=0;i<pos.count;i++){const x=pos.getX(i)/2.1266665,y=pos.getY(i)/1.595;pos.setZ(i,.09*(1-x*x)*(1-y*y));}geometry.computeVertexNormals();
    this.screen=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:this.screenTexture}));this.screen.position.set(0,.25,.94);this.tv.add(this.screen);
    this.screenGlow=new THREE.PointLight('#cddfda',0,4);this.screenGlow.position.set(-.2,.4,2.2);this.tv.add(this.screenGlow);
    // Slim silver surround keeps the image dominant; speakers sit below it.
    for(let i=0;i<28;i++)this.box(this.tv,.035,.018,.015,-.95+i*.07,-1.42,.80,dark);
    this.box(this.tv,3.8,.13,1.35,0,-1.49,-.02,plastic);
    this.box(this.tv,4.65,.51,1.8,0,-1.84,.18,silver);
    this.box(this.tv,2.82,.055,.025,-.23,-1.79,1.10,dark);
    this.box(this.tv,.5,.13,.03,1.7,-1.82,1.12,dark);
    this.box(this.tv,.11,.07,.035,-1.92,-1.82,1.12,plastic);
    this.box(this.tv,5.5,.12,2.4,0,-2.18,.15,this.material('#d4d0c6',{roughness:.85,metalness:0}));
    this.insertDisc=this.makeDisc(this.tracks[0]);this.tv.add(this.insertDisc);this.insertDisc.visible=false;
  }
  mount(host,mode){
    this.cancel();this.tilt.set(0,0);this.host=host;host.replaceChildren(this.canvas);this.mode=mode;
    this.album.visible=mode==='album';this.detail.visible=mode==='track';this.tv.visible=mode==='movie';
    this.observer.disconnect();this.observer.observe(host);this.resize();
  }
  resize(){if(!this.host)return;const r=this.host.getBoundingClientRect();if(!r.width||!r.height)return;this.renderer.setSize(r.width,r.height);const aspect=r.width/r.height;
    this.aspect=aspect;
    if(this.mode==='movie'){
      // Preserve the CRT proportions: enlarge uniformly, never stretch.
      this.tv.scale.set(1,1,1);
      if(this.screenCanvas.width!==960){this.screenCanvas.width=960;this.screenTexture.needsUpdate=true;}
    }
    let h=this.mode==='album'?this.albumHeight(aspect):this.mode==='movie'?Math.max(4.5,5.15/aspect):4.1;
    this.camera.left=-h*aspect/2;this.camera.right=h*aspect/2;this.camera.top=h/2;this.camera.bottom=-h/2;this.camera.updateProjectionMatrix();
  }
  albumHeight(aspect){
    const v=smooth(this.openValue);
    return Math.max(4.3,4.3/aspect)*(1-v)+Math.max(6.6,11.7/aspect)*v;
  }
  setOpen(open){
    this.albumOpen=open;this.tilt.set(0,0);this.spin.set(0,0);this.drag=null;
    // Return by the shortest angle after any number of full revolutions.
    for(const axis of ['x','y'])this.album.rotation[axis]=Math.atan2(Math.sin(this.album.rotation[axis]),Math.cos(this.album.rotation[axis]));
  }
  setTrack(index){
    if(this.detailDisc){this.detail.remove(this.detailDisc);this.disposeGroup(this.detailDisc);}
    this.detailDisc=this.makeDisc(this.tracks[index]);this.detail.add(this.detailDisc);this.detailDisc.scale.setScalar(1.65);this.detailDisc.rotation.set(.08,-.18,-.12);
  }
  disposeGroup(group){group.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});}
  setPreview(index){this.preview=index;this.movieState='selection';this.lyric='';this.loadMedia(null);}
  setPlayback({track,line,cue,time,energy,state}){this.cue=cue;this.preview=track;this.lyric=line;this.time=time;this.energy=energy;this.movieState=state;}
  loadMedia(config){
    this.mediaVersion=(this.mediaVersion||0)+1;const version=this.mediaVersion;
    if(this.media?.tagName==='VIDEO'){this.media.pause();this.media.removeAttribute('src');this.media.load();}this.media=null;
    if(!config?.src)return;
    const m=document.createElement(config.type==='image'?'img':'video');if(m.tagName==='VIDEO'){m.muted=true;m.playsInline=true;m.loop=config.loop!==false;m.preload='metadata';}
    m.addEventListener('error',()=>{if(version===this.mediaVersion){this.media=null;this.onError('Visual media could not load. Timed lyrics remain available.');}},{once:true});m.src=config.src;this.media=m;if(m.tagName==='VIDEO')m.play().catch(()=>{});
  }
  animate(kind,index){
    this.cancel();this.preview=index;this.insertDisc.visible=true;
    this.tv.remove(this.insertDisc);this.disposeGroup(this.insertDisc);this.insertDisc=this.makeDisc(this.tracks[index]);this.tv.add(this.insertDisc);this.insertDisc.scale.setScalar(.65);
    return new Promise(resolve=>{this.transition={kind,start:performance.now(),duration:this.motion.matches?180:kind==='insert'?1650:1100,resolve};});
  }
  cancel(){if(this.transition){this.transition.resolve(false);this.transition=null;}this.insertDisc.visible=false;if(this.screen)this.screen.scale.y=1;}
  hit(event,click){
    if(this.mode!=='album')return;const r=this.canvas.getBoundingClientRect();this.pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);if(!click&&!this.albumOpen&&event.pointerType!=='touch'){
      this.tilt.set(THREE.MathUtils.clamp(this.pointer.x,-1,1),THREE.MathUtils.clamp(this.pointer.y,-1,1));
    }
    this.ray.setFromCamera(this.pointer,this.camera);
    if(!this.albumOpen){const hit=this.ray.intersectObject(this.case,true).length;this.canvas.style.cursor=hit?'grab':'default';if(click&&hit)this.onOpen();return;}
    const hits=this.ray.intersectObjects(this.discs,true);const index=hits[0]?.object.userData.index??-1;
    if(index!==this.hover){this.hover=index;if(index>=0)this.onHover(index);}const caseHit=this.ray.intersectObject(this.case,true).length>0;
    this.canvas.style.cursor=index>=0||caseHit?'pointer':'default';
    if(click){if(index>=0)this.onSelect(index);else if(caseHit)this.onOpen();}
  }
  drawMemory(c,w,h,now,theme){
    // A moving-window study: distant hills, soft city lights and passing glass.
    // Uses the audio clock during playback, so pausing/seeking also stops/seeks it.
    const time=this.motion.matches?0:this.movieState==='selection'?now/1000:(this.time||0);
    const pulse=this.motion.matches?0:Math.min(.4,this.energy);
    c.save();
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#17282e');sky.addColorStop(.6,theme.background);sky.addColorStop(1,'#152523');c.fillStyle=sky;c.fillRect(0,0,w,h);
    c.filter='blur(22px)';
    for(let layer=0;layer<3;layer++){
      c.beginPath();c.moveTo(0,h);for(let x=0;x<=w+20;x+=20){const y=h*(.57+layer*.11)+Math.sin(x/w*5+time*.065+layer)*h*.07+Math.sin(x/w*11+layer*3)*h*.025;c.lineTo(x,y);}c.lineTo(w,h);c.closePath();c.fillStyle=['#a3b8b13a','#31474e99','#11262ccc'][layer];c.fill();
    }
    c.globalCompositeOperation='screen';
    for(let i=0;i<12;i++){
      const x=((i*.137+time*(.007+i%3*.004))%1.3-.15)*w;
      const y=h*(.24+.43*(.5+.5*Math.sin(i*6.13)));
      const radius=w*(.012+(i%3)*.012)+pulse*w*.025;
      const glow=c.createRadialGradient(x,y,0,x,y,radius*2.7);glow.addColorStop(0,i%4===0?'#dcc5a17a':'#a7ced366');glow.addColorStop(.35,i%4===0?'#dcc5a132':'#a7ced329');glow.addColorStop(1,'#a7ced300');c.fillStyle=glow;c.fillRect(x-radius*2.7,y-radius*2.7,radius*5.4,radius*5.4);
    }
    c.filter='blur(5px)';c.fillStyle='#d9eeee0c';
    const frame=((time*.027)%1.6-.3)*w;c.fillRect(frame,0,w*.025,h);c.fillRect(frame+w*.48,0,w*.006,h);
    c.restore();
    const shade=c.createRadialGradient(w*.5,h*.48,w*.03,w*.5,h*.48,w*.68);shade.addColorStop(0,'#07121355');shade.addColorStop(1,'#050e1866');c.fillStyle=shade;c.fillRect(0,0,w,h);
  }
  drawTV(now){
    const c=this.screenCanvas.getContext('2d'),w=this.screenCanvas.width,h=this.screenCanvas.height,t=this.tracks[this.preview];
    const state=this.movieState;const off=state==='ejecting';
    c.fillStyle='#15201d';c.fillRect(0,0,w,h);
    const breath=this.motion.matches?0:Math.sin(now*.00027)*.018+this.energy*.07;
    const g=c.createRadialGradient(w*.5,h*.45,10,w*.5,h*.45,w*.7);g.addColorStop(0,t.visualTheme.background);g.addColorStop(1,'#293331');c.globalAlpha=state==='selection'?.6:.85+breath;c.fillStyle=g;c.fillRect(0,0,w,h);c.globalAlpha=1;
    if(!this.media)this.drawMemory(c,w,h,now,t.visualTheme);
    if(this.media && (this.media.tagName==='IMG'?this.media.complete&&this.media.naturalWidth:this.media.readyState>=2)){
      const mw=this.media.videoWidth||this.media.naturalWidth,mh=this.media.videoHeight||this.media.naturalHeight;
      const scale=Math.max(w/mw,h/mh);c.drawImage(this.media,(w-mw*scale)/2,(h-mh*scale)/2,mw*scale,mh*scale);c.fillStyle='#101a1622';c.fillRect(0,0,w,h);
    }
    const text=state==='selection'?t.title:state==='inserting'?'READING DISC':t.status!=='available'?'COMING SOON':this.lyric||(t.instrumental?t.visualTheme.idleText:'');
    if(text!==this.lastText){this.lastText=text;this.textStart=now;}
    const fade=this.motion.matches?1:Math.min(1,(now-this.textStart)/180);
    const showWords=!this.media||t.movie?.showLyrics!==false||state==='selection';
    if(showWords){
      c.save();c.globalAlpha=fade;c.filter=`blur(${(1-fade)*3}px)`;c.textAlign='left';c.textBaseline='middle';c.font='44px Arial';c.shadowColor='#061113';c.shadowBlur=12;
      const timed=state==='playing'&&this.cue?.words?.length;
      const words=timed?this.cue.words:text.split(/\s+/).map(word=>({text:word}));
      const lines=[];let row=[],width=0;const space=c.measureText(' ').width;
      for(const word of words){const size=c.measureText(word.text).width;if(row.length&&width+space+size>w*.8){lines.push({words:row,width});row=[];width=0;}if(row.length)width+=space;row.push({...word,size});width+=size;}
      if(row.length)lines.push({words:row,width});
      lines.forEach((row,i)=>{let x=(w-row.width)/2;const y=h/2+(i-(lines.length-1)/2)*60;
        row.words.forEach(word=>{const sung=!timed||this.time>=word.time;const active=timed&&this.time>=word.time&&this.time<word.end;c.globalAlpha=fade*(sung?1:.4);c.fillStyle=active?'#ffffff':t.visualTheme.ink;c.fillText(word.text,x,y);x+=word.size+space;});
      });c.restore();
    }
    c.fillStyle=t.visualTheme.ink;c.globalAlpha=.55;c.font='17px monospace';c.textAlign='left';c.fillText(`${t.number} / ${t.title}`,w*.065,64);c.textAlign='right';c.fillText(state==='selection'?'PREVIEW':state==='playing'?'PLAY':'MEMORY',w*.935,64);
    c.textAlign='center';c.font='14px Arial';c.fillText(state==='selection'?'INSERT A DISC TO BEGIN':`${this.project.title.toUpperCase()} / ORIGINAL RECORDINGS`,w/2,659);c.globalAlpha=1;
    c.fillStyle='#101510';c.globalAlpha=.055;for(let y=0;y<h;y+=4)c.fillRect(0,y,w,1);c.globalAlpha=1;
    if(!this.motion.matches){c.fillStyle=`rgba(238,244,222,${.02+this.energy*.02})`;c.fillRect(0,(now*.012)%h,w,3);}
    this.screenTexture.needsUpdate=true;this.screenGlow.intensity=off?0:.25+this.energy*.8;
  }
  draw(now){
    requestAnimationFrame(this.draw);if(document.hidden||this.failed||!this.host||!this.host.getClientRects().length)return;
    const dt=Math.min((now-(this.last||now))/1000,.06);this.last=now;
    this.openValue+=(Number(this.albumOpen)-this.openValue)*(this.motion.matches?1:Math.min(1,dt*3));const v=smooth(this.openValue);
    if(this.mode==='album'&&this.aspect){const h=this.albumHeight(this.aspect);this.camera.left=-h*this.aspect/2;this.camera.right=h*this.aspect/2;this.camera.top=h/2;this.camera.bottom=-h/2;this.camera.updateProjectionMatrix();}
    // Rotate the whole closed package, including the discs inside it.
    // Ease back to the selection pose as it opens; never interfere with clicks.
    const tiltWeight=this.mode==='album'&&!this.albumOpen&&!this.motion.matches?1-v:0;
    const follow=this.motion.matches?1:1-Math.exp(-dt*9);
    const spinWeight=this.mode==='album'&&!this.albumOpen?1:0;
    this.album.rotation.x+=(this.spin.y*spinWeight-this.tilt.y*.25*tiltWeight-this.album.rotation.x)*follow;
    this.album.rotation.y+=(this.spin.x*spinWeight+this.tilt.x*.48*tiltWeight-this.album.rotation.y)*follow;
    this.album.rotation.z+=(-this.tilt.x*.035*tiltWeight-this.album.rotation.z)*follow;
    this.hinge.rotation.y=-2.65*v;this.case.position.y=v*1.6;this.case.scale.setScalar(1-v*.3);
    // Store the closed stack in case-local coordinates so every viewing angle
    // keeps all five discs between the back panel and the closed lid.
    this.case.updateMatrix();
    this.discs.forEach((disc,i)=>{
      const hover=this.hover===i&&this.albumOpen?1:0;
      const inside=new THREE.Vector3(.1,0,.01+i*.035).applyMatrix4(this.case.matrix);
      const outside=new THREE.Vector3((i-2)*2.12,-1.10,1+hover*.2);
      disc.position.copy(inside).lerp(outside,v);
      const spread=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.12,-.08+(i-2)*.035,-.04+i*.018));
      disc.quaternion.copy(this.case.quaternion).slerp(spread,v);
      const target=.96+hover*.05;disc.scale.lerp(new THREE.Vector3(target,target,target),.12);
    });
    if(this.mode==='track'&&!this.motion.matches)this.detailDisc.rotation.y=-.18+Math.sin(now*.00022)*.12;
    if(this.transition){const a=this.transition,p=Math.min(1,(now-a.start)/a.duration),v=smooth(p);
      if(a.kind==='insert'){
        const first=Math.min(1,p/.65),second=Math.max(0,(p-.65)/.35);this.insertDisc.position.set(-3.5*(1-smooth(first)),-1.78*smooth(first),2.8-2.5*smooth(second));this.insertDisc.rotation.set(-Math.PI/2*smooth(first),0,.2*(1-first));this.insertDisc.visible=second<.9;this.screen.scale.y=.03+.97*Math.max(0,(p-.85)/.15);
      }else{this.screen.scale.y=Math.max(.004,1-Math.min(1,p*3));this.insertDisc.visible=p>.3;this.insertDisc.rotation.x=-Math.PI/2;this.insertDisc.position.set(0,-1.78,.3+2.5*v);}
      if(p>=1){this.transition=null;this.insertDisc.visible=false;this.screen.scale.y=1;a.resolve(true);}
    }
    if(this.mode==='movie'&&(!this.lastTV||now-this.lastTV>45)){this.drawTV(now);this.lastTV=now;}
    this.renderer.toneMappingExposure=this.mode==='movie'?.78:1.18;
    if(this.mode==='movie'){
      this.scene.updateMatrixWorld(true);this.camera.updateMatrixWorld(true);
      const rect=this.canvas.getBoundingClientRect();
      [['tv-insert',-1.65],['tv-toggle',.65],['tv-eject',1.65]].forEach(([id,x])=>{
        const point=this.tv.localToWorld(new THREE.Vector3(x,-1.91,1.15)).project(this.camera);
        const button=document.getElementById(id);if(button){button.style.left=`${rect.left+(point.x+1)*rect.width/2}px`;button.style.top=`${rect.top+(1-point.y)*rect.height/2}px`;}
      });
    }
    this.renderer.render(this.scene,this.camera);
  }
}
