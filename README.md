# IIST Campus Walk — Version 4

A browser walkthrough generated from the supplied OpenStreetMap campus export.

**Public website:** https://swasthik-visakh-s.github.io/iist-campus-walk/

The shorter account address (`https://swasthik-visakh-s.github.io/`) is a separate GitHub Pages site and may show 404. Always share the full link above. Pages publishes from `main / (root)` and opens the app in `dist/`. After a new merge, refresh with Ctrl+Shift+R if your browser still shows an older copy.

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

Version 4 applies campus corrections supplied on 30 October 2026. It retains the 24 mapped structures, corrects building 8 to the Student Activity Centre, treats building 7 as the separate Open Air Theatre, and adds the Multipurpose Hall from the marked reference outline. Covered walks connect the complex; steps lead to the upper hostel area.

The low Rohini–Revati–Vishaka–Tripthi terrace is below the Dhruva–Dhanishta–Chitra row. Central hostels share a higher terrace, with buildings 13 and 18 slightly raised and water tank 12 on a summit. The Library, fountain, Admin Block and roundabout share a level; Aerospace is lower, and the other academic blocks are lower again. The canteen approach dips into a valley before rising. Ponds sit below all building terraces.

Tar-coloured roads have grass verges and broadleaf shade trees. The central hostel space has tall bamboo and grass. A wooded bank separates the hostel levels, a soil-coloured open ground sits between the Library approach and hostels, and the roundabout has a circular garden and high-mast light. Boundary walls follow the supplied campus perimeter, with gaps at mapped vehicle approaches.

The relative levels and names come from the user. Numeric elevations, wall height, species placement, path widths and image-registered outlines remain **estimates, not survey measurements**. Building 14 was identified as both Ardra and Arundathi; it remains **Hostel 14** until clarified. Building 18's name remains unconfirmed. No interiors are included.

`dist/model-config.json` holds the numbered building mapping, names, relative elevation groups, road profiles, connections and landscape settings. `dist/layout.js` applies corrections to both the 3D model and 2D fallback. `dist/terrain.js` shares ground elevations with roads, foundations and walking; `dist/campus-details.js` builds walls, roofs, steps, bamboo and the roundabout. Original `campus.json` and `map.osm` are preserved. No reference photos are redistributed. See [the correction record](CAMPUS_CORRECTIONS.md) for the editable assumptions.

Edit dist/heights.json to set building heights in metres by OSM way ID, e.g. {"618490369": 14} for the mapped Library. The default is an empty object. IDs and tags are in dist/campus.json. Refresh after editing.

## Files and validation

- dist/: complete application, data and bundled Three.js.
- map.osm: original supplied map.
- scripts/convert_osm.py: rebuild campus.json from map.osm.
- scripts/check-world.mjs: Node geometry and collision checks.
- scripts/check-corrections.mjs: supplied name/level relationships, path access, slopes and new features.

Run both checks with `node scripts/check-world.mjs` and `node scripts/check-corrections.mjs`.

Scene-construction, finite geometry, foundations, road clearance, supplied elevation relationships, pond collisions and safe destinations are checked automatically. The development browser did not support WebGL, so 3D rendering and first-person interaction could not be visually verified there. The 2D fallback and destination selection were visually checked. The 3D appearance still needs checking in a WebGL-enabled browser. This is an initial prototype; exact local device performance remains to be tested.

## Attribution

Map data © OpenStreetMap contributors, https://www.openstreetmap.org/copyright — Open Database License (ODbL). campus.json is derived from the supplied OSM export and is available under ODbL. The exported area may omit unmapped features. Three.js r170 is bundled under MIT; see dist/vendor/THREE-LICENSE.txt. No Google imagery is included.

## Publish and contribute

See GITHUB_SETUP.md to enable public GitHub Pages hosting. See CONTRIBUTING.md to suggest changes through pull requests. Original app code uses MIT; OSM data remains under ODbL.
