import * as THREE from '../../vendor/three.module.js';

/* Gen X Soft Club: edit this palette without touching songs or navigation. */
export const ART = {
  wall: '#c5cbc5', ceiling: '#d2d4cb', floor: '#a3aaa6',
  metal: '#aab3af', plastic: '#c4c2b4', charcoal: '#444e4c',
  glass: '#b6cbc4', light: '#f2f4df', fog: '#ccd6cf',
  rooms: [
    { tint: '#d4cdbb', screen: '#b7bfae', label: '#4d5753' },
    { tint: '#bdcfd0', screen: '#a8bcc0', label: '#465854' }
  ]
};

export function surfaceTexture(kind) {
  const canvas = document.createElement('canvas'); canvas.width=512; canvas.height=512;
  const c=canvas.getContext('2d'); c.fillStyle=kind==='metal'?'#d4d6d1':'#d7d9d3';c.fillRect(0,0,512,512);
  // Fixed grain keeps the architectural finish still, like a scanned surface.
  let seed=41;
  const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<22000;i++){
    const light=Math.floor(120+random()*110);
    c.fillStyle=`rgba(${light},${light},${light},${kind==='metal'?.08:.11})`;
    c.fillRect(random()*512,random()*512,kind==='metal'?16:1,1);
  }
  if(kind==='floor'){
    c.strokeStyle='#adb4ad';c.lineWidth=1;c.strokeRect(.5,.5,511,511);
    c.strokeStyle='#e6e7df';c.strokeRect(2,2,508,508);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  return texture;
}

export function softPoolTexture() {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const c=canvas.getContext('2d'),g=c.createRadialGradient(64,64,4,64,64,64);
  g.addColorStop(0,'rgba(34,48,44,.27)');g.addColorStop(.45,'rgba(34,48,44,.12)');g.addColorStop(1,'rgba(34,48,44,0)');
  c.fillStyle=g;c.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);
}

export function memoryStill(warm=false) {
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=240;
  const c=canvas.getContext('2d');c.fillStyle=warm?'#bfc3b5':'#9eafb1';c.fillRect(0,0,320,240);
  c.filter='blur(7px)';
  c.fillStyle='#e4e6d9';c.fillRect(24,-10,98,195);c.fillRect(135,-10,115,195);
  c.fillStyle=warm?'#7d8b81':'#71868a';c.fillRect(-10,181,350,70);
  c.fillStyle='#bac7bd';c.fillRect(73,116,175,8);
  c.fillStyle='#626f68';c.fillRect(104,142,77,6);c.fillRect(112,144,4,45);c.fillRect(173,144,4,45);
  c.filter='none';c.fillStyle='#e4e6d5';c.globalAlpha=.2;c.fillRect(0,0,320,240);c.globalAlpha=1;
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
