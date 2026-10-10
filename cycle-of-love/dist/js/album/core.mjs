export const formatTime = value => {
  if(!Number.isFinite(value))return '—:—';
  const n=Math.max(0,Math.floor(value));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;
};
export function lyricAt(track,time,duration=Infinity) {
  return track.lyrics.find((line,i)=>time>=line.time && time<(line.end??track.lyrics[i+1]?.time??duration))||null;
}
export const available = track => track.status==='available' && !!track.audio;
export function parseRoute(hash,tracks) {
  const [page,id]=hash.replace(/^#\/?/,'').split('/');
  const index=tracks.findIndex(t=>t.id===id);
  if(page==='track'&&index>=0)return {page,index};
  if(page==='movie')return {page,index:Math.max(0,index)};
  return {page:page==='about'?'about':'album',index:0};
}
