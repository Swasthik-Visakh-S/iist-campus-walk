# Campus corrections — 30 October 2026

These updates use the owner's written corrections and marked SAC/OAT/MPH image. Numbers refer to the two-page correction map, not the illustrated reference plan's legend.

| Map number | Name | Model ground elevation (relative metres) |
| --- | --- | ---: |
| 1 | Library | 20 |
| 2 | Admin Block | 20 |
| 3 | Aerospace Block | 15 |
| 4, 5, 6 | Interdisciplinary, Science, Avionics blocks | 7 |
| 7 | Open Air Theatre | 22 |
| 8 | Student Activity Centre | 22 |
| New | Multipurpose Hall | 22 |
| 9, 11, 14, 19 | Infirmary, Phalguni, Ardra, Ashwini | 36 |
| 12 | Water tank on a four-pillar concrete tower | 36 |
| 13, 18 | Anuradha, Arundhathy | 39 |
| 15, 17, 21 | Chitra, Dhanishta, Dhruva | 30 |
| 16, 20, 22, 23 | Rohini, Revati, Vishaka, Tripthi canteen | 12 |

**Only the relative order and same-level groups were supplied; all metre values are implementation estimates.** Building body heights retain the previous estimates. The latest clarification resolves building 14 to Ardra and building 18 to Arundhathy. Tank 12 is on the same ground level as Phalguni (11); its height comes from four concrete pillars, not a hill. The support height (20 m), tank height (4 m) and pillar width (0.85 m) are estimates editable in `layout.waterTower`. Building 10 and tank 24 retain approximate context levels.

## Applied layout and landscape

- Rename the former MPH-labelled footprint to SAC (8), separate from OAT (7). Add MPH to the other side, approximating the blue outline; refine SAC using the magenta outline.
- Connect the three buildings with pedestrian paths; roof the marked connecting sections and add stairs to the upper hostel terrace. Keep the vehicle approach outside the complex.
- Raise the road from Tripthi toward Dhruva, Dhanishta and Chitra, with a densely planted steep bank above the lower hostel row.
- Add tall bamboo and grass inside the central hostel road enclosure.
- Lower Aerospace below the Library/Admin terrace and lower blocks 4–6 again; grade the connecting roads.
- Give the road between Aerospace and Tripthi a low valley followed by an ascent to the canteen.
- Lower both pond surfaces to −4 relative metres, with depressed banks. Their outlines remain the previous OSM/reference approximations.
- Add high perimeter walls along the mapped campus boundary, leaving road gates. Wall height (3.6 m) and gate widths are estimates.
- Use dark tar roads, grass verges, broadleaf/mango-like trees, an open soil-coloured ground, and a roundabout garden with a 22 m high-mast light. Species, exact locations and the mast height are illustrative.

## Exploration update

- Continuous asphalt ribbons follow bends and slopes, with edge lines, centre dashes and pale kerbs. Markings and kerbs leave junctions and pedestrian crossings open.
- A visible chibi girl walks and runs with articulated arms and legs. A following camera rotates with the mouse or touch drag and zooms with the scroll wheel.
- Space and the touch Jump button trigger one jump per press. Gravity and collision stay active while airborne; landing follows the terrain.

## Validation limits

Automated checks cover geometry, collisions, the requested relative elevation order, destination safety, ascending/dipping roads, connecting paths, walls, bamboo, covered walks, steps and open-ground tree exclusion. The browser available for development lacks WebGL: the 2D fallback can be checked, but the final 3D appearance and character motion must still be checked on a WebGL-capable device.
