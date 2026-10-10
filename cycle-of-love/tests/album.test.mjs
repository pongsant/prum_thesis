import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {lyricAt,parseRoute,available,formatTime} from '../dist/js/album/core.mjs';
globalThis.window={};
vm.runInThisContext(fs.readFileSync(new URL('../dist/data/lyrics.js',import.meta.url),'utf8'));
const {tracks}=await import('../dist/data/album.mjs');
test('all five chapters route to reusable pages, including unfinished tracks',()=>{
  assert.deepEqual(tracks.map(t=>t.number),['01','02','03','04','05']);
  tracks.forEach((t,index)=>{assert.deepEqual(parseRoute('#track/'+t.id,tracks),{page:'track',index});assert.deepEqual(parseRoute('#movie/'+t.id,tracks),{page:'movie',index});});
  assert.equal(parseRoute('#track/invalid',tracks).page,'album');
});
test('only the two original recordings are available',()=>{
  assert.deepEqual(tracks.filter(available).map(t=>t.audio),['audio/intro.m4a','audio/self.m4a']);
  for(const t of tracks.filter(available))assert.ok(fs.statSync(new URL('../dist/'+t.audio,import.meta.url)).size>0);
  assert.equal(tracks[1].lyrics,window.SELF_LYRICS);
});
test('lyric boundaries, gaps, seeking backward, and end-exclusive cues',()=>{
  const self=tracks[1];assert.equal(lyricAt(self,0),null);assert.equal(lyricAt(self,13).text,'I don’t miss who I was');assert.equal(lyricAt(self,17).text,'But I think about him sometimes');assert.equal(lyricAt(self,80),null);assert.equal(lyricAt(self,13).text,'I don’t miss who I was');assert.equal(lyricAt(self,196),null);
  const draft={lyrics:[{time:12,text:'One'},{time:18,text:'Two'}]};assert.equal(lyricAt(draft,17).text,'One');assert.equal(lyricAt(draft,18,20).text,'Two');assert.equal(lyricAt(draft,20,20),null);
});
test('unknown durations never display NaN',()=>{assert.equal(formatTime(NaN),'—:—');assert.equal(formatTime(null),'—:—');assert.equal(formatTime(196),'3:16');});
