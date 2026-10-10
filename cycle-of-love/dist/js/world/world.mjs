import * as THREE from '../../vendor/three.module.js';
import { ART, surfaceTexture, softPoolTexture, memoryStill } from './art-direction.mjs';
import { EYE_HEIGHT, START, ROOM_CENTERS, WALLS, PLINTHS, move, zoneAt, findPath } from './layout.mjs';

/* A single connected scene. Audio remains owned by the existing MusicPlayer. */
export class MemoryWorld {
  constructor({ canvas, rooms, player, onZone, onMemory, onHint, onLock, onError, onFatal }) {
    Object.assign(this, { canvas, rooms, player, onZone, onMemory, onHint, onLock, onError, onFatal });
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(ART.fog);
    this.scene.fog = new THREE.Fog(ART.fog, 10, 43);
    this.camera = new THREE.PerspectiveCamera(65, 1, .08, 65);
    this.camera.rotation.order = 'YXZ';
    this.camera.position.set(START.x, EYE_HEIGHT, START.z);
    this.yaw = 0; this.pitch = 0; this.keys = new Set(); this.path = [];
    this.active = false; this.paused = false; this.zone = -1; this.last = 0; this.energy = 0;
    this.ray = new THREE.Raycaster(); this.targets = []; this.screens = []; this.lyricSurfaces = [];
    this.lights = []; this.sculptures = []; this.videos = [];
    this.pointer = new THREE.Vector2(0, 0); this.hasPointer = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
    this.build(); this.bindControls();
    this.resize = () => {
      this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
      this.renderer.setSize(innerWidth, innerHeight);
    };
    addEventListener('resize', this.resize); this.resize();
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault(); this.failed=true; this.setActive(false); this.onFatal('3D graphics paused. Reload to restore the world, or use the room controls below.');
    });
    this.frame = this.frame.bind(this); requestAnimationFrame(this.frame);
  }
  material(color, extra = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: .65, metalness: .18, ...extra });
  }
  box(x, y, z, w, h, d, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z); this.scene.add(mesh); return mesh;
  }
  label(text, x, y, z, width = 3, color = ART.charcoal, height = .45) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
    const ctx = canvas.getContext('2d'); ctx.fillStyle = color;
    ctx.font = `${Math.round(canvas.height * .52)}px Helvetica, Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 512, canvas.height / 2, 980);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({map:texture, transparent:true, depthWrite:false}));
    mesh.position.set(x,y,z); this.scene.add(mesh); return mesh;
  }
  build() {
    const concrete=surfaceTexture('wall'), brushed=surfaceTexture('metal');
    const tiles=surfaceTexture('floor');tiles.repeat.set(10,14);
    const wall=this.material(ART.wall,{map:concrete,metalness:0,roughness:.95});
    const metal=this.material(ART.metal,{map:brushed,roughness:.6,metalness:.35});
    const plastic=this.material(ART.plastic,{roughness:.84,metalness:0});
    const dark=this.material(ART.charcoal,{roughness:.8,metalness:.1});
    const white=new THREE.MeshBasicMaterial({color:ART.light});
    this.scene.add(new THREE.HemisphereLight('#edf0df','#aab6b0',2.15));
    this.scene.add(new THREE.AmbientLight('#d7e0d6',.7));
    const daylight=new THREE.DirectionalLight('#e2ecdf',1.35);
    daylight.position.set(-8,8,5);this.scene.add(daylight);
    this.box(0,-.12,-2,20,.24,28,this.material(ART.floor,{map:tiles,roughness:.87,metalness:.04}));
    WALLS.forEach(w=>this.box(w.x,w.h/2,w.z,w.w,w.h,w.d,wall));
    this.box(0,5.28,-2,20,.16,28,this.material(ART.ceiling,{roughness:1,metalness:0}));

    // Fluorescent trays, not illuminated gaming strips. Geometry stays in place.
    const fixture=(x,z,length=2.8)=>{
      this.box(x,5.08,z,length+.15,.13,.65,metal);
      this.box(x,4.99,z,length,.035,.49,white);
      for(let j=0;j<5;j++)this.box(x-length/2+j*length/4,4.965,z,.025,.04,.52,metal);
      const halo=new THREE.Mesh(new THREE.PlaneGeometry(length+1.1,1.5),new THREE.MeshBasicMaterial({color:'#f6f4df',transparent:true,opacity:.045,depthWrite:false,side:THREE.DoubleSide}));
      halo.rotation.x=Math.PI/2;halo.position.set(x,4.94,z);this.scene.add(halo);
    };
    for(const z of [9,3,-1]){
      fixture(-5,z);fixture(5,z);
      this.box(-9.93,2.6,z,.08,5.2,.1,metal);this.box(9.93,2.6,z,.08,5.2,.1,metal);
    }
    // Familiar institutional wall finishes: aluminum skirting and frosted glazing.
    for(const side of [-1,1]){
      this.box(side*9.97,.09,-2,.045,.18,28,metal);
      for(const z of [7,2]){
        this.box(side*9.95,2.75,z,.035,3.7,3.9,metal);
        this.box(side*9.91,2.75,z,.04,3.54,3.7,this.material(ART.glass,{roughness:.98,metalness:0,emissive:'#d4e4d8',emissiveIntensity:.35}));
        for(const offset of [-1.15,0,1.15])this.box(side*9.87,2.75,z+offset,.05,3.55,.035,metal);
        this.box(side*9.85,2.15,z,.04,.8,3.65,this.material('#cbd7ca',{roughness:1,transparent:true,opacity:.52}));
      }
    }
    this.box(0,2.65,-2.79,3.15,1.1,.045,plastic);
    this.label('Memory archive',0,2.91,-2.756,2.7,ART.charcoal,.25);
    this.label('01  ←        →  02',0,2.48,-2.755,2.4,ART.charcoal,.22);
    this.label('LOVE / MEMORY / CHANGE',0,1.72,-2.81,2.4,'#69756e',.15);

    ROOM_CENTERS.forEach((x,i)=>{
      const palette=ART.rooms[i],color=palette.tint;
      this.box(x,4.3,-3,2.7,1.8,.3,wall);
      this.box(x-1.36,1.7,-2.8,.06,3.4,.12,metal);
      this.box(x+1.36,1.7,-2.8,.06,3.4,.12,metal);
      this.box(x,3.41,-2.8,2.8,.055,.12,metal);
      this.box(x,.013,-3,2.7,.018,.4,metal);
      this.box(x,3.88,-2.81,2.15,.43,.045,plastic);
      this.label(`Room ${this.rooms[i].number}`,x,3.89,-2.775,1.8,palette.label,.26);
      fixture(x,-7);fixture(x,-12);
      const light=new THREE.PointLight(color,10,15,2);
      light.position.set(x,4.35,-9);this.scene.add(light);this.lights.push(light);
      this.box(x,.1,-15.94,9.7,.18,.04,metal);

      // Early LCD / gallery monitor: warm plastic surround, recessed screen.
      this.box(x,2.65,-15.77,5.3,3.2,.25,plastic);
      this.box(x,2.7,-15.60,4.96,2.9,.05,dark);
      const surface=document.createElement('canvas');surface.width=480;surface.height=288;
      const texture=new THREE.CanvasTexture(surface);texture.colorSpace=THREE.SRGBColorSpace;
      const screen=new THREE.Mesh(new THREE.PlaneGeometry(4.76,2.68),new THREE.MeshBasicMaterial({map:texture}));
      screen.position.set(x,2.7,-15.56);this.scene.add(screen);
      this.screens.push({mesh:screen,canvas:surface,texture,color:palette.screen,index:i});
      this.box(x+2.27,1.2,-15.61,.045,.018,.015,new THREE.MeshBasicMaterial({color:'#789687'}));
      this.label('MEMORY '+this.rooms[i].number,x,1.12,-15.6,1.7,palette.label,.13);
      this.loadVisual(screen,this.rooms[i].screen);
      if(this.rooms[i].background?.enabled!==false&&this.rooms[i].background?.src){
        const projection=new THREE.Mesh(new THREE.PlaneGeometry(7,3.3),new THREE.MeshBasicMaterial({color:'#b5c6bf'}));
        projection.position.set(i===0?-9.96:9.96,2.7,-8.5);projection.rotation.y=i===0?Math.PI/2:-Math.PI/2;
        this.scene.add(projection);this.loadVisual(projection,this.rooms[i].background);
      }
      const lyricCanvas=document.createElement('canvas');lyricCanvas.width=1536;lyricCanvas.height=180;
      const lyricTexture=new THREE.CanvasTexture(lyricCanvas);lyricTexture.colorSpace=THREE.SRGBColorSpace;
      const lyric=new THREE.Mesh(new THREE.PlaneGeometry(8.5,1),new THREE.MeshBasicMaterial({map:lyricTexture,transparent:true,depthWrite:false}));
      lyric.position.set(x,4.48,-15.6);this.scene.add(lyric);this.lyricSurfaces.push({canvas:lyricCanvas,texture:lyricTexture,mesh:lyric,text:''});
      const outer=i===0?-1:1;
      this.box(outer*9.94,2.8,-7.1,.06,3.5,4.8,metal);
      this.box(outer*9.89,2.8,-7.1,.04,3.35,4.64,this.material('#cbd9cf',{emissive:'#e4ede0',emissiveIntensity:.42,roughness:.97}));
      for(const z of [-8.6,-7.1,-5.6])this.box(outer*9.85,2.8,z,.04,3.4,.04,metal);
      this.box(outer*9.82,2.1,-7.1,.04,.72,4.6,this.material('#d4ddd2',{transparent:true,opacity:.55,roughness:1}));
      this.label(this.rooms[i].name,x,.7,-15.65,3.7,'#687570',.18);
    });

    const shadowTexture=softPoolTexture();
    PLINTHS.forEach(p=>{
      // Existing interaction locations/footprints stay unchanged.
      const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));
      shadow.rotation.x=-Math.PI/2;shadow.position.set(p.x,.009,p.z);this.scene.add(shadow);
      if(p.object===0){
        this.box(p.x,.85,p.z,1.05,.065,.95,plastic);
        for(const sx of [-.43,.43])for(const sz of [-.36,.36])this.box(p.x+sx,.42,p.z+sz,.035,.84,.035,metal);
        // A small beige CRT on a metal table: ordinary technology as a memory object.
        this.box(p.x,1.18,p.z,.67,.56,.5,plastic);
        this.box(p.x,1.17,p.z+.26,.56,.41,.025,dark);
        const crt=new THREE.Mesh(new THREE.PlaneGeometry(.5,.355),new THREE.MeshBasicMaterial({map:memoryStill(p.room===0)}));
        crt.position.set(p.x,1.18,p.z+.28);this.scene.add(crt);
        this.box(p.x, .92,p.z,.35,.09,.33,plastic);
        this.box(p.x+.23,.958,p.z+.277,.024,.012,.009,new THREE.MeshBasicMaterial({color:'#819b7d'}));
      }else{
        // An empty molded waiting chair, with a photograph left on the seat.
        const seat=this.material(p.room===0?'#aeb5a2':'#9fafae',{roughness:.88,metalness:0});
        this.box(p.x,.49,p.z,.78,.08,.76,seat);
        this.box(p.x,.91,p.z-.34,.78,.8,.075,seat);
        for(const sx of [-.32,.32])for(const sz of [-.28,.28])this.box(p.x+sx,.24,p.z+sz,.034,.48,.034,metal);
        const photo=new THREE.Mesh(new THREE.PlaneGeometry(.38,.29),new THREE.MeshBasicMaterial({map:memoryStill(p.room===0),side:THREE.DoubleSide}));
        photo.position.set(p.x,.65,p.z+.02);photo.rotation.x=-.65;photo.rotation.z=-.08;this.scene.add(photo);
      }
      const target=this.box(p.x,1.05,p.z,1,1.35,1,new THREE.MeshBasicMaterial({visible:false}));
      target.userData={room:p.room,object:p.object};this.targets.push(target);
      const object=this.rooms[p.room].objects[p.object];
      this.label(object?.label||'Memory',p.x,.2,p.z+.565,1,ART.charcoal,.12);
    });
    const points=[];
    for(let i=0;i<45;i++)points.push((Math.random()-.5)*19,Math.random()*4.8,Math.random()*27-15);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    this.dust=new THREE.Points(geometry,new THREE.PointsMaterial({color:'#e8ede0',size:.014,transparent:true,opacity:.12}));this.scene.add(this.dust);
    this.drawScreens(0);
  }
  loadVisual(mesh, config) {
    if(!config?.src || config.enabled===false)return;
    const replace = texture => {
      texture.colorSpace=THREE.SRGBColorSpace; mesh.material.map=texture;mesh.material.needsUpdate=true;
    };
    if(config.type==='image')new THREE.TextureLoader().load(config.src,replace,undefined,()=>this.onError('A room image could not load; the original screen is still available.'));
    if(config.type==='video'){
      const video=document.createElement('video');video.src=config.src;video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';
      video.addEventListener('loadeddata',()=>replace(new THREE.VideoTexture(video)),{once:true});
      video.addEventListener('error',()=>this.onError('A room video could not load; the atmospheric screen is still available.'),{once:true});
      this.videos.push(video);
    }
  }
  drawScreens(time) {
    this.screens.forEach(screen=>{
      const c=screen.canvas.getContext('2d'),w=screen.canvas.width,h=screen.canvas.height;
      // Soft, low-resolution architectural footage: an empty platform through glass.
      c.fillStyle=screen.color;c.fillRect(0,0,w,h);
      c.save();c.filter='blur(5px)';
      const drift=Math.sin(time*.055+screen.index)*7;
      c.translate(drift,0);
      const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#e8ebda');sky.addColorStop(.58,screen.color);sky.addColorStop(1,'#87958e');
      c.fillStyle=sky;c.fillRect(-12,0,w+24,h);
      c.fillStyle='#f0efde';c.fillRect(-12,28,w+24,105);
      c.fillStyle='#8d9e98';
      for(let x=52;x<w;x+=105)c.fillRect(x,0,6,h*.77);
      c.fillStyle='#a4b1a6';c.fillRect(-12,h*.72,w+24,8);
      c.fillStyle='#74837c';c.fillRect(147,190,112,5);c.fillRect(157,195,4,28);c.fillRect(246,195,4,28);
      c.fillStyle='#d5dece';c.fillRect(-12,240,w+24,2);
      c.restore();
      c.fillStyle='rgba(235,232,211,.17)';c.fillRect(0,0,w,h);
      c.fillStyle='rgba(53,70,65,.045)';for(let y=0;y<h;y+=3)c.fillRect(0,y,w,1);
      screen.texture.needsUpdate=true;
    });
  }
  setLyric(index, text, emphasis=false) {
    this.lyricSurfaces.forEach((surface,i)=>{
      const next=i===index?text:'';if(surface.text===next)return;surface.text=next;
      const ctx=surface.canvas.getContext('2d');ctx.clearRect(0,0,1536,180);
      ctx.fillStyle=emphasis?'#786562':'#52615c';ctx.font=`${emphasis?60:52}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(next,768,90,1480);surface.texture.needsUpdate=true;
    });
  }
  setActive(active) {
    this.active=active;this.keys.clear();this.path=[];
    if(!active){this.unlock();this.videos.forEach(v=>v.pause());}
    else this.videos.forEach(v=>v.play().catch(()=>{}));
  }
  reset() { this.camera.position.set(START.x,EYE_HEIGHT,START.z);this.camera.rotation.set(0,0,0);this.yaw=0;this.pitch=0;this.zone=-1;this.path=[]; }
  suspend(value) { this.paused=value;this.keys.clear();if(value)this.unlock(); }
  get locked() { return document.pointerLockElement===this.canvas; }
  unlock() { if(this.locked)document.exitPointerLock(); }
  async lock() {
    if(!this.active)return;
    try{if(!this.canvas.requestPointerLock)throw new Error('Unsupported');await this.canvas.requestPointerLock();}
    catch { this.onError('Mouse lock is unavailable here. Drag the scene to look around, and use WASD to walk.'); }
  }
  navigate(index) {
    const target=index<0?{x:0,z:5}:{x:ROOM_CENTERS[index],z:-7};
    this.keys.clear();this.path=findPath(this.camera.position,target);this.guidedTarget=index;
    if(!this.path.length)this.onError('This route is unavailable. You can still use the walking controls.');
  }
  interact() {
    if(!this.nearby)return;
    const {room,object}=this.nearby.userData;
    const memory=this.rooms[room].objects[object];if(memory){this.keys.clear();this.path=[];this.unlock();this.onMemory(memory,room);}
  }
  bindControls() {
    const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    addEventListener('keydown',event=>{
      if(!this.active||this.paused||event.ctrlKey||event.metaKey||event.altKey||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName))return;
      if(movement.includes(event.code)){event.preventDefault();this.path=[];this.keys.add(event.code);}
      if(event.code==='KeyE'&&!event.repeat){event.preventDefault();this.interact();}
    });
    addEventListener('keyup',event=>this.keys.delete(event.code));
    addEventListener('blur',()=>{this.keys.clear();this.drag=null;});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){this.keys.clear();this.path=[];this.unlock();}});
    document.addEventListener('pointerlockchange',()=>{this.keys.clear();this.drag=null;this.lastUnlock=performance.now();if(this.locked)this.canvas.focus({preventScroll:true});this.onLock(this.locked);});
    document.addEventListener('pointerlockerror',()=>this.onError('Drag to look around; mouse lock was not available.'));
    document.addEventListener('mousemove',e=>{if(this.locked&&!this.paused)this.look(e.movementX,e.movementY);});
    this.canvas.addEventListener('pointerdown',event=>{
      if(!this.active||this.paused||this.locked||event.button>0)return;
      this.pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);
      this.hasPointer=true;
      this.canvas.focus({preventScroll:true});this.canvas.setPointerCapture(event.pointerId);
      this.drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false};
    });
    this.canvas.addEventListener('pointermove',event=>{
      this.hasPointer=true;this.pointer.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);
      if(!this.drag||this.drag.id!==event.pointerId)return;
      const d=this.drag;this.look(event.clientX-d.x,event.clientY-d.y);d.x=event.clientX;d.y=event.clientY;
      if(Math.hypot(d.x-d.startX,d.y-d.startY)>5)d.moved=true;
    });
    this.canvas.addEventListener('pointerup',event=>{
      if(this.drag?.id!==event.pointerId)return;
      if(!this.drag.moved){this.updateTarget(this.pointer);this.interact();}this.drag=null;
    });
    this.canvas.addEventListener('pointercancel',()=>{this.drag=null;this.keys.clear();});
    this.canvas.addEventListener('lostpointercapture',()=>{this.drag=null;});
    this.canvas.addEventListener('pointerleave',()=>{this.hasPointer=false;});
    document.querySelectorAll('[data-move]').forEach(button=>{
      const release=()=>this.keys.delete(button.dataset.move);
      button.addEventListener('pointerdown',event=>{if(!this.active||this.paused)return;event.preventDefault();this.path=[];button.setPointerCapture(event.pointerId);this.keys.add(button.dataset.move);});
      ['pointerup','pointercancel','lostpointercapture'].forEach(event=>button.addEventListener(event,release));
    });
  }
  look(dx,dy) {this.yaw-=dx*.0025;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.0025,-1.12,1.12);}
  updateTarget(tapPointer=null) {
    if(!this.active||this.paused){this.nearby=null;this.onHint('');return;}
    const centered=this.locked||!this.hasPointer||matchMedia('(pointer:coarse)').matches;
    this.ray.setFromCamera(tapPointer || (centered?new THREE.Vector2(0,0):this.pointer),this.camera);
    const hit=this.ray.intersectObjects(this.targets).find(hit=>hit.distance<3.4&&hit.object.userData.room===this.zone);
    this.nearby=hit?.object||null;
    this.onHint(hit?this.rooms[hit.object.userData.room].objects[hit.object.userData.object]?.label||'Memory':'');
  }
  frame(now) {
    requestAnimationFrame(this.frame);
    if(document.hidden||this.failed)return;
    const dt=Math.min((now-(this.last||now))/1000,.05);this.last=now;
    if(this.active&&!this.paused){
      if(this.path.length){
        const next=this.path[0],dx=next.x-this.camera.position.x,dz=next.z-this.camera.position.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*2.5);
        if(d<.05)this.path.shift();else{
          move(this.camera.position,dx/d*step,dz/d*step);
          const desired=Math.atan2(-dx,-dz),difference=Math.atan2(Math.sin(desired-this.yaw),Math.cos(desired-this.yaw));
          this.yaw+=difference*Math.min(1,dt*3);this.pitch*=1-Math.min(1,dt*3);
        }
        if(!this.path.length&&this.guidedTarget>=0){this.yaw=0;this.pitch=0;}
      }else{
        const forward=Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))-Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'));
        const side=Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA'));
        this.yaw+=(Number(this.keys.has('ArrowLeft'))-Number(this.keys.has('ArrowRight')))*dt*1.4;
        const length=Math.max(1,Math.hypot(forward,side)),speed=dt*2.4/length;
        move(this.camera.position,(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*side)*speed,(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*side)*speed);
      }
      this.camera.rotation.set(this.pitch,this.yaw,0);
      const zone=zoneAt(this.camera.position);
      if(zone!==this.zone){this.zone=zone;this.onZone(zone);}
      this.updateTarget();
    }
    const levels=this.player.levels();this.energy+=(levels.amplitude+levels.bass*.12-this.energy)*.05;
    const reaction=this.reduced.matches?0:this.energy;
    this.lights.forEach((light,i)=>{light.intensity=10+(i===this.zone?reaction*3:0);});
    if(!this.reduced.matches){
      this.dust.rotation.y=Math.sin(now*.000015)*.012;
    }
    if(!this.lastScreen||now-this.lastScreen>120){this.drawScreens(this.reduced.matches?0:now*.001);this.lastScreen=now;}
    this.renderer.render(this.scene,this.camera);
  }
}
