// Exercise the app bootstrap and UI state with a DOM/renderer test double.
// This verifies control logic, not actual WebGL pixels or touch hardware.
import vm from 'node:vm';import fs from 'node:fs/promises';import assert from 'node:assert/strict';import * as Three from '../dist/vendor/three.module.js';
const handlers=new Map(),frames=[],nodes=new Map();
const context2d=new Proxy({},{get:()=>()=>{}});
class Node{
 constructor(id=''){this.id=id;this.hidden=false;this.open=false;this.style={};this.value='';this.attrs={};this.handlers={};this.width=260;this.height=310;this.classList={values:new Set(),add:cls=>this.classList.values.add(cls),remove:cls=>this.classList.values.delete(cls),contains:cls=>this.classList.values.has(cls),toggle:(cls,value)=>{const next=value??!this.classList.values.has(cls);next?this.classList.values.add(cls):this.classList.values.delete(cls);return next;}};}
 getContext(){return context2d;}addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}dispatch(type,event={}){for(const fn of this.handlers[type]||[])fn(event);}setAttribute(k,v){this.attrs[k]=v;}append(){}remove(){this.removed=true;}blur(){}showModal(){this.open=true;}close(){this.open=false;}setPointerCapture(){}getBoundingClientRect(){return {left:20,top:400,width:118,height:118};}
}
const html=await fs.readFile(new URL('../dist/index.html',import.meta.url),'utf8');for(const [,id] of html.matchAll(/id="([^"]+)"/g))nodes.set(id,new Node(id));
const doc=new Node();doc.getElementById=id=>{assert(nodes.has(id),'Missing UI element '+id);return nodes.get(id)};doc.body=new Node();doc.createElement=()=>new Node();doc.activeElement=new Node();doc.hidden=false;doc.exitPointerLock=()=>{};
let renderCount=0,lastZ=0;class Renderer{constructor(){this.shadowMap={};}setSize(){}setPixelRatio(n){this.ratio=n;}render(scene,camera){assert(camera.position.toArray().every(Number.isFinite));renderCount++;lastZ=scene.getObjectByName('Chibi student').position.z;}}
const fakeWorld={buildings:[],roads:[],places:[{name:'Roundabout',p:[0,0],label:[0,0],height:0}],ponds:[],boundary:[[-100,-100],[100,-100],[100,100],[-100,100],[-100,-100]],spawn:[0,0],walkHeight:()=>0,blocked:()=>false,cameraBlocked:()=>false,gates:[{name:'Front gate',center:[0,1],n:[0,-1],right:[-1,0],width:11,muzzles:[new Three.Vector3(-3,1,1)],sign:{p:[0,1],y:4,angle:0},guardSign:{p:[3,1],y:2,angle:0}}],foliage:[],garden:null};
const scope=vm.createContext({console,Math,Set,Map,Promise,Error,innerWidth:390,innerHeight:844,devicePixelRatio:3,navigator:{hardwareConcurrency:4},matchMedia:()=>({matches:true}),document:doc,localStorage:{getItem:()=>null,setItem(){}},location:{reload(){}},requestAnimationFrame:fn=>frames.push(fn),fetch:async name=>({ok:true,json:async()=>JSON.parse(await fs.readFile(new URL('../dist/'+name.split('?')[0],import.meta.url),'utf8'))})});
scope.window={addEventListener:(type,fn)=>{(handlers.get(type)||handlers.set(type,[]).get(type)).push(fn)}};
const modules=new Map();
const moduleFrom=(key,exports)=>{const m=new vm.SyntheticModule(Object.keys(exports),function(){for(const [k,v]of Object.entries(exports))this.setExport(k,v)},{context:scope,identifier:key});modules.set(key,m);return m;};
const threeModule=moduleFrom('three',{...Three,WebGLRenderer:Renderer});
const worldModule=moduleFrom('world',{buildWorld:()=>fakeWorld,inside:()=>true});
async function load(url){if(modules.has(url))return modules.get(url);const mod=new vm.SourceTextModule(await fs.readFile(new URL(url),'utf8'),{context:scope,identifier:url});modules.set(url,mod);await mod.link(async(spec,parent)=>{if(spec.includes('vendor/three'))return threeModule;if(spec.includes('world.js'))return worldModule;return load(new URL(spec,parent.identifier).href)});return mod;}
const app=await load(new URL('../dist/app.js',import.meta.url).href);await app.evaluate();
const tick=t=>{const f=frames.shift();assert(f);f(t);};tick(16);assert(nodes.get('loading').removed);assert(renderCount===1,'First frame renders without a temporal-dead-zone error');
nodes.get('walk').onclick();tick(32);assert(doc.body.classList.contains('walk'));
nodes.get('mapToggle').onclick();assert(doc.body.classList.contains('map-open'));assert(nodes.get('mapToggle').attrs['aria-expanded']==='true');
const joy=nodes.get('joystick');joy.onpointerdown({preventDefault(){},pointerId:7,clientX:79,clientY:410});tick(48);joy.onpointercancel();assert(nodes.get('stick').style.transform==='translate(-50%,-50%)');
nodes.get('runButton').onclick();assert(nodes.get('runButton').attrs['aria-pressed']==='true');for(const fn of handlers.get('blur'))fn();assert(nodes.get('runButton').attrs['aria-pressed']==='false','Blur releases running');
nodes.get('jumpButton').onclick({detail:0});tick(64);for(let i=1;i<130;i++)tick(64+i*16.667);
nodes.get('about').onclick();assert(nodes.get('info').open);nodes.get('closeInfo').onclick();assert(!nodes.get('info').open);
nodes.get('quality').onchange({target:{value:'high'}});nodes.get('quality').onchange({target:{value:'low'}});
nodes.get('world').dispatch('webglcontextlost',{preventDefault(){}});assert(!nodes.get('renderMessage').hidden);nodes.get('world').dispatch('webglcontextrestored');assert(nodes.get('renderMessage').hidden);
nodes.get('destination').onchange({target:{value:'0',blur(){}}});assert(!doc.body.classList.contains('map-open'),'Destination closes the mobile map');tick(2500);
let now=2500;
const advance=n=>{for(let i=0;i<n;i++)tick(now+=1000/60);};
const key=(code,down)=>{for(const fn of handlers.get(down?'keydown':'keyup'))fn({code,target:{tagName:'BODY'},preventDefault(){}});};
nodes.get('boardButton').onclick();assert.equal(nodes.get('runButton').textContent,'Boost');
key('KeyW',true);advance(10);assert(doc.body.classList.contains('dying'));
assert(!nodes.get('death').open,'Fall is visible before the prompt');
advance(282);assert(!nodes.get('death').open,'Wait five seconds before showing the prompt');
advance(20);assert(nodes.get('death').open,'Uncleared crossing opens the prompt after five seconds');
nodes.get('respawn').onclick();assert(!nodes.get('death').open);
key('KeyI',true);advance(14);assert(nodes.get('idButton').disabled,'Showing ID grants clearance');
key('ShiftLeft',true);key('KeyW',true);advance(12);key('KeyW',false);key('ShiftLeft',false);
assert(lastZ>4.5&&!nodes.get('death').open,'Boost moves the board through the cleared gate');
key('KeyS',true);advance(30);key('KeyS',false);advance(16);
assert(!nodes.get('death').open&&!nodes.get('idButton').disabled,'Return is safe and consumes clearance');
key('KeyB',true);assert.equal(nodes.get('runButton').textContent,'Run');
console.log('Passed app bootstrap, mobile controls, switching travel modes, ID, firing, respawn, boosted exit and safe re-entry.');
