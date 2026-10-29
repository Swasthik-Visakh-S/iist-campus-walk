# IIST Campus Walk — Version 3

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

24 mapped building footprints, with reference-plan refinements. Version 3 traces the Library, Admin Block and several academic wings from the illustrated campus plan, registered to OSM landmark positions. The OAT has a larger stepped bowl, and the adjoining mapped building is identified and remodeled as the Multipurpose Hall. The main approach now passes on the right of the OAT when coming from the roundabout.

The Library facade faces its landscaped approach, with red-brown side panels, white framing, a central glazed spine, a canopy and raised roof wings. The larger fountain has a 5.5 metre basin radius, a stone surround, arcing jets and a surrounding lawn with paths, shrubs and palms. Name tags are roughly half the former width and are hidden by intervening geometry.

The illustrated plan is schematic, not a survey. Corrections are estimates anchored to existing OSM positions; outlines are reduced where needed to leave the mapped roads clear. The Science Block keeps its OSM outline because the plan trace conflicts with its perimeter road. Heights, elevations and detailed architecture are still estimates. No interiors are included.

`dist/model-config.json` contains the plan traces, building names, road correction and garden dimensions with source notes. `dist/layout.js` applies the same layout to the 3D model and 2D fallback; the original `campus.json` is preserved. `dist/library.js` contains the Library facade and garden model. No reference photos or Google map tiles are redistributed.

Edit dist/heights.json to set building heights in metres by OSM way ID, e.g. {"618490369": 14} for the mapped Library. The default is an empty object. IDs and tags are in dist/campus.json. Refresh after editing.

## Files and validation

- dist/: complete application, data and bundled Three.js.
- map.osm: original supplied map.
- scripts/convert_osm.py: rebuild campus.json from map.osm.
- scripts/check-world.mjs: Node geometry and collision checks.

The scene-construction, finite-geometry, foundation, road clearance, terrain, water-collision and safe-destination checks passed. The development browser did not support WebGL, so 3D rendering and first-person interaction could not be visually verified there. The 2D fallback and destination selection were visually checked. The 3D appearance still needs checking in a WebGL-enabled browser. This is an initial prototype; exact local device performance remains to be tested.

## Attribution

Map data © OpenStreetMap contributors, https://www.openstreetmap.org/copyright — Open Database License (ODbL). campus.json is derived from the supplied OSM export and is available under ODbL. The exported area may omit unmapped features. Three.js r170 is bundled under MIT; see dist/vendor/THREE-LICENSE.txt. No Google imagery is included.

## Publish and contribute

See GITHUB_SETUP.md to enable public GitHub Pages hosting. See CONTRIBUTING.md to suggest changes through pull requests. Original app code uses MIT; OSM data remains under ODbL.
