# IIST Campus Walk — Version 7

A browser walkthrough generated from the supplied OpenStreetMap campus export.

**Public website:** https://swasthik-visakh-s.github.io/iist-campus-walk/

The shorter account address (`https://swasthik-visakh-s.github.io/`) is a separate GitHub Pages site and may show 404. Always share the full link above. Pages publishes from `main / (root)` and opens the app in `dist/`. After a new merge, refresh with Ctrl+Shift+R if your browser still shows an older copy.

## Run on Ubuntu

Open a terminal in this extracted folder and run:

    python3 -m http.server 8000 --directory dist --bind 127.0.0.1

Then open http://localhost:8000 in Chrome or Firefox. No Blender, npm install, API key or internet connection is required. Stop the server with Ctrl+C. Do not open index.html directly: browsers restrict fetching local data that way.

## Controls

- Free roam: guide a chibi girl from the roundabout with a following camera.
- WASD / arrow keys: move. Shift: run. Space: jump (press again after landing).
- Click the scene: capture mouse. Escape: pause and release. Move the mouse or drag to rotate the camera; scroll to change its distance.
- V: toggle aerial view. In aerial view, drag to orbit and scroll to zoom.
- Go to a place: jump near a mapped landmark. Reset: return to start.
- E: discover the current trail stop within 9 metres while standing on its terrace. M: toggle the map.
- Start discovery trail: an optional five-stop tour; use the pause menu to restart.
- Touch: drag the thumb pad to move; use Run and Jump, and drag the scene to rotate the camera. Tap Map for destinations.

WebGL 2 is needed for 3D. If unsupported, a 2D campus map appears automatically. Enable graphics acceleration or try another browser for 3D.

## Version 7: a small campus adventure

Inspired by Benglooru's free-roam exploration, simple objectives and local saves, this adds a lightweight optional trail through Roundabout → Library → SAC → OAT → Tripthi canteen. A gold marker and minimap dot show the next existing destination; the compass arrow rotates with the camera. Distances are direct, not road-route distances. Follow the campus paths, then press E or tap Discover to collect a place and read a short campus note. Free roam stays available, and Escape / Pause opens a pause menu.

Discovery progress is stored only in this browser using `iist-discovery-v1`. Reloading preserves collected places; it does not restore player position. Private mode, cleared site data or another browser may reset progress. Storage failures fall back to session-only progress. Restart discovery trail clears only this trail's stamps, retaining graphics preferences.

The map, terrain, road network, building footprints, entrances, vegetation and character are unchanged from Version 6. The new world marker uses two small unlit meshes with no textures or shadows; HUD updates run at 5 Hz. No assets or source code from Benglooru are included. No account, API, build service, server routing or new library is needed; GitHub Pages stays on **main / (root)**. Root and changed entry assets use the `v=7` cache key.

## Graphics and performance

Graphics **Auto** selects Light on phones and modest devices, or Balanced on larger desktops; it drops to Light if frames are consistently slow. Light caps pixel density at 1×, disables shadows and reduces decorative trees. Balanced and High retain cached static shadows. You can select a setting manually.

Tree geometry is lighter and split into cullable patches. Static meshes are batched, the minimap background is cached, and terrain queries use a spatial index. Roads, verges and foot heights share the rendered surface to avoid floating feet and overlapping ground. Compared with Version 5, scene geometry and draw calls are substantially reduced; this is a geometry measurement, not a measured FPS guarantee. Rendering pauses when the tab is hidden or the graphics context is lost.

## Model accuracy

Version 6 includes the November 2026 corrections. Photo-inspired red entrance pillars, cream lintels, covered porches and doors are added to 22 occupied buildings, with vegetation-free paths connecting to nearby roads. The front and back gates have open lanes, guard booths and four illustrative CISF officers. Entrances and gate details are approximations, not surveyed replicas. The invented road loop behind MPH is removed; covered paths link SAC and MPH through aisles in OAT.

Earlier corrections supplied on 30 October 2026 are retained. It retains the 24 mapped structures, corrects building 8 to the Student Activity Centre, treats building 7 as the separate Open Air Theatre, and adds the Multipurpose Hall from the marked reference outline. Covered walks connect the complex; steps lead to the upper hostel area.

