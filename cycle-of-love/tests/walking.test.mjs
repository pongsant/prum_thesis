import test from 'node:test';
import assert from 'node:assert/strict';
import { canStand, move, zoneAt, findPath, START } from '../dist/js/world/layout.mjs';
test('both doorways connect the hallway to the correct rooms', () => {
  for (const [x, room] of [[-5, 0], [5, 1]]) {
    const p = {x, z:0}; move(p, 0, -7);
    assert.equal(zoneAt(p), room); assert.ok(p.z < -6.9);
    move(p, 0, 10); assert.equal(zoneAt(p), -1);
  }
});
test('walls, partition, plinths, and outer bounds stop the player', () => {
  const p = {x:0,z:0}; move(p, 0, -20); assert.ok(p.z > -3);
  const q = {x:-2,z:-7}; move(q, 8, 0); assert.ok(q.x < 0);
  assert.equal(canStand(-7.8,-9), false);
  move(q,-100,-100); assert.ok(q.x >= -9.7 && q.z >= -15.7);
});
test('guided routes reach both rooms and return without crossing walls', () => {
  for (const target of [{x:-5,z:-6},{x:5,z:-6}]) {
    let p = {...START};
    for (const destination of [target, START]) {
      const route = findPath(p,destination); assert.ok(route.length);
      for (const waypoint of route) {
        move(p,waypoint.x-p.x,waypoint.z-p.z);
        assert.ok(Math.hypot(p.x-waypoint.x,p.z-waypoint.z)<.03);
      }
      assert.ok(Math.hypot(p.x-destination.x,p.z-destination.z)<.35);
    }
  }
});
test('guided routes escape corners and navigate around memory plinths', () => {
  for(const start of [{x:-9,z:-14},{x:9,z:-14},{x:-7.8,z:-11},{x:7.8,z:-14}]) {
    const p={...start},route=findPath(p,{x:0,z:5});
    assert.ok(route.length);
    for(const waypoint of route){
      move(p,waypoint.x-p.x,waypoint.z-p.z);
      assert.ok(Math.hypot(p.x-waypoint.x,p.z-waypoint.z)<.03);
    }
    assert.equal(zoneAt(p),-1);
  }
});
