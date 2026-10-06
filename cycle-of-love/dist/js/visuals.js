/* Abstract light and orbital traces, not a bar visualizer.
   Replace this class with your WebGL renderer if desired. */
class Atmosphere {
  constructor(canvas, player) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.player=player;
    this.color=[143,116,78]; this.target=[143,116,78]; this.pointer={x:0,y:0}; this.energy=0;
    this.reduced=matchMedia('(prefers-reduced-motion: reduce)'); this.time=0; this.last=0;
    this.particles=Array.from({length:65},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.1+.3,a:Math.random()*.35+.08}));
    this.resize=()=>{this.w=innerWidth;this.h=innerHeight;const d=Math.min(devicePixelRatio||1,1.5);canvas.width=this.w*d;canvas.height=this.h*d;this.ctx.setTransform(d,0,0,d,0,0);};
    addEventListener('resize',this.resize);this.resize();
    addEventListener('pointermove',e=>{this.pointer.x=(e.clientX/this.w-.5)*18;this.pointer.y=(e.clientY/this.h-.5)*12;},{passive:true});
    requestAnimationFrame(t=>this.draw(t));
  }
  setSong(song) {this.target=song.glow;}
  draw(now) {
    requestAnimationFrame(t=>this.draw(t));
    if(document.hidden || now-this.last<33) return;
    this.last=now; if(!this.reduced.matches)this.time+=.008;
    const c=this.ctx,w=this.w,h=this.h,t=this.time;
    const levels=this.player.levels();this.energy+=(levels.amplitude*.9+levels.bass*.16-this.energy)*.045;
    this.color=this.color.map((v,i)=>v+(this.target[i]-v)*.024);
    const rgb=this.color.map(Math.round).join(',');
    c.fillStyle='#090b0e';c.fillRect(0,0,w,h);
    const px=this.reduced.matches?0:this.pointer.x,py=this.reduced.matches?0:this.pointer.y;
    const cx=w*.52+px,cy=h*.46+py,r=Math.min(w*.4,h*.46);
    // Soft halo: slowly opens like an incomplete spiral. No literal imagery.
    c.save();c.translate(cx,cy);c.rotate(-.32+Math.sin(t*.2)*.018);c.scale(1.48,.82);
    const bloom=c.createRadialGradient(0,0,r*.15,0,0,r*1.55);
    bloom.addColorStop(0,`rgba(${rgb},.02)`);bloom.addColorStop(.36,`rgba(${rgb},${.075+this.energy*.045})`);bloom.addColorStop(.59,`rgba(${rgb},.017)`);bloom.addColorStop(1,`rgba(${rgb},0)`);
    c.fillStyle=bloom;c.fillRect(-r*2,-r*2,r*4,r*4);
    c.globalCompositeOperation='screen';
    for(let j=0;j<23;j++){
      c.beginPath();
      for(let i=0;i<=200;i++){
        const a=i/200*Math.PI*1.84+.32;
        const radius=r*(.68+j*.009+(i/200)*.12)*(1+this.energy*.035);
        const x=Math.cos(a)*radius,y=Math.sin(a)*radius;
        if(i===0)c.moveTo(x,y);else c.lineTo(x,y);
      }
      c.strokeStyle=`rgba(${rgb},${.014+Math.sin(j/23*Math.PI)*.025})`;c.lineWidth=1.1;c.stroke();
    }
    c.restore();
    c.save();c.globalCompositeOperation='screen';
    for(const p of this.particles){const x=(p.x*w+Math.sin(t*.24+p.y*20)*9+px*.3),y=(p.y*h-t*3)%h;c.beginPath();c.arc(x,y<0?y+h:y,p.r,0,Math.PI*2);c.fillStyle=`rgba(209,211,209,${p.a*(.35+this.energy)})`;c.fill();}
    c.restore();
  }
}
window.Atmosphere=Atmosphere;
