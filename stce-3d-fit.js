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
root3d.id = 'f3d-root'; root3d.hidden = true; root3d.setAttribute('dir', 'rtl');
root3d.innerHTML = `
<div class="f3d-box" role="dialog" aria-modal="true" aria-labelledby="f3d-title">
  <div class="f3d-head">
    <div class="f3d-titles"><div class="f3d-eyebrow">موديل 3D تفاعلي</div><h2 id="f3d-title"></h2></div>
    <button class="f3d-btn f3d-close" id="f3d-close" type="button" aria-label="إغلاق">✕</button>
  </div>
  <nav class="f3d-tabs" id="f3d-tabs" role="tablist"></nav>
  <div class="f3d-main">
    <div class="f3d-stagecol">
      <section class="f3d-stage" id="f3d-stage">
        <div id="f3d-canvasHost"></div>
        <div id="f3d-markers"></div>
        <div class="f3d-hud">
          <button class="f3d-btn" id="f3d-resetBtn" type="button">إعادة الضبط</button>
          <button class="f3d-btn f3d-primary" id="f3d-xrayBtn" type="button" hidden>شوف الأسلاك</button>
          <div class="f3d-phase" id="f3d-phase" hidden><b id="f3d-phaseName"></b><span class="f3d-deg">زاوية الكرنك <span id="f3d-phaseDeg">0°</span></span></div>
        </div>
        <div class="f3d-toast" id="f3d-toast" role="status" hidden></div>
        <div class="f3d-hint" id="f3d-hint"></div>
      </section>
      <div class="f3d-enginebar" id="f3d-engineBar" hidden>
        <button class="f3d-btn f3d-primary" id="f3d-runBtn" type="button">إيقاف الموتور</button>
        <label for="f3d-speed">السرعة <input type="range" id="f3d-speed" min="0" max="9" step="1" value="1"></label>
        <span class="f3d-rpm" id="f3d-rpm"></span>
      </div>
    </div>
    <div class="f3d-side">
      <section class="f3d-card" aria-live="polite">
        <div id="f3d-unitNote" hidden style="background:#fff6dd;color:#1b1f26;border:1px solid #e8b94a;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:13px"><span id="f3d-unitNoteTxt"></span> <button type="button" id="f3d-fullBtn" style="margin-top:6px;padding:6px 12px;border-radius:9px;border:1px solid #c9b98f;background:#fff;font:inherit;cursor:pointer"></button></div><div class="f3d-stepmeta">الخطوة <span id="f3d-stepNo">1</span> من <span id="f3d-stepCount">1</span></div>
        <h3 id="f3d-stepTitle"></h3>
        <p id="f3d-stepText"></p>
        <div class="f3d-stepnav">
          <button class="f3d-btn" id="f3d-prevBtn" type="button">السابق</button>
          <div class="f3d-dots" id="f3d-dots"></div>
          <button class="f3d-btn f3d-primary" id="f3d-nextBtn" type="button">التالي</button>
        </div>
        <button class="f3d-btn f3d-play" id="f3d-playBtn" type="button">▶ شغّل العملية كلها</button>
      </section>
      <section class="f3d-card"><h4>القطع</h4><ol class="f3d-parts" id="f3d-parts"></ol></section>
    </div>
  </div>
</div>`;
const styleEl = document.createElement('style'); styleEl.textContent = `
#f3d-root{--bg:#0b1220;--surface:#151e2e;--fg:#e8edf3;--muted:#95a2b3;--line:#273246;--accent:#f0b429;--accent-ink:#1b1405;--accent-soft:#3a2d10;--mk-bg:rgba(18,25,35,.9);
  position:fixed;inset:0;z-index:2147483000;background:rgba(4,8,16,.88);overflow:auto;-webkit-overflow-scrolling:touch;font-family:'Cairo',Tahoma,sans-serif;color:var(--fg);line-height:1.7;font-size:15px;
  padding:max(12px,env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) max(12px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px))}
#f3d-root[hidden]{display:none!important}
#f3d-root *{box-sizing:border-box}
#f3d-root [hidden]{display:none!important}
#f3d-root .f3d-box{max-width:1180px;margin:0 auto;background:var(--bg);border:1px solid var(--line);border-radius:18px;padding:14px;display:grid;gap:12px}
#f3d-root .f3d-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
#f3d-root .f3d-eyebrow{font-size:12px;color:var(--accent)}
#f3d-root h2{margin:0;font-size:clamp(17px,4vw,22px);line-height:1.4;color:var(--fg);font-weight:700}
#f3d-root .f3d-tabs{display:flex;gap:8px;flex-wrap:wrap}
#f3d-root .f3d-tabs:empty{display:none}
#f3d-root .f3d-tab{font:inherit;cursor:pointer;border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:10px;padding:6px 14px}
#f3d-root .f3d-tab[aria-selected="true"]{border-color:var(--accent);background:var(--accent-soft)}
#f3d-root .f3d-main{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@media (min-width:920px){#f3d-root .f3d-main{grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:start}}
#f3d-root .f3d-stagecol{display:grid;gap:10px;min-width:0}
#f3d-root .f3d-stage{position:relative;height:min(62vh,560px,max(340px,110vw));border-radius:14px;overflow:hidden;background:radial-gradient(120% 90% at 50% 18%,#2a374b,#121923);touch-action:none}
#f3d-canvasHost,#f3d-canvasHost canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
#f3d-markers{position:absolute;inset:0;pointer-events:none}
#f3d-root .f3d-mk{position:absolute;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:2px solid var(--accent);background:var(--mk-bg);color:var(--fg);font:700 13px/22px monospace;text-align:center;padding:0;cursor:pointer;pointer-events:auto}
#f3d-root .f3d-mk.f3d-sel{background:var(--accent);color:var(--accent-ink);z-index:2}
#f3d-root .f3d-mk.f3d-back{opacity:.45}
#f3d-root .f3d-mk-tag{position:absolute;left:0;top:0;pointer-events:none;white-space:nowrap;background:var(--accent);color:var(--accent-ink);font-size:13px;font-weight:700;padding:3px 10px;border-radius:8px;transform:translate(-50%,-150%);z-index:3}
#f3d-root .f3d-hud{position:absolute;inset:10px 10px auto 10px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;pointer-events:none}
#f3d-root .f3d-hud>*{pointer-events:auto}
#f3d-root .f3d-btn{font:inherit;font-size:14px;cursor:pointer;border:1px solid var(--line);background:var(--surface);color:var(--fg);border-radius:10px;padding:6px 12px;white-space:nowrap}
#f3d-root .f3d-btn:disabled{opacity:.4;cursor:default}
#f3d-root .f3d-btn:focus-visible,#f3d-root .f3d-mk:focus-visible,#f3d-root .f3d-part:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
#f3d-root .f3d-play{width:100%;margin-top:10px;font-weight:700}
#f3d-root .f3d-primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:700}
#f3d-root .f3d-close{font-size:16px;padding:4px 12px}
#f3d-root .f3d-phase{background:var(--mk-bg);border:1px solid var(--line);border-radius:10px;padding:5px 11px;font-size:13px;display:grid;line-height:1.45;white-space:nowrap}
#f3d-root .f3d-phase b{color:var(--accent)}
#f3d-root .f3d-deg{color:var(--muted);font-size:12px}
#f3d-root .f3d-hint{position:absolute;inset:auto 12px 10px 12px;text-align:center;font-size:12px;opacity:.75;pointer-events:none}
#f3d-root .f3d-toast{position:absolute;inset:auto 12px 40px 12px;margin-inline:auto;max-width:420px;text-align:center;background:var(--accent);color:var(--accent-ink);font-weight:700;font-size:13.5px;border-radius:10px;padding:7px 12px;pointer-events:none}
#f3d-root .f3d-enginebar{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 14px}
#f3d-root .f3d-enginebar label{display:flex;align-items:center;gap:10px;flex:1 1 180px}
#f3d-root .f3d-enginebar input{flex:1;min-width:0;accent-color:var(--accent)}
#f3d-root .f3d-rpm{color:var(--muted);font-size:13px;white-space:nowrap}
#f3d-root .f3d-side{display:grid;gap:12px;min-width:0}
#f3d-root .f3d-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;gap:8px;min-width:0}
#f3d-root .f3d-stepmeta{font-size:12.5px;color:var(--muted)}
#f3d-root .f3d-card h3{margin:0;font-size:18px;line-height:1.4;color:var(--fg)}
#f3d-root .f3d-card h4{margin:0;font-size:14px;color:var(--muted)}
#f3d-root .f3d-card p{margin:0;color:var(--fg)}
#f3d-root .f3d-stepnav{display:flex;align-items:center;justify-content:space-between;gap:10px}
#f3d-root .f3d-dots{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
#f3d-root .f3d-dot{width:10px;height:10px;border-radius:50%;border:0;padding:0;background:var(--line);cursor:pointer}
#f3d-root .f3d-dot[aria-current="true"]{background:var(--accent);width:22px;border-radius:6px}
#f3d-root .f3d-parts{list-style:none;margin:0;padding:0;display:grid;gap:4px}
#f3d-root .f3d-part{font:inherit;width:100%;cursor:pointer;display:grid;grid-template-columns:28px minmax(0,1fr);gap:10px;align-items:start;text-align:start;background:transparent;border:1px solid transparent;border-radius:10px;padding:7px 8px;color:var(--fg)}
#f3d-root .f3d-part.f3d-sel{border-color:var(--accent);background:var(--accent-soft)}
#f3d-root .f3d-n{width:26px;height:26px;border-radius:50%;border:2px solid var(--accent);font:700 13px/22px monospace;text-align:center}
#f3d-root .f3d-part.f3d-sel .f3d-n{background:var(--accent);color:var(--accent-ink)}
#f3d-root .f3d-part b{font-weight:700;display:block;line-height:1.4}
#f3d-root .f3d-part span{color:var(--muted);font-size:13px;line-height:1.5}
#f3d-root .f3d-err{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px}
`;
document.head.appendChild(styleEl); document.body.appendChild(root3d);
const $ = id => document.getElementById('f3d-' + id);
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
  stageEl.insertAdjacentHTML('beforeend', '<div class="f3d-err">الجهاز ده مش بيدعم عرض 3D (WebGL). جرّب من متصفح Chrome أو من الكمبيوتر.</div>');
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
controls.addEventListener('start', () => { controls.autoRotate = false; userMoved = true; try{ camGoal = null; }catch(e){} });
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

/* ================= برنامج السيارات: الدفعة الأولى (المحرك) ================= */
function readout(w = .5, h = .14, fg = '#7dffb0'){
  const c = makeCanvas(w, h, 640); let last = null;
  return { mesh: c.mesh, setText(s){ if(s === last) return; last = s; c.draw((x, W, H) => { x.fillStyle = '#0d1b2e'; x.fillRect(0, 0, W, H); let fs = Math.round(H * .62); x.font = `bold ${fs}px "IBM Plex Sans Arabic", Tahoma, monospace`; while(fs > 12 && x.measureText(s).width > W - 24){ fs -= 2; x.font = `bold ${fs}px "IBM Plex Sans Arabic", Tahoma, monospace`; } x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, W / 2, H / 2 + 2); }); } };
}
function sparkSprite(color = 0x9fd3ff){ return new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); }

/* ---------- المحرك رباعي الأشواط ---------- */
function buildEngine4(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const E = new THREE.Group(); E.position.set(-.3, .55, -.3); root.add(E);
  const r = .17, l = .5, bore = .2;
  E.add(at(box(.9, .5, .7, M(0x6b7686, { m: .4, opacity: .18 })), 0, -.05, 0));
  const cylW = new THREE.Mesh(new THREE.CylinderGeometry(bore + .03, bore + .03, .62, 32, 1, true), M(0x9aa0a6, { m: .5, opacity: .22, side: THREE.DoubleSide })); E.add(at(cylW, 0, .88, 0));
  const head = new THREE.Group(); head.position.y = 1.24; E.add(head); head.add(box(.62, .14, .5, M(0x8a9099, { m: .5, opacity: .35 })));
  const cover = box(.6, .1, .48, M(0x2b3038, { opacity: .3 })); head.add(at(cover, 0, .2, 0));
  // الكرنك
  const crank = new THREE.Group(); E.add(crank);
  crank.add(cyl(.05, .05, .7, M(0xb7bec8, { m: .85 }), 16).rotateX(Math.PI / 2));
  const web = box(.06, .42, .04, M(0x6c747d, { m: .7 })); [-.06, .06].forEach(z => { const w = web.clone(); w.position.set(0, .04, z); crank.add(w); });
  const cw = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .04, 20, 1, false, Math.PI * .65, Math.PI * .7), M(0x6c747d, { m: .7 })); cw.rotation.x = Math.PI / 2; [-.06, .06].forEach(z => { const c2 = cw.clone(); c2.position.z = z; crank.add(c2); });
  const pinM = cyl(.035, .035, .16, M(0xb7bec8, { m: .9 }), 12); pinM.rotation.x = Math.PI / 2; pinM.position.y = r; crank.add(pinM);
  const rod = new THREE.Group(); E.add(rod); rod.add(at(box(.05, l, .04, M(0xb7bec8, { m: .85 })), 0, l / 2, 0));
  const piston = new THREE.Group(); E.add(piston); piston.add(cyl(bore - .005, bore - .005, .16, M(0xc9ced6, { m: .7 }), 28)); [.04, .06].forEach(y => piston.add(at(new THREE.Mesh(new THREE.TorusGeometry(bore - .004, .006, 6, 28), M(0x3a3f46, { m: .8 })).rotateX(Math.PI / 2), 0, y, 0)));
  const gasM = M(0x7fb2ff, { opacity: .35 }); const gas = cyl(bore - .01, bore - .01, 1, gasM, 28); E.add(gas);
  const vM = (c) => M(c, { m: .7 }); const valves = [[-.08, vM(0x3c7be0)], [.08, vM(0xd23a2e)]].map(([x, m]) => { const g = new THREE.Group(); g.position.set(x, 1.2, 0); E.add(g); g.add(at(cyl(.012, .012, .25, m, 8), 0, .12, 0)); g.add(cyl(.05, .03, .02, m, 16)); return g; });
  const cams = [-.08, .08].map(x => { const g = new THREE.Group(); g.position.set(x, 1.5, 0); E.add(g); const c = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .04, 16), M(0x6c747d, { m: .7 })); c.rotation.x = Math.PI / 2; g.add(c); const lobe = box(.035, .06, .04, M(0x6c747d, { m: .7 })); lobe.position.y = -.045; g.add(lobe); return g; });
  const plug = new THREE.Group(); plug.position.set(0, 1.28, 0); E.add(plug); plug.add(at(cyl(.02, .02, .2, M(0xe9ebef), 10), 0, .1, 0)); plug.add(at(cyl(.008, .008, .04, M(0xc9ced6, { m: .9 }), 8), 0, -.03, 0));
  const spark = sparkSprite(); spark.position.set(0, 1.2, 0); E.add(spark); const fire = sparkSprite(0xff8a3a); E.add(fire);
  const inP = tube(CR([V(-.5, 1.42, 0), V(-.25, 1.35, 0), V(-.1, 1.22, 0)]), .05, M(0x3c7be0, { opacity: .35 }), 20); E.add(inP);
  const exP = tube(CR([V(.1, 1.22, 0), V(.25, 1.35, 0), V(.5, 1.42, 0)]), .05, M(0x8a9099, { opacity: .35 }), 20); E.add(exP);
  const flowIn = new Flow(E, CR([V(-.6, 1.45, 0), V(-.25, 1.35, 0), V(-.08, 1.15, 0), V(0, .9, 0)]), { color: 0x7fb2ff, count: 12, speed: .9, size: .02 });
  const flowEx = new Flow(E, CR([V(0, .9, 0), V(.08, 1.15, 0), V(.25, 1.35, 0), V(.6, 1.45, 0)]), { color: 0x9aa0a6, count: 12, speed: .9, size: .02 });
  const stroke = readout(.7, .14, '#ffd34d'); stroke.mesh.position.set(.75, 1.75, -.3); root.add(stroke.mesh); const degP = readout(.4, .12); degP.mesh.position.set(.75, 1.57, -.3); root.add(degP.mesh);
  part('piston', piston, V(0, .12, .1), L('المكبس والشنابر', 'Piston and rings'), L('بيطلع وينزل جوه السلندر.', 'Moves up and down in the cylinder.'));
  part('rod', rod, V(0, .25, .05), L('ذراع التوصيل (البيلة)', 'Connecting rod'), L('بيحوّل حركة المكبس لدوران.', 'Turns piston motion into rotation.'));
  part('crank', crank, V(.2, 0, .3), L('عمود الكرنك', 'Crankshaft'), L('بيلف ويطلّع القدرة للفتيس.', 'Turns and delivers power to the gearbox.'));
  part('valves', valves[0], V(0, .35, 0), L('صمامات السحب والعادم', 'Intake and exhaust valves'), L('الأزرق سحب، والأحمر عادم. عمود الكامة بيفتحهم.', 'Blue intake, red exhaust, opened by the camshaft.'));
  part('plug', plug, V(0, .3, 0), L('البوجيه', 'Spark plug'), L('بيعمل شرارة بتولّع الخليط.', 'Sparks to ignite the mixture.'));
  part('cam', cams[0], V(0, .12, 0), L('عمود الكامة', 'Camshaft'), L('بيلف نص سرعة الكرنك.', 'Turns at half crank speed.'));
  const NAMES = { intake: L('شوط السحب', 'Intake stroke'), compression: L('شوط الانضغاط', 'Compression stroke'), power: L('شوط القدرة', 'Power stroke'), exhaust: L('شوط العادم', 'Exhaust stroke') };
  const RANGE = { all: [0, 720], intake: [0, 180], compression: [180, 360], power: [360, 540], exhaust: [540, 720] };
  const st = { only: 'all', speed: 60 }; let phi = 0, t = 0;
  ctx.parts.crank.tap = () => { st.speed = st.speed === 60 ? 160 : st.speed === 160 ? 25 : 60; return L(`السرعة: ${st.speed === 160 ? 'سريع' : st.speed === 60 ? 'متوسط' : 'بطيء'}`, `Speed: ${st.speed === 160 ? 'fast' : st.speed === 60 ? 'medium' : 'slow'}`); };
  const lift = (p, a, b) => (p > a && p < b) ? Math.sin(Math.PI * (p - a) / (b - a)) : 0;
  return {
    ...ctx, view: V(.1, .45, 1.45), sway: true, hint: L('دوس على عمود الكرنك يغيّر السرعة', 'Tap the crankshaft to change speed'),
    steps: [
      { title: L('المحرك رباعي الأشواط', 'The four-stroke engine'), text: L('محرك البنزين بيكمّل دورته في 4 أشواط (لفتين للكرنك = 720 درجة): سحب، وانضغاط، وقدرة، وعادم. المكبس بيطلع وينزل، والبيلة بتحوّل الحركة دي لدوران في الكرنك، وعمود الكامة بيفتح الصمامات في الوقت الصح.', 'A petrol engine completes its cycle in four strokes (two crank turns, 720°): intake, compression, power and exhaust. The piston goes up and down, the rod turns that into crank rotation and the camshaft opens the valves on time.'), s: { only: 'all' } },
      { title: L('شوط السحب', 'Intake stroke'), text: L('المكبس نازل، وصمام السحب (الأزرق) مفتوح، فخليط الهوا والبنزين بيتسحب جوه السلندر. صمام العادم مقفول.', 'The piston moves down with the intake valve (blue) open, drawing the air-fuel mixture into the cylinder. The exhaust valve is shut.'), focus: 'valves', s: { only: 'intake' } },
      { title: L('شوط الانضغاط', 'Compression stroke'), text: L('الصمامين مقفولين والمكبس طالع، فالخليط بيتضغط في مساحة صغيرة فوق المكبس (نسبة الانضغاط حوالي 10:1) وبيسخن. كل ما الانضغاط أحسن، المحرك أقوى.', 'Both valves are shut and the piston rises, squeezing the mixture into a small space (about 10:1 compression) and heating it. Better compression means more power.'), focus: 'piston', s: { only: 'compression' } },
      { title: L('شوط القدرة', 'Power stroke'), text: L('قبل ما المكبس يوصل فوق بشوية، البوجيه بيعمل شرارة، فالخليط يولّع ويتمدد بقوة ويزق المكبس لتحت. ده الشوط الوحيد اللي بيطلّع شغل، والحدافة بتكمّل باقي الأشواط بقوة دفعه.', 'Just before the top, the spark plug fires, the mixture burns and expands violently and drives the piston down. This is the only stroke that does work; the flywheel carries the engine through the others.'), focus: 'plug', s: { only: 'power' } },
      { title: L('شوط العادم', 'Exhaust stroke'), text: L('المكبس طالع وصمام العادم (الأحمر) مفتوح، فالغازات المحروقة بتطلع للشكمان. وبعدها الدورة تبدأ من الأول.', 'The piston rises with the exhaust valve (red) open, pushing the burnt gases into the exhaust. Then the cycle starts again.'), focus: 'valves', s: { only: 'exhaust' } },
      { title: L('الدورة كاملة والتقسيمة', 'The full cycle and firing order'), text: L('عمود الكامة بيلف نص سرعة الكرنك، لأن كل صمام بيفتح مرة واحدة كل لفتين. في محرك 4 سلندر، كل سلندر بيعمل شوط مختلف في نفس الوقت، وترتيب الإشعال غالبًا 1-3-4-2 عشان المحرك يمشي ناعم. دوس على الكرنك تغيّر السرعة.', 'The camshaft turns at half crank speed because each valve opens once every two turns. In a four-cylinder engine each cylinder is on a different stroke at any moment, usually firing 1-3-4-2 for smooth running. Tap the crank to change speed.'), focus: 'cam', s: { only: 'all' } }
    ],
    apply(s){ st.only = s.only; phi = RANGE[st.only][0]; },
    update(dt){ t += dt; const [a, b] = RANGE[st.only]; phi += dt * st.speed * (st.only === 'all' ? 3 : 1.2); if(phi >= b) phi = a + (phi - b) % (b - a);
      const th = phi * Math.PI / 180; crank.rotation.z = -th; const pinX = Math.sin(th) * r, pinY = Math.cos(th) * r;
      const py = pinY + Math.sqrt(l * l - pinX * pinX); piston.position.set(0, py + .08, 0); rod.position.set(pinX, pinY, 0); rod.rotation.z = Math.atan2(pinX, py - pinY) ;
      const top = py + .16, hh = Math.max(.02, 1.17 - top); gas.scale.y = hh; gas.position.y = top + hh / 2;
      const p = phi % 720, sk = p < 180 ? 'intake' : p < 360 ? 'compression' : p < 540 ? 'power' : 'exhaust';
      const li = lift(p, 0, 200) * .06, le = lift(p, 520, 720) * .06; valves[0].position.y = 1.2 - li; valves[1].position.y = 1.2 - le;
      cams.forEach(c => c.rotation.z = -th / 2);
      const C = { intake: 0x7fb2ff, compression: 0xffb04a, power: 0xff5a2a, exhaust: 0x9aa0a6 }; gasM.color.setHex(C[sk]); gasM.opacity = sk === 'power' ? .55 : .35;
      const sp = p > 350 && p < 372 ? Math.sin(Math.PI * (p - 350) / 22) : 0; spark.material.opacity = sp; spark.scale.setScalar(.1 + .25 * sp);
      const burn = sk === 'power' ? Math.max(0, 1 - (p - 360) / 140) : 0; fire.material.opacity = burn * .9; fire.scale.setScalar(.25 + .3 * burn); fire.position.set(0, top + .05, 0);
      flowIn.target = sk === 'intake' ? 1 : 0; flowEx.target = sk === 'exhaust' ? 1 : 0; flowIn.update(dt); flowEx.update(dt);
      stroke.setText(NAMES[sk]); degP.setText(Math.round(p) + '°');
    }
  };
}

/* ---------- فحص وقياس مكونات المحرك ---------- */
function makeMicrometer(){
  const g = new THREE.Group(); const fr = M(0x1d2128, { m: .4 });
  g.add(tube(CR([V(-.12, 0, 0), V(-.14, -.12, 0), V(0, -.18, 0), V(.14, -.12, 0), V(.12, 0, 0)]), .018, fr, 40));
  g.add(at(cyl(.012, .012, .06, M(0xc9ced6, { m: .9 }), 10).rotateZ(Math.PI / 2), -.1, 0, 0));
  const sp = cyl(.012, .012, .1, M(0xc9ced6, { m: .9 }), 10); sp.rotation.z = Math.PI / 2; g.add(at(sp, .1, 0, 0));
  g.add(at(cyl(.025, .025, .12, M(0xb9c0c8, { m: .8 }), 16).rotateZ(Math.PI / 2), .21, 0, 0)); g.add(at(cyl(.03, .03, .1, M(0x8a9099, { m: .7 }), 16).rotateZ(Math.PI / 2), .31, 0, 0));
  return g;
}
function buildEngineParts(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const blk = new THREE.Group(); blk.position.set(-1.0, 0, -.35); root.add(blk); blk.add(at(box(.7, .5, .4, M(0x6b7686, { m: .4, r: .5 })), 0, .25, 0));
  [-.17, .17].forEach(x => blk.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .02, 28), M(0x1d2128)), x, .505, 0)));
  const bg = new THREE.Group(); bg.position.set(-1.17, .5, -.35); root.add(bg); bg.add(at(cyl(.008, .008, .5, M(0xc9ced6, { m: .9 }), 8), 0, .1, 0)); const dial = makeGauge('#2a62c9', 0, 10, [0, 2, 4, 6, 8], '0.01'); dial.group.scale.setScalar(.2); dial.group.position.set(0, .4, .02); bg.add(dial.group);
  const crk = new THREE.Group(); crk.position.set(-.1, .1, -.3); root.add(crk);
  for(let i = 0; i < 5; i++){ crk.add(at(cyl(.05, .05, .08, M(0xb7bec8, { m: .9, r: .2 }), 18).rotateZ(Math.PI / 2), -.4 + i * .2, 0, 0)); if(i < 4) crk.add(at(box(.04, .2, .12, M(0x6c747d, { m: .7 })), -.3 + i * .2, .03 * (i % 2 ? 1 : -1), 0)); }
  const mic = makeMicrometer(); mic.position.set(-.1, .1, -.3); mic.rotation.y = Math.PI / 2; root.add(mic);
  const pis = new THREE.Group(); pis.position.set(.7, 0, -.35); root.add(pis); pis.add(at(cyl(.12, .12, .16, M(0xc9ced6, { m: .7 }), 28), 0, .08, 0)); [.12, .14].forEach(y => pis.add(at(new THREE.Mesh(new THREE.TorusGeometry(.121, .005, 6, 28), M(0x3a3f46, { m: .8 })).rotateX(Math.PI / 2), 0, y, 0)));
  const ring = new THREE.Group(); ring.position.set(-.83, .515, -.35); root.add(ring); ring.add(new THREE.Mesh(new THREE.TorusGeometry(.125, .006, 6, 40, Math.PI * 1.95), M(0x3a3f46, { m: .8 })).rotateX(Math.PI / 2));
  const feeler = new THREE.Group(); feeler.position.set(-.83, .53, -.22); root.add(feeler); [0, 1, 2, 3].forEach(i => { const b = box(.2, .003, .03, M(0xc9ced6, { m: .9 })); b.position.set(.1, i * .004, 0); b.rotation.y = i * .15; feeler.add(b); });
  const head = new THREE.Group(); head.position.set(.6, .02, .3); root.add(head); head.add(at(box(.8, .14, .32, M(0x9aa0a6, { m: .5 })), 0, .07, 0)); const edge = box(.85, .02, .04, M(0xc9ced6, { m: .9 })); head.add(at(edge, 0, .15, 0));
  const rd = readout(1.0, .15); rd.mesh.position.set(.2, 1.1, -1.5); root.add(rd.mesh); const lim = readout(1.0, .13, '#ffd34d'); lim.mesh.position.set(.2, .94, -1.5); root.add(lim.mesh);
  part('blk', blk, V(0, .6, 0), L('البلوك والسلندرات', 'Block and bores'), L('بنقيس قطر السلندر بساعة القياس.', 'Bore diameter is measured with a dial bore gauge.'));
  part('crk', crk, V(0, .15, .05), L('عمود الكرنك', 'Crankshaft'), L('بنقيس الكراسي بالميكرومتر.', 'Journals are measured with a micrometer.'));
  part('mic', mic, V(.2, .05, 0), L('الميكرومتر', 'Micrometer'), L('دقته 0.01 مم.', 'Reads to 0.01 mm.'));
  part('pis', pis, V(0, .25, 0), L('المكبس والشنابر', 'Piston and rings'), L('بنقيس خلوص الشنبر بالفيلر.', 'Ring gap is checked with a feeler gauge.'));
  part('feeler', feeler, V(.1, .05, 0), L('الفيلر', 'Feeler gauge'), L('شرايح بسُمك معروف.', 'Blades of known thickness.'));
  part('head', head, V(0, .25, 0), L('وش السلندر والمسطرة', 'Head and straight edge'), L('بنكشف الاعوجاج بالمسطرة والفيلر.', 'Warpage is found with a straight edge and feeler.'));
  const st = { m: 'none' };
  const DATA = { none: ['', ''], crank: [L('كرسي الكرنك: 54.98 مم', 'Main journal: 54.98 mm'), L('المقاس 55.00 · الحد 54.95: سليم', 'Spec 55.00 · limit 54.95: OK')], bore: [L('قطر السلندر: 81.06 مم', 'Bore: 81.06 mm'), L('المقاس 81.00 · الحد 81.05: محتاج خراطة', 'Spec 81.00 · limit 81.05: rebore')], ring: [L('خلوص الشنبر: 0.30 مم', 'Ring gap: 0.30 mm'), L('المسموح 0.25 لـ 0.45: سليم', 'Allowed 0.25–0.45: OK')], head: [L('اعوجاج الوش: 0.03 مم', 'Head warpage: 0.03 mm'), L('الحد 0.05 مم: سليم', 'Limit 0.05 mm: OK')] };
  return {
    ...ctx, view: V(.05, .7, 1.45), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('فحص مكونات المحرك', 'Inspecting engine parts'), text: L('بعد فك المحرك بنفحص كل جزء بالنضر الأول (شروخ، تآكل، خدوش، اسوداد)، وبعدين بالقياس ونقارن بكتالوج الصيانة. قدامك البلوك، والكرنك، والمكبس، ووش السلندر، وأدوات القياس.', 'After dismantling, inspect every part by eye (cracks, wear, scoring, discolouration), then measure and compare with the workshop manual. Shown: the block, crankshaft, piston, cylinder head and measuring tools.'), s: { m: 'none' } },
      { title: L('ترتيب الفك والتركيب', 'Dismantling order'), text: L('علّم كل حاجة قبل ما تفكها، ورتّب القطع بنفس الترتيب. فك مسامير وش السلندر من برّه لجوه على مراحل، واربطها في التركيب من جوه لبرّه بعزم الكتالوج. المكابس والبيل كل واحدة بترجع لسلندرها ونفس اتجاهها.', 'Mark everything before removal and lay parts out in order. Loosen head bolts outside-in in stages and tighten them inside-out to the manual torque. Pistons and rods go back in their own bores, facing the same way.'), focus: 'blk', s: { m: 'none' } },
      { title: L('قياس كراسي الكرنك', 'Measuring crank journals'), text: L('الميكرومتر بيقيس قطر الكرسي لحد 0.01 مم. قيس في اتجاهين ومكانين عشان تكشف البيضاوية والمخروطية. لو تحت الحد، الكرنك يتجلخ ويتركب سبيكة أوفر سايز.', 'The micrometer measures the journal to 0.01 mm. Measure in two directions and two places to find ovality and taper. Below the limit, the crank is ground and fitted with oversize shells.'), focus: 'mic', s: { m: 'crank' } },
      { title: L('قياس قطر السلندر', 'Measuring the bore'), text: L('ساعة قياس السلندر بتتظبط على المقاس الأصلي وبتدخل في 3 مستويات (فوق ونص وتحت) واتجاهين. الزيادة هنا 0.06 مم، يعني السلندر محتاج خراطة ومكابس أوفر سايز.', 'The bore gauge is zeroed to the standard size and read at three depths and two directions. Here it reads 0.06 mm over, so the bore needs reboring with oversize pistons.'), focus: 'blk', s: { m: 'bore' } },
      { title: L('خلوص الشنبر', 'Piston ring gap'), text: L('حط الشنبر جوه السلندر مستوي (ادفعه بالمكبس)، وقيس الفتحة بين طرفيه بالفيلر. لو الخلوص كبير يبقى الشنبر داب، ولو صغير يتلقّط لما يسخن.', 'Push the ring squarely into the bore with the piston and measure its end gap with a feeler gauge. Too large means a worn ring; too small and it can seize when hot.'), focus: 'feeler', s: { m: 'ring' } },
      { title: L('استواء وش السلندر', 'Cylinder head flatness'), text: L('حط المسطرة على وش السلندر بالطول والعرض والقطر، وجرّب تدخّل فيلر تحتها. لو الاعوجاج أكبر من 0.05 مم، الوش يتقشط (يتسطّح) قبل ما يتركب جوان جديد.', 'Lay the straight edge along, across and diagonally and try a feeler gauge under it. Over 0.05 mm warpage, the head must be skimmed before fitting a new gasket.'), focus: 'head', s: { m: 'head' } },
      { title: L('تغيير الأجزاء التالفة', 'Replacing worn parts'), text: L('أي جزء برّه حدود الكتالوج يتغيّر: شنابر، سبايك، صمامات، جوانات، سيور. الجوانات والصواميل المرنة وجلب الصمامات بتتغيّر دايمًا جديدة في العمرة. ونضّف كل الأجزاء ومجاري الزيت كويس قبل التجميع.', 'Anything outside the manual limits is replaced: rings, shells, valves, gaskets, belts. Gaskets, stretch bolts and valve seals are always renewed at overhaul. Clean all parts and oil ways thoroughly before assembly.'), focus: 'pis', s: { m: 'none' } }
    ],
    apply(s){ st.m = s.m; rd.setText(DATA[st.m][0]); lim.setText(DATA[st.m][1]); },
    update(dt){ const m = st.m;
      mic.position.lerp(m === 'crank' ? V(.1, .1, -.3) : V(.1, .05, .4), Math.min(1, dt * 4)); mic.rotation.set(0, Math.PI / 2, 0);
      bg.position.lerp(m === 'bore' ? V(-1.17, .5, -.35) : V(-1.5, .02, .3), Math.min(1, dt * 4)); bg.rotation.z = ease(bg.rotation.z, m === 'bore' ? 0 : Math.PI / 2, dt, 4); dial.set(m === 'bore' ? 6 : 0); dial.update(dt);
      feeler.visible = m === 'ring'; ring.visible = m === 'ring'; edge.position.y = ease(edge.position.y, m === 'head' ? .15 : .6, dt, 4); edge.visible = m === 'head' || edge.position.y < .55;
    }
  };
}

/* ---------- وش السلندر والجوان وضبط التوقيت ---------- */
function buildTiming(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const blk = new THREE.Group(); blk.position.set(-.2, 0, -.35); root.add(blk); blk.add(at(box(1.2, .55, .45, M(0x6b7686, { m: .4 })), 0, .28, 0));
  for(let i = 0; i < 4; i++) blk.add(at(new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .01, 24), M(0x1d2128)), -.42 + i * .28, .555, 0));
  const gasket = box(1.2, .012, .45, M(0x9aa0a6, { m: .7 })); blk.add(at(gasket, 0, .565, 0));
  const head = new THREE.Group(); head.position.set(-.2, .58, -.35); root.add(head); head.add(at(box(1.2, .2, .45, M(0x9aa0a6, { m: .5 })), 0, .1, 0));
  const bolts = []; const ORDER = [[-.15, .15], [.15, -.15], [-.15, -.15], [.15, .15], [-.45, .15], [.45, -.15], [-.45, -.15], [.45, .15], [-.58, 0], [.58, 0]];
  ORDER.forEach(([x, z], i) => { const b = cyl(.025, .025, .04, M(0x3a3f46, { m: .7 }), 6); b.position.set(x, .22, z); head.add(b); const lb = label(String(i + 1), '#ffd34d', .06); lb.position.set(x, .3, z); head.add(lb); bolts.push({ b, lb }); });
  // التوقيت (قدام)
  const front = new THREE.Group(); front.position.set(.45, 0, -.35); root.add(front);
  const crP = new THREE.Group(); crP.position.set(.01, .15, 0); front.add(crP); crP.add(cyl(.07, .07, .04, M(0x3a3f46, { m: .7 }), 24).rotateZ(Math.PI / 2)); const crMark = box(.045, .02, .02, M(0xffd34d)); crMark.position.set(.025, .06, 0); crP.add(crMark);
  const caP = new THREE.Group(); caP.position.set(.01, .95, 0); front.add(caP); caP.add(cyl(.14, .14, .04, M(0x3a3f46, { m: .7 }), 32).rotateZ(Math.PI / 2)); const caMark = box(.045, .02, .02, M(0xffd34d)); caMark.position.set(.025, .13, 0); caP.add(caMark);
  front.add(at(box(.01, .03, .03, M(0xd23a2e)), .05, .23, 0)); front.add(at(box(.01, .03, .03, M(0xd23a2e)), .05, 1.11, 0));
  const tens = cyl(.04, .04, .045, M(0xe9ebef), 16); tens.rotation.z = Math.PI / 2; front.add(at(tens, .01, .55, .13));
  const beltCurve = new THREE.CatmullRomCurve3([V(.04, .08, -.07), V(.04, .22, -.07), V(.04, .95, -.15), V(.04, 1.09, 0), V(.04, .95, .15), V(.04, .55, .17), V(.04, .22, .07), V(.04, .08, .07), V(.04, .08, 0)], true);
  const belt = tube(beltCurve, .012, M(0x1d2128, { r: .8 }), 120); front.add(belt);
  const tq = readout(.55, .14); tq.mesh.position.set(.2, 1.05, -1.5); root.add(tq.mesh);
  part('head', head, V(0, .32, 0), L('وش السلندر', 'Cylinder head'), L('مسامير بترتيب ربط حلزوني.', 'Bolts tightened in a spiral order.'));
  part('gasket', gasket, V(-.55, .02, .23), L('جوان وش السلندر', 'Head gasket'), L('بيقفل بين الوش والبلوك.', 'Seals the head to the block.'));
  part('cam', caP, V(.05, .16, 0), L('ترس الكامة', 'Cam sprocket'), L('علامته لازم تقابل العلامة الحمرا.', 'Its mark must meet the red mark.'));
  part('crank', crP, V(.05, .09, 0), L('ترس الكرنك', 'Crank sprocket'), L('بيلف مرتين لكل لفة كامة.', 'Turns twice per cam turn.'));
  part('belt', belt, V(.04, .55, -.17), L('سير التوقيت والشدّاد', 'Timing belt and tensioner'), L('بيربط الكرنك بالكامة.', 'Links crank to cam.'));
  const st = { m: 'off' }; let t = 0, lift = 0, rot = 0;
  return {
    ...ctx, view: V(.2, .6, 1.45), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('وش السلندر والتوقيت', 'Head and timing'), text: L('وش السلندر بيقفل على البلوك بجوان، وفيه الصمامات وعمود الكامة. عمود الكامة بيلف بسير (أو جنزير) من الكرنك، ولازم يكونوا متزامنين بالظبط عشان الصمامات تفتح في الوقت الصح.', 'The head seals to the block with a gasket and carries the valves and camshaft. The cam is driven from the crank by a belt or chain, and they must be exactly in time so the valves open correctly.'), s: { m: 'off' } },
      { title: L('فك وش السلندر', 'Removing the head'), text: L('اضبط التوقيت على علامات النقطة الميتة العليا الأول، وفك السير. فك مسامير الوش من برّه لجوه على مرحلتين، وارفع الوش مستوي. أعراض الجوان المضروب: مية في الزيت (لون لبني)، أو دخان أبيض، أو سخونية، أو فقاقيع في الردياتير.', 'First set TDC on the timing marks and remove the belt. Loosen the head bolts outside-in in two stages and lift the head off level. Signs of a blown gasket: water in the oil (milky), white smoke, overheating or bubbles in the radiator.'), focus: 'head', s: { m: 'lift' } },
      { title: L('تركيب الجوان الجديد', 'Fitting the new gasket'), text: L('نضّف الأسطحين كويس من غير ما تخدشهم، واتأكد من الاستواء، وحط جوان جديد بالاتجاه الصح (مكتوب عليه TOP أو UP). ما تحطش سليكون على جوان الوش.', 'Clean both faces without scratching them, check flatness and fit a new gasket the right way up (marked TOP or UP). Never use sealant on a head gasket.'), focus: 'gasket', s: { m: 'gasket' } },
      { title: L('ربط المسامير بالترتيب والعزم', 'Tightening order and torque'), text: L('اربط من النص لبرّه بالترتيب الحلزوني (الأرقام)، على مراحل: مثلًا 30 نيوتن.متر، وبعدين 60، وبعدين 90 درجة زيادة. الربط الغلط بيلوي الوش ويضرب الجوان. المسامير المرنة بتتغيّر.', 'Tighten from the centre outward in the spiral order shown, in stages, for example 30 Nm, then 60 Nm, then a further 90°. A wrong sequence warps the head and blows the gasket. Stretch bolts are replaced.'), focus: 'head', s: { m: 'torque' } },
      { title: L('ضبط علامات التوقيت', 'Aligning the timing marks'), text: L('لف الكرنك لحد ما علامته (الصفرا) تقابل العلامة الحمرا على البلوك، وعلامة ترس الكامة تقابل علامتها على الوش. ركّب السير من غير ما تحرّك التروس، وشد الشدّاد حسب الكتالوج.', 'Turn the crank until its yellow mark meets the red mark on the block, and the cam sprocket mark meets its own. Fit the belt without moving either sprocket and set the tensioner to the manual.'), focus: 'cam', s: { m: 'align' } },
      { title: L('التأكد بلفتين', 'Checking with two turns'), text: L('لف الكرنك بإيدك لفتين كاملين (الكامة لفة واحدة) ورجّع اتأكد إن العلامات اتقابلت تاني. لو الكرنك وقف أو ثقل، يبقى فيه صمام بيخبط في المكبس: وقّف وراجع التوقيت.', 'Turn the crank by hand two full turns (one cam turn) and check the marks line up again. If it stops or tightens, a valve is hitting a piston: stop and recheck the timing.'), focus: 'crank', s: { m: 'turn' } }
    ],
    apply(s){ st.m = s.m; t = 0; if(st.m === 'align' || st.m === 'turn') rot = 0; },
    update(dt){ t += dt; const m = st.m;
      lift = ease(lift, m === 'lift' || m === 'gasket' ? .45 : 0, dt, 2.5); head.position.y = .58 + lift; head.position.x = -.2 - (m === 'gasket' ? .0 : 0);
      gasket.material.color.setHex(m === 'gasket' ? 0xd9a441 : 0x9aa0a6);
      const k = m === 'torque' ? Math.min(ORDER.length, Math.floor(t * 1.5)) : (m === 'off' || m === 'align' || m === 'turn' ? ORDER.length : 0);
      bolts.forEach((o, i) => { const done = i < k; o.b.material.color.setHex(done ? 0x2fbf5a : 0x3a3f46); o.b.rotation.y = done ? 1 : 0; o.lb.visible = m === 'torque'; });
      tq.setText(m === 'torque' ? (t < 7 ? '30 N·m' : t < 14 ? '60 N·m' : '+90°') : m === 'align' ? 'TDC' : m === 'turn' ? (rot / (Math.PI * 2)).toFixed(1) + L(' لفة', ' turns') : '');
      if(m === 'align'){ rot = ease(rot, 0, dt, 2); } if(m === 'turn'){ rot = Math.min(Math.PI * 4, rot + dt * 1.2); if(rot >= Math.PI * 4 && t > 14) { rot = 0; t = 0; } }
      if(m !== 'align' && m !== 'turn') rot = .8; crP.rotation.x = -rot; caP.rotation.x = -rot / 2;
    }
  };
}

/* ---------- قياس الانضغاط والتخلخل وكشف الأعطال ---------- */
function buildCompression(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const eng = new THREE.Group(); eng.position.set(-.5, 0, -.35); root.add(eng); eng.add(at(box(1.2, .55, .45, M(0x6b7686, { m: .4 })), 0, .28, 0)); eng.add(at(box(1.2, .25, .45, M(0x9aa0a6, { m: .5 })), 0, .68, 0));
  const holes = []; for(let i = 0; i < 4; i++){ const x = -.42 + i * .28; eng.add(at(cyl(.03, .03, .02, M(0x1d2128), 12), x, .81, 0)); eng.add(at(label(String(i + 1), '#ffd34d', .07), x, .95, .15)); holes.push(x); }
  const man = tube(CR([V(-1.0, .7, -.1), V(-.9, .6, .2), V(.2, .6, .2), V(.3, .7, -.1)]), .05, M(0x8a9099, { m: .6 }), 40); eng.add(man);
  const cg = new THREE.Group(); root.add(cg); cg.add(at(cyl(.01, .01, .3, M(0x1d2128), 8), 0, .15, 0)); const cgG = makeGauge('#d23a2e', 0, 20, [0, 5, 10, 15, 20], 'bar'); cgG.group.scale.setScalar(.3); cgG.group.position.set(0, .35, .02); cg.add(cgG.group);
  const vg = makeGauge('#2a62c9', 0, 30, [0, 10, 20, 30], 'inHg'); vg.group.scale.setScalar(.4); vg.group.position.set(.7, .5, -.1); root.add(vg.group); root.add(tube(CR([V(.7, .4, -.1), V(.5, .4, .0), V(-.2, .6, -.15)]), .008, M(0x1d2128), 20));
  const chart = makeCanvas(.9, .55, 512); chart.mesh.position.set(.3, 1.15, -1.5); root.add(chart.mesh);
  const oil = new THREE.Mesh(new THREE.SphereGeometry(.02, 8, 6), M(0xd9a441)); root.add(oil);
  part('eng', eng, V(0, .95, 0), L('المحرك', 'Engine'), L('4 سلندرات.', 'Four cylinders.'));
  part('cg', cg, V(0, .5, 0), L('جهاز قياس الانضغاط', 'Compression tester'), L('بيتركب مكان البوجيه.', 'Screws in place of the spark plug.'));
  part('vg', vg.group, V(0, .3, 0), L('ساعة التخلخل', 'Vacuum gauge'), L('متوصلة بمجمع السحب.', 'Connected to the intake manifold.'));
  part('chart', chart.mesh, V(0, .32, 0), L('النتايج', 'Results'), '');
  const SETS = { good: [12.5, 12.2, 12.4, 12.3], ring: [12.4, 8.0, 12.3, 12.2], ringWet: [12.4, 11.6, 12.3, 12.2], gasket: [12.4, 6.5, 6.8, 12.3] };
  const st = { m: 'good', vac: 'steady' }; let t = 0;
  const drawChart = (vals, cur) => chart.draw((x, W, H) => { x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, W, H); x.fillStyle = '#16302a'; x.font = 'bold 24px "IBM Plex Sans Arabic", Tahoma'; x.textAlign = 'center'; x.fillText(L('الانضغاط (بار)', 'Compression (bar)'), W / 2, 30); x.font = '18px "IBM Plex Sans Arabic", Tahoma'; x.fillText(L('المسموح 11 لـ 13 · الفرق أقل من 10٪', '11–13 allowed · under 10% spread'), W / 2, 56);
    vals.forEach((v, i) => { const bx = 70 + i * 105, bh = v / 14 * (H - 110), ok = v >= 11; x.fillStyle = i < cur ? (ok ? '#2fbf5a' : '#d23a2e') : '#d6dce4'; x.fillRect(bx, H - 40 - (i < cur ? bh : 4), 70, i < cur ? bh : 4); x.fillStyle = '#111'; x.font = 'bold 22px monospace'; x.fillText(i < cur ? v.toFixed(1) : '—', bx + 35, H - 50 - (i < cur ? bh : 4)); x.fillText('#' + (i + 1), bx + 35, H - 12); }); });
  return {
    ...ctx, view: V(.05, .65, 1.45), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('قياس الانضغاط', 'Compression testing'), text: L('الاختبار ده بيكشف حالة الشنابر والصمامات والجوان. المحرك يكون سخن، شيل كل البوجيهات، وافصل الوقود والإشعال، وافتح الدواسة على الآخر، وركّب الجهاز مكان البوجيه، وشغّل المارش 4 لـ 6 لفات.', 'This test reveals the state of rings, valves and gasket. With the engine warm, remove all plugs, disable fuel and ignition, hold the throttle wide open, fit the gauge in the plug hole and crank 4–6 revolutions.'), focus: 'cg', s: { m: 'good' } },
      { title: L('محرك سليم', 'A healthy engine'), text: L('كل السلندرات قريبة من بعض (12 بار تقريبًا)، والفرق بين أعلى وأقل واحد أقل من 10٪. يبقى الانضغاط سليم.', 'All cylinders read close together (about 12 bar), with under 10% between highest and lowest. Compression is good.'), focus: 'chart', s: { m: 'good' } },
      { title: L('سلندر واحد ضعيف', 'One weak cylinder'), text: L('سلندر 2 قرا 8 بار بس. حط معلقة زيت صغيرة في فتحة البوجيه وقيس تاني (اختبار رطب). لو الضغط علي كتير يبقى الشنابر دايبة، لأن الزيت قفل الخلوص. ولو ما اتغيّرش يبقى صمام مش قافل.', 'Cylinder 2 reads only 8 bar. Add a spoonful of oil through the plug hole and retest (wet test). A big rise means worn rings, since the oil seals them; no change means a valve is not seating.'), focus: 'chart', s: { m: 'ring' } },
      { title: L('سلندرين جنب بعض ضعاف', 'Two adjacent weak cylinders'), text: L('سلندر 2 و3 الاتنين ضعاف وجنب بعض: ده غالبًا جوان وش السلندر مضروب بينهم، والضغط بيعدّي من واحد للتاني.', 'Cylinders 2 and 3, side by side, are both low: usually a head gasket blown between them, leaking from one to the other.'), focus: 'chart', s: { m: 'gasket' } },
      { title: L('ساعة التخلخل', 'The vacuum gauge'), text: L('على الدوران البطيء، الساعة المتوصلة بمجمع السحب لازم تقف ثابتة بين 17 و21 بوصة زئبق. لو بتهتز بانتظام يبقى صمام محروق أو ماسك، ولو واطية وثابتة يبقى تسريب هوا أو توقيت متأخر، ولو بتتهز جامد يبقى جوان مضروب.', 'At idle, a gauge on the intake manifold should sit steady between 17 and 21 inHg. Regular flicking means a burnt or sticking valve; low and steady means an air leak or late timing; wide swings mean a blown gasket.'), focus: 'vg', s: { m: 'good', vac: 'steady' } },
      { title: L('كشف أعطال المحرك', 'Engine fault diagnosis'), text: L('ابدأ بالأعراض: دخان أزرق = زيت بيتحرق (شنابر أو جلب صمامات)، ودخان أسود = بنزين زيادة، ودخان أبيض كتير = مية (جوان). وطَقطَقة = تكايات أو بيل، ورعشة = سلندر مش شغال (بوجيه، بوبينة، رشاش، انضغاط). وكل عطل يتأكد بقياس قبل ما تغيّر قطع.', 'Start with symptoms: blue smoke = burning oil (rings or valve seals); black smoke = too much fuel; heavy white smoke = coolant (gasket). Knocking = tappets or bearings; misfire = a dead cylinder (plug, coil, injector, compression). Confirm each with a measurement before replacing parts.'), focus: 'eng', s: { m: 'ring', vac: 'flick' } }
    ],
    apply(s){ Object.assign(st, { vac: 'steady' }, s); t = 0; },
    update(dt){ t += dt; const vals = SETS[st.m]; const cur = Math.min(4, Math.floor(t / 1.8) + 1); const idx = cur - 1;
      cg.position.set(-.5 + holes[idx], .82, -.35); const prog = Math.min(1, (t % 1.8) / 1.2); cgG.set(vals[idx] * prog); cgG.update(dt);
      if(t > 9){ t = 0; } if(chart.mesh.userData.k !== st.m + cur){ chart.mesh.userData.k = st.m + cur; drawChart(vals, cur); }
      vg.set(st.vac === 'steady' ? 19 : 17 + Math.sin(t * 8) * 2.5); vg.update(dt);
      oil.visible = st.m === 'ring' && idx === 1; oil.position.set(-.5 + holes[1], 1.0 - (t % 1) * .2, -.35);
      if(st.m === 'ring' && t > 8.5) st.m = 'ringWet';
    }
  };
}

/* ---------- دورة التبريد ---------- */
function buildCooling(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const eng = new THREE.Group(); eng.position.set(-.55, 0, -.35); root.add(eng); eng.add(at(box(1.0, .7, .5, M(0x6b7686, { m: .4, opacity: .3 })), 0, .35, 0));
  const jacket = new THREE.Mesh(new THREE.BoxGeometry(.85, .5, .38), M(0x5aa9e6, { opacity: .35 })); eng.add(at(jacket, 0, .38, 0));
  const rad = new THREE.Group(); rad.position.set(1.0, .1, -.35); root.add(rad); rad.add(at(box(.08, .85, .7, M(0x8a9099, { m: .6 })), 0, .45, 0)); for(let i = 0; i < 14; i++) rad.add(at(box(.09, .012, .68, M(0x6c747d)), 0, .1 + i * .06, 0));
  const fan = new THREE.Group(); fan.position.set(.92, .55, -.35); root.add(fan); for(let i = 0; i < 5; i++){ const b = box(.02, .3, .08, M(0x1d2128)); b.position.y = 0; b.rotation.x = i / 5 * Math.PI * 2; const pv = new THREE.Group(); pv.rotation.x = i / 5 * Math.PI * 2; pv.add(at(box(.02, .15, .07, M(0x1d2128)), 0, .1, 0)); fan.add(pv); }
  const pump = new THREE.Group(); pump.position.set(-.02, .3, -.05); root.add(pump); pump.add(cyl(.08, .08, .08, M(0x9aa0a6, { m: .6 }), 16).rotateZ(Math.PI / 2)); const imp = new THREE.Group(); imp.position.x = .05; pump.add(imp); for(let i = 0; i < 6; i++){ const v = box(.01, .06, .02, M(0xc9a24a)); v.position.y = .03; const pv = new THREE.Group(); pv.rotation.x = i / 6 * Math.PI * 2; pv.add(v); imp.add(pv); }
  const th = new THREE.Group(); th.position.set(-.05, .78, -.35); root.add(th); th.add(cyl(.06, .06, .06, M(0xc9a24a, { m: .6, opacity: .7 }), 16)); const thV = cyl(.045, .045, .015, M(0x3a3f46), 16); th.add(thV);
  const res = new THREE.Group(); res.position.set(.6, .85, .15); root.add(res); res.add(box(.2, .2, .14, M(0xffffff, { opacity: .5 }))); const resL = box(.18, .12, .12, M(0x2fbf5a, { opacity: .6 })); res.add(at(resL, 0, -.03, 0)); res.add(at(label('MIN / MAX', '#1b1f26', .04), 0, .14, .08));
  const hTop = hoseOn(root, [V(-.05, .82, -.35), V(.4, .95, -.4), V(.96, .85, -.35)], 0x1d2128, .035), hBot = hoseOn(root, [V(.96, .15, -.35), V(.5, .1, -.1), V(.06, .3, -.05)], 0x1d2128, .035);
  const byp = CR([V(-.05, .75, -.3), V(-.1, .55, -.1), V(-.02, .35, -.05)]);
  const fHot = new Flow(root, hTop, { color: 0xe0453a, count: 12, speed: .8, size: .025 }), fCold = new Flow(root, hBot, { color: 0x3c7be0, count: 12, speed: .8, size: .025 }), fBy = new Flow(root, byp, { color: 0xffb04a, count: 8, speed: .8, size: .022 });
  const tg = makeGauge('#d23a2e', 40, 120, [40, 60, 80, 100, 120], '°C'); tg.group.scale.setScalar(.4); tg.group.position.set(-.55, 1.05, -.2); root.add(tg.group);
  part('eng', eng, V(0, .8, 0), L('قميص المية في المحرك', 'Water jacket'), L('المية بتلف حوالين السلندرات.', 'Coolant flows round the cylinders.'));
  part('pump', pump, V(0, .12, 0), L('طلمبة المية', 'Water pump'), L('بيلفها السير وبتدوّر المية.', 'Belt-driven, circulates coolant.'));
  part('th', th, V(0, .1, 0), L('الترموستات', 'Thermostat'), L('بيفتح على حوالي 88 درجة.', 'Opens at about 88 °C.'));
  part('rad', rad, V(0, .95, 0), L('الردياتير', 'Radiator'), L('بيبرّد المية بالهوا.', 'Cools the coolant with air.'));
  part('fan', fan, V(0, .3, 0), L('المروحة', 'Fan'), L('بتشتغل لما الحرارة تزيد.', 'Switches on when hot.'));
  part('res', res, V(0, .15, 0), L('قربة التمدد', 'Expansion tank'), L('المستوى بين MIN وMAX على البارد.', 'Level between MIN and MAX when cold.'));
  part('tg', tg.group, V(0, .3, 0), L('عداد الحرارة', 'Temperature gauge'), '');
  const st = { m: 'cold' }; let t = 0, temp = 40;
  return {
    ...ctx, view: V(.05, .6, 1.45), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('دورة التبريد', 'The cooling system'), text: L('الاحتراق بيطلّع حرارة كبيرة، ودورة التبريد بتشيل الزيادة: طلمبة المية بتدوّر سائل التبريد في قميص المحرك، وبيروح للردياتير يتبرّد بالهوا والمروحة، ويرجع تاني. الترموستات بيتحكم في السكة.', 'Combustion makes intense heat and the cooling system removes the excess: the water pump circulates coolant through the engine jacket to the radiator, where air and the fan cool it, and back. The thermostat controls the route.'), s: { m: 'cold' } },
      { title: L('المحرك بارد', 'Cold engine'), text: L('الترموستات مقفول، فالمية بتلف جوه المحرك بس من السكة الجانبية (البرتقالي) من غير ما تروح للردياتير، عشان المحرك يسخن بسرعة لحرارة الشغل.', 'The thermostat is shut, so coolant circulates only inside the engine through the bypass (orange) without reaching the radiator, so the engine warms up quickly.'), focus: 'th', s: { m: 'cold' } },
      { title: L('المحرك وصل لحرارة الشغل', 'At operating temperature'), text: L('على حوالي 88 درجة الترموستات بيفتح، فالمية السخنة (الأحمر) تطلع من فوق للردياتير، وترجع باردة (الأزرق) من تحت للطلمبة. ولو الحرارة وصلت حوالي 95، المروحة تشتغل.', 'At about 88 °C the thermostat opens: hot coolant (red) goes from the top to the radiator and returns cool (blue) from the bottom to the pump. Around 95 °C the fan switches on.'), focus: 'rad', s: { m: 'hot' } },
      { title: L('أعطال التبريد', 'Cooling faults'), text: L('السخونية أسبابها: نقص المية أو تسريب، أو ترموستات لازق مقفول، أو ردياتير مسدود، أو مروحة أو حساسها بايظ، أو طلمبة دايبة، أو جوان وش مضروب. والمحرك اللي ما بيسخنش غالبًا ترموستات لازق مفتوح.', 'Overheating causes: low coolant or a leak, a thermostat stuck shut, a blocked radiator, a failed fan or its switch, a worn pump or a blown head gasket. An engine that never warms up usually has a thermostat stuck open.'), focus: 'fan', s: { m: 'hot' } },
      { title: L('صيانة دورة التبريد', 'Cooling maintenance'), text: L('افحص مستوى القربة والمحرك بارد بس، وما تفتحش غطا الردياتير وهو سخن (المية تحت ضغط وبتحرق). استخدم سائل تبريد بالنسبة الصح، وغيّره حسب الكتالوج، واكشف على الخراطيم والسير. اختبر الترموستات في مية سخنة بترمومتر.', 'Check the tank level only when cold, and never open the radiator cap hot: the coolant is under pressure and scalds. Use coolant at the right mix, change it on schedule and inspect hoses and belt. Test a thermostat in hot water with a thermometer.'), focus: 'res', s: { m: 'hot' } }
    ],
    apply(s){ st.m = s.m; temp = st.m === 'cold' ? 40 : 85; },
    update(dt){ t += dt; temp = Math.min(st.m === 'cold' ? 80 : 96, temp + dt * (st.m === 'cold' ? 6 : 2)); if(st.m === 'cold' && temp >= 80) temp = 40; const open = temp > 87;
      tg.set(temp); tg.update(dt); imp.rotation.x += dt * 12; thV.position.y = ease(thV.position.y, open ? -.04 : 0, dt, 4);
      const fanOn = temp > 94; fan.rotation.x += fanOn ? dt * 20 : 0;
      fHot.target = open ? 1 : 0; fCold.target = open ? 1 : 0; fBy.target = open ? .3 : 1; [fHot, fCold, fBy].forEach(f => f.update(dt));
      jacket.material.color.setRGB(.35 + (temp - 40) / 80 * .55, .66 - (temp - 40) / 80 * .4, .9 - (temp - 40) / 80 * .6);
    }
  };
}

/* ---------- دورة التزييت ---------- */
function buildLube(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const eng = new THREE.Group(); eng.position.set(-.2, 0, -.35); root.add(eng); eng.add(at(box(1.2, .7, .45, M(0x6b7686, { m: .4, opacity: .22 })), 0, .55, 0));
  const sump = new THREE.Group(); sump.position.set(-.2, .1, -.35); root.add(sump); sump.add(box(1.1, .18, .42, M(0x3a3f46, { m: .5, opacity: .4 }))); const oilL = box(1.06, .1, .4, M(0xd9a441, { opacity: .6 })); sump.add(at(oilL, 0, -.03, 0));
  const pump = new THREE.Group(); pump.position.set(-.55, .25, -.35); root.add(pump); pump.add(box(.12, .1, .1, M(0x9aa0a6, { m: .6 }))); const pg = makeGear(8, .035, .03, 0xc9a24a); pg.position.z = .06; pump.add(pg);
  const scr = cyl(.05, .05, .02, M(0x6c747d), 16); scr.position.set(-.55, .06, -.35); root.add(scr);
  const filt = new THREE.Group(); filt.position.set(.55, .35, -.05); root.add(filt); filt.add(cyl(.07, .07, .16, M(0x2a62c9, { r: .4 }), 20).rotateX(Math.PI / 2));
  const crk = cyl(.04, .04, 1.0, M(0xb7bec8, { m: .9 }), 12); crk.rotation.z = Math.PI / 2; crk.position.set(-.2, .45, -.35); root.add(crk);
  const cam = cyl(.03, .03, 1.0, M(0xb7bec8, { m: .9 }), 12); cam.rotation.z = Math.PI / 2; cam.position.set(-.2, .95, -.35); root.add(cam);
  const sw = new THREE.Group(); sw.position.set(.45, .7, -.12); root.add(sw); sw.add(cyl(.025, .025, .06, M(0xc9a24a, { m: .6 }), 10).rotateX(Math.PI / 2));
  const lamp = new THREE.Group(); lamp.position.set(.9, .9, -.3); root.add(lamp); lamp.add(box(.25, .18, .04, M(0x1d2128))); const lampM = M(0x552200); lamp.add(at(new THREE.Mesh(new THREE.CircleGeometry(.05, 20), lampM), 0, 0, .021)); lamp.add(at(label(L('لمبة الزيت', 'Oil light'), '#ffffff', .05), 0, .14, .03));
  const dip = new THREE.Group(); dip.position.set(.3, .6, -.15); root.add(dip); dip.add(at(cyl(.008, .008, .7, M(0xc9ced6, { m: .9 }), 8), 0, 0, 0)); dip.add(at(new THREE.Mesh(new THREE.TorusGeometry(.03, .008, 8, 16), M(0xe8c21a)), 0, .37, 0));
  const pg2 = makeGauge('#d9a441', 0, 6, [0, 2, 4, 6], 'bar'); pg2.group.scale.setScalar(.35); pg2.group.position.set(-.85, 1.05, -.2); root.add(pg2.group);
  const path = CR([V(-.55, .07, -.35), V(-.55, .25, -.35), V(-.3, .3, -.1), V(.48, .35, -.05), V(.55, .45, -.1), V(.3, .5, -.3), V(-.6, .5, -.35), V(-.7, .7, -.3), V(-.7, .95, -.3), V(.3, .95, -.35)]);
  const flow = new Flow(root, path, { color: 0xffb03a, count: 26, speed: .7, size: .022 });
  part('sump', sump, V(0, .15, .2), L('الكارتير (حوض الزيت)', 'Oil sump'), L('فيه الزيت ومسمار التصفية.', 'Holds the oil and the drain plug.'));
  part('pump', pump, V(0, .1, 0), L('طلمبة الزيت', 'Oil pump'), L('بتسحب من المصفاة وتدفع الزيت.', 'Draws through the strainer and pumps oil.'));
  part('filt', filt, V(0, .12, .1), L('فلتر الزيت', 'Oil filter'), L('بيتغيّر مع كل تغيير زيت.', 'Renewed at every oil change.'));
  part('crk', crk, V(.4, .06, 0), L('كراسي الكرنك والكامة', 'Crank and cam bearings'), L('الزيت بيعمل طبقة بتمنع الاحتكاك.', 'Oil forms a film that prevents contact.'));
  part('sw', sw, V(0, .06, 0), L('حساس ضغط الزيت', 'Oil pressure switch'), L('بينوّر اللمبة لو الضغط وقع.', 'Lights the warning lamp if pressure drops.'));
  part('dip', dip, V(0, .42, 0), L('سيخ الزيت', 'Dipstick'), L('المستوى بين علامتين.', 'Level between two marks.'));
  const st = { m: 'run' }; let t = 0, pr = 0;
  return {
    ...ctx, view: V(.05, .6, 1.45), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('دورة التزييت', 'The lubrication system'), text: L('الزيت بيقلل الاحتكاك بين الأجزاء المتحركة، وبيبرّد، وبينضّف، وبيقفل بين الشنابر والسلندر. النقط البرتقالي بتوري مسار الزيت في المحرك.', 'Oil reduces friction between moving parts, cools, cleans and seals the rings in the bores. The orange dots trace its path through the engine.'), s: { m: 'run' } },
      { title: L('مسار الزيت', 'The oil path'), text: L('الطلمبة بتسحب الزيت من الكارتير من خلال مصفاة، وتدفعه للفلتر، ومنه للمجرى الرئيسي، اللي بيوزّعه على كراسي الكرنك والبيل، وبيطلع لفوق لعمود الكامة والتكايات، وبعدين بينزل تاني للكارتير بالجاذبية.', 'The pump draws oil from the sump through a strainer and sends it to the filter, then the main gallery feeding crank and rod bearings, up to the camshaft and tappets, before it drains back to the sump.'), focus: 'pump', s: { m: 'run' } },
      { title: L('ضغط الزيت ولمبة التحذير', 'Oil pressure and warning'), text: L('صمام أمان في الطلمبة بيحدد أقصى ضغط. حساس الضغط بيطفي اللمبة الحمرا طول ما الضغط كويس (حوالي 1 بار على البطيء، و3 لـ 4 على السريع). لو اللمبة نوّرت والعربية ماشية: اقف فورًا واطفي المحرك، لأن الكراسي هتسيح في ثواني.', 'A relief valve in the pump limits pressure. The switch keeps the red light off while pressure is good (about 1 bar at idle, 3–4 at speed). If it lights while driving, stop and switch off at once: the bearings can fail within seconds.'), focus: 'sw', s: { m: 'low' } },
      { title: L('الكشف على المستوى', 'Checking the level'), text: L('العربية على أرض مستوية والمحرك مطفي من 5 دقايق. اسحب السيخ وامسحه ودخّله للآخر واسحبه تاني: المستوى لازم يكون بين MIN وMAX. ولو الزيت لونه لبني يبقى فيه مية (جوان وش).', 'Car level, engine off for five minutes. Pull the dipstick, wipe it, push it fully home and pull it again: the level must be between MIN and MAX. Milky oil means coolant contamination (head gasket).'), focus: 'dip', s: { m: 'dip' } },
      { title: L('تغيير الزيت والفلتر', 'Changing oil and filter'), text: L('المحرك دافي. فك مسمار التصفية وصفّي الزيت، وغيّر جلدة المسمار. فك الفلتر القديم، وادهن جلدة الجديد بزيت واربطه بإيدك. حط الكمية والنوع حسب الكتالوج (مثلًا 4 لتر 5W-30)، وشغّل دقيقة واتأكد من مفيش تسريب، وراجع المستوى.', 'Engine warm. Remove the drain plug and drain the oil, fitting a new plug washer. Remove the old filter, oil the new seal and fit it hand-tight. Refill with the specified amount and grade (for example 4 L of 5W-30), run for a minute, check for leaks and recheck the level.'), focus: 'filt', s: { m: 'change' } }
    ],
    apply(s){ st.m = s.m; t = 0; },
    update(dt){ t += dt; const m = st.m; const running = m !== 'change' && m !== 'dip'; pg.rotation.z += running ? dt * 10 : 0;
      pr = ease(pr, m === 'low' ? (t % 6 < 3 ? 3.5 : .2) : running ? 3 : 0, dt, 3); pg2.set(pr); pg2.update(dt);
      flow.target = running && pr > .5 ? 1 : 0; flow.update(dt); setGlow(lampM, (m === 'low' && pr < .5) || (!running) ? 1 : 0, 1, .4, 0);
      dip.position.y = ease(dip.position.y, m === 'dip' ? 1.05 : .6, dt, 3); oilL.scale.y = m === 'change' ? Math.max(.05, 1 - (t % 8) / 4) : 1;
    }
  };
}

/* ================= برنامج السيارات: الدفعة التانية (الأنظمة) ================= */
function makeCarBattery(){
  const g = new THREE.Group(); g.add(at(box(.5, .34, .3, M(0x1d2128, { r: .6 })), 0, .17, 0)); g.add(at(box(.5, .03, .3, M(0x2b3038)), 0, .355, 0));
  const pos = cyl(.035, .04, .05, M(0xd9a441, { m: .7 }), 12); g.add(at(pos, -.17, .39, 0)); const neg = cyl(.035, .04, .05, M(0x9aa0a6, { m: .7 }), 12); g.add(at(neg, .17, .39, 0));
  g.add(at(label('+', '#ff7a6b', .1), -.17, .5, 0)); g.add(at(label('−', '#9cc2ff', .1), .17, .5, 0)); g.add(at(label('12V 60Ah', '#ffffff', .06), 0, .2, .16));
  return { group: g, P: V(-.17, .42, 0), N: V(.17, .42, 0) };
}
/* ---------- كهربا السيارة: البطارية والمارش والدينامو ---------- */
function buildCarElec(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const bat = makeCarBattery(); bat.group.position.set(-1.25, 0, -.35); root.add(bat.group);
  // الحدافة والمارش
  const fw = new THREE.Group(); fw.position.set(-.35, .45, -.55); root.add(fw); const ring = makeGear(40, .32, .05, 0x8a9099); fw.add(ring); fw.add(cyl(.27, .27, .06, M(0x6c747d, { m: .6 }), 32).rotateX(Math.PI / 2));
  const st = new THREE.Group(); st.position.set(-.35, .06, -.45); root.add(st); const stBody = cyl(.09, .09, .3, M(0x3a3f46, { m: .5 }), 20); stBody.rotation.z = Math.PI / 2; st.add(stBody);
  const sol = cyl(.05, .05, .2, M(0x9aa0a6, { m: .6 }), 16); sol.rotation.z = Math.PI / 2; st.add(at(sol, 0, .12, 0)); st.add(at(label(L('المارش', 'Starter'), '#ffffff', .06), 0, .25, .1));
  const pin = makeGear(10, .05, .05, 0xc9a24a); st.add(pin);
  // الدينامو
  const alt = new THREE.Group(); alt.position.set(.55, .55, -.45); root.add(alt); alt.add(cyl(.13, .13, .18, M(0xc9ced6, { m: .6 }), 24).rotateX(Math.PI / 2)); for(let i = 0; i < 8; i++) alt.add(at(box(.01, .2, .03, M(0x8a9099)), Math.cos(i * .78) * .13, Math.sin(i * .78) * .13, .1).rotateZ(i * .78));
  const altP = cyl(.05, .05, .04, M(0x1d2128), 16); altP.rotation.x = Math.PI / 2; alt.add(at(altP, 0, 0, .13)); alt.add(at(label(L('الدينامو', 'Alternator'), '#ffffff', .06), 0, .22, 0));
  const crP = new THREE.Group(); crP.position.set(.55, .1, -.32); root.add(crP); crP.add(cyl(.08, .08, .04, M(0x1d2128), 20).rotateX(Math.PI / 2));
  root.add(tube(new THREE.CatmullRomCurve3([V(.47, .55, -.32), V(.55, .62, -.32), V(.63, .55, -.32), V(.64, .1, -.32), V(.55, .02, -.32), V(.46, .1, -.32)], true), .01, M(0x1d2128), 60));
  // علبة الفيوزات والريلاي واللمبة
  const fb = new THREE.Group(); fb.position.set(-.4, .95, -1.48); root.add(fb); fb.add(box(.5, .3, .05, M(0x2b3038))); const fuses = [0xd23a2e, 0x2a62c9, 0xe8c21a, 0x2fbf5a].map((c, i) => { const f = box(.06, .1, .03, M(c, { opacity: .8 })); fb.add(at(f, -.15 + i * .1, .03, .03)); return f; }); const relay = box(.1, .1, .06, M(0x1d2128)); fb.add(at(relay, .0, -.09, .04)); fb.add(at(label(L('الفيوزات والريلاي', 'Fuses and relay'), '#ffffff', .05), 0, .2, .03));
  const lampG = new THREE.Group(); lampG.position.set(1.3, .45, -.2); root.add(lampG); lampG.add(cyl(.14, .1, .14, M(0xc9ced6, { m: .6 }), 24).rotateX(Math.PI / 2)); const lens = new THREE.Mesh(new THREE.CircleGeometry(.13, 24), M(0xfff6d8, { opacity: .7 })); lens.position.z = .071; lampG.add(lens); const beam = sparkSprite(0xfff2b0); beam.position.z = .15; lampG.add(beam); lampG.add(at(label(L('الكشاف', 'Headlamp'), '#ffffff', .06), 0, .2, 0));
  const dash = makeCanvas(.6, .3, 512); dash.mesh.position.set(.85, 1.05, -1.5); root.add(dash.mesh);
  const key = new THREE.Group(); key.position.set(1.15, .05, .35); root.add(key); key.add(cyl(.08, .08, .03, M(0x2b3038), 24)); const kk = box(.02, .02, .1, M(0xc9ced6, { m: .9 })); kk.position.y = .03; key.add(kk);
  const mtr = makeBigMeter(); at(mtr.group, -.4, 0, .45); mtr.group.rotation.y = .3; mtr.group.scale.setScalar(.75); root.add(mtr.group);
  const J = k => termOf(mtr.group, mtr.jacks[k]); const probes = makeProbes2(root, J('v'), J('com'));
  const wire = (pts, col) => { const c = CR(pts); root.add(tube(c, .012, M(col), 40)); return c; };
  const wB = wire([V(-1.42, .42, -.35), V(-1.1, .55, -.6), V(-.5, .2, -.5)], 0xd23a2e), wA = wire([V(.55, .55, -.6), V(-.3, .8, -.8), V(-1.42, .43, -.35)], 0xd23a2e);
  const fStart = new Flow(root, wB, { color: 0xffd34d, count: 12, speed: 1.4, size: .022 }), fCharge = new Flow(root, wA, { color: 0x7dffb0, count: 12, speed: 1, size: .02 });
  part('bat', bat.group, V(0, .55, 0), L('البطارية', 'Battery'), L('12 فولت، بتشغّل المارش والكهربا والمحرك واقف.', '12 V; powers the starter and electrics with the engine off.'));
  part('st', st, V(0, .3, 0), L('المارش (بادئ الحركة)', 'Starter motor'), L('موتور قوي بيلف الحدافة لحد المحرك ما يدور.', 'A powerful motor that turns the flywheel until the engine runs.'));
  part('alt', alt, V(0, .3, 0), L('الدينامو (مولد التيار)', 'Alternator'), L('بيشحن البطارية ويغذي الكهربا والمحرك شغال.', 'Charges the battery and powers the electrics while running.'));
  part('fb', fb, V(0, .26, .03), L('الفيوزات والريلاي', 'Fuses and relays'), L('بتحمي الدواير وبتشغّل الأحمال الكبيرة.', 'Protect circuits and switch heavy loads.'));
  part('key', key, V(0, .1, 0), L('سويتش المفتاح', 'Ignition switch'), L('دوس عليه تقلب الوضع.', 'Tap to change position.'));
  part('lamp', lampG, V(0, .3, 0), L('الكشاف', 'Headlamp'), L('حمل على دايرة فيها فيوز وريلاي.', 'A load on a fused, relay-switched circuit.'));
  const S = { k: 'off', mode: 'v', txt: '', a: null, b: null, lamp: 0, bad: 0 }; let t = 0, crank = 0, eng = 0, startT = 0;
  ctx.parts.key.tap = () => { const o = ['off', 'on', 'start', 'run']; S.k = o[(o.indexOf(S.k) + 1) % o.length]; if(S.k === 'start') startT = 0; return { off: L('مقفول', 'Off'), on: L('كونتاكت: لمبات التابلوه نوّرت', 'Ignition on: warning lamps lit'), start: L('مارش!', 'Cranking!'), run: L('المحرك دار والدينامو بيشحن', 'Running, alternator charging') }[S.k]; };
  ctx.parts.lamp.tap = () => { S.lamp ^= 1; return S.lamp ? L('الكشاف نوّر.', 'Headlamp on.') : L('الكشاف طفى.', 'Headlamp off.'); };
  const drawDash = (k, v) => dash.draw((x, W, H) => { x.fillStyle = '#0b0f14'; x.fillRect(0, 0, W, H); const bat2 = k === 'on' || k === 'start'; x.fillStyle = bat2 ? '#ff3b2f' : '#2a2f36'; x.fillRect(40, 60, 90, 60); x.fillStyle = '#0b0f14'; x.fillRect(55, 70, 60, 40); x.fillStyle = bat2 ? '#ff3b2f' : '#2a2f36'; x.fillRect(70, 50, 10, 12); x.fillRect(95, 50, 10, 12);
    x.fillStyle = '#7dffb0'; x.font = 'bold 54px monospace'; x.textAlign = 'center'; x.fillText(v, W * .62, H * .62); x.font = '20px Tahoma'; x.fillStyle = '#cfd6de'; x.fillText(L('جهد البطارية', 'Battery voltage'), W * .62, H * .88); });
  return {
    ...ctx, view: V(.05, .6, 1.45), sway: true, hint: L('دوس على سويتش المفتاح أو الكشاف', 'Tap the ignition switch or the headlamp'),
    steps: [
      { title: L('كهربا السيارة', 'Car electrics'), text: L('الكهربا في العربية 12 فولت مستمر. البطارية بتشغّل المارش والكهربا والمحرك واقف، والدينامو بيشحنها ويغذي كل حاجة والمحرك شغال. السالب متوصل بجسم العربية (الشاسيه)، فكل حمل محتاج سلك موجب بس.', 'Car electrics are 12 V DC. The battery powers the starter and electrics with the engine off; the alternator charges it and supplies everything while running. Negative is connected to the body (chassis), so each load needs only a positive wire.'), s: { k: 'off' } },
      { title: L('البطارية واختبارها', 'The battery and its test'), text: L('البطارية المشحونة على الراحة بتقرا 12.6 فولت. 12.2 يعني نص شحن، وأقل من 12 فاضية. وقت المارش الجهد ما ينزلش تحت 9.6 فولت. نضّف الأقطاب من الأكسدة، واربطها كويس، وافصل السالب الأول دايمًا.', 'A charged battery at rest reads 12.6 V; 12.2 is half charged and under 12 is flat. During cranking it should not fall below 9.6 V. Clean corroded terminals, tighten them, and always disconnect negative first.'), focus: 'bat', s: { k: 'off', mode: 'v', txt: '12.6 V', a: 'P', b: 'N' } },
      { title: L('المارش', 'The starter'), text: L('لما تلف المفتاح على START، ملف الأوتوماتيك (السلونويد) بيزق ترس المارش يعشّق في ترس الحدافة، وفي نفس الوقت يوصّل تيار كبير (100 لـ 200 أمبير) للموتور فيلف المحرك. أول ما المحرك يدور، الترس بيرجع لوحده. دوس على المفتاح لحد START.', 'Turning the key to START, the solenoid pushes the starter pinion into the flywheel ring gear and at the same time feeds a heavy current (100–200 A) to the motor, cranking the engine. Once it runs, the pinion withdraws. Tap the key to START.'), focus: 'st', s: { k: 'start' } },
      { title: L('الدينامو والشحن', 'The alternator and charging'), text: L('المحرك شغال، فالسير بيلف الدينامو، والدينامو بيطلّع كهربا متردد بتتحوّل لمستمر بدايودات جواه، والمنظم بيثبّت الجهد على 13.8 لـ 14.4 فولت. لمبة البطارية في التابلوه بتطفى. لو فضلت منوّرة أو الجهد أقل من 13، الدينامو مش بيشحن.', 'With the engine running, the belt drives the alternator; internal diodes rectify its AC and the regulator holds 13.8–14.4 V. The battery warning lamp goes out. If it stays on or the voltage is under 13 V, the alternator is not charging.'), focus: 'alt', s: { k: 'run', mode: 'v', txt: '14.2 V', a: 'P', b: 'N' } },
      { title: L('دواير الكهربا والفيوزات', 'Circuits and fuses'), text: L('كل دايرة: البطارية ← فيوز ← مفتاح أو ريلاي ← الحمل ← الشاسيه. الفيوز بيسيح لو حصل قصر عشان السلك ما يولّعش. الريلاي بيخلي مفتاح صغير يشغّل حمل كبير زي الكشافات. دوس على الكشاف.', 'Every circuit: battery → fuse → switch or relay → load → chassis. The fuse blows on a short so the wire cannot catch fire. A relay lets a small switch control a heavy load such as headlamps. Tap the headlamp.'), focus: 'fb', s: { k: 'run', lamp: 1 } },
      { title: L('أعطال وصيانة', 'Faults and maintenance'), text: L('المارش بيطقطق ومش بيلف: بطارية ضعيفة أو أقطاب مأكسدة. المارش بيلف تقيل: بطارية أو كابل. لمبة البطارية منوّرة: سير الدينامو أو منظمه أو الديودات. فيوز بيضرب على طول: قصر في الدايرة، دوّر عليه وما تكبّرش الفيوز أبدًا.', 'Starter clicks but will not turn: weak battery or corroded terminals. Turns slowly: battery or cable. Battery lamp on: alternator belt, regulator or diodes. A fuse that keeps blowing: a short in that circuit; find it, and never fit a bigger fuse.'), focus: 'st', s: { k: 'on', mode: 'v', txt: '11.8 V', a: 'P', b: 'N', bad: 1 } }
    ],
    apply(s){ Object.assign(S, { mode: 'v', txt: '', a: null, b: null, lamp: 0, bad: 0 }, s); startT = 0; mtr.setMode(S.a ? 'vdc' : 'off'); mtr.setText(S.txt); probes.set(S.a ? termOf(bat.group, bat[S.a]) : null, S.b ? termOf(bat.group, bat[S.b]) : null); },
    update(dt){ t += dt; if(S.k === 'start'){ startT += dt; if(startT > 2.5){ S.k = 'run'; } }
      const cranking = S.k === 'start', running = S.k === 'run';
      pin.position.x = ease(pin.position.x, cranking ? .02 : -.12, dt, 8); pin.position.y = .0; pin.position.z = .0; st.position.y = .06;
      const tgt = cranking ? 4 : running ? 14 : 0; crank = ease(crank, tgt, dt, 3); ring.rotation.z += crank * dt; pin.rotation.z -= cranking ? crank * dt * 6 : 0;
      altP.rotation.z += running ? dt * 30 : 0; crP.rotation.z += running ? dt * 15 : 0;
      fStart.target = cranking ? 1 : 0; fCharge.target = running ? 1 : 0; fStart.update(dt); fCharge.update(dt);
      const lampOn = S.lamp && S.k !== 'off'; lens.material.color.setHex(lampOn ? 0xffffff : 0xfff6d8); setGlow(lens.material, lampOn ? 1 : 0, 1, .95, .75); beam.material.opacity = lampOn ? .9 : 0; beam.scale.setScalar(.5); setGlow(relay.material, lampOn ? .4 : 0, .2, .6, 1);
      kk.rotation.y = ({ off: 0, on: .6, start: 1.1, run: .6 })[S.k];
      const v = S.bad ? '11.8 V' : cranking ? '10.4 V' : running ? '14.2 V' : '12.6 V'; const key2 = S.k + v; if(dash.mesh.userData.k !== key2){ dash.mesh.userData.k = key2; drawDash(S.k, v); }
      if(S.a){ mtr.setText(v); } mtr.update(dt); probes.update(dt);
    }
  };
}

/* ---------- القابض (الدبرياج) ---------- */
function buildClutch(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const C = new THREE.Group(); C.position.set(-.3, .6, -.3); root.add(C);
  const mkDisc = (r, th, col, o = {}) => cyl(r, r, th, M(col, o), 40).rotateZ(Math.PI / 2);
  const fw = new THREE.Group(); C.add(fw); fw.add(mkDisc(.38, .07, 0x6c747d, { m: .7 })); const fwr = makeGear(48, .4, .06, 0x8a9099); fwr.rotation.y = Math.PI / 2; fw.add(fwr); fw.add(at(box(.02, .1, .04, M(0xd23a2e)), .036, .3, 0));
  const disc = new THREE.Group(); C.add(disc); disc.add(mkDisc(.3, .03, 0x8a6a48, { r: .9 })); disc.add(mkDisc(.12, .045, 0x9aa0a6, { m: .7 })); for(let i = 0; i < 6; i++){ const s = cyl(.02, .02, .04, M(0xc9ced6, { m: .8 }), 8); s.rotation.z = Math.PI / 2; s.position.set(0, Math.cos(i) * .09, Math.sin(i) * .09); disc.add(s); } disc.add(at(box(.035, .08, .03, M(0x2fbf5a)), .02, .22, 0));
  const pp = new THREE.Group(); C.add(pp); const cover = new THREE.Mesh(new THREE.CylinderGeometry(.37, .37, .12, 40, 1, true), M(0xb9c0c8, { m: .6, opacity: .35, side: THREE.DoubleSide })); cover.rotation.z = Math.PI / 2; pp.add(cover);
  const plate = new THREE.Group(); pp.add(plate); plate.add(mkDisc(.3, .03, 0xc9ced6, { m: .8 }));
  const fingers = []; for(let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2; const f = box(.012, .16, .05, M(0x3a3f46, { m: .7 })); const pv = new THREE.Group(); pv.rotation.x = a; pv.add(at(f, .06, .12, 0)); pp.add(pv); fingers.push(f); }
  const bear = new THREE.Group(); C.add(bear); bear.add(new THREE.Mesh(new THREE.TorusGeometry(.06, .02, 10, 20), M(0x2a62c9, { m: .6 })).rotateY(Math.PI / 2));
  const shaft = cyl(.025, .025, 1.2, M(0xc9ced6, { m: .9 }), 12); shaft.rotation.z = Math.PI / 2; shaft.position.x = .4; C.add(shaft);
  const fork = new THREE.Group(); C.add(fork); fork.add(at(box(.03, .45, .05, M(0x6c747d, { m: .6 })), 0, -.2, 0));
  const pedal = new THREE.Group(); pedal.position.set(1.2, .0, .2); root.add(pedal); pedal.add(at(box(.04, .45, .04, M(0x2b3038)), 0, .22, 0)); pedal.add(at(box(.16, .03, .1, M(0x1d2128)), 0, .45, .02));
  const align = new THREE.Group(); align.position.set(.9, .15, .45); root.add(align); align.add(cyl(.02, .02, .35, M(0xe8c21a), 10).rotateZ(Math.PI / 2));
  const rd = readout(.9, .14); rd.mesh.position.set(.4, 1.25, -1.5); root.add(rd.mesh);
  part('fw', fw, V(0, .45, 0), L('الحدافة', 'Flywheel'), L('متربطة بالكرنك وبتلف معاه.', 'Bolted to the crank, turns with it.'));
  part('disc', disc, V(0, .36, 0), L('الديسك (اسطوانة القابض)', 'Clutch disc'), L('عليه بطانة احتكاك، ومتعشّق على عمود الفتيس.', 'Faced with friction lining, splined to the gearbox shaft.'));
  part('pp', pp, V(0, .42, 0), L('الأسطوانة الضاغطة (الطقم)', 'Pressure plate'), L('ياي طبق بيضغط الديسك على الحدافة.', 'A diaphragm spring clamps the disc to the flywheel.'));
  part('bear', bear, V(0, .12, 0), L('رولمان الدبرياج', 'Release bearing'), L('بيزق صوابع الياي.', 'Pushes the spring fingers.'));
  part('pedal', pedal, V(0, .55, 0), L('دواسة الدبرياج', 'Clutch pedal'), L('دوس عليها.', 'Tap it.'));
  part('align', align, V(0, .1, 0), L('عمود التسنتر', 'Alignment tool'), L('بيسنتر الديسك وقت التركيب.', 'Centres the disc during fitting.'));
  const st = { press: 0, ex: 0, slip: 0, insp: '' }; let t = 0, wf = 0, wd = 0;
  ctx.parts.pedal.tap = () => { st.press ^= 1; return st.press ? L('الدواسة مضغوطة: الديسك فك والحدافة لوحدها بتلف.', 'Pedal down: disc released, only the flywheel turns.') : L('سبنا الدواسة: الديسك اتقفل وبيلف مع الحدافة.', 'Pedal up: disc clamped, turning with the flywheel.'); };
  return {
    ...ctx, view: V(.45, .3, 1.35), sway: true, hint: L('دوس على دواسة الدبرياج', 'Tap the clutch pedal'),
    steps: [
      { title: L('القابض الاحتكاكي', 'The friction clutch'), text: L('القابض بيوصّل ويفصل حركة المحرك عن الفتيس، عشان تقدر تقف وتغيّر السرعات. مكوّن من الحدافة، والديسك، والأسطوانة الضاغطة بياي طبق، والرولمان، والشوكة. العلامة الحمرا على الحدافة والخضرا على الديسك بتوريك مين بيلف.', 'The clutch connects and disconnects the engine from the gearbox so you can stop and change gear. It has the flywheel, disc, pressure plate with diaphragm spring, release bearing and fork. The red mark on the flywheel and green mark on the disc show what is turning.'), s: { ex: 1 } },
      { title: L('الدبرياج متعشّق', 'Clutch engaged'), text: L('الدواسة مش مضغوطة: الياي الطبق بيضغط الأسطوانة على الديسك، والديسك على الحدافة، فالتلاتة بيلفوا مع بعض والحركة بتعدّي لعمود الفتيس.', 'Pedal up: the diaphragm spring clamps the plate on the disc and the disc on the flywheel, so all three turn together and drive reaches the gearbox shaft.'), focus: 'disc', s: { press: 0 } },
      { title: L('الدبرياج مفصول', 'Clutch disengaged'), text: L('لما تدوس الدواسة، الشوكة بتزق الرولمان على صوابع الياي، فالياي بيشد الأسطوانة لورا والديسك بيتحرر: الحدافة بتلف، والديسك واقف. دوس على الدواسة وشوف العلامتين.', 'Pressing the pedal, the fork pushes the bearing onto the spring fingers, which pull the plate back and free the disc: the flywheel turns while the disc stops. Tap the pedal and watch the two marks.'), focus: 'pedal', s: { press: 1 } },
      { title: L('فحص أجزاء القابض', 'Inspecting the clutch'), text: L('الديسك: قيس سُمك البطانة فوق مسامير البرشام (لو أقل من 0.3 مم يتغيّر)، واتأكد من مفيش زيت عليه أو يايات مكسورة. الأسطوانة: سطحها مستوي من غير شروخ زرقا، والصوابع مستوية. الحدافة: من غير خدوش عميقة. الرولمان: يلف ناعم من غير صوت.', 'Disc: measure the lining depth above the rivets (replace under 0.3 mm), and check for oil and broken springs. Pressure plate: flat face without blue heat cracks, fingers level. Flywheel: no deep scoring. Bearing: turns smoothly and quietly.'), focus: 'pp', s: { ex: 1 } },
      { title: L('تغيير الجزء التالف', 'Replacing worn parts'), text: L('افصل الفتيس، وفك مسامير الأسطوانة بالتبادل شوية شوية. ركّب الديسك الجديد بالوش الصح (مكتوب Flywheel side)، وسنتره بعمود التسنتر قبل ما تربط الأسطوانة بالعزم بالتبادل. غالبًا بنغيّر الديسك والأسطوانة والرولمان مع بعض (طقم).', 'Remove the gearbox and undo the cover bolts evenly a little at a time. Fit the new disc the right way round (marked flywheel side) and centre it with the alignment tool before torquing the cover bolts in sequence. Disc, cover and bearing are usually changed together as a kit.'), focus: 'align', s: { ex: 1 } },
      { title: L('أعطال القابض', 'Clutch faults'), text: L('يفلّت (الموتور يعلى والعربية ما تزيدش): ديسك دايب أو عليه زيت. يرعش وقت القيام: حدافة أو ديسك مش مستوي. يعشّق صعب أو يزيّق الفتيس: ضبط السلك أو هوا في الهيدروليك. صوت وانت دايس: الرولمان.', 'Slipping (revs rise but the car does not): worn or oily disc. Judder on take-off: uneven flywheel or disc. Hard to engage or grinding gears: adjustment or air in the hydraulics. Noise with the pedal down: the release bearing.'), focus: 'disc', s: { press: 0, slip: 1 } }
    ],
    apply(s){ Object.assign(st, { press: 0, ex: 0, slip: 0 }, s); },
    update(dt){ t += dt; const ex = st.ex ? 1 : 0;
      fw.position.x = ease(fw.position.x, -ex * .45, dt, 3); disc.position.x = ease(disc.position.x, .06 + (st.press ? .02 : 0), dt, 6); pp.position.x = ease(pp.position.x, .12 + ex * .35, dt, 3); bear.position.x = ease(bear.position.x, .3 + ex * .55 - (st.press ? .06 : 0), dt, 6);
      plate.position.x = ease(plate.position.x, st.press ? .06 : 0, dt, 6); fingers.forEach(f => f.rotation.z = ease(f.rotation.z, st.press ? -.25 : 0, dt, 6)); fork.position.x = bear.position.x + .05; fork.rotation.z = ease(fork.rotation.z, st.press ? .25 : 0, dt, 6);
      pedal.rotation.x = ease(pedal.rotation.x, st.press ? .5 : 0, dt, 6);
      wf = ex ? 0 : 6; wd = ex ? 0 : st.press ? Math.max(0, wd - dt * 4) : st.slip ? 4 : 6; fw.rotation.x += wf * dt; disc.rotation.x += wd * dt; pp.rotation.x += (st.press ? 6 : wd) * dt * (ex ? 0 : 1); shaft.rotation.x += wd * dt;
      align.visible = st.ex === 1; rd.setText(ex ? '' : st.press ? L('الحدافة 900 لفة · الديسك 0', 'Flywheel 900 rpm · disc 0') : st.slip ? L('الحدافة 900 · الديسك 600 (يفلّت)', 'Flywheel 900 · disc 600 (slipping)') : L('الحدافة 900 · الديسك 900', 'Flywheel 900 · disc 900'));
    }
  };
}

/* ---------- الوقود والحقن الإلكتروني ---------- */
function buildFuel(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const tank = new THREE.Group(); tank.position.set(-1.25, 0, -.2); root.add(tank); tank.add(at(box(.6, .35, .5, M(0x3a3f46, { m: .4, opacity: .35 })), 0, .18, 0)); const fuelL = box(.56, .2, .46, M(0xe8c21a, { opacity: .5 })); tank.add(at(fuelL, 0, .12, 0));
  const pump = new THREE.Group(); pump.position.set(-1.25, .14, -.2); root.add(pump); pump.add(cyl(.05, .05, .2, M(0x2a62c9, { m: .5 }), 16)); pump.add(at(label(L('طلمبة كهربا', 'Electric pump'), '#ffffff', .05), 0, .3, .2));
  const filt = new THREE.Group(); filt.position.set(-.65, .2, .25); root.add(filt); filt.add(cyl(.05, .05, .2, M(0xc9ced6, { m: .6 }), 16).rotateZ(Math.PI / 2)); filt.add(at(label('→', '#ffd34d', .08), 0, .1, 0));
  const eng = new THREE.Group(); eng.position.set(.35, .3, -.4); root.add(eng); eng.add(at(box(1.0, .45, .4, M(0x6b7686, { m: .4 })), 0, 0, 0));
  const rail = cyl(.025, .025, .85, M(0xc9ced6, { m: .8 }), 12); rail.rotation.z = Math.PI / 2; rail.position.set(.35, .62, -.25); root.add(rail);
  const injs = []; for(let i = 0; i < 4; i++){ const x = .35 - .33 + i * .22; const g = new THREE.Group(); g.position.set(x, .54, -.25); root.add(g); g.add(cyl(.02, .015, .12, M(0x1d2128), 10)); const cone = new THREE.Mesh(new THREE.ConeGeometry(.05, .14, 12, 1, true), M(0xffe27a, { opacity: 0 })); cone.position.y = -.12; g.add(cone); injs.push(cone); }
  const reg = new THREE.Group(); reg.position.set(.85, .62, -.25); root.add(reg); reg.add(cyl(.04, .04, .06, M(0xc9a24a, { m: .6 }), 14).rotateZ(Math.PI / 2));
  const ab = new THREE.Group(); ab.position.set(.35, .95, .2); root.add(ab); ab.add(box(.5, .14, .3, M(0x1d2128, { opacity: .7 }))); const element = box(.44, .04, .26, M(0xf2ead7, { r: .9 })); ab.add(element); ab.add(at(label(L('فلتر الهوا', 'Air filter'), '#ffffff', .05), 0, .13, 0));
  const thr = new THREE.Group(); thr.position.set(.35, .82, -.05); root.add(thr); thr.add(cyl(.06, .06, .1, M(0x9aa0a6, { m: .6 }), 16).rotateX(Math.PI / 2)); const flap = box(.1, .005, .1, M(0x3a3f46)); thr.add(flap);
  const ecu = new THREE.Group(); ecu.position.set(1.25, .1, .3); root.add(ecu); ecu.add(box(.3, .08, .22, M(0x9aa0a6, { m: .5 }))); ecu.add(at(label('ECU', '#1b1f26', .06), 0, .08, 0));
  const pg = makeGauge('#e0a400', 0, 6, [0, 2, 4, 6], 'bar'); pg.group.scale.setScalar(.35); pg.group.position.set(-.15, .8, -.25); root.add(pg.group);
  const pw = readout(.8, .13, '#ffd34d'); pw.mesh.position.set(.4, 1.25, -1.5); root.add(pw.mesh);
  const fl = CR([V(-1.25, .25, -.2), V(-1.0, .3, .1), V(-.65, .2, .25), V(-.35, .4, .1), V(-.1, .62, -.25), V(.75, .62, -.25)]); root.add(tube(fl, .012, M(0x2b3038), 60));
  const ret = CR([V(.88, .62, -.25), V(.9, .3, .1), V(-.2, .05, .4), V(-1.1, .3, .05)]); root.add(tube(ret, .01, M(0x2b3038), 60));
  const fF = new Flow(root, fl, { color: 0xffd34d, count: 18, speed: 1, size: .02 }), fR = new Flow(root, ret, { color: 0xc9a24a, count: 10, speed: .8, size: .018 }), fA = new Flow(root, CR([V(.35, 1.0, .35), V(.35, .9, .1), V(.35, .82, -.05), V(.35, .65, -.3)]), { color: 0x9fd3ff, count: 12, speed: .9, size: .022 });
  part('tank', tank, V(0, .45, 0), L('التانك', 'Fuel tank'), ''); part('pump', pump, V(0, .2, 0), L('طلمبة البنزين الكهربا', 'Electric fuel pump'), L('جوه التانك، بتدّي حوالي 3 بار.', 'In the tank; delivers about 3 bar.'));
  part('filt', filt, V(0, .1, 0), L('فلتر البنزين', 'Fuel filter'), L('السهم يبيّن اتجاه السريان.', 'The arrow shows flow direction.')); part('rail', rail, V(.42, .05, 0), L('مجرى البنزين (الريل)', 'Fuel rail'), L('بيوزّع البنزين على الرشاشات.', 'Feeds the injectors.'));
  part('inj', injs[0].parent, V(0, .12, 0), L('الرشاشات (البخاخات)', 'Injectors'), L('صمامات كهربا بتفتح بأوامر الكمبيوتر.', 'Electric valves opened by the ECU.')); part('ab', ab, V(0, .16, 0), L('فلتر الهوا', 'Air filter'), L('دوس عليه تغيّره.', 'Tap to change it.'));
  part('thr', thr, V(0, .1, 0), L('الثروتل (بوابة الهوا)', 'Throttle body'), L('دوس عليه تفتح الدواسة.', 'Tap to open the throttle.')); part('ecu', ecu, V(0, .12, 0), L('الكمبيوتر ECU', 'ECU'), L('بيحسب زمن فتح الرشاش.', 'Calculates injector opening time.'));
  const st = { key: 1, run: 1, thr: .15, dirty: 0, depress: 0 }; let t = 0, pr = 0;
  ctx.parts.thr.tap = () => { st.thr = st.thr < .5 ? .9 : .15; return st.thr > .5 ? L('دواسة البنزين مفتوحة: هوا أكتر، والرشاش بيفتح وقت أطول.', 'Throttle open: more air, longer injector pulses.') : L('دوران بطيء.', 'Idle.'); };
  ctx.parts.ab.tap = () => { st.dirty ^= 1; return st.dirty ? L('فلتر مسدود: الهوا قليل والعربية تقيلة.', 'Clogged filter: little air, sluggish car.') : L('ركّبنا فلتر هوا جديد.', 'New air filter fitted.'); };
  return {
    ...ctx, view: V(.05, .55, 1.45), sway: true, hint: L('دوس على الثروتل أو فلتر الهوا', 'Tap the throttle or the air filter'),
    steps: [
      { title: L('دورة الوقود', 'The fuel system'), text: L('الطلمبة الكهربا جوه التانك بتدفع البنزين (الأصفر) للفلتر، ومنه للريل اللي فوق المحرك، والريل بيوزّعه على الرشاشات. منظم الضغط بيرجّع الزيادة للتانك. والهوا (الأزرق) بيدخل من فلتر الهوا للثروتل لمجمع السحب.', 'The in-tank electric pump pushes fuel (yellow) through the filter to the rail on the engine, which feeds the injectors. The pressure regulator returns the excess to the tank. Air (blue) enters through the air filter and throttle into the intake manifold.'), s: { thr: .15 } },
      { title: L('طلمبة البنزين وفحصها', 'Testing the fuel pump'), text: L('أول ما تفتح الكونتاكت الطلمبة بتشتغل ثانيتين تملى الخط (بتسمع صوتها). ركّب ساعة ضغط على الريل: لازم حوالي 3 بار. لو الضغط قليل: فلتر مسدود أو طلمبة ضعيفة أو منظم. لو مش بتشتغل: افحص الفيوز والريلاي والكهربا الواصلة ليها.', 'At key-on the pump runs for two seconds to prime (you hear it). A gauge on the rail should read about 3 bar. Low pressure: blocked filter, weak pump or regulator. Not running: check its fuse, relay and supply.'), focus: 'pump', s: { thr: .15 } },
      { title: L('فك الوصلات وتغيير الفلاتر', 'Lines and filters'), text: L('قبل ما تفك أي وصلة بنزين: فرّغ الضغط (شيل فيوز الطلمبة ودوّر المحرك لحد ما يقف)، وحط قماشة، وما فيش نار ولا سجاير. فلتر البنزين بيتركب في اتجاه السهم. وفلتر الهوا المسدود بيقلل القدرة ويزوّد الصرف. دوس على فلتر الهوا.', 'Before opening any fuel line, depressurise (pull the pump fuse and run the engine until it stalls), use a rag, and no flames or smoking. Fit the fuel filter with its arrow in the flow direction. A clogged air filter cuts power and raises consumption. Tap the air filter.'), focus: 'ab', s: { thr: .15, dirty: 1 } },
      { title: L('مبادئ الحقن ونظام السحب', 'Injection and intake principles'), text: L('المحرك محتاج خليط بنسبة حوالي 14.7 جزء هوا لكل جزء بنزين بالوزن. زمان الكاربراتير كان بيخلط بالشفط، دلوقتي الرشاشات بتحقن البنزين بدقة قدام صمام السحب لكل سلندر. الثروتل بيتحكم في كمية الهوا، والكمبيوتر بيحسب البنزين المناسب ليها.', 'The engine needs about 14.7 parts air to one part fuel by mass. Carburettors once mixed it by suction; now injectors spray precise doses in front of each intake valve. The throttle controls the air, and the ECU calculates the matching fuel.'), focus: 'thr', s: { thr: .15 } },
      { title: L('الحقن الإلكتروني', 'Electronic fuel injection'), text: L('الكمبيوتر بيقرا الحساسات (كمية الهوا، وحرارة المحرك، والسرعة، والأكسجين) ويفتح كل رشاش بنبضة كهربا. كل ما النبضة أطول، البنزين أكتر. على البطيء حوالي 2.5 مللي ثانية، وعلى الدواسة 8 أو أكتر. دوس على الثروتل وشوف زمن النبضة.', 'The ECU reads its sensors (airflow, engine temperature, speed, oxygen) and opens each injector with an electric pulse; a longer pulse gives more fuel. About 2.5 ms at idle and 8 ms or more under load. Tap the throttle and watch the pulse width.'), focus: 'ecu', s: { thr: .9 } }
    ],
    apply(s){ Object.assign(st, { dirty: 0 }, s); },
    update(dt){ t += dt; pr = ease(pr, 3, dt, 2); pg.set(pr); pg.update(dt); fF.target = 1; fR.target = 1; fA.target = st.dirty ? .3 : 1; fA.speed = .5 + st.thr; [fF, fR, fA].forEach(f => f.update(dt));
      flap.rotation.x = ease(flap.rotation.x, st.thr * 1.4, dt, 5); element.material.color.setHex(st.dirty ? 0x5a4a3a : 0xf2ead7);
      const rpm = st.thr > .5 ? 3 : 1; const pwMs = st.thr > .5 ? 8.2 : 2.5; injs.forEach((c, i) => { const ph = (t * rpm * 2 + [0, .5, .75, .25][i]) % 1; c.material.opacity = ph < (pwMs / 20) ? .7 : 0; });
      pw.setText(L(`زمن النبضة ${pwMs} مللي ث · ${st.thr > .5 ? 3000 : 800} لفة`, `Pulse ${pwMs} ms · ${st.thr > .5 ? 3000 : 800} rpm`));
    }
  };
}

/* ---------- منظومة الإشعال ---------- */
function buildIgnition(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const bat = makeCarBattery(); bat.group.scale.setScalar(.8); bat.group.position.set(-1.3, 0, -.4); root.add(bat.group);
  const eng = new THREE.Group(); eng.position.set(.1, .3, -.45); root.add(eng); eng.add(box(1.1, .5, .4, M(0x6b7686, { m: .4 }))); eng.add(at(box(1.1, .15, .4, M(0x9aa0a6, { m: .5 })), 0, .32, 0));
  const coils = [], coilG = [], sparks = [];
  for(let i = 0; i < 4; i++){ const x = -.39 + i * .26; const c = new THREE.Group(); c.position.set(x, .72, -.45); root.add(c); c.add(box(.1, .18, .1, M(0x1d2128))); c.add(at(label(String(i + 1), '#ffd34d', .07), 0, .16, .06)); const cm = c.children[0].material; coils.push(cm); coilG.push(c); const sp = sparkSprite(); sp.position.set(x, .55, -.25); root.add(sp); sparks.push(sp); }
  const ecu = new THREE.Group(); ecu.position.set(-.7, .9, -1.45); root.add(ecu); ecu.add(box(.3, .2, .05, M(0x9aa0a6, { m: .5 }))); ecu.add(at(label('ECU', '#1b1f26', .06), 0, 0, .03));
  const ckp = new THREE.Group(); ckp.position.set(.75, .1, -.2); root.add(ckp); const tw = makeGear(30, .12, .02, 0x6c747d); tw.rotation.y = Math.PI / 2; ckp.add(tw); ckp.add(at(cyl(.015, .015, .08, M(0x1d2128), 8), 0, .16, 0)); ckp.add(at(label('CKP', '#ffd34d', .05), 0, .25, 0));
  const plug = new THREE.Group(); plug.position.set(.9, .05, .45); plug.rotation.z = Math.PI / 2; root.add(plug); plug.scale.setScalar(2.2);
  plug.add(cyl(.02, .02, .14, M(0xf4f5f7, { r: .3 }), 14)); plug.add(at(cyl(.024, .024, .05, M(0x9aa0a6, { m: .8 }), 6), 0, -.09, 0)); plug.add(at(cyl(.012, .012, .05, M(0x9aa0a6, { m: .8 }), 10), 0, -.14, 0)); const tip = cyl(.003, .003, .015, M(0xc9ced6, { m: .9 }), 6); plug.add(at(tip, 0, -.17, 0)); const ground = box(.006, .006, .02, M(0x9aa0a6, { m: .9 })); plug.add(at(ground, 0, -.183, 0));
  const tipM = M(0xb08a5a); plug.add(at(new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), tipM), 0, -.165, 0));
  const fe = new THREE.Group(); fe.position.set(1.25, .1, .45); root.add(fe); fe.add(box(.12, .004, .025, M(0xc9ced6, { m: .9 })));
  const rd = readout(.9, .14, '#ffd34d'); rd.mesh.position.set(.3, 1.25, -1.5); root.add(rd.mesh);
  const dia = makeCanvas(.6, .4, 512); dia.mesh.position.set(1.05, .9, -1.5); root.add(dia.mesh);
  dia.draw((x, W, H) => { x.fillStyle = '#fbfaf5'; x.fillRect(0, 0, W, H); x.strokeStyle = '#111'; x.lineWidth = 4; x.fillStyle = '#111'; x.font = 'bold 22px monospace'; x.textAlign = 'center'; x.fillText(L('البوبينة', 'Ignition coil'), W / 2, 30);
    for(let i = 0; i < 6; i++){ x.beginPath(); x.arc(W * .3, 70 + i * 28, 14, -Math.PI / 2, Math.PI / 2); x.stroke(); } for(let i = 0; i < 14; i++){ x.beginPath(); x.arc(W * .6, 64 + i * 13, 7, Math.PI / 2, Math.PI * 1.5); x.stroke(); } x.fillRect(W * .44, 60, 8, 180);
    x.fillText('12V', W * .2, 280); x.fillText('30 kV', W * .72, 280); x.font = '18px Tahoma'; x.fillText(L('ابتدائي: لفات قليلة', 'Primary: few turns'), W * .28, 310); x.fillText(L('ثانوي: آلاف اللفات', 'Secondary: thousands'), W * .72, 310); });
  part('bat', bat.group, V(0, .5, 0), L('البطارية', 'Battery'), ''); part('ecu', ecu, V(0, .15, .03), 'ECU', L('بيحدد لحظة الشرارة.', 'Decides the spark timing.'));
  part('coil', coilG[0], V(0, .2, 0), L('البوبينة (ملف الإشعال)', 'Ignition coil'), L('بتحوّل 12 فولت لأكتر من 30 ألف فولت.', 'Turns 12 V into over 30,000 V.'));
  part('ckp', ckp, V(0, .32, 0), L('حساس الكرنك CKP', 'Crank sensor CKP'), L('بيقول للكمبيوتر مكان الكرنك وسرعته.', 'Tells the ECU crank position and speed.'));
  part('plug', plug, V(0, .1, 0), L('البوجيه', 'Spark plug'), L('دوس عليه تشوف حالته.', 'Tap to see its condition.'));
  part('dia', dia.mesh, V(0, .24, 0), L('رسم البوبينة', 'Coil diagram'), '');
  const st = { m: 'run', look: 0 }; let t = 0;
  const LOOK = [[0xb08a5a, L('لون بني فاتح: البوجيه سليم والخليط مظبوط.', 'Light tan: healthy plug, correct mixture.')], [0x1d2128, L('أسود ناشف: خليط غني أو فلتر هوا مسدود.', 'Dry black soot: rich mixture or blocked air filter.')], [0xf4f5f7, L('أبيض: سخونية أو خليط فقير. خلي بالك.', 'White: overheating or lean mixture.')], [0x3a2a10, L('أسود مزيّت: زيت داخل السلندر (شنابر أو جلب).', 'Wet oily black: oil in the cylinder (rings or seals).')]];
  ctx.parts.plug.tap = () => { st.look = (st.look + 1) % LOOK.length; return LOOK[st.look][1]; };
  return {
    ...ctx, view: V(.05, .6, 1.45), sway: true, hint: L('دوس على البوجيه تشوف حالاته', 'Tap the spark plug to see its conditions'),
    steps: [
      { title: L('منظومة الإشعال', 'The ignition system'), text: L('مهمتها تعمل شرارة قوية في كل سلندر في اللحظة الصح: البطارية بتغذي، والكمبيوتر بيعرف مكان الكرنك من حساس CKP، فيقطع تيار البوبينة، والبوبينة تطلّع جهد عالي جدًا للبوجيه. في العربيات الحديثة كل بوجيه عليه بوبينة لوحده.', 'Its job is a strong spark in each cylinder at the right moment: the battery supplies power, the ECU knows crank position from the CKP sensor and switches off the coil current, and the coil sends a very high voltage to the plug. Modern cars have a coil on each plug.'), s: { m: 'run' } },
      { title: L('البوبينة', 'The ignition coil'), text: L('محوّل فيه ملف ابتدائي بلفات قليلة وثانوي بآلاف اللفات. لما التيار في الابتدائي يتقطع فجأة، المجال المغناطيسي بينهار، فيتولد في الثانوي 30 ألف فولت أو أكتر يقفز في فتحة البوجيه شرارة. ابتدائي حوالي 0.5 أوم، وثانوي 6 لـ 10 كيلو أوم.', 'A transformer with a primary of few turns and a secondary of thousands. When the primary current is cut suddenly, the collapsing field induces 30,000 V or more in the secondary, which jumps the plug gap as a spark. Primary about 0.5 Ω, secondary 6–10 kΩ.'), focus: 'dia', s: { m: 'run' } },
      { title: L('ترتيب الإشعال', 'Firing order'), text: L('في محرك 4 سلندر الترتيب 1-3-4-2. حساس الكرنك بيقرا سنون العجلة، والكمبيوتر بيقدّم أو يأخّر الشرارة حسب السرعة والحمل والطرق. شوف الشرارات بتنط بالترتيب.', 'A four-cylinder engine fires 1-3-4-2. The crank sensor reads the toothed wheel and the ECU advances or retards the spark for speed, load and knock. Watch the sparks jump in order.'), focus: 'ckp', s: { m: 'run' } },
      { title: L('فحص البوجيه وضبط الفتحة', 'Checking plugs and gap'), text: L('لون البوجيه بيحكي عن المحرك. دوس عليه تشوف الحالات. وقيس الفتحة بين القطبين بالفيلر (غالبًا 0.8 لـ 1.1 مم حسب الكتالوج)، واربطه بالعزم الصح وعلى بارد.', 'The plug colour tells you about the engine; tap it to see the cases. Measure the electrode gap with a feeler (usually 0.8–1.1 mm per the manual) and tighten to torque with the engine cold.'), focus: 'plug', s: { m: 'gap' } },
      { title: L('تغيير الأجزاء التالفة', 'Replacing faulty parts'), text: L('رعشة في المحرك ولمبة Check: شوف كود العطل بالجهاز (مثلًا P0302 = عطل إشعال سلندر 2). بدّل البوبينة مع سلندر تاني، لو العطل نقل يبقى البوبينة. افحص البوجيه والأسلاك (لو موجودة). وحساس الكرنك لو باظ المحرك مش هيدور خالص.', 'A misfire with the check lamp: read the code (P0302 = misfire on cylinder 2). Swap that coil with another cylinder; if the fault follows, it is the coil. Check plugs and leads (if fitted). A failed crank sensor stops the engine starting at all.'), focus: 'coil', s: { m: 'run' } }
    ],
    apply(s){ Object.assign(st, s); },
    update(dt){ t += dt; tw.rotation.x += dt * 8; const ORDER = [0, 2, 3, 1]; const k = Math.floor(t * 3) % 4, ph = (t * 3) % 1;
      sparks.forEach((s, i) => { const on = st.m === 'run' && ORDER[k] === i && ph < .3; s.material.opacity = on ? 1 : 0; s.scale.setScalar(.2); setGlow(coils[i], on ? .5 : 0, .3, .5, 1); });
      tipM.color.setHex(LOOK[st.look][0]); fe.visible = st.m === 'gap'; fe.position.set(.9 + .03, .05 + -.4 * 0, .45); fe.position.x = 1.25;
      rd.setText(st.m === 'gap' ? L('فتحة البوجيه: 0.9 مم', 'Plug gap: 0.9 mm') : L(`بيشرر سلندر ${ORDER[k] + 1} (ترتيب 1-3-4-2)`, `Firing cylinder ${ORDER[k] + 1} (order 1-3-4-2)`));
    }
  };
}

/* ---------- الحساسات وجهاز الفحص ---------- */
function buildSensors(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const eng = new THREE.Group(); eng.position.set(-.35, .3, -.45); root.add(eng); eng.add(box(1.2, .5, .45, M(0x6b7686, { m: .4 }))); eng.add(at(box(1.2, .15, .45, M(0x9aa0a6, { m: .5 })), 0, .32, 0));
  root.add(at(tube(CR([V(-1.0, .75, -.2), V(-.6, .9, .1), V(.4, .9, .1), V(.5, .7, -.2)]), .05, M(0x8a9099, { m: .6 }), 40), 0, 0, 0));
  root.add(tube(CR([V(.25, .2, -.2), V(.6, .15, .1), V(1.1, .1, .25)]), .045, M(0x5d646e, { m: .6 }), 30));
  const S = {}; const mkS = (k, pos, col, name) => { const g = new THREE.Group(); g.position.copy(pos); root.add(g); const b = cyl(.035, .035, .1, M(col, { m: .4 }), 12); g.add(b); g.add(at(label(k, '#ffd34d', .055), 0, .12, 0)); const led = M(0x333a44); g.add(at(new THREE.Mesh(new THREE.SphereGeometry(.015, 8, 6), led), .04, .05, 0)); S[k] = { g, led, name }; return g; };
  mkS('MAF', V(-.85, .9, -.1), 0x2b3038, L('حساس كمية الهوا', 'Mass air flow')); mkS('IAT', V(-.65, .98, .05), 0x2b3038, L('حرارة الهوا', 'Intake air temp')); mkS('TPS', V(-.3, .98, .1), 0x2b3038, L('وضع الثروتل', 'Throttle position'));
  mkS('MAP', V(.15, .98, .1), 0x2b3038, L('ضغط المجمع', 'Manifold pressure')); mkS('ECT', V(-.65, .72, -.2), 0x2fa37a, L('حرارة المحرك', 'Coolant temp')); mkS('CKP', V(.0, .05, -.2), 0x1d2128, L('الكرنك', 'Crankshaft position'));
  mkS('CMP', V(.15, .72, -.45), 0x1d2128, L('الكامة', 'Camshaft position')); mkS('O2', V(.65, .2, .12), 0x9aa0a6, L('حساس الأكسجين', 'Oxygen (lambda)')); mkS('KS', V(-.25, .2, -.2), 0x1d2128, L('الطرق', 'Knock'));
  const ecu = new THREE.Group(); ecu.position.set(-1.25, .1, .3); root.add(ecu); ecu.add(box(.35, .1, .25, M(0x9aa0a6, { m: .5 }))); ecu.add(at(label('ECU', '#1b1f26', .07), 0, .1, 0));
  const tab = new THREE.Group(); tab.position.set(1.05, .02, .35); tab.rotation.x = -1.1; tab.rotation.z = .2; root.add(tab); tab.add(box(.6, .4, .03, M(0x1d2128))); const scr = makeCanvas(.56, .36, 640); tab.add(at(scr.mesh, 0, 0, .016));
  const chk = new THREE.Group(); chk.position.set(-1.0, .95, -1.5); root.add(chk); chk.add(box(.25, .18, .03, M(0x1d2128))); const chkM = M(0x442200); chk.add(at(new THREE.Mesh(new THREE.CircleGeometry(.06, 20), chkM), 0, 0, .016)); chk.add(at(label('CHECK', '#ffffff', .045), 0, .13, .02));
  const sel = { k: 'ECT' }; const st = { m: 'live', fault: 0 }; let t = 0;
  Object.keys(S).forEach(k => { part(k, S[k].g, V(0, .2, 0), `${k} · ${S[k].name}`, L('دوس عليه تشوف قراءته.', 'Tap to see its reading.')); ctx.parts[k].tap = () => { sel.k = k; return `${k}: ${S[k].name}`; }; });
  part('ecu', ecu, V(0, .15, 0), L('كمبيوتر المحرك ECU', 'Engine ECU'), L('مداخل ← معالجة ← مخارج.', 'Inputs → processing → outputs.')); part('tab', tab, V(0, .25, 0), L('جهاز الفحص OBD', 'OBD scanner'), L('بيقرا الأكواد والقراءات الحية.', 'Reads codes and live data.'));
  const VAL = t2 => ({ MAF: (3.2 + Math.sin(t2) * .2).toFixed(1) + ' g/s', IAT: '32 °C', TPS: (12 + Math.max(0, Math.sin(t2 * .5)) * 30).toFixed(0) + ' %', MAP: (34 + Math.sin(t2) * 2).toFixed(0) + ' kPa', ECT: st.fault ? '-40 °C ✕' : '90 °C', CKP: (800 + Math.sin(t2 * 2) * 20).toFixed(0) + ' rpm', CMP: 'OK', O2: (0.45 + Math.sin(t2 * 4) * .4).toFixed(2) + ' V', KS: '0.1 V' });
  const draw = () => scr.draw((x, W, H) => { x.fillStyle = '#0d1b2e'; x.fillRect(0, 0, W, H); x.fillStyle = '#2a62c9'; x.fillRect(0, 0, W, 40); x.fillStyle = '#fff'; x.font = 'bold 22px Tahoma'; x.textAlign = 'left'; x.fillText('OBD-II  Live Data', 14, 28);
    if(st.m === 'codes'){ x.fillStyle = st.fault ? '#ff7a6b' : '#7dffb0'; x.font = 'bold 30px monospace'; x.fillText(st.fault ? 'P0117' : L('مفيش أكواد', 'No codes'), 30, 110); x.font = '22px Tahoma'; x.fillStyle = '#cfd6de'; if(st.fault) x.fillText(L('ECT: إشارة واطية (دايرة الحساس)', 'ECT circuit low input'), 30, 160); return; }
    const v = VAL(t); const keys = Object.keys(v); x.font = 'bold 22px monospace'; keys.forEach((k, i) => { const y = 70 + i * 33; x.fillStyle = k === sel.k ? '#ffd34d' : '#cfd6de'; x.fillText(k, 20, y); x.textAlign = 'right'; x.fillText(v[k], W - 20, y); x.textAlign = 'left'; });
    if(sel.k === 'O2'){ x.strokeStyle = '#7dffb0'; x.lineWidth = 3; x.beginPath(); for(let i = 0; i < 200; i++){ const y = H - 30 - (0.45 + Math.sin((t - i * .02) * 4) * .4) * 60; i ? x.lineTo(W - 20 - i, y) : x.moveTo(W - 20, y); } x.stroke(); } });
  return {
    ...ctx, view: V(.05, .6, 1.45), sway: true, hint: L('دوس على أي حساس تشوف قراءته', 'Tap any sensor to see its reading'),
    steps: [
      { title: L('حساسات المحرك', 'Engine sensors'), text: L('الكمبيوتر بيقرا الحساسات (مداخل)، ويحسب، ويشغّل الرشاشات والبوبينات والمروحة (مخارج). الحساسات قدامك على المحرك بأسمائها، ودوس على أي واحد تشوف قراءته الحية على جهاز الفحص.', 'The ECU reads its sensors (inputs), calculates and drives the injectors, coils and fan (outputs). The sensors are labelled on the engine; tap any one to see its live reading on the scanner.'), s: { m: 'live' } },
      { title: L('حساسات الهوا والثروتل', 'Air and throttle sensors'), text: L('MAF بيقيس كمية الهوا الداخلة (أو MAP بيقيس ضغط المجمع)، وIAT حرارة الهوا، وTPS زاوية فتح الثروتل. منهم الكمبيوتر بيعرف المحرك محتاج بنزين قد إيه.', 'MAF measures the air mass entering (or MAP measures manifold pressure), IAT the air temperature and TPS the throttle angle. From these the ECU works out how much fuel is needed.'), focus: 'MAF', s: { m: 'live', sel: 'MAF' } },
      { title: L('حساس حرارة المحرك', 'Coolant temperature sensor'), text: L('ECT بيقول للكمبيوتر حرارة المحرك: على البارد يزوّد البنزين والسرعة شوية، ويشغّل المروحة لما يسخن، ويغذي عداد الحرارة. ده مقاومة بتقل كل ما الحرارة تزيد (NTC).', 'ECT tells the ECU engine temperature: when cold it enriches the mixture and raises idle; it switches on the fan when hot and drives the gauge. It is a resistance that falls as temperature rises (NTC).'), focus: 'ECT', s: { m: 'live', sel: 'ECT' } },
      { title: L('حساس الكرنك والكامة', 'Crank and cam sensors'), text: L('CKP بيقرا سرعة ومكان الكرنك، وCMP بيحدد أنهي سلندر في شوط الانضغاط. من غير CKP المحرك مش هيدور خالص، لأن الكمبيوتر مش هيعرف إمتى يشرر ويحقن.', 'CKP reads crank speed and position, and CMP identifies which cylinder is on compression. Without CKP the engine will not start, because the ECU cannot time spark or injection.'), focus: 'CKP', s: { m: 'live', sel: 'CKP' } },
      { title: L('حساس الأكسجين', 'The oxygen sensor'), text: L('حساس O2 في الشكمان بيقيس الأكسجين في العادم، وجهده بيتأرجح بسرعة بين 0.1 و0.9 فولت (الرسم). الكمبيوتر بيستخدمه يصحّح الخليط باستمرار على 14.7:1. لو بقى بطيء أو ثابت، الصرف يزيد والعادم يبوظ.', 'The O2 sensor in the exhaust measures oxygen; its voltage swings quickly between 0.1 and 0.9 V (graph). The ECU uses it to trim the mixture constantly to 14.7:1. A slow or flat signal raises consumption and emissions.'), focus: 'O2', s: { m: 'live', sel: 'O2' } },
      { title: L('جهاز الفحص وتغيير الحساس التالف', 'Scanner and replacing a sensor'), text: L('لمبة CHECK نوّرت. وصّل جهاز الفحص في فيشة OBD تحت الطبلون: الكود P0117 يعني دايرة حساس الحرارة. القراءة -40 درجة معناها سلك مقطوع أو حساس بايظ. افحص الفيشة والسلك، وقيس مقاومة الحساس، وغيّره لو بايظ، وبعدين امسح الكود.', 'The CHECK lamp is on. Plug the scanner into the OBD socket under the dash: P0117 means the coolant sensor circuit. A reading of −40 °C means an open wire or dead sensor. Check the plug and wiring, measure the sensor resistance, replace it if faulty, then clear the code.'), focus: 'tab', s: { m: 'codes', fault: 1 } }
    ],
    apply(s){ st.m = s.m; st.fault = s.fault || 0; if(s.sel) sel.k = s.sel; },
    update(dt){ t += dt; Object.keys(S).forEach(k => setGlow(S[k].led, k === sel.k ? 1 : .15, 1, .8, .1)); setGlow(chkM, st.fault ? 1 : 0, 1, .55, 0); if(Math.floor(t * 8) !== scr.mesh.userData.f){ scr.mesh.userData.f = Math.floor(t * 8); draw(); } }
  };
}

/* ---------- الفرامل ---------- */
function buildBrakes(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const mc = new THREE.Group(); mc.position.set(-1.1, .5, -.4); root.add(mc);
  mc.add(cyl(.06, .06, .5, M(0xc9ced6, { m: .6, opacity: .45 }), 20).rotateZ(Math.PI / 2)); const res = box(.25, .14, .14, M(0xffffff, { opacity: .45 })); mc.add(at(res, 0, .14, 0)); const fluid = box(.23, .09, .12, M(0xd9a441, { opacity: .55 })); mc.add(at(fluid, 0, .12, 0));
  const pist = new THREE.Group(); mc.add(pist); [-.08, .1].forEach(x => pist.add(at(cyl(.055, .055, .05, M(0xd23a2e), 16).rotateZ(Math.PI / 2), x, 0, 0)));
  const boost = cyl(.2, .2, .15, M(0x1d2128, { m: .4 }), 28); boost.rotation.z = Math.PI / 2; boost.position.set(-.35, 0, 0); mc.add(boost);
  const pedal = new THREE.Group(); pedal.position.set(-.5, 0, 0); mc.add(pedal); pedal.add(at(box(.03, .4, .03, M(0x2b3038)), 0, -.2, 0)); pedal.add(at(box(.12, .03, .09, M(0x1d2128)), 0, -.4, 0));
  // الديسك
  const df = new THREE.Group(); df.position.set(.2, .5, -.3); root.add(df); const rotor = new THREE.Group(); df.add(rotor); rotor.add(cyl(.32, .32, .04, M(0x9aa0a6, { m: .7 }), 40).rotateX(Math.PI / 2)); for(let i = 0; i < 5; i++) rotor.add(at(cyl(.015, .015, .05, M(0x3a3f46), 8).rotateX(Math.PI / 2), Math.cos(i * 1.256) * .08, Math.sin(i * 1.256) * .08, 0)); rotor.add(at(box(.04, .06, .045, M(0xd23a2e)), 0, .25, 0));
  const cal = new THREE.Group(); cal.position.set(.0, .28, 0); df.add(cal); cal.add(box(.16, .14, .16, M(0xd23a2e, { m: .4, opacity: .55 }))); const padA = box(.12, .08, .02, M(0x3a3f46)), padB = padA.clone(); cal.add(padA); cal.add(padB);
  // الطنبورة
  const dr = new THREE.Group(); dr.position.set(1.05, .5, -.3); root.add(dr); dr.add(new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, .1, 40, 1, true), M(0x8a9099, { m: .6, side: THREE.DoubleSide })).rotateX(Math.PI / 2)); const drMark = box(.04, .04, .1, M(0xd23a2e)); drMark.position.y = .31; dr.add(drMark);
  const shoes = [1, -1].map(s => { const g = new THREE.Group(); dr.add(g); g.add(new THREE.Mesh(new THREE.TorusGeometry(.27, .02, 6, 30, Math.PI * .8), M(0x3a3f46))).rotation.z = s > 0 ? Math.PI * .1 : Math.PI * 1.1; return { g, s }; });
  const wcyl = cyl(.025, .025, .14, M(0xd23a2e), 12); wcyl.rotation.z = Math.PI / 2; wcyl.position.y = .2; dr.add(wcyl);
  const spr = tube(CR([V(-.12, -.18, 0), V(0, -.22, 0), V(.12, -.18, 0)]), .006, M(0x9aa0a6), 20); dr.add(spr);
  const l1 = CR([V(-.85, .52, -.4), V(-.4, .8, -.3), V(.0, .78, -.3)]), l2 = CR([V(-.85, .52, -.4), V(.3, .9, -.35), V(1.05, .7, -.3)]); root.add(tube(l1, .01, M(0x9aa0a6, { m: .6 }), 40)); root.add(tube(l2, .01, M(0x9aa0a6, { m: .6 }), 40));
  const f1 = new Flow(root, l1, { color: 0xd9a441, count: 10, speed: 1, size: .02 }), f2 = new Flow(root, l2, { color: 0xd9a441, count: 12, speed: 1, size: .02 });
  const bleed = new THREE.Group(); bleed.position.set(.1, .82, -.2); root.add(bleed); bleed.add(cyl(.012, .012, .06, M(0xc9a24a, { m: .7 }), 8)); const bub = []; for(let i = 0; i < 6; i++){ const b = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), M(0xffffff, { opacity: .7 })); b.userData = { ph: i / 6, noFit: true }; bleed.add(b); bub.push(b); }
  const pr = readout(.9, .14); pr.mesh.position.set(.3, 1.25, -1.5); root.add(pr.mesh);
  part('mc', mc, V(0, .3, 0), L('الأسطوانة الرئيسية (الماستر)', 'Master cylinder'), L('بتحوّل ضغطة الرجل لضغط زيت.', 'Turns pedal force into fluid pressure.'));
  part('pedal', pedal, V(0, -.45, 0), L('دواسة الفرامل', 'Brake pedal'), L('دوس عليها.', 'Tap it.'));
  part('disc', df, V(0, .45, 0), L('فرامل ديسك (قدام)', 'Disc brake (front)'), L('الكاليبر بيقفل التيل على الديسك.', 'The caliper squeezes pads on the disc.'));
  part('drum', dr, V(0, .45, 0), L('فرامل طنبورة (ورا)', 'Drum brake (rear)'), L('الفحمات بتفتح لبرّه على الطنبورة.', 'Shoes expand against the drum.'));
  part('bleed', bleed, V(0, .08, 0), L('بلف التنفيس', 'Bleed nipple'), L('لطرد الهوا من الخطوط.', 'For bleeding air from the lines.'));
  const st = { press: 0, bleed: 0, worn: 0 }; let t = 0, w = 6;
  ctx.parts.pedal.tap = () => { st.press ^= 1; return st.press ? L('دوسنا الفرامل: الضغط وصل للعجلتين.', 'Brakes applied: pressure reaches both wheels.') : L('سبنا الدواسة.', 'Pedal released.'); };
  return {
    ...ctx, view: V(.05, .5, 1.45), sway: true, hint: L('دوس على دواسة الفرامل', 'Tap the brake pedal'),
    steps: [
      { title: L('أنظمة الفرامل', 'Brake systems'), text: L('الفرامل الهيدروليك شغالة بقاعدة باسكال: الضغط في السائل المقفول بيوصل لكل مكان بنفس القيمة. رجلك بتدوس الدواسة، والسيرفو بيضاعف القوة، والماستر بيضغط زيت الفرامل في الخطوط لحد العجل.', 'Hydraulic brakes use Pascal\'s principle: pressure in a closed fluid is transmitted equally everywhere. Your foot presses the pedal, the servo multiplies the force and the master cylinder pressurises brake fluid down the lines to the wheels.'), s: { press: 0 } },
      { title: L('الأسطوانة الرئيسية (الماستر)', 'The master cylinder'), text: L('فيها مكبسين ورا بعض، كل واحد لدايرة (مثلًا قدام يمين وورا شمال)، عشان لو دايرة سرّبت التانية تفضل شغالة. فوقها خزان الزيت بعلامتي MIN وMAX. فحصها: تسريب عند السيرفو، أو دواسة بتنزل لوحدها وانت ضاغط = جلد الماستر بايظ.', 'It has two pistons in tandem, one per circuit (for example front right and rear left), so one leak leaves the other working. The reservoir on top has MIN and MAX marks. Faults: a leak at the servo, or a pedal that sinks under steady pressure = worn master seals.'), focus: 'mc', s: { press: 1 } },
      { title: L('فرامل الديسك', 'Disc brakes'), text: L('الكاليبر فيه مكبس بيزق تيلتين على الديسك اللي بيلف مع العجلة، والاحتكاك بيوقّفه. اتغيّر التيل لو سُمكه أقل من 3 مم، وقيس سُمك الديسك وانحرافه، ولو عليه خدوش عميقة أو أقل من الحد المكتوب عليه يتغيّر.', 'The caliper piston pushes two pads onto the disc turning with the wheel, and friction stops it. Replace pads under 3 mm, measure disc thickness and run-out, and replace a deeply scored disc or one below its stamped minimum.'), focus: 'disc', s: { press: 1 } },
      { title: L('فرامل الطنبورة (الانفراجية)', 'Drum brakes (expanding)'), text: L('السلندر الصغير اللي فوق بيفتح الفحمتين لبرّه (انفراجية) على جوه الطنبورة. الياي بيرجّعهم لما تسيب. والنوع الانقباضي بيقفل شريط على الطنبورة من برّه (زي فرامل اليد في بعض العربيات). الفحص: سُمك البطانة، وتسريب السلندر، وقطر الطنبورة.', 'The small wheel cylinder at the top spreads the two shoes outward (expanding) against the drum; the spring pulls them back. The contracting type clamps a band round the outside of the drum (as on some handbrakes). Check lining thickness, wheel cylinder leaks and drum diameter.'), focus: 'drum', s: { press: 1 } },
      { title: L('تنفيس الهوا', 'Bleeding the brakes'), text: L('الهوا بيتضغط، فلو دخل الخطوط الدواسة تبقى إسفنجية. ابدأ من أبعد عجلة عن الماستر: حد يدوس ويثبّت، وانت تفتح البلف لحد ما الزيت يطلع من غير فقاقيع، وتقفل قبل ما يسيب. ما تخليش الخزان يفضى، واستخدم زيت DOT نفس النوع.', 'Air compresses, so air in the lines gives a spongy pedal. Start at the wheel furthest from the master: a helper presses and holds while you open the nipple until fluid flows bubble-free, closing it before the pedal is released. Never let the reservoir run dry, and use the same DOT fluid.'), focus: 'bleed', s: { press: 1, bleed: 1 } },
      { title: L('أعطال الفرامل', 'Brake faults'), text: L('صفير: تيل خلص. العربية بتشد لناحية: كاليبر ماسك أو تيل عليه زيت. رعشة في الدواسة: ديسك ملتوي. دواسة إسفنجية: هوا. دواسة بتنزل للأرض: تسريب أو ماستر. الفرامل أمان: أي شك يتصلّح قبل ما العربية تتحرك.', 'Squeal: pads worn out. Pulls to one side: sticking caliper or oily pads. Pedal judder: warped disc. Spongy pedal: air. Pedal to the floor: leak or master cylinder. Brakes are safety-critical: fix any doubt before the car moves.'), focus: 'pedal', s: { press: 0 } }
    ],
    apply(s){ Object.assign(st, { press: 0, bleed: 0 }, s); },
    update(dt){ t += dt; const p = st.press ? (st.bleed ? Math.max(0, Math.sin(t * 2)) : 1) : 0;
      pedal.rotation.z = ease(pedal.rotation.z, p * .4, dt, 6); pist.position.x = ease(pist.position.x, p * .08, dt, 6);
      padA.position.z = ease(padA.position.z, p ? .03 : .06, dt, 8); padB.position.z = -padA.position.z;
      shoes.forEach(o => { o.g.position.x = ease(o.g.position.x, (p ? .02 : 0) * o.s, dt, 8); o.g.scale.setScalar(1 + (p ? .03 : 0)); });
      w = ease(w, p ? 0 : 6, dt, p ? 3 : 1); rotor.rotation.z -= w * dt; dr.rotation.z -= w * dt * 0; drMark.parent.rotation.z -= 0; shoes.forEach(() => {}); dr.children[0].rotation.y += 0;
      drMark.position.set(Math.sin(t * w * .2) * .31, Math.cos(t * w * .2) * .31, 0);
      f1.target = p; f2.target = p; f1.update(dt); f2.update(dt);
      bub.forEach(b => { const ph = (b.userData.ph + t * .6) % 1; b.position.set(0, .05 + ph * .2, 0); b.visible = !!st.bleed && p > .2 && Math.floor(t / 4) % 2 === 0; });
      pr.setText(L(`ضغط الخط: ${Math.round(p * 80)} بار`, `Line pressure: ${Math.round(p * 80)} bar`));
    }
  };
}

/* ================= برنامج السيارات: الدفعة التالتة ================= */
function makeWheel(r = .3, w = .18){
  const g = new THREE.Group(); const tire = new THREE.Mesh(new THREE.TorusGeometry(r * .8, r * .22, 14, 40), M(0x1d2128, { r: .9 })); tire.scale.z = w / (r * .44); g.add(tire);
  g.add(cyl(r * .62, r * .62, w * .7, M(0xc9ced6, { m: .7 }), 28).rotateX(Math.PI / 2)); for(let i = 0; i < 5; i++){ const s = box(.03, r * .5, .03, M(0x9aa0a6, { m: .7 })); const pv = new THREE.Group(); pv.rotation.z = i / 5 * Math.PI * 2; pv.add(at(s, 0, r * .3, w * .36)); g.add(pv); }
  g.add(at(box(.04, .06, w + .02, M(0xd23a2e)), 0, r * .9, 0)); return g;
}
/* ---------- المحاور والتوجيه ---------- */
function buildSteering(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const fa = new THREE.Group(); fa.position.set(0, .35, -.2); root.add(fa);
  const wheels = [-1, 1].map(s => { const k = new THREE.Group(); k.position.set(s * .85, 0, 0); fa.add(k); const w = makeWheel(.3, .18); w.rotation.y = Math.PI / 2; k.add(w); return { k, w, s }; });
  const sub = box(1.3, .05, .1, M(0x3a3f46, { m: .5 })); fa.add(at(sub, 0, -.1, -.15));
  const arms = [-1, 1].map(s => { const a = box(.45, .03, .06, M(0x6c747d, { m: .6 })); a.position.set(s * .5, -.14, 0); fa.add(a); return a; });
  const struts = [-1, 1].map(s => { const g = new THREE.Group(); g.position.set(s * .72, .05, 0); fa.add(g); g.add(at(cyl(.025, .025, .5, M(0xc9ced6, { m: .8 }), 10), 0, .3, 0)); const spr = tube(helixX(0, .35, .07, 7), .01, M(0xd23a2e, { m: .4 }), 120); spr.rotation.z = Math.PI / 2; spr.position.y = .1; g.add(spr); g.add(at(cyl(.045, .045, .2, M(0x2b3038), 14), 0, .12, 0)); return { g, spr }; });
  const rack = new THREE.Group(); rack.position.set(0, -.02, .15); fa.add(rack); rack.add(cyl(.035, .035, .7, M(0x1d2128), 12).rotateZ(Math.PI / 2)); const rbar = cyl(.015, .015, 1.0, M(0xc9ced6, { m: .9 }), 10); rbar.rotation.z = Math.PI / 2; rack.add(rbar);
  const tieR = [-1, 1].map(s => { const t2 = cyl(.012, .012, .3, M(0x9aa0a6, { m: .8 }), 8); t2.rotation.z = Math.PI / 2; fa.add(t2); return t2; });
  fa.add(tube(CR([V(-.2, -.02, .15), V(-.3, .25, .3), V(-.4, .5, .45)]), .013, M(0x6c747d, { m: .7 }), 20)); const sw = new THREE.Group(); sw.position.set(-.42, .52, .47); sw.rotation.x = -.5; fa.add(sw); sw.add(new THREE.Mesh(new THREE.TorusGeometry(.16, .02, 8, 30), M(0x1d2128))); sw.add(box(.3, .02, .02, M(0x1d2128)));
  const ra = new THREE.Group(); ra.position.set(0, .55, -1.1); ra.scale.setScalar(.6); root.add(ra); ra.add(cyl(.04, .04, 1.6, M(0x3a3f46, { m: .5 }), 12).rotateZ(Math.PI / 2)); [-1, 1].forEach(s => { const w = makeWheel(.3, .18); w.rotation.y = Math.PI / 2; ra.add(at(w, s * .85, 0, 0)); }); ra.add(at(label(L('المحور الخلفي', 'Rear axle'), '#ffffff', .1), 0, .45, 0));
  part('wheel', wheels[0].k, V(0, .42, 0), L('العجلة الأمامية', 'Front wheel'), L('على كرسي بلي وبتلف حوالين محور التوجيه.', 'On a wheel bearing, pivoting about the steering axis.'));
  part('strut', struts[1].g, V(0, .6, 0), L('المساعد واليّاي (ماكفرسون)', 'Strut and spring (MacPherson)'), L('اليّاي بيشيل والمساعد بيهدّي الرجرجة.', 'The spring carries the load, the damper stops bouncing.'));
  part('arm', arms[0], V(0, .04, 0), L('المقص والمفاصل الكروية', 'Control arm and ball joints'), L('بيمسك العجلة من تحت.', 'Locates the wheel at the bottom.'));
  part('rack', rack, V(0, .1, 0), L('علبة الدركسيون (جريدة وترس)', 'Rack and pinion'), L('بتحوّل لف الطارة لحركة يمين وشمال.', 'Turns steering-wheel rotation into side-to-side motion.'));
  part('sw', sw, V(0, .2, 0), L('طارة الدركسيون', 'Steering wheel'), L('دوس عليها تلف العجل.', 'Tap to steer.'));
  part('tie', tieR[0], V(0, .05, 0), L('بارات الدركسيون والمقصات', 'Tie rods and ends'), L('بتوصّل الجريدة بالعجل.', 'Link the rack to the wheels.'));
  const st = { steer: 0, bounce: 0, shake: 0 }; let t = 0, ang = 0;
  ctx.parts.sw.tap = () => { st.steer = st.steer === 0 ? 1 : st.steer === 1 ? -1 : 0; return st.steer > 0 ? L('لفّينا شمال.', 'Steering left.') : st.steer < 0 ? L('لفّينا يمين.', 'Steering right.') : L('مستقيم.', 'Straight ahead.'); };
  return {
    ...ctx, view: V(.05, .65, 1.45), sway: true, hint: L('دوس على طارة الدركسيون', 'Tap the steering wheel'),
    steps: [
      { title: L('المحاور الأمامية والخلفية', 'Front and rear axles'), text: L('المحور الأمامي بيشيل العجل اللي بتتوجّه، وفيه نظام التعليق (اليّاي والمساعد والمقصات) وعلبة الدركسيون. المحور الخلفي في عربيات كتير عامود واحد (بيم) أو تعليق مستقل. وظيفتهم يشيلوا العربية، ويمتصوا المطبات، ويخلوا العجل لازق في الأرض.', 'The front axle carries the steered wheels with the suspension (springs, dampers and arms) and the steering rack. The rear is often a single beam or independent suspension. Together they carry the car, absorb bumps and keep the tyres on the road.'), s: {} },
      { title: L('المساعدين واليايات', 'Dampers and springs'), text: L('اليّاي بيشيل وزن العربية، والمساعد (الشكمان) بيوقّف اليّاي إنه يفضل يتنطط. اختبار بسيط: اضغط على ركن العربية وسيب، لو اتنططت أكتر من مرة ونص يبقى المساعد ضعيف. واكشف على تسريب الزيت من المساعد.', 'The spring carries the weight and the damper stops it bouncing. A simple test: push a corner down and release; more than one and a half bounces means a weak damper. Also look for oil leaking from it.'), focus: 'strut', s: { bounce: 1 } },
      { title: L('علبة الدركسيون', 'Rack-and-pinion steering'), text: L('عمود الطارة بيلف ترس صغير معشّق في جريدة مسنّنة، فالجريدة تتحرك يمين وشمال، والبارات تزق وتشد ذراع العجلة فيلف. وفي الباور ستيرنج، طلمبة زيت أو موتور كهربا بيساعد. دوس على الطارة.', 'The column turns a pinion meshed with a toothed rack, so the rack slides side to side and the tie rods push and pull the steering arms. Power steering adds a hydraulic pump or electric motor to help. Tap the steering wheel.'), focus: 'sw', s: { steer: 1 } },
      { title: L('فحص أجزاء المحور والتوجيه', 'Inspecting suspension and steering'), text: L('ارفع العجلة، وحرّكها من فوق وتحت: لو فيها لعب يبقى الكرسي البلي أو المفصل الكروي. حرّكها يمين وشمال: لو فيها لعب يبقى طرف البار أو العلبة. واكشف على الجلود المطاطية (مقطوعة = تراب ومية يدخلوا)، والجلب، وسماع الطقطقة على المطبات.', 'Lift the wheel and rock it top and bottom: play means a wheel bearing or ball joint. Rock it side to side: play means a tie-rod end or the rack. Check the rubber boots (split boots let in dirt and water), the bushes, and listen for knocks over bumps.'), focus: 'arm', s: { shake: 1 } },
      { title: L('صيانة المحاور', 'Axle maintenance'), text: L('أي جزء فيه لعب يتغيّر: المفاصل الكروية، والأطراف، والجلب، والمساعدين (بيتغيّروا اتنين اتنين على نفس المحور). بعد تغيير أي جزء في التوجيه أو التعليق لازم ضبط زوايا العجل، واربط كل الصواميل بالعزم والعربية على الأرض.', 'Replace any part with play: ball joints, track-rod ends, bushes and dampers (in pairs on the same axle). After replacing any steering or suspension part the wheel alignment must be reset, and nuts torqued with the car on its wheels.'), focus: 'tie', s: {} }
    ],
    apply(s){ Object.assign(st, { steer: 0, bounce: 0, shake: 0 }, s); t = 0; },
    update(dt){ t += dt; ang = ease(ang, st.steer * .45, dt, 4); wheels.forEach(o => { o.k.rotation.y = ang; o.k.position.y = st.bounce ? Math.sin(t * 6) * Math.exp(-(t % 3) * 1.2) * .06 : 0; if(st.shake && o.s < 0) o.k.rotation.x = Math.sin(t * 20) * .04; else o.k.rotation.x = 0; });
      rbar.position.x = -ang * .2; tieR.forEach((tr, i) => { const s = i ? 1 : -1; tr.position.set(s * .58 - ang * .2, -.02, .15); }); sw.rotation.z = ang * 3;
      struts.forEach((o, i) => { const c = 1 + wheels[i].k.position.y * 3; o.spr.scale.set(c, 1, 1); });
    }
  };
}

/* ---------- زوايا العجل والاستقامة ---------- */
function buildAlignment(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const mk = (x, z) => { const g = new THREE.Group(); g.position.set(x, .32, z); root.add(g); const w = makeWheel(.28, .16); w.rotation.y = Math.PI / 2; g.add(w); return { g, w }; };
  const W = [mk(-.6, -.35), mk(.6, -.35)];
  const axis = [-1, 1].map(s => { const a = cyl(.008, .008, .9, M(0xffd34d), 6); root.add(a); return a; });
  const ver = [-1, 1].map(s => { const a = cyl(.004, .004, .9, M(0xffffff, { opacity: .6 }), 6); a.position.set(s * .6, .32, -.35); root.add(a); return a; });
  const tie = cyl(.012, .012, .9, M(0x9aa0a6, { m: .8 }), 8); tie.rotation.z = Math.PI / 2; tie.position.set(0, .2, -.2); root.add(tie);
  const scr = makeCanvas(.9, .55, 640); scr.mesh.position.set(.3, 1.15, -1.5); root.add(scr.mesh);
  const heads = W.map(o => { const h = box(.12, .1, .08, M(0x1d2128)); h.position.set(0, 0, .12); o.g.add(h); return h; });
  part('wheel', W[0].g, V(0, .4, 0), L('العجلة', 'Wheel'), ''); part('axis', axis[0], V(0, .45, 0), L('محور التوجيه', 'Steering axis'), L('الخط الأصفر.', 'The yellow line.'));
  part('tie', tie, V(-.3, .05, 0), L('بار الدركسيون', 'Tie rod'), L('دوس عليه تلف الطول وتظبط التو.', 'Tap to turn it and set toe.')); part('scr', scr.mesh, V(0, .33, 0), L('جهاز الضبط', 'Alignment computer'), '');
  const st = { m: 'camber', toe: 3 }; let t = 0;
  ctx.parts.tie.tap = () => { st.toe = st.toe > 0 ? st.toe - 1 : 3; return L(`لفّينا البار: التو ${['0.0', '+0.1', '+0.4', '+0.8'][st.toe]}°`, `Tie rod turned: toe ${['0.0', '+0.1', '+0.4', '+0.8'][st.toe]}°`); };
  const draw = () => scr.draw((x, W2, H) => { x.fillStyle = '#0d1b2e'; x.fillRect(0, 0, W2, H); x.fillStyle = '#2a62c9'; x.fillRect(0, 0, W2, 40); x.fillStyle = '#fff'; x.font = 'bold 22px Tahoma'; x.textAlign = 'left'; x.fillText(L('ضبط الزوايا', 'Wheel alignment'), 14, 28);
    const toeV = [0.05, 0.1, 0.4, 0.8][st.toe]; const rows = [[L('الكامبر', 'Camber'), '-0.5°', true], [L('الكاستر', 'Caster'), '+4.2°', true], [L('التو (لم)', 'Toe'), '+' + toeV.toFixed(1) + '°', toeV <= .2]];
    rows.forEach(([n, v, ok], i) => { const y = 95 + i * 70; x.fillStyle = '#cfd6de'; x.font = 'bold 26px Tahoma'; x.fillText(n, 24, y); x.fillStyle = ok ? '#2fbf5a' : '#ff5a4a'; x.fillRect(W2 - 220, y - 30, 180, 44); x.fillStyle = '#0d1b2e'; x.font = 'bold 28px monospace'; x.textAlign = 'center'; x.fillText(v, W2 - 130, y); x.textAlign = 'left'; }); });
  return {
    ...ctx, view: V(.05, .7, 1.4), sway: true, hint: L('دوس على بار الدركسيون تظبط التو', 'Tap the tie rod to adjust toe'),
    steps: [
      { title: L('ضبط زوايا العجل', 'Wheel alignment'), text: L('العجل مش بتقف عمودي ومستقيم بالظبط، ليها زوايا محسوبة بتخلي العربية ثابتة وسهلة اللف والكاوتش ما يدوبش. أشهرها: الكامبر، والكاستر، والتو. الزوايا في الموديل مكبّرة عشان تبان.', 'Wheels are not set exactly upright and straight; calculated angles keep the car stable, light to steer and stop tyre wear. The main ones are camber, caster and toe. The model exaggerates them so you can see them.'), s: { m: 'none' } },
      { title: L('الكامبر', 'Camber'), text: L('ميل العجلة لجوه أو لبرّه وانت باصص عليها من قدام. سالب لو راسها مايلة لجوه. لو زيادة، الكاوتش بيدوب من جنب واحد.', 'The inward or outward tilt of the wheel seen from the front; negative when the top leans in. Too much wears one edge of the tyre.'), focus: 'wheel', s: { m: 'camber' } },
      { title: L('الكاستر', 'Caster'), text: L('ميل محور التوجيه (الخط الأصفر) لورا وانت باصص من الجنب. بيخلي الطارة ترجع لوحدها للنص بعد اللف، والعربية تمشي ثابتة على السرعة، زي عجلة عربية السوبرماركت.', 'The backward tilt of the steering axis (yellow line) seen from the side. It makes the wheel self-centre after a turn and keeps the car stable at speed, like a supermarket trolley wheel.'), focus: 'axis', s: { m: 'caster' } },
      { title: L('التو (اللم)', 'Toe'), text: L('العجلتين من فوق: لو قدامهم أقرب لبعض من ورا يبقى «تو إن» (لم لجوه)، والعكس «تو آوت». التو الغلط بيدوّب الكاوتش بسرعة على شكل ريش، وبيخلي الطارة مش مستقيمة.', 'Seen from above: fronts closer together than the backs is toe-in, the opposite toe-out. Wrong toe feathers and wears tyres fast and leaves the steering wheel crooked.'), focus: 'tie', s: { m: 'toe' } },
      { title: L('القياس والضبط على الجهاز', 'Measuring and adjusting'), text: L('بنركّب حساسات على العجل، والجهاز بيقرا الزوايا ويقارنها بقيم العربية: الأخضر سليم والأحمر برّه الحدود. التو بيتظبط بلف بار الدركسيون عشان يطول أو يقصر. دوس على البار لحد ما التو يخضر.', 'Sensors on the wheels let the machine read the angles and compare them with the car\'s data: green is in range, red is out. Toe is set by turning the tie rod to lengthen or shorten it. Tap the tie rod until toe turns green.'), focus: 'scr', s: { m: 'toe', toe: 3 } },
      { title: L('فحص استقامة العجل', 'Checking straightness'), text: L('قبل الضبط: ضغط الكاوتش صح، ومفيش لعب في المفاصل والأطراف. بعد الضبط: جرّب العربية على طريق مستوي، الطارة لازم تكون في النص والعربية ما تشدّش لأي ناحية لما تسيب الطارة لحظة.', 'Before aligning: correct tyre pressures and no play in joints or track-rod ends. After: road-test on a level road; the steering wheel must be centred and the car must not pull either way when you briefly let go.'), focus: 'wheel', s: { m: 'none', toe: 0 } }
    ],
    apply(s){ Object.assign(st, s); draw(); },
    update(dt){ t += dt; const m = st.m; const toeA = [0, .03, .12, .25][st.toe] * (m === 'toe' || m === 'none' ? 1 : 0);
      W.forEach((o, i) => { const s = i ? 1 : -1; o.g.rotation.set(0, 0, 0); if(m === 'camber') o.g.rotation.z = s * .18; if(m === 'toe' || m === 'none') o.g.rotation.y = -s * toeA * 1; axis[i].position.set(s * .6, .32, -.35); axis[i].rotation.set(m === 'caster' ? -.35 : 0, 0, m === 'camber' ? s * .18 : 0); axis[i].visible = m === 'caster' || m === 'camber'; ver[i].visible = m === 'camber' || m === 'caster'; });
      if(scr.mesh.userData.k !== st.toe){ scr.mesh.userData.k = st.toe; draw(); } heads.forEach(h => h.visible = m === 'toe');
    }
  };
}

/* ---------- اتزان الإطارات (الترصيص) ---------- */
function buildBalance(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const mac = new THREE.Group(); mac.position.set(-.2, 0, -.3); root.add(mac); mac.add(at(box(.7, .6, .6, M(0x2a62c9, { r: .45 })), 0, .3, 0)); mac.add(at(box(.6, .2, .4, M(0x1d2128)), 0, .7, -.1));
  const shaft = cyl(.025, .025, .5, M(0xc9ced6, { m: .9 }), 10); shaft.rotation.z = Math.PI / 2; shaft.position.set(.55, .5, -.2); root.add(shaft);
  const wheel = makeWheel(.32, .2); wheel.position.set(.8, .5, -.2); wheel.rotation.y = Math.PI / 2; root.add(wheel);
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .4, 30, 1, true, 0, Math.PI), M(0x9aa0a6, { opacity: .3, side: THREE.DoubleSide })); hood.rotation.z = Math.PI / 2; hood.position.set(.8, .55, -.2); root.add(hood);
  const wt = [0, 1].map(i => { const w = box(.04, .03, .03, M(0x9aa0a6, { m: .8 })); w.visible = false; wheel.add(w); return w; });
  const scr = makeCanvas(.55, .2, 512); scr.mesh.position.set(-.2, .7, .01); scr.mesh.rotation.x = -.3; root.add(scr.mesh);
  part('mac', mac, V(0, .85, 0), L('ماكينة الترصيص', 'Balancing machine'), ''); part('wheel', wheel, V(0, .4, 0), L('العجلة', 'Wheel'), L('دوس عليها تلفها.', 'Tap to spin it.')); part('scr', scr.mesh, V(0, .14, 0), L('الشاشة', 'Display'), L('الجرامات الناقصة جوه وبرّه.', 'Grams needed inside and outside.'));
  const st = { phase: 'mount', spins: 0, fit: 0 }; let t = 0, w = 0, spinT = 0;
  ctx.parts.wheel.tap = () => { spinT = 3; st.spins++; return L('بنلف العجلة...', 'Spinning the wheel...'); };
  const draw = (a, b) => scr.draw((x, W, H) => { x.fillStyle = '#111'; x.fillRect(0, 0, W, H); x.font = 'bold 60px monospace'; x.textAlign = 'center'; x.fillStyle = a ? '#ff5a4a' : '#2fbf5a'; x.fillText(String(a).padStart(2, '0'), W * .25, H * .65); x.fillStyle = b ? '#ff5a4a' : '#2fbf5a'; x.fillText(String(b).padStart(2, '0'), W * .75, H * .65); x.font = '20px Tahoma'; x.fillStyle = '#cfd6de'; x.fillText(L('جوه (جم)', 'Inner (g)'), W * .25, H * .92); x.fillText(L('برّه (جم)', 'Outer (g)'), W * .75, H * .92); });
  return {
    ...ctx, view: V(.1, .55, 1.4), sway: true, hint: L('دوس على العجلة تلفها', 'Tap the wheel to spin it'),
    steps: [
      { title: L('اتزان الإطارات (الترصيص)', 'Wheel balancing'), text: L('لو الوزن حوالين العجلة مش متساوي، هتعمل رعشة في الطارة على سرعة 80 لـ 100 كم/س، وتدوّب الكاوتش والمساعدين. الترصيص بيحط أوزان رصاص صغيرة توزن العجلة.', 'If the weight round a wheel is uneven it shakes the steering at 80–100 km/h and wears tyres and dampers. Balancing adds small weights to even it out.'), s: { phase: 'mount' } },
      { title: L('تركيب العجلة وإدخال المقاسات', 'Mounting and entering sizes'), text: L('شيل أي حجارة أو أوزان قديمة، وركّب العجلة على عمود الماكينة بالكونة المناسبة واربطها كويس. دخّل المقاسات: المسافة من الماكينة، وعرض الجنط، وقطره (مثلًا 15 بوصة).', 'Remove stones and old weights, mount the wheel on the shaft with the right cone and clamp it firmly. Enter the distance from the machine, rim width and diameter (for example 15 inches).'), focus: 'wheel', s: { phase: 'mount' } },
      { title: L('اللف والقراءة', 'Spinning and reading'), text: L('نزّل الغطا ولف العجلة. الماكينة بتقيس الاهتزاز وتقول محتاج كام جرام جوه وكام برّه. هنا 25 جرام جوه و15 برّه. دوس على العجلة تلفها.', 'Lower the guard and spin the wheel. The machine measures the vibration and shows the grams needed inside and outside: here 25 g inside and 15 g outside. Tap the wheel to spin it.'), focus: 'scr', s: { phase: 'read' } },
      { title: L('تركيب الأوزان', 'Fitting the weights'), text: L('لف العجلة بإيدك لحد ما مؤشر الماكينة يقول «الوزن فوق» (الساعة 12)، وركّب الوزن هناك: وزن مشبك على حرف الجنط الحديد، أو وزن لزق جوه الجنط الألومنيوم.', 'Turn the wheel by hand until the machine shows the position (12 o\'clock) and fit the weight there: a clip-on weight on a steel rim edge or a stick-on weight inside an alloy rim.'), focus: 'wheel', s: { phase: 'fit' } },
      { title: L('اللفة التانية للتأكد', 'Check spin'), text: L('لف تاني: لازم الشاشة تقرا 00 و00. لو لسه فيه قراءة صغيرة، صحّح مكان الوزن. ولو محتاج أوزان كتير جدًا، يبقى الكاوتش أو الجنط نفسه فيه مشكلة.', 'Spin again: the display must read 00 and 00. If a small reading remains, adjust the weight position. Needing very large weights points to a faulty tyre or rim.'), focus: 'scr', s: { phase: 'done' } }
    ],
    apply(s){ st.phase = s.phase; spinT = s.phase === 'read' || s.phase === 'done' ? 3 : 0; },
    update(dt){ t += dt; spinT = Math.max(0, spinT - dt); w = ease(w, spinT > 0 ? 25 : 0, dt, 2); wheel.rotation.x += w * dt; hood.rotation.x = ease(hood.rotation.x, st.phase === 'mount' ? -1.5 : 0, dt, 3);
      const ok = st.phase === 'done'; wt.forEach((m, i) => { m.visible = st.phase === 'fit' || ok; m.position.set(0, .3, i ? .1 : -.1); });
      const show = (st.phase === 'read' || st.phase === 'fit') && spinT < 1.5 ? [25, 15] : ok && spinT < 1.5 ? [0, 0] : null; const key = show ? show.join() : 'x'; if(scr.mesh.userData.k !== key){ scr.mesh.userData.k = key; if(show) draw(show[0], show[1]); else scr.draw((x, W, H) => { x.fillStyle = '#111'; x.fillRect(0, 0, W, H); x.fillStyle = '#cfd6de'; x.font = 'bold 30px Tahoma'; x.textAlign = 'center'; x.fillText(st.phase === 'mount' ? '15" · 6J · 120' : '...', W / 2, H * .6); }); }
    }
  };
}

/* ---------- منظومة الغاز الطبيعي ---------- */
function buildCNG(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const cylG = new THREE.Group(); cylG.position.set(-1.0, .3, -.35); root.add(cylG); const cy = cyl(.22, .22, .9, M(0x2fa37a, { m: .3, r: .4 }), 28); cy.rotation.z = Math.PI / 2; cylG.add(cy); cylG.add(at(new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 12), M(0x2fa37a, { m: .3 })), -.45, 0, 0)); cylG.add(at(new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 12), M(0x2fa37a, { m: .3 })), .45, 0, 0));
  const cv = new THREE.Group(); cv.position.set(-.48, .3, -.35); root.add(cv); cv.add(box(.1, .1, .1, M(0xc9a24a, { m: .6 }))); cylG.add(at(label('CNG 200 bar', '#ffffff', .07), 0, .3, 0));
  const fill = new THREE.Group(); fill.position.set(-.3, .15, .2); root.add(fill); fill.add(cyl(.03, .03, .08, M(0xc9a24a, { m: .7 }), 12)); fill.add(at(label(L('فتحة التعبئة', 'Filling valve'), '#ffffff', .05), 0, .12, 0));
  const pg = makeGauge('#2fa37a', 0, 250, [0, 50, 100, 150, 200, 250], 'bar'); pg.group.scale.setScalar(.3); pg.group.position.set(-.48, .55, -.3); root.add(pg.group);
  const red = new THREE.Group(); red.position.set(.25, .45, -.35); root.add(red); red.add(cyl(.1, .1, .12, M(0x9aa0a6, { m: .6 }), 20).rotateX(Math.PI / 2)); red.add(at(label(L('المنظم (الريديوسر)', 'Pressure reducer'), '#ffffff', .05), 0, .18, 0));
  const eng = new THREE.Group(); eng.position.set(.9, .3, -.45); root.add(eng); eng.add(box(.7, .45, .4, M(0x6b7686, { m: .4 })));
  const rail = new THREE.Group(); rail.position.set(.9, .62, -.3); root.add(rail); rail.add(box(.4, .06, .08, M(0x1d2128))); const injL = []; for(let i = 0; i < 4; i++){ const m = M(0x334433); rail.add(at(new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), m), -.15 + i * .1, .05, .04)); injL.push(m); }
  const ecu = new THREE.Group(); ecu.position.set(.45, .1, .35); root.add(ecu); ecu.add(box(.24, .06, .18, M(0x2b3038))); ecu.add(at(label(L('كمبيوتر الغاز', 'Gas ECU'), '#ffffff', .05), 0, .08, 0));
  const swB = new THREE.Group(); swB.position.set(1.25, .05, .35); root.add(swB); swB.add(box(.16, .04, .1, M(0x1d2128))); const swL = M(0x334433); swB.add(at(new THREE.Mesh(new THREE.SphereGeometry(.015, 8, 6), swL), 0, .03, 0)); swB.add(at(label(L('مفتاح بنزين/غاز', 'Petrol/gas switch'), '#ffffff', .045), 0, .1, 0));
  const hp = CR([V(-.43, .3, -.35), V(-.2, .35, -.2), V(.15, .45, -.35)]), lp = CR([V(.35, .45, -.35), V(.6, .62, -.3), V(.72, .62, -.3)]), wat = CR([V(.75, .2, -.25), V(.5, .3, -.1), V(.28, .4, -.3)]);
  root.add(tube(hp, .008, M(0xc9ced6, { m: .8 }), 30)); root.add(tube(lp, .02, M(0x1d2128), 30)); root.add(tube(wat, .015, M(0x1d2128), 30));
  const fH = new Flow(root, hp, { color: 0x7dffb0, count: 10, speed: .8, size: .02 }), fL = new Flow(root, lp, { color: 0x7dffb0, count: 10, speed: .8, size: .02 }), fW = new Flow(root, wat, { color: 0xe0453a, count: 8, speed: .6, size: .018 });
  const bubbles = []; for(let i = 0; i < 8; i++){ const b = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), M(0xffffff, { opacity: .6 })); b.userData = { ph: i / 8, noFit: true }; root.add(b); bubbles.push(b); }
  const rd = readout(.9, .14); rd.mesh.position.set(.3, 1.2, -1.5); root.add(rd.mesh);
  part('cyl', cylG, V(0, .38, 0), L('أسطوانة الغاز', 'CNG cylinder'), L('غاز طبيعي مضغوط 200 بار.', 'Natural gas at 200 bar.')); part('cv', cv, V(0, .1, 0), L('محبس الأسطوانة', 'Cylinder valve'), '');
  part('fill', fill, V(0, .1, 0), L('فتحة التعبئة', 'Filling valve'), ''); part('red', red, V(0, .14, 0), L('الريديوسر', 'Reducer'), L('بينزّل الضغط من 200 لـ 2 بار.', 'Drops pressure from 200 to 2 bar.'));
  part('rail', rail, V(0, .1, 0), L('رشاشات الغاز', 'Gas injectors'), ''); part('ecu', ecu, V(0, .1, 0), L('كمبيوتر الغاز', 'Gas ECU'), ''); part('swB', swB, V(0, .1, 0), L('مفتاح التحويل', 'Changeover switch'), L('دوس عليه.', 'Tap it.'));
  const st = { gas: 1, leak: 0 }; let t = 0, temp = 20;
  ctx.parts.swB.tap = () => { st.gas ^= 1; temp = 20; return st.gas ? L('اخترنا الغاز: بيدور بنزين وبيحوّل لوحده لما يسخن.', 'Gas selected: starts on petrol, switches when warm.') : L('بنزين بس.', 'Petrol only.'); };
  return {
    ...ctx, view: V(.05, .55, 1.45), sway: true, hint: L('دوس على مفتاح بنزين/غاز', 'Tap the petrol/gas switch'),
    steps: [
      { title: L('منظومة الغاز الطبيعي', 'The CNG system'), text: L('العربية بتشتغل بنزين أو غاز طبيعي مضغوط. الغاز (الأخضر) بيطلع من الأسطوانة بضغط عالي، والريديوسر بينزّل ضغطه، والرشاشات بتحقنه في المحرك بأوامر كمبيوتر الغاز. وكل ده متركب جنب منظومة البنزين الأصلية.', 'The car runs on petrol or compressed natural gas. Gas (green) leaves the cylinder at high pressure, the reducer lowers it and the injectors feed it into the engine under the gas ECU, all installed alongside the original petrol system.'), s: { gas: 1 } },
      { title: L('الأسطوانة والمحبس والتعبئة', 'Cylinder, valve and filling'), text: L('الأسطوانة صلب مخصوص بتتملي لحد 200 بار من فتحة التعبئة، وعليها محبس يدوي وصمام أمان. لازم يكون ليها شهادة اختبار سارية وتتفحص دوريًا، ومثبتة كويس في الشنطة.', 'The special steel cylinder is filled to 200 bar through the filling valve and carries a manual valve and safety relief. It needs a valid test certificate, periodic inspection and secure mounting in the boot.'), focus: 'cyl', s: { gas: 1 } },
      { title: L('الريديوسر (المنظم)', 'The pressure reducer'), text: L('بينزّل ضغط الغاز من 200 لحوالي 2 بار. الغاز وهو بيتمدد بيبرد جامد، فمية التبريد السخنة (الأحمر) بتعدّي في الريديوسر عشان ما يتلجش. وعليه فلتر بيتغيّر في الصيانة.', 'It lowers the pressure from 200 to about 2 bar. Expanding gas gets very cold, so hot engine coolant (red) runs through the reducer to stop it freezing. Its filter is changed at service.'), focus: 'red', s: { gas: 1 } },
      { title: L('الرشاشات والكمبيوتر والمفتاح', 'Injectors, ECU and switch'), text: L('العربية بتدور بنزين، ولما المحرك يسخن (حوالي 30 درجة) كمبيوتر الغاز بيقفل رشاشات البنزين ويشغّل رشاشات الغاز. المفتاح في التابلوه بيبيّن الحالة وكمية الغاز. دوس على المفتاح.', 'The car starts on petrol; once warm (about 30 °C) the gas ECU shuts the petrol injectors and runs the gas injectors. The dashboard switch shows the mode and gas level. Tap the switch.'), focus: 'swB', s: { gas: 1 } },
      { title: L('السلامة واكتشاف التسريب', 'Safety and leak testing'), text: L('ممنوع التدخين أو أي نار جنب العربية. التسريب بيتكشف بمية وصابون على الوصلات: الفقاقيع معناها تسريب. لو شميت ريحة غاز: اقفل محبس الأسطوانة، وما تشغّلش العربية، وابعد عنها. وما تفكش أي وصلة والخط فيه ضغط.', 'No smoking or flames near the car. Find leaks with soapy water on the joints: bubbles mean a leak. If you smell gas, close the cylinder valve, do not start the car and move away. Never open a fitting while the line is pressurised.'), focus: 'cv', s: { gas: 1, leak: 1 } }
    ],
    apply(s){ Object.assign(st, { leak: 0 }, s); temp = 20; },
    update(dt){ t += dt; temp = Math.min(90, temp + dt * 6); const onGas = st.gas && temp > 30; pg.set(185); pg.update(dt);
      fH.target = onGas ? 1 : 0; fL.target = onGas ? 1 : 0; fW.target = 1; [fH, fL, fW].forEach(f => f.update(dt));
      injL.forEach((m, i) => setGlow(m, onGas && Math.floor(t * 6 + i) % 4 === 0 ? 1 : 0, .3, 1, .5)); setGlow(swL, 1, onGas ? .2 : 1, onGas ? 1 : .7, onGas ? .4 : .1);
      bubbles.forEach(b => { const ph = (b.userData.ph + t * .5) % 1; b.position.set(-.48 + Math.sin(ph * 9) * .03, .36 + ph * .15, -.3); b.visible = !!st.leak; b.scale.setScalar(.5 + ph); });
      rd.setText(onGas ? L(`شغال غاز · المحرك ${Math.round(temp)}°`, `Running on gas · engine ${Math.round(temp)}°`) : L(`شغال بنزين · المحرك ${Math.round(temp)}°`, `Running on petrol · engine ${Math.round(temp)}°`));
    }
  };
}

/* ---------- أعمال البرادة على المنضدة ---------- */
function makeVise(){
  const g = new THREE.Group(); const b = M(0x2a62c9, { m: .4 }); g.add(at(box(.3, .08, .25, b), 0, .04, 0)); g.add(at(box(.08, .2, .2, b), -.1, .18, 0));
  const jaw = new THREE.Group(); g.add(jaw); jaw.add(at(box(.08, .2, .2, b), .1, .18, 0)); g.add(at(cyl(.015, .015, .4, M(0xc9ced6, { m: .9 }), 8).rotateZ(Math.PI / 2), .2, .14, 0)); const h = cyl(.01, .01, .2, M(0xc9ced6, { m: .9 }), 8); g.add(at(h, .4, .14, 0));
  return { group: g, jaw };
}
function buildBenchwork(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const v = makeVise(); v.group.position.set(-.3, 0, -.2); v.group.scale.setScalar(1.6); v.group.traverse(o => { if(o.isMesh) o.userData.noFit = true; }); root.add(v.group);
  const work = box(.5, .12, .1, M(0x9aa0a6, { m: .7 })); work.position.set(-.3, .45, -.2); root.add(work);
  const file = new THREE.Group(); root.add(file); file.add(box(.4, .02, .05, M(0x6c747d, { m: .6 }))); file.add(at(cyl(.025, .02, .14, M(0x8a6a48), 10).rotateZ(Math.PI / 2), -.27, 0, 0));
  const saw = new THREE.Group(); root.add(saw); saw.add(at(box(.5, .01, .015, M(0xc9ced6, { m: .9 })), 0, 0, 0)); saw.add(tube(CR([V(-.25, 0, 0), V(-.25, .15, 0), V(.25, .15, 0), V(.25, 0, 0)]), .008, M(0x2b3038), 30)); saw.add(at(box(.05, .12, .03, M(0xd23a2e)), -.3, .05, 0));
  const sq = new THREE.Group(); sq.position.set(.6, .02, .15); root.add(sq); sq.add(box(.3, .01, .03, M(0xc9ced6, { m: .9 }))); sq.add(at(box(.03, .02, .2, M(0x2b3038)), -.14, .0, .09));
  const scrb = cyl(.006, .002, .2, M(0xc9ced6, { m: .9 }), 8); scrb.rotation.z = Math.PI / 2; scrb.position.set(.6, .03, .35); root.add(scrb);
  const punch = cyl(.012, .006, .14, M(0x6c747d, { m: .7 }), 8); punch.position.set(1.0, .07, .25); root.add(punch);
  const ham = new THREE.Group(); ham.position.set(1.1, .02, .0); root.add(ham); ham.add(at(box(.3, .02, .02, M(0x8a6a48)), 0, 0, 0)); ham.add(at(box(.04, .1, .04, M(0x3a3f46, { m: .6 })), .15, .0, 0));
  const dust = []; for(let i = 0; i < 10; i++){ const d = new THREE.Mesh(new THREE.SphereGeometry(.006, 6, 4), M(0xc9ced6, { m: .8 })); d.userData = { ph: i / 10, noFit: true }; root.add(d); dust.push(d); }
  part('vise', v.group, V(0, .3, 0), L('المنجلة', 'Bench vice'), ''); part('file', file, V(0, .03, 0), L('المبرد', 'File'), ''); part('saw', saw, V(0, .17, 0), L('منشار الحديد', 'Hacksaw'), '');
  part('sq', sq, V(0, .05, 0), L('الزاوية والشنكار', 'Square and scriber'), ''); part('punch', punch, V(0, .1, 0), L('السنبك والشاكوش', 'Centre punch and hammer'), '');
  const st = { m: 'idle' }; let t = 0;
  return {
    ...ctx, view: V(.05, .7, 1.4), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('أعمال البرادة على المنضدة', 'Bench fitting'), text: L('قبل أي شغل في العربيات لازم المتدرب يتقن الأعمال اليدوية: الربط في المنجلة، والشنكرة (التخطيط)، والبرد، والنشر، والتسنبك قبل التخريم. كل أداة قدامك على المنضدة.', 'Before automotive work a trainee must master hand skills: clamping in the vice, marking out, filing, sawing and centre punching before drilling. Each tool is laid out on the bench.'), s: { m: 'idle' } },
      { title: L('الربط في المنجلة', 'Clamping in the vice'), text: L('الشغلانة تتربط في نص الفكوك، وتطلع فوق الفك حوالي 10 مم بس عشان ما ترعشش. للأسطح الناعمة استخدم فكوك نحاس أو ألومنيوم. وما تضربش على يد المنجلة بشاكوش.', 'Clamp the work centrally and only about 10 mm above the jaws so it does not chatter. Use soft copper or aluminium jaws on finished surfaces. Never hammer the vice handle.'), focus: 'vise', s: { m: 'clamp' } },
      { title: L('الشنكرة (التخطيط)', 'Marking out'), text: L('ادهن السطح بحبر الشنكرة، وارسم الخطوط بالشنكار ماسك الزاوية على حرف مستوي. الخط يبقى رفيع وواضح، وكل القياسات من نفس حرف المرجع.', 'Coat the surface with marking blue and scribe lines with the scriber held against a square on a true edge. Lines should be fine and clear, with all measurements taken from the same datum edge.'), focus: 'sq', s: { m: 'mark' } },
      { title: L('البرد', 'Filing'), text: L('المبرد بيقطع وهو رايح لقدّام بس: اضغط وانت بتزق، وارفع الضغط وانت راجع. امسكه بالإيدين، وجسمك مايل جنب المنجلة، وحرّكه مستوي بطول المبرد كله. وعمره ما يتستخدم من غير يد.', 'A file cuts on the forward stroke only: press going forward and ease off coming back. Hold it with both hands, stand at an angle to the vice and use its full length keeping it level. Never use a file without a handle.'), focus: 'file', s: { m: 'file' } },
      { title: L('النشر بمنشار الحديد', 'Hacksawing'), text: L('سنان السلاح لقدّام، وشدّه كويس في الإطار. انشر بطول السلاح كله حوالي 50 حركة في الدقيقة، بضغط في الذهاب بس. خلي القطع قريب من الفك عشان الشغلانة ما ترعشش، وخفف الضغط في آخر القطع.', 'Teeth face forward and the blade is tensioned firmly. Use the full blade at about 50 strokes a minute, pressing on the forward stroke only. Cut close to the jaws to avoid chatter and ease off at the end of the cut.'), focus: 'saw', s: { m: 'saw' } },
      { title: L('التسنبك والأمان', 'Centre punching and safety'), text: L('قبل التخريم اعمل نقرة بالسنبك عند تقاطع الخطين بضربة شاكوش واحدة، عشان البنطة ما تزحلقش. شيل الرايش (الحروف الحادة) بالمبرد، والبس نضارة، وما تنفخش البرادة وما تشيلهاش بإيدك.', 'Before drilling, make a dot with the centre punch where the lines cross with one hammer blow so the drill does not wander. Deburr sharp edges with a file, wear goggles, and never blow or wipe away swarf by hand.'), focus: 'punch', s: { m: 'punch' } }
    ],
    apply(s){ st.m = s.m; t = 0; },
    update(dt){ t += dt; const m = st.m; v.jaw.position.x = ease(v.jaw.position.x, m === 'idle' ? .08 : 0, dt, 4);
      const fp = Math.sin(t * 3); file.visible = m === 'file'; file.position.set(-.3 + fp * .12, .53, -.2); file.rotation.set(0, .1, 0);
      saw.visible = m === 'saw'; saw.position.set(-.05 + fp * .15, .47 - (t % 6) * .008, -.2); saw.rotation.set(0, 1.15, 0);
      scrb.position.set(m === 'mark' ? .55 + ((t * .3) % .25) : .6, .03, m === 'mark' ? .25 : .35);
      punch.position.y = m === 'punch' ? .12 : .07; ham.position.set(m === 'punch' ? 1.0 : 1.1, m === 'punch' ? .25 + Math.max(0, Math.sin(t * 4)) * .1 : .02, m === 'punch' ? .25 : 0); ham.rotation.z = m === 'punch' ? -.3 : 0;
      dust.forEach(d => { const ph = (d.userData.ph + t) % 1; d.visible = m === 'file' || m === 'saw'; d.position.set(-.3 + (Math.random() - .5) * .1, .45 - ph * .4, -.12); });
    }
  };
}

/* ---------- أدوات القياس الميكانيكية ---------- */
function buildMeasuring(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const cal = new THREE.Group(); cal.position.set(-.55, .28, 0); cal.scale.setScalar(2.4); root.add(cal);
  cal.add(box(.6, .03, .008, M(0xc9ced6, { m: .9 }))); cal.add(at(box(.02, .12, .008, M(0xc9ced6, { m: .9 })), -.29, -.06, 0)); const sl = new THREE.Group(); cal.add(sl); sl.add(box(.1, .05, .012, M(0xb9c0c8, { m: .8 }))); sl.add(at(box(.02, .12, .008, M(0xc9ced6, { m: .9 })), -.04, -.06, 0));
  const obj = cyl(.04, .04, .05, M(0xd9a441, { m: .6 }), 20); obj.rotation.x = Math.PI / 2; obj.position.set(-.255, -.08, 0); cal.add(obj);
  const vsc = makeCanvas(.6, .18, 640); vsc.mesh.scale.setScalar(1.9); vsc.mesh.position.set(-.55, .95, -1.2); root.add(vsc.mesh);
  const mic = makeMicrometer(); mic.scale.setScalar(1.8); mic.position.set(.55, .35, -.2); root.add(mic); const mob = cyl(.03, .03, .06, M(0xd9a441, { m: .6 }), 16); mob.rotation.z = Math.PI / 2; mob.position.set(.55, .35, -.2); root.add(mob);
  const msc = makeCanvas(.6, .2, 640); msc.mesh.scale.setScalar(1.6); msc.mesh.position.set(.65, .95, -1.2); root.add(msc.mesh);
  const dial = makeGauge('#2a62c9', 0, 100, [0, 25, 50, 75], '0.01mm'); dial.group.scale.setScalar(.5); dial.group.position.set(1.15, .42, .25); root.add(dial.group); const disc = cyl(.15, .15, .03, M(0x9aa0a6, { m: .7 }), 28); disc.position.set(1.15, .08, .4); root.add(disc); const stem = cyl(.006, .006, .15, M(0xc9ced6, { m: .9 }), 8); stem.position.set(1.15, .2, .3); root.add(stem);
  const rd = readout(.9, .14); rd.mesh.position.set(.05, 1.45, -1.5); root.add(rd.mesh);
  part('cal', cal, V(0, .05, 0), L('القدمة ذات الورنية', 'Vernier caliper'), L('دقتها 0.02 مم. دوس عليها تغيّر المقاس.', 'Reads to 0.02 mm. Tap to change the part.'));
  part('mic', mic, V(.2, .05, 0), L('الميكرومتر', 'Micrometer'), L('دقته 0.01 مم.', 'Reads to 0.01 mm.'));
  part('dial', dial.group, V(0, .3, 0), L('ساعة القياس (الدايل)', 'Dial indicator'), L('بتقيس الانحراف والترخيم.', 'Measures run-out and deflection.'));
  const SIZES = [[24.36, 24, 0.36], [18.50, 18, 0.50], [31.08, 31, 0.08]]; const st = { m: 'cal', k: 0 }; let t = 0;
  ctx.parts.cal.tap = () => { st.k = (st.k + 1) % SIZES.length; return L(`القراءة ${SIZES[st.k][0].toFixed(2)} مم`, `Reading ${SIZES[st.k][0].toFixed(2)} mm`); };
  const drawV = () => vsc.draw((x, W, H) => { x.fillStyle = '#f4f6f8'; x.fillRect(0, 0, W, H); const [v, mainV, frac] = SIZES[st.k]; const px = 10; x.strokeStyle = '#111'; x.fillStyle = '#111'; x.font = '18px monospace'; x.textAlign = 'center';
    for(let i = 0; i <= 60; i++){ const xx = 20 + i * px; x.beginPath(); x.moveTo(xx, 10); x.lineTo(xx, i % 10 === 0 ? 50 : i % 5 === 0 ? 40 : 32); x.stroke(); if(i % 10 === 0) x.fillText(String(i), xx, 70); }
    const z = 20 + v * px; x.fillStyle = '#e0a400'; x.fillRect(z - 1, 80, 2, 10); for(let j = 0; j <= 50; j++){ const xx = z + j * px * .98; const hit = j === Math.round(frac / .02); x.strokeStyle = hit ? '#d0021b' : '#111'; x.lineWidth = hit ? 3 : 1.5; x.beginPath(); x.moveTo(xx, 120); x.lineTo(xx, j % 5 === 0 ? 85 : 95); x.stroke(); }
    x.fillStyle = '#d0021b'; x.font = 'bold 22px monospace'; x.textAlign = 'left'; x.fillText(`${mainV} + ${frac.toFixed(2)} = ${v.toFixed(2)} mm`, 14, H - 12); });
  const drawM = () => msc.draw((x, W, H) => { x.fillStyle = '#f4f6f8'; x.fillRect(0, 0, W, H); x.fillStyle = '#111'; x.font = 'bold 24px Tahoma'; x.textAlign = 'center'; x.fillText(L('الجلبة: 7.5 مم  +  الطنبورة: 0.28 مم', 'Sleeve: 7.5 mm  +  thimble: 0.28 mm'), W / 2, 50); x.fillStyle = '#d0021b'; x.font = 'bold 40px monospace'; x.fillText('= 7.78 mm', W / 2, 110); });
  drawV(); drawM();
  return {
    ...ctx, view: V(.05, .7, 1.4), sway: true, hint: L('دوس على القدمة تغيّر المقاس', 'Tap the caliper to change the part'),
    steps: [
      { title: L('أدوات القياس الميكانيكية', 'Mechanical measuring tools'), text: L('في صيانة العربيات القياسات صغيرة جدًا ومهمة: القدمة (الورنية) بدقة 0.02 مم، والميكرومتر بدقة 0.01 مم، وساعة القياس للانحراف، والفيلر للخلوصات. نضّف الأداة والقطعة، واتأكد إنها على الصفر قبل القياس.', 'Automotive measurements are tiny and critical: the vernier caliper reads to 0.02 mm, the micrometer to 0.01 mm, the dial indicator measures run-out and feeler gauges check clearances. Clean the tool and the part and check zero before measuring.'), s: { m: 'cal' } },
      { title: L('القدمة ذات الورنية', 'The vernier caliper'), text: L('اقرا الرقم الصحيح على المسطرة الأساسية قبل صفر الورنية، وبعدين دوّر على شرطة الورنية اللي ماشية مع شرطة على المسطرة بالظبط (الحمرا)، وكل شرطة = 0.02 مم. الاتنين مع بعض = القراءة. دوس على القدمة تجرب مقاسات تانية.', 'Read the whole millimetres on the main scale before the vernier zero, then find the vernier line that aligns exactly with a main-scale line (red); each line is 0.02 mm. Add them for the reading. Tap the caliper to try other sizes.'), focus: 'cal', s: { m: 'cal' } },
      { title: L('الميكرومتر', 'The micrometer'), text: L('لف الطنبورة لحد ما الفكين يلمسوا القطعة، وكمّل بالسقاطة لحد ما تطقطق (عشان الضغط يبقى ثابت). اقرا الجلبة: كل شرطة 0.5 مم، وبعدين الطنبورة: كل شرطة 0.01 مم. هنا 7.5 + 0.28 = 7.78 مم.', 'Turn the thimble until the faces touch the part, then use the ratchet until it clicks for constant pressure. Read the sleeve (each line 0.5 mm) and then the thimble (each line 0.01 mm): here 7.5 + 0.28 = 7.78 mm.'), focus: 'mic', s: { m: 'mic' } },
      { title: L('ساعة القياس', 'The dial indicator'), text: L('بتتثبّت على قاعدة مغناطيس، وطرفها يلمس القطعة، وتتصفّر. لف القطعة: الإبرة بتبيّن الانحراف (هنا 0.04 مم). بتستخدم لقياس انحراف ديسك الفرامل، واستقامة عمود الكرنك، والخلوص في التروس.', 'Mounted on a magnetic base, its plunger touches the part and it is zeroed. Rotate the part and the needle shows the run-out (0.04 mm here). Used for brake disc run-out, crankshaft straightness and gear backlash.'), focus: 'dial', s: { m: 'dial' } }
    ],
    apply(s){ st.m = s.m; },
    update(dt){ t += dt; const v = SIZES[st.k][0]; sl.position.x = -.29 + .04 + v / 100 * .5; obj.scale.set(v / 24, 1, v / 24); obj.position.x = -.29 + .02 + v / 200 * .5;
      if(vsc.mesh.userData.k !== st.k){ vsc.mesh.userData.k = st.k; drawV(); } disc.rotation.y += st.m === 'dial' ? dt * 1.5 : 0; dial.set(st.m === 'dial' ? 50 + Math.sin(t * 1.5) * 4 : 50); dial.update(dt);
      rd.setText(st.m === 'cal' ? L(`القدمة: ${v.toFixed(2)} مم`, `Caliper: ${v.toFixed(2)} mm`) : st.m === 'mic' ? L('الميكرومتر: 7.78 مم', 'Micrometer: 7.78 mm') : st.m === 'dial' ? L('الانحراف: 0.04 مم', 'Run-out: 0.04 mm') : '');
    }
  };
}

/* ---------- التخريم والقلوظة ---------- */
function buildThreads(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const plate = box(.6, .1, .4, M(0x9aa0a6, { m: .7 })); plate.position.set(-.5, .05, -.25); root.add(plate);
  const hole = cyl(.042, .042, .102, M(0x1d2128), 20); hole.position.set(-.5, .05, -.25); root.add(hole);
  const cs = new THREE.Mesh(new THREE.ConeGeometry(.07, .03, 20, 1, true), M(0x3a3f46, { side: THREE.DoubleSide })); cs.rotation.x = Math.PI; cs.position.set(-.5, .09, -.25); root.add(cs);
  const drill = new THREE.Group(); root.add(drill); drill.add(at(cyl(.042, .042, .4, M(0xc9a24a, { m: .8 }), 12), 0, .2, 0)); drill.add(tube(helixX(0, .35, .042, 6), .008, M(0x8a6a2a, { m: .8 }), 90).rotateZ(Math.PI / 2));
  const tap = new THREE.Group(); root.add(tap); tap.add(at(cyl(.05, .05, .25, M(0xc9ced6, { m: .9 }), 6), 0, .125, 0)); tap.add(tube(helixX(0, .2, .05, 8), .006, M(0x9aa0a6, { m: .9 }), 120).rotateZ(Math.PI / 2)); const wr = box(.5, .03, .03, M(0x2b3038)); wr.position.y = .3; tap.add(wr);
  const rod = cyl(.05, .05, .5, M(0x9aa0a6, { m: .7 }), 20); rod.position.set(.6, .25, -.25); root.add(rod); const thr = tube(helixX(0, .25, .052, 10), .006, M(0xc9ced6, { m: .9 }), 160); thr.rotation.z = Math.PI / 2; thr.position.set(.6, .25, -.25); root.add(thr);
  const die = new THREE.Group(); root.add(die); die.add(cyl(.12, .12, .06, M(0x3a3f46, { m: .6 }), 24)); die.add(at(box(.7, .025, .025, M(0x2b3038)), 0, 0, 0));
  const rd = readout(.9, .14); rd.mesh.position.set(.0, 1.2, -1.5); root.add(rd.mesh);
  part('plate', plate, V(0, .1, .2), L('الشغلانة', 'Workpiece'), ''); part('drill', drill, V(0, .45, 0), L('بنطة التخريم', 'Tapping drill'), L('مقاسها أقل من المسمار.', 'Smaller than the thread size.'));
  part('tap', tap, V(0, .4, 0), L('الذكر ويد الذكر', 'Tap and wrench'), L('بيعمل السنّ الداخلي (القلوظة الداخلية).', 'Cuts an internal thread.')); part('die', die, V(0, .1, 0), L('اللقمة ويدها', 'Die and stock'), L('بتعمل السنّ الخارجي على العامود.', 'Cuts an external thread on a rod.'));
  const st = { m: 'drill' }; let t = 0;
  return {
    ...ctx, view: V(.05, .7, 1.4), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('التخريم والقلوظة', 'Drilling and threading'), text: L('في العربيات بنحتاج نصلّح سنّ مسمار باظ أو نعمل سنّ جديد. الخطوات: تخريم بالبنطة الصح، وشنكرة (توسيع بسيط لبوز الخرم)، وقلوظة داخلية بالذكر، أو خارجية باللقمة.', 'In car work you often repair a stripped thread or cut a new one. The steps: drill with the correct size, countersink the hole mouth, then cut an internal thread with a tap or an external one with a die.'), s: { m: 'drill' } },
      { title: L('اختيار البنطة والتخريم', 'Tapping drill and drilling'), text: L('بنطة التخريم = قطر المسمار − الخطوة. لمسمار M10 × 1.5 البنطة 8.5 مم، ولـ M8 × 1.25 البنطة 6.8 مم. اعمل نقرة بالسنبك، وثبّت الشغلانة، وخرّم عمودي بسرعة مناسبة وسائل تبريد.', 'Tapping drill = thread diameter − pitch: 8.5 mm for M10 × 1.5 and 6.8 mm for M8 × 1.25. Centre punch, clamp the work and drill square at the right speed with cutting fluid.'), focus: 'drill', s: { m: 'drill' } },
      { title: L('الشنكرة (التوسيع المخروطي)', 'Countersinking'), text: L('بنعمل شطفة بسيطة على بوز الخرم بالشنكار (بنطة 90 درجة)، عشان الذكر يبدأ مستقيم، وأول سنّة ما تتقشرش، ورأس المسمار المخروطي يقعد مستوي.', 'A light chamfer is cut at the hole mouth with a 90° countersink so the tap starts square, the first thread does not burr and a countersunk screw sits flush.'), focus: 'plate', s: { m: 'cs' } },
      { title: L('القلوظة الداخلية بالذكر', 'Internal threading with a tap'), text: L('الذكور 3: الأول مسلوب للبداية، والتاني، والتالت للتشطيب. ركّب الذكر في اليد وابدأ عمودي، ولف لفة لقدّام ونص لفة لورا عشان الرايش يتكسر، واستخدم زيت. لو حسيت بتقل وقّف، لأن الذكر سهل ينكسر.', 'Taps come in three: taper to start, second and plug to finish. Start square in the wrench, turn one turn forward and half a turn back to break the chip, using cutting oil. Stop if it binds: taps snap easily.'), focus: 'tap', s: { m: 'tap' } },
      { title: L('القلوظة الخارجية باللقمة', 'External threading with a die'), text: L('اعمل شطفة على طرف العامود، وركّب اللقمة في يدها والجانب المسلوب لتحت، وابدأ عمودي على العامود. نفس الطريقة: لفة لقدّام ونص لورا وزيت. جرّب الصامولة على السنّ في الآخر.', 'Chamfer the rod end, fit the die in its stock with the tapered side down and start square to the rod. Same method: one turn forward, half back, with oil. Finish by trying a nut on the thread.'), focus: 'die', s: { m: 'die' } }
    ],
    apply(s){ st.m = s.m; t = 0; },
    update(dt){ t += dt; const m = st.m; const f = Math.min(1, (t % 6) / 4.5);
      drill.visible = m === 'drill'; drill.position.set(-.5, .12 + (1 - f) * .3 - f * .1, -.25); drill.rotation.y += dt * 20; hole.visible = m !== 'drill' || f > .9; cs.visible = m !== 'drill';
      tap.visible = m === 'tap'; const fwd = Math.floor(t * 2) % 3 === 2 ? -1 : 1; tap.rotation.y += dt * 2 * fwd; tap.position.set(-.5, .1 + (1 - f) * .15, -.25);
      die.visible = m === 'die'; die.position.set(.6, .5 - f * .35, -.25); die.rotation.y += dt * 2 * fwd; thr.scale.set(m === 'die' ? Math.max(.01, f) : 1, 1, 1); thr.position.y = m === 'die' ? .5 - f * .25 : .25;
      rd.setText(m === 'drill' ? L('M10 × 1.5 ← بنطة 8.5 مم', 'M10 × 1.5 → 8.5 mm drill') : m === 'tap' || m === 'die' ? (fwd > 0 ? L('لفة لقدّام', 'One turn forward') : L('نص لفة لورا', 'Half turn back')) : m === 'cs' ? L('شنكار 90°', '90° countersink') : '');
    }
  };
}

function drawShopSign(k, txt){ return (x, W, H) => {
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); const cx = W / 2, cy = H * .4, r = W * .3; x.lineJoin = 'round';
  const blue = () => { x.fillStyle = '#1565c0'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.fillStyle = '#fff'; x.strokeStyle = '#fff'; };
  if(k === 'warn'){ x.fillStyle = '#f5c518'; x.strokeStyle = '#111'; x.lineWidth = 12; x.beginPath(); x.moveTo(cx, cy - r * 1.15); x.lineTo(cx + r * 1.2, cy + r * .9); x.lineTo(cx - r * 1.2, cy + r * .9); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#111'; x.beginPath(); x.arc(cx, cy + 10, 26, 0, 7); x.fill(); x.fillStyle = '#f5c518'; x.beginPath(); x.arc(cx, cy + 10, 10, 0, 7); x.fill(); x.fillStyle = '#111'; for(let i = 0; i < 8; i++){ x.save(); x.translate(cx, cy + 10); x.rotate(i * Math.PI / 4); x.fillRect(-6, -36, 12, 14); x.restore(); } }
  else if(k === 'noglove'){ x.fillStyle = '#222'; x.fillRect(cx - 22, cy - 6, 44, 46); [-18, -6, 6].forEach(o => x.fillRect(cx + o, cy - 40, 10, 38)); x.strokeStyle = '#d0021b'; x.lineWidth = 16; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx - r * .7, cy - r * .7); x.lineTo(cx + r * .7, cy + r * .7); x.stroke(); }
  else if(k === 'goggle'){ blue(); x.lineWidth = 10; [-26, 26].forEach(o => { x.beginPath(); x.arc(cx + o, cy, 20, 0, 7); x.stroke(); }); x.beginPath(); x.moveTo(cx - 6, cy); x.lineTo(cx + 6, cy); x.stroke(); }
  else if(k === 'ear'){ blue(); x.lineWidth = 10; x.beginPath(); x.arc(cx, cy + 6, 40, Math.PI, 0); x.stroke(); x.fillRect(cx - 52, cy, 22, 34); x.fillRect(cx + 30, cy, 22, 34); }
  else if(k === 'boots'){ blue(); x.fillRect(cx - 30, cy - 34, 26, 56); x.fillRect(cx - 30, cy + 10, 60, 18); }
  else if(k === 'hair'){ blue(); x.beginPath(); x.arc(cx, cy - 6, 24, 0, 7); x.fill(); x.fillRect(cx - 30, cy + 18, 60, 22); x.fillStyle = '#1565c0'; x.fillRect(cx - 26, cy - 32, 52, 12); }
  else { x.fillStyle = '#1f7a4a'; x.fillRect(cx - r, cy - r, r * 2, r * 2); x.fillStyle = '#fff'; x.fillRect(cx - 10, cy - 34, 20, 68); x.fillRect(cx - 34, cy - 10, 68, 20); }
  x.fillStyle = '#111'; x.font = 'bold 28px "IBM Plex Sans Arabic", Tahoma, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const words = txt.split(' '); let line = '', lines = []; words.forEach(w => { const tt = line ? line + ' ' + w : w; if(x.measureText(tt).width > W - 16){ lines.push(line); line = w; } else line = tt; }); lines.push(line);
  lines.slice(0, 2).forEach((l, i) => x.fillText(l, cx, H * .8 + i * 30 - (lines.length > 1 ? 14 : 0))); }; }
/* شرار التجليخ */
function makeSparks(parent, n = 50){
  const pool = []; for(let i = 0; i < n; i++){ const s = sparkSprite(0xffb347); s.scale.setScalar(.012); s.userData = { noFit: true, life: 0, v: V(0, 0, 0) }; parent.add(s); pool.push(s); }
  let acc = 0, k = 0;
  return { emit(p, rate, dt, dir = V(0, .3, 1)){ acc += rate * dt; while(acc > 1){ acc -= 1; const s = pool[k++ % n]; s.position.copy(p); s.userData.life = .5 + Math.random() * .3; s.userData.v.set(dir.x + (Math.random() - .5) * .4, dir.y + (Math.random() - .3) * .5, dir.z + (Math.random() - .5) * .3).multiplyScalar(1.2); } },
    update(dt){ pool.forEach(s => { const u = s.userData; if(u.life <= 0){ s.material.opacity = 0; return; } u.life -= dt; u.v.y -= 2 * dt; s.position.addScaledVector(u.v, dt); s.material.opacity = Math.min(1, u.life * 2); }); },
    clear(){ pool.forEach(s => { s.userData.life = 0; s.material.opacity = 0; }); } };
}
/* ================= برنامج اللحام وتشكيل المعادن: الدفعة الأولى ================= */
/* ترابيزة لحام حديد فوق المنضدة */
function weldTable(root){ const g = new THREE.Group(); root.add(g); g.add(at(box(1.05, .04, .62, M(0x3a3f46, { m: .6, r: .45 })), 0, .02, -.05)); for(let i = 0; i < 7; i++) g.add(at(box(.012, .002, .6, M(0x2b3038)), -.45 + i * .15, .041, -.05)); g.traverse(o => o.userData.noFit = true); return g; }
/* لوح صاج بشطفة اختيارية: طول على x، عرض على z، تخانة على y */
function weldPlate(len = .5, w = .18, th = .025, bevel = 0){ const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, th); s.lineTo(bevel ? th * .7 : 0, th); s.lineTo(0, bevel ? th * .25 : th); s.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }); geo.translate(0, 0, -len / 2); geo.rotateY(Math.PI / 2); const m = new THREE.Mesh(geo, M(0x8a96a3, { m: .7, r: .4 })); return m; }
const UPV = new THREE.Vector3(0, 1, 0);
/* خط اللحام: حبيبات بتتراكم ورا الإلكترود وتبرد من البرتقالي للرمادي */
function makeBead(parent, r = .011, max = 260){
  const geo = new THREE.SphereGeometry(1, 10, 6); const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: .6, roughness: .45 });
  const im = new THREE.InstancedMesh(geo, mat, max); im.count = 0; im.userData.noFit = true; im.frustumCulled = false; parent.add(im);
  const born = new Float32Array(max), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color(), hot = new THREE.Color(0xffa040), cold = new THREE.Color(0x6b6560), slagC = new THREE.Color(0x4a4036);
  let t = 0, slag = false; const pos = [];
  const api = { im, add(p, scale = 1, n = null){ if(im.count >= max) return; const k = im.count++; born[k] = t; pos[k] = p.clone(); if(n) q.setFromUnitVectors(UPV, n.clone().normalize()); else q.identity(); mtx.compose(p, q, new THREE.Vector3(r * 1.3 * scale, r * .55 * scale, r * scale)); im.setMatrixAt(k, mtx); im.setColorAt(k, hot); im.instanceMatrix.needsUpdate = true; },
    clear(){ im.count = 0; pos.length = 0; }, setSlag(v){ slag = v; }, get count(){ return im.count; },
    update(dt){ t += dt; for(let k = 0; k < im.count; k++){ const a = Math.min(1, (t - born[k]) / 2.5); col.copy(hot).lerp(slag ? slagC : cold, a); if(a < .25) col.multiplyScalar(1.4); im.setColorAt(k, col); } if(im.instanceColor) im.instanceColor.needsUpdate = true; } };
  return api;
}
/* القوس الكهربي: نور أبيض مزرق بيرعش + شرار */
function makeArc(parent, color = 0xcfe6ff){ const g = new THREE.Group(); parent.add(g); const s = sparkSprite(color); s.scale.setScalar(.12); g.add(s); const s2 = sparkSprite(0xffffff); s2.scale.setScalar(.05); g.add(s2); const light = new THREE.PointLight(color, 0, 1.2); g.add(light);
  return { group: g, set(on, t){ const f = on ? .75 + Math.random() * .25 : 0; s.material.opacity = f * .8; s2.material.opacity = f; light.intensity = f * 2.5; s.scale.setScalar(.05 + Math.random() * .03); s2.scale.setScalar(.025); } }; }
/* ماسك الإلكترود */
function makeHolder(){ const g = new THREE.Group(); g.add(at(cyl(.022, .02, .12, M(0x1d2128, { r: .6 }), 12), 0, .06, 0)); g.add(at(box(.04, .03, .03, M(0xd9a441, { m: .6 })), 0, -.01, 0)); const el = new THREE.Group(); el.position.y = -.02; g.add(el); const rod = cyl(.004, .004, 1, M(0x8b6b4a, { r: .7 }), 8); rod.position.y = -.5; el.add(rod); const tip = cyl(.0042, .0042, .015, M(0x3a3f46, { m: .7 }), 8); tip.position.y = -.0075; el.add(tip); return { group: g, el, rod, tip, setLen(L){ rod.scale.y = L; rod.position.y = -L / 2; tip.position.y = -L - .0075; } }; }
/* خوذة اللحام */
function makeHelmet(){ const g = new THREE.Group(), sh = M(0x1d2128, { r: .55 }); const face = new THREE.Mesh(new THREE.CylinderGeometry(.1, .09, .22, 28, 1, true, -Math.PI / 2, Math.PI), M(0x1d2128, { r: .55, side: THREE.DoubleSide })); face.scale.set(1, 1, .8); g.add(face); const top = new THREE.Mesh(new THREE.SphereGeometry(.1, 20, 10, -Math.PI / 2, Math.PI, 0, Math.PI / 2), sh); top.scale.set(1, .5, .8); top.position.y = .11; g.add(top); const chin = new THREE.Mesh(new THREE.SphereGeometry(.09, 20, 10, -Math.PI / 2, Math.PI, Math.PI / 2, Math.PI / 2), sh); chin.scale.set(1, .4, .8); chin.position.y = -.11; g.add(chin);
  const frame = box(.11, .06, .01, M(0x3a3f46)); frame.position.set(0, .03, .075); g.add(frame); const lens = box(.09, .045, .006, M(0x1a5a2a, { m: .3, r: .1 })); lens.position.set(0, .03, .08); g.add(lens); const band = new THREE.Mesh(new THREE.TorusGeometry(.085, .006, 6, 30), M(0x5a6068)); band.rotation.x = Math.PI / 2; band.position.set(0, .06, -.04); g.add(band); [-1, 1].forEach(s2 => g.add(at(cyl(.015, .015, .012, M(0x3a3f46), 12).rotateZ(Math.PI / 2), s2 * .1, .02, 0))); return { group: g, lens }; }
/* أسطوانة غاز */
function makeCyl(col, label_, h = .9, r = .09){ const g = new THREE.Group(); g.add(at(cyl(r, r, h, M(col, { r: .4, m: .2 }), 24), 0, h / 2, 0)); g.add(at(new THREE.Mesh(new THREE.SphereGeometry(r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(col, { r: .4 })), 0, h, 0)); g.add(at(cyl(.025, .03, .07, M(0xc9a24a, { m: .7 }), 12), 0, h + r, 0)); if(label_) g.add(at(label(label_, '#ffffff', .06), 0, h * .6, r + .01)); return g; }

/* ---------- السلامة في ورشة اللحام ---------- */
function buildWeldSafety(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); weldTable(root);
  const hm = makeHelmet(); hm.group.position.set(-.45, .17, .22); root.add(hm.group);
  const gl = new THREE.Group(); gl.position.set(-.3, .02, .32); root.add(gl); [-.05, .05].forEach(x => { gl.add(at(box(.08, .03, .16, M(0xb07a3e, { r: .9 })), x, .015, 0)); gl.add(at(box(.09, .035, .08, M(0xb07a3e, { r: .9 })), x, .02, .11)); });
  
  const scr = new THREE.Group(); scr.position.set(.52, 0, -.15); scr.rotation.y = -.5; root.add(scr); scr.add(at(box(.02, .8, .02, M(0x5a6068)), -.3, .4, 0)); scr.add(at(box(.02, .8, .02, M(0x5a6068)), .3, .4, 0)); scr.add(at(box(.6, .7, .005, M(0xb33a20, { opacity: .55 })), 0, .45, 0));
  const hood = new THREE.Group(); hood.position.set(-.12, .8, -.2); root.add(hood); hood.add(new THREE.Mesh(new THREE.ConeGeometry(.25, .2, 4, 1, true), M(0x9aa0a6, { m: .5, side: THREE.DoubleSide }))); hood.add(at(cyl(.06, .06, .5, M(0x9aa0a6, { m: .5 }), 14), 0, .35, 0));
  const fumes = []; for(let i = 0; i < 16; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xb8b8b0, transparent: true, opacity: 0, depthWrite: false })); s.userData = { ph: i / 16, noFit: true }; root.add(s); fumes.push(s); }
  const cylG = makeCyl(0x2b3038, 'CO₂', .8); cylG.position.set(-.62, 0, -.42); root.add(cylG); const chain = new THREE.Mesh(new THREE.TorusGeometry(.095, .006, 6, 24), M(0xc9ced6, { m: .8 })); chain.rotation.x = Math.PI / 2; chain.position.set(-.62, .55, -.42); root.add(chain);
  const ext = new THREE.Group(); ext.position.set(.38, 0, .3); root.add(ext); ext.add(at(cyl(.07, .07, .4, M(0xc0392b), 16), 0, .2, 0)); ext.add(at(label(L('بودرة', 'Powder'), '#ffffff', .04), 0, .25, .075));
  const pl = weldPlate(.4, .14, .02); pl.position.set(.1, .042, -.01); root.add(pl);
  const hd = makeHolder(); hd.group.position.set(.1, .3, -.08); hd.group.rotation.z = .5; hd.setLen(.2); root.add(hd.group); const arc = makeArc(root); arc.group.position.set(.12, .07, -.08);
  const signs = new THREE.Group(); root.add(signs);
  const SG = [{ k: 'warn', t: L('خطر أشعة القوس', 'Arc radiation') }, { k: 'goggle', t: L('البس قناع اللحام', 'Wear a welding mask') }, { k: 'boots', t: L('البس حذاء السلامة', 'Wear safety boots') }, { k: 'aid', t: L('إسعاف 123', 'First aid 123') }];
  SG.forEach((sg, i) => { const c = makeCanvas(.2, .25, 256); c.draw(drawShopSign(sg.k, sg.t)); c.mesh.position.set(-.33 + i * .22, .6, -.55); signs.add(c.mesh); });
  const rd = readout(.62, .09); rd.mesh.position.set(.25, .98, -.6); root.add(rd.mesh);
  part('helmet', hm.group, V(0, .16, 0), L('قناع اللحام', 'Welding helmet'), L('عدسة غامقة درجة 10–13.', 'Dark lens shade 10–13.')); part('gloves', gl, V(0, .08, 0), L('جوانتي جلد طويل', 'Leather gauntlets'), '');
  part('screen', scr, V(0, .85, 0), L('ستارة اللحام', 'Welding screen'), L('بتحمي اللي حواليك من الأشعة.', 'Protects people nearby.')); part('hood', hood, V(0, .2, 0), L('شفاط الأبخرة', 'Fume extraction'), '');
  part('cyl', cylG, V(0, .95, 0), L('أسطوانة مربوطة بجنزير', 'Chained cylinder'), ''); part('ext', ext, V(0, .45, 0), L('طفاية بودرة', 'Powder extinguisher'), ''); part('signs', signs, V(0, .76, -.55), L('لافتات السلامة', 'Safety signs'), '');
  const st = { m: 'intro', hood: 1 }; let t = 0, sg = -1;
  ctx.parts.signs.tap = () => { sg = (sg + 1) % SG.length; return SG[sg].t; };
  return {
    ...ctx, view: V(.05, .55, 1.45), sway: true, hint: L('دوس على اللافتات تعرف كل واحدة', 'Tap the signs to learn each one'),
    steps: [
      { title: L('مخاطر ورشة اللحام', 'Hazards in the welding shop'), text: L('أخطر 5 حاجات: أشعة القوس (بتحرق العين والجلد في ثواني)، والأبخرة والغازات، والحريق من الشرار، والصعق الكهربي، وأسطوانات الغاز المضغوط. كل خطوة جاية بتوري وسيلة حماية.', 'The five main hazards: arc radiation (burns eyes and skin in seconds), fumes and gases, fire from sparks, electric shock and compressed gas cylinders. Each step shows one protection.'), s: { m: 'intro' } },
      { title: L('حماية العين والجسم', 'Eye and body protection'), text: L('قناع لحام بعدسة غامقة (درجة 10–13 حسب الأمبير)، وعمره ما تبص على القوس بعينك ولو ثانية. جوانتي جلد طويل، ومريلة جلد، وهدوم قطن مقفولة (البوليستر بيسيح ويلزق في الجلد)، وحذاء سلامة.', 'A welding helmet with a dark lens (shade 10–13 depending on current), and never look at the arc with the naked eye even for a second. Long leather gauntlets, a leather apron, closed cotton clothing (polyester melts onto the skin) and safety boots.'), cam: { t: [-.45, .12, .25], d: .34, dir: [.2, .5, 1] }, s: { m: 'ppe' } },
      { title: L('حماية اللي حواليك', 'Protecting others'), text: L('الأشعة بتأذي أي حد قريب، فبنحط ستارة لحام حمرا حوالين مكان الشغل. ولافتات تحذير. ودوس على اللافتات تعرف معناها.', 'Arc rays harm anyone nearby, so red welding screens go round the work area, with warning signs. Tap the signs to learn them.'), cam: { t: [.5, .38, -.15], d: .45, dir: [-.2, .2, 1] }, s: { m: 'screen' } },
      { title: L('الأبخرة والتهوية', 'Fumes and ventilation'), text: L('أبخرة اللحام فيها معادن وغازات مضرة، وخصوصًا من الصاج المجلفن (الزنك). لازم شفاط قريب من مكان اللحام يسحب الدخان بعيد عن وشك، أو مكان متهوّي كويس. شوف الدخان وهو بيتسحب لفوق.', 'Welding fumes contain harmful metals and gases, especially from galvanised sheet (zinc). Use local extraction near the weld to draw the smoke away from your face, or a well-ventilated area. Watch the smoke being drawn up.'), cam: { t: [0, .45, -.15], d: .5, dir: [.3, .25, 1] }, s: { m: 'fume', hood: 1 } },
      { title: L('الحريق والأسطوانات والكهربا', 'Fire, cylinders and electricity'), text: L('شيل أي حاجة بتولّع من حوالين المكان مسافة 10 متر، وخلّي الطفاية قريبة. الأسطوانات واقفة ومربوطة بجنزير، والمحبس مقفول بعد الشغل. الكابلات سليمة من غير قطع، والإيد والهدوم ناشفة عشان الصعق.', 'Clear anything flammable within 10 metres and keep an extinguisher close. Cylinders stand upright, chained, with valves closed after work. Cables must be undamaged, and hands and clothes dry to avoid shock.'), cam: { t: [-.2, .4, -.15], d: .55, dir: [.2, .3, 1] }, s: { m: 'fire' } }
    ],
    apply(s){ Object.assign(st, { hood: 1 }, s); t = 0; },
    update(dt){ t += dt; const on = (t % 3) < 2.2; arc.set(on, t); hd.group.position.x = .1 + ((t % 3) / 3) * .2; arc.group.position.x = hd.group.position.x + .02;
      fumes.forEach(s => { const ph = (s.userData.ph + t * .35) % 1; const toHood = st.m === 'fume'; s.position.set(arc.group.position.x + Math.sin(ph * 7 + s.userData.ph * 9) * .06 * (1 - ph), .1 + ph * (toHood ? .95 : .6), -.08 - (toHood ? ph * .32 : 0)); s.scale.setScalar(.06 + ph * .2); s.material.opacity = on ? (1 - ph) * .4 : 0; });
      hm.lens.material.emissive.setRGB(on && st.m === 'ppe' ? .05 : 0, on && st.m === 'ppe' ? .25 : 0, on && st.m === 'ppe' ? .08 : 0);
      rd.setText({ intro: L('قوس + أبخرة + شرار + كهربا + غاز', 'Arc + fumes + sparks + electricity + gas'), ppe: L('عدسة 10–13 · جلد · قطن', 'Shade 10–13 · leather · cotton'), screen: L('ستارة حمرا حوالين المكان', 'Red screens around the area'), fume: L('الشفاط بيسحب الدخان', 'Extraction draws the smoke away'), fire: L('10 م من غير مواد بتولّع · طفاية قريبة', '10 m clear · extinguisher close') }[st.m]);
    }
  };
}

/* ---------- الأكسي أستيلين: الغازات والأسطوانات واللهب ---------- */
function buildOxy(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); weldTable(root);
  const trolley = new THREE.Group(); trolley.position.set(-.58, 0, -.42); root.add(trolley); const ox = makeCyl(0x2b3038, 'O₂', .95, .08), ac = makeCyl(0x7a1f2b, 'C₂H₂', .85, .09); ox.position.x = -.1; ac.position.x = .11; trolley.add(ox); trolley.add(ac);
  const gO = makeGauge('#2a62c9', 0, 10, [0, 2, 4, 6, 8, 10], 'bar'), gA = makeGauge('#d0021b', 0, 2, [0, .5, 1, 1.5, 2], 'bar'); [gO, gA].forEach((g, i) => { g.group.scale.setScalar(.16); g.group.position.set(i ? .11 : -.1, i ? 1.04 : 1.13, .1); trolley.add(g.group); });
  const fa = [-1, 1].map(s => { const f = cyl(.012, .012, .05, M(0xd9a441, { m: .7 }), 10); f.rotation.z = Math.PI / 2; f.position.set(-.25, .11, -.02 + s * .02); root.add(f); return f; });
  root.add(tube(CR([V(-.68, 1.0, -.32), V(-.45, .3, -.1), V(-.25, .11, -.04)]), .007, M(0x2a62c9), 30)); root.add(tube(CR([V(-.47, .92, -.32), V(-.38, .3, -.06), V(-.25, .11, 0)]), .007, M(0xd0021b), 30));
  const torch = new THREE.Group(); root.add(torch); { const og = makeGlove(); og.position.set(-.02, 0, 0); torch.add(og); } torch.add(at(cyl(.014, .014, .18, M(0xc9a24a, { m: .7 }), 12).rotateZ(Math.PI / 2), 0, 0, 0)); const neck = cyl(.005, .005, .1, M(0xc9a24a, { m: .7 }), 8); neck.rotation.z = Math.PI / 2 - .7; neck.position.set(.12, -.03, 0); torch.add(neck); [-1, 1].forEach(s => torch.add(at(cyl(.01, .01, .012, M(s < 0 ? 0x2a62c9 : 0xd0021b), 10).rotateX(Math.PI / 2), -.06, 0, s * .016)));
  const flame = new THREE.Group(); torch.add(flame); flame.position.set(.16, -.065, 0); flame.rotation.z = -.7 - Math.PI / 2;
  const outer = new THREE.Mesh(new THREE.ConeGeometry(.012, .1, 14, 1, true), new THREE.MeshBasicMaterial({ color: 0x6aa8ff, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); outer.position.y = -.05; outer.rotation.x = Math.PI; flame.add(outer);
  const inner = new THREE.Mesh(new THREE.ConeGeometry(.005, .02, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); inner.position.y = -.01; inner.rotation.x = Math.PI; flame.add(inner);
  const feather = new THREE.Mesh(new THREE.ConeGeometry(.007, .05, 12), new THREE.MeshBasicMaterial({ color: 0xfff1d0, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false })); feather.position.y = -.03; feather.rotation.x = Math.PI; flame.add(feather);
  [outer, inner, feather].forEach(o => o.userData.noFit = true);
  const flm = makeCanvas(.58, .35, 768); flm.mesh.position.set(.42, .42, -.5); flm.mesh.scale.setScalar(.62); root.add(flm.mesh);
  const pl = weldPlate(.5, .2, .008); pl.position.set(.2, .042, .05); root.add(pl); const bead = makeBead(root, .006); const rodF = cyl(.0022, .0022, .4, M(0xd9a441, { m: .7 }), 6); root.add(rodF);
  const rd = readout(.62, .09); rd.mesh.position.set(0, .72, -.55); root.add(rd.mesh);
  part('cyls', trolley, V(0, 1.2, 0), L('أسطوانات الأكسجين والأستيلين', 'Oxygen and acetylene cylinders'), ''); part('gauges', gA.group, V(0, .2, 0), L('المانومترات', 'Regulators'), L('أستيلين أقل من 1 بار.', 'Acetylene under 1 bar.'));
  part('fa', fa[0], V(0, .04, 0), L('مانع الارتداد', 'Flashback arrestor'), ''); part('torch', torch, V(0, .05, 0), L('البوري (لمبة اللحام)', 'Blowpipe (torch)'), L('دوس عليه تغيّر اللهب.', 'Tap to change the flame.')); part('flame', flm.mesh, V(0, .27, 0), L('أنواع اللهب', 'Flame types'), '');
  const FL = ['carb', 'neutral', 'oxid']; const st = { m: 'gases', fl: 1 }; let t = 0, last = -1;
  ctx.parts.torch.tap = () => { st.fl = (st.fl + 1) % 3; drawF(); return [L('لهب كربوني: أستيلين زيادة', 'Carburising: excess acetylene'), L('لهب متعادل: للحام الصلب', 'Neutral: for welding steel'), L('لهب مؤكسد: أكسجين زيادة', 'Oxidising: excess oxygen')][st.fl]; };
  const drawF = () => flm.draw((x, W, H) => { x.fillStyle = '#0d1b2e'; x.fillRect(0, 0, W, H); const names = [L('كربوني (مختزل)', 'Carburising'), L('متعادل', 'Neutral'), L('مؤكسد', 'Oxidising')]; const uses = [L('تقسية سطحية · ألومنيوم', 'Hard-facing · aluminium'), L('لحام الصلب', 'Welding steel'), L('لحام النحاس الأصفر', 'Brazing brass')];
    names.forEach((n, i) => { const cy = 70 + i * 120; const on = i === st.fl; x.globalAlpha = on ? 1 : .45; x.fillStyle = '#6aa8ff'; x.beginPath(); x.ellipse(330, cy, 210, 28, 0, 0, 7); x.fill(); if(i === 0){ x.fillStyle = '#fff1d0'; x.beginPath(); x.ellipse(220, cy, 100, 18, 0, 0, 7); x.fill(); } x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(140, cy, i === 2 ? 22 : 34, 12, 0, 0, 7); x.fill(); x.fillStyle = on ? '#ffd34d' : '#cfd6de'; x.font = 'bold 26px Tahoma'; x.textAlign = 'right'; x.fillText(n, W - 20, cy - 4); x.font = '20px Tahoma'; x.fillText(uses[i], W - 20, cy + 26); x.globalAlpha = 1; }); });
  drawF();
  return {
    ...ctx, view: V(.05, .5, 1.45), sway: true, hint: L('دوس على البوري تغيّر نوع اللهب', 'Tap the blowpipe to change the flame'),
    steps: [
      { title: L('الغازات والأسطوانات', 'Gases and cylinders'), text: L('الأستيلين غاز وقود بيولّع، والأكسجين بيساعد على الاشتعال، ولهبهم مع بعض حوالي 3100 درجة. أسطوانة الأستيلين لونها ماروني (أحمر غامق) ولازم واقفة دايمًا، والأكسجين أسود أو أزرق حسب المواصفة. ممنوع زيت أو شحم على وصلات الأكسجين لأنه ممكن ينفجر.', 'Acetylene is the fuel gas and oxygen supports combustion; together the flame reaches about 3100 °C. The acetylene cylinder is maroon and must always stand upright; oxygen is black or blue depending on the standard. Never put oil or grease on oxygen fittings: it can explode.'), cam: { t: [-.58, .6, -.42], d: .5, dir: [.2, .3, 1] }, s: { m: 'gases' } },
      { title: L('المانومترات والخراطيم ومانع الارتداد', 'Regulators, hoses and flashback arrestors'), text: L('على كل أسطوانة منظم بمانومترين: ضغط الأسطوانة وضغط الشغل. الأستيلين لا يزيد عن 1 بار (حوالي 0.5)، والأكسجين 2–3 بار. الخرطوم الأحمر للأستيلين والأزرق للأكسجين، وعند البوري موانع ارتداد اللهب عشان النار ما ترجعش للأسطوانة.', 'Each cylinder has a regulator with two gauges: cylinder pressure and working pressure. Acetylene never above 1 bar (about 0.5), oxygen 2–3 bar. Red hose for acetylene, blue for oxygen, with flashback arrestors at the blowpipe so a flame cannot travel back to the cylinder.'), cam: { t: [-.58, 1.06, -.32], d: .32, dir: [.1, .1, 1] }, s: { m: 'regs' } },
      { title: L('إشعال وإطفاء البوري', 'Lighting and shutting down'), text: L('الإشعال: افتح محبس الأستيلين شوية وولّع بالولاعة (مش بالكبريت)، وبعدين زوّد الأكسجين بالتدريج. الإطفاء بالعكس: اقفل الأستيلين الأول وبعدين الأكسجين. وبعد الشغل اقفل محابس الأسطوانات وفرّغ الخراطيم.', 'Lighting: open the acetylene valve slightly and light with a spark lighter (not matches), then add oxygen gradually. Shutting down is the reverse: acetylene first, then oxygen. After work close the cylinder valves and bleed the hoses.'), cam: { t: [-.05, .25, -.05], d: .34, dir: [.35, .3, 1] }, s: { m: 'light' } },
      { title: L('أنواع اللهب', 'Flame types'), text: L('الكربوني: أستيلين زيادة، وفيه ريشة بيضا طويلة. المتعادل: الريشة اختفت والمخروط الأبيض واضح ومحدد، ودا اللي بنلحم بيه الصلب. المؤكسد: أكسجين زيادة، والمخروط قصير ومدبّب وصوته عالي. دوس على البوري تغيّر.', 'Carburising: excess acetylene, with a long white feather. Neutral: the feather has gone and the inner cone is sharp and clear — used for welding steel. Oxidising: excess oxygen, a short pointed cone and a hissing sound. Tap the blowpipe to change.'), cam: { t: [.15, .32, -.25], d: .45, dir: [.1, .2, 1] }, s: { m: 'flame' } },
      { title: L('اللحام بالأكسي أستيلين على الصاج', 'Gas welding thin sheet'), text: L('بلهب متعادل، المخروط الأبيض على بعد 2–3 مم من الصاج، والبوري مايل 45°. نسيّح بركة، ونغمس سلك الإضافة في حافتها، ونتقدم بانتظام. على صاج 1.5 مم ممكن نلحم من غير سلك (لحام ذاتي) أو بعد ما نثني حروف الصاج.', 'With a neutral flame, inner cone 2–3 mm from the sheet and the blowpipe at 45°, form a pool, dip the filler rod into its edge and move steadily. On 1.5 mm sheet you can fuse without filler (autogenous) or after flanging the edges.'), cam: { t: [.2, .07, -.05], d: .36, dir: [.3, .5, 1] }, s: { m: 'weld' } }
    ],
    apply(s){ st.m = s.m; t = 0; last = -1; bead.clear(); bead.setSlag(false); if(s.m === 'flame') st.fl = 1; drawF(); },
    update(dt){ t += dt; const m = st.m; const T = 7, cyc = Math.floor(t / T), f = (t % T) / T; if(cyc !== last){ last = cyc; bead.clear(); }
      let fl = st.fl, lit = true; if(m === 'light'){ const k = (t % 6) / 6; lit = k > .15 && k < .9; fl = k < .45 ? 0 : 1; } if(m === 'gases' || m === 'regs') lit = false;
      flame.visible = lit; inner.scale.set(1, fl === 2 ? .6 : 1, 1); feather.visible = fl === 0; outer.scale.set(1, fl === 0 ? 1.2 : 1, 1);
      const weld = m === 'weld'; const k = Math.min(1, f / .85); const x = .02 + k * .38;
      torch.position.set(weld ? x - .16 : -.05, weld ? .13 : .25, -.05); torch.rotation.z = weld ? 0 : .2; if(weld && k < 1){ if(Math.random() < .6) bead.add(V(x, .052, -.05), .9); } rodF.visible = weld; rodF.position.set(x + .1, .08, -.05); rodF.rotation.z = Math.PI / 2 - .6; bead.update(dt);
      gO.set(m === 'regs' ? Math.min(2.5, t) : lit ? 2.5 : 0); gA.set(m === 'regs' ? Math.min(.5, t * .2) : lit ? .5 : 0); gO.update(dt); gA.update(dt);
      rd.setText({ gases: L('أستيلين ماروني واقف · ممنوع الزيت على الأكسجين', 'Acetylene maroon, upright · no oil on oxygen'), regs: L('أستيلين 0.5 بار · أكسجين 2.5 بار', 'Acetylene 0.5 bar · oxygen 2.5 bar'), light: L(lit ? (fl === 0 ? 'أستيلين لوحده الأول' : 'زوّدنا الأكسجين: متعادل') : 'الإطفاء: الأستيلين الأول', lit ? (fl === 0 ? 'Acetylene alone first' : 'Oxygen added: neutral') : 'Shut down: acetylene first'), flame: [L('كربوني', 'Carburising'), L('متعادل ✓', 'Neutral ✓'), L('مؤكسد', 'Oxidising')][st.fl], weld: L('مخروط 2–3 مم من الصاج · 45°', 'Cone 2–3 mm from sheet · 45°') }[m]);
    }
  };
}
/* ================= اللحام: أجهزة حقيقية مختلفة (MMA · CO₂ · TIG) ولقطات قريبة ================= */
/* توجيه عدة: الطرف عند p، المحور +Y على d، والمقبض (+X) ناحية h */
function orientTool(g, p, d, h = V(1, 0, 0)){ const Y = d.clone().normalize(); const X = h.clone().sub(Y.clone().multiplyScalar(h.dot(Y))).normalize(); const Z = new THREE.Vector3().crossVectors(X, Y); g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z)); g.position.copy(p); }
/* نقطة في جسم ← إحداثيات الـ root */
function relTo(root, obj, v){ obj.updateWorldMatrix(true, false); return root.worldToLocal(obj.localToWorld(v.clone())); }
/* كابل بيتحرك مع العدة */
function dynCable(root, color = 0x1d2128, r = .007){ const m = new THREE.Mesh(new THREE.BufferGeometry(), M(color, { r: .6 })); m.userData.noFit = true; m.frustumCulled = false; root.add(m); let last = '';
  return { mesh: m, set(pts){ const key = pts.map(p => p.x.toFixed(3) + p.y.toFixed(3) + p.z.toFixed(3)).join(); if(key === last) return; last = key; m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, r, 7); } }; }
/* نقط نور ماشية على مسار (تيار أو سلك) */
function flowDots(root, n = 14, color = 0xffd34d, size = .012){ const S = []; for(let i = 0; i < n; i++){ const s = sparkSprite(color); s.scale.setScalar(size); s.userData.noFit = true; root.add(s); S.push(s); }
  return { update(curve, t, on, speed = .35){ S.forEach((s, i) => { if(!on || !curve){ s.material.opacity = 0; return; } const u = ((i / n) + t * speed) % 1; s.position.copy(curve.getPointAt(u)); s.material.opacity = .95; }); } }; }
/* جوانتي جلد ماسك حاجة */
function makeGlove(col = 0xb07a3e, cuffCol = col){ const g = new THREE.Group(), lm = M(col, { r: .9 }), cm = M(cuffCol, { r: .9 }); const fist = new THREE.Mesh(new THREE.SphereGeometry(.035, 14, 10), lm); fist.scale.set(1.25, .9, 1); g.add(fist); for(let i = 0; i < 4; i++){ const f = cyl(.009, .009, .03, lm, 8); f.rotation.x = Math.PI / 2; f.position.set(-.03 + i * .02, -.02, .03); g.add(f); } const cuff = cyl(.04, .05, .09, cm, 16); cuff.rotation.z = Math.PI / 2; cuff.position.x = .07; g.add(cuff); g.scale.setScalar(.6); g.traverse(o => o.userData.noFit = true); return g; }
/* طارة بمؤشر */
function makeKnob(r = .028, col = 0x1d2128){ const g = new THREE.Group(); const k = cyl(r, r * 1.08, .02, M(col, { r: .4 }), 28); k.rotation.x = Math.PI / 2; k.position.z = .01; g.add(k); const grip = cyl(r * .55, r * .55, .012, M(0x3a3f46), 20); grip.rotation.x = Math.PI / 2; grip.position.z = .024; g.add(grip); const ptr = box(.005, r * .8, .004, new THREE.MeshBasicMaterial({ color: 0xffffff })); ptr.position.set(0, r * .45, .031); g.add(ptr);
  const ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.15, r * 1.35, 32), new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0 })); ring.position.z = .002; g.add(ring); return { group: g, set(v){ g.children[0].rotation.y = 0; g.rotation.z = Math.PI * .75 - v * Math.PI * 1.5; ring.rotation.z = -g.rotation.z; }, glow(on, t){ ring.material.opacity = on ? .5 + .4 * Math.sin(t * 6) : 0; } }; }
/* شاشة رقمية */
function makeDisplay(w, h, col = '#ff5a3c'){ const c = makeCanvas(w, h, 256); let last = ''; return { mesh: c.mesh, set(txt, sub = ''){ const k = txt + '|' + sub; if(k === last) return; last = k; c.draw((x, W, H) => { x.fillStyle = '#0b0f14'; x.fillRect(0, 0, W, H); x.fillStyle = col; x.font = `bold ${Math.round(H * (sub ? .52 : .7))}px monospace`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, W / 2, H * (sub ? .38 : .52)); if(sub){ x.font = `bold ${Math.round(H * .26)}px Tahoma`; x.fillStyle = '#cfd6de'; x.fillText(sub, W / 2, H * .8); } }); } }; }
/* خط لحام: حبيبات بتسخن وتبرد، وبخبث ممكن يتشال */
function makeBead2(parent, r = .01, max = 420){
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: .55, roughness: .38 }), max); im.count = 0; im.frustumCulled = false; im.userData.noFit = true; parent.add(im);
  const born = new Float32Array(max), slag = new Uint8Array(max), px = new Float32Array(max), mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color();
  const HOT = new THREE.Color(0xffc060), MET = new THREE.Color(0x8f8172), MET2 = new THREE.Color(0x6f6358), SLAG = new THREE.Color(0x3d342c); let t = 0, slagOn = false;
  return { im, get count(){ return im.count; }, setSlag(v){ slagOn = v; }, clear(){ im.count = 0; },
    add(p, n = V(0, 1, 0), sc = 1, w = 1){ if(im.count >= max) return; const k = im.count++; born[k] = t; slag[k] = slagOn ? 1 : 0; px[k] = p.x; q.setFromUnitVectors(UPV, n.clone().normalize()); const rip = k % 3 === 0 ? 1.08 : 1; mtx.compose(p, q, V(r * 1.15 * sc * rip * w, r * .55 * sc, r * sc * rip * w)); im.setMatrixAt(k, mtx); im.setColorAt(k, HOT); im.instanceMatrix.needsUpdate = true; },
    chip(x){ for(let k = 0; k < im.count; k++) if(px[k] < x) slag[k] = 0; },
    update(dt){ t += dt; for(let k = 0; k < im.count; k++){ const a = Math.min(1, (t - born[k]) / 2.2); col.copy(HOT).lerp(slag[k] ? SLAG : (k % 3 ? MET : MET2), a); if(a < .35) col.multiplyScalar(1.7 - a * 2); im.setColorAt(k, col); } if(im.instanceColor) im.instanceColor.needsUpdate = true; } };
}
/* سحابة غاز الحماية */
function gasCloud(root, color = 0x9fd3ff, n = 12){ const S = []; for(let i = 0; i < n; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0, depthWrite: false })); s.userData = { ph: i / n, noFit: true }; root.add(s); S.push(s); }
  return { update(p, axis, t, on){ S.forEach(s => { const ph = (s.userData.ph + t * 1.4) % 1; const a = s.userData.ph * 40; s.position.copy(p).addScaledVector(axis, .035 * (1 - ph)).add(V(Math.cos(a) * .018 * ph, 0, Math.sin(a) * .018 * ph)); s.scale.setScalar(.025 + ph * .03); s.material.opacity = on ? (1 - ph) * .3 : 0; }); } }; }
/* لوح بيتلحم عليه */
function weldCoupon(len = .46, w = .2, th = .012){ const m = box(len, th, w, M(0x8a96a3, { m: .7, r: .42 })); m.position.y = th / 2; return m; }

/* ---------- 1) ماكينة اللحام بالقوس الكهربي MMA ---------- */
function buildMMA(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); weldTable(root);
  /* الماكينة: إنفرتر صغير بشنطة، الوش ناحية الكاميرا */
  const mach = new THREE.Group(); mach.position.set(-.42, .042, -.2); root.add(mach); const red = M(0xd23a2e, { r: .4 });
  mach.add(at(box(.36, .2, .22, red), 0, .1, 0)); mach.add(at(box(.37, .015, .23, M(0x1d2128)), 0, .2, 0)); mach.add(at(box(.37, .015, .23, M(0x1d2128)), 0, .007, 0));
  const strap = tube(CR([V(-.12, .205, 0), V(-.08, .26, 0), V(.08, .26, 0), V(.12, .205, 0)]), .008, M(0x1d2128), 20); mach.add(strap);
  const face = makeCanvas(.34, .18, 512); face.mesh.position.set(0, .1, .111); mach.add(face.mesh);
  face.draw((x, W, H) => { x.fillStyle = '#e8ebef'; x.fillRect(0, 0, W, H); x.fillStyle = '#d23a2e'; x.fillRect(0, 0, W, 34); x.fillStyle = '#fff'; x.font = 'bold 24px Tahoma'; x.textAlign = 'center'; x.fillText('MMA 200', W / 2, 25);
    const cx = W * .72, cy = H * .48, R = 66; x.strokeStyle = '#1d2128'; x.lineWidth = 3; for(let i = 0; i <= 9; i++){ const a = Math.PI * .75 + i / 9 * Math.PI * 1.5; x.beginPath(); x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.lineTo(cx + Math.cos(a) * (R + 10), cy + Math.sin(a) * (R + 10)); x.stroke(); }
    x.fillStyle = '#1d2128'; x.font = 'bold 18px Tahoma'; x.fillText('20', cx - 60, cy + 70); x.fillText('200', cx + 60, cy + 70); x.font = 'bold 22px Tahoma'; x.fillText(L('الأمبير', 'Current'), cx, cy + 95);
    x.fillText('−', W * .14, H * .92); x.fillText('+', W * .36, H * .92); x.font = 'bold 18px Tahoma'; x.fillText(L('الشاشة', 'Display'), W * .25, H * .2); });
  const disp = makeDisplay(.1, .045); disp.mesh.position.set(-.085, .135, .113); mach.add(disp.mesh);
  const knob = makeKnob(.03, 0x1d2128); knob.group.position.set(.075, .105, .112); mach.add(knob.group);
  const sockN = cyl(.016, .016, .02, M(0x1d2128), 16), sockP = cyl(.016, .016, .02, M(0xc0392b), 16); [sockN, sockP].forEach((s, i) => { s.rotation.x = Math.PI / 2; s.position.set(i ? -.047 : -.122, .04, .12); mach.add(s); });
  const sockW = (i) => relTo(root, mach, V(i ? -.047 : -.122, .04, .13));
  /* اللوح وماسك الأرضي */
  const pl = weldCoupon(.46, .2, .012); pl.position.set(.08, .042, -.05); root.add(pl); const Y0 = .042 + .012;
  const clamp = new THREE.Group(); clamp.position.set(-.15, Y0, .04); root.add(clamp); const cu = M(0xc98a3a, { m: .7, r: .35 }); clamp.add(at(box(.05, .008, .03, cu), 0, .006, 0)); clamp.add(at(box(.05, .008, .03, cu), 0, -.018, 0)); clamp.add(at(box(.012, .03, .03, M(0xd0021b)), -.03, -.006, 0)); clamp.add(at(box(.08, .01, .02, M(0xd0021b)), -.07, .01, 0)); clamp.add(at(box(.08, .01, .02, M(0xd0021b)), -.07, -.022, 0));
  root.add(tube(CR([sockW(0), V(-.4, .045, .12), V(-.25, .045, .1), V(-.21, Y0 - .006, .04)]), .007, M(0x1d2128), 30));
  /* ماسك الإلكترود (الـ Holder) والإلكترود والجوانتي */
  const H = new THREE.Group(); root.add(H); const rodCoat = cyl(.0045, .0045, 1, M(0xc9b48a, { r: .85 }), 10); H.add(rodCoat); const rodCore = cyl(.0028, .0028, .022, M(0xb8bec6, { m: .9, r: .3 }), 8); H.add(rodCore); const crater = cyl(.0046, .0035, .004, M(0x2b2b2b), 10); crater.position.y = .002; H.add(crater);
  const jaw = new THREE.Group(); H.add(jaw); jaw.add(at(box(.034, .03, .03, M(0xe8b630, { r: .5 })), 0, 0, 0)); jaw.add(at(box(.036, .006, .032, cu), 0, -.012, 0));
  const handle = new THREE.Group(); jaw.add(handle); handle.rotation.z = -.55; const hb = cyl(.016, .02, .15, M(0xe8b630, { r: .55 }), 16); hb.rotation.z = Math.PI / 2; hb.position.x = .09; handle.add(hb); for(let i = 0; i < 5; i++){ const rr = new THREE.Mesh(new THREE.TorusGeometry(.018, .002, 6, 20), M(0x1d2128)); rr.rotation.y = Math.PI / 2; rr.position.x = .05 + i * .02; handle.add(rr); }
  const glove = makeGlove(); glove.position.set(.1, .005, 0); handle.add(glove);
  let eLen = .3; const setLen = Lh => { eLen = Lh; rodCoat.scale.y = Lh - .022; rodCoat.position.y = (Lh - .022) / 2; rodCore.position.y = Lh - .011; jaw.position.y = Lh + .008; }; setLen(.3);
  const tailW = () => relTo(root, handle, V(.17, 0, 0)); const eCable = dynCable(root, 0x1d2128, .007);
  /* علبة الإلكترودات وإلكترود مقطوع للتوضيح */
  const ebox = new THREE.Group(); ebox.position.set(.42, .042, .2); root.add(ebox); ebox.add(at(box(.36, .03, .08, M(0x2a62c9, { r: .7 })), 0, .015, 0)); for(let i = 0; i < 5; i++){ const e = cyl(.0045, .0045, .34, M(0xc9b48a, { r: .85 }), 8); e.rotation.z = Math.PI / 2; e.position.set(0, .035, -.025 + i * .012); ebox.add(e); }
  const cut = new THREE.Group(); cut.position.set(.42, .1, -.18); root.add(cut); const coreBig = cyl(.012, .012, .3, M(0xb8bec6, { m: .9, r: .3 }), 20); coreBig.rotation.z = Math.PI / 2; cut.add(coreBig); const coatBig = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .26, 28, 1, false, Math.PI * .5, Math.PI * 1.5), M(0xc9b48a, { r: .85, side: THREE.DoubleSide })); coatBig.rotation.z = Math.PI / 2; coatBig.position.x = .02; cut.add(coatBig); cut.add(at(box(.02, .1, .02, M(0x5a6068)), 0, -.05, 0));
  cut.add(at(label(L('السلك (القلب)', 'Steel core'), '#1d2128', .028), -.12, .05, 0)); cut.add(at(label(L('الغلاف (الفلكس)', 'Flux coating'), '#8a5a2e', .028), .08, .05, 0));
  const card = makeCanvas(.4, .26, 640); card.mesh.position.set(.42, .3, -.3); root.add(card.mesh);
  card.draw((x, W, H) => { x.fillStyle = '#f4f6f8'; x.fillRect(0, 0, W, H); x.fillStyle = '#2a62c9'; x.fillRect(0, 0, W, 64); x.fillStyle = '#fff'; x.font = 'bold 44px monospace'; x.textAlign = 'center'; x.fillText('E 60 1 3', W / 2, 48);
    [['E', L('إلكترود لحام قوس', 'Arc welding electrode')], ['60', L('مقاومة شد 60 ألف رطل/بوصة²', 'Tensile 60,000 psi')], ['1', L('كل الأوضاع', 'All positions')], ['3', L('غلاف روتيل · AC أو DC', 'Rutile coating · AC or DC')]].forEach(([a, b], i) => { const y = 125 + i * 75; x.fillStyle = '#d0021b'; x.font = 'bold 40px monospace'; x.textAlign = 'left'; x.fillText(a, 24, y); x.fillStyle = '#1d2128'; x.font = 'bold 28px Tahoma'; x.textAlign = 'right'; x.fillText(b, W - 20, y); }); });
  /* شاكوش الخبث والفرشة */
  const ham = new THREE.Group(); root.add(ham); ham.add(at(box(.012, .14, .012, M(0x8a5a2e, { r: .8 })), 0, .07, 0)); const hh = box(.1, .014, .014, M(0x5a6068, { m: .8 })); hh.position.y = .14; ham.add(hh);
  const flakes = []; for(let i = 0; i < 16; i++){ const f = box(.008, .002, .006, M(0x3d342c)); f.userData = { noFit: true, v: V(0, 0, 0), life: 0 }; root.add(f); flakes.push(f); }
  const bead = makeBead2(root, .0095); const arc = makeArc(root, 0xd8ecff); const sparks = makeSparks(root, 70); const fl = flowDots(root, 16, 0xffd34d, .014), fl2 = flowDots(root, 10, 0xffd34d, .014);
  const fumes = []; for(let i = 0; i < 10; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xc8c4bc, transparent: true, opacity: 0, depthWrite: false })); s.userData = { ph: i / 10, noFit: true }; root.add(s); fumes.push(s); }
  const rd = readout(.7, .1); rd.mesh.position.set(-.05, .62, -.5); root.add(rd.mesh);
  part('mach', mach, V(0, .3, 0), L('ماكينة اللحام', 'Welding machine'), L('دوس على الطارة تغيّر الأمبير.', 'Tap to change the current.')); part('holder', jaw, V(0, .04, 0), L('ماسك الإلكترود', 'Electrode holder'), '');
  part('clamp', clamp, V(0, .03, 0), L('ماسك الأرضي', 'Earth clamp'), ''); part('cut', cut, V(0, .07, 0), L('قطاع في الإلكترود', 'Electrode cut-away'), ''); part('card', card.mesh, V(0, .15, 0), L('رمز الإلكترود', 'Electrode code'), ''); part('ebox', ebox, V(0, .06, 0), L('علبة الإلكترودات', 'Electrode box'), '');
  const AMP = [[2.5, 80], [3.2, 110], [4, 150]]; const st = { m: 'circuit', k: 1 }; let t = 0, cyc = -1; const travel = V(1, 0, 0);
  ctx.parts.mach.tap = () => { st.k = (st.k + 1) % AMP.length; t = 0; return L(`إلكترود ${AMP[st.k][0]} مم ← حوالي ${AMP[st.k][1]} أمبير`, `${AMP[st.k][0]} mm electrode → about ${AMP[st.k][1]} A`); };
  const BZ = -.05;
  return {
    ...ctx, view: V(.1, .55, 1.3), sway: true, hint: L('دوس على الماكينة تغيّر الأمبير', 'Tap the machine to change the current'),
    steps: [
      { title: L('اللحام بالقوس الكهربي M.M.A.W', 'Manual metal arc welding'), text: L('شوف التيار (النقط الصفرا) وهو ماشي: من الماكينة في كابل الماسك، لحد الإلكترود، يعدّي في القوس للّوح، ويرجع من ماسك الأرضي للماكينة. القوس حرارته حوالي 6000 درجة وبيسيّح طرف الإلكترود واللوح مع بعض.', 'Watch the current (yellow dots): from the machine along the holder cable to the electrode, across the arc into the plate, and back through the earth clamp to the machine. The arc is about 6000 °C and melts the electrode tip and the plate together.'), s: { m: 'circuit' } },
      { title: L('الإلكترود المغلف', 'The coated electrode'), text: L('الإلكترود سلك حديد (القلب) عليه غلاف (فلكس). القلب بيسيح ويبقى معدن اللحام، والغلاف وهو بيتحرق بيعمل غاز يحمي البركة من الهوا، وخبث بيغطي اللحام وهو بيبرد. الطرف اللي بيتمسك في الماسك من غير غلاف عشان التيار يعدّي. الرمز E6013: إلكترود روتيل سهل لكل الأوضاع.', 'The electrode is a steel core with a flux coating. The core melts into weld metal; the burning coating makes gas that shields the pool from air, and slag that covers the weld as it cools. The end gripped in the holder is bare so current can pass. E6013: an easy all-position rutile electrode.'), cam: { t: [.42, .14, -.22], d: .34, dir: [0, .35, 1] }, s: { m: 'elec' } },
      { title: L('تجهيز الماكينة وضبط الأمبير', 'Setting up and the current'), text: L('ماسك الأرضي على اللوح نضيف ومقفول كويس. نشغّل الماكينة ونلف طارة الأمبير لحد ما الشاشة توصل للرقم: تقريبًا 35–40 أمبير لكل مم من قطر الإلكترود، يعني إلكترود 3.2 مم ≈ 110 أمبير. دوس على الماكينة تجرب مقاس تاني.', 'The earth clamp is clean and tight on the plate. Switch on and turn the current knob until the display reaches the value: about 35–40 A per mm of electrode diameter, so a 3.2 mm electrode ≈ 110 A. Tap the machine to try another size.'), cam: { t: [-.42, .15, -.08], d: .34, dir: [.1, .2, 1] }, s: { m: 'set' } },
      { title: L('إشعال القوس', 'Striking the arc'), text: L('القناع نازل الأول. بنخبش طرف الإلكترود على اللوح زي عود الكبريت، وأول ما القوس يولّع بنرفعه لطول قوس قد قطر الإلكترود (حوالي 3 مم) ونثبته. لو الإلكترود لزق في اللوح، بنلفه ونشده بسرعة.', 'Helmet down first. Scratch the electrode tip on the plate like striking a match; as soon as the arc lights, lift to an arc length about the electrode diameter (about 3 mm) and hold it. If the electrode sticks, twist and pull it free quickly.'), cam: { t: [-.05, .07, -.05], d: .33, dir: [.45, .45, 1] }, s: { m: 'strike' } },
      { title: L('خط لحام مستقيم وإزالة الخبث', 'Running a bead and removing slag'), text: L('الإلكترود مايل 70–80° في اتجاه الحركة، وطول القوس ثابت، والسرعة منتظمة. شوف الإلكترود وهو بيقصر، فالإيد بتنزل بالتدريج. الخط بيتغطى بخبث غامق، ولما يبرد بنكسره بشاكوش الخبث فيبان اللحام بتموّجات منتظمة.', 'Hold the electrode at 70–80° leaning in the travel direction, keep the arc length constant and travel steadily. Watch the electrode burn shorter, so the hand lowers gradually. The bead is covered in dark slag; once cool, chip it off with the slag hammer to reveal even ripples.'), cam: { t: [.03, .07, -.05], d: .38, dir: [.4, .5, 1] }, s: { m: 'bead' } }
    ],
    apply(s){ st.m = s.m; t = 0; cyc = -1; bead.clear(); sparks.clear(); },
    update(dt){ t += dt; const m = st.m; const [dia, amps] = AMP[st.k];
      /* الشاشة والطارة */
      let shown = amps; if(m === 'set'){ const k = Math.min(1, Math.max(0, (t - .6) / 2.4)); shown = Math.round(20 + (amps - 20) * k); knob.glow(t < 3.2, t); } else knob.glow(false, t);
      knob.set((shown - 20) / 180); disp.set(String(shown));
      /* حركة الإلكترود */
      const T = m === 'bead' ? 12 : m === 'strike' ? 8 : 9, c = Math.floor(t / T), f = (t % T) / T; if(c !== cyc){ cyc = c; bead.clear(); setLen(.3); flakes.forEach(fk => fk.userData.life = 0); }
      let on = false, x = -.12, gap = .03, Lh = .3, ang = .3; ham.visible = false;
      if(m === 'circuit'){ const k = (t % 9) / 9; x = -.15 + k * .32; gap = .003; on = true; Lh = .3 - k * .1; if(k < .02) bead.clear(); bead.setSlag(true); }
      else if(m === 'strike'){ if(f < .18){ x = -.12; gap = .03 - f / .18 * .03; } else if(f < .3){ const k = (f - .18) / .12; x = -.12 + k * .025; gap = 0; on = k > .45; } else if(f < .38){ x = -.095; gap = (f - .3) / .08 * .003; on = true; } else if(f < .8){ x = -.095 + (f - .38) * .12; gap = .003; on = true; } else { x = -.045; gap = .003 + (f - .8) * .3; on = false; } bead.setSlag(true); }
      else if(m === 'bead'){ if(f < .62){ const k = f / .62; x = -.15 + k * .34; gap = .003; on = true; Lh = .3 - k * .16; } else { x = .19; gap = .08; Lh = .14; ham.visible = true; const k = (f - .66) / .3; const hx = -.15 + Math.max(0, k) * .36; bead.chip(hx); ham.position.set(hx + .02, Y0 + .005 + Math.abs(Math.sin(t * 14)) * .03, BZ + .05); ham.rotation.set(Math.PI / 2 - .3, 0, .6);
          if(k > 0 && k < 1 && Math.random() < .5){ const fk = flakes.find(q => q.userData.life <= 0); if(fk){ fk.position.set(hx, Y0 + .006, BZ); fk.userData.life = .6; fk.userData.v.set((Math.random() - .3) * .3, .4 + Math.random() * .3, (Math.random() - .5) * .3); } } } bead.setSlag(true); }
      else { x = -.12; gap = .06; }
      if(m !== 'bead' && m !== 'circuit') Lh = .3; if(m === 'elec' || m === 'set'){ x = .05; gap = .12; }
      setLen(Lh); const tip = V(x, Y0 + gap, BZ); const d = V(Math.sin(ang), Math.cos(ang), 0); orientTool(H, tip, d, V(.5, .6, -.8));
      crater.visible = m === 'bead' || m === 'circuit' || (m === 'strike' && f > .3);
      eCable.set([sockW(1), V(-.3, .05, .2), V(-.05, .2, .3), tailW()]);
      arc.group.position.set(x, Y0 + .002, BZ); arc.set(on, t); if(on){ sparks.emit(V(x, Y0 + .004, BZ), 45, dt, V(-.2, .7, .35)); if(Math.random() < .85) bead.add(V(x - .004, Y0 + .002, BZ), V(0, 1, 0), 1); }
      sparks.update(dt); bead.update(dt);
      fumes.forEach(s => { const ph = (s.userData.ph + t * .5) % 1; s.position.set(x + Math.sin(ph * 6 + s.userData.ph * 9) * .02, Y0 + .02 + ph * .25, BZ - ph * .05); s.scale.setScalar(.03 + ph * .1); s.material.opacity = on ? (1 - ph) * .35 : 0; });
      flakes.forEach(fk => { const u = fk.userData; if(u.life <= 0){ fk.visible = false; return; } fk.visible = true; u.life -= dt; u.v.y -= 2 * dt; fk.position.addScaledVector(u.v, dt); fk.rotation.x += dt * 10; });
      const curveE = new THREE.CatmullRomCurve3([sockW(1), V(-.3, .05, .2), V(-.05, .2, .3), tailW(), tip.clone().addScaledVector(d, Lh)]); const curveG = new THREE.CatmullRomCurve3([V(x, Y0, BZ), V(-.21, Y0, .04), V(-.25, .045, .1), V(-.4, .045, .12), sockW(0)]);
      fl.update(curveE, t, m === 'circuit' && on, .3); fl2.update(curveG, t, m === 'circuit' && on, .3);
      rd.setText(m === 'circuit' ? L('ماكينة ← ماسك ← قوس ← لوح ← أرضي', 'Machine → holder → arc → plate → earth') : m === 'elec' ? L('قلب حديد + غلاف فلكس', 'Steel core + flux coating') : m === 'set' ? L(`إلكترود ${dia} مم ← ${shown} أمبير`, `${dia} mm electrode → ${shown} A`) : m === 'strike' ? (f < .18 ? L('نقرّب الإلكترود', 'Bring the electrode close') : f < .3 ? L('نخبش زي عود الكبريت', 'Scratch like a match') : f < .8 ? L('القوس ولّع: طول قوس 3 مم', 'Arc struck: 3 mm arc length') : L('نرفع ونطفي القوس', 'Lift to break the arc')) : (f < .62 ? L('زاوية 70–80° · سرعة ثابتة', '70–80° · steady speed') : L('بنكسر الخبث بالشاكوش', 'Chipping off the slag')));
    }
  };
}

/* ---------- 2) ماكينة CO₂ (MIG) بمغذي سلك وأسطوانة ---------- */
function buildMIG(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); weldTable(root);
  const cab = new THREE.Group(); cab.position.set(-.45, .0, -.28); root.add(cab); const blue = M(0x2a62c9, { r: .42 }), dark = M(0x1d2128, { r: .5 });
  cab.add(at(box(.16, .4, .46, blue), -.05, .24, 0)); cab.add(at(box(.1, .012, .46, blue), .08, .434, 0)); cab.add(at(box(.1, .012, .46, blue), .08, .046, 0)); cab.add(at(box(.1, .4, .006, blue), .08, .24, .227)); cab.add(at(box(.1, .4, .006, blue), .08, .24, -.227)); cab.add(at(box(.27, .02, .47, dark), 0, .045, 0)); [[-.1, -.2], [.1, -.2], [-.1, .2], [.1, .2]].forEach(([x, z]) => { const w = cyl(.03, .03, .02, dark, 16); w.rotation.z = Math.PI / 2; w.position.set(x * 1.2, .03, z); cab.add(w); });
  /* الجنب المفتوح: جواه بكرة السلك ومغذي السلك */
  const inner = box(.005, .34, .42, M(0x0d1b2e)); inner.position.set(.05, .25, 0); cab.add(inner);
  
  const door = new THREE.Group(); door.position.set(.131, .25, .22); cab.add(door); door.add(at(box(.006, .34, .42, M(0x2a62c9, { r: .42, opacity: .95 })), 0, 0, -.21)); door.add(at(box(.012, .06, .015, dark), .01, 0, -.4));
  const spool = new THREE.Group(); spool.position.set(.09, .3, -.08); cab.add(spool); const sp = new THREE.Group(); spool.add(sp); [-1, 1].forEach(s => { const fl = cyl(.1, .1, .006, M(0x3a3f46, { r: .5 }), 30); fl.rotation.z = Math.PI / 2; fl.position.x = s * .028; sp.add(fl); });
  const wireC = cyl(.085, .085, .05, M(0xc98a3a, { m: .85, r: .3 }), 30); wireC.rotation.z = Math.PI / 2; sp.add(wireC); for(let i = 0; i < 8; i++){ const r = new THREE.Mesh(new THREE.TorusGeometry(.085, .0025, 4, 40), M(0xb07a3e, { m: .85, r: .3 })); r.rotation.y = Math.PI / 2; r.position.x = -.024 + i * .007; sp.add(r); } const hub = cyl(.02, .02, .07, M(0xc9ced6, { m: .8 }), 14); hub.rotation.z = Math.PI / 2; sp.add(hub); const spMark = box(.06, .012, .01, M(0xffffff)); spMark.position.set(0, .05, 0); sp.add(spMark);
  const feeder = new THREE.Group(); feeder.position.set(.09, .21, .12); cab.add(feeder); feeder.add(at(box(.04, .05, .08, M(0x3a3f46)), -.03, 0, 0)); const rolls = [.014, -.014].map(y => { const r = cyl(.016, .016, .014, M(0xc9ced6, { m: .85, r: .3 }), 22); r.rotation.z = Math.PI / 2; r.position.set(.0, y, 0); feeder.add(r); const mk = box(.016, .004, .004, M(0xd0021b)); mk.position.set(.008, .012, 0); r.add(mk); return r; });
  const arm = new THREE.Group(); arm.position.set(0, .035, -.03); feeder.add(arm); arm.add(at(box(.012, .01, .07, M(0xd0021b)), 0, 0, .03)); const sprg = cyl(.005, .005, .03, M(0xc9ced6, { m: .8 }), 8); sprg.position.set(0, .02, .06); arm.add(sprg);
  const WP = [V(.09, .215, -.01), V(.09, .21, .09), V(.09, .21, .15), V(.09, .21, .232)].map(p => p); const wireLine = tube(new THREE.CatmullRomCurve3(WP), .0018, M(0xd9a441, { m: .9, r: .25 }), 30); cab.add(wireLine);
  /* الوش: شاشتين وطارتين */
  const face = makeCanvas(.24, .3, 512); face.mesh.position.set(-.0, .26, .231); cab.add(face.mesh);
  face.draw((x, W, H) => { x.fillStyle = '#e8ebef'; x.fillRect(0, 0, W, H); x.fillStyle = '#2a62c9'; x.fillRect(0, 0, W, 50); x.fillStyle = '#fff'; x.font = 'bold 30px Tahoma'; x.textAlign = 'center'; x.fillText('MIG / CO₂ 250', W / 2, 36);
    x.fillStyle = '#1d2128'; x.font = 'bold 26px Tahoma'; x.fillText(L('الجهد (فولت)', 'Voltage (V)'), W * .28, H * .6); x.fillText(L('سرعة السلك', 'Wire speed'), W * .72, H * .6);
    [W * .28, W * .72].forEach(cx => { for(let i = 0; i <= 8; i++){ const a = Math.PI * .75 + i / 8 * Math.PI * 1.5, cy = H * .78, R = 58; x.lineWidth = 3; x.strokeStyle = '#1d2128'; x.beginPath(); x.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); x.lineTo(cx + Math.cos(a) * (R + 9), cy + Math.sin(a) * (R + 9)); x.stroke(); } }); });
  const dV = makeDisplay(.085, .04, '#ff5a3c'), dS = makeDisplay(.085, .04, '#7dffb0'); dV.mesh.position.set(-.058, .36, .233); dS.mesh.position.set(.058, .36, .233); cab.add(dV.mesh); cab.add(dS.mesh);
  const kV = makeKnob(.026, 0xd0021b), kS = makeKnob(.026, 0x1f7a4a); kV.group.position.set(-.058, .192, .233); kS.group.position.set(.058, .192, .233); cab.add(kV.group); cab.add(kS.group);
  const euro = cyl(.022, .022, .03, M(0xc9a24a, { m: .7 }), 18); euro.rotation.x = Math.PI / 2; euro.position.set(.09, .21, .245); cab.add(euro);
  /* الأسطوانة والمنظم */
  const cylG = makeCyl(0x3a3f46, 'CO₂', .82, .085); cylG.position.set(-.78, 0, -.38); root.add(cylG); const chain = new THREE.Mesh(new THREE.TorusGeometry(.092, .005, 6, 24), M(0xc9ced6, { m: .8 })); chain.rotation.x = Math.PI / 2; chain.position.set(-.78, .55, -.38); root.add(chain);
  const regG = new THREE.Group(); regG.position.set(-.78, .96, -.3); root.add(regG); regG.add(at(box(.05, .05, .05, M(0xc9a24a, { m: .7 })), 0, 0, -.05)); const gP = makeGauge('#2a62c9', 0, 60, [0, 20, 40, 60], 'bar'); gP.group.scale.setScalar(.2); gP.group.position.set(-.05, .03, -.03); regG.add(gP.group);
  const flow = new THREE.Group(); flow.position.set(.06, .04, -.04); flow.scale.setScalar(1.5); regG.add(flow); flow.add(at(cyl(.014, .014, .11, M(0xdfefff, { opacity: .35 }), 16), 0, 0, 0)); const ball = new THREE.Mesh(new THREE.SphereGeometry(.009, 12, 8), M(0xd0021b)); flow.add(ball); const fsc = makeCanvas(.03, .11, 128); fsc.mesh.position.set(.025, 0, 0); flow.add(fsc.mesh);
  fsc.draw((x, W, H) => { x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H); x.fillStyle = '#1d2128'; x.font = 'bold 34px monospace'; x.textAlign = 'center'; [5, 10, 15, 20].forEach((v, i) => { const y = H - 30 - i * (H - 60) / 3; x.fillText(String(v), W / 2, y + 12); x.fillRect(0, y, 18, 4); }); });
  const valve = new THREE.Group(); valve.position.set(0, -.03, -.05); regG.add(valve); valve.add(cyl(.02, .02, .008, M(0x1d2128), 12).rotateX(Math.PI / 2)); valve.add(at(box(.044, .006, .006, M(0x1d2128)), 0, 0, .006));
  root.add(tube(CR([V(-.78, .93, -.33), V(-.68, .6, -.45), V(-.58, .3, -.5), V(-.5, .25, -.51)]), .006, M(0x1f7a4a), 30));
  /* المسدس */
  const G = new THREE.Group(); root.add(G); const tipC = cyl(.0028, .0035, .012, M(0xc98a3a, { m: .85 }), 10); tipC.position.y = .012; G.add(tipC); const noz = cyl(.011, .015, .045, M(0xc9a24a, { m: .75, r: .35 }), 18, true); noz.position.y = .03; G.add(noz); const noz2 = cyl(.015, .015, .01, M(0x3a3f46), 18); noz2.position.y = .055; G.add(noz2);
  const wire = cyl(.0012, .0012, 1, M(0xd9a441, { m: .9 }), 6); G.add(wire); const neck = tube(CR([V(0, .06, 0), V(0, .1, 0), V(.03, .14, 0), V(.07, .16, 0)]), .008, M(0x1d2128), 20); G.add(neck);
  const gh = cyl(.017, .02, .13, M(0x1d2128, { r: .6 }), 16); gh.rotation.z = Math.PI / 2 - .25; gh.position.set(.13, .175, 0); G.add(gh); const trig = box(.025, .008, .012, M(0xd0021b)); trig.position.set(.11, .155, 0); G.add(trig); const glove = makeGlove(); glove.position.set(.14, .17, 0); glove.rotation.z = -.25; G.add(glove);
  const gCable = dynCable(root, 0x1d2128, .01); const gTail = () => relTo(root, G, V(.2, .19, 0));
  const pl = weldCoupon(.46, .2, .008); pl.position.set(.08, .042, -.05); root.add(pl); const Y0 = .042 + .008, BZ = -.05;
  const bead = makeBead2(root, .0085); const arc = makeArc(root, 0xcfe6ff); const sparks = makeSparks(root, 60); const gas = gasCloud(root); const wireDots = flowDots(cab, 8, 0xfff1a0, .01);
  const rd = readout(.7, .1); rd.mesh.position.set(.0, .66, -.5); root.add(rd.mesh);
  part('cab', cab, V(0, .48, 0), L('ماكينة CO₂ (MIG)', 'CO₂ / MIG machine'), ''); part('spool', spool, V(.06, .1, 0), L('بكرة السلك', 'Wire spool'), L('جوه الماكينة من الجنب.', 'Inside the side door.')); part('feeder', feeder, V(.03, .04, 0), L('بكرات التغذية', 'Drive rolls'), '');
  part('knobs', kV.group, V(0, .04, .02), L('طارة الجهد', 'Voltage knob'), ''); part('knobS', kS.group, V(0, .04, .02), L('طارة سرعة السلك', 'Wire-speed knob'), ''); part('reg', regG, V(0, .09, 0), L('المانومتر وعدّاد الغاز', 'Regulator and flowmeter'), ''); part('gun', G, V(.1, .22, 0), L('المسدس', 'Welding gun'), '');
  const st = { m: 'intro' }; let t = 0, cyc = -1, wireT = 0;
  return {
    ...ctx, view: V(.25, .5, 1.3), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('اللحام بثاني أكسيد الكربون CO₂', 'CO₂ / MIG welding'), text: L('ماكينة مختلفة خالص عن القوس الكهربي: مفيش إلكترود عصاية. جوه الماكينة بكرة سلك بيتغذى أوتوماتيك لحد المسدس، وأول ما نضغط الزناد السلك يطلع والقوس يولّع، وغاز CO₂ من الأسطوانة بيطلع حوالين السلك يحمي اللحام. اللحام نضيف من غير خبث.', 'A completely different machine from stick welding: there is no stick electrode. A wire spool inside feeds wire automatically to the gun; squeeze the trigger and the wire comes out, the arc lights, and CO₂ from the cylinder flows round the wire to shield the weld. The weld is clean, with no slag.'), s: { m: 'intro' } },
      { title: L('بكرة السلك ومغذي السلك', 'Wire spool and wire feeder'), text: L('بنفتح باب الماكينة الجانبي: البكرة فيها السلك (0.8 أو 1 مم). السلك بيعدّي بين بكرتين التغذية، والدراع الأحمر بيضغطهم على السلك، والموتور بيلفهم فيزقّوا السلك في كابل المسدس. شوف البكرة وهي بتلف والسلك وهو بيطلع من المسدس. مجرى البكرات والفونية لازم نفس مقاس السلك.', 'Open the side door: the spool holds the wire (0.8 or 1 mm). The wire passes between the two drive rolls; the red arm presses them onto the wire and the motor turns them, pushing the wire into the gun cable. Watch the spool turn and the wire come out of the gun. The roll groove and contact tip must match the wire size.'), cam: { t: [-.36, .27, -.3], d: .36, dir: [1, .3, .55] }, s: { m: 'feed' } },
      { title: L('الغاز: المانومتر وعدّاد التدفق', 'Gas: regulator and flowmeter'), text: L('بنفتح محبس الأسطوانة: المانومتر بيبيّن ضغط الأسطوانة. وبعدين بنلف محبس المنظم لحد ما الكورة الحمرا في عدّاد التدفق توصل 12–15 لتر/دقيقة. الأسطوانة مربوطة بجنزير، والخرطوم داخل لضهر الماكينة.', 'Open the cylinder valve: the gauge shows cylinder pressure. Then turn the regulator knob until the red ball in the flowmeter reaches 12–15 L/min. The cylinder is chained, and the hose runs to the back of the machine.'), cam: { t: [-.76, 1.0, -.32], d: .3, dir: [.35, .1, 1] }, s: { m: 'gas' } },
      { title: L('ضبط الجهد وسرعة السلك', 'Setting voltage and wire speed'), text: L('على وش الماكينة طارتين: الحمرا الشمال للجهد (فولت) وبتحدد طول القوس، والخضرا اليمين لسرعة السلك (متر/دقيقة) وبتحدد الأمبير. شوف كل طارة وهي بتلف والشاشة اللي فوقها بتتغير: لصاج 1.5 مم تقريبًا 17 فولت و5 متر/دقيقة.', 'The front panel has two knobs: the red one on the left sets the voltage, which sets the arc length; the green one on the right sets the wire speed (m/min), which sets the current. Watch each knob turn and its display change: for 1.5 mm sheet roughly 17 V and 5 m/min.'), cam: { t: [-.45, .3, -.05], d: .32, dir: [0, .1, 1] }, s: { m: 'set' } },
      { title: L('التقنية وتنفيذ التمرين', 'Technique and the exercise'), text: L('المسدس مايل 10–15° والسلك طالع 10–15 مم من الفونية. بنضغط الزناد ونمشي بسرعة ثابتة. شوف الغاز (الأزرق) حوالين القوس، والخط بيتبني نضيف من غير خبث. والصوت الصح زي طشّة الزيت المنتظمة.', 'Hold the gun at 10–15° with 10–15 mm wire stick-out, squeeze the trigger and travel steadily. Watch the gas (blue) round the arc and the bead building clean, with no slag. The right sound is a steady sizzle like frying.'), cam: { t: [.05, .08, -.05], d: .36, dir: [.1, .45, 1] }, s: { m: 'weld' } }
    ],
    apply(s){ st.m = s.m; t = 0; cyc = -1; bead.clear(); sparks.clear(); },
    update(dt){ t += dt; const m = st.m; const T = 8, c = Math.floor(t / T), f = (t % T) / T; if(c !== cyc){ cyc = c; bead.clear(); }
      door.rotation.y = ease(door.rotation.y, m === 'feed' || m === 'intro' ? -1.7 : 0, dt, 3);
      /* الضبط */
      let V_ = 17.5, S_ = 5; if(m === 'set'){ const a = Math.min(1, Math.max(0, (t - .5) / 2.5)), b = Math.min(1, Math.max(0, (t - 4) / 2.5)); V_ = 12 + a * 5.5; S_ = 2 + b * 3; kV.glow(t < 3.5, t); kS.glow(t >= 3.5 && t < 7, t); } else { kV.glow(false, t); kS.glow(false, t); }
      kV.set((V_ - 12) / 14); kS.set((S_ - 2) / 10); dV.set(V_.toFixed(1), 'V'); dS.set(S_.toFixed(1), 'm/min');
      /* الغاز */
      let flowV = 14; if(m === 'gas'){ const a = Math.min(1, t / 2), b = Math.min(1, Math.max(0, (t - 2.2) / 2.5)); gP.set(a * 50); flowV = b * 14; valve.rotation.z = -b * 3; } else { gP.set(50); } gP.update(dt); ball.position.y = -.045 + flowV / 20 * .09;
      /* السلك والقوس */
      const weld = m === 'weld' || m === 'intro'; const feed = m === 'feed' || (weld && f < .85); if(feed) wireT += dt; const k = Math.min(1, f / .85); const x = -.15 + k * .34; const on = weld && k < 1;
      sp.rotation.x -= feed ? dt * 1.6 : 0; rolls.forEach((r, i) => r.rotation.x += feed ? (i ? 1 : -1) * dt * 9 : 0);
      const stick = m === 'feed' ? .012 + Math.min(.04, (t % 5) * .012) : .012; wire.scale.y = stick + .006; wire.position.y = .006 - stick / 2 + .003;
      wireDots.update(new THREE.CatmullRomCurve3(WP), wireT, feed, .5);
      const ang = .25, d = V(Math.sin(ang), Math.cos(ang), 0); const tip = V(weld ? x : .05, Y0 + (weld ? .012 : .12), BZ); orientTool(G, tip.clone().addScaledVector(d, stick - .012), d, V(.8, .4, -.6)); trig.position.y = on ? .151 : .155;
      gCable.set([gTail(), V(.1, .25, .3), V(-.2, .1, .25), relTo(root, cab, V(.09, .21, .26))]);
      arc.group.position.set(x, Y0 + .002, BZ); arc.set(on, t); if(on){ sparks.emit(V(x, Y0 + .003, BZ), 18, dt, V(-.1, .5, .3)); if(Math.random() < .9) bead.add(V(x - .003, Y0 + .001, BZ), V(0, 1, 0), 1); }
      gas.update(tip, d, t, on || m === 'gas'); sparks.update(dt); bead.update(dt);
      rd.setText({ intro: L('سلك أوتوماتيك + غاز CO₂ · من غير خبث', 'Automatic wire + CO₂ · no slag'), feed: L('البكرة ← بكرات التغذية ← الكابل ← المسدس', 'Spool → drive rolls → cable → gun'), gas: L(`عدّاد الغاز ${flowV.toFixed(0)} لتر/دقيقة`, `Gas flow ${flowV.toFixed(0)} L/min`), set: t < 3.5 ? L(`طارة الجهد: ${V_.toFixed(1)} فولت`, `Voltage knob: ${V_.toFixed(1)} V`) : L(`طارة سرعة السلك: ${S_.toFixed(1)} م/د`, `Wire-speed knob: ${S_.toFixed(1)} m/min`), weld: L('زاوية 10–15° · السلك طالع 10–15 مم', '10–15° · 10–15 mm stick-out') }[m]);
    }
  };
}

/* ---------- 3) ماكينة TIG بالأرجون: تورش وتنجستن ودواسة وسلك باليد ---------- */
function buildTIG(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); weldTable(root);
  const mach = new THREE.Group(); mach.position.set(-.45, .042, -.22); root.add(mach); const teal = M(0x1f6f8b, { r: .4 }), dark = M(0x1d2128);
  mach.add(at(box(.34, .22, .24, teal), 0, .11, 0)); mach.add(at(box(.35, .02, .25, dark), 0, .22, 0)); mach.add(tube(CR([V(-.13, .23, 0), V(-.1, .28, 0), V(.1, .28, 0), V(.13, .23, 0)]), .008, dark, 20));
  const face = makeCanvas(.32, .2, 512); face.mesh.position.set(0, .11, .121); mach.add(face.mesh);
  face.draw((x, W, H) => { x.fillStyle = '#e8ebef'; x.fillRect(0, 0, W, H); x.fillStyle = '#1f6f8b'; x.fillRect(0, 0, W, 40); x.fillStyle = '#fff'; x.font = 'bold 26px Tahoma'; x.textAlign = 'center'; x.fillText('TIG 200 AC/DC', W / 2, 30); x.fillStyle = '#1d2128'; x.font = 'bold 20px Tahoma';
    x.fillText('AC', W * .12, H * .42); x.fillText('DC', W * .12, H * .72); x.fillText(L('الأمبير', 'Current'), W * .72, H * .95); x.fillText(L('تورش', 'Torch'), W * .37, H * .97); x.fillText(L('غاز', 'Gas'), W * .52, H * .97); x.fillText(L('دواسة', 'Pedal'), W * .2, H * .97); });
  const disp = makeDisplay(.09, .042, '#7dffb0'); disp.mesh.position.set(-.02, .155, .123); mach.add(disp.mesh); const knob = makeKnob(.03); knob.group.position.set(.085, .11, .122); mach.add(knob.group);
  const sw = new THREE.Group(); sw.position.set(-.13, .12, .124); mach.add(sw); sw.add(at(box(.02, .03, .008, dark), 0, 0, 0)); const lever = box(.006, .025, .006, M(0xc9ced6, { m: .8 })); lever.position.set(0, .012, .008); sw.add(lever);
  [[-.04, .03, 0xc9a24a], [.0, .03, 0x2a62c9], [-.1, .03, 0x1d2128]].forEach(([x, y, c]) => { const s = cyl(.012, .012, .015, M(c, { m: .6 }), 14); s.rotation.x = Math.PI / 2; s.position.set(x, y, .127); mach.add(s); });
  const cylG = makeCyl(0x6c7a6a, 'Ar', .82, .085); cylG.position.set(-.78, 0, -.36); root.add(cylG); const chain = new THREE.Mesh(new THREE.TorusGeometry(.092, .005, 6, 24), M(0xc9ced6, { m: .8 })); chain.rotation.x = Math.PI / 2; chain.position.set(-.78, .55, -.36); root.add(chain);
  const regG = new THREE.Group(); regG.position.set(-.78, .96, -.28); root.add(regG); regG.add(at(box(.05, .05, .05, M(0xc9a24a, { m: .7 })), 0, 0, -.05)); const flow = new THREE.Group(); flow.position.set(.05, .04, -.04); regG.add(flow); flow.add(cyl(.014, .014, .11, M(0xdfefff, { opacity: .35 }), 16)); const ball = new THREE.Mesh(new THREE.SphereGeometry(.009, 12, 8), M(0xd0021b)); flow.add(ball);
  root.add(tube(CR([V(-.78, .93, -.31), V(-.66, .6, -.2), V(-.5, .2, -.05), V(-.45, .07, -.09)]), .006, M(0x2a62c9), 30));
  /* التورش: التنجستن عند الأصل */
  const TT = new THREE.Group(); root.add(TT); const tung = cyl(.0012, .0024, .016, M(0xdfe3e8, { m: .9, r: .2 }), 10); tung.position.y = .008; TT.add(tung); const cup = cyl(.011, .016, .04, M(0xe2a27a, { r: .75 }), 20, true); cup.position.y = .036; TT.add(cup);
  const head = cyl(.017, .017, .03, dark, 16); head.position.y = .07; TT.add(head); const cap = cyl(.011, .011, .07, dark, 14); cap.position.y = .12; TT.add(cap); const thandle = cyl(.014, .016, .13, M(0x1d2128, { r: .65 }), 16); thandle.rotation.z = Math.PI / 2 - .35; thandle.position.set(.075, .095, 0); TT.add(thandle);
  for(let i = 0; i < 5; i++){ const r = new THREE.Mesh(new THREE.TorusGeometry(.016, .0018, 6, 18), M(0x3a3f46)); r.rotation.y = Math.PI / 2; r.rotation.z = .35; r.position.set(.04 + i * .018, .083 + i * .006, 0); TT.add(r); }
  const gl1 = makeGlove(); gl1.position.set(.085, .1, 0); gl1.rotation.z = -.35; TT.add(gl1); const tCable = dynCable(root, 0x1d2128, .008);
  /* سلك الإضافة باليد التانية */
  const RG = new THREE.Group(); root.add(RG); const rod = cyl(.0018, .0018, .4, M(0xd9a441, { m: .8, r: .3 }), 8); rod.position.y = .2; RG.add(rod); const gl2 = makeGlove(); gl2.position.set(0, .3, 0); gl2.rotation.z = Math.PI / 2; RG.add(gl2);
  /* الدواسة */
  const ped = new THREE.Group(); ped.position.set(.36, .042, .24); root.add(ped); ped.add(at(box(.13, .02, .22, dark), 0, .01, 0)); const pTop = new THREE.Group(); pTop.position.set(0, .03, .08); ped.add(pTop); pTop.add(at(box(.12, .014, .2, M(0x3a3f46)), 0, 0, -.1)); for(let i = 0; i < 6; i++) pTop.add(at(box(.1, .003, .006, M(0x5a6068)), 0, .008, -.03 - i * .03));
  const shoe = new THREE.Group(); pTop.add(shoe); shoe.add(at(box(.09, .05, .18, M(0x3a2a1e, { r: .8 })), 0, .033, -.1)); shoe.traverse(o => o.userData.noFit = true);
  root.add(tube(CR([V(.36, .05, .13), V(.1, .045, .2), V(-.3, .045, .1), V(-.55, .07, -.1)]), .005, dark, 30));
  /* حجر سن التنجستن */
  const grinder = new THREE.Group(); grinder.position.set(.4, .042, -.2); root.add(grinder); grinder.add(at(box(.12, .04, .1, M(0x3a3f46)), 0, .02, 0)); const motor = cyl(.05, .05, .12, M(0x4f8a6e), 20); motor.rotation.z = Math.PI / 2; motor.position.set(-.02, .1, 0); grinder.add(motor);
  const wheel = new THREE.Group(); wheel.position.set(.07, .1, 0); grinder.add(wheel); const wh = cyl(.06, .06, .02, M(0xd8d2c4, { r: .95 }), 30); wh.rotation.z = Math.PI / 2; wheel.add(wh); const whM = box(.022, .02, .004, M(0x9aa0a6)); whM.position.set(0, .05, 0); wheel.add(whM);
  const tg = new THREE.Group(); root.add(tg); const tRod = cyl(.0024, .0024, .12, M(0xdfe3e8, { m: .9 }), 10); tRod.position.y = .06 + .01; tg.add(tRod); const tCone = cyl(.0024, .0024, .02, M(0xdfe3e8, { m: .9 }), 10); tCone.position.y = .01; tg.add(tCone); const gl3 = makeGlove(); gl3.position.set(0, .1, 0); gl3.rotation.z = Math.PI / 2; tg.add(gl3);
  const pl = weldCoupon(.46, .2, .004); pl.position.set(.06, .042, -.05); root.add(pl); const Y0 = .042 + .004, BZ = -.05;
  const bead = makeBead2(root, .0075); const arc = makeArc(root, 0xb8d8ff); const sparks = makeSparks(root, 40); const gas = gasCloud(root, 0xc8b8ff); const pool = sparkSprite(0xffb050); pool.scale.setScalar(.03); pool.userData.noFit = true; root.add(pool);
  const rd = readout(.7, .1); rd.mesh.position.set(-.05, .62, -.5); root.add(rd.mesh);
  part('mach', mach, V(0, .32, 0), L('ماكينة TIG', 'TIG machine'), L('دوس عليها تبدّل AC/DC.', 'Tap to switch AC/DC.')); part('torch', TT, V(.05, .16, 0), L('التورش', 'TIG torch'), L('جواه تنجستن ما بيسيحش.', 'Holds a non-melting tungsten.')); part('rod', RG, V(0, .3, 0), L('سلك الإضافة', 'Filler rod'), L('بالإيد التانية.', 'In the other hand.'));
  part('pedal', ped, V(0, .1, 0), L('دواسة الأمبير', 'Foot pedal'), ''); part('grinder', grinder, V(0, .18, 0), L('حجر سن التنجستن', 'Tungsten grinder'), ''); part('reg', regG, V(0, .09, 0), L('عدّاد الأرجون', 'Argon flowmeter'), '');
  const st = { m: 'intro', ac: 0 }; let t = 0, cyc = -1;
  ctx.parts.mach.tap = () => { st.ac ^= 1; return st.ac ? L('AC: للألومنيوم (بيكسر طبقة الأكسيد)', 'AC: for aluminium (breaks the oxide)') : L('DC: للصلب والاستانلس والنحاس', 'DC: for steel, stainless and copper'); };
  return {
    ...ctx, view: V(.15, .55, 1.3), sway: true, hint: L('دوس على الماكينة تبدّل AC/DC', 'Tap the machine to switch AC/DC'),
    steps: [
      { title: L('اللحام بالتنجستن والأرجون TIG', 'TIG welding with argon'), text: L('جهاز تالت مختلف: اللحّام ماسك التورش بإيد، وسلك الإضافة بالإيد التانية، ورجله على الدواسة. التنجستن جوه التورش ما بيسيحش؛ القوس بيسيّح اللوح، والسلك بيتغمس في البركة. غاز الأرجون بيحمي البركة. لحام نضيف جدًا من غير شرار ولا خبث.', 'A third, different machine: the welder holds the torch in one hand, the filler rod in the other, and a foot on the pedal. The tungsten in the torch does not melt; the arc melts the plate and the rod is dipped into the pool. Argon shields the pool. A very clean weld with no spatter or slag.'), s: { m: 'intro' } },
      { title: L('الماكينة والإعداد', 'Machine and setup'), text: L('مفتاح AC/DC: الـ DC للصلب والاستانلس، والـ AC للألومنيوم. طارة الأمبير بتحدد أقصى تيار، والدواسة بتتحكم فيه وانت شغال. التورش والغاز والدواسة كل واحد ليه مخرج في وش الماكينة. والأرجون 7–10 لتر/دقيقة. دوس على الماكينة تبدّل AC/DC.', 'The AC/DC switch: DC for steel and stainless, AC for aluminium. The current knob sets the maximum and the pedal controls it while welding. The torch, gas and pedal each have a socket on the front. Argon at 7–10 L/min. Tap the machine to switch AC/DC.'), cam: { t: [-.45, .15, -.1], d: .33, dir: [.05, .2, 1] }, s: { m: 'setup' } },
      { title: L('سن التنجستن', 'Grinding the tungsten'), text: L('التنجستن بيتسن على حجر ناعم بالطول (الخطوط ماشية مع طول السن، مش بالعرض)، لحد ما يبقى مدبّب بطول 2–3 مرات قطره. شوف السن وهو بيتكوّن. ولو التنجستن لمس البركة بيتلوّث ولازم يتسن تاني.', 'The tungsten is ground lengthwise on a fine wheel (the marks run along the point, not round it) until it is pointed over 2–3 times its diameter. Watch the point form. If the tungsten touches the pool it is contaminated and must be reground.'), cam: { t: [.47, .14, -.17], d: .3, dir: [.25, .3, 1] }, s: { m: 'tung' } },
      { title: L('التقنية: الدواسة والغمس', 'Technique: pedal and dipping'), text: L('التورش مايل 70–80° والقوس قصير 2–3 مم. بنضغط الدواسة بالراحة لحد ما بركة لامعة تتكوّن، وبعدين إيقاع منتظم: نغمس طرف السلك في حافة البركة ونسحبه، ونقدّم التورش خطوة. الخط بيطلع زي العملات المرصوصة. في الآخر نرفع رجلنا بالتدريج عشان ما يتعملش حفرة.', 'Hold the torch at 70–80° with a short 2–3 mm arc. Press the pedal gently until a shiny pool forms, then keep a steady rhythm: dip the rod into the leading edge of the pool and withdraw, then advance the torch a step. The bead looks like stacked coins. At the end ease off the pedal to avoid a crater.'), cam: { t: [.02, .06, -.04], d: .3, dir: [.2, .5, 1] }, s: { m: 'weld' } }
    ],
    apply(s){ st.m = s.m; t = 0; cyc = -1; bead.clear(); sparks.clear(); },
    update(dt){ t += dt; const m = st.m; const T = 10, c = Math.floor(t / T), f = (t % T) / T; if(c !== cyc){ cyc = c; bead.clear(); }
      lever.rotation.x = st.ac ? .6 : -.6; lever.position.y = st.ac ? .012 : -.012;
      const weld = m === 'weld' || m === 'intro'; const k = Math.min(1, f / .85); const x = -.15 + k * .32; const step = Math.floor(t * 1.6), ph = (t * 1.6) % 1; const on = weld && k < 1;
      const press = weld ? (k < .06 ? k / .06 : k > .94 ? Math.max(0, (1 - k) / .06) : 1) : m === 'setup' ? .5 + .5 * Math.sin(t * 2) : 0; pTop.rotation.x = -press * .2;
      const amps = Math.round(20 + press * (st.ac ? 70 : 60)); disp.set(on || m === 'setup' ? String(amps) + 'A' : '60A'); knob.set(.35); knob.glow(m === 'setup', t);
      ball.position.y = -.045 + (m === 'setup' || weld ? 8 / 20 : 0) * .09;
      const d = V(-Math.sin(.3), Math.cos(.3), 0); const tip = V(weld ? x : -.05, Y0 + (weld ? .003 : .1), BZ); orientTool(TT, tip, d, V(-.6, .4, -.8)); if(!weld) orientTool(TT, V(.1, .1, .2), V(0, 1, 0), V(1, 0, 0));
      tCable.set([relTo(root, TT, V(.15, .12, 0)), V(.1, .25, .3), V(-.25, .12, .2), relTo(root, mach, V(-.04, .03, .14))]);
      const dip = weld && ph < .45; const rd_ = V(-Math.cos(.35), Math.sin(.35), 0).multiplyScalar(-1); const rodTip = V(x + .01, Y0 + (dip ? .002 : .014), BZ + .004); RG.visible = weld; orientTool(RG, rodTip, V(.9, .4, .3), V(0, 0, 1));
      arc.group.position.set(x, Y0 + .001, BZ); arc.set(on, t); pool.position.set(x, Y0 + .002, BZ); pool.material.opacity = on ? .9 : 0; pool.scale.setScalar(.022 + press * .012);
      if(on && dip && ph > .3 && ph < .45 && Math.random() < .7) bead.add(V(x - .002, Y0, BZ), V(0, 1, 0), 1.15, 1.1);
      gas.update(tip, d, t, on); bead.update(dt);
      /* سن التنجستن */
      const grind = m === 'tung'; wh.rotation.x += grind ? dt * 40 : 0; const sharp = grind ? Math.min(1, (t % 8) / 6) : 1; tCone.geometry.dispose(); tCone.geometry = new THREE.CylinderGeometry(.0024 * (1 - sharp) + .0003, .0024, .006 + sharp * .012, 10); tCone.position.y = (.006 + sharp * .012) / 2;
      tg.visible = grind; if(grind){ const wpos = relTo(root, grinder, V(.07, .1, .062)); const slide = Math.sin(t * 3) * .006; tg.position.copy(wpos).add(V(slide, 0, .002)); tg.quaternion.setFromUnitVectors(UPV, V(1, .1, .35).normalize()); if(sharp < 1) sparks.emit(wpos.clone().add(V(0, -.005, 0)), 30, dt, V(0, -.3, .5)); }
      sparks.update(dt);
      rd.setText({ intro: L('تورش + سلك باليد + دواسة + أرجون', 'Torch + hand-fed rod + pedal + argon'), setup: L(st.ac ? 'AC للألومنيوم · أرجون 8 لتر/د' : 'DC للصلب · أرجون 8 لتر/د', st.ac ? 'AC for aluminium · argon 8 L/min' : 'DC for steel · argon 8 L/min'), tung: sharp < 1 ? L('بنسن بالطول على الحجر', 'Grinding lengthwise') : L('مدبّب 2–3 × القطر ✓', 'Point 2–3 × diameter ✓'), weld: L(dip ? `غمس السلك · ${amps} أمبير` : `تقدّم التورش · ${amps} أمبير`, dip ? `Dip the rod · ${amps} A` : `Advance the torch · ${amps} A`) }[m]);
    }
  };
}

/* ---------- 4) الوصلة التقابلية: شطفة V ومشاوير وعيوب وتشطيب (لقطات قريبة) ---------- */
function buildButtJoint(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); weldTable(root);
  const th = .03, Wd = .16, Ln = .44, gap = .006, land = .006; const pm = M(0x8a96a3, { m: .7, r: .42 });
  const mkPlate = s => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(Wd, 0); sh.lineTo(Wd, th); sh.lineTo(th * .58, th); sh.lineTo(0, land); sh.lineTo(0, 0); const g = new THREE.ExtrudeGeometry(sh, { depth: Ln, bevelEnabled: false }); g.translate(0, 0, -Ln / 2); const m = new THREE.Mesh(g, pm); m.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; m.position.set(0, .042, s * gap / 2); if(s < 0) m.scale.x = 1; return m; };
  const pg = new THREE.Group(); root.add(pg); const pA = mkPlate(1), pB = mkPlate(-1); pg.add(pA); pg.add(pB);
  /* لون المقطع عشان الـ V يبان */
  const endCap = new THREE.Group(); pg.add(endCap);
  const tacks = [-.18, 0, .18].map(x => { const s = new THREE.Mesh(new THREE.SphereGeometry(.009, 10, 6), M(0x6b6560, { m: .5 })); s.scale.set(1.6, .7, 1.2); s.position.set(x, .042 + land + .002, 0); pg.add(s); return s; });
  const passes = [0, 1, 2, 3].map(() => makeBead2(pg, .01, 260)); const P_Y = [land + .003, land + .011, th * .72, th + .002], P_W = [.7, 1.1, 1.6, 2.1];
  const H = new THREE.Group(); root.add(H); const rodCoat = cyl(.0042, .0042, .24, M(0xc9b48a, { r: .85 }), 10); rodCoat.position.y = .12; H.add(rodCoat); const jaw = box(.03, .028, .028, M(0xe8b630)); jaw.position.y = .25; H.add(jaw); const hb = cyl(.016, .02, .14, M(0xe8b630), 14); hb.rotation.z = Math.PI / 2 - .55; hb.position.set(.06, .29, 0); H.add(hb); const glv = makeGlove(); glv.position.set(.07, .3, 0); glv.rotation.z = -.55; H.add(glv);
  const arc = makeArc(root, 0xd8ecff), sparks = makeSparks(root, 70);
  const defects = new THREE.Group(); pg.add(defects); const DEF = [];
  [[-.16, 'poro', L('مسام', 'Porosity')], [-.05, 'under', L('تآكل الحواف', 'Undercut')], [.06, 'crack', L('شرخ', 'Crack')], [.16, 'spatter', L('رذاذ', 'Spatter')]].forEach(([x, k, lb]) => { const g = new THREE.Group(); g.position.set(x, .042 + th + .006, 0); defects.add(g);
    if(k === 'poro') for(let i = 0; i < 6; i++){ const h = new THREE.Mesh(new THREE.SphereGeometry(.0035, 8, 6), M(0x111111)); h.position.set((i - 2.5) * .007, .001, (i % 2 ? 1 : -1) * .004); g.add(h); }
    else if(k === 'under'){ [-1, 1].forEach(s => { const u = box(.05, .004, .004, M(0x111111)); u.position.set(0, -.004, s * .022); g.add(u); }); }
    else if(k === 'crack'){ const c = box(.045, .002, .0018, M(0x111111)); c.rotation.y = .25; g.add(c); }
    else for(let i = 0; i < 10; i++){ const s = new THREE.Mesh(new THREE.SphereGeometry(.0028, 6, 4), M(0x6c747d)); s.position.set((Math.random() - .5) * .07, -.005, (Math.random() > .5 ? 1 : -1) * (.03 + Math.random() * .03)); g.add(s); }
    g.add(at(label(lb, '#ffd34d', .03), 0, .035, 0)); });
  const grinder = new THREE.Group(); root.add(grinder); const gb = cyl(.03, .03, .2, M(0x2a62c9), 16); gb.rotation.z = Math.PI / 2; gb.position.set(.1, .06, 0); grinder.add(gb); const gh2 = box(.06, .05, .06, M(0x3a3f46)); gh2.position.set(0, .05, 0); grinder.add(gh2); const disc = cyl(.055, .055, .006, M(0x6c747d), 28); disc.position.set(0, .015, 0); grinder.add(disc); const gglv = makeGlove(); gglv.position.set(.14, .07, 0); grinder.add(gglv);
  const sec = makeCanvas(.4, .26, 640); sec.mesh.position.set(.42, .28, -.32); root.add(sec.mesh); const rd = readout(.7, .1); rd.mesh.position.set(-.05, .6, -.5); root.add(rd.mesh);
  part('plates', pg, V(-.15, .1, .1), L('اللوحين المشطوفين', 'Bevelled plates'), ''); part('sec', sec.mesh, V(0, .15, 0), L('قطاع الوصلة', 'Joint section'), ''); part('grind', grinder, V(0, .1, 0), L('صاروخ التجليخ', 'Angle grinder'), '');
  const st = { m: 'prep' }; let t = 0, cyc = -1;
  const drawSec = n => sec.draw((x, W, H) => { x.fillStyle = '#f4f6f8'; x.fillRect(0, 0, W, H); const cy = 300, s = 7; x.fillStyle = '#8a96a3'; [-1, 1].forEach(sg => { x.beginPath(); x.moveTo(W / 2 + sg * 20, cy); x.lineTo(W / 2 + sg * 300, cy); x.lineTo(W / 2 + sg * 300, cy - 150); x.lineTo(W / 2 + sg * 108, cy - 150); x.lineTo(W / 2 + sg * 20, cy - 30); x.closePath(); x.fill(); });
    const C = ['#ffa040', '#e89050', '#c98a6a', '#9ea4ab']; const ys = [[cy + 6, cy - 34], [cy - 34, cy - 80], [cy - 80, cy - 130], [cy - 130, cy - 168]]; for(let i = 0; i < n; i++){ x.fillStyle = C[i]; const [a, b] = ys[i], wa = 20 + (cy - a) * .6, wb = 20 + (cy - b) * .6; x.beginPath(); x.moveTo(W / 2 - wa, a); x.lineTo(W / 2 + wa, a); x.quadraticCurveTo(W / 2 + wb + (i === 3 ? 10 : 0), (a + b) / 2, W / 2 + wb, b + (i === 3 ? 18 : 0)); x.quadraticCurveTo(W / 2, b - (i === 3 ? 12 : 0), W / 2 - wb, b + (i === 3 ? 18 : 0)); x.closePath(); x.fill(); }
    x.fillStyle = '#1d2128'; x.font = 'bold 28px Tahoma'; x.textAlign = 'center'; x.fillText(L('شطفة 60° · فتحة 2–3 مم · حافة 1–2 مم', '60° V · 2–3 mm gap · 1–2 mm root face'), W / 2, 50); x.fillStyle = '#d0021b'; x.fillText([L('قبل اللحام', 'Before welding'), L('مشوار الجذر', 'Root pass'), L('مشوار ملء', 'Fill pass'), L('ملء تاني', 'Second fill'), L('مشوار التغطية', 'Cap pass')][n], W / 2, H - 22); });
  const cIdx = { prep: 0, tack: 0, root: 1, fill: 4, defect: 4, finish: 4 };
  return {
    ...ctx, view: V(.15, .55, 1.25), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('تجهيز الوصلة التقابلية', 'Preparing a butt joint'), text: L('بص على طرف اللوحين: كل لوح مشطوف بحيث يتكوّن حرف V بزاوية كلية 60°، وتحت حافة 1–2 مم من غير شطف، وبين اللوحين فتحة 2–3 مم عشان اللحام يتغلغل لتحت. الحروف بتتنضف من الصدأ والزيت.', 'Look at the end of the plates: each is bevelled so together they form a 60° V, with a 1–2 mm unbevelled root face at the bottom and a 2–3 mm gap between them so the weld penetrates fully. The edges are cleaned of rust and oil.'), cam: { t: [-.2, .06, 0], d: .34, dir: [-1, .35, .25] }, s: { m: 'prep' } },
      { title: L('التنقيط (التثبيت)', 'Tack welding'), text: L('قبل اللحام بنثبّت اللوحين بـ 3 نقط لحام صغيرة: في الطرفين والنص، عشان الفتحة ما تقفلش من الحرارة. شوف كل نقطة وهي بتتعمل.', 'Before welding, three small tack welds — at both ends and the middle — hold the plates so the gap does not close up with heat. Watch each tack being made.'), cam: { t: [0, .06, 0], d: .4, dir: [.1, .6, 1] }, s: { m: 'tack' } },
      { title: L('مشوار الجذر', 'The root pass'), text: L('أول مشوار بإلكترود صغير 2.5 مم في قاع الـ V، ولازم يتغلغل ويبان من تحت. شوف خط الجذر وهو بيتبني في قاع الشطفة، وبعدين بيتشال خبثه كويس.', 'The first pass, with a small 2.5 mm electrode, goes in the bottom of the V and must penetrate through to the underside. Watch the root bead building in the bottom of the groove; its slag is then removed thoroughly.'), cam: { t: [0, .06, 0], d: .36, dir: [.15, .95, .55] }, s: { m: 'root' } },
      { title: L('مشاوير الملء والتغطية', 'Fill and cap passes'), text: L('بإلكترود 3.2 بنعمل مشاوير فوق الجذر بحركة تمايل، كل مشوار أعرض من اللي قبله، لحد ما الـ V يتملي ويعلى سنة بسيطة (مشوار التغطية). بين كل مشوار والتاني بنشيل الخبث. شوف القطاع بيتملي على الكارت.', 'With 3.2 mm electrodes, lay passes over the root with a weave, each wider than the last, until the V is full and slightly proud (the cap pass). Remove the slag between passes. Watch the section fill on the card.'), cam: { t: [.0, .07, 0], d: .4, dir: [.25, .8, .8] }, s: { m: 'fill' } },
      { title: L('عيوب اللحام', 'Weld defects'), text: L('المسام: فتحات صغيرة من إلكترود رطب أو صدأ أو قوس طويل. تآكل الحواف: مجرى جنب اللحام من أمبير عالي. الشرخ: أخطر عيب، من تبريد سريع. الرذاذ: نقط حوالين الخط من أمبير عالي أو قوس طويل.', 'Porosity: small holes from damp electrodes, rust or a long arc. Undercut: a groove beside the weld from high current. Crack: the most serious, from rapid cooling. Spatter: droplets round the bead from high current or a long arc.'), cam: { t: [0, .08, 0], d: .4, dir: [0, .8, .7] }, s: { m: 'defect' } },
      { title: L('تشطيب الوصلة', 'Finishing the joint'), text: L('بعد ما يبرد: نشيل الخبث والرذاذ، ونجلّخ العلو الزيادة بالصاروخ لحد ما يبقى مستوي مع اللوح لو الرسمة طالبة كده، ونفحص بعيننا.', 'Once cool: remove slag and spatter, grind the excess reinforcement flush with the angle grinder if the drawing requires, and inspect visually.'), cam: { t: [0, .08, 0], d: .42, dir: [.2, .55, 1] }, s: { m: 'finish' } }
    ],
    apply(s){ st.m = s.m; t = 0; cyc = -1; passes.forEach(p => { p.clear(); p.setSlag(false); }); drawSec(cIdx[s.m]); },
    update(dt){ t += dt; const m = st.m; const T = m === 'fill' ? 15 : 9, c = Math.floor(t / T), f = (t % T) / T; if(c !== cyc){ cyc = c; if(m === 'root' || m === 'fill') passes.forEach(p => p.clear()); }
      tacks.forEach((tk, i) => tk.visible = m !== 'prep' && (m !== 'tack' || f > [.1, .4, .7][i] + .12)); defects.visible = m === 'defect'; grinder.visible = m === 'finish'; H.visible = m === 'tack' || m === 'root' || m === 'fill';
      const full = (n) => { for(let j = 0; j < n; j++) if(passes[j].count < 20) for(let i = 0; i < 80; i++) passes[j].add(V(-.21 + i / 80 * .42, .042 + P_Y[j], 0), V(0, 1, 0), 1, P_W[j]); };
      if(m === 'defect') full(4); if(m === 'finish') full(4);
      let on = false, x = 0, y = .042 + land, w = 0, pi = 0;
      if(m === 'tack'){ const i = Math.min(2, Math.floor(f / .3)); x = [-.18, 0, .18][i]; on = (f % .3) > .1 && (f % .3) < .22 && f < .9; y = .042 + land + .002; }
      else if(m === 'root' || m === 'fill'){ const np = m === 'root' ? 1 : 3, per = .92 / np; pi = Math.min(np - 1, Math.floor(f / per)); const k = Math.min(1, (f - pi * per) / per); const j = m === 'root' ? 0 : pi + 1; on = f < .92 && k < .96; x = -.2 + k * .4; const tri = (t * 3) % 1; w = j ? ((tri < .5 ? tri * 2 : 2 - tri * 2) - .5) * .005 * P_W[j] : 0; y = .042 + P_Y[j];
        if(m === 'fill' && passes[0].count < 20) full(1); if(on && Math.random() < .9) passes[j].add(V(x - .003, y, w * .3), V(0, 1, 0), 1, P_W[j]); if(m === 'fill' && on) drawSec(Math.min(4, j + 1)); }
      const d = V(Math.sin(.3), Math.cos(.3), 0); orientTool(H, V(x, y + .004, w), d, V(.5, .6, -.8)); arc.group.position.set(x, y, w); arc.set(on, t); if(on) sparks.emit(V(x, y + .003, w), 45, dt, V(-.2, .7, .35));
      if(m === 'finish'){ const gx = -.2 + ((t * .08) % .4); grinder.position.set(gx, .042 + th + .004, 0); disc.rotation.y += dt * 60; sparks.emit(V(gx - .05, .042 + th + .006, 0), 60, dt, V(-.7, .3, .3)); passes[3].im.visible = true; for(let j = 2; j < 4; j++){ /* العلو بيتجلّخ لحد ما يبقى مستوي */ } }
      passes[3].im.scale.y = m === 'finish' ? Math.max(.3, 1 - ((t * .08) % .4) / .4 * .7) : 1;
      sparks.update(dt); passes.forEach(p => p.update(dt));
      rd.setText({ prep: L('V 60° · فتحة 2–3 مم · حافة 1–2 مم', 'V 60° · 2–3 mm gap · 1–2 mm root face'), tack: L('3 نقط: الطرفين والنص', '3 tacks: both ends and the middle'), root: L('مشوار الجذر · إلكترود 2.5 مم', 'Root pass · 2.5 mm electrode'), fill: L(['ملء أول', 'ملء تاني', 'التغطية'][pi] + ' · إلكترود 3.2 · تمايل', ['First fill', 'Second fill', 'Cap'][pi] + ' · 3.2 mm · weave'), defect: L('مسام · تآكل حواف · شرخ · رذاذ', 'Porosity · undercut · crack · spatter'), finish: L('تجليخ العلو الزيادة', 'Grinding the reinforcement flush') }[m]);
    }
  };
}
/* ================= تشغيل المعادن (برادة): أدوات مشتركة ================= */
const makeHand = () => { const w = new THREE.Group(); const g = makeGlove(0xd8a27c, 0x2d4f86); g.scale.setScalar(.42); w.add(g); w.userData.noFit = true; return w; };
const STEELM = () => M(0xb8bec6, { m: .85, r: .3 });
/* منجلة البنك: الفكين بطول x والشغلانة بتتمسك بين z=-.012 و z=w */
function makeBenchVise(){
  const g = new THREE.Group(), b = M(0x2a62c9, { m: .35, r: .45 }), st = STEELM();
  g.add(at(cyl(.08, .09, .025, b, 24), 0, .0125, -.04)); g.add(at(box(.14, .1, .12, b), 0, .075, -.06)); g.add(at(box(.2, .08, .05, b), 0, .165, -.041));
  const fp = box(.18, .06, .008, st); fp.position.set(0, .175, -.016); g.add(fp);
  const slide = new THREE.Group(); g.add(slide); slide.add(at(box(.2, .08, .05, b), 0, .165, .029)); slide.add(at(box(.18, .06, .008, st), 0, .175, .004)); slide.add(at(box(.06, .05, .22, b), 0, .1, .12)); slide.add(at(cyl(.014, .014, .05, st, 12).rotateX(Math.PI / 2), 0, .1, .24));
  for(let i = 0; i < 8; i++){ g.add(at(box(.18, .002, .002, M(0x6c747d)), 0, .15 + i * .007, -.0115)); slide.add(at(box(.18, .002, .002, M(0x6c747d)), 0, .15 + i * .007, -.0005)); }
  const bar = new THREE.Group(); bar.position.set(0, .1, .27); slide.add(bar); bar.add(cyl(.007, .007, .2, st, 8).rotateZ(Math.PI / 2)); [-1, 1].forEach(s => bar.add(at(new THREE.Mesh(new THREE.SphereGeometry(.012, 10, 8), st), s * .1, 0, 0)));
  const api = { group: g, slide, bar, top: .205, setOpen(w){ slide.position.z = w; bar.rotation.z = w * 140; }, mid(w){ return (-.012 + w) / 2; } }; api.setOpen(.03); return api;
}
/* تكسشر أسنان المبرد */
const FILE_TEX = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 32; const x = c.getContext('2d'); x.fillStyle = '#5d636b'; x.fillRect(0, 0, 256, 32); x.strokeStyle = '#8a9099'; x.lineWidth = 1.5; for(let i = -32; i < 256; i += 5){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 20, 32); x.stroke(); } x.strokeStyle = '#41464d'; for(let i = 0; i < 280; i += 7){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i - 14, 32); x.stroke(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
/* مبرد: النصل على +x من 0 لـ len، والإيد اليمين على اليد الخشب، والشمال على الطرف */
function makeFileTool(kind = 'flat', len = .26, hands = true){
  const g = new THREE.Group(); const fm = new THREE.MeshStandardMaterial({ color: 0xffffff, map: FILE_TEX, metalness: .6, roughness: .55 });
  let blade; if(kind === 'half'){ blade = new THREE.Mesh(new THREE.CylinderGeometry(.014, .014, len, 20, 1, false, 0, Math.PI), fm); blade.rotation.z = Math.PI / 2; blade.rotation.x = Math.PI / 2; blade.scale.set(1, 1, .45); blade.position.set(len / 2, .0, 0); }
  else { blade = box(len, .006, .024, fm); blade.position.set(len / 2, .003, 0); } g.add(blade);
  g.add(at(box(.04, .004, .008, STEELM()), -.02, .003, 0)); const h = cyl(.016, .012, .11, M(0x9a6a3e, { r: .7 }), 14); h.rotation.z = Math.PI / 2; h.position.set(-.085, .003, 0); g.add(h); g.add(at(cyl(.017, .017, .012, M(0xc9a24a, { m: .7 }), 14).rotateZ(Math.PI / 2), -.03, .003, 0));
  if(hands){ const r = makeHand(); r.position.set(-.09, .01, 0); r.rotation.y = Math.PI; g.add(r); const l = makeHand(); l.position.set(len - .02, .032, 0); l.rotation.set(0, Math.PI / 2, 0); l.scale.set(.6, .45, .6); g.add(l); }
  g.traverse(o => o.userData.noFit = true); return g;
}
/* برادة متطايرة */
function makeFilings(root, n = 40, col = 0x9aa0a6){ const P = []; for(let i = 0; i < n; i++){ const p = box(.003, .002, .003, M(col, { m: .8 })); p.userData = { noFit: true, v: V(0, 0, 0), life: 0 }; p.visible = false; root.add(p); P.push(p); } let k = 0;
  return { emit(pos, rate, dt, dir = V(.3, .1, 0)){ if(Math.random() > rate * dt) return; const p = P[k++ % n]; p.position.copy(pos); p.userData.life = 1.2; p.userData.v.set(dir.x + (Math.random() - .5) * .2, dir.y + Math.random() * .1, dir.z + (Math.random() - .5) * .2); },
    update(dt, floor = 0){ P.forEach(p => { const u = p.userData; if(u.life <= 0){ p.visible = false; return; } p.visible = true; u.life -= dt; u.v.y -= 1.5 * dt; p.position.addScaledVector(u.v, dt); if(p.position.y < floor){ p.position.y = floor; u.v.set(0, 0, 0); } p.rotation.x += dt * 8; }); } }; }
/* شاكوش بإيد */
function makeHandHammer(){ const g = new THREE.Group(); g.add(at(box(.012, .2, .016, M(0x9a6a3e, { r: .7 })), 0, .1, 0)); const hd = box(.08, .022, .022, M(0x3a3f46, { m: .8 })); hd.position.y = .205; g.add(hd); const hnd = makeHand(); hnd.position.set(0, .04, 0); hnd.rotation.z = Math.PI / 2; g.add(hnd); g.traverse(o => o.userData.noFit = true); return g; }
/* ضربة شاكوش على نقطة: رأس الشاكوش ينزل على p */
function hammerAt(h, p, a){ const ang = .1 + a * .9; h.rotation.set(0, 0, Math.PI / 2 + ang); const r = .205; h.position.set(p.x + r * Math.cos(ang) + .04, p.y + .011 + r * Math.sin(ang), p.z); }
/* كارت معلومات */
function infoCard(root, title, rows, pos = [.42, .42, -.5], w = .5, hh = .33){ const c = makeCanvas(w, hh, 640); c.mesh.position.set(...pos); c.mesh.scale.setScalar(.62); root.add(c.mesh);
  c.draw((x, W, H) => { x.fillStyle = '#f4f6f8'; x.fillRect(0, 0, W, H); x.fillStyle = '#2a62c9'; x.fillRect(0, 0, W, 56); x.fillStyle = '#fff'; x.font = 'bold 30px Tahoma'; x.textAlign = 'center'; x.fillText(title, W / 2, 39); const gap = (H - 80) / rows.length;
    rows.forEach(([a, b], i) => { const y = 92 + i * gap; x.textAlign = 'right'; x.fillStyle = '#d0021b'; x.font = 'bold 25px Tahoma'; x.fillText(a, W - 18, y); x.fillStyle = '#1d2128'; x.font = '22px Tahoma'; x.fillText(b, W - 18, y + 30); }); }); return c; }

/* ---------- 1) القياس والشنكرة ---------- */
function buildMarking(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const plate = box(.6, .06, .4, M(0x26282c, { r: .35, m: .1 })); plate.position.set(-.05, .03, -.08); root.add(plate); const PT = .06;
  const blue = M(0x2a4fb0, { m: .4, r: .5 }), st = STEELM(); const wm = [st, st, blue, st, blue, st]; const work = new THREE.Mesh(new THREE.BoxGeometry(.18, .07, .12), wm); work.position.set(-.12, PT + .035, -.06); root.add(work); const WT = PT + .07, WF = -.06 + .06;
  /* القدمة ذات الورنية */
  const cal = new THREE.Group(); root.add(cal); const beam = makeCanvas(.32, .02, 512); beam.mesh.rotation.x = -Math.PI / 2; cal.add(beam.mesh); cal.add(at(box(.32, .004, .02, st), 0, -.003, 0));
  beam.draw((x, W, H) => { x.fillStyle = '#d9dde2'; x.fillRect(0, 0, W, H); x.fillStyle = '#111'; for(let i = 0; i <= 150; i++){ const px = 20 + i * (W - 40) / 150; x.fillRect(px, 0, 1.5, i % 10 ? (i % 5 ? 8 : 12) : 18); if(i % 10 === 0){ x.font = 'bold 12px monospace'; x.fillText(String(i / 10), px + 2, 30); } } });
  const fj = box(.012, .06, .006, st); fj.position.set(-.15, -.03, 0); cal.add(fj); const sj = new THREE.Group(); cal.add(sj); sj.add(at(box(.05, .01, .026, st), 0, .001, 0)); sj.add(at(box(.012, .06, .006, st), -.02, -.03, 0)); const vs = makeCanvas(.04, .012, 256); vs.mesh.rotation.x = -Math.PI / 2; vs.mesh.position.set(.005, .0065, .005); sj.add(vs.mesh);
  vs.draw((x, W, H) => { x.fillStyle = '#eef1f4'; x.fillRect(0, 0, W, H); x.fillStyle = '#d0021b'; for(let i = 0; i <= 20; i++){ x.fillRect(8 + i * (W - 16) / 20, 0, 2, i % 5 ? 14 : 24); } });
  const calH = makeHand(); calH.position.set(.02, .02, .02); calH.scale.setScalar(.8); sj.add(calH); cal.traverse(o => o.userData.noFit = true);
  /* المقياس الارتفاعي */
  const hg = new THREE.Group(); hg.position.set(-.1, PT, .12); root.add(hg); hg.add(at(box(.09, .02, .07, M(0x3a3f46)), 0, .01, 0)); hg.add(at(box(.018, .3, .018, st), 0, .17, 0)); const hsc = makeCanvas(.016, .28, 128); hsc.mesh.position.set(0, .17, .0095); hg.add(hsc.mesh); hsc.draw((x, W, H) => { x.fillStyle = '#d9dde2'; x.fillRect(0, 0, W, H); x.fillStyle = '#111'; for(let i = 0; i < 56; i++){ x.fillRect(0, i * H / 56, i % 5 ? 30 : 60, 3); } });
  const hs = new THREE.Group(); hg.add(hs); hs.add(at(box(.035, .03, .03, M(0x5a6068, { m: .6 })), 0, 0, 0)); const scr = box(.006, .003, .12, M(0xdfe3e8, { m: .9 })); scr.position.set(0, -.008, -.06); hs.add(scr);
  const hLine = box(1, .0015, .002, M(0xf4f6f8, { m: .2, r: .2 })); hLine.position.z = WF + .0005; root.add(hLine);
  /* الزاوية والشنكار والسنبك والبرجل */
  const sq = new THREE.Group(); root.add(sq); sq.add(at(box(.15, .004, .022, st), 0, 0, 0)); sq.add(at(box(.025, .03, .1, M(0x2b3038)), -.075, -.005, .045));
  const sb = new THREE.Group(); root.add(sb); sb.add(at(cyl(.003, .0008, .14, st, 8), 0, .07, 0)); const sbH = makeHand(); sbH.position.y = .1; sbH.scale.setScalar(.7); sb.add(sbH); sb.traverse(o => o.userData.noFit = true);
  const tLine = box(1, .0015, .0015, M(0xf4f6f8, { r: .2 })); tLine.position.set(0, WT + .0006, -.06); root.add(tLine);
  const punch = new THREE.Group(); root.add(punch); punch.add(at(cyl(.005, .001, .02, st, 10), 0, .01, 0)); punch.add(at(cyl(.006, .006, .09, M(0x6c747d, { m: .7 }), 10), 0, .065, 0)); const pH = makeHand(); pH.position.y = .07; pH.scale.setScalar(.7); punch.add(pH); punch.traverse(o => o.userData.noFit = true);
  const ham = makeHandHammer(); root.add(ham); const marks = [[-.17, -.06], [-.07, -.06]].map(([x, z]) => { const m = cyl(.002, .002, .001, M(0x111111), 8); m.position.set(x, WT + .0005, z); m.visible = false; root.add(m); return m; });
  const div = new THREE.Group(); root.add(div); const dl1 = cyl(.002, .001, .1, st, 6), dl2 = cyl(.002, .001, .1, st, 6); div.add(dl1); div.add(dl2); div.add(at(cyl(.008, .008, .006, st, 12), 0, .09, 0)); div.traverse(o => o.userData.noFit = true);
  const arcM = new THREE.Mesh(new THREE.BufferGeometry(), M(0xf4f6f8, { r: .2 })); arcM.userData.noFit = true; root.add(arcM);
  const card = makeCanvas(.5, .3, 640); card.mesh.position.set(.42, .42, -.5); card.mesh.scale.setScalar(.62); root.add(card.mesh);
  card.draw((x, W, H) => { x.fillStyle = '#f4f6f8'; x.fillRect(0, 0, W, H); x.fillStyle = '#1d2128'; x.font = 'bold 28px Tahoma'; x.textAlign = 'center'; x.fillText(L('قراية الورنية: 25.40 مم', 'Reading the vernier: 25.40 mm'), W / 2, 40);
    const y0 = 150; x.fillStyle = '#d9dde2'; x.fillRect(30, y0 - 60, W - 60, 60); x.fillStyle = '#111'; for(let i = 0; i <= 50; i++){ const px = 40 + i * 11; x.fillRect(px, y0 - 60, 2, i % 10 ? (i % 5 ? 18 : 28) : 40); if(i % 10 === 0){ x.font = 'bold 18px monospace'; x.fillText(String(20 + i / 10 * 1), px, y0 - 6); } }
    x.fillStyle = '#eef1f4'; x.fillRect(80, y0, 300, 60); for(let i = 0; i <= 50; i += 1){ const px = 95 + i * 10.78 * .5; if(px > 370) break; x.fillStyle = i === 8 ? '#d0021b' : '#111'; x.fillRect(px, y0, i === 8 ? 4 : 2, i % 5 ? 16 : 26); }
    x.fillStyle = '#d0021b'; x.font = 'bold 22px Tahoma'; x.fillText(L('صفر الورنية بعد 25 · الخط رقم 8 متطابق ← 0.40', 'Vernier zero after 25 · line 8 aligns → 0.40'), W / 2, y0 + 110); x.fillStyle = '#1d2128'; x.fillText(L('القراية = 25 + 0.40 = 25.40 مم', 'Reading = 25 + 0.40 = 25.40 mm'), W / 2, y0 + 150); });
  const rd = readout(.62, .09); rd.mesh.position.set(0, .72, -.55); root.add(rd.mesh);
  part('plate', plate, V(.22, .04, .12), L('سطح الشنكرة', 'Surface plate'), L('زهر أو جرانيت مستوي جدًا.', 'Very flat cast iron or granite.')); part('work', work, V(0, .05, 0), L('الشغلانة متلونة بالأزرق', 'Work with marking blue'), ''); part('cal', cal, V(0, .03, 0), L('القدمة ذات الورنية', 'Vernier caliper'), '');
  part('hg', hg, V(0, .33, 0), L('المقياس الارتفاعي', 'Height gauge'), ''); part('sq', sq, V(0, .02, 0), L('الزاوية القايمة', 'Try square'), ''); part('card', card.mesh, V(0, .12, 0), L('قراية الورنية', 'Vernier reading'), '');
  const st_ = { m: 'tools' }; let t = 0;
  return {
    ...ctx, view: V(.15, .6, 1.2), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('أدوات القياس والشنكرة', 'Measuring and marking tools'), text: L('الشنكرة هي إننا نرسم أماكن القطع والثقوب على الشغلانة قبل التشغيل. الأدوات: سطح شنكرة مستوي، والقدمة ذات الورنية للقياس، والمقياس الارتفاعي، والزاوية القايمة، والشنكار (سن حاد للتعليم)، والسنبك، والبرجل. والشغلانة بنلونها بحبر أزرق عشان الخطوط تبان لامعة عليه.', 'Marking out means drawing the cut lines and hole positions on the work before machining. The tools: a flat surface plate, the vernier caliper for measuring, the height gauge, the try square, the scriber (a sharp point), the centre punch and the dividers. The work is coated with blue marking ink so the scribed lines show bright.'), s: { m: 'tools' } },
      { title: L('القياس بالقدمة ذات الورنية', 'Measuring with the vernier caliper'), text: L('نفتح الفك المتحرك ونقفله على الشغلانة بالراحة من غير ضغط. نقرا المسطرة الأساسية عند صفر الورنية (25 مم)، وبعدين ندوّر على خط الورنية اللي متطابق تمامًا مع خط في المسطرة (الخط 8 = 0.40 مم). القراية 25.40 مم. الدقة 0.02 أو 0.05 مم.', 'Open the sliding jaw and close it gently on the work. Read the main scale at the vernier zero (25 mm), then find the vernier line that lines up exactly with a main-scale line (line 8 = 0.40 mm). The reading is 25.40 mm. Resolution is 0.02 or 0.05 mm.'), cam: { t: [-.05, .15, -.06], d: .36, dir: [0, .8, .9] }, s: { m: 'cal' } },
      { title: L('التعليم بالشنكار والزاوية', 'Scribing with the square'), text: L('الحبر الأزرق ناشف على الوش. نسند كعب الزاوية القايمة على جنب الشغلانة المستوي، ونجرّ الشنكار جنب النصل وهو مايل شوية ناحية الحركة، مرة واحدة بضغط ثابت. الخط بيطلع لامع على الأزرق.', 'The blue ink is dry on the face. Hold the stock of the try square against a straight side of the work and draw the scriber along the blade, tilted slightly in the direction of travel, once with steady pressure. The line shows bright on the blue.'), cam: { t: [-.12, .14, -.06], d: .34, dir: [.2, .9, .7] }, s: { m: 'square' } },
      { title: L('الشنكرة بالمقياس الارتفاعي', 'Marking with the height gauge'), text: L('على سطح الشنكرة: نظبط سن المقياس الارتفاعي على الارتفاع المطلوب من التدريج، ونقفل المسمار، ونزحلق القاعدة على السطح والسن لامس وش الشغلانة. الخط بيطلع موازي للقاعدة بالظبط.', 'On the surface plate: set the scriber point of the height gauge to the required height on the scale, lock it, and slide the base across the plate with the point touching the work face. The line comes out exactly parallel to the base.'), cam: { t: [-.12, .12, .02], d: .36, dir: [.35, .35, 1] }, s: { m: 'height' } },
      { title: L('السنبك والبرجل', 'Centre punch and dividers'), text: L('عند تقاطع الخطوط بنحط سن السنبك ونخبطه خبطة واحدة بالشاكوش، فيعمل نقرة صغيرة مكان مركز الثقب. وبعدين نحط رجل البرجل في النقرة ونلف الرجل التانية نرسم الدايرة بنص القطر المطلوب.', 'At the line intersection place the centre-punch point and give it one hammer blow, making a small dimple at the hole centre. Then put one leg of the dividers in the dimple and swing the other to scribe the circle at the required radius.'), cam: { t: [-.12, .13, -.06], d: .36, dir: [.25, .9, .75] }, s: { m: 'punch' } }
    ],
    apply(s){ st_.m = s.m; t = 0; },
    update(dt){ t += dt; const m = st_.m, f = (t % 8) / 8;
      cal.visible = m === 'cal' || m === 'tools'; sq.visible = m === 'square' || m === 'tools'; sb.visible = m === 'square'; hs.visible = true; punch.visible = ham.visible = m === 'punch' && f < .5; div.visible = m === 'punch' && f >= .5;
      /* القدمة */
      cal.position.set(-.12 + .03, WT + .03, -.06); const open = m === 'cal' ? (f < .4 ? .1 - f / .4 * .07 : .03) : .1; sj.position.x = -.15 + .18 + open - .03 + .012; card.mesh.visible = true;
      /* الزاوية والشنكار */
      sq.position.set(-.12, WT + .002, -.11); sq.rotation.y = 0; const sx = m === 'square' ? Math.min(1, f / .7) : 0; tLine.scale.x = Math.max(.0001, sx * .17); tLine.position.x = -.205 + sx * .085; tLine.visible = m === 'square' || m === 'punch';
      sb.position.set(-.205 + sx * .17, WT, -.11 + .015); sb.rotation.set(-.2, 0, -.35);
      /* المقياس الارتفاعي */
      const hy = WT - .035; hs.position.y = hy - PT + .008; const hk = m === 'height' ? Math.min(1, f / .75) : (m === 'punch' || m === 'tools' ? 1 : 0); hg.position.x = -.24 + hk * .2; hLine.scale.x = Math.max(.0001, hk * .18); hLine.position.set(-.21 + hk * .09, hy, WF + .0006); hLine.visible = hk > 0;
      /* السنبك والبرجل */
      if(m === 'punch'){ const i = f < .25 ? 0 : 1; const p = V(i ? -.07 : -.17, WT, -.06); punch.position.copy(p); const a = Math.abs(Math.sin(t * 5)); hammerAt(ham, V(p.x, p.y + .11, p.z), a); marks.forEach((mk, j) => mk.visible = j < i || ((f % .25) > .12 && j === i) || f >= .5);
        if(f >= .5){ const k = Math.min(1, (f - .5) / .4); const c0 = V(-.07, WT, -.06), R = .035, ang = k * Math.PI * 2; div.position.copy(c0).add(V(0, .08, 0)); div.rotation.y = -ang; dl1.position.set(0, -.04, 0); dl2.position.set(R * .5, -.04, 0); dl2.rotation.z = Math.atan2(R, .08) * .9; dl1.rotation.z = 0;
          arcM.geometry.dispose(); arcM.geometry = new THREE.TorusGeometry(R, .0008, 4, 60, Math.max(.01, ang)); arcM.rotation.x = -Math.PI / 2; arcM.position.set(c0.x, WT + .0007, c0.z); arcM.visible = true; } else arcM.visible = false; }
      else { marks.forEach(mk => mk.visible = false); arcM.visible = false; }
      rd.setText({ tools: L('سطح شنكرة · ورنية · مقياس ارتفاع · زاوية', 'Surface plate · vernier · height gauge · square'), cal: f < .4 ? L('بنقفل الفك بالراحة', 'Closing the jaw gently') : L('القراية 25.40 مم', 'Reading 25.40 mm'), square: L('كعب الزاوية على الجنب · الشنكار مايل', 'Square against the side · scriber tilted'), height: L('السن على الارتفاع · القاعدة بتتزحلق', 'Point at height · base slides'), punch: f < .5 ? L('خبطة واحدة على السنبك', 'One blow on the punch') : L('البرجل بيرسم الدايرة', 'Dividers scribe the circle') }[m]);
    }
  };
}

/* ---------- 2) البرادة: السطوح المستوية والمتلاقية والمنحنية ---------- */
function buildFiling(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const vise = makeBenchVise(); vise.group.position.set(-.05, 0, -.12); root.add(vise.group); vise.setOpen(.04 - .012);
  const st = STEELM(), raw = M(0x6f6a64, { m: .5, r: .75 }), filed = M(0xc9ced6, { m: .85, r: .25 });
  const wg = new THREE.Group(); wg.position.set(-.05, vise.top - .03, -.12 + vise.mid(.028)); root.add(wg); const H0 = .06; const work = new THREE.Mesh(new THREE.BoxGeometry(.2, 1, .04), [raw, raw, raw, raw, raw, raw]); work.scale.y = H0; work.position.y = H0 / 2; wg.add(work);
  const curveEnd = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .04, 24, 1, false, -Math.PI / 2, Math.PI), filed); curveEnd.rotation.x = Math.PI / 2; curveEnd.position.set(.1, .03, 0); curveEnd.visible = false; wg.add(curveEnd);
  const file = makeFileTool('flat'), half = makeFileTool('half', .24); root.add(file); root.add(half);
  const se = new THREE.Group(); root.add(se); se.add(at(box(.22, .03, .003, st), 0, .015, 0)); se.traverse(o => o.userData.noFit = true); const gaps = [0, 1, 2].map(i => { const s = sparkSprite(0xfff4c0); s.scale.set(.03, .008, 1); s.userData.noFit = true; root.add(s); return s; });
  const tsq = new THREE.Group(); root.add(tsq); tsq.add(at(box(.004, .1, .03, M(0x2b3038)), 0, -.03, 0)); tsq.add(at(box(.08, .004, .02, st), .04, .02, 0)); tsq.traverse(o => o.userData.noFit = true);
  const filings = makeFilings(root, 50);
  const types = infoCard(root, L('أنواع المبارد', 'File types'), [[L('بالشكل', 'Shape'), L('مبطط · مربع · مدوّر · نص دايرة · مثلث', 'Flat · square · round · half-round · triangular')], [L('بالسنة', 'Cut'), L('خشن للتشغيل التقيل · ناعم للتشطيب', 'Bastard for heavy cuts · smooth for finishing')], [L('بالطول', 'Length'), '150 · 200 · 250 · 300 mm']]);
  const rd = readout(.62, .09); rd.mesh.position.set(0, .72, -.55); root.add(rd.mesh);
  part('vise', vise.group, V(0, .1, .25), L('المنجلة', 'Bench vice'), L('الشغلانة طالعة 5–10 مم بس فوق الفكين.', 'Work only 5–10 mm above the jaws.')); part('file', file, V(.15, .02, 0), L('المبرد', 'File'), ''); part('types', types.mesh, V(0, .12, 0), L('أنواع المبارد', 'File types'), '');
  const st_ = { m: 'types' }; let t = 0, h = H0, cyc = -1; const TOP = () => wg.position.y + h;
  const setH = v => { h = v; work.scale.y = h; work.position.y = h / 2; };
  return {
    ...ctx, view: V(.15, .55, 1.2), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('المبارد وتثبيت الشغلانة', 'Files and holding the work'), text: L('المبارد بتختلف بالشكل (مبطط ومربع ومدوّر ونص دايرة ومثلث) وبالسنة (خشن للشيل التقيل وناعم للتشطيب). لازم المبرد يكون ليه يد خشب سليمة. الشغلانة بتتمسك في المنجلة والجزء اللي هيتبرد طالع 5–10 مم بس فوق الفكين عشان ما تهتزش.', 'Files differ by shape (flat, square, round, half-round, triangular) and by cut (bastard for heavy removal, smooth for finishing). A file must always have a sound handle. The work is held in the vice with only 5–10 mm above the jaws so it does not vibrate.'), cam: { t: [.15, .3, -.3], d: .55, dir: [.2, .3, 1] }, s: { m: 'types' } },
      { title: L('برادة السطح المستوي', 'Filing a flat surface'), text: L('الإيد اليمين على اليد الخشب والشمال على طرف المبرد. الضغط في مشوار الزق لقدام بس، وفي الرجوع بنرفع الضغط. أول المشوار الضغط على الإيد الشمال أكتر، وفي الآخر على اليمين، عشان السطح يطلع مستوي مش مقبب. شوف البرادة وهي بتقع والسطح بيلمع.', 'Right hand on the handle, left hand on the tip. Press only on the forward stroke and relieve the pressure on the return. At the start of the stroke press more with the left hand and at the end more with the right, so the surface comes out flat, not rounded. Watch the filings fall and the surface brighten.'), cam: { t: [-.05, .24, -.1], d: .36, dir: [.3, .5, 1] }, s: { m: 'flat' } },
      { title: L('البرادة المتقاطعة', 'Cross filing'), text: L('بنغيّر اتجاه المبرد كل شوية بزاوية حوالي 30° يمين وشمال، فالخطوط بتتقاطع وبنعرف الأماكن العالية اللي لسه ما اتبردتش. وفي الآخر برادة طولية بمبرد ناعم للتشطيب.', 'Change the file direction every few strokes, about 30° to the left and right, so the marks cross and show the high spots not yet filed. Finish with straight strokes using a smooth file.'), cam: { t: [-.05, .24, -.12], d: .34, dir: [.1, .95, .5] }, s: { m: 'cross' } },
      { title: L('فحص الاستواء', 'Checking flatness'), text: L('بنحط حرف المسطرة على السطح في كذا اتجاه ونبص ناحية النور: لو في نور بيعدّي من تحت المسطرة يبقى في مكان واطي حواليه أماكن عالية لازم تتبرد. السطح السليم ما يعدّيش نور خالص.', 'Stand the straight edge on the surface in several directions and look towards the light: light passing under the edge shows a low spot with high spots around it that need filing. A true surface lets no light through.'), cam: { t: [-.05, .25, -.12], d: .33, dir: [0, .25, 1] }, s: { m: 'check' } },
      { title: L('السطوح المتلاقية (القايمة)', 'Adjacent faces at 90°'), text: L('بعد ما الوش الأول بقى مستوي (سطح الأساس)، بنبرد الجنب اللي جنبه ونفحصه بالزاوية القايمة: كعبها على سطح الأساس ونصلها على الجنب. لو النور بيعدّي من فوق أو تحت، نبرد الجهة العالية لحد ما ما يبقاش في نور.', 'Once the first face is flat (the datum face), file the adjacent side and check it with the try square: stock on the datum face, blade on the side. If light shows at the top or bottom, file the high side until no light shows.'), cam: { t: [.02, .23, -.1], d: .34, dir: [.5, .3, 1] }, s: { m: 'adj' } },
      { title: L('برادة السطوح المنحنية', 'Filing curved surfaces'), text: L('للطرف المدوّر من بره (محدب) بنستخدم المبرد المبطط ونحرّكه حركة هزّاز: بيتقدم وفي نفس الوقت بيلف حوالين الطرف. وللمقعر بنستخدم المبرد النص دايرة أو المدوّر مع لفّة خفيفة. ونفحص بمحدد الأنصاف (Radius gauge).', 'For an outside (convex) radius use the flat file with a rocking motion: it moves forward while sweeping round the end. For a concave radius use a half-round or round file with a slight twist. Check with a radius gauge.'), cam: { t: [.05, .24, -.12], d: .34, dir: [.4, .5, 1] }, s: { m: 'curve' } }
    ],
    apply(s){ st_.m = s.m; t = 0; cyc = -1; const done = { types: 0, flat: 0, cross: 1, check: 1, adj: 1, curve: 1 }[s.m]; work.material = [done && s.m === 'adj' ? filed : raw, raw, done ? filed : raw, raw, raw, raw]; setH(done ? H0 - .004 : H0); curveEnd.visible = false; },
    update(dt){ t += dt; const m = st_.m; const filing = m === 'flat' || m === 'cross' || m === 'adj' || m === 'curve'; file.visible = filing && m !== 'curve' || m === 'types'; half.visible = false; se.visible = m === 'check'; tsq.visible = m === 'adj' && (t % 6) > 4; gaps.forEach(g => g.material.opacity = 0);
      const T = 8, c = Math.floor(t / T), f = (t % T) / T; if(c !== cyc){ cyc = c; if(m === 'flat'){ setH(H0); work.material[2] = raw; } }
      const sp = (t * 1.1) % 1, push = sp < .62, k = push ? sp / .62 : 1 - (sp - .62) / .38; const top = TOP();
      if(m === 'types'){ file.position.set(.2, .02, .25); file.rotation.set(0, .3, 0); }
      else if(m === 'flat' || m === 'cross'){ const ang = m === 'cross' ? (Math.floor(t / 2.5) % 2 ? .5 : -.5) : 0; file.rotation.set(0, ang, 0); const dv = V(Math.cos(ang), 0, -Math.sin(ang)); const off = -.13 + (-.07 + k * .14); file.position.set(-.05 + dv.x * off, top + (push ? 0 : .006), wg.position.z + dv.z * off);
        if(push){ filings.emit(V(-.05 + .1 + Math.random() * .02, top, wg.position.z + (Math.random() - .5) * .04), 25, dt, V(.25, .05, .1)); if(m === 'flat' && h > H0 - .004) setH(h - dt * .0006); if(m === 'flat' && f > .35) work.material[2] = filed; } }
      else if(m === 'adj'){ file.rotation.set(Math.PI / 2, 0, 0); file.position.set(-.05 - .17 + k * .14, top - .015, wg.position.z + .02 + .004 + (push ? 0 : .006)); if(push) filings.emit(V(-.05 + .1, top - .015, wg.position.z + .02), 20, dt, V(.25, 0, .1)); if(f > .4) work.material[0] = filed;
        if(f > .5){ tsq.position.set(-.05, top + .002, wg.position.z + .02); tsq.rotation.set(0, Math.PI / 2, 0); } }
      else if(m === 'check'){ const dir = Math.floor(t / 2.5) % 3; se.position.set(-.05, top, wg.position.z); se.rotation.y = [0, .6, -.6][dir]; const bad = (t % 15) < 7.5; gaps.forEach((g, i) => { g.position.set(-.05 + (i - 1) * .03 * Math.cos(se.rotation.y), top + .002, wg.position.z - (i - 1) * .03 * Math.sin(se.rotation.y)); g.material.opacity = bad && i === 1 ? .9 : 0; }); }
      else if(m === 'curve'){ curveEnd.visible = f > .05; curveEnd.scale.set(1, 1, 1); const a = (Math.sin(t * 2.2) * .5 + .5) * Math.PI * .9 - Math.PI * .45; const cx = -.05 + .1, cy = wg.position.y + .03, r = .03; file.visible = true; file.rotation.set(0, 0, -a); const P = V(cx + Math.sin(a) * r, cy + Math.cos(a) * r, wg.position.z), Tg = V(Math.cos(a), -Math.sin(a), 0); file.position.copy(P).addScaledVector(Tg, -(.13 + (sp - .5) * .08)); filings.emit(V(cx + Math.sin(a) * r, cy + Math.cos(a) * r, wg.position.z), 15, dt, V(.2, .1, .1)); }
      filings.update(dt, .0);
      rd.setText({ types: L('الشغلانة 5–10 مم فوق الفكين', 'Work 5–10 mm above the jaws'), flat: push ? L('ضغط في مشوار الزق', 'Pressure on the forward stroke') : L('رجوع من غير ضغط', 'Return without pressure'), cross: L('اتجاهين متقاطعين ±30°', 'Two crossing directions ±30°'), check: (t % 15) < 7.5 ? L('نور تحت المسطرة = مكان واطي', 'Light under the edge = low spot') : L('مفيش نور = مستوي ✓', 'No light = flat ✓'), adj: f > .5 ? L('فحص بالزاوية القايمة', 'Checking with the try square') : L('برادة الجنب المتلاقي', 'Filing the adjacent side'), curve: L('حركة هزّاز حوالين الطرف', 'Rocking motion round the end') }[m]);
    }
  };
}

/* ---------- 3) النشر والقص اليدوي ---------- */
function buildSawing(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench());
  const vise = makeBenchVise(); vise.group.position.set(-.15, 0, -.12); root.add(vise.group); vise.setOpen(.03 - .012); const st = STEELM();
  const R = .015, BY = vise.top - .01, BZ = -.12 + vise.mid(.018), CX = .06;
  const barL = cyl(R, R, .3, M(0x8a9099, { m: .7, r: .4 }), 20); barL.rotation.z = Math.PI / 2; barL.position.set(CX - .15, BY, BZ); root.add(barL);
  const barR = new THREE.Group(); barR.position.set(CX, BY, BZ); root.add(barR); const br = cyl(R, R, .12, M(0x8a9099, { m: .7, r: .4 }), 20); br.rotation.z = Math.PI / 2; br.position.x = .061; barR.add(br);
  const kerf = box(.003, 1, R * 2.05, M(0x111111)); kerf.position.set(CX, BY, BZ); root.add(kerf); const line = box(.0015, .0015, R * 2.1, M(0xffffff)); line.position.set(CX, BY + R + .0005, BZ); root.add(line);
  /* المنشار */
  const saw = new THREE.Group(); root.add(saw); const TEETH = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 32; const x = c.getContext('2d'); x.fillStyle = '#c9ced6'; x.fillRect(0, 0, 512, 22); x.fillStyle = '#c9ced6'; for(let i = 0; i < 512; i += 8){ x.beginPath(); x.moveTo(i, 22); x.lineTo(i + 8, 22); x.lineTo(i + 8, 32); x.fill(); } x.fillStyle = '#2a62c9'; x.fillRect(0, 0, 512, 6); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(.3, .014), new THREE.MeshStandardMaterial({ map: TEETH, side: THREE.DoubleSide, metalness: .7, roughness: .35 })); blade.rotation.y = Math.PI / 2; blade.position.y = .007; saw.add(blade);
  const fr = tube(CR([V(0, .01, -.16), V(0, .12, -.16), V(0, .12, .16), V(0, .01, .16)]), .006, M(0x2b3038, { m: .5 }), 30); saw.add(fr); const grip = new THREE.Group(); grip.position.set(0, .04, .2); saw.add(grip); grip.add(at(box(.025, .1, .04, M(0x1d2128, { r: .6 })), 0, -.02, 0)); grip.rotation.x = -.3; const hR = makeHand(); hR.position.set(0, -.02, .01); hR.rotation.set(0, -Math.PI / 2, Math.PI / 2); hR.scale.setScalar(.85); grip.add(hR);
  const wing = new THREE.Group(); wing.position.set(0, .01, -.175); saw.add(wing); wing.add(at(box(.03, .006, .006, M(0xc9a24a, { m: .7 })), 0, 0, 0)); const hL = makeHand(); hL.position.set(0, .13, -.15); hL.rotation.set(0, -Math.PI / 2, 0); hL.scale.setScalar(.8); saw.add(hL); saw.traverse(o => o.userData.noFit = true);
  /* القص بالمقص */
  const sheet = box(.3, .002, .2, M(0xb7c0ca, { m: .7, r: .35 })); sheet.position.set(.2, .001, .25); root.add(sheet); const strip = new THREE.Group(); strip.position.set(.05, .002, .19); root.add(strip); const stripM = box(.3, .002, .03, M(0xb7c0ca, { m: .7, r: .35 })); stripM.position.x = .15; strip.add(stripM);
  const snips = new THREE.Group(); root.add(snips); const jA = new THREE.Group(), jB = new THREE.Group(); snips.add(jA); snips.add(jB); [jA, jB].forEach((j, i) => { j.add(at(box(.06, .004, .012, st), .03, 0, 0)); j.add(at(box(.1, .01, .014, M(i ? 0xd0021b : 0x2a62c9)), -.06, 0, 0)); }); const sH = makeHand(); sH.position.set(-.08, .02, 0); sH.scale.setScalar(.8); snips.add(sH); snips.traverse(o => o.userData.noFit = true);
  const chips = makeFilings(root, 40, 0xaab0b8);
  const tpi = infoCard(root, L('أسنان سلاح المنشار (سنة/بوصة)', 'Blade teeth per inch'), [['14', L('حديد طري وقطاعات تخينة', 'Mild steel, thick sections')], ['18', L('شغل عام', 'General work')], ['24', L('مواسير وزوايا', 'Tubes and angles')], ['32', L('صاج ومواسير رفيعة', 'Thin sheet and tube')]]);
  const rd = readout(.62, .09); rd.mesh.position.set(0, .72, -.55); root.add(rd.mesh);
  part('saw', saw, V(0, .12, 0), L('منشار يدوي (سلاح وفريم)', 'Hacksaw'), ''); part('bar', barL, V(.05, 0, 0), L('العمود في المنجلة', 'Bar in the vice'), ''); part('snips', snips, V(0, .02, 0), L('مقص الصاج', 'Tin snips'), ''); part('tpi', tpi.mesh, V(0, .12, 0), L('عدد الأسنان', 'Teeth per inch'), '');
  const st_ = { m: 'parts' }; let t = 0, cyc = -1, depth = 0;
  return {
    ...ctx, view: V(.2, .55, 1.2), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('المنشار وتركيب السلاح', 'The hacksaw and fitting the blade'), text: L('المنشار فريم ويد وسلاح. السلاح بيتركب والأسنان لقدام (بعيد عن اليد)، لأن القطع بيحصل في مشوار الزق. نشد السلاح بالصامولة المجنحة لحد ما يبقى مشدود كويس، ونختار عدد الأسنان حسب الشغلانة: لازم 3 أسنان على الأقل جوه التخانة.', 'A hacksaw is a frame, handle and blade. The blade is fitted with the teeth pointing forward (away from the handle) because it cuts on the push stroke. Tension it with the wing nut until taut, and choose the teeth per inch to suit the work: at least three teeth must be in the section at once.'), cam: { t: [.06, .3, -.12], d: .42, dir: [1, .45, .4] }, s: { m: 'parts' } },
      { title: L('بداية القطع', 'Starting the cut'), text: L('الشغلانة في المنجلة وخط القطع قريب من الفكين (5–10 مم) عشان ما تهتزش. بنعمل مجرى صغير بالمبرد أو بنسند السلاح على صباع الإيد الشمال، ونبدأ بمشاوير قصيرة خفيفة بزاوية بسيطة لحد ما السلاح يمسك في الخط.', 'The work is in the vice with the cut line close to the jaws (5–10 mm) so it does not vibrate. Make a small nick with a file or guide the blade with the left thumb, and start with short, light strokes at a slight angle until the blade bites on the line.'), cam: { t: [.06, .2, -.11], d: .34, dir: [1, .5, .5] }, s: { m: 'start' } },
      { title: L('النشر', 'Sawing'), text: L('مشاوير طويلة بطول السلاح كله، حوالي 40–60 مشوار في الدقيقة. ضغط في الزق لقدام، ورجوع من غير ضغط. شوف المجرى وهو بيعمق. لو السلاح سخن أو بيلزق نقلل السرعة.', 'Long strokes using the full length of the blade, about 40–60 strokes a minute. Press on the forward stroke and return without pressure. Watch the kerf get deeper. If the blade heats or binds, slow down.'), cam: { t: [.06, .2, -.11], d: .34, dir: [1, .5, .5] }, s: { m: 'saw' } },
      { title: L('آخر القطع', 'Finishing the cut'), text: L('قرب الآخر نقلل الضغط والسرعة ونسند الجزء اللي هيتقطع بالإيد عشان ما يقعش فجأة ويكسر السلاح أو يعوّر حد. بعدها نبرد الرايش (الزوائد) من على الحرف.', 'Near the end reduce pressure and speed and support the piece being cut off so it does not drop suddenly, break the blade or hurt someone. Then file the burr off the edge.'), cam: { t: [.08, .18, -.1], d: .38, dir: [1, .5, .6] }, s: { m: 'finish' } },
      { title: L('القص اليدوي بمقص الصاج', 'Cutting sheet with snips'), text: L('مقص الصاج للصاج الرفيع (لحد حوالي 1.2 مم). بنقص على الخط من الجنب اللي مش هنستخدمه، وما نقفلش الفكين للآخر في كل قصة عشان الحرف ما يتشرشرش. الشريحة المقصوصة بتلف لتحت. والحرف بعد القص حاد جدًا.', 'Snips are for thin sheet (up to about 1.2 mm). Cut along the line on the waste side and do not close the blades fully on each cut so the edge stays clean. The cut strip curls down out of the way. The cut edge is very sharp.'), cam: { t: [.2, .02, .22], d: .36, dir: [.2, .8, 1] }, s: { m: 'snips' } }
    ],
    apply(s){ st_.m = s.m; t = 0; cyc = -1; depth = 0; barR.position.set(CX, BY, BZ); barR.rotation.set(0, 0, 0); strip.rotation.set(0, 0, 0); },
    update(dt){ t += dt; const m = st_.m; const T = m === 'saw' ? 12 : 8, c = Math.floor(t / T), f = (t % T) / T; if(c !== cyc){ cyc = c; if(m === 'saw' || m === 'start') depth = 0; if(m === 'finish') depth = R * 1.6; barR.position.set(CX, BY, BZ); barR.rotation.set(0, 0, 0); }
      const sawing = m === 'start' || m === 'saw' || m === 'finish'; saw.visible = sawing || m === 'parts'; snips.visible = m === 'snips';
      const rate = m === 'start' ? 2.2 : 1.6, sp = (t * rate) % 1, push = sp < .55, k = push ? sp / .55 : 1 - (sp - .55) / .45; const amp = m === 'start' ? .03 : .11;
      if(sawing){ if(push){ depth = Math.min(R * 2, depth + dt * (m === 'start' ? .0006 : m === 'saw' ? .0022 : .0012)); chips.emit(V(CX, BY - R, BZ + (Math.random() - .5) * .02), 25, dt, V(0, -.05, (Math.random() - .5) * .3)); }
        saw.position.set(CX, BY + R - depth, BZ + .03 - k * amp * 2 + amp); saw.rotation.set(m === 'start' ? .12 : 0, 0, 0); }
      else if(m === 'parts'){ saw.position.set(CX + .2, .25, .05); saw.rotation.set(0, 0, 0); wing.rotation.z = t * 3; }
      kerf.scale.y = Math.max(.0001, depth); kerf.position.y = BY + R - depth / 2; kerf.visible = depth > 0;
      if(m === 'finish' && depth >= R * 1.98){ barR.rotation.z = Math.max(-1.2, barR.rotation.z - dt * 1.5); barR.position.y = Math.max(.02, barR.position.y - dt * .2); saw.visible = false; }
      if(m === 'snips'){ const kk = Math.min(1, f / .85); snips.position.set(.05 + kk * .28, .006, .205); const o = Math.abs(Math.sin(t * 6)) * .25; jA.rotation.y = o; jB.rotation.y = -o; strip.rotation.x = -kk * .5; stripM.scale.x = 1; }
      chips.update(dt, .0);
      rd.setText({ parts: L('الأسنان لقدام · السلاح مشدود', 'Teeth forward · blade taut'), start: L('مشاوير قصيرة خفيفة على الخط', 'Short light strokes on the line'), saw: push ? L(`ضغط لقدام · العمق ${Math.round(depth / (R * 2) * 100)}%`, `Pressure forward · depth ${Math.round(depth / (R * 2) * 100)}%`) : L('رجوع من غير ضغط', 'Return without pressure'), finish: depth >= R * 1.98 ? L('القطعة اتفصلت · نسندها', 'Piece cut off · support it') : L('ضغط خفيف قرب الآخر', 'Light pressure near the end'), snips: L('قص على الخط · الشريحة بتلف لتحت', 'Cut on the line · strip curls away') }[m]);
    }
  };
}

/* ---------- 4) الثقب والتخويش والثقوب الصماء والبرغلة ---------- */
function buildDrilling(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); const st = STEELM(), gr = M(0x4f8a6e, { r: .45 }), dk = M(0x2b3038, { r: .5 });
  const D = new THREE.Group(); D.position.set(-.1, 0, -.2); root.add(D);
  D.add(at(box(.3, .04, .32, gr), 0, .02, .02)); D.add(at(cyl(.032, .032, .78, st, 20), 0, .41, -.1)); D.add(at(box(.24, .02, .22, gr), 0, .26, .04)); D.add(at(box(.07, .05, .07, gr), 0, .245, -.09));
  const head = new THREE.Group(); head.position.set(0, .68, 0); D.add(head); head.add(at(box(.17, .14, .26, gr), 0, 0, .0)); head.add(at(box(.17, .05, .3, dk), 0, .095, -.02)); head.add(at(cyl(.06, .06, .16, gr, 20).rotateX(Math.PI / 2), 0, -.01, -.2)); head.add(at(box(.03, .03, .01, M(0x1f7a4a)), -.06, .02, .131)); head.add(at(box(.03, .03, .01, M(0xd0021b)), -.06, -.025, .131));
  const quill = new THREE.Group(); quill.position.set(0, -.07, .07); head.add(quill); quill.add(at(cyl(.022, .022, .08, st, 18), 0, -.04, 0)); const spin = new THREE.Group(); spin.position.y = -.08; quill.add(spin); spin.add(at(cyl(.024, .012, .05, M(0x6c747d, { m: .8 }), 18), 0, -.025, 0)); spin.add(at(box(.004, .03, .05, M(0x3a3f46)), .02, -.02, 0));
  const BIT_TEX = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#c9ced6'; x.fillRect(0, 0, 64, 256); x.strokeStyle = '#3a3f46'; x.lineWidth = 10; for(let i = -256; i < 256; i += 48){ x.beginPath(); x.moveTo(0, i); x.lineTo(64, i + 64); x.stroke(); } const t = new THREE.CanvasTexture(c); return t; })();
  const bit = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, .09, 16), new THREE.MeshStandardMaterial({ map: BIT_TEX, metalness: .8, roughness: .3 })); bit.position.y = -.095; spin.add(bit); const bitTip = new THREE.Mesh(new THREE.ConeGeometry(.005, .006, 16), st); bitTip.rotation.x = Math.PI; bitTip.position.y = -.143; spin.add(bitTip);
  const csk = new THREE.Mesh(new THREE.ConeGeometry(.011, .012, 16), st); csk.rotation.x = Math.PI; csk.position.y = -.08; spin.add(csk); const cskS = cyl(.004, .004, .05, st, 10); cskS.position.y = -.05; spin.add(cskS);
  const ream = new THREE.Mesh(new THREE.CylinderGeometry(.0052, .0052, .09, 6), M(0xdfe3e8, { m: .9, r: .2 })); ream.position.y = -.095; spin.add(ream);
  const feed = new THREE.Group(); feed.position.set(.09, -.02, .03); head.add(feed); feed.add(at(cyl(.015, .015, .02, dk, 14).rotateZ(Math.PI / 2), 0, 0, 0)); for(let i = 0; i < 3; i++){ const a = i * Math.PI * 2 / 3; const arm = new THREE.Group(); arm.rotation.x = a; feed.add(arm); arm.add(at(cyl(.005, .005, .12, st, 8), .01, .06, 0)); arm.add(at(new THREE.Mesh(new THREE.SphereGeometry(.012, 10, 8), M(0x1d2128)), .01, .12, 0)); } const fH = makeHand(); fH.position.set(.03, .12, 0); fH.rotation.z = Math.PI / 2; fH.scale.setScalar(.8); feed.children[1].add(fH);
  const stop = new THREE.Group(); stop.position.set(-.07, -.06, .06); head.add(stop); stop.add(at(cyl(.004, .004, .14, st, 8), 0, -.03, 0)); const nut = cyl(.01, .01, .01, M(0xc9a24a, { m: .7 }), 6); stop.add(nut); const stopSc = makeCanvas(.012, .1, 64); stopSc.mesh.position.set(0, -.02, .006); stop.add(stopSc.mesh); stopSc.draw((x, W, H) => { x.fillStyle = '#eee'; x.fillRect(0, 0, W, H); x.fillStyle = '#111'; for(let i = 0; i < 20; i++) x.fillRect(0, i * H / 20, i % 5 ? 20 : 40, 3); });
  /* منجلة الماكينة والشغلانة */
  const mv = new THREE.Group(); mv.position.set(0, .27, .07); D.add(mv); mv.add(at(box(.16, .02, .1, dk), 0, .01, 0)); mv.add(at(box(.025, .04, .1, dk), -.07, .04, 0)); const mvJ = box(.025, .04, .1, dk); mvJ.position.set(.07, .04, 0); mv.add(mvJ);
  const work = box(.1, .03, .06, M(0x9aa3ad, { m: .7, r: .4 })); work.position.set(0, .035, 0); mv.add(work); const WTOP = .27 + .05; const holeTop = cyl(.0055, .0055, .0008, M(0x111111), 16); holeTop.position.set(0, .0505, 0); mv.add(holeTop); const cskRing = cyl(.011, .0055, .002, M(0x2b2b2b), 16); cskRing.position.set(0, .0495, 0); mv.add(cskRing); const shine = cyl(.0058, .0058, .0009, M(0xeef2f6, { m: 1, r: .1 }), 16); shine.position.set(0, .0507, 0); mv.add(shine); const pmark = cyl(.0015, .0015, .0007, M(0x111111), 8); pmark.position.set(0, .0504, 0); mv.add(pmark);
  const punch = new THREE.Group(); root.add(punch); punch.add(at(cyl(.005, .001, .02, st, 10), 0, .01, 0)); punch.add(at(cyl(.006, .006, .09, M(0x6c747d, { m: .7 }), 10), 0, .065, 0)); const pH = makeHand(); pH.position.y = .07; pH.scale.setScalar(.7); punch.add(pH); punch.traverse(o => o.userData.noFit = true); const ham = makeHandHammer(); root.add(ham);
  const chips = makeFilings(root, 40, 0xc98a3a); const drops = makeFilings(root, 12, 0xdfefff);
  const sp = infoCard(root, L('سرعة الدوران', 'Spindle speed'), [[L('القانون', 'Formula'), 'n = 1000 × v ÷ (π × d)'], [L('مثال: صلب v=25 · d=10', 'e.g. steel v=25 · d=10'), L('≈ 800 لفة/دقيقة', '≈ 800 rpm')], [L('البنطة الأكبر', 'Bigger drill'), L('سرعة أقل', 'Lower speed')], [L('البرغلة', 'Reaming'), L('نص سرعة الثقب تقريبًا', 'About half the drilling speed')]]);
  const rd = readout(.62, .09); rd.mesh.position.set(.1, .95, -.55); root.add(rd.mesh);
  part('drill', head, V(0, .1, 0), L('مثقاب عمودي (صاروخ عمود)', 'Pillar drill'), ''); part('feed', feed, V(0, .14, 0), L('دراع التغذية', 'Feed handle'), ''); part('stop', stop, V(0, .05, 0), L('مصد العمق', 'Depth stop'), ''); part('mv', mv, V(0, .08, .06), L('منجلة المثقاب', 'Machine vice'), L('عمره ما تمسك الشغلانة بإيدك.', 'Never hold the work by hand.')); part('sp', sp.mesh, V(0, .12, 0), L('حساب السرعة', 'Speed calculation'), '');
  const st_ = { m: 'parts' }; let t = 0;
  const WT = () => D.position.y + WTOP + .0005;
  return {
    ...ctx, view: V(.2, .45, 1.25), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('المثقاب العمودي وأجزاؤه', 'The pillar drill and its parts'), text: L('القاعدة والعمود والترابيزة، والراس فيها الموتور وصندوق السيور، وعمود الدوران (الكُم) وفي آخره الظرف والبنطة. دراع التغذية بينزّل البنطة، ومصد العمق بيوقفها عند عمق معيّن. وزراير التشغيل والإيقاف قدام. ممنوع جوانتي أو هدوم واسعة جنب الماكينة.', 'The base, column and table; the head with the motor and belt box; the spindle (quill) with the chuck and drill at its end. The feed handle lowers the drill and the depth stop halts it at a set depth. Start and stop buttons are on the front. No gloves or loose clothing near the machine.'), s: { m: 'parts' } },
      { title: L('التجهيز: السنبك والتثبيت والسرعة', 'Preparation: punch, clamp and speed'), text: L('بنعلّم مركز الثقب بالسنبك عشان سن البنطة ما يزحلقش. الشغلانة بتتمسك في منجلة المثقاب، وعمرها ما تتمسك بالإيد. ونحسب السرعة: كل ما البنطة تكبر السرعة تقل.', 'Centre punch the hole position so the drill point does not wander. The work is clamped in the machine vice and never held by hand. Work out the speed: the bigger the drill, the lower the speed.'), cam: { t: [-.1, .33, -.13], d: .34, dir: [.3, .5, 1] }, s: { m: 'prep' } },
      { title: L('الثقب النافذ', 'Drilling a through hole'), text: L('نشغّل ونزّل البنطة بدراع التغذية بضغط منتظم، والرايش بيطلع لولبي من الثقب. بنحط سائل تبريد، ونرفع البنطة كل شوية نطلّع الرايش. قرب ما البنطة تخرم من تحت نخفف الضغط عشان ما تمسكش في الشغلانة.', 'Start the machine and feed the drill down with steady pressure on the feed handle; the chips come out in spirals. Apply cutting fluid and lift the drill now and then to clear chips. Ease off just before the drill breaks through so it does not grab.'), cam: { t: [-.1, .37, -.13], d: .36, dir: [.35, .25, 1] }, s: { m: 'drill' } },
      { title: L('الثقب الأعمى (الصم)', 'Drilling a blind hole'), text: L('الثقب الأعمى ما بيخرمش للناحية التانية. بننزّل البنطة لحد ما تلمس الشغلانة، ونظبط صامولة مصد العمق على العمق المطلوب من التدريج. ونثقب لحد ما المصد يوقف الدراع.', 'A blind hole does not go right through. Lower the drill until it touches the work, set the depth-stop nut to the required depth on its scale, then drill until the stop halts the handle.'), cam: { t: [-.13, .5, -.13], d: .42, dir: [.3, .2, 1] }, s: { m: 'blind' } },
      { title: L('التخويش', 'Countersinking'), text: L('التخويش بنطة مخروطية (90° عادة) بتعمل شطفة في بُق الثقب عشان راس المسمار المسلوب أو البرشامة تدخل وتبقى مستوية مع السطح. بسرعة قليلة وبعمق محسوب.', 'A countersink is a conical cutter (usually 90°) that cuts a chamfer at the mouth of the hole so a countersunk screw or rivet head sits flush with the surface. Use a low speed and a controlled depth.'), cam: { t: [-.1, .36, -.13], d: .33, dir: [.35, .4, 1] }, s: { m: 'csk' } },
      { title: L('البرغلة', 'Reaming'), text: L('البرغل بيشطّب ثقب متثقّب قبلها بمقاس أصغر شوية (حوالي 0.2–0.3 مم)، فيطلع الثقب بمقاس دقيق وسطح ناعم لامع. السرعة حوالي نص سرعة الثقب، وزيت كتير، وما نلفّش البرغل عكس أبدًا.', 'A reamer finishes a hole drilled slightly undersize (by about 0.2–0.3 mm), giving an accurate size and a smooth, bright surface. Use about half the drilling speed and plenty of oil, and never turn the reamer backwards.'), cam: { t: [-.1, .36, -.13], d: .33, dir: [.35, .4, 1] }, s: { m: 'ream' } }
    ],
    apply(s){ st_.m = s.m; t = 0; },
    update(dt){ t += dt; const m = st_.m, T = 9, f = (t % T) / T;
      bit.visible = bitTip.visible = m === 'parts' || m === 'drill' || m === 'blind' || m === 'prep'; csk.visible = cskS.visible = m === 'csk'; ream.visible = m === 'ream'; punch.visible = ham.visible = m === 'prep' && f < .4;
      const run = m === 'drill' || m === 'blind' || m === 'csk' || m === 'ream'; spin.rotation.y += run ? dt * (m === 'ream' ? 12 : 30) : 0;
      let q = 0; const full = .14 + .065; const touch = .0; let k = 0;
      if(m === 'drill'){ k = f < .1 ? 0 : Math.min(1, (f - .1) / .7); q = .005 + k * .04; } else if(m === 'blind'){ k = f < .1 ? 0 : Math.min(1, (f - .1) / .6); q = .005 + k * .02; } else if(m === 'csk'){ k = Math.min(1, f / .6); q = -.055 + k * .006; } else if(m === 'ream'){ k = Math.min(1, f / .7); q = .005 + k * .04; }
      quill.position.y = -.07 - q; feed.rotation.x = -q * 18; nut.position.y = m === 'blind' ? -.02 - .02 : -.06;
      const depthIn = Math.max(0, q - .005); holeTop.visible = (m === 'drill' && depthIn > .002) || m === 'blind' && depthIn > .002 || m === 'csk' || m === 'ream'; cskRing.visible = m === 'csk' && k > .3; shine.visible = m === 'ream' && k > .4; pmark.visible = m === 'prep' && ((f % .4) > .2 || f > .4);
      if(run && depthIn > .001 && depthIn < .029 && m !== 'csk'){ const p = V(D.position.x + Math.cos(t * 9) * .01, WT() + .002, D.position.z + .07 + Math.sin(t * 9) * .01); chips.emit(p, 30, dt, V(Math.cos(t * 9) * .15, .15, Math.sin(t * 9) * .15)); if(Math.random() < .3) drops.emit(V(D.position.x + .01, WT() + .03, D.position.z + .07), 6, dt, V(0, -.1, 0)); }
      if(m === 'prep' && f < .4){ const p = V(D.position.x, WT(), D.position.z + .07); punch.position.copy(p); hammerAt(ham, V(p.x, p.y + .11, p.z), Math.abs(Math.sin(t * 5))); }
      chips.update(dt, WT() - .03); drops.update(dt, WT());
      rd.setText({ parts: L('عمود · ترابيزة · راس · كُم · ظرف', 'Column · table · head · quill · chuck'), prep: f < .4 ? L('سنبك على مركز الثقب', 'Centre punch the hole centre') : L('الشغلانة في منجلة المثقاب', 'Work clamped in the machine vice'), drill: depthIn > .028 ? L('خرمت · نخفف الضغط', 'Breaking through · ease off') : L('تغذية منتظمة · رايش لولبي', 'Steady feed · spiral chips'), blind: k >= 1 ? L('المصد وقّف عند العمق ✓', 'Depth stop reached ✓') : L('بنثقب لحد المصد', 'Drilling to the stop'), csk: L('شطفة 90° في بُق الثقب', '90° chamfer at the hole mouth'), ream: L('نص السرعة · زيت · ما نرجعش عكس', 'Half speed · oil · never reverse') }[m]);
    }
  };
}
/* ================= تشغيل المعادن (برادة): الدفعة التانية ================= */
/* لولب سنة بيكبر */
function threadMesh(parent, r, pitch, mat){ const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.userData.noFit = true; m.frustumCulled = false; parent.add(m); let last = -1;
  return { mesh: m, set(len, y0 = 0, dir = -1){ const n = Math.max(2, Math.round(len / pitch * 24)); if(n === last) return; last = n; const pts = []; for(let i = 0; i <= n; i++){ const a = i / 24 * Math.PI * 2; pts.push(V(Math.cos(a) * r, y0 + dir * i / 24 * pitch, Math.sin(a) * r)); } m.geometry.dispose(); m.geometry = len < pitch * .1 ? new THREE.BufferGeometry() : new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, pitch * .28, 6); } }; }

/* ---------- 5) القلاووظ الداخلي والخارجي ---------- */
function buildThreading(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); const st = STEELM(), dk = M(0x2b3038, { m: .5 });
  const vise = makeBenchVise(); vise.group.position.set(-.12, 0, -.12); root.add(vise.group); vise.setOpen(.05 - .012); const VZ = -.12 + vise.mid(.038);
  /* بلوك متقطع نصين: النص القدّامي بيختفي عشان نشوف السن من جوه */
  const blk = new THREE.Group(); blk.position.set(-.12, vise.top - .02, VZ); root.add(blk); const bm = M(0x9aa3ad, { m: .7, r: .4 }); const back = box(.1, .05, .025, bm); back.position.set(0, .025, -.0125); blk.add(back); const front = box(.1, .05, .025, M(0x9aa3ad, { m: .7, r: .4, opacity: 1 })); front.position.set(0, .025, .0125); blk.add(front);
  const hole = cyl(.0085, .0085, .0505, M(0x2b2b2b, { side: THREE.BackSide }), 20, true); hole.position.y = .025; blk.add(hole); const intThr = threadMesh(blk, .0085, .006, M(0xdfe3e8, { m: .9, r: .25 }));
  /* القلاووظ والدراع */
  const tap = new THREE.Group(); root.add(tap); const tapB = cyl(.0095, .0095, .06, M(0xdfe3e8, { m: .9 }), 6); tapB.position.y = .03; tap.add(tapB); tap.add(at(cyl(.0095, .004, .015, M(0xdfe3e8, { m: .9 }), 6), 0, -.0075, 0)); tap.add(at(box(.012, .03, .012, st), 0, .075, 0));
  const tw = new THREE.Group(); tw.position.y = .085; tap.add(tw); tw.add(at(box(.04, .02, .025, dk), 0, 0, 0)); [-1, 1].forEach(s => { tw.add(at(cyl(.007, .007, .14, st, 10).rotateZ(Math.PI / 2), s * .09, 0, 0)); const h = makeHand(); h.position.set(s * .15, .005, 0); h.rotation.y = s > 0 ? 0 : Math.PI; h.scale.setScalar(.8); tw.add(h); }); tap.traverse(o => o.userData.noFit = true);
  /* البنط الخارجي */
  const rod = cyl(.009, .009, .16, M(0x9aa3ad, { m: .7, r: .4 }), 20); const rodG = new THREE.Group(); rodG.position.set(.25, vise.top - .03, VZ); root.add(rodG); rod.position.y = .08; rodG.add(rod); const extThr = threadMesh(rodG, .0095, .006, M(0xdfe3e8, { m: .9, r: .25 }));
  const vise2 = makeBenchVise(); vise2.group.position.set(.25, 0, -.12); root.add(vise2.group); vise2.setOpen(.018 - .012);
  const die = new THREE.Group(); root.add(die); die.add(cyl(.03, .03, .012, M(0x3a3f46, { m: .6 }), 24)); die.add(at(cyl(.022, .022, .013, M(0xdfe3e8, { m: .9 }), 20), 0, 0, 0)); [-1, 1].forEach(s => { die.add(at(cyl(.007, .007, .14, st, 10).rotateZ(Math.PI / 2), s * .1, 0, 0)); const h = makeHand(); h.position.set(s * .17, .005, 0); h.rotation.y = s > 0 ? 0 : Math.PI; h.scale.setScalar(.8); die.add(h); }); die.traverse(o => o.userData.noFit = true);
  const sq = new THREE.Group(); root.add(sq); sq.add(at(box(.004, .09, .03, M(0x2b3038)), 0, .045, 0)); sq.add(at(box(.06, .004, .02, st), .03, .0, 0)); sq.traverse(o => o.userData.noFit = true);
  const taps = new THREE.Group(); taps.position.set(-.38, .005, .22); root.add(taps); [[0, .03, L('أول (مسلوب)', 'Taper')], [.04, .012, L('تاني', 'Second')], [.08, .002, L('تالت (بلف)', 'Plug')]].forEach(([z, ch, lb]) => { const g = new THREE.Group(); g.position.z = z; taps.add(g); const b = cyl(.008, .008, .07, M(0xdfe3e8, { m: .9 }), 6); b.rotation.z = Math.PI / 2; g.add(b); const c = cyl(.008, .003, ch + .001, M(0xdfe3e8, { m: .9 }), 6); c.rotation.z = -Math.PI / 2; c.position.x = .035 + ch / 2; g.add(c); g.add(at(label(lb, '#1d2128', .022), -.05, .03, 0)); });
  const card = infoCard(root, L('بنطة القلاووظ', 'Tap drill size'), [[L('القاعدة', 'Rule'), L('البنطة = القطر − الخطوة', 'Drill = diameter − pitch')], ['M6 × 1', L('بنطة 5 مم', '5 mm drill')], ['M8 × 1.25', L('بنطة 6.8 مم', '6.8 mm drill')], ['M10 × 1.5', L('بنطة 8.5 مم', '8.5 mm drill')]]);
  const rd = readout(.62, .09); rd.mesh.position.set(0, .72, -.55); root.add(rd.mesh);
  part('taps', taps, V(.04, .04, .04), L('طقم القلاووظ (3 قطع)', 'Tap set (3 pieces)'), ''); part('tap', tap, V(0, .1, 0), L('القلاووظ والدراع', 'Tap and wrench'), ''); part('die', die, V(0, .03, 0), L('لقمة اللولب وحاملها', 'Die and stock'), ''); part('card', card.mesh, V(0, .12, 0), L('مقاس البنطة', 'Drill size'), '');
  const st_ = { m: 'set' }; let t = 0, cyc = -1;
  return {
    ...ctx, view: V(.15, .55, 1.2), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('طقم القلاووظ ومقاس البنطة', 'The tap set and tap-drill size'), text: L('القلاووظ الداخلي بيتعمل بطقم 3 قطع: الأول مسلوب كتير عشان يدخل بسهولة، والتاني، والتالت (البلف) لآخر الثقب الأعمى. قبلها بنثقب بنطة أصغر من قطر القلاووظ: البنطة = القطر − الخطوة، يعني M10 محتاج بنطة 8.5 مم.', 'Internal threads are cut with a set of three taps: the first is well tapered to start easily, then the second, then the plug for the bottom of a blind hole. First drill a hole smaller than the thread: drill = diameter − pitch, so M10 needs an 8.5 mm drill.'), cam: { t: [-.3, .05, .22], d: .36, dir: [.1, .7, 1] }, s: { m: 'set' } },
      { title: L('عمل القلاووظ الداخلي', 'Tapping an internal thread'), text: L('نركّب القلاووظ الأول في الدراع ونحطه في الثقب عمودي، ونتأكد بالزاوية القايمة. نلف لفّة لقدام بإيدين متساويتين، ونرجّع نص لفّة عشان نكسر الرايش، وهكذا. وزيت قطع. لو اتزنق ما نضغطش، نرجّع ونطلّعه وننضّف.', 'Fit the taper tap in the wrench and enter it squarely in the hole, checking with a try square. Turn one turn forward with even hands, then half a turn back to break the chip, and repeat, with cutting oil. If it binds, do not force it: back it out and clear the chips.'), cam: { t: [-.12, .27, -.1], d: .38, dir: [.25, .45, 1] }, s: { m: 'tap' } },
      { title: L('السن من جوه', 'Inside the hole'), text: L('شيلنا نص الشغلانة القدّامي عشان نشوف: القلاووظ وهو بينزل بيقطع مجرى لولبي في جدار الثقب، والسنة بتتكوّن لفّة ورا لفّة.', 'The front half of the block is removed so you can see: as the tap goes down it cuts a helical groove in the hole wall, and the thread forms turn by turn.'), cam: { t: [-.12, .22, -.1], d: .32, dir: [0, .25, 1] }, s: { m: 'cut' } },
      { title: L('عمل اللولب الخارجي', 'Cutting an external thread'), text: L('العمود في المنجلة عمودي وطرفه مشطوف 45° عشان اللقمة تمسك. اللقمة في حاملها والجنب المسلوب لتحت. نلف بنفس الطريقة: لفّة لقدام ونص لفّة لورا، بزيت، ومحافظين إن الحامل أفقي.', 'The rod is held upright in the vice with its end chamfered at 45° so the die can start. The die sits in its stock with the tapered side down. Turn the same way — one turn forward, half a turn back — with oil, keeping the stock level.'), cam: { t: [.25, .26, -.1], d: .38, dir: [-.2, .45, 1] }, s: { m: 'ext' } }
    ],
    apply(s){ st_.m = s.m; t = 0; cyc = -1; },
    update(dt){ t += dt; const m = st_.m, T = 10, c = Math.floor(t / T), f = (t % T) / T;
      tap.visible = m === 'tap' || m === 'cut'; die.visible = m === 'ext'; front.visible = m !== 'cut'; sq.visible = m === 'tap' && f < .15;
      const steps = Math.floor(f * 8), sub = (f * 8) % 1; const fwd = sub < .65; const turns = steps * .5 + (fwd ? sub / .65 : 1 - (sub - .65) / .35 * .5); const prog = Math.min(1, turns / 4);
      if(m === 'tap' || m === 'cut'){ const y0 = blk.position.y + .05; tap.position.set(blk.position.x, y0 + .01 - prog * .05, VZ); tap.rotation.y = -turns * Math.PI * 2; intThr.set(prog * .05, .05, -1); sq.position.set(blk.position.x + .03, y0, VZ); }
      else intThr.set(m === 'ext' ? .05 : 0, .05, -1);
      if(m === 'ext'){ const top = rodG.position.y + .16; die.position.set(rodG.position.x, top - .005 - prog * .06, VZ); die.rotation.y = -turns * Math.PI * 2; extThr.set(prog * .06, .16, -1); } else extThr.set(0, .16);
      rd.setText({ set: L('M10 ← بنطة 8.5 مم · 3 قلاووظات', 'M10 → 8.5 mm drill · 3 taps'), tap: f < .15 ? L('عمودي؟ نفحص بالزاوية', 'Square? Check with the try square') : (fwd ? L('لفّة لقدام', 'One turn forward') : L('نص لفّة لورا: نكسر الرايش', 'Half turn back: break the chip')), cut: L(`السنة بتتكوّن · ${Math.round(prog * 100)}%`, `Thread forming · ${Math.round(prog * 100)}%`), ext: fwd ? L('اللقمة: لفّة لقدام', 'Die: one turn forward') : L('نص لفّة لورا', 'Half turn back') }[m]);
    }
  };
}

/* ---------- 6) الاستعدال والثني والاستعدال بالمكبس ---------- */
function buildBending(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); const st = STEELM();
  const anvilP = box(.4, .05, .25, M(0x26282c, { r: .4 })); anvilP.position.set(-.3, .025, .12); root.add(anvilP);
  const flat = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M(0x8a9099, { m: .6, r: .45 }), 40); flat.userData.noFit = true; flat.frustumCulled = false; root.add(flat); const mt = new THREE.Matrix4(), q = new THREE.Quaternion();
  const setBow = (bow) => { const N = 40, Ln = .34; for(let i = 0; i < N; i++){ const u = (i + .5) / N - .5; const x = u * Ln, y = bow * (1 - 4 * u * u); const sl = -8 * bow * u / Ln * 1; q.setFromEuler(new THREE.Euler(0, 0, Math.atan(sl))); mt.compose(V(-.3 + x, .05 + .006 + y, .12), q, V(Ln / N * 1.04, .012, .03)); flat.setMatrixAt(i, mt); } flat.instanceMatrix.needsUpdate = true; };
  const se = box(.3, .03, .003, st); se.position.set(-.3, .08, .138); root.add(se); const gapS = sparkSprite(0xfff4c0); gapS.userData.noFit = true; root.add(gapS);
  const ham = makeHandHammer(); root.add(ham);
  /* الثني في المنجلة */
  const vise = makeBenchVise(); vise.group.position.set(.32, 0, .02); root.add(vise.group); vise.setOpen(.018 - .012); const VZ = .02 + vise.mid(.006);
  const low = box(.06, .06, .006, M(0x8a9099, { m: .6, r: .45 })); low.position.set(.32, vise.top - .03, VZ); root.add(low); const piv = new THREE.Group(); piv.position.set(.32, vise.top, VZ + .003); root.add(piv); const up = box(.06, .08, .006, M(0x8a9099, { m: .6, r: .45 })); up.position.set(0, .04, -.003); piv.add(up);
  /* مكبس الاستعدال */
  const P = new THREE.Group(); P.position.set(.0, 0, .0); root.add(P); const red = M(0xd0021b, { r: .45 });
  const PX = -.05, PZ = -.3; const frame = new THREE.Group(); frame.position.set(PX, 0, PZ); P.add(frame); frame.add(at(box(.5, .04, .16, red), 0, .02, 0)); [-1, 1].forEach(s => frame.add(at(box(.04, .62, .12, red), s * .23, .31, 0))); frame.add(at(box(.5, .06, .16, red), 0, .63, 0));
  const ramG = new THREE.Group(); frame.add(ramG); ramG.add(at(cyl(.035, .035, .16, M(0xc9ced6, { m: .85 }), 18), 0, .52, 0)); const rampad = box(.05, .02, .05, M(0x3a3f46)); rampad.position.y = .43; ramG.add(rampad);
  const pump = new THREE.Group(); pump.position.set(.27, .5, 0); frame.add(pump); pump.add(at(cyl(.02, .02, .1, M(0x3a3f46), 12), 0, 0, 0)); const lever = new THREE.Group(); lever.position.set(0, .05, 0); pump.add(lever); lever.add(at(cyl(.006, .006, .2, st, 8).rotateZ(Math.PI / 2), .1, 0, 0)); const pH = makeHand(); pH.position.set(.19, .01, 0); pH.scale.setScalar(.8); lever.add(pH);
  const gauge = makeGauge('#d0021b', 0, 400, [0, 100, 200, 300, 400], 'bar'); gauge.group.scale.setScalar(.12); gauge.group.position.set(.27, .58, .06); frame.add(gauge.group);
  [-1, 1].forEach(s => { const vb = new THREE.Group(); vb.position.set(s * .1, .04, 0); frame.add(vb); vb.add(at(box(.05, .05, .06, M(0x3a3f46, { m: .5 })), 0, .025, 0)); });
  const shaft = new THREE.Group(); shaft.position.set(0, .1, 0); frame.add(shaft); const shM = cyl(.014, .014, .34, M(0xc9ced6, { m: .85, r: .3 }), 20); shM.rotation.z = Math.PI / 2; shaft.add(shM);
  const dial = new THREE.Group(); dial.position.set(.0, .03, .06); frame.add(dial); dial.add(at(box(.012, .06, .012, M(0x3a3f46)), 0, .0, 0)); const dg = makeGauge('#1d2128', 0, 1, [0, .25, .5, .75], 'mm'); dg.group.scale.setScalar(.09); dg.group.position.set(0, .05, .02); dial.add(dg.group); dial.add(at(cyl(.002, .002, .03, st, 6), 0, .075, -.03));
  const rd = readout(.62, .09); rd.mesh.position.set(0, .82, -.55); root.add(rd.mesh);
  part('plate', anvilP, V(.15, .03, .1), L('سطح الاستعدال', 'Straightening plate'), ''); part('vise', vise.group, V(0, .1, .25), L('المنجلة', 'Vice'), ''); part('press', frame, V(0, .66, 0), L('مكبس هيدروليك', 'Hydraulic press'), ''); part('dial', dial, V(0, .1, 0), L('ساعة القياس', 'Dial indicator'), L('بتقيس الانحراف (الطبلة).', 'Measures the run-out.'));
  const st_ = { m: 'straight' }; let t = 0, cyc = -1;
  return {
    ...ctx, view: V(.1, .5, 1.25), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('استعدال شريط معوّج', 'Straightening a bent strip'), text: L('الشريط على سطح الاستعدال والجزء المقبب لفوق. بنضرب بالشاكوش على أعلى نقطة في التقويس ضربات محسوبة، ونقلب ونبص، لحد ما يرجع مستقيم. ونفحص بحرف المسطرة: مفيش نور تحتها.', 'Lay the strip on the straightening plate with the bow upwards. Strike the highest point of the bow with measured blows, turn and sight it, until it is straight again. Check with a straight edge: no light under it.'), cam: { t: [-.3, .08, .12], d: .36, dir: [.1, .45, 1] }, s: { m: 'straight' } },
      { title: L('الثني على زاوية 90°', 'Bending to 90°'), text: L('خط الثني بالظبط على حرف الفكين، والجزء اللي هيتثني لفوق. نضرب بالشاكوش قريب من الفكين ونزل بالتدريج لحد 90°، ونفحص بالزاوية. للصاج والشرايح التخينة ممكن نسخّن خط الثني الأول.', 'The bend line sits exactly level with the top of the jaws, with the part to be bent above them. Strike close to the jaws and work it over gradually to 90°, checking with a square. Thick strip can be heated along the bend line first.'), cam: { t: [.32, .24, .03], d: .34, dir: [.7, .35, 1] }, s: { m: 'bend' } },
      { title: L('الاستعدال بالمكبس', 'Straightening with the press'), text: L('العمود على عمودين V، وساعة القياس تحته بتبين قد إيه معووج. بنلف العمود لحد ما الساعة تقرا أكبر رقم (النقطة العالية) ونخليها لفوق. بنضغط بالمكبس الهيدروليك على النقطة دي بالراحة ونفك ونقيس تاني، لحد ما الانحراف يقل عن 0.05 مم.', 'The shaft rests on two V-blocks with the dial indicator below showing the run-out. Rotate the shaft to the highest reading (the high spot) and set it upwards. Press gently on that point with the hydraulic press, release and measure again, until the run-out is below 0.05 mm.'), cam: { t: [-.05, .2, -.3], d: .45, dir: [.1, .3, 1] }, s: { m: 'press' } }
    ],
    apply(s){ st_.m = s.m; t = 0; cyc = -1; },
    update(dt){ t += dt; const m = st_.m, T = 10, f = (t % T) / T;
      const bow = m === 'straight' ? .02 * Math.max(0, 1 - f / .7) : .0; setBow(bow); se.visible = m === 'straight' && f > .75; gapS.material.opacity = 0;
      ham.visible = m === 'straight' && f < .72 || m === 'bend' && f < .85; const a = Math.abs(Math.sin(t * 5));
      if(m === 'straight' && f < .72) hammerAt(ham, V(-.3, .05 + .012 + bow, .12), a);
      const ba = m === 'bend' ? Math.min(Math.PI / 2, f / .8 * Math.PI / 2) : 0; piv.rotation.x = ba; if(m === 'bend' && f < .85){ const p = V(.32, vise.top + .03 * Math.cos(ba), VZ + .03 * Math.sin(ba) + .003); hammerAt(ham, p, a); }
      let ro = .5, push = 0; if(m === 'press'){ const ph = (f * 3) % 1, n = Math.floor(f * 3); push = ph < .5 ? Math.sin(ph / .5 * Math.PI) : 0; ro = Math.max(.03, .5 - n * .16 - (ph > .5 ? .16 : 0)); lever.rotation.z = -push * .6 + Math.sin(t * 8) * .2 * (ph < .5); }
      ramG.position.y = -push * .045; shaft.position.y = .1 - push * .004; shaft.rotation.x = m === 'press' ? 0 : t; gauge.set(push * 250); gauge.update(dt); dg.set(m === 'press' ? ro * (1 + Math.sin(t * 2) * .05) : .5); dg.update(dt);
      rd.setText({ straight: f > .7 ? L('مستقيم ✓ مفيش نور', 'Straight ✓ no light') : L('ضرب على أعلى نقطة', 'Strike the highest point'), bend: L(`الثني ${Math.round(ba * 180 / Math.PI)}°`, `Bending ${Math.round(ba * 180 / Math.PI)}°`), press: push > .2 ? L('ضغط على النقطة العالية', 'Pressing the high spot') : L(`الانحراف ${ro.toFixed(2)} مم`, `Run-out ${ro.toFixed(2)} mm`) }[m]);
    }
  };
}

/* ---------- 7) القطع بالأجنة والسنبك ---------- */
function buildChisel(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); const st = STEELM();
  const vise = makeBenchVise(); vise.group.position.set(-.05, 0, -.12); root.add(vise.group); vise.setOpen(.006 - .012 + .012); const VZ = -.12 + vise.mid(.006);
  const sh = box(.2, .07, .004, M(0xb7c0ca, { m: .7, r: .35 })); sh.position.set(-.05, vise.top - .035, VZ); root.add(sh); const above = box(.2, .02, .004, M(0xb7c0ca, { m: .7, r: .35 })); root.add(above); const curl = new THREE.Group(); root.add(curl);
  const ch = new THREE.Group(); root.add(ch); ch.add(at(cyl(.009, .009, .16, M(0x6c747d, { m: .7 }), 8), 0, .09, 0)); const edge = box(.022, .02, .004, st); edge.position.y = .006; ch.add(edge); const chH = makeHand(); chH.position.y = .09; chH.scale.setScalar(.75); ch.add(chH); ch.traverse(o => o.userData.noFit = true);
  const ham = makeHandHammer(); root.add(ham);
  const blk = box(.16, .04, .06, M(0x9aa3ad, { m: .7, r: .4 })); blk.position.set(.3, .02, .15); root.add(blk); const groove = box(.0001, .004, .012, M(0x2b2b2b)); groove.position.set(.22, .04, .15); root.add(groove); const chip = new THREE.Mesh(new THREE.TorusGeometry(.01, .002, 6, 16, Math.PI * 1.2), M(0xc9ced6, { m: .8 })); chip.userData.noFit = true; root.add(chip);
  const rack = new THREE.Group(); rack.position.set(-.4, .005, .2); root.add(rack);
  [[0, L('أجنة مبططة', 'Flat chisel'), 'f'], [.045, L('أجنة نقار', 'Cross-cut chisel'), 'c'], [.09, L('أجنة نص دايرة', 'Half-round chisel'), 'h'], [.135, L('سنبك مركز', 'Centre punch'), 'p'], [.18, L('سنبك خبّاط', 'Drift punch'), 'd']].forEach(([z, lb, k]) => { const g = new THREE.Group(); g.position.z = z; rack.add(g); const b = cyl(.007, .007, .14, M(0x6c747d, { m: .7 }), 8); b.rotation.z = Math.PI / 2; g.add(b); const tip = k === 'p' ? new THREE.Mesh(new THREE.ConeGeometry(.006, .02, 10), st) : box(.02, k === 'c' ? .006 : .004, k === 'f' ? .02 : k === 'c' ? .006 : .012, st); tip.position.x = .08; if(k === 'p'){ tip.rotation.z = -Math.PI / 2; } g.add(tip); g.add(at(label(lb, '#1d2128', .02), -.02, .022, 0)); });
  const card = infoCard(root, L('زوايا وسلامة الأجنة', 'Chisel angles and safety'), [[L('زاوية السن', 'Point angle'), L('60° للصلب · 50° للنحاس', '60° steel · 50° brass')], [L('زاوية الشغل', 'Working angle'), L('30–40° مع السطح', '30–40° to the surface')], [L('راس متفلطحة', 'Mushroomed head'), L('لازم تتجلّخ: بتطيّر شظايا', 'Must be ground: it throws splinters')], [L('نضارة', 'Goggles'), L('دايمًا', 'Always')]]);
  const rd = readout(.62, .09); rd.mesh.position.set(0, .72, -.55); root.add(rd.mesh);
  part('rack', rack, V(.06, .05, .1), L('الأجنة والسنابك', 'Chisels and punches'), ''); part('ch', ch, V(0, .17, 0), L('الأجنة المبططة', 'Flat chisel'), ''); part('card', card.mesh, V(0, .12, 0), L('الزوايا والسلامة', 'Angles and safety'), '');
  const st_ = { m: 'types' }; let t = 0;
  return {
    ...ctx, view: V(.15, .55, 1.2), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('أنواع الأجنة والسنابك', 'Types of chisels and punches'), text: L('الأجنة المبططة للقطع وكسر الرؤوس، والنقار للمجاري الضيقة، والنص دايرة للمجاري المدوّرة. والسنبك المركز لتعليم الثقوب، والخبّاط لطرد المسامير والتيل. السن متقسّى، والراس طرية عشان ما تشرخش.', 'The flat chisel cuts sheet and shears off rivet heads, the cross-cut makes narrow grooves, and the half-round cuts rounded grooves. The centre punch marks holes and the drift drives out pins. The point is hardened and the head left soft so it does not crack.'), cam: { t: [-.3, .03, .29], d: .34, dir: [0, .8, 1] }, s: { m: 'types' } },
      { title: L('القص في المنجلة', 'Shearing in the vice'), text: L('الصاج في المنجلة وخط القطع على مستوى الفكين بالظبط. الأجنة مايلة حوالي 30° وسنها على حرف الفك، فبتقص زي المقص. بنضرب بالشاكوش ضربات منتظمة وعينينا على سن الأجنة مش على راسها، ونتقدم على طول الخط.', 'The sheet is in the vice with the cut line exactly level with the jaws. The chisel leans at about 30° with its edge on the jaw, shearing like scissors. Strike with steady hammer blows, keeping your eyes on the cutting edge, not the head, and work along the line.'), cam: { t: [-.05, .24, -.1], d: .36, dir: [.4, .5, 1] }, s: { m: 'shear' } },
      { title: L('عمل مجرى بالنقار', 'Cutting a groove'), text: L('بالأجنة النقار بنعمل مجرى على وش الشغلانة: الأجنة مايلة 30–40°، وكل ضربة بتشيل رايشة ملفوفة. العمق في كل مشوار حوالي 1 مم، وقرب الآخر بنقلب الاتجاه عشان الحرف ما يتكسرش.', 'With the cross-cut chisel cut a groove in the face of the work: the chisel at 30–40°, each blow lifting a curled chip. Take about 1 mm per pass, and near the end reverse direction so the edge does not break out.'), cam: { t: [.3, .06, .15], d: .32, dir: [.4, .55, 1] }, s: { m: 'groove' } },
      { title: L('الزوايا والسلامة', 'Angles and safety'), text: L('زاوية سن الأجنة 60° للصلب. لو الراس اتفلطحت (بقت زي المشروم) لازم تتجلّخ لأنها بتطيّر شظايا. نلبس نضارة، ونحط ستارة قدام الشغل عشان الرايش ما يطيرش على حد.', 'The chisel point angle is 60° for steel. If the head has mushroomed it must be ground, because it throws splinters. Wear goggles and put a screen in front of the work so chips do not fly at anyone.'), cam: { t: [.42, .42, -.5], d: .34, dir: [0, .1, 1] }, s: { m: 'safety' } }
    ],
    apply(s){ st_.m = s.m; t = 0; },
    update(dt){ t += dt; const m = st_.m, f = (t % 9) / 9, a = Math.abs(Math.sin(t * 4.5)); ham.visible = ch.visible = m === 'shear' || m === 'groove';
      if(m === 'shear'){ const k = Math.min(1, f / .85), x = -.14 + k * .18; ch.position.set(x, vise.top + .001, VZ + .004); ch.rotation.set(0, 0, -.55); ch.rotateX(-.2); above.scale.x = Math.max(.001, 1 - k); above.position.set(-.05 + .1 * k, vise.top + .01, VZ); const tipT = ch.localToWorld ? V(x - .09 * Math.sin(.55), vise.top + .001 + .17 * Math.cos(.55), VZ + .004) : V(); hammerAt(ham, tipT, a); }
      else { above.scale.x = 1; above.position.set(-.05, vise.top + .01, VZ); }
      if(m === 'groove'){ const k = Math.min(1, f / .85), x = .22 + k * .15; ch.position.set(x, .04, .15); ch.rotation.set(0, 0, -.6); hammerAt(ham, V(x - .17 * Math.sin(.6), .04 + .17 * Math.cos(.6), .15), a); groove.scale.x = Math.max(1, k * 1500); groove.position.x = .22 + k * .075; chip.visible = true; chip.position.set(x + .012, .045, .15); chip.rotation.z = t * 2; } else { chip.visible = false; groove.scale.x = 1; }
      rd.setText({ types: L('مبططة · نقار · نص دايرة · سنابك', 'Flat · cross-cut · half-round · punches'), shear: L('سن الأجنة على حرف الفك · 30°', 'Edge on the jaw · 30°'), groove: L('كل ضربة رايشة ملفوفة · 1 مم', 'One curled chip per blow · 1 mm'), safety: L('سن 60° · راس من غير تفلطح · نضارة', '60° point · no mushroom head · goggles') }[m]);
    }
  };
}

/* ---------- 8) البرشمة ---------- */
function buildRiveting(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); const st = STEELM();
  const dolly = box(.12, .06, .1, M(0x3a3f46, { m: .6 })); dolly.position.set(-.1, .03, 0); root.add(dolly); const dimple = new THREE.Mesh(new THREE.SphereGeometry(.014, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0x111111)); dimple.position.set(-.1, .0605, 0); root.add(dimple);
  const pA = box(.24, .006, .08, M(0x9aa3ad, { m: .7, r: .4 })), pB = box(.24, .006, .08, M(0xb7c0ca, { m: .7, r: .4 })); root.add(pA); root.add(pB);
  const rivet = new THREE.Group(); root.add(rivet); const shank = cyl(.0075, .0075, .03, M(0xc98a3a, { m: .8, r: .3 }), 16); shank.position.y = .015; rivet.add(shank); const headA = new THREE.Mesh(new THREE.SphereGeometry(.013, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xc98a3a, { m: .8, r: .3 })); headA.rotation.x = Math.PI; rivet.add(headA);
  const formed = new THREE.Mesh(new THREE.SphereGeometry(.013, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0xc98a3a, { m: .8, r: .3 })); root.add(formed); const swell = cyl(.01, .0075, .008, M(0xc98a3a, { m: .8 }), 16); root.add(swell);
  const set = new THREE.Group(); root.add(set); set.add(at(cyl(.009, .009, .12, M(0x6c747d, { m: .7 }), 12), 0, .06, 0)); const setH = makeHand(); setH.position.y = .08; setH.scale.setScalar(.7); set.add(setH); set.traverse(o => o.userData.noFit = true); const ham = makeHandHammer(); root.add(ham);
  /* برشام البوب */
  const pp = new THREE.Group(); pp.position.set(.25, .0, .05); root.add(pp); const pp1 = box(.2, .004, .07, M(0x9aa3ad, { m: .7 })), pp2 = box(.2, .004, .07, M(0xb7c0ca, { m: .7 })); pp1.position.set(0, .05, 0); pp2.position.set(0, .054, 0); pp.add(pp1); pp.add(pp2); pp.add(at(box(.04, .05, .04, M(0x3a3f46)), -.08, .025, 0)); pp.add(at(box(.04, .05, .04, M(0x3a3f46)), .08, .025, 0));
  const pr = new THREE.Group(); pp.add(pr); pr.add(at(cyl(.006, .006, .002, M(0xdfe3e8, { m: .9 }), 16), 0, .057, 0)); const prBody = cyl(.0025, .0025, .012, M(0xdfe3e8, { m: .9 }), 12); prBody.position.y = .045; pr.add(prBody); const bulb = new THREE.Mesh(new THREE.SphereGeometry(.004, 12, 8), M(0xdfe3e8, { m: .9 })); bulb.position.y = .039; pr.add(bulb); const mand = cyl(.0012, .0012, .05, st, 8); mand.position.y = .08; pr.add(mand);
  const gun = new THREE.Group(); pp.add(gun); gun.add(at(cyl(.008, .012, .05, M(0xd0021b), 14), 0, .085, 0)); const gA = new THREE.Group(); gA.position.set(0, .1, 0); gun.add(gA); gA.add(at(box(.012, .14, .02, M(0xd0021b)), .02, .07, 0)); const gB = new THREE.Group(); gB.position.set(0, .1, 0); gun.add(gB); gB.add(at(box(.012, .14, .02, M(0xd0021b)), -.02, .07, 0)); const gH = makeHand(); gH.position.set(0, .2, 0); gH.rotation.z = Math.PI / 2; gH.scale.setScalar(.8); gun.add(gH); gun.traverse(o => o.userData.noFit = true);
  const card = infoCard(root, L('أنواع البرشام وطوله', 'Rivet types and length'), [[L('الأنواع', 'Types'), L('راس مدوّرة · غاطسة · مبططة · بوب', 'Round · countersunk · flat · pop')], [L('طول البرشامة', 'Rivet length'), L('التخانة + 1.5 × القطر', 'Thickness + 1.5 × diameter')], [L('الثقب', 'Hole'), L('أكبر من القطر 0.1–0.2 مم', '0.1–0.2 mm over the diameter')]]);
  const rd = readout(.62, .09); rd.mesh.position.set(0, .72, -.55); root.add(rd.mesh);
  part('plates', pA, V(.1, .01, .03), L('اللوحين', 'The plates'), ''); part('rivet', rivet, V(0, .03, 0), L('البرشامة', 'Rivet'), ''); part('set', set, V(0, .13, 0), L('السنبك الضامّ والكبّاس', 'Rivet set and snap'), ''); part('dolly', dolly, V(0, .04, .05), L('السندة', 'Dolly'), L('فيها نقرة على شكل الراس.', 'Has a recess shaped like the head.')); part('gun', gun, V(0, .2, 0), L('مسدس البرشام البوب', 'Pop-rivet gun'), ''); part('card', card.mesh, V(0, .12, 0), L('أنواع البرشام', 'Rivet types'), '');
  const st_ = { m: 'types' }; let t = 0;
  return {
    ...ctx, view: V(.15, .55, 1.2), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('أنواع البرشام وحساب الطول', 'Rivet types and length'), text: L('البرشام وصلة دايمة: راس مدوّرة، أو غاطسة (للأسطح المستوية)، أو مبططة، أو برشام بوب (من جهة واحدة). طول البرشامة = تخانة اللوحين + 1.5 × قطرها، عشان يفضل جزء يتشكّل منه الراس التانية. والثقب أكبر من القطر 0.1–0.2 مم.', 'A rivet is a permanent joint: round head, countersunk (for flush surfaces), flat head, or pop (blind) rivet worked from one side. Rivet length = total plate thickness + 1.5 × diameter, leaving enough to form the second head. The hole is 0.1–0.2 mm over the diameter.'), cam: { t: [.42, .42, -.5], d: .34, dir: [0, .1, 1] }, s: { m: 'types' } },
      { title: L('التجهيز وإدخال البرشامة', 'Preparing and inserting the rivet'), text: L('بنثقب اللوحين مع بعض وهما مربوطين عشان الثقوب تيجي على بعض، ونشيل الرايش. ندخّل البرشامة من تحت وراسها في نقرة السندة، وبعدين نحط السنبك الضامّ ونضربه ضربة عشان اللوحين يقربوا من بعض.', 'Drill both plates together while clamped so the holes line up, and remove the burrs. Insert the rivet from below with its head in the dolly recess, then use the drawing-up set with one blow to close the plates together.'), cam: { t: [-.1, .07, 0], d: .3, dir: [.5, .35, 1] }, s: { m: 'insert' } },
      { title: L('تشكيل الراس', 'Forming the head'), text: L('بالشاكوش بنضرب على طرف البرشامة عشان ينتفخ ويملا الثقب، وبعدين بنكوّر الطرف بضربات مايلة حواليه. وفي الآخر نحط الكبّاس (السنبك المقعّر) ونضرب لحد ما الراس تاخد شكلها المدوّر الناعم.', 'Hammer the rivet tail so it swells and fills the hole, then shape it with angled blows around it. Finally place the snap (a cupped set) on it and strike until the head takes its smooth round shape.'), cam: { t: [-.1, .08, 0], d: .3, dir: [.5, .35, 1] }, s: { m: 'head' } },
      { title: L('البرشام البوب', 'Pop riveting'), text: L('لما نوصل لجهة واحدة بس: ندخّل البرشامة في الثقب، ونركّب المسمار في المسدس، ونضغط اليد كذا مرة. المسمار بيتسحب ويفلطح طرف البرشامة من ورا، ولما الوصلة تتقفل المسمار بيتقطع لوحده.', 'When only one side can be reached: insert the rivet in the hole, put its mandrel in the gun and squeeze the handles several times. The mandrel is pulled, flaring the rivet behind the plates, and when the joint is tight the mandrel snaps off by itself.'), cam: { t: [.25, .08, .05], d: .34, dir: [.4, .3, 1] }, s: { m: 'pop' } }
    ],
    apply(s){ st_.m = s.m; t = 0; },
    update(dt){ t += dt; const m = st_.m, f = (t % 9) / 9, a = Math.abs(Math.sin(t * 4.5)); const top = .06;
      let gapZ = m === 'insert' ? .006 * Math.max(0, 1 - Math.max(0, f - .55) / .2) : 0; pA.position.set(-.1, top + .003, 0); pB.position.set(-.08, top + .009 + gapZ, .02);
      rivet.visible = m !== 'pop' && m !== 'types'; rivet.position.set(-.1, m === 'insert' ? top - .02 + Math.min(1, f / .3) * .02 : top, 0);
      const hk = m === 'head' ? Math.min(1, f / .8) : 0; shank.scale.y = m === 'head' ? 1 - hk * .5 : 1; shank.position.y = .015 * shank.scale.y; swell.visible = m === 'head' && hk > .2; swell.position.set(-.1, top + .015 + .006, 0); formed.visible = m === 'head' && hk > .5; formed.scale.set(1, (hk - .5) * 2, 1); formed.position.set(-.1, top + .021, 0);
      set.visible = (m === 'insert' && f > .5) || (m === 'head' && f > .55); set.position.set(-.1, top + .02, 0); ham.visible = set.visible || (m === 'head' && f <= .55); hammerAt(ham, set.visible ? V(-.1, top + .14, 0) : V(-.1, top + .025, 0), a);
      const pk = m === 'pop' ? Math.min(1, f / .7) : 0; gun.visible = m === 'pop'; gun.position.y = .01; gA.rotation.z = -Math.abs(Math.sin(t * 4)) * .3 * (pk < 1); gB.rotation.z = Math.abs(Math.sin(t * 4)) * .3 * (pk < 1); mand.position.y = .08 + pk * .015; mand.visible = pk < 1 || m !== 'pop'; bulb.scale.set(1 + pk * 1.2, 1 - pk * .4, 1 + pk * 1.2); bulb.position.y = .039 + pk * .006; pr.visible = m === 'pop' || m === 'types';
      rd.setText({ types: L('الطول = التخانة + 1.5 × القطر', 'Length = thickness + 1.5 × diameter'), insert: f > .55 ? L('السنبك الضامّ بيقرّب اللوحين', 'Drawing-up set closes the plates') : L('البرشامة من تحت والراس في السندة', 'Rivet from below, head in the dolly'), head: hk < .55 ? L('ضرب الطرف: بينتفخ ويملا الثقب', 'Hammering the tail: it swells') : L('الكبّاس بيشكّل الراس المدوّرة', 'The snap forms the round head'), pop: pk >= 1 ? L('المسمار اتقطع · الوصلة اتقفلت ✓', 'Mandrel snapped · joint tight ✓') : L('ضغط اليد: المسمار بيتسحب', 'Squeezing: mandrel pulled') }[m]);
    }
  };
}

/* ---------- 9) المقاشط والمكابس والاسطمبات ---------- */
function buildPresses(){
  const ctx = makeCtx(), { root, part } = ctx; root.add(elxBench()); const st = STEELM();
  /* الكشط */
  const sp = box(.22, .03, .14, M(0x8a9099, { m: .6, r: .45 })); sp.position.set(-.35, .015, .15); root.add(sp); const spots = []; for(let i = 0; i < 26; i++){ const s = cyl(.006 + Math.random() * .004, .006, .0005, M(0x2a4fb0, { r: .6 }), 10); s.position.set(-.35 + (Math.random() - .5) * .19, .0305, .15 + (Math.random() - .5) * .11); s.userData.big = i < 10; root.add(s); spots.push(s); }
  const scr = new THREE.Group(); root.add(scr); scr.add(at(box(.18, .003, .022, st), .09, 0, 0)); const sh = cyl(.012, .012, .09, M(0x9a6a3e, { r: .7 }), 12); sh.rotation.z = Math.PI / 2; sh.position.x = -.04; scr.add(sh); const sH1 = makeHand(); sH1.position.set(-.05, .01, 0); sH1.rotation.y = Math.PI; sH1.scale.setScalar(.8); scr.add(sH1); const sH2 = makeHand(); sH2.position.set(.15, .02, 0); sH2.scale.setScalar(.6); scr.add(sH2); scr.traverse(o => o.userData.noFit = true);
  const scrTypes = new THREE.Group(); scrTypes.position.set(-.45, .005, .32); root.add(scrTypes); [[0, L('مقشطة مبططة', 'Flat scraper'), 'f'], [.04, L('مقشطة مثلث', 'Triangular scraper'), 't'], [.08, L('مقشطة نص دايرة', 'Half-round scraper'), 'h']].forEach(([z, lb, k]) => { const g = new THREE.Group(); g.position.z = z; scrTypes.add(g); const b = k === 't' ? new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .12, 3), st) : k === 'h' ? new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, .12, 12, 1, false, 0, Math.PI), st) : box(.12, .003, .018, st); if(k !== 'f') b.rotation.z = Math.PI / 2; g.add(b); const hh = cyl(.009, .009, .06, M(0x9a6a3e), 10); hh.rotation.z = Math.PI / 2; hh.position.x = -.09; g.add(hh); g.add(at(label(lb, '#1d2128', .02), 0, .022, 0)); });
  /* المكبس اليدوي (فلاي) والاسطمبة */
  const FP = new THREE.Group(); FP.position.set(.05, 0, -.2); root.add(FP); const fm = M(0x3a5a7a, { r: .45 });
  FP.add(at(box(.24, .04, .2, fm), 0, .02, 0)); FP.add(at(box(.08, .5, .08, fm), 0, .27, -.07)); FP.add(at(box(.08, .07, .2, fm), 0, .52, .0)); const nutB = cyl(.03, .03, .05, fm, 16); nutB.position.set(0, .52, .06); FP.add(nutB);
  const screwG = new THREE.Group(); screwG.position.set(0, .52, .06); FP.add(screwG); const scrw = cyl(.016, .016, .2, M(0xc9ced6, { m: .85 }), 14); screwG.add(scrw); const fly = new THREE.Group(); fly.position.y = .12; screwG.add(fly); fly.add(at(cyl(.006, .006, .44, st, 8).rotateZ(Math.PI / 2), 0, 0, 0)); [-1, 1].forEach(s => fly.add(at(new THREE.Mesh(new THREE.SphereGeometry(.03, 16, 12), M(0x3a3f46, { m: .7 })), s * .22, 0, 0))); const fH = makeHand(); fH.position.set(.22, .03, 0); fH.rotation.z = Math.PI / 2; fH.scale.setScalar(.8); fly.add(fH);
  const ram = new THREE.Group(); ram.position.set(0, .52, .06); FP.add(ram); ram.add(at(box(.05, .06, .05, M(0x9aa0a6, { m: .7 })), 0, -.13, 0)); const punchP = cyl(.012, .012, .05, M(0xdfe3e8, { m: .9 }), 18); punchP.position.y = -.185; ram.add(punchP);
  const dieB = box(.12, .04, .1, M(0x6c747d, { m: .7 })); dieB.position.set(0, .06, .06); FP.add(dieB); const dieH = cyl(.0125, .0125, .0405, M(0x111111), 18); dieH.position.set(0, .06, .06); FP.add(dieH);
  const strip = new THREE.Group(); strip.position.set(0, .0815, .06); FP.add(strip); const stripM = box(.4, .003, .04, M(0xb7c0ca, { m: .7, r: .35 })); strip.add(stripM); const holes = []; for(let i = 0; i < 6; i++){ const h = cyl(.012, .012, .0035, M(0x1d2128), 18); h.position.set(-.18 + i * .035, 0, 0); strip.add(h); holes.push(h); }
  const blanks = []; for(let i = 0; i < 6; i++){ const b = cyl(.012, .012, .003, M(0xb7c0ca, { m: .7 }), 18); b.userData.noFit = true; b.visible = false; FP.add(b); blanks.push(b); }
  /* اسطمبة ثني V */
  const vdie = new THREE.Group(); vdie.position.set(.38, 0, -.15); root.add(vdie); const vs = new THREE.Shape(); vs.moveTo(-.05, 0); vs.lineTo(.05, 0); vs.lineTo(.05, .04); vs.lineTo(.015, .04); vs.lineTo(0, .022); vs.lineTo(-.015, .04); vs.lineTo(-.05, .04); vs.closePath(); const vg = new THREE.ExtrudeGeometry(vs, { depth: .08, bevelEnabled: false }); vg.translate(0, 0, -.04); vdie.add(new THREE.Mesh(vg, M(0x6c747d, { m: .7 })));
  const vpun = new THREE.Group(); vdie.add(vpun); const vps = new THREE.Shape(); vps.moveTo(-.012, .06); vps.lineTo(0, .042); vps.lineTo(.012, .06); vps.lineTo(.012, .1); vps.lineTo(-.012, .1); vps.closePath(); const vpg = new THREE.ExtrudeGeometry(vps, { depth: .08, bevelEnabled: false }); vpg.translate(0, 0, -.04); vpun.add(new THREE.Mesh(vpg, M(0xc9ced6, { m: .85 })));
  const vL = new THREE.Group(), vR = new THREE.Group(); vL.position.set(0, .041, 0); vR.position.set(0, .041, 0); vdie.add(vL); vdie.add(vR); vL.add(at(box(.06, .002, .06, M(0xb7c0ca, { m: .7 })), -.03, 0, 0)); vR.add(at(box(.06, .002, .06, M(0xb7c0ca, { m: .7 })), .03, 0, 0));
  const types = infoCard(root, L('المكابس والاسطمبات', 'Presses and dies'), [[L('مكبس يدوي (فلاي)', 'Fly press'), L('بالدراع والكور التقيلة', 'Arm with heavy balls')], [L('مكبس ميكانيكي / هيدروليك', 'Mechanical / hydraulic'), L('بالموتور: إنتاج كبير', 'Powered: mass production')], [L('اسطمبة تخريم وتفريغ', 'Piercing / blanking die'), L('بتقص شكل من الشريط', 'Cuts a shape from strip')], [L('اسطمبة ثني وسحب', 'Bending / drawing die'), L('بتشكّل من غير قص', 'Forms without cutting')]]);
  const rd = readout(.62, .09); rd.mesh.position.set(0, .82, -.55); root.add(rd.mesh);
  part('sp', sp, V(0, .03, .08), L('سطح بيتكشط', 'Surface being scraped'), L('النقط الزرقا هي الأماكن العالية.', 'The blue spots are the high points.')); part('scrTypes', scrTypes, V(0, .04, .04), L('أنواع المقاشط', 'Scraper types'), ''); part('press', FP, V(0, .62, .06), L('المكبس اليدوي (فلاي)', 'Fly press'), ''); part('die', dieB, V(0, .03, .05), L('الاسطمبة', 'The die'), ''); part('vdie', vdie, V(0, .12, 0), L('اسطمبة ثني V', 'V-bending die'), ''); part('types', types.mesh, V(0, .12, 0), L('الأنواع', 'Types'), '');
  const st_ = { m: 'scrtypes' }; let t = 0, cyc = -1;
  return {
    ...ctx, view: V(.1, .5, 1.25), sway: true, hint: L('اسحب للتدوير · صباعين للتقريب', 'Drag to rotate · pinch to zoom'),
    steps: [
      { title: L('المقاشط وأنواعها', 'Scrapers and their types'), text: L('المقشطة بتشيل طبقة رفيعة جدًا (أجزاء من المليمتر) عشان السطح يبقى مستوي بدقة أعلى من البرادة، زي سطح الشنكرة وكراسي الماكينات. المبططة للأسطح المستوية، والمثلث والنص دايرة للكراسي والأسطح المقعّرة.', 'A scraper removes a very thin layer (hundredths of a millimetre) to make a surface flatter than filing can, as on surface plates and machine slides. The flat scraper is for flat surfaces; the triangular and half-round ones are for bearings and curved surfaces.'), cam: { t: [-.4, .03, .3], d: .32, dir: [0, .8, 1] }, s: { m: 'scrtypes' } },
      { title: L('الكشط بالأزرق', 'Scraping to blue'), text: L('بنحط طبقة أزرق رفيعة على سطح مرجعي وندعك عليه الشغلانة: الأماكن العالية بتاخد أزرق. بنكشط النقط الزرقا بس بمشاوير قصيرة، ونكرر. مع كل مرة النقط بتصغر وتكتر، لحد ما تبقى منتشرة بانتظام على السطح كله.', 'Spread a thin film of blue on a reference surface and rub the work on it: the high spots pick up blue. Scrape only the blue spots with short strokes and repeat. Each time the spots get smaller and more numerous, until they are spread evenly over the whole surface.'), cam: { t: [-.35, .05, .15], d: .32, dir: [.2, .8, .8] }, s: { m: 'scrape' } },
      { title: L('المكابس وأنواعها', 'Presses and their types'), text: L('المكبس اليدوي (الفلاي): بنلف الدراع اللي في أطرافه كور تقيلة، فالبريمة بتنزّل الكباس بقوة كبيرة. والمكبس الميكانيكي بموتور وحدّافة للإنتاج الكبير، والهيدروليك بزيت مضغوط وقوة ثابتة. أهميتها: نفس القطعة بالظبط آلاف المرات بسرعة.', 'In the fly press, swinging the arm with heavy balls on its ends drives the screw and brings the ram down with great force. A mechanical press uses a motor and flywheel for mass production, and a hydraulic press uses oil under pressure for a steady force. They make the identical part thousands of times, fast.'), cam: { t: [.05, .35, -.15], d: .45, dir: [.25, .2, 1] }, s: { m: 'press' } },
      { title: L('اسطمبة التفريغ والتخريم', 'Blanking and piercing dies'), text: L('الاسطمبة نصين: الكباس (الذكر) والقالب (الأنثى) بخلوص صغير بينهم. الشريط بيتقدّم خطوة ثابتة، والكباس بينزل يقص قرص يقع من تحت. لو القرص هو المطلوب يبقى تفريغ، ولو الشريط المخرّم هو المطلوب يبقى تخريم.', 'A die has two halves: the punch and the die with a small clearance between them. The strip advances by a fixed pitch and the punch comes down, cutting a disc that drops through. If the disc is the part, it is blanking; if the holed strip is the part, it is piercing.'), cam: { t: [.05, .1, -.14], d: .34, dir: [.3, .45, 1] }, s: { m: 'blank' } },
      { title: L('اسطمبة الثني', 'The bending die'), text: L('اسطمبة الثني ما بتقصش: الكباس على شكل V بينزل على الشريحة فوق القالب ويثنيها بالزاوية المطلوبة. وفي اسطمبات سحب بتعمل كبايات وعلب من الصاج، واسطمبات مركّبة بتعمل كذا عملية في ضربة واحدة.', 'A bending die does not cut: the V-shaped punch comes down on the strip over the die and bends it to the required angle. Drawing dies make cups and boxes from sheet, and compound dies do several operations in one stroke.'), cam: { t: [.38, .06, -.15], d: .32, dir: [.2, .3, 1] }, s: { m: 'bend' } }
    ],
    apply(s){ st_.m = s.m; t = 0; cyc = -1; blanks.forEach(b => b.visible = false); },
    update(dt){ t += dt; const m = st_.m;
      scr.visible = m === 'scrape'; if(m === 'scrape'){ const T = 12, f = (t % T) / T, pass = Math.floor(f * 3), sp_ = (t * 2.5) % 1; scr.position.set(-.35 + (sp_ - .5) * .08 + Math.sin(t * .7) * .05, .032, .15 + Math.cos(t * .5) * .04); scr.rotation.set(0, .5 + (pass % 2) * -1, -.35);
        spots.forEach((s, i) => { const scale = pass === 0 ? (s.userData.big ? 1.6 : .4) : pass === 1 ? (s.userData.big ? 1 : .8) : .6; s.scale.set(scale, 1, scale); s.visible = pass > 0 || s.userData.big || i % 3 === 0; }); }
      const T2 = 2.4, ph = (t % T2) / T2, down = ph < .5 ? Math.sin(ph / .5 * Math.PI) : 0; const pressOn = m === 'press' || m === 'blank';
      fly.rotation.y = pressOn ? Math.sin(ph * Math.PI * 2) * .9 : 0; screwG.rotation.y = fly.rotation.y; ram.position.y = .52 - (pressOn ? down * .1 : 0) + .0;
      if(m === 'blank'){ const n = Math.floor(t / T2) % 6; const slide = ph > .6 ? (ph - .6) / .4 * .035 : 0; strip.position.x = .18 - .035 * n - slide; holes.forEach((h, i) => h.visible = i < n || (i === n && ph > .45));
        const b = blanks[n]; if(ph > .45 && ph < .52 && !b.visible){ b.visible = true; b.position.set(0, .04, .06); b.userData.v = 0; } if(n === 0 && ph < .1) blanks.forEach((bb, k) => { if(k > 0) bb.visible = false; }); blanks.forEach(bb => { if(bb.visible){ bb.userData.v = (bb.userData.v || 0) + dt * 2; bb.position.y = Math.max(.003, bb.position.y - bb.userData.v * dt); } }); } else { holes.forEach(h => h.visible = false); strip.position.x = .0; }
      const bk = m === 'bend' ? Math.min(1, ((t % 5) / 5) / .6) : 0; vpun.position.y = m === 'bend' ? .04 - bk * .02 : .04; vL.rotation.z = -bk * .7; vR.rotation.z = bk * .7;
      rd.setText({ scrtypes: L('مبططة · مثلث · نص دايرة', 'Flat · triangular · half-round'), scrape: L('بنكشط النقط الزرقا بس', 'Scrape only the blue spots'), press: L('الدراع بيلف ← البريمة بتنزّل الكباس', 'Arm swings → screw drives the ram'), blank: down > .6 ? L('الكباس بيقص القرص', 'Punch cuts the blank') : L('الشريط بيتقدّم خطوة', 'Strip advances one pitch'), bend: L(`الثني ${Math.round(bk * 80)}°`, `Bending ${Math.round(bk * 80)}°`) }[m]);
    }
  };
}

const MODELS_DEF = () => [
  { id: 'fmark', name: L('القياس والشنكرة', 'Measuring & marking out'), from: L('برادة · وحدات 1، 2', 'Fitting · units 1, 2'), build: buildMarking },
  { id: 'ffile', name: L('البرادة: المستوية والمتلاقية والمنحنية', 'Filing: flat, square & curved'), from: L('برادة · وحدات 3، 4، 12، 15', 'Fitting · units 3, 4, 12, 15'), build: buildFiling },
  { id: 'fsaw', name: L('النشر والقص اليدوي', 'Hand sawing & cutting'), from: L('برادة · وحدات 5، 6', 'Fitting · units 5, 6'), build: buildSawing },
  { id: 'fdrill', name: L('الثقب والتخويش والبرغلة', 'Drilling, countersinking & reaming'), from: L('برادة · وحدات 7، 8، 17', 'Fitting · units 7, 8, 17'), build: buildDrilling },
  { id: 'ftap', name: L('القلاووظ الداخلي والخارجي', 'Internal & external threads'), from: L('برادة · وحدات 9، 10', 'Fitting · units 9, 10'), build: buildThreading },
  { id: 'fbend', name: L('الاستعدال والثني والمكبس', 'Straightening & bending'), from: L('برادة · وحدات 11، 16', 'Fitting · units 11, 16'), build: buildBending },
  { id: 'fchisel', name: L('القطع بالأجنة والسنبك', 'Chiselling & punches'), from: L('برادة · وحدة 13', 'Fitting · unit 13'), build: buildChisel },
  { id: 'frivet', name: L('البرشمة', 'Riveting'), from: L('برادة · وحدة 14', 'Fitting · unit 14'), build: buildRiveting },
  { id: 'fpress', name: L('المقاشط والمكابس والاسطمبات', 'Scrapers, presses & dies'), from: L('برادة · وحدات 18–20', 'Fitting · units 18–20'), build: buildPresses },
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
  document.querySelectorAll('#f3d-root .f3d-tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.id === def.id)));
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
    const mk = document.createElement('button'); mk.type = 'button'; mk.className = 'f3d-mk'; mk.textContent = i + 1;
    mk.setAttribute('aria-label', p.label); mk.addEventListener('click', () => select(selected === id ? null : id));
    markerLayer.appendChild(mk); markers[id] = mk;
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" class="f3d-part" data-id="${id}"><span class="f3d-n">${i + 1}</span><span><b></b><span></span></span></button>`;
    li.querySelector('b').textContent = p.label; li.querySelector('span > span').textContent = p.desc;
    li.firstElementChild.addEventListener('click', () => select(selected === id ? null : id));
    list.appendChild(li);
  });
  tagEl = document.createElement('div'); tagEl.className = 'f3d-mk-tag'; tagEl.hidden = true; markerLayer.appendChild(tagEl);
}

function select(id){
  selected = id;
  Object.entries(markers).forEach(([k, el]) => el.classList.toggle('f3d-sel', k === id));
  document.querySelectorAll('#f3d-root .f3d-part').forEach(b => b.classList.toggle('f3d-sel', b.dataset.id === id));
  tagEl.hidden = !id; if(id) tagEl.textContent = current.parts[id].label;
}

function buildDots(){
  const d = $('dots'); d.innerHTML = '';
  current.steps.forEach((s, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'f3d-dot';
    b.setAttribute('aria-label', `${L('الخطوة', 'Step')} ${i + 1}: ${s.title}`); b.addEventListener('click', () => setStep(i)); d.appendChild(b);
  });
}

var camGoal = null, camHold = false;
function camGo(c){ if(!current || !fitInfo){ camGoal = null; camHold = false; return; } const d = current.view.clone().normalize();
  if(c){ const t = new THREE.Vector3(c.t[0], c.t[1], c.t[2]); const dir = c.dir ? new THREE.Vector3(c.dir[0], c.dir[1], c.dir[2]).normalize() : d; camGoal = { t, p: t.clone().add(dir.multiplyScalar(fitInfo.dist * (c.d || .5))) }; camHold = true; }
  else { camGoal = { t: fitInfo.center.clone(), p: fitInfo.center.clone().add(d.multiplyScalar(fitInfo.dist)) }; camHold = false; } }
function setStep(i, auto){
  if(!auto) autoStop();
  const steps = current.steps; stepIdx = Math.max(0, Math.min(steps.length - 1, i));
  const s = steps[stepIdx];
  $('stepNo').textContent = stepIdx + 1; $('stepCount').textContent = steps.length;
  $('stepTitle').textContent = s.title; $('stepText').textContent = s.text;
  $('prevBtn').disabled = stepIdx === 0; $('nextBtn').disabled = stepIdx === steps.length - 1;
  [...$('dots').children].forEach((b, k) => b.setAttribute('aria-current', String(k === stepIdx)));
  current.apply(s.s); camGo(s.cam); select(s.focus || null); if(typeof syncX === 'function') syncX();
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
    if(camHold) current.root.rotation.y *= .9; else if(current.sway && !userMoved && !reduceMotion) current.root.rotation.y = Math.sin(t * .35) * .22;
    current.update(dt);
    for(const [id, p] of Object.entries(current.parts)){
      const h = id === selected ? .4 + .3 * Math.sin(t * 5) : 0;
      for(const m of p.mats){
        m.emissive.copy(m.userData.baseE); m.emissiveIntensity = m.userData.baseI;
        if(h > 0){ m.emissive.lerp(GOLD, h); m.emissiveIntensity = Math.max(m.userData.baseI, 1); }
      }
    }
  }
  if(camGoal){ const k = Math.min(1, dt * 2.4); controls.target.lerp(camGoal.t, k); camera.position.lerp(camGoal.p, k); if(camera.position.distanceTo(camGoal.p) < .003 && controls.target.distanceTo(camGoal.t) < .003) camGoal = null; }
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
      el.classList.toggle('f3d-back', behind && id !== selected);
      if(id === selected && tagEl){ tagEl.style.left = x + 'px'; tagEl.style.top = y + 'px'; tagEl.style.visibility = off ? 'hidden' : 'visible'; }
    }
  }
}

/* ---------- الربط مع المنصة (تشغيل المعادن) ---------- */
const TITLE_TO_MODELS = {"القياس والشنكره": ["fmark"], "شنكره السطوح المستوية": ["fmark"], "برادة السطوح المستوية": ["ffile"], "برادة السطوح المتلاقية": ["ffile"], "النشر اليدوي": ["fsaw"], "القص اليدوي": ["fsaw"], "الثقب والتخويش": ["fdrill"], "كيفية عمل الثقوب الصماء": ["fdrill"], "القطع بالقلاووظات (الداخلية)": ["ftap"], "القطع بالقلاووظات والقلوظة (الخارجية)": ["ftap"], "الاستعدال والثني": ["fbend"], "براده السطوح المنحنية": ["ffile"], "القطع بالأجنة والسنبك.": ["fchisel"], "عمليات البرشمة": ["frivet"], "برادة الأجزاء المجمعة": ["ffile"], "الاستعدال بالمكبس": ["fbend"], "الثقب والبرغلة": ["fdrill"], "المقاشط وانوعها.": ["fpress"], "المكابس وانواعها واهميتها": ["fpress"], "أنواع الاسطمبات": ["fpress"], "اختبار نهاية البرنامج": ["ffile", "fmark", "fdrill", "ftap", "fsaw"]};
const ID_TO_MODELS = {"qot1l3z": ["fmark"], "lc6n10o": ["fmark"], "6d9je81": ["ffile"], "bl0yq92": ["ffile"], "0dcwa9u": ["fsaw"], "qo32vcn": ["fsaw"], "a05sk98": ["fdrill"], "szwnjqs": ["fdrill"], "ik8xk9j": ["ftap"], "65v9vuz": ["ftap"], "k4g0khb": ["fbend"], "g9fyz19": ["ffile"], "8xs6bxn": ["fchisel"], "06lw47c": ["frivet"], "ui93bel": ["ffile"], "rds35ge": ["fbend"], "lg9b9qm": ["fdrill"], "y0056tq": ["fpress"], "89jspli": ["fpress"], "f4nxkt9": ["fpress"], "btoj8be": ["ffile", "fmark", "fdrill", "ftap", "fsaw"]};
const UI3 = { reset: ['إعادة الضبط', 'Reset view'], step: ['الخطوة', 'Step'], of: ['من', 'of'], prev: ['السابق', 'Back'], next: ['التالي', 'Next'], parts: ['القطع', 'Parts'], eyebrow: ['موديل 3D تفاعلي', 'Interactive 3D model'], close: ['إغلاق', 'Close'] };
let lastFocus = null;
function applyLang(){
  const k = LANG === 'en' ? 1 : 0;
  root3d.setAttribute('dir', LANG === 'en' ? 'ltr' : 'rtl');
  $('resetBtn').textContent = UI3.reset[k]; $('prevBtn').textContent = UI3.prev[k]; $('nextBtn').textContent = UI3.next[k]; $('close').setAttribute('aria-label', UI3.close[k]);
  root3d.querySelector('.f3d-eyebrow').textContent = UI3.eyebrow[k]; root3d.querySelector('.f3d-card h4').textContent = UI3.parts[k];
  const meta = root3d.querySelector('.f3d-stepmeta'); meta.childNodes[0].textContent = UI3.step[k] + ' '; meta.childNodes[2].textContent = ' ' + UI3.of[k] + ' ';
}
function buildTabs(ids){
  const t = $('tabs'); t.innerHTML = '';
  if(ids.length < 2) return;
  ids.forEach(id => {
    const def = MODELS.find(m => m.id === id); if(!def) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'f3d-tab'; b.setAttribute('role', 'tab'); b.dataset.id = id; b.textContent = def.name;
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
const UNIT_STEPS_T = {"القياس والشنكره": {"fmark": [0, 1]}, "شنكره السطوح المستوية": {"fmark": [2, 3, 4]}, "برادة السطوح المستوية": {"ffile": [0, 1, 2, 3]}, "برادة السطوح المتلاقية": {"ffile": [1, 3, 4]}, "النشر اليدوي": {"fsaw": [0, 1, 2, 3]}, "القص اليدوي": {"fsaw": [4]}, "الثقب والتخويش": {"fdrill": [0, 1, 2]}, "كيفية عمل الثقوب الصماء": {"fdrill": [1, 3]}, "القطع بالقلاووظات (الداخلية)": {"ftap": [0, 1, 2]}, "القطع بالقلاووظات والقلوظة (الخارجية)": {"ftap": [3]}, "الاستعدال والثني": {"fbend": [0, 1]}, "براده السطوح المنحنية": {"ffile": [5]}, "برادة الأجزاء المجمعة": {"ffile": [1, 4]}, "الاستعدال بالمكبس": {"fbend": [2]}, "الثقب والبرغلة": {"fdrill": [4, 5]}, "المقاشط وانوعها.": {"fpress": [0, 1]}, "المكابس وانواعها واهميتها": {"fpress": [2]}, "أنواع الاسطمبات": {"fpress": [3, 4]}};
const UNIT_STEPS_I = {"qot1l3z": {"fmark": [0, 1]}, "lc6n10o": {"fmark": [2, 3, 4]}, "6d9je81": {"ffile": [0, 1, 2, 3]}, "bl0yq92": {"ffile": [1, 3, 4]}, "0dcwa9u": {"fsaw": [0, 1, 2, 3]}, "qo32vcn": {"fsaw": [4]}, "a05sk98": {"fdrill": [0, 1, 2]}, "szwnjqs": {"fdrill": [1, 3]}, "ik8xk9j": {"ftap": [0, 1, 2]}, "65v9vuz": {"ftap": [3]}, "k4g0khb": {"fbend": [0, 1]}, "g9fyz19": {"ffile": [5]}, "ui93bel": {"ffile": [1, 4]}, "rds35ge": {"fbend": [2]}, "lg9b9qm": {"fdrill": [4, 5]}, "y0056tq": {"fpress": [0, 1]}, "89jspli": {"fpress": [2]}, "f4nxkt9": {"fpress": [3, 4]}};
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
window.__stceModule3DGetTemplateKey = function(title, m){ try{ if(idsFor(title, m)) return 'fitting'; }catch(e){} return typeof prevKey === 'function' ? prevKey(title, m) : null; };
window.__stceModule3DOpen = function(templateKey, moduleTitle, m){ try{ if(templateKey === 'fitting' && open3D(moduleTitle, m)) return; }catch(e){ console.error('stce3d_fit_open_failed', e); } if(typeof prevOpen === 'function') prevOpen(templateKey, moduleTitle, m); };
window.__stceModule3DClose = function(){ try{ close3D(); }catch(e){} if(typeof prevClose === 'function') prevClose(); };
window.STCE3DF = { open: open3D, close: close3D, titles: () => Object.keys(TITLE_TO_MODELS) };
