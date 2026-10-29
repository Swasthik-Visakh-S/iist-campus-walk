"""Run from project root: python3 scripts/convert_osm.py"""
import json, math, xml.etree.ElementTree as ET
from pathlib import Path
root=Path(__file__).resolve().parent.parent
osm=ET.parse(root/'map.osm').getroot()
lat,lon=8.62665,77.03356
nodes={n.get('id'):[round((float(n.get('lon'))-lon)*111320*math.cos(math.radians(lat)),2),round(-(float(n.get('lat'))-lat)*111320,2)] for n in osm.findall('node')}
features=[dict(id=w.get('id'),tags={t.get('k'):t.get('v') for t in w.findall('tag')},points=[nodes[n.get('ref')] for n in w.findall('nd')]) for w in osm.findall('way')]
(root/'dist/campus.json').write_text(json.dumps(dict(origin=[lat,lon],features=features),separators=(',',':')))
