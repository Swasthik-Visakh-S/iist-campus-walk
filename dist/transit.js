export const transitSpeed = (skating, boost) => skating ? (boost ? 28 : 12) : (boost ? 7.5 : 3.6);

function localPoint(gate, person) {
  const dx = person.x - gate.center[0], dz = person.z - gate.center[1];
  return {along: dx*gate.n[0] + dz*gate.n[1], across: dx*gate.right[0] + dz*gate.right[1]};
}
export function nearbyGate(gates, player) {
  return gates.find(gate => {
    const {along, across} = localPoint(gate, player);
    return Math.abs(along) <= 18 && Math.abs(across) <= gate.width/2 + 3;
  });
}

// A pass covers the outward crossing and the return through the same checkpoint.
export function createCheckpoint() {
  const passes = new Set();
  return {
    show(gate) { if (gate) passes.add(gate.name); },
    cleared(gate) { return passes.has(gate.name); },
    reset() { passes.clear(); },
    cross(gates, before, after) {
      for (const gate of gates) {
        const a = localPoint(gate,before), b = localPoint(gate,after);
        if ((a.along >= 0) === (b.along >= 0)) continue;
        const t = a.along/(a.along-b.along);
        if (Math.abs(a.across+(b.across-a.across)*t)>gate.width/2+.5) continue;
        const allowed = passes.has(gate.name);
        if (allowed && b.along>=0) passes.delete(gate.name);
        return {gate, allowed};
      }
      return null;
    }
  };
}
