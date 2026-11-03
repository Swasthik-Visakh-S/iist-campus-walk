// Check the public GitHub Pages deployment, not just the repository checkout.
const base = process.argv[2];
if (!base || !/^https:\/\/[a-z0-9-]+\.github\.io\/iist-campus-walk\/$/.test(base)) {
  throw new Error('Expected the project Pages URL ending in /iist-campus-walk/');
}
const paths = [
  ['', 'url=./dist/?v=6'],
  ['dist/', 'VERSION 6'],
  ['dist/app.js', 'chooseQuality'],
  ['dist/world.js', 'addEntrances'],
  ['dist/model-config.json', '"version": 6'],
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
      const response = await fetch(new URL(path+'?v=6', base), {signal: AbortSignal.timeout(12000), cache: 'no-store'});
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
console.log(`Published campus verified at ${base}`);
