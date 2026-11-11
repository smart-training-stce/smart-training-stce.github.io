/* stce-3d-elec.js — موديلات 3D لبرنامج كهرباء منزلي (عربي وإنجليزي)
 * ملف منفصل بيتضاف على المنصة بسطر واحد:
 *   <script type="module" src="stce-3d-elec.js"></script>
 * لازم يتحط بعد سطر stce-3d.js، والوحدات التانية بتروح للعارض اللي قبله.
 * المحرك بيتحمّل أول مرة المتدرب يفتح موديل بس، فمش بيبطّأ المنصة.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.172.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/controls/OrbitControls.js/+esm';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.172.0/examples/jsm/environments/RoomEnvironment.js/+esm';

let LANG = 'ar';
const L = (ar, en) => LANG === 'en' ? en : ar;
/* ---------- واجهة العرض (بتتعمل مرة واحدة جوه المنصة) ---------- */
const root3d = document.createElement('div');
root3d.id = 'y3d-root'; root3d.hidden = true; root3d.setAttribute('dir', 'rtl');
root3d.innerHTML = `
<div class="y3d-box" role="dialog" aria-modal="true" aria-labelledby="y3d-title">
  <div class="y3d-head">
    <div class="y3d-titles"><div class="y3d-eyebrow">موديل 3D تفاعلي</div><h2 id="y3d-title"></h2></div>
    <button class="y3d-btn y3d-close" id="y3d-close" type="button" aria-label="إغلاق">✕</button>
  </div>
  <nav class="y3d-tabs" id="y3d-tabs" role="tablist"></nav>
  <div class="y3d-main">
    <div class="y3d-stagecol">
      <section class="y3d-stage" id="y3d-stage">
        <div id="y3d-canvasHost"></div>
        <div id="y3d-markers"></div>
        <div class="y3d-hud">
          <button class="y3d-btn" id="y3d-resetBtn" type="button">إعادة الضبط</button>
          <button class="y3d-btn y3d-primary" id="y3d-xrayBtn" type="button" hidden>شوف الأسلاك</button>
          <div class="y3d-phase" id="y3d-phase" hidden><b id="y3d-phaseName"></b><span class="y3d-deg">زاوية الكرنك <span id="y3d-phaseDeg">0°</span></span></div>
        </div>
        <div class="y3d-toast" id="y3d-toast" role="status" hidden></div>
        <div class="y3d-hint" id="y3d-hint"></div>
      </section>
      <div class="y3d-enginebar" id="y3d-engineBar" hidden>
        <button class="y3d-btn y3d-primary" id="y3d-runBtn" type="button">إيقاف الموتور</button>
        <label for="y3d-speed">السرعة <input type="range" id="y3d-speed" min="0" max="9" step="1" value="1"></label>
        <span class="y3d-rpm" id="y3d-rpm"></span>
      </div>
    </div>
    <div class="y3d-side">
      <section class="y3d-card" aria-live="polite">
        <div id="y3d-unitNote" hidden style="background:#fff6dd;color:#1b1f26;border:1px solid #e8b94a;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:13px"><span id="y3d-unitNoteTxt"></span> <button type="button" id="y3d-fullBtn" style="margin-top:6px;padding:6px 12px;border-radius:9px;border:1px solid #c9b98f;background:#fff;font:inherit;cursor:pointer"></button></div><div class="y3d-stepmeta">الخطوة <span id="y3d-stepNo">1</span> من <span id="y3d-stepCount">1</span></div>
        <h3 id="y3d-stepTitle"></h3>
        <p id="y3d-stepText"></p>
        <div class="y3d-stepnav">
          <button class="y3d-btn" id="y3d-prevBtn" type="button">السابق</button>
          <div class="y3d-dots" id="y3d-dots"></div>
          <button class="y3d-btn y3d-primary" id="y3d-nextBtn" type="button">التالي</button>
        </div>
        <button class="y3d-btn y3d-play" id="y3d-playBtn" type="button">▶ شغّل العملية كلها</button>
      </section>
      <section class="y3d-card"><h4>القطع</h4><ol class="y3d-parts" id="y3d-parts"></ol></section>
    </div>
  </div>
</div>`;
const styleEl = document.createElement('style'); styleEl.textContent = `
#y3d-root{--bg:#0b1220;--surface:#151e2e;--fg:#e8edf3;--muted:#95a2b3;--line:#273246;--accent:#f0b429;--accent-ink:#1b1405;--accent-soft:#3a2d10;--mk-bg:rgba(18,25,35,.9);
  position:fixed;inset:0;z-index:2147483000;background:rgba(4,8,16,.88);overflow:auto;-webkit-overflow-scrolling:touch;font-family:'Cairo',Tahoma,sans-serif;color:var(--fg);line-height:1.7;font-size:15px;
  padding:max(12px,env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) max(12px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px))}
#y3d-root[hidden]{display:none!important}
#y3d-root *{box-sizing:border-box}
#y3d-root [hidden]{display:none!important}
#y3d-root .y3d-box{max-width:1180px;margin:0 auto;background:var(--bg);border:1px solid var(--line);border-radius:18px;padding:14px;display:grid;gap:12px}
#y3d-root .y3d-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
#y3d-root .y3d-eyebrow{font-size:12px;color:var(--accent)}
#y3d-root h2{margin:0;font-size:clamp(17px,4vw,22px);line-height:1.4;color:var(--fg);font-weight:700}
#y3d-root .y3d-tabs{display:flex;gap:8px;flex-wrap:wrap}
#y3d-root .y3d-tabs:empty{display:none}
#y3d-root .y3d-tab{font:inherit;cursor:pointer;border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:10px;padding:6px 14px}
#y3d-root .y3d-tab[aria-selected="true"]{border-color:var(--accent);background:var(--accent-soft)}
#y3d-root .y3d-main{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@media (min-width:920px){#y3d-root .y3d-main{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:start}}
#y3d-root .y3d-stagecol{display:grid;gap:10px;min-width:0}
#y3d-root .y3d-stage{position:relative;height:min(62vh,560px,max(340px,110vw));border-radius:14px;overflow:hidden;background:radial-gradient(120% 90% at 50% 18%,#2a374b,#121923);touch-action:none}
#y3d-canvasHost,#y3d-canvasHost canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#y3d-markers{position:absolute;inset:0;pointer-events:none}
#y3d-root .y3d-mk{position:absolute;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:2px solid var(--accent);background:var(--mk-bg);color:var(--fg);font:700 13px/22px monospace;text-align:center;padding:0;cursor:pointer;pointer-events:auto}
#y3d-root .y3d-mk.y3d-sel{background:var(--accent);color:var(--accent-ink);z-index:2}
#y3d-root .y3d-mk.y3d-back{opacity:.45}
#y3d-root .y3d-mk-tag{position:absolute;left:0;top:0;pointer-events:none;white-space:nowrap;background:var(--accent);color:var(--accent-ink);font-size:13px;font-weight:700;padding:3px 10px;border-radius:8px;transform:translate(-50%,-150%);z-index:3}
#y3d-root .y3d-hud{position:absolute;inset:10px 10px auto 10px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;pointer-events:none}
#y3d-root .y3d-hud>*{pointer-events:auto}
#y3d-root .y3d-btn{font:inherit;font-size:14px;cursor:pointer;border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:10px;padding:6px 12px;white-space:nowrap}
#y3d-root .y3d-btn:disabled{opacity:.4;cursor:default}
#y3d-root .y3d-btn:focus-visible,#y3d-root .y3d-mk:focus-visible,#y3d-root .y3d-part:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
#y3d-root .y3d-play{width:100%;margin-top:10px;font-weight:700}
#y3d-root .y3d-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:700}
#y3d-root .y3d-close{font-size:16px;padding:4px 12px}
#y3d-root .y3d-phase{background:var(--mk-bg);border:1px solid var(--line);border-radius:10px;padding:5px 11px;font-size:13px;display:grid;line-height:1.45;white-space:nowrap}
#y3d-root .y3d-phase b{color:var(--accent)}
#y3d-root .y3d-deg{color:var(--muted);font-size:12px}
#y3d-root .y3d-hint{position:absolute;inset:auto 12px 10px 12px;text-align:center;font-size:12px;opacity:.75;pointer-events:none}
#y3d-root .y3d-toast{position:absolute;inset:auto 12px 40px 12px;margin-inline:auto;max-width:420px;text-align:center;background:var(--accent);color:var(--accent-ink);font-weight:700;font-size:13.5px;border-radius:10px;padding:7px 12px;pointer-events:none}
#y3d-root .y3d-enginebar{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 14px}
#y3d-root .y3d-enginebar label{display:flex;align-items:center;gap:10px;flex:1 1 180px}
#y3d-root .y3d-enginebar input{flex:1;min-width:0;accent-color:var(--accent)}
#y3d-root .y3d-rpm{color:var(--muted);font-size:13px;white-space:nowrap}
#y3d-root .y3d-side{display:grid;gap:12px;min-width:0}
#y3d-root .y3d-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;gap:8px;min-width:0}
#y3d-root .y3d-stepmeta{font-size:12.5px;color:var(--muted)}
#y3d-root .y3d-card h3{margin:0;font-size:18px;line-height:1.4;color:var(--fg)}
#y3d-root .y3d-card h4{margin:0;font-size:14px;color:var(--muted)}
#y3d-root .y3d-card p{margin:0;color:var(--fg)}
#y3d-root .y3d-stepnav{display:flex;align-items:center;justify-content:space-between;gap:10px}
#y3d-root .y3d-dots{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
#y3d-root .y3d-dot{width:10px;height:10px;border-radius:50%;border:0;padding:0;background:var(--line);cursor:pointer}
#y3d-root .y3d-dot[aria-current="true"]{background:var(--accent);width:22px;border-radius:6px}
#y3d-root .y3d-parts{list-style:none;margin:0;padding:0;display:grid;gap:4px}
#y3d-root .y3d-part{font:inherit;width:100%;cursor:pointer;display:grid;grid-template-columns:28px minmax(0,1fr);gap:10px;align-items:start;text-align:start;background:transparent;border:1px solid transparent;border-radius:10px;padding:7px 8px;color:var(--fg)}
#y3d-root .y3d-part.y3d-sel{border-color:var(--accent);background:var(--accent-soft)}
#y3d-root .y3d-n{width:26px;height:26px;border-radius:50%;border:2px solid var(--accent);font:700 13px/22px monospace;text-align:center}
#y3d-root .y3d-part.y3d-sel .y3d-n{background:var(--accent);color:var(--accent-ink)}
#y3d-root .y3d-part b{font-weight:700;display:block;line-height:1.4}
#y3d-root .y3d-part span{color:var(--muted);font-size:13px;line-height:1.5}
#y3d-root .y3d-err{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px}
`;
document.head.appendChild(styleEl); document.body.appendChild(root3d);
const $ = id => document.getElementById('y3d-' + id);
const stageEl = $('stage'), host = $('canvasHost'), markerLayer = $('markers');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const GOLD = new THREE.Color(0xffc23a);

/* ---------- محرك العرض ---------- */
let renderer, scene, camera, controls, userMoved = false, engineReady = false;
function initEngine(){
if(engineReady) return true;
try{
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
}catch(e){
  stageEl.insertAdjacentHTML('beforeend', '<div class="y3d-err">الجهاز ده مش بيدعم عرض 3D (WebGL). جرّب من متصفح Chrome أو من الكمبيوتر.</div>');
  return false;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
host.appendChild(renderer.domElement);
scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.add(new THREE.HemisphereLight(0xffffff, 0x3d475a, 0.9));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.1); keyLight.position.set(3, 8, 5); scene.add(keyLight);
keyLight.castShadow = true; keyLight.shadow.mapSize.set(1024, 1024); keyLight.shadow.bias = -.0005; keyLight.shadow.normalBias = .02;
Object.assign(keyLight.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: .5, far: 20 });
const rimLight = new THREE.DirectionalLight(0xbcd4ff, 0.8); rimLight.position.set(-6, 3, -5); scene.add(rimLight);
camera = new THREE.PerspectiveCamera(38, 1, 0.05, 200);
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.enablePan = false; controls.rotateSpeed = 0.8;
controls.autoRotateSpeed = 0.5;
controls.addEventListener('start', () => { controls.autoRotate = false; userMoved = true; });
new ResizeObserver(() => { if(root3d.hidden) return; const before = camera.aspect; resize(); if(Math.abs(before - camera.aspect) > .05) fit(); }).observe(host);
wirePicking();
engineReady = true; return true;
}

/* ---------- أدوات بناء القطع ---------- */
const glowTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData.shared = true; return t;
})();
function M(color, o = {}){
  const opacity = o.opacity ?? 1;
  return new THREE.MeshStandardMaterial({ color, roughness: o.r ?? .55, metalness: o.m ?? .1,
    transparent: opacity < 1, opacity, depthWrite: o.depthWrite ?? (opacity >= 1),
    side: o.side ?? THREE.FrontSide, emissive: 0x000000 });
}
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const cyl = (rt, rb, h, m, seg = 32, open = false) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), m);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = (cur, target, dt, k = 5) => cur + (target - cur) * Math.min(1, dt * k);
function baseE(m){ if(!m.userData.baseE){ m.userData.baseE = m.emissive.clone(); m.userData.baseI = m.emissiveIntensity; } return m.userData.baseE; }

function textSprite(text, color, scale = .22){
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); g.font = 'bold 84px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = 'rgba(10,14,20,.85)'; g.strokeText(text, 64, 68); g.fillStyle = color; g.fillText(text, 64, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.setScalar(scale); return s;
}
function polyPath(pts){ const p = new THREE.CurvePath(); for(let i = 0; i < pts.length - 1; i++) p.add(new THREE.LineCurve3(pts[i], pts[i + 1])); return p; }
function wireMesh(pts, color, r = .034){
  const path = polyPath(pts);
  return new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(24, (pts.length - 1) * 24), r, 10, false), M(color, { r: .45 }));
}
function shadowPlane(w, d){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: glowTex, color: 0x000000, transparent: true, opacity: .45, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.userData.noFit = true; return m;
}

class Flow{
  constructor(parent, path, { color = 0xffd34d, count = 16, speed = 1, size = .05 } = {}){
    this.path = path; this.len = path.getLength(); this.speed = speed; this.level = 0; this.target = 0; this.items = [];
    const geo = new THREE.SphereGeometry(size, 12, 8), mat = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    for(let i = 0; i < count; i++){ const m = new THREE.Mesh(geo, mat); m.userData.t = i / count; m.visible = false; parent.add(m); this.items.push(m); }
  }
  update(dt){
    this.level = ease(this.level, this.target, dt, 4);
    const vis = this.level > .04;
    for(const m of this.items){
      m.visible = vis; if(!vis) continue;
      m.userData.t = (m.userData.t + dt * this.speed * Math.max(.25, this.level) / this.len) % 1;
      m.position.copy(this.path.getPointAt(m.userData.t)); m.scale.setScalar(this.level);
    }
  }
}

function makeCtx(){
  const root = new THREE.Group(), parts = {}, order = [];
  function part(id, obj, anchor, label, desc){
    const mats = [];
    obj.traverse(o => { if(o.isMesh){ (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if(m.emissive && !mats.includes(m)){ baseE(m); mats.push(m); } }); } });
    const a = new THREE.Object3D(); a.position.copy(anchor); obj.add(a);
    parts[id] = { obj, anchor: a, mats, label, desc }; order.push(id); return obj;
  }
  return { root, parts, order, part };
}

/* ---------- مكتبة القطع ---------- */
function makeBoard(){
  const g = new THREE.Group();
  const top = at(box(4.6, .14, 3.2, M(0xc89f6a, { r: .8 })), 0, -.07, 0); top.userData.receiver = true; g.add(top);
  g.add(at(shadowPlane(7, 5.2), 0, -.16, 0));
  return g;
}
function makeBattery(){
  const g = new THREE.Group();
  g.add(at(box(.52, .06, 1.0, M(0x3a414d, { r: .7 })), 0, .03, 0));
  const body = cyl(.2, .2, .8, M(0x2c6fd6, { r: .35, m: .2 })); body.rotation.x = Math.PI / 2; g.add(at(body, 0, .26, 0));
  const band = cyl(.205, .205, .2, M(0xd9a441, { r: .3, m: .7 })); band.rotation.x = Math.PI / 2; g.add(at(band, 0, .26, -.3));
  const pos = cyl(.07, .07, .1, M(0xd3d8de, { m: .9, r: .25 })); pos.rotation.x = Math.PI / 2; g.add(at(pos, 0, .26, -.45));
  g.add(at(textSprite('+', '#ff7a6b'), 0, .58, -.36));
  g.add(at(textSprite('−', '#9cc2ff'), 0, .58, .36));
  g.add(at(textSprite('12V', '#ffffff', .3), 0, .56, 0));
  const neg = cyl(.09, .09, .04, M(0x9aa3af, { m: .9, r: .3 })); neg.rotation.x = Math.PI / 2; g.add(at(neg, 0, .26, .42));
  return { group: g, plus: V(0, .26, -.5), minus: V(0, .26, .44) };
}
function makeSwitch(){
  const g = new THREE.Group();
  g.add(at(box(.86, .08, .4, M(0x353c48, { r: .6 })), 0, .04, 0));
  const metal = M(0xd3d8de, { m: .9, r: .25 }), brass = M(0xd9a441, { m: .85, r: .3 });
  [-.28, .28].forEach(x => g.add(at(box(.07, .2, .14, metal), x, .18, 0)));
  [-.38, .38].forEach(x => g.add(at(cyl(.04, .04, .06, brass, 12), x, .11, 0)));
  const pivot = new THREE.Group(); pivot.position.set(-.28, .27, 0);
  pivot.add(at(box(.62, .04, .1, metal), .31, 0, 0));
  pivot.add(at(cyl(.045, .045, .26, M(0xd64545, { r: .4 })), .6, .13, 0));
  g.add(pivot);
  let a = 1.0, target = 1.0;
  return { group: g, tL: V(-.38, .14, 0), tR: V(.38, .14, 0), set(on){ target = on ? 0 : 1.0; }, update(dt){ a = ease(a, target, dt, 7); pivot.rotation.z = a; } };
}
function makeLamp(){
  const g = new THREE.Group();
  g.add(at(box(.62, .05, .26, M(0x353c48, { r: .6 })), 0, .025, 0));
  const brass = M(0xd9a441, { m: .85, r: .3 });
  [-.25, .25].forEach(x => g.add(at(cyl(.04, .04, .06, brass, 12), x, .08, 0)));
  g.add(at(cyl(.15, .17, .07, M(0x4a5262, { r: .6 })), 0, .085, 0));
  const bulb = new THREE.Group(); g.add(bulb);
  bulb.add(at(cyl(.11, .13, .16, M(0xb9c0c9, { m: .85, r: .3 })), 0, .2, 0));
  const glassM = M(0xfff4d6, { r: .08, m: 0, opacity: .42 });
  bulb.add(at(new THREE.Mesh(new THREE.SphereGeometry(.21, 32, 24), glassM), 0, .46, 0));
  const filM = M(0x8a6a3a, { m: .3, r: .4 });
  bulb.add(at(new THREE.Mesh(new THREE.TorusGeometry(.065, .014, 8, 24, Math.PI), filM), 0, .43, 0));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc65a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.set(0, .46, 0); bulb.add(glow);
  const light = new THREE.PointLight(0xffc06a, 0, 3.2, 2); light.position.set(0, .46, 0); bulb.add(light);
  let level = 0, target = 0, lift = 0, liftT = 0;
  return {
    group: g, tL: V(-.25, .1, 0), tR: V(.25, .1, 0),
    set(l){ target = l; }, out(v){ liftT = v ? 1 : 0; },
    update(dt){
      level = ease(level, target, dt, 6); lift = ease(lift, liftT, dt, 5);
      bulb.position.y = lift * .7; bulb.rotation.x = lift * .3;
      baseE(glassM).setRGB(1, .72, .32).multiplyScalar(level * .9); glassM.userData.baseI = 1;
      baseE(filM).setRGB(1, .8, .4).multiplyScalar(level); filM.userData.baseI = 3;
      glow.material.opacity = level * .95; glow.scale.setScalar(.3 + 1.1 * level);
      light.intensity = 4 * level;
    }
  };
}
function makeMeter(unit){
  const g = new THREE.Group();
  g.add(at(box(.6, .14, .82, M(0xf2b51e, { r: .5 })), 0, .07, 0));
  g.add(at(box(.5, .02, .3, M(0x20252d, { r: .6 })), 0, .15, -.17));
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(.44, .22), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.rotation.x = -Math.PI / 2; g.add(at(screen, 0, .162, -.17));
  const dial = cyl(.11, .11, .05, M(0x2b3038, { r: .5 })); g.add(at(dial, 0, .165, .12));
  g.add(at(box(.03, .02, .1, M(0xffffff)), 0, .195, .08));
  g.add(at(cyl(.035, .035, .05, M(0xd23a2e)), -.15, .165, .33));
  g.add(at(cyl(.035, .035, .05, M(0x111418)), .15, .165, .33));
  g.add(at(textSprite(unit, '#ffffff', .2), .22, .3, .12));
  function setText(s){
    const x = c.getContext('2d'); x.fillStyle = '#b9cba0'; x.fillRect(0, 0, 256, 128);
    x.fillStyle = '#18200f'; x.font = 'bold 64px monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(s, 128, 68); tex.needsUpdate = true;
  }
  setText('0.00');
  return { group: g, setText, red: V(-.15, .19, .33), black: V(.15, .19, .33) };
}

/* ---------- الموديلات ---------- */
const WY = .05;
const P = (x, z) => V(x, WY, z);

// سلك مقوّس بين نقطتين (زي السلك الحقيقي اللي مرفوع عن اللوحة)
function arch(a, b, h = .22){ return new THREE.QuadraticBezierCurve3(a, a.clone().add(b).multiplyScalar(.5).add(V(0, h, 0)), b); }
function wireOn(group, curve, color, r = .03){ const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 10, false), M(color, { r: .45 })); group.add(m); return m; }
function chain(...curves){ const p = new THREE.CurvePath(); curves.forEach(c => p.add(c)); return p; }
const line = (a, b) => new THREE.LineCurve3(a, b);
function termOf(obj, local){ obj.updateMatrixWorld(true); return obj.localToWorld(local.clone()); }

/* ---------- أدوات إضافية للدفعة الأولى ---------- */
// لوحة نص صغيرة (شاشة ميزان، ترمومتر، عداد وقت)
function makePanel(w, h, { bg = '#b9cba0', fg = '#18200f', font = 'bold 60px monospace' } = {}){
  const c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * h / w);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  let last = null;
  function setText(s){
    if(s === last) return; last = s;
    const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = fg; x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, c.width / 2, c.height / 2 + 4); tex.needsUpdate = true;
  }
  setText(''); return { mesh, setText };
}
// عداد بإبرة (مانوميتر)
function makeGauge(ring, min, max, labels, unit){
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#f7f7f2'; x.beginPath(); x.arc(128, 128, 124, 0, Math.PI * 2); x.fill();
  x.lineWidth = 14; x.strokeStyle = ring; x.beginPath(); x.arc(128, 128, 116, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#1b1f26'; x.font = 'bold 26px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const ang = v => (-135 + (v - min) / (max - min) * 270) * Math.PI / 180;
  for(let i = 0; i <= 20; i++){
    const v = min + (max - min) * i / 20, a = ang(v), r1 = 98, r2 = i % 5 ? 88 : 80;
    x.lineWidth = i % 5 ? 2 : 4; x.strokeStyle = '#1b1f26'; x.beginPath();
    x.moveTo(128 + r1 * Math.sin(a), 128 - r1 * Math.cos(a)); x.lineTo(128 + r2 * Math.sin(a), 128 - r2 * Math.cos(a)); x.stroke();
  }
  labels.forEach(v => { const a = ang(v); x.fillText(String(v), 128 + 62 * Math.sin(a), 128 - 62 * Math.cos(a)); });
  x.font = 'bold 22px sans-serif'; x.fillText(unit, 128, 182);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const body = cyl(.27, .27, .1, M(0x2b3038, { m: .6, r: .35 }), 40); body.rotation.x = Math.PI / 2; g.add(body);
  const face = new THREE.Mesh(new THREE.CircleGeometry(.24, 48), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); face.position.z = .052; g.add(face);
  const needle = new THREE.Group(); needle.position.z = .06;
  needle.add(at(box(.012, .2, .01, new THREE.MeshBasicMaterial({ color: 0xd2261c })), 0, .08, 0));
  needle.add(new THREE.Mesh(new THREE.CircleGeometry(.025, 16), new THREE.MeshBasicMaterial({ color: 0x1b1f26 })));
  g.add(needle);
  let v = min < 0 ? 0 : min, target = v;
  return { group: g, set(t){ target = t; }, get value(){ return v; }, update(dt){ v = ease(v, target, dt, 2.2); needle.rotation.z = -ang(v); } };
}
// جزيئات بتمشي في مسار ولونها بيتغيّر حسب مكانها
class ColorFlow{
  constructor(parent, path, colorAt, { count = 40, speed = 1, size = .045 } = {}){
    this.path = path; this.len = path.getLength(); this.speed = speed; this.level = 0; this.target = 0; this.items = []; this.colorAt = colorAt; this.maxT = 1;
    const geo = new THREE.SphereGeometry(size, 10, 8);
    for(let i = 0; i < count; i++){ const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); m.userData.t = i / count; m.visible = false; parent.add(m); this.items.push(m); }
  }
  update(dt){
    this.level = ease(this.level, this.target, dt, 3);
    const vis = this.level > .04;
    for(const m of this.items){
      m.visible = vis; if(!vis) continue;
      m.userData.t = (m.userData.t + dt * this.speed * Math.max(.25, this.level) / this.len) % 1;
      m.position.copy(this.path.getPointAt(m.userData.t)); m.scale.setScalar(this.level);
      m.material.color.copy(this.colorAt(m.userData.t)); if(m.userData.t > this.maxT) m.visible = false;
    }
  }
}
function segIndexer(path){
  const lens = path.getCurveLengths(), total = lens[lens.length - 1];
  return t => { const d = t * total; let i = 0; while(i < lens.length - 1 && lens[i] < d) i++; const prev = i ? lens[i - 1] : 0; return [i, (d - prev) / Math.max(1e-6, lens[i] - prev)]; };
}
const tube = (curve, r, m, seg = 64) => new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 10, false), m);
const CR = pts => new THREE.CatmullRomCurve3(pts, false, 'centripetal');
function helix(cx, cz, r, y0, y1, turns, a0 = 0){
  const pts = []; const n = Math.round(turns * 24);
  for(let i = 0; i <= n; i++){ const f = i / n, a = a0 + f * turns * Math.PI * 2; pts.push(V(cx + r * Math.cos(a), y0 + (y1 - y0) * f, cz + r * Math.sin(a))); }
  return CR(pts);
}
function makeCompressor(scale = 1, cover = true){
  const g = new THREE.Group(); const cm = M(0x4a5566, { m: .55, r: .35 });
  g.add(at(cyl(.42, .42, .55, cm, 40), 0, .33, 0));
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(.42, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), cm), 0, .6, 0));
  g.add(at(box(.95, .06, .62, M(0x1f242c, { r: .6 })), 0, .03, 0));
  if(cover) g.add(at(box(.2, .16, .1, M(0x14181e, { r: .6 })), .2, .36, .4));
  g.scale.setScalar(scale); return g;
}
const C = hex => new THREE.Color(hex);

function makeProbes(root, jackR, jackB){
  const wireM = [M(0xd23a2e, { r: .6 }), M(0x1d2128, { r: .6 })];
  const mk = color => { const g = new THREE.Group(); g.add(at(cyl(.024, .024, .3, M(color, { r: .5 })), 0, .2, 0)); g.add(at(cyl(.007, .007, .07, M(0xd3d8de, { m: .9, r: .25 })), 0, .03, 0)); g.rotation.set(-.55, 0, 0); root.add(g); return g; };
  const probes = [mk(0xd23a2e), mk(0x1d2128)], jacks = [jackR, jackB];
  const rest = [jackR.clone().add(V(-.15, -.1, .35)), jackB.clone().add(V(.15, -.1, .35))];
  const cur = rest.map(v => v.clone()), tgt = rest.map(v => v.clone()), wires = [null, null];
  const tail = g => V(0, .36, 0).applyEuler(g.rotation).add(g.position);
  function rebuild(i){
    if(wires[i]){ root.remove(wires[i]); wires[i].geometry.dispose(); }
    const a = jacks[i], b = tail(probes[i]);
    wires[i] = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, .5).add(V(0, -.3, .2)), b), 24, .012, 6, false), wireM[i]);
    wires[i].castShadow = true; root.add(wires[i]);
  }
  let dirty = true;
  return {
    group: probes,
    set(a, b){ tgt[0].copy(a || rest[0]); tgt[1].copy(b || rest[1]); },
    update(dt){
      for(let i = 0; i < 2; i++){ const before = cur[i].clone(); cur[i].lerp(tgt[i], Math.min(1, dt * 5)); probes[i].position.copy(cur[i]); if(before.distanceToSquared(cur[i]) > 1e-7) dirty = true; }
      if(dirty){ rebuild(0); rebuild(1); dirty = false; }
    }
  };
}
function poseLerp(obj, a, b, f){ obj.position.copy(a.p).lerp(b.p, f); obj.quaternion.copy(a.q).slerp(b.q, f); }
const pose = (p, e) => ({ p, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(...e)) });

/* ================= المرحلة الأولى: كهرباء منزلي + مشترك ================= */
const COL = { L: 0xb5542a, N: 0x2f6fd6, E: 0x7cc242, T1: 0x30343c, T2: 0x9aa0aa };

function label(text, color = '#ffffff', h = .16){
  const font = 'bold 60px "IBM Plex Sans Arabic", Tahoma, sans-serif';
  const c = document.createElement('canvas'); const g0 = c.getContext('2d'); g0.font = font;
  const w = Math.ceil(g0.measureText(text).width) + 30; c.width = w; c.height = 92;
  const g = c.getContext('2d'); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 10; g.strokeStyle = 'rgba(10,14,20,.85)'; g.strokeText(text, w / 2, 48); g.fillStyle = color; g.fillText(text, w / 2, 48);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(h * w / 92, h, 1); s.userData.noFit = true; return s;
}
function setGlow(mat, k, r = 1, g = .22, b = .1){ baseE(mat).setRGB(r * k, g * k, b * k); mat.userData.baseI = 1; }
function dropFlow(root, f){ if(!f) return; f.items.forEach(m => root.remove(m)); }

function makeSupply(){
  const g = new THREE.Group(), brass = M(0xd9a441, { m: .85, r: .3 });
  g.add(at(box(.5, .1, .9, M(0x2b3038, { r: .6 })), 0, .05, 0));
  const T = { L: V(0, .14, -.3), N: V(0, .14, 0), E: V(0, .14, .3) };
  const cols = { L: '#e8925a', N: '#7fb2ff', E: '#a6e36f' };
  for(const [k, p] of Object.entries(T)){ g.add(at(cyl(.06, .06, .06, brass, 16), p.x, .11, p.z)); g.add(at(label(k === 'E' ? 'PE' : k, cols[k], .15), -.2, .26, p.z)); }
  g.add(at(label('220 V', '#ffffff', .15), 0, .3, -.62));
  return { group: g, ...T };
}
function makeChangeover(){
  const g = new THREE.Group(), metal = M(0xd3d8de, { m: .9, r: .25 }), brass = M(0xd9a441, { m: .85, r: .3 });
  g.add(at(box(.86, .08, .56, M(0x353c48, { r: .6 })), 0, .04, 0));
  const com = V(-.36, .14, 0), t0 = V(.36, .14, -.17), t1 = V(.36, .14, .17);
  [com, t0, t1].forEach(p => g.add(at(cyl(.045, .045, .06, brass, 12), p.x, .11, p.z)));
  g.add(at(box(.07, .18, .1, metal), -.24, .17, 0));
  [-.17, .17].forEach(z => g.add(at(box(.07, .16, .1, metal), .26, .16, z)));
  g.add(at(label('C', '#ffd34d', .12), -.36, .3, .16));
  const pivot = new THREE.Group(); pivot.position.set(-.24, .25, 0); g.add(pivot);
  const len = Math.hypot(.5, .17), ang = Math.atan2(.17, .5);
  pivot.add(at(box(len, .035, .07, metal), len / 2, 0, 0));
  pivot.add(at(cyl(.04, .04, .2, M(0xd64545, { r: .4 })), len * .55, .1, 0));
  let a = ang, target = ang;
  return { group: g, com, t: [t0, t1], set(p){ target = p ? -ang : ang; }, update(dt){ a = ease(a, target, dt, 8); pivot.rotation.y = a; } };
}
function makeIntermediate(){
  const g = new THREE.Group(), metal = M(0xd3d8de, { m: .9, r: .25 }), brass = M(0xd9a441, { m: .85, r: .3 });
  g.add(at(box(.86, .08, .56, M(0x3e3550, { r: .6 })), 0, .04, 0));
  const inp = [V(-.36, .14, -.17), V(-.36, .14, .17)], out = [V(.36, .14, -.17), V(.36, .14, .17)];
  [...inp, ...out].forEach(p => g.add(at(cyl(.045, .045, .06, brass, 12), p.x, .11, p.z)));
  const blades = [0, 1].map(i => {
    const p = new THREE.Group(); p.position.set(-.3, .2 + i * .06, inp[i].z); g.add(p);
    const geo = new THREE.BoxGeometry(1, .03, .06); geo.translate(.5, 0, 0);
    const m = new THREE.Mesh(geo, i ? M(0xd64545, { r: .4 }) : metal); p.add(m); return { p, m };
  });
  let f = 0, target = 0;
  const straightLen = .6, crossLen = Math.hypot(.6, .34), crossAng = Math.atan2(.34, .6);
  return {
    group: g, inp, out, set(c){ target = c ? 1 : 0; },
    update(dt){
      f = ease(f, target, dt, 8);
      blades[0].p.rotation.y = -crossAng * f; blades[1].p.rotation.y = crossAng * f;
      const l = straightLen + (crossLen - straightLen) * f; blades[0].m.scale.x = l; blades[1].m.scale.x = l;
    }
  };
}
function makeSocket(){
  const g = new THREE.Group();
  g.add(at(box(.6, .12, .6, M(0xf1f2f4, { r: .4 })), 0, .06, 0));
  g.add(at(cyl(.2, .2, .03, M(0xe2e4e8, { r: .4 }), 32), 0, .135, 0));
  [-.07, .07].forEach(x => g.add(at(cyl(.025, .025, .02, M(0x22262c), 12), x, .15, 0)));
  [-.17, .17].forEach(x => g.add(at(box(.03, .02, .06, M(0xc9ced6, { m: .9, r: .3 })), x, .15, 0)));
  const plug = new THREE.Group(); g.add(plug);
  plug.add(at(cyl(.17, .17, .16, M(0x23272e, { r: .5 }), 28), 0, .23, 0));
  const cord = tube(CR([V(0, .3, 0), V(0, .5, .1), V(.15, .45, .45), V(.2, .1, .55)]), .025, M(0x23272e, { r: .6 }), 32);
  plug.add(cord);
  let lift = 1, target = 1;
  return { group: g, L: V(-.15, .12, -.3), N: V(.15, .12, -.3), E: V(0, .12, -.3), plug(v){ target = v ? 0 : 1; },
    update(dt){ lift = ease(lift, target, dt, 6); plug.position.y = lift * .5; plug.visible = lift < .97; } };
}
function lightBase(){
  const ctx = makeCtx(); ctx.root.add(makeBoard());
  const wires = new THREE.Group(); ctx.root.add(wires);
  const W = (a, b, col, h = .22) => { const c = arch(a, b, h); const mesh = new THREE.Mesh(new THREE.TubeGeometry(c, 48, .03, 10, false), M(col, { r: .45 })); wires.add(mesh); return { c, mesh }; };
  return { ctx, wires, W };
}
const SUPPLY_DESC = () => L('الفاز L (بني) والنيوترال N (أزرق) والأرضي PE (أخضر وأصفر)، 220 فولت.', 'Phase L (brown), neutral N (blue) and protective earth PE (green-yellow), 220 V.');

/* ---------- لمبة بمفتاح عادي + بريزة ---------- */
function buildLightOne(){
  const { ctx, wires, W } = lightBase(), { root, part } = ctx;
  const sup = makeSupply(); at(sup.group, -1.9, 0, -.3); root.add(sup.group);
  const sw = makeSwitch(); at(sw.group, -.6, 0, .95); root.add(sw.group);
  const lamp = makeLamp(); at(lamp.group, .55, 0, -1.0); root.add(lamp.group);
  const sock = makeSocket(); at(sock.group, 1.55, 0, .75); root.add(sock.group);
  const t = (o, p) => termOf(o.group, p);
  const sL = t(sup, sup.L), sN = t(sup, sup.N), sE = t(sup, sup.E);
  const a = t(sw, sw.tL), b = t(sw, sw.tR), la = t(lamp, lamp.tL), lb = t(lamp, lamp.tR);
  const kL = t(sock, sock.L), kN = t(sock, sock.N), kE = t(sock, sock.E);
  const w1 = W(sL, a, COL.L, .25), w2 = W(b, la, COL.L, .3), w3 = W(lb, sN, COL.N, .35);
  const w4 = W(sL, kL, COL.L, .5), w5 = W(kN, sN, COL.N, .45), w6 = W(sE, kE, COL.E, .4);
  part('supply', sup.group, V(0, .45, 0), L('مصدر الكهربا', 'Supply'), SUPPLY_DESC());
  part('switch', sw.group, V(0, .55, 0), L('المفتاح العادي', 'One-way switch'), L('بيفتح ويقفل سلك الفاز بس. دوس عليه.', 'Opens and closes the phase wire only. Tap it.'));
  part('lamp', lamp.group, V(0, .75, 0), L('اللمبة', 'Lamp'), L('طرف بيجيله الفاز من المفتاح، والطرف التاني على النيوترال.', 'One end gets the switched phase, the other goes to neutral.'));
  part('socket', sock.group, V(0, .4, 0), L('البريزة', 'Socket'), L('متوصلة على L وN وPE مباشرة من غير مفتاح. دوس عليها عشان تدخّل الفيشة.', 'Wired straight to L, N and PE with no switch. Tap it to plug in.'));
  const fLamp = new Flow(root, chain(w1.c, line(a, b), w2.c, line(la, lb), w3.c), { count: 22, speed: 1.1 });
  const fSock = new Flow(root, chain(w4.c, line(kL, kN), w5.c), { count: 20, speed: 1.1 });
  const st = { sw: 0, plug: 0 };
  function derive(){ sw.set(!!st.sw); lamp.set(st.sw ? .9 : 0); fLamp.target = st.sw; sock.plug(st.plug); fSock.target = st.plug; }
  ctx.parts.switch.tap = () => { st.sw ^= 1; derive(); return st.sw ? L('المفتاح اتقفل واللمبة نوّرت.', 'Switch closed, the lamp is on.') : L('المفتاح اتفتح واللمبة طفت.', 'Switch open, the lamp is off.'); };
  ctx.parts.socket.tap = () => { st.plug ^= 1; derive(); return st.plug ? L('الفيشة دخلت، والتيار ماشي في الجهاز حتى والمفتاح مفتوح.', 'Plugged in: current flows even with the switch open.') : L('الفيشة اتشالت.', 'Unplugged.'); };
  return {
    ...ctx, view: V(.2, 1.35, 1.5), sway: true, hint: L('دوس على المفتاح أو البريزة · صباعين للتقريب', 'Tap the switch or socket · pinch to zoom'),
    steps: [
      { title: L('لمبة بمفتاح عادي وبريزة', 'A lamp, a switch and a socket'), text: L('دي أبسط دايرة في البيت: مصدر 220 فولت، ومفتاح عادي بيتحكم في لمبة، وبريزة شغالة لوحدها من غير تحكم. الألوان: بني للفاز، أزرق للنيوترال، أخضر وأصفر للأرضي.', 'The simplest house circuit: a 220 V supply, a one-way switch controlling a lamp, and a socket that works on its own. Colours: brown phase, blue neutral, green-yellow earth.'), s: { sw: 0, plug: 0 } },
      { title: L('المفتاح بيقطع الفاز', 'The switch breaks the phase'), text: L('الفاز داخل على المفتاح، ومن المفتاح للمبة، والنيوترال راجع من اللمبة للمصدر على طول. لما المفتاح يتقفل التيار يمشي واللمبة تنوّر. النقط الصفرا بتوري مسار التيار.', 'The phase goes into the switch, then to the lamp; the neutral returns straight from the lamp to the supply. Close the switch and current flows. The yellow dots show its path.'), focus: 'switch', s: { sw: 1, plug: 0 } },
      { title: L('ليه الفاز مش النيوترال؟', 'Why the phase, not the neutral?'), text: L('لو المفتاح اتركّب على النيوترال، اللمبة هتطفى بس الدوي بتاعها هيفضل عليه 220 فولت. أي حد بيغيّر اللمبة وهو فاكرها مفصولة ممكن يتكهرب. عشان كده المفتاح دايمًا على الفاز.', 'If the switch were on the neutral, the lamp would go off but its holder would still carry 220 V, and someone changing the bulb could get a shock. So the switch always goes on the phase.'), focus: 'lamp', s: { sw: 0, plug: 0 } },
      { title: L('البريزة من غير تحكم', 'The socket has no switch'), text: L('البريزة متوصلة على الفاز والنيوترال مباشرة، توازي مع دايرة اللمبة. يعني فيها كهربا طول الوقت، والمفتاح مالوش دعوة بيها. جرّب: المفتاح مفتوح والجهاز شغال.', 'The socket is wired directly to phase and neutral, in parallel with the lamp circuit, so it is always live and the switch has nothing to do with it. Try it: switch open, appliance working.'), focus: 'socket', s: { sw: 0, plug: 1 } },
      { title: L('طرف الأرضي', 'The earth terminal'), text: L('الطرف اللي في النص بيتوصل بالسلك الأخضر والأصفر. ده مش بيشيل تيار في الطبيعي، لكن لو جسم جهاز معدن اتكهرب، التيار بينزل الأرض منه بدل ما يعدّي في جسم الإنسان.', 'The middle terminal takes the green-yellow wire. It carries no current normally, but if a metal appliance body becomes live, the current goes to earth through it instead of through a person.'), focus: 'socket', s: { sw: 1, plug: 1 } }
    ],
    apply(s){ Object.assign(st, s); derive(); },
    update(dt){ sw.update(dt); lamp.update(dt); sock.update(dt); fLamp.update(dt); fSock.update(dt); }
  };
}

/* ---------- لمبة من مكانين / 3 / 4 أماكن ---------- */
function buildLightMulti(n){
  const { ctx, wires, W } = lightBase(), { root, part } = ctx;
  const sup = makeSupply(); at(sup.group, -1.95, 0, -.55); root.add(sup.group);
  const lamp = makeLamp(); at(lamp.group, .4, 0, -1.05); root.add(lamp.group);
  const xs = n === 0 ? [-1.1, 1.1] : n === 1 ? [-1.45, 0, 1.45] : [-1.6, -.55, .55, 1.6];
  const s1 = makeChangeover(); at(s1.group, xs[0], 0, .85); root.add(s1.group);
  const s2 = makeChangeover(); at(s2.group, xs[xs.length - 1], 0, .85); s2.group.rotation.y = Math.PI; root.add(s2.group);
  const mids = []; for(let k = 0; k < n; k++){ const m = makeIntermediate(); at(m.group, xs[k + 1], 0, .85); root.add(m.group); mids.push(m); }
  const t = (o, p) => termOf(o.group, p);
  const sL = t(sup, sup.L), sN = t(sup, sup.N);
  const c1 = t(s1, s1.com), c2 = t(s2, s2.com), la = t(lamp, lamp.tL), lb = t(lamp, lamp.tR);
  const outs = [s1.t.map(p => t(s1, p))]; const ins = [];
  mids.forEach(m => { ins.push(m.inp.map(p => t(m, p))); outs.push(m.out.map(p => t(m, p))); });
  ins.push(s2.t.map(p => t(s2, p)));
  const wL = W(sL, c1, COL.L, .35), wOut = W(c2, la, COL.L, .45), wN = W(lb, sN, COL.N, .5);
  const trav = outs.map((o, k) => [0, 1].map(i => W(o[i], ins[k][i], i ? COL.T2 : COL.T1, .14 + i * .08)));
  part('supply', sup.group, V(0, .45, 0), L('مصدر الكهربا', 'Supply'), SUPPLY_DESC());
  part('s1', s1.group, V(0, .5, 0), L('المفتاح التحويلة الأول', 'First two-way switch'), L('3 أطراف: مشترك C ومخرجين. دوس عليه عشان تقلبه.', '3 terminals: common C and two outputs. Tap to flip it.'));
  mids.forEach((m, k) => part('i' + k, m.group, V(0, .5, 0), L(n > 1 ? `المفتاح الوسطاني ${k + 1}` : 'المفتاح الوسطاني', n > 1 ? `Intermediate switch ${k + 1}` : 'Intermediate switch'), L('4 أطراف: بيوصّل المراسلين مستقيم أو بيعكسهم. دوس عليه.', '4 terminals: passes the travellers straight or crosses them. Tap it.')));
  part('s2', s2.group, V(0, .5, 0), L('المفتاح التحويلة الأخير', 'Last two-way switch'), L('مشتركه بيطلّع الفاز للمبة. دوس عليه.', 'Its common sends the phase to the lamp. Tap it.'));
  part('lamp', lamp.group, V(0, .75, 0), L('اللمبة', 'Lamp'), L('بتنوّر لما الفاز يوصل من أي مسار للمشترك الأخير.', 'Lights when the phase reaches the last common by either path.'));
  part('trav', wires, trav[0][0].c.getPoint(.5), L('المراسلات', 'Travellers'), L('السلكين اللي بين المفاتيح. اللي عليه كهربا بينوّر أحمر.', 'The two wires between the switches. The live one glows red.'));
  const st = { a: 0, b: 1, x: [0, 0] };
  let flow = null, lastKey = '';
  function derive(){
    s1.set(st.a); s2.set(st.b); mids.forEach((m, k) => m.set(st.x[k]));
    let idx = st.a; const path = [wL.c, line(c1, outs[0][idx])];
    for(let k = 0; k < trav.length; k++){
      trav[k].forEach((w, i) => setGlow(w.mesh.material, i === idx ? .55 : 0));
      path.push(trav[k][idx].c);
      if(k < n){ const nidx = st.x[k] ? 1 - idx : idx; path.push(line(ins[k][idx], outs[k + 1][nidx])); idx = nidx; }
    }
    const closed = idx === st.b;
    path.push(line(ins[ins.length - 1][idx], c2), wOut.c, line(la, lb), wN.c);
    lamp.set(closed ? .9 : 0);
    const key = closed + ':' + st.a + st.b + st.x.join('');
    if(key !== lastKey){ dropFlow(root, flow); flow = closed ? new Flow(root, chain(...path), { count: 34, speed: 1.3 }) : null; if(flow){ flow.level = .05; flow.target = 1; } lastKey = key; }
    return closed;
  }
  const say = c => c ? L('اللمبة نوّرت.', 'Lamp on.') : L('اللمبة طفت.', 'Lamp off.');
  ctx.parts.s1.tap = () => { st.a ^= 1; return say(derive()); };
  ctx.parts.s2.tap = () => { st.b ^= 1; return say(derive()); };
  mids.forEach((m, k) => { ctx.parts['i' + k].tap = () => { st.x[k] ^= 1; return say(derive()); }; });
  const places = n + 2;
  const steps = [
    { title: L(`لمبة من ${places === 2 ? 'مكانين' : places + ' أماكن'}`, `A lamp from ${places} places`), text: places === 2
      ? L('مفتاحين تحويلة (Two-way) بيتحكموا في لمبة واحدة من مكانين، زي أول وآخر السلم أو الطرقة. أي مفتاح منهم يولّع أو يطفي.', 'Two two-way switches control one lamp from two places, like the top and bottom of a staircase. Either switch turns it on or off.')
      : L(`مفتاحين تحويلة في الطرفين، و${n === 1 ? 'مفتاح وسطاني' : n + ' مفاتيح وسطاني'} في النص. أي مفتاح من ال${places} يقلب حالة اللمبة. القاعدة: عدد الأماكن = 2 تحويلة + (العدد − 2) وسطاني.`, `Two two-way switches at the ends and ${n} intermediate switch${n > 1 ? 'es' : ''} between them. Any of the ${places} switches flips the lamp. Rule: places = 2 two-way + (places − 2) intermediate.`),
      s: { a: 0, b: 1, x: [0, 0] } },
    { title: L('المفتاح التحويلة', 'The two-way switch'), text: L('ليه 3 أطراف: المشترك C ومخرجين. السكينة بتوصّل المشترك بمخرج واحد بس في كل مرة. الفاز داخل على مشترك المفتاح الأول، ومشترك المفتاح الأخير طالع للمبة.', 'It has 3 terminals: common C and two outputs. The blade joins the common to one output at a time. The phase enters the first common; the last common feeds the lamp.'), focus: 's1', s: { a: 0, b: 1, x: [0, 0] } },
    { title: L('المراسلات', 'The travellers'), text: L('السلكين اللي بين المفاتيح اسمهم المراسلات. الفاز بيمشي على واحد منهم بس، وده اللي بينوّر أحمر. اللمبة بتنوّر لما المراسل اللي عليه كهربا يوصل للمخرج اللي المفتاح الأخير واقف عليه.', 'The two wires between the switches are the travellers. The phase rides on only one of them, shown glowing red. The lamp lights when that live traveller meets the output the last switch is set to.'), focus: 'trav', s: { a: 0, b: 1, x: [0, 0] } }
  ];
  if(n > 0) steps.push({ title: L('المفتاح الوسطاني', 'The intermediate switch'), text: L('ليه 4 أطراف: مراسلين داخلين ومراسلين طالعين. في وضع بيعدّيهم مستقيم، وفي الوضع التاني بيعكسهم (اللي فوق يروح تحت). العكس ده هو اللي بيقلب حالة اللمبة. دوس عليه وشوف.', 'It has 4 terminals: two travellers in and two out. One position passes them straight, the other crosses them over. That crossing is what flips the lamp. Tap it and watch.'), focus: 'i0', s: { a: 0, b: 1, x: [1, 0] } });
  steps.push(
    { title: L('المفتاحين على نفس المسار', 'Both on the same path'), text: L('دلوقتي الفاز وصل للمخرج اللي المفتاح الأخير واقف عليه، فالدايرة قفلت واللمبة نوّرت. النقط الصفرا بتوري المسار كله.', 'Now the phase reaches the output the last switch is set to, so the circuit closes and the lamp lights. The yellow dots trace the whole path.'), focus: 'lamp', s: { a: 0, b: 0, x: [0, 0] } },
    { title: L('جرّب بنفسك', 'Try it yourself'), text: L(`دوس على أي مفتاح من ال${places}: كل ضغطة بتقلب اللمبة، من غير ما يفرق المفاتيح التانية واقفة على إيه.`, `Tap any of the ${places} switches: every tap flips the lamp, whatever the others are set to.`), focus: 's2', s: { a: 1, b: 0, x: [0, 0] } }
  );
  return {
    ...ctx, view: V(.15, 1.4, 1.35), sway: true, hint: L('دوس على أي مفتاح · صباعين للتقريب', 'Tap any switch · pinch to zoom'), steps,
    apply(s){ st.a = s.a; st.b = s.b; st.x = [...s.x]; derive(); },
    update(dt){ s1.update(dt); s2.update(dt); mids.forEach(m => m.update(dt)); lamp.update(dt); if(flow) flow.update(dt); }
  };
}

/* ---------- النجفة 2 + 3 ---------- */
function buildChandelier(){
  const { ctx, wires, W } = lightBase(), { root, part } = ctx;
  const sup = makeSupply(); at(sup.group, -1.95, 0, .55); root.add(sup.group);
  const plate = new THREE.Group(); root.add(plate); plate.position.set(-.4, 0, 1.05);
  plate.add(at(box(2.0, .05, .62, M(0xe9ebef, { r: .45 })), 0, .025, 0));
  const swA = makeSwitch(); at(swA.group, -.48, .02, 0); plate.add(swA.group);
  const swB = makeSwitch(); at(swB.group, .48, .02, 0); plate.add(swB.group);
  plate.add(at(label('A', '#ffd34d', .16), -.48, .5, .1)); plate.add(at(label('B', '#7fd3ff', .16), .48, .5, .1));
  const pos = [[-1.35, -.55], [-.65, -.95], [.15, -1.15], [.95, -1.0], [1.65, -.6]];
  const lamps = pos.map(([x, z]) => { const l = makeLamp(); at(l.group, x, 0, z); root.add(l.group); return l; });
  lamps.forEach((l, i) => l.group.add(at(label(i < 2 ? 'A' : 'B', i < 2 ? '#ffd34d' : '#7fd3ff', .14), 0, .95, 0)));
  const t = (o, p) => termOf(o.group, p);
  const sL = t(sup, sup.L), sN = t(sup, sup.N);
  const aIn = t(swA, swA.tL), aOut = t(swA, swA.tR), bIn = t(swB, swB.tL), bOut = t(swB, swB.tR);
  const LT = lamps.map(l => [t(l, l.tL), t(l, l.tR)]);
  const wF = W(sL, aIn, COL.L, .3), wJ = W(aIn, bIn, COL.L, .25);
  const wA = [W(aOut, LT[0][0], COL.L, .45), W(LT[0][0], LT[1][0], COL.L, .2)];
  const wB = [W(bOut, LT[2][0], COL.L, .5), W(LT[2][0], LT[3][0], COL.L, .2), W(LT[3][0], LT[4][0], COL.L, .2)];
  for(let i = 0; i < 4; i++) W(LT[i][1], LT[i + 1][1], COL.N, .12);
  W(LT[0][1], sN, COL.N, .4);
  part('supply', sup.group, V(0, .45, 0), L('مصدر الكهربا', 'Supply'), SUPPLY_DESC());
  part('switch', plate, V(0, .62, 0), L('المفتاح المزدوج', 'Double switch'), L('مفتاحين في علبة واحدة، داخلهم فاز واحد، وكل واحد بيطلّع فاز لمجموعة. دوس على A أو B.', 'Two switches in one box sharing one phase in; each feeds its own group. Tap A or B.'));
  part('groupA', lamps[0].group, V(0, .75, 0), L('المجموعة A (لمبتين)', 'Group A (2 lamps)'), L('متوصلين توازي على فاز المفتاح A.', 'In parallel on switch A\'s output.'));
  part('groupB', lamps[3].group, V(0, .75, 0), L('المجموعة B (3 لمبات)', 'Group B (3 lamps)'), L('متوصلين توازي على فاز المفتاح B.', 'In parallel on switch B\'s output.'));
  part('neutral', wires, LT[2][1].clone().add(V(0, .12, 0)), L('النيوترال المشترك', 'Shared neutral'), L('سلك أزرق واحد بيلف على كل اللمبات ويرجع للمصدر.', 'One blue wire loops through every lamp back to the supply.'));
  const fF = new Flow(root, chain(wF.c), { count: 8, speed: 1.1 });
  const fA = new Flow(root, chain(line(aIn, aOut), ...wA.map(w => w.c)), { count: 14, speed: 1.1 });
  const fB = new Flow(root, chain(wJ.c, line(bIn, bOut), ...wB.map(w => w.c)), { count: 18, speed: 1.1 });
  const st = { a: 0, b: 0 };
  function derive(){ swA.set(!!st.a); swB.set(!!st.b); lamps.forEach((l, i) => l.set((i < 2 ? st.a : st.b) ? .9 : 0)); fA.target = st.a; fB.target = st.b; fF.target = st.a || st.b ? 1 : 0; return (st.a ? 2 : 0) + (st.b ? 3 : 0); }
  const sayN = n => n ? L(`منوّر ${n} لمبات.`, `${n} lamps on.`) : L('كله مطفي.', 'All off.');
  ctx.parts.switch.tap = () => { if(!st.a) st.a = 1; else if(!st.b) st.b = 1; else { st.a = 0; st.b = 0; } return sayN(derive()); };
  ctx.parts.groupA.tap = () => { st.a ^= 1; return sayN(derive()); };
  ctx.parts.groupB.tap = () => { st.b ^= 1; return sayN(derive()); };
  return {
    ...ctx, view: V(.1, 1.35, 1.4), sway: true, hint: L('دوس على المفتاح أو على أي لمبة · صباعين للتقريب', 'Tap the switch or any lamp · pinch to zoom'),
    steps: [
      { title: L('نجفة بمجموعتين 2 + 3', 'A chandelier in two groups, 2 + 3'), text: L('النجفة فيها 5 لمبات مقسومين مجموعتين: A فيها لمبتين وB فيها 3. مفتاح مزدوج بيتحكم في كل مجموعة لوحدها، فتقدر تنوّر 2 أو 3 أو ال5 مع بعض.', 'The chandelier has 5 lamps in two groups: A with 2 and B with 3. A double switch controls each group separately, so you can light 2, 3 or all 5.'), s: { a: 0, b: 0 } },
      { title: L('المفتاح المزدوج', 'The double switch'), text: L('الفاز داخل على طرف واحد، ومنه كوبري (جمبر) للمفتاح التاني. كل مفتاح ليه مخرج فاز لمجموعته.', 'The phase enters one terminal and a jumper carries it to the second switch. Each switch has its own phase output to its group.'), focus: 'switch', s: { a: 0, b: 0 } },
      { title: L('المجموعة A', 'Group A'), text: L('اقفل المفتاح A: اللمبتين نوّروا. هما متوصلين توازي، فكل لمبة واخدة 220 فولت كاملة.', 'Close switch A: both lamps light. They are in parallel, so each gets the full 220 V.'), focus: 'groupA', s: { a: 1, b: 0 } },
      { title: L('المجموعة B', 'Group B'), text: L('اقفل المفتاح B: التلات لمبات التانيين نوّروا. فاز B بيعدّي من لمبة للتانية على نفس الطرف.', 'Close switch B: the other three light. B\'s phase loops from lamp to lamp on the same terminal.'), focus: 'groupB', s: { a: 0, b: 1 } },
      { title: L('ال5 لمبات مع بعض', 'All 5 together'), text: L('المفتاحين مقفولين. لاحظ إن النيوترال سلك واحد مشترك لكل اللمبات، والفاز بس هو اللي متقسّم على المجموعتين.', 'Both switches closed. Notice the neutral is one shared wire for every lamp; only the phase is split between the groups.'), focus: 'neutral', s: { a: 1, b: 1 } }
    ],
    apply(s){ Object.assign(st, s); derive(); },
    update(dt){ swA.update(dt); swB.update(dt); lamps.forEach(l => l.update(dt)); fF.update(dt); fA.update(dt); fB.update(dt); }
  };
}

/* ---------- الأفوميتر (مشترك) ---------- */
function makeBigMeter(){
  const g = new THREE.Group();
  g.add(at(box(.8, .16, 1.25, M(0xf2b51e, { r: .5 })), 0, .08, 0));
  g.add(at(box(.68, .02, 1.12, M(0x2a2f37, { r: .6 })), 0, .165, 0));
  const pan = makePanel(.58, .24, { font: 'bold 64px monospace' }); pan.mesh.rotation.x = -Math.PI / 2; g.add(at(pan.mesh, 0, .178, -.38));
  const dial = new THREE.Group(); dial.position.set(0, .18, .08); g.add(dial);
  dial.add(cyl(.17, .17, .05, M(0x1d2128, { r: .4 }), 40));
  dial.add(at(box(.035, .03, .16, M(0xffffff)), 0, .035, -.08));
  const MODES = { off: 0, vac: .55, vdc: 1.1, ohm: -.55, cont: -1.1, amp: -1.65 };
  const NAMES = { off: 'OFF', vac: 'V~', vdc: 'V⎓', ohm: 'Ω', cont: '•)))', amp: 'A' };
  for(const [k, a] of Object.entries(MODES)) g.add(at(label(NAMES[k], k === 'amp' ? '#ff8a7a' : '#ffffff', .07), -Math.sin(a) * .25, .19, .08 - Math.cos(a) * .25));
  const jacks = { amp: V(-.22, .18, .46), com: V(0, .18, .46), v: V(.22, .18, .46) };
  const jc = { amp: 0xd23a2e, com: 0x15181d, v: 0xd23a2e };
  for(const [k, p] of Object.entries(jacks)){ g.add(at(cyl(.045, .045, .03, M(jc[k], { r: .4 }), 20), p.x, .175, p.z)); g.add(at(label(k === 'amp' ? '10A' : k === 'com' ? 'COM' : 'VΩ', '#ffffff', .06), p.x, .2, p.z + .1)); }
  let a = 0, target = 0, blink = 0, txt = '';
  return { group: g, jacks, setMode(m){ target = MODES[m] ?? 0; }, setText(s){ txt = s; },
    update(dt){ a = ease(a, target, dt, 7); dial.rotation.y = a; blink += dt; pan.setText(txt === 'FUSE' ? (blink % 1 < .5 ? 'FUSE' : '') : txt); } };
}
function makeProbes2(root, jackR, jackB){
  const wireM = [M(0xd23a2e, { r: .6 }), M(0x1d2128, { r: .6 })];
  const mk = color => { const g = new THREE.Group(); g.add(at(cyl(.024, .024, .3, M(color, { r: .5 })), 0, .2, 0)); g.add(at(cyl(.007, .007, .07, M(0xd3d8de, { m: .9, r: .25 })), 0, .03, 0)); g.rotation.set(-.55, 0, 0); root.add(g); return g; };
  const probes = [mk(0xd23a2e), mk(0x1d2128)], jacks = [jackR.clone(), jackB.clone()];
  const rest = [jackR.clone().add(V(-.25, -.12, .45)), jackB.clone().add(V(.05, -.12, .5))];
  const cur = rest.map(v => v.clone()), tgt = rest.map(v => v.clone()), wires = [null, null];
  const tail = g => V(0, .36, 0).applyEuler(g.rotation).add(g.position);
  function rebuild(i){
    if(wires[i]){ root.remove(wires[i]); wires[i].geometry.dispose(); }
    const a = jacks[i], b = tail(probes[i]);
    wires[i] = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, .5).add(V(0, -.25, .25)), b), 24, .012, 6, false), wireM[i]);
    wires[i].castShadow = true; wires[i].userData.noFit = true; root.add(wires[i]);
  }
  let dirty = true;
  return { group: probes, set(a, b){ tgt[0].copy(a || rest[0]); tgt[1].copy(b || rest[1]); }, setJack(i, v){ jacks[i].copy(v); dirty = true; },
    update(dt){ for(let i = 0; i < 2; i++){ const before = cur[i].clone(); cur[i].lerp(tgt[i], Math.min(1, dt * 5)); probes[i].position.copy(cur[i]); if(before.distanceToSquared(cur[i]) > 1e-7) dirty = true; } if(dirty){ rebuild(0); rebuild(1); dirty = false; } } };
}
function makeResistor(bands){
  const g = new THREE.Group();
  const body = cyl(.07, .07, .34, M(0xe6d3a8, { r: .5 }), 24); body.rotation.z = Math.PI / 2; g.add(at(body, 0, .12, 0));
  bands.forEach((c, i) => { const b = cyl(.072, .072, .035, M(c, { r: .4 }), 24); b.rotation.z = Math.PI / 2; g.add(at(b, -.11 + i * .065 + (i === 3 ? .04 : 0), .12, 0)); });
  const lead = M(0xc9ced6, { m: .9, r: .3 });
  [-1, 1].forEach(s => { const l = cyl(.012, .012, .24, lead, 8); l.rotation.z = Math.PI / 2; g.add(at(l, s * .28, .12, 0)); g.add(at(cyl(.012, .012, .12, lead, 8), s * .4, .06, 0)); });
  return { group: g, a: V(-.4, .02, 0), b: V(.4, .02, 0), top: [V(-.33, .13, 0), V(.33, .13, 0)] };
}
function buildMultimeter(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(makeWorkbench());
  const wires = new THREE.Group(); root.add(wires);
  const bat = makeBattery(); at(bat.group, -1.55, 0, -.5); root.add(bat.group);
  const sw = makeSwitch(); at(sw.group, -.55, 0, -1.15); root.add(sw.group);
  const res = makeResistor([0xd0302a, 0xd0302a, 0x6b3b1e, 0xd9a441]); at(res.group, .45, 0, -1.15); root.add(res.group);
  const lamp = makeLamp(); at(lamp.group, 1.5, 0, -.85); root.add(lamp.group);
  const sock = makeSocket(); at(sock.group, -1.75, 0, .95); root.add(sock.group); sock.plug(0);
  const mtr = makeBigMeter(); at(mtr.group, .8, 0, .65); mtr.group.rotation.y = -.25; root.add(mtr.group);
  const t = (o, p) => termOf(o.group, p);
  const bP = t(bat, bat.plus), bN = t(bat, bat.minus), sa = t(sw, sw.tL), sb = t(sw, sw.tR);
  const ra = t(res, res.a), rb = t(res, res.b), la = t(lamp, lamp.tL), lb = t(lamp, lamp.tR);
  const ws = [arch(bP, sa, .25), arch(sb, ra, .18), arch(rb, la, .2), arch(lb, bN, .45)];
  ws.forEach((c, i) => wireOn(wires, c, i === 3 ? 0x2b2f38 : 0xd0473a));
  const J = k => termOf(mtr.group, mtr.jacks[k]);
  const probes = makeProbes2(root, J('v'), J('com'));
  const flow = new Flow(root, chain(ws[0], line(sa, sb), ws[1], line(ra, rb), ws[2], line(la, lb), ws[3]), { count: 26, speed: .9 });
  part('meter', mtr.group, V(0, .35, -.2), L('الأفوميتر الرقمي', 'Digital multimeter'), L('شاشة، ومفتاح اختيار، و3 فتحات: COM للأسود دايمًا، وVΩ للأحمر، و10A للأحمر وقت قياس التيار بس.', 'Display, selector dial and 3 jacks: COM for black always, VΩ for red, and 10A for red only when measuring current.'));
  part('battery', bat.group, V(0, .62, 0), L('البطارية', 'Battery'), L('مصدر تيار مستمر 12 فولت.', '12 V DC source.'));
  part('resistor', res.group, V(0, .32, 0), L('المقاومة', 'Resistor'), L('ألوانها أحمر أحمر بني دهبي = 220 أوم ±5٪.', 'Bands red-red-brown-gold = 220 Ω ±5%.'));
  part('switch', sw.group, V(0, .55, 0), L('المفتاح', 'Switch'), L('بيفتح ويقفل الدايرة.', 'Opens and closes the circuit.'));
  part('lamp', lamp.group, V(0, .75, 0), L('اللمبة', 'Lamp'), L('حِمل في نفس الدايرة.', 'A load in the same circuit.'));
  part('socket', sock.group, V(0, .3, 0), L('البريزة', 'Socket'), L('تيار متردد 220 فولت.', '220 V AC.'));
  const st = { step: 0 };
  const off = (v, o) => v.clone().add(o);
  const SOCK = [t(sock, V(-.07, .15, 0)), t(sock, V(.07, .15, 0))];
  const STEPS = [
    { mode: 'off', read: '', jack: 'v', sw: 0 },
    { mode: 'vdc', read: '12.0 V', jack: 'v', sw: 0, a: off(bP, V(0, .05, 0)), b: off(bN, V(0, .05, 0)) },
    { mode: 'vac', read: '221 V', jack: 'v', sw: 0, a: SOCK[0], b: SOCK[1] },
    { mode: 'ohm', read: '219 Ω', jack: 'v', sw: 0, a: t(res, res.top[0]), b: t(res, res.top[1]) },
    { mode: 'cont', read: '0.2 Ω', jack: 'v', sw: 0, a: off(rb, V(0, .04, 0)), b: off(la, V(0, .05, 0)) },
    { mode: 'amp', read: '0.050 A', jack: 'amp', sw: 0, a: off(sa, V(0, .05, 0)), b: off(sb, V(0, .05, 0)), flow: 1 },
    { mode: 'amp', read: 'FUSE', jack: 'amp', sw: 0, a: off(bP, V(0, .05, 0)), b: off(bN, V(0, .05, 0)) }
  ];
  let beep = 0;
  return {
    ...ctx, view: V(.15, 1.3, 1.45), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('الأفوميتر الرقمي', 'The digital multimeter'), text: L('جهاز واحد بيقيس الجهد المستمر والمتردد والمقاومة والتوصيل والتيار. قبل أي قياس: اختار الوضع الصح من المفتاح، وحط السلك الأسود في COM، والأحمر في الفتحة المناسبة.', 'One instrument measures DC and AC voltage, resistance, continuity and current. Before any reading: pick the right mode, black lead in COM, red lead in the right jack.'), focus: 'meter', s: { step: 0 } },
      { title: L('قياس جهد مستمر', 'Measuring DC voltage'), text: L('المفتاح على V⎓، والأحمر في VΩ. الجهد بيتقاس توازي: طرف على الموجب وطرف على السالب، والدايرة شغالة. القراية 12 فولت. لو عكست الأطراف هتطلع −12.', 'Dial on V⎓, red in VΩ. Voltage is measured in parallel: one probe on +, one on −, with the circuit live. It reads 12 V; reversed probes read −12.'), focus: 'battery', s: { step: 1 } },
      { title: L('قياس جهد متردد', 'Measuring AC voltage'), text: L('المفتاح على V~. ادخل بالطرفين في فتحتين البريزة. القراية حوالي 220 فولت. خلي صوابعك على الجزء المعزول من الأطراف بس.', 'Dial on V~. Put both probes into the socket holes. It reads about 220 V. Keep your fingers on the insulated grips only.'), focus: 'socket', s: { step: 2 } },
      { title: L('قياس المقاومة', 'Measuring resistance'), text: L('المفتاح على Ω، والدايرة لازم تكون مفصولة من الكهربا. القراية 219 أوم، قريبة من ال220 المكتوبة بالألوان (السماحية ±5٪). عمرك ما تقيس مقاومة في دايرة فيها كهربا.', 'Dial on Ω with the circuit de-energised. It reads 219 Ω, close to the colour-coded 220 Ω (±5% tolerance). Never measure resistance on a live circuit.'), focus: 'resistor', s: { step: 3 } },
      { title: L('اختبار التوصيل', 'Continuity test'), text: L('المفتاح على علامة الصفارة. لو السلك سليم الجهاز بيصفّر والقراية قريبة من الصفر. لو مقطوع بيكتب OL ومش بيصفّر. ده أسرع طريقة تدوّر بيها على سلك مقطوع.', 'Dial on the buzzer symbol. A good wire beeps and reads near zero; a broken one shows OL and stays silent. The fastest way to find a broken wire.'), focus: 'meter', s: { step: 4 } },
      { title: L('قياس التيار', 'Measuring current'), text: L('انقل الأحمر لفتحة 10A، والمفتاح على A. التيار بيتقاس توالي: افتح الدايرة وخلي الجهاز هو اللي يكمّلها. هنا شلنا مكان المفتاح وحطينا الأطراف، فالتيار بيعدّي في الجهاز: 0.05 أمبير.', 'Move red to 10A and set the dial to A. Current is measured in series: open the circuit and let the meter complete it. Here the probes take the switch\'s place, so current flows through the meter: 0.05 A.'), focus: 'meter', s: { step: 5 } },
      { title: L('أخطر غلطة', 'The most dangerous mistake'), text: L('لو الأحمر لسه في فتحة 10A وحطيته على جهد (زي البطارية أو البريزة)، الجهاز بيبقى زي سلك قصر. الفيوز اللي جوه بيضرب، وممكن الجهاز يتحرق. بعد قياس التيار رجّع الأحمر لـ VΩ على طول.', 'If red is still in 10A and you touch a voltage (battery or socket), the meter acts like a short circuit: its internal fuse blows and it can burn out. After measuring current, move red back to VΩ at once.'), focus: 'meter', s: { step: 6 } }
    ],
    apply(s){ st.step = s.step; const c = STEPS[st.step]; mtr.setMode(c.mode); mtr.setText(c.read); probes.setJack(0, J(c.jack)); probes.set(c.a || null, c.b || null); sw.set(!!c.sw); flow.target = c.flow ? 1 : 0; lamp.set(c.flow ? .35 : 0); beep = 0; },
    update(dt){ mtr.update(dt); probes.update(dt); sock.update(dt); sw.update(dt); lamp.update(dt); flow.update(dt); if(st.step === 4){ beep += dt; if(beep > .8){ beep = 0; showToast(L('بيب ♪', 'Beep ♪')); } } }
  };
}

/* ---------- لوحة التوزيع والأرضي ---------- */
function makeBreaker(w, label_, col = 0xf3f4f6){
  const g = new THREE.Group();
  g.add(at(box(w, .5, .3, M(col, { r: .45 })), 0, 0, 0));
  g.add(at(box(w * .7, .08, .02, M(0x2b3038, { r: .5 })), 0, -.15, .16));
  const lever = new THREE.Group(); lever.position.set(0, .02, .15); g.add(lever);
  lever.add(at(box(Math.min(.09, w * .55), .14, .05, M(0x2a62c9, { r: .4 })), 0, .07, 0));
  const flag = at(box(w * .5, .05, .01, M(0x2fbf5a, { r: .4 })), 0, -.15, .171); g.add(flag);
  if(label_) g.add(at(label(label_, '#ffffff', .085), 0, -.34, .2));
  let a = 0, target = 0;
  return { group: g, set(on){ target = on ? 0 : Math.PI * .8; }, get on(){ return target === 0; },
    update(dt){ a = ease(a, target, dt, 9); lever.rotation.x = a; flag.material.color.setHex(a < .5 ? 0x2fbf5a : 0xd23a2e); } };
}
function buildDistBoard(){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(at(box(4.2, 3.0, .12, M(0xd9d4c8, { r: .9 })), 0, 1.5, -.5));
  const ground = at(box(4.2, 1.3, 2.2, M(0x7a5b3d, { r: .95, opacity: .35 })), 0, -.65, .55); ground.userData.noFit = true; root.add(ground);
  root.add(at(box(4.2, .06, 2.2, M(0xbfb7a6, { r: .9 })), 0, -.03, .55));
  const enc = new THREE.Group(); enc.position.set(-.55, 1.75, -.38); root.add(enc);
  enc.add(at(box(2.5, 1.55, .08, M(0x9aa3ad, { m: .4, r: .5 })), 0, 0, -.02));
  enc.add(at(box(2.3, .06, .06, M(0x6c747d, { m: .7 })), 0, .1, .06));
  const W = .16;
  const main = makeBreaker(W * 2, L('عمومي 40A', 'Main 40A'), 0xe8eaee); at(main.group, -.95, .1, .2); enc.add(main.group);
  const rcd = makeBreaker(W * 2, L('تسريب 30mA', 'RCD 30mA'), 0xf3f4f6); at(rcd.group, -.55, .1, .2); enc.add(rcd.group);
  const tBtn = at(box(.06, .06, .03, M(0xe2b23a, { r: .4 })), .06, -.06, .17); rcd.group.add(tBtn);
  rcd.group.add(at(label('T', '#1b1f26', .06), .06, -.06, .2));
  const names = [L('إنارة 10A', 'Lights 10A'), L('برايز 16A', 'Sockets 16A'), L('تكييف 20A', 'A/C 20A'), L('سخان 20A', 'Heater 20A')];
  const mcbs = names.map((n, i) => { const b = makeBreaker(W, n); at(b.group, -.15 + i * .38, .1, .2); enc.add(b.group); return b; });
  const nBar = at(box(.9, .07, .07, M(0x3c78d8, { m: .5 })), -.55, -.55, .1); enc.add(nBar);
  const eBar = at(box(.9, .07, .07, M(0x5aaa36, { m: .5 })), .55, -.55, .1); enc.add(eBar);
  enc.add(at(label('N', '#7fb2ff', .12), -1.1, -.55, .15)); enc.add(at(label('PE', '#a6e36f', .12), 1.1, -.55, .15));
  const busY = .48;
  const bus = at(box(1.6, .04, .04, M(0xd98c5f, { m: .85, r: .3 })), .2, busY, .2); enc.add(bus);
  const wm = new THREE.Group(); root.add(wm); wm.position.set(1.4, 0, .55);
  const body = at(box(.75, .9, .65, M(0xf4f5f7, { m: .25, r: .35 })), 0, .45, 0); wm.add(body);
  const drum = new THREE.Mesh(new THREE.TorusGeometry(.2, .04, 12, 32), M(0x9aa3ad, { m: .7 })); wm.add(at(drum, 0, .48, .33));
  wm.add(at(new THREE.Mesh(new THREE.CircleGeometry(.19, 32), M(0x2a3a4d, { opacity: .7 })), 0, .48, .331));
  const bodyMat = body.material;
  const rodM = M(0xd98c5f, { m: .85, r: .35 });
  const rod = at(cyl(.035, .035, 1.25, rodM, 12), -1.6, -.6, .4); root.add(rod);
  const encP = v => enc.localToWorld(v.clone());
  enc.updateMatrixWorld(true);
  const ePt = encP(V(.95, -.55, .14)), nPt = encP(V(-.95, -.55, .14));
  const tline = (pts, col, r = .025) => { const c = CR(pts); const m = tube(c, r, M(col, { r: .45 }), 64); root.add(m); return { c, m }; };
  const earthW = tline([ePt, V(ePt.x, .6, -.3), V(-1.6, .3, -.3), V(-1.6, .05, .4)], COL.E, .03);
  const outs = mcbs.map((b, i) => { const p = encP(V(-.15 + i * .38, -.28, .3)); return p; });
  const feedTop = encP(V(-.95, .38, .3));
  const inW = tline([V(-.95 - .55, 3.0, -.4), V(feedTop.x, 2.6, -.25), feedTop], 0x22262c, .04);
  const toWM = tline([outs[1], V(outs[1].x, .9, -.3), V(1.0, .9, -.1), V(1.4, .7, .2)], COL.L, .03);
  const wmEarth = tline([V(1.45, .65, .2), V(1.0, .75, -.25), V(ePt.x + .1, ePt.y - .1, -.25), ePt], COL.E, .022);
  const stubs = [0, 2, 3].map(i => tline([outs[i], V(outs[i].x, outs[i].y - .35, -.32)], COL.L, .025));
  root.add(at(label(L('من العداد', 'From meter'), '#ffffff', .13), -1.5, 2.85, -.3));
  part('main', main.group, V(0, .35, .1), L('المفتاح العمومي', 'Main switch'), L('بيفصل البيت كله مرة واحدة.', 'Cuts power to the whole house at once.'));
  part('rcd', rcd.group, V(0, .35, .1), L('قاطع التسريب RCD', 'RCD'), L('بيقارن التيار الداخل بالراجع. فرق 30 مللي أمبير يفصل. دوس عليه عشان زرار الاختبار.', 'Compares current going out with current coming back; a 30 mA difference trips it. Tap to press its test button.'));
  part('mcb', mcbs[2].group, V(0, .35, .1), L('القواطع الفرعية MCB', 'Circuit breakers (MCB)'), L('قاطع لكل دايرة. بيفصل لو حصل حمل زيادة أو قصر. دوس عليه.', 'One per circuit; trips on overload or short circuit. Tap it.'));
  part('bars', nBar, V(0, .1, .05), L('قضيب النيوترال والأرضي', 'Neutral and earth bars'), L('الأزرق بيجمع كل النيوترالات، والأخضر بيجمع كل الأرضيات.', 'The blue bar joins all neutrals; the green joins all earths.'));
  part('appliance', wm, V(0, 1.0, 0), L('غسالة بجسم معدن', 'Washing machine (metal body)'), L('جسمها متوصل بسلك الأرضي.', 'Its body is bonded to the earth wire.'));
  part('rod', rod, V(0, .65, 0), L('قطب الأرضي', 'Earth rod'), L('عمود نحاس مدفون في الأرض، وكل الأرضيات بتنزل عليه.', 'A copper rod buried in the ground; every earth wire ends here.'));
  const tester = new THREE.Group(); tester.position.set(-.4, 0, 1.3); root.add(tester);
  tester.add(at(box(.5, .22, .38, M(0xf2c418, { r: .5 })), 0, .11, 0));
  const tp = makePanel(.3, .12, { font: 'bold 56px monospace' }); tp.mesh.rotation.x = -Math.PI / 2; tester.add(at(tp.mesh, 0, .225, -.06)); tp.setText('2.4 Ω');
  const stakes = [-1.6, .5, 1.75].map((x, i) => { const s = at(cyl(.02, .02, .55, M(0xc9ced6, { m: .9 }), 8), x, i ? .05 : .1, i ? 1.3 : .4); if(i) root.add(s); return s; });
  const leads = [[-1.6, .1, .4], [.5, .25, 1.3], [1.75, .25, 1.3]].map((p, i) => tline([V(-.4 + (i - 1) * .12, .2, 1.3), V((p[0] - .4) / 2, .35, 1.35), V(...p)], [0x5aaa36, 0xf2c418, 0xd23a2e][i], .012));
  const testerGroup = [tester, stakes[1], stakes[2], ...leads.map(l => l.m)];
  testerGroup.forEach(o => { o.userData.noFit = true; o.traverse(n => n.userData.noFit = true); });
  [['E', -1.6, .75, .4], ['P', .5, .45, 1.3], ['C', 1.75, .45, 1.3]].forEach(([k, x, y, z]) => { const s = label(k, '#ffd34d', .14); s.position.set(x, y, z); testerGroup.push(s); root.add(s); });
  part('tester', tester, V(0, .35, 0), L('جهاز قياس الأرضي', 'Earth tester'), L('3 أطراف: E على القطب، وP وC على أوتاد بعيد عنه.', '3 leads: E to the rod, P and C to stakes away from it.'));
  const fIn = new Flow(root, chain(inW.c), { count: 12, speed: 1 });
  const fWM = new Flow(root, chain(toWM.c), { count: 12, speed: 1 });
  const fSt = stubs.map(s => new Flow(root, chain(s.c), { count: 4, speed: .8 }));
  const fFault = new Flow(root, chain(CR([V(1.4, .7, .2), V(1.45, .65, .2)]), wmEarth.c, earthW.c, CR([V(-1.6, .05, .4), V(-1.6, -1.1, .4)])), { count: 30, speed: 1.4, color: 0xff4a3a });
  const st = { step: 0, main: 1, rcd: 1, mcb: [1, 1, 1, 1], fault: 0, earth: 1, tester: 0 };
  let tripT = -1, t = 0;
  function powered(i){ return st.main && st.rcd && st.mcb[i]; }
  function derive(){
    main.set(st.main); rcd.set(st.rcd); mcbs.forEach((b, i) => b.set(st.mcb[i]));
    fIn.target = st.main ? 1 : 0; fWM.target = powered(1) ? 1 : 0; fSt.forEach((f, k) => f.target = powered([0, 2, 3][k]) ? 1 : 0);
    fFault.target = st.fault && st.earth && st.rcd ? 1 : 0;
    earthW.m.visible = !!st.earth; wmEarth.m.visible = !!st.earth;
    testerGroup.forEach(o => o.visible = !!st.tester);
  }
  ctx.parts.mcb.tap = () => { st.mcb[2] ^= 1; derive(); return st.mcb[2] ? L('قاطع التكييف رجع.', 'A/C breaker reset.') : L('قاطع التكييف فصل لوحده، والباقي شغال.', 'Only the A/C breaker tripped; the rest stay on.'); };
  ctx.parts.rcd.tap = () => { if(st.rcd){ st.rcd = 0; derive(); return L('زرار الاختبار عمل تسريب صناعي، والقاطع فصل. كده سليم.', 'The test button made an artificial leak and it tripped. It works.'); } st.rcd = 1; st.fault = 0; derive(); return L('القاطع رجع.', 'RCD reset.'); };
  ctx.parts.main.tap = () => { st.main ^= 1; derive(); return st.main ? L('العمومي رجع.', 'Main back on.') : L('العمومي فصل البيت كله.', 'Main off: whole house dead.'); };
  return {
    ...ctx, view: V(.25, .55, 1.6), sway: true, hint: L('دوس على أي قاطع · صباعين للتقريب', 'Tap any breaker · pinch to zoom'),
    steps: [
      { title: L('لوحة التوزيع', 'The distribution board'), text: L('الكهربا جاية من العداد على المفتاح العمومي، وبعده قاطع التسريب، وبعده قاطع صغير لكل دايرة في البيت. تحت فيه قضيب النيوترال الأزرق وقضيب الأرضي الأخضر.', 'Power comes from the meter to the main switch, then the RCD, then one small breaker per house circuit. Below are the blue neutral bar and the green earth bar.'), s: { step: 0 } },
      { title: L('التشغيل العادي', 'Normal operation'), text: L('كل القواطع مقفولة، والتيار ماشي من العمومي لكل الدواير. الغسالة شغالة على دايرة البرايز.', 'All breakers on; current flows from the main to every circuit. The washing machine runs on the sockets circuit.'), focus: 'main', s: { step: 1 } },
      { title: L('حمل زيادة أو قصر', 'Overload or short circuit'), text: L('لو دايرة التكييف سحبت أكتر من 20 أمبير، القاطع بتاعها بس بيفصل والباقي شغال. القاطع الصغير جواه جزء حراري للحمل الزيادة البطيء، وجزء مغناطيسي بيفصل في لحظة لو حصل قصر.', 'If the A/C circuit draws over 20 A, only its breaker trips and the rest keep working. The MCB has a thermal part for slow overloads and a magnetic part that trips instantly on a short.'), focus: 'mcb', s: { step: 2, mcb: [1, 1, 0, 1] } },
      { title: L('تسريب والأرضي سليم', 'A leak with a good earth'), text: L('سلك فاز لمس جسم الغسالة. الجسم متوصل بالأرضي، فالتيار نزل الأرض على طول (النقط الحمرا). قاطع التسريب حس إن التيار الراجع أقل من الداخل بأكتر من 30 مللي أمبير، ففصل في أقل من 0.03 ثانية.', 'A phase wire touched the washer\'s metal body. The body is earthed, so the current runs to ground (red dots). The RCD sees more than 30 mA missing on the return and trips in under 0.03 s.'), focus: 'rcd', s: { step: 3, fault: 1 } },
      { title: L('تسريب والأرضي مقطوع', 'A leak with a broken earth'), text: L('من غير أرضي، الجسم بيفضل عليه 220 فولت ومفيش حاجة تفصل، والجسم بيبان سليم. أول ما حد يلمسه التيار هيعدّي في جسمه للأرض. قاطع التسريب هيفصل ساعتها، لكن بعد ما الشخص اتكهرب. عشان كده لازم الاتنين: الأرضي وقاطع التسريب.', 'Without earth the body sits at 220 V and nothing trips; it looks fine. The moment someone touches it, current passes through them to ground. The RCD trips then, but only after the shock. That is why you need both: earth and RCD.'), focus: 'appliance', s: { step: 4, fault: 1, earth: 0 } },
      { title: L('زرار الاختبار', 'The test button'), text: L('على قاطع التسريب زرار T. لما تدوس عليه بيعمل تسريب صغير جوه، والمفروض القاطع يفصل على طول. اختبره مرة كل شهر، ولو ما فصلش يبقى لازم يتغير. دوس على القاطع وجرّب.', 'The RCD has a T button. Pressing it creates a small internal leak, and the RCD should trip at once. Test it monthly; if it does not trip, replace it. Tap the RCD to try.'), focus: 'rcd', s: { step: 5 } },
      { title: L('قياس مقاومة الأرضي', 'Measuring earth resistance'), text: L('جهاز قياس الأرضي ليه 3 أطراف على خط مستقيم: E على قطب الأرضي، وP على وتد على بعد 5 لـ 10 متر، وC على وتد أبعد (10 لـ 20 متر). الجهاز بيبعت تيار ويقيس المقاومة: كل ما تقل أحسن، والرقم الشائع المطلوب للمباني السكنية 5 أوم أو أقل.', 'An earth tester has 3 leads in a straight line: E on the earth rod, P on a stake 5–10 m away, C on a farther stake (10–20 m). It injects current and reads resistance: lower is better, and a common target for homes is 5 Ω or less.'), focus: 'tester', s: { step: 6, tester: 1 } }
    ],
    apply(s){ Object.assign(st, { main: 1, rcd: 1, mcb: [1, 1, 1, 1], fault: 0, earth: 1, tester: 0 }, s); st.mcb = [...st.mcb]; tripT = st.fault && st.earth ? 1.2 : -1; t = 0; derive(); },
    update(dt){
      t += dt; if(tripT > 0 && t > tripT){ tripT = -1; st.rcd = 0; derive(); showToast(L('قاطع التسريب فصل.', 'The RCD tripped.')); }
      main.update(dt); rcd.update(dt); mcbs.forEach(b => b.update(dt));
      [fIn, fWM, fFault, ...fSt].forEach(f => f.update(dt));
      const live = st.fault && (!st.earth || st.rcd) ? .55 + .35 * Math.sin(t * 6) : 0;
      setGlow(bodyMat, st.step === 4 ? live : (st.fault && st.rcd ? .3 : 0));
    }
  };
}

/* ---------- رحلة الكهربا من المحطة للبيت ---------- */
function buildPowerJourney(){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(at(box(8.2, .08, 3.2, M(0x8fae6e, { r: .95 })), 0, -.04, 0));
  root.add(at(shadowPlane(10, 4.5), 0, -.09, 0));
  const steel = M(0x9aa3ad, { m: .7, r: .35 }), conc = M(0xc9c4b8, { r: .85 });
  const plant = new THREE.Group(); plant.position.set(-3.4, 0, -.3); root.add(plant);
  plant.add(at(box(1.0, .6, .7, conc), 0, .3, 0));
  [[-.3, .6], [.3, .6]].forEach(([x, z]) => plant.add(at(cyl(.22, .3, .9, M(0xd8d4cc, { r: .8 }), 24), x, .45, z)));
  plant.add(at(cyl(.06, .06, 1.1, M(0xb04a3a, { r: .6 }), 12), .35, .85, -.15));
  const gen = at(cyl(.14, .14, .5, M(0x2a62c9, { m: .5, r: .35 }), 20), 0, .75, -.1); gen.rotation.z = Math.PI / 2; plant.add(gen);
  const solar = new THREE.Group(); solar.position.set(-3.4, 0, 1.1); root.add(solar);
  for(let i = 0; i < 3; i++){ const p = at(box(.35, .02, .25, M(0x1d3c78, { m: .6, r: .25 })), -.4 + i * .4, .25, 0); p.rotation.x = -.5; solar.add(p); solar.add(at(cyl(.015, .015, .25, steel, 6), -.4 + i * .4, .12, 0)); }
  const wind = new THREE.Group(); wind.position.set(-2.4, 0, 1.15); root.add(wind);
  wind.add(at(cyl(.03, .05, 1.3, M(0xf2f3f5, { r: .5 }), 12), 0, .65, 0));
  const rotor = new THREE.Group(); rotor.position.set(0, 1.3, .06); wind.add(rotor);
  for(let i = 0; i < 3; i++){ const b = at(box(.05, .55, .015, M(0xf2f3f5, { r: .5 })), 0, .28, 0); const h = new THREE.Group(); h.rotation.z = i * Math.PI * 2 / 3; h.add(b); rotor.add(h); }
  const mkTrafo = (s, col = 0x7d8691) => { const g = new THREE.Group(); g.add(at(box(.5 * s, .45 * s, .4 * s, M(col, { m: .5, r: .45 })), 0, .225 * s, 0)); for(let i = -2; i <= 2; i++) g.add(at(box(.02 * s, .38 * s, .5 * s, M(col, { m: .5 })), i * .1 * s, .22 * s, 0)); [-.12, 0, .12].forEach(x => g.add(at(cyl(.025 * s, .035 * s, .22 * s, M(0x8a5a3a, { r: .5 }), 10), x * s, .55 * s, 0))); return g; };
  const up = mkTrafo(1); up.position.set(-2.4, 0, -.3); root.add(up);
  const towerXs = [-1.5, -.2, 1.1];
  const towers = towerXs.map(x => { const g = new THREE.Group(); g.position.set(x, 0, -.3); root.add(g);
    for(const [dx, dz] of [[-.12, -.12], [.12, -.12], [-.12, .12], [.12, .12]]){ const leg = cyl(.012, .012, 1.9, steel, 6); leg.position.set(dx * .6, .95, dz * .6); leg.rotation.set(dz * .35, 0, -dx * .35); g.add(leg); }
    [1.55, 1.8].forEach((y, i) => g.add(at(box(.9 - i * .25, .04, .05, steel), 0, y, 0))); g.add(at(cyl(.005, .03, .25, steel, 6), 0, 1.98, 0)); return g; });
  const sub = new THREE.Group(); sub.position.set(2.2, 0, -.3); root.add(sub);
  sub.add(at(box(1.0, .02, .9, M(0xa8a39a, { r: .9 })), 0, .01, 0)); const dn = mkTrafo(.85); sub.add(dn);
  [[-.45, -.4], [.45, -.4], [-.45, .4], [.45, .4]].forEach(([x, z]) => sub.add(at(cyl(.01, .01, .35, steel, 6), x, .18, z)));
  const pole = new THREE.Group(); pole.position.set(3.05, 0, .55); root.add(pole);
  pole.add(at(cyl(.035, .045, 1.5, M(0x8a8f96, { r: .7 }), 10), 0, .75, 0));
  const pt = mkTrafo(.45, 0x8d97a3); pt.position.set(.12, .9, 0); pole.add(pt);
  const house = new THREE.Group(); house.position.set(3.4, 0, 1.35); root.add(house);
  house.add(at(box(.75, .55, .6, M(0xe9d9bf, { r: .8 })), 0, .275, 0));
  const roof = new THREE.Mesh(new THREE.ConeGeometry(.6, .35, 4), M(0xb0503a, { r: .7 })); roof.rotation.y = Math.PI / 4; house.add(at(roof, 0, .72, 0));
  house.add(at(box(.14, .2, .04, M(0xf4f5f7, { r: .4 })), -.25, .32, .31));
  const lineAt = (x, y = 1.62) => V(x, y, -.3);
  const pts = [V(-3.4, .75, -.4), V(-2.9, .9, -.35), V(-2.4, .6, -.3), lineAt(-1.5), lineAt(-.85, 1.35), lineAt(-.2), lineAt(.45, 1.35), lineAt(1.1), V(1.7, 1.1, -.3), V(2.2, .55, -.3), V(2.7, .9, .1), V(3.12, 1.05, .55), V(3.3, .7, .9), V(3.15, .32, 1.66)];
  const path = CR(pts);
  const cable = tube(path, .012, M(0x2b2f38, { r: .5 }), 220); root.add(cable);
  const vColor = t => t < .2 ? C(0xffd34d) : t < .62 ? C(0xff5a3a) : t < .8 ? C(0xffa13a) : C(0x7fd36a);
  const flow = new ColorFlow(root, path, vColor, { count: 70, speed: 1.4, size: .035 });
  flow.target = 1;
  const tags = [[L('11 ك.ف', '11 kV'), -2.95, 1.3], [L('220 ك.ف', '220 kV'), -.2, 2.3], [L('11 ك.ف', '11 kV'), 2.2, 1.3], [L('380/220 ف', '380/220 V'), 3.3, 1.55]];
  const tagS = tags.map(([s, x, y]) => { const l = label(s, '#ffffff', .17); l.position.set(x, y, -.25); root.add(l); return l; });
  part('plant', plant, V(0, 1.1, 0), L('محطة التوليد', 'Power station'), L('بتحوّل حرارة الوقود أو حركة المية لكهربا عن طريق مولد.', 'Turns fuel heat or moving water into electricity with a generator.'));
  part('renew', wind, V(0, 1.7, 0), L('طاقة متجددة', 'Renewables'), L('ألواح شمسية وتوربينات رياح بتضيف كهربا للشبكة.', 'Solar panels and wind turbines feed the same grid.'));
  part('up', up, V(0, .8, 0), L('محول رفع الجهد', 'Step-up transformer'), L('بيرفع الجهد من 11 ك.ف لـ 220 أو 500 ك.ف.', 'Raises 11 kV to 220 or 500 kV.'));
  part('line', towers[1], V(0, 2.1, 0), L('خطوط النقل', 'Transmission lines'), L('أبراج بتنقل الكهربا مسافات طويلة على جهد عالي جدًا.', 'Towers carry power long distances at very high voltage.'));
  part('sub', sub, V(0, .7, 0), L('محطة المحولات', 'Substation'), L('بتنزّل الجهد على مراحل لـ 66 ثم 11 ك.ف.', 'Steps voltage down in stages to 66 then 11 kV.'));
  part('pole', pole, V(0, 1.6, 0), L('محول التوزيع', 'Distribution transformer'), L('آخر محول: من 11 ك.ف لـ 380/220 فولت.', 'The last transformer: 11 kV down to 380/220 V.'));
  part('house', house, V(0, .95, 0), L('البيت', 'The house'), L('الكهربا بتدخل على العداد ثم لوحة التوزيع.', 'Power enters the meter, then the distribution board.'));
  const st = { step: 0 };
  return {
    ...ctx, view: V(.05, .75, 1.6), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب · دوس على رقم', 'Drag to rotate · pinch to zoom · tap a number'),
    steps: [
      { title: L('رحلة الكهربا', 'The journey of electricity'), text: L('الكهربا اللي في البريزة اتولدت في محطة بعيدة، ومشيت مئات الكيلومترات، وجهدها اتغيّر كذا مرة قبل ما توصل. لون النقط بيتغير مع الجهد في كل مرحلة.', 'The power in your socket was generated far away, travelled hundreds of kilometres and changed voltage several times on the way. The dots change colour with the voltage at each stage.'), s: { step: 0 } },
      { title: L('مصادر التوليد', 'Generation'), text: L('محطات حرارية بتحرق غاز أو مازوت عشان تعمل بخار يلف توربينة، ومحطات مائية زي السد العالي بتلف التوربينة بالمية. التوربينة بتلف المولد فيطلّع كهربا جهدها حوالي 11 لـ 22 ك.ف.', 'Thermal plants burn gas or oil to make steam that spins a turbine; hydro plants like the High Dam spin it with water. The turbine turns a generator, producing about 11–22 kV.'), focus: 'plant', s: { step: 1 } },
      { title: L('الطاقة المتجددة', 'Renewable energy'), text: L('ألواح شمسية بتحوّل ضوء الشمس لكهربا مباشرة، وتوربينات رياح بتلف مولد بالهوا. الاتنين بيتربطوا على نفس الشبكة.', 'Solar panels convert sunlight straight into electricity; wind turbines spin a generator with the wind. Both connect to the same grid.'), focus: 'renew', s: { step: 2 } },
      { title: L('رفع الجهد', 'Stepping up'), text: L('محول الرفع بيرفع الجهد لـ 220 أو 500 ك.ف. ليه؟ نفس القدرة بجهد أعلى معناها تيار أقل، والفقد في الأسلاك بيتناسب مع مربع التيار. فالجهد العالي بيوفّر الكهربا اللي كانت هتضيع حرارة.', 'The step-up transformer raises it to 220 or 500 kV. Why? The same power at higher voltage means less current, and line losses grow with the square of the current. High voltage saves energy that would be lost as heat.'), focus: 'up', s: { step: 3 } },
      { title: L('خطوط النقل', 'Transmission'), text: L('الأبراج العالية شايلة الأسلاك بعيد عن الناس وعن بعضها بسبب الجهد العالي جدًا. الأسلاك عارية من غير عزل، والعزل هو الهوا والعوازل الخزف أو الزجاج اللي على الأبراج.', 'Tall towers hold the conductors far from people and from each other because of the very high voltage. The wires are bare; the insulation is the air and the porcelain or glass insulators on the towers.'), focus: 'line', s: { step: 4 } },
      { title: L('محطة المحولات', 'The substation'), text: L('قرب المدن، محطات المحولات بتنزّل الجهد على مراحل: من 220 لـ 66 ك.ف، وبعدين لـ 22 أو 11 ك.ف عشان يمشي في كابلات الأحياء.', 'Near cities, substations step the voltage down in stages: from 220 to 66 kV, then to 22 or 11 kV for the neighbourhood cables.'), focus: 'sub', s: { step: 5 } },
      { title: L('محول التوزيع', 'The distribution transformer'), text: L('آخر محول، على عمود أو في كشك جنب البيوت، بينزّل من 11 ك.ف لـ 380 فولت بين الفازات و220 فولت بين الفاز والنيوترال. ده الجهد اللي بيوصل البيوت.', 'The last transformer, on a pole or in a kiosk near the houses, steps 11 kV down to 380 V between phases and 220 V phase-to-neutral. That is what reaches homes.'), focus: 'pole', s: { step: 6 } },
      { title: L('جوه البيت', 'Inside the house'), text: L('الكابل بيدخل على العداد اللي بيحسب الاستهلاك بالكيلووات ساعة، وبعده على لوحة التوزيع اللي فيها القواطع، ومنها لكل دواير البيت.', 'The cable enters the meter, which counts consumption in kilowatt-hours, then the distribution board with its breakers, and from there every circuit in the house.'), focus: 'house', s: { step: 7 } }
    ],
    apply(s){ st.step = s.step; tagS.forEach((l, i) => l.visible = s.step === 0 || [[1, 2], [3, 4], [5], [6, 7]][i].includes(s.step)); },
    update(dt){ flow.update(dt); rotor.rotation.z -= dt * 1.6; }
  };
}



/* ================= مشاهد حقيقية: السلم والنجفة ================= */
function makeXray(){
  const mats = [], hidden = [];
  let on = 0;
  return {
    wall(m){ mats.push(m); return m; }, inside(o){ hidden.push(o); o.visible = false; return o; },
    get on(){ return !!on; },
    set(v){ on = v ? 1 : 0; mats.forEach(m => { m.transparent = !!on; m.opacity = on ? .18 : 1; m.depthWrite = !on; m.needsUpdate = true; }); hidden.forEach(o => o.visible = !!on); }
  };
}
// مفتاح حيطة بزرار أو أكتر (قلّاب)
function makeWallSwitch(n, tags = []){
  const g = new THREE.Group();
  const w = .14 + n * .1;
  g.add(at(box(w, .16, .025, M(0xf4f5f7, { r: .35 })), 0, 0, .012));
  const rockers = [];
  for(let i = 0; i < n; i++){
    const p = new THREE.Group(); p.position.set((i - (n - 1) / 2) * .1, 0, .03); g.add(p);
    p.add(at(box(.08, .12, .02, M(0xe6e8ec, { r: .3 })), 0, 0, 0));
    p.add(at(box(.03, .01, .022, M(0x9aa0aa, { r: .4 })), 0, .035, .001));
    if(tags[i]) g.add(at(label(tags[i], '#ffd34d', .07), p.position.x, .13, .04));
    let a = .12, t = .12; rockers.push({ set(v){ t = v ? -.12 : .12; }, update(dt){ a = ease(a, t, dt, 10); p.rotation.x = a; } });
  }
  return { group: g, set(i, v){ rockers[i].set(v); }, update(dt){ rockers.forEach(r => r.update(dt)); } };
}
function wirePath(pts, col, r = .012){ const p = polyPath(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(p, Math.max(30, pts.length * 30), r, 8, false), M(col, { r: .45 })); return { p, m }; }
function conduitPath(pts, r = .035){ const p = polyPath(pts); const m = new THREE.Mesh(new THREE.TubeGeometry(p, Math.max(30, pts.length * 30), r, 12, false), M(0xbfc4cb, { r: .5, opacity: .35 })); return m; }
function makeGlassBulb(scale = 1){
  const g = new THREE.Group();
  const glassM = M(0xfff4d6, { r: .08, opacity: .55 });
  const s = new THREE.Mesh(new THREE.SphereGeometry(.07 * scale, 20, 16), glassM); s.scale.y = 1.35; g.add(s);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffc65a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); g.add(glow);
  const light = new THREE.PointLight(0xffc06a, 0, 4.5, 1.6); g.add(light);
  let lv = 0, tg = 0;
  return { group: g, set(v){ tg = v; }, update(dt){ lv = ease(lv, tg, dt, 6); baseE(glassM).setRGB(1, .75, .35).multiplyScalar(lv * 1.4); glassM.userData.baseI = 1; glow.material.opacity = lv * .9; glow.scale.setScalar(.25 + .7 * lv * scale); light.intensity = 3.2 * lv; } };
}

/* ---------- لمبة من مكانين على السلم ---------- */
function buildStairs(){
  const ctx = makeCtx(), { root, part } = ctx, X = makeXray();
  const floorM = M(0xcbb79a, { r: .85 }), stepM = M(0xe3dccf, { r: .7 }), wallM = X.wall(M(0xeee9df, { r: .95 }));
  root.add(at(box(2.6, .1, 1.6, floorM), -1.3, -.05, 0));
  root.add(at(box(1.4, .12, 1.6, floorM), 2.0, 1.54, 0));
  root.add(at(box(1.4, 1.48, .4, M(0xd9d1c2, { r: .9 })), 2.0, .74, -.6));
  const N = 10, rise = 1.6 / N, run = 2.2 / N;
  for(let i = 0; i < N; i++) root.add(at(box(run + .01, rise * (i + 1), 1.0, stepM), -.9 + run * (i + .5), rise * (i + 1) / 2, .05));
  const wall = at(box(5.2, 3.3, .08, wallM), .0, 1.65, -.84); root.add(wall);
  const rail = M(0x7a5233, { r: .5 }), postM = M(0x3b3f46, { m: .6, r: .4 });
  for(let i = 0; i <= N; i += 2){ const x = -.9 + run * i, y = rise * i; root.add(at(cyl(.015, .015, .9, postM, 8), x, y + .45, .55)); }
  root.add(tube(new THREE.LineCurve3(V(-.9, .9, .55), V(1.3, 2.5, .55)), .03, rail, 20));
  root.add(at(shadowPlane(6, 3), .3, -.12, 0));
  const s1 = makeWallSwitch(1), s2 = makeWallSwitch(1);
  at(s1.group, -1.5, 1.1, -.8); root.add(s1.group);
  at(s2.group, 1.8, 2.7, -.8); root.add(s2.group); s1.group.scale.setScalar(1.7); s2.group.scale.setScalar(1.7);
  const lampG = new THREE.Group(); lampG.position.set(.15, 2.62, -.72); root.add(lampG);
  lampG.add(at(box(.16, .05, .08, M(0x8a8f96, { m: .6 })), 0, .06, -.04));
  const bulb = makeGlassBulb(1.6); lampG.add(bulb.group);
  const Z = -.79;
  const P = (x, y) => V(x, y, Z);
  const travY = [3.03, 3.09];
  const wL = wirePath([P(-2.5, 3.0), P(-1.53, 3.0), P(-1.53, 1.13)], COL.L);
  const wT = [0, 1].map(i => wirePath([P(-1.5 + i * .04, 1.13), P(-1.5 + i * .04, travY[i]), P(1.78 + i * .04, travY[i]), P(1.78 + i * .04, 2.73)], i ? COL.T2 : COL.T1));
  const wOut = wirePath([P(1.86, 2.73), P(1.86, 2.95), P(.18, 2.95), P(.18, 2.66)], COL.L);
  const wN = wirePath([P(-2.5, 3.15), P(.12, 3.15), P(.12, 2.66)], COL.N);
  const cond = new THREE.Group(); root.add(cond); X.inside(cond);
  [conduitPath([P(-2.5, 3.08), P(1.82, 3.08)], .07), conduitPath([P(-1.51, 1.15), P(-1.51, 3.08)]), conduitPath([P(1.82, 2.75), P(1.82, 3.08)]), conduitPath([P(.15, 2.68), P(.15, 3.08)])].forEach(m => cond.add(m));
  [wL, ...wT, wOut, wN].forEach(w => cond.add(w.m));
  [[-1.5, 1.1], [1.8, 2.7]].forEach(([x, y]) => cond.add(at(box(.12, .12, .05, M(0x4a5060, { r: .6 })), x, y, Z - .01)));
  cond.add(at(label(L('من اللوحة', 'From the board'), '#ffffff', .12), -2.2, 3.28, Z));
  [['C', -1.53, 1.0], ['L1', -1.47, 1.0], ['L2', -1.42, 1.0], ['C', 1.86, 2.57], ['L1', 1.78, 2.57], ['L2', 1.82, 2.57]];
  part('s1', s1.group, V(0, .16, .02), L('المفتاح التحتاني', 'Bottom switch'), L('مفتاح تحويلة على أول السلم. دوس عليه.', 'A two-way switch at the foot of the stairs. Tap it.'));
  part('s2', s2.group, V(0, .16, .02), L('المفتاح الفوقاني', 'Top switch'), L('مفتاح تحويلة على آخر السلم. دوس عليه.', 'A two-way switch at the top of the stairs. Tap it.'));
  part('lamp', lampG, V(0, .2, .1), L('لمبة السلم', 'Stair lamp'), L('بتنوّر من أي مفتاح فيهم.', 'Either switch turns it on or off.'));
  part('wall', wall, V(-.6, .9, .06), L('الحيطة', 'The wall'), L('دوس عليها عشان تشوف الأسلاك اللي جواها.', 'Tap it to see the wiring inside.'));
  const trav = cond; part('trav', trav, P(.4, 3.1), L('المراسلات', 'Travellers'), L('سلكين بين المفتاحين جوه الماسورة. اللي عليه كهربا بينوّر أحمر.', 'Two wires between the switches inside the conduit. The live one glows red.'));
  const st = { a: 0, b: 1, x: 0 };
  let flow = null, lastKey = '';
  function derive(){
    s1.set(0, st.a); s2.set(0, st.b); X.set(st.x);
    wT.forEach((w, i) => setGlow(w.m.material, i === st.a ? .6 : 0));
    const closed = st.a === st.b; bulb.set(closed ? 1 : 0);
    const key = closed + ':' + st.a + st.x;
    if(key !== lastKey){ dropFlow(root, flow); flow = closed && st.x ? new Flow(root, chain(wL.p, wT[st.a].p, wOut.p), { count: 40, speed: 1.4, size: .03 }) : null; if(flow){ flow.level = .05; flow.target = 1; } lastKey = key; }
    return closed;
  }
  const say = c => c ? L('لمبة السلم نوّرت.', 'Stair lamp on.') : L('لمبة السلم طفت.', 'Stair lamp off.');
  ctx.parts.s1.tap = () => { st.a ^= 1; return say(derive()); };
  ctx.parts.s2.tap = () => { st.b ^= 1; return say(derive()); };
  ctx.parts.lamp.tap = () => { st.b ^= 1; return say(derive()); };
  const xr = () => { st.x ^= 1; derive(); return st.x ? L('الحيطة بقت شفافة: دي الأسلاك جوه المواسير.', 'The wall is see-through: here is the wiring in its conduit.') : L('الحيطة رجعت عادي.', 'Wall back to normal.'); };
  ctx.parts.wall.tap = xr; ctx.parts.trav.tap = xr;
  return {
    ...ctx, view: V(.12, .3, 1.6), sway: true, xray: { get on(){ return !!st.x; }, toggle(){ return xr(); } },
    hint: L('دوس على المفتاحين أو على الحيطة · صباعين للتقريب', 'Tap the switches or the wall · pinch to zoom'),
    steps: [
      { title: L('لمبة السلم من مكانين', 'A stair lamp from two places'), text: L('حد طالع السلم بالليل: بيولّع النور من المفتاح اللي تحت، ولما يوصل فوق يطفيه من المفتاح اللي فوق. ده بيحتاج مفتاحين تحويلة (Two-way) بدل المفتاح العادي.', 'Someone climbing at night switches the light on at the bottom and off at the top. That needs two two-way switches instead of an ordinary one.'), s: { a: 0, b: 1, x: 0 } },
      { title: L('من تحت: ولّع', 'At the bottom: on'), text: L('دوس على المفتاح التحتاني: اللمبة نوّرت والسلم كله بان.', 'Press the bottom switch: the lamp lights the whole staircase.'), focus: 's1', s: { a: 1, b: 1, x: 0 } },
      { title: L('من فوق: اطفي', 'At the top: off'), text: L('لما توصل فوق، دوس على المفتاح الفوقاني: اللمبة طفت. وتقدر تولّعها تاني من أي مفتاح فيهم.', 'At the top, press the top switch: the lamp goes off. Either switch can turn it back on.'), focus: 's2', s: { a: 1, b: 0, x: 0 } },
      { title: L('جوه الحيطة', 'Inside the wall'), text: L('الحيطة بقت شفافة. الفاز (بني) جاي من اللوحة على مشترك المفتاح التحتاني. بين المفتاحين سلكين اسمهم المراسلات، ومن مشترك المفتاح الفوقاني طالع سلك للمبة. النيوترال (أزرق) رايح للمبة على طول من غير ما يعدّي على أي مفتاح.', 'The wall is now see-through. The phase (brown) comes from the board to the bottom switch\'s common. Two wires, the travellers, run between the switches, and the top switch\'s common feeds the lamp. The neutral (blue) goes straight to the lamp without touching any switch.'), focus: 'trav', s: { a: 0, b: 1, x: 1 } },
      { title: L('المراسل اللي عليه كهربا', 'The live traveller'), text: L('المفتاح التحتاني بيحط الفاز على مراسل واحد بس، وده اللي بينوّر أحمر. لو المفتاح الفوقاني واقف على نفس المراسل، الدايرة بتقفل والتيار بيمشي (النقط الصفرا). لو على المراسل التاني، الدايرة مفتوحة.', 'The bottom switch puts the phase on one traveller only, glowing red. If the top switch sits on that same traveller, the circuit closes and current flows (yellow dots). If it sits on the other one, the circuit is open.'), focus: 'trav', s: { a: 0, b: 0, x: 1 } },
      { title: L('جرّب بنفسك', 'Try it yourself'), text: L('دوس على المفتاحين وانت شايف الأسلاك، وراقب المراسل الأحمر بيتنقل. ودوس على الحيطة عشان ترجّعها عادي.', 'Tap both switches while the wiring is visible and watch the red traveller move. Tap the wall to make it solid again.'), focus: 's1', s: { a: 1, b: 0, x: 1 } }
    ],
    apply(s){ Object.assign(st, s); derive(); },
    update(dt){ s1.update(dt); s2.update(dt); bulb.update(dt); if(flow) flow.update(dt); }
  };
}

/* ---------- النجفة في الصالة ---------- */
function buildChandelierRoom(){
  const ctx = makeCtx(), { root, part } = ctx, X = makeXray();
  const H = 2.7;
  root.add(at(box(4.2, .1, 3.0, M(0xb08a5e, { r: .7 })), 0, -.05, 0));
  root.add(at(box(2.2, .015, 1.4, M(0x7a2f3a, { r: .95 })), .2, .01, .2));
  const wallM = X.wall(M(0xe7e1d6, { r: .95 })), sideM = X.wall(M(0xdcd5c8, { r: .95 })), ceilM = X.wall(M(0xf3f1ec, { r: .95 }));
  const back = at(box(4.2, H, .08, wallM), 0, H / 2, -1.5); root.add(back);
  const side = at(box(.08, H, 3.0, sideM), -2.1, H / 2, 0); root.add(side);
  const ceil = at(box(4.2, .08, 1.6, ceilM), 0, H + .04, -.7); root.add(ceil);
  side.add(at(box(.02, 2.1, .95, M(0x7a5233, { r: .55 })), .05, -.3, .75));
  side.add(at(box(.025, 1.95, .8, M(0xa77a4f, { r: .55 })), .06, -.38, .75));
  const sofa = new THREE.Group(); sofa.position.set(.3, 0, -1.05); root.add(sofa);
  const fab = M(0x46607a, { r: .9 });
  sofa.add(at(box(1.8, .38, .7, fab), 0, .25, 0)); sofa.add(at(box(1.8, .45, .18, fab), 0, .62, -.27));
  [-1, 1].forEach(s => sofa.add(at(box(.18, .55, .7, fab), s * .9, .32, 0)));
  root.add(at(box(.9, .05, .5, M(0x5a3b24, { r: .5 })), .3, .42, .25)); [[-.4, -.2], [.4, -.2], [-.4, .2], [.4, .2]].forEach(([x, z]) => root.add(at(cyl(.025, .025, .4, M(0x3a2616), 8), .3 + x, .2, .25 + z)));
  root.add(at(shadowPlane(6, 4), 0, -.11, 0));
  const ch = new THREE.Group(); ch.position.set(.3, 0, -.1); root.add(ch);
  const brass = M(0xc9a14a, { m: .9, r: .28 });
  for(let i = 0; i < 7; i++){ const lk = new THREE.Mesh(new THREE.TorusGeometry(.03, .008, 6, 14), brass); lk.position.set(0, H - .04 - i * .055, 0); lk.rotation.y = i % 2 ? Math.PI / 2 : 0; ch.add(lk); }
  ch.add(at(cyl(.12, .12, .03, brass, 24), 0, H - .01, 0));
  const hubY = H - .55;
  ch.add(at(new THREE.Mesh(new THREE.SphereGeometry(.1, 24, 16), brass), 0, hubY, 0));
  ch.add(at(cyl(.03, .1, .25, brass, 20), 0, hubY - .17, 0));
  ch.add(at(new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 12), brass), 0, hubY - .32, 0));
  const crystM = M(0xe8f2ff, { r: .05, m: .1, opacity: .65 });
  for(let i = 0; i < 10; i++){ const a = i / 10 * Math.PI * 2; const c = new THREE.Mesh(new THREE.OctahedronGeometry(.025), crystM); c.scale.y = 1.8; c.position.set(Math.cos(a) * .16, hubY - .12 - (i % 2) * .05, Math.sin(a) * .16); ch.add(c); }
  const arms = [], bulbs = [], groupObj = [new THREE.Group(), new THREE.Group()]; groupObj.forEach(g => ch.add(g));
  const R = .55;
  for(let i = 0; i < 5; i++){
    const a = -Math.PI / 2 + i / 5 * Math.PI * 2, cx = Math.cos(a) * R, cz = Math.sin(a) * R;
    const grp = i < 2 ? groupObj[0] : groupObj[1];
    grp.add(tube(CR([V(Math.cos(a) * .08, hubY - .02, Math.sin(a) * .08), V(Math.cos(a) * .28, hubY - .2, Math.sin(a) * .28), V(cx * .9, hubY - .1, cz * .9), V(cx, hubY + .05, cz)]), .014, brass, 40));
    grp.add(at(cyl(.06, .035, .06, brass, 18), cx, hubY + .08, cz));
    grp.add(at(cyl(.022, .022, .12, M(0xf7f3ea, { r: .6 }), 14), cx, hubY + .17, cz));
    const b = makeGlassBulb(.8); b.group.position.set(cx, hubY + .29, cz); grp.add(b.group); bulbs.push(b);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.06, .1, .14, 20, 1, true), M(0xf6efe0, { r: .3, opacity: .5, side: THREE.DoubleSide })); shade.position.set(cx, hubY + .3, cz); grp.add(shade);
    grp.add(at(label(i < 2 ? 'A' : 'B', i < 2 ? '#ffd34d' : '#7fd3ff', .08), cx, hubY + .48, cz));
  }
  const sw = makeWallSwitch(2, ['A', 'B']); sw.group.position.set(-2.05, 1.15, .1); sw.group.rotation.y = Math.PI / 2; sw.group.scale.setScalar(1.5); root.add(sw.group);
  const cond = new THREE.Group(); root.add(cond); X.inside(cond);
  const xw = -2.045, top = H - .03, cx0 = .3, cz0 = -.1;
  const wL = wirePath([V(xw, top, -1.45), V(xw, top, .07), V(xw, 1.18, .07)], COL.L);
  const wA = wirePath([V(xw, 1.18, .1), V(xw, top - .02, .1), V(cx0 - .02, top - .02, .1), V(cx0 - .02, top - .02, cz0), V(cx0 - .02, top - .2, cz0)], COL.L);
  const wB = wirePath([V(xw, 1.18, .13), V(xw, top - .05, .13), V(cx0 + .02, top - .05, .13), V(cx0 + .02, top - .05, cz0), V(cx0 + .02, top - .2, cz0)], 0xd06a2a);
  const wN = wirePath([V(xw, top - .08, -1.45), V(cx0, top - .08, -1.45), V(cx0, top - .08, cz0), V(cx0, top - .2, cz0)], COL.N);
  [wL, wA, wB, wN].forEach(w => cond.add(w.m));
  [conduitPath([V(xw, top - .04, -1.45), V(xw, top - .04, .1), V(xw, 1.18, .1)], .06), conduitPath([V(xw, top - .04, .11), V(cx0, top - .04, .11), V(cx0, top - .04, cz0)], .06), conduitPath([V(xw + .02, top - .06, -1.45), V(cx0, top - .06, -1.45), V(cx0, top - .06, cz0)], .05)].forEach(m => cond.add(m));
  cond.add(at(label(L('من اللوحة', 'From the board'), '#ffffff', .12), -1.7, top - .2, -1.4));
  cond.add(at(label('A', '#ffd34d', .1), -.8, top - .14, .1)); cond.add(at(label('B', '#ff9a5a', .1), -.8, top - .26, .13));
  part('chand', ch, V(0, hubY + .6, 0), L('النجفة', 'The chandelier'), L('5 أذرع على سلسلة من السقف. دوس عليها عشان تقلّب المجموعات.', '5 arms hung on a chain from the ceiling. Tap it to cycle the groups.'));
  part('groupA', groupObj[0], V(Math.cos(-Math.PI / 2 + Math.PI * .2) * R, hubY + .55, Math.sin(-Math.PI / 2 + Math.PI * .2) * R), L('المجموعة A (دراعين)', 'Group A (2 arms)'), L('بتنوّر من الزرار A. دوس عليها.', 'Lit by button A. Tap it.'));
  part('groupB', groupObj[1], V(Math.cos(-Math.PI / 2 + Math.PI * 1.2) * R, hubY + .55, Math.sin(-Math.PI / 2 + Math.PI * 1.2) * R), L('المجموعة B (3 أذرع)', 'Group B (3 arms)'), L('بتنوّر من الزرار B. دوس عليها.', 'Lit by button B. Tap it.'));
  part('switch', sw.group, V(0, .18, .03), L('المفتاح المزدوج', 'Double switch'), L('زرارين في علبة واحدة: A وB. دوس عليه.', 'Two buttons in one box: A and B. Tap it.'));
  part('wall', ceil, V(-.8, -.05, .5), L('السقف والحيطة', 'Ceiling and wall'), L('دوس عليهم عشان تشوف الأسلاك.', 'Tap to see the wiring.'));
  const st = { a: 0, b: 0, x: 0 };
  const fA = new Flow(root, chain(wL.p, wA.p), { count: 30, speed: 1.4, size: .025 });
  const fB = new Flow(root, chain(wL.p, wB.p), { count: 30, speed: 1.4, size: .025, color: 0xff9a3a });
  function derive(){ sw.set(0, st.a); sw.set(1, st.b); X.set(st.x); bulbs.forEach((b, i) => b.set((i < 2 ? st.a : st.b) ? 1 : 0)); fA.target = st.a && st.x ? 1 : 0; fB.target = st.b && st.x ? 1 : 0; return (st.a ? 2 : 0) + (st.b ? 3 : 0); }
  const sayN = n => n ? L(`منوّر ${n} لمبات.`, `${n} lamps on.`) : L('النجفة مطفية.', 'Chandelier off.');
  const cycle = () => { if(!st.a && !st.b) st.a = 1; else if(st.a && !st.b){ st.a = 0; st.b = 1; } else if(!st.a && st.b) st.a = 1; else { st.a = 0; st.b = 0; } return sayN(derive()); };
  ctx.parts.chand.tap = cycle; ctx.parts.switch.tap = cycle;
  ctx.parts.groupA.tap = () => { st.a ^= 1; return sayN(derive()); };
  ctx.parts.groupB.tap = () => { st.b ^= 1; return sayN(derive()); };
  const xr = () => { st.x ^= 1; derive(); return st.x ? L('السقف والحيطة بقوا شفافين: دي الأسلاك.', 'Ceiling and wall see-through: here is the wiring.') : L('رجعوا عادي.', 'Back to normal.'); };
  ctx.parts.wall.tap = xr;
  return {
    ...ctx, view: V(.18, .12, 1.6), sway: true, xray: { get on(){ return !!st.x; }, toggle(){ return xr(); } },
    hint: L('دوس على النجفة أو المفتاح أو السقف · صباعين للتقريب', 'Tap the chandelier, switch or ceiling · pinch to zoom'),
    steps: [
      { title: L('نجفة الصالة 2 + 3', 'The living-room chandelier, 2 + 3'), text: L('نجفة بخمس أذرع متعلقة في السقف. الأذرع متقسّمة مجموعتين: A فيها دراعين وB فيها 3، فتقدر تنوّر نص النور أو أغلبه أو كله.', 'A five-arm chandelier hangs from the ceiling. The arms are split into two groups, A with 2 and B with 3, so you can light some, most or all of it.'), focus: 'chand', s: { a: 0, b: 0, x: 0 } },
      { title: L('المفتاح المزدوج', 'The double switch'), text: L('جنب الباب مفتاح فيه زرارين في علبة واحدة: الزرار A للمجموعة A، والزرار B للمجموعة B.', 'By the door is one box with two buttons: A for group A and B for group B.'), focus: 'switch', s: { a: 0, b: 0, x: 0 } },
      { title: L('الزرار A: نور هادي', 'Button A: soft light'), text: L('الدراعين بتوع A نوّروا بس. ده مناسب للقعدة أو الفرجة على التليفزيون.', 'Only A\'s two arms are on, enough for sitting or watching TV.'), focus: 'groupA', s: { a: 1, b: 0, x: 0 } },
      { title: L('الزرار B: 3 لمبات', 'Button B: 3 lamps'), text: L('التلات أذرع بتوع B نوّروا لوحدهم.', 'B\'s three arms light on their own.'), focus: 'groupB', s: { a: 0, b: 1, x: 0 } },
      { title: L('الزرارين: النجفة كلها', 'Both buttons: the whole chandelier'), text: L('ال5 لمبات منوّرين، والنور مالي الصالة.', 'All 5 lamps on and the room fully lit.'), focus: 'chand', s: { a: 1, b: 1, x: 0 } },
      { title: L('الأسلاك جوه السقف', 'The wiring in the ceiling'), text: L('السقف والحيطة بقوا شفافين. الفاز (بني) جاي من اللوحة ونازل في الحيطة لعلبة المفتاح. من المفتاح طالعين سلكين فاز: واحد للمجموعة A وواحد للمجموعة B، طالعين في ماسورة للسقف لحد علبة النجفة.', 'The ceiling and wall are see-through. The phase (brown) comes from the board down the wall to the switch box. Two switched phase wires leave the switch, one for A and one for B, up through a conduit to the chandelier box.'), focus: 'switch', s: { a: 1, b: 1, x: 1 } },
      { title: L('النيوترال واحد للكل', 'One neutral for all'), text: L('النيوترال (أزرق) جاي من اللوحة للنجفة على طول، ومش بيعدّي على المفتاح. جوه النجفة بيتوزع على ال5 لمبات. يعني النجفة محتاجة 3 أسلاك: فاز A، وفاز B، ونيوترال مشترك.', 'The neutral (blue) runs straight from the board to the chandelier without passing the switch, and inside it feeds all 5 lamps. So the chandelier needs 3 wires: phase A, phase B and a shared neutral.'), focus: 'chand', s: { a: 1, b: 0, x: 1 } }
    ],
    apply(s){ Object.assign(st, s); derive(); },
    update(dt){ sw.update(dt); bulbs.forEach(b => b.update(dt)); fA.update(dt); fB.update(dt); }
  };
}

/* ================= مشاهد حقيقية: الأوضة والطرقة وترابيزة القياس ================= */
function makeDoor(){ const g = new THREE.Group(); g.add(at(box(.95, 2.1, .04, M(0x7a5233, { r: .55 })), 0, 1.05, 0)); g.add(at(box(.8, 1.95, .05, M(0xa77a4f, { r: .55 })), 0, .98, .01)); g.add(at(new THREE.Mesh(new THREE.SphereGeometry(.03, 12, 10), M(0xc9a14a, { m: .9, r: .3 })), .3, 1.0, .05)); return g; }
function makePendant(){
  const g = new THREE.Group();
  g.add(at(cyl(.06, .06, .03, M(0xf4f5f7, { r: .4 }), 20), 0, 0, 0));
  g.add(at(cyl(.006, .006, .45, M(0x22262c), 6), 0, -.23, 0));
  const shade = new THREE.Mesh(new THREE.ConeGeometry(.2, .18, 28, 1, true), M(0x2f3a48, { r: .5, side: THREE.DoubleSide })); shade.position.y = -.5; g.add(shade);
  const b = makeGlassBulb(1.1); b.group.position.y = -.58; g.add(b.group);
  return { group: g, set: b.set, update: b.update };
}

/* ---------- أوضة: مفتاح عادي ولمبة سقف وبريزة ---------- */
function buildRoomOne(){
  const ctx = makeCtx(), { root, part } = ctx, X = makeXray(); const H = 2.7;
  root.add(at(box(4.2, .1, 3.0, M(0xc7ab84, { r: .75 })), 0, -.05, 0));
  const back = at(box(4.2, H, .08, X.wall(M(0xe4e9e4, { r: .95 }))), 0, H / 2, -1.5); root.add(back);
  const side = at(box(.08, H, 3.0, X.wall(M(0xd8ded8, { r: .95 }))), -2.1, H / 2, 0); root.add(side);
  const ceil = at(box(4.2, .08, 1.6, X.wall(M(0xf3f1ec, { r: .95 }))), 0, H + .04, -.7); root.add(ceil);
  const door = makeDoor(); door.rotation.y = Math.PI / 2; door.position.set(-2.05, 0, .75); root.add(door);
  root.add(at(box(1.9, .45, .9, M(0x6d4b8a, { r: .9 })), .9, .25, -.95)); root.add(at(box(1.9, .5, .15, M(0x5a3c75, { r: .9 })), .9, .7, -1.38));
  const tbl = new THREE.Group(); tbl.position.set(-.55, 0, -1.1); root.add(tbl);
  tbl.add(at(box(.5, .5, .45, M(0x8a6a48, { r: .6 })), 0, .25, 0));
  const tlamp = new THREE.Group(); tlamp.position.set(0, .5, 0); tbl.add(tlamp);
  tlamp.add(at(cyl(.07, .09, .04, M(0x3a3f46), 18), 0, .02, 0)); tlamp.add(at(cyl(.012, .012, .32, M(0x3a3f46), 8), 0, .2, 0));
  const tsh = new THREE.Mesh(new THREE.CylinderGeometry(.1, .15, .18, 24, 1, true), M(0xf1e4c4, { r: .6, side: THREE.DoubleSide })); tsh.position.y = .42; tlamp.add(tsh);
  const tb = makeGlassBulb(.6); tb.group.position.y = .4; tlamp.add(tb.group);
  root.add(at(shadowPlane(6, 4), 0, -.11, 0));
  const sw = makeWallSwitch(1); sw.group.position.set(-2.05, 1.15, .1); sw.group.rotation.y = Math.PI / 2; sw.group.scale.setScalar(1.6); root.add(sw.group);
  const sock = new THREE.Group(); sock.position.set(-.95, .35, -1.45); root.add(sock);
  sock.add(at(box(.16, .16, .03, M(0xf4f5f7, { r: .35 })), 0, 0, .015));
  [-.03, .03].forEach(x => sock.add(at(cyl(.011, .011, .02, M(0x22262c), 10), x, 0, .035)).children.at(-1).rotation.x = Math.PI / 2);
  sock.scale.setScalar(1.6);
  const plug = new THREE.Group(); root.add(plug);
  plug.add(at(cyl(.05, .05, .07, M(0x23272e), 18), -.95, .35, -1.38)).children.at(-1).rotation.x = Math.PI / 2;
  plug.add(tube(CR([V(-.95, .35, -1.34), V(-.9, .15, -1.2), V(-.7, .02, -1.1), V(-.58, .5, -1.1)]), .012, M(0x23272e), 30));
  const pend = makePendant(); pend.group.position.set(.2, H, -.1); root.add(pend.group);
  const cond = new THREE.Group(); root.add(cond); X.inside(cond);
  const xw = -2.045, top = H - .04, zb = -1.445;
  const wL = wirePath([V(xw, top, -1.45), V(xw, top, .07), V(xw, 1.18, .07)], COL.L);
  const wSW = wirePath([V(xw, 1.18, .12), V(xw, top - .03, .12), V(.18, top - .03, .12), V(.18, top - .03, -.1), V(.18, H - .02, -.1)], COL.L);
  const wN = wirePath([V(xw + .03, top - .07, zb), V(.22, top - .07, zb), V(.22, top - .07, -.1), V(.22, H - .02, -.1)], COL.N);
  const wsL = wirePath([V(-1.9, top - .1, zb), V(-1.0, top - .1, zb), V(-1.0, .38, zb)], COL.L);
  const wsN = wirePath([V(-.9, .38, zb), V(-.9, top - .14, zb), V(-1.9, top - .14, zb)], COL.N);
  const wsE = wirePath([V(-1.9, top - .18, zb), V(-.95, top - .18, zb), V(-.95, .42, zb)], COL.E);
  [wL, wSW, wN, wsL, wsN, wsE].forEach(w => cond.add(w.m));
  [conduitPath([V(xw, top - .04, -1.45), V(xw, top - .04, .1), V(xw, 1.18, .1)], .06), conduitPath([V(xw, top - .04, .11), V(.2, top - .04, .11), V(.2, top - .04, -.1)], .05), conduitPath([V(-1.95, top - .12, zb), V(-.95, top - .12, zb), V(-.95, .38, zb)], .06)].forEach(m => cond.add(m));
  cond.add(at(label(L('من اللوحة', 'From the board'), '#ffffff', .12), -1.7, top - .25, -1.4));
  part('switch', sw.group, V(0, .16, .03), L('المفتاح العادي', 'One-way switch'), L('جنب الباب. بيفتح ويقفل سلك الفاز للمبة السقف. دوس عليه.', 'By the door. Opens and closes the phase to the ceiling lamp. Tap it.'));
  part('lamp', pend.group, V(0, -.3, 0), L('لمبة السقف', 'Ceiling lamp'), L('شغالة من المفتاح بس.', 'Controlled by the switch only.'));
  part('socket', sock, V(0, .1, .03), L('البريزة', 'Socket'), L('فيها كهربا طول الوقت. دوس عليها عشان تدخّل فيشة الأباجورة.', 'Always live. Tap to plug in the table lamp.'));
  part('tlamp', tlamp, V(0, .6, 0), L('الأباجورة', 'Table lamp'), L('جهاز متوصل في البريزة.', 'An appliance plugged into the socket.'));
  part('wall', ceil, V(-.9, -.05, .5), L('الحيطة والسقف', 'Wall and ceiling'), L('دوس عليهم عشان تشوف الأسلاك.', 'Tap to see the wiring.'));
  const st = { sw: 0, plug: 0, x: 0 };
  const fL = new Flow(root, chain(wL.p, wSW.p), { count: 30, speed: 1.4, size: .025 });
  const fS = new Flow(root, chain(wsL.p, wsN.p), { count: 30, speed: 1.4, size: .025 });
  function derive(){ sw.set(0, st.sw); X.set(st.x); pend.set(st.sw ? 1 : 0); plug.visible = !!st.plug; tb.set(st.plug ? 1 : 0); fL.target = st.sw && st.x ? 1 : 0; fS.target = st.plug && st.x ? 1 : 0; }
  ctx.parts.switch.tap = () => { st.sw ^= 1; derive(); return st.sw ? L('لمبة السقف نوّرت.', 'Ceiling lamp on.') : L('لمبة السقف طفت.', 'Ceiling lamp off.'); };
  ctx.parts.lamp.tap = ctx.parts.switch.tap;
  ctx.parts.socket.tap = () => { st.plug ^= 1; derive(); return st.plug ? L('الفيشة دخلت والأباجورة نوّرت، حتى والمفتاح مقفول.', 'Plugged in: the table lamp works even with the switch off.') : L('الفيشة اتشالت.', 'Unplugged.'); };
  ctx.parts.tlamp.tap = ctx.parts.socket.tap;
  const xr = () => { st.x ^= 1; derive(); return st.x ? L('الحيطة والسقف بقوا شفافين.', 'Wall and ceiling see-through.') : L('رجعوا عادي.', 'Back to normal.'); };
  ctx.parts.wall.tap = xr;
  return {
    ...ctx, view: V(.18, .15, 1.6), sway: true, xray: { get on(){ return !!st.x; }, toggle(){ return xr(); } },
    hint: L('دوس على المفتاح أو البريزة أو السقف · صباعين للتقريب', 'Tap the switch, socket or ceiling · pinch to zoom'),
    steps: [
      { title: L('أوضة: مفتاح ولمبة وبريزة', 'A room: switch, lamp and socket'), text: L('دي أبسط دايرة في أي أوضة: مفتاح عادي جنب الباب بيتحكم في لمبة السقف، وبريزة تحت على الحيطة شغالة لوحدها من غير تحكم.', 'The simplest circuit in any room: a one-way switch by the door controls the ceiling lamp, and a wall socket works on its own.'), s: { sw: 0, plug: 0, x: 0 } },
      { title: L('ولّع النور', 'Switch on'), text: L('دوس على المفتاح: لمبة السقف نوّرت. المفتاح بيقفل الدايرة، فالتيار بيوصل للمبة.', 'Press the switch: the ceiling lamp lights. The switch closes the circuit so current reaches the lamp.'), focus: 'switch', s: { sw: 1, plug: 0, x: 0 } },
      { title: L('جوه الحيطة: المفتاح على الفاز', 'Inside the wall: switch on the phase'), text: L('الفاز (بني) جاي من اللوحة نازل لعلبة المفتاح، وطالع منها سلك للمبة. النيوترال (أزرق) رايح للمبة على طول. المفتاح لازم يكون على الفاز: لو اتركّب على النيوترال، اللمبة هتطفى بس الدوي هيفضل عليه 220 فولت، واللي بيغيّر اللمبة ممكن يتكهرب.', 'The phase (brown) comes from the board down to the switch box, and a wire leaves it for the lamp. The neutral (blue) goes straight to the lamp. The switch must be on the phase: on the neutral, the lamp would go off but its holder would stay at 220 V, and whoever changes the bulb could get a shock.'), focus: 'switch', s: { sw: 1, plug: 0, x: 1 } },
      { title: L('البريزة من غير تحكم', 'The socket has no switch'), text: L('البريزة متوصلة على الفاز والنيوترال مباشرة من اللوحة، توازي مع اللمبة. يعني فيها كهربا طول الوقت: المفتاح مطفي والأباجورة شغالة.', 'The socket is wired to phase and neutral straight from the board, in parallel with the lamp. It is always live: the switch is off yet the table lamp works.'), focus: 'socket', s: { sw: 0, plug: 1, x: 1 } },
      { title: L('سلك الأرضي', 'The earth wire'), text: L('السلك الأخضر والأصفر نازل لطرف الأرضي في البريزة. مش بيشيل تيار في الطبيعي، لكن لو جسم جهاز معدن اتكهرب التيار بينزل الأرض منه بدل ما يعدّي في جسم الإنسان.', 'The green-yellow wire runs to the socket\'s earth terminal. It carries nothing normally, but if a metal appliance body becomes live, current flows to earth through it instead of through a person.'), focus: 'socket', s: { sw: 1, plug: 1, x: 1 } }
    ],
    apply(s){ Object.assign(st, s); derive(); },
    update(dt){ sw.update(dt); pend.update(dt); tb.update(dt); fL.update(dt); fS.update(dt); }
  };
}

/* ---------- طرقة: لمبة من 3 أو 4 أماكن ---------- */
function buildCorridor(n){
  const ctx = makeCtx(), { root, part } = ctx, X = makeXray(); const H = 2.6, Z = -.79;
  root.add(at(box(6.0, .1, 1.7, M(0xd6cfc2, { r: .8 })), 0, -.05, 0));
  for(let i = -5; i <= 5; i++) root.add(at(box(.01, .002, 1.7, M(0xb9b1a2)), i * .55, .002, 0));
  const back = at(box(6.0, H, .08, X.wall(M(0xe9e3d6, { r: .95 }))), 0, H / 2, -.84); root.add(back);
  const ceil = at(box(6.0, .08, 1.0, X.wall(M(0xf3f1ec, { r: .95 }))), 0, H + .04, -.35); root.add(ceil);
  root.add(at(shadowPlane(8, 3), 0, -.11, 0));
  const xs = n === 1 ? [-2.4, 0, 2.4] : [-2.4, -.8, .8, 2.4];
  const doorXs = n === 1 ? [-1.2, 1.2] : [-1.6, 0, 1.6];
  doorXs.forEach((x, i) => { const d = makeDoor(); d.position.set(x, 0, -.8); root.add(d); d.add(at(label(L(`أوضة ${i + 1}`, `Room ${i + 1}`), '#ffffff', .17), 0, 2.28, .05)); });
  const sws = xs.map(x => { const s = makeWallSwitch(1); s.group.position.set(x, 1.15, -.8); s.group.scale.setScalar(1.7); root.add(s.group); return s; });
  const lamps = [-1.2, 1.2].map(x => { const p = makePendant(); p.group.position.set(x, H, -.35); p.group.scale.setScalar(.8); root.add(p.group); return p; });
  const P = (x, y) => V(x, y, Z);
  const ty = [H - .12, H - .07], dx = [-.03, .03];
  const cond = new THREE.Group(); root.add(cond); X.inside(cond);
  const wL = wirePath([P(-3.0, H - .17), P(xs[0] - .08, H - .17), P(xs[0] - .08, 1.15)], COL.L);
  const stages = [];
  for(let k = 0; k < xs.length - 1; k++) stages.push([0, 1].map(i => wirePath([P(xs[k] + dx[i], 1.15), P(xs[k] + dx[i], ty[i]), P(xs[k + 1] + dx[i], ty[i]), P(xs[k + 1] + dx[i], 1.15)], i ? COL.T2 : COL.T1)));
  const last = xs[xs.length - 1];
  const wOut = wirePath([P(last + .08, 1.15), P(last + .08, H - .22), P(-1.2, H - .22), P(-1.2, H - .02)], COL.L);
  const wN = wirePath([P(-3.0, H - .27), P(1.25, H - .27), P(1.25, H - .02)], COL.N);
  [wL, ...stages.flat(), wOut, wN].forEach(w => cond.add(w.m));
  cond.add(conduitPath([P(-3.0, H - .17), P(last, H - .17)], .09));
  xs.forEach(x => { cond.add(conduitPath([P(x, 1.15), P(x, H - .17)], .05)); cond.add(at(box(.13, .13, .05, M(0x4a5060, { r: .6 })), x, 1.15, Z - .01)); });
  cond.add(at(label(L('من اللوحة', 'From the board'), '#ffffff', .12), -2.75, H - .4, Z));
  part('s1', sws[0].group, V(0, .16, .02), L('تحويلة أول الطرقة', 'Two-way, corridor start'), L('3 أطراف: مشترك ومخرجين. دوس عليه.', '3 terminals: common and two outputs. Tap it.'));
  for(let k = 1; k <= n; k++) part('i' + (k - 1), sws[k].group, V(0, .16, .02), L(n > 1 ? `وسطاني ${k}` : 'المفتاح الوسطاني', n > 1 ? `Intermediate ${k}` : 'Intermediate'), L('4 أطراف: بيعدّي المراسلين مستقيم أو بيعكسهم. دوس عليه.', '4 terminals: passes the travellers straight or crosses them. Tap it.'));
  part('s2', sws[sws.length - 1].group, V(0, .16, .02), L('تحويلة آخر الطرقة', 'Two-way, corridor end'), L('مشتركه طالع للمبات. دوس عليه.', 'Its common feeds the lamps. Tap it.'));
  part('lamps', lamps[0].group, V(0, -.3, 0), L('لمبات الطرقة', 'Corridor lamps'), L('لمبتين توازي على نفس المخرج.', 'Two lamps in parallel on the same output.'));
  part('trav', cond, P(0, H - .05), L('المراسلات', 'Travellers'), L('السلك اللي عليه كهربا بينوّر أحمر.', 'The live wire glows red.'));
  part('wall', back, V(-1.9, .6, .06), L('الحيطة', 'The wall'), L('دوس عليها عشان تشوف الأسلاك.', 'Tap it to see the wiring.'));
  const st = { a: 0, b: 1, c: [0, 0], x: 0 };
  let flow = null, lastKey = '';
  function derive(){
    sws[0].set(0, st.a); sws[sws.length - 1].set(0, st.b); for(let k = 0; k < n; k++) sws[k + 1].set(0, st.c[k]); X.set(st.x);
    let idx = st.a; const path = [wL.p, polyPath([P(xs[0] - .08, 1.15), P(xs[0] + dx[idx], 1.15)])];
    stages.forEach((sg, k) => {
      sg.forEach((w, i) => setGlow(w.m.material, i === idx ? .6 : 0)); path.push(sg[idx].p);
      if(k < n){ const ni = st.c[k] ? 1 - idx : idx; path.push(polyPath([P(xs[k + 1] + dx[idx], 1.15), P(xs[k + 1] + dx[ni] + .001, 1.15)])); idx = ni; }
    });
    const closed = idx === st.b; lamps.forEach(l => l.set(closed ? 1 : 0));
    path.push(polyPath([P(last + dx[idx], 1.15), P(last + .08, 1.15)]), wOut.p);
    const key = closed + ':' + st.a + st.b + st.c.join('') + st.x;
    if(key !== lastKey){ dropFlow(root, flow); flow = closed && st.x ? new Flow(root, chain(...path), { count: 50, speed: 1.6, size: .028 }) : null; if(flow){ flow.level = .05; flow.target = 1; } lastKey = key; }
    return closed;
  }
  const say = c => c ? L('لمبات الطرقة نوّرت.', 'Corridor lamps on.') : L('لمبات الطرقة طفت.', 'Corridor lamps off.');
  ctx.parts.s1.tap = () => { st.a ^= 1; return say(derive()); };
  ctx.parts.s2.tap = () => { st.b ^= 1; return say(derive()); };
  for(let k = 0; k < n; k++) ctx.parts['i' + k].tap = () => { st.c[k] ^= 1; return say(derive()); };
  const xr = () => { st.x ^= 1; derive(); return st.x ? L('الحيطة بقت شفافة: دي الأسلاك.', 'The wall is see-through: here is the wiring.') : L('الحيطة رجعت عادي.', 'Wall back to normal.'); };
  ctx.parts.wall.tap = xr; ctx.parts.trav.tap = xr;
  const places = n + 2;
  return {
    ...ctx, view: V(.1, .2, 1.6), sway: true, xray: { get on(){ return !!st.x; }, toggle(){ return xr(); } },
    hint: L('دوس على أي مفتاح أو على الحيطة · صباعين للتقريب', 'Tap any switch or the wall · pinch to zoom'),
    steps: [
      { title: L(`نور الطرقة من ${places} أماكن`, `Corridor light from ${places} places`), text: L(`طرقة طويلة فيها ${doorXs.length} أوض، وعايزين نولّع النور ونطفيه من أول الطرقة وآخرها وقدام كل أوضة. ده محتاج مفتاحين تحويلة في الطرفين و${n === 1 ? 'مفتاح وسطاني' : n + ' مفاتيح وسطاني'} في النص.`, `A long corridor with ${doorXs.length} rooms, and we want the light switchable from both ends and by the rooms. That needs two two-way switches at the ends and ${n} intermediate switch${n > 1 ? 'es' : ''} between them.`), s: { a: 0, b: 1, c: [0, 0], x: 0 } },
      { title: L('من أول الطرقة', 'From the start'), text: L('دوس على المفتاح اللي في أول الطرقة: النور ولّع.', 'Press the switch at the start: the lights come on.'), focus: 's1', s: { a: 1, b: 1, c: [0, 0], x: 0 } },
      { title: L('من قدام الأوضة', 'By a room door'), text: L('اللي خارج من الأوضة يقدر يطفي النور من المفتاح اللي جنب بابه، وده المفتاح الوسطاني.', 'Someone leaving a room can switch off at the switch by the door: the intermediate switch.'), focus: 'i0', s: { a: 1, b: 1, c: [1, 0], x: 0 } },
      { title: L('جوه الحيطة', 'Inside the wall'), text: L(`الفاز (بني) داخل على مشترك أول تحويلة. من هناك سلكين (المراسلات) ماشيين في ماسورة فوق، وبيدخلوا ويطلعوا من كل مفتاح وسطاني لحد آخر تحويلة. مشترك آخر تحويلة طالع للمبتين، والنيوترال (أزرق) رايح للمبات على طول.`, 'The phase (brown) enters the first two-way\'s common. From there two travellers run in a conduit along the top, in and out of every intermediate switch, to the last two-way. Its common feeds both lamps; the neutral (blue) goes straight to the lamps.'), focus: 'trav', s: { a: 0, b: 1, c: [0, 0], x: 1 } },
      { title: L('المفتاح الوسطاني بيعكس', 'The intermediate crosses over'), text: L('المفتاح الوسطاني ليه 4 أطراف. في وضع بيعدّي المراسلين مستقيم، وفي التاني بيعكسهم: الأحمر بيتنقل للسلك التاني. ده اللي بيقلب حالة النور. دوس عليه وراقب السلك الأحمر.', 'The intermediate has 4 terminals. One position passes the travellers straight, the other crosses them, moving the red one to the other wire. That flips the light. Tap it and watch the red wire.'), focus: 'i0', s: { a: 0, b: 0, c: [0, 0], x: 1 } },
      { title: L('القاعدة', 'The rule'), text: L(`أي عدد أماكن = مفتاحين تحويلة + (العدد − 2) وسطاني. يعني ${places} أماكن = 2 تحويلة + ${n} وسطاني. جرّب: دوس على أي مفتاح وكل ضغطة هتقلب النور.`, `Any number of places = two two-way switches + (places − 2) intermediates. So ${places} places = 2 two-way + ${n} intermediate. Try it: every tap on any switch flips the light.`), focus: 's2', s: { a: 1, b: 0, c: [0, 0], x: 1 } }
    ],
    apply(s){ st.a = s.a; st.b = s.b; st.c = [...s.c]; st.x = s.x; derive(); },
    update(dt){ sws.forEach(s => s.update(dt)); lamps.forEach(l => l.update(dt)); if(flow) flow.update(dt); }
  };
}

/* ---------- ترابيزة شغل للأفوميتر ---------- */
function makeWorkbench(){
  const g = new THREE.Group();
  const top = at(box(4.6, .14, 3.0, M(0x9b7a52, { r: .7 })), 0, -.07, 0); top.userData.receiver = true; g.add(top);
  [[-2.15, -1.35], [2.15, -1.35], [-2.15, 1.35], [2.15, 1.35]].forEach(([x, z]) => { const l = at(box(.14, 1.6, .14, M(0x5a4430, { r: .7 })), x, -.92, z); l.userData.noFit = true; g.add(l); });
  { const sh = at(box(4.2, .06, 2.6, M(0x6e5438, { r: .8 })), 0, -1.4, 0); sh.userData.noFit = true; g.add(sh); }
  const peg = at(box(4.6, 1.6, .05, M(0xc9b48e, { r: .9 })), 0, .8, -1.55); g.add(peg); peg.userData.noFit = true;
  for(let i = 0; i < 18; i++) for(let j = 0; j < 6; j++) peg.add(at(new THREE.Mesh(new THREE.CircleGeometry(.012, 8), M(0x5a4430)), -2.1 + i * .25, -.6 + j * .25, .026));
  const toolM = M(0x3a3f46, { m: .6, r: .4 }), redM = M(0xc0392b, { r: .5 });
  [[-1.6, 1.1, .5], [-1.2, 1.0, .6], [1.3, 1.1, .45]].forEach(([x, y, h]) => { g.add(at(box(.05, h, .02, toolM), x, y, -1.5)); g.add(at(box(.07, .18, .04, redM), x, y - h / 2 - .05, -1.5)); });
  g.add(at(new THREE.Mesh(new THREE.TorusGeometry(.18, .025, 8, 24), M(0x2f6fd6, { r: .5 })), 1.8, 1.0, -1.5));
  g.traverse(o => { if(o !== g && (o.position.y > .3 || o.parent === peg)) o.userData.noFit = true; });
  return g;
}
/* ================= الدفعة التانية: المحركات والفلورسنت والجرس وماكينة السلم ================= */
function makeContactor(name){
  const g = new THREE.Group();
  g.add(at(box(.3, .42, .26, M(0xe9ebef, { r: .45 })), 0, 0, 0));
  g.add(at(box(.24, .12, .03, M(0x3a3f46, { r: .5 })), 0, .05, .14));
  const flag = at(box(.1, .05, .02, M(0x8a9099)), 0, .05, .16); g.add(flag);
  const brass = M(0xd9a441, { m: .85, r: .3 });
  [-.09, 0, .09].forEach(x => { g.add(at(cyl(.018, .018, .03, brass, 8), x, .19, .1)); g.add(at(cyl(.018, .018, .03, brass, 8), x, -.19, .1)); });
  g.add(at(label(name, '#1b1f26', .07), 0, -.1, .15));
  let a = 0, t = 0;
  return { group: g, set(on){ t = on ? 1 : 0; }, get on(){ return !!t; }, update(dt){ a = ease(a, t, dt, 12); flag.position.z = .16 - a * .025; flag.material.color.setRGB(.54 + a * -.4, .56 + a * .2, .6 - a * .35); } };
}
function makeButton(color, txt){
  const g = new THREE.Group();
  g.add(at(cyl(.07, .07, .04, M(0x2b3038, { r: .5 }), 24), 0, 0, 0)).children.at(-1).rotation.x = Math.PI / 2;
  const cap = cyl(.05, .05, .04, M(color, { r: .35 }), 24); cap.rotation.x = Math.PI / 2; cap.position.z = .04; g.add(cap);
  g.add(at(label(txt, '#ffffff', .07), 0, -.12, .05));
  let p = 0;
  return { group: g, press(){ p = 1; }, update(dt){ p = ease(p, 0, dt, 6); cap.position.z = .04 - p * .025; } };
}
function makeMotor3(){
  const g = new THREE.Group(), body = M(0x2d6fb0, { m: .4, r: .4 });
  g.add(at(box(.9, .08, .5, M(0x3a3f46, { m: .5 })), 0, .04, 0));
  const c = cyl(.28, .28, .75, body, 36); c.rotation.z = Math.PI / 2; g.add(at(c, 0, .38, 0));
  for(let i = 0; i < 12; i++){ const f = box(.7, .02, .05, body); const a = i / 12 * Math.PI * 2; f.position.set(0, .38 + Math.sin(a) * .29, Math.cos(a) * .29); f.rotation.x = -a; g.add(f); }
  const cap = cyl(.29, .29, .06, M(0x245a90, { m: .4 }), 36); cap.rotation.z = Math.PI / 2; g.add(at(cap, .4, .38, 0));
  const shaft = new THREE.Group(); shaft.position.set(-.38, .38, 0); g.add(shaft);
  const sh = cyl(.03, .03, .3, M(0xc9ced6, { m: .9, r: .25 }), 12); sh.rotation.z = Math.PI / 2; shaft.add(at(sh, -.12, 0, 0));
  const fan = new THREE.Group(); fan.position.x = -.25; shaft.add(fan);
  for(let i = 0; i < 4; i++){ const b = at(box(.02, .3, .08, M(0xd23a2e, { r: .5 })), 0, .15, 0); const h = new THREE.Group(); h.rotation.x = i * Math.PI / 2; h.add(b); fan.add(h); }
  const tb = new THREE.Group(); tb.position.set(.05, .7, 0); g.add(tb);
  tb.add(at(box(.3, .06, .24, M(0x245a90, { m: .4 })), 0, 0, 0));
  const studs = {}; const brass = M(0xd9a441, { m: .85, r: .3 });
  [['W2', -.09, -.06], ['U2', 0, -.06], ['V2', .09, -.06], ['U1', -.09, .06], ['V1', 0, .06], ['W1', .09, .06]].forEach(([k, x, z]) => { tb.add(at(cyl(.014, .014, .05, brass, 8), x, .05, z)); studs[k] = V(x, .08, z); tb.add(at(label(k, '#ffffff', .045), x, .12, z)); });
  const barM = M(0xd98c5f, { m: .85, r: .3 });
  const bar = (a, b) => { const p = studs[a], q = studs[b]; const m = box(Math.hypot(q.x - p.x, q.z - p.z) + .03, .01, .025, barM.clone()); m.position.set((p.x + q.x) / 2, .085, (p.z + q.z) / 2); m.rotation.y = -Math.atan2(q.z - p.z, q.x - p.x); m.visible = false; tb.add(m); return m; };
  const star = [bar('W2', 'U2'), bar('U2', 'V2')], delta = [bar('W2', 'U1'), bar('U2', 'V1'), bar('V2', 'W1')];
  let speed = 0, target = 0, dir = 1;
  return { group: g, tb, star, delta, setSpeed(s, d = 1){ target = s; dir = d; }, get speed(){ return speed; },
    update(dt){ speed = ease(speed, target, dt, target > speed ? 1.2 : .8); shaft.rotation.x += dt * speed * 18 * dir; g.position.y = speed > .05 ? Math.sin(performance.now() * .07) * .002 : 0; } };
}
function buildMotorControl(mode){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(at(box(4.6, .1, 2.8, M(0x9aa0a6, { r: .9 })), 0, -.05, 0));
  root.add(at(box(4.6, 2.8, .1, M(0xc9c6bf, { r: .95 })), 0, 1.4, -1.4));
  root.add(at(shadowPlane(6, 4), 0, -.11, 0));
  const pan = new THREE.Group(); pan.position.set(-1.0, 1.55, -1.25); root.add(pan);
  pan.add(at(box(1.9, 1.5, .12, M(0xb9bfc6, { m: .4, r: .5 })), 0, 0, 0));
  pan.add(at(box(1.75, .04, .04, M(0x6c747d, { m: .7 })), 0, .45, .08)); pan.add(at(box(1.75, .04, .04, M(0x6c747d, { m: .7 })), 0, -.05, .08));
  const brk = makeBreaker(.3, L('قاطع 3 فاز', '3-phase MCB')); brk.group.scale.setScalar(.8); at(brk.group, -.6, .45, .15); pan.add(brk.group);
  const names = mode === 'stardelta' ? ['K1', 'KΔ', 'KY'] : mode === 'twospeed' ? ['K1', 'K2', 'K3'] : mode === 'reverse' ? ['K1', 'K2'] : ['K1'];
  const ks = names.map((n, i) => { const k = makeContactor(n); at(k.group, -.55 + i * .42, -.05, .14); pan.add(k.group); return k; });
  const ol = new THREE.Group(); at(ol, -.55, -.42, .14); pan.add(ol);
  ol.add(at(box(.3, .18, .22, M(0x2b3038, { r: .5 })), 0, 0, 0)); const olBtn = at(box(.06, .05, .03, M(0xd23a2e)), .08, .02, .12); ol.add(olBtn);
  ol.add(at(label(L('أوفرلود', 'Overload'), '#ffffff', .06), 0, -.14, .12));
  let tmr = null;
  if(mode === 'stardelta'){ tmr = makePanel(.26, .14, { font: 'bold 70px monospace', bg: '#1b2430', fg: '#7fe0a0' }); const tg = new THREE.Group(); tg.add(at(box(.3, .3, .2, M(0x3c4656, { r: .5 })), 0, 0, 0)); tg.add(at(tmr.mesh, 0, .03, .105)); tg.add(at(label(L('مؤقت', 'Timer'), '#ffffff', .06), 0, -.11, .11)); at(tg, .75, -.05, .14); pan.add(tg); part('timer', tg, V(0, .2, .1), L('المؤقت (التايمر)', 'Timer'), L('بيعد ثواني البدء نجمة، وبعدها بيحوّل لدلتا.', 'Counts the star-start seconds, then switches to delta.')); }
  const st = new THREE.Group(); st.position.set(.55, 1.3, -1.32); root.add(st);
  st.add(at(box(.36, mode === 'reverse' || mode === 'twospeed' ? .75 : .55, .12, M(0xf2c418, { r: .5 })), 0, 0, 0));
  const bStop = makeButton(0xd23a2e, L('إيقاف O', 'Stop O')); at(bStop.group, 0, .18, .07); st.add(bStop.group);
  const btnDefs = mode === 'reverse' ? [[0x2fa84f, L('أمامي', 'Fwd')], [0x2a62c9, L('عكسي', 'Rev')]] : mode === 'twospeed' ? [[0x2fa84f, L('بطيء', 'Slow')], [0x2a62c9, L('سريع', 'Fast')]] : [[0x2fa84f, L('تشغيل I', 'Start I')]];
  const bRun = btnDefs.map(([c, t], i) => { const b = makeButton(c, t); at(b.group, 0, -.05 - i * .22, .07); st.add(b.group); return b; });
  const mot = makeMotor3(); mot.group.position.set(1.2, 0, .35); mot.group.rotation.y = -.35; mot.group.scale.setScalar(1.35); root.add(mot.group);
  const arrow = label('⟳', '#ffd34d', .3); arrow.position.set(.75, .75, .5); root.add(arrow);
  const stateTag = label('', '#ffffff', .16); root.add(stateTag);
  pan.updateMatrixWorld(true);
  const k0 = pan.localToWorld(V(-.55, -.25, .25)), mt = V(1.27, .95, .35);
  const phaseCol = [0x8b4a1f, 0x22262c, 0x8f949c];
  const cables = [0, 1, 2].map(i => { const c = CR([k0.clone().add(V(-.06 + i * .06, 0, 0)), V(-.6 + i * .04, .25, -1.15), V(.3, .08 + i * .03, -.6), V(1.0, .1 + i * .03, .1), mt.clone().add(V(-.04 + i * .04, 0, 0))]); root.add(tube(c, .02, M(phaseCol[i], { r: .5 }), 60)); return c; });
  const flows = cables.map((c, i) => new Flow(root, c, { count: 14, speed: 1.2, size: .03, color: [0xffa13a, 0xffe14d, 0x9fd3ff][i] }));
  part('panel', pan, V(0, .85, .1), L('لوحة التحكم', 'Control panel'), L('فيها القاطع والكونتاكتورات والأوفرلود.', 'Holds the breaker, contactors and overload.'));
  part('k', ks[0].group, V(0, .3, .1), L('الكونتاكتور', 'Contactor'), L('مفتاح كبير بيقفل بملف كهربي (A1–A2). لما الملف يتغذى الريشة بتتشد والتلامسات بتقفل.', 'A big switch closed by a coil (A1–A2). Energise the coil and the contacts pull in.'));
  part('ol', ol, V(0, .2, .1), L('الأوفرلود (حماية حرارية)', 'Overload relay'), L('بيفصل لو المحرك سحب تيار زيادة. دوس عليه عشان تجرّب فصله.', 'Trips if the motor draws too much current. Tap to trip it.'));
  part('station', st, V(0, .5, .08), L('لوحة الأزرار', 'Push-button station'), L('الأحمر إيقاف، والأخضر تشغيل.', 'Red stops, green starts.'));
  part('motor', mot.group, V(0, 1.0, 0), L('المحرك 3 فاز', '3-phase motor'), L('علبة أطرافه فيها 6 أطراف: U1 V1 W1 و U2 V2 W2.', 'Its terminal box has 6 studs: U1 V1 W1 and U2 V2 W2.'));
  part('tbox', mot.tb, V(0, .2, 0), L('علبة الأطراف', 'Terminal box'), L('الكباري النحاس بتحدد التوصيل نجمة أو دلتا.', 'Copper links set the star or delta connection.'));
  const S = { run: 0, dir: 1, phase: '', t: 0, trip: 0, fast: 0 };
  function setTag(txt){ stateTag.visible = !!txt; if(txt){ root.remove(stateTag); const n = label(txt, '#ffd34d', .16); n.position.set(1.2, 1.35, .35); root.add(n); ctx._tag = n; } }
  let tagObj = null;
  function tag(txt){ if(tagObj){ root.remove(tagObj); tagObj.material.map.dispose(); } tagObj = txt ? label(txt, '#ffd34d', .17) : null; if(tagObj){ tagObj.position.set(1.2, 1.4, .35); root.add(tagObj); } }
  function derive(){
    brk.set(1);
    let sp = 0;
    if(mode === 'dol'){ ks[0].set(S.run); sp = S.run ? 1 : 0; mot.star.forEach(b => b.visible = false); mot.delta.forEach(b => b.visible = !!1); tag(S.run ? L('شغال', 'Running') : ''); }
    if(mode === 'reverse'){ ks[0].set(S.run && S.dir > 0); ks[1].set(S.run && S.dir < 0); sp = S.run ? 1 : 0; mot.delta.forEach(b => b.visible = true); tag(S.run ? (S.dir > 0 ? L('أمامي ⟳', 'Forward ⟳') : L('عكسي ⟲', 'Reverse ⟲')) : ''); }
    if(mode === 'twospeed'){ ks[0].set(S.run && !S.fast); ks[1].set(S.run && S.fast); ks[2].set(S.run && S.fast); sp = S.run ? (S.fast ? 1 : .5) : 0; mot.delta.forEach(b => b.visible = S.run && !S.fast); mot.star.forEach(b => b.visible = S.run && S.fast); tag(S.run ? (S.fast ? L('سريع YY', 'Fast YY') : L('بطيء Δ', 'Slow Δ')) : ''); }
    if(mode === 'stardelta'){ const star = S.run && S.phase === 'Y', del = S.run && S.phase === 'D'; ks[0].set(S.run); ks[1].set(del); ks[2].set(star); sp = star ? .55 : del ? 1 : 0; mot.star.forEach(b => b.visible = star); mot.delta.forEach(b => b.visible = del); tag(star ? L('نجمة Y', 'Star Y') : del ? L('دلتا Δ', 'Delta Δ') : ''); }
    mot.setSpeed(sp, S.dir); flows.forEach(f => f.target = sp ? 1 : 0); arrow.visible = sp > 0; arrow.material.map.flipY = true;
    olBtn.material.color.setHex(S.trip ? 0x2fbf5a : 0xd23a2e);
  }
  const start = (dir = 1, fast = 0) => { if(S.trip) return L('الأوفرلود فاصل: رجّعه الأول.', 'The overload has tripped: reset it first.');
    if(mode === 'reverse' && S.run && S.dir !== dir) return L('ممنوع! لازم تدوس إيقاف الأول. الكونتاكتورين متربطين ببعض (Interlock) عشان ما يقفلوش مع بعض ويعملوا قصر بين الفازات.', 'Not allowed! Press Stop first. The two contactors are interlocked so they never close together and short the phases.');
    S.run = 1; S.dir = dir; S.fast = fast; S.t = 0; S.phase = 'Y'; derive(); return mode === 'stardelta' ? L('بدأ نجمة، والتايمر بيعد.', 'Starting in star; the timer is counting.') : L('المحرك اشتغل.', 'Motor started.'); };
  ctx.parts.station.tap = () => { if(S.run){ S.run = 0; S.phase = ''; bStop.press(); derive(); return L('اتدست إيقاف: الملف فصل والمحرك وقف.', 'Stop pressed: the coil drops out and the motor stops.'); } bRun[0].press(); return start(1, 0); };
  ctx.parts.ol.tap = () => { S.trip ^= 1; if(S.trip){ S.run = 0; S.phase = ''; } derive(); return S.trip ? L('الأوفرلود فصل: تلامسه المقفول (95–96) فتح وقطع الملف، فالمحرك وقف.', 'Overload tripped: its NC contact (95–96) opened the coil circuit and the motor stopped.') : L('الأوفرلود رجع.', 'Overload reset.'); };
  ctx.parts.motor.tap = mode === 'reverse' ? () => start(S.run ? -S.dir : -1) : mode === 'twospeed' ? () => { if(!S.run) return start(1, 1); S.fast ^= 1; derive(); return S.fast ? L('اتحوّل للسرعة العالية.', 'Switched to high speed.') : L('رجع للسرعة البطيئة.', 'Back to low speed.'); } : ctx.parts.station.tap;
  const common = [
    { title: L('محرك 3 فاز ولوحة تحكم', 'A 3-phase motor and its panel'), text: L('المحرك الحثي 3 فاز هو أكتر محرك في المصانع. التيار في الملفات التلاتة بيعمل مجال مغناطيسي بيلف، والعضو الدوار بيلف وراه. بنشغّله من لوحة فيها قاطع، وكونتاكتور، وأوفرلود، وأزرار تشغيل وإيقاف.', 'The 3-phase induction motor is the most common motor in industry. Current in its three windings makes a rotating magnetic field that drags the rotor round. It is run from a panel with a breaker, contactor, overload relay and start/stop buttons.'), focus: 'motor', s: { run: 0 } },
    { title: L('الكونتاكتور', 'The contactor'), text: L('الكونتاكتور مفتاح كبير بيتقفل بملف. زرار صغير بيغذي الملف بتيار بسيط، والملف بيقفل تلامسات القوى اللي بتشيل تيار المحرك الكبير. كده الزرار في إيدك آمن، والتيار الكبير جوه اللوحة.', 'A contactor is a big switch closed by a coil. A small button feeds the coil a small current, and the coil closes the power contacts that carry the motor\'s large current. Your button stays safe; the big current stays in the panel.'), focus: 'k', s: { run: 0 } }
  ];
  let steps;
  if(mode === 'dol') steps = [...common,
    { title: L('التشغيل والتثبيت الذاتي', 'Start and self-holding'), text: L('دوس تشغيل: الملف اتغذى والكونتاكتور قفل والمحرك اشتغل. لما تشيل صباعك المحرك بيفضل شغال، لأن فيه تلامس مساعد في الكونتاكتور (13–14) متوصل توازي مع زرار التشغيل وبيمسك الملف. ده اسمه التثبيت الذاتي.', 'Press Start: the coil energises, the contactor closes and the motor runs. Release the button and it keeps running, because an auxiliary contact (13–14) in parallel with Start holds the coil. That is self-holding.'), focus: 'station', s: { run: 1 } },
    { title: L('الإيقاف', 'Stopping'), text: L('زرار الإيقاف مقفول في الطبيعي ومتوصل توالي مع الملف. لما تدوسه بيقطع الملف، فالتثبيت بيروح والمحرك بيقف، ومش هيشتغل تاني غير لما تدوس تشغيل.', 'The Stop button is normally closed and in series with the coil. Pressing it breaks the coil circuit, the hold is lost and the motor stops until Start is pressed again.'), focus: 'station', s: { run: 0 } },
    { title: L('الأوفرلود', 'The overload relay'), text: L('لو المحرك اتحمّل زيادة أو فاز وقع، التيار بيزيد والأوفرلود بيسخن ويفصل. تلامسه (95–96) متوصل توالي مع الملف، فبيوقف المحرك قبل ما ملفاته تتحرق. دوس عليه وجرّب.', 'If the motor is overloaded or loses a phase, the current rises and the overload heats and trips. Its contact (95–96) is in series with the coil, so it stops the motor before the windings burn. Tap it to try.'), focus: 'ol', s: { run: 1 } }];
  if(mode === 'reverse') steps = [...common,
    { title: L('عكس الحركة', 'Reversing'), text: L('عشان المحرك يلف بالعكس بنبدّل أي فازتين من التلاتة. K1 بيوصّل L1 L2 L3 على U V W، وK2 بيوصّلهم L3 L2 L1. دوس على لوحة الأزرار عشان يشتغل أمامي.', 'To reverse a 3-phase motor, swap any two phases. K1 connects L1 L2 L3 to U V W; K2 connects L3 L2 L1. Tap the button station to run forward.'), focus: 'k', s: { run: 1, dir: 1 } },
    { title: L('عكسي', 'Reverse'), text: L('بعد الإيقاف دوس عكسي: K1 فصل وK2 قفل، والمحرك بقى يلف في الاتجاه التاني.', 'After stopping, press Reverse: K1 is out, K2 is in, and the motor turns the other way.'), focus: 'motor', s: { run: 1, dir: -1 } },
    { title: L('الحماية المتبادلة', 'Interlocking'), text: L('لو K1 وK2 قفلوا مع بعض هيحصل قصر بين فازتين. عشان كده تلامس مقفول من K1 بيتحط في دايرة ملف K2، وتلامس مقفول من K2 في دايرة ملف K1. أي واحد شغال بيمنع التاني. جرّب: والمحرك شغال أمامي، دوس على المحرك تاني.', 'If K1 and K2 closed together, two phases would short. So an NC contact of K1 sits in K2\'s coil circuit and vice versa: either one running blocks the other. Try it: with the motor running forward, tap the motor again.'), focus: 'k', s: { run: 1, dir: 1 } }];
  if(mode === 'twospeed') steps = [...common,
    { title: L('محرك سرعتين', 'A two-speed motor'), text: L('فيه طريقتين: ملفين منفصلين لكل سرعة، أو محرك دالندر بملف واحد بيتوصل بطريقتين. في دالندر: السرعة البطيئة دلتا على الأطراف 1U 1V 1W، والسريعة نجمة مزدوجة YY على 2U 2V 2W.', 'There are two ways: separate windings for each speed, or a Dahlander motor with one winding connected two ways. In Dahlander, low speed is delta on 1U 1V 1W; high speed is double-star YY on 2U 2V 2W.'), focus: 'tbox', s: { run: 0 } },
    { title: L('السرعة البطيئة', 'Low speed'), text: L('K1 قفل: الكهربا على الأطراف 1U 1V 1W، والملفات دلتا، وعدد الأقطاب ضعف، فالسرعة نص.', 'K1 in: supply on 1U 1V 1W, the winding is in delta with twice the poles, so half the speed.'), focus: 'motor', s: { run: 1, fast: 0 } },
    { title: L('السرعة العالية', 'High speed'), text: L('K2 بيغذي 2U 2V 2W، وK3 بيقصّر 1U 1V 1W مع بعض فيعمل نقطة نجمة. التوصيل بقى YY والسرعة الضعف. لازم Interlock بين K1 والاتنين التانيين.', 'K2 feeds 2U 2V 2W and K3 shorts 1U 1V 1W into a star point: the connection is YY and the speed doubles. K1 must be interlocked against the other two.'), focus: 'motor', s: { run: 1, fast: 1 } }];
  if(mode === 'stardelta') steps = [...common,
    { title: L('ليه نجمة دلتا؟', 'Why star-delta?'), text: L('المحرك الكبير لو اشتغل دلتا على طول بيسحب تيار بدء 6 لـ 8 أضعاف تياره العادي، وده بيوقّع الجهد ويضر الشبكة. فبنبدأه نجمة: الجهد على كل ملف بيقل لـ 1 على جذر 3، وتيار البدء بيقل للتلت.', 'A large motor started straight in delta draws 6–8 times its normal current, dipping the voltage and stressing the supply. So we start it in star: each winding gets 1/√3 of the voltage and the starting current drops to a third.'), focus: 'motor', s: { run: 0 } },
    { title: L('البدء نجمة', 'Starting in star'), text: L('K1 وKY قفلوا. KY بيوصّل U2 V2 W2 مع بعض (الكوبري الأفقي) فيعمل نقطة النجمة. المحرك بيبدأ يلف بهدوء، والتايمر بيعد.', 'K1 and KY close. KY joins U2 V2 W2 (the straight link) to make the star point. The motor spins up gently while the timer counts.'), focus: 'tbox', s: { run: 1 } },
    { title: L('التحويل لدلتا', 'Changing to delta'), text: L('بعد ما التايمر يخلص (هنا 5 ثواني)، KY بيفصل وKΔ بيقفل. KΔ بيوصّل U1 مع W2، وV1 مع U2، وW1 مع V2، فالملفات بقت دلتا والمحرك بياخد سرعته وقدرته الكاملة. KY وKΔ عليهم Interlock عشان ما يقفلوش مع بعض.', 'When the timer ends (5 s here), KY drops out and KΔ closes, joining U1–W2, V1–U2 and W1–V2. The winding is now delta and the motor reaches full speed and power. KY and KΔ are interlocked so they never close together.'), focus: 'timer', s: { run: 1, late: 1 } },
    { title: L('يدوي أو بمؤقت', 'Manual or timed'), text: L('في الدايرة اليدوي بتحوّل لدلتا بزرار تاني لما تحس إن المحرك وصل سرعته. في دايرة المؤقت التايمر بيعمل ده لوحده، وده الأأمن لأن مفيش حد ينسى المحرك على نجمة.', 'In the manual circuit you change to delta with a second button once the motor is up to speed. In the timed circuit the timer does it automatically, which is safer because nobody can leave the motor in star.'), focus: 'station', s: { run: 1, late: 1 } }];
  return {
    ...ctx, view: V(.15, .45, 1.6), sway: true, hint: L('دوس على لوحة الأزرار أو المحرك أو الأوفرلود · صباعين للتقريب', 'Tap the buttons, motor or overload · pinch to zoom'), steps,
    apply(s){ S.run = s.run || 0; S.dir = s.dir || 1; S.fast = s.fast || 0; S.trip = 0; S.t = s.late ? 99 : 0; S.phase = s.run ? (s.late && mode === 'stardelta' ? 'D' : 'Y') : ''; derive(); },
    update(dt){
      if(mode === 'stardelta' && S.run && S.phase === 'Y'){ S.t += dt; tmr.setText((Math.max(0, 5 - S.t)).toFixed(1)); if(S.t >= 5){ S.phase = 'D'; derive(); showToast(L('التايمر خلص: اتحوّل دلتا.', 'Timer done: switched to delta.')); } }
      else if(tmr) tmr.setText(S.run ? '0.0' : '5.0');
      ks.forEach(k => k.update(dt)); bStop.update(dt); bRun.forEach(b => b.update(dt)); brk.update(dt); mot.update(dt); flows.forEach(f => f.update(dt));
      arrow.material.rotation += dt * 3 * S.dir * mot.speed;
    }
  };
}

/* ---------- لمبة الفلورسنت ---------- */
function buildFluorescent(){
  const ctx = makeCtx(), { root, part } = ctx, X = makeXray(); const H = 2.6;
  root.add(at(box(2.6, .1, 1.4, M(0xbfc6cc, { r: .85 })), 0, -.05, -.4));
  root.add(at(box(2.6, H, .08, M(0xdfe6ea, { r: .95 })), 0, H / 2, -1.1));
  root.add(at(box(2.6, .08, 1.2, M(0xf3f1ec, { r: .95 })), 0, H + .04, -.5));
  root.add(at(shadowPlane(3.5, 2), 0, -.11, -.4));
  const fx = new THREE.Group(); fx.position.set(0, H - .05, -.4); fx.scale.setScalar(1.3); root.add(fx);
  const coverM = X.wall(M(0xf4f5f7, { r: .4 }));
  fx.add(at(box(1.5, .08, .2, coverM), 0, 0, 0));
  const tubeM = M(0xf6f8fa, { r: .2, opacity: .8 });
  const tb = cyl(.035, .035, 1.3, tubeM, 20); tb.rotation.z = Math.PI / 2; fx.add(at(tb, 0, -.09, 0));
  [-.66, .66].forEach(x => { const c = cyl(.04, .04, .05, M(0xc9ced6, { m: .8 }), 16); c.rotation.z = Math.PI / 2; fx.add(at(c, x, -.09, 0)); });
  const fil = [-.62, .62].map(x => { const m = M(0x8a6a3a, { m: .3 }); const f = new THREE.Mesh(new THREE.TorusGeometry(.015, .005, 6, 12), m); f.rotation.y = Math.PI / 2; fx.add(at(f, x, -.09, 0)); return m; });
  const inner = new THREE.Group(); fx.add(inner); X.inside(inner);
  const ballast = at(box(.35, .05, .08, M(0x2b3038, { r: .5 })), -.25, .0, .0); inner.add(ballast);
  inner.add(at(label(L('بلاست', 'Ballast'), '#ffffff', .06), -.25, .07, .06));
  const starter = cyl(.025, .025, .07, M(0x3c78d8, { r: .4 }), 14); inner.add(at(starter, .4, .0, .0));
  const neon = M(0xff8fc8, { opacity: .8 }); const nb = new THREE.Mesh(new THREE.SphereGeometry(.018, 10, 8), neon); inner.add(at(nb, .4, .045, 0));
  inner.add(at(label(L('ستارتر', 'Starter'), '#ffffff', .06), .4, .08, .06));
  const ch = [V(-.7, .02, .05), V(-.42, .02, .05)], P = (x, y = .02, z = .05) => V(x, y, z);
  const wires = [wirePath([P(-.75), P(-.42)], COL.L, .006), wirePath([P(-.08), P(-.62, -.05)], COL.L, .006), wirePath([P(-.62, -.05, -.05), P(.38, .0, -.05)], 0x30343c, .006), wirePath([P(.42, .0, -.05), P(.62, -.05, -.05)], 0x30343c, .006), wirePath([P(.62, -.05), P(.75)], COL.N, .006)];
  wires.forEach(w => inner.add(w.m));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xdff4ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(2.4, .5, 1); fx.add(at(glow, 0, -.09, 0));
  const light = new THREE.PointLight(0xeaf6ff, 0, 5, 1.4); fx.add(at(light, 0, -.3, 0));
  const sw = makeWallSwitch(1); sw.group.position.set(-1.0, 1.15, -1.05); sw.group.scale.setScalar(1.6); root.add(sw.group);
  part('tube', fx, V(0, -.2, .1), L('أنبوبة الفلورسنت', 'Fluorescent tube'), L('أنبوبة زجاج فيها غاز وبخار زئبق، ومن جوه مدهونة بمادة فسفورية.', 'A glass tube with gas and mercury vapour, coated inside with phosphor.'));
  part('ballast', ballast, V(0, .06, 0), L('البلاست (الملف الخانق)', 'Ballast (choke)'), L('ملف بقلب حديد بيعمل شرارة البدء وبيحدد التيار بعدها.', 'An iron-cored coil that gives the starting kick and then limits the current.'));
  part('starter', starter, V(0, .07, 0), L('الستارتر', 'Starter'), L('مفتاح صغير فيه غاز نيون وشريحة مزدوجة المعدن.', 'A small neon switch with a bimetal strip.'));
  part('switch', sw.group, V(0, .16, .03), L('المفتاح', 'Switch'), L('دوس عليه عشان تشغّل اللمبة وتشوف خطوات الإشعال.', 'Tap to switch on and watch the start sequence.'));
  const st = { on: 0, x: 0, t: 0 };
  function derive(){ sw.set(0, st.on); X.set(st.x); coverM.opacity = st.x ? .25 : 1; }
  ctx.parts.switch.tap = () => { st.on ^= 1; st.t = 0; derive(); return st.on ? L('اتفرج على الستارتر الأول.', 'Watch the starter first.') : L('اللمبة طفت.', 'Lamp off.'); };
  ctx.parts.tube.tap = () => { st.x ^= 1; derive(); return st.x ? L('الغطا بقى شفاف.', 'Cover is see-through.') : L('الغطا رجع.', 'Cover back.'); };
  return {
    ...ctx, view: V(.1, -.32, 1.6), sway: true, xray: { get on(){ return !!st.x; }, toggle(){ return ctx.parts.tube.tap(); } },
    hint: L('دوس على المفتاح أو اللمبة · صباعين للتقريب', 'Tap the switch or the lamp · pinch to zoom'),
    steps: [
      { title: L('لمبة الفلورسنت', 'The fluorescent lamp'), text: L('اللمبة دي مش بتنوّر بسلك بيسخن زي اللمبة العادية. التيار بيعدّي في الغاز اللي جوه الأنبوبة، والزئبق بيطلّع أشعة فوق بنفسجية، والمادة الفسفورية على الزجاج بتحوّلها لنور أبيض.', 'This lamp has no glowing filament like an ordinary bulb. Current passes through the gas in the tube, the mercury gives off ultraviolet, and the phosphor on the glass turns it into white light.'), focus: 'tube', s: { on: 0, x: 0 } },
      { title: L('المكونات جوه الكشاف', 'Inside the fitting'), text: L('الغطا بقى شفاف. فيه البلاست (ملف خانق)، والستارتر، وفتيلتين في طرفين الأنبوبة. الفاز بيعدّي على البلاست ثم الفتيلة الأولى ثم الستارتر ثم الفتيلة التانية ثم النيوترال.', 'The cover is see-through: a ballast (choke), a starter and a filament at each end of the tube. The phase goes through the ballast, the first filament, the starter, the second filament, then neutral.'), focus: 'ballast', s: { on: 0, x: 1 } },
      { title: L('خطوات الإشعال', 'The start sequence'), text: L('1) الستارتر بينوّر بنفسجي ويقفل، فالفتيلتين بيسخنوا (برتقالي). 2) الشريحة بتبرد والستارتر بيفتح فجأة. 3) البلاست بيطلّع شرارة جهد عالي بتولّع الغاز. 4) الأنبوبة بتنوّر والستارتر بيفضل مفتوح.', '1) The starter glows violet and closes, heating both filaments (orange). 2) Its strip cools and it snaps open. 3) The ballast kicks out a high-voltage spike that strikes the gas. 4) The tube lights and the starter stays open.'), focus: 'starter', s: { on: 1, x: 1 } },
      { title: L('دور البلاست بعد التشغيل', 'The ballast after starting'), text: L('الغاز بعد ما يولّع مقاومته بتقل جدًا، ولو مفيش حاجة تحدد التيار هيزيد لحد ما اللمبة تتحرق. البلاست بيحدد التيار. في الكشافات الحديثة فيه بلاست إلكتروني بيعمل الاتنين من غير ستارتر ومن غير رعشة.', 'Once struck, the gas resistance falls sharply; without a limit the current would climb until the lamp failed. The ballast limits it. Modern fittings use an electronic ballast that does both jobs with no starter and no flicker.'), focus: 'ballast', s: { on: 1, x: 1, late: 1 } },
      { title: L('لمبات التفريغ الكهربي', 'Discharge lamps'), text: L('الفلورسنت واحدة من عيلة لمبات التفريغ، زي لمبات الزئبق والصوديوم في الشوارع. كلهم بينوّروا بتفريغ في غاز، ومحتاجين بلاست، ولازم يتوصلوا توازي على 220 فولت.', 'The fluorescent is one of the discharge-lamp family, like the mercury and sodium lamps in streets. All light by a discharge through gas, all need a ballast, and all are connected in parallel on 220 V.'), focus: 'tube', s: { on: 1, x: 0, late: 1 } }
    ],
    apply(s){ st.on = s.on; st.x = s.x; st.t = s.late ? 9 : 0; derive(); },
    update(dt){
      sw.update(dt); st.t += dt; const t = st.t;
      const phase = !st.on ? 0 : t < 1.6 ? 1 : t < 1.8 ? 2 : 3;
      setGlow(neon, phase === 1 ? .8 + .2 * Math.sin(t * 40) : 0, 1, .4, .8);
      fil.forEach(m => setGlow(m, phase === 1 ? Math.min(1, t) : 0, 1, .45, .1));
      const flick = phase === 2 ? (Math.sin(t * 90) > 0 ? 1 : .1) : phase === 3 ? 1 : 0;
      glow.material.opacity = ease(glow.material.opacity, flick * .9, dt, 12); light.intensity = 3 * glow.material.opacity;
      setGlow(tubeM, glow.material.opacity * .9, .85, .95, 1);
    }
  };
}

/* ---------- الجرس ومبين الأرقام ---------- */
function buildBell(){
  const ctx = makeCtx(), { root, part } = ctx, X = makeXray(); const H = 2.6;
  root.add(at(box(5.4, .1, 1.8, M(0xd6cfc2, { r: .8 })), 0, -.05, 0));
  const back = at(box(5.4, H, .08, X.wall(M(0xe6eef0, { r: .95 }))), 0, H / 2, -.84); root.add(back);
  root.add(at(shadowPlane(7, 3), 0, -.11, 0));
  const doorXs = [-1.9, -.6, .7];
  doorXs.forEach((x, i) => { const d = makeDoor(); d.position.set(x, 0, -.8); root.add(d); d.add(at(label(String(i + 1), '#ffffff', .22), 0, 2.28, .05)); });
  const btns = doorXs.map((x, i) => { const g = new THREE.Group(); g.position.set(x + .62, 1.25, -.79); root.add(g); g.add(at(box(.12, .16, .03, M(0xf4f5f7, { r: .35 })), 0, 0, .015)); const c = cyl(.03, .03, .03, M(0xf2c418, { r: .4 }), 16); c.rotation.x = Math.PI / 2; g.add(at(c, 0, 0, .04)); g.scale.setScalar(1.6); return { g, c }; });
  const board = new THREE.Group(); board.position.set(2.05, 1.7, -.78); root.add(board);
  board.add(at(box(.9, .6, .06, M(0x23272e, { r: .5 })), 0, 0, 0));
  const lamps = [0, 1, 2].map(i => { const m = M(0x5a2020, { r: .3 }); const p = box(.2, .2, .02, m); board.add(at(p, -.27 + i * .27, .06, .04)); board.add(at(label(String(i + 1), '#ffffff', .12), -.27 + i * .27, .06, .06)); return m; });
  const reset = cyl(.035, .035, .03, M(0x2fa84f, { r: .4 }), 16); reset.rotation.x = Math.PI / 2; board.add(at(reset, .3, -.2, .045)); board.add(at(label(L('إلغاء', 'Reset'), '#ffffff', .06), .15, -.2, .05));
  const bell = new THREE.Group(); bell.position.set(2.05, 2.25, -.76); root.add(bell);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(.13, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M(0xc9a14a, { m: .85, r: .3 })); dome.rotation.x = Math.PI / 2; bell.add(at(dome, 0, 0, .02));
  const hammer = new THREE.Group(); hammer.position.set(0, -.18, .06); bell.add(hammer); hammer.add(at(cyl(.008, .008, .14, M(0x8a8f96, { m: .8 }), 6), 0, .07, 0)); hammer.add(at(new THREE.Mesh(new THREE.SphereGeometry(.02, 10, 8), M(0x3a3f46)), 0, .14, 0));
  const trafo = new THREE.Group(); trafo.position.set(2.05, .9, -.78); root.add(trafo);
  trafo.add(at(box(.3, .24, .12, M(0x6c747d, { m: .4 })), 0, 0, 0)); trafo.add(at(label('220/12 V', '#ffffff', .07), 0, -.18, .07));
  const cond = new THREE.Group(); root.add(cond); X.inside(cond);
  const Z = -.79, P = (x, y) => V(x, y, Z);
  const bus = wirePath([P(1.95, .95), P(1.95, 2.5), P(-2.4, 2.5)], 0xd0473a, .01);
  const rets = btns.map((b, i) => wirePath([P(doorXs[i] + .62, 1.25), P(doorXs[i] + .62, 2.42 - i * .04), P(2.0 + (i - 1) * .27 * .5, 2.42 - i * .04), P(2.0 + (i - 1) * .27 * .5, 1.8)], 0x2a62c9, .01));
  [bus, ...rets].forEach(w => cond.add(w.m));
  cond.add(at(label(L('12 فولت بس', 'Only 12 V'), '#ffd34d', .1), 1.6, 2.6, Z));
  part('buttons', btns[0].g, V(0, .12, .03), L('ضاغط الجرس', 'Bell push'), L('واحد جنب كل باب. دوس على أي واحد.', 'One by each door. Tap any of them.'));
  part('board', board, V(0, .38, .04), L('لوحة مبين الأرقام', 'Number indicator board'), L('بتنوّر رقم الأوضة اللي ضربت الجرس. دوس عليها عشان تلغي.', 'Lights the number of the room that rang. Tap it to reset.'));
  part('bell', bell, V(0, .2, .06), L('الجرس', 'The bell'), L('مغناطيس بيشد مطرقة تخبط في الجرس.', 'An electromagnet pulls a hammer against the gong.'));
  part('trafo', trafo, V(0, .2, .07), L('محول الجرس', 'Bell transformer'), L('بينزّل 220 فولت لـ 12 فولت، فالضواغط والأسلاك آمنة.', 'Steps 220 V down to 12 V so the pushes and wires are safe.'));
  part('wall', back, V(-.6, 1.0, .06), L('الحيطة', 'The wall'), L('دوس عليها عشان تشوف الأسلاك.', 'Tap to see the wiring.'));
  const st = { lit: [0, 0, 0], ring: 0, x: 0 };
  const flows = rets.map(r => new Flow(root, chain(bus.p, r.p), { count: 26, speed: 1.6, size: .025 }));
  function derive(){ X.set(st.x); lamps.forEach((m, i) => setGlow(m, st.lit[i] ? 1 : 0, 1, .15, .1)); }
  const press = i => { st.lit[i] = 1; st.ring = 1.4; flows[i].target = 1; setTimeout(() => flows[i].target = 0, 1400); derive(); return L(`أوضة ${i + 1} ضربت الجرس: رقم ${i + 1} نوّر.`, `Room ${i + 1} rang: number ${i + 1} is lit.`); };
  ctx.parts.buttons.tap = () => press(0);
  ctx.parts.board.tap = () => { st.lit = [0, 0, 0]; derive(); return L('الأرقام اتلغت.', 'Indicator reset.'); };
  ctx.parts.bell.tap = () => press(2);
  ctx.parts.wall.tap = () => { st.x ^= 1; derive(); return st.x ? L('دي أسلاك الجرس.', 'Here is the bell wiring.') : L('الحيطة رجعت.', 'Wall back.'); };
  const objIdx = ctx.objIndex;
  btns.forEach((b, i) => { if(i){ ctx.parts['b' + i] = { obj: b.g, anchor: new THREE.Object3D(), mats: [], label: L('ضاغط', 'Push'), desc: '' }; b.g.add(ctx.parts['b' + i].anchor); ctx.parts['b' + i].tap = () => press(i); } });
  return {
    ...ctx, order: ctx.order, view: V(.1, .2, 1.6), sway: true, xray: { get on(){ return !!st.x; }, toggle(){ return ctx.parts.wall.tap(); } },
    hint: L('دوس على أي ضاغط جرس · صباعين للتقريب', 'Tap any bell push · pinch to zoom'),
    steps: [
      { title: L('جرس بمبين أرقام', 'A bell with a number indicator'), text: L('في المستشفيات والفنادق والمكاتب: كل أوضة ليها ضاغط جرس، والجرس واحد، ولوحة بتنوّر رقم الأوضة اللي ضربت. دوس على أي ضاغط جنب الأبواب.', 'In hospitals, hotels and offices each room has a bell push, there is one bell, and a board lights the number of the room that rang. Tap any push by the doors.'), s: { lit: [0, 0, 0] } },
      { title: L('الجرس بيرن إزاي', 'How the bell rings'), text: L('لما الضاغط يتقفل، التيار بيعدّي في ملف جوه الجرس فيبقى مغناطيس ويشد المطرقة تخبط. الشد بيفتح التلامس فالمغناطيس يفصل والمطرقة ترجع، وتتكرر بسرعة فتسمع الرنة.', 'When the push closes, current flows through a coil in the bell, making a magnet that pulls the hammer onto the gong. That pull opens a contact, the magnet releases, the hammer springs back, and it repeats fast: that is the ring.'), focus: 'bell', s: { lit: [1, 0, 0], ring: 1 } },
      { title: L('بمحول وبدون', 'With and without a transformer'), text: L('الجرس ممكن يشتغل على 220 فولت مباشرة، بس ساعتها الضاغط اللي برا الباب عليه جهد خطر. الأحسن محول جرس بينزّل لـ 12 فولت: الأسلاك رفيعة وآمنة حتى لو حد لمسها.', 'A bell can run on 220 V directly, but then the push outside the door carries a dangerous voltage. Better is a bell transformer stepping down to 12 V: thin wires that are safe even if touched.'), focus: 'trafo', s: { lit: [0, 0, 0] } },
      { title: L('الأسلاك جوه الحيطة', 'The wiring in the wall'), text: L('سلك مشترك أحمر من المحول بيلف على كل الضواغط. من كل ضاغط سلك راجع لوحده للوحة، على اللمبة بتاعة رقمه، وبعدين للجرس. فاللوحة بتعرف مين اللي ضرب.', 'A shared red wire from the transformer loops to every push. From each push its own return wire goes to the board, to its number lamp, then to the bell. That is how the board knows who rang.'), focus: 'board', s: { lit: [0, 1, 0], x: 1 } },
      { title: L('الرقم بيفضل منوّر', 'The number stays lit'), text: L('الرقم بيفضل منوّر بعد ما الضاغط يتساب (ريلاي ماسك نفسه)، لحد ما حد يدوس إلغاء على اللوحة. جرّب: دوس على أكتر من ضاغط، وبعدين دوس على اللوحة.', 'The number stays lit after the push is released (a self-holding relay) until someone presses Reset on the board. Try it: press several pushes, then tap the board.'), focus: 'board', s: { lit: [1, 0, 1], x: 0 } }
    ],
    apply(s){ st.lit = [...s.lit]; st.x = s.x || 0; st.ring = s.ring ? 99 : 0; derive(); },
    update(dt){ st.ring = Math.max(0, st.ring - dt); hammer.rotation.z = st.ring > 0 ? Math.sin(performance.now() * .08) * .25 : 0; flows.forEach(f => f.update(dt)); }
  };
}

/* ---------- ماكينة السلم الأوتوماتيك ---------- */
function buildStairTimer(){
  const ctx = makeCtx(), { root, part } = ctx, X = makeXray();
  const FL = 1.5, N = 3;
  root.add(at(box(3.6, .1, 1.6, M(0xcbb79a, { r: .85 })), 0, -.05, 0));
  const back = at(box(3.6, FL * N + .3, .08, X.wall(M(0xe8e1d2, { r: .95 }))), 0, (FL * N + .3) / 2, -.84); root.add(back);
  root.add(at(shadowPlane(5, 3), 0, -.11, 0));
  const stepM = M(0xe3dccf, { r: .7 });
  for(let f = 0; f < N; f++){
    const y0 = f * FL;
    if(f) root.add(at(box(1.4, .1, 1.6, M(0xcbb79a, { r: .85 })), -1.1, y0 - .05, 0));
    const dir = f % 2 ? -1 : 1, n = 8, rise = FL / n, run = 1.8 / n;
    for(let i = 0; i < n && f < N - 1; i++) root.add(at(box(run + .01, rise, .8, stepM), (dir > 0 ? -.4 : 1.4) + dir * run * (i + .5), y0 + rise * (i + .5), .3));
    root.add(at(label(L(`الدور ${f === 0 ? 'الأرضي' : f}`, f === 0 ? 'Ground floor' : `Floor ${f}`), '#ffffff', .14), -1.1, y0 + 1.35, -.78));
  }
  const pushes = [], lamps = [];
  for(let f = 0; f < N; f++){
    const g = new THREE.Group(); g.position.set(-1.5, f * FL + 1.1, -.79); root.add(g);
    g.add(at(box(.12, .12, .03, M(0xf4f5f7, { r: .35 })), 0, 0, .015)); const c = cyl(.03, .03, .03, M(0xff9f2e, { r: .35 }), 16); c.rotation.x = Math.PI / 2; g.add(at(c, 0, 0, .04)); g.scale.setScalar(1.7); pushes.push(g);
    const lp = new THREE.Group(); lp.position.set(-.6, f * FL + 1.35, -.76); root.add(lp); lp.add(at(box(.14, .04, .06, M(0x8a8f96, { m: .6 })), 0, .07, -.03)); const b = makeGlassBulb(.75); lp.add(b.group); lamps.push(b);
  }
  const box_ = new THREE.Group(); box_.position.set(1.3, 1.0, -.78); root.add(box_);
  box_.add(at(box(.5, .5, .08, M(0x9aa3ad, { m: .4 })), 0, 0, 0));
  const disp = makePanel(.3, .12, { font: 'bold 70px monospace', bg: '#1b2430', fg: '#ffd34d' }); box_.add(at(disp.mesh, 0, .08, .045));
  box_.add(at(label(L('ماكينة السلم', 'Stair timer'), '#ffffff', .07), 0, -.12, .05));
  const cond = new THREE.Group(); root.add(cond); X.inside(cond);
  const Z = -.79, P = (x, y) => V(x, y, Z);
  const top = FL * N + .1;
  const wPush = wirePath([P(1.2, 1.2), P(1.2, top), P(-1.5, top), P(-1.5, 1.1)], 0x30343c, .01);
  const wLamp = wirePath([P(1.4, 1.2), P(1.4, top + .06), P(-.6, top + .06), P(-.6, 1.4)], COL.L, .012);
  [wPush, wLamp].forEach(w => cond.add(w.m));
  cond.add(conduitPath([P(-1.5, 1.1), P(-1.5, top)], .04)); cond.add(conduitPath([P(-.6, 1.4), P(-.6, top + .06)], .04));
  part('push', pushes[1], V(0, .1, .02), L('ضاغط الإنارة', 'Light push'), L('ضاغط (مش مفتاح) في كل دور. دوس على أي واحد.', 'A push button (not a switch) on every floor. Tap any one.'));
  part('timer', box_, V(0, .32, .05), L('ماكينة السلم (تايمر)', 'Stair timer relay'), L('بتنوّر كل اللمبات لمدة محددة وتطفيها لوحدها.', 'Lights every lamp for a set time, then turns them off.'));
  part('lamps', lamps[2].group, V(0, .15, .05), L('لمبات السلم', 'Stair lamps'), L('متوصلين كلهم توازي على مخرج الماكينة.', 'All in parallel on the timer\'s output.'));
  part('wall', back, V(.6, .6, .06), L('الحيطة', 'The wall'), L('دوس عليها عشان تشوف الأسلاك.', 'Tap to see the wiring.'));
  const st = { left: 0, x: 0, total: 20 };
  const fl = new Flow(root, chain(wLamp.p), { count: 40, speed: 1.6, size: .025 });
  function derive(){ X.set(st.x); }
  const press = () => { st.left = st.total; return L(`النور ولّع في كل الأدوار، وهيطفي لوحده بعد ${st.total} ثانية.`, `Lights on on every floor; they switch off by themselves after ${st.total} s.`); };
  pushes.forEach((g, i) => { if(i !== 1){ const id = 'p' + i; ctx.parts[id] = { obj: g, anchor: new THREE.Object3D(), mats: [], label: L('ضاغط', 'Push'), desc: '' }; g.add(ctx.parts[id].anchor); ctx.parts[id].tap = press; } });
  ctx.parts.push.tap = press; ctx.parts.lamps.tap = press;
  ctx.parts.timer.tap = () => { st.total = st.total === 20 ? 60 : st.total === 60 ? 180 : 20; return L(`الماكينة اتظبطت على ${st.total} ثانية.`, `Timer set to ${st.total} s.`); };
  ctx.parts.wall.tap = () => { st.x ^= 1; derive(); return st.x ? L('دي أسلاك الضواغط والإنارة.', 'Here are the push and lamp wires.') : L('الحيطة رجعت.', 'Wall back.'); };
  return {
    ...ctx, view: V(.12, .1, 1.6), sway: true, xray: { get on(){ return !!st.x; }, toggle(){ return ctx.parts.wall.tap(); } },
    hint: L('دوس على أي ضاغط · صباعين للتقريب', 'Tap any push · pinch to zoom'),
    steps: [
      { title: L('ماكينة السلم الأوتوماتيك', 'The automatic stair timer'), text: L('في العمارات، نور السلم مش بيتطفى بمفتاح. فيه ضاغط في كل دور، تدوس عليه فينوّر السلم كله، وبعد مدة النور بيطفي لوحده عشان ما يفضلش والع طول الليل.', 'In apartment blocks the stair light has no off switch. There is a push on every floor; press it and the whole stairwell lights, then after a while it turns off by itself so it is not left on all night.'), s: { left: 0, x: 0 } },
      { title: L('دوس من أي دور', 'Press on any floor'), text: L('الضاغط بيقفل لحظة بس ويرجع. اللحظة دي بتبعت إشارة للماكينة، والماكينة هي اللي بتنوّر اللمبات وتبدأ تعد.', 'The push closes only for a moment and springs back. That moment signals the timer, and the timer lights the lamps and starts counting.'), focus: 'push', s: { left: 20, x: 0 } },
      { title: L('الماكينة بتعد', 'The timer counts down'), text: L('الشاشة بتعد التنازلي. لما توصل صفر، الماكينة بتفصل اللمبات. لو حد داس تاني وهي شغالة، العد بيبدأ من الأول. دوس على الماكينة عشان تغيّر المدة (20 أو 60 أو 180 ثانية).', 'The display counts down; at zero the timer cuts the lamps. A press while running restarts the count. Tap the timer to change the time (20, 60 or 180 s).'), focus: 'timer', s: { left: 12, x: 0 } },
      { title: L('جوه الحيطة', 'Inside the wall'), text: L('الضواغط كلها متوصلة توازي على سلك إشارة واحد رايح للماكينة. واللمبات كلها متوصلة توازي على مخرج الماكينة. الضاغط عمره ما بيشيل تيار اللمبات.', 'All the pushes are in parallel on one signal wire to the timer, and all the lamps are in parallel on its output. A push never carries the lamp current.'), focus: 'timer', s: { left: 20, x: 1 } }
    ],
    apply(s){ st.left = s.left; st.x = s.x; derive(); },
    update(dt){ st.left = Math.max(0, st.left - dt); const on = st.left > 0; lamps.forEach(l => l.set(on ? 1 : 0)); disp.setText(on ? String(Math.ceil(st.left)) : '0'); fl.target = on && st.x ? 1 : 0; fl.update(dt); lamps.forEach(l => l.update(dt)); }
  };
}
/* ================= الدفعة التالتة ================= */
function revealTube(curve, r, mat, seg = 160){ const m = tube(curve, r, mat, seg); const idx = m.geometry.index.count; m.userData.full = idx; m.geometry.setDrawRange(0, 0); return { m, set(f){ m.geometry.setDrawRange(0, Math.floor(idx * Math.max(0, Math.min(1, f)) / 6) * 6); } }; }
function benchScene(ctx){ ctx.root.add(makeWorkbench()); }

/* ---------- الموصلات والعوازل والوصلات (وحدة 2) ---------- */
function buildWireJoints(){
  const ctx = makeCtx(), { root, part } = ctx; benchScene(ctx);
  const cu = M(0xd98c5f, { m: .9, r: .3 }), insul = M(0xc0392b, { r: .55 }), insB = M(0x2f6fd6, { r: .55 });
  // اختبار المواد
  const bat = makeBattery(); at(bat.group, -1.8, 0, -.9); root.add(bat.group);
  const lamp = makeLamp(); at(lamp.group, -.9, 0, -1.1); root.add(lamp.group);
  const mats = [[L('نحاس', 'Copper'), 0xd98c5f, 1], [L('ألومنيوم', 'Aluminium'), 0xc9ced6, 1], [L('خشب', 'Wood'), 0x9b6b3e, 0], [L('بلاستيك', 'Plastic'), 0x2a62c9, 0], [L('كاوتش', 'Rubber'), 0x23272e, 0]];
  const samples = mats.map(([n, c, ok], i) => { const g = new THREE.Group(); g.position.set(-1.9 + i * .38, 0, -.35); root.add(g); g.add(at(box(.3, .06, .14, M(c, { m: ok ? .85 : .05, r: ok ? .3 : .8 })), 0, .03, 0)); g.add(at(label(n, '#ffffff', .07), 0, .16, .05)); return { g, ok, n }; });
  // سلك بيتقشر
  const wireY = .08, wz = .55;
  const core = cyl(.025, .025, 1.6, cu, 16); core.rotation.z = Math.PI / 2; root.add(at(core, -.9, wireY, wz));
  const sleeve = cyl(.04, .04, 1.6, insul, 20); sleeve.rotation.z = Math.PI / 2; root.add(at(sleeve, -.9, wireY, wz));
  const knife = new THREE.Group(); root.add(knife); knife.add(at(box(.3, .03, .06, M(0xd8a43a, { r: .5 })), 0, 0, 0)); knife.add(at(box(.18, .015, .05, M(0xc9ced6, { m: .9 })), -.22, 0, 0));
  // الوصلات: ذيل الفار، مفصلية، T
  const jx = [ .3, 1.05, 1.8 ];
  const pig = [0, 1].map(i => { const c = helix(jx[0], wz, .03, wireY + .02, wireY + .35, 5, i * Math.PI); return revealTube(c, .012, cu); });
  [[-.1, 0x2f6fd6], [.1, 0xc0392b]].forEach(([dz, col]) => { const w = cyl(.035, .035, .5, M(col, { r: .55 }), 14); w.rotation.x = Math.PI / 2; root.add(at(w, jx[0] + dz * .4, wireY, wz + .38)); });
  const pigCap = at(new THREE.Mesh(new THREE.ConeGeometry(.06, .14, 16), M(0xf2c418, { r: .5 })), jx[0], wireY + .42, wz); root.add(pigCap);
  const strA = cyl(.04, .04, .5, insB, 14); strA.rotation.z = Math.PI / 2; root.add(at(strA, jx[1] - .45, wireY, wz));
  const strB = cyl(.04, .04, .5, insB, 14); strB.rotation.z = Math.PI / 2; root.add(at(strB, jx[1] + .45, wireY, wz));
  const strL = helix(0, 0, .035, 0, 0, 1);
  const mkTw = (sx, dir) => { const pts = []; for(let i = 0; i <= 80; i++){ const f = i / 80, a = f * Math.PI * 12; pts.push(V(jx[1] + sx * .2 - dir * f * .2, wireY + Math.sin(a) * .035, wz + Math.cos(a) * .035)); } return revealTube(CR(pts), .011, cu); };
  const tw = [mkTw(-1, -1), mkTw(1, 1)];
  const main = cyl(.04, .04, .9, insul, 14); main.rotation.z = Math.PI / 2; root.add(at(main, jx[2], wireY, wz - .05));
  const tap = cyl(.04, .04, .45, insul, 14); tap.rotation.x = Math.PI / 2; root.add(at(tap, jx[2], wireY, wz + .25));
  const tCore = cyl(.026, .026, .2, cu, 10); tCore.rotation.z = Math.PI / 2; root.add(at(tCore, jx[2], wireY, wz - .05));
  const tw3 = (() => { const pts = []; for(let i = 0; i <= 80; i++){ const f = i / 80, a = f * Math.PI * 10; pts.push(V(jx[2] - .09 + f * .18, wireY + Math.sin(a) * .04, wz - .05 + Math.cos(a) * .04)); } return revealTube(CR(pts), .011, cu); })();
  const tape = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .3, 20, 1, true), M(0x1d2128, { r: .7, side: THREE.DoubleSide })); tape.rotation.z = Math.PI / 2; root.add(at(tape, jx[1], wireY, wz)); tape.visible = false;
  root.add(at(label(L('ذيل الفار', 'Pigtail'), '#ffffff', .1), jx[0], .6, wz)); root.add(at(label(L('مفصلية', 'Straight'), '#ffffff', .1), jx[1], .4, wz)); root.add(at(label(L('وصلة T', 'Tee'), '#ffffff', .1), jx[2], .4, wz));
  const P0 = termOf(bat.group, bat.plus), P1 = termOf(lamp.group, lamp.tL), P2 = termOf(lamp.group, lamp.tR), Bn = termOf(bat.group, bat.minus);
  wireOn(root, arch(P0, P1, .25), 0xd0473a);
  const leadA = new THREE.Group(), leadB = new THREE.Group(); root.add(leadA, leadB);
  [leadA, leadB].forEach(l => l.add(at(cyl(.01, .01, .16, M(0xc9ced6, { m: .9 }), 6), 0, .08, 0)));
  part('test', samples[0].g, V(0, .22, 0), L('اختبار المواد', 'Material test'), L('بطارية ولمبة وطرفين. دوس على أي مادة تختبرها.', 'Battery, lamp and two probes. Tap any material to test it.'));
  part('wire', sleeve, V(0, .12, 0), L('السلك والعزل', 'Wire and insulation'), L('قلب نحاس موصل، وعليه بلاستيك عازل.', 'A conducting copper core inside insulating plastic.'));
  part('pig', pigCap, V(0, .1, 0), L('وصلة ذيل الفار', 'Pigtail joint'), L('للعلب: الطرفين جنب بعض ويتلفوا وعليهم صامولة (كبّاس).', 'For boxes: ends side by side, twisted and capped with a connector.'));
  part('straight', strA, V(.45, .1, 0), L('الوصلة المفصلية', 'Straight (Western Union) joint'), L('لتطويل سلك: كل طرف بيتلف على التاني.', 'To extend a wire: each end wraps round the other.'));
  part('tee', tap, V(0, .1, -.2), L('وصلة T', 'Tee joint'), L('لأخذ فرع من سلك ماشي من غير ما تقطعه.', 'To tap a branch off a running wire without cutting it.'));
  const st = { sel: -1, strip: 0, j: 0 };
  let sf = 0;
  function probe(i){ const s = samples[i]; st.sel = i; const p = s.g.position; leadA.position.set(p.x - .1, .06, p.z); leadB.position.set(p.x + .1, .06, p.z); lamp.set(s.ok ? .9 : 0); return s.ok ? L(`${s.n}: اللمبة نوّرت، يعني موصل.`, `${s.n}: lamp on, a conductor.`) : L(`${s.n}: اللمبة مطفية، يعني عازل.`, `${s.n}: lamp off, an insulator.`); }
  samples.forEach((s, i) => { if(i){ const id = 's' + i; ctx.parts[id] = { obj: s.g, anchor: new THREE.Object3D(), mats: [], label: s.n, desc: '' }; s.g.add(ctx.parts[id].anchor); ctx.parts[id].tap = () => probe(i); } });
  ctx.parts.test.tap = () => probe(0);
  return {
    ...ctx, view: V(.1, 1.2, 1.5), sway: true, hint: L('دوس على أي مادة أو وصلة · صباعين للتقريب', 'Tap any material or joint · pinch to zoom'),
    steps: [
      { title: L('موصل ولا عازل؟', 'Conductor or insulator?'), text: L('حط الطرفين على المادة: لو اللمبة نوّرت تبقى موصلة (التيار بيعدّي فيها)، لو لأ تبقى عازلة. المعادن زي النحاس والألومنيوم موصلة، والخشب والبلاستيك والكاوتش عوازل. دوس على كل مادة وجرّب.', 'Touch both probes to the material: if the lamp lights it conducts; if not it insulates. Metals like copper and aluminium conduct; wood, plastic and rubber insulate. Tap each material.'), focus: 'test', s: { p: 0, strip: 0, j: 0 } },
      { title: L('ليه السلك نحاس وعليه بلاستيك؟', 'Why copper inside plastic?'), text: L('النحاس من أحسن الموصلات وبيتثني بسهولة، فبيشيل التيار. البلاستيك (PVC) حواليه عازل، بيمنع التيار يوصل لإيدك أو يلمس سلك تاني.', 'Copper is one of the best conductors and bends easily, so it carries the current. The PVC around it insulates, keeping current from your hand and from other wires.'), focus: 'wire', s: { p: 2, strip: 0, j: 0 } },
      { title: L('تقشير السلك', 'Stripping the wire'), text: L('بنشيل حوالي 1.5 لـ 2 سم من العزل بالقشّارة أو المشرط، من غير ما نجرح النحاس. أي جرح في القلب بيضعّفه ويسخّنه.', 'Remove about 1.5–2 cm of insulation with a stripper or knife without nicking the copper; any nick weakens the core and makes it run hot.'), focus: 'wire', s: { p: 2, strip: 1, j: 0 } },
      { title: L('وصلة ذيل الفار', 'The pigtail joint'), text: L('الطرفين جنب بعض ويتلفوا مع عقارب الساعة، وبعدين صامولة بلاستيك (كبّاس) فوقيهم. دي أكتر وصلة في علب التوصيل.', 'Lay the ends side by side, twist clockwise, then screw on a plastic connector. The commonest joint in junction boxes.'), focus: 'pig', s: { p: 2, strip: 1, j: 1 } },
      { title: L('الوصلة المفصلية', 'The straight joint'), text: L('لتطويل سلك: الطرفين متقاطعين، وكل طرف بيتلف لفات متلاصقة على التاني. الوصلة بتبقى قوية في الشد وتوصيلها كويس.', 'To lengthen a wire, cross the ends and wrap each tightly round the other. Strong in tension with good contact.'), focus: 'straight', s: { p: 2, strip: 1, j: 2 } },
      { title: L('وصلة T والشريط العازل', 'The tee joint and tape'), text: L('وصلة T بتاخد فرع من سلك ماشي: بنقشر حتة من النص ونلف عليها الفرع. وبعد أي وصلة لازم شريط عازل (لزق) يغطيها كويس، أو صامولة، عشان مفيش نحاس مكشوف.', 'A tee takes a branch from a running wire: strip a section mid-way and wrap the branch on it. After any joint, cover it fully with insulating tape or a connector so no copper is exposed.'), focus: 'tee', s: { p: 2, strip: 1, j: 3 } }
    ],
    apply(s){ probe(s.p); st.strip = s.strip; st.j = s.j; sf = 0; },
    update(dt){
      lamp.update(dt); sf = Math.min(1, sf + dt * .6);
      const strip = st.strip ? Math.min(1, sf * 1.4) : 0; sleeve.scale.y = 1 - .25 * strip; sleeve.position.x = -.9 - .2 * strip;
      knife.position.set(-.1 - .1 * strip, .16, wz); knife.visible = st.strip && sf < .9;
      pig.forEach(p => p.set(st.j >= 1 ? (st.j === 1 ? sf : 1) : 0)); pigCap.visible = st.j > 1 || (st.j === 1 && sf > .95);
      tw.forEach(p => p.set(st.j >= 2 ? (st.j === 2 ? sf : 1) : 0)); tw3.set(st.j >= 3 ? sf : 0); tape.visible = st.j >= 3 && sf > .95;
    }
  };
}

/* ---------- العدد والخامات والرموز (وحدة 3 و26) ---------- */
function makeSymbolBoard(){
  const c = document.createElement('canvas'); c.width = 512; c.height = 320;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .875), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  function draw(kind, name){
    const x = c.getContext('2d'); x.fillStyle = '#f7f7f2'; x.fillRect(0, 0, 512, 320); x.strokeStyle = '#1b1f26'; x.fillStyle = '#1b1f26'; x.lineWidth = 6; x.lineCap = 'round';
    x.font = 'bold 34px "IBM Plex Sans Arabic", sans-serif'; x.textAlign = 'center'; x.fillText(name, 256, 290);
    const ln = (a, b, cc, d) => { x.beginPath(); x.moveTo(a, b); x.lineTo(cc, d); x.stroke(); };
    const cy = 140;
    if(kind === 'switch'){ ln(120, cy, 220, cy); ln(220, cy, 300, cy - 50); ln(300, cy, 392, cy); x.beginPath(); x.arc(220, cy, 8, 0, 7); x.fill(); x.beginPath(); x.arc(300, cy, 8, 0, 7); x.fill(); }
    if(kind === 'lamp'){ ln(120, cy, 200, cy); ln(312, cy, 392, cy); x.beginPath(); x.arc(256, cy, 56, 0, 7); x.stroke(); ln(216, cy - 40, 296, cy + 40); ln(216, cy + 40, 296, cy - 40); }
    if(kind === 'socket'){ x.beginPath(); x.arc(256, cy + 20, 60, Math.PI, 0); x.stroke(); ln(196, cy + 20, 316, cy + 20); ln(256, cy - 40, 256, cy - 90); }
    if(kind === 'fuse'){ x.strokeRect(186, cy - 26, 140, 52); ln(120, cy, 392, cy); }
    if(kind === 'breaker'){ ln(120, cy, 220, cy); ln(220, cy, 300, cy - 50); ln(300, cy, 392, cy); ln(286, cy - 70, 316, cy - 40); ln(316, cy - 70, 286, cy - 40); }
    if(kind === 'earth'){ ln(256, cy - 80, 256, cy); ln(196, cy, 316, cy); ln(216, cy + 22, 296, cy + 22); ln(236, cy + 44, 276, cy + 44); }
    if(kind === 'coil'){ x.strokeRect(206, cy - 40, 100, 80); ln(120, cy, 206, cy); ln(306, cy, 392, cy); x.font = 'bold 30px monospace'; x.fillText('K', 256, cy + 10); }
    if(kind === 'motor'){ x.beginPath(); x.arc(256, cy, 60, 0, 7); x.stroke(); x.font = 'bold 44px monospace'; x.fillText('M', 256, cy + 4); x.font = 'bold 26px monospace'; x.fillText('3~', 256, cy + 40); }
    if(kind === 'push'){ ln(120, cy + 20, 210, cy + 20); ln(302, cy + 20, 392, cy + 20); ln(200, cy - 10, 312, cy - 10); ln(256, cy - 10, 256, cy - 60); ln(236, cy - 60, 276, cy - 60); }
    if(kind === 'tool'){ x.font = 'bold 30px "IBM Plex Sans Arabic", sans-serif'; x.fillText(L('عدة يدوية: مالهاش رمز في الرسم', 'Hand tool: no drawing symbol'), 256, cy); }
    tex.needsUpdate = true;
  }
  return { mesh, draw };
}
function buildToolsSymbols(){
  const ctx = makeCtx(), { root, part } = ctx; benchScene(ctx);
  const brd = makeSymbolBoard(); brd.mesh.position.set(.6, .95, -1.5); root.add(brd.mesh);
  root.add(at(box(1.5, .95, .04, M(0x2b3038)), .6, .95, -1.53));
  const items = [];
  const add = (id, obj, x, z, kind, ar, en, desc) => { obj.position.set(x, 0, z); root.add(obj); items.push({ id, obj, kind, name: L(ar, en), desc }); };
  const pl = new THREE.Group(); [-1, 1].forEach(s => { const h = at(box(.06, .03, .5, M(0xd23a2e, { r: .5 })), s * .05, .03, .15); h.rotation.y = s * .12; pl.add(h); }); pl.add(at(box(.12, .04, .2, M(0x8a8f96, { m: .9 })), 0, .03, -.2));
  add('pliers', pl, -1.7, -.6, 'tool', 'زرادية', 'Pliers', L('بتمسك وتلف وتقطع الأسلاك.', 'Grips, twists and cuts wires.'));
  const sd = new THREE.Group(); const sh = cyl(.012, .012, .4, M(0xc9ced6, { m: .9 }), 8); sh.rotation.x = Math.PI / 2; sd.add(at(sh, 0, .04, -.25)); const hd = cyl(.04, .04, .25, M(0xf2c418, { r: .5 }), 14); hd.rotation.x = Math.PI / 2; sd.add(at(hd, 0, .04, .05));
  add('tester', sd, -1.25, -.6, 'tool', 'مفك اختبار', 'Voltage tester', L('بينوّر لو المسمار عليه فاز.', 'Lights when its tip touches a live phase.'));
  const cut = new THREE.Group(); [-1, 1].forEach(s => { const h = at(box(.05, .03, .4, M(0x2a62c9, { r: .5 })), s * .04, .03, .1); h.rotation.y = s * .2; cut.add(h); });
  add('cutter', cut, -.8, -.6, 'tool', 'قصافة وقشارة', 'Cutters & stripper', L('القصافة بتقطع، والقشارة بتشيل العزل.', 'Cutters cut; the stripper removes insulation.'));
  const tp = new THREE.Mesh(new THREE.TorusGeometry(.08, .04, 12, 24), M(0x1d2128, { r: .7 })); tp.rotation.x = Math.PI / 2; const tg = new THREE.Group(); tg.add(at(tp, 0, .04, 0));
  add('tape', tg, -.35, -.6, 'tool', 'شريط عازل', 'Insulating tape', L('بيغطي الوصلات.', 'Covers joints.'));
  const swg = new THREE.Group(); const swp = makeWallSwitch(1); swp.group.rotation.x = -Math.PI / 2; swp.group.scale.setScalar(1.8); swp.group.position.y = .05; swg.add(swp.group);
  add('switch', swg, -1.7, .4, 'switch', 'مفتاح', 'Switch', L('بيفتح ويقفل الدايرة.', 'Opens and closes a circuit.'));
  const lh = new THREE.Group(); lh.add(at(cyl(.08, .1, .12, M(0xf4f5f7, { r: .4 }), 20), 0, .06, 0)); const bb = new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 12), M(0xfff4d6, { opacity: .6 })); lh.add(at(bb, 0, .2, 0));
  add('lamp', lh, -1.25, .4, 'lamp', 'دوي ولمبة', 'Lamp holder', L('بيمسك اللمبة ويوصّلها.', 'Holds and connects the lamp.'));
  const sk = makeSocket(); sk.plug(0); sk.update(1);
  add('socket', sk.group, -.75, .4, 'socket', 'بريزة', 'Socket', L('فيها L وN وأرضي.', 'Has L, N and earth.'));
  const fz = new THREE.Group(); const ft = cyl(.035, .035, .2, M(0xe9ebef, { r: .3 }), 14); ft.rotation.z = Math.PI / 2; fz.add(at(ft, 0, .04, 0)); [-1, 1].forEach(s => { const e = cyl(.04, .04, .03, M(0xc9ced6, { m: .9 }), 14); e.rotation.z = Math.PI / 2; fz.add(at(e, s * .11, .04, 0)); });
  add('fuse', fz, -.25, .4, 'fuse', 'فيوز', 'Fuse', L('سلك رفيع بيسيح لو التيار زاد.', 'A thin wire that melts on overcurrent.'));
  const bk = makeBreaker(.16, ''); bk.group.rotation.x = -Math.PI / 2; bk.group.position.y = .16; const bkg = new THREE.Group(); bkg.add(bk.group);
  add('breaker', bkg, .25, .4, 'breaker', 'قاطع', 'Circuit breaker', L('بيفصل في الحمل الزيادة والقصر، ويرجع تاني.', 'Trips on overload or short, and resets.'));
  const er = new THREE.Group(); er.add(at(cyl(.02, .02, .45, M(0xd98c5f, { m: .9 }), 10), 0, .05, 0)); er.children[0].rotation.z = Math.PI / 2;
  add('earth', er, .75, .4, 'earth', 'أرضي', 'Earth', L('توصيل بالأرض للحماية.', 'Protective connection to ground.'));
  const kc = makeContactor('K1'); kc.group.scale.setScalar(.7); kc.group.rotation.x = -Math.PI / 2; kc.group.position.y = .1; const kg = new THREE.Group(); kg.add(kc.group);
  add('coil', kg, 1.25, .4, 'coil', 'كونتاكتور', 'Contactor', L('ملف بيقفل تلامسات.', 'A coil that closes contacts.'));
  const pb = makeButton(0x2fa84f, ''); pb.group.rotation.x = -Math.PI / 2; pb.group.position.y = .04; const pbg = new THREE.Group(); pbg.add(pb.group);
  add('push', pbg, 1.7, .4, 'push', 'ضاغط', 'Push button', L('بيقفل وهو مضغوط بس.', 'Closes only while pressed.'));
  const mo = makeMotor3(); mo.group.scale.setScalar(.45); const mog = new THREE.Group(); mog.add(mo.group);
  add('motor', mog, 1.6, -.55, 'motor', 'محرك 3 فاز', '3-phase motor', L('بيحوّل الكهربا لحركة.', 'Turns electricity into motion.'));
  items.forEach(it => { part(it.id, it.obj, V(0, .3, 0), it.name, it.desc); ctx.parts[it.id].tap = () => { brd.draw(it.kind, it.name); return it.kind === 'tool' ? L(`${it.name}: عدة يدوية.`, `${it.name}: a hand tool.`) : L(`ده رمز ${it.name} في الرسم الكهربي.`, `This is the drawing symbol for ${it.name}.`); }; });
  return {
    ...ctx, view: V(.05, 1.25, 1.4), sway: true, hint: L('دوس على أي قطعة تشوف رمزها · صباعين للتقريب', 'Tap any item to see its symbol · pinch to zoom'),
    steps: [
      { title: L('العدد والخامات والرموز', 'Tools, materials and symbols'), text: L('قبل أي شغل لازم تعرف العدة والخامات، وتعرف رمز كل قطعة عشان تقرا الرسم الكهربي. دوس على أي حاجة على الترابيزة، ورمزها هيظهر على اللوحة.', 'Before any job you need to know the tools and materials, and each part\'s symbol so you can read a drawing. Tap anything on the bench and its symbol appears on the board.'), s: { k: 'tool', n: '' } },
      { title: L('العدة اليدوية', 'Hand tools'), text: L('الزرادية للمسك واللف، والقصافة للقطع، والقشارة لشيل العزل، ومفك الاختبار بينوّر لو لمس فاز. لازم يدّها تكون معزولة ومكتوب عليها 1000 فولت.', 'Pliers grip and twist, cutters cut, the stripper removes insulation, and the tester lights on a live phase. Handles must be insulated and rated 1000 V.'), focus: 'tester', s: { k: 'tool', n: L('مفك اختبار', 'Voltage tester') } },
      { title: L('المفتاح واللمبة', 'Switch and lamp'), text: L('المفتاح في الرسم خط بيتفتح بزاوية، واللمبة دايرة جواها علامة ×.', 'A switch is drawn as a line that opens at an angle; a lamp is a circle with a cross.'), focus: 'switch', s: { k: 'switch', n: L('مفتاح', 'Switch') } },
      { title: L('الحماية', 'Protection'), text: L('الفيوز مستطيل والخط ماشي جواه. القاطع زي المفتاح بس عليه علامة ×. والأرضي خط نازل وتحته 3 خطوط بتقصر.', 'A fuse is a rectangle with the line through it; a breaker is a switch with a cross; earth is a line down onto three shrinking bars.'), focus: 'breaker', s: { k: 'breaker', n: L('قاطع', 'Circuit breaker') } },
      { title: L('رموز دواير التحكم', 'Control-circuit symbols'), text: L('ملف الكونتاكتور مستطيل مكتوب جواه K، والضاغط خط فوقيه زرار، والمحرك دايرة مكتوب جواها M و3~ لو 3 فاز.', 'A contactor coil is a rectangle marked K, a push button is a bar with a plunger above it, and a motor is a circle marked M, with 3~ for three-phase.'), focus: 'coil', s: { k: 'coil', n: L('كونتاكتور', 'Contactor') } }
    ],
    apply(s){ brd.draw(s.k, s.n || L('دوس على أي قطعة', 'Tap any item')); },
    update(dt){}
  };
}

/* ---------- لحام القصدير والمكونات (وحدة 6 و7، مشترك) ---------- */
function buildSolderComponents(){
  const ctx = makeCtx(), { root, part } = ctx; benchScene(ctx);
  const pcb = at(box(1.6, .03, 1.0, M(0x1f7a4a, { r: .6 })), .2, .015, .1); root.add(pcb);
  const pads = []; for(let i = 0; i < 6; i++){ const p = cyl(.03, .03, .01, M(0xc9a14a, { m: .9, r: .3 }), 14); root.add(at(p, -.3 + i * .2, .035, .45)); pads.push(p); }
  const res = makeResistor([0xd0302a, 0xd0302a, 0x6b3b1e, 0xd9a441]); res.group.scale.setScalar(.8); at(res.group, -.2, .03, -.1); root.add(res.group);
  const cap = new THREE.Group(); cap.position.set(.35, .03, -.1); root.add(cap); cap.add(at(cyl(.08, .08, .24, M(0x2a3f8a, { r: .4 }), 20), 0, .12, 0)); cap.add(at(box(.03, .2, .162, M(0xdfe6ea)), .07, .12, 0)); cap.add(at(label('−', '#ffffff', .1), .12, .3, 0));
  const dio = new THREE.Group(); dio.position.set(.75, .03, -.1); root.add(dio); const db = cyl(.035, .035, .18, M(0x1d2128, { r: .4 }), 14); db.rotation.z = Math.PI / 2; dio.add(at(db, 0, .06, 0)); const band = cyl(.037, .037, .03, M(0xdfe6ea), 14); band.rotation.z = Math.PI / 2; dio.add(at(band, .065, .06, 0));
  const led = new THREE.Group(); led.position.set(.75, .03, .2); root.add(led); const ledM = M(0xd23a2e, { opacity: .8 }); led.add(at(cyl(.04, .04, .07, ledM, 16), 0, .07, 0)); led.add(at(new THREE.Mesh(new THREE.SphereGeometry(.04, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), ledM), 0, .105, 0));
  const iron = new THREE.Group(); root.add(iron);
  iron.add(at(cyl(.035, .035, .5, M(0x2b3038, { r: .5 }), 14), 0, .25, 0)); iron.add(at(cyl(.012, .02, .18, M(0xc9ced6, { m: .9 }), 10), 0, -.08, 0));
  const tipM = M(0x9aa0a6, { m: .9 }); iron.add(at(cyl(.003, .012, .06, tipM, 8), 0, -.2, 0)); iron.rotation.z = .6;
  const solder = tube(CR([V(-1.2, .05, .6), V(-.8, .05, .7), V(-.5, .2, .55), V(-.2, .12, .45)]), .008, M(0xc9ced6, { m: .9, r: .25 }), 40); root.add(solder);
  const joint = new THREE.Mesh(new THREE.ConeGeometry(.035, .04, 16), M(0xd8dde3, { m: .95, r: .15 })); joint.position.set(.1, .055, .45); root.add(joint); joint.scale.setScalar(.01);
  const coldJ = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), M(0x8a8f96, { m: .4, r: .9 })); coldJ.position.set(.3, .065, .45); root.add(coldJ); coldJ.visible = false;
  const pump = new THREE.Group(); pump.position.set(1.6, 0, .6); root.add(pump); const pb = cyl(.05, .05, .5, M(0x2a62c9, { r: .4 }), 16); pb.rotation.z = Math.PI / 2; pump.add(at(pb, 0, .06, 0)); const pn = cyl(.01, .03, .1, M(0xf4f5f7), 10); pn.rotation.z = Math.PI / 2; pump.add(at(pn, -.3, .06, 0));
  const bat = makeBattery(); bat.group.scale.setScalar(.7); at(bat.group, 1.5, 0, -.2); root.add(bat.group);
  part('iron', iron, V(0, .55, 0), L('كاوية اللحام', 'Soldering iron'), L('سنها بيوصل لحوالي 350 درجة.', 'Its tip runs at about 350 °C.'));
  part('joint', pads[2], V(0, .08, 0), L('نقطة اللحام', 'Solder joint'), L('قصدير بيربط رجل المكون بالبوردة.', 'Solder bonds a component lead to the board.'));
  part('pump', pump, V(0, .2, 0), L('شفاط القصدير', 'Desoldering pump'), L('بيشفط القصدير السايح عشان تفك المكون.', 'Sucks molten solder away to remove a part.'));
  part('res', res.group, V(0, .3, 0), L('المقاومة', 'Resistor'), L('بتحدد التيار. قيمتها بالألوان.', 'Limits current; value in colour bands.'));
  part('cap', cap, V(0, .4, 0), L('المكثف', 'Capacitor'), L('بيخزن شحنة. الإلكتروليتي ليه قطبية.', 'Stores charge; electrolytics are polarised.'));
  part('diode', dio, V(0, .2, 0), L('الدايود', 'Diode'), L('بيعدّي التيار في اتجاه واحد. الشريطة = الكاثود.', 'Passes current one way; the band marks the cathode.'));
  part('led', led, V(0, .25, 0), L('الليد', 'LED'), L('دايود بينوّر. دوس عليه تعكس البطارية.', 'A diode that lights. Tap to reverse the battery.'));
  const st = { step: 0, rev: 0 }; let t = 0;
  ctx.parts.led.tap = () => { st.rev ^= 1; return st.rev ? L('اتعكس: الليد مطفي، الدايود مانع التيار.', 'Reversed: the LED is off, the diode blocks.') : L('اتجاه أمامي: الليد نوّر.', 'Forward: the LED lights.'); };
  ctx.parts.diode.tap = ctx.parts.led.tap;
  return {
    ...ctx, view: V(.1, 1.3, 1.3), sway: true, hint: L('دوس على الليد أو الدايود · صباعين للتقريب', 'Tap the LED or diode · pinch to zoom'),
    steps: [
      { title: L('لحام القصدير', 'Soft soldering'), text: L('كاوية سنها بيسخن لحوالي 350 درجة، وسلك قصدير جواه مادة مساعدة (فلكس) بتنضف المعدن. القصدير بيسيح ويربط رجل المكون بالنحاس اللي على البوردة.', 'An iron with a tip at about 350 °C and solder wire with a flux core that cleans the metal. The solder melts and bonds the lead to the copper pad.'), focus: 'iron', s: { step: 0 } },
      { title: L('الطريقة الصح', 'The right way'), text: L('سخّن الرجل والنقطة مع بعض ثانيتين، وبعدين قرّب القصدير منهم مش من الكاوية. لما يسيح ويغطي، شيل القصدير الأول وبعدين الكاوية. النتيجة نقطة لامعة شكلها مخروط.', 'Heat the lead and pad together for two seconds, then feed solder onto them, not the iron. When it flows, remove the solder first, then the iron. A good joint is shiny and cone-shaped.'), focus: 'joint', s: { step: 1 } },
      { title: L('لحام بارد', 'A cold joint'), text: L('لو النقطة باهتة ومكوّرة زي النقطة التانية، يبقى لحام بارد: القصدير ما مسكش كويس. ده سبب أعطال كتير بتيجي وتروح. الحل تسخّنها تاني بفلكس.', 'A dull, balled joint like the second one is a cold joint: the solder never wetted. It causes many intermittent faults. Reheat it with flux.'), focus: 'joint', s: { step: 2 } },
      { title: L('فك المكونات', 'Removing parts'), text: L('سخّن النقطة لحد ما تسيح، وحط بوز الشفاط عليها ودوس الزرار: بيشفط القصدير وتطلع الرجل بسهولة. ممكن كمان شريط سحب النحاس.', 'Melt the joint, put the pump nozzle on it and press the button: it sucks the solder away and the lead comes free. Desoldering braid also works.'), focus: 'pump', s: { step: 3 } },
      { title: L('المقاومة والمكثف', 'Resistor and capacitor'), text: L('المقاومة بتحدد التيار، وقيمتها بالألوان: أحمر أحمر بني = 220 أوم. المكثف بيخزن شحنة، والإلكتروليتي ليه طرف سالب عليه شريطة، ولو اتعكس ممكن ينفجر.', 'A resistor limits current; red-red-brown = 220 Ω. A capacitor stores charge; an electrolytic has a striped negative lead and can burst if reversed.'), focus: 'cap', s: { step: 4 } },
      { title: L('الدايود والليد', 'Diode and LED'), text: L('الدايود بيعدّي التيار في اتجاه واحد بس، من الأنود للكاثود (الشريطة). الليد دايود بينوّر. دوس عليه عشان تعكس البطارية: الليد هيطفي لأن الدايود مانع التيار.', 'A diode passes current one way only, anode to cathode (the band). An LED is a light-emitting diode. Tap it to reverse the battery: it goes dark because the diode blocks.'), focus: 'led', s: { step: 5 } }
    ],
    apply(s){ st.step = s.step; st.rev = 0; t = 0; },
    update(dt){
      t += dt; const k = st.step;
      iron.position.set(k === 1 || k === 2 ? (k === 1 ? .2 : .4) : -.6, k === 1 || k === 2 ? .22 : .45, k === 1 || k === 2 ? .48 : .2);
      setGlow(tipM, k === 1 ? .6 : 0, 1, .4, .1);
      joint.scale.setScalar(k >= 1 ? Math.min(1, k === 1 ? Math.max(.01, (t - 1) * .8) : 1) : .01); coldJ.visible = k >= 2;
      pump.position.set(k === 3 ? .45 : 1.6, k === 3 ? .1 : 0, k === 3 ? .55 : .6); pump.rotation.z = k === 3 ? -.6 : 0;
      setGlow(ledM, k === 5 && !st.rev ? 1 : 0, 1, .2, .15);
    }
  };
}

/* ---------- تثبيت وثني المواسير (وحدة 8) ---------- */
function buildConduit(){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(at(box(4.4, .1, 2.0, M(0xcbb79a, { r: .85 })), 0, -.05, 0));
  root.add(at(box(4.4, 2.6, .1, M(0xd8d0c0, { r: .95 })), 0, 1.3, -1.0));
  root.add(at(shadowPlane(6, 3), 0, -.11, 0));
  const pipeM = M(0xe9ebef, { r: .45 }), Zw = -.9;
  const run = CR([V(-2.0, 2.2, Zw), V(-.6, 2.2, Zw), V(-.45, 2.18, Zw), V(-.4, 2.05, Zw), V(-.4, 1.25, Zw)]);
  const pipe = revealTube(run, .05, pipeM, 120); root.add(pipe.m);
  const jb = at(box(.3, .3, .1, M(0xf4f5f7, { r: .4 })), -.4, 1.1, Zw); root.add(jb); jb.add(at(cyl(.1, .1, .02, M(0xe2e4e8), 20), 0, 0, .06)).children.at(-1).rotation.x = Math.PI / 2;
  const sad = []; [-1.6, -1.0, -.4].forEach((x, i) => { const g = new THREE.Group(); g.position.set(i === 2 ? -.4 : x, i === 2 ? 1.7 : 2.2, Zw + .02); if(i === 2) g.rotation.z = Math.PI / 2; root.add(g); const s = new THREE.Mesh(new THREE.TorusGeometry(.065, .015, 8, 16, Math.PI), M(0x9aa0a6, { m: .8 })); s.rotation.z = Math.PI / 2; g.add(s); [-1, 1].forEach(k => g.add(at(cyl(.012, .012, .03, M(0x3a3f46), 8), 0, k * .08, 0))); sad.push(g); });
  const loose = new THREE.Group(); loose.position.set(.4, .9, -.4); loose.scale.setScalar(1.4); root.add(loose);
  const bendAt = f => CR([V(-.9, .08, 0), V(-.2, .08, 0), V(.05, .08 + f * .05, 0), V(.2 + (1 - f) * .3, .08 + f * .3, 0), V(.2 + (1 - f) * .7, .08 + f * .75, 0)]);
  let lp = tube(bendAt(0), .05, pipeM, 60); loose.add(lp);
  const spring = new THREE.Group(); loose.add(spring); const spM = M(0x8a8f96, { m: .8 }); let sp = tube(helix(0, 0, .035, 0, 1, 18), .007, spM, 300); spring.add(sp); spring.rotation.z = -Math.PI / 2; spring.position.set(-1.1, .08, 0);
  const saw = new THREE.Group(); root.add(saw); saw.add(at(box(.5, .08, .015, M(0xc9ced6, { m: .9 })), 0, 0, 0)); saw.add(at(box(.18, .14, .04, M(0xd23a2e)), .3, .02, 0)); saw.position.set(1.7, .3, .3);
  part('pipe', pipe.m, V(-1.2, 2.3, Zw), L('الماسورة على الحيطة', 'Conduit on the wall'), L('بتحمي الأسلاك. بتتركب ظاهرة أو جوه الحيطة.', 'Protects the wires; surface-run or buried.'));
  part('saddle', sad[0], V(0, .12, .02), L('الكلبسات', 'Saddles'), L('بتمسك الماسورة كل 50 لـ 80 سم.', 'Hold the conduit every 50–80 cm.'));
  part('box', jb, V(0, .2, .06), L('علبة التوصيل', 'Junction box'), L('الوصلات بتتعمل جواها بس، مش جوه الماسورة.', 'Joints are made only inside boxes, never in the conduit.'));
  part('spring', spring, V(.5, 0, 0), L('ياي الثني', 'Bending spring'), L('بيدخل جوه الماسورة عشان ما تتكسرش وهي بتتثني.', 'Goes inside the pipe so it does not kink when bent.'));
  const st = { step: 0 }; let t = 0, lastF = -1;
  return {
    ...ctx, view: V(.1, .5, 1.6), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('المواسير في التركيبات', 'Conduit in installations'), text: L('الأسلاك عمرها ما بتتركب عريانة في الحيطة. بتمشي جوه مواسير بلاستيك (PVC) بتحميها من الخبط والرطوبة، وبتخلي تغيير السلك بعدين سهل من غير تكسير.', 'Wires are never laid bare in a wall. They run inside PVC conduit that protects them from knocks and damp and lets them be replaced later without breaking the wall.'), focus: 'pipe', s: { step: 0 } },
      { title: L('القص', 'Cutting'), text: L('بنقيس الطول ونعلّم، ونقص بمنشار حديد أو مقص مواسير، وننضف الحرف من الرايش عشان ما يجرحش عزل السلك وهو داخل.', 'Measure, mark, cut with a hacksaw or pipe cutter, and deburr the edge so it cannot nick the wire insulation.'), s: { step: 1 } },
      { title: L('الثني بالياي', 'Bending with a spring'), text: L('ندخّل ياي الثني جوه الماسورة لحد مكان الثنية، ونثنيها على الركبة بالراحة. الياي بيمنع الماسورة تتكسر أو تتقفل من جوه. أقل نصف قطر للثنية حوالي 3 أضعاف قطر الماسورة.', 'Push the bending spring inside to the bend point and bend it gently over your knee. The spring stops the pipe kinking or collapsing. Keep the bend radius at least about three pipe diameters.'), focus: 'spring', s: { step: 2 } },
      { title: L('التثبيت بالكلبسات', 'Fixing with saddles'), text: L('الماسورة بتتثبت على الحيطة بكلبسات ومسامير وخوابير، كل 50 لـ 80 سم، وجنب كل ثنية وكل علبة. الخط لازم يكون مستقيم أفقي أو رأسي، عشان أي حد يعرف السلك ماشي فين.', 'Fix the conduit with saddles, screws and plugs every 50–80 cm and next to every bend and box. Runs must be straight, horizontal or vertical, so anyone can tell where a wire goes.'), focus: 'saddle', s: { step: 3 } },
      { title: L('علب التوصيل', 'Junction boxes'), text: L('الماسورة بتدخل في علبة. كل الوصلات بتتعمل جوه العلب بس، عمرها ما تتعمل جوه الماسورة. وبعد التركيب بنسحب السلك جوه الماسورة بسوستة السحب.', 'The conduit enters a box. Every joint is made inside a box, never inside the conduit. After fixing, the wires are pulled through with a draw tape.'), focus: 'box', s: { step: 4 } }
    ],
    apply(s){ st.step = s.step; t = 0; },
    update(dt){
      t += dt; const k = st.step;
      pipe.set(k >= 3 ? 1 : k === 0 ? 1 : 0);
      sad.forEach(s => s.visible = k !== 1 && k !== 2); jb.visible = k !== 1 && k !== 2;
      const f = k === 2 ? Math.min(1, Math.max(0, (t - .8) * .5)) : k > 2 ? 1 : 0;
      if(Math.abs(f - lastF) > .01){ loose.remove(lp); lp.geometry.dispose(); lp = tube(bendAt(f), .05, pipeM, 60); loose.add(lp); lastF = f; }
      spring.position.x = k === 2 ? -1.1 + Math.min(1, t * .8) * .9 : -1.1; spring.visible = k === 2;
      loose.visible = k === 1 || k === 2; saw.visible = k === 1; saw.position.x = .2 + Math.sin(t * 10) * .12; saw.position.y = .14;
    }
  };
}

/* ---------- 8 لمبات بالريموت (وحدة 15) ---------- */
function buildRemote(){
  const ctx = makeCtx(), { root, part } = ctx; const H = 2.6;
  root.add(at(box(4.0, .1, 3.0, M(0xb08a5e, { r: .7 })), 0, -.05, 0));
  root.add(at(box(4.0, H, .08, M(0xe9e3d6, { r: .95 })), 0, H / 2, -1.5));
  root.add(at(box(4.0, .08, 2.0, M(0xf3f1ec, { r: .95 })), 0, H + .04, -.5));
  root.add(at(box(1.9, .42, .85, M(0x6b7d5a, { r: .9 })), 0, .23, -1.0));
  root.add(at(shadowPlane(5, 4), 0, -.11, 0));
  const spots = []; for(let r = 0; r < 2; r++) for(let c = 0; c < 4; c++){ const g = new THREE.Group(); g.position.set(-1.35 + c * .9, H - .01, -1.05 + r * .9); root.add(g); g.add(at(cyl(.09, .09, .02, M(0xf4f5f7, { r: .4 }), 20), 0, 0, 0)); const b = makeGlassBulb(.6); b.group.position.y = -.04; g.add(b.group); g.add(at(label(String(r * 4 + c + 1), '#ffd34d', .1), 0, -.18, 0)); spots.push(b); }
  const rx = new THREE.Group(); rx.position.set(1.6, 1.9, -1.45); root.add(rx); rx.add(at(box(.4, .26, .06, M(0x2b3038, { r: .5 })), 0, 0, 0)); const eye = new THREE.Mesh(new THREE.SphereGeometry(.03, 12, 8), M(0x8a1c1c, { r: .2 })); rx.add(at(eye, -.12, .05, .04)); rx.add(at(label(L('ريسيفر', 'Receiver'), '#ffffff', .06), .04, -.06, .04));
  const rem = new THREE.Group(); rem.position.set(.1, .75, .7); rem.rotation.x = -.7; root.add(rem);
  rem.add(at(box(.18, .03, .45, M(0x1d2128, { r: .5 })), 0, 0, 0));
  for(let i = 0; i < 8; i++) rem.add(at(cyl(.018, .018, .015, M(0x6c747d), 10), -.045 + (i % 2) * .09, .022, -.15 + Math.floor(i / 2) * .08));
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.01, .05, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xff5a5a, transparent: true, opacity: 0, depthWrite: false })); root.add(beam); beam.userData.noFit = true;
  const a = rem.position.clone(), b = rx.position.clone().add(V(-.12, .05, .05)); beam.position.copy(a).lerp(b, .5); beam.scale.y = a.distanceTo(b); beam.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  part('remote', rem, V(0, .1, 0), L('الريموت', 'Remote'), L('8 زراير، كل زرار لقناة. دوس عليه.', '8 buttons, one per channel. Tap it.'));
  part('rx', rx, V(0, .2, .04), L('الريسيفر', 'Receiver'), L('فيه 8 ريلايات، كل ريلاي بيشغّل لمبة.', '8 relays inside, each switching one lamp.'));
  part('spots', spots[5].group.parent, V(0, -.2, 0), L('اللمبات الـ 8', 'The 8 lamps'), L('كل لمبة على قناة. دوس على أي واحدة.', 'Each lamp on its own channel. Tap any.'));
  const st = { on: Array(8).fill(0) }; let pulse = 0, ch = 0;
  const send = i => { st.on[i] ^= 1; pulse = .5; return L(`القناة ${i + 1}: اللمبة ${st.on[i] ? 'نوّرت' : 'طفت'}.`, `Channel ${i + 1}: lamp ${st.on[i] ? 'on' : 'off'}.`); };
  ctx.parts.remote.tap = () => { const r = send(ch); ch = (ch + 1) % 8; return r; };
  ctx.parts.spots.tap = () => send(5);
  spots.forEach((s, i) => { if(i !== 5){ const id = 'l' + i; ctx.parts[id] = { obj: s.group.parent, anchor: new THREE.Object3D(), mats: [], label: L(`لمبة ${i + 1}`, `Lamp ${i + 1}`), desc: '' }; s.group.parent.add(ctx.parts[id].anchor); ctx.parts[id].tap = () => send(i); } });
  return {
    ...ctx, view: V(.1, .05, 1.6), sway: true, hint: L('دوس على الريموت أو أي لمبة · صباعين للتقريب', 'Tap the remote or any lamp · pinch to zoom'),
    steps: [
      { title: L('8 لمبات بالريموت', '8 lamps by remote'), text: L('صالة فيها 8 سبوتات في السقف، وكل واحدة بتتحكم فيها لوحدها من ريموت، من غير مفاتيح على الحيطة.', 'A room with 8 ceiling spotlights, each controlled separately from a remote, with no wall switches.'), s: { on: [0, 0, 0, 0, 0, 0, 0, 0] } },
      { title: L('الريموت بيبعت إشارة', 'The remote sends a code'), text: L('لما تدوس زرار، الريموت بيبعت إشارة (أشعة تحت حمرا أو راديو) فيها كود القناة. الشعاع الأحمر هنا بيوري الإشارة رايحة للريسيفر.', 'Pressing a button sends a code for that channel by infrared or radio. The red beam shows the signal travelling to the receiver.'), focus: 'remote', s: { on: [1, 0, 0, 0, 0, 0, 0, 0], p: 1 } },
      { title: L('الريسيفر والريلايات', 'Receiver and relays'), text: L('الريسيفر بيقرا الكود ويقفل الريلاي بتاع القناة دي، والريلاي بيوصّل الفاز للمبتها. الريسيفر نفسه متغذي 220 فولت، واللمبات كلها نيوترالها مشترك.', 'The receiver reads the code and closes that channel\'s relay, which feeds the phase to its lamp. The receiver runs on 220 V and all lamps share one neutral.'), focus: 'rx', s: { on: [1, 1, 0, 0, 1, 1, 0, 0] } },
      { title: L('جرّب بنفسك', 'Try it yourself'), text: L('دوس على أي لمبة عشان تبعت قناتها، أو دوس على الريموت وهو هيمشي على القنوات واحدة واحدة.', 'Tap any lamp to send its channel, or tap the remote to step through the channels.'), focus: 'spots', s: { on: [1, 0, 1, 0, 0, 1, 0, 1] } }
    ],
    apply(s){ st.on = [...s.on]; pulse = s.p ? 2 : 0; },
    update(dt){ pulse = Math.max(0, pulse - dt); beam.material.opacity = pulse > 0 ? .25 + .2 * Math.sin(performance.now() * .03) : 0; setGlow(eye.material, pulse > 0 ? 1 : .2, 1, .1, .1); spots.forEach((b, i) => { b.set(st.on[i] ? 1 : 0); b.update(dt); }); }
  };
}

/* ---------- إنارة الإعلانات (وحدة 16) ---------- */
function buildChaser(){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(at(box(4.4, .1, 1.8, M(0x8a8f96, { r: .9 })), 0, -.05, 0));
  root.add(at(box(4.4, 2.6, .12, M(0x5a4a3e, { r: .9 })), 0, 1.3, -.8));
  root.add(at(box(1.6, 1.5, .06, M(0x9fc7e0, { opacity: .55, r: .1 })), -1.1, .95, -.72));
  root.add(at(box(.9, 1.9, .06, M(0x3a3f46, { m: .5 })), 1.3, .95, -.72));
  root.add(at(shadowPlane(6, 3), 0, -.11, 0));
  const sign = new THREE.Group(); sign.position.set(0, 2.05, -.68); root.add(sign);
  sign.add(at(box(3.8, .75, .1, M(0x16213e, { r: .5 })), 0, 0, 0));
  const word = 'STCE', bulbs = [];
  word.split('').forEach((ch, li) => { const s = label(ch, '#e8b94a', .5); s.position.set(-1.2 + li * .8, 0, .07); sign.add(s); });
  for(let i = 0; i < 26; i++){ const top = i < 13; const x = -1.8 + (i % 13) * .3; const m = M(0xfff2c4, { opacity: .7 }); const bb = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), m); sign.add(at(bb, x, top ? .32 : -.32, .07)); bulbs.push(m); }
  const ctl = new THREE.Group(); ctl.position.set(-1.9, 1.0, -.72); root.add(ctl); ctl.add(at(box(.36, .3, .08, M(0x2b3038, { r: .5 })), 0, 0, 0));
  const disp = makePanel(.26, .1, { font: 'bold 50px monospace', bg: '#1b2430', fg: '#7fe0a0' }); ctl.add(at(disp.mesh, 0, .05, .045)); ctl.add(at(label(L('فلاشر', 'Flasher'), '#ffffff', .06), 0, -.09, .05));
  part('sign', sign, V(0, .5, .1), L('اللافتة', 'The sign'), L('لمبات صغيرة حوالين الحروف.', 'Small bulbs around the letters.'));
  part('ctl', ctl, V(0, .22, .05), L('وحدة الفلاشر', 'Flasher unit'), L('بتشغّل اللمبات بالترتيب. دوس عليها تغيّر النمط.', 'Fires the bulbs in sequence. Tap it to change the pattern.'));
  const MODES = ['chase', 'blink', 'fill']; const st = { mode: 0 }; let t = 0;
  ctx.parts.ctl.tap = () => { st.mode = (st.mode + 1) % 3; return [L('نمط الجري', 'Chase'), L('نمط الوميض', 'Blink'), L('نمط الملء', 'Fill')][st.mode]; };
  ctx.parts.sign.tap = ctx.parts.ctl.tap;
  return {
    ...ctx, view: V(.05, .3, 1.6), sway: true, hint: L('دوس على الفلاشر عشان تغيّر النمط · صباعين للتقريب', 'Tap the flasher to change pattern · pinch to zoom'),
    steps: [
      { title: L('إنارة الإعلانات', 'Advertising lights'), text: L('اللافتات اللي لمباتها بتجري أو بترمش بيشغّلها فلاشر (Chaser). اللمبات متقسّمة 3 أو 4 مجموعات، والفلاشر بيشغّلهم بالدور.', 'Signs whose bulbs run or flash are driven by a chaser. The bulbs are split into 3 or 4 groups and the chaser fires them in turn.'), focus: 'sign', s: { mode: 0 } },
      { title: L('ليه الضي بيبان ماشي؟', 'Why the light seems to move'), text: L('اللمبة 1 و4 و7… مجموعة، و2 و5 و8… مجموعة، و3 و6 و9… مجموعة. لما المجموعات تنوّر ورا بعض بسرعة، العين بتشوف الضي بيجري.', 'Bulbs 1, 4, 7… form one group, 2, 5, 8… another, 3, 6, 9… a third. Lit one after another quickly, the eye sees the light running.'), focus: 'sign', s: { mode: 0 } },
      { title: L('وحدة الفلاشر', 'The flasher unit'), text: L('جوه الفلاشر دايرة إلكترونية (تايمر ومخارج ترانزستور أو ترياك) بتقفل كل مخرج لمدة قصيرة. فيه أنماط كتير: جري، ووميض، وملء. دوس عليها وغيّر النمط.', 'Inside is an electronic timer driving transistor or triac outputs that close each channel briefly. Patterns include chase, blink and fill. Tap it to change.'), focus: 'ctl', s: { mode: 1 } }
    ],
    apply(s){ st.mode = s.mode; t = 0; },
    update(dt){ t += dt; const m = MODES[st.mode]; disp.setText(m.toUpperCase()); bulbs.forEach((mt, i) => { const k = i % 13; let on = 0; if(m === 'chase') on = (k % 3) === Math.floor(t * 6) % 3 ? 1 : 0; if(m === 'blink') on = Math.floor(t * 3) % 2; if(m === 'fill') on = k <= Math.floor(t * 8) % 14 ? 1 : 0; setGlow(mt, on, 1, .75, .3); }); }
  };
}

/* ---------- الإنتركم والكالون (وحدة 21 و22) ---------- */
function buildIntercom(){
  const ctx = makeCtx(), { root, part } = ctx;
  root.add(at(box(4.6, .1, 2.2, M(0x9aa0a6, { r: .9 })), 0, -.05, .2));
  const fac = at(box(3.2, 4.0, .2, M(0xd8c7a8, { r: .9 })), -.4, 2.0, -.9); root.add(fac);
  for(let f = 0; f < 3; f++) for(let c = 0; c < 2; c++) root.add(at(box(.6, .7, .05, M(0x5a7a94, { r: .2, opacity: .85 })), -1.3 + c * 1.8, 1.6 + f * 1.0, -.78));
  const gate = new THREE.Group(); gate.position.set(-.85, 0, -.78); root.add(gate);
  const leaf = new THREE.Group(); gate.add(leaf); leaf.add(at(box(.9, 1.4, .05, M(0x3a3f46, { m: .6 })), .45, .7, 0)); for(let i = 0; i < 5; i++) leaf.add(at(box(.03, 1.3, .06, M(0x2b3038, { m: .7 })), .1 + i * .18, .7, .01));
  const bolt = at(box(.06, .03, .03, M(0xc9ced6, { m: .9 })), .9, .75, .04); leaf.add(bolt);
  const lock = at(box(.08, .2, .06, M(0x2b3038)), .97, .75, .02); gate.add(lock);
  const panel = new THREE.Group(); panel.position.set(.45, 1.25, -.76); root.add(panel);
  panel.add(at(box(.32, .6, .05, M(0xc9ced6, { m: .7, r: .35 })), 0, 0, 0));
  const cam = new THREE.Mesh(new THREE.SphereGeometry(.03, 12, 8), M(0x111418, { r: .1 })); panel.add(at(cam, 0, .22, .03));
  panel.add(at(box(.18, .08, .02, M(0x1d2128)), 0, .12, .03));
  const btns = [0, 1, 2, 3].map(i => { const b = cyl(.022, .022, .015, M(0xe9ebef), 12); b.rotation.x = Math.PI / 2; panel.add(at(b, 0, -.02 - i * .06, .03)); panel.add(at(label(String(i + 1), '#1b1f26', .045), .07, -.02 - i * .06, .035)); return b; });
  const apt = new THREE.Group(); apt.position.set(1.6, 0, .2); root.add(apt);
  apt.add(at(box(1.2, 2.2, .06, M(0xe9e3d6, { r: .95 })), 0, 1.1, -.5)); apt.add(at(box(1.2, .05, 1.0, M(0xc7ab84)), 0, .02, 0)); apt.add(at(label(L('شقة 3 من جوه', 'Flat 3 inside'), '#ffffff', .1), 0, 2.3, -.45));
  const mon = new THREE.Group(); mon.position.set(0, 1.35, -.46); apt.add(mon);
  mon.add(at(box(.36, .3, .04, M(0xf4f5f7, { r: .4 })), 0, 0, 0));
  const scr = makePanel(.24, .17, { font: 'bold 70px sans-serif', bg: '#0e141b', fg: '#cfe7ff' }); mon.add(at(scr.mesh, -.03, .02, .021));
  const ob = cyl(.018, .018, .015, M(0x2fa84f), 12); ob.rotation.x = Math.PI / 2; mon.add(at(ob, .14, -.08, .025)); mon.add(at(label('🔓', '#ffffff', .05), .14, -.02, .03));
  const visitor = new THREE.Group(); visitor.position.set(.45, 0, -.2); root.add(visitor);
  visitor.add(at(cyl(.12, .16, .9, M(0x3c5f8a, { r: .8 }), 16), 0, .45, 0)); visitor.add(at(new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 12), M(0xd9b08c, { r: .8 })), 0, 1.0, 0));
  const cable = tube(CR([V(.45, 1.0, -.74), V(.6, 2.4, -.74), V(1.6, 2.4, -.35), V(1.6, 1.5, -.43)]), .012, M(0x2b3038), 50); root.add(cable);
  const fl = new Flow(root, CR([V(.45, 1.0, -.74), V(.6, 2.4, -.74), V(1.6, 2.4, -.35), V(1.6, 1.5, -.43)]), { count: 20, speed: 1.4, size: .025 });
  part('panel', panel, V(0, .38, .03), L('وحدة الباب', 'Door station'), L('زرار لكل شقة، وميكروفون وسماعة، وكاميرا في المرئي.', 'A button per flat, mic and speaker, and a camera on video models.'));
  part('monitor', mon, V(0, .22, .03), L('الوحدة الداخلية', 'Indoor unit'), L('سماعة أو شاشة، وزرار فتح الباب. دوس عليها.', 'Handset or screen, and a door-release button. Tap it.'));
  part('lock', lock, V(0, .16, .04), L('الكالون الكهربي', 'Electric lock'), L('ملف بيسحب اللسان لما يتغذى.', 'A coil that pulls the bolt back when energised.'));
  part('cable', cable, V(1.0, 2.45, -.5), L('الكابل', 'The cable'), L('بيوصّل وحدة الباب بكل الشقق.', 'Links the door station to every flat.'));
  const st = { call: 0, video: 0, open: 0 }; let ring = 0, openT = 0;
  function derive(){ scr.setText(st.call && st.video ? '🙂' : st.call ? (st.video ? '' : '☎') : ''); fl.target = st.call ? 1 : 0; }
  ctx.parts.panel.tap = () => { st.call = 1; ring = 2; derive(); return L('الزائر داس على شقة 3: الوحدة الداخلية بترن.', 'The visitor pressed flat 3: the indoor unit rings.'); };
  ctx.parts.monitor.tap = () => { if(!st.call) return L('محدش بيرن دلوقتي. دوس على وحدة الباب الأول.', 'Nobody is calling. Tap the door station first.'); st.open = 1; openT = 4; return L('اتدس فتح: الكالون سحب اللسان والباب اتفتح.', 'Release pressed: the lock withdrew its bolt and the gate opened.'); };
  ctx.parts.lock.tap = ctx.parts.monitor.tap;
  return {
    ...ctx, view: V(.12, .35, 1.6), sway: true, hint: L('دوس على وحدة الباب ثم الوحدة الداخلية · صباعين للتقريب', 'Tap the door station, then the indoor unit · pinch to zoom'),
    steps: [
      { title: L('الإنتركم', 'The intercom'), text: L('على باب العمارة وحدة فيها زرار لكل شقة. الزائر بيدوس على رقم الشقة، والوحدة اللي جوه الشقة بترن، وصاحب الشقة يكلّمه من غير ما ينزل.', 'At the building entrance a station has a button per flat. The visitor presses a flat number, the indoor unit rings, and the resident talks without going down.'), focus: 'panel', s: { call: 0, video: 0 } },
      { title: L('النداء والكلام', 'Calling and talking'), text: L('لما الزرار يتداس، إشارة بتمشي في الكابل للشقة دي بس فترن. بعدها الصوت بيمشي في الاتجاهين: ميكروفون وسماعة في كل طرف.', 'Pressing a button sends a signal down the cable to that flat only, which rings. Then speech flows both ways: a mic and speaker at each end.'), focus: 'cable', s: { call: 1, video: 0 } },
      { title: L('فتح الباب بالكالون', 'Opening with the electric lock'), text: L('الكالون الكهربي فيه ملف، لما ساكن الشقة يدوس زرار الفتح الملف بيتغذى (عادة 12 فولت) ويسحب اللسان، والباب يتفتح بزقة. دوس على الوحدة الداخلية.', 'The electric lock has a coil. When the resident presses release, the coil is energised (usually 12 V) and pulls back the bolt so the gate opens with a push. Tap the indoor unit.'), focus: 'lock', s: { call: 1, video: 0 } },
      { title: L('الإنتركم المرئي', 'Video intercom'), text: L('نفس الفكرة بس وحدة الباب فيها كاميرا، والوحدة الداخلية شاشة. ساكن الشقة بيشوف الزائر قبل ما يفتح، وده أأمن.', 'Same idea, but the door station has a camera and the indoor unit a screen. The resident sees the visitor before opening, which is safer.'), focus: 'monitor', s: { call: 1, video: 1 } }
    ],
    apply(s){ st.call = s.call; st.video = s.video; st.open = 0; openT = 0; ring = s.call ? 2 : 0; derive(); },
    update(dt){ ring = Math.max(0, ring - dt); openT = Math.max(0, openT - dt); mon.position.x = ring > 0 ? Math.sin(performance.now() * .06) * .004 : 0; bolt.position.x = .9 - (openT > 0 ? .06 : 0); leaf.rotation.y = ease(leaf.rotation.y, openT > 0 && openT < 3.6 ? .9 : 0, dt, 3); setGlow(ob.material, openT > 0 ? 1 : 0, .2, 1, .3); fl.update(dt); }
  };
}

/* ---------- اكتشاف الأعطال (وحدة 23) ---------- */
function buildFaultFind(){
  const ctx = makeCtx(), { root, part } = ctx, X = makeXray(); const H = 2.6;
  root.add(at(box(4.0, .1, 2.4, M(0xc7ab84, { r: .75 })), 0, -.05, -.2));
  const back = at(box(4.0, H, .08, X.wall(M(0xe4e9e4, { r: .95 }))), 0, H / 2, -1.4); root.add(back);
  root.add(at(shadowPlane(5, 3), 0, -.11, -.2));
  const db = new THREE.Group(); db.position.set(-1.5, 1.6, -1.35); root.add(db); db.add(at(box(.5, .45, .08, M(0x9aa3ad, { m: .4 })), 0, 0, 0));
  const brk = makeBreaker(.12, ''); brk.group.scale.setScalar(.8); db.add(at(brk.group, 0, 0, .06));
  const sw = makeWallSwitch(1); sw.group.position.set(-.4, 1.15, -1.35); sw.group.scale.setScalar(1.7); root.add(sw.group);
  const pend = makePendant(); pend.group.position.set(.9, H, -1.0); root.add(pend.group);
  root.add(at(box(4.0, .08, .9, M(0xf3f1ec, { r: .95 })), 0, H + .04, -.95));
  const cond = new THREE.Group(); root.add(cond); X.inside(cond);
  const Z = -1.34, P = (x, y) => V(x, y, Z);
  const segs = [wirePath([P(-1.5, 1.82), P(-1.5, 2.45), P(-.43, 2.45), P(-.43, 1.18)], COL.L), wirePath([P(-.37, 1.18), P(-.37, 2.4), P(.9, 2.4), P(.9, 2.55)], COL.L)];
  segs.forEach(s => cond.add(s.m));
  const cut = label('✕', '#ff3b30', .3); cut.position.copy(P(.25, 2.4)); cond.add(cut);
  const tester = new THREE.Group(); root.add(tester);
  const tb = cyl(.02, .02, .3, M(0xf2c418, { r: .5 }), 10); tester.add(at(tb, 0, .15, 0)); const tip = cyl(.005, .005, .12, M(0xc9ced6, { m: .9 }), 6); tester.add(at(tip, 0, -.06, 0));
  const neonM = M(0xff7a3a, { opacity: .9 }); tester.add(at(new THREE.Mesh(new THREE.SphereGeometry(.018, 10, 8), neonM), 0, .22, .015));
  tester.rotation.x = -.5;
  part('lamp', pend.group, V(0, -.3, 0), L('اللمبة', 'The lamp'), L('مش بتنوّر. فين العطل؟', 'It will not light. Where is the fault?'));
  part('db', db, V(0, .3, .05), L('القاطع', 'The breaker'), L('أول حاجة تتأكد منها.', 'The first thing to check.'));
  part('switch', sw.group, V(0, .16, .02), L('المفتاح', 'The switch'), L('بنقيس على دخوله وخروجه.', 'Test its input and output.'));
  part('tester', tester, V(0, .32, 0), L('مفك الاختبار', 'Voltage tester'), L('بينوّر لو لمس فاز.', 'Glows on a live phase.'));
  const PTS = [null, V(-1.5, 1.6, -1.25), V(-.43, 1.15, -1.25), V(-.37, 1.15, -1.25), V(.9, 2.05, -1.0), V(.9, 2.05, -1.0)];
  const GLOW = [0, 1, 1, 1, 0, 0];
  const st = { step: 0, x: 0 };
  function derive(){ X.set(st.x); }
  return {
    ...ctx, view: V(.12, .25, 1.6), sway: true, xray: { get on(){ return !!st.x; }, toggle(){ st.x ^= 1; derive(); return st.x ? L('دي الأسلاك جوه الحيطة.', 'Here is the wiring in the wall.') : L('الحيطة رجعت.', 'Wall back.'); } },
    hint: L('اتبع الخطوات · صباعين للتقريب', 'Follow the steps · pinch to zoom'),
    steps: [
      { title: L('اللمبة مش بتنوّر', 'The lamp will not light'), text: L('المفتاح مقفول واللمبة مطفية. اكتشاف العطل بيمشي بترتيب: نبدأ من المصدر ونمشي ورا التيار نقطة نقطة لحد ما نلاقي النقطة اللي التيار ما وصلهاش.', 'The switch is on but the lamp is dark. Fault-finding goes in order: start at the supply and follow the current point by point until you find where it stops.'), focus: 'lamp', s: { step: 0 } },
      { title: L('1) القاطع', '1) The breaker'), text: L('القاطع مقفول، والمفك على خروجه بينوّر: الفاز موجود في اللوحة.', 'The breaker is on and the tester glows at its output: the phase is present at the board.'), focus: 'db', s: { step: 1 } },
      { title: L('2) دخول المفتاح', '2) Switch input'), text: L('المفك على دخول المفتاح بينوّر: السلك من اللوحة للمفتاح سليم.', 'The tester glows at the switch input: the wire from the board to the switch is fine.'), focus: 'switch', s: { step: 2 } },
      { title: L('3) خروج المفتاح', '3) Switch output'), text: L('والمفتاح مقفول، المفك على خروجه بينوّر: المفتاح سليم.', 'With the switch on, the tester glows at its output: the switch is fine.'), focus: 'switch', s: { step: 3 } },
      { title: L('4) دوي اللمبة', '4) The lamp holder'), text: L('المفك على طرف الدوي مش بينوّر! يعني الفاز طلع من المفتاح بس ما وصلش للمبة. العطل في السلك ما بين المفتاح واللمبة.', 'At the lamp holder the tester stays dark! The phase left the switch but never reached the lamp. The fault is in the wire between them.'), focus: 'lamp', s: { step: 4 } },
      { title: L('العطل اتلقى', 'Fault found'), text: L('الحيطة بقت شفافة: السلك مقطوع جوه الماسورة (علامة ×). الحل نسحب سلك جديد بين علبة المفتاح ومخرج اللمبة. ولو العطل كان في النيوترال، المفك كان هينوّر عند اللمبة بس مش هتشتغل، وده يتقاس بالأفوميتر.', 'The wall is see-through: the wire is broken inside the conduit (×). The fix is to pull a new wire between the switch box and the lamp point. Had the neutral been broken, the tester would glow at the lamp yet it would not work; that needs a multimeter.'), focus: 'lamp', s: { step: 5, x: 1 } }
    ],
    apply(s){ st.step = s.step; st.x = s.x || 0; derive(); sw.set(0, 1); brk.set(1); pend.set(0); const p = PTS[s.step]; tester.visible = !!p; if(p) tester.position.copy(p).add(V(0, .05, .1)); setGlow(neonM, GLOW[s.step], 1, .45, .15); },
    update(dt){ sw.update(dt); brk.update(dt); pend.update(dt); }
  };
}

/* ---------- الميجر والقدرة (وحدة 5) ---------- */
function buildMeggerPower(){
  const ctx = makeCtx(), { root, part } = ctx; benchScene(ctx);
  const cab = tube(CR([V(-1.9, .06, .2), V(-1.0, .06, .5), V(-.2, .06, .3), V(.5, .06, .55)]), .04, M(0xe9ebef, { r: .5 }), 60); root.add(cab);
  [[-.04, COL.L], [0, COL.N], [.04, COL.E]].forEach(([dz, c]) => root.add(at(cyl(.012, .012, .18, M(c, { r: .5 }), 8), .6, .06, .55 + dz)).children.at(-1).rotation.z = Math.PI / 2);
  const meg = new THREE.Group(); meg.position.set(-.6, 0, -.6); root.add(meg);
  meg.add(at(box(.7, .3, .55, M(0xd23a2e, { r: .5 })), 0, .15, 0));
  const mg = makeGauge('#d23a2e', 0, 500, [0, 100, 200, 500], 'MΩ'); mg.group.rotation.x = -Math.PI / 2; mg.group.scale.setScalar(.9); meg.add(at(mg.group, -.1, .31, 0));
  meg.add(at(label(L('ميجر 500V', 'Megger 500 V'), '#ffffff', .08), .2, .35, .2));
  const heater = new THREE.Group(); heater.position.set(1.3, 0, -.6); root.add(heater);
  heater.add(at(box(.7, .5, .2, M(0xf4f5f7, { r: .4 })), 0, .25, 0)); const glowM = M(0xff6a2a, { opacity: .9 }); for(let i = 0; i < 4; i++) heater.add(at(box(.55, .03, .02, glowM), 0, .1 + i * .1, .11));
  const pm = new THREE.Group(); pm.position.set(.4, 0, .1); root.add(pm);
  pm.add(at(box(.5, .12, .35, M(0x2b3038, { r: .5 })), 0, .06, 0));
  const pp = makePanel(.4, .14, { font: 'bold 56px monospace', bg: '#b9cba0' }); pp.mesh.rotation.x = -Math.PI / 2; pm.add(at(pp.mesh, 0, .125, -.03)); pm.add(at(label(L('عداد قدرة', 'Power meter'), '#ffffff', .07), 0, .22, .12));
  part('megger', meg, V(0, .5, 0), L('الميجر', 'Insulation tester (megger)'), L('بيطلّع 500 أو 1000 فولت مستمر ويقيس مقاومة العزل بالميجا أوم.', 'Applies 500 or 1000 V DC and reads insulation resistance in megohms.'));
  part('cable', cab, V(-1.0, .15, .5), L('الكابل', 'The cable'), L('بنختبر العزل بين أسلاكه.', 'We test the insulation between its cores.'));
  part('power', pm, V(0, .3, 0), L('عداد القدرة', 'Power meter'), L('بيقيس الجهد والتيار مع بعض ويحسب الوات.', 'Measures voltage and current together and works out watts.'));
  part('heater', heater, V(0, .6, 0), L('دفاية 2000 وات', '2000 W heater'), L('الحِمل اللي بنقيس قدرته.', 'The load whose power we measure.'));
  const st = { step: 0 };
  return {
    ...ctx, view: V(.1, 1.25, 1.45), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('الميجر: اختبار العزل', 'The megger: insulation test'), text: L('الأفوميتر ما ينفعش يختبر العزل، لأنه بيقيس بجهد صغير. الميجر بيطلّع جهد عالي (500 أو 1000 فولت مستمر) بين السلكين أو بين السلك والأرضي، ويقيس المقاومة بالميجا أوم.', 'A multimeter cannot test insulation because it measures with a small voltage. A megger applies a high voltage (500 or 1000 V DC) between two cores or a core and earth, and reads megohms.'), focus: 'megger', s: { step: 0, mg: 0 } },
      { title: L('عزل سليم', 'Good insulation'), text: L('الكابل مفصول خالص من الكهربا ومن الأحمال. بين الفاز والأرضي القراية فوق 200 ميجا أوم: العزل ممتاز. الحد الأدنى المقبول عادة 1 ميجا أوم للتركيبات المنزلية على 500 فولت.', 'With the cable fully isolated, phase-to-earth reads over 200 MΩ: excellent. The usual minimum for house wiring at 500 V is 1 MΩ.'), focus: 'cable', s: { step: 1, mg: 300 } },
      { title: L('عزل تالف', 'Failed insulation'), text: L('القراية 0.2 ميجا أوم: العزل ضعيف (رطوبة أو جرح في السلك). ده سبب فصل قاطع التسريب وخطر الكهربا. لازم الكابل يتغير قبل التشغيل.', 'It reads 0.2 MΩ: weak insulation from damp or a damaged core. This trips RCDs and risks shocks. Replace the cable before energising.'), focus: 'cable', s: { step: 2, mg: 2 } },
      { title: L('قياس القدرة', 'Measuring power'), text: L('القدرة (وات) = الجهد × التيار × معامل القدرة. عداد القدرة بيقيس الجهد على التوازي والتيار على التوالي في نفس الوقت. الدفاية: 220 فولت × 9.1 أمبير × 1 ≈ 2000 وات.', 'Power (W) = voltage × current × power factor. A power meter measures voltage in parallel and current in series at once. The heater: 220 V × 9.1 A × 1 ≈ 2000 W.'), focus: 'power', s: { step: 3, mg: 0 } }
    ],
    apply(s){ st.step = s.step; mg.set(s.mg); setGlow(glowM, s.step === 3 ? 1 : 0, 1, .35, .1); },
    update(dt){ mg.update(dt); pp.setText(st.step === 3 ? '2002 W' : '0 W'); }
  };
}
/* ================= برنامج الإلكترونيات: الدفعة الأولى ================= */
function makeBreadboard(w = 2.2, d = 1.0){
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * d / w);
  const x = c.getContext('2d'); x.fillStyle = '#f2f1ec'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#c94b4b'; x.fillRect(8, 10, c.width - 16, 3); x.fillStyle = '#3c6fd1'; x.fillRect(8, 26, c.width - 16, 3);
  x.fillStyle = '#c94b4b'; x.fillRect(8, c.height - 13, c.width - 16, 3); x.fillStyle = '#3c6fd1'; x.fillRect(8, c.height - 29, c.width - 16, 3);
  x.fillStyle = '#9aa0a6'; for(let i = 14; i < c.width - 10; i += 10) for(let j = 40; j < c.height - 40; j += 10){ if(Math.abs(j - c.height / 2) < 8) continue; x.fillRect(i, j, 4, 4); }
  x.fillStyle = '#dcdad2'; x.fillRect(8, c.height / 2 - 6, c.width - 16, 12);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  g.add(at(box(w, .08, d, [M(0xf2f1ec), M(0xf2f1ec), new THREE.MeshStandardMaterial({ map: t, roughness: .8 }), M(0xf2f1ec), M(0xf2f1ec), M(0xf2f1ec)]), 0, .04, 0));
  return g;
}
function makePSU(){
  const g = new THREE.Group(); g.add(at(box(.7, .35, .45, M(0x2b3038, { r: .5 })), 0, .175, 0));
  const p = makePanel(.36, .12, { font: 'bold 58px monospace', bg: '#1b2430', fg: '#ff6a5a' }); g.add(at(p.mesh, -.08, .25, .226));
  [[.22, 0xd23a2e], [.3, 0x15181d]].forEach(([xx, c]) => { const j = cyl(.025, .025, .03, M(c), 12); j.rotation.x = Math.PI / 2; g.add(at(j, xx, .1, .23)); });
  g.add(at(label(L('مصدر جهد', 'Power supply'), '#ffffff', .06), 0, .05, .24));
  return { group: g, setText: p.setText, plus: V(.22, .1, .25), minus: V(.3, .1, .25) };
}
function makeLED(color = 0xd23a2e){
  const g = new THREE.Group(); const m = M(color, { opacity: .8 });
  g.add(at(cyl(.04, .04, .07, m, 16), 0, .1, 0)); g.add(at(new THREE.Mesh(new THREE.SphereGeometry(.04, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), m), 0, .135, 0));
  [-.015, .015].forEach((xx, i) => g.add(at(cyl(.004, .004, i ? .07 : .09, M(0xc9ced6, { m: .9 }), 6), xx, i ? .035 : .045, 0)));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); glow.position.y = .12; g.add(glow);
  let lv = 0, tg = 0;
  return { group: g, set(v){ tg = v; }, update(dt){ lv = ease(lv, tg, dt, 10); setGlow(m, lv, 1, .9, .9); glow.material.opacity = lv * .6; glow.scale.setScalar(.1 + .14 * lv); } };
}
function makeDIP(n, name){
  const g = new THREE.Group(); const L2 = n / 2;
  g.add(at(box(.08 * L2 + .04, .05, .22, M(0x1d2128, { r: .4 })), 0, .06, 0));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(.015, 12), M(0x3a3f46)), -.04 * L2 + .02, .086, -.06)).children.at(-1).rotation.x = -Math.PI / 2;
  for(let i = 0; i < L2; i++) [-1, 1].forEach(s => g.add(at(box(.015, .05, .02, M(0xc9ced6, { m: .9 })), -.04 * L2 + .04 + i * .08, .03, s * .12)));
  const lb = label(name, '#e8edf3', .06); g.add(at(lb, 0, .11, .03)); g.userData.lab = lb;
  return g;
}
function setDIPName(g, name){ g.remove(g.userData.lab); const lb = label(name, '#e8edf3', .06); g.add(at(lb, 0, .11, .03)); g.userData.lab = lb; }

function elxBench(){ const g = makeWorkbench(); g.traverse(o => o.userData.noFit = true); return g; }
/* ---------- معمل المكونات الإلكترونية ---------- */
function buildComponentsLab(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const bb = makeBreadboard(3.6, 1.6); bb.position.set(0, 0, .1); root.add(bb);
  const st = { step: 0, rIdx: 0, relay: 0, dRev: 0, base: 0, gate: 0 };
  // المقاومة بقيم بتتغير
  const RV = [['220 Ω', [0xd0302a, 0xd0302a, 0x6b3b1e]], ['1 kΩ', [0x6b3b1e, 0x111111, 0xd0302a]], ['4.7 kΩ', [0xe8c21a, 0x6b2fa8, 0xd0302a]], ['10 kΩ', [0x6b3b1e, 0x111111, 0xe07a1a]]];
  const resG = new THREE.Group(); resG.position.set(-1.4, .08, -.35); root.add(resG); resG.scale.setScalar(1.6);
  let res = makeResistor([...RV[0][1], 0xd9a441]); resG.add(res.group);
  let rLab = label('220 Ω', '#ffd34d', .1); rLab.position.set(-1.4, .55, -.35); root.add(rLab);
  const setRes = i => { resG.remove(res.group); res = makeResistor([...RV[i][1], 0xd9a441]); resG.add(res.group); root.remove(rLab); rLab = label(RV[i][0], '#ffd34d', .1); rLab.position.set(-1.4, .55, -.35); root.add(rLab); };
  // المكثف
  const capG = new THREE.Group(); capG.position.set(-.6, .08, -.35); root.add(capG);
  capG.add(at(cyl(.08, .08, .26, M(0x2a3f8a, { r: .4 }), 20), 0, .13, 0)); capG.add(at(box(.03, .22, .162, M(0xdfe6ea)), .07, .13, 0)); capG.add(at(label('100µF', '#ffffff', .06), 0, .33, .09));
  capG.add(at(cyl(.06, .06, .02, M(0xe0a33a, { r: .4 }), 16), .3, .02, 0)); capG.add(at(label('104', '#1b1f26', .045), .3, .05, .03));
  // الريلاي
  const rl = new THREE.Group(); rl.position.set(.25, .08, -.35); root.add(rl);
  rl.add(at(box(.36, .26, .26, M(0x2a62c9, { opacity: .55 })), 0, .13, 0)); rl.add(at(cyl(.05, .05, .16, M(0xd98c5f, { m: .7 }), 16), -.06, .1, 0));
  const arm = new THREE.Group(); arm.position.set(.02, .2, 0); rl.add(arm); arm.add(at(box(.18, .015, .05, M(0xc9ced6, { m: .9 })), .07, 0, 0));
  rl.add(at(label(L('ريلاي', 'Relay'), '#ffffff', .06), 0, .33, .1));
  const rLamp = makeLED(0xffd34d); rLamp.group.position.set(.6, .08, -.35); root.add(rLamp.group);
  // الدايود والليد
  const dio = new THREE.Group(); dio.position.set(1.05, .08, -.35); root.add(dio);
  const db = cyl(.035, .035, .18, M(0x1d2128), 14); db.rotation.z = Math.PI / 2; dio.add(at(db, 0, .05, 0)); const band = cyl(.037, .037, .03, M(0xdfe6ea), 14); band.rotation.z = Math.PI / 2; dio.add(at(band, .065, .05, 0));
  const led = makeLED(0xd23a2e); led.group.position.set(1.35, .08, -.35); root.add(led.group);
  const dArrow = label('→', '#7fe0a0', .12); dArrow.position.set(1.05, .3, -.35); root.add(dArrow);
  // الزينر
  const zen = new THREE.Group(); zen.position.set(-1.4, .08, .5); root.add(zen);
  const zb = cyl(.035, .035, .18, M(0xd9a441, { opacity: .8 }), 14); zb.rotation.z = Math.PI / 2; zen.add(at(zb, 0, .05, 0)); zen.add(at(label('5.1V', '#1b1f26', .05), 0, .1, .04));
  const zp = makePanel(.36, .12, { font: 'bold 56px monospace' }); zp.mesh.rotation.x = -Math.PI / 2; zen.add(at(zp.mesh, 0, .02, .25));
  // الترانزستور
  const tr = new THREE.Group(); tr.position.set(-.55, .08, .5); root.add(tr);
  const tb = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .14, 20, 1, false, 0, Math.PI), M(0x1d2128)); tb.rotation.y = Math.PI / 2; tr.add(at(tb, 0, .12, 0));
  [['E', -.04], ['B', 0], ['C', .04]].forEach(([k, xx]) => { tr.add(at(cyl(.005, .005, .1, M(0xc9ced6, { m: .9 }), 6), xx, .04, 0)); tr.add(at(label(k, '#ffd34d', .06), xx, .26, .05)); });
  const tLed = makeLED(0x2fbf5a); tLed.group.position.set(-.2, .08, .5); root.add(tLed.group);
  // الثيرستور
  const scr = new THREE.Group(); scr.position.set(.35, .08, .5); root.add(scr);
  scr.add(at(box(.12, .14, .05, M(0x1d2128)), 0, .14, 0)); scr.add(at(box(.12, .05, .015, M(0xc9ced6, { m: .9 })), 0, .23, -.02));
  [['K', -.035], ['A', 0], ['G', .035]].forEach(([k, xx]) => { scr.add(at(cyl(.005, .005, .1, M(0xc9ced6, { m: .9 }), 6), xx, .05, 0)); scr.add(at(label(k, '#ffd34d', .06), xx, .32, .05)); });
  const sLamp = makeLED(0xffb03a); sLamp.group.position.set(.7, .08, .5); root.add(sLamp.group);
  // SMD
  const smd = new THREE.Group(); smd.position.set(1.25, .08, .5); root.add(smd);
  smd.add(at(box(.5, .02, .35, M(0x1f7a4a, { r: .6 })), 0, .01, 0));
  [[-.12, -.08, 0x1d2128, '102'], [.05, -.08, 0xc9a87a, ''], [.15, .06, 0x1d2128, ''], [-.1, .08, 0x3a3f46, 'SOT']].forEach(([xx, zz, c, t]) => { smd.add(at(box(.08, .025, .04, M(c, { r: .4 })), xx, .03, zz)); if(t) smd.add(at(label(t, '#ffffff', .04), xx, .08, zz)); });
  smd.add(at(new THREE.Mesh(new THREE.TorusGeometry(.18, .015, 8, 30), M(0x3a3f46, { m: .6 })), 0, .32, 0)).children.at(-1).rotation.x = Math.PI / 2;
  smd.add(at(new THREE.Mesh(new THREE.CircleGeometry(.17, 30), M(0xcfe7ff, { opacity: .25 })), 0, .32, 0)).children.at(-1).rotation.x = -Math.PI / 2;
  const tags = [[L('مقاومة', 'Resistor'), -1.4], [L('مكثفات', 'Capacitors'), -.5], [L('ريلاي', 'Relay'), .4], [L('دايود وليد', 'Diode & LED'), 1.2]].map(([t, xx]) => { const l = label(t, '#ffffff', .08); l.position.set(xx, .02, -.75); root.add(l); return l; });
  [[L('زينر', 'Zener'), -1.4], [L('ترانزستور', 'Transistor'), -.4], [L('ثيرستور', 'Thyristor'), .5], ['SMD', 1.25]].forEach(([t, xx]) => { const l = label(t, '#ffffff', .08); l.position.set(xx, .02, .9); root.add(l); });
  part('res', resG, V(0, .25, 0), L('المقاومة', 'Resistor'), L('بتحدد التيار. دوس عليها تغيّر القيمة وتشوف ألوانها.', 'Limits current. Tap to change value and see its bands.'));
  part('cap', capG, V(0, .45, 0), L('المكثفات', 'Capacitors'), L('إلكتروليتي بقطبية، وسيراميك من غير قطبية.', 'Polarised electrolytic and non-polar ceramic.'));
  part('relay', rl, V(0, .45, 0), L('الريلاي', 'Relay'), L('ملف بيعمل مغناطيس يشد تلامس. دوس عليه.', 'A coil whose magnet pulls a contact. Tap it.'));
  part('diode', dio, V(0, .2, 0), L('الدايود والليد', 'Diode and LED'), L('بيعدّي التيار في اتجاه واحد. دوس عليه تعكسه.', 'One-way current. Tap to reverse it.'));
  part('zener', zen, V(0, .2, 0), L('دايود الزينر', 'Zener diode'), L('بيثبّت الجهد على قيمته (5.1 فولت).', 'Holds the voltage at its rating (5.1 V).'));
  part('tr', tr, V(0, .35, 0), L('الترانزستور', 'Transistor'), L('تيار صغير في القاعدة B بيفتح تيار كبير بين C وE. دوس عليه.', 'A small base current switches a large C–E current. Tap it.'));
  part('scr', scr, V(0, .4, 0), L('الثيرستور', 'Thyristor (SCR)'), L('نبضة على البوابة G بتشغّله ويفضل شغال. دوس عليه.', 'A gate pulse turns it on and it latches. Tap it.'));
  part('smd', smd, V(0, .4, 0), L('مكونات SMD', 'SMD parts'), L('مكونات صغيرة بتتلحم على سطح البوردة.', 'Tiny parts soldered onto the board surface.'));
  ctx.parts.res.tap = () => { st.rIdx = (st.rIdx + 1) % RV.length; setRes(st.rIdx); const c = ['أحمر أحمر بني', 'بني أسود أحمر', 'أصفر بنفسجي أحمر', 'بني أسود برتقالي'][st.rIdx]; return L(`${c} = ${RV[st.rIdx][0]}`, `${['red red brown', 'brown black red', 'yellow violet red', 'brown black orange'][st.rIdx]} = ${RV[st.rIdx][0]}`); };
  ctx.parts.relay.tap = () => { st.relay ^= 1; return st.relay ? L('الملف اتغذى: الريشة اتشدت واللمبة نوّرت.', 'Coil energised: armature pulled, lamp on.') : L('الملف فصل: الياي رجّع الريشة.', 'Coil off: the spring returns the armature.'); };
  ctx.parts.diode.tap = () => { st.dRev ^= 1; return st.dRev ? L('اتجاه عكسي: الدايود مانع التيار، الليد مطفي.', 'Reverse bias: blocked, LED off.') : L('اتجاه أمامي: الليد نوّر.', 'Forward bias: LED on.'); };
  ctx.parts.tr.tap = () => { st.base ^= 1; return st.base ? L('تيار صغير دخل القاعدة: الترانزستور فتح والليد نوّر.', 'Base current on: the transistor conducts, LED on.') : L('مفيش تيار قاعدة: الترانزستور قافل.', 'No base current: transistor off.'); };
  ctx.parts.scr.tap = () => { if(st.gate){ st.gate = 0; return L('فصلنا التيار الرئيسي: الثيرستور قفل.', 'Main current removed: the SCR turns off.'); } st.gate = 1; return L('نبضة على البوابة: الثيرستور اشتغل وهيفضل شغال حتى بعد ما النبضة تروح.', 'Gate pulse: the SCR turns on and stays on after the pulse ends.'); };
  let t = 0;
  return {
    ...ctx, view: V(.05, 1.3, 1.35), sway: true, hint: L('دوس على أي مكوّن · صباعين للتقريب', 'Tap any component · pinch to zoom'),
    steps: [
      { title: L('معمل المكونات', 'The components bench'), text: L('على البوردة أهم المكونات اللي هتقابلها في أي جهاز إلكتروني. كل مكوّن ليه شكل ورمز وطريقة اختبار. دوس على أي واحد.', 'The board holds the key components found in any electronic device. Each has a shape, a symbol and a test. Tap any one.'), s: {} },
      { title: L('المقاومة وكود الألوان', 'Resistor colour code'), text: L('أول لونين أرقام، والتالت عدد الأصفار، والرابع السماحية (دهبي ±5٪). أحمر=2، بني=1، أسود=0، برتقالي=3، أصفر=4، بنفسجي=7. دوس على المقاومة تغيّر القيمة.', 'Bands 1–2 are digits, band 3 the number of zeros, band 4 the tolerance (gold ±5%). Red 2, brown 1, black 0, orange 3, yellow 4, violet 7. Tap to change value.'), focus: 'res', s: {} },
      { title: L('المكثفات', 'Capacitors'), text: L('المكثف بيخزن شحنة. الإلكتروليتي (الأزرق) ليه طرف سالب عليه شريطة، ولو اتعكس ممكن ينفجر. السيراميك (البرتقالي) من غير قطبية، وقيمته بكود: 104 = 10 وبعدها 4 أصفار بيكو = 100 نانو.', 'A capacitor stores charge. The electrolytic (blue) has a striped negative lead and can burst if reversed. The ceramic (orange) is non-polar; code 104 = 10 + four zeros pF = 100 nF.'), focus: 'cap', s: {} },
      { title: L('الملف والريلاي', 'Coil and relay'), text: L('الريلاي فيه ملف، لما يتغذى بيبقى مغناطيس ويشد ريشة تقفل تلامس. كده جهد صغير بيتحكم في دايرة تانية خالص. اختباره: قيس مقاومة الملف (عشرات لمئات الأوم)، وبعدين غذّيه واسمع التكّة.', 'A relay has a coil that becomes a magnet and pulls an armature to close a contact, so a small voltage controls a separate circuit. Test: measure coil resistance (tens to hundreds of ohms), then energise it and listen for the click.'), focus: 'relay', s: { relay: 1 } },
      { title: L('الدايود والليد', 'Diode and LED'), text: L('الدايود بيعدّي التيار من الأنود للكاثود (الشريطة) بس. الليد دايود بينوّر، ورجله الطويلة هي الموجب. بالأفوميتر على وضع الدايود: اتجاه بيقرا حوالي 0.6 فولت، والعكس OL.', 'A diode conducts only anode to cathode (the band). An LED is a light-emitting diode; its longer lead is positive. On diode test a meter reads about 0.6 V one way and OL the other.'), focus: 'diode', s: {} },
      { title: L('دايود الزينر', 'The Zener diode'), text: L('الزينر بيتوصل عكسي، ولما الجهد يوصل لقيمته (هنا 5.1 فولت) بيوصّل ويمنع الجهد يزيد. فحتى لو الدخل اتغير من 9 لـ 12 فولت، الخرج ثابت 5.1. ده أبسط منظم جهد.', 'A Zener is connected reverse-biased; at its rated voltage (5.1 V here) it conducts and stops the voltage rising. Even as the input swings 9–12 V, the output stays at 5.1 V: the simplest regulator.'), focus: 'zener', s: {} },
      { title: L('الترانزستور كمفتاح', 'The transistor as a switch'), text: L('ليه 3 أطراف: E الباعث، وB القاعدة، وC المجمّع. تيار صغير في القاعدة بيخلّي تيار أكبر بكتير يعدّي من C لـ E. دوس عليه وشوف الليد. ده أساس كل الدواير الرقمية والمكبرات.', 'Three leads: E emitter, B base, C collector. A small base current lets a much larger current flow C to E. Tap it and watch the LED. This is the basis of digital circuits and amplifiers.'), focus: 'tr', s: { base: 1 } },
      { title: L('الثيرستور والترياك', 'Thyristor and triac'), text: L('الثيرستور (SCR) زي الدايود بس مش بيوصّل غير لما ييجي نبضة على البوابة G، وبعدها بيفضل شغال لوحده لحد ما التيار الرئيسي يتقطع. الترياك نفس الفكرة في الاتجاهين، وبيستخدم في منظم سرعة المراوح والإضاءة.', 'An SCR is like a diode that only conducts after a pulse on its gate G, then latches until the main current stops. A triac does the same both ways and is used in fan-speed and light dimmers.'), focus: 'scr', s: { gate: 1 } },
      { title: L('مكونات SMD', 'SMD components'), text: L('في الأجهزة الحديثة المكونات صغيرة جدًا وبتتلحم على سطح البوردة. المقاومة SMD قيمتها بأرقام: 102 = 10 وبعدها صفرين = 1 كيلو أوم. بتتفك وتتركب بكاوية هوا ساخن وعدسة مكبرة.', 'Modern devices use tiny surface-mount parts. An SMD resistor uses digits: 102 = 10 + two zeros = 1 kΩ. They are removed and fitted with a hot-air station under a magnifier.'), focus: 'smd', s: {} }
    ],
    apply(s){ Object.assign(st, { relay: 0, dRev: 0, base: 0, gate: 0 }, s); t = 0; },
    update(dt){ t += dt; arm.rotation.z = ease(arm.rotation.z, st.relay ? -.25 : 0, dt, 10); rLamp.set(st.relay ? 1 : 0); led.set(st.dRev ? 0 : 1); dArrow.material.color.setHex(st.dRev ? 0xff5a4a : 0x7fe0a0); tLed.set(st.base ? 1 : 0); sLamp.set(st.gate ? 1 : 0);
      zp.setText((9 + 1.5 * (1 + Math.sin(t * .8))).toFixed(1) + 'V→5.1V'); [rLamp, led, tLed, sLamp].forEach(x => x.update(dt)); }
  };
}

/* ---------- راسم الذبذبات ومولد الذبذبات ---------- */
function makeScreen(w, h){
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  return { mesh, draw(fn){ const x = c.getContext('2d'); x.fillStyle = '#071a12'; x.fillRect(0, 0, c.width, c.height); x.strokeStyle = 'rgba(120,220,160,.18)'; x.lineWidth = 1; for(let i = 0; i <= 10; i++){ x.beginPath(); x.moveTo(i * c.width / 10, 0); x.lineTo(i * c.width / 10, c.height); x.stroke(); } for(let j = 0; j <= 8; j++){ x.beginPath(); x.moveTo(0, j * c.height / 8); x.lineTo(c.width, j * c.height / 8); x.stroke(); } fn(x, c.width, c.height); tex.needsUpdate = true; } };
}
function buildScope(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const sc = new THREE.Group(); sc.position.set(-.55, 0, -.6); root.add(sc);
  sc.add(at(box(1.5, .85, .6, M(0xd9dde2, { r: .5 })), 0, .425, 0));
  const scr = makeScreen(.85, .55); sc.add(at(scr.mesh, -.25, .47, .301));
  const knobs = []; for(let i = 0; i < 6; i++){ const k = cyl(.04, .04, .04, M(0x2b3038), 16); k.rotation.x = Math.PI / 2; sc.add(at(k, .35 + (i % 2) * .16, .65 - Math.floor(i / 2) * .17, .31)); knobs.push(k); }
  sc.add(at(label('VOLTS/DIV', '#1b1f26', .045), .35, .73, .32)); sc.add(at(label('TIME/DIV', '#1b1f26', .045), .51, .73, .32));
  const gen = new THREE.Group(); gen.position.set(1.1, 0, -.5); root.add(gen);
  gen.add(at(box(.9, .4, .5, M(0x2a62c9, { r: .5 })), 0, .2, 0));
  const gp = makePanel(.5, .14, { font: 'bold 56px monospace', bg: '#1b2430', fg: '#7fe0a0' }); gen.add(at(gp.mesh, -.1, .28, .251));
  const fk = cyl(.06, .06, .04, M(0xe9ebef), 20); fk.rotation.x = Math.PI / 2; gen.add(at(fk, .3, .26, .26));
  gen.add(at(label(L('مولد الذبذبات', 'Signal generator'), '#ffffff', .06), 0, .07, .26));
  const cab = tube(CR([V(.75, .1, -.24), V(.4, .05, .1), V(-.1, .05, .1), V(-.4, .1, -.29)]), .012, M(0x1d2128), 40); root.add(cab);
  part('scope', sc, V(0, .95, 0), L('راسم الذبذبات', 'Oscilloscope'), L('بيرسم الجهد مع الزمن على الشاشة.', 'Draws voltage against time.'));
  part('gen', gen, V(0, .5, 0), L('مولد الذبذبات', 'Signal generator'), L('بيطلّع موجة بتردد وسعة تختارهم. دوس عليه تغيّر الموجة.', 'Outputs a wave of chosen frequency and amplitude. Tap to change the wave.'));
  part('knobs', knobs[0], V(0, .08, .05), L('مفاتيح الضبط', 'Controls'), L('فولت لكل مربع رأسي، وزمن لكل مربع أفقي.', 'Volts per vertical division, time per horizontal division.'));
  const st = { wave: 'sine', f: 1, a: 2, vdiv: 1, tdiv: 1 }; let t = 0;
  const WAVES = ['sine', 'square', 'tri'];
  ctx.parts.gen.tap = () => { st.wave = WAVES[(WAVES.indexOf(st.wave) + 1) % 3]; return { sine: L('موجة جيبية', 'Sine wave'), square: L('موجة مربعة', 'Square wave'), tri: L('موجة مثلثة', 'Triangle wave') }[st.wave]; };
  return {
    ...ctx, view: V(.1, .55, 1.6), sway: true, hint: L('دوس على مولد الذبذبات · صباعين للتقريب', 'Tap the generator · pinch to zoom'),
    steps: [
      { title: L('راسم الذبذبات ومولد الذبذبات', 'Oscilloscope and signal generator'), text: L('الأفوميتر بيديك رقم واحد، لكن راسم الذبذبات بيرسم شكل الجهد وهو بيتغير مع الزمن. مولد الذبذبات بيطلّع إشارة نجرب عليها.', 'A multimeter gives one number; an oscilloscope draws how voltage changes over time. The signal generator supplies a test signal.'), s: { wave: 'sine', f: 1, a: 2, vdiv: 1 } },
      { title: L('قراءة السعة', 'Reading amplitude'), text: L('المربع الرأسي هنا = 1 فولت. الموجة طالعة مربعين فوق ونازلة مربعين تحت، يعني قمتها 2 فولت، ومن القمة للقاع 4 فولت. لو غيّرت VOLTS/DIV الشكل بيكبر أو يصغر، بس الجهد نفسه ما بيتغيرش.', 'Each vertical division is 1 V. The wave rises two divisions and falls two, so its peak is 2 V and peak-to-peak 4 V. Changing VOLTS/DIV resizes the trace, not the signal.'), focus: 'knobs', s: { wave: 'sine', f: 1, a: 2, vdiv: 1 } },
      { title: L('قراءة التردد', 'Reading frequency'), text: L('المربع الأفقي هنا = 1 مللي ثانية. الموجة الواحدة بتاخد 5 مربعات = 5 مللي ثانية (الزمن الدوري T). التردد = 1 ÷ T = 200 هرتز.', 'Each horizontal division is 1 ms. One cycle spans 5 divisions = 5 ms (period T). Frequency = 1 ÷ T = 200 Hz.'), focus: 'scope', s: { wave: 'sine', f: 1, a: 2, vdiv: 1 } },
      { title: L('أشكال الموجات', 'Wave shapes'), text: L('مولد الذبذبات بيطلّع جيبية (زي كهربا البيت)، ومربعة (زي الدواير الرقمية)، ومثلثة. دوس على المولد وغيّر الشكل.', 'The generator gives sine (like mains), square (like digital circuits) and triangle. Tap it to change shape.'), focus: 'gen', s: { wave: 'square', f: 1, a: 2, vdiv: 1 } },
      { title: L('في الصيانة', 'In repair work'), text: L('بنستخدمه نشوف الإشارة بتدخل وتطلع من كل مرحلة في الجهاز. لو الإشارة موجودة في الدخول ومش موجودة في الخروج، يبقى العطل في المرحلة دي.', 'We trace a signal into and out of each stage of a device. If it is present at a stage\'s input but missing at its output, the fault is in that stage.'), focus: 'scope', s: { wave: 'sine', f: 2, a: 1.5, vdiv: 1 } }
    ],
    apply(s){ Object.assign(st, s); },
    update(dt){ t += dt; const per = 5 / st.f; gp.setText(Math.round(200 * st.f) + ' Hz'); scr.draw((x, W, H) => { x.strokeStyle = '#7dffb0'; x.lineWidth = 3; x.shadowColor = '#7dffb0'; x.shadowBlur = 8; x.beginPath(); for(let i = 0; i <= W; i += 2){ const ph = ((i / W * 10 + t * 2) / per) % 1; let v = st.wave === 'sine' ? Math.sin(ph * Math.PI * 2) : st.wave === 'square' ? (ph < .5 ? 1 : -1) : (ph < .5 ? ph * 4 - 1 : 3 - ph * 4); const y = H / 2 - v * st.a / st.vdiv * H / 8; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }); }
  };
}

/* ---------- البطاريات وقانون أوم ---------- */
function buildOhm(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const bb = makeBreadboard(3.2, 1.4); root.add(bb);
  const bats = [0, 1].map(i => { const b = makeBattery(); b.group.scale.setScalar(.8); b.group.rotation.y = Math.PI / 2; b.group.position.set(-1.25, .08, -.3 + i * .55); root.add(b.group); return b; });
  const rs = [0, 1].map(i => { const r = makeResistor([0xd0302a, 0xd0302a, 0x6b3b1e, 0xd9a441]); r.group.scale.setScalar(1.3); r.group.position.set(.2, .08, -.35 + i * .7); root.add(r.group); return r; });
  const vm = makePanel(.5, .16, { font: 'bold 54px monospace' }), am = makePanel(.5, .16, { font: 'bold 54px monospace' });
  const mv = new THREE.Group(); mv.position.set(1.15, .08, -.3); root.add(mv); mv.add(at(box(.6, .1, .3, M(0xf2b51e)), 0, .05, 0)); vm.mesh.rotation.x = -Math.PI / 2; mv.add(at(vm.mesh, 0, .105, 0)); mv.add(at(label('V', '#1b1f26', .08), .35, .12, 0));
  const ma = new THREE.Group(); ma.position.set(1.15, .08, .35); root.add(ma); ma.add(at(box(.6, .1, .3, M(0xf2b51e)), 0, .05, 0)); am.mesh.rotation.x = -Math.PI / 2; ma.add(at(am.mesh, 0, .105, 0)); ma.add(at(label('A', '#1b1f26', .08), .35, .12, 0));
  const fT = label('', '#ffd34d', .14); root.add(fT);
  part('bat', bats[0].group, V(0, .55, 0), L('البطاريات', 'Batteries'), L('كل بطارية 12 فولت.', 'Each battery is 12 V.'));
  part('res', rs[0].group, V(0, .3, 0), L('المقاومات', 'Resistors'), L('كل مقاومة 220 أوم.', 'Each resistor is 220 Ω.'));
  part('meters', mv, V(0, .25, 0), L('الفولتميتر والأميتر', 'Voltmeter and ammeter'), L('القراءات بتتحسب بقانون أوم.', 'Readings follow Ohm\'s law.'));
  let tagObj = null; const tag = s => { if(tagObj) root.remove(tagObj); tagObj = label(s, '#ffd34d', .13); tagObj.position.set(0, .75, .9); root.add(tagObj); };
  const st = { mode: 'one' };
  const MODES = {
    one: { v: 12, r: 220, f: 'I = V ÷ R = 12 ÷ 220' }, batS: { v: 24, r: 220, f: L('توالي: 12 + 12 = 24 فولت', 'Series: 12 + 12 = 24 V') }, batP: { v: 12, r: 220, f: L('توازي: 12 فولت، والسعة الضعف', 'Parallel: 12 V, double capacity') },
    rS: { v: 12, r: 440, f: L('توالي: R = 220 + 220 = 440', 'Series: R = 220 + 220 = 440') }, rP: { v: 12, r: 110, f: L('توازي: R = 220 ÷ 2 = 110', 'Parallel: R = 220 ÷ 2 = 110') }
  };
  function derive(){ const m = MODES[st.mode]; vm.setText(m.v.toFixed(1) + ' V'); am.setText((m.v / m.r * 1000).toFixed(1) + ' mA'); tag(m.f); bats[1].group.visible = st.mode === 'batS' || st.mode === 'batP'; rs[1].group.visible = st.mode === 'rS' || st.mode === 'rP';
    bats[1].group.position.set(st.mode === 'batS' ? -1.25 : -1.25, .08, st.mode === 'batS' ? .25 : .25); rs[1].group.position.set(st.mode === 'rS' ? .2 : .2, .08, .35); }
  ctx.parts.meters.tap = () => { const k = Object.keys(MODES); st.mode = k[(k.indexOf(st.mode) + 1) % k.length]; derive(); return MODES[st.mode].f; };
  return {
    ...ctx, view: V(.05, 1.25, 1.4), sway: true, hint: L('دوس على أجهزة القياس تغيّر التوصيل · صباعين للتقريب', 'Tap the meters to change the circuit · pinch to zoom'),
    steps: [
      { title: L('قانون أوم', 'Ohm\'s law'), text: L('الجهد = التيار × المقاومة (V = I × R). بطارية 12 فولت على مقاومة 220 أوم: التيار = 12 ÷ 220 = 54.5 مللي أمبير.', 'Voltage = current × resistance (V = I × R). A 12 V battery across 220 Ω: I = 12 ÷ 220 = 54.5 mA.'), focus: 'meters', s: { mode: 'one' } },
      { title: L('بطاريات توالي', 'Batteries in series'), text: L('الموجب في السالب: الجهد بيتجمع (24 فولت)، والتيار ضعف. ده اللي بيحصل في الريموت والكشافات.', 'Plus to minus: voltages add (24 V) and the current doubles. That is how remotes and torches are wired.'), focus: 'bat', s: { mode: 'batS' } },
      { title: L('بطاريات توازي', 'Batteries in parallel'), text: L('الموجب مع الموجب والسالب مع السالب: الجهد زي ما هو (12 فولت)، بس السعة (الأمبير ساعة) ضعف، فبتعيش أطول. لازم البطاريتين نفس الجهد.', 'Plus to plus, minus to minus: the voltage stays 12 V but capacity (Ah) doubles, so it lasts longer. Both must have the same voltage.'), focus: 'bat', s: { mode: 'batP' } },
      { title: L('مقاومات توالي', 'Resistors in series'), text: L('المقاومة الكلية = مجموعهم: 220 + 220 = 440 أوم، فالتيار بيقل للنص (27.3 مللي أمبير). نفس التيار في الاتنين، والجهد بيتقسم عليهم.', 'Total = sum: 220 + 220 = 440 Ω, so the current halves (27.3 mA). The same current flows through both and the voltage divides between them.'), focus: 'res', s: { mode: 'rS' } },
      { title: L('مقاومات توازي', 'Resistors in parallel'), text: L('1 ÷ R الكلية = 1 ÷ R1 + 1 ÷ R2. لمقاومتين متساويتين: النص (110 أوم)، فالتيار ضعف (109 مللي أمبير). الجهد واحد على الاتنين. دوس على أجهزة القياس وجرب كل التوصيلات.', '1/R = 1/R1 + 1/R2. For two equal resistors: half (110 Ω), so the current doubles (109 mA). Both see the same voltage. Tap the meters to try every arrangement.'), focus: 'meters', s: { mode: 'rP' } }
    ],
    apply(s){ st.mode = s.mode; derive(); }, update(dt){}
  };
}

/* ---------- دوائر التوحيد ---------- */
function buildRectifier(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const tf = new THREE.Group(); tf.position.set(-1.35, 0, -.35); root.add(tf);
  tf.add(at(box(.5, .4, .4, M(0x6c747d, { m: .4 })), 0, .2, 0)); [-.12, .12].forEach(x => tf.add(at(cyl(.11, .11, .3, M(0xd98c5f, { m: .6 }), 16), x, .2, 0)).children.at(-1).rotation.z = Math.PI / 2);
  tf.add(at(label('220/12V', '#ffffff', .07), 0, .48, 0));
  const bb = makeBreadboard(1.4, .9); bb.position.set(-.35, 0, -.25); root.add(bb);
  const dios = [0, 1, 2, 3].map(i => { const d = new THREE.Group(); const b = cyl(.03, .03, .16, M(0x1d2128), 12); b.rotation.z = Math.PI / 2; d.add(at(b, 0, .1, 0)); const bd = cyl(.032, .032, .025, M(0xdfe6ea), 12); bd.rotation.z = Math.PI / 2; d.add(at(bd, .055, .1, 0)); d.position.set(-.55 + (i % 2) * .4, 0, -.45 + Math.floor(i / 2) * .4); d.rotation.y = i % 2 ? Math.PI / 4 : -Math.PI / 4; root.add(d); return d; });
  const capG = new THREE.Group(); capG.position.set(.15, .08, -.25); root.add(capG); capG.add(at(cyl(.08, .08, .24, M(0x2a3f8a, { r: .4 }), 20), 0, .12, 0));
  const load = makeLED(0x2fbf5a); load.group.scale.setScalar(1.5); load.group.position.set(.45, .08, -.25); root.add(load.group);
  const wm = M(0xd0473a), wk = M(0x2b2f38);
  root.add(tube(CR([V(-1.1, .3, -.3), V(-.95, .2, -.35), V(-.8, .1, -.45)]), .012, wm, 20));
  root.add(tube(CR([V(-1.1, .25, -.4), V(-.95, .15, -.1), V(-.8, .1, -.05)]), .012, wk, 20));
  root.add(tube(CR([V(.5, .1, -.25), V(.8, .3, -.3), V(.95, .45, -.45)]), .012, wm, 20));
  const sc = new THREE.Group(); sc.position.set(1.15, 0, -.45); root.add(sc);
  sc.add(at(box(1.1, .75, .45, M(0xd9dde2, { r: .5 })), 0, .375, 0));
  const scr = makeScreen(.9, .6); sc.add(at(scr.mesh, 0, .4, .226));
  part('trafo', tf, V(0, .5, 0), L('المحول', 'Transformer'), L('بينزّل 220 فولت متردد لـ 12 فولت متردد.', 'Steps 220 V AC down to 12 V AC.'));
  part('diodes', dios[0], V(0, .2, 0), L('الدايودات', 'Diodes'), L('بيعدّوا نص الموجة الموجب بس.', 'Pass only the positive half.'));
  part('cap', capG, V(0, .4, 0), L('مكثف الترشيح', 'Smoothing capacitor'), L('بيشحن في القمة ويفضي بين القمم.', 'Charges at the peaks and discharges between them.'));
  part('scope', sc, V(0, .85, 0), L('راسم الذبذبات', 'Oscilloscope'), L('بيوري شكل الخرج.', 'Shows the output waveform.'));
  part('load', load.group, V(0, .3, 0), L('الحمل', 'The load'), L('ليد بينوّر أقوى كل ما الخرج يبقى أنعم.', 'An LED that glows brighter as the output gets smoother.'));
  const st = { mode: 'ac' }; let t = 0;
  function derive(){ dios.forEach((d, i) => d.visible = st.mode === 'half' ? i === 0 : st.mode !== 'ac'); capG.visible = st.mode === 'filter'; load.set({ ac: 0, half: .45, full: .75, filter: 1 }[st.mode]); }
  return {
    ...ctx, view: V(.05, 1.0, 1.5), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('ليه بنوحّد؟', 'Why rectify?'), text: L('كهربا البيت متردد (AC): بيغيّر اتجاهه 50 مرة في الثانية. أغلب الأجهزة الإلكترونية محتاجة تيار مستمر (DC). دايرة التوحيد بتحوّل المتردد لمستمر. الشاشة بتوري الموجة الجيبية بعد المحول.', 'Mains is AC, reversing 50 times a second; most electronics need DC. A rectifier converts AC to DC. The screen shows the sine wave after the transformer.'), focus: 'trafo', s: { mode: 'ac' } },
      { title: L('نص موجة', 'Half-wave'), text: L('دايود واحد بيعدّي النص الموجب بس، والنص السالب بيتشال. الخرج نبضات بينهم فراغ، وده ضعيف وبيرعش.', 'One diode passes only the positive half; the negative half is removed. The output is pulses with gaps: weak and rippling.'), focus: 'diodes', s: { mode: 'half' } },
      { title: L('موجة كاملة بالقنطرة', 'Full-wave bridge'), text: L('4 دايودات في شكل قنطرة: في النص الموجب اتنين بيوصّلوا، وفي السالب الاتنين التانيين، والتيار في الحمل دايمًا في نفس الاتجاه. الخرج نبضات ورا بعض من غير فراغ.', 'Four diodes in a bridge: two conduct on the positive half, the other two on the negative, so current through the load always flows the same way. Pulses follow each other with no gap.'), focus: 'diodes', s: { mode: 'full' } },
      { title: L('مكثف الترشيح', 'Smoothing'), text: L('مكثف كبير على الخرج بيشحن عند كل قمة ويغذي الحمل بين القمم، فالخرج بيبقى قريب من خط مستقيم (DC) مع تموج صغير. وبعده ممكن منظم جهد زي 7805 يثبّته تمامًا.', 'A large capacitor on the output charges at each peak and feeds the load between them, giving nearly flat DC with small ripple. A regulator like the 7805 can then hold it steady.'), focus: 'cap', s: { mode: 'filter' } }
    ],
    apply(s){ st.mode = s.mode; derive(); },
    update(dt){ t += dt; load.update(dt); scr.draw((x, W, H) => { x.strokeStyle = '#7dffb0'; x.lineWidth = 3; x.shadowColor = '#7dffb0'; x.shadowBlur = 8; x.beginPath(); let hold = 0; for(let i = 0; i <= W; i += 2){ const ph = (i / W * 3 + t * .6) % 1; let v = Math.sin(ph * Math.PI * 2); if(st.mode === 'half') v = Math.max(0, v); if(st.mode === 'full') v = Math.abs(v); if(st.mode === 'filter'){ const a = Math.abs(v); hold = Math.max(a, hold - .012); v = hold; } const y = H * .5 - v * H * .35; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }); }
  };
}

/* ---------- البوابات المنطقية والقلاب ---------- */
function buildLogic(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const bb = makeBreadboard(3.2, 1.4); root.add(bb);
  const chip = makeDIP(14, '7408'); chip.scale.setScalar(1.6); chip.position.set(0, .08, -.1); root.add(chip);
  const sws = [0, 1].map(i => { const s = makeSwitch(); s.group.scale.setScalar(.8); s.group.position.set(-1.1, .08, -.4 + i * .6); root.add(s.group); s.group.add(at(label(i ? 'B' : 'A', '#ffd34d', .12), 0, .45, 0)); return s; });
  const out = makeLED(0x2fbf5a); out.group.scale.setScalar(1.6); out.group.position.set(1.0, .08, -.1); root.add(out.group);
  const tt = makeScreen(.9, .6); tt.mesh.position.set(0, .95, -.7); root.add(tt.mesh);
  const GATES = { AND: [(a, b) => a & b, '7408'], OR: [(a, b) => a | b, '7432'], NOT: [(a) => a ^ 1, '7404'], NAND: [(a, b) => (a & b) ^ 1, '7400'], XOR: [(a, b) => a ^ b, '7486'] };
  const st = { g: 'AND', a: 0, b: 0, ff: 0, q: 0 };
  function derive(){
    sws[0].set(!!st.a); sws[1].set(!!st.b); sws[1].group.visible = st.g !== 'NOT' || st.ff;
    let y; if(st.ff){ if(st.a) st.q = 1; if(st.b) st.q = 0; y = st.q; } else y = GATES[st.g][0](st.a, st.b);
    out.set(y ? 1 : 0);
    setDIPName(chip, st.ff ? '74279' : GATES[st.g][1]);
    tt.draw((x, W, H) => { x.fillStyle = '#cfe7ff'; x.font = 'bold 34px monospace'; x.textAlign = 'center';
      if(st.ff){ x.fillText('S R | Q', W / 2, 60); [['1 0', '1'], ['0 1', '0'], ['0 0', 'Q']].forEach(([i, q], k) => x.fillText(`${i} | ${q}`, W / 2, 120 + k * 50)); x.fillStyle = '#7dffb0'; x.fillText('Q = ' + st.q, W / 2, 290); return; }
      const one = st.g === 'NOT'; x.fillText(one ? 'A | Y' : 'A B | Y', W / 2, 50); x.fillText(st.g, W / 2, 300);
      const rows = one ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      rows.forEach((r, k) => { const yv = GATES[st.g][0](r[0], r[1]); const cur = r[0] === st.a && (one || r[1] === st.b); x.fillStyle = cur ? '#ffd34d' : '#cfe7ff'; x.fillText(`${r.join(' ')} | ${yv}`, W / 2, 100 + k * 45); }); });
  }
  part('a', sws[0].group, V(0, .5, 0), L('الدخل A', 'Input A'), L('دوس عليه: 0 أو 1.', 'Tap: 0 or 1.'));
  part('b', sws[1].group, V(0, .5, 0), L('الدخل B', 'Input B'), L('دوس عليه: 0 أو 1.', 'Tap: 0 or 1.'));
  part('chip', chip, V(0, .2, 0), L('الشريحة', 'The IC'), L('دوس عليها تغيّر نوع البوابة.', 'Tap to change the gate type.'));
  part('out', out.group, V(0, .3, 0), L('الخرج Y', 'Output Y'), L('الليد بينوّر لما الخرج 1.', 'The LED lights when the output is 1.'));
  ctx.parts.a.tap = () => { st.a ^= 1; derive(); return `A = ${st.a}`; };
  ctx.parts.b.tap = () => { st.b ^= 1; derive(); return `B = ${st.b}`; };
  ctx.parts.chip.tap = () => { if(st.ff) return L('ده القلاب SR.', 'This is the SR flip-flop.'); const k = Object.keys(GATES); st.g = k[(k.indexOf(st.g) + 1) % k.length]; derive(); return L(`بوابة ${st.g}`, `${st.g} gate`); };
  return {
    ...ctx, view: V(.05, 1.0, 1.5), sway: true, hint: L('دوس على A وB أو على الشريحة · صباعين للتقريب', 'Tap A, B or the chip · pinch to zoom'),
    steps: [
      { title: L('البوابات المنطقية', 'Logic gates'), text: L('الدواير الرقمية بتشتغل بحالتين بس: 0 (مفيش جهد) و1 (5 فولت). البوابة بتاخد دخل أو اتنين وتطلّع خرج حسب قاعدة ثابتة اسمها جدول الحقيقة. دوس على A وB.', 'Digital circuits use two states: 0 (no voltage) and 1 (5 V). A gate takes one or two inputs and outputs by a fixed rule, its truth table. Tap A and B.'), focus: 'chip', s: { g: 'AND', a: 0, b: 0 } },
      { title: L('بوابة AND', 'AND gate'), text: L('الخرج 1 بس لو A و B الاتنين 1. زي مفتاحين توالي. شريحتها 7408.', 'Output is 1 only when A and B are both 1, like two switches in series. IC 7408.'), focus: 'out', s: { g: 'AND', a: 1, b: 1 } },
      { title: L('بوابة OR', 'OR gate'), text: L('الخرج 1 لو أي دخل فيهم 1. زي مفتاحين توازي. شريحتها 7432.', 'Output is 1 if either input is 1, like two switches in parallel. IC 7432.'), focus: 'out', s: { g: 'OR', a: 1, b: 0 } },
      { title: L('بوابة NOT', 'NOT gate'), text: L('دخل واحد، والخرج عكسه: 0 يطلع 1، و1 يطلع 0. شريحتها 7404.', 'One input; the output is its opposite. IC 7404.'), focus: 'out', s: { g: 'NOT', a: 0, b: 0 } },
      { title: L('NAND و XOR', 'NAND and XOR'), text: L('NAND عكس AND (شريحة 7400)، ومنها ممكن نبني أي بوابة تانية. XOR الخرج 1 لما الدخلين مختلفين بس (شريحة 7486). دوس على الشريحة وجرّب كل البوابات.', 'NAND is the inverse of AND (7400) and can build any other gate. XOR outputs 1 only when the inputs differ (7486). Tap the chip to try every gate.'), focus: 'chip', s: { g: 'XOR', a: 1, b: 0 } },
      { title: L('القلاب SR', 'The SR flip-flop'), text: L('القلاب بيفتكر: S=1 بيخلّي الخرج Q=1، وR=1 بيرجّعه 0. ولما الاتنين 0 بيفضل محتفظ بآخر حالة. ده أبسط ذاكرة. A هنا S، وB هنا R.', 'A flip-flop remembers: S=1 sets Q=1, R=1 resets it to 0, and with both 0 it holds its last state. The simplest memory. Here A is S and B is R.'), focus: 'out', s: { ff: 1, a: 0, b: 0, q: 1 } }
    ],
    apply(s){ Object.assign(st, { ff: 0, q: 0, g: 'AND' }, s); derive(); },
    update(dt){ sws.forEach(s => s.update(dt)); out.update(dt); }
  };
}

/* ---------- مكبر العمليات 741 ---------- */
function buildOpAmp(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const bb = makeBreadboard(2.6, 1.2); root.add(bb);
  const ic = makeDIP(8, 'UA741'); ic.scale.setScalar(2.2); ic.position.set(-.3, .08, -.1); root.add(ic);
  const pins = ['Offset', '−IN', '+IN', '−V', 'Offset', 'OUT', '+V', 'NC'];
  pins.forEach((p, i) => { const k = i < 4 ? i : 7 - i; const s = i < 4 ? 1 : -1; const l = label(`${i + 1} ${p}`, '#ffd34d', .07); l.position.set(-.3 - .66 + .22 + k * .176 * 2.2 / 2 * 1.0, .35, -.1 + s * .38); root.add(l); });
  const rf = makeResistor([0x6b3b1e, 0x111111, 0xe07a1a, 0xd9a441]); rf.group.position.set(.6, .08, -.45); root.add(rf.group); root.add(at(label('Rf 10k', '#ffffff', .07), .6, .3, -.45));
  const ri = makeResistor([0x6b3b1e, 0x111111, 0xd0302a, 0xd9a441]); ri.group.position.set(-1.0, .08, .35); root.add(ri.group); root.add(at(label('Ri 1k', '#ffffff', .07), -1.0, .3, .35));
  const sc = makeScreen(.9, .6); sc.mesh.position.set(.8, .9, -.65); root.add(sc.mesh);
  part('ic', ic, V(0, .2, 0), L('مكبر العمليات 741', 'Op-amp 741'), L('شريحة 8 رجول، أشهر مكبر في الإلكترونيات.', 'An 8-pin IC, the best-known amplifier.'));
  part('rf', rf.group, V(0, .25, 0), L('مقاومة التغذية العكسية', 'Feedback resistor'), L('هي و Ri بيحددوا الكسب.', 'With Ri it sets the gain.'));
  part('scope', sc.mesh, V(0, .35, 0), L('الدخل والخرج', 'Input and output'), L('الأخضر الدخل، والبرتقالي الخرج.', 'Green is input, orange is output.'));
  const st = { mode: 'inv' }; let t = 0;
  return {
    ...ctx, view: V(.05, 1.05, 1.45), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('مكبر العمليات 741', 'The 741 op-amp'), text: L('شريحة صغيرة بـ 8 رجول بتكبّر الفرق بين دخلين: العاكس (−) رجل 2، وغير العاكس (+) رجل 3، والخرج رجل 6. بتتغذى بجهدين +V رجل 7 و−V رجل 4. النقطة على الشريحة بتحدد رجل 1.', 'An 8-pin IC that amplifies the difference between two inputs: inverting (−) pin 2 and non-inverting (+) pin 3, output on pin 6. It is fed +V on pin 7 and −V on pin 4. The dot marks pin 1.'), focus: 'ic', s: { mode: 'inv' } },
      { title: L('المكبر العاكس', 'Inverting amplifier'), text: L('الإشارة داخلة على الرجل العاكسة عن طريق Ri. الكسب = − Rf ÷ Ri = − 10k ÷ 1k = −10. يعني الخرج أكبر 10 مرات ومقلوب (لما الدخل يطلع، الخرج ينزل).', 'The signal enters the inverting pin via Ri. Gain = −Rf ÷ Ri = −10k ÷ 1k = −10: ten times larger and inverted.'), focus: 'rf', s: { mode: 'inv' } },
      { title: L('المكبر غير العاكس', 'Non-inverting amplifier'), text: L('الإشارة على الرجل غير العاكسة. الكسب = 1 + Rf ÷ Ri = 11. الخرج أكبر 11 مرة وفي نفس اتجاه الدخل.', 'The signal goes to the non-inverting pin. Gain = 1 + Rf ÷ Ri = 11: larger and in phase with the input.'), focus: 'scope', s: { mode: 'non' } },
      { title: L('الداتا شيت والبدائل', 'Datasheet and substitutes'), text: L('قبل ما تغيّر شريحة، ارجع للداتا شيت: الجهد المسموح (حتى ±18 فولت للـ 741)، وترتيب الرجول، والبدائل اللي ليها نفس الرجول زي LM741 وTL071. لو الخرج لازق على جهد التغذية، غالبًا الشريحة تالفة أو التغذية العكسية مفصولة.', 'Before replacing an IC, check the datasheet: supply limit (±18 V for the 741), pinout and pin-compatible substitutes such as the LM741 or TL071. An output stuck at a supply rail usually means a dead IC or an open feedback path.'), focus: 'ic', s: { mode: 'sat' } }
    ],
    apply(s){ st.mode = s.mode; },
    update(dt){ t += dt; sc.draw((x, W, H) => { const g = st.mode === 'inv' ? -10 : st.mode === 'non' ? 11 : 30; [[ '#7dffb0', 1 ], [ '#ffb04a', g ]].forEach(([c, k], j) => { x.strokeStyle = c; x.lineWidth = 3; x.beginPath(); for(let i = 0; i <= W; i += 2){ let v = Math.sin((i / W * 2 + t * .5) * Math.PI * 2) * .1 * k; v = Math.max(-1.3, Math.min(1.3, v)); const y = H / 2 - v * H * .3; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }); }); }
  };
}

/* ================= برنامج الإلكترونيات: الدفعة التانية ================= */
function makeCanvas(w, h, res = 512){
  const c = document.createElement('canvas'); c.width = res; c.height = Math.round(res * h / w);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  return { mesh, draw(fn){ fn(c.getContext('2d'), c.width, c.height); tex.needsUpdate = true; } };
}
function drawScene(x, W, H, bright = 1, t = 0){
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3d8fe0'); g.addColorStop(.6, '#9fd3ff'); g.addColorStop(.61, '#4f9a45'); g.addColorStop(1, '#2d6a2a');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = '#ffe27a'; x.beginPath(); x.arc(W * .78, H * .22, H * .1, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#3f7f3a'; x.beginPath(); x.moveTo(0, H * .62); for(let i = 0; i <= 10; i++) x.lineTo(i * W / 10, H * (.55 + .06 * Math.sin(i * 1.3 + 1))); x.lineTo(W, H); x.lineTo(0, H); x.fill();
  x.fillStyle = 'rgba(255,255,255,.85)'; const cx = (t * 30) % (W + 200) - 100; x.beginPath(); x.ellipse(cx, H * .2, 60, 18, 0, 0, Math.PI * 2); x.fill();
  if(bright < 1){ x.fillStyle = `rgba(0,0,0,${1 - bright})`; x.fillRect(0, 0, W, H); }
}
function textCenter(x, W, y, s, size = 40, col = '#ffffff'){ x.fillStyle = col; x.font = `bold ${size}px "IBM Plex Sans Arabic", Tahoma, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, W / 2, y); }
function pcb(w, d, col = 0x1f7a4a){ return box(w, .02, d, M(col, { r: .6 })); }
function roomShell(root, X, H = 2.6){
  root.add(at(box(4.4, .1, 3.2, M(0xb9b2a6, { r: .8 })), 0, -.05, 0));
  const wm = M(0xe9e3d6, { r: .95 }), cm = M(0xf3f1ec, { r: .95 });
  if(X){ X.wall(wm); X.wall(cm); }
  root.add(at(box(4.4, H, .08, wm), 0, H / 2, -1.6));
  root.add(at(box(.08, H, 3.2, wm), -2.2, H / 2, 0));
  root.add(at(box(4.4, .06, 1.6, cm), 0, H + .03, -.8));
  root.add(at(shadowPlane(5, 4), 0, -.11, 0));
}

/* ---------- جهاز الاستقبال (الريسيفر) ---------- */
function buildReceiver(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  // الطبق والـ LNB
  const dish = new THREE.Group(); dish.position.set(-1.75, 0, -.55); root.add(dish);
  dish.add(at(cyl(.03, .045, .5, M(0x8a9099, { m: .6 }), 12), 0, .25, 0));
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(.42, 32, 10, 0, Math.PI * 2, 0, .55), M(0xe9ebef, { r: .4, side: THREE.DoubleSide })); bowl.rotation.x = -Math.PI / 2 - .5; bowl.material.color.setHex(0xb9c0c8); dish.add(at(bowl, 0, .95, -.25));
  dish.add(tube(CR([V(0, .55, -.05), V(0, .68, .2), V(0, .8, .32)]), .012, M(0x8a9099, { m: .6 }), 20));
  const lnb = new THREE.Group(); lnb.position.set(0, .82, .34); lnb.rotation.x = .5; dish.add(lnb);
  lnb.add(cyl(.04, .03, .14, M(0x2b3038), 16)); lnb.add(at(cyl(.05, .05, .02, M(0x2b3038), 16), 0, .07, 0));
  // جسم الريسيفر مفتوح
  const rc = new THREE.Group(); rc.position.set(-.2, 0, -.15); root.add(rc);
  const caseM = M(0x2b3038, { r: .5 });
  rc.add(at(box(1.5, .05, 1.0, caseM), 0, .025, 0)); rc.add(at(box(1.5, .2, .03, caseM), 0, .1, -.5)); [-.75, .75].forEach(x => rc.add(at(box(.03, .2, 1.0, caseM), x, .1, 0)));
  rc.add(at(box(1.5, .2, .04, M(0x15181d, { r: .3 })), 0, .1, .5));
  rc.add(at(pcb(1.42, .9), 0, .06, -.02));
  // دايرة القدرة
  const pw = new THREE.Group(); pw.position.set(-.45, .07, -.15); rc.add(pw);
  pw.add(at(box(.52, .004, .52, M(0x2f8a5a, { r: .6 })), 0, .01, 0));
  const bigCap = cyl(.06, .06, .18, M(0x2a3f8a, { r: .4 }), 18); pw.add(at(bigCap, -.12, .1, .1));
  pw.add(at(box(.14, .12, .12, M(0xe0b23a, { r: .5 })), .1, .07, .05)); pw.add(at(box(.16, .04, .04, M(0x3a3f46)), .1, .14, .05));
  const fuseGlass = M(0xdfe9f2, { opacity: .55 }); const fz = cyl(.022, .022, .14, fuseGlass, 12); fz.rotation.z = Math.PI / 2; pw.add(at(fz, -.08, .04, -.17));
  [-.15, -.01].forEach(xx => { const e = cyl(.024, .024, .025, M(0xc9ced6, { m: .9 }), 12); e.rotation.z = Math.PI / 2; pw.add(at(e, xx, .04, -.17)); });
  const fWire = box(.11, .004, .004, M(0xc9ced6, { m: .9 })); pw.add(at(fWire, -.08, .04, -.17));
  pw.add(at(box(.08, .04, .08, M(0x1d2128)), .12, .03, -.15)); pw.add(at(label(L('القدرة', 'Power'), '#ffffff', .06), 0, .28, 0));
  for(let i = 0; i < 5; i++) pw.add(at(box(.01, .1, .14, M(0xb9c0c8, { m: .8 })), .02 + i * .03, .06, -.15));
  // التيونر
  const tun = new THREE.Group(); tun.position.set(.35, .07, -.3); rc.add(tun);
  tun.add(at(box(.36, .1, .26, M(0xc9ced6, { m: .8, r: .3 })), 0, .05, 0));
  const fc = cyl(.025, .025, .1, M(0xd9a441, { m: .8 }), 12); fc.rotation.x = Math.PI / 2; tun.add(at(fc, 0, .06, -.2));
  tun.add(at(label('TUNER', '#1b1f26', .05), 0, .11, .05));
  // المعالج والفلاش
  const cpu = new THREE.Group(); cpu.position.set(.15, .07, .12); rc.add(cpu);
  cpu.add(at(box(.2, .025, .2, M(0x1d2128, { r: .4 })), 0, .02, 0));
  [[0, .105, .2, .01], [0, -.105, .2, .01], [.105, 0, .01, .2], [-.105, 0, .01, .2]].forEach(([xx, zz, w, d]) => cpu.add(at(box(w, .006, d, M(0xc9ced6, { m: .9 })), xx, .012, zz)));
  cpu.add(at(label('CPU', '#e8edf3', .05), 0, .06, 0));
  cpu.add(at(box(.13, .02, .08, M(0x1d2128)), .3, .015, .02)); cpu.add(at(label('FLASH', '#e8edf3', .04), .3, .05, .02));
  // المداخل والمخارج
  const io = new THREE.Group(); rc.add(io);
  io.add(at(box(.12, .045, .04, M(0x15181d)), -.05, .12, -.52)); io.add(at(label('HDMI', '#ffffff', .045), -.05, .2, -.53));
  [0xe8c21a, 0xf2f2f2, 0xd23a2e].forEach((c, i) => { const r = cyl(.02, .02, .05, M(c), 12); r.rotation.x = Math.PI / 2; io.add(at(r, .12 + i * .06, .12, -.53)); });
  io.add(at(box(.08, .03, .02, M(0xc9ced6, { m: .8 })), .55, .1, .53));
  // اللوحة الأمامية
  const fr = new THREE.Group(); rc.add(fr);
  const seg = makePanel(.3, .1, { bg: '#140606', fg: '#ff3b2f', font: 'bold 70px monospace' }); fr.add(at(seg.mesh, -.2, .11, .522));
  const eye = new THREE.Mesh(new THREE.SphereGeometry(.018, 12, 8), M(0x6a1010, { r: .2 })); fr.add(at(eye, .12, .11, .525));
  const sby = new THREE.Mesh(new THREE.SphereGeometry(.01, 10, 6), M(0x2fbf5a)); fr.add(at(sby, .2, .11, .525));
  [.3, .38].forEach(xx => fr.add(at(box(.05, .03, .02, M(0x3a3f46)), xx, .11, .525)));
  // الشاشة
  const tv = new THREE.Group(); tv.position.set(1.35, 0, -.65); root.add(tv);
  tv.add(at(box(.3, .02, .18, M(0x1d2128)), 0, .01, 0)); tv.add(at(box(.06, .3, .04, M(0x1d2128)), 0, .16, 0));
  tv.add(at(box(1.1, .68, .05, M(0x15181d, { r: .3 })), 0, .62, 0));
  const scr = makeCanvas(1.02, .6); tv.add(at(scr.mesh, 0, .62, .027));
  // الكابلات
  const cblM = M(0x1d2128, { r: .6 });
  const dishC = CR([V(-1.75, .82, -.2), V(-1.5, .2, -.4), V(-1.0, .04, -.85), V(.15, .04, -.86), V(.15, .19, -.75)]);
  root.add(tube(dishC, .013, cblM, 60));
  root.add(tube(CR([V(-.25, .12, -.7), V(-.25, .04, -.9), V(.6, .04, -.95), V(1.2, .25, -.74), V(1.35, .45, -.69)]), .013, cblM, 60));
  const flowPath = CR([V(-1.75, .82, -.2), V(-1.5, .2, -.4), V(-1.0, .05, -.85), V(.15, .06, -.86), V(.15, .19, -.6), V(.15, .2, -.4), V(-.05, .14, -.03), V(-.25, .14, -.5), V(-.25, .06, -.9), V(.6, .05, -.95), V(1.2, .25, -.74), V(1.35, .5, -.62)]);
  const flow = new Flow(root, flowPath, { count: 22, speed: .8, size: .025, color: 0x7fe0ff });
  // الريموت والفلاشة
  const rem = new THREE.Group(); rem.position.set(.75, .03, .65); rem.rotation.y = -.4; root.add(rem);
  rem.add(at(box(.16, .03, .45, M(0x1d2128, { r: .5 })), 0, .015, 0)); rem.add(at(cyl(.025, .025, .015, M(0xd23a2e), 12), 0, .035, -.16));
  for(let i = 0; i < 12; i++) rem.add(at(cyl(.014, .014, .012, M(0x6c747d), 10), -.04 + (i % 3) * .04, .035, -.06 + Math.floor(i / 3) * .055));
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.008, .04, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xff5a5a, transparent: true, opacity: 0, depthWrite: false })); beam.userData.noFit = true; root.add(beam);
  const ba = V(.66, .06, .45), bb2 = V(-.08, .11, .38); beam.position.copy(ba).lerp(bb2, .5); beam.scale.y = ba.distanceTo(bb2); beam.quaternion.setFromUnitVectors(V(0, 1, 0), bb2.clone().sub(ba).normalize());
  const usb = new THREE.Group(); usb.position.set(.35, .1, .42); root.add(usb);
  usb.add(at(box(.08, .03, .2, M(0x2a62c9, { r: .4 })), 0, 0, .12)); usb.add(at(box(.05, .02, .06, M(0xc9ced6, { m: .8 })), 0, 0, -.01));
  const warn = label('!', '#ff5a4a', .18); warn.position.set(.15, .35, -.86); root.add(warn);

  part('dish', dish, V(0, 1.2, 0), L('الطبق والـ LNB', 'Dish and LNB'), L('الطبق بيجمّع الإشارة، والـ LNB بيكبّرها وينزّل ترددها وتنزل في الكابل.', 'The dish collects the signal; the LNB amplifies it and lowers its frequency down the cable.'));
  part('power', pw, V(0, .3, 0), L('دايرة القدرة', 'Power supply'), L('بتحوّل 220 فولت لجهود صغيرة (5 و12 و3.3 فولت) لكل الجهاز.', 'Turns 220 V into small voltages (5, 12, 3.3 V) for the whole unit.'));
  part('tuner', tun, V(0, .2, 0), L('التيونر', 'Tuner'), L('بيختار القناة من الإشارة الداخلة من الـ LNB.', 'Selects the channel from the LNB signal.'));
  part('cpu', cpu, V(0, .15, 0), L('المعالج والذاكرة', 'Processor and memory'), L('المعالج بيفك تشفير الصورة والصوت، والفلاش فيها السوفت وير والقنوات.', 'The processor decodes picture and sound; the flash holds the software and channel list.'));
  part('front', fr, V(-.2, .22, .52), L('اللوحة الأمامية', 'Front panel'), L('فيها شاشة الأرقام، ومستقبل الأشعة IR، والزراير.', 'Holds the display, the IR receiver and the buttons.'));
  part('remote', rem, V(0, .1, 0), L('الريموت', 'Remote control'), L('دوس عليه تغيّر القناة.', 'Tap it to change channel.'));
  part('tv', tv, V(0, 1.0, 0), L('التليفزيون', 'Television'), L('بيعرض خرج الريسيفر عن طريق HDMI.', 'Shows the receiver output over HDMI.'));
  const st = { fault: null, ch: 12, beam: 0, sw: 0, prog: 0 }; let t = 0;
  const fixMsg = L('اتصلّح! الجهاز رجع يشتغل.', 'Fixed! The receiver works again.');
  ctx.parts.power.tap = () => { if(st.fault === 'power'){ st.fault = null; return L('غيّرنا الفيوز والمكثف المنفوخ: ', 'Replaced the fuse and the swollen capacitor: ') + fixMsg; } return ctx.parts.power.desc; };
  ctx.parts.tuner.tap = () => { if(st.fault === 'io'){ st.fault = null; return L('ربطنا وصلة الـ F كويس: ', 'Tightened the F connector: ') + fixMsg; } return ctx.parts.tuner.desc; };
  ctx.parts.remote.tap = () => { if(st.fault){ return L('صلّح العطل الأول.', 'Fix the fault first.'); } st.ch = st.ch % 99 + 1; st.beam = .6; return L(`القناة ${st.ch}`, `Channel ${st.ch}`); };
  return {
    ...ctx, view: V(.05, .9, 1.5), sway: true, hint: L('دوس على الأجزاء · صباعين للتقريب', 'Tap the parts · pinch to zoom'),
    steps: [
      { title: L('جهاز الاستقبال', 'The satellite receiver'), text: L('الإشارة بتيجي من القمر الصناعي للطبق، وتنزل في الكابل للريسيفر، والريسيفر بيطلّعها صورة وصوت للتليفزيون. النقط الزرقا بتوري مسار الإشارة.', 'The signal comes from the satellite to the dish, down the cable to the receiver, and out to the TV as picture and sound. The blue dots trace the signal.'), s: {} },
      { title: L('المخطط الصندوقي', 'Block diagram'), text: L('الطبق والـ LNB ← التيونر (بيختار القناة) ← المعالج (بيفك التشفير ويطلّع صورة وصوت) ← المخارج HDMI وAV ← التليفزيون. ودايرة القدرة بتغذّي كل المراحل دي، واللوحة الأمامية بتتحكم فيها.', 'Dish and LNB → tuner (selects the channel) → processor (decodes picture and sound) → HDMI and AV outputs → TV. The power supply feeds every stage and the front panel controls them.'), focus: 'tuner', s: {} },
      { title: L('أعطال دايرة القدرة', 'Power supply faults'), text: L('الجهاز ميت: الشاشة الأمامية مطفية ومفيش صورة. افصل الكهربا وافحص: الفيوز بالأفوميتر، والمكثف الكبير (لو منفوخ يتغيّر)، والقنطرة، وبعدين قيس الجهود الخارجة 5 و12 فولت. دوس على دايرة القدرة تصلّحها.', 'The receiver is dead: no display, no picture. Unplug it and check the fuse with a meter, the large capacitor (replace it if swollen), the bridge, then the 5 and 12 V outputs. Tap the power supply to repair it.'), focus: 'power', s: { fault: 'power' } },
      { title: L('أعطال الإدخال والإخراج', 'Input and output faults'), text: L('الجهاز شغال بس مكتوب «لا توجد إشارة». افحص كابل الطبق ووصلة الـ F (العلامة الحمرا)، واتجاه الطبق، وجهد الـ LNB (13 أو 18 فولت على الكابل). ولو الصورة مش طالعة على HDMI بس، افحص كابل HDMI ومخرجه. دوس على التيونر تصلّحها.', 'It runs but shows "No signal". Check the dish cable and F connector (red mark), the dish alignment and the LNB voltage (13 or 18 V on the cable). If only HDMI fails, check the cable and the port. Tap the tuner to repair it.'), focus: 'tuner', s: { fault: 'io' } },
      { title: L('الـ IR والريموت والمفاتيح', 'IR, remote and buttons'), text: L('الريموت بيبعت أشعة تحت حمرا لعين الـ IR في اللوحة الأمامية. لو الريموت مش شغال: جرّب كاميرا الموبايل (بتشوف الضوء)، وغيّر البطاريات، ونضّف الزراير. لو العين بايظة تتغيّر. دوس على الريموت تغيّر القناة.', 'The remote sends infrared to the IR eye on the front panel. If it fails, look through a phone camera (it shows the light), change the batteries and clean the buttons; replace a dead IR eye. Tap the remote to change channel.'), focus: 'remote', s: { beam: 1 } },
      { title: L('تنزيل السوفت وير', 'Loading software'), text: L('لو الجهاز واقف على كلمة BOOT أو بيعيد التشغيل لوحده، غالبًا السوفت وير بايظ. نزّل الملف المناسب للموديل بالظبط على فلاشة، ووصّلها في USB، وابدأ التحديث. ممنوع تفصل الكهربا أثناء التحديث. لو مفيش USB بيتحدّث بكابل RS232 من الكمبيوتر.', 'If it sticks on BOOT or keeps restarting, the software is likely corrupt. Put the exact file for this model on a USB stick, plug it in and start the update. Never cut the power during an update. Without USB, update over an RS232 cable from a computer.'), focus: 'cpu', s: { sw: 1 } }
    ],
    apply(s){ Object.assign(st, { fault: null, beam: 0, sw: 0, prog: 0 }, s); if(s.beam) st.beam = 2; },
    update(dt){
      t += dt; st.beam = Math.max(0, st.beam - dt); if(st.sw) st.prog = Math.min(100, st.prog + dt * 9);
      const dead = st.fault === 'power';
      flow.target = dead ? 0 : 1; flow.update(dt);
      flow.items.forEach(m => { if(st.fault === 'io' && m.userData.t > .26) m.visible = false; });
      beam.material.opacity = st.beam > 0 ? .25 + .15 * Math.sin(t * 30) : 0;
      setGlow(eye.material, st.beam > 0 ? 1 : .15, 1, .1, .1);
      sby.material.color.setHex(dead ? 0x333333 : 0x2fbf5a); setGlow(sby.material, dead ? 0 : .8, .2, 1, .3);
      fWire.visible = !dead; fuseGlass.color.setHex(dead ? 0x6b5a4a : 0xdfe9f2);
      bigCap.scale.y = dead ? 1.15 : 1; warn.visible = st.fault === 'io' || dead; warn.position.copy(dead ? V(-.65, .5, -.32) : V(.15, .4, -.86));
      usb.visible = !!st.sw;
      seg.setText(dead ? '' : st.sw ? 'USb ' + Math.floor(st.prog) : st.fault === 'io' ? 'C' + String(st.ch).padStart(3, '0') : 'C' + String(st.ch).padStart(3, '0'));
      scr.draw((x, W, H) => {
        if(dead){ x.fillStyle = '#050607'; x.fillRect(0, 0, W, H); return; }
        if(st.sw){ x.fillStyle = '#0d1b2e'; x.fillRect(0, 0, W, H); textCenter(x, W, H * .35, L('تحديث السوفت وير...', 'Upgrading software...'), 34); x.fillStyle = '#26354a'; x.fillRect(W * .15, H * .55, W * .7, 24); x.fillStyle = '#4fc3ff'; x.fillRect(W * .15, H * .55, W * .7 * st.prog / 100, 24); textCenter(x, W, H * .75, Math.floor(st.prog) + '%', 30); return; }
        if(st.fault === 'io'){ x.fillStyle = '#10234a'; x.fillRect(0, 0, W, H); textCenter(x, W, H / 2, L('لا توجد إشارة', 'No Signal'), 44); return; }
        drawScene(x, W, H, 1, t); x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(12, 12, 150, 46); textCenter(x, 174, 36, 'CH ' + st.ch, 30);
      });
    }
  };
}

/* ---------- شاشات LCD وLED: طبقات الشاشة وإزاي بتشتغل ---------- */
function buildTV(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(at(shadowPlane(6, 3.5), 0, 0, 0));
  const W = 2.0, H = 1.15, Y = .7;
  const NAMES = [[L('الغطا الخلفي', 'Back cover'), '#cfd6de'], [L('البوردات', 'Circuit boards'), '#7fe0a0'], [L('الإضاءة الخلفية', 'Backlight'), '#ffd34d'], [L('لوح الدفيوزر', 'Diffuser plate'), '#ffffff'], [L('الأفلام الضوئية', 'Optical films'), '#9fd3ff'], [L('بانل الـ LCD', 'LCD panel'), '#ff9a7a'], [L('الإطار الأمامي', 'Front bezel'), '#cfd6de']];
  const layers = NAMES.map(([n, c], i) => { const g = new THREE.Group(); root.add(g); const lb = label(`${i + 1}. ${n}`, c, .13); lb.position.set(-W / 2 + .35 + i * .2, H / 2 + .1 + (i % 2) * .1, .02); g.add(lb); g.userData.lb = lb; return g; });
  const ASM = (i, top) => top ? V(0, Y + 1.0, -.7 + i * .012) : V(0, Y, -.1 + i * .022), EXP = i => V(0, Y, -1.1 + i * .36), PULL = (k, n) => n > 1 ? V(k ? .58 : -.58, Y + .05, k ? .55 : .35) : V(0, Y + .05, .45);
  { const hb = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.05, 1.6), new THREE.MeshBasicMaterial({ visible: false })); hb.position.set(0, Y + .43, 0); hb.raycast = () => {}; root.add(hb); }
  layers.forEach((g, i) => g.position.copy(ASM(i)));
  // 1) الغطا الخلفي
  const back = layers[0]; back.add(box(W + .02, H + .02, .03, M(0x2b3038, { r: .6 })));
  for(let i = 0; i < 6; i++) back.add(at(box(.5, .015, .005, M(0x15181d)), .5, .3 - i * .06, .017));
  // 2) البوردات
  const brd = layers[1]; brd.add(at(box(W, H, .01, M(0x8a9099, { m: .5, opacity: .45 })), 0, 0, -.012));
  const pwr = new THREE.Group(); pwr.position.set(-.6, -.15, 0); brd.add(pwr); pwr.add(box(.62, .46, .015, M(0x1f7a4a, { r: .6 })));
  [[-.2, .1], [-.08, .1]].forEach(([x, y]) => { const c = cyl(.05, .05, .12, M(0x2a3f8a), 14); c.rotation.x = Math.PI / 2; pwr.add(at(c, x, y, .065)); });
  pwr.add(at(box(.13, .13, .09, M(0xe0b23a)), .13, .08, .05)); pwr.add(at(box(.1, .015, .015, M(0xdfe9f2, { opacity: .6 })), -.15, -.15, .02));
  for(let i = 0; i < 4; i++) pwr.add(at(box(.012, .08, .08, M(0xb9c0c8, { m: .8 })), .05 + i * .03, -.12, .045));
  pwr.add(at(label(L('بوردة الباور', 'Power board'), '#ffffff', .06), 0, -.29, .03));
  const mainB = new THREE.Group(); mainB.position.set(.12, -.25, 0); brd.add(mainB); mainB.add(box(.6, .36, .015, M(0x2a62c9, { r: .6 })));
  mainB.add(at(box(.14, .14, .02, M(0x1d2128)), -.1, .04, .015)); mainB.add(at(label('MCU', '#ffffff', .045), -.1, .04, .03));
  mainB.add(at(box(.09, .06, .02, M(0x1d2128)), .12, .08, .015)); mainB.add(at(label('eMMC', '#ffffff', .04), .12, .08, .03));
  mainB.add(at(box(.16, .1, .05, M(0xc9ced6, { m: .8 })), .17, -.08, .03));
  [-.2, -.1, 0].forEach(x => mainB.add(at(box(.07, .03, .04, M(0x15181d)), x, -.19, .02))); mainB.add(at(label('HDMI', '#ffffff', .04), -.1, -.25, .03));
  mainB.add(at(label(L('البوردة الرئيسية', 'Main board'), '#ffffff', .06), 0, .24, .03));
  const tcon = new THREE.Group(); tcon.position.set(0, .45, 0); brd.add(tcon); tcon.add(box(.55, .14, .015, M(0x1f7a4a, { r: .6 })));
  tcon.add(at(box(.1, .06, .02, M(0x1d2128)), 0, 0, .015)); tcon.add(at(label('T-CON', '#ffffff', .05), .18, 0, .03));
  const inv = new THREE.Group(); inv.position.set(.72, .12, 0); brd.add(inv); inv.add(box(.4, .26, .015, M(0x7a4a1f, { r: .6 })));
  [-.1, .1].forEach(x => inv.add(at(box(.08, .08, .07, M(0xe9ebef)), x, 0, .04))); inv.add(at(label(L('الإنفرتر', 'Inverter'), '#ffffff', .055), 0, -.19, .03));
  const spk = new THREE.Group(); brd.add(spk); [-.75, .75].forEach(x => { spk.add(at(box(.3, .07, .08, M(0x3a3f46)), x, -.52, .02)); }); spk.add(at(label(L('السماعات', 'Speakers'), '#ffffff', .05), .75, -.44, .05));
  brd.add(tube(CR([V(.12, -.07, .02), V(.05, .15, .04), V(0, .38, .02)]), .018, M(0xd9dde2), 20));
  brd.add(tube(CR([V(-.3, -.15, .02), V(-.1, -.2, .04), V(-.18, -.25, .02)]), .01, M(0xd23a2e), 20));
  const sigFlow = new Flow(brd, CR([V(-.08, -.42, .05), V(-.1, -.2, .06), V(-.1, .04, .06), V(.05, .15, .06), V(0, .38, .05), V(0, .5, .05)]), { count: 10, speed: .5, size: .022, color: 0x7fe0ff });
  const pwFlow = new Flow(brd, CR([V(-.45, -.1, .05), V(-.3, -.15, .06), V(-.1, -.2, .06), V(-.05, -.22, .05)]), { count: 6, speed: .4, size: .02, color: 0xffd34d });
  // 3) الإضاءة الخلفية
  const bl = layers[2]; bl.add(box(W, H, .02, M(0xb9c0c8, { m: .6, r: .4 }))); bl.add(at(box(W - .06, H - .06, .004, M(0xc9d3de, { r: .9 })), 0, 0, .012));
  const ledM = M(0xfff1b0), deadM = M(0x1d2128); const strips = [], ledGlows = [];
  for(let i = 0; i < 5; i++){ const s = new THREE.Group(); s.position.set(0, -.44 + i * .22, .02); bl.add(s); s.add(box(W - .14, .05, .008, M(0x2f6b4a, { r: .6 }))); for(let k = 0; k < 12; k++){ const d = i === 2 && k === 5; const ln = new THREE.Mesh(new THREE.SphereGeometry(.026, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), d ? deadM : ledM); ln.rotation.x = Math.PI / 2; s.add(at(ln, -.85 + k * .155, 0, .006)); if(!d){ const gs = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xfff1b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); gs.position.set(-.85 + k * .155, 0, .04); gs.scale.setScalar(.13); s.add(gs); ledGlows.push(gs); } } strips.push(s); }
  const tubes = new THREE.Group(); bl.add(tubes); const ccflM = M(0xf4f6ff); for(let i = 0; i < 8; i++){ const tb = cyl(.012, .012, W - .1, ccflM, 10); tb.rotation.z = Math.PI / 2; tubes.add(at(tb, 0, -.5 + i * .143, .03)); }
  // 4) الدفيوزر و5) الأفلام
  layers[3].add(box(W, H, .02, M(0xf4f6f8, { opacity: .8, r: .9 })));
  [0, .012].forEach(z => layers[4].add(at(box(W, H, .004, M(0xbfdcff, { opacity: .28, r: .2 })), 0, 0, z)));
  // 6) البانل
  const pan = layers[5]; pan.add(box(W, H, .015, M(0x1a1f2a, { opacity: .85, r: .1 })));
  const scr = makeCanvas(W - .02, H - .02, 640); pan.add(at(scr.mesh, 0, 0, .009));
  for(let i = 0; i < 4; i++) pan.add(at(box(.14, .06, .004, M(0xd9a441, { m: .6 })), -.6 + i * .4, H / 2 + .02, -.004));
  // 7) الإطار
  const bz = layers[6]; const bM = M(0x15181d, { r: .3 });
  bz.add(at(box(W + .08, .05, .03, bM), 0, H / 2 + .015, 0)); bz.add(at(box(W + .08, .08, .03, bM), 0, -H / 2 - .03, 0)); [-1, 1].forEach(s => bz.add(at(box(.05, H + .1, .03, bM), s * (W / 2 + .015), 0, 0)));
  const sbyM = M(0xd23a2e); bz.add(at(new THREE.Mesh(new THREE.SphereGeometry(.014, 10, 6), sbyM), .85, -H / 2 - .03, .02));
  const stand = new THREE.Group(); root.add(stand); stand.add(at(box(.8, .03, .35, M(0x1d2128)), 0, .015, -.05)); stand.add(at(box(.1, Y - H / 2 - .0, .06, M(0x1d2128)), 0, (Y - H / 2) / 2, -.08));
  // أشعة الضوء
  const rays = []; const rayGeo = new THREE.SphereGeometry(.018, 8, 6);
  for(let i = 0; i < 46; i++){ const m = new THREE.Mesh(rayGeo, new THREE.MeshBasicMaterial({ color: 0xfff3c4, toneMapped: false })); m.userData = { ph: Math.random(), x: (Math.random() - .5) * (W - .2), y: (Math.random() - .5) * (H - .2), c: [0xff4a3a, 0x3cff6a, 0x4a8cff][i % 3], noFit: true }; m.visible = false; root.add(m); rays.push(m); }
  // بكسل مكبّر
  const px = new THREE.Group(); px.position.set(0, Y - .55, .4); px.scale.setScalar(1.55); root.add(px);
  px.add(at(box(.95, .03, .5, M(0x2b3038)), 0, .015, 0)); px.add(at(label(L('بكسل واحد مكبّر', 'One pixel, magnified'), '#ffd34d', .08), -.5, .3, .1));
  px.add(at(box(.8, .5, .02, M(0xfffbe8)), 0, .35, -.18)); const pxLight = px.children.at(-1).material;
  px.add(at(box(.8, .5, .006, M(0x9aa0a6, { opacity: .35 })), 0, .35, -.12));
  const cells = [0xff3b2f, 0x2fdc5a, 0x3b7bff].map((c, i) => { const x = -.26 + i * .26; const rods = []; for(let k = 0; k < 5; k++){ const r = cyl(.008, .008, .09, M(0xdfe6ea, { r: .3 }), 6); r.position.set(x, .17 + k * .09, -.05); px.add(r); rods.push(r); }
    const fm = new THREE.MeshBasicMaterial({ color: c, transparent: true, toneMapped: false }); px.add(at(box(.22, .48, .02, fm), x, .35, .03)); return { rods, fm, c }; });
  px.add(at(box(.8, .5, .006, M(0x9aa0a6, { opacity: .35 })), 0, .35, .08));
  const sw = new THREE.Mesh(new THREE.PlaneGeometry(.2, .2), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); px.add(at(sw, .62, .38, .1));
  [['R', -.26], ['G', 0], ['B', .26]].forEach(([k, x]) => px.add(at(label(k, '#ffffff', .07), x, .06, .12)));
  const PXC = [[[1, 0, 0], L('أحمر', 'Red')], [[0, 1, 0], L('أخضر', 'Green')], [[0, 0, 1], L('أزرق', 'Blue')], [[1, 1, 0], L('أصفر = أحمر + أخضر', 'Yellow = red + green')], [[1, 1, 1], L('أبيض = الـ 3', 'White = all three')], [[0, 0, 0], L('أسود = الـ 3 قافلين', 'Black = all closed')]];
  const pxLab = { s: null }; const setPxLab = s => { if(pxLab.s) px.remove(pxLab.s); pxLab.s = label(s, '#ffffff', .07); pxLab.s.position.set(.62, .55, .1); px.add(pxLab.s); };
  part('bezel', bz, V(0, -H / 2 - .1, .05), L('الإطار الأمامي', 'Front bezel'), L('دوس عليه تفك الشاشة أو تركّبها.', 'Tap to take the set apart or reassemble it.'));
  part('panel', pan, V(0, .2, .05), L('بانل الـ LCD', 'LCD panel'), L('ملايين البكسلات، كل بكسل 3 خلايا أحمر وأخضر وأزرق.', 'Millions of pixels, each three cells: red, green, blue.'));
  part('films', layers[4], V(-.6, .3, .05), L('الأفلام الضوئية', 'Optical films'), L('بتركّز الضوء ناحية المشاهد وتزوّد السطوع.', 'Focus the light toward the viewer for more brightness.'));
  part('diffuser', layers[3], V(-.75, -.3, .05), L('لوح الدفيوزر', 'Diffuser plate'), L('بيوزّع ضوء الليدات بالتساوي على الشاشة كلها.', 'Spreads the LED light evenly across the screen.'));
  part('backlight', bl, V(.6, -.2, .05), L('الإضاءة الخلفية', 'Backlight'), L('شرايط ليد (أو لمبات CCFL في القديم) بتنوّر من ورا.', 'LED strips (CCFL tubes in older sets) shine from behind.'));
  part('power', pwr, V(0, .25, .05), L('بوردة الباور', 'Power board'), L('بتحوّل 220 فولت لـ 12 و24 فولت، وفيها دايرة تشغيل الليدات.', 'Turns 220 V into 12 and 24 V, and drives the LEDs.'));
  part('main', mainB, V(0, .2, .05), L('البوردة الرئيسية', 'Main board'), L('فيها المعالج MCU والذاكرة eMMC والتيونر ومداخل HDMI.', 'Holds the MCU, eMMC memory, tuner and HDMI inputs.'));
  part('tcon', tcon, V(-.2, .1, .05), 'T-CON', L('بتاخد الصورة من البوردة الرئيسية وتوزّعها على صفوف وأعمدة البكسلات.', 'Takes the picture from the main board and drives the pixel rows and columns.'));
  part('inv', inv, V(0, .2, .05), L('الإنفرتر', 'Inverter'), L('بيولّع لمبات CCFL بجهد عالي في الشاشات القديمة.', 'Lights CCFL tubes with high voltage in older sets.'));
  part('spk', spk, V(-.75, -.42, .05), L('السماعات', 'Speakers'), L('بتاخد الصوت من مكبر الصوت على البوردة الرئيسية.', 'Fed by the audio amplifier on the main board.'));
  part('back', back, V(.6, .3, .05), L('الغطا الخلفي', 'Back cover'), L('بيتفك بمسامير من ورا عشان توصل للبوردات.', 'Unscrews from the back to reach the boards.'));
  part('pixel', px, V(0, .9, 0), L('البكسل المكبّر', 'Magnified pixel'), L('دوس عليه تغيّر اللون.', 'Tap to change the colour.'));
  const st = { ex: 0, fault: null, rays: 0, sig: 0, px: 0, ccfl: 0, pull: [], labels: 0 }; let t = 0, ex = 0, pxI = 0, pxT = 0;
  const FIX = { power: 'power', boot: 'main', hdmi: 'main', inv: 'inv', led: 'backlight', sound: 'spk' };
  const FIXT = { power: L('غيّرنا المكثف المنفوخ والفيوز في بوردة الباور.', 'Replaced the swollen capacitor and fuse on the power board.'), boot: L('نزّلنا سوفت وير جديد على الـ eMMC.', 'Reflashed the eMMC.'), hdmi: L('غيّرنا مدخل HDMI المكسور.', 'Replaced the broken HDMI port.'), inv: L('غيّرنا ترانس الإنفرتر.', 'Replaced the inverter transformer.'), led: L('غيّرنا شريط الليد المحروق.', 'Replaced the burnt LED strip.'), sound: L('غيّرنا شريحة مكبر الصوت.', 'Replaced the audio amplifier IC.') };
  Object.keys(ctx.parts).forEach(id => { const p = ctx.parts[id]; p.tap = () => { if(st.fault && FIX[st.fault] === id){ const m = FIXT[st.fault]; st.fault = null; return m + L(' الشاشة اشتغلت.', ' The set works.'); } return p.desc; }; });
  ctx.parts.bezel.tap = () => { st.ex = st.ex ? 0 : 1; return st.ex ? L('فكّينا الشاشة لطبقاتها.', 'The set taken apart into its layers.') : L('ركّبنا الشاشة تاني.', 'The set reassembled.'); };
  ctx.parts.pixel.tap = () => { pxI = (pxI + 1) % PXC.length; pxT = 0; setPxLab(PXC[pxI][1]); return PXC[pxI][1]; };
  const T = (a, b) => L(a, b), FX = { ex: 1 };
  return {
    ...ctx, view: V(.2, .2, 1.0), sway: true, hint: L('دوس على الإطار تفك الشاشة · دوس على أي طبقة أو بوردة', 'Tap the bezel to take it apart · tap any layer or board'),
    steps: [
      { title: T('شاشات LCD وLED', 'LCD and LED TVs'), text: T('الشاشة من برّه شكلها لوح واحد، لكن هي في الحقيقة 7 طبقات فوق بعض. الخطوة الجاية هنفكها ونشوف كل طبقة. (ممكن تدوس على الإطار في أي وقت تفك أو تركّب).', 'From outside it looks like one sheet, but it is seven layers. Next we take it apart. Tap the bezel any time to take it apart or reassemble it.'), s: { ex: 0 } },
      { title: T('طبقات الشاشة', 'The layers'), text: T('من ورا لقدّام: 1 الغطا الخلفي، 2 البوردات، 3 الإضاءة الخلفية، 4 لوح الدفيوزر، 5 الأفلام الضوئية، 6 بانل الـ LCD، 7 الإطار الأمامي. دوس على أي طبقة تعرف اسمها ووظيفتها، وفي الخطوات الجاية هنطلّع كل طبقة لوحدها قدّامك، والشاشة الصغيرة فوق بتوريك أثرها.', 'Back to front: 1 back cover, 2 boards, 3 backlight, 4 diffuser, 5 optical films, 6 LCD panel, 7 front bezel. Tap any layer for its job; the next steps bring each one out in front, with the small set above showing its effect.'), s: { ex: 1, labels: 1 } },
      { title: T('رحلة الضوء', 'The path of light'), text: T('الـ LCD نفسه مش بينوّر. الإضاءة الخلفية بتطلّع ضوء أبيض (النقط الصفرا)، يعدّي في الدفيوزر والأفلام، وبعدين في البانل اللي بيلوّنه أحمر وأخضر وأزرق ويطلع لعينك.', 'The LCD makes no light. The backlight gives white light (yellow dots) that passes the diffuser and films, then the panel colours it red, green and blue on its way to your eye.'), s: { ex: 1, rays: 1, labels: 1 } },
      { title: T('الإضاءة الخلفية', 'The backlight'), text: T('طلّعنا طبقة الإضاءة الخلفية قدّامك (والشاشة فوق من غيرها): لوح معدن عليه عاكس أبيض و5 شرايط ليد. الليدات في كل شريط متوصلة توالي، فلو ليد واحد اتحرق الشريط كله بيطفي. بوردة الباور هي اللي بتغذيهم.', 'The backlight taken out in front of you (the set above is without it): a metal plate with a white reflector and five LED strips. The LEDs on a strip are in series, so one dead LED turns the strip off. The power board drives them.'), focus: 'backlight', s: { ex: 1, pull: [2] } },
      { title: T('الدفيوزر والأفلام', 'Diffuser and films'), text: T('الليدات نقط منوّرة، فمن غير الدفيوزر هتشوف بقع ضوء. لوح الدفيوزر اللبني ده بيوزّع الضوء بالتساوي، والأفلام الشفافة اللي قدامه بتوجّه الضوء لقدّام عشان الشاشة تبقى أنور. لو اتنقلوا أو اتكرمشوا تشوف بقع أو ضل.', 'LEDs are points of light; without the diffuser you would see bright spots. This milky plate spreads the light evenly and the clear films in front aim it forward for brightness. If they shift or crease you see patches or shadows.'), focus: 'diffuser', s: { ex: 1, pull: [3, 4] } },
      { title: T('البانل والبكسلات', 'The panel and its pixels'), text: T('البانل ملايين البكسلات، وكل بكسل 3 خلايا: أحمر وأخضر وأزرق. في كل خلية كريستال سائل بيلف بالجهد زي الشيش، يعدّي الضوء أو يمنعه، وفلتر اللون بيلوّنه. الـ 3 مفتوحين = أبيض، والـ 3 مقفولين = أسود. البكسل المكبّر قدّام بيوريك ده، ودوس عليه تغيّر اللون.', 'The panel has millions of pixels, each three cells: red, green and blue. In each, liquid crystal twists with voltage like a shutter to pass or block light, and a filter colours it. All open = white, all closed = black. The magnified pixel shows this; tap it to change colour.'), focus: 'pixel', s: { ex: 1, pull: [9], px: 1 } },
      { title: T('البوردات وطريق الإشارة', 'Boards and the signal path'), text: T('طلّعنا البوردات قدّامك: الإشارة (النقط الزرقا) بتدخل من HDMI للبوردة الرئيسية، والمعالج MCU بيجهّز الصورة، وتطلع في كابل عريض للـ T-CON اللي بتشغّل البانل. وبوردة الباور (النقط الصفرا) بتغذّي الكل. الإنفرتر للشاشات القديمة بس، والسماعات تحت.', 'The boards lifted out: the signal (blue dots) enters by HDMI into the main board, the MCU prepares the picture and sends it by a wide cable to the T-CON, which drives the panel. The power board (yellow dots) feeds everything. The inverter is only in older sets; the speakers sit at the bottom.'), focus: 'main', s: { ex: 1, pull: [1], sig: 1 } },
      { title: T('أعطال الباور', 'Power faults'), text: T('الشاشة ميتة ولمبة الاستاند باي مطفية. افحص الفيوز، والمكثفات المنفوخة، وجهد الاستاند باي (5 فولت)، وبعدين 12 و24 فولت. دوس على بوردة الباور تصلّحها.', 'Dead set, standby LED off. Check the fuse, swollen capacitors, the 5 V standby, then 12 and 24 V. Tap the power board to repair it.'), focus: 'power', s: { ex: 1, pull: [1], fault: 'power' } },
      { title: T('أعطال MCU وeMMC', 'MCU and eMMC faults'), text: T('الشاشة بتفضل على اللوجو وتعيد التشغيل. غالبًا الـ eMMC (اللي فيها السوفت وير) بايظة أو السوفت وير اتمسح. الحل: تنزيل سوفت وير بفلاشة أو بالمبرمجة، أو تغيير الـ eMMC. دوس على البوردة الرئيسية.', 'Stuck on the logo, restarting. Usually the eMMC is faulty or the software corrupt. Reflash by USB or programmer, or replace the eMMC. Tap the main board.'), focus: 'main', s: { ex: 1, pull: [1], fault: 'boot' } },
      { title: T('أعطال وحدات الإدخال', 'Input faults'), text: T('مكتوب «لا توجد إشارة» على HDMI، والإشارة مش داخلة البوردة. جرّب كابل ومصدر ومدخل تاني. لو المدخل مكسور أو رجوله مفكوكة يتلحم أو يتغيّر. دوس على البوردة الرئيسية.', '"No signal" on HDMI: nothing reaches the board. Try another cable, source and input. A broken or loose port is resoldered or replaced. Tap the main board.'), focus: 'main', s: { ex: 1, pull: [1], fault: 'hdmi', sig: 1 } },
      { title: T('الإنفرتر ولمبات CCFL', 'Inverter and CCFL tubes'), text: T('في الشاشات القديمة الإضاءة الخلفية لمبات CCFL رفيعة بدل الليد (على اليمين)، والإنفرتر (البوردة البني في طبقة البوردات على الشمال) بيولّعها بجهد عالي جدًا. العطل: الصورة تنوّر ثانية وتطفى أو ترعش. افحص ترانس الإنفرتر وأطراف اللمبات. دوس على الإنفرتر.', 'Older sets use thin CCFL tubes instead of LEDs (right), lit at very high voltage by the inverter (brown board, left). Fault: the picture lights then dies, or flickers. Check the inverter transformer and tube ends. Tap the inverter.'), focus: 'inv', s: { ex: 1, pull: [1, 2], fault: 'inv', ccfl: 1 } },
      { title: T('أعطال الإضاءة الخلفية LED', 'LED backlight faults'), text: T('فيه صوت والصورة ضلمة؛ لو نوّرت بكشاف على الشاشة تشوف الصورة باهتة. ليد واحد اتحرق (النقطة السودا في الشريط التالت) فالليدات كلها طفت. افحص كل ليد بجهاز اختبار الليد وغيّر الشريط. دوس على الإضاءة الخلفية.', 'Sound but a black picture; a torch shows a faint image. One LED has failed (black, third strip) so all are out. Test each LED with an LED tester and replace the strip. Tap the backlight.'), focus: 'backlight', s: { ex: 1, pull: [2], fault: 'led' } },
      { title: T('أعطال دوائر الصوت', 'Audio faults'), text: T('الصورة سليمة ومفيش صوت. اتأكد إن الصوت مش مكتوم، وبعدين افحص السماعات بالأفوميتر (حوالي 8 أوم)، وجهد التغذية لشريحة مكبر الصوت على البوردة الرئيسية. دوس على السماعات.', 'Good picture, no sound. Check mute, then measure the speakers (about 8 Ω) and the supply to the audio amplifier IC. Tap the speakers.'), focus: 'spk', s: { ex: 1, pull: [1], fault: 'sound' } }
    ],
    apply(s){ Object.assign(st, { ex: 0, fault: null, rays: 0, sig: 0, px: 0, ccfl: 0, pull: [], labels: 0 }, s); if(st.px){ pxI = 0; pxT = 0; setPxLab(PXC[0][1]); } },
    update(dt){
      t += dt; ex = ease(ex, st.ex, dt, 3); const f = st.fault;
      layers.forEach((g, i) => { const k = st.pull.indexOf(i); const tg = !st.ex ? ASM(i) : k >= 0 ? PULL(k, st.pull.length) : st.pull.length ? ASM(i, true) : EXP(i); g.position.lerp(tg, Math.min(1, dt * 5)); const sc = k >= 0 ? (st.pull.length > 1 ? .56 : .98) : st.ex && st.pull.length ? .5 : 1; g.scale.setScalar(ease(g.scale.x, sc, dt, 4)); g.userData.lb.visible = ex > .5 && (st.labels || k >= 0); if(k >= 0) g.userData.lb.position.set(-W / 2 + .35, H / 2 + .1, .02); else g.userData.lb.position.set(W / 2 + .42, H / 2 - .08 - i * .16, .02); if(k < 0 && st.pull.length && st.ex && i === 6) g.userData.lb.visible = false; });
      stand.visible = ex < .5;
      const ccfl = !!st.ccfl; strips.forEach(s => s.visible = !ccfl); tubes.visible = ccfl;
      const lvl = f === 'power' || f === 'boot' || f === 'led' ? 0 : f === 'inv' ? ((t % 3) < 1 ? 1 : 0) : 1;
      ledM.color.setHex(lvl ? 0xfff1b0 : 0x8a8f96); setGlow(ledM, lvl, 1, .95, .7); ledGlows.forEach(g => { g.visible = st.pull.includes(2); g.material.opacity = lvl * .9; }); setGlow(ccflM, ccfl ? lvl : 0, .9, .95, 1);
      sbyM.color.setHex(f === 'power' ? 0x331111 : 0xd23a2e); setGlow(sbyM, f === 'power' ? 0 : .7, 1, .1, .1);
      sigFlow.target = st.sig && f !== 'power' ? 1 : 0; sigFlow.update(dt); if(f === 'hdmi') sigFlow.items.forEach(m => m.visible = false);
      pwFlow.target = st.sig && f !== 'power' ? 1 : 0; pwFlow.update(dt);
      const zb = layers[2].position.z + .03, zl = layers[5].position.z, zf = layers[6].position.z + .5, ox = layers[2].position.x, ox2 = layers[6].position.x;
      rays.forEach(m => { m.visible = !!st.rays && lvl > 0; if(!m.visible) return; const u = m.userData; u.ph = (u.ph + dt * .35) % 1; const z = zb + (zf - zb) * u.ph; const k = (z - zb) / (zf - zb); m.position.set(u.x, Y + u.y + (u.ph < .3 ? 0 : 0), z); m.material.color.setHex(z > zl ? u.c : 0xfff3c4); });
      px.visible = !!st.px;
      if(st.px){ pxT += dt; if(pxT > 2.2){ pxT = 0; pxI = (pxI + 1) % PXC.length; setPxLab(PXC[pxI][1]); } const lv = PXC[pxI][0];
        cells.forEach((c, i) => { c.rods.forEach((r, k) => { r.rotation.z = ease(r.rotation.z, lv[i] ? 0 : Math.PI / 2, dt, 6); }); c.fm.opacity = lv[i] ? 1 : .55; c.fm.color.setHex(lv[i] ? c.c : 0x22262d); });
        sw.material.color.setRGB(lv[0], lv[1], lv[2]); setGlow(pxLight, .25, 1, 1, .9); }
      scr.draw((x, W2, H2) => {
        if(f === 'power'){ x.fillStyle = '#040506'; x.fillRect(0, 0, W2, H2); return; }
        if(f === 'boot'){ x.fillStyle = '#000'; x.fillRect(0, 0, W2, H2); const a = (Math.sin(t * 2) + 1) / 2; textCenter(x, W2, H2 / 2, 'SMART TV', 64, `rgba(120,190,255,${a})`); return; }
        if(f === 'hdmi'){ x.fillStyle = '#1b1f26'; x.fillRect(0, 0, W2, H2); textCenter(x, W2, H2 * .42, 'HDMI 1', 44, '#8fb8ff'); textCenter(x, W2, H2 * .58, L('لا توجد إشارة', 'No signal'), 40); return; }
        drawScene(x, W2, H2, lvl ? 1 : .07, t);
        if(f === 'sound'){ x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(W2 - 120, 20, 100, 80); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(W2 - 105, 50); x.lineTo(W2 - 90, 50); x.lineTo(W2 - 70, 32); x.lineTo(W2 - 70, 88); x.lineTo(W2 - 90, 70); x.lineTo(W2 - 105, 70); x.fill(); x.strokeStyle = '#ff5a4a'; x.lineWidth = 6; x.beginPath(); x.moveTo(W2 - 60, 42); x.lineTo(W2 - 32, 78); x.moveTo(W2 - 32, 42); x.lineTo(W2 - 60, 78); x.stroke(); }
      });
    }
  };
}

/* ---------- كاميرات المراقبة CCTV ---------- */
function makeBullet(){
  const g = new THREE.Group();
  g.add(at(box(.12, .04, .12, M(0xe9ebef)), 0, 0, -.18)); g.add(at(cyl(.02, .02, .1, M(0xe9ebef)), 0, 0, -.12)).children.at(-1).rotation.x = Math.PI / 2;
  const body = cyl(.07, .07, .28, M(0xf2f3f5, { r: .4 }), 20); body.rotation.x = Math.PI / 2; g.add(body);
  g.add(at(box(.17, .01, .3, M(0xf2f3f5)), 0, .08, .02));
  const ir = M(0x3a1010); const ring = new THREE.Mesh(new THREE.TorusGeometry(.045, .012, 8, 20), ir); g.add(at(ring, 0, 0, .141));
  g.add(at(new THREE.Mesh(new THREE.CircleGeometry(.03, 16), M(0x0a0d12, { r: .1 })), 0, 0, .142));
  return { group: g, ir };
}
function buildCCTV(){
  const ctx = makeCtx(), { root, part } = ctx; roomShell(root, null);
  const cams = []; const DEF = [[V(-1.5, 2.25, -1.48), V(.3, -.5, 1)], [V(-2.08, 2.25, .3), V(1, -.5, .15)], [V(1.5, 2.25, -1.48), V(-.3, -.5, 1)]];
  DEF.forEach(([p, d]) => { const c = makeBullet(); c.group.position.copy(p); c.group.lookAt(p.clone().add(d)); c.group.scale.setScalar(1.7); root.add(c.group); cams.push({ ...c, p, d: d.clone().normalize() }); });
  const dome = new THREE.Group(); dome.position.set(.2, 2.6, -.8); dome.scale.setScalar(1.6); root.add(dome);
  dome.add(at(cyl(.15, .15, .04, M(0xf2f3f5), 24), 0, -.02, 0));
  dome.add(at(new THREE.Mesh(new THREE.SphereGeometry(.11, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0x1d2128, { r: .1, opacity: .85 })), 0, -.04, 0));
  cams.push({ group: dome, ir: M(0x000000), p: V(.2, 2.52, -.8), d: V(0, -1, .5).normalize() });
  const cones = cams.map(c => { const h = 1.6; const m = new THREE.Mesh(new THREE.ConeGeometry(.7, h, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: .14, depthWrite: false, side: THREE.DoubleSide })); m.position.copy(c.p).addScaledVector(c.d, h / 2); m.quaternion.setFromUnitVectors(V(0, 1, 0), c.d.clone().negate()); m.userData.noFit = true; root.add(m); return m; });
  // المكتب والأجهزة
  const desk = new THREE.Group(); desk.position.set(1.3, 0, .55); root.add(desk);
  desk.add(at(box(1.5, .05, .75, M(0x8a6a48, { r: .7 })), 0, .78, 0)); [[-.68, -.32], [.68, -.32], [-.68, .32], [.68, .32]].forEach(([x, z]) => desk.add(at(box(.05, .78, .05, M(0x5a4430)), x, .39, z)));
  const dvr = new THREE.Group(); dvr.position.set(.85, .8, .4); root.add(dvr);
  dvr.add(at(box(.55, .09, .38, M(0x1d2128, { r: .4 })), 0, .045, 0)); dvr.add(at(label('DVR', '#ffffff', .06), -.15, .07, .2));
  const hddM = M(0x2fbf5a); dvr.add(at(new THREE.Mesh(new THREE.SphereGeometry(.01, 8, 6), hddM), .2, .05, .19));
  const hdd = new THREE.Group(); hdd.position.set(.85, .87, .4); root.add(hdd); hdd.add(at(box(.2, .03, .28, M(0xc9ced6, { m: .7 })), .05, .05, 0)); hdd.add(at(label('HDD', '#1b1f26', .05), .05, .1, 0));
  const mon = new THREE.Group(); mon.position.set(1.5, .8, .35); root.add(mon);
  mon.add(at(box(.25, .02, .16, M(0x1d2128)), 0, .01, 0)); mon.add(at(box(.05, .25, .04, M(0x1d2128)), 0, .14, 0)); mon.add(at(box(.86, .52, .04, M(0x15181d)), 0, .52, .0));
  const scr = makeCanvas(.8, .46, 512); mon.add(at(scr.mesh, 0, .52, .021));
  const router = new THREE.Group(); router.position.set(.4, .8, .75); root.add(router); router.add(at(box(.3, .05, .2, M(0xf2f3f5)), 0, .025, 0)); [-.1, .1].forEach(xx => router.add(at(cyl(.008, .008, .2, M(0x1d2128), 8), xx, .14, -.08)));
  const phone = new THREE.Group(); phone.position.set(1.95, .82, .78); phone.rotation.set(-1.2, -.3, 0); root.add(phone);
  phone.add(box(.16, .3, .015, M(0x15181d))); const pscr = makeCanvas(.14, .27, 160); phone.add(at(pscr.mesh, 0, 0, .009));
  const psu = new THREE.Group(); psu.position.set(.5, 1.5, -1.53); root.add(psu); psu.add(box(.36, .42, .1, M(0xd9dde2))); psu.add(at(label('12V DC', '#1b1f26', .06), 0, .05, .06));
  // الكابلات
  const cblCol = 0x1d2128, paths = [];
  [[V(-1.5, 2.15, -1.55), V(-1.5, 2.45, -1.55), V(.5, 2.45, -1.55), V(.5, 1.72, -1.55)], [V(-2.15, 2.15, .3), V(-2.15, 2.45, .3), V(-2.15, 2.45, -1.55), V(.5, 2.45, -1.55)], [V(1.5, 2.15, -1.55), V(1.5, 2.45, -1.55), V(.5, 2.45, -1.55)], [V(.2, 2.6, -.8), V(.2, 2.6, -1.55), V(.5, 2.45, -1.55)], [V(.5, 1.28, -1.55), V(.5, .9, -1.55), V(.85, .82, -1.55), V(.85, .82, .2)]]
    .forEach(pts => { const w = wirePath(pts, cblCol, .014); root.add(w.m); paths.push(w.p); });
  const flows = paths.map(p => new Flow(root, p, { count: 8, speed: .7, size: .025, color: 0x7fe0ff }));
  part('cam1', cams[0].group, V(0, .15, 0), L('كاميرا بولِت', 'Bullet camera'), L('كاميرا خارجية بعدسة وأشعة تحت حمرا للرؤية الليلية.', 'An outdoor camera with lens and infrared for night vision.'));
  part('cam2', cams[1].group, V(0, .15, 0), L('كاميرا 2', 'Camera 2'), L('دوس عليها لو فيها عطل.', 'Tap it if it has a fault.'));
  part('dome', dome, V(0, -.2, 0), L('كاميرا دوم', 'Dome camera'), L('كاميرا داخلية في السقف، شكلها مش ملفت.', 'An indoor ceiling camera, discreet.'));
  part('psu', psu, V(0, .3, .05), L('مصدر التغذية', 'Power supply'), L('12 فولت مستمر لكل الكاميرات.', '12 V DC for every camera.'));
  part('dvr', dvr, V(0, .15, 0), L('جهاز التسجيل DVR', 'DVR recorder'), L('بيستقبل الكاميرات ويسجّل على الهارد.', 'Takes the cameras and records to the hard disk.'));
  part('mon', mon, V(0, .85, 0), L('الشاشة', 'Monitor'), L('بتعرض الكاميرات الأربعة.', 'Shows the four cameras.'));
  part('router', router, V(0, .3, 0), L('الراوتر', 'Router'), L('بيوصّل الـ DVR بالإنترنت.', 'Connects the DVR to the internet.'));
  const st = { cones: 0, flow: 0, rec: 0, phone: 0, fault: null, ir: 0 }; let t = 0;
  ctx.parts.cam2.tap = () => { if(st.fault){ st.fault = null; return L('ربطنا وصلة الـ BNC من جديد والصورة رجعت.', 'Refitted the BNC connector: the picture is back.'); } return ctx.parts.cam2.desc; };
  const tile = (x, X0, Y0, w, h, n) => {
    if(st.fault && n === 2){ x.fillStyle = '#0c2e7a'; x.fillRect(X0, Y0, w, h); x.fillStyle = '#fff'; x.font = 'bold 26px Tahoma, sans-serif'; x.textAlign = 'center'; x.fillText(L('فقد الفيديو', 'VIDEO LOSS'), X0 + w / 2, Y0 + h / 2); return; }
    const g = x.createLinearGradient(0, Y0, 0, Y0 + h); g.addColorStop(0, ['#cdd6e0', '#d7cdb8', '#bcc9b3', '#c9c3d6'][n - 1]); g.addColorStop(.55, '#a7a29a'); g.addColorStop(1, '#6e6a63'); x.fillStyle = g; x.fillRect(X0, Y0, w, h);
    if(st.ir){ x.fillStyle = 'rgba(30,30,30,.55)'; x.fillRect(X0, Y0, w, h); }
    if(n === 1){ const px = X0 + ((t * 25) % (w + 40)) - 20; x.fillStyle = '#2b3038'; x.fillRect(px, Y0 + h * .45, 16, 50); x.beginPath(); x.arc(px + 8, Y0 + h * .42, 9, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#fff'; x.font = 'bold 18px monospace'; x.textAlign = 'left'; x.fillText('CAM' + n, X0 + 8, Y0 + 22);
    const s = Math.floor(t) % 60; x.fillText('10:24:' + String(s).padStart(2, '0'), X0 + w - 110, Y0 + h - 10);
    if(st.rec && Math.floor(t * 2) % 2){ x.fillStyle = '#ff3b2f'; x.beginPath(); x.arc(X0 + w - 18, Y0 + 16, 7, 0, Math.PI * 2); x.fill(); }
  };
  return {
    ...ctx, view: V(.08, .25, 1.6), sway: true, hint: L('دوس على الأجزاء · صباعين للتقريب', 'Tap the parts · pinch to zoom'),
    steps: [
      { title: L('منظومة المراقبة بالكاميرات', 'The CCTV system'), text: L('الكاميرات بتصوّر، والكابلات بتوصّل الصورة والكهربا، والـ DVR بيسجّل على الهارد ديسك، والشاشة بتعرض، والراوتر بيخلّيك تشوف من الموبايل.', 'Cameras capture, cables carry video and power, the DVR records to a hard disk, the monitor displays and the router lets you watch from a phone.'), s: {} },
      { title: L('أنواع الكاميرات', 'Camera types'), text: L('بولِت (اسطوانية) للأماكن الخارجية والمداخل، ودوم (نص كورة) في السقف للأماكن الداخلية. حلقة الليدات حوالين العدسة أشعة تحت حمرا بتنوّر بالليل، والصورة بتبقى أبيض وأسود. اختار الدقة (2 أو 4 أو 8 ميجا) وزاوية العدسة حسب المكان.', 'Bullet cameras for outdoors and entrances; dome cameras on indoor ceilings. The LED ring round the lens is infrared for night, giving a black-and-white picture. Choose resolution (2, 4 or 8 MP) and lens angle to suit the place.'), focus: 'cam1', s: { ir: 1 } },
      { title: L('تركيب الكاميرات', 'Installing the cameras'), text: L('ركّب الكاميرا على ارتفاع 2.5 لـ 3 متر، ووجّهها على المداخل والممرات. المخروط الأصفر هو مجال رؤية كل كاميرا: خلّي المجالات تغطي المكان من غير فراغات، وما توجّهش العدسة ناحية شمس أو لمبة.', 'Mount cameras 2.5–3 m high, aimed at entrances and corridors. The yellow cone is each camera\'s field of view: cover the area without gaps and never point a lens at the sun or a lamp.'), focus: 'cam2', s: { cones: 1 } },
      { title: L('التمديدات والتوصيل', 'Cabling'), text: L('في الكاميرات الأنالوج بنستخدم كابل كواكس RG59 ومعاه سلكين كهربا 12 فولت من مصدر التغذية، وطرفه بوصلة BNC في الـ DVR. في كاميرات IP بنستخدم كابل شبكة Cat6 ويغذّي الكاميرا كمان (PoE) لحد 100 متر. اكتب رقم الكاميرا على طرفي الكابل.', 'Analogue cameras use RG59 coax plus a 12 V pair from the power supply, ending in a BNC at the DVR. IP cameras use Cat6 network cable that also powers them (PoE) up to 100 m. Label both ends of each cable.'), focus: 'psu', s: { flow: 1 } },
      { title: L('ضبط جهاز التسجيل', 'Setting up the DVR'), text: L('ركّب الهارد ديسك وعمله Format من القائمة، واضبط التاريخ والوقت، واختار التسجيل المستمر أو عند الحركة (Motion)، وغيّر كلمة السر الافتراضية. النقطة الحمرا REC على الشاشة معناها إنه بيسجّل.', 'Fit the hard disk and format it from the menu, set the date and time, choose continuous or motion recording, and change the default password. The red REC dot means it is recording.'), focus: 'dvr', s: { rec: 1 } },
      { title: L('المشاهدة من الموبايل', 'Viewing on a phone'), text: L('وصّل الـ DVR بالراوتر بكابل شبكة، وفعّل خدمة الـ P2P، وامسح كود QR من تطبيق الشركة على الموبايل. كده تشوف الكاميرات من أي مكان.', 'Connect the DVR to the router with a network cable, enable P2P and scan its QR code in the maker\'s phone app. You can then watch from anywhere.'), focus: 'router', s: { rec: 1, phone: 1 } },
      { title: L('اكتشاف الأعطال', 'Troubleshooting'), text: L('كاميرا 2 مكتوب عليها «فقد الفيديو». افحص بالترتيب: جهد 12 فولت عند الكاميرا بالأفوميتر، ووصلة الـ BNC، والكابل نفسه، وبعدين جرّب الكاميرا على مدخل تاني. صورة الليل بيضا؟ غالبًا الأشعة بتنعكس من حاجة قريبة. دوس على كاميرا 2 تصلّحها.', 'Camera 2 shows VIDEO LOSS. Check in order: 12 V at the camera with a meter, the BNC connector, the cable, then try the camera on another input. A white night picture usually means IR reflecting off something close. Tap camera 2 to repair it.'), focus: 'cam2', s: { fault: 'cam2', rec: 1 } }
    ],
    apply(s){ Object.assign(st, { cones: 0, flow: 0, rec: 0, phone: 0, fault: null, ir: 0 }, s); },
    update(dt){
      t += dt; cones.forEach(c => c.visible = !!st.cones); flows.forEach(f => { f.target = st.flow ? 1 : 0; f.update(dt); });
      cams.forEach(c => setGlow(c.ir, st.ir ? .9 : 0, 1, .1, .1)); setGlow(hddM, st.rec && Math.floor(t * 4) % 2 ? .9 : .2, .2, 1, .3);
      phone.visible = !!st.phone || true;
      scr.draw((x, W, H) => { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); const w = W / 2 - 3, h = H / 2 - 3; tile(x, 0, 0, w, h, 1); tile(x, W / 2 + 3, 0, w, h, 2); tile(x, 0, H / 2 + 3, w, h, 3); tile(x, W / 2 + 3, H / 2 + 3, w, h, 4); });
      pscr.draw((x, W, H) => { x.fillStyle = st.phone ? '#0d1b2e' : '#050607'; x.fillRect(0, 0, W, H); if(!st.phone) return; x.save(); x.scale(1, 1); tile(x, 0, H * .25, W, H * .35, 1); x.restore(); x.fillStyle = '#4fc3ff'; x.fillRect(0, 0, W, 30); });
    }
  };
}

/* ---------- نظام إنذار الحريق ---------- */
function makeDetector(heat){
  const g = new THREE.Group();
  g.add(at(cyl(.13, .13, .025, M(0xf4f5f7), 24), 0, -.012, 0));
  g.add(at(cyl(.1, .115, .07, M(0xf4f5f7, { r: .4 }), 24), 0, -.06, 0));
  if(heat) for(let i = 0; i < 6; i++){ const a = i / 6 * Math.PI * 2; g.add(at(box(.012, .05, .05, M(0xc9ced6, { m: .7 })), Math.cos(a) * .06, -.11, Math.sin(a) * .06)); }
  const led = M(0x551111); g.add(at(new THREE.Mesh(new THREE.SphereGeometry(.014, 10, 6), led), .09, -.07, .04));
  return { group: g, led };
}
function buildFireAlarm(){
  const ctx = makeCtx(), { root, part } = ctx, X = makeXray(); roomShell(root, X);
  const panel = new THREE.Group(); panel.position.set(-1.35, 1.45, -1.54); panel.scale.setScalar(1.25); root.add(panel);
  panel.add(box(.75, .95, .14, M(0xd9dde2, { r: .5 }))); panel.add(at(label(L('لوحة التحكم', 'Control panel'), '#1b1f26', .06), 0, .4, .08));
  const lcd = makePanel(.55, .13, { bg: '#183018', fg: '#b6ff9a', font: 'bold 34px monospace' }); panel.add(at(lcd.mesh, 0, .22, .071));
  const leds = {}; [['pwr', 0x2fbf5a, -.22, 'POWER'], ['fire', 0xd23a2e, -.07, 'FIRE'], ['fault', 0xf2b51e, .08, 'FAULT'], ['z1', 0xd23a2e, -.22, 'Z1'], ['z2', 0xd23a2e, -.07, 'Z2']].forEach(([k, c, x, n], i) => { const m = M(c); leds[k] = { m, c }; const y = i < 3 ? .02 : -.15; panel.add(at(new THREE.Mesh(new THREE.SphereGeometry(.022, 10, 8), m), x, y, .075)); panel.add(at(label(n, '#1b1f26', .045), x + .07, y, .075)); });
  panel.add(at(box(.2, .12, .02, M(0x3a3f46)), .2, -.32, .075)); panel.add(at(label('RESET', '#ffffff', .045), .2, -.32, .09));
  const d1 = makeDetector(), d2 = makeDetector(), hd = makeDetector(true);
  d1.group.position.set(-.1, 2.6, -.5); d2.group.position.set(1.2, 2.6, -.5); hd.group.position.set(-1.2, 2.6, -.2); [d1, d2, hd].forEach(d => { d.group.scale.setScalar(1.6); root.add(d.group); });
  const mcp = new THREE.Group(); mcp.position.set(1.6, 1.4, -1.54); mcp.scale.setScalar(1.5); root.add(mcp);
  mcp.add(box(.22, .22, .07, M(0xc0392b, { r: .45 }))); const glass = at(box(.13, .13, .01, M(0xf4f5f7)), 0, 0, .04); mcp.add(glass); mcp.add(at(label('FIRE', '#ffffff', .05), 0, .085, .05));
  const sndr = new THREE.Group(); sndr.position.set(.25, 2.1, -1.54); sndr.scale.setScalar(1.5); root.add(sndr);
  const sb = cyl(.11, .12, .1, M(0xc0392b, { r: .45 }), 24); sb.rotation.x = Math.PI / 2; sndr.add(at(sb, 0, 0, .05));
  const lensM = M(0xffffff, { opacity: .7 }); const lens = cyl(.06, .06, .04, lensM, 20); lens.rotation.x = Math.PI / 2; sndr.add(at(lens, 0, 0, .11));
  const strobe = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); strobe.position.set(0, 0, .15); strobe.scale.setScalar(.9); sndr.add(strobe);
  const bin = new THREE.Group(); bin.position.set(-.1, 0, -.2); root.add(bin); bin.add(at(cyl(.16, .13, .4, M(0x6c747d, { m: .5, r: .4 }), 20, true), 0, .2, 0));
  const puffs = []; for(let i = 0; i < 36; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x8a8f96, transparent: true, opacity: 0, depthWrite: false })); s.userData.ph = i / 36; s.userData.r = Math.random(); s.userData.noFit = true; root.add(s); puffs.push(s); }
  const pole = new THREE.Group(); pole.position.set(1.2, 0, -.2); root.add(pole); pole.add(at(cyl(.015, .015, 2.3, M(0xe0b23a), 8), 0, 1.15, 0)); pole.add(at(cyl(.12, .09, .18, M(0xd23a2e, { opacity: .7 }), 16, true), 0, 2.38, 0));
  // الأسلاك (من جوه السقف والحيطة)
  const wires = new THREE.Group(); root.add(wires); X.inside(wires);
  const z1 = wirePath([V(-1.25, 1.95, -1.58), V(-1.25, 2.68, -1.58), V(-1.2, 2.68, -.2), V(-.1, 2.68, -.5), V(1.2, 2.68, -.5), V(1.7, 2.68, -.5)], 0xd23a2e, .014); wires.add(z1.m);
  const z2 = wirePath([V(-1.45, 1.95, -1.58), V(-1.45, 2.5, -1.58), V(.25, 2.5, -1.58), V(.25, 2.2, -1.58), V(.25, 2.5, -1.58), V(1.6, 2.5, -1.58), V(1.6, 1.52, -1.58)], 0xd23a2e, .014); wires.add(z2.m);
  const eol = new THREE.Group(); eol.position.set(1.75, 2.68, -.5); wires.add(eol); const er = makeResistor([0xe8c21a, 0x6b2fa8, 0xd0302a, 0xd9a441]); er.group.scale.setScalar(.6); er.group.position.y = -.07; eol.add(er.group); eol.add(at(label('EOL', '#ffd34d', .08), 0, -.2, 0));
  const brk = label('✕', '#ff3b2f', .22); brk.position.set(1.45, 2.6, -.5); root.add(brk);
  wires.add(at(label(L('زون 1', 'Zone 1'), '#ffd34d', .09), .5, 2.5, -.5)); wires.add(at(label(L('زون 2', 'Zone 2'), '#ffd34d', .09), -.6, 2.38, -1.5));
  part('panel', panel, V(0, .6, .08), L('لوحة التحكم', 'Control panel'), L('بتستقبل الكواشف وتشغّل السارينة. فيها بطارية احتياطي.', 'Receives the detectors and drives the sounders, with a backup battery.'));
  part('det1', d1.group, V(0, -.2, 0), L('كاشف الدخان', 'Smoke detector'), L('بيحس بالدخان بخلية ضوئية.', 'Senses smoke with an optical cell.'));
  part('heat', hd.group, V(0, -.25, 0), L('كاشف الحرارة', 'Heat detector'), L('للمطابخ والجراجات اللي فيها دخان أو بخار عادي.', 'For kitchens and garages where smoke or steam is normal.'));
  part('mcp', mcp, V(0, .2, .05), L('نقطة الإنذار اليدوي', 'Manual call point'), L('دوس عليها تعمل إنذار.', 'Tap it to raise the alarm.'));
  part('sndr', sndr, V(0, .2, .1), L('السارينة والفلاشر', 'Sounder and strobe'), L('صوت عالي وضوء بيومض.', 'Loud tone and flashing light.'));
  part('eol', eol, V(0, -.1, 0), L('مقاومة نهاية الخط', 'End-of-line resistor'), L('في آخر كل زون عشان اللوحة تحس بأي قطع.', 'At the end of each zone so the panel detects a break.'));
  const st = { smoke: 0, mcp: 0, fault: null, x: 0, test: 0 }; let t = 0, sm = 0;
  ctx.parts.mcp.tap = () => { st.mcp ^= 1; return st.mcp ? L('اتكسر الزجاج: إنذار في زون 2!', 'Glass broken: alarm on zone 2!') : L('رجّعنا نقطة الإنذار بالمفتاح.', 'Reset the call point with its key.'); };
  ctx.parts.eol.tap = () => { if(st.fault){ st.fault = null; return L('وصّلنا السلك المقطوع: اللوحة رجعت طبيعي.', 'Rejoined the broken wire: the panel is normal again.'); } return ctx.parts.eol.desc; };
  ctx.parts.panel.tap = () => { if(st.smoke || st.mcp || st.test){ Object.assign(st, { smoke: 0, mcp: 0, test: 0 }); return L('RESET: اللوحة رجعت طبيعي بعد ما الدخان راح.', 'RESET: the panel is normal once the smoke clears.'); } return ctx.parts.panel.desc; };
  const xr = () => { st.x ^= 1; X.set(st.x); return st.x ? L('دي أسلاك الزونات جوه السقف والحيطة.', 'These are the zone cables in the ceiling and wall.') : L('رجعنا للشكل العادي.', 'Back to the normal view.'); };
  return {
    ...ctx, view: V(.05, .2, 1.6), sway: true, xray: { get on(){ return !!st.x; }, toggle(){ return xr(); } },
    hint: L('دوس على نقطة الإنذار أو اللوحة · صباعين للتقريب', 'Tap the call point or the panel · pinch to zoom'),
    steps: [
      { title: L('نظام إنذار الحريق', 'The fire alarm system'), text: L('كواشف في السقف (دخان وحرارة)، ونقطة إنذار يدوي على الحيطة، وسارينة وفلاشر، وكلهم متوصلين بلوحة تحكم. اللوحة مقسّمة زونات عشان تعرف الحريق في أنهي مكان.', 'Ceiling detectors (smoke and heat), a manual call point, a sounder and strobe, all wired to a control panel. The panel is split into zones so it shows where the fire is.'), s: {} },
      { title: L('كاشف الدخان', 'The smoke detector'), text: L('الدخان بيطلع لفوق ويدخل الكاشف، فالخلية الضوئية جواه بتحس بيه. لمبة الكاشف بتنوّر أحمر، واللوحة بتكتب FIRE في زون 1، والسارينة بتضرب. دوس على اللوحة تعمل RESET.', 'Smoke rises into the detector and its optical cell senses it. The detector LED turns red, the panel shows FIRE on zone 1 and the sounder goes off. Tap the panel to RESET.'), focus: 'det1', s: { smoke: 1 } },
      { title: L('نقطة الإنذار اليدوي', 'The manual call point'), text: L('أي حد يشوف حريق يكسر الزجاج أو يضغط عليها، فاللوحة بتدّي إنذار فورًا في زونها (هنا زون 2). بتتركب جنب المخارج على ارتفاع حوالي 1.4 متر. دوس عليها.', 'Anyone who sees a fire breaks or presses it and the panel alarms at once on its zone (zone 2 here). Fitted by the exits about 1.4 m high. Tap it.'), focus: 'mcp', s: { mcp: 1 } },
      { title: L('التركيب والتوصيل', 'Installation and wiring'), text: L('كل زون سلكين بكابل مقاوم للحريق، والكواشف متوصلة عليه توازي، وفي آخره مقاومة نهاية الخط EOL. كاشف الدخان بيغطي حوالي 100 متر مربع، وكاشف الحرارة حوالي 50، وبيبعد 50 سم على الأقل عن الحيطة. واللوحة ليها بطارية احتياطي 24 فولت.', 'Each zone is a two-core fire-resistant cable with detectors in parallel and an EOL resistor at the end. A smoke detector covers about 100 m², a heat detector about 50, each at least 50 cm from walls. The panel has a 24 V backup battery.'), focus: 'panel', s: { x: 1 } },
      { title: L('اكتشاف الأعطال', 'Troubleshooting'), text: L('لمبة FAULT الصفرا منوّرة وزون 1 عطلان: فيه قطع في السلك (العلامة الحمرا) أو مقاومة الـ EOL مفصولة. قيس مقاومة الزون بالأفوميتر من عند اللوحة. ولو فيه إنذارات كاذبة: نضّف الكاشف من التراب، وشوف لو فيه تلامس أو تسريب أرضي. دوس على مقاومة EOL تصلّح القطع.', 'The yellow FAULT LED is on and zone 1 is faulty: a broken cable (red mark) or a disconnected EOL resistor. Measure the zone resistance at the panel. For false alarms, clean dusty detectors and look for shorts or earth leakage. Tap the EOL resistor to repair the break.'), focus: 'eol', s: { fault: 'open', x: 1 } },
      { title: L('الاختبار الدوري', 'Routine testing'), text: L('كل أسبوع اختبر نقطة إنذار، وكل 6 شهور اختبر كل كاشف ببخاخ الاختبار على العصاية، واتأكد إن اللوحة والسارينة اشتغلوا، وبعدين اعمل RESET. سجّل كل اختبار في دفتر النظام.', 'Test a call point every week and each detector every six months with test spray on a pole; confirm the panel and sounder respond, then RESET. Record every test in the system log.'), focus: 'det1', s: { test: 1 } }
    ],
    apply(s){ Object.assign(st, { smoke: 0, mcp: 0, fault: null, x: 0, test: 0 }, s); X.set(st.x); },
    update(dt){
      t += dt; sm = ease(sm, st.smoke ? 1 : 0, dt, 1.5);
      const z1 = (st.smoke && sm > .5) || st.test, z2 = st.mcp, fire = z1 || z2, fault = !!st.fault, blink = Math.floor(t * 3) % 2;
      const glow = (k, on) => setGlow(leds[k].m, on ? 1 : .05, ((leds[k].c >> 16) & 255) / 255, ((leds[k].c >> 8) & 255) / 255, (leds[k].c & 255) / 255);
      glow('pwr', 1); glow('fire', fire && blink); glow('fault', fault && blink); glow('z1', z1 || (fault && blink)); glow('z2', z2);
      lcd.setText(fault ? 'Z1 FAULT OPEN' : fire ? 'FIRE ZONE ' + (z1 ? '1' : '2') : 'SYSTEM NORMAL');
      setGlow(d1.led, z1 ? 1 : (Math.floor(t) % 4 === 0 ? .4 : 0), 1, .1, .1); setGlow(d2.led, Math.floor(t + 2) % 4 === 0 ? .4 : 0, 1, .1, .1); setGlow(hd.led, Math.floor(t + 1) % 4 === 0 ? .4 : 0, 1, .1, .1);
      strobe.material.opacity = fire && (t * 2 % 1) < .15 ? 1 : 0; setGlow(lensM, fire && (t * 2 % 1) < .15 ? 1 : 0, 1, 1, 1);
      glass.position.z = st.mcp ? .02 : .04; glass.material.color.setHex(st.mcp ? 0xf2b51e : 0xf4f5f7);
      brk.visible = fault && st.x; pole.visible = !!st.test;
      puffs.forEach(p => { const ph = (p.userData.ph + t * .12) % 1; const top = ph > .6; const r = p.userData.r; const a = r * Math.PI * 2;
        if(top) p.position.set(-.1 + Math.cos(a) * (ph - .6) * 3, 2.45, -.5 + Math.sin(a) * (ph - .6) * 2); else p.position.set(-.1 + Math.sin(ph * 9 + r * 6) * .1, .4 + ph / .6 * 2.05, -.2 - ph / .6 * .3);
        p.scale.setScalar(.25 + ph * .6); p.material.opacity = sm * .35 * (1 - Math.max(0, ph - .8) * 5); });
    }
  };
}

/* ---------- الترانزستورات: BJT وUJT وMOSFET ---------- */
function makeLegs(g, n, sp, len = .12){ const pts = []; for(let i = 0; i < n; i++){ const x = (i - (n - 1) / 2) * sp; g.add(at(cyl(.005, .005, len, M(0xc9ced6, { m: .9 }), 6), x, len / 2, 0)); pts.push(V(x, len * .45, .01)); } return pts; }
function buildTransistors(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const bb = makeBreadboard(2.6, 1.3); bb.position.set(-.55, 0, -.05); root.add(bb);
  const S = 3.2;
  const bjt = new THREE.Group(); bjt.position.set(-1.35, .08, -.3); bjt.scale.setScalar(S); root.add(bjt);
  const bl = makeLegs(bjt, 3, .025); const tb = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .1, 20, 1, false, 0, Math.PI), M(0x1d2128)); tb.rotation.y = -Math.PI / 2; bjt.add(at(tb, 0, .17, 0)); bjt.add(at(box(.1, .1, .004, M(0x1d2128)), 0, .17, 0));
  ['E', 'B', 'C'].forEach((k, i) => bjt.add(at(label(k, '#ffd34d', .03), bl[i].x, .26, .02))); bjt.add(at(label('BC547', '#ffffff', .022), 0, .17, .055));
  const ujt = new THREE.Group(); ujt.position.set(-.55, .08, -.3); ujt.scale.setScalar(S); root.add(ujt);
  const ul = makeLegs(ujt, 3, .025); ujt.add(at(cyl(.045, .048, .06, M(0xc9ced6, { m: .85, r: .3 }), 20), 0, .15, 0)); ujt.add(at(box(.012, .01, .02, M(0xc9ced6, { m: .85 })), .045, .125, .03));
  ['B1', 'E', 'B2'].forEach((k, i) => ujt.add(at(label(k, '#ffd34d', .028), ul[i].x, .23, .02))); ujt.add(at(label('2N2646', '#ffffff', .022), 0, .3, 0));
  const mos = new THREE.Group(); mos.position.set(.25, .08, -.3); mos.scale.setScalar(S); root.add(mos);
  const ml = makeLegs(mos, 3, .025, .1); mos.add(at(box(.1, .09, .03, M(0x1d2128)), 0, .145, 0)); mos.add(at(box(.1, .07, .008, M(0xc9ced6, { m: .85 })), 0, .22, -.012));
  mos.add(at(new THREE.Mesh(new THREE.CircleGeometry(.012, 12), M(0x1d2128)), 0, .225, -.007));
  ['G', 'D', 'S'].forEach((k, i) => mos.add(at(label(k, '#ffd34d', .028), ml[i].x, .055, .03))); mos.add(at(label('IRFZ44N', '#ffffff', .02), 0, .15, .02));
  const uLed = makeLED(0xffb03a); uLed.group.scale.setScalar(1.6); uLed.group.position.set(-.55, .08, .35); root.add(uLed.group);
  const mLed = makeLED(0x2fbf5a); mLed.group.scale.setScalar(1.6); mLed.group.position.set(.25, .08, .35); root.add(mLed.group);
  const uCap = cyl(.06, .06, .16, M(0x2a3f8a), 16); uCap.position.set(-.85, .16, .35); root.add(uCap);
  const mtr = makeBigMeter(); at(mtr.group, 1.25, 0, .3); mtr.group.rotation.y = -.35; root.add(mtr.group);
  const J = k => termOf(mtr.group, mtr.jacks[k]); const probes = makeProbes2(root, J('v'), J('com'));
  const pin = (g, legs, i) => termOf(g, legs[i]);
  part('bjt', bjt, V(0, .32, 0), L('ترانزستور BJT', 'BJT transistor'), L('NPN: الباعث E والقاعدة B والمجمّع C.', 'NPN: emitter E, base B, collector C.'));
  part('ujt', ujt, V(0, .36, 0), L('ترانزستور أحادي الوصلة UJT', 'UJT'), L('بيعمل مذبذب بسيط بمكثف ومقاومة.', 'Makes a simple oscillator with a capacitor and resistor.'));
  part('mos', mos, V(0, .32, 0), 'MOSFET', L('بيتحكم فيه بالجهد على البوابة G.', 'Controlled by the voltage on its gate G.'));
  part('meter', mtr.group, V(0, .35, -.2), L('الأفوميتر على وضع الدايود', 'Meter on diode test'), L('بيقيس جهد الوصلة بالفولت.', 'Reads the junction voltage in volts.'));
  const st = { mode: 'off', txt: '', a: null, b: null, osc: 0, gate: 0 }; let t = 0;
  return {
    ...ctx, view: V(.05, 1.05, 1.45), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('أنواع الترانزستور', 'Transistor types'), text: L('على البوردة 3 أنواع: BJT العادي (3 رجول E وB وC)، والـ UJT أحادي الوصلة (B1 وE وB2)، والـ MOSFET (G وD وS). كل نوع ليه طريقة اختبار بالأفوميتر.', 'Three types on the board: the ordinary BJT (E, B, C), the unijunction UJT (B1, E, B2) and the MOSFET (G, D, S). Each has its own meter test.'), s: {} },
      { title: L('اختبار BJT: قاعدة ← باعث', 'BJT test: base → emitter'), text: L('الأفوميتر على وضع الدايود. الأحمر على القاعدة B والأسود على الباعث E: القراءة حوالي 0.65 فولت. كده الوصلة سليمة، ولو الأحمر هو اللي على B يبقى الترانزستور NPN.', 'Meter on diode test. Red on base B, black on emitter E: about 0.65 V, so the junction is good. Red on the base means an NPN transistor.'), focus: 'bjt', s: { mode: 'cont', txt: '0.652', a: ['bjt', 1], b: ['bjt', 0] } },
      { title: L('اختبار BJT: قاعدة ← مجمّع', 'BJT test: base → collector'), text: L('الأحمر على B والأسود على C: قراءة قريبة (0.64 فولت). ولو عكست الأطراف في الحالتين تقرا OL. أي وصلة بتقرا صفر في الاتجاهين يبقى فيها قصر.', 'Red on B, black on C: a similar reading (0.64 V). Reversed, both read OL. A junction reading zero both ways is shorted.'), focus: 'bjt', s: { mode: 'cont', txt: '0.641', a: ['bjt', 1], b: ['bjt', 2] } },
      { title: L('اختبار BJT: مجمّع ← باعث', 'BJT test: collector → emitter'), text: L('بين C وE لازم تقرا OL في الاتجاهين. لو قرا رقم يبقى الترانزستور فيه تسريب أو قصر ويتغيّر.', 'Between C and E it must read OL both ways. Any reading means leakage or a short: replace it.'), focus: 'bjt', s: { mode: 'cont', txt: 'OL', a: ['bjt', 2], b: ['bjt', 0] } },
      { title: L('الترانزستور أحادي الوصلة UJT', 'The unijunction transistor'), text: L('بين B1 وB2 مقاومة ثابتة حوالي 5 لـ 10 كيلو أوم في الاتجاهين. في الدايرة: المكثف بيشحن لحد جهد معين فالـ UJT يوصّل ويفضّيه في الليد، وتتكرر. ده مذبذب بيستخدم في إشعال الثيرستور.', 'Between B1 and B2 there is a fixed 5–10 kΩ either way. In circuit the capacitor charges to a threshold, the UJT fires and dumps it into the LED, and it repeats: an oscillator used to trigger thyristors.'), focus: 'ujt', s: { mode: 'ohm', txt: '6.8 kΩ', a: ['ujt', 0], b: ['ujt', 2], osc: 1 } },
      { title: L('اختبار MOSFET', 'Testing a MOSFET'), text: L('على وضع الدايود: الأحمر على S والأسود على D بيقرا الدايود الداخلي (حوالي 0.5 فولت). بعدين المس البوابة G بالطرف الأحمر لثانية تشحنها، فالـ MOSFET يفتح والقراءة بين D وS تبقى قريبة من الصفر والليد ينوّر. الـ JFET بنفس الفكرة بس بيقفل بجهد سالب على البوابة.', 'On diode test, red on S and black on D reads the internal diode (about 0.5 V). Touch the gate G with red for a second to charge it: the MOSFET turns on, D–S reads near zero and the LED lights. A JFET is similar but is turned off by a negative gate voltage.'), focus: 'mos', s: { mode: 'cont', txt: '0.03', a: ['mos', 2], b: ['mos', 1], gate: 1 } }
    ],
    apply(s){ Object.assign(st, { mode: 'off', txt: '', a: null, b: null, osc: 0, gate: 0 }, s); mtr.setMode(st.mode); mtr.setText(st.txt);
      const P = { bjt: [bjt, bl], ujt: [ujt, ul], mos: [mos, ml] }; const w = r => r ? pin(P[r[0]][0], P[r[0]][1], r[1]) : null; probes.set(w(st.a), w(st.b)); },
    update(dt){ t += dt; mtr.update(dt); probes.update(dt); uLed.set(st.osc && (t % 1) < .15 ? 1 : 0); uLed.update(dt); mLed.set(st.gate ? 1 : 0); mLed.update(dt); }
  };
}

/* ---------- المفاتيح والفيوز والسماعة والكرستالة ومبين الأرقام ---------- */
function make7Seg(){
  const c = makeCanvas(.32, .46, 256); const g = new THREE.Group(); g.add(box(.36, .5, .04, M(0x15181d))); g.add(at(c.mesh, 0, 0, .021));
  const SEG = { a: [40, 20, 140, 22], b: [168, 40, 22, 140], c: [168, 200, 22, 140], d: [40, 340, 140, 22], e: [18, 200, 22, 140], f: [18, 40, 22, 140], g: [40, 180, 140, 22] };
  const DIG = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
  return { group: g, show(segs){ c.draw((x, W, H) => { x.fillStyle = '#1a0606'; x.fillRect(0, 0, W, H); const sc = W / 208; for(const [k, [a, b, w, h]] of Object.entries(SEG)){ x.fillStyle = segs.includes(k) ? '#ff3b2f' : '#3a1212'; x.fillRect(a * sc, b * sc, w * sc, h * sc); } }); }, DIG };
}
function buildParts2(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const bb = makeBreadboard(2.7, 1.3); bb.position.set(-.5, 0, -.05); root.add(bb);
  // مفتاح ذراع
  const sw = new THREE.Group(); sw.position.set(-1.5, .08, .3); sw.scale.setScalar(2.4); root.add(sw);
  const swl = makeLegs(sw, 3, .03, .08); sw.add(at(box(.1, .06, .05, M(0x2a62c9)), 0, .11, 0)); sw.add(at(cyl(.012, .012, .02, M(0xc9ced6, { m: .9 }), 10), 0, .15, 0));
  const lever = new THREE.Group(); lever.position.set(0, .15, 0); sw.add(lever); lever.add(at(cyl(.007, .007, .07, M(0xc9ced6, { m: .9 }), 8), 0, .035, 0));
  // الفيوز
  const fu = new THREE.Group(); fu.position.set(-1.0, .08, .3); fu.scale.setScalar(2.2); root.add(fu);
  fu.add(at(box(.18, .02, .05, M(0x1d2128)), 0, .01, 0)); const fg = M(0xdfe9f2, { opacity: .5 }); const ft = cyl(.018, .018, .12, fg, 14); ft.rotation.z = Math.PI / 2; fu.add(at(ft, 0, .045, 0));
  const fcap = []; [-.065, .065].forEach(xx => { const e = cyl(.02, .02, .025, M(0xc9ced6, { m: .9 }), 14); e.rotation.z = Math.PI / 2; fu.add(at(e, xx, .045, 0)); fcap.push(V(xx, .065, 0)); });
  const fw = box(.1, .003, .003, M(0xc9ced6, { m: .9 })); fu.add(at(fw, 0, .045, 0)); fu.add(at(label('2A', '#ffffff', .02), 0, .085, 0));
  // السماعة
  const sp = new THREE.Group(); sp.position.set(.15, .08, .25); sp.rotation.x = -.5; root.add(sp);
  sp.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.24, .26, .03, 32, 1, true), M(0x8a9099, { m: .6, side: THREE.DoubleSide })), 0, .2, 0));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.23, .12, 32, 1, true), M(0x2b3038, { r: .8, side: THREE.DoubleSide })); cone.rotation.x = Math.PI; const coneG = new THREE.Group(); coneG.add(at(cone, 0, .16, 0)); sp.add(coneG);
  coneG.add(at(new THREE.Mesh(new THREE.SphereGeometry(.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x1d2128)), 0, .14, 0));
  sp.add(at(cyl(.1, .1, .06, M(0x3a3f46, { m: .6 }), 24), 0, .05, 0));
  const spT = [V(-.2, .1, .12), V(.2, .1, .12)]; spT.forEach(p => sp.add(at(box(.03, .02, .02, M(0xd9a441, { m: .8 })), p.x, p.y, p.z))); sp.add(at(label('8Ω 5W', '#ffffff', .05), 0, .03, .18));
  // الكرستالة
  const xt = new THREE.Group(); xt.position.set(-.45, .08, .3); xt.scale.setScalar(2.4); root.add(xt);
  const xl = makeLegs(xt, 2, .05, .06); const xb = box(.11, .1, .04, M(0xc9ced6, { m: .85, r: .25 })); xt.add(at(xb, 0, .11, 0)); xt.add(at(label('16.000', '#1b1f26', .02), 0, .11, .025));
  const xs = makeScreen(.55, .32); xs.mesh.position.set(-.8, .42, -.45); xs.mesh.rotation.x = -.35; root.add(xs.mesh);
  // مبين 7 مقاطع
  const seg = make7Seg(); seg.group.position.set(.05, .32, -.45); seg.group.rotation.x = -.35; root.add(seg.group);
  const mtr = makeBigMeter(); at(mtr.group, 1.25, 0, .3); mtr.group.rotation.y = -.35; root.add(mtr.group);
  const J = k => termOf(mtr.group, mtr.jacks[k]); const probes = makeProbes2(root, J('v'), J('com'));
  part('sw', sw, V(0, .24, 0), L('المفتاح', 'Switch'), L('دوس عليه تقلبه.', 'Tap to flip it.'));
  part('fuse', fu, V(0, .12, 0), L('الفيوز', 'Fuse'), L('دوس عليه تحرقه أو تغيّره.', 'Tap to blow or replace it.'));
  part('spk', sp, V(0, .35, 0), L('السماعة', 'Speaker'), L('ملف ومغناطيس بيحرّكوا الكون.', 'A coil and magnet move the cone.'));
  part('xtal', xt, V(0, .22, 0), L('الكرستالة', 'Crystal'), L('بتثبّت تردد المذبذب بدقة.', 'Fixes an oscillator frequency precisely.'));
  part('seg', seg.group, V(0, .32, 0), L('مبين 7 مقاطع', '7-segment display'), L('7 ليدات على شكل رقم 8.', 'Seven LEDs shaped as an 8.'));
  const st = { mode: 'off', txt: '', a: null, b: null, sw: 1, blown: 0, tone: 0, osc: 0, seg: 'digits' }; let t = 0;
  const setP = () => { const P = { sw: () => termOf(sw, swl[st.sw ? 1 : 1]), sw0: () => termOf(sw, swl[0]), sw2: () => termOf(sw, swl[2]), f0: () => termOf(fu, fcap[0]), f1: () => termOf(fu, fcap[1]), s0: () => termOf(sp, spT[0]), s1: () => termOf(sp, spT[1]), x0: () => termOf(xt, xl[0]), x1: () => termOf(xt, xl[1]), g0: () => termOf(seg.group, V(-.1, -.25, .03)), g1: () => termOf(seg.group, V(.1, -.25, .03)) }; probes.set(st.a ? P[st.a]() : null, st.b ? P[st.b]() : null); };
  const reading = () => { if(st.a === 'sw') return st.sw ? '000.2' : 'OL'; if(st.a === 'f0') return st.blown ? 'OL' : '000.1'; return st.txt; };
  ctx.parts.sw.tap = () => { st.sw ^= 1; mtr.setText(reading()); return st.sw ? L('المفتاح مقفول: الأفوميتر بيصفّر (توصيل).', 'Closed: the meter beeps (continuity).') : L('المفتاح مفتوح: OL.', 'Open: OL.'); };
  ctx.parts.fuse.tap = () => { st.blown ^= 1; mtr.setText(reading()); return st.blown ? L('الفيوز اتحرق: السلك جواه اتقطع والقراءة OL.', 'The fuse blew: its wire broke and it reads OL.') : L('فيوز جديد بنفس القيمة: القراءة قريبة من الصفر.', 'A new fuse of the same rating reads near zero.'); };
  return {
    ...ctx, view: V(.05, 1.05, 1.45), sway: true, hint: L('دوس على المفتاح أو الفيوز · صباعين للتقريب', 'Tap the switch or fuse · pinch to zoom'),
    steps: [
      { title: L('مكونات متنوعة', 'More components'), text: L('مفتاح، وفيوز، وسماعة، وكرستالة، ومبين أرقام 7 مقاطع. كلهم بيتختبروا بالأفوميتر أو بدايرة بسيطة.', 'A switch, fuse, speaker, crystal and 7-segment display, all tested with a meter or a simple circuit.'), s: { seg: 'digits' } },
      { title: L('المفاتيح', 'Switches'), text: L('الأفوميتر على وضع التوصيل (الصفارة). المفتاح المقفول بيقرا صفر ويصفّر، والمفتوح OL. اختبر كل وضع وكل طرف. دوس على المفتاح تقلبه.', 'Meter on continuity. A closed switch reads zero and beeps; open reads OL. Test every position and terminal. Tap the switch to flip it.'), focus: 'sw', s: { mode: 'cont', a: 'sw0', b: 'sw', sw: 1 } },
      { title: L('الفيوز', 'The fuse'), text: L('الفيوز السليم قراءته قريبة من الصفر، والمحروق OL، وغالبًا تشوف السلك جواه مقطوع أو الزجاج اسود. غيّره بنفس القيمة بالأمبير ونفس النوع (سريع أو بطيء). دوس عليه.', 'A good fuse reads near zero, a blown one OL, and you often see the wire broken or the glass blackened. Replace with the same amp rating and type (fast or slow). Tap it.'), focus: 'fuse', s: { mode: 'cont', a: 'f0', b: 'f1' } },
      { title: L('السماعة', 'The speaker'), text: L('على وضع الأوم بتقرا قريب من قيمتها (8 أوم بتقرا 7 لـ 8). وأنت بتلمس الطرفين بتسمع طقطقة والكون بيتحرك. لو OL يبقى الملف مقطوع.', 'On ohms it reads near its rating (an 8 Ω speaker reads 7–8). Touching the leads gives a click and the cone moves. OL means an open coil.'), focus: 'spk', s: { mode: 'ohm', txt: '7.6 Ω', a: 's0', b: 's1', tone: 1 } },
      { title: L('الكرستالة', 'The crystal'), text: L('الكرستالة بتقرا OL بالأفوميتر حتى لو سليمة، فبتتختبر وهي شغالة: راسم الذبذبات على رجلها بيوري موجة بترددها المكتوب (16 ميجاهرتز). لو مفيش موجة والدايرة متغذية، غيّرها.', 'A crystal reads OL on a meter even when good, so test it working: a scope on its pin shows a wave at its marked frequency (16 MHz). No wave with power applied: replace it.'), focus: 'xtal', s: { mode: 'ohm', txt: 'OL', a: 'x0', b: 'x1', osc: 1 } },
      { title: L('مبين الأرقام 7 مقاطع', '7-segment display'), text: L('7 ليدات (a لـ g) على شكل 8. في النوع الكاثود المشترك، الأسود على الرجل المشتركة والأحمر على رجل أي مقطع (وضع الدايود) فالمقطع ينوّر. لو مقطع ما نوّرش يبقى تالف.', 'Seven LEDs (a–g) shaped as an 8. On a common-cathode type, black on the common pin and red on any segment pin (diode test) lights that segment. One that stays dark is faulty.'), focus: 'seg', s: { mode: 'cont', txt: '1.85', a: 'g0', b: 'g1', seg: 'a' } }
    ],
    apply(s){ Object.assign(st, { mode: 'off', txt: '', a: null, b: null, sw: 1, blown: 0, tone: 0, osc: 0, seg: 'digits' }, s); mtr.setMode(st.mode); mtr.setText(reading()); setP(); },
    update(dt){ t += dt; mtr.update(dt); probes.update(dt); lever.rotation.z = ease(lever.rotation.z, st.sw ? -.45 : .45, dt, 10); fw.visible = !st.blown; fg.color.setHex(st.blown ? 0x5a4a3a : 0xdfe9f2);
      coneG.position.y = st.tone ? Math.sin(t * 40) * .006 : 0;
      xs.draw((x, W, H) => { if(!st.osc) return; x.strokeStyle = '#7dffb0'; x.lineWidth = 3; x.beginPath(); for(let i = 0; i <= W; i += 2){ const y = H / 2 - Math.sin((i / W * 8 + t * 2) * Math.PI * 2) * H * .3; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); x.fillStyle = '#cfe7ff'; x.font = 'bold 28px monospace'; x.fillText('16.000 MHz', 12, 34); });
      seg.show(st.seg === 'digits' ? seg.DIG[Math.floor(t) % 10] : st.seg); }
  };
}

/* ---------- المحول والكونتاكتور والقواطع ---------- */
function buildTrafoContactor(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const tf = new THREE.Group(); tf.position.set(-1.3, 0, -.35); root.add(tf);
  for(let i = 0; i < 10; i++) tf.add(at(box(.6, .5, .025, M(i % 2 ? 0x5d646e : 0x6c747d, { m: .5 })), 0, .25, -.12 + i * .026));
  [-.12, .12].forEach((x, i) => { const c = cyl(.11, .11, .32, M(i ? 0xb5542a : 0xd98c5f, { m: .6 }), 20); c.rotation.x = Math.PI / 2; tf.add(at(c, x, .25, 0)); });
  const tb = new THREE.Group(); tb.position.set(0, .03, .3); tf.add(tb); tb.add(at(box(.7, .06, .12, M(0x1d2128)), 0, .03, 0));
  const tT = [-.28, -.18, .08, .18, .28].map(x => { tb.add(at(cyl(.02, .02, .03, M(0xd9a441, { m: .8 }), 10), x, .075, 0)); return V(x, .09, 0); });
  [['220V', -.23], ['12-0-12V', .18]].forEach(([s, x]) => tb.add(at(label(s, '#ffffff', .055), x, .15, .02)));
  const K = makeContactor('K1'); K.group.scale.setScalar(1.4); K.group.position.set(-.25, .3, -.4); root.add(K.group);
  K.group.add(at(label('A1', '#ffd34d', .05), -.13, .24, .14)); K.group.add(at(label('A2', '#ffd34d', .05), .13, -.24, .14));
  const ol = new THREE.Group(); ol.position.set(-.25, .1, .05); root.add(ol); ol.add(at(box(.42, .2, .3, M(0xc9ced6, { r: .5 })), 0, .1, 0));
  const dial = cyl(.04, .04, .02, M(0x2a62c9), 16); ol.add(at(dial, -.08, .21, .05)); const rb = cyl(.025, .025, .03, M(0x2a62c9), 12); ol.add(at(rb, .1, .21, .05)); ol.add(at(label('95-96 NC', '#1b1f26', .045), 0, .13, .16));
  const olT = [V(-.12, .2, .12), V(.12, .2, .12)];
  const mcb = makeBreaker(.2, 'C16'); mcb.group.position.set(.4, .25, -.3); root.add(mcb.group);
  const mtr = makeBigMeter(); at(mtr.group, 1.3, 0, .3); mtr.group.rotation.y = -.35; root.add(mtr.group);
  const J = k => termOf(mtr.group, mtr.jacks[k]); const probes = makeProbes2(root, J('v'), J('com'));
  part('tf', tf, V(0, .6, 0), L('المحول', 'Transformer'), L('ابتدائي 220 فولت، وثانوي 12-0-12 فولت.', 'Primary 220 V, secondary 12-0-12 V.'));
  part('k', K.group, V(0, .4, 0), L('الكونتاكتور', 'Contactor'), L('دوس عليه تغذّي الملف.', 'Tap to energise its coil.'));
  part('ol', ol, V(0, .3, 0), L('الأوفرلود الحراري', 'Thermal overload'), L('دوس عليه يفصل (Trip).', 'Tap to trip it.'));
  part('mcb', mcb.group, V(0, .4, .1), L('القاطع', 'Circuit breaker'), L('دوس عليه تفتحه أو تقفله.', 'Tap to switch it.'));
  const st = { mode: 'off', txt: '', a: null, b: null, k: 0, trip: 0, mcb: 1, probe: null };
  const P = { p0: () => termOf(tb, tT[0]), p1: () => termOf(tb, tT[1]), s0: () => termOf(tb, tT[2]), s2: () => termOf(tb, tT[4]), core: () => termOf(tf, V(.3, .45, -.1)), a1: () => termOf(K.group, V(-.09, .19, .1)), a2: () => termOf(K.group, V(.09, -.19, .1)), l1: () => termOf(K.group, V(0, .19, .1)), t1: () => termOf(K.group, V(0, -.19, .1)), o0: () => termOf(ol, olT[0]), o1: () => termOf(ol, olT[1]), m0: () => termOf(mcb.group, V(0, .25, .1)), m1: () => termOf(mcb.group, V(0, -.25, .1)) };
  const reading = () => st.probe === 'k' ? (st.k ? '000.1' : 'OL') : st.probe === 'ol' ? (st.trip ? 'OL' : '000.1') : st.probe === 'mcb' ? (st.mcb ? '000.1' : 'OL') : st.txt;
  const setP = () => probes.set(st.a ? P[st.a]() : null, st.b ? P[st.b]() : null);
  ctx.parts.k.tap = () => { st.k ^= 1; mtr.setText(reading()); return st.k ? L('الملف اتغذى: التلامسات قفلت.', 'Coil energised: the contacts close.') : L('الملف فصل: التلامسات فتحت.', 'Coil off: the contacts open.'); };
  ctx.parts.ol.tap = () => { st.trip ^= 1; mtr.setText(reading()); return st.trip ? L('الأوفرلود فصل: 95-96 فتحت وفصلت الكونتاكتور.', 'Tripped: 95-96 opens and drops the contactor.') : L('دوسنا RESET: رجع يوصّل.', 'Pressed RESET: it closes again.'); };
  ctx.parts.mcb.tap = () => { st.mcb ^= 1; mcb.set(st.mcb); mtr.setText(reading()); return st.mcb ? L('القاطع مقفول.', 'Breaker on.') : L('القاطع مفتوح.', 'Breaker off.'); };
  return {
    ...ctx, view: V(.05, 1.0, 1.45), sway: true, hint: L('دوس على الكونتاكتور أو القاطع أو الأوفرلود', 'Tap the contactor, breaker or overload'),
    steps: [
      { title: L('المحول والكونتاكتور والقواطع', 'Transformer, contactor and breakers'), text: L('مكونات القدرة اللي بتقابلها في أي جهاز أو لوحة: المحول بينزّل الجهد، والكونتاكتور بيوصّل ويفصل الأحمال، والقاطع والأوفرلود بيحموا الدايرة.', 'Power parts found in any device or panel: the transformer lowers voltage, the contactor switches loads, and the breaker and overload protect the circuit.'), s: {} },
      { title: L('المحول: الابتدائي', 'Transformer: primary'), text: L('على وضع الأوم: طرفي الابتدائي (220 فولت) مقاومتهم أعلى لأن سلكه رفيع ولفاته كتير (هنا 45 أوم). لو OL يبقى الملف مقطوع.', 'On ohms the 220 V primary reads higher because its wire is thin with many turns (45 Ω here). OL means an open winding.'), focus: 'tf', s: { mode: 'ohm', txt: '45.2 Ω', a: 'p0', b: 'p1' } },
      { title: L('المحول: الثانوي والعزل', 'Secondary and insulation'), text: L('الثانوي سلكه تخين ومقاومته صغيرة (حوالي 1 أوم). وبين الابتدائي والثانوي، وبين أي ملف والقلب الحديد لازم OL، وإلا يبقى فيه تسريب خطر. ولما يتغذى، قيس الخرج على V~: 12 فولت من كل طرف للنص.', 'The thick secondary reads about 1 Ω. Between primary and secondary, and from any winding to the core, it must read OL or there is dangerous leakage. Powered, measure V~: 12 V from each end to the centre tap.'), focus: 'tf', s: { mode: 'ohm', txt: '1.2 Ω', a: 's0', b: 's2' } },
      { title: L('الكونتاكتور', 'The contactor'), text: L('ملفه بين A1 وA2 بيقرا مئات الأوم. التلامسات الرئيسية (L1-T1) مفتوحة OL، ولما الملف يتغذى بتقفل وتقرا صفر. دوس على الكونتاكتور تشوف القراءة بتتغير.', 'Its coil between A1 and A2 reads hundreds of ohms. The main contacts (L1–T1) read OL until the coil is energised, then zero. Tap the contactor to see the reading change.'), focus: 'k', s: { mode: 'cont', a: 'l1', b: 't1', probe: 'k' } },
      { title: L('القاطع (MCB)', 'The circuit breaker'), text: L('مقفول بيقرا صفر، ومفتوح OL. الرقم C16 معناه 16 أمبير ونوع C (للأحمال اللي فيها موتورات). بيفصل على زيادة الحمل والقصر.', 'Closed reads zero, open OL. C16 means 16 A, type C (for loads with motors). It trips on overload and short circuit.'), focus: 'mcb', s: { mode: 'cont', a: 'm0', b: 'm1', probe: 'mcb' } },
      { title: L('الأوفرلود الحراري', 'The thermal overload'), text: L('بيتركب تحت الكونتاكتور ويحمي المحرك. فيه شريحة مزدوجة المعدن بتسخن مع زيادة التيار وتفتح التلامس 95-96. اضبط التدريجة على تيار المحرك، وبعد ما يفصل دوس RESET. دوس عليه تفصله.', 'Fitted under the contactor to protect the motor. A bimetal strip heats with excess current and opens contact 95-96. Set the dial to the motor current and press RESET after a trip. Tap it to trip it.'), focus: 'ol', s: { mode: 'cont', a: 'o0', b: 'o1', probe: 'ol' } }
    ],
    apply(s){ Object.assign(st, { mode: 'off', txt: '', a: null, b: null, k: 0, trip: 0, mcb: 1, probe: null }, s); mcb.set(1); mtr.setMode(st.mode); mtr.setText(reading()); setP(); },
    update(dt){ mtr.update(dt); probes.update(dt); K.set(st.k && !st.trip); K.update(dt); mcb.update(dt); rb.position.y = st.trip ? .23 : .21; }
  };
}

/* ================= برنامج الأجهزة المنزلية ================= */
function flameSprites(parent, n = 8){
  const arr = []; for(let i = 0; i < n; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: i % 2 ? 0xff7a1a : 0xffc23a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.userData = { ph: i / n, r: Math.random(), noFit: true }; parent.add(s); arr.push(s); }
  return { set(v){ arr.forEach(s => s.userData.on = v); }, update(dt, t){ arr.forEach(s => { const u = s.userData; const ph = (u.ph + t * .9) % 1; s.position.set(Math.sin(u.r * 9 + t * 3) * .08, ph * .45, Math.cos(u.r * 7) * .06); s.scale.setScalar((.35 - ph * .25) * (u.on ? 1 : 0)); s.material.opacity = u.on ? (1 - ph) * .9 : 0; }); } };
}
function makeWallSocket(){
  const g = new THREE.Group(); g.add(box(.26, .26, .03, M(0xf4f5f7, { r: .4 })));
  [-.05, .05].forEach(x => g.add(at(cyl(.014, .014, .01, M(0x22262c), 10), x, 0, .016)).children.at(-1).rotation.x = Math.PI / 2);
  return g;
}
function makePlugCord(from, to){
  const plug = new THREE.Group(); plug.add(box(.12, .16, .1, M(0x23272e, { r: .5 })));
  [-.05, .05].forEach(x => { const p = cyl(.01, .01, .08, M(0xc9ced6, { m: .9 }), 8); p.rotation.x = Math.PI / 2; plug.add(at(p, x, 0, -.08)); });
  return plug;
}

/* ---------- السلامة والصحة المهنية ---------- */
function buildSafety(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  // الجهاز (جسم معدن)
  const app = new THREE.Group(); app.position.set(-.2, 0, -.35); root.add(app);
  const bodyM = M(0xc9ced6, { m: .6, r: .35 }); app.add(at(box(.8, .7, .6, bodyM), 0, .35, 0));
  app.add(at(cyl(.2, .2, .02, M(0x3a3f46), 24), 0, .45, .301)).children.at(-1).rotation.x = Math.PI / 2;
  app.add(at(label(L('جهاز بجسم معدن', 'Metal-bodied appliance'), '#1b1f26', .06), 0, .12, .31));
  const leak = label('⚡', '#ffd34d', .2); leak.position.set(.3, .75, .1); app.add(leak);
  const fire = flameSprites(app, 10); fire.set(0);
  // البريزة والقاطع على الحيطة
  const sock = makeWallSocket(); sock.position.set(.75, .55, -1.5); root.add(sock);
  const plug = makePlugCord(); root.add(plug);
  const cord = tube(CR([V(.2, .3, -.3), V(.5, .1, -.6), V(.75, .2, -1.2), V(.75, .45, -1.4)]), .015, M(0x23272e), 40); root.add(cord);
  const rcd = new THREE.Group(); rcd.position.set(1.5, 1.0, -1.48); root.add(rcd);
  rcd.add(box(.32, .5, .14, M(0xf3f4f6, { r: .45 }))); rcd.add(at(label('RCD 30mA', '#1b1f26', .05), 0, -.17, .08));
  const lever = new THREE.Group(); lever.position.set(0, .05, .07); rcd.add(lever); lever.add(at(box(.08, .14, .05, M(0x2a62c9)), 0, .07, 0));
  const tbtn = cyl(.025, .025, .03, M(0xe0b23a), 12); tbtn.rotation.x = Math.PI / 2; rcd.add(at(tbtn, .1, .17, .08)); rcd.add(at(label('T', '#1b1f26', .04), .1, .22, .08));
  const earth = tube(CR([V(.15, .2, -.66), V(.4, .05, -.9), V(1.2, .05, -1.3), V(1.5, .6, -1.5)]), .012, M(0x7cc242), 40); root.add(earth);
  // معدات الوقاية
  const ppe = new THREE.Group(); ppe.position.set(-1.35, 0, .35); root.add(ppe);
  [-.12, .12].forEach(x => { ppe.add(at(box(.16, .05, .3, M(0xe8c21a, { r: .7 })), x, .025, 0)); ppe.add(at(box(.18, .05, .12, M(0xe8c21a, { r: .7 })), x, .025, .2)); });
  const gog = new THREE.Group(); gog.position.set(.45, .06, 0); ppe.add(gog); [-.07, .07].forEach(x => { const r = new THREE.Mesh(new THREE.TorusGeometry(.06, .015, 8, 20), M(0x1d2128)); r.rotation.x = -Math.PI / 2; gog.add(at(r, x, 0, 0)); gog.add(at(new THREE.Mesh(new THREE.CircleGeometry(.055, 20), M(0xbfe3ff, { opacity: .5 })), x, .005, 0)).children.at(-1).rotation.x = -Math.PI / 2; });
  [0, .1].forEach((z, i) => { const sd = new THREE.Group(); sd.position.set(.2 + i * .1, .03, .3 + z); sd.rotation.y = .3; ppe.add(sd); const h = cyl(.025, .025, .14, M(i ? 0xd23a2e : 0xe8c21a), 10); h.rotation.z = Math.PI / 2; sd.add(at(h, 0, 0, 0)); const sh = cyl(.008, .008, .16, M(0xc9ced6, { m: .9 }), 8); sh.rotation.z = Math.PI / 2; sd.add(at(sh, .15, 0, 0)); });
  ppe.add(at(label(L('جوانتي وعدد معزولة 1000V', 'Gloves and 1000 V insulated tools'), '#ffffff', .06), .2, .25, .1));
  // الطفاية
  const ext = new THREE.Group(); ext.position.set(1.65, 0, .3); root.add(ext);
  ext.add(at(cyl(.12, .12, .62, M(0xc0392b, { r: .4 }), 20), 0, .31, 0)); ext.add(at(cyl(.04, .05, .08, M(0x1d2128), 12), 0, .66, 0));
  ext.add(at(tube(CR([V(.03, .66, 0), V(.12, .6, .05), V(.18, .35, .1), V(.2, .2, .14)]), .015, M(0x1d2128), 20), 0, 0, 0)); ext.add(at(cyl(.035, .05, .14, M(0x1d2128), 12), .21, .14, .15));
  ext.add(at(box(.16, .2, .01, M(0xf4f5f7)), 0, .35, .121)); ext.add(at(label('CO₂', '#c0392b', .07), 0, .38, .13));
  const gas = []; for(let i = 0; i < 18; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xe9f2ff, transparent: true, opacity: 0, depthWrite: false })); s.userData = { ph: i / 18, noFit: true }; root.add(s); gas.push(s); }
  // عصاية خشب للإسعاف
  const stick = at(box(1.0, .04, .04, M(0x8a6a48, { r: .8 })), -.4, .02, .55); stick.rotation.y = .2; root.add(stick);
  // لافتات السلامة
  const signs = new THREE.Group(); root.add(signs);
  const SIGNS = [
    { k: 'warn', t: L('خطر كهرباء', 'Electrical hazard'), d: L('مثلث أصفر = تحذير: فيه خطر في المكان ده.', 'Yellow triangle = warning: a hazard is present.') },
    { k: 'no', t: L('ممنوع الشغل والكهربا موصّلة', 'Do not work live'), d: L('دايرة حمرا بشرطة = ممنوع.', 'Red circle with a bar = prohibited.') },
    { k: 'glove', t: L('البس الجوانتي', 'Wear gloves'), d: L('دايرة زرقا = إلزامي: لازم تعمله.', 'Blue circle = mandatory: you must do it.') },
    { k: 'goggle', t: L('البس النضارة', 'Wear eye protection'), d: L('دايرة زرقا = إلزامي: لازم تعمله.', 'Blue circle = mandatory: you must do it.') },
    { k: 'fire', t: L('طفاية حريق', 'Fire extinguisher'), d: L('مربع أحمر = معدات مكافحة الحريق.', 'Red square = firefighting equipment.') },
    { k: 'aid', t: L('إسعاف 123', 'First aid 123'), d: L('مربع أخضر = أمان وإسعاف ومخارج طوارئ.', 'Green square = safety, first aid and emergency exits.') }
  ];
  const drawSign = (k, txt) => (x, W, H) => {
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); const cx = W / 2, cy = H * .4, r = W * .3;
    x.lineWidth = 14; x.lineJoin = 'round';
    const bolt = (s = 1, col = '#111') => { x.fillStyle = col; x.beginPath(); x.moveTo(cx + 8 * s, cy - 48 * s); x.lineTo(cx - 22 * s, cy + 6 * s); x.lineTo(cx - 2 * s, cy + 6 * s); x.lineTo(cx - 10 * s, cy + 48 * s); x.lineTo(cx + 22 * s, cy - 8 * s); x.lineTo(cx + 2 * s, cy - 8 * s); x.closePath(); x.fill(); };
    if(k === 'warn'){ x.fillStyle = '#f5c518'; x.strokeStyle = '#111'; x.beginPath(); x.moveTo(cx, cy - r * 1.15); x.lineTo(cx + r * 1.2, cy + r * .9); x.lineTo(cx - r * 1.2, cy + r * .9); x.closePath(); x.fill(); x.stroke(); bolt(.9); }
    else if(k === 'no'){ x.fillStyle = '#fff'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.fillStyle = '#222'; x.fillRect(cx - 18, cy - 20, 36, 34); x.fillRect(cx - 12, cy - 38, 7, 20); x.fillRect(cx + 5, cy - 38, 7, 20); x.fillRect(cx - 4, cy + 14, 8, 26); x.strokeStyle = '#d0021b'; x.lineWidth = 18; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx - r * .7, cy - r * .7); x.lineTo(cx + r * .7, cy + r * .7); x.stroke(); }
    else if(k === 'glove' || k === 'goggle'){ x.fillStyle = '#1565c0'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.fillStyle = '#fff'; x.strokeStyle = '#fff';
      if(k === 'glove'){ x.fillRect(cx - 22, cy - 6, 44, 46); [-18, -6, 6].forEach(o => x.fillRect(cx + o, cy - 40, 10, 38)); x.save(); x.translate(cx + 22, cy + 2); x.rotate(-.6); x.fillRect(-5, -24, 11, 28); x.restore(); }
      else { x.lineWidth = 10; [-26, 26].forEach(o => { x.beginPath(); x.arc(cx + o, cy, 20, 0, 7); x.stroke(); }); x.beginPath(); x.moveTo(cx - 6, cy); x.lineTo(cx + 6, cy); x.stroke(); x.beginPath(); x.moveTo(cx - 46, cy - 4); x.lineTo(cx - 60, cy - 10); x.moveTo(cx + 46, cy - 4); x.lineTo(cx + 60, cy - 10); x.stroke(); } }
    else if(k === 'fire'){ x.fillStyle = '#d0021b'; x.fillRect(cx - r, cy - r, r * 2, r * 2); x.fillStyle = '#fff'; x.fillRect(cx - 12, cy - 22, 24, 56); x.fillRect(cx - 6, cy - 32, 12, 10); x.fillRect(cx + 4, cy - 30, 22, 6); x.beginPath(); x.moveTo(cx - 30, cy + 34); x.quadraticCurveTo(cx - 44, cy, cx - 24, cy - 26); x.quadraticCurveTo(cx - 26, cy + 4, cx - 18, cy + 34); x.fill(); }
    else { x.fillStyle = '#1f7a4a'; x.fillRect(cx - r, cy - r, r * 2, r * 2); x.fillStyle = '#fff'; x.fillRect(cx - 10, cy - 34, 20, 68); x.fillRect(cx - 34, cy - 10, 68, 20); }
    x.fillStyle = '#111'; x.font = 'bold 28px "IBM Plex Sans Arabic", Tahoma, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const words = txt.split(' '); let line = '', lines = []; words.forEach(w => { const tt = line ? line + ' ' + w : w; if(x.measureText(tt).width > W - 16){ lines.push(line); line = w; } else line = tt; }); lines.push(line);
    lines.slice(0, 2).forEach((l, i) => x.fillText(l, cx, H * .8 + i * 30 - (lines.length > 1 ? 14 : 0)));
  };
  const signMeshes = SIGNS.map((sg, i) => { const c = makeCanvas(.32, .4, 256); c.draw(drawSign(sg.k, sg.t)); c.mesh.position.set(-.95 + i * .38, 1.36, -1.515); signs.add(c.mesh); signs.add(at(box(.34, .42, .01, M(0xd9dde2)), c.mesh.position.x, 1.36, -1.522)); return c.mesh; });
  // كارت الإغلاق (Lockout / Tagout)
  const tag = new THREE.Group(); tag.position.set(1.5, .86, -1.38); root.add(tag);
  const tc = makeCanvas(.16, .26, 128); tc.draw((x, W, H) => { x.fillStyle = '#d0021b'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.font = 'bold 22px Tahoma'; x.textAlign = 'center'; x.fillText(L('خطر', 'DANGER'), W / 2, 40); x.font = 'bold 17px Tahoma'; [L('لا تشغّل', 'DO NOT'), L('جاري', 'OPERATE'), L('الصيانة', '')].forEach((s2, i) => x.fillText(s2, W / 2, 90 + i * 30)); x.fillStyle = '#fff'; x.beginPath(); x.arc(W / 2, 14, 6, 0, 7); x.fill(); });
  tag.add(tc.mesh); const lock = new THREE.Group(); lock.position.set(0, .2, .02); tag.add(lock); lock.add(box(.08, .07, .04, M(0xe8c21a, { m: .5 }))); lock.add(at(new THREE.Mesh(new THREE.TorusGeometry(.028, .008, 8, 16, Math.PI), M(0xc9ced6, { m: .9 })), 0, .035, 0));
  part('app', app, V(0, .8, 0), L('الجهاز', 'The appliance'), L('جسمه معدن، فلازم يكون موصّل بالأرضي.', 'Metal body, so it must be earthed.'));
  part('ppe', ppe, V(.2, .3, 0), L('معدات الوقاية', 'Protective equipment'), L('جوانتي عازل، ونضارة، وعدد معزولة.', 'Insulating gloves, goggles and insulated tools.'));
  part('plug', plug, V(0, .15, 0), L('الفيشة', 'The plug'), L('دوس عليها تفصلها أو توصّلها.', 'Tap to unplug or plug in.'));
  part('rcd', rcd, V(0, .32, .05), L('قاطع التسريب RCD', 'Residual current device'), L('بيفصل في أقل من ثانية لو فيه تسريب 30 مللي أمبير. دوس على زرار T تختبره.', 'Trips within a fraction of a second on 30 mA leakage. Tap T to test it.'));
  part('ext', ext, V(0, .8, 0), L('طفاية CO₂', 'CO₂ extinguisher'), L('للحرايق الكهربا. دوس عليها تطفي.', 'For electrical fires. Tap to use it.'));
  part('signs', signs, V(-.2, 1.62, -1.5), L('لافتات السلامة', 'Safety signs'), L('دوس عليها تعرف معنى كل لون وشكل.', 'Tap to learn what each colour and shape means.'));
  part('tag', tag, V(0, .2, .05), L('كارت وقفل الإغلاق', 'Lockout tag and lock'), L('بيمنع حد يرجّع الكهربا وانت شغال.', 'Stops anyone restoring power while you work.'));
  part('stick', stick, V(0, .1, 0), L('عصاية خشب', 'Wooden stick'), L('لإبعاد المصاب عن السلك من غير ما تلمسه.', 'To move a victim off a live wire without touching them.'));
  const st = { plugged: 1, fault: 0, trip: 0, fire: 0, spray: 0, earth: 1, loto: 0 }; let t = 0, sprayT = 0, sgI = -1;
  ctx.parts.signs.tap = () => { sgI = (sgI + 1) % SIGNS.length; return SIGNS[sgI].t + ': ' + SIGNS[sgI].d; };
  ctx.parts.plug.tap = () => { st.plugged ^= 1; return st.plugged ? L('الفيشة اتوصلت.', 'Plugged in.') : L('الفيشة اتفصلت: دلوقتي الجهاز آمن تشتغل عليه.', 'Unplugged: now it is safe to work on.'); };
  ctx.parts.rcd.tap = () => { if(st.loto) return L('القاطع عليه قفل وكارت: ممنوع يرجع غير من اللي قافله.', 'Locked and tagged: only the person who locked it may restore it.'); if(st.trip){ st.trip = 0; st.fault = 0; return L('رجّعنا القاطع بعد ما صلّحنا التسريب.', 'Reset after the leak was fixed.'); } st.trip = 1; return L('دوسنا زرار الاختبار T: القاطع فصل، يبقى شغال. جربه مرة كل شهر.', 'Pressed test T: it tripped, so it works. Test it monthly.'); };
  ctx.parts.ext.tap = () => { if(!st.fire) return ctx.parts.ext.desc; st.spray = 1; sprayT = 0; return L('افصل الكهربا الأول، ووجّه البوري لقاعدة النار.', 'Cut the power first, aim the horn at the base of the fire.'); };
  return {
    ...ctx, view: V(.05, .55, 1.5), sway: true, hint: L('دوس على الفيشة أو القاطع أو الطفاية', 'Tap the plug, breaker or extinguisher'),
    steps: [
      { title: L('السلامة في ورشة الأجهزة', 'Safety in the appliance workshop'), text: L('أخطر 3 حاجات في الشغل: الصعق الكهربي، والحريق، والإصابات من الأجزاء المتحركة أو السخنة. كل خطوة جاية بتوري وسيلة حماية.', 'The three main hazards: electric shock, fire, and injury from moving or hot parts. Each step shows one protection.'), s: {} },
      { title: L('معدات الوقاية', 'Protective equipment'), text: L('اشتغل بجوانتي عازل ونضارة واقية، واستخدم عدد يدها معزولة ومكتوب عليها 1000V. ممنوع الخواتم والساعات المعدن، والأرض تحتك تكون ناشفة.', 'Wear insulating gloves and goggles, and use tools with insulated handles rated 1000 V. No metal rings or watches, and keep the floor dry.'), focus: 'ppe', s: {} },
      { title: L('لافتات السلامة', 'Safety signs'), text: L('اللافتات ليها لغة ثابتة باللون والشكل: المثلث الأصفر تحذير من خطر، والدايرة الحمرا بشرطة ممنوع، والدايرة الزرقا إلزامي (لازم تلبس الجوانتي أو النضارة)، والمربع الأحمر لمعدات الحريق، والمربع الأخضر للإسعاف ومخارج الطوارئ. دوس على اللافتات تعرف كل واحدة.', 'Signs use a fixed code of colour and shape: a yellow triangle warns of a hazard, a red circle with a bar prohibits, a blue circle is mandatory (wear gloves or goggles), a red square marks fire equipment and a green square marks first aid and emergency exits. Tap the signs to learn each one.'), focus: 'signs', s: {} },
      { title: L('إجراءات وقائية', 'Preventive measures'), text: L('قبل الشغل: افحص الأسلاك والفيش، وما تحمّلش البريزة بأجهزة كتير، وخلّي الأرض ناشفة والمكان منوّر ومتهوّي ونضيف من غير قطع مرمية. استخدم بريزة عليها قاطع تسريب، وخلّي الطفاية وشنطة الإسعاف في مكان معروف قريب، واعرف رقم الإسعاف 123.', 'Before work: inspect cords and plugs, do not overload sockets, keep the floor dry and the area lit, ventilated and tidy. Use an RCD-protected socket, keep the extinguisher and first-aid kit in a known nearby place, and know the ambulance number, 123.'), focus: 'rcd', s: {} },
      { title: L('افصل الكهربا الأول', 'Isolate first'), text: L('قبل ما تفتح أي جهاز: اسحب الفيشة من البريزة (مش بس تقفل المفتاح)، وخليها قدام عينك. ولو شغال على دايرة من اللوحة، اقفل القاطع وحط عليه قفل وكارت «لا تشغّل - جاري الصيانة» عشان محدش يرجّعه. المكثفات الكبيرة ممكن تفضل مشحونة: فرّغها قبل ما تلمسها.', 'Before opening any appliance, pull the plug (not just the switch) and keep it in sight. When working on a circuit from the board, switch the breaker off and fit a lock and a DO NOT OPERATE tag so no one switches it back on. Large capacitors can stay charged: discharge them before touching.'), focus: 'tag', s: { plugged: 0, trip: 1, loto: 1 } },
      { title: L('الأرضي وقاطع التسريب', 'Earthing and the RCD'), text: L('سلك الفاز لمس جسم الجهاز (العلامة الصفرا). عشان الجسم متوصل بالأرضي (السلك الأخضر)، التيار راح للأرض، وقاطع التسريب RCD حس بيه وفصل في أقل من ثانية. من غير أرضي، أول حد يلمس الجهاز هو اللي هيتكهرب.', 'The phase wire touched the body (yellow mark). Because the body is earthed (green wire), the current went to earth and the RCD tripped in a fraction of a second. Without earth, the first person to touch it would get the shock.'), focus: 'rcd', s: { fault: 1, trip: 1 } },
      { title: L('حريق كهربا', 'Electrical fire'), text: L('ممنوع المية على حريق كهربا لأنها بتوصّل التيار. افصل الكهربا من القاطع، واستخدم طفاية CO₂ أو بودرة. دوس على الطفاية تطفي النار.', 'Never use water on an electrical fire: it conducts. Switch off at the breaker and use a CO₂ or powder extinguisher. Tap the extinguisher to put it out.'), focus: 'ext', s: { fire: 1 } },
      { title: L('إسعاف المصاب بصعق كهربي', 'First aid for electric shock'), text: L('ما تلمسش المصاب وهو ماسك السلك. افصل الكهربا الأول، ولو مش قادر، أبعده بحاجة ناشفة عازلة زي عصاية خشب. بعد كده اطلب الإسعاف 123، وشوف نَفَسه، ولو مش بيتنفس ابدأ إنعاش قلبي رئوي لو متدرب عليه.', 'Do not touch a victim still holding the wire. Cut the power, or if you cannot, push them away with something dry and insulating like a wooden stick. Then call 123, check breathing, and start CPR if trained.'), focus: 'stick', s: {} }
    ],
    apply(s){ Object.assign(st, { plugged: 1, fault: 0, trip: 0, fire: 0, spray: 0, loto: 0 }, s); },
    update(dt){ t += dt;
      plug.position.lerp(st.plugged ? V(.75, .55, -1.42) : V(.65, .3, -1.1), Math.min(1, dt * 6)); plug.rotation.x = st.plugged ? 0 : .6;
      lever.rotation.x = ease(lever.rotation.x, st.trip ? Math.PI * .8 : 0, dt, 9);
      leak.visible = !!st.fault && Math.floor(t * 3) % 2 === 0; tag.visible = !!st.loto;
      if(st.spray){ sprayT += dt; if(sprayT > 1.5){ st.fire = 0; st.spray = 0; } }
      fire.set(st.fire ? 1 : 0); fire.update(dt, t); app.children.forEach(c => {});
      const ho = V(1.86, .14, .45), tg = V(-.2, .75, -.35);
      gas.forEach(s => { const ph = (s.userData.ph + t * 1.2) % 1; s.position.copy(ho).lerp(tg, ph); s.position.y += Math.sin(ph * 3) * .1; s.scale.setScalar(.1 + ph * .5); s.material.opacity = st.spray ? (1 - ph) * .7 : 0; });
      setGlow(bodyM, st.fault ? .25 : 0, 1, .8, .1);
    }
  };
}

/* ---------- لف محولات الوجه الواحد ---------- */
function makeLam(type){
  const g = new THREE.Group(), m = M(0x6c747d, { m: .5, r: .45 });
  if(type === 'E'){ g.add(at(box(.6, .1, .012, m), 0, .25, 0)); [-.25, 0, .25].forEach((x, i) => g.add(at(box(i === 1 ? .2 : .1, .4, .012, m), x, 0, 0))); }
  else g.add(box(.6, .1, .012, m));
  return g;
}
function buildTrafoWind(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  // ماكينة اللف
  const mc = new THREE.Group(); mc.position.set(-.45, 0, -.3); mc.scale.setScalar(1.4); root.add(mc);
  mc.add(at(box(1.2, .08, .45, M(0x2a62c9, { r: .5 })), 0, .04, 0));
  [-.5, .4].forEach(x => mc.add(at(box(.08, .45, .12, M(0x2a62c9, { r: .5 })), x, .3, 0)));
  const shaft = cyl(.02, .02, 1.0, M(0xc9ced6, { m: .9 }), 10); shaft.rotation.z = Math.PI / 2; mc.add(at(shaft, -.05, .45, 0));
  const crank = new THREE.Group(); crank.position.set(.48, .45, 0); mc.add(crank); crank.add(at(box(.03, .22, .03, M(0x3a3f46)), 0, .1, 0)); crank.add(at(cyl(.025, .025, .1, M(0xd23a2e), 10), .05, .2, 0)).children.at(-1).rotation.z = Math.PI / 2;
  const cnt = makePanel(.36, .12, { bg: '#111', fg: '#7dffb0', font: 'bold 64px monospace' }); mc.add(at(cnt.mesh, .4, .66, .07)); mc.add(at(box(.4, .16, .1, M(0x1d2128)), .4, .66, .01));
  mc.add(at(label(L('العدّاد (عدد اللفات)', 'Counter (turns)'), '#ffffff', .05), .4, .8, .07));
  // البكرة على العمود
  const spin = new THREE.Group(); spin.position.set(-.1, .45, 0); mc.add(spin);
  const bob = new THREE.Group(); spin.add(bob); bob.rotation.z = Math.PI / 2; bob.scale.setScalar(1.25);
  bob.add(box(.16, .3, .16, M(0x2b3038))); [-.15, .15].forEach(y => bob.add(at(box(.3, .02, .3, M(0x2b3038)), 0, y, 0)));
  const priM = M(0xc8703a, { m: .7, r: .35 }), secM = M(0xb04a1e, { m: .7, r: .35 });
  const pri = new THREE.Mesh(new THREE.BoxGeometry(1, .28, 1), priM); bob.add(pri);
  const pap = new THREE.Mesh(new THREE.BoxGeometry(1, .28, 1), M(0xf2ead7, { r: .9 })); bob.add(pap);
  const sec = new THREE.Mesh(new THREE.BoxGeometry(1, .28, 1), secM); bob.add(sec);
  // بكرة السلك
  const spool = new THREE.Group(); spool.position.set(-.55, 0, .6); root.add(spool);
  spool.add(at(cyl(.12, .12, .2, M(0xc8703a, { m: .7 }), 24), 0, .2, 0)); [.1, .3].forEach(y => spool.add(at(cyl(.16, .16, .015, M(0x2b3038), 24), 0, y, 0)));
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, 1, 6), M(0xd98c5f, { m: .8, r: .3 })); wire.userData.noFit = true; root.add(wire);
  const guide = new THREE.Group(); mc.add(guide); guide.add(at(box(.03, .06, .03, M(0xd9a441, { m: .7 })), 0, 0, .14)); guide.add(at(cyl(.006, .006, .6, M(0xc9ced6, { m: .9 }), 8), 0, 0, .14)).children.at(-1).rotation.z = Math.PI / 2;
  const wA = V(), wB = V(), up = V(0, 1, 0);
  // الشرايح
  const lams = new THREE.Group(); lams.position.set(.9, 0, -.4); root.add(lams);
  const Es = [], Is = [];
  for(let i = 0; i < 6; i++){ const e = makeLam('E'); e.rotation.x = -Math.PI / 2; lams.add(e); Es.push(e); const ii = makeLam('I'); ii.rotation.x = -Math.PI / 2; lams.add(ii); Is.push(ii); }
  const done = new THREE.Group(); done.position.set(.9, 0, -.4); root.add(done);
  done.add(at(box(.18, .2, .3, priM), 0, .3, 0));
  // اللوحة بالحسابات
  const brd = makeCanvas(.9, .55, 512); brd.mesh.position.set(.9, 1.0, -1.5); root.add(brd.mesh);
  const mtr = makeBigMeter(); at(mtr.group, 1.35, 0, .45); mtr.group.rotation.y = -.4; mtr.group.scale.setScalar(.85); root.add(mtr.group);
  part('mc', mc, V(-.5, .7, 0), L('ماكينة اللف', 'Winding machine'), L('بتلف البكرة وعدّادها بيعد اللفات.', 'Turns the bobbin while the counter counts turns.'));
  part('bob', spin, V(0, .25, 0), L('البكرة (الكركاس)', 'Bobbin'), L('بيتلف عليها الابتدائي وبعده الثانوي.', 'The primary then the secondary are wound on it.'));
  part('spool', spool, V(0, .45, 0), L('سلك النحاس المعزول', 'Enamelled copper wire'), L('سمكه بيتحدد من التيار.', 'Its gauge depends on the current.'));
  part('lams', lams, V(0, .35, 0), L('شرايح القلب E وI', 'E and I laminations'), L('حديد سيليكون معزول عشان يقلل الفقد.', 'Insulated silicon steel to cut losses.'));
  part('brd', brd.mesh, V(0, .35, 0), L('الحسابات', 'Calculations'), L('عدد اللفات لكل فولت.', 'Turns per volt.'));
  const st = { phase: 'idle', n: 0 }; let t = 0, turns = 0, asm = 0;
  const TOTAL = { pri: 1100, sec: 63 };
  const drawBoard = () => brd.draw((x, W, H) => { x.fillStyle = '#16302a'; x.fillRect(0, 0, W, H); x.fillStyle = '#e8f5e9'; x.font = 'bold 26px "IBM Plex Sans Arabic", Tahoma'; x.textAlign = LANG === 'en' ? 'left' : 'right'; const X = LANG === 'en' ? 16 : W - 16;
    [L('مساحة القلب: 3 × 3 = 9 سم²', 'Core area: 3 × 3 = 9 cm²'), L('لفات/فولت = 45 ÷ 9 = 5', 'Turns/volt = 45 ÷ 9 = 5'), L('الابتدائي: 220 × 5 = 1100 لفة', 'Primary: 220 × 5 = 1100 turns'), L('الثانوي: 12 × 5 + 5٪ = 63 لفة', 'Secondary: 12 × 5 + 5% = 63 turns'), L('قطر السلك ≈ 0.7 × √التيار', 'Wire Ø ≈ 0.7 × √current')].forEach((s, i) => x.fillText(s, X, 50 + i * 54)); });
  drawBoard();
  return {
    ...ctx, view: V(.05, .7, 1.45), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('لف محول وجه واحد', 'Winding a single-phase transformer'), text: L('المحول: قلب حديد من شرايح E وI، وعليه بكرة فيها ملفين: ابتدائي بيدخله 220 فولت، وثانوي بيطلّع الجهد اللي محتاجينه. الأدوات: ماكينة لف بعدّاد، وسلك نحاس معزول (مينا)، وورق عازل.', 'A transformer is an iron core of E and I laminations carrying a bobbin with two windings: a 220 V primary and a secondary giving the voltage we need. Tools: a winding machine with counter, enamelled copper wire and insulating paper.'), s: { phase: 'idle' } },
      { title: L('الحسابات', 'The calculations'), text: L('قيس مساحة مقطع القلب (العرض × السُمك). لفات كل فولت = 45 ÷ المساحة. هنا 9 سم² يعني 5 لفات لكل فولت، فالابتدائي 1100 لفة، والثانوي 60 لفة نزوّد عليها 5٪ تعويض للفقد = 63. سُمك السلك بيتحدد من التيار.', 'Measure the core cross-section (width × stack). Turns per volt = 45 ÷ area: 9 cm² gives 5 turns per volt, so 1100 primary turns and 60 secondary turns plus 5% for losses = 63. Wire gauge comes from the current.'), focus: 'brd', s: { phase: 'idle' } },
      { title: L('لف الابتدائي', 'Winding the primary'), text: L('ثبّت البكرة على عمود الماكينة، واربط طرف السلك، وابدأ اللف. شوف السلك جاي من البكرة النحاس، والدليل بيوزّعه يمين وشمال عشان الطبقات تبقى منتظمة جنب بعض، والعدّاد بيعد مع كل لفة لحد 1100. طلّع الطرفين وعليهم جلبة عازلة.', 'Fix the bobbin on the machine shaft, anchor the wire end and start winding. The wire comes off the copper spool and the guide traverses it so the layers lie neatly side by side, while the counter counts every turn up to 1100. Bring out both ends in insulating sleeving.'), s: { phase: 'pri' } },
      { title: L('العزل بين الملفات', 'Insulation between windings'), text: L('بعد الابتدائي حط طبقة ورق عازل (أو شريط بولي إستر) تغطيه كله. ده بيمنع أي تلامس بين الـ 220 فولت والثانوي، وده مهم جدًا لأمان المستخدم.', 'After the primary, wrap a full layer of insulating paper or polyester tape. It prevents any contact between the 220 V winding and the secondary, which is vital for user safety.'), focus: 'bob', s: { phase: 'paper' } },
      { title: L('لف الثانوي', 'Winding the secondary'), text: L('الثانوي سلكه أتخن لأن تياره أكبر. اللف بيكمّل فوق الورق، والعدّاد بيعد مع كل لفة لحد 63. لو عايز طرف نص (12-0-12)، طلّع وصلة عند نص اللفات.', 'The secondary uses thicker wire because it carries more current. The counter runs to 63. For a centre tap (12-0-12), bring out a loop at half the turns.'), s: { phase: 'sec' } },
      { title: L('تركيب القلب', 'Stacking the core'), text: L('دخّل شرايح E وI بالتبادل: واحدة من اليمين وواحدة من الشمال، عشان الفجوات ما تيجيش فوق بعض والمحول ما يزنّش. اربط الشرايح كويس بالمسامير.', 'Insert the E and I laminations alternately from each side so the joints do not line up and the transformer does not hum. Clamp them tightly.'), focus: 'lams', s: { phase: 'asm' } },
      { title: L('الاختبار', 'Testing'), text: L('بالأفوميتر: الابتدائي مقاومته أعلى (حوالي 40 أوم)، والثانوي أقل (حوالي 1 أوم). بين الملفين وبين أي ملف والقلب لازم OL. وبعد التغذية قيس الخرج على V~: 12.6 فولت من غير حمل.', 'With a meter: the primary reads higher (about 40 Ω), the secondary lower (about 1 Ω). Between windings, and from either winding to the core, it must read OL. Powered, measure V~ on the output: 12.6 V with no load.'), focus: 'lams', s: { phase: 'test' } }
    ],
    apply(s){ st.phase = s.phase; turns = 0; },
    update(dt){ t += dt; const ph = st.phase;
      const target = ph === 'pri' ? TOTAL.pri : ph === 'sec' ? TOTAL.sec : 0;
      if(target) turns = Math.min(target, turns + dt * (ph === 'pri' ? 95 : 5.5));
      const spinning = target && turns < target; if(spinning){ spin.rotation.x += dt * 9; crank.rotation.x += dt * 9; }
      cnt.setText(String(Math.floor(target ? turns : ph === 'idle' ? 0 : ph === 'paper' ? TOTAL.pri : ph === 'asm' || ph === 'test' ? TOTAL.sec : 0)).padStart(4, '0'));
      const priF = ph === 'idle' ? 0 : ph === 'pri' ? turns / TOTAL.pri : 1, papF = ['paper', 'sec', 'asm', 'test'].includes(ph) ? 1 : 0, secF = ph === 'sec' ? turns / TOTAL.sec : ['asm', 'test'].includes(ph) ? 1 : 0;
      const r0 = .17, rp = r0 + .06 * priF, rq = rp + .012 * papF, rs = rq + .05 * secF; const RS = 1.25;
      pri.scale.set(rp, 1, rp); pri.visible = priF > .01; pap.scale.set(rq, 1, rq); pap.visible = !!papF; sec.scale.set(rs, 1, rs); sec.visible = secF > .01;
      wire.visible = !!spinning; guide.visible = !!target || ph === 'paper'; spool.rotation.y += spinning ? dt * 4 : 0;
      if(spinning){ const layerF = ph === 'pri' ? priF : secF, nLayers = ph === 'pri' ? 8 : 2; const sweep = Math.cos(layerF * nLayers * Math.PI) * .16; const rr = (ph === 'pri' ? rp : rs) / 2 * RS;
        guide.position.set(-.1 + sweep, .45 + rr + .02, 0); termOf(spool, V(0, .32, -.12)).clone(); wA.copy(termOf(spool, V(0, .3, -.12))); wB.copy(termOf(mc, V(-.1 + sweep, .45 + rr, 0)));
        const d = wB.clone().sub(wA); wire.position.copy(wA).addScaledVector(d, .5); wire.scale.set(1, d.length(), 1); wire.quaternion.setFromUnitVectors(up, d.normalize()); }
      const showAsm = ph === 'asm' || ph === 'test'; done.visible = showAsm; mc.visible = !showAsm || true;
      asm = showAsm ? Math.min(1, asm + dt * .6) : 0;
      Es.forEach((e, i) => { const k = Math.min(1, Math.max(0, asm * 6 - i)); const side = i % 2 ? 1 : -1; e.position.set(side * (1 - k) * .5, .02 + i * .025, 0); e.rotation.z = i % 2 ? Math.PI : 0; e.visible = showAsm; });
      Is.forEach((e, i) => { const k = Math.min(1, Math.max(0, asm * 6 - i)); const side = i % 2 ? -1 : 1; e.position.set(0, .02 + i * .025, side * (.25 + .05 + (1 - k) * .4)); e.visible = showAsm; });
      Es.forEach((e, i) => { if(!showAsm){ e.visible = true; e.position.set(-.15, .012 + i * .013, -.1); e.rotation.z = 0; } });
      Is.forEach((e, i) => { if(!showAsm){ e.visible = true; e.position.set(.15, .012 + i * .013, .25); } });
      mtr.setMode(ph === 'test' ? 'ohm' : 'off'); mtr.setText(ph === 'test' ? (Math.floor(t / 2.5) % 3 === 0 ? '40.8 Ω' : Math.floor(t / 2.5) % 3 === 1 ? '1.1 Ω' : 'OL') : ''); mtr.update(dt);
    }
  };
}

/* ---------- محركات الوجه الواحد والمروحة ---------- */
function buildMotor1(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const mot = new THREE.Group(); mot.position.set(-.45, .7, -.2); root.add(mot);
  // الجزء الثابت (منظر أمامي مقطوع)
  const stator = new THREE.Group(); mot.add(stator);
  stator.add(new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .5, 48, 1, true), M(0x8a9099, { m: .6, side: THREE.DoubleSide }))); stator.children[0].rotation.x = Math.PI / 2;
  for(let i = 0; i < 24; i++){ const a = i / 24 * Math.PI * 2; const tth = box(.06, .2, .5, M(0x6c747d, { m: .5 })); tth.position.set(Math.cos(a) * .5, Math.sin(a) * .5, 0); tth.rotation.z = a + Math.PI / 2; stator.add(tth); }
  const mainM = M(0xc8703a, { m: .7, r: .35 }), auxM = M(0x2fa37a, { m: .5, r: .35 });
  const coils = [];
  for(let i = 0; i < 4; i++){ [[mainM, 0], [auxM, Math.PI / 4]].forEach(([m, off], j) => { const a = off + i * Math.PI / 2; [.27, -.27].forEach(z => { const c = new THREE.Mesh(new THREE.TorusGeometry(.42, .035, 8, 20, Math.PI / 3.2), m); c.rotation.z = a - Math.PI / 6.4; c.position.z = z; stator.add(c); coils.push({ c, j }); }); }); }
  const rotor = new THREE.Group(); mot.add(rotor);
  const rc = cyl(.36, .36, .48, M(0x5d646e, { m: .5 }), 32); rc.rotation.x = Math.PI / 2; rotor.add(rc);
  for(let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2; const b = box(.03, .03, .5, M(0xb9c0c8, { m: .8 })); b.position.set(Math.cos(a) * .34, Math.sin(a) * .34, 0); rotor.add(b); }
  const sh = cyl(.04, .04, 1.1, M(0xc9ced6, { m: .9 }), 12); sh.rotation.x = Math.PI / 2; rotor.add(sh);
  const mark = box(.04, .3, .02, M(0xd23a2e)); mark.position.set(0, .16, .26); rotor.add(mark);
  const field = new THREE.Mesh(new THREE.ConeGeometry(.06, .25, 12), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: .9 })); field.position.z = .3; const fieldP = new THREE.Group(); fieldP.add(field); mot.add(fieldP);
  // المكثف وعلبة الأطراف
  const cap = new THREE.Group(); cap.position.set(.45, .15, .25); root.add(cap);
  cap.add(at(cyl(.08, .08, .25, M(0xe9ebef, { m: .3 }), 20), 0, .125, 0)); cap.add(at(label('4µF 450V', '#1b1f26', .045), 0, .15, .085));
  const tb = new THREE.Group(); tb.position.set(.1, .05, .45); root.add(tb); tb.add(at(box(.36, .08, .14, M(0x1d2128)), 0, .04, 0));
  const tbT = [-.11, 0, .11].map((x, i) => { tb.add(at(cyl(.02, .02, .03, M(0xd9a441, { m: .8 }), 10), x, .09, 0)); tb.add(at(label(['C', 'M', 'A'][i], '#ffd34d', .05), x, .16, .04)); return V(x, .1, 0); });
  // المروحة السقف
  const fan = new THREE.Group(); fan.position.set(1.15, 0, -.5); root.add(fan);
  fan.add(at(box(.5, .04, .4, M(0x3a3f46)), 0, .02, 0)); fan.add(at(cyl(.025, .025, 1.3, M(0xe9ebef), 10), 0, .67, 0));
  const fr = new THREE.Group(); fr.position.y = 1.35; fan.add(fr);
  fr.add(at(cyl(.2, .22, .14, M(0xf4f5f7, { r: .4 }), 32), 0, 0, 0));
  for(let i = 0; i < 3; i++){ const a = i / 3 * Math.PI * 2; const bl = box(.75, .012, .14, M(0xf4f5f7, { r: .5 })); bl.position.set(Math.cos(a) * .55, -.02, Math.sin(a) * .55); bl.rotation.y = -a; bl.rotation.x = .12; fr.add(bl); }
  const reg = new THREE.Group(); reg.position.set(1.6, .0, .3); root.add(reg); reg.add(at(box(.2, .06, .3, M(0xf4f5f7)), 0, .03, 0)); const knob = cyl(.06, .06, .04, M(0x1d2128), 16); reg.add(at(knob, 0, .08, 0));
  const regP = makePanel(.12, .07, { bg: '#111', fg: '#ffd34d', font: 'bold 60px monospace' }); regP.mesh.rotation.x = -Math.PI / 2; reg.add(at(regP.mesh, 0, .061, .1));
  const mtr = makeBigMeter(); at(mtr.group, 1.0, 0, .45); mtr.group.rotation.y = -.4; mtr.group.scale.setScalar(.8); root.add(mtr.group);
  const J = k => termOf(mtr.group, mtr.jacks[k]); const probes = makeProbes2(root, J('v'), J('com'));
  part('stator', stator, V(0, .75, 0), L('الجزء الثابت والملفات', 'Stator and windings'), L('النحاسي التقيل = الملف الأساسي، والأخضر = المساعد.', 'Copper = main winding, green = auxiliary.'));
  part('rotor', rotor, V(0, 0, .35), L('العضو الدوار', 'Rotor'), L('قفص سنجاب: قضبان ألومنيوم مقفولة من الطرفين.', 'Squirrel cage: aluminium bars shorted at both ends.'));
  part('cap', cap, V(0, .32, 0), L('المكثف', 'Capacitor'), L('بيأخّر تيار الملف المساعد فيعمل مجال دوار.', 'Shifts the auxiliary current to create a rotating field.'));
  part('tb', tb, V(0, .22, 0), L('علبة الأطراف', 'Terminal box'), L('C المشترك، M الأساسي، A المساعد.', 'C common, M main, A auxiliary.'));
  part('fan', fr, V(0, .2, 0), L('مروحة السقف', 'Ceiling fan'), L('العضو الدوار برّه والملفات جوه.', 'Outer rotor, windings inside.'));
  part('reg', reg, V(0, .2, 0), L('منظّم السرعة', 'Speed regulator'), L('دوس عليه تغيّر السرعة.', 'Tap to change speed.'));
  const st = { run: 0, cap: 1, dir: 1, fan: 0, spd: 3, mode: 'off', txt: '', a: null, b: null, rewind: 0 }; let t = 0, w = 0, fw = 0;
  ctx.parts.cap.tap = () => { st.cap ^= 1; return st.cap ? L('رجّعنا المكثف: المحرك قام.', 'Capacitor back: the motor starts.') : L('شلنا المكثف: المحرك بيزنّ ومش بيلف، لأن مفيش مجال دوار.', 'Capacitor removed: the motor hums but will not start; there is no rotating field.'); };
  ctx.parts.reg.tap = () => { st.spd = st.spd % 5 + 1; st.fan = 1; return L(`السرعة ${st.spd}`, `Speed ${st.spd}`); };
  ctx.parts.tb.tap = () => { st.dir *= -1; return st.dir > 0 ? L('رجّعنا التوصيل: المحرك بيلف في الاتجاه الأصلي.', 'Original connection: normal direction.') : L('عكسنا طرفي الملف المساعد: المحرك عكس اتجاهه.', 'Auxiliary ends swapped: the motor reverses.'); };
  return {
    ...ctx, view: V(.05, .45, 1.5), sway: true, hint: L('دوس على المكثف أو علبة الأطراف أو المنظّم', 'Tap the capacitor, terminal box or regulator'),
    steps: [
      { title: L('محركات الوجه الواحد', 'Single-phase motors'), text: L('المروحة السقف والمكتب، وموتور المية، وموتور الغسالة العادية: كلها محركات وجه واحد بمكثف. قدامك محرك مفتوح من قدّام، ومروحة سقف على اليمين.', 'Ceiling and desk fans, water pumps and ordinary washer motors are all single-phase capacitor motors. In front is a motor opened from the front, with a ceiling fan on the right.'), s: { run: 1 } },
      { title: L('الملف الأساسي والمساعد', 'Main and auxiliary windings'), text: L('في الجزء الثابت ملفين: الأساسي (النحاسي) سلكه أتخن ومقاومته أقل، والمساعد (الأخضر) سلكه أرفع ومقاومته أعلى، ومتزحزح عنه ربع لفة. الدوار قفص سنجاب من غير أي أسلاك.', 'The stator has two windings: the main (copper) with thicker wire and lower resistance, and the auxiliary (green) with thinner wire and higher resistance, set a quarter turn apart. The rotor is a squirrel cage with no wires.'), focus: 'stator', s: { run: 0 } },
      { title: L('المكثف والمجال الدوار', 'The capacitor and rotating field'), text: L('المكثف بيأخّر التيار في الملف المساعد، فالمجال المغناطيسي بيلف (السهم الأصفر) والدوار بيجري وراه. دوس على المكثف تشيله: المحرك هيزنّ ومش هيلف. ده أشهر عطل في المراوح وموتورات المية: المكثف ضعيف.', 'The capacitor delays the current in the auxiliary winding, so the magnetic field rotates (yellow arrow) and the rotor follows. Tap the capacitor to remove it: the motor hums but will not start. A weak capacitor is the commonest fan and pump fault.'), focus: 'cap', s: { run: 1 } },
      { title: L('قياس الملفات وتحديد الأطراف', 'Measuring the windings'), text: L('بالأفوميتر على الأوم: C مع M (الأساسي) أقل قراءة، حوالي 20 أوم. C مع A (المساعد) أعلى، حوالي 60 أوم. وM مع A = مجموعهم، 80 أوم. كده تعرف الأطراف حتى لو الألوان ضايعة. ولو أي قراءة OL، يبقى الملف مقطوع ومحتاج لف.', 'On ohms: C to M (main) gives the lowest reading, about 20 Ω; C to A (auxiliary) is higher, about 60 Ω; M to A is their sum, 80 Ω. This identifies the leads even without colours. Any OL means an open winding that needs rewinding.'), focus: 'tb', s: { mode: 'ohm', txt: '20.4 Ω', a: 0, b: 1 } },
      { title: L('عكس الاتجاه', 'Reversing'), text: L('عشان تعكس اتجاه محرك المكثف، اعكس طرفي الملف المساعد (أو الأساسي)، مش الاتنين. في الغسالة العادية التايمر بيعمل كده كل كام ثانية عشان الهدوم تتقلب. دوس على علبة الأطراف.', 'To reverse a capacitor motor, swap the ends of the auxiliary winding (or the main), not both. In an ordinary washer the timer does this every few seconds to turn the clothes. Tap the terminal box.'), focus: 'tb', s: { run: 1, dir: -1 } },
      { title: L('مروحة السقف ومنظّم السرعة', 'Ceiling fan and regulator'), text: L('في مروحة السقف الدوار هو الجسم الخارجي اللي فيه الريش، والملفات ثابتة جوه على العمود. المنظّم بيغيّر السرعة بمكثفات أو بملف بيقلل الجهد. لو المروحة بطيئة: غيّر المكثف (عادة 2.5 لـ 3.5 ميكروفاراد). دوس على المنظّم.', 'In a ceiling fan the rotor is the outer body carrying the blades; the windings are fixed inside on the shaft. The regulator changes speed with capacitors or a choke. A slow fan usually needs a new capacitor (typically 2.5–3.5 µF). Tap the regulator.'), focus: 'reg', s: { fan: 1, spd: 3 } },
      { title: L('خطوات إعادة اللف', 'Rewinding steps'), text: L('1) سجّل البيانات: عدد المجاري، وخطوة الملف، وعدد اللفات، وقطر السلك، وطريقة التوصيل. 2) فك الملفات القديمة ونضّف المجاري. 3) حط ورق عزل في المجاري. 4) لف الملفات على فورمة بنفس العدد. 5) ركّبها واربط الأطراف. 6) ورنيش وتجفيف. 7) اختبار المقاومة والعزل قبل التشغيل.', '1) Record the data: slots, coil pitch, turns, wire diameter and connection. 2) Strip the old coils and clean the slots. 3) Fit slot insulation. 4) Wind coils on a former with the same turns. 5) Insert them and connect the leads. 6) Varnish and bake. 7) Test resistance and insulation before running.'), focus: 'stator', s: { run: 0 } }
    ],
    apply(s){ Object.assign(st, { run: 0, cap: 1, dir: 1, fan: 0, spd: 3, mode: 'off', txt: '', a: null, b: null }, s); mtr.setMode(st.mode); mtr.setText(st.txt); probes.set(st.a != null ? termOf(tb, tbT[st.a]) : null, st.b != null ? termOf(tb, tbT[st.b]) : null); },
    update(dt){ t += dt; const runs = st.run && st.cap;
      w = ease(w, runs ? 6 * st.dir : 0, dt, 2); rotor.rotation.z += w * dt; if(st.run && !st.cap) rotor.rotation.z = Math.sin(t * 60) * .01;
      fieldP.rotation.z = st.run ? (st.cap ? t * 6 * st.dir : (Math.floor(t * 4) % 2 ? Math.PI : 0)) : 0; field.visible = !!st.run; field.position.set(0, .48, .3);
      coils.forEach(({ c, j }) => setGlow(c.material, st.run ? .15 + .15 * Math.max(0, Math.sin(t * 6 + j * 1.57)) : 0, 1, .5, .1));
      fw = ease(fw, st.fan ? st.spd * 1.6 : 0, dt, 1.5); fr.rotation.y += fw * dt; regP.setText(st.fan ? String(st.spd) : '0');
      mtr.update(dt); probes.update(dt);
    }
  };
}

/* ---------- أجهزة التسخين: الغلاية والمكواة ---------- */
function buildHeating(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  // الغلاية
  const ket = new THREE.Group(); ket.position.set(-1.0, 0, -.3); ket.scale.setScalar(1.2); root.add(ket);
  ket.add(at(cyl(.3, .3, .06, M(0x2b3038), 32), 0, .03, 0));
  ket.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.26, .29, .62, 32, 1, true), M(0xdfe9f2, { opacity: .28, side: THREE.DoubleSide })), 0, .4, 0));
  ket.add(at(cyl(.27, .27, .03, M(0x2b3038), 32), 0, .72, 0));
  const water = cyl(.255, .28, .4, M(0x5aa9e6, { opacity: .45 }), 32); ket.add(at(water, 0, .3, 0));
  const elM = M(0x6c747d, { m: .7, r: .3 }); const el = new THREE.Mesh(new THREE.TorusGeometry(.17, .022, 8, 32), elM); el.rotation.x = Math.PI / 2; ket.add(at(el, 0, .12, 0));
  const hnd = new THREE.Mesh(new THREE.TorusGeometry(.2, .035, 8, 20, Math.PI), M(0x2b3038)); hnd.rotation.z = -Math.PI / 2; ket.add(at(hnd, .3, .42, 0));
  const ksw = box(.06, .03, .08, M(0x2a62c9)); ket.add(at(ksw, .4, .2, 0)); const kled = M(0x2a62c9); ket.add(at(new THREE.Mesh(new THREE.SphereGeometry(.015, 8, 6), kled), .36, .1, .12));
  const bubbles = []; for(let i = 0; i < 26; i++){ const b = new THREE.Mesh(new THREE.SphereGeometry(.012 + Math.random() * .012, 8, 6), M(0xffffff, { opacity: .7 })); b.userData = { ph: Math.random(), a: Math.random() * 6.28, r: .05 + Math.random() * .17, noFit: true }; ket.add(b); bubbles.push(b); }
  const steam = []; for(let i = 0; i < 10; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false })); s.userData = { ph: i / 10, noFit: true }; ket.add(s); steam.push(s); }
  // المكواة
  const iron = new THREE.Group(); iron.position.set(.45, 0, -.15); iron.scale.setScalar(1.7); root.add(iron);
  const sp = new THREE.Shape(); sp.moveTo(-.35, -.2); sp.lineTo(.25, -.2); sp.quadraticCurveTo(.5, 0, .25, .2); sp.lineTo(-.35, .2); sp.lineTo(-.35, -.2);
  const sole = new THREE.Mesh(new THREE.ExtrudeGeometry(sp, { depth: .05, bevelEnabled: false }), M(0xc9ced6, { m: .8, r: .25 })); sole.rotation.x = -Math.PI / 2; iron.add(sole);
  const shell = new THREE.Mesh(new THREE.ExtrudeGeometry(sp, { depth: .2, bevelEnabled: true, bevelSize: .03, bevelThickness: .03 }), M(0x7ab8e6, { opacity: .25 })); shell.rotation.x = -Math.PI / 2; shell.position.y = .05; shell.scale.set(.95, .95, 1); iron.add(shell);
  const ielM = M(0x6c747d, { m: .7, r: .3 }); iron.add(tube(CR([V(-.3, .055, -.12), V(.15, .055, -.12), V(.3, .055, 0), V(.15, .055, .12), V(-.3, .055, .12)]), .02, ielM, 40));
  const dial = cyl(.07, .07, .03, M(0xe9ebef), 20); iron.add(at(dial, -.05, .3, 0)); iron.add(at(label('MAX', '#1b1f26', .04), -.05, .34, .04));
  const bimet = new THREE.Group(); bimet.position.set(-.18, .12, 0); iron.add(bimet);
  const strip = new THREE.Group(); bimet.add(strip); strip.add(at(box(.18, .008, .03, M(0xd9a441, { m: .7 })), .09, .004, 0)); strip.add(at(box(.18, .008, .03, M(0xc9ced6, { m: .8 })), .09, -.004, 0));
  bimet.add(at(box(.02, .06, .03, M(0x1d2128)), 0, -.02, 0)); const contactM = M(0xc9ced6, { m: .9 }); bimet.add(at(cyl(.012, .012, .012, contactM, 10), .17, -.02, 0));
  const pilot = M(0x551111); iron.add(at(new THREE.Mesh(new THREE.SphereGeometry(.018, 10, 6), pilot), .05, .3, .12));
  const tgauge = makePanel(.24, .08, { bg: '#111', fg: '#ff9a5a', font: 'bold 60px monospace' }); iron.add(at(tgauge.mesh, .1, .45, 0));
  const tfuse = new THREE.Group(); tfuse.position.set(-.3, .1, .14); iron.add(tfuse); const tf = cyl(.014, .014, .07, M(0xe9ebef, { m: .6 }), 10); tf.rotation.z = Math.PI / 2; tfuse.add(tf); tfuse.add(at(label('240°C', '#ffd34d', .04), 0, .06, 0));
  const fx = label('✕', '#ff3b2f', .12); fx.position.set(-.3, .2, .14); iron.add(fx);
  const mtr = makeBigMeter(); at(mtr.group, 1.35, 0, .4); mtr.group.rotation.y = -.4; mtr.group.scale.setScalar(.85); root.add(mtr.group);
  const J = k => termOf(mtr.group, mtr.jacks[k]); const probes = makeProbes2(root, J('v'), J('com'));
  part('ket', ket, V(0, .85, 0), L('الغلاية', 'Kettle'), L('سخّان تحت المية، ومفتاح بيفصل لوحده لما تغلي.', 'An element under the water and a switch that trips at the boil.'));
  part('el', el, V(0, 0, .2), L('عنصر التسخين', 'Heating element'), L('سلك نيكل كروم جوه أنبوبة معدن معزول ببودرة.', 'Nichrome wire inside a powder-insulated metal tube.'));
  part('iron', iron, V(0, .6, 0), L('المكواة', 'Iron'), L('سخّان في القاعدة، وترموستات بيتظبط بالمؤشر.', 'An element in the soleplate and a thermostat set by the dial.'));
  part('bimet', bimet, V(.09, .1, 0), L('الترموستات (بايمتال)', 'Bimetal thermostat'), L('شريحتين معدن بيتمددوا مختلف فبتتني مع الحرارة.', 'Two metals expand differently, so the strip bends with heat.'));
  part('tfuse', tfuse, V(0, .1, 0), L('الفيوز الحراري', 'Thermal fuse'), L('بيسيح ويفصل لو الحرارة زادت عن حده.', 'Melts open if the temperature exceeds its rating.'));
  const st = { on: 0, mode: 'kettle', blown: 0, mtrMode: 'off', txt: '', a: null, b: null }; let t = 0, temp = 25, wtemp = 25, contact = 1, kOn = 0, offT = 9;
  ctx.parts.tfuse.tap = () => { st.blown ^= 1; return st.blown ? L('الفيوز الحراري سيّح: المكواة مش هتسخن خالص، والأفوميتر يقرا OL.', 'The thermal fuse opened: the iron will not heat and the meter reads OL.') : L('ركّبنا فيوز جديد بنفس الدرجة.', 'Fitted a new fuse of the same rating.'); };
  ctx.parts.ket.tap = () => { kOn = 1; wtemp = 30; offT = 0; return L('شغّلنا الغلاية.', 'Kettle switched on.'); };
  return {
    ...ctx, view: V(.05, .65, 1.45), sway: true, hint: L('دوس على الغلاية تشغّلها، أو على الفيوز الحراري', 'Tap the kettle to switch on, or the thermal fuse'),
    steps: [
      { title: L('أجهزة التسخين', 'Heating appliances'), text: L('الغلاية والمكواة والدفاية والسخان والفرن الكهربا كلهم نفس الفكرة: عنصر تسخين، وترموستات بيتحكم في الحرارة، وفيوز حراري للحماية. الغلاية على الشمال متقطّعة، والمكواة غطاها شفاف.', 'Kettles, irons, heaters, water heaters and ovens share one idea: a heating element, a thermostat and a thermal fuse. The kettle on the left is cut away and the iron has a clear cover.'), s: { mode: 'idle' } },
      { title: L('عنصر التسخين', 'The heating element'), text: L('سلك نيكل كروم مقاومته عالية، فالتيار بيسخّنه لحد ما يحمر. القدرة = الجهد² ÷ المقاومة: سخان 2000 وات على 220 فولت مقاومته حوالي 24 أوم. لو الأفوميتر قرا OL يبقى العنصر محروق ويتغيّر.', 'Nichrome wire has high resistance, so current heats it until it glows. Power = V² ÷ R: a 2000 W element on 220 V is about 24 Ω. An OL reading means a burnt element: replace it.'), focus: 'el', s: { mode: 'kettle', on: 1, mtrMode: 'ohm', txt: '24.2 Ω', a: 'k1', b: 'k2' } },
      { title: L('الغلاية بتفصل لوحدها', 'The kettle switches itself off'), text: L('لما المية تغلي، البخار بيعدّي على شريحة بايمتال جنب المفتاح، فتتني وتفصل المفتاح وتطفّي اللمبة. لو الغلاية ما بتفصلش، افحص مجرى البخار والشريحة. وتحت القاعدة فيوز حراري بيفصل لو اشتغلت فاضية.', 'At the boil, steam reaches a bimetal disc by the switch, which snaps and turns it off along with the light. If it never switches off, check the steam path and the disc. A thermal fuse under the base cuts out if it runs dry.'), focus: 'ket', s: { mode: 'kettle', on: 1 } },
      { title: L('الترموستات في المكواة', 'The iron thermostat'), text: L('الشريحة البايمتال معدنين ملزوقين، بيتمددوا بنسب مختلفة. لما المكواة تسخن الشريحة تتني لفوق وتفتح التلامس، فالسخان يفصل واللمبة تطفى. ولما تبرد ترجع تقفل. المؤشر بيقرّب أو يبعّد التلامس فيغيّر درجة الفصل.', 'The bimetal strip is two metals bonded together that expand differently. As the iron heats the strip bends up and opens the contact, so the element and lamp go off; as it cools it closes again. The dial moves the contact to change the cut-off temperature.'), focus: 'bimet', s: { mode: 'iron', on: 1 } },
      { title: L('الفيوز الحراري', 'The thermal fuse'), text: L('لو التلامس لزق والترموستات ما فصلش، الحرارة هتزيد لحد ما الفيوز الحراري يسيح ويفصل كل حاجة. ده بيحمي من الحريق. بيتقاس توصيل: صفر = سليم، OL = محروق. لازم يتغيّر بنفس درجة الحرارة المكتوبة عليه، وعمره ما يتوصّل بسلك. دوس عليه.', 'If the contact welds and the thermostat fails, the temperature rises until the thermal fuse melts and cuts everything, preventing fire. Test for continuity: zero is good, OL is open. Replace it with the same temperature rating, never bridge it with wire. Tap it.'), focus: 'tfuse', s: { mode: 'iron', on: 1, blown: 1, mtrMode: 'cont', txt: 'OL', a: 'f1', b: 'f2' } },
      { title: L('اختبار العزل والأمان', 'Insulation and safety test'), text: L('قبل ما ترجّع الجهاز لصاحبه: قيس العزل بين طرف العنصر والجسم المعدن بالميجر، لازم أكتر من 1 ميجا أوم. لو أقل، العنصر بيسرّب ومحتاج يتغيّر. واتأكد إن سلك الأرضي متوصل بالجسم.', 'Before returning the appliance, megger-test between the element terminal and the metal body: it must exceed 1 MΩ. Lower means a leaking element that must be replaced. Make sure the earth wire is connected to the body.'), focus: 'el', s: { mode: 'kettle', mtrMode: 'ohm', txt: '> 20 MΩ', a: 'k1', b: 'kb' } }
    ],
    apply(s){ Object.assign(st, { on: 0, mode: 'idle', blown: 0, mtrMode: 'off', txt: '', a: null, b: null }, s); kOn = st.mode === 'kettle' && st.on ? 1 : 0; wtemp = 30; temp = 60; offT = 9;
      mtr.setMode(st.mtrMode); mtr.setText(st.txt);
      const P = { k1: () => termOf(ket, V(-.12, .08, .28)), k2: () => termOf(ket, V(.12, .08, .28)), kb: () => termOf(ket, V(0, .03, .3)), f1: () => termOf(tfuse, V(-.035, 0, .01)), f2: () => termOf(tfuse, V(.035, 0, .01)) };
      probes.set(st.a ? P[st.a]() : null, st.b ? P[st.b]() : null); },
    update(dt){ t += dt;
      // الغلاية
      if(kOn){ wtemp = Math.min(100, wtemp + dt * 18); if(wtemp >= 100){ kOn = 0; offT = 0; } }
      else { offT += dt; wtemp = Math.max(25, wtemp - dt * 2); if(st.mode === 'kettle' && st.on && offT > 4){ kOn = 1; wtemp = 40; } }
      const kh = kOn ? 1 : 0; setGlow(elM, kh * .9, 1, .25, .05); elM.color.setHex(kh ? 0xd2603a : 0x6c747d); setGlow(kled, kh, .3, .5, 1); ksw.position.y = kh ? .2 : .23;
      const boil = Math.max(0, (wtemp - 70) / 30) * (kh || offT < 1.5 ? 1 : 0);
      bubbles.forEach(b => { const u = b.userData; u.ph = (u.ph + dt * (.4 + boil)) % 1; b.position.set(Math.cos(u.a) * u.r, .14 + u.ph * .32, Math.sin(u.a) * u.r); b.visible = boil > .05; });
      steam.forEach(s => { const ph = (s.userData.ph + t * .4) % 1; s.position.set(Math.sin(ph * 6) * .05, .75 + ph * .5, 0); s.scale.setScalar(.1 + ph * .3); s.material.opacity = boil * (1 - ph) * .5; });
      // المكواة
      const ion = st.mode === 'iron' && st.on && !st.blown;
      if(ion){ if(contact){ temp += dt * 40; if(temp > 190) contact = 0; } else { temp -= dt * 18; if(temp < 160) contact = 1; } } else temp = Math.max(25, temp - dt * 10);
      const heating = ion && contact; setGlow(ielM, heating ? .9 : 0, 1, .25, .05); ielM.color.setHex(heating ? 0xd2603a : 0x6c747d); setGlow(pilot, heating ? 1 : 0, 1, .15, .1);
      strip.rotation.z = ease(strip.rotation.z, ion && !contact ? .3 : 0, dt, 6); tgauge.setText(Math.round(temp) + '°C'); fx.visible = !!st.blown;
      mtr.update(dt); probes.update(dt);
    }
  };
}

/* ---------- الخلاط ومحرك العموم (Universal) ---------- */
function buildMixer(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const bl = new THREE.Group(); bl.position.set(-.35, 0, -.25); bl.scale.setScalar(1.55); root.add(bl);
  bl.add(at(new THREE.Mesh(new THREE.BoxGeometry(.7, .6, .6), M(0xe9ebef, { opacity: .22 })), 0, .3, 0));
  bl.add(at(box(.72, .04, .62, M(0x2b3038)), 0, .02, 0));
  // المحرك (رأسي)
  const mot = new THREE.Group(); mot.position.set(0, .3, 0); bl.add(mot);
  const yoke = new THREE.Group(); mot.add(yoke); [-1, 1].forEach(s => { yoke.add(at(box(.08, .3, .2, M(0x6c747d, { m: .5 })), s * .2, 0, 0)); const fc = new THREE.Mesh(new THREE.TorusGeometry(.09, .035, 8, 20), M(0xc8703a, { m: .7 })); fc.rotation.y = Math.PI / 2; yoke.add(at(fc, s * .15, 0, 0)); });
  yoke.add(at(box(.48, .04, .2, M(0x6c747d, { m: .5 })), 0, .17, 0)); yoke.add(at(box(.48, .04, .2, M(0x6c747d, { m: .5 })), 0, -.17, 0));
  const arm = new THREE.Group(); mot.add(arm);
  arm.add(cyl(.1, .1, .2, M(0x3a3f46, { m: .5 }), 24)); for(let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2; arm.add(at(box(.025, .2, .025, M(0xc8703a, { m: .7 })), Math.cos(a) * .1, 0, Math.sin(a) * .1)); }
  const comm = new THREE.Group(); comm.position.y = -.17; arm.add(comm); for(let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2; const sgm = box(.02, .08, .018, M(0xd98c5f, { m: .9 })); sgm.position.set(Math.cos(a) * .045, 0, Math.sin(a) * .045); sgm.rotation.y = -a; comm.add(sgm); }
  arm.add(at(cyl(.015, .015, .62, M(0xc9ced6, { m: .9 }), 10), 0, .1, 0));
  const brushes = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .075, -.47 + .3, 0); mot.add(g); const b = box(.05, .03, .03, M(0x1d2128, { r: .9 })); g.add(b); g.add(at(box(.05, .045, .045, M(0xd9a441, { m: .7, opacity: .5 })), s * .04, 0, 0)); return { g, b, s }; });
  const sparks = []; for(let i = 0; i < 8; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9fd3ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); s.userData = { noFit: true }; s.scale.setScalar(.05); bl.add(s); sparks.push(s); }
  // الجاج والسكينة
  const jar = new THREE.Group(); jar.position.set(0, .6, 0); bl.add(jar);
  jar.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.24, .16, .55, 28, 1, true), M(0xdfe9f2, { opacity: .3, side: THREE.DoubleSide })), 0, .3, 0)); jar.add(at(cyl(.25, .25, .03, M(0x2b3038), 28), 0, .58, 0));
  const juice = cyl(.2, .16, .28, M(0xff9a3a, { opacity: .55 }), 28); jar.add(at(juice, 0, .17, 0));
  const blade = new THREE.Group(); blade.position.y = .06; jar.add(blade); [0, 1].forEach(i => { const b = box(.22, .008, .035, M(0xc9ced6, { m: .9 })); b.rotation.y = i * Math.PI / 2; b.rotation.x = i ? .3 : -.3; blade.add(b); });
  // مفتاح السرعات
  const knob = new THREE.Group(); knob.position.set(0, .2, .31); bl.add(knob); const kn = cyl(.07, .07, .04, M(0x1d2128), 20); kn.rotation.x = Math.PI / 2; knob.add(kn); knob.add(at(box(.012, .05, .01, M(0xffffff)), 0, .03, .025));
  const spdP = makePanel(.2, .07, { bg: '#111', fg: '#7dffb0', font: 'bold 54px monospace' }); bl.add(at(spdP.mesh, .2, .2, .302));
  const mtr = makeBigMeter(); at(mtr.group, 1.1, 0, .35); mtr.group.rotation.y = -.4; mtr.group.scale.setScalar(.85); root.add(mtr.group);
  const J = k => termOf(mtr.group, mtr.jacks[k]); const probes = makeProbes2(root, J('v'), J('com'));
  part('yoke', yoke, V(0, .25, .12), L('ملفات المجال', 'Field coils'), L('ملفين على قطبين، متوصلين توالي مع العضو الدوار.', 'Two coils on two poles, in series with the armature.'));
  part('arm', arm, V(0, .12, .12), L('العضو الدوار (الأرميتشر)', 'Armature'), L('ملفات كتير متوصلة بشرايح المبدّل.', 'Many coils joined to the commutator segments.'));
  part('comm', comm, V(0, -.05, .08), L('المبدّل (الكومتاتير)', 'Commutator'), L('شرايح نحاس معزولة عن بعض.', 'Copper segments insulated from each other.'));
  part('brush', brushes[0].g, V(0, .05, .05), L('الفحم (الفرش الكربونية)', 'Carbon brushes'), L('ياي بيضغطها على المبدّل. دوس عليها.', 'Springs press them on the commutator. Tap them.'));
  part('knob', knob, V(0, .1, .05), L('مفتاح السرعات', 'Speed switch'), L('دوس عليه تغيّر السرعة.', 'Tap to change speed.'));
  part('jar', jar, V(0, .7, 0), L('الجاج والسكينة', 'Jar and blade'), L('بتاخد الحركة من عمود المحرك بقارنة.', 'Driven from the motor shaft by a coupling.'));
  const st = { spd: 0, worn: 0, mode: 'off', txt: '', a: null, b: null }; let t = 0, w = 0;
  ctx.parts.knob.tap = () => { st.spd = (st.spd + 1) % 4; return st.spd ? L(`سرعة ${st.spd}`, `Speed ${st.spd}`) : L('مطفي', 'Off'); };
  ctx.parts.brush.tap = () => { st.worn ^= 1; if(!st.spd) st.spd = 2; return st.worn ? L('الفحم داب: الشرار زاد والمحرك بيقطّع.', 'Worn brushes: more sparking and the motor cuts in and out.') : L('ركّبنا فحم جديد بنفس المقاس: المحرك رجع طبيعي.', 'New brushes of the same size: running normally.'); };
  return {
    ...ctx, view: V(.05, .55, 1.4), sway: true, hint: L('دوس على مفتاح السرعات أو الفحم', 'Tap the speed switch or the brushes'),
    steps: [
      { title: L('محرك العموم (Universal)', 'The universal motor'), text: L('الخلاط والكبة والمفرمة والمضرب والمكنسة والشنيور كلهم بمحرك عموم: سريع جدًا وبيشتغل على تيار متردد ومستمر. جسم الخلاط هنا شفاف عشان تشوف المحرك جواه.', 'Blenders, food processors, mincers, mixers, vacuum cleaners and drills use a universal motor: very fast and able to run on AC or DC. The blender body is transparent to show the motor inside.'), s: { spd: 0 } },
      { title: L('أجزاء المحرك', 'Motor parts'), text: L('ملفات المجال (النحاسي على الجنبين)، والعضو الدوار بملفاته، وتحته المبدّل: شرايح نحاس. الفحم (الأسود) بيضغط على المبدّل بياي، وبيوصّل التيار للعضو الدوار وهو بيلف.', 'Field coils (copper, either side), the armature with its windings, and below it the commutator of copper segments. The carbon brushes (black) are pressed on by springs and feed current to the turning armature.'), focus: 'comm', s: { spd: 0 } },
      { title: L('إزاي بيلف', 'How it turns'), text: L('التيار بيعدّي في ملفات المجال وبعدين في العضو الدوار (توالي). المبدّل بيعكس اتجاه التيار في كل ملف في الوقت المناسب، فالعضو الدوار بيفضل يلف. الشرار الأزرق الصغير عند الفحم طبيعي.', 'Current flows through the field coils and then the armature in series. The commutator reverses the current in each coil at the right moment, so the armature keeps turning. A little blue sparking at the brushes is normal.'), focus: 'arm', s: { spd: 2 } },
      { title: L('التحكم في السرعة', 'Speed control'), text: L('مفتاح السرعات بيختار جزء من ملف المجال (أطراف كتير)، أو بيحط دايود يعدّي نص الموجة للسرعة البطيئة، أو دايرة إلكترونية بترياك. دوس على المفتاح وغيّر السرعة.', 'The speed switch picks taps on the field coil, adds a diode for half-wave slow speed, or uses a triac circuit. Tap the switch to change speed.'), focus: 'knob', s: { spd: 1 } },
      { title: L('عطل الفحم', 'Brush faults'), text: L('أشهر عطل: الفحم بيدوب مع الاستعمال، فالمحرك يقطّع، أو الشرار يزيد ويطلع ريحة، أو يقف خالص. غيّر الفحم بنفس المقاس، ونضّف المبدّل بورق صنفرة ناعم جدًا. دوس على الفحم.', 'The commonest fault: brushes wear down, so the motor cuts out, sparks heavily and smells, or stops. Replace them with the same size and clean the commutator with very fine paper. Tap the brushes.'), focus: 'brush', s: { spd: 2, worn: 1 } },
      { title: L('اختبار الأرميتشر والمجال', 'Testing the armature and field'), text: L('بالأفوميتر: بين كل شريحتين جنب بعض في المبدّل نفس القراءة الصغيرة. لو شريحتين قروا OL يبقى فيه ملف مقطوع، ولو صفر يبقى فيه قصر. ملفات المجال لازم يكون فيها توصيل، وبين أي ملف والجسم OL.', 'With a meter: every pair of adjacent commutator segments gives the same small reading. OL between two means an open coil; zero means a short. The field coils must show continuity, and every winding must read OL to the frame.'), focus: 'comm', s: { spd: 0, mode: 'ohm', txt: '1.8 Ω', a: 0, b: 1 } }
    ],
    apply(s){ Object.assign(st, { spd: 0, worn: 0, mode: 'off', txt: '', a: null, b: null }, s); mtr.setMode(st.mode); mtr.setText(st.txt);
      const seg = i => termOf(comm, V(Math.cos(i * .39) * .05, .04, Math.sin(i * .39) * .05)); probes.set(st.a != null ? seg(st.a) : null, st.b != null ? seg(st.b + 1) : null); },
    update(dt){ t += dt; const cut = st.worn && Math.floor(t * 2.5) % 3 === 0; const target = st.spd && !cut ? [0, 18, 30, 45][st.spd] : 0;
      w = ease(w, target, dt, st.spd ? 3 : 2); arm.rotation.y += w * dt; blade.rotation.y += w * dt;
      juice.scale.set(1, 1 + Math.min(.3, w / 100), 1); juice.rotation.y += w * dt * .2;
      brushes.forEach(b => { b.b.scale.x = st.worn ? .4 : 1; b.b.position.x = st.worn ? b.s * .015 : 0; });
      sparks.forEach((s, i) => { const on = w > 5 && Math.random() < (st.worn ? .7 : .25); const sgn = i % 2 ? 1 : -1; s.position.set(sgn * .05 + (Math.random() - .5) * .02, .13 + (Math.random() - .5) * .02, (Math.random() - .5) * .04); s.material.opacity = on ? 1 : 0; s.scale.setScalar(st.worn ? .09 : .05); });
      spdP.setText(st.spd ? 'S' + st.spd : 'OFF'); knob.rotation.z = ease(knob.rotation.z, -st.spd * .6, dt, 8);
      mtr.update(dt); probes.update(dt);
    }
  };
}

/* ---------- الغسالة ---------- */
function buildWasher(){
  const ctx = makeCtx(), { root, part } = ctx, X = makeXray(); root.add(elxBench());
  const wm = new THREE.Group(); wm.position.set(-.1, 0, -.25); root.add(wm);
  const cabM = X.wall(M(0xf4f5f7, { r: .4 }));
  wm.add(at(box(1.2, 1.25, .04, cabM), 0, .65, .5)); wm.add(at(box(.04, 1.25, 1.0, cabM), -.6, .65, 0)); wm.add(at(box(.04, 1.25, 1.0, cabM), .6, .65, 0)); wm.add(at(box(1.2, .04, 1.0, cabM), 0, 1.27, 0)); wm.add(at(box(1.2, 1.25, .04, cabM), 0, .65, -.5));
  wm.add(at(box(1.2, .03, 1.0, M(0x9aa0a6)), 0, .03, 0));
  // الباب
  const door = new THREE.Group(); door.position.set(0, .6, .53); wm.add(door);
  door.add(new THREE.Mesh(new THREE.TorusGeometry(.32, .05, 10, 40), M(0xc9ced6, { m: .7 }))); door.add(new THREE.Mesh(new THREE.CircleGeometry(.3, 40), M(0x9fc6e6, { opacity: .35 })));
  const lockM = M(0x3a3f46); wm.add(at(box(.06, .1, .05, lockM), .4, .6, .5));
  // الحلّة والدرام
  const tub = cyl(.45, .45, .7, M(0xb9c0c8, { opacity: .3 }), 40); tub.rotation.x = Math.PI / 2; wm.add(at(tub, 0, .6, 0)); X.inside(tub);
  const drum = new THREE.Group(); drum.position.set(0, .6, 0); wm.add(drum); X.inside(drum);
  const dc = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .62, 40, 1, true), M(0xdfe6ea, { m: .7, side: THREE.DoubleSide })); dc.rotation.x = Math.PI / 2; drum.add(dc);
  for(let i = 0; i < 3; i++){ const a = i / 3 * Math.PI * 2; const lf = box(.06, .1, .6, M(0xc9ced6, { m: .6 })); lf.position.set(Math.cos(a) * .36, Math.sin(a) * .36, 0); lf.rotation.z = a + Math.PI / 2; drum.add(lf); }
  const clothes = []; [0xd23a2e, 0x2a62c9, 0xe8c21a, 0x2fbf5a].forEach((c, i) => { const cl = box(.22, .08, .3, M(c, { r: .9 })); cl.position.set(Math.cos(i * 1.6) * .22, -.25 + i * .04, Math.sin(i) * .1); drum.add(cl); clothes.push(cl); });
  const water = box(.86, .3, .66, M(0x5aa9e6, { opacity: .45 })); wm.add(water); X.inside(water);
  // الأجزاء
  const heater = new THREE.Group(); heater.position.set(0, .2, 0); wm.add(heater); X.inside(heater); const hM = M(0x6c747d, { m: .7 }); heater.add(tube(CR([V(-.25, 0, .2), V(-.25, 0, -.25), V(.25, 0, -.25), V(.25, 0, .2)]), .018, hM, 30));
  const motor = new THREE.Group(); motor.position.set(0, .12, -.3); wm.add(motor); X.inside(motor); const mc = cyl(.11, .11, .3, M(0x6c747d, { m: .5 }), 20); mc.rotation.z = Math.PI / 2; motor.add(mc);
  const pul = cyl(.06, .06, .03, M(0x3a3f46), 16); pul.rotation.x = Math.PI / 2; motor.add(at(pul, .05, 0, -.17));
  const belt = tube(CR([V(.05, .12, -.47), V(.25, .45, -.48), V(.05, .95, -.48), V(-.2, .6, -.48), V(.05, .12, -.47)]), .012, M(0x1d2128), 60); wm.add(belt); X.inside(belt);
  const pump = new THREE.Group(); pump.position.set(.38, .12, .3); wm.add(pump); X.inside(pump); pump.add(cyl(.08, .08, .12, M(0x2b3038), 16)); pump.add(at(cyl(.06, .06, .05, M(0x9aa0a6), 16), 0, 0, .1)).children.at(-1).rotation.x = Math.PI / 2;
  const valve = new THREE.Group(); valve.position.set(.35, 1.12, -.4); wm.add(valve); X.inside(valve); valve.add(box(.14, .1, .1, M(0x2b3038))); valve.add(at(cyl(.03, .03, .1, M(0xd9a441, { m: .7 }), 10), 0, 0, -.1)).children.at(-1).rotation.x = Math.PI / 2;
  const hose = tube(CR([V(.35, 1.12, -.75), V(.35, 1.12, -.6), V(.35, 1.12, -.47)]), .02, M(0x9aa0a6), 10); wm.add(hose);
  const psw = new THREE.Group(); psw.position.set(-.35, 1.1, -.35); wm.add(psw); X.inside(psw); psw.add(cyl(.06, .06, .04, M(0xe9ebef), 16));   wm.add(tube(CR([V(-.35, 1.08, -.35), V(-.4, .6, -.4), V(-.3, .22, -.2)]), .006, M(0x9fd3ff, { opacity: .6 }), 20));
  const panel = makePanel(.36, .1, { bg: '#0d1b2e', fg: '#7fe0ff', font: 'bold 44px monospace' }); wm.add(at(panel.mesh, -.15, 1.15, .525));
  const pk = cyl(.06, .06, .04, M(0xc9ced6, { m: .6 }), 20); pk.rotation.x = Math.PI / 2; wm.add(at(pk, .3, 1.15, .53));
  const inF = new Flow(root, CR([V(.25, 1.12, -.95), V(.25, 1.12, -.75), V(.2, 1.0, -.4), V(-.1, .4, -.2)]), { count: 10, speed: .6, size: .02, color: 0x5aa9e6 });
  const outF = new Flow(root, CR([V(-.1, .3, -.25), V(.28, .12, .05), V(.4, .1, .4), V(.9, .05, .5)]), { count: 10, speed: .6, size: .02, color: 0x5aa9e6 });
  part('door', door, V(0, .38, .03), L('الباب وقفله', 'Door and lock'), L('الغسالة ما تشتغلش غير والقفل مقفول.', 'It will not run unless the lock is closed.'));
  part('valve', valve, V(0, .12, 0), L('محبس الدخول (سلونويد)', 'Inlet valve'), L('ملف بيفتح المية لما يتغذى.', 'A coil that opens the water when energised.'));
  part('psw', psw, V(0, .1, 0), L('مفتاح الضغط (منسوب المية)', 'Pressure switch'), L('بيحس بمنسوب المية من ضغط الهوا في الخرطوم.', 'Senses the water level from air pressure in its tube.'));
  part('heater', heater, V(0, .08, .2), L('السخان', 'Heater'), L('بيسخّن المية للغسيل الساخن.', 'Heats the water for hot washes.'));
  part('motor', motor, V(0, .15, 0), L('الموتور والسير', 'Motor and belt'), L('بيلف الدرام بسير.', 'Turns the drum by a belt.'));
  part('pump', pump, V(0, .12, .05), L('طرمبة الصرف', 'Drain pump'), L('بتطلّع المية، وقدامها فلتر.', 'Pumps the water out through a filter.'));
  part('panel', panel.mesh, V(0, .1, .02), L('لوحة التحكم', 'Control panel'), L('البوردة بتشغّل كل حاجة بالترتيب.', 'The board runs everything in order.'));
  const st = { phase: 'idle', x: 0, fault: null }; let t = 0, lvl = 0, dw = 0, hot = 0, hold = 0;
  ctx.parts.pump.tap = () => { if(st.fault === 'drain'){ st.fault = null; return L('نضّفنا فلتر الطرمبة من حتة قماش: المية نزلت.', 'Cleared a sock from the pump filter: it drains.'); } return ctx.parts.pump.desc; };
  ctx.parts.valve.tap = () => { if(st.fault === 'fill'){ st.fault = null; return L('غيّرنا ملف المحبس (كان OL): المية دخلت.', 'Replaced the open valve coil: water flows in.'); } return ctx.parts.valve.desc; };
  const xr = () => { st.x ^= 1; X.set(st.x); return st.x ? L('شايف من جوه.', 'Inside view.') : L('رجعنا للشكل العادي.', 'Back to normal.'); };
  return {
    ...ctx, view: V(.1, .45, 1.5), sway: true, xray: { get on(){ return !!st.x; }, toggle(){ return xr(); } },
    hint: L('زرار «شوف الأسلاك» يوريك من جوه · دوس على أي جزء', 'The wiring button shows the inside · tap any part'),
    steps: [
      { title: L('أنواع الغسالات', 'Types of washing machine'), text: L('العادية: موتور وتايمر بيعكس الاتجاه. النص أوتوماتيك: حوضين، واحد للغسيل وواحد للعصر بموتورين. الأوتوماتيك (اللي قدامك): بوردة بتعمل كل الخطوات لوحدها. دوس على «شوف الأسلاك» تشوف من جوه.', 'Ordinary: a motor and a timer that reverses it. Semi-automatic: two tubs, one to wash and one to spin, with two motors. Automatic (shown): a board runs every stage. Use the wiring button to see inside.'), s: { x: 0 } },
      { title: L('الأجزاء من جوه', 'The parts inside'), text: L('الحلّة الثابتة وجواها الدرام بيلف، والموتور تحت بيلفه بسير. محبس الدخول فوق، ومفتاح الضغط بيعرف منسوب المية، والسخان تحت الحلّة، وطرمبة الصرف تحت قدّام، وقفل الباب جنب الباب.', 'The fixed tub holds the turning drum, driven by a belt from the motor below. The inlet valve is at the top, the pressure switch reads the level, the heater sits under the tub, the drain pump is low at the front and the door lock is by the door.'), focus: 'motor', s: { x: 1 } },
      { title: L('الملو', 'Filling'), text: L('القفل يقفل، والبوردة تفتح محبس الدخول، والمية تدخل لحد ما مفتاح الضغط يقول إن المنسوب كفاية. لو الغسيل ساخن، السخان يشتغل لحد ما حساس الحرارة (NTC) يوصل للدرجة.', 'The door locks, the board opens the inlet valve and water flows until the pressure switch reports the level. For a hot wash the heater runs until the NTC sensor reaches the set temperature.'), focus: 'valve', s: { x: 1, phase: 'fill' } },
      { title: L('الغسيل', 'Washing'), text: L('الموتور يلف الدرام شوية يمين وشوية شمال عشان الهدوم تتقلب في المية والصابون، والريش جوه الدرام بترفع الهدوم وتنزّلها.', 'The motor turns the drum a little each way so the clothes tumble through the water and detergent; the lifters inside raise and drop them.'), focus: 'motor', s: { x: 1, phase: 'wash' } },
      { title: L('الصرف والعصر', 'Draining and spinning'), text: L('طرمبة الصرف تطلّع المية، وبعدين الدرام يلف بسرعة عالية جدًا (800 لـ 1400 لفة) عشان يعصر الهدوم.', 'The drain pump empties the water, then the drum spins very fast (800–1400 rpm) to wring the clothes.'), focus: 'pump', s: { x: 1, phase: 'spin' } },
      { title: L('عطل: المية مش بتدخل', 'Fault: no water'), text: L('اتأكد إن حنفية المية مفتوحة والضغط كويس، ونضّف شبكة المحبس. بعدين قيس ملف المحبس بالأفوميتر: حوالي 4 كيلو أوم، ولو OL يبقى الملف مقطوع ويتغيّر. دوس على المحبس.', 'Check the tap is open and the pressure is good, and clean the valve mesh. Then measure the valve coil: about 4 kΩ; OL means an open coil to replace. Tap the valve.'), focus: 'valve', s: { x: 1, phase: 'fill', fault: 'fill' } },
      { title: L('عطل: المية مش بتنزل', 'Fault: will not drain'), text: L('أغلب الوقت الفلتر اللي قدام الطرمبة مسدود بعملة أو شراب. افتحه ونضّفه (حط صينية الأول). لو لسه، قيس ملف الطرمبة (حوالي 150 لـ 200 أوم) واتأكد إن ريشتها بتلف. دوس على الطرمبة.', 'Usually the filter in front of the pump is blocked by a coin or sock. Open and clean it (with a tray ready). If it still fails, measure the pump coil (about 150–200 Ω) and check the impeller turns. Tap the pump.'), focus: 'pump', s: { x: 1, phase: 'spin', fault: 'drain' } }
    ],
    apply(s){ Object.assign(st, { phase: 'idle', x: 0, fault: null }, s); X.set(st.x); lvl = st.phase === 'spin' ? .9 : st.phase === 'wash' ? 1 : 0; t = 0; hold = 0; },
    update(dt){ t += dt; const ph = st.phase;
      if(ph === 'fill' && st.fault !== 'fill'){ if(lvl < 1) lvl = Math.min(1, lvl + dt * .25); else { hold += dt; if(hold > 3){ hold = 0; lvl = 0; } } }
      if(ph === 'spin' && st.fault !== 'drain'){ if(lvl > 0) lvl = Math.max(0, lvl - dt * .3); else { hold += dt; if(hold > 6){ hold = 0; lvl = .9; } } }
      const h = .05 + .3 * lvl; water.scale.set(1, Math.max(.01, h / .3), 1); water.position.set(0, .2 + h / 2, 0); water.visible = lvl > .02 && st.x;
      const target = ph === 'wash' ? (Math.floor(t / 2.5) % 2 ? 3 : -3) : ph === 'spin' && lvl <= .05 && st.fault !== 'drain' ? 22 : 0;
      dw = ease(dw, target, dt, ph === 'spin' ? 1 : 3); drum.rotation.z += dw * dt; pul.rotation.z += dw * dt * 6;
      inF.target = ph === 'fill' && st.fault !== 'fill' && lvl < 1 ? 1 : 0; inF.update(dt); outF.target = ph === 'spin' && st.fault !== 'drain' && lvl > .02 ? 1 : 0; outF.update(dt);
      hot = ph === 'fill' && lvl > .5 ? 1 : 0; setGlow(hM, hot * .9, 1, .25, .05); hM.color.setHex(hot ? 0xd2603a : 0x6c747d);
      setGlow(lockM, ph !== 'idle' ? .8 : 0, 1, .3, .1);
      panel.setText(st.fault === 'fill' ? 'E01' : st.fault === 'drain' ? 'E21' : ph === 'idle' ? '1:25' : ph === 'fill' ? 'FILL' : ph === 'wash' ? 'WASH' : 'SPIN');
    }
  };
}

/* ================= برنامج الهيدروليك: الدفعة الأولى ================= */
const OIL_P = 0xe0453a, OIL_T = 0x3c7be0, OIL_S = 0xf2b51e;
function hoseOn(root, pts, col = 0x1d2128, r = .025){ const c = CR(pts); const m = tube(c, r, M(col, { r: .6 }), 60); root.add(m); return c; }
function oilFlow(root, curve, color, n = 14, speed = .9){ return new Flow(root, curve, { color, count: n, speed, size: .024 }); }
// رموز ISO 1219 مبسطة على لوحة
function drawSym(x, kind, cx, cy, s = 1, hl = -1){
  x.save(); x.translate(cx, cy); x.scale(s, s); x.strokeStyle = '#111'; x.fillStyle = '#111'; x.lineWidth = 3; x.lineCap = 'round';
  const tri = (ax, ay, bx, by, cx2, cy2) => { x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.lineTo(cx2, cy2); x.closePath(); x.fill(); };
  const spring = (x0, y0, x1) => { x.beginPath(); x.moveTo(x0, y0); const n = 6, w = (x1 - x0) / n; for(let i = 0; i < n; i++) x.lineTo(x0 + w * (i + .5), y0 + (i % 2 ? -8 : 8)); x.lineTo(x1, y0); x.stroke(); };
  if(kind === 'pump' || kind === 'motor'){ x.beginPath(); x.arc(0, 0, 30, 0, 7); x.stroke(); if(kind === 'pump') tri(0, -30, -10, -12, 10, -12); else tri(0, -12, -10, -30, 10, -30); x.beginPath(); x.moveTo(0, -30); x.lineTo(0, -50); x.moveTo(0, 30); x.lineTo(0, 50); x.stroke(); }
  else if(kind === 'tank'){ x.beginPath(); x.moveTo(-26, -10); x.lineTo(-26, 10); x.lineTo(26, 10); x.lineTo(26, -10); x.stroke(); x.beginPath(); x.moveTo(0, -30); x.lineTo(0, 6); x.stroke(); }
  else if(kind === 'relief'){ x.strokeRect(-26, -30, 52, 60); x.beginPath(); x.moveTo(-10, 22); x.lineTo(-10, -22); x.stroke(); tri(-10, -26, -17, -14, -3, -14); spring(4, 0, 34); x.beginPath(); x.setLineDash([5, 5]); x.moveTo(-26, 20); x.lineTo(-40, 20); x.lineTo(-40, -2); x.stroke(); x.setLineDash([]); x.beginPath(); x.moveTo(-10, -30); x.lineTo(-10, -48); x.moveTo(-10, 30); x.lineTo(-10, 48); x.stroke(); }
  else if(kind === 'check'){ x.beginPath(); x.arc(0, 4, 10, 0, 7); x.stroke(); x.beginPath(); x.moveTo(-14, -14); x.lineTo(0, -6); x.lineTo(14, -14); x.stroke(); x.beginPath(); x.moveTo(0, -30); x.lineTo(0, -6); x.moveTo(0, 14); x.lineTo(0, 30); x.stroke(); }
  else if(kind === 'throttle'){ x.beginPath(); x.arc(-26, 0, 22, -.6, .6); x.stroke(); x.beginPath(); x.arc(26, 0, 22, Math.PI - .6, Math.PI + .6); x.stroke(); x.beginPath(); x.moveTo(0, -36); x.lineTo(0, 36); x.stroke(); x.beginPath(); x.moveTo(-16, 16); x.lineTo(16, -16); x.stroke(); tri(18, -18, 6, -14, 14, -6); }
  else if(kind === 'filter'){ x.beginPath(); x.moveTo(0, -24); x.lineTo(24, 0); x.lineTo(0, 24); x.lineTo(-24, 0); x.closePath(); x.stroke(); x.setLineDash([4, 4]); x.beginPath(); x.moveTo(-24, 0); x.lineTo(24, 0); x.stroke(); x.setLineDash([]); }
  else if(kind === 'gauge'){ x.beginPath(); x.arc(0, 0, 20, 0, 7); x.stroke(); x.beginPath(); x.moveTo(-12, 12); x.lineTo(12, -12); x.stroke(); tri(14, -14, 4, -12, 12, -4); }
  else if(kind === 'cyl' || kind === 'cyl1'){ x.strokeRect(-60, -18, 120, 36); x.fillRect(-8, -18, 6, 36); x.fillRect(-2, -4, 86, 8); if(kind === 'cyl1') spring(4, 0, 56); x.beginPath(); x.moveTo(-50, 18); x.lineTo(-50, 34); if(kind === 'cyl'){ x.moveTo(50, 18); x.lineTo(50, 34); } x.stroke(); }
  else if(kind === 'v43' || kind === 'v42'){ const n = kind === 'v43' ? 3 : 2, w = 46; const x0 = -w * n / 2;
    for(let i = 0; i < n; i++){ if(i === hl){ x.fillStyle = 'rgba(240,180,41,.45)'; x.fillRect(x0 + i * w, -24, w, 48); x.fillStyle = '#111'; } x.strokeRect(x0 + i * w, -24, w, 48); }
    const bx = i => x0 + i * w; const arr = (ax, ay, bx2, by) => { x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx2, by); x.stroke(); const a = Math.atan2(by - ay, bx2 - ax); tri(bx2, by, bx2 - 9 * Math.cos(a - .4), by - 9 * Math.sin(a - .4), bx2 - 9 * Math.cos(a + .4), by - 9 * Math.sin(a + .4)); };
    const L0 = bx(0); arr(L0 + 13, 24, L0 + 13, -24); arr(L0 + 33, -24, L0 + 33, 24);
    const R0 = bx(n - 1); arr(R0 + 13, 24, R0 + 33, -24); arr(R0 + 13, -24, R0 + 33, 24);
    if(n === 3){ const C0 = bx(1); [[13, 24], [33, 24], [13, -24], [33, -24]].forEach(([a, b]) => { x.beginPath(); x.moveTo(C0 + a, b); x.lineTo(C0 + a, b * .55); x.moveTo(C0 + a - 6, b * .55); x.lineTo(C0 + a + 6, b * .55); x.stroke(); }); }
    spring(x0 - 34, 0, x0); x.beginPath(); x.moveTo(-x0, 0); x.lineTo(-x0 + 24, 0); x.moveTo(-x0 + 24, -10); x.lineTo(-x0 + 24, 10); x.stroke();
    const mid = n === 3 ? bx(1) : bx(1); x.font = 'bold 16px sans-serif'; x.textAlign = 'center'; [['A', 13, -36], ['B', 33, -36], ['P', 13, 42], ['T', 33, 42]].forEach(([t, a, b]) => x.fillText(t, mid + a, b)); }
  x.restore();
}
function symBoard(w, h, list, title){
  const c = makeCanvas(w, h, 512); const draw = (hl = {}) => c.draw((x, W, H) => { x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, W, H); x.strokeStyle = '#2b3038'; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6);
    x.fillStyle = '#16302a'; x.font = 'bold 26px "IBM Plex Sans Arabic", Tahoma'; x.textAlign = 'center'; x.fillText(title, W / 2, 34);
    const cols = Math.min(list.length, 4), rows = Math.ceil(list.length / cols); list.forEach((it, i) => { const cx = W * (i % cols + .5) / cols, cy = 70 + (H - 90) * (Math.floor(i / cols) + .45) / rows;
      drawSym(x, it.k, cx, cy - 10, .8, hl[it.k] ?? -1); x.fillStyle = '#16302a'; x.font = 'bold 19px "IBM Plex Sans Arabic", Tahoma'; x.textAlign = 'center'; x.fillText(it.t, cx, cy + 58); }); });
  draw(); return { mesh: c.mesh, draw };
}
function makeTank(w = 1.2, h = .55, d = .7){
  const g = new THREE.Group(); const sh = M(0x5f7d8f, { m: .5, r: .45 });
  g.add(at(box(w, .03, d, sh), 0, .015, 0)); g.add(at(box(w, h, .03, sh), 0, h / 2, -d / 2)); g.add(at(box(.03, h, d, sh), -w / 2, h / 2, 0)); g.add(at(box(.03, h, d, sh), w / 2, h / 2, 0)); g.add(at(box(w, .03, d, sh), 0, h, 0));
  g.add(at(box(w, h, .02, M(0x9fc6e6, { opacity: .22 })), 0, h / 2, d / 2));
  const oil = box(w - .06, h * .65, d - .06, M(0xd9a441, { opacity: .55 })); g.add(at(oil, 0, h * .65 / 2 + .02, 0));
  g.add(at(box(.03, h * .55, d - .1, M(0x4d6676, { opacity: .7 })), .05, h * .3, 0));
  return { group: g, oil, top: h };
}
function makeEMotor(len = .45, r = .14){
  const g = new THREE.Group(); const b = cyl(r, r, len, M(0x2a62c9, { r: .45 }), 24); b.rotation.z = Math.PI / 2; g.add(b);
  for(let i = 0; i < 8; i++){ const f = box(len * .8, .015, .04, M(0x2a62c9, { r: .45 })); const a = i / 8 * Math.PI * 2; f.position.set(0, Math.cos(a) * (r + .01), Math.sin(a) * (r + .01)); f.rotation.x = a; g.add(f); }
  g.add(at(box(.14, .1, .14, M(0x2a62c9)), 0, r + .05, 0)); const fan = cyl(r * .9, r * .9, .04, M(0x1d2128), 20); fan.rotation.z = Math.PI / 2; g.add(at(fan, -len / 2 - .02, 0, 0));
  const shaft = new THREE.Group(); shaft.position.x = len / 2; g.add(shaft); const s = cyl(.025, .025, .14, M(0xc9ced6, { m: .9 }), 10); s.rotation.z = Math.PI / 2; shaft.add(at(s, .07, 0, 0)); shaft.add(at(box(.03, .05, .012, M(0xd23a2e)), .12, .03, 0));
  return { group: g, shaft };
}
function makeHCyl(L = 1.0, R = .1, single = false){
  const g = new THREE.Group();
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L, 28, 1, true), M(0xc9ced6, { m: .6, opacity: .3, side: THREE.DoubleSide })); bar.rotation.z = Math.PI / 2; bar.position.x = L / 2; g.add(bar);
  [0, L].forEach(x0 => { const cap = cyl(R * 1.18, R * 1.18, .06, M(0x6c747d, { m: .6 }), 24); cap.rotation.z = Math.PI / 2; g.add(at(cap, x0, 0, 0)); });
  const capOil = cyl(R * .94, R * .94, 1, M(OIL_P, { opacity: .55 }), 20); capOil.rotation.z = Math.PI / 2; g.add(capOil);
  const rodOil = cyl(R * .94, R * .94, 1, M(OIL_T, { opacity: .45 }), 20); rodOil.rotation.z = Math.PI / 2; g.add(rodOil);
  const pist = new THREE.Group(); g.add(pist); const pc = cyl(R * .96, R * .96, .06, M(0x3a3f46, { m: .6 }), 24); pc.rotation.z = Math.PI / 2; pist.add(pc);
  const rod = cyl(R * .42, R * .42, L, M(0xe9ebef, { m: .9, r: .2 }), 16); rod.rotation.z = Math.PI / 2; pist.add(at(rod, L / 2, 0, 0)); pist.add(at(box(.08, .08, .08, M(0x6c747d)), L + .03, 0, 0));
  let spr = null; if(single){ spr = new THREE.Group(); g.add(spr); }
  const ports = { A: V(.07, R * 1.2, 0), B: V(L - .07, R * 1.2, 0) };
  [ports.A, single ? null : ports.B].forEach(p => { if(p) g.add(at(cyl(.025, .025, .06, M(0xd9a441, { m: .7 }), 10), p.x, p.y - .02, 0)); });
  let x = .06, tx = .06, lastS = -1; const span = L - .16;
  return { group: g, ports, L, set(f){ tx = .06 + span * f; }, get f(){ return (x - .06) / span; }, rod: pist,
    colors(a, b){ capOil.material.color.setHex(a); rodOil.material.color.setHex(b); capOil.material.opacity = a === OIL_P ? .6 : .4; rodOil.material.opacity = b === OIL_P ? .6 : .4; },
    update(dt, speed = 1){ const d = tx - x, st = Math.sign(d) * Math.min(Math.abs(d), dt * .5 * speed); x += st; pist.position.x = x; capOil.scale.y = Math.max(.01, x - .03); capOil.position.x = (x + .03) / 2; rodOil.scale.y = Math.max(.01, L - .03 - x); rodOil.position.x = (x + L - .03) / 2;
      if(spr && Math.abs(lastS - x) > .002){ lastS = x; spr.clear(); spr.add(tube(helixX(x + .03, L - .03, R * .7, 7), .008, M(0x9aa0a6, { m: .8 }), 120)); } return Math.abs(d) > .002; } };
}
function helixX(x0, x1, r, turns){ const pts = []; const n = Math.round(turns * 20); for(let i = 0; i <= n; i++){ const f = i / n, a = f * turns * Math.PI * 2; pts.push(V(x0 + (x1 - x0) * f, r * Math.cos(a), r * Math.sin(a))); } return CR(pts); }
function makeGear(n, r, th, col){
  const sh = new THREE.Shape(); const ro = r, ri = r * .8;
  for(let i = 0; i < n * 2; i++){ const a0 = i / (n * 2) * Math.PI * 2, a1 = (i + 1) / (n * 2) * Math.PI * 2, rr = i % 2 ? ri : ro; if(i === 0) sh.moveTo(Math.cos(a0) * rr, Math.sin(a0) * rr); else sh.lineTo(Math.cos(a0) * rr, Math.sin(a0) * rr); sh.lineTo(Math.cos(a1) * rr, Math.sin(a1) * rr); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: false }); geo.translate(0, 0, -th / 2);
  const m = new THREE.Mesh(geo, M(col, { m: .7, r: .3 })); const g = new THREE.Group(); g.add(m); g.add(cyl(r * .2, r * .2, th + .04, M(0xc9ced6, { m: .9 }), 12).rotateX(Math.PI / 2)); return g;
}

/* ---------- وحدة القدرة الهيدروليكية ---------- */
function buildHPU(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const tk = makeTank(1.3, .55, .75); tk.group.position.set(-.35, 0, -.25); root.add(tk.group);
  const mot = makeEMotor(.5, .15); mot.group.position.set(-.75, .55 + .2, -.25); root.add(mot.group);
  const pump = new THREE.Group(); pump.position.set(-.3, .55 + .2, -.25); root.add(pump);
  pump.add(box(.2, .2, .22, M(0x6c747d, { m: .6 }))); const pg = makeGear(10, .07, .05, 0xc9a24a); pg.position.set(0, 0, .112); pump.add(pg);
  pump.add(at(label(L('المضخة', 'Pump'), '#ffffff', .055), 0, .17, 0));
  const strainer = new THREE.Group(); strainer.position.set(-.3, .12, -.25); root.add(strainer); strainer.add(cyl(.06, .06, .14, M(0x9aa0a6, { m: .5 }), 16));
  root.add(tube(CR([V(-.3, .2, -.25), V(-.3, .6, -.25), V(-.3, .66, -.25)]), .02, M(0x6c747d, { m: .6 }), 10));
  const man = new THREE.Group(); man.position.set(.15, .78, -.25); root.add(man); man.add(box(.3, .14, .2, M(0x9aa0a6, { m: .6 })));
  const rv = new THREE.Group(); rv.position.set(.15, .9, -.25); root.add(rv); const rvb = cyl(.045, .045, .2, M(0xc9a24a, { m: .6 }), 16); rv.add(at(rvb, 0, .08, 0)); const knob = cyl(.06, .06, .04, M(0x1d2128), 16); rv.add(at(knob, 0, .2, 0));
  const gauge = makeGauge('#d23a2e', 0, 160, [0, 40, 80, 120, 160], 'bar'); gauge.group.scale.setScalar(.55); gauge.group.position.set(.45, 1.05, -.2); root.add(gauge.group);
  root.add(tube(CR([V(.35, .8, -.25), V(.45, .85, -.22), V(.45, .9, -.22)]), .012, M(0x9aa0a6), 10));
  const filt = new THREE.Group(); filt.position.set(.55, .62, -.05); root.add(filt); filt.add(cyl(.07, .07, .2, M(0x2a62c9, { r: .45 }), 16)); filt.add(at(label(L('فلتر الراجع', 'Return filter'), '#ffffff', .05), 0, .18, 0));
  const brt = cyl(.05, .05, .07, M(0x1d2128), 14); brt.position.set(-.85, .59, -.4); root.add(brt);
  const sight = box(.06, .2, .02, M(0xffffff, { opacity: .4 })); sight.position.set(.1, .3, .14); root.add(sight);
  // خطوط الضغط والراجع لحد مخارج P وT
  const pOut = V(1.35, .82, -.25), tIn = V(1.35, .62, -.05);
  root.add(at(box(.18, .4, .3, M(0x3a3f46)), 1.4, .7, -.15)); root.add(at(label('P', '#ff8a7a', .1), 1.4, .95, -.25)); root.add(at(label('T', '#9cc2ff', .1), 1.4, .95, -.02));
  const cP = hoseOn(root, [V(.3, .78, -.25), V(.8, .82, -.3), pOut], OIL_P, .02);
  const cT = hoseOn(root, [tIn, V(.9, .6, -.02), V(.55, .74, -.05)], OIL_T, .02);
  const cT2 = CR([V(.55, .52, -.05), V(.55, .5, -.05), V(.5, .4, -.05)]);
  const cRel = CR([V(.15, .95, -.25), V(.3, 1.0, -.1), V(.55, .76, -.05), V(.55, .5, -.05), V(.4, .3, -.05)]); root.add(tube(cRel, .015, M(0x3a3f46), 40));
  const fS = oilFlow(root, CR([V(-.3, .1, -.25), V(-.3, .4, -.25), V(-.3, .7, -.25)]), OIL_S, 8, .5);
  const fP = oilFlow(root, cP, OIL_P, 16), fR = oilFlow(root, cRel, OIL_T, 14), fT = oilFlow(root, CR([tIn, V(.9, .6, -.02), V(.55, .74, -.05), V(.55, .5, -.05), V(.45, .3, -.05)]), OIL_T, 14);
  const sb = symBoard(1.0, .62, [{ k: 'pump', t: L('مضخة', 'Pump') }, { k: 'relief', t: L('صمام أمان', 'Relief valve') }, { k: 'filter', t: L('فلتر', 'Filter') }, { k: 'gauge', t: L('مانومتر', 'Gauge') }, { k: 'tank', t: L('خزان', 'Tank') }, { k: 'motor', t: L('محرك هيدروليك', 'Hyd. motor') }], L('رموز وحدة القدرة', 'Power unit symbols'));
  sb.mesh.position.set(.95, 1.15, -1.5); root.add(sb.mesh);
  part('tank', tk.group, V(0, .65, .4), L('الخزان', 'Reservoir'), L('بيشيل الزيت ويبرّده ويسيب الهوا والشوايب تترسب.', 'Stores, cools and settles the oil.'));
  part('motor', mot.group, V(0, .25, 0), L('المحرك الكهربائي', 'Electric motor'), L('بيلف المضخة.', 'Drives the pump.'));
  part('pump', pump, V(0, .2, 0), L('المضخة', 'Pump'), L('بتسحب الزيت وتدفعه في الخط.', 'Draws oil in and pushes it into the line.'));
  part('rv', rv, V(0, .3, 0), L('صمام الأمان (تحديد الضغط)', 'Relief valve'), L('دوس على المسمار تغيّر ضبط الضغط.', 'Tap the knob to change the setting.'));
  part('gauge', gauge.group, V(0, .3, 0), L('المانومتر', 'Pressure gauge'), L('بيقرا ضغط الخط بالبار.', 'Reads line pressure in bar.'));
  part('filt', filt, V(0, .25, 0), L('فلتر الراجع', 'Return filter'), L('بينضّف الزيت الراجع للخزان.', 'Cleans the oil returning to the tank.'));
  part('sym', sb.mesh, V(0, .36, 0), L('الرموز', 'Symbols'), L('رسم كل جزء بالرموز القياسية.', 'Each part drawn as a standard symbol.'));
  const st = { run: 0, set: 70, load: 0, rel: 0 }; let t = 0, pr = 0;
  ctx.parts.rv.tap = () => { st.set = st.set === 70 ? 100 : st.set === 100 ? 40 : 70; return L(`ضبط صمام الأمان = ${st.set} بار`, `Relief setting = ${st.set} bar`); };
  ctx.parts.motor.tap = () => { st.run ^= 1; return st.run ? L('شغّلنا المحرك.', 'Motor on.') : L('وقفنا المحرك.', 'Motor off.'); };
  return {
    ...ctx, view: V(.1, .55, 1.4), sway: true, hint: L('دوس على المحرك أو صمام الأمان', 'Tap the motor or relief valve'),
    steps: [
      { title: L('وحدة القدرة الهيدروليكية', 'The hydraulic power unit'), text: L('دي قلب أي نظام هيدروليك: خزان زيت، ومحرك كهربا بيلف مضخة، وصمام أمان بيحدد أقصى ضغط، ومانومتر، وفلتر. بتطلّع زيت مضغوط من مخرج P، والزيت بيرجع من T.', 'The heart of any hydraulic system: an oil tank, an electric motor driving a pump, a relief valve setting the maximum pressure, a gauge and a filter. Pressurised oil leaves at P and returns at T.'), s: { run: 1 } },
      { title: L('الخزان', 'The reservoir'), text: L('الخزان بيشيل الزيت، وبيبرّده، والحاجز اللي في النص بيفصل الراجع السخن عن السحب عشان الهوا والشوايب تترسب. فيه بين المستوى (الشباك) وفتحة تهوية بفلتر. الزيت لازم يكون بين علامتي MIN وMAX.', 'It stores and cools the oil; the middle baffle separates the warm return from the suction so air and dirt settle out. It has a sight glass and a filtered breather. Keep the oil between MIN and MAX.'), focus: 'tank', s: { run: 0 } },
      { title: L('المحرك والمضخة', 'Motor and pump'), text: L('المحرك بيلف المضخة، والمضخة بتسحب الزيت (النقط الصفرا) من الخزان من خلال مصفاة، وتدفعه في خط الضغط (الأحمر). المضخة بتعمل تدفق، والضغط بيتولد لما الزيت يلاقي مقاومة.', 'The motor turns the pump, which draws oil (yellow) through a strainer and pushes it into the pressure line (red). A pump makes flow; pressure builds only when the flow meets resistance.'), focus: 'pump', s: { run: 1 } },
      { title: L('صمام الأمان والمانومتر', 'Relief valve and gauge'), text: L('لما مفيش حاجة بتاخد الزيت، الضغط بيعلى لحد ضبط صمام الأمان (هنا 70 بار)، فيفتح ويرجّع الزيت للخزان (الأزرق) عشان المواسير والمضخة ما تتفرتكش. دوس على المسمار تغيّر الضبط وشوف المانومتر.', 'With nothing taking the oil, pressure rises to the relief setting (70 bar here); the valve opens and dumps oil to tank (blue) so nothing bursts. Tap the knob to change the setting and watch the gauge.'), focus: 'rv', s: { run: 1, rel: 1 } },
      { title: L('الراجع والفلتر', 'Return and filter'), text: L('الزيت اللي راجع من النظام بيعدّي على فلتر الراجع قبل الخزان. الفلتر المسدود بيرفع الضغط في الراجع وبيسخّن الزيت، فبيتغيّر حسب جدول الصيانة أو لما مؤشره يحمر.', 'Oil returning from the system passes the return filter before the tank. A blocked filter raises back-pressure and heats the oil, so change it on schedule or when its indicator turns red.'), focus: 'filt', s: { run: 1, load: 1 } },
      { title: L('الرموز وطريقة الرسم', 'Symbols and drawing'), text: L('في الرسومات بنرسم كل جزء برمز قياسي (ISO 1219): المضخة دايرة جواها مثلث طالع لبرّه، والمحرك الهيدروليكي المثلث داخل لجوه، وصمام الأمان مربع فيه سهم وياي، والفلتر معيّن، والخزان شكل U. وحدة القدرة كلها بتترسم: خزان ← مضخة ← خط فيه مانومتر وصمام أمان راجع للخزان.', 'Drawings use standard ISO 1219 symbols: a pump is a circle with an outward triangle, a motor has the triangle inward, a relief valve is a square with an arrow and spring, a filter is a diamond and the tank a U shape. A power unit is drawn tank → pump → line with gauge and relief valve back to tank.'), focus: 'sym', s: { run: 1 } },
      { title: L('السلامة في الهيدروليك', 'Hydraulic safety'), text: L('ما تفكّش أي خرطوم والنظام تحت ضغط: اقفل المضخة وفرّغ الضغط الأول. ما تدوّرش على تسريب بإيدك (رشة الزيت تحت ضغط بتخترق الجلد)، استخدم كرتونة. البس نضارة وجوانتي، وامسح الزيت المدلوق فورًا عشان محدش يتزحلق.', 'Never loosen a hose under pressure: stop the pump and release the pressure first. Never feel for leaks by hand (a pressurised jet can pierce skin); use card. Wear goggles and gloves, and wipe up spills at once.'), focus: 'gauge', s: { run: 0 } }
    ],
    apply(s){ Object.assign(st, { run: 0, load: 0, rel: 0 }, s); },
    update(dt){ t += dt; const r = st.run;
      mot.shaft.rotation.x += r ? dt * 25 : 0; pg.rotation.z += r ? dt * 12 : 0;
      const target = r ? (st.load ? 25 : st.set) : 0; pr = ease(pr, target, dt, 1.5); gauge.set(pr); gauge.update(dt);
      const relOpen = r && !st.load && pr > st.set * .9;
      fS.target = r ? 1 : 0; fP.target = r && st.load ? 1 : 0; fR.target = relOpen ? 1 : 0; fT.target = r && st.load ? 1 : 0;
      [fS, fP, fR, fT].forEach(f => f.update(dt)); knob.rotation.y = st.set / 30; setGlow(rvb.material, relOpen ? .3 : 0, 1, .6, .1);
    }
  };
}

/* ---------- أنواع المضخات ---------- */
function buildPumps(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const mk = (x, name) => { const g = new THREE.Group(); g.position.set(x, .55, -.25); root.add(g); g.add(new THREE.Mesh(new THREE.CylinderGeometry(.36, .36, .14, 40), M(0x9aa0a6, { m: .5, opacity: .25 })).rotateX(Math.PI / 2)); g.add(at(label(name, '#ffffff', .07), 0, .5, 0)); g.add(at(box(.5, .55 - .36, .2, M(0x6c747d, { m: .5 })), 0, -.36 - (.55 - .36) / 2 + .0, 0)); return g; };
  // ترسية
  const gp = mk(-1.1, L('مضخة ترسية', 'Gear pump'));
  const g1 = makeGear(12, .16, .1, 0xc9a24a), g2 = makeGear(12, .16, .1, 0xb08a3a); g1.position.set(-.14, 0, 0); g2.position.set(.14, 0, 0); g2.rotation.z = Math.PI / 12; gp.add(g1); gp.add(g2);
  gp.add(at(label(L('دخول', 'In'), '#ffd34d', .05), 0, -.3, .1)); gp.add(at(label(L('خروج', 'Out'), '#ff8a7a', .05), 0, .3, .1));
  const gOil = []; for(let i = 0; i < 16; i++){ const m = new THREE.Mesh(new THREE.SphereGeometry(.02, 8, 6), new THREE.MeshBasicMaterial({ color: OIL_S, toneMapped: false })); m.userData = { ph: i / 16, s: i % 2 }; gp.add(m); gOil.push(m); }
  // ريشية
  const vp = mk(0, L('مضخة ريشية', 'Vane pump'));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.27, .025, 8, 40), M(0x6c747d, { m: .6 })); vp.add(ring);
  const rotor = new THREE.Group(); rotor.position.x = -.05; vp.add(rotor); rotor.add(cyl(.17, .17, .1, M(0xc9a24a, { m: .6 }), 32).rotateX(Math.PI / 2));
  const vanes = []; for(let i = 0; i < 8; i++){ const v = box(.1, .02, .09, M(0x3a3f46, { m: .6 })); vp.add(v); vanes.push(v); }
  // مكبسية
  const pp = mk(1.1, L('مضخة مكبسية', 'Piston pump'));
  const sw = box(.04, .4, .3, M(0x3a3f46, { m: .6 })); sw.position.x = -.2; sw.rotation.z = .25; pp.add(sw);
  const barrel = new THREE.Group(); pp.add(barrel); barrel.add(cyl(.2, .2, .26, M(0xc9a24a, { m: .5, opacity: .5 }), 28).rotateZ(Math.PI / 2));
  const pist = []; for(let i = 0; i < 6; i++){ const p = cyl(.03, .03, .22, M(0xe9ebef, { m: .9 }), 10); p.rotation.z = Math.PI / 2; barrel.add(p); pist.push({ p, a: i / 6 * Math.PI * 2 }); }
  part('gear', gp, V(0, .38, .1), L('المضخة الترسية', 'Gear pump'), L('ترسين معشّقين بيحبسوا الزيت بين السنون والجسم.', 'Two meshing gears carry oil between teeth and casing.'));
  part('vane', vp, V(0, .38, .1), L('المضخة الريشية', 'Vane pump'), L('ريش بتنزلق في دوّار لا مركزي.', 'Vanes slide in an off-centre rotor.'));
  part('piston', pp, V(0, .38, .1), L('المضخة المكبسية', 'Piston pump'), L('مكابس بتروح وتيجي بفعل صحن مايل.', 'Pistons stroke against a tilted swash plate.'));
  const st = { run: 1, tilt: .25 }; let t = 0;
  ctx.parts.piston.tap = () => { st.tilt = st.tilt > .2 ? .1 : st.tilt > .05 ? 0 : .25; return st.tilt ? L(`زاوية الصحن ${Math.round(st.tilt * 57)}°: التدفق ${st.tilt > .2 ? 'كبير' : 'قليل'}.`, `Swash angle ${Math.round(st.tilt * 57)}°: ${st.tilt > .2 ? 'high' : 'low'} flow.`) : L('الصحن مستوي: التدفق صفر.', 'Plate flat: zero flow.'); };
  return {
    ...ctx, view: V(.05, .45, 1.5), sway: true, hint: L('دوس على المضخة المكبسية تغيّر زاوية الصحن', 'Tap the piston pump to change the swash angle'),
    steps: [
      { title: L('أنواع المضخات', 'Pump types'), text: L('المضخات الهيدروليكية كلها إزاحة موجبة: كل لفة بتنقل كمية زيت ثابتة. أشهرها: الترسية، والريشية، والمكبسية. فيه مضخات تدفقها ثابت، ومضخات تدفقها متغيّر.', 'Hydraulic pumps are positive displacement: each turn moves a fixed volume. The main types are gear, vane and piston. Some have fixed displacement, others variable.'), s: {} },
      { title: L('المضخة الترسية', 'The gear pump'), text: L('ترسين معشّقين بيلفوا عكس بعض. الزيت بيدخل من تحت، ويتحبس بين السنون وجسم المضخة ويلف حوالين الترسين (النقط)، ويطلع من فوق. بسيطة ورخيصة وتستحمل الوساخة، بس صوتها عالي وتدفقها ثابت.', 'Two meshing gears turn in opposite directions. Oil enters below, is trapped between the teeth and the casing, carried round (dots) and pushed out above. Simple, cheap and tolerant of dirt, but noisy and fixed-flow.'), focus: 'gear', s: {} },
      { title: L('المضخة الريشية', 'The vane pump'), text: L('دوّار فيه مجاري بتنزلق فيها ريش، وهو مركّب لا مركزي جوه حلقة. الريش بتطلع وتدخل مع اللف، فالمسافة بينها بتكبر عند الدخول وتصغر عند الخروج. صوتها هادي، ولو الحلقة اتحركت التدفق بيتغيّر.', 'A rotor with sliding vanes sits off-centre in a ring. The vanes move in and out as it turns, so the chambers grow at the inlet and shrink at the outlet. Quiet, and moving the ring varies the flow.'), focus: 'vane', s: {} },
      { title: L('المضخة المكبسية', 'The piston pump'), text: L('أسطوانة فيها مكابس بتلف قدام صحن مايل، فكل مكبس بيروح وييجي ويسحب ويدفع الزيت. لما زاوية الصحن تقل التدفق يقل، ولما يبقى مستوي التدفق صفر. أعلى ضغط وكفاءة، وبتستخدم في المعدات التقيلة. دوس عليها تغيّر الزاوية.', 'A barrel of pistons turns against a tilted swash plate, so each piston strokes, drawing in and pushing out oil. Less tilt, less flow; flat, no flow. The highest pressure and efficiency, used in heavy machinery. Tap it to change the angle.'), focus: 'piston', s: {} },
      { title: L('رموز المضخات', 'Pump symbols'), text: L('المضخة دايرة جواها مثلث متلوّن طالع لبرّه (اتجاه التدفق). لو عليها سهم مايل يبقى تدفقها متغيّر، ولو فيها مثلثين يبقى بتشتغل في الاتجاهين. وخط المحرك اللي بيلفها بيترسم جنبها.', 'A pump is a circle with a filled triangle pointing out (flow direction). A diagonal arrow means variable displacement; two triangles mean it pumps both ways. The drive shaft is drawn beside it.'), s: {} }
    ],
    apply(s){}, update(dt){ t += dt; g1.rotation.z += dt * 2; g2.rotation.z -= dt * 2;
      gOil.forEach(m => { const u = m.userData; u.ph = (u.ph + dt * .3) % 1; const a = -Math.PI / 2 + u.ph * Math.PI; const side = u.s ? 1 : -1; m.position.set(side * (.14 + Math.cos(a) * .19) , Math.sin(a) * .19 * 1, .07); m.position.x = side * (.14 + Math.abs(Math.cos(a)) * .19); });
      rotor.rotation.z += dt * 2; const e = .05, R = .25; vanes.forEach((v, i) => { const a = rotor.rotation.z + i / 8 * Math.PI * 2; const d = -e * Math.cos(a) + Math.sqrt(R * R - e * e * Math.sin(a) ** 2); const mid = (.15 + d) / 2; v.position.set(-e + Math.cos(a) * mid, Math.sin(a) * mid, 0); v.rotation.z = a; v.scale.x = (d - .12) / .1; });
      barrel.rotation.x += dt * 2 * (st.tilt ? 1 : .5); sw.rotation.z = ease(sw.rotation.z, st.tilt, dt, 3); pist.forEach(o => { const a = o.a + barrel.rotation.x; o.p.position.set(Math.sin(a) * Math.tan(sw.rotation.z) * .15 * 1 + .02, Math.cos(o.a) * .13, Math.sin(o.a) * .13); });
    }
  };
}

/* ---------- المشغلات الخطية والدورانية ---------- */
function buildActuators(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const c1 = makeHCyl(1.0, .1, true); c1.group.position.set(-1.0, .35, -.5); root.add(c1.group); c1.group.add(at(label(L('أحادي الفعل', 'Single-acting'), '#ffffff', .07), .5, .25, 0));
  const c2 = makeHCyl(1.0, .12, false); c2.group.position.set(-1.0, .35, .2); root.add(c2.group); c2.group.add(at(label(L('مزدوج الفعل', 'Double-acting'), '#ffffff', .07), .5, .28, 0));
  const hm = new THREE.Group(); hm.position.set(1.2, .35, -.15); root.add(hm);
  hm.add(cyl(.18, .18, .2, M(0x2b3038, { m: .5 }), 28).rotateX(Math.PI / 2)); const mg1 = makeGear(10, .09, .05, 0xc9a24a), mg2 = makeGear(10, .09, .05, 0xb08a3a); mg1.position.set(-.075, 0, .11); mg2.position.set(.075, 0, .11); hm.add(mg1); hm.add(mg2);
  const wheel = new THREE.Group(); wheel.position.z = -.25; hm.add(wheel); wheel.add(cyl(.22, .22, .06, M(0x1d2128, { r: .8 }), 28).rotateX(Math.PI / 2)); wheel.add(at(box(.04, .3, .07, M(0xd23a2e)), 0, .05, 0)); wheel.add(cyl(.03, .03, .2, M(0xc9ced6, { m: .9 }), 10).rotateX(Math.PI / 2));
  hm.add(at(label(L('محرك هيدروليكي', 'Hydraulic motor'), '#ffffff', .07), 0, .35, 0));
  part('c1', c1.group, V(.5, .2, 0), L('أسطوانة أحادية الفعل', 'Single-acting cylinder'), L('الزيت بيدفعها لقدّام، والياي بيرجّعها. دوس عليها.', 'Oil pushes it out; a spring returns it. Tap it.'));
  part('c2', c2.group, V(.5, .22, 0), L('أسطوانة مزدوجة الفعل', 'Double-acting cylinder'), L('الزيت بيدفعها في الاتجاهين. دوس عليها.', 'Oil drives it both ways. Tap it.'));
  part('hm', hm, V(0, .25, 0), L('المحرك الهيدروليكي', 'Hydraulic motor'), L('بيحوّل ضغط الزيت لحركة دورانية. دوس عليه تعكسه.', 'Turns oil pressure into rotation. Tap to reverse.'));
  const st = { a: 0, b: 0, m: 0 }; let t = 0;
  ctx.parts.c1.tap = () => { st.a ^= 1; return st.a ? L('الزيت دخل من A: الأسطوانة طلعت وضغطت الياي.', 'Oil into A: the rod extends, compressing the spring.') : L('الزيت راح للخزان: الياي رجّعها.', 'Oil to tank: the spring returns it.'); };
  ctx.parts.c2.tap = () => { st.b ^= 1; return st.b ? L('الزيت دخل من A وخرج من B: تقدّم.', 'Oil in at A, out at B: extend.') : L('الزيت دخل من B وخرج من A: رجوع.', 'Oil in at B, out at A: retract.'); };
  ctx.parts.hm.tap = () => { st.m = st.m === 1 ? -1 : 1; return st.m > 0 ? L('بيلف مع عقارب الساعة.', 'Turning clockwise.') : L('عكسنا الزيت: بيلف عكس عقارب الساعة.', 'Flow reversed: anticlockwise.'); };
  return {
    ...ctx, view: V(.05, .7, 1.4), sway: true, hint: L('دوس على أي أسطوانة أو المحرك', 'Tap any cylinder or the motor'),
    steps: [
      { title: L('المشغلات الهيدروليكية', 'Hydraulic actuators'), text: L('المشغل بيحوّل ضغط الزيت لشغل: خطي (أسطوانة بتزق وتشد)، أو دوراني (محرك هيدروليكي بيلف). الأسطوانات مقطوعة عشان تشوف جوه: الأحمر زيت داخل بضغط، والأزرق زيت راجع للخزان.', 'An actuator turns oil pressure into work: linear (a cylinder that pushes and pulls) or rotary (a hydraulic motor). The cylinders are cut away: red is pressurised oil, blue is oil returning to tank.'), s: { a: 1, b: 1, m: 1 } },
      { title: L('أسطوانة أحادية الفعل', 'Single-acting cylinder'), text: L('ليها مدخل زيت واحد A. الزيت بيدفع المكبس لقدّام، والرجوع بالياي أو بوزن الحمل. بتستخدم في الكوريك والمكابس البسيطة. دوس عليها.', 'One oil port A. Oil pushes the piston out; a spring or the load brings it back. Used in jacks and simple presses. Tap it.'), focus: 'c1', s: { a: 1 } },
      { title: L('أسطوانة مزدوجة الفعل', 'Double-acting cylinder'), text: L('ليها مدخلين A وB. الزيت في A يطلّعها، وفي B يرجّعها. قوة التقدّم أكبر لأن مساحة المكبس كاملة، والرجوع أسرع لأن ذراع المكبس واخد جزء من المساحة. القوة = الضغط × المساحة.', 'Two ports, A and B. Oil at A extends it, at B retracts it. Extending is stronger because the full piston area is used; retracting is faster because the rod takes up area. Force = pressure × area.'), focus: 'c2', s: { b: 1 } },
      { title: L('الجوانات والتخميد', 'Seals and cushioning'), text: L('جوانات المكبس بتمنع الزيت يعدّي من جهة للتانية، وجوان الذراع بيمنع التسريب لبرّه، والمسّاحة بتمنع التراب يدخل. لو الأسطوانة بتنزل لوحدها تحت الحمل، غالبًا جوان المكبس بايظ. والتخميد في الآخر بيهدّي الخبطة.', 'Piston seals stop oil crossing sides, the rod seal stops external leaks and the wiper keeps dirt out. A cylinder that creeps under load usually has a worn piston seal. End cushioning softens the stop.'), focus: 'c2', s: { b: 0 } },
      { title: L('المحرك الهيدروليكي', 'The hydraulic motor'), text: L('عكس المضخة: الزيت المضغوط بيلف تروسه فيلف العمود. لو عكست اتجاه الزيت يعكس اللف، والسرعة بتتحدد بكمية التدفق. بيستخدم في الونش والسيور والعجل. دوس عليه تعكسه.', 'The reverse of a pump: pressurised oil turns its gears and shaft. Reverse the flow to reverse it; speed depends on flow. Used in winches, conveyors and wheel drives. Tap to reverse.'), focus: 'hm', s: { m: 1 } }
    ],
    apply(s){ Object.assign(st, { a: 0, b: 0, m: 0 }, s); },
    update(dt){ t += dt; c1.set(st.a); c1.colors(st.a ? OIL_P : OIL_T, 0x9fc6e6); c1.update(dt);
      c2.set(st.b); c2.colors(st.b ? OIL_P : OIL_T, st.b ? OIL_T : OIL_P); c2.update(dt);
      mg1.rotation.z += dt * 3 * st.m; mg2.rotation.z -= dt * 3 * st.m; wheel.rotation.z -= dt * 3 * st.m; }
  };
}

/* ---------- عناصر التحكم في الضغط ---------- */
function buildPressure(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  // صمام أمان مقطوع كبير
  const rv = new THREE.Group(); rv.position.set(-.9, .55, -.3); root.add(rv);
  rv.add(new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .9, 28, 1, true), M(0xc9a24a, { m: .5, opacity: .25, side: THREE.DoubleSide })));
  const seat = new THREE.Mesh(new THREE.TorusGeometry(.07, .02, 8, 20), M(0x6c747d, { m: .6 })); seat.rotation.x = Math.PI / 2; rv.add(at(seat, 0, -.25, 0));
  const pop = new THREE.Group(); rv.add(pop); pop.add(new THREE.Mesh(new THREE.ConeGeometry(.09, .12, 20), M(0x3a3f46, { m: .6 })).rotateX(Math.PI)); pop.add(at(cyl(.05, .05, .05, M(0x3a3f46)), 0, .08, 0));
  const sprG = new THREE.Group(); rv.add(sprG); const scr = cyl(.04, .04, .12, M(0x1d2128), 12); rv.add(scr);
  const inP = cyl(.05, .05, .3, M(OIL_P, { opacity: .6 }), 12); inP.rotation.z = Math.PI / 2; rv.add(at(inP, -.22, -.33, 0));
  const outT = cyl(.05, .05, .3, M(OIL_T, { opacity: .6 }), 12); outT.rotation.z = Math.PI / 2; rv.add(at(outT, .22, -.15, 0));
  rv.add(at(label('P', '#ff8a7a', .08), -.4, -.33, 0)); rv.add(at(label('T', '#9cc2ff', .08), .4, -.15, 0));
  const gauge = makeGauge('#d23a2e', 0, 160, [0, 40, 80, 120, 160], 'bar'); gauge.group.scale.setScalar(.6); gauge.group.position.set(-.3, .9, -.35); root.add(gauge.group);
  const fRel = oilFlow(rv, CR([V(-.35, -.33, 0), V(0, -.33, 0), V(0, -.2, 0), V(.1, -.15, 0), V(.35, -.15, 0)]), OIL_T, 10, .5);
  // التتابع: أسطوانتين
  const cA = makeHCyl(.8, .08), cB = makeHCyl(.8, .1); cA.group.position.set(.3, .35, -.4); cB.group.position.set(.3, .35, .25); root.add(cA.group); root.add(cB.group);
  cA.group.add(at(label(L('1: ربط', '1: clamp'), '#ffffff', .07), .4, .22, 0)); cB.group.add(at(label(L('2: كبس', '2: press'), '#ffffff', .07), .4, .25, 0));
  const sq = new THREE.Group(); sq.position.set(.1, .35, -.05); root.add(sq); sq.add(box(.14, .2, .14, M(0x2a62c9))); sq.add(at(label(L('صمام تتابع 40 بار', 'Sequence 40 bar'), '#ffffff', .05), 0, .17, 0));
  const g2 = makePanel(.3, .1, { bg: '#111', fg: '#ff9a5a', font: 'bold 60px monospace' }); g2.mesh.position.set(.1, .62, -.05); root.add(g2.mesh);
  const sb = symBoard(.9, .5, [{ k: 'relief', t: L('صمام أمان', 'Relief') }, { k: 'check', t: L('لا راجع', 'Check') }, { k: 'gauge', t: L('مانومتر', 'Gauge') }], L('رموز التحكم في الضغط', 'Pressure-control symbols')); sb.mesh.position.set(1.0, 1.15, -1.5); root.add(sb.mesh);
  part('rv', rv, V(0, .6, 0), L('صمام الأمان (مقطوع)', 'Relief valve (cutaway)'), L('ياي بيضغط على قفّالة. دوس عليه تغيّر الضبط.', 'A spring holds a poppet shut. Tap to change the setting.'));
  part('gauge', gauge.group, V(0, .3, 0), L('المانومتر', 'Gauge'), L('ضغط المدخل P.', 'Inlet pressure P.'));
  part('sq', sq, V(0, .3, 0), L('صمام التتابع', 'Sequence valve'), L('بيفتح لما الضغط يوصل لضبطه.', 'Opens when pressure reaches its setting.'));
  part('cyl', cB.group, V(.4, .2, 0), L('أسطوانة الكبس', 'Press cylinder'), L('بتتحرك بعد الربط.', 'Moves after clamping.'));
  const st = { mode: 'closed', set: 70, seqRun: 0 }; let t = 0, pr = 0, ph = 0;
  ctx.parts.rv.tap = () => { st.set = st.set === 70 ? 100 : st.set === 100 ? 40 : 70; return L(`ربطنا المسمار: الضبط ${st.set} بار.`, `Screw adjusted: ${st.set} bar.`); };
  return {
    ...ctx, view: V(.05, .55, 1.45), sway: true, hint: L('دوس على صمام الأمان يغيّر الضبط', 'Tap the relief valve to change its setting'),
    steps: [
      { title: L('عناصر التحكم في الضغط', 'Pressure-control valves'), text: L('بتتحكم في ضغط الزيت: صمام الأمان بيحدد أقصى ضغط، وصمام تخفيض الضغط بيدّي فرع ضغط أقل، وصمام التتابع بيشغّل حاجة بعد حاجة. كلهم فكرتهم واحدة: ياي قدام ضغط الزيت.', 'They control oil pressure: a relief valve sets the maximum, a reducing valve gives a branch at lower pressure, and a sequence valve starts one action after another. All balance a spring against oil pressure.'), s: { mode: 'closed' } },
      { title: L('صمام الأمان مقفول', 'Relief valve closed'), text: L('الياي ضاغط القفّالة على الكرسي، فالزيت اللي في P ما يقدرش يعدّي للخزان T. طول ما الضغط أقل من ضبط الياي، الصمام مقفول وكل الزيت رايح للنظام.', 'The spring holds the poppet on its seat, so oil at P cannot pass to tank T. While pressure is below the spring setting, the valve stays shut and all the oil goes to the system.'), focus: 'rv', s: { mode: 'closed' } },
      { title: L('الصمام بيفتح عند الضبط', 'Opening at the setting'), text: L('لما الأسطوانة توصل لآخرها أو الحمل يزيد، الضغط يعلى. لما قوة الزيت على القفّالة تغلب الياي (هنا 70 بار)، القفّالة ترتفع والزيت يرجع للخزان (الأزرق)، فالضغط يقف عند 70 وما يزيدش.', 'When the cylinder stalls or the load rises, pressure climbs. Once the oil force on the poppet beats the spring (70 bar here), the poppet lifts and oil returns to tank (blue), holding pressure at 70.'), focus: 'rv', s: { mode: 'open' } },
      { title: L('ضبط الضغط', 'Adjusting the pressure'), text: L('مسمار الضبط بيزوّد أو يقلل ضغط الياي. لف مع عقارب الساعة يزوّد الضغط، وعكسها يقلله. اضبط وأنت باصص على المانومتر، وما تعدّيش ضغط تشغيل المكونات. دوس على الصمام.', 'The adjusting screw changes the spring force: clockwise raises the pressure, anticlockwise lowers it. Adjust while watching the gauge and never exceed the components\' rated pressure. Tap the valve.'), focus: 'rv', s: { mode: 'open' } },
      { title: L('صمام التتابع', 'The sequence valve'), text: L('أسطوانة الربط (1) بتطلع الأول لأن الطريق ليها مفتوح. لما تمسك الشغلانة وتقف، الضغط يعلى لحد 40 بار، فصمام التتابع يفتح وأسطوانة الكبس (2) تبدأ. كده الكبس عمره ما يحصل قبل الربط.', 'The clamp cylinder (1) moves first because its path is open. When it grips the work and stops, pressure rises to 40 bar, the sequence valve opens and the press cylinder (2) moves. Pressing can never happen before clamping.'), focus: 'sq', s: { mode: 'seq' } },
      { title: L('صمام تخفيض الضغط', 'The pressure-reducing valve'), text: L('عكس صمام الأمان: مفتوح في الطبيعي، وبيقفل لما ضغط الخرج يوصل لضبطه. بيستخدم لما جزء من الماكينة محتاج ضغط أقل من باقي النظام، زي ربط شغلانة رقيقة بـ 30 بار والنظام شغال 100.', 'The opposite of a relief valve: normally open, it closes as outlet pressure reaches its setting. Used where part of a machine needs less pressure than the rest, such as clamping a delicate part at 30 bar on a 100 bar system.'), focus: 'rv', s: { mode: 'closed' } }
    ],
    apply(s){ st.mode = s.mode; ph = 0; },
    update(dt){ t += dt; const open = st.mode === 'open';
      pr = ease(pr, st.mode === 'closed' ? st.set * .6 : st.set, dt, 1.5); if(st.mode === 'seq'){ } gauge.set(st.mode === 'seq' ? (ph < 1 ? 15 : ph < 1.5 ? 40 : 45) : pr); gauge.update(dt);
      const lift = open ? .06 : 0; pop.position.y = ease(pop.position.y, -.2 + lift, dt, 6); const sTop = .32 - (st.set - 40) / 600; scr.position.y = sTop + .06;
      if(Math.abs((sprG.userData.k || 0) - pop.position.y - sTop) > .003){ sprG.userData.k = pop.position.y + sTop; sprG.clear(); const pts = []; const y0 = pop.position.y + .1, y1 = sTop; for(let i = 0; i <= 120; i++){ const f = i / 120, a = f * 8 * Math.PI * 2; pts.push(V(.07 * Math.cos(a), y0 + (y1 - y0) * f, .07 * Math.sin(a))); } sprG.add(tube(CR(pts), .01, M(0x9aa0a6, { m: .8 }), 160)); }
      fRel.target = open ? 1 : 0; fRel.update(dt);
      if(st.mode === 'seq'){ ph += dt * .3; if(ph > 3.2) ph = 0; cA.set(Math.min(1, ph)); cB.set(Math.max(0, Math.min(1, (ph - 1.5) / 1.2))); } else { cA.set(0); cB.set(0); }
      cA.colors(OIL_P, OIL_T); cB.colors(st.mode === 'seq' && ph > 1.5 ? OIL_P : 0x9fc6e6, OIL_T); cA.update(dt, 2); cB.update(dt, 2);
      g2.setText(st.mode === 'seq' ? (ph < 1 ? '15 bar' : '40 bar') : '');
    }
  };
}

/* ---------- صمامات التحكم في الاتجاه 4/2 و4/3 ---------- */
function buildDCV(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const vb = new THREE.Group(); vb.position.set(-.2, .45, -.1); root.add(vb);
  vb.add(new THREE.Mesh(new THREE.BoxGeometry(1.3, .4, .35), M(0x9aa0a6, { m: .5, opacity: .2 })));
  const bore = cyl(.08, .08, 1.3, M(0xc9ced6, { opacity: .25 }), 20); bore.rotation.z = Math.PI / 2; vb.add(bore);
  const portX = { T1: -.42, A: -.21, P: 0, B: .21, T2: .42 };
  const portM = {}; Object.entries(portX).forEach(([k, x]) => { const up = k === 'A' || k === 'B'; const m = cyl(.045, .045, .14, M(0x9aa0a6, { opacity: .5 }), 12); vb.add(at(m, x, up ? .15 : -.15, 0)); portM[k] = m; vb.add(at(label(k.replace(/\d/, ''), k === 'P' ? '#ff8a7a' : k[0] === 'T' ? '#9cc2ff' : '#ffffff', .09), x, up ? .3 : -.3, .1)); });
  const spool = new THREE.Group(); vb.add(spool); const sp = cyl(.03, .03, 1.5, M(0xc9ced6, { m: .9 }), 12); sp.rotation.z = Math.PI / 2; spool.add(sp);
  [-.42, 0, .42].forEach(x => { const l = cyl(.075, .075, .12, M(0x3a3f46, { m: .6 }), 20); l.rotation.z = Math.PI / 2; spool.add(at(l, x, 0, 0)); });
  const lever = new THREE.Group(); lever.position.set(.75, 0, 0); vb.add(lever); lever.add(at(box(.03, .35, .03, M(0x1d2128)), 0, .17, 0)); lever.add(at(new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 8), M(0xd23a2e)), 0, .35, 0));
  const spr = new THREE.Group(); vb.add(spr); spr.add(tube(helixX(-.85, -.7, .05, 5), .008, M(0x9aa0a6, { m: .8 }), 80));
  const cyl1 = makeHCyl(1.0, .1); cyl1.group.position.set(-.7, 1.05, -.3); root.add(cyl1.group);
  const hA = hoseOn(root, [V(-.41, .65, -.1), V(-.45, .9, -.2), V(-.63, 1.2, -.3)], 0x1d2128, .018), hB = hoseOn(root, [V(.01, .65, -.1), V(0, .95, -.2), V(.23, 1.2, -.3)], 0x1d2128, .018);
  const fA = oilFlow(root, hA, OIL_P, 8, .6), fB = oilFlow(root, hB, OIL_P, 8, .6);
  const inner = oilFlow(vb, CR([V(0, -.2, 0), V(0, 0, 0), V(-.21, 0, 0), V(-.21, .2, 0)]), OIL_P, 6, .4), inner2 = oilFlow(vb, CR([V(.21, .2, 0), V(.21, 0, 0), V(.42, 0, 0), V(.42, -.2, 0)]), OIL_T, 6, .4);
  const sb = makeCanvas(.9, .45, 512); sb.mesh.position.set(.95, 1.15, -1.5); root.add(sb.mesh);
  part('valve', vb, V(0, .35, .1), L('الصمام (مقطوع)', 'Valve (cutaway)'), L('بكرة (Spool) بتنزلق جوه الجسم وتوصّل البوابات.', 'A spool slides in the body to connect the ports.'));
  part('lever', lever, V(0, .4, 0), L('ذراع التشغيل', 'Lever'), L('دوس عليه تغيّر الوضع.', 'Tap to change position.'));
  part('cyl', cyl1.group, V(.5, .2, 0), L('الأسطوانة', 'Cylinder'), L('متوصلة على A وB.', 'Connected to A and B.'));
  part('sym', sb.mesh, V(0, .3, 0), L('الرمز', 'Symbol'), L('المربع المتلوّن هو الوضع الشغال.', 'The shaded box is the active position.'));
  const st = { pos: 0, three: 1, center: 'closed' }; let t = 0;
  ctx.parts.lever.tap = () => { const seq = st.three ? [1, 0, -1, 0] : [1, -1]; st._i = ((st._i || 0) + 1) % seq.length; st.pos = seq[st._i]; return st.pos > 0 ? L('وضع 1: P←A وB←T: تقدّم.', 'Position 1: P→A, B→T: extend.') : st.pos < 0 ? L('وضع 2: P←B وA←T: رجوع.', 'Position 2: P→B, A→T: retract.') : L('الوضع النص: كله مقفول والأسطوانة واقفة.', 'Centre: all blocked, the cylinder holds.'); };
  return {
    ...ctx, view: V(.05, .6, 1.45), sway: true, hint: L('دوس على الذراع يغيّر وضع الصمام', 'Tap the lever to change position'),
    steps: [
      { title: L('صمامات التحكم في الاتجاه', 'Directional control valves'), text: L('بتحدد الزيت يروح فين: للأسطوانة تطلع، أو ترجع، أو تقف. ليها بوابات: P من المضخة، وT للخزان، وA وB للمشغل. الصمام مقطوع عشان تشوف البكرة اللي جواه.', 'They decide where the oil goes: to extend, retract or hold the cylinder. Ports: P from the pump, T to the tank, A and B to the actuator. The valve is cut away to show its spool.'), s: { pos: 0, three: 1 } },
      { title: L('الوضع الأول: تقدّم', 'Position 1: extend'), text: L('البكرة اتزحلقت، فالزيت من P بيعدّي لـ A (الأحمر) ويطلّع الأسطوانة، والزيت اللي في الناحية التانية بيرجع من B لـ T (الأزرق).', 'The spool has shifted: oil from P passes to A (red) and extends the cylinder, while oil from the other side returns from B to T (blue).'), focus: 'valve', s: { pos: 1, three: 1 } },
      { title: L('الوضع التاني: رجوع', 'Position 2: retract'), text: L('البكرة راحت الناحية التانية: P بقى متوصل بـ B، وA بقى متوصل بـ T، فالأسطوانة بترجع.', 'The spool moves the other way: P now feeds B and A drains to T, so the cylinder retracts.'), focus: 'valve', s: { pos: -1, three: 1 } },
      { title: L('الوضع النص في 4/3', 'The 4/3 centre position'), text: L('صمام 4/3 ليه 3 أوضاع. في النص (مقفول) كل البوابات مسدودة، فالأسطوانة بتقف وتمسك مكانها في أي نقطة. الرقم 4 = عدد البوابات، و3 = عدد الأوضاع. دوس على الذراع وجرّب.', 'A 4/3 valve has three positions. In the closed centre every port is blocked, so the cylinder stops and holds anywhere. 4 = number of ports, 3 = number of positions. Tap the lever to try it.'), focus: 'lever', s: { pos: 0, three: 1 } },
      { title: L('الفرق بين 4/2 و4/3', '4/2 versus 4/3'), text: L('صمام 4/2 ليه وضعين بس: تقدّم أو رجوع، والياي بيرجّعه لوضعه الأصلي، فالأسطوانة ما تقدرش تقف في النص. صمام 4/3 فيه وضع نص بيوقفها. فيه أنواع للوضع النص: مقفول، أو ترادفي P←T (المضخة ترتاح والزيت يرجع من غير ضغط)، أو مفتوح.', 'A 4/2 valve has only two positions, extend or retract, and a spring returns it, so the cylinder cannot stop midway. A 4/3 valve adds a centre that holds it. Centre types include closed, tandem P→T (the pump unloads at low pressure) and open.'), focus: 'sym', s: { pos: 1, three: 0 } },
      { title: L('طرق التشغيل', 'Methods of operation'), text: L('الصمام بيتحرك بذراع يدوي، أو بدوّاسة، أو بياي للرجوع، أو بملف كهربا (سلونويد)، أو بإشارة ضغط (بايلوت). كل طريقة ليها رمز على جنب المربعات في الرسم.', 'A valve is shifted by a hand lever, a pedal, a return spring, an electric solenoid or a pilot pressure signal. Each has its own symbol beside the boxes.'), focus: 'lever', s: { pos: -1, three: 1 } }
    ],
    apply(s){ Object.assign(st, s); st._i = 0; },
    update(dt){ t += dt; spool.position.x = ease(spool.position.x, st.pos * .21, dt, 6); lever.rotation.z = ease(lever.rotation.z, -st.pos * .45, dt, 6); spr.visible = !st.three;
      cyl1.set(st.pos > 0 ? 1 : st.pos < 0 ? 0 : cyl1.f); cyl1.colors(st.pos > 0 ? OIL_P : st.pos < 0 ? OIL_T : 0xb06a3a, st.pos > 0 ? OIL_T : st.pos < 0 ? OIL_P : 0x4a6a9a); const moving = cyl1.update(dt);
      fA.target = st.pos && moving ? 1 : 0; fB.target = st.pos && moving ? 1 : 0;
      fA.items.forEach(m => m.material.color.setHex(st.pos > 0 ? OIL_P : OIL_T)); fB.items.forEach(m => m.material.color.setHex(st.pos > 0 ? OIL_T : OIL_P));
      if(st.pos < 0 && fA.path === hA){ } fA.update(dt); fB.update(dt);
      portM.A.material.color.setHex(st.pos > 0 ? OIL_P : st.pos < 0 ? OIL_T : 0x9aa0a6); portM.B.material.color.setHex(st.pos < 0 ? OIL_P : st.pos > 0 ? OIL_T : 0x9aa0a6); portM.P.material.color.setHex(OIL_P); portM.T1.material.color.setHex(OIL_T); portM.T2.material.color.setHex(OIL_T);
      const hl = st.three ? (st.pos > 0 ? 0 : st.pos < 0 ? 2 : 1) : (st.pos > 0 ? 0 : 1);
      if(sb.mesh.userData.k !== hl + ':' + st.three){ sb.mesh.userData.k = hl + ':' + st.three; sb.draw((x, W, H) => { x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, W, H); x.strokeStyle = '#2b3038'; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6); x.fillStyle = '#16302a'; x.font = 'bold 26px "IBM Plex Sans Arabic", Tahoma'; x.textAlign = 'center'; x.fillText(st.three ? L('صمام 4/3 مقفول النص', '4/3 closed-centre valve') : L('صمام 4/2 برجوع ياي', '4/2 spring-return valve'), W / 2, 36); drawSym(x, st.three ? 'v43' : 'v42', W / 2, H * .58, 1.4, hl); }); }
    }
  };
}

/* ---------- التحكم في التدفق والسرعة ---------- */
function buildFlow(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const cy = makeHCyl(1.3, .11); cy.group.position.set(-.9, .4, -.45); root.add(cy.group);
  const fc = new THREE.Group(); fc.position.set(-.2, .3, .25); root.add(fc);
  fc.add(box(.5, .16, .16, M(0xc9a24a, { m: .5, opacity: .35 })));
  const needle = new THREE.Group(); needle.position.set(-.08, .0, 0); fc.add(needle); needle.add(new THREE.Mesh(new THREE.ConeGeometry(.03, .1, 12), M(0x3a3f46, { m: .6 })).rotateX(Math.PI)); needle.add(at(cyl(.012, .012, .18, M(0xc9ced6, { m: .9 }), 8), 0, .12, 0)); needle.add(at(cyl(.05, .05, .03, M(0x1d2128), 16), 0, .22, 0));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.03, 12, 8), M(0xc9ced6, { m: .9 })); fc.add(at(ball, .12, -.03, 0));
  fc.add(at(label(L('صمام خانق لا راجع', 'One-way flow control'), '#ffffff', .055), 0, .32, 0));
  const hIn = hoseOn(root, [V(-.9, .1, .25), V(-.6, .12, .25), V(-.45, .3, .25)], 0x1d2128, .018), hOut = hoseOn(root, [V(.05, .3, .25), V(.2, .4, 0), V(-.83, .55, -.45)], 0x1d2128, .018);
  const f1 = oilFlow(root, hIn, OIL_P, 10, .8), f2 = oilFlow(root, hOut, OIL_P, 10, .8);
  const tm = makePanel(.4, .12, { bg: '#111', fg: '#7dffb0', font: 'bold 54px monospace' }); tm.mesh.position.set(.6, .8, -.45); root.add(tm.mesh); root.add(at(label(L('زمن المشوار', 'Stroke time'), '#ffffff', .06), .6, .95, -.45));
  const sb = symBoard(.9, .5, [{ k: 'throttle', t: L('خانق', 'Throttle') }, { k: 'check', t: L('لا راجع', 'Check') }, { k: 'cyl', t: L('أسطوانة', 'Cylinder') }], L('رموز التحكم في التدفق', 'Flow-control symbols')); sb.mesh.position.set(1.0, 1.15, -1.5); root.add(sb.mesh);
  part('fc', fc, V(0, .25, 0), L('صمام التحكم في التدفق', 'Flow control valve'), L('دوس عليه تقفل أو تفتح الإبرة.', 'Tap to close or open the needle.'));
  part('cyl', cy.group, V(.6, .2, 0), L('الأسطوانة', 'Cylinder'), L('سرعتها بتتحدد من كمية الزيت.', 'Its speed depends on the flow.'));
  part('time', tm.mesh, V(0, .12, 0), L('زمن المشوار', 'Stroke time'), L('كل ما الخانق يقفل، الزمن يزيد.', 'The more it is throttled, the longer it takes.'));
  const st = { open: 1, oneWay: 0, both: 0 }; let t = 0, dir = 1, el = 0, last = '';
  ctx.parts.fc.tap = () => { st.open = st.open >= 1 ? .5 : st.open >= .5 ? .25 : 1; return L(`فتحة الخانق ${Math.round(st.open * 100)}٪`, `Throttle ${Math.round(st.open * 100)}% open`); };
  return {
    ...ctx, view: V(.05, .6, 1.45), sway: true, hint: L('دوس على الصمام تغيّر الفتحة', 'Tap the valve to change the opening'),
    steps: [
      { title: L('التحكم في التدفق', 'Flow control'), text: L('سرعة الأسطوانة أو المحرك بتتحدد بكمية الزيت اللي بتدخلها في الثانية. صمام التحكم في التدفق بيضيّق الطريق فيقلل الكمية فتبطّأ الحركة. العدّاد بيوري زمن المشوار.', 'An actuator\'s speed depends on how much oil reaches it per second. A flow control valve narrows the path, cutting the flow and slowing the movement. The display shows the stroke time.'), s: { open: 1 } },
      { title: L('الصمام الخانق', 'The throttle valve'), text: L('إبرة بتقرّب من الفتحة أو تبعد عنها. لما تقفّلها الزيت يعدّي أقل فالأسطوانة تبطّأ في الاتجاهين. الزيت الزيادة بيرجع من صمام الأمان. دوس على الصمام وشوف زمن المشوار.', 'A needle moves toward or away from the orifice. Closing it lets less oil through, so the cylinder slows both ways; the surplus returns through the relief valve. Tap the valve and watch the stroke time.'), focus: 'fc', s: { open: .5 } },
      { title: L('صمام خانق لا راجع', 'One-way flow control'), text: L('خانق ومعاه صمام لا راجع (البلية). في اتجاه البلية بتقفل والزيت مجبر يعدّي من الخانق فيبطّأ، وفي الاتجاه التاني البلية بتفتح والزيت يعدّي حر. كده بتتحكم في سرعة مشوار واحد بس (التقدّم أو الرجوع).', 'A throttle with a check valve (the ball). One way the ball closes and oil must pass the throttle, so it slows; the other way the ball lifts and oil flows freely. This controls the speed of one stroke only, extend or retract.'), focus: 'fc', s: { open: .35, oneWay: 1 } },
      { title: L('التحكم في المشوارين', 'Controlling both strokes'), text: L('عشان تتحكم في سرعة التقدّم والرجوع كل واحد لوحده، بتركّب صمامين خانق لا راجع: واحد على A وواحد على B، وكل واحد بيتظبط لوحده.', 'To set extend and retract speeds separately, fit two one-way flow controls, one on A and one on B, each adjusted on its own.'), focus: 'cyl', s: { open: .35, oneWay: 1, both: 1 } },
      { title: L('تحكم في الدخول أم الخروج؟', 'Meter-in or meter-out?'), text: L('الخنق في الدخول (Meter-in) بيتحكم في الزيت الداخل. الخنق في الخروج (Meter-out) بيتحكم في الزيت الخارج، وده أحسن لما الحمل بيشد الأسطوانة (زي النزول بوزن)، لأنه بيمسكها وما يسيبهاش تجري.', 'Meter-in throttles the oil going in. Meter-out throttles the oil coming out, which is better when the load pulls the cylinder (such as lowering a weight) because it holds it back from running away.'), focus: 'fc', s: { open: .35, oneWay: 1 } }
    ],
    apply(s){ Object.assign(st, { open: 1, oneWay: 0, both: 0 }, s); el = 0; dir = 1; },
    update(dt){ t += dt; const base = .55; const spdOut = base * st.open, spdIn = st.oneWay && !st.both ? base * 1.6 : base * st.open;
      const sp = dir > 0 ? spdOut : spdIn; cy.set(dir > 0 ? 1 : 0); cy.colors(dir > 0 ? OIL_P : OIL_T, dir > 0 ? OIL_T : OIL_P); const mv = cy.update(dt, sp / .5); el += dt;
      if(!mv){ tm.setText((dir > 0 ? '→ ' : '← ') + el.toFixed(1) + ' s'); last = tm; dir = -dir; el = 0; }
      needle.position.y = ease(needle.position.y, (1 - st.open) * -.05 + .0, dt, 6); ball.position.y = ease(ball.position.y, st.oneWay && dir < 0 ? .0 : -.03, dt, 8); ball.visible = !!st.oneWay;
      f1.target = 1; f2.target = 1; f1.speed = f2.speed = .3 + sp; f1.update(dt); f2.update(dt);
    }
  };
}

/* ---------- دوائر هيدروليك على لوحة التدريب ---------- */
function buildHCircuit(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const panel = new THREE.Group(); panel.position.set(0, .05, -.9); root.add(panel); panel.add(at(box(3.0, 1.5, .05, M(0xb9c0c8, { m: .5, r: .4 })), 0, .8, 0));
  for(let i = 0; i < 9; i++) panel.add(at(box(3.0, .012, .02, M(0x8a9099, { m: .5 })), 0, .1 + i * .17, .03));
  const tk = makeTank(.9, .35, .45); tk.group.position.set(-1.0, 0, -.35); root.add(tk.group);
  const mot = makeEMotor(.35, .1); mot.group.position.set(-1.15, .5, -.35); root.add(mot.group);
  const v43 = new THREE.Group(); v43.position.set(-.3, .55, -.82); root.add(v43); v43.add(box(.45, .16, .14, M(0x2a62c9, { m: .4 }))); const lev = new THREE.Group(); lev.position.set(.25, 0, .05); v43.add(lev); lev.add(at(box(.025, .2, .025, M(0x1d2128)), 0, .1, 0)); lev.add(at(new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), M(0xd23a2e)), 0, .2, 0)); v43.add(at(label('4/3', '#ffffff', .06), 0, .15, .08));
  const cA = makeHCyl(.8, .07), cB = makeHCyl(.8, .07); cA.group.position.set(.3, 1.2, -.84); cB.group.position.set(.3, .85, -.84); root.add(cA.group); root.add(cB.group);
  const wA = new THREE.Group(); wA.position.set(1.18, 1.2, -.84); root.add(wA); wA.add(box(.15, .25, .2, M(0x6c747d, { m: .5 }))); wA.add(at(label('20 kg', '#ffffff', .05), 0, .2, 0));
  const wB = new THREE.Group(); wB.position.set(1.18, .85, -.84); root.add(wB); wB.add(box(.15, .15, .15, M(0x8a9099, { m: .5 }))); wB.add(at(label('5 kg', '#ffffff', .05), 0, .15, 0));
  const hm = new THREE.Group(); hm.position.set(.7, .45, -.82); root.add(hm); hm.add(cyl(.1, .1, .12, M(0x2b3038), 20).rotateX(Math.PI / 2)); const disc = new THREE.Group(); disc.position.z = .08; hm.add(disc); disc.add(cyl(.12, .12, .03, M(0xd23a2e), 20).rotateX(Math.PI / 2)); disc.add(at(box(.02, .2, .035, M(0xffffff)), 0, 0, .01));
  const gauge = makeGauge('#d23a2e', 0, 100, [0, 25, 50, 75, 100], 'bar'); gauge.group.scale.setScalar(.35); gauge.group.position.set(-.75, 1.15, -.83); root.add(gauge.group);
  const sq = new THREE.Group(); sq.position.set(.05, 1.0, -.82); root.add(sq); sq.add(box(.1, .14, .1, M(0xc9a24a))); sq.add(at(label(L('تتابع', 'Seq.'), '#ffffff', .045), 0, .12, .06));
  const hP = hoseOn(root, [V(-.9, .5, -.35), V(-.7, .7, -.6), V(-.4, .5, -.78)], OIL_P, .016), hT = hoseOn(root, [V(-.2, .5, -.78), V(-.4, .3, -.5), V(-.8, .37, -.3)], OIL_T, .016);
  const hA1 = hoseOn(root, [V(-.35, .63, -.78), V(-.1, 1.0, -.78), V(.35, 1.29, -.82)], 0x1d2128, .014), hA2 = hoseOn(root, [V(-.35, .63, -.78), V(-.05, .8, -.78), V(.35, .94, -.82)], 0x1d2128, .014);
  const hM = hoseOn(root, [V(-.25, .63, -.78), V(.2, .7, -.75), V(.62, .5, -.78)], 0x1d2128, .014);
  const fP = oilFlow(root, hP, OIL_P, 8, .8), fT = oilFlow(root, hT, OIL_T, 8, .8), fA = oilFlow(root, hA1, OIL_P, 8, .7), fB2 = oilFlow(root, hA2, OIL_P, 8, .7), fM = oilFlow(root, hM, OIL_P, 8, .7);
  const scr = makeCanvas(.9, .55, 512); scr.mesh.position.set(1.35, .45, .25); scr.mesh.rotation.y = -.5; root.add(scr.mesh); root.add(at(box(.94, .59, .03, M(0x15181d)), 1.35, .45, .23).rotateY(-.5));
  part('panel', panel, V(-1.3, 1.45, .05), L('لوحة التدريب', 'Training panel'), L('بنثبّت عليها المكونات ونوصّلها بخراطيم بوصلات سريعة.', 'Components clip on and connect with quick-coupling hoses.'));
  part('v43', v43, V(0, .25, 0), L('صمام 4/3 يدوي', 'Manual 4/3 valve'), L('دوس عليه تشغّل الدايرة.', 'Tap it to run the circuit.'));
  part('cA', cA.group, V(.4, .14, 0), L('الأسطوانة 1', 'Cylinder 1'), L('عليها حمل تقيل.', 'Carries a heavy load.'));
  part('cB', cB.group, V(.4, .14, 0), L('الأسطوانة 2', 'Cylinder 2'), L('عليها حمل خفيف.', 'Carries a light load.'));
  part('hm', hm, V(0, .2, 0), L('المحرك الهيدروليكي', 'Hydraulic motor'), L('بيلف القرص.', 'Turns the disc.'));
  part('scr', scr.mesh, V(0, .35, 0), L('برنامج الرسم والمحاكاة', 'Design software'), L('بنرسم الدايرة ونجربها قبل التنفيذ.', 'Draw and test the circuit before building it.'));
  const st = { mode: 'one', pos: 0, run: 1 }; let t = 0, cyc = 0;
  ctx.parts.v43.tap = () => { st.pos = st.pos === 1 ? -1 : 1; cyc = 0; return st.pos > 0 ? L('تقدّم', 'Extend') : L('رجوع', 'Retract'); };
  const drawScreen = () => scr.draw((x, W, H) => { x.fillStyle = '#f4f6f8'; x.fillRect(0, 0, W, H); x.fillStyle = '#2a62c9'; x.fillRect(0, 0, W, 28); x.fillStyle = '#fff'; x.font = 'bold 18px Tahoma'; x.textAlign = 'left'; x.fillText('Automation Studio / FluidSIM', 10, 20);
    drawSym(x, 'cyl', W / 2, 70, .9); drawSym(x, 'v43', W / 2, 160, .9, st.pos > 0 ? 0 : st.pos < 0 ? 2 : 1); drawSym(x, 'pump', W / 2 - 80, 245, .7); drawSym(x, 'relief', W / 2 + 60, 245, .6); drawSym(x, 'tank', W / 2 - 80, 285, .6);
    x.strokeStyle = '#d0021b'; x.lineWidth = 3; x.beginPath(); x.moveTo(W / 2 - 59, 140); x.lineTo(W / 2 - 59, 88); x.moveTo(W / 2 - 80, 210); x.lineTo(W / 2 - 80, 190); x.lineTo(W / 2 - 59, 190); x.lineTo(W / 2 - 59, 182); x.stroke(); });
  return {
    ...ctx, view: V(.05, .35, 1.5), sway: true, hint: L('دوس على الصمام 4/3', 'Tap the 4/3 valve'),
    steps: [
      { title: L('لوحة تدريب الهيدروليك', 'The hydraulic training panel'), text: L('اللوحة دي زي اللي في المعمل: وحدة قدرة تحت، وصمام 4/3، وأسطوانتين، ومحرك هيدروليكي، ومانومتر، وصمام تتابع. كل حاجة بتتوصل بخراطيم ليها وصلات سريعة.', 'Like the lab panel: a power unit below, a 4/3 valve, two cylinders, a hydraulic motor, a gauge and a sequence valve, all joined by quick-coupling hoses.'), s: { mode: 'one', pos: 0 } },
      { title: L('تصميم الدايرة على البرنامج', 'Designing on software'), text: L('قبل التنفيذ بنرسم الدايرة على برنامج زي Automation Studio أو FluidSIM: نسحب الرموز ونوصّلها، ونشغّل المحاكاة نتأكد إنها شغالة صح، وبعدين ننفّذها على اللوحة بنفس الترتيب.', 'Before building, draw the circuit in software such as Automation Studio or FluidSIM: drag in the symbols, connect them and run the simulation to check it, then build it on the panel the same way.'), focus: 'scr', s: { mode: 'one', pos: 1 } },
      { title: L('تنفيذ دايرة أسطوانة بصمام 4/3', 'Building a 4/3 cylinder circuit'), text: L('P من المضخة على P في الصمام، وT على الخزان، وA وB على الأسطوانة. شغّل المضخة وحرّك الذراع: تقدّم، ونص (وقوف)، ورجوع. دوس على الصمام.', 'Pump P to valve P, valve T to tank, A and B to the cylinder. Start the pump and move the lever: extend, centre (hold), retract. Tap the valve.'), focus: 'v43', s: { mode: 'one', pos: 1 } },
      { title: L('أسطوانتين على التوازي', 'Two cylinders in parallel'), text: L('الأسطوانتين متوصلين على نفس الخط. الزيت بيروح للأسهل الأول: الأسطوانة اللي حملها خفيف (2) بتتحرك الأول، ولما تخلص الضغط يعلى والتانية تتحرك. لو عايزهم مع بعض لازم صمام تقسيم تدفق.', 'Both cylinders share one line. Oil takes the easiest path: the lightly loaded cylinder (2) moves first; when it stops, pressure rises and the other moves. To move them together you need a flow divider.'), focus: 'cB', s: { mode: 'par', pos: 1 } },
      { title: L('أسطوانة ومحرك هيدروليكي', 'A cylinder and a motor'), text: L('نفس وحدة القدرة بتشغّل أسطوانة ومحرك: الصمام بيطلّع الأسطوانة، وفرع تاني بيلف المحرك. سرعة المحرك بتتحدد بالتدفق اللي واصل له.', 'One power unit drives a cylinder and a motor: the valve extends the cylinder while a branch turns the motor. The motor speed depends on the flow it receives.'), focus: 'hm', s: { mode: 'motor', pos: 1 } },
      { title: L('دايرة تتابع', 'A sequence circuit'), text: L('الأسطوانة 1 بتطلع الأول، ولما توصل وتقف الضغط يعلى لحد ضبط صمام التتابع، فيفتح والأسطوانة 2 تطلع بعدها. شوف المانومتر بيعلى قبل ما التانية تتحرك.', 'Cylinder 1 extends first; when it stops, pressure rises to the sequence setting, the valve opens and cylinder 2 follows. Watch the gauge climb before the second moves.'), focus: 'cA', s: { mode: 'seq', pos: 1 } },
      { title: L('قبل ما تفك الخراطيم', 'Before disconnecting'), text: L('وقّف المضخة، وحرّك الصمام في الاتجاهين عشان تفرّغ الضغط المحبوس، واتأكد إن المانومتر على صفر. بعد كده افصل الوصلات السريعة ونضّفها وحط عليها الغطا.', 'Stop the pump, move the valve both ways to release trapped pressure and check the gauge reads zero. Then uncouple the quick connectors, clean them and refit the caps.'), focus: 'panel', s: { mode: 'one', pos: 0, run: 0 } }
    ],
    apply(s){ Object.assign(st, { run: 1 }, s); cyc = 0; drawScreen(); },
    update(dt){ t += dt; cyc += dt; mot.shaft.rotation.x += st.run ? dt * 25 : 0;
      const ext = st.pos > 0; let a = 0, b = 0, p = st.run ? 10 : 0;
      if(st.mode === 'one'){ a = st.pos > 0 ? 1 : st.pos < 0 ? 0 : cA.f; p = st.pos && cA.update(0, 1) ? 30 : st.run ? 70 : 0; }
      if(st.mode === 'par' || st.mode === 'seq'){ const firstB = st.mode === 'par'; const T1 = 2.2; const f1 = Math.min(1, cyc / T1), f2 = Math.max(0, Math.min(1, (cyc - T1 - .6) / T1)); if(firstB){ b = ext ? f1 : 0; a = ext ? f2 : 0; } else { a = ext ? f1 : 0; b = ext ? f2 : 0; } p = cyc < T1 ? 15 : cyc < T1 + .6 ? 40 : cyc < T1 * 2 + .6 ? 45 : 70; if(cyc > T1 * 2 + 2.5) cyc = 0; }
      if(st.mode === 'motor'){ a = ext ? Math.min(1, (cyc % 5) / 2.5) : 0; disc.rotation.z -= dt * 4; p = 35; }
      cA.set(a); cB.set(st.mode === 'one' || st.mode === 'motor' ? 0 : b); cA.colors(OIL_P, OIL_T); cB.colors(OIL_P, OIL_T); cA.update(dt, 3); cB.update(dt, 3);
      wA.position.x = 1.18 - (1 - cA.f) * 0 + cA.f * 0; wA.position.x = .3 + .8 + .08 + (cA.f) * .66 - .0; wB.position.x = .3 + .8 + .08 + cB.f * .66;
      lev.rotation.z = ease(lev.rotation.z, -st.pos * .4, dt, 6); gauge.set(p); gauge.update(dt);
      fP.target = st.run ? 1 : 0; fT.target = st.run ? 1 : 0; fA.target = st.pos && st.mode !== 'par' ? 1 : 0; fB2.target = (st.mode === 'par' || st.mode === 'seq') && st.pos ? 1 : 0; fM.target = st.mode === 'motor' ? 1 : 0;
      [fP, fT, fA, fB2, fM].forEach(f => f.update(dt));
    }
  };
}

/* ---------- الدوائر الإلكتروهيدروليكية ---------- */
function buildElectroHyd(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const eb = new THREE.Group(); eb.position.set(-.85, .05, -.45); root.add(eb);
  eb.add(at(box(1.0, .8, .12, M(0xe9ebef, { r: .5 })), 0, .45, 0)); eb.add(at(label(L('وحدة الكهربا 24V', '24 V control unit'), '#1b1f26', .06), 0, .8, .07));
  const btn = (x, y, col, txt) => { const b = makeButton(col, txt); b.group.position.set(x, y, .07); eb.add(b.group); return b; };
  const S1 = btn(-.3, .55, 0x2fbf5a, 'S1'), S2 = btn(0, .55, 0xe8c21a, 'S2'), S0 = btn(.3, .55, 0xd23a2e, 'STOP');
  const relay = new THREE.Group(); relay.position.set(-.15, .25, .08); eb.add(relay); relay.add(box(.18, .16, .1, M(0x2a62c9, { opacity: .6 }))); const rArm = box(.12, .015, .03, M(0xc9ced6, { m: .9 })); relay.add(at(rArm, 0, .05, .06)); relay.add(at(label('K1', '#ffffff', .05), 0, -.12, .06));
  const relLed = M(0x551111); relay.add(at(new THREE.Mesh(new THREE.SphereGeometry(.015, 8, 6), relLed), .07, .06, .06));
  const val = new THREE.Group(); val.position.set(.4, .5, -.25); root.add(val);
  val.add(box(.5, .18, .16, M(0x2a62c9, { m: .4 }))); const sol1 = box(.16, .16, .16, M(0x1d2128)); val.add(at(sol1, -.33, 0, 0)); const sol2 = box(.16, .16, .16, M(0x1d2128)); val.add(at(sol2, .33, 0, 0));
  const y1L = M(0x551111), y2L = M(0x551111); val.add(at(new THREE.Mesh(new THREE.SphereGeometry(.02, 8, 6), y1L), -.33, .1, .08)); val.add(at(new THREE.Mesh(new THREE.SphereGeometry(.02, 8, 6), y2L), .33, .1, .08));
  val.add(at(label('Y1', '#ffd34d', .06), -.33, .17, .08)); const y2Lab = label('Y2', '#ffd34d', .06); y2Lab.position.set(.33, .17, .08); val.add(y2Lab);
  const cy = makeHCyl(1.0, .1); cy.group.position.set(-.1, .95, -.6); root.add(cy.group);
  const ls = new THREE.Group(); ls.position.set(1.0, .95, -.45); root.add(ls); ls.add(box(.1, .14, .08, M(0xe8c21a))); const lsr = cyl(.02, .02, .08, M(0x1d2128), 10); ls.add(at(lsr, -.06, .0, 0)); ls.add(at(label('S3', '#ffd34d', .05), 0, .12, 0));
  const wire = c => { const cc = CR(c); root.add(tube(cc, .008, M(0x2a62c9), 40)); return cc; };
  const wY1 = wire([V(-.55, .55, -.37), V(-.1, .7, -.3), V(.07, .55, -.25)]), wY2 = wire([V(-.4, .55, -.37), V(.3, .8, -.3), V(.73, .55, -.25)]);
  const fY1 = new Flow(root, wY1, { color: 0xffd34d, count: 8, speed: 1, size: .018 }), fY2 = new Flow(root, wY2, { color: 0xffd34d, count: 8, speed: 1, size: .018 });
  const lad = makeCanvas(.95, .6, 512); lad.mesh.position.set(1.0, 1.2, -1.5); root.add(lad.mesh);
  part('S1', S1.group, V(0, .1, .03), 'S1', L('زرار التشغيل. دوس عليه.', 'Start button. Tap it.'));
  part('S2', S2.group, V(0, .1, .03), 'S2', L('زرار الرجوع (في 4/3). دوس عليه.', 'Retract button (4/3). Tap it.'));
  part('S0', S0.group, V(0, .1, .03), 'STOP', L('بيفك الحفظ.', 'Breaks the latch.'));
  part('relay', relay, V(0, .14, .05), L('الريلاي K1', 'Relay K1'), L('ملف وتلامسات بتشغّل الصمام.', 'A coil whose contacts drive the valve.'));
  part('val', val, V(0, .2, 0), L('صمام بسلونويد', 'Solenoid valve'), L('ملف كهربا بيزق البكرة بدل الذراع.', 'An electric coil shifts the spool instead of a lever.'));
  part('ls', ls, V(0, .15, 0), L('ليمت سويتش S3', 'Limit switch S3'), L('بيحس إن الأسطوانة وصلت آخرها.', 'Senses that the cylinder has reached the end.'));
  part('lad', lad.mesh, V(0, .33, 0), L('الدايرة الكهربية', 'Electrical diagram'), L('الخطوط المنوّرة عليها كهربا.', 'Lit rungs are energised.'));
  const st = { mode: 'direct', s1: 0, s2: 0, k: 0 }; let t = 0, press = 0;
  const pressBtn = (k) => { press = 1.2; st[k] = 1; if(k === 's1' && (st.mode === 'latch')) st.k = 1; if(k === 's0'){ st.k = 0; st.s1 = 0; st.s2 = 0; } };
  ctx.parts.S1.tap = () => { S1.press(); pressBtn('s1'); return st.mode === 'latch' ? L('K1 اشتغل ومسك نفسه: تقدر تسيب الزرار.', 'K1 energised and latched: you can release the button.') : L('طول ما الزرار مضغوط الملف شغال.', 'The coil is on only while the button is held.'); };
  ctx.parts.S2.tap = () => { S2.press(); pressBtn('s2'); return L('Y2 اتغذى: رجوع.', 'Y2 energised: retract.'); };
  ctx.parts.S0.tap = () => { S0.press(); pressBtn('s0'); return L('STOP: الحفظ اتفك والصمام رجع.', 'STOP: latch released, the valve returns.'); };
  const drawLad = (y1, y2, k) => lad.draw((x, W, H) => { x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, W, H); x.lineWidth = 4; x.strokeStyle = '#2b3038'; x.beginPath(); x.moveTo(30, 20); x.lineTo(30, H - 20); x.moveTo(W - 30, 20); x.lineTo(W - 30, H - 20); x.stroke(); x.font = 'bold 22px monospace'; x.fillStyle = '#111'; x.fillText('+24V', 4, 16); x.fillText('0V', W - 44, 16);
    const rung = (y, on, items) => { x.strokeStyle = on ? '#e0a400' : '#2b3038'; x.lineWidth = on ? 6 : 3; x.beginPath(); x.moveTo(30, y); x.lineTo(W - 30, y); x.stroke(); items.forEach(([px, s]) => { x.fillStyle = '#fbfaf5'; x.fillRect(px - 30, y - 18, 60, 36); x.strokeRect(px - 30, y - 18, 60, 36); x.fillStyle = '#111'; x.font = 'bold 18px monospace'; x.textAlign = 'center'; x.fillText(s, px, y + 6); }); x.textAlign = 'left'; };
    if(st.mode === 'direct'){ rung(H * .4, y1, [[W * .35, 'S1'], [W * .7, 'Y1']]); }
    else if(st.mode === 'indirect' || st.mode === 'latch'){ rung(H * .3, k, [[W * .3, 'S1'], [W * .5, st.mode === 'latch' ? 'STOP' : ''], [W * .75, 'K1']].filter(i => i[1])); if(st.mode === 'latch'){ x.strokeStyle = k ? '#e0a400' : '#2b3038'; x.beginPath(); x.moveTo(W * .18, H * .3); x.lineTo(W * .18, H * .48); x.lineTo(W * .42, H * .48); x.lineTo(W * .42, H * .3); x.stroke(); x.fillStyle = '#111'; x.fillText('K1', W * .27, H * .55); } rung(H * .75, y1, [[W * .35, 'K1'], [W * .7, 'Y1']]); }
    else { rung(H * .3, y1, [[W * .35, 'S1'], [W * .7, 'Y1']]); rung(H * .7, y2, [[W * .35, 'S2'], [W * .7, 'Y2']]); } });
  return {
    ...ctx, view: V(.05, .55, 1.45), sway: true, hint: L('دوس على الزراير S1 وS2 وSTOP', 'Tap S1, S2 and STOP'),
    steps: [
      { title: L('الدوائر الإلكتروهيدروليكية', 'Electro-hydraulic circuits'), text: L('بدل ما نحرّك الصمام بإيدنا، بنحرّكه بملف كهربا (سلونويد) بيتغذى 24 فولت. كده نقدر نتحكم بزراير وريلايات وحساسات وPLC من بعيد.', 'Instead of moving the valve by hand, an electric solenoid on 24 V shifts it. Now buttons, relays, sensors and a PLC can control it remotely.'), s: { mode: 'direct' } },
      { title: L('التشغيل المباشر', 'Direct control'), text: L('الزرار S1 متوصل على ملف الصمام Y1 على طول. طول ما انت ضاغط الأسطوانة بتطلع، ولما تسيبه الياي يرجّع الصمام والأسطوانة ترجع. دوس على S1.', 'Button S1 feeds solenoid Y1 directly. While held, the cylinder extends; release it and the spring returns the valve and the cylinder. Tap S1.'), focus: 'S1', s: { mode: 'direct' } },
      { title: L('التشغيل غير المباشر', 'Indirect control'), text: L('الزرار بيغذي ملف الريلاي K1 (تيار صغير)، وتلامس K1 هو اللي بيغذي ملف الصمام Y1. ده بيحمي الزراير، ويسمح بزرار واحد يشغّل أكتر من حاجة.', 'The button feeds relay coil K1 (a small current) and K1\'s contact feeds solenoid Y1. This protects the buttons and lets one button drive several loads.'), focus: 'relay', s: { mode: 'indirect' } },
      { title: L('تثبيت الإشارة (الحفظ)', 'Latching (self-holding)'), text: L('تلامس من K1 متوصل توازي مع S1، فلما تدوس S1 مرة الريلاي يشتغل ويمسك نفسه حتى لو سبت الزرار. زرار STOP المقفول في الطبيعي هو اللي بيفك الحفظ. دوس S1 وبعدين STOP.', 'A K1 contact is wired in parallel with S1, so one press energises the relay and it holds itself after you release. The normally closed STOP button breaks the latch. Tap S1, then STOP.'), focus: 'S0', s: { mode: 'latch' } },
      { title: L('صمام 4/3 بإشارتين كهربا', '4/3 valve with two solenoids'), text: L('الصمام ليه ملفين: Y1 للتقدّم وY2 للرجوع، والياي بيرجّعه للنص لما الاتنين يفصلوا. S1 يغذي Y1، وS2 يغذي Y2. ممنوع الاتنين يشتغلوا مع بعض. دوس على S1 وS2.', 'The valve has two coils: Y1 to extend and Y2 to retract, with springs centring it when both are off. S1 feeds Y1, S2 feeds Y2; never energise both at once. Tap S1 and S2.'), focus: 'S2', s: { mode: 'v43' } },
      { title: L('الليمت سويتش', 'The limit switch'), text: L('ليمت سويتش S3 في آخر المشوار. لما الأسطوانة توصل له يفتح أو يقفل تلامس، فيوقف الملف أو يبدأ الخطوة الجاية، زي إنه يرجّع الأسطوانة لوحده. ده أساس الدواير الأوتوماتيك.', 'Limit switch S3 sits at the end of stroke. When the cylinder reaches it a contact changes, stopping the coil or starting the next step, such as retracting automatically. This is the basis of automatic circuits.'), focus: 'ls', s: { mode: 'auto' } }
    ],
    apply(s){ Object.assign(st, { s1: 0, s2: 0, k: 0 }, s); press = 0; },
    update(dt){ t += dt; press = Math.max(0, press - dt); if(press <= 0 && st.mode !== 'v43'){ st.s1 = 0; } if(press <= 0){ st.s2 = 0; }
      [S1, S2, S0].forEach(b => b.update(dt));
      let y1 = 0, y2 = 0, k = 0;
      if(st.mode === 'direct') y1 = st.s1;
      if(st.mode === 'indirect'){ k = st.s1; y1 = k; }
      if(st.mode === 'latch'){ k = st.k; y1 = k; }
      if(st.mode === 'v43'){ y1 = press > 0 && st.s1 ? 1 : 0; y2 = press > 0 && st.s2 ? 1 : 0; }
      if(st.mode === 'auto'){ const ph = t % 6; y1 = ph < 3 ? 1 : 0; }
      if(st.mode === 'v43'){ if(y1) st._p = 1; if(y2) st._p = 0; cy.set(st._p ?? 0); } else cy.set(y1 ? 1 : 0);
      cy.colors(y1 || (st.mode === 'v43' && st._p) ? OIL_P : OIL_T, y1 ? OIL_T : OIL_P); cy.update(dt, 1.5);
      setGlow(y1L, y1, 1, .2, .1); setGlow(y2L, y2, 1, .2, .1); setGlow(relLed, k, 1, .2, .1); rArm.rotation.z = ease(rArm.rotation.z, k ? -.25 : 0, dt, 10);
      sol2.visible = st.mode === 'v43'; y2Lab.visible = sol2.visible; lsr.position.x = cy.f > .97 ? -.03 : -.06;
      fY1.target = y1; fY2.target = y2; fY1.update(dt); fY2.update(dt);
      const key = st.mode + y1 + y2 + k; if(lad.mesh.userData.k !== key){ lad.mesh.userData.k = key; drawLad(y1, y2, k); }
    }
  };
}

/* ================= النيوماتيك والـ PLC ================= */
const AIR_P = 0x29b6f6, AIR_X = 0xb0bec5;
function drawSymP(x, kind, cx, cy, s = 1, hl = -1){
  x.save(); x.translate(cx, cy); x.scale(s, s); x.strokeStyle = '#111'; x.fillStyle = '#111'; x.lineWidth = 3; x.lineCap = 'round';
  const tri = (ax, ay, bx, by, cx2, cy2) => { x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.lineTo(cx2, cy2); x.closePath(); x.fill(); };
  const arr = (ax, ay, bx, by) => { x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); const a = Math.atan2(by - ay, bx - ax); tri(bx, by, bx - 9 * Math.cos(a - .4), by - 9 * Math.sin(a - .4), bx - 9 * Math.cos(a + .4), by - 9 * Math.sin(a + .4)); };
  const blk = (x0, y0, w, h) => { x.beginPath(); x.moveTo(x0 + w * .5 - 6, y0 + h); x.lineTo(x0 + w * .5 + 6, y0 + h); x.stroke(); };
  const spring = (x0, y0, x1) => { x.beginPath(); x.moveTo(x0, y0); const n = 6, w = (x1 - x0) / n; for(let i = 0; i < n; i++) x.lineTo(x0 + w * (i + .5), y0 + (i % 2 ? -8 : 8)); x.lineTo(x1, y0); x.stroke(); };
  const boxes = (n, w = 46) => { const x0 = -w * n / 2; for(let i = 0; i < n; i++){ if(i === hl){ x.fillStyle = 'rgba(41,182,246,.35)'; x.fillRect(x0 + i * w, -24, w, 48); x.fillStyle = '#111'; } x.strokeRect(x0 + i * w, -24, w, 48); } return x0; };
  if(kind === 'v32'){ const x0 = boxes(2); arr(x0 + 23, 24, x0 + 23, -24); x.beginPath(); x.moveTo(x0 + 46 + 23, -24); x.lineTo(x0 + 46 + 23, -10); x.moveTo(x0 + 46 + 17, -10); x.lineTo(x0 + 46 + 29, -10); x.stroke(); arr(x0 + 46 + 12, 24, x0 + 46 + 34, -24); x.beginPath(); x.moveTo(x0 + 23, 24); x.lineTo(x0 + 23, 24); x.stroke(); spring(46, 0, 76); x.strokeRect(x0 - 20, -10, 20, 20); x.font = 'bold 15px sans-serif'; x.textAlign = 'center'; x.fillText('2', x0 + 69, -32); x.fillText('1', x0 + 58, 42); x.fillText('3', x0 + 80, 42); }
  else if(kind === 'v52' || kind === 'v53'){ const n = kind === 'v53' ? 3 : 2; const x0 = boxes(n); const b = i => x0 + i * 46; arr(b(0) + 12, 24, b(0) + 12, -24); arr(b(0) + 34, -24, b(0) + 34, 24); arr(b(n - 1) + 12, 24, b(n - 1) + 34, -24); arr(b(n - 1) + 34, 24, b(n - 1) + 12, -24); if(n === 3){ [12, 34].forEach(a => { x.beginPath(); x.moveTo(b(1) + a, -24); x.lineTo(b(1) + a, -12); x.moveTo(b(1) + a - 5, -12); x.lineTo(b(1) + a + 5, -12); x.stroke(); }); }
    x.strokeRect(x0 - 20, -10, 20, 20); if(kind === 'v52') { x.strokeRect(-x0, -10, 20, 20); } else { spring(-x0, 0, -x0 + 26); } x.font = 'bold 15px sans-serif'; x.textAlign = 'center'; [['4', 12, -32], ['2', 34, -32], ['5', 6, 42], ['1', 23, 42], ['3', 40, 42]].forEach(([t, a, c]) => x.fillText(t, b(n - 1) + a, c)); }
  else if(kind === 'or' || kind === 'and'){ x.strokeRect(-36, -18, 72, 36); if(kind === 'or'){ x.beginPath(); x.arc(0, 4, 9, 0, 7); x.stroke(); x.beginPath(); x.moveTo(-24, -6); x.lineTo(-24, 14); x.moveTo(24, -6); x.lineTo(24, 14); x.stroke(); } else { x.fillRect(-20, -4, 40, 8); } x.beginPath(); x.moveTo(-36, 0); x.lineTo(-56, 0); x.moveTo(36, 0); x.lineTo(56, 0); x.moveTo(0, -18); x.lineTo(0, -38); x.stroke(); }
  else if(kind === 'comp'){ x.beginPath(); x.arc(0, 0, 28, 0, 7); x.stroke(); x.beginPath(); x.moveTo(0, -28); x.lineTo(-9, -12); x.lineTo(9, -12); x.closePath(); x.stroke(); x.beginPath(); x.moveTo(0, -28); x.lineTo(0, -46); x.stroke(); }
  else if(kind === 'frl'){ x.strokeRect(-40, -22, 80, 44); x.beginPath(); x.moveTo(-28, 0); x.lineTo(-14, -14); x.lineTo(0, 0); x.lineTo(-14, 14); x.closePath(); x.stroke(); x.beginPath(); x.arc(20, 0, 10, 0, 7); x.stroke(); x.beginPath(); x.moveTo(-60, 0); x.lineTo(-40, 0); x.moveTo(40, 0); x.lineTo(60, 0); x.stroke(); }
  else drawSym(x, kind, 0, 0, 1, hl);
  x.restore();
}
function symBoardP(w, h, list, title){
  const c = makeCanvas(w, h, 512); const draw = (hl = {}) => c.draw((x, W, H) => { x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, W, H); x.strokeStyle = '#2b3038'; x.lineWidth = 6; x.strokeRect(3, 3, W - 6, H - 6);
    x.fillStyle = '#16302a'; x.font = 'bold 26px "IBM Plex Sans Arabic", Tahoma'; x.textAlign = 'center'; x.fillText(title, W / 2, 34);
    const cols = Math.min(list.length, 3), rows = Math.ceil(list.length / cols); list.forEach((it, i) => { const cx = W * (i % cols + .5) / cols, cy = 70 + (H - 90) * (Math.floor(i / cols) + .45) / rows;
      drawSymP(x, it.k, cx, cy - 10, .75, hl[it.k] ?? -1); x.fillStyle = '#16302a'; x.font = 'bold 19px "IBM Plex Sans Arabic", Tahoma'; x.textAlign = 'center'; x.fillText(it.t, cx, cy + 56); }); });
  draw(); return { mesh: c.mesh, draw };
}
function makePValve(name, col = 0x9aa0a6){
  const g = new THREE.Group(); g.add(box(.3, .12, .12, M(col, { m: .5 }))); g.add(at(label(name, '#ffffff', .05), 0, .12, .07));
  const led = M(0x333a44); g.add(at(new THREE.Mesh(new THREE.SphereGeometry(.015, 8, 6), led), .12, .04, .065));
  return { group: g, led, set(on){ setGlow(led, on ? 1 : 0, .2, .7, 1); led.color.setHex(on ? AIR_P : 0x333a44); } };
}
function makePCyl(L = .7, R = .06, single = false){ const c = makeHCyl(L, R, single); return c; }
function puffs(root){ const arr = []; for(let i = 0; i < 6; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xdfe6ea, transparent: true, opacity: 0, depthWrite: false })); s.userData = { noFit: true, ph: i / 6 }; root.add(s); arr.push(s); } let at0 = null, t0 = -9;
  return { fire(p){ at0 = p.clone(); t0 = performance.now(); }, update(){ const e = (performance.now() - t0) / 700; arr.forEach(s => { if(!at0 || e > 1){ s.material.opacity = 0; return; } s.position.copy(at0).add(V((s.userData.ph - .5) * .2 * e, .1 * e, .1 * e)); s.scale.setScalar(.08 + e * .2); s.material.opacity = (1 - e) * .6; }); } }; }

/* ---------- وحدة النيوماتيك: الكمبريسور ووحدة الخدمة ---------- */
function buildPneuUnit(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const comp = new THREE.Group(); comp.position.set(-1.2, 0, -.3); root.add(comp);
  comp.add(at(cyl(.22, .22, .9, M(0xc0392b, { m: .4, r: .4 }), 28).rotateZ(Math.PI / 2), 0, .25, 0)); [-.35, .35].forEach(x => comp.add(at(box(.06, .1, .3, M(0x1d2128)), x, .05, 0)));
  const mot = makeEMotor(.28, .09); mot.group.position.set(-.1, .58, 0); comp.add(mot.group);
  const head = new THREE.Group(); head.position.set(.22, .58, 0); comp.add(head); head.add(box(.18, .16, .16, M(0x6c747d, { m: .5 }))); for(let i = 0; i < 4; i++) head.add(at(box(.2, .012, .18, M(0x8a9099, { m: .5 })), 0, .09 + i * .025, 0));
  const pist = cyl(.04, .04, .1, M(0xc9ced6, { m: .9 }), 10); head.add(at(pist, 0, 0, .1));
  const tg = makeGauge('#2a62c9', 0, 10, [0, 2, 4, 6, 8, 10], 'bar'); tg.group.scale.setScalar(.35); tg.group.position.set(.3, .3, .23); comp.add(tg.group);
  const drain = cyl(.02, .02, .06, M(0xd9a441, { m: .7 }), 8); comp.add(at(drain, 0, .02, .18));
  comp.add(at(label(L('الكمبريسور والخزان', 'Compressor and receiver'), '#ffffff', .07), 0, .85, 0));
  // وحدة الخدمة FRL
  const frl = new THREE.Group(); frl.position.set(.1, .55, -.3); root.add(frl);
  const bowl = (x, col, name) => { const g = new THREE.Group(); g.position.x = x; frl.add(g); g.add(box(.16, .12, .14, M(0x9aa0a6, { m: .5 }))); g.add(at(cyl(.05, .04, .22, M(col, { opacity: .45 }), 16), 0, -.17, 0)); g.add(at(label(name, '#ffffff', .05), 0, .14, 0)); return g; };
  const fF = bowl(-.22, 0xdfe6ea, L('فلتر', 'Filter')), fR = bowl(0, 0x9aa0a6, L('منظم', 'Regulator')), fL = bowl(.22, 0xf2c94c, L('مزيّت', 'Lubricator'));
  const water = cyl(.04, .035, .05, M(0x5aa9e6, { opacity: .7 }), 12); fF.add(at(water, 0, -.25, 0));
  const knob = cyl(.04, .04, .05, M(0x1d2128), 14); fR.add(at(knob, 0, .1, 0));
  const rg = makeGauge('#2a62c9', 0, 10, [0, 2, 4, 6, 8, 10], 'bar'); rg.group.scale.setScalar(.28); rg.group.position.set(0, .02, .1); fR.add(rg.group);
  const drop = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), M(0xf2c94c)); fL.add(drop);
  const hIn = hoseOn(root, [V(-.9, .55, -.3), V(-.5, .7, -.3), V(-.22, .55, -.3)], 0x2a62c9, .016), hOut = hoseOn(root, [V(.42, .55, -.3), V(.8, .6, -.2), V(1.1, .35, 0)], 0x2a62c9, .016);
  const fIn = new Flow(root, hIn, { color: AIR_P, count: 10, speed: .8, size: .02 }), fOut = new Flow(root, hOut, { color: AIR_P, count: 10, speed: .8, size: .02 });
  const cy = makePCyl(.7, .06); cy.group.position.set(1.0, .3, .2); root.add(cy.group);
  const sb = symBoardP(.9, .5, [{ k: 'comp', t: L('كمبريسور', 'Compressor') }, { k: 'frl', t: L('وحدة خدمة', 'Service unit') }, { k: 'v32', t: L('صمام 3/2', '3/2 valve') }], L('رموز النيوماتيك', 'Pneumatic symbols')); sb.mesh.position.set(.9, 1.2, -1.5); root.add(sb.mesh);
  part('comp', comp, V(0, .95, 0), L('الكمبريسور', 'Compressor'), L('بيضغط هوا الجو ويخزّنه في الخزان.', 'Compresses air into the receiver.'));
  part('tg', tg.group, V(0, .2, 0), L('مانومتر الخزان', 'Receiver gauge'), L('ضغط الخزان (6 لـ 8 بار).', 'Receiver pressure (6–8 bar).'));
  part('fF', fF, V(0, .22, 0), L('الفلتر', 'Filter'), L('بيشيل المية والتراب من الهوا.', 'Removes water and dirt from the air.'));
  part('fR', fR, V(0, .22, 0), L('المنظم', 'Regulator'), L('دوس عليه تغيّر ضغط الشغل.', 'Tap to change the working pressure.'));
  part('fL', fL, V(0, .22, 0), L('المزيّت', 'Lubricator'), L('بيحط رذاذ زيت خفيف للصمامات والأسطوانات.', 'Adds a fine oil mist for valves and cylinders.'));
  part('sym', sb.mesh, V(0, .32, 0), L('الرموز', 'Symbols'), '');
  const st = { run: 1, set: 6, cmp: 0 }; let t = 0, tp = 0;
  ctx.parts.fR.tap = () => { st.set = st.set === 6 ? 4 : st.set === 4 ? 8 : 6; return L(`ضغط الشغل ${st.set} بار`, `Working pressure ${st.set} bar`); };
  return {
    ...ctx, view: V(.05, .55, 1.45), sway: true, hint: L('دوس على المنظم يغيّر الضغط', 'Tap the regulator to change pressure'),
    steps: [
      { title: L('علم النيوماتيك', 'Pneumatics'), text: L('النيوماتيك بيستخدم الهوا المضغوط بدل الزيت. مميزاته: نضيف، وسريع، والهوا موجود ببلاش، ومفيش خطر حريق، والأجزاء رخيصة. عيوبه: القوة أقل من الهيدروليك (الضغط 6 لـ 8 بار بس)، والهوا بيتضغط فالحركة مش دقيقة، وصوته عالي.', 'Pneumatics uses compressed air instead of oil. Pros: clean, fast, air is free, no fire risk, cheap parts. Cons: less force than hydraulics (only 6–8 bar), air compresses so motion is less precise, and it is noisy.'), s: {} },
      { title: L('الكمبريسور والخزان', 'Compressor and receiver'), text: L('المحرك بيلف الكمبريسور، فيسحب هوا الجو ويضغطه في الخزان لحد 8 بار تقريبًا، ومفتاح ضغط بيوقفه ويشغّله. الخزان بيخزن الهوا ويبرّده، والمية اللي بتتكثف بتتصرّف من البلف اللي تحت كل يوم.', 'A motor drives the compressor, which draws in air and pumps it into the receiver up to about 8 bar; a pressure switch starts and stops it. The receiver stores and cools the air; condensed water is drained daily from the bottom valve.'), focus: 'comp', s: {} },
      { title: L('وحدة الخدمة FRL', 'The service unit (FRL)'), text: L('قبل أي دايرة لازم الهوا يعدّي على وحدة الخدمة: فلتر بيشيل المية والتراب، ومنظم بيثبّت ضغط الشغل، ومزيّت بيحط زيت خفيف. دوس على المنظم تغيّر الضغط.', 'Before any circuit the air passes the service unit: a filter removes water and dirt, a regulator holds the working pressure and a lubricator adds a light oil mist. Tap the regulator to change the pressure.'), focus: 'fR', s: {} },
      { title: L('النيوماتيك والهيدروليك', 'Pneumatics versus hydraulics'), text: L('الهيدروليك: زيت، وضغط عالي (100 بار وأكتر)، وقوة كبيرة جدًا، وحركة دقيقة وبطيئة، والزيت بيرجع للخزان. النيوماتيك: هوا، وضغط 6 لـ 8 بار، وقوة أقل، وحركة سريعة، والهوا بيطلع للجو من فتحة العادم. عشان كده النيوماتيك للتغليف والتعبئة السريعة، والهيدروليك للمكابس والمعدات التقيلة.', 'Hydraulics: oil, high pressure (100 bar and up), very high force, slow precise motion, oil returns to tank. Pneumatics: air at 6–8 bar, less force, fast motion, air exhausts to atmosphere. Hence pneumatics for fast packing and handling, hydraulics for presses and heavy machines.'), focus: 'sym', s: {} },
      { title: L('مكونات وحدة النيوماتيك', 'The pneumatic unit'), text: L('الترتيب: كمبريسور ← خزان ← مجفف (اختياري) ← وحدة الخدمة ← صمامات التحكم ← الأسطوانات. اللون الأزرق الفاتح في الموديلات هو الهوا المضغوط، والرمادي هو الهوا الخارج للعادم.', 'In order: compressor → receiver → dryer (optional) → service unit → control valves → cylinders. In these models light blue is compressed air and grey is exhaust air.'), focus: 'fF', s: {} }
    ],
    apply(s){}, update(dt){ t += dt; tp = Math.min(8, tp + dt * 1.5); if(tp >= 8 && Math.random() < .002) tp = 6.5; const cmpOn = tp < 7.9;
      mot.shaft.rotation.x += cmpOn ? dt * 25 : 0; pist.position.z = .1 + (cmpOn ? Math.sin(t * 25) * .02 : 0); tg.set(tp); tg.update(dt); rg.set(Math.min(tp, st.set)); rg.update(dt); knob.rotation.y = st.set;
      fIn.target = 1; fOut.target = 1; fIn.update(dt); fOut.update(dt); drop.position.y = -.05 - ((t * .6) % 1) * .1; cy.set((Math.floor(t / 2.5) % 2) ? 1 : 0); cy.colors(AIR_P, AIR_X); cy.update(dt, 3); }
  };
}

/* ---------- دوائر نيوماتيك بالصمامات ---------- */
function buildPneuCircuits(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const pan = new THREE.Group(); pan.position.set(0, .05, -.9); root.add(pan); pan.add(at(box(3.0, 1.45, .05, M(0xb9c0c8, { m: .5 })), 0, .78, 0)); for(let i = 0; i < 9; i++) pan.add(at(box(3.0, .012, .02, M(0x8a9099)), 0, .1 + i * .16, .03));
  const cy = makePCyl(.8, .07, false); cy.group.position.set(.2, 1.15, -.84); root.add(cy.group);
  const cy1 = makePCyl(.8, .07, true); cy1.group.position.set(.2, 1.15, -.84); root.add(cy1.group);
  const main = makePValve('5/2', 0x2a62c9); main.group.position.set(.3, .8, -.82); root.add(main.group);
  const pb1 = makeButton(0x2fbf5a, 'S1'); pb1.group.position.set(-.6, .45, -.82); root.add(pb1.group); const v1 = makePValve('3/2'); v1.group.position.set(-.6, .62, -.82); root.add(v1.group);
  const pb2 = makeButton(0xe8c21a, 'S2'); pb2.group.position.set(-.1, .45, -.82); root.add(pb2.group); const v2 = makePValve('3/2'); v2.group.position.set(-.1, .62, -.82); root.add(v2.group);
  const fcv = new THREE.Group(); fcv.position.set(.75, 1.0, -.82); root.add(fcv); fcv.add(box(.12, .08, .08, M(0xc9a24a))); fcv.add(at(cyl(.03, .03, .03, M(0x1d2128), 12), 0, .06, 0)); fcv.add(at(label(L('خانق', 'Throttle'), '#ffffff', .045), 0, .12, .05));
  const frl = new THREE.Group(); frl.position.set(-1.25, .6, -.82); root.add(frl); frl.add(box(.3, .12, .12, M(0x9aa0a6, { m: .5 }))); frl.add(at(label('FRL', '#ffffff', .05), 0, .12, .07));
  const hS = hoseOn(root, [V(-1.1, .6, -.78), V(-.8, .7, -.78), V(-.6, .66, -.78)], 0x2a62c9, .012), hS2 = hoseOn(root, [V(-1.1, .6, -.78), V(-.4, .5, -.76), V(-.1, .66, -.78)], 0x2a62c9, .012);
  const hP1 = hoseOn(root, [V(-.6, .68, -.78), V(-.2, .85, -.78), V(.15, .8, -.78)], 0x1d2128, .01), hP2 = hoseOn(root, [V(-.1, .68, -.78), V(.3, .95, -.78), V(.45, .8, -.78)], 0x1d2128, .01);
  const hA = hoseOn(root, [V(.25, .86, -.78), V(.25, 1.0, -.8), V(.27, 1.23, -.82)], 0x1d2128, .012), hB = hoseOn(root, [V(.35, .86, -.78), V(.75, .95, -.8), V(.93, 1.23, -.82)], 0x1d2128, .012);
  const mkF = c => new Flow(root, c, { color: AIR_P, count: 8, speed: 1.2, size: .018 });
  const fS = mkF(hS), fS2 = mkF(hS2), fP1 = mkF(hP1), fP2 = mkF(hP2), fA = mkF(hA), fB = mkF(hB);
  const ex = puffs(root);
  const sb = symBoardP(1.0, .55, [{ k: 'v32', t: '3/2' }, { k: 'v52', t: '5/2' }, { k: 'v53', t: '5/3' }], L('الصمامات', 'Valves')); sb.mesh.position.set(1.0, .45, .2); sb.mesh.rotation.y = -.5; root.add(sb.mesh);
  part('cy', cy.group, V(.4, .14, 0), L('الأسطوانة', 'Cylinder'), L('أحادية أو مزدوجة الفعل.', 'Single- or double-acting.'));
  part('pb1', pb1.group, V(0, .1, .03), L('زرار S1 (صمام 3/2)', 'Button S1 (3/2 valve)'), L('دوس عليه.', 'Tap it.'));
  part('pb2', pb2.group, V(0, .1, .03), L('زرار S2 (صمام 3/2)', 'Button S2 (3/2 valve)'), L('دوس عليه.', 'Tap it.'));
  part('main', main.group, V(0, .15, 0), L('صمام التحكم الرئيسي', 'Main control valve'), L('بيوجّه الهوا للأسطوانة.', 'Directs air to the cylinder.'));
  part('fcv', fcv, V(0, .15, 0), L('صمام خانق لا راجع', 'One-way throttle'), L('بيبطّأ الحركة. دوس عليه.', 'Slows the motion. Tap it.'));
  part('sb', sb.mesh, V(0, .34, 0), L('رموز الصمامات', 'Valve symbols'), '');
  const st = { mode: 'single-no', a: 0, b: 0, mem: 0, slow: 0 }; let t = 0, ta = 0, tb = 0;
  ctx.parts.pb1.tap = () => { pb1.press(); ta = 1.4; if(st.mode === 'ind52' || st.mode === 'ind53') st.mem = 1; return L('S1 اتضغط.', 'S1 pressed.'); };
  ctx.parts.pb2.tap = () => { pb2.press(); tb = 1.4; if(st.mode === 'ind52') st.mem = 0; return L('S2 اتضغط.', 'S2 pressed.'); };
  ctx.parts.fcv.tap = () => { st.slow ^= 1; return st.slow ? L('قفلنا الخانق: الحركة بقت أبطأ.', 'Throttle closed down: slower.') : L('فتحنا الخانق.', 'Throttle opened.'); };
  return {
    ...ctx, view: V(.05, .35, 1.5), sway: true, hint: L('دوس على الزرار S1 أو S2', 'Tap button S1 or S2'),
    steps: [
      { title: L('تكوين دايرة نيوماتيك بسيطة', 'A simple pneumatic circuit'), text: L('أي دايرة: وحدة خدمة FRL ← صمام تحكم ← أسطوانة. الصمام بيتسمّى برقمين: عدد الفتحات/عدد الأوضاع. 3/2 يعني 3 فتحات (1 دخول، 2 للأسطوانة، 3 عادم) ووضعين.', 'Every circuit: FRL service unit → control valve → cylinder. Valves are named ports/positions: a 3/2 valve has 3 ports (1 supply, 2 to the cylinder, 3 exhaust) and two positions.'), s: { mode: 'single-nc' } },
      { title: L('أسطوانة أحادية الفعل بصمام 3/2 مقفول', 'Single-acting with a 3/2 NC valve'), text: L('صمام 3/2 مقفول في الطبيعي (NC): لما تدوس S1 الهوا يعدّي من 1 لـ 2 والأسطوانة تطلع، ولما تسيب الياي يرجّع الصمام فالهوا يطلع من العادم 3 والياي يرجّع الأسطوانة. دوس على S1.', 'A normally closed 3/2 valve: press S1 and air passes from 1 to 2, extending the cylinder; release it and the spring returns the valve, the air exhausts through 3 and the cylinder spring retracts it. Tap S1.'), focus: 'pb1', s: { mode: 'single-nc' } },
      { title: L('صمام 3/2 مفتوح في الطبيعي', 'A normally open 3/2 valve'), text: L('صمام 3/2 مفتوح في الطبيعي (NO) بيعدّي الهوا وانت مش ضاغط، فالأسطوانة تفضل طالعة، ولما تدوس الزرار ترجع. بيستخدم لما عايز الحاجة تفضل ماسكة إلا لما تفكها.', 'A normally open 3/2 valve passes air while released, so the cylinder stays out; pressing the button retracts it. Used where something must stay clamped until released.'), focus: 'pb1', s: { mode: 'single-no' } },
      { title: L('أسطوانة مزدوجة الفعل بصمام 5/2', 'Double-acting with a 5/2 valve'), text: L('صمام 5/2: فتحة دخول 1، وفتحتين للأسطوانة 4 و2، وفتحتين عادم 5 و3. بالزرار الهوا يروح لـ 4 والأسطوانة تطلع، ولما تسيبه الياي يرجّعه فالهوا يروح لـ 2 وترجع. دوس على S1.', 'A 5/2 valve has supply 1, cylinder ports 4 and 2, and exhausts 5 and 3. With the button, air goes to 4 and the cylinder extends; released, the spring returns it, air goes to 2 and it retracts. Tap S1.'), focus: 'main', s: { mode: 'dbl52' } },
      { title: L('صمام خانق لا راجع', 'One-way throttle'), text: L('خانق ومعاه لا راجع على خط الأسطوانة: الهوا الخارج من الأسطوانة بيتخنق فالحركة تبطّأ في الاتجاه ده بس، والهوا الداخل بيعدّي حر. ده التحكم في خروج الهوا، وهو الأحسن في النيوماتيك. دوس على الخانق.', 'A throttle with a check valve on the cylinder line: exhaust air leaving the cylinder is throttled, slowing that stroke only, while incoming air flows freely. This is meter-out control, preferred in pneumatics. Tap the throttle.'), focus: 'fcv', s: { mode: 'dbl52', slow: 1 } },
      { title: L('تحكم غير مباشر بإشارة هوائية', 'Indirect control by air signal'), text: L('الزرار S1 (صمام 3/2 صغير) بيبعت إشارة هوا بتزق الصمام الرئيسي الكبير، والرئيسي هو اللي بيشغّل الأسطوانة. ده عشان الأسطوانات الكبيرة محتاجة صمام كبير، والزرار يفضل صغير وقريب من العامل.', 'Button S1 (a small 3/2 valve) sends an air signal that pilots the large main valve, which drives the cylinder. Large cylinders need a large valve, while the button stays small and close to the operator.'), focus: 'main', s: { mode: 'ind32' } },
      { title: L('صمام 5/2 بإشارتين هوائيتين', '5/2 valve with two air pilots'), text: L('الصمام الرئيسي 5/2 ليه إشارتين: S1 يبعت إشارة تطلّع الأسطوانة، وS2 يبعت إشارة ترجّعها. الصمام بيفتكر آخر إشارة (ذاكرة)، فلو سبت الزرار الأسطوانة تفضل مكانها. دوس على S1 وبعدين S2.', 'The main 5/2 valve has two pilots: S1 signals extend and S2 signals retract. It remembers the last signal (memory), so releasing the button leaves the cylinder where it is. Tap S1, then S2.'), focus: 'pb2', s: { mode: 'ind52' } },
      { title: L('صمام 5/3 بإشارتين', '5/3 valve with two pilots'), text: L('صمام 5/3 ليه وضع نص بالياي: طول ما S1 مضغوط الأسطوانة بتطلع، وطول ما S2 مضغوط بترجع، ولو سبت الاتنين الصمام يرجع للنص والأسطوانة تقف مكانها. وبرنامج Automation Studio بيخليك ترسم الدواير دي وتجربها قبل التنفيذ.', 'A spring-centred 5/3 valve: while S1 is held the cylinder extends, while S2 is held it retracts, and releasing both centres the valve so the cylinder stops where it is. Automation Studio lets you draw and test these circuits before building them.'), focus: 'sb', s: { mode: 'ind53' } }
    ],
    apply(s){ Object.assign(st, { mem: 0, slow: 0 }, s); ta = 0; tb = 0; },
    update(dt){ t += dt; ta = Math.max(0, ta - dt); tb = Math.max(0, tb - dt); pb1.update(dt); pb2.update(dt); const A = ta > 0, B = tb > 0, m = st.mode;
      const single = m.startsWith('single'); cy.group.visible = !single; cy1.group.visible = single; main.group.visible = !single; v2.group.visible = pb2.group.visible = m === 'ind52' || m === 'ind53';
      let out = 0; if(m === 'single-nc') out = A ? 1 : 0; else if(m === 'single-no') out = A ? 0 : 1; else if(m === 'dbl52' || m === 'ind32') out = A ? 1 : 0; else if(m === 'ind52') out = st.mem; else if(m === 'ind53') out = A ? 1 : B ? 0 : -1;
      const c = single ? cy1 : cy; const prev = c.f; if(out >= 0) c.set(out); else c.set(c.f); c.colors(out === 1 ? AIR_P : AIR_X, out === 0 && !single ? AIR_P : AIR_X); const mv = c.update(dt, st.slow && out === 1 ? 1 : 4);
      if(mv && out === 0 && prev > .9) ex.fire(V(.25, 1.25, -.8)); ex.update();
      main.set(out === 1); v1.set(A); v2.set(B);
      fS.target = 1; fS2.target = v2.group.visible ? 1 : 0; fP1.target = A && !single ? 1 : 0; fP2.target = B && v2.group.visible ? 1 : 0; fA.target = (out === 1) && mv ? 1 : 0; fB.target = (out === 0) && mv && !single ? 1 : 0;
      [fS, fS2, fP1, fP2, fA, fB].forEach(f => f.update(dt));
    }
  };
}

/* ---------- صمامات AND وOR ---------- */
function buildPneuLogic(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const mkBtn = (x, col, t) => { const b = makeButton(col, t); b.group.position.set(x, .25, .25); b.group.rotation.x = -.6; root.add(b.group); return b; };
  const b1 = mkBtn(-1.0, 0x2fbf5a, 'S1'), b2 = mkBtn(-.4, 0x2fbf5a, 'S2');
  const lv = new THREE.Group(); lv.position.set(-.7, .45, -.3); root.add(lv); lv.add(box(.4, .16, .16, M(0xc9a24a, { m: .5, opacity: .5 })));
  const shuttle = new THREE.Mesh(new THREE.SphereGeometry(.045, 14, 10), M(0x3a3f46, { m: .6 })); lv.add(shuttle); const andBar = box(.2, .05, .05, M(0x3a3f46, { m: .6 })); lv.add(andBar);
  const lvLab = label('OR', '#ffffff', .08); lvLab.position.set(0, .18, .09); lv.add(lvLab);
  const cy = makePCyl(.8, .07); cy.group.position.set(.15, .45, -.3); root.add(cy.group);
  const h1 = hoseOn(root, [V(-1.0, .32, .22), V(-1.0, .45, 0), V(-.9, .45, -.3)], 0x1d2128, .012), h2 = hoseOn(root, [V(-.4, .32, .22), V(-.4, .45, 0), V(-.5, .45, -.3)], 0x1d2128, .012), h3 = hoseOn(root, [V(-.7, .53, -.3), V(-.5, .7, -.3), V(.22, .53, -.3)], 0x1d2128, .012);
  const mkF = c => new Flow(root, c, { color: AIR_P, count: 8, speed: 1.1, size: .02 }); const f1 = mkF(h1), f2 = mkF(h2), f3 = mkF(h3);
  const tt = makeCanvas(.8, .5, 512); tt.mesh.position.set(.9, 1.1, -1.5); root.add(tt.mesh);
  part('b1', b1.group, V(0, .1, .03), 'S1', L('دوس عليه.', 'Tap it.')); part('b2', b2.group, V(0, .1, .03), 'S2', L('دوس عليه.', 'Tap it.'));
  part('lv', lv, V(0, .2, 0), L('صمام المنطق', 'Logic valve'), L('بيقرر يعدّي الهوا ولا لأ.', 'Decides whether air passes.'));
  part('tt', tt.mesh, V(0, .3, 0), L('جدول الحقيقة', 'Truth table'), '');
  const st = { g: 'or', a: 0, b: 0 }; let t = 0;
  ctx.parts.b1.tap = () => { b1.press(); st.a ^= 1; return `S1 = ${st.a}`; }; ctx.parts.b2.tap = () => { b2.press(); st.b ^= 1; return `S2 = ${st.b}`; };
  return {
    ...ctx, view: V(.05, .7, 1.4), sway: true, hint: L('دوس على S1 وS2', 'Tap S1 and S2'),
    steps: [
      { title: L('صمامات المنطق', 'Logic valves'), text: L('بنستخدم صمامات بسيطة تعمل نفس شغل البوابات المنطقية بالهوا: صمام OR (المكوك) وصمام AND (ثنائي الضغط). كل زرار هنا صمام 3/2 بيبعت إشارة هوا. دوس على S1 وS2 (كل ضغطة بتقلبه).', 'Simple valves do the job of logic gates with air: the OR (shuttle) valve and the AND (two-pressure) valve. Each button here is a 3/2 valve sending an air signal. Tap S1 and S2; each tap toggles it.'), s: { g: 'or', a: 0, b: 0 } },
      { title: L('صمام OR (المكوك)', 'The OR (shuttle) valve'), text: L('ليه دخلين وخرج واحد، وجواه بلية بتتزق ناحية الدخل اللي مفيهوش هوا. أي زرار منهم كفاية يطلّع الأسطوانة. بيستخدم لما عايز تشغّل من مكانين.', 'Two inputs, one output, and a ball pushed toward the input without air. Either button alone extends the cylinder. Used to operate from two places.'), focus: 'lv', s: { g: 'or', a: 1, b: 0 } },
      { title: L('صمام AND (ثنائي الضغط)', 'The AND (two-pressure) valve'), text: L('الخرج بيطلع بس لما الدخلين الاتنين فيهم هوا. بيستخدم للأمان: العامل لازم يدوس بإيديه الاتنين مع بعض عشان المكبس ينزل، فإيده ما تبقاش تحته.', 'Output appears only when both inputs have air. Used for safety: the operator must press with both hands together for the press to close, keeping hands clear.'), focus: 'lv', s: { g: 'and', a: 1, b: 1 } },
      { title: L('AND وOR مع بعض', 'AND and OR together'), text: L('ممكن نجمع الاتنين: مثلًا (S1 AND S2) OR S3، يعني تشغيل بالإيدين من مكان، أو بزرار واحد من غرفة التحكم. جدول الحقيقة بيوري كل الاحتمالات. جرّب بنفسك.', 'They can be combined, for example (S1 AND S2) OR S3: two-hand operation at the machine, or one button in the control room. The truth table shows every case. Try it.'), focus: 'tt', s: { g: 'and', a: 0, b: 1 } }
    ],
    apply(s){ Object.assign(st, s); },
    update(dt){ t += dt; b1.update(dt); b2.update(dt); const out = st.g === 'or' ? (st.a || st.b) : (st.a && st.b);
      shuttle.visible = st.g === 'or'; andBar.visible = st.g === 'and'; if(lv.userData.g !== st.g){ lv.remove(lv.userData.lab || lvLab); const nl = label(st.g.toUpperCase(), '#ffffff', .08); nl.position.set(0, .18, .09); lv.add(nl); lv.userData.lab = nl; lv.userData.g = st.g; }
      shuttle.position.x = ease(shuttle.position.x, st.a && !st.b ? .12 : st.b && !st.a ? -.12 : 0, dt, 8);
      cy.set(out ? 1 : 0); cy.colors(out ? AIR_P : AIR_X, out ? AIR_X : AIR_P); cy.update(dt, 4);
      f1.target = st.a; f2.target = st.b; f3.target = out ? 1 : 0; [f1, f2, f3].forEach(f => f.update(dt));
      const key = st.g + st.a + st.b; if(tt.mesh.userData.k !== key){ tt.mesh.userData.k = key; tt.draw((x, W, H) => { x.fillStyle = '#0d1b2e'; x.fillRect(0, 0, W, H); x.font = 'bold 34px monospace'; x.textAlign = 'center'; x.fillStyle = '#cfe7ff'; x.fillText(`S1 S2 | ${st.g.toUpperCase()}`, W / 2, 50);
        [[0, 0], [0, 1], [1, 0], [1, 1]].forEach(([a, b], i) => { const y = st.g === 'or' ? (a || b) : (a && b); x.fillStyle = a === st.a && b === st.b ? '#ffd34d' : '#cfe7ff'; x.fillText(`${a}  ${b}  |  ${y}`, W / 2, 110 + i * 60); }); }); }
    }
  };
}

/* ---------- الإلكترونيوماتيك ---------- */
function buildElectroPneu(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const eb = new THREE.Group(); eb.position.set(-.9, .05, -.4); root.add(eb); eb.add(at(box(.9, .75, .12, M(0xe9ebef, { r: .5 })), 0, .42, 0)); eb.add(at(label(L('وحدة الكهربا 24V', '24 V unit'), '#1b1f26', .055), 0, .74, .07));
  const S1 = makeButton(0x2fbf5a, 'S1'); S1.group.position.set(-.25, .5, .07); eb.add(S1.group); const S2 = makeButton(0xd23a2e, 'S2'); S2.group.position.set(.05, .5, .07); eb.add(S2.group); const S0 = makeButton(0x6c747d, 'STOP'); S0.group.position.set(.3, .5, .07); eb.add(S0.group);
  const relay = new THREE.Group(); relay.position.set(-.1, .22, .08); eb.add(relay); relay.add(box(.18, .14, .1, M(0x2a62c9, { opacity: .6 }))); const kL = M(0x551111); relay.add(at(new THREE.Mesh(new THREE.SphereGeometry(.015, 8, 6), kL), .07, .05, .06)); relay.add(at(label('K1', '#ffffff', .05), 0, -.11, .06));
  const val = new THREE.Group(); val.position.set(.35, .45, -.3); root.add(val); val.add(box(.34, .12, .12, M(0x2a62c9, { m: .4 }))); const y1 = box(.12, .12, .12, M(0x1d2128)); val.add(at(y1, -.23, 0, 0)); const y2 = box(.12, .12, .12, M(0x1d2128)); val.add(at(y2, .23, 0, 0));
  const yL1 = M(0x551111), yL2 = M(0x551111); val.add(at(new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), yL1), -.23, .08, .07)); val.add(at(new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), yL2), .23, .08, .07));
  const vLab = makePanel(.2, .07, { bg: '#111', fg: '#7fe0ff', font: 'bold 54px monospace' }); val.add(at(vLab.mesh, 0, .1, .065));
  const cy = makePCyl(.8, .07, false), cy1 = makePCyl(.8, .07, true); [cy, cy1].forEach(c => { c.group.position.set(-.1, .9, -.6); root.add(c.group); });
  const ls = new THREE.Group(); ls.position.set(.85, .9, -.45); root.add(ls); ls.add(box(.1, .14, .08, M(0xe8c21a))); ls.add(at(label('S3', '#ffd34d', .05), 0, .12, 0)); const lsLed = M(0x333a44); ls.add(at(new THREE.Mesh(new THREE.SphereGeometry(.015, 8, 6), lsLed), .04, .05, .045));
  const lad = makeCanvas(.95, .6, 512); lad.mesh.position.set(1.0, 1.2, -1.5); root.add(lad.mesh);
  part('S1', S1.group, V(0, .1, .03), 'S1', L('دوس عليه.', 'Tap it.')); part('S2', S2.group, V(0, .1, .03), 'S2', L('دوس عليه.', 'Tap it.')); part('S0', S0.group, V(0, .1, .03), 'STOP', L('بيفك الحفظ.', 'Releases the latch.'));
  part('relay', relay, V(0, .12, .05), 'K1', L('ريلاي الحفظ.', 'Latching relay.')); part('val', val, V(0, .15, 0), L('صمام بسلونويد', 'Solenoid valve'), L('ملف 24 فولت بيزق الصمام.', 'A 24 V coil shifts the valve.')); part('ls', ls, V(0, .15, 0), L('ليمت سويتش S3', 'Limit switch S3'), '');
  part('lad', lad.mesh, V(0, .33, 0), L('الدايرة الكهربية', 'Electrical diagram'), '');
  const st = { mode: 'latch32', k: 0, p: 0 }; let t = 0, a1 = 0, a2 = 0;
  ctx.parts.S1.tap = () => { S1.press(); a1 = 1.2; if(st.mode === 'latch32' || st.mode === 'ls') st.k = 1; if(st.mode === 'dbl52') st.p = 1; return L('S1', 'S1'); };
  ctx.parts.S2.tap = () => { S2.press(); a2 = 1.2; if(st.mode === 'dbl52') st.p = 0; return L('S2', 'S2'); };
  ctx.parts.S0.tap = () => { S0.press(); st.k = 0; return L('STOP: الحفظ اتفك.', 'STOP: latch released.'); };
  const drawLad = (rows) => lad.draw((x, W, H) => { x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, W, H); x.lineWidth = 4; x.strokeStyle = '#2b3038'; x.beginPath(); x.moveTo(30, 20); x.lineTo(30, H - 20); x.moveTo(W - 30, 20); x.lineTo(W - 30, H - 20); x.stroke(); x.font = 'bold 20px monospace'; x.fillStyle = '#111'; x.fillText('+24V', 4, 16);
    rows.forEach(([y, on, items]) => { x.strokeStyle = on ? '#e0a400' : '#2b3038'; x.lineWidth = on ? 6 : 3; x.beginPath(); x.moveTo(30, y); x.lineTo(W - 30, y); x.stroke(); items.forEach(([px, s]) => { x.fillStyle = '#fbfaf5'; x.fillRect(px - 32, y - 18, 64, 36); x.strokeRect(px - 32, y - 18, 64, 36); x.fillStyle = '#111'; x.font = 'bold 17px monospace'; x.textAlign = 'center'; x.fillText(s, px, y + 6); }); x.textAlign = 'left'; }); });
  return {
    ...ctx, view: V(.05, .55, 1.45), sway: true, hint: L('دوس على S1 وS2 وSTOP', 'Tap S1, S2 and STOP'),
    steps: [
      { title: L('مبادئ الإلكترونيوماتيك', 'Electro-pneumatic principles'), text: L('القدرة هوا، والتحكم كهربا: الأسطوانة بتشتغل بالهوا، والصمام بيتحرك بملف سلونويد 24 فولت، والأوامر بتيجي من زراير وريلايات وحساسات وPLC. ده أسرع وأسهل في التوصيل لمسافات طويلة.', 'Power from air, control by electricity: the cylinder runs on air, the valve is moved by a 24 V solenoid and commands come from buttons, relays, sensors and a PLC. Faster, and easier to wire over long distances.'), s: { mode: 'latch32' } },
      { title: L('صمام 3/2 بإشارة كهربا وحفظ إشارة', '3/2 solenoid valve with latching'), text: L('S1 بيشغّل الريلاي K1، وتلامس K1 بيمسك نفسه وبيغذي ملف الصمام Y1، فالأسطوانة الأحادية تطلع وتفضل طالعة لحد ما تدوس STOP. دوس S1 وبعدين STOP.', 'S1 energises relay K1; a K1 contact holds it in and feeds solenoid Y1, so the single-acting cylinder extends and stays out until STOP. Tap S1, then STOP.'), focus: 'S0', s: { mode: 'latch32' } },
      { title: L('صمام 5/2 بإشارة كهربا واحدة', '5/2 valve with one solenoid'), text: L('صمام 5/2 بملف واحد وياي: طول ما الملف متغذي الأسطوانة المزدوجة طالعة، ولما الكهربا تقطع الياي يرجّعها. يعني لو النور قطع الأسطوانة بترجع لوحدها، وده آمن في حاجات كتير.', 'A single-solenoid spring-return 5/2 valve: while the coil is on, the double-acting cylinder is out; when power is lost the spring returns it. So a power cut retracts it, which is safe for many machines.'), focus: 'val', s: { mode: 'single52' } },
      { title: L('صمام 5/2 بإشارتين كهربا', '5/2 valve with two solenoids'), text: L('صمام 5/2 بملفين Y1 وY2 ومفيهوش ياي: نبضة على Y1 تطلّع الأسطوانة، ونبضة على Y2 ترجّعها، والصمام بيفتكر آخر وضع حتى لو الكهربا قطعت. دوس S1 وبعدين S2.', 'A double-solenoid 5/2 valve with no spring: a pulse on Y1 extends, a pulse on Y2 retracts, and the valve keeps its last position even if power is lost. Tap S1, then S2.'), focus: 'S2', s: { mode: 'dbl52' } },
      { title: L('أسطوانة أحادية مع ليمت سويتش', 'Single-acting cylinder with a limit switch'), text: L('دوس S1: الأسطوانة تطلع، ولما توصل آخر المشوار تضغط على الليمت سويتش S3، والتلامس المقفول بتاعه يفتح ويفك حفظ الريلاي، فالصمام يرجع والأسطوانة ترجع لوحدها. كده عملنا دورة أوتوماتيك كاملة بضغطة واحدة.', 'Tap S1: the cylinder extends, presses limit switch S3 at the end of stroke, and its normally closed contact opens to break the relay latch, so the valve drops out and the cylinder retracts on its own: a full automatic cycle from one press.'), focus: 'ls', s: { mode: 'ls' } }
    ],
    apply(s){ Object.assign(st, { k: 0, p: 0 }, s); a1 = 0; a2 = 0; },
    update(dt){ t += dt; a1 = Math.max(0, a1 - dt); a2 = Math.max(0, a2 - dt); [S1, S2, S0].forEach(b => b.update(dt)); const m = st.mode;
      const single = m === 'latch32' || m === 'ls'; cy1.group.visible = single; cy.group.visible = !single; const c = single ? cy1 : cy;
      let Y1 = 0, Y2 = 0; if(single) Y1 = st.k; if(m === 'single52') Y1 = a1 > 0 ? 1 : 0; if(m === 'dbl52'){ Y1 = a1 > 0 ? 1 : 0; Y2 = a2 > 0 ? 1 : 0; }
      const out = m === 'dbl52' ? st.p : Y1; c.set(out); c.colors(out ? AIR_P : AIR_X, out ? AIR_X : AIR_P); c.update(dt, 3);
      const hit = c.f > .96; setGlow(lsLed, hit ? 1 : 0, 1, .8, .1); if(m === 'ls' && hit) st.k = 0;
      setGlow(yL1, Y1, 1, .2, .1); setGlow(yL2, Y2, 1, .2, .1); setGlow(kL, single ? st.k : 0, 1, .2, .1); y2.visible = m === 'dbl52'; S2.group.visible = m === 'dbl52'; S0.group.visible = single; relay.visible = single;
      vLab.setText(m === 'latch32' || m === 'ls' ? '3/2' : '5/2');
      const key = m + Y1 + Y2 + st.k + hit; if(lad.mesh.userData.k !== key){ lad.mesh.userData.k = key; const H = 300;
        if(single) drawLad([[H * .3, st.k, [[150, 'S1'], [280, 'STOP'], ...(m === 'ls' ? [[380, 'S3']] : []), [440, 'K1']]], [H * .75, Y1, [[150, 'K1'], [400, 'Y1']]]]);
        else if(m === 'single52') drawLad([[H * .45, Y1, [[150, 'S1'], [400, 'Y1']]]]);
        else drawLad([[H * .3, Y1, [[150, 'S1'], [400, 'Y1']]], [H * .7, Y2, [[150, 'S2'], [400, 'Y2']]]]); }
    }
  };
}

/* ---------- الـ PLC ---------- */
function buildPLC(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const plc = new THREE.Group(); plc.position.set(-.35, .2, -.55); root.add(plc);
  plc.add(at(box(1.2, .55, .2, M(0xd9dde2, { r: .45 })), 0, .27, 0)); plc.add(at(box(.3, .55, .21, M(0x2b3038)), -.75, .27, 0)); plc.add(at(label(L('مصدر 24V', '24 V PSU'), '#ffffff', .05), -.75, .45, .11));
  plc.add(at(label('PLC', '#1b1f26', .1), .4, .4, .11)); plc.add(at(label('CPU', '#1b1f26', .06), .4, .3, .11));
  const inL = [], outL = [];
  for(let i = 0; i < 8; i++){ const m = M(0x334433); plc.add(at(new THREE.Mesh(new THREE.SphereGeometry(.015, 8, 6), m), -.45 + i * .07, .47, .105)); inL.push(m); }
  for(let i = 0; i < 6; i++){ const m = M(0x443322); plc.add(at(new THREE.Mesh(new THREE.SphereGeometry(.015, 8, 6), m), -.45 + i * .07, .1, .105)); outL.push(m); }
  plc.add(at(label('I0.0 … I0.7', '#1b1f26', .045), -.2, .52, .11)); plc.add(at(label('Q0.0 … Q0.5', '#1b1f26', .045), -.25, .04, .11));
  const runL = M(0x2fbf5a); plc.add(at(new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), runL), .12, .47, .105)); plc.add(at(label('RUN', '#1b1f26', .04), .12, .52, .11));
  const mkB = (x, z, col, t) => { const b = makeButton(col, t); b.group.position.set(x, .12, z); b.group.rotation.x = -1.2; root.add(b.group); return b; };
  const start1 = mkB(-1.1, .35, 0x2fbf5a, 'START1'), stop1 = mkB(-.85, .35, 0xd23a2e, 'STOP1'), start2 = mkB(-.6, .35, 0x2fbf5a, 'START2'), stop2 = mkB(-.35, .35, 0xd23a2e, 'STOP2');
  const lamp = makeLED(0xffd34d); lamp.group.scale.setScalar(2.5); lamp.group.position.set(.55, .05, .3); root.add(lamp.group); root.add(at(label('Q0.0', '#ffffff', .06), .55, .5, .3));
  const lap = new THREE.Group(); lap.position.set(1.15, 0, -.2); lap.rotation.y = -.5; root.add(lap); lap.add(at(box(.9, .03, .6, M(0x2b3038)), 0, .015, 0)); const scrG = new THREE.Group(); scrG.position.set(0, .03, -.3); scrG.rotation.x = -.25; lap.add(scrG); scrG.add(at(box(.9, .58, .02, M(0x1d2128)), 0, .29, 0));
  const scr = makeCanvas(.84, .52, 640); scrG.add(at(scr.mesh, 0, .29, .011));
  const cyc = new THREE.Group(); cyc.position.set(.4, .75, -.55); root.add(cyc); const cycM = []; [0, 1, 2].forEach(i => { const a = i / 3 * Math.PI * 2; const s = new THREE.Mesh(new THREE.TorusGeometry(.12, .02, 8, 20, Math.PI * .55), M(0x9aa0a6)); s.rotation.z = a; cyc.add(s); cycM.push(s.material); });
  const cycLab = label('', '#ffd34d', .06);
  part('plc', plc, V(0, .62, .1), 'PLC', L('مداخل ومخارج ومعالج بيشغّل البرنامج.', 'Inputs, outputs and a CPU running the program.'));
  part('start1', start1.group, V(0, .1, .05), 'START1 (I0.0)', L('دوس عليه.', 'Tap it.')); part('stop1', stop1.group, V(0, .1, .05), 'STOP1 (I0.1)', L('دوس عليه.', 'Tap it.'));
  part('start2', start2.group, V(0, .1, .05), 'START2 (I0.2)', L('دوس عليه.', 'Tap it.')); part('stop2', stop2.group, V(0, .1, .05), 'STOP2 (I0.3)', L('دوس عليه.', 'Tap it.'));
  part('lamp', lamp.group, V(0, .4, 0), L('الحمل Q0.0', 'Load Q0.0'), L('لمبة أو كونتاكتور محرك.', 'A lamp or motor contactor.'));
  part('lap', lap, V(0, .7, -.3), L('برنامج البرمجة', 'Programming software'), L('البرنامج بلغة السلم (Ladder).', 'The program in ladder logic.'));
  part('cyc', cyc, V(0, .18, 0), L('دورة المسح', 'Scan cycle'), L('قراءة ← تنفيذ ← كتابة.', 'Read → execute → write.'));
  const st = { mode: 'intro', q: 0, lang: 'lad', timer: 0 }; let t = 0, p1 = 0, p2 = 0, s1 = 0, s2 = 0, tAcc = 0;
  const tapB = (b, k) => { b.press(); if(k === 'p1') p1 = .5; if(k === 'p2') p2 = .5; if(k === 's1') s1 = .5; if(k === 's2') s2 = .5; };
  ctx.parts.start1.tap = () => { tapB(start1, 'p1'); return 'I0.0 = 1'; }; ctx.parts.stop1.tap = () => { tapB(stop1, 's1'); return 'I0.1 = 0'; };
  ctx.parts.start2.tap = () => { tapB(start2, 'p2'); return 'I0.2 = 1'; }; ctx.parts.stop2.tap = () => { tapB(stop2, 's2'); return 'I0.3 = 0'; };
  ctx.parts.lap.tap = () => { st.lang = st.lang === 'lad' ? 'fbd' : st.lang === 'fbd' ? 'stl' : 'lad'; return { lad: 'Ladder (LAD)', fbd: 'Function Block (FBD)', stl: 'Statement List (STL / IL)' }[st.lang]; };
  const draw = (I0, I1, I2, I3, Q, tm) => scr.draw((x, W, H) => { x.fillStyle = '#f4f6f8'; x.fillRect(0, 0, W, H); x.fillStyle = '#2a62c9'; x.fillRect(0, 0, W, 34); x.fillStyle = '#fff'; x.font = 'bold 20px Tahoma'; x.textAlign = 'left'; x.fillText(`PLC Editor · ${st.lang.toUpperCase()}`, 12, 24);
    const multi = st.mode === 'multi', tmr = st.mode === 'timer';
    if(st.lang === 'stl'){ x.fillStyle = '#111'; x.font = 'bold 26px monospace'; const lines = multi ? ['A(', 'O I0.0', 'O I0.2', 'O Q0.0', ')', 'A I0.1', 'A I0.3', '= Q0.0'] : tmr ? ['A I0.0', 'L S5T#5S', 'SD T1', 'A T1', '= Q0.0'] : ['A(', 'O I0.0', 'O Q0.0', ')', 'A I0.1', '= Q0.0']; lines.forEach((l, i) => x.fillText(l, 30, 70 + i * 34)); return; }
    if(st.lang === 'fbd'){ x.strokeStyle = '#111'; x.lineWidth = 3; x.strokeRect(W * .3, 80, 110, 120); x.strokeRect(W * .58, 110, 110, 90); x.fillStyle = '#111'; x.font = 'bold 26px monospace'; x.textAlign = 'center'; x.fillText('>=1', W * .3 + 55, 145); x.fillText('&', W * .58 + 55, 160); x.font = 'bold 20px monospace'; x.textAlign = 'right'; x.fillText(multi ? 'I0.0/I0.2' : 'I0.0', W * .3 - 6, 110); x.fillText('Q0.0', W * .3 - 6, 180); x.fillText(multi ? 'I0.1·I0.3' : 'I0.1', W * .58 - 6, 190); x.textAlign = 'left'; x.fillStyle = Q ? '#e0a400' : '#111'; x.fillText('= Q0.0', W * .58 + 120, 160); return; }
    const y0 = 90, rail = (y, on) => { x.strokeStyle = on ? '#e0a400' : '#2b3038'; x.lineWidth = on ? 6 : 3; x.beginPath(); x.moveTo(30, y); x.lineTo(W - 30, y); x.stroke(); };
    x.strokeStyle = '#2b3038'; x.lineWidth = 4; x.beginPath(); x.moveTo(30, 50); x.lineTo(30, H - 20); x.moveTo(W - 30, 50); x.lineTo(W - 30, H - 20); x.stroke();
    const contact = (cx, y, name, nc, on) => { x.fillStyle = '#f4f6f8'; x.fillRect(cx - 26, y - 22, 52, 44); x.strokeStyle = on ? '#e0a400' : '#111'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx - 14, y - 20); x.lineTo(cx - 14, y + 20); x.moveTo(cx + 14, y - 20); x.lineTo(cx + 14, y + 20); if(nc){ x.moveTo(cx - 18, y + 18); x.lineTo(cx + 18, y - 18); } x.stroke(); x.fillStyle = '#111'; x.font = 'bold 18px monospace'; x.textAlign = 'center'; x.fillText(name, cx, y - 28); };
    const coil = (cx, y, name, on) => { x.fillStyle = '#f4f6f8'; x.fillRect(cx - 24, y - 22, 48, 44); x.strokeStyle = on ? '#e0a400' : '#111'; x.lineWidth = 4; x.beginPath(); x.arc(cx - 6, y, 20, Math.PI * .6, Math.PI * 1.4); x.stroke(); x.beginPath(); x.arc(cx + 6, y, 20, -Math.PI * .4, Math.PI * .4); x.stroke(); x.fillStyle = '#111'; x.font = 'bold 18px monospace'; x.textAlign = 'center'; x.fillText(name, cx, y - 28); };
    if(tmr){ rail(y0, I0); contact(120, y0, 'I0.0', 0, I0); x.strokeStyle = '#111'; x.lineWidth = 3; x.fillStyle = '#f4f6f8'; x.fillRect(W * .45, y0 - 30, 140, 90); x.strokeRect(W * .45, y0 - 30, 140, 90); x.fillStyle = '#111'; x.font = 'bold 20px monospace'; x.textAlign = 'center'; x.fillText('TON T1', W * .45 + 70, y0 - 6); x.fillText(`PT 5s`, W * .45 + 70, y0 + 20); x.fillStyle = '#d0021b'; x.fillText(`ET ${tm.toFixed(1)}s`, W * .45 + 70, y0 + 46);
      rail(y0 + 140, Q); contact(120, y0 + 140, 'T1', 0, Q); coil(W - 110, y0 + 140, 'Q0.0', Q); return; }
    rail(y0, Q); contact(110, y0, 'I0.0', 0, I0); if(multi) contact(110, y0 + 70, 'I0.2', 0, I2); contact(110, y0 + (multi ? 140 : 70), 'Q0.0', 0, Q);
    x.strokeStyle = Q ? '#e0a400' : '#2b3038'; x.lineWidth = 3; const yb = y0 + (multi ? 140 : 70); x.beginPath(); x.moveTo(60, y0); x.lineTo(60, yb); x.lineTo(160, yb); x.lineTo(160, y0); if(multi){ x.moveTo(60, y0 + 70); x.lineTo(160, y0 + 70); } x.stroke();
    contact(W * .45, y0, 'I0.1', 1, I1); if(multi) contact(W * .6, y0, 'I0.3', 1, I3); coil(W - 110, y0, 'Q0.0', Q); });
  return {
    ...ctx, view: V(.05, .6, 1.45), sway: true, hint: L('دوس على زراير START وSTOP، أو على اللابتوب تغيّر اللغة', 'Tap START/STOP, or the laptop to change language'),
    steps: [
      { title: L('ما هو الـ PLC؟', 'What is a PLC?'), text: L('الـ PLC كمبيوتر صناعي بيتحكم في الماكينات بدل الريلايات الكتير: مصدر 24 فولت، ومعالج CPU فيه البرنامج، وكروت مداخل (I) بيدخلها الزراير والحساسات، وكروت مخارج (Q) بتشغّل اللمبات والكونتاكتورات والصمامات. ليدات المداخل والمخارج بتوريك مين شغال.', 'A PLC is an industrial computer that replaces masses of relays: a 24 V supply, a CPU holding the program, input cards (I) for buttons and sensors and output cards (Q) for lamps, contactors and valves. The I/O LEDs show what is on.'), focus: 'plc', s: { mode: 'intro' } },
      { title: L('دورة المسح', 'The scan cycle'), text: L('الـ PLC بيشتغل في دورة بتتكرر كل كام مللي ثانية: 1) يقرا كل المداخل، 2) ينفّذ البرنامج سطر سطر، 3) يكتب النتيجة على المخارج. وبعدين يعيد من الأول. الأسهم الصفرا بتوري الخطوة الحالية.', 'A PLC repeats a cycle every few milliseconds: 1) read all inputs, 2) execute the program line by line, 3) write the results to the outputs, then start again. The yellow arrows show the current stage.'), focus: 'cyc', s: { mode: 'intro' } },
      { title: L('لغات البرمجة', 'Programming languages'), text: L('أشهر اللغات (IEC 61131-3): لغة السلم Ladder (LAD) شبه الدواير الكهربا، والبلوكات الوظيفية FBD شبه البوابات المنطقية، وقائمة الأوامر STL/IL نص. دوس على اللابتوب تشوف نفس البرنامج بالتلات لغات.', 'The main IEC 61131-3 languages: Ladder (LAD), like relay diagrams; Function Block Diagram (FBD), like logic gates; and Statement List (STL/IL), as text. Tap the laptop to see the same program in all three.'), focus: 'lap', s: { mode: 'single' } },
      { title: L('تشغيل وإيقاف (حفظ ذاتي)', 'Start/stop with latching'), text: L('START (I0.0) مفتوح في الطبيعي، وSTOP (I0.1) مقفول في الطبيعي، والمخرج Q0.0 متوصل توازي مع START عشان يمسك نفسه. دوس START: اللمبة تنوّر وتفضل. دوس STOP: تطفي. نفس دايرة الكونتاكتور بالظبط، بس في برنامج.', 'START (I0.0) is normally open, STOP (I0.1) normally closed, and Q0.0 is wired in parallel with START to hold itself in. Tap START: the lamp lights and stays on. Tap STOP: off. Exactly the contactor circuit, but in software.'), focus: 'start1', s: { mode: 'single' } },
      { title: L('تشغيل وإيقاف من أكتر من مكان', 'Start/stop from several places'), text: L('زراير التشغيل كلها توازي (أي واحد يشغّل)، وزراير الإيقاف كلها توالي (أي واحد يوقّف). هنا START1 وSTART2 توازي، وSTOP1 وSTOP2 توالي. جرّب كل الزراير.', 'All start buttons in parallel (any one starts) and all stop buttons in series (any one stops). Here START1 and START2 are in parallel, STOP1 and STOP2 in series. Try every button.'), focus: 'start2', s: { mode: 'multi' } },
      { title: L('دايرة بتايمر', 'A circuit with a timer'), text: L('تايمر TON (تأخير تشغيل): لما I0.0 يبقى 1، التايمر يبدأ يعد لحد الوقت المضبوط (5 ثواني)، وبعدها تلامسه يقفل والمخرج يشتغل. لو المدخل فصل قبل الوقت، التايمر يرجع صفر. دوس START1 وشوف العداد.', 'A TON (on-delay) timer: when I0.0 turns on, the timer counts to its preset (5 s), then its contact closes and the output turns on. If the input drops first, the timer resets. Tap START1 and watch the count.'), focus: 'lap', s: { mode: 'timer' } },
      { title: L('دايرة هيدروليك أو نيوماتيك بالـ PLC', 'A fluid-power circuit with a PLC'), text: L('نفس الفكرة بتشغّل أسطوانة: الزراير والليمت سويتشات على المداخل، وملفات الصمامات Y1 وY2 على المخارج. البرنامج بيقرر إمتى الأسطوانة تطلع وترجع، ونقدر نغيّر التسلسل من غير ما نغيّر أي سلك.', 'The same approach drives a cylinder: buttons and limit switches on the inputs, valve solenoids Y1 and Y2 on the outputs. The program decides when the cylinder extends and retracts, and the sequence can change without touching a wire.'), focus: 'plc', s: { mode: 'single' } }
    ],
    apply(s){ Object.assign(st, { q: 0 }, s); tAcc = 0; st.lang = st.mode === 'single' && st.lang ? st.lang : 'lad'; },
    update(dt){ t += dt; [start1, stop1, start2, stop2].forEach(b => b.update(dt)); p1 = Math.max(0, p1 - dt); p2 = Math.max(0, p2 - dt); s1 = Math.max(0, s1 - dt); s2 = Math.max(0, s2 - dt);
      const m = st.mode, multi = m === 'multi'; start2.group.visible = stop2.group.visible = multi; stop1.group.visible = m !== 'timer';
      const I0 = p1 > 0 ? 1 : 0, I2 = p2 > 0 ? 1 : 0, I1 = s1 > 0 ? 0 : 1, I3 = s2 > 0 ? 0 : 1;
      let tm = 0; if(m === 'timer'){ if(I0 || st.q){ st.hold = 1; } if(st.hold) tAcc = Math.min(5, tAcc + dt); st.q = tAcc >= 5 ? 1 : 0; tm = tAcc; if(st.q && tAcc >= 5){ st._d = (st._d || 0) + dt; if(st._d > 3){ st.hold = 0; tAcc = 0; st._d = 0; } } }
      else if(m !== 'intro'){ st.q = ((I0 || (multi && I2) || st.q) && I1 && (!multi || I3)) ? 1 : 0; } else st.q = Math.floor(t / 2) % 2;
      lamp.set(st.q); lamp.update(dt);
      inL.forEach((mm, i) => { const on = [I0, I1, multi ? I2 : 0, multi ? I3 : 0][i] || (m === 'intro' && (Math.floor(t * 2 + i) % 5 === 0)); setGlow(mm, on ? 1 : 0, .2, 1, .3); }); outL.forEach((mm, i) => setGlow(mm, (i === 0 && st.q) ? 1 : 0, 1, .5, .1)); setGlow(runL, 1, .2, 1, .3);
      const ph = Math.floor(t * 1.5) % 3; cycM.forEach((mm, i) => { mm.color.setHex(i === ph ? 0xffd34d : 0x9aa0a6); setGlow(mm, i === ph ? .6 : 0, 1, .8, .2); });
      const key = [m, st.lang, I0, I1, I2, I3, st.q, tm.toFixed(1)].join(); if(scr.mesh.userData.k !== key){ scr.mesh.userData.k = key; draw(I0, I1, I2, I3, st.q, tm); }
    }
  };
}

const MODELS_DEF = () => [
  { id: 'hpu', name: L('وحدة القدرة الهيدروليكية', 'Hydraulic power unit'), from: L('هيدروليك · وحدات 1، 2، 9', 'Hydraulics · units 1, 2, 9'), build: buildHPU },
  { id: 'pumps', name: L('أنواع المضخات', 'Pump types'), from: L('هيدروليك · وحدة 3', 'Hydraulics · unit 3'), build: buildPumps },
  { id: 'actuators', name: L('الأسطوانات والمحرك الهيدروليكي', 'Cylinders & hydraulic motor'), from: L('هيدروليك · وحدات 4، 14', 'Hydraulics · units 4, 14'), build: buildActuators },
  { id: 'pressure', name: L('التحكم في الضغط', 'Pressure control'), from: L('هيدروليك · وحدات 5، 19', 'Hydraulics · units 5, 19'), build: buildPressure },
  { id: 'dcv', name: L('صمامات الاتجاه 4/2 و4/3', '4/2 & 4/3 valves'), from: L('هيدروليك · وحدات 6، 10', 'Hydraulics · units 6, 10'), build: buildDCV },
  { id: 'flow', name: L('التحكم في التدفق والسرعة', 'Flow & speed control'), from: L('هيدروليك · وحدات 7، 11، 12', 'Hydraulics · units 7, 11, 12'), build: buildFlow },
  { id: 'hcircuit', name: L('دوائر على لوحة التدريب', 'Circuits on the training panel'), from: L('هيدروليك · وحدات 8، 9، 13، 14، 19', 'Hydraulics · units 8, 9, 13, 14, 19'), build: buildHCircuit },
  { id: 'ehyd', name: L('الإلكتروهيدروليك', 'Electro-hydraulics'), from: L('هيدروليك · وحدات 15–18', 'Hydraulics · units 15–18'), build: buildElectroHyd },
  { id: 'pneu', name: L('وحدة النيوماتيك', 'Pneumatic unit'), from: L('نيوماتيك · وحدات 25–28', 'Pneumatics · units 25–28'), build: buildPneuUnit },
  { id: 'pcirc', name: L('دوائر النيوماتيك بالصمامات', 'Pneumatic valve circuits'), from: L('نيوماتيك · وحدات 29–37', 'Pneumatics · units 29–37'), build: buildPneuCircuits },
  { id: 'plogic', name: L('صمامات AND وOR', 'AND & OR valves'), from: L('نيوماتيك · وحدات 38–40', 'Pneumatics · units 38–40'), build: buildPneuLogic },
  { id: 'epneu', name: L('الإلكترونيوماتيك', 'Electro-pneumatics'), from: L('نيوماتيك · وحدات 41–44', 'Pneumatics · units 41–44'), build: buildElectroPneu },
  { id: 'plc', name: L('الـ PLC', 'The PLC'), from: L('نيوماتيك · وحدات 20–24، 45–47', 'Pneumatics · units 20–24, 45–47'), build: buildPLC }
];
let MODELS = MODELS_DEF();

/* ---------- التشغيل والواجهة ---------- */
let current = null, stepIdx = 0, selected = null, markers = {}, tagEl = null, fitInfo = null;

function disposeTree(o){
  o.traverse(n => {
    if(n.geometry) n.geometry.dispose();
    const ms = n.material ? (Array.isArray(n.material) ? n.material : [n.material]) : [];
    ms.forEach(m => { if(m.map && !m.map.userData.shared) m.map.dispose(); m.dispose(); });
  });
}

// المسافة اللي تخلّي الموديل كله جوه الشاشة، حتى وهو بيلف حوالين نفسه
function fit(){
  if(!current) return;
  const box3 = new THREE.Box3(), tmp = new THREE.Box3();
  current.root.updateWorldMatrix(true, true);
  current.root.traverse(o => {
    if(!o.isMesh || o.userData.noFit) return;
    if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    box3.union(tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld));
  });
  const center = box3.getCenter(new THREE.Vector3());
  const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  const tv = Math.tan(vf / 2), th = Math.tan(hf / 2);
  const d = current.view.clone().normalize();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), d).normalize();
  const up = new THREE.Vector3().crossVectors(d, right).normalize();
  const corners = [];
  for(const x of [box3.min.x, box3.max.x]) for(const y of [box3.min.y, box3.max.y]) for(const z of [box3.min.z, box3.max.z]) corners.push(V(x, y, z).sub(center));
  let dist = 0;
  const angles = current.sway ? [-14, -7, 0, 7, 14] : Array.from({ length: 24 }, (_, i) => i * 15);
  for(const a of angles){
    const rot = new THREE.Matrix4().makeRotationY(THREE.MathUtils.degToRad(a));
    for(const c0 of corners){
      const c = c0.clone().applyMatrix4(rot);
      const need = c.dot(d) + Math.max(Math.abs(c.dot(right)) / th, Math.abs(c.dot(up)) / tv);
      if(need > dist) dist = need;
    }
  }
  dist *= 1.04;
  fitInfo = { center: center.clone(), dist };
  camera.position.copy(center).add(d.clone().multiplyScalar(dist));
  controls.target.copy(center);
  controls.minDistance = dist * .3; controls.maxDistance = dist * 2;
  camera.near = dist / 100; camera.far = dist * 10; camera.updateProjectionMatrix();
  controls.update();
}

function resize(){
  const w = host.clientWidth || 600, h = host.clientHeight || 400;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}

function loadModel(id){
  if(typeof autoStop === 'function') autoStop();
  const def = MODELS.find(m => m.id === id) || MODELS[0];
  if(current){ scene.remove(current.root); disposeTree(current.root); }
  current = def.build(); scene.add(current.root);
  current.root.traverse(o => {
    if(!o.isMesh) return;
    const tr = (Array.isArray(o.material) ? o.material : [o.material]).some(m => m.transparent || m.isMeshBasicMaterial);
    o.castShadow = !tr && !o.userData.receiver; o.receiveShadow = !tr;
  });
  current.objIndex = new Map(Object.entries(current.parts).map(([k, p]) => [p.obj, k]));
  $('hint').textContent = current.hint || L('اسحب للتدوير · صباعين للتقريب · دوس على رقم', 'Drag to rotate · pinch to zoom · tap a number');
  showToast('');
  userMoved = false;
  document.querySelectorAll('#y3d-root .y3d-tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.id === def.id)));
  $('phase').hidden = !current.engine;
  $('engineBar').hidden = !current.engine;
  if(current.engineCtl){
    const ec = current.engineCtl;
    ec.onRun(on => { $('runBtn').textContent = on ? 'إيقاف الموتور' : 'تشغيل الموتور'; });
    $('rpm').textContent = `${ec.setSpeed(+$('speed').value)} لفة في الدقيقة`;
  }
  $('xrayBtn').hidden = !current.xray; syncX();
  buildPartsUI(); buildDots();
  resize(); fit();
  controls.autoRotate = !reduceMotion && !current.sway;
  setStep(0);
}

function buildPartsUI(){
  markerLayer.innerHTML = ''; markers = {};
  const list = $('parts'); list.innerHTML = '';
  current.order.forEach((id, i) => {
    const p = current.parts[id];
    const mk = document.createElement('button'); mk.type = 'button'; mk.className = 'y3d-mk'; mk.textContent = i + 1;
    mk.setAttribute('aria-label', p.label); mk.addEventListener('click', () => select(selected === id ? null : id));
    markerLayer.appendChild(mk); markers[id] = mk;
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="y3d-part" data-id="${id}"><span class="y3d-n">${i + 1}</span><span><b></b><span></span></span></button>`;
    li.querySelector('b').textContent = p.label; li.querySelector('span > span').textContent = p.desc;
    li.firstElementChild.addEventListener('click', () => select(selected === id ? null : id));
    list.appendChild(li);
  });
  tagEl = document.createElement('div'); tagEl.className = 'y3d-mk-tag'; tagEl.hidden = true; markerLayer.appendChild(tagEl);
}

function select(id){
  selected = id;
  Object.entries(markers).forEach(([k, el]) => el.classList.toggle('y3d-sel', k === id));
  document.querySelectorAll('#y3d-root .y3d-part').forEach(b => b.classList.toggle('y3d-sel', b.dataset.id === id));
  tagEl.hidden = !id; if(id) tagEl.textContent = current.parts[id].label;
}

function buildDots(){
  const d = $('dots'); d.innerHTML = '';
  current.steps.forEach((s, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'y3d-dot';
    b.setAttribute('aria-label', `${L('الخطوة', 'Step')} ${i + 1}: ${s.title}`); b.addEventListener('click', () => setStep(i)); d.appendChild(b);
  });
}

function setStep(i, auto){
  if(!auto) autoStop();
  const steps = current.steps; stepIdx = Math.max(0, Math.min(steps.length - 1, i));
  const s = steps[stepIdx];
  $('stepNo').textContent = stepIdx + 1; $('stepCount').textContent = steps.length;
  $('stepTitle').textContent = s.title; $('stepText').textContent = s.text;
  $('prevBtn').disabled = stepIdx === 0; $('nextBtn').disabled = stepIdx === steps.length - 1;
  [...$('dots').children].forEach((b, k) => b.setAttribute('aria-current', String(k === stepIdx)));
  current.apply(s.s); select(s.focus || null); if(typeof syncX === 'function') syncX();
}

function syncX(){ if(current && current.xray) $('xrayBtn').textContent = current.xray.on ? L('اخفي الأسلاك', 'Hide wiring') : L('شوف الأسلاك', 'Show wiring'); }
$('xrayBtn').addEventListener('click', () => { if(current && current.xray){ showToast(current.xray.toggle()); syncX(); } });
$('prevBtn').addEventListener('click', () => setStep(stepIdx - 1));
$('runBtn').addEventListener('click', () => { const ec = current && current.engineCtl; if(ec) ec.setRunning(!ec.running); });
$('speed').addEventListener('input', () => { const ec = current && current.engineCtl; if(ec) $('rpm').textContent = `${ec.setSpeed(+$('speed').value)} لفة في الدقيقة`; });
$('nextBtn').addEventListener('click', () => setStep(stepIdx + 1));
// تشغيل العملية كلها: الخطوات بتمشي لوحدها، وكل خطوة بتاخد وقت يكفي لقراية الشرح
var autoOn = false, autoTimer = null;
function LL(a, b){ return typeof L === 'function' ? L(a, b) : a; }
function stepDur(s){ return Math.max(6000, Math.min(15000, String((s && s.text) || '').length * 48)); }
function syncPlay(){ const b = $('playBtn'); if(b) b.textContent = autoOn ? LL('⏸ إيقاف التشغيل', '⏸ Pause') : LL('▶ شغّل العملية كلها', '▶ Play all steps'); }
function autoStop(){ autoOn = false; clearTimeout(autoTimer); autoTimer = null; syncPlay(); }
function autoNext(){ if(!autoOn || !current) return; if(stepIdx >= current.steps.length - 1){ autoStop(); return; } setStep(stepIdx + 1, true); autoTimer = setTimeout(autoNext, stepDur(current.steps[stepIdx])); }
$('playBtn').addEventListener('click', () => { if(!current) return; if(autoOn){ autoStop(); return; } autoOn = true; if(stepIdx >= current.steps.length - 1) setStep(0, true); syncPlay(); autoTimer = setTimeout(autoNext, stepDur(current.steps[stepIdx])); });
$('resetBtn').addEventListener('click', () => { userMoved = false; current.root.rotation.y = 0; fit(); controls.autoRotate = !reduceMotion && !current.sway; });

// الدوس على قطعة في الموديل: لو ليها حركة (مفتاح، لمبة) تتنفّذ، غير كده تتحدد
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let downAt = null, toastTimer = null;
function showToast(msg){
  const el = $('toast'); el.textContent = msg; el.hidden = !msg;
  clearTimeout(toastTimer); if(msg) toastTimer = setTimeout(() => { el.hidden = true; }, 3500);
}
function wirePicking(){
renderer.domElement.addEventListener('pointerdown', e => { downAt = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', e => {
  if(!downAt || !current) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y); downAt = null;
  if(moved > 8) return;
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObject(current.root, true);
  for(const h of hits){
    let o = h.object;
    while(o && !current.objIndex.has(o)) o = o.parent;
    if(!o) continue;
    const id = current.objIndex.get(o), p = current.parts[id];
    select(id);
    if(p.tap) showToast(p.tap()); syncX();
    return;
  }
});
}

const clock = new THREE.Clock();
const wp = new THREE.Vector3(), camDir = new THREE.Vector3();
function tick(){
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if(current){
    if(current.sway && !userMoved && !reduceMotion) current.root.rotation.y = Math.sin(t * .35) * .22;
    current.update(dt);
    for(const [id, p] of Object.entries(current.parts)){
      const h = id === selected ? .4 + .3 * Math.sin(t * 5) : 0;
      for(const m of p.mats){
        m.emissive.copy(m.userData.baseE); m.emissiveIntensity = m.userData.baseI;
        if(h > 0){ m.emissive.lerp(GOLD, h); m.emissiveIntensity = Math.max(m.userData.baseI, 1); }
      }
    }
  }
  controls.update();
  renderer.render(scene, camera);
  if(current){
    const w = host.clientWidth, h = host.clientHeight;
    camera.getWorldDirection(camDir);
    const centerDist = fitInfo ? camera.position.distanceTo(fitInfo.center) : 0;
    for(const [id, p] of Object.entries(current.parts)){
      const el = markers[id]; if(!el) continue;
      p.anchor.getWorldPosition(wp);
      const behind = camera.position.distanceTo(wp) > centerDist + .15;
      const pr = wp.clone().project(camera);
      const x = (pr.x * .5 + .5) * w, y = (-pr.y * .5 + .5) * h;
      let vis = true; for(let o = p.obj; o; o = o.parent) if(!o.visible){ vis = false; break; }
      const off = !vis || pr.z > 1 || x < -20 || x > w + 20 || y < -20 || y > h + 20;
      el.style.visibility = off ? 'hidden' : 'visible';
      el.style.transform = `translate(${x}px,${y}px)` + (id === selected ? ' scale(1.18)' : '');
      el.classList.toggle('y3d-back', behind && id !== selected);
      if(id === selected && tagEl){ tagEl.style.left = x + 'px'; tagEl.style.top = y + 'px'; tagEl.style.visibility = off ? 'hidden' : 'visible'; }
    }
  }
}

/* ---------- الربط مع المنصة (الهيدروليك والنيوماتيك) ---------- */
const TITLE_TO_MODELS = {"التدريب على الرموز الهيدروليكية واتباع السلامة والصحة المهنية": ["hpu"], "التدريب على وحدة القدرة الهيدروليكية وكيفية رسمها": ["hpu"], "التدريب على انواع المضخات الهيدروليكية وكيفية رسمها": ["pumps"], "التدريب على انواع المشغلات الهيدروليكية ( خطية – دورانية )": ["actuators"], "التدريب على أنواع عناصر التحكم في الضغط": ["pressure"], "التدريب على انواع عناصر التحكم في الاتجاه": ["dcv"], "التدريب على انواع عناصر التحكم في التدفق": ["flow"], "التدريب على تصميم الدوائر الهيدروليكية على برنامج رسم الدوائر": ["hcircuit"], "التدريب على تصميم نظام هيدروليكي وتنفيذه على الوحدة": ["hcircuit", "hpu"], "التدريب على الفرق بين الصمام التوجيهي 4/2 و4/3 اليدوي": ["dcv"], "التدريب على التحكم في سرعة المشغلات في مشواري التقدم والرجوع": ["flow"], "التدريب على التحكم في سرعة المشغلات في مشوار واحد التقدم أو الرجوع": ["flow"], "التدريب على تشغيل عدد 2 اسطوانة هيدروليكية على التوازي": ["hcircuit"], "التدريب على تشغيل اسطوانة هيدروليكية ومحرك هيدروليكي": ["hcircuit", "actuators"], "التدريب على الدوائر الالكتروهيدروليكية ووحدة الكهرباء": ["ehyd"], "التدريب على التشغيل المباشر والغير مباشر": ["ehyd"], "التدريب على تنفيذ دائرة هيدروليكية مع تثبيت الإشارة": ["ehyd"], "التدريب على تنفيذ دائرة الكتروهيدروليك مع استخدام صمام 4/3 باشارتين كهرباء": ["ehyd"], "شرح الصمام التتابعي وكيفية استخدامه": ["pressure", "hcircuit"], "تعريف انظمة ال PLC ومكوناتها": ["plc"], "التدريب على كيفية عمل دورة عملية لنظام PLC": ["plc"], "التدريب على انواع لغات البرمجة": ["plc"], "التدريب على تنفيذ دائرة هيدروليكية باستخدام وحدة PLC": ["plc", "ehyd"], "التدريب على تنفيذ دائرة هيدروليكية مع إضافة تيمر": ["plc"], "التعرف على علم النيوماتيك ومميزات وعيوب علم النيوماتيك": ["pneu"], "مكونات وحدة النيوماتيك": ["pneu"], "مقارنة بين علم النيوماتيك وعلم الهيدروليك": ["pneu"], "شرح كل جزء من مكونات وحدة النيوماتيك": ["pneu"], "تكوين دائرة بسيطة نيوماتيكية": ["pcirc"], "تنفيذ دائرة بأسطوانة احادية الفعل بصمام 3/2 مفتوح": ["pcirc"], "تنفيذ دائرة بأسطوانة ثنائية الفعل بصمام 5/2 بزار ضاغط": ["pcirc"], "تنفيذ دائرة بأسطوانة ثنائية الفعل بصمام 3/2 مغلق": ["pcirc"], "تنفيذ كل الدوائر السابقة على برنامج الاتوميش استديو": ["pcirc"], "تنفيذ دائرة بأسطوانة احادية الفعل بصمام 3/2 وصمام خانق لا راجع": ["pcirc"], "تنفيذ دائرة بأسطوانة احادية الفعل بصمام 3/2 بإشارة هوائية ( غير مباشر )": ["pcirc"], "تنفيذ دائرة بأسطوانة ثنائية الفعل بصمام 5/2 بإشارتين هوائيتان (غير مباشر)": ["pcirc"], "تنفيذ دائرة بأسطوانة ثنائية الفعل بصمام 5/3 بإشارتين هوائيتان (غير مباشر)": ["pcirc"], "تنفيذ دوائر بصمام AND": ["plogic"], "تنفيذ دوائر بصمام OR": ["plogic"], "تنفيذ دوائر بصمام AND و OR معاً": ["plogic"], "شرح مبادئ الدوائر الالكترونيوماتيكية": ["epneu"], "تنفيذ دائرة بصمام 3/2 بإشارة كهربية وحفظ إشارة": ["epneu"], "تنفيذ دائرة بصمام 5/2 بإشارة كهربية واشارتين كهربيتين": ["epneu"], "تنفيذ دائرة بأسطوانة أحادية الفعل مع ليمت سويتش": ["epneu"], "شرح مكونات جهاز PLC": ["plc"], "تنفيذ دائرة تحكم فى تشغيل وايقاف على جهاز PLC": ["plc"], "تنفيذ دائرة تحكم تشغيل وايقاف من اكثر من مكان على جهاز PLC": ["plc"]};
const ID_TO_MODELS = {"ebrnq70": ["hpu"], "cbx2866": ["hpu"], "l15ogxj": ["pumps"], "13ji016": ["actuators"], "lip6zrm": ["pressure"], "8ksvom9": ["dcv"], "ltqu8mh": ["flow"], "vedt9cp": ["hcircuit"], "su845u0": ["hcircuit", "hpu"], "j67o5at": ["dcv"], "vk4es35": ["flow"], "xoncdyr": ["flow"], "hn5yqd7": ["hcircuit"], "or9f7r4": ["hcircuit", "actuators"], "qflhi2o": ["ehyd"], "ew2ofht": ["ehyd"], "as8dh00": ["ehyd"], "18nsl7u": ["ehyd"], "uks7qmq": ["pressure", "hcircuit"], "pkinqqx": ["plc"], "bzykg53": ["plc"], "n945mee": ["plc"], "dd3dzq8": ["plc", "ehyd"], "kbvwzb4": ["plc"], "ibvher3": ["pneu"], "4iwk93l": ["pneu"], "v2nfgfw": ["pneu"], "wkgpi4k": ["pneu"], "kf9i421": ["pcirc"], "p8s5mwo": ["pcirc"], "hprcr2s": ["pcirc"], "9095fx2": ["pcirc"], "xw63zk2": ["pcirc"], "e40s5uo": ["pcirc"], "skt18m7": ["pcirc"], "ihyf7nk": ["pcirc"], "rijf3hf": ["pcirc"], "yc47qtj": ["plogic"], "6698yo5": ["plogic"], "o9eiwbk": ["plogic"], "x80su5q": ["epneu"], "a0fb15l": ["epneu"], "yqh3ukp": ["epneu"], "qs3hvx2": ["epneu"], "t2jphbv": ["plc"], "8xltsey": ["plc"], "dr5wid2": ["plc"]};
const UI3 = { reset: ['إعادة الضبط', 'Reset view'], step: ['الخطوة', 'Step'], of: ['من', 'of'], prev: ['السابق', 'Back'], next: ['التالي', 'Next'], parts: ['القطع', 'Parts'], eyebrow: ['موديل 3D تفاعلي', 'Interactive 3D model'], close: ['إغلاق', 'Close'] };
let lastFocus = null;
function applyLang(){
  const k = LANG === 'en' ? 1 : 0;
  root3d.setAttribute('dir', LANG === 'en' ? 'ltr' : 'rtl');
  $('resetBtn').textContent = UI3.reset[k]; $('prevBtn').textContent = UI3.prev[k]; $('nextBtn').textContent = UI3.next[k]; $('close').setAttribute('aria-label', UI3.close[k]);
  root3d.querySelector('.y3d-eyebrow').textContent = UI3.eyebrow[k]; root3d.querySelector('.y3d-card h4').textContent = UI3.parts[k];
  const meta = root3d.querySelector('.y3d-stepmeta'); meta.childNodes[0].textContent = UI3.step[k] + ' '; meta.childNodes[2].textContent = ' ' + UI3.of[k] + ' ';
}
function buildTabs(ids){
  const t = $('tabs'); t.innerHTML = '';
  if(ids.length < 2) return;
  ids.forEach(id => {
    const def = MODELS.find(m => m.id === id); if(!def) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'y3d-tab'; b.setAttribute('role', 'tab'); b.dataset.id = id; b.textContent = def.name;
    b.addEventListener('click', () => loadModel(id)); t.appendChild(b);
  });
}
function idsFor(title, m){ const k = String(title || '').trim(); if(TITLE_TO_MODELS[k]) return TITLE_TO_MODELS[k]; if(m && typeof m === 'object'){ if(m.id && ID_TO_MODELS[m.id]) return ID_TO_MODELS[m.id]; if(m.sourceUnitId && ID_TO_MODELS[m.sourceUnitId]) return ID_TO_MODELS[m.sourceUnitId]; } return null; }
function open3D(moduleTitle, m){
  const ids = idsFor(moduleTitle, m); if(!ids) return false;
  __unitSteps = unitStepsFor(moduleTitle, m);
  LANG = /[\u0600-\u06FF]/.test(moduleTitle) ? 'ar' : 'en';
  MODELS = MODELS_DEF();
  lastFocus = document.activeElement;
  root3d.hidden = false; document.documentElement.style.overflow = 'hidden';
  applyLang();
  $('title').textContent = moduleTitle;
  if(!initEngine()) return true;
  buildTabs(ids);
  clock.getDelta();
  loadModel(ids[0]);
  renderer.setAnimationLoop(tick);
  $('close').focus({ preventScroll: true });
  return true;
}

/* ---------- كل وحدة بتفتح على خطواتها بس ---------- */
const UNIT_STEPS_T = {"التدريب على الرموز الهيدروليكية واتباع السلامة والصحة المهنية": {"hpu": [5, 6]}, "التدريب على وحدة القدرة الهيدروليكية وكيفية رسمها": {"hpu": [0, 1, 2, 3, 4, 5]}, "التدريب على أنواع عناصر التحكم في الضغط": {"pressure": [0, 1, 2, 3, 5]}, "التدريب على انواع عناصر التحكم في الاتجاه": {"dcv": [0, 1, 2, 3, 5]}, "التدريب على انواع عناصر التحكم في التدفق": {"flow": [0, 1, 2]}, "التدريب على تصميم الدوائر الهيدروليكية على برنامج رسم الدوائر": {"hcircuit": [0, 1]}, "التدريب على تصميم نظام هيدروليكي وتنفيذه على الوحدة": {"hcircuit": [2], "hpu": [0, 2, 3]}, "التدريب على الفرق بين الصمام التوجيهي 4/2 و4/3 اليدوي": {"dcv": [3, 4]}, "التدريب على التحكم في سرعة المشغلات في مشواري التقدم والرجوع": {"flow": [3]}, "التدريب على التحكم في سرعة المشغلات في مشوار واحد التقدم أو الرجوع": {"flow": [2, 4]}, "التدريب على تشغيل عدد 2 اسطوانة هيدروليكية على التوازي": {"hcircuit": [3]}, "التدريب على تشغيل اسطوانة هيدروليكية ومحرك هيدروليكي": {"hcircuit": [4], "actuators": [4]}, "التدريب على الدوائر الالكتروهيدروليكية ووحدة الكهرباء": {"ehyd": [0]}, "التدريب على التشغيل المباشر والغير مباشر": {"ehyd": [1, 2]}, "التدريب على تنفيذ دائرة هيدروليكية مع تثبيت الإشارة": {"ehyd": [3]}, "التدريب على تنفيذ دائرة الكتروهيدروليك مع استخدام صمام 4/3 باشارتين كهرباء": {"ehyd": [4]}, "شرح الصمام التتابعي وكيفية استخدامه": {"pressure": [4], "hcircuit": [5]}, "تعريف انظمة ال PLC ومكوناتها": {"plc": [0]}, "التدريب على كيفية عمل دورة عملية لنظام PLC": {"plc": [1]}, "التدريب على انواع لغات البرمجة": {"plc": [2]}, "التدريب على تنفيذ دائرة هيدروليكية باستخدام وحدة PLC": {"plc": [6], "ehyd": [5]}, "التدريب على تنفيذ دائرة هيدروليكية مع إضافة تيمر": {"plc": [5]}, "التعرف على علم النيوماتيك ومميزات وعيوب علم النيوماتيك": {"pneu": [0]}, "مكونات وحدة النيوماتيك": {"pneu": [1, 2, 4]}, "مقارنة بين علم النيوماتيك وعلم الهيدروليك": {"pneu": [3]}, "شرح كل جزء من مكونات وحدة النيوماتيك": {"pneu": [1, 2, 4]}, "تكوين دائرة بسيطة نيوماتيكية": {"pcirc": [0]}, "تنفيذ دائرة بأسطوانة احادية الفعل بصمام 3/2 مفتوح": {"pcirc": [2]}, "تنفيذ دائرة بأسطوانة ثنائية الفعل بصمام 5/2 بزار ضاغط": {"pcirc": [3]}, "تنفيذ دائرة بأسطوانة ثنائية الفعل بصمام 3/2 مغلق": {"pcirc": [1]}, "تنفيذ دائرة بأسطوانة احادية الفعل بصمام 3/2 وصمام خانق لا راجع": {"pcirc": [4]}, "تنفيذ دائرة بأسطوانة احادية الفعل بصمام 3/2 بإشارة هوائية ( غير مباشر )": {"pcirc": [5]}, "تنفيذ دائرة بأسطوانة ثنائية الفعل بصمام 5/2 بإشارتين هوائيتان (غير مباشر)": {"pcirc": [6]}, "تنفيذ دائرة بأسطوانة ثنائية الفعل بصمام 5/3 بإشارتين هوائيتان (غير مباشر)": {"pcirc": [7]}, "تنفيذ دوائر بصمام AND": {"plogic": [2]}, "تنفيذ دوائر بصمام OR": {"plogic": [1]}, "تنفيذ دوائر بصمام AND و OR معاً": {"plogic": [3]}, "شرح مبادئ الدوائر الالكترونيوماتيكية": {"epneu": [0]}, "تنفيذ دائرة بصمام 3/2 بإشارة كهربية وحفظ إشارة": {"epneu": [1]}, "تنفيذ دائرة بصمام 5/2 بإشارة كهربية واشارتين كهربيتين": {"epneu": [2, 3]}, "تنفيذ دائرة بأسطوانة أحادية الفعل مع ليمت سويتش": {"epneu": [4]}, "شرح مكونات جهاز PLC": {"plc": [0]}, "تنفيذ دائرة تحكم فى تشغيل وايقاف على جهاز PLC": {"plc": [3]}, "تنفيذ دائرة تحكم تشغيل وايقاف من اكثر من مكان على جهاز PLC": {"plc": [4]}};
const UNIT_STEPS_I = {"ebrnq70": {"hpu": [5, 6]}, "cbx2866": {"hpu": [0, 1, 2, 3, 4, 5]}, "lip6zrm": {"pressure": [0, 1, 2, 3, 5]}, "8ksvom9": {"dcv": [0, 1, 2, 3, 5]}, "ltqu8mh": {"flow": [0, 1, 2]}, "vedt9cp": {"hcircuit": [0, 1]}, "su845u0": {"hcircuit": [2], "hpu": [0, 2, 3]}, "j67o5at": {"dcv": [3, 4]}, "vk4es35": {"flow": [3]}, "xoncdyr": {"flow": [2, 4]}, "hn5yqd7": {"hcircuit": [3]}, "or9f7r4": {"hcircuit": [4], "actuators": [4]}, "qflhi2o": {"ehyd": [0]}, "ew2ofht": {"ehyd": [1, 2]}, "as8dh00": {"ehyd": [3]}, "18nsl7u": {"ehyd": [4]}, "uks7qmq": {"pressure": [4], "hcircuit": [5]}, "pkinqqx": {"plc": [0]}, "bzykg53": {"plc": [1]}, "n945mee": {"plc": [2]}, "dd3dzq8": {"plc": [6], "ehyd": [5]}, "kbvwzb4": {"plc": [5]}, "ibvher3": {"pneu": [0]}, "4iwk93l": {"pneu": [1, 2, 4]}, "v2nfgfw": {"pneu": [3]}, "wkgpi4k": {"pneu": [1, 2, 4]}, "kf9i421": {"pcirc": [0]}, "p8s5mwo": {"pcirc": [2]}, "hprcr2s": {"pcirc": [3]}, "9095fx2": {"pcirc": [1]}, "e40s5uo": {"pcirc": [4]}, "skt18m7": {"pcirc": [5]}, "ihyf7nk": {"pcirc": [6]}, "rijf3hf": {"pcirc": [7]}, "yc47qtj": {"plogic": [2]}, "6698yo5": {"plogic": [1]}, "o9eiwbk": {"plogic": [3]}, "x80su5q": {"epneu": [0]}, "a0fb15l": {"epneu": [1]}, "yqh3ukp": {"epneu": [2, 3]}, "qs3hvx2": {"epneu": [4]}, "t2jphbv": {"plc": [0]}, "8xltsey": {"plc": [3]}, "dr5wid2": {"plc": [4]}};
let __unitSteps = null, __unitFull = null, __unitSub = null;
function unitStepsFor(title, m){ const k = String(title || '').trim(); if(UNIT_STEPS_T[k]) return UNIT_STEPS_T[k]; if(m && typeof m === 'object'){ if(m.id && UNIT_STEPS_I[m.id]) return UNIT_STEPS_I[m.id]; if(m.sourceUnitId && UNIT_STEPS_I[m.sourceUnitId]) return UNIT_STEPS_I[m.sourceUnitId]; } return null; }
const __loadModel0 = loadModel;
loadModel = function(id){ __loadModel0(id); __unitFull = null; const note = $('unitNote'); if(note) note.hidden = true;
  const sub = __unitSteps && __unitSteps[id]; if(!sub || !current || !current.steps) return;
  const full = current.steps; const pick = sub.filter(i => i >= 0 && i < full.length); if(!pick.length || pick.length >= full.length) return;
  __unitFull = full; __unitSub = pick; current.steps = pick.map(i => full[i]); buildDots(); setStep(0);
  if(note){ note.hidden = false; $('unitNoteTxt').textContent = L(`بتشوف الخطوات اللي بتخص الوحدة دي بس (${pick.length} من ${full.length}).`, `Showing this unit's steps only (${pick.length} of ${full.length}).`); $('fullBtn').textContent = L('شوف الموديل كامل', 'See the full model'); } };
$('fullBtn').addEventListener('click', () => { if(!__unitFull || !current) return; const at = __unitSub[stepIdx] || 0; current.steps = __unitFull; __unitFull = null; buildDots(); setStep(at); $('unitNote').hidden = true; });
function close3D(){
  try{ autoStop(); }catch(e){}
  if(root3d.hidden) return;
  root3d.hidden = true; document.documentElement.style.overflow = '';
  if(renderer) renderer.setAnimationLoop(null);
  if(current){ scene.remove(current.root); disposeTree(current.root); current = null; }
  markerLayer.innerHTML = '';
  if(lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
$('close').addEventListener('click', close3D);
root3d.addEventListener('click', e => { if(e.target === root3d) close3D(); });
document.addEventListener('keydown', e => { if(e.key === 'Escape' && !root3d.hidden) close3D(); });
// بيضيف موديلات كهرباء منزلي من غير ما يلمس الموديلات التانية: أي وحدة مش منها بتروح للعارض اللي قبله
const prevKey = window.__stceModule3DGetTemplateKey, prevOpen = window.__stceModule3DOpen, prevClose = window.__stceModule3DClose;
window.__stceModule3DGetTemplateKey = function(title, m){ try{ if(idsFor(title, m)) return 'hydraulics'; }catch(e){} return typeof prevKey === 'function' ? prevKey(title, m) : null; };
window.__stceModule3DOpen = function(templateKey, moduleTitle, m){ try{ if(templateKey === 'hydraulics' && open3D(moduleTitle, m)) return; }catch(e){ console.error('stce3d_hyd_open_failed', e); } if(typeof prevOpen === 'function') prevOpen(templateKey, moduleTitle, m); };
window.__stceModule3DClose = function(){ try{ close3D(); }catch(e){} if(typeof prevClose === 'function') prevClose(); };
window.STCE3DY = { open: open3D, close: close3D, titles: () => Object.keys(TITLE_TO_MODELS) };
