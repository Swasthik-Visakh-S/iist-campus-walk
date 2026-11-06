// Check the public GitHub Pages deployment, not just the repository checkout.
const base = process.argv[2];
if (!base || !/^https:\/\/[a-z0-9-]+\.github\.io\/iist-campus-walk\/$/.test(base)) {
  throw new Error('Expected the project Pages URL ending in /iist-campus-walk/');
}
const paths = [
  ['', 'url=./dist/?v=10'],
  ['dist/', 'VERSION 10'],
  ['dist/app.js', 'toggleBoard'],
  ['dist/pitch.js', 'entranceU'],
  ['dist/basketball.js', 'Basketball hoops'],
  ['dist/movement.js', 'Math.max(0,pitch)'],
  ['dist/model-config.json', 'hostel-upper-landing'],
  ['dist/model-config.json', 'Medical Services'],
  ['dist/planting.js', 'addBanyan'],
  ['dist/residents.js', 'createResidents'],
  ['dist/audio.js', 'playDeathCue'],
  ['dist/transit.js', 'createCheckpoint'],
  ['dist/site-details.js', 'perimeterRails'],
  ['dist/world.js', 'addEntrances'],
  ['dist/model-config.json', '"version": 10'],
  ['dist/entrances.js', 'planEntrances'],
  ['dist/gates.js', 'addGates'],
  ['dist/quality.js', 'applyQuality'],
  ['dist/render-utils.js', 'mergeStaticMeshes'],
  ['dist/character.js', 'Chibi student'],
  ['dist/style.css', '#joystick'],
  ['dist/vendor/three.module.js', 'three.js'],
];
async function check(path, marker) {
  let error;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const response = await fetch(new URL(path+'?v=10', base), {signal: AbortSignal.timeout(12000), cache: 'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = await response.text();
      if (!body.includes(marker)) throw new Error(`expected content missing`);
      console.log(`${path || 'index.html'}: ${response.status}`);
      return;
    } catch (cause) {
      error = cause;
      if (attempt < 10) await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  throw new Error(`${new URL(path, base)}: ${error.message}`);
}
await Promise.all(paths.map(([path, marker]) => check(path, marker)));
const audio=await fetch(new URL('dist/audio/plucky-comedy.mp3?v=10',base),{headers:{Range:'bytes=0-2'}});
if(!audio.ok || Buffer.from(await audio.arrayBuffer()).subarray(0,3).toString()!=='ID3')throw Error('Published MP3 unavailable');
console.log(`Published campus verified at ${base}`);
