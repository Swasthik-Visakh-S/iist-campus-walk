// Regenerate the approximate entrance locations after changing footprints/roads.
import fs from 'node:fs';
import {applyReferenceLayout} from '../dist/layout.js';
import {center} from '../dist/geometry.js';
import {makeTerrain} from '../dist/terrain.js';
import {planEntrances} from '../dist/entrances.js';
const configPath=new URL('../dist/model-config.json',import.meta.url),config=JSON.parse(fs.readFileSync(configPath));
const data=applyReferenceLayout(JSON.parse(fs.readFileSync(new URL('../dist/campus.json',import.meta.url))),config),buildings=data.features.filter(f=>f.tags.building).map(f=>({...f,center:center(f.points)})),ponds=[...data.features.filter(f=>f.tags.natural==='water'),...config.extraPonds];
config.layout.entrances=planEntrances(data,buildings,ponds,makeTerrain(data,config,buildings,ponds),config);
fs.writeFileSync(configPath,JSON.stringify(config,null,2)+'\n');console.log(`Prepared ${config.layout.entrances.length} building entrances.`);
