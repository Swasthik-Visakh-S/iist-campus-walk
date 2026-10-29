# IIST Campus Walk — Version 2

A browser walkthrough generated from the supplied OpenStreetMap campus export.

## Run on Ubuntu

Open a terminal in this extracted folder and run:

    python3 -m http.server 8000 --directory dist --bind 127.0.0.1

Then open http://localhost:8000 in Chrome or Firefox. No Blender, npm install, API key or internet connection is required. Stop the server with Ctrl+C. Do not open index.html directly: browsers restrict fetching local data that way.

## Controls

- Start at the roundabout: enter first-person mode.
- WASD / arrow keys: move. Shift: sprint.
- Click the scene: capture mouse. Escape: release. Drag to look if capture is unavailable.
- V: toggle aerial view. In aerial view, drag to orbit and scroll to zoom.
- Go to a place: jump near a mapped landmark. Reset: return to start.
- Touch: use arrow buttons to move and drag the scene to look.

WebGL 2 is needed for 3D. If unsupported, a 2D campus map appears automatically. Enable graphics acceleration or try another browser for 3D.

## Model accuracy

24 mapped building footprints. Shapes and positions come from map.osm. Version 2 adds red-brown walls and pale framing, differentiated heights, a taller glazed Library centre, rooftop panels, an open Student Activity Centre amphitheatre, terraced slopes, two ponds and dense broadleaf vegetation with garden palms.

The northern hostel zone is about 38 metres higher than the southern campus in this approximate model. This is an artistic estimate, NOT a measured elevation difference. Heights and relative slopes are configurable in dist/model-config.json. A pond uses the OSM outline; the second is estimated from the reference screenshots. Tree locations and architectural details are illustrative. Footprints have not been retraced from oblique screenshots because those images do not provide reliable ground coordinates. Buildings and pond shores have collisions. No building interiors are included.

Edit dist/heights.json to set building heights in metres by OSM way ID, e.g. {"618490369": 14} for the mapped Library. The default is an empty object. IDs and tags are in dist/campus.json. Refresh after editing.

## Files and validation

- dist/: complete application, data and bundled Three.js.
- map.osm: original supplied map.
- scripts/convert_osm.py: rebuild campus.json from map.osm.
- scripts/check-world.mjs: Node geometry and collision checks.

The scene-construction, finite-geometry, building-foundation, terrain, water-collision and safe-destination checks passed. The development browser did not support WebGL, so 3D rendering and first-person interaction could not be visually verified there. The 2D fallback was visually checked. The 3D appearance still needs checking in a WebGL-enabled browser. This is an initial prototype; exact local device performance remains to be tested.

## Attribution

Map data © OpenStreetMap contributors, https://www.openstreetmap.org/copyright — Open Database License (ODbL). campus.json is derived from the supplied OSM export and is available under ODbL. The exported area may omit unmapped features. Three.js r170 is bundled under MIT; see dist/vendor/THREE-LICENSE.txt. No Google imagery is included.

## Publish and contribute

See GITHUB_SETUP.md to enable public GitHub Pages hosting. See CONTRIBUTING.md to suggest changes through pull requests. Original app code uses MIT; OSM data remains under ODbL.
