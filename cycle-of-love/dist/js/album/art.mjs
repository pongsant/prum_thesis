export function discCanvas(track, size=768) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const c=canvas.getContext('2d'),r=size/2;
  c.translate(r,r);c.beginPath();c.arc(0,0,r-3,0,Math.PI*2);c.clip();
  const base=c.createLinearGradient(-r,-r,r,r);base.addColorStop(0,'#f1f0e9');base.addColorStop(.27,'#b7c0bf');base.addColorStop(.46,'#f7f5ed');base.addColorStop(.65,'#a9b0b1');base.addColorStop(1,'#e4e6df');c.fillStyle=base;c.fillRect(-r,-r,size,size);
  const colors=['#c4cbd2','#d4c7d2','#d9d1bd','#c8d6c9','#c4d3d9','#e2dcd1'];
  for(let i=0;i<360;i++){
    c.beginPath();c.moveTo(0,0);c.arc(0,0,r,i*Math.PI/180,(i+1.1)*Math.PI/180);c.closePath();c.globalAlpha=.25+Math.pow(Math.cos(i*.035),8)*.15;c.fillStyle=colors[Math.floor(i/60)];c.fill();
  }
  c.globalAlpha=1;c.strokeStyle='rgba(61,76,78,.07)';c.lineWidth=.6;
  for(let radius=r*.3;radius<r-5;radius+=2.2){c.beginPath();c.arc(0,0,radius,0,Math.PI*2);c.stroke();}
  c.strokeStyle='#a7afae';c.lineWidth=2;c.beginPath();c.arc(0,0,r*.24,0,Math.PI*2);c.stroke();
  c.strokeStyle='#f1f0e9';c.lineWidth=r*.07;c.beginPath();c.arc(0,0,r*.18,0,Math.PI*2);c.stroke();
  c.save();c.rotate(-.055);c.fillStyle='#303331';c.textAlign='center';c.textBaseline='middle';
  c.font=`${size*.079}px "Bradley Hand", "Segoe Print", cursive`;c.fillText(track.discLabel,0,-r*.46,size*.75);
  c.font=`${size*.067}px "Bradley Hand", "Segoe Print", cursive`;c.fillText('#'+Number(track.number),r*.24,r*.39);c.restore();
  c.fillStyle='#656d6a';c.font=`${size*.012}px Arial`;c.textAlign='center';c.fillText('ORIGINAL RECORDING  ·  CD-R  ·  STEREO',0,r*.78);
  c.globalCompositeOperation='destination-out';c.beginPath();c.arc(0,0,r*.135,0,Math.PI*2);c.fill();
  return canvas;
}
export function coverCanvas(project,track=null) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=768;
  const c=canvas.getContext('2d');c.fillStyle='#deded5';c.fillRect(0,0,768,768);
  const g=c.createLinearGradient(0,180,768,700);g.addColorStop(0,'#d8ddd5');g.addColorStop(.6,track?.visualTheme.accent||'#c4cbc4');g.addColorStop(1,'#eeebe0');
  c.fillStyle=g;c.fillRect(27,27,714,714);
  c.fillStyle='#333b36';c.font='24px Arial';c.fillText(project.artist.toUpperCase(),55,83);
  c.font='76px Arial';const lines=(track?track.title:project.coverTitle).split('\n');lines.forEach((line,i)=>c.fillText(line,50,205+i*80,660));
  c.save();c.filter='blur(22px)';c.fillStyle='#87978b';c.globalAlpha=.35;c.fillRect(445,390,75,230);c.fillStyle='#faf9ee';c.fillRect(245,380,80,255);c.restore();
  c.strokeStyle='#828d8355';c.beginPath();c.moveTo(55,636);c.lineTo(713,636);c.stroke();
  c.fillStyle='#465047';c.font='16px Arial';c.fillText(track?`TRACK ${track.number} / ORIGINAL RECORDING`:'FIVE CHAPTERS, ONE JOURNEY.',55,677);c.font='13px Arial';c.fillText('LOVE / MEMORY / CHANGE',55,710);
  let seed=71;for(let i=0;i<11000;i++){seed=seed*16807%2147483647;const x=seed%768;seed=seed*16807%2147483647;const y=seed%768;c.fillStyle=i%2?'#ffffff0a':'#1b241b09';c.fillRect(x,y,1,1);}
  return canvas;
}