The low Rohini–Revati–Vishaka–Tripthi terrace is below the Dhruva–Dhanishta–Chitra row. Central hostels share a higher terrace, with buildings 13 and 18 slightly raised while tank 12 shares Phalguni’s ground level and sits atop a tall concrete tower with four pillars. The Library, fountain, Admin Block and roundabout share a level; Aerospace is lower, and the other academic blocks are lower again. The canteen approach dips into a valley before rising. Ponds sit below all building terraces.

Continuous tar-coloured roads have clear edge lines, centre dashes, pale kerbs, grass verges and broadleaf shade trees. Kerbs leave gaps at junctions and pedestrian crossings. The central hostel space has tall bamboo and grass. A wooded bank separates the hostel levels, a soil-coloured open ground sits between the Library approach and hostels, and the roundabout has a circular garden and high-mast light. Boundary walls follow the supplied campus perimeter, with gaps at mapped vehicle approaches.

The relative levels and names come from the user. Numeric elevations, wall height, species placement, path widths and image-registered outlines remain **estimates, not survey measurements**. The latest clarification identifies **Ardra as 14** and **Arundhathy as 18**. The tank tower uses an illustrative 20 m support height and 4 m tank; these dimensions can be changed in `layout.waterTower`. No interiors are included.

The student wears a collared blue shirt, navy skirt, socks, shoes, backpack and ID lanyard. The original chibi model in `dist/character.js` has an animated walk/run, pigtails and a small backpack. `dist/movement.js` handles jumping, landing, collision and the following camera. `dist/roads.js` builds continuous road surfaces and markings. `dist/terrain-mesh.js` refines curved ground beside roads and fits asphalt and paint to the same triangles, preventing terrain from hiding the road.

`dist/model-config.json` holds the numbered building mapping, names, relative elevation groups, road profiles, connections and landscape settings. `dist/layout.js` applies corrections to both the 3D model and 2D fallback. `dist/terrain.js` shares ground elevations with roads, foundations and walking; `dist/campus-details.js` builds walls, roofs, steps, bamboo and the roundabout. Original `campus.json` and `map.osm` are preserved. No reference photos are redistributed. See [the correction record](CAMPUS_CORRECTIONS.md) for the editable assumptions.

Edit dist/heights.json to set building heights in metres by OSM way ID, e.g. {"618490369": 14} for the mapped Library. The default is an empty object. IDs and tags are in dist/campus.json. Refresh after editing.

## Files and validation

- dist/: complete application, data and bundled Three.js.
- map.osm: original supplied map.
- scripts/convert_osm.py: rebuild campus.json from map.osm.
- scripts/check-world.mjs: Node geometry and collision checks.
- scripts/check-corrections.mjs: supplied name/level relationships, path access, slopes and campus features.
- scripts/check-character.mjs: jump/landing at several frame rates, collision, camera clearance, slopes and character animation.
- scripts/check-v6.mjs: entrance access, vegetation clearance, connected paths, gates and geometry budgets.
- scripts/check-discovery.mjs: existing trail destinations, proximity/elevation, completion, local save and storage failure checks.
- scripts/check-controls.mjs: app bootstrap and control state using DOM/renderer test doubles.
- scripts/prepare-entrances.mjs: regenerate approximate entrance placements after editing footprints or roads.

Run `node scripts/check-world.mjs`, `node scripts/check-corrections.mjs`, `node scripts/check-character.mjs`, `node scripts/check-v6.mjs`, `node scripts/check-discovery.mjs`, and `node --experimental-vm-modules scripts/check-controls.mjs`.

Automated checks cover finite geometry, foundations, road clearance, relative elevations, safe destinations, entrances, planting exclusions, gates, jumping and control state. The local preview was unavailable in the development browser; the public reference also reported unavailable 3D graphics in this browser. Version 7 gameplay checks use DOM/renderer test doubles. Final 3D appearance, touch gestures on hardware and actual frame rates still need visual/device verification. No claim of complete visual verification is made.

## Attribution

Map data © OpenStreetMap contributors, https://www.openstreetmap.org/copyright — Open Database License (ODbL). campus.json is derived from the supplied OSM export and is available under ODbL. The exported area may omit unmapped features. Three.js r170 is bundled under MIT; see dist/vendor/THREE-LICENSE.txt. No Google imagery is included.

## Publish and contribute

See GITHUB_SETUP.md to enable public GitHub Pages hosting. See CONTRIBUTING.md to suggest changes through pull requests. Original app code uses MIT; OSM data remains under ODbL.
