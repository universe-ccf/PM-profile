import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

const app = document.querySelector('#app');
app.innerHTML = `
  <header class="topbar">
    <div class="brand-mark">光</div>
    <div><p class="eyebrow">SCIENCE STUDIO · 01</p><h1>光的颜色实验室</h1></div>
    <div class="header-note">观察 · 操作 · 发现</div>
  </header>
  <main class="layout">
    <section class="stage-panel">
      <div class="stage-head"><div><p class="eyebrow" id="experiment-kicker">实验 01</p><h2 id="experiment-title">白光的组成</h2></div><span class="status-dot"><i></i> 3D 实验场</span></div>
      <div id="scene-wrap"><div id="scene"></div><div class="scene-help">拖拽旋转 · 滚轮缩放</div></div>
      <div class="conclusion"><span class="conclusion-label">关键发现</span><strong id="conclusion-text">白光中包含多种颜色的光。</strong></div>
    </section>
    <aside class="control-panel">
      <div class="tabs" role="tablist"><button class="tab active" data-tab="spectrum">01&nbsp; 白光的组成</button><button class="tab" data-tab="rgb">02&nbsp; RGB 光的叠加</button></div>
      <div id="controls"></div>
    </aside>
  </main>
`;

const sceneRoot = document.querySelector('#scene');
const controlsRoot = document.querySelector('#controls');
const titleEl = document.querySelector('#experiment-title');
const kickerEl = document.querySelector('#experiment-kicker');
const conclusionEl = document.querySelector('#conclusion-text');
const tabs = [...document.querySelectorAll('.tab')];

let activeTab = 'spectrum';
let scene, camera, renderer, orbit, animationId;
let spectrumGroup, dispersionGroup, rgbGroup, spectrumProjection, spectrumFan, rgbProjection;
let spectrumRunning = false;
let spectrumStart = 0;
const spectrumMarkers = [];
const spectrumColors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x06b6d4, 0x3b82f6, 0x8b5cf6];
const spectrumNames = ['红', '橙', '黄', '绿', '青', '蓝', '紫'];
const rgb = { red: true, green: true, blue: true, redIntensity: 1, greenIntensity: 1, blueIntensity: 1 };

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151a);
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  // View the illuminated side of both screens, where the light actually lands.
  camera.position.set(-6.7, 4.7, 9.2);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  sceneRoot.appendChild(renderer.domElement);
  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enableDamping = true;
  orbit.target.set(0, 1.1, 0);
  scene.add(new THREE.HemisphereLight(0xcbd5e1, 0x07090b, 1.8));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 8, 5); scene.add(key);
  scene.add(new THREE.GridHelper(16, 16, 0x334155, 0x1e293b));
  buildSpectrumScene();
  buildRgbScene();
  resize();
  window.addEventListener('resize', resize);
  animate();
}

function makeLabel(text, color = '#f8fafc') {
  const canvas = document.createElement('canvas'); canvas.width = 384; canvas.height = 112;
  const ctx = canvas.getContext('2d'); ctx.font = 'bold 54px sans-serif'; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.shadowColor = '#05070a'; ctx.shadowBlur = 10; ctx.fillText(text, 192, 73);
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); sprite.scale.set(1.35, 0.36, 1); return sprite;
}

function buildSpectrumScene() {
  spectrumGroup = new THREE.Group(); scene.add(spectrumGroup);
  dispersionGroup = new THREE.Group(); dispersionGroup.visible = false; spectrumGroup.add(dispersionGroup);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.22, 4.4), new THREE.MeshStandardMaterial({ color: 0x20262c, roughness: 0.9 })); floor.position.set(0, -0.15, 0); spectrumGroup.add(floor);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.3, 5.8), new THREE.MeshStandardMaterial({ color: 0x020304, roughness: 1 })); screen.position.set(3.2, 1.95, 0); spectrumGroup.add(screen);
  const screenLabel = makeLabel('哑光纯黑屏幕', '#94a3b8'); screenLabel.position.set(3.45, 4.35, 0); screenLabel.scale.set(1.4, .3, 1); spectrumGroup.add(screenLabel);
  const prism = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 2.5, 3), new THREE.MeshPhysicalMaterial({ color: 0xbde5ff, transmission: .7, transparent: true, opacity: .54, roughness: .08, metalness: .05 })); prism.rotation.z = Math.PI / 2; prism.position.set(-0.5, 1.3, 0); spectrumGroup.add(prism);
  const prismLabel = makeLabel('三棱镜', '#cbd5e1'); prismLabel.position.set(-.5, 3.1, 0); prismLabel.scale.set(.95, .28, 1); spectrumGroup.add(prismLabel);
  const whiteBeam = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 3.1, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .34, depthWrite: false })); whiteBeam.rotation.z = Math.PI / 2; whiteBeam.position.set(-2.2, 1.3, 0); spectrumGroup.add(whiteBeam);
  const source = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffffff })); source.position.set(-3.9, 1.3, 0); spectrumGroup.add(source);
  const sourceLabel = makeLabel('白光', '#ffffff'); sourceLabel.position.set(-3.9, 2.1, 0); sourceLabel.scale.set(.8, .25, 1); spectrumGroup.add(sourceLabel);
  const spectrumMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { reveal: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float reveal;
      vec3 colorAt(float t) {
        vec3 red = vec3(1.0, .09, .04), orange = vec3(1.0, .36, .02), yellow = vec3(1.0, .91, .04);
        vec3 green = vec3(.05, 1.0, .16), cyan = vec3(.02, .9, 1.0), blue = vec3(.08, .32, 1.0), violet = vec3(.62, .15, 1.0);
        float p = clamp(t * 6.0, 0.0, 6.0);
        if (p < 1.0) return mix(red, orange, p);
        if (p < 2.0) return mix(orange, yellow, p - 1.0);
        if (p < 3.0) return mix(yellow, green, p - 2.0);
        if (p < 4.0) return mix(green, cyan, p - 3.0);
        if (p < 5.0) return mix(cyan, blue, p - 4.0);
        return mix(blue, violet, p - 5.0);
      }
      void main() {
        float t = 1.0 - vUv.y;
        float ends = smoothstep(0.0, .07, t) * (1.0 - smoothstep(.93, 1.0, t));
        float across = exp(-pow((vUv.x - .5) * 3.5, 2.0));
        float visible = smoothstep(t * 7.0 - .1, t * 7.0 + .42, reveal);
        float alpha = ends * across * visible * .94;
        gl_FragColor = vec4(colorAt(t) * (1.0 + .27 * across), alpha);
      }
    `,
  });
  spectrumProjection = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.85), spectrumMaterial);
  spectrumProjection.rotation.y = Math.PI / 2;
  spectrumProjection.position.set(3.292, 2.1, 0);
  spectrumProjection.renderOrder = 2;
  dispersionGroup.add(spectrumProjection);

  const origin = new THREE.Vector3(.27, 1.48, .08);
  const fanGeometry = new THREE.PlaneGeometry(3.05, 2.5);
  spectrumFan = new THREE.Mesh(fanGeometry, new THREE.MeshBasicMaterial({ map: spectrumGradientTexture(), transparent: true, opacity: .58, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  spectrumFan.rotation.y = Math.PI / 2; spectrumFan.position.set(1.72, 2.17, .04); dispersionGroup.add(spectrumFan);
  spectrumColors.forEach((color, i) => {
    const y = 3.32 - i * .34;
    const target = new THREE.Vector3(3.09, y, .08);
    const positions = [], uvs = [], indices = [];
    for (let step = 0; step <= 28; step++) {
      const t = step / 28;
      const center = origin.clone().lerp(target, t);
      const halfWidth = .035 + t * .14;
      for (let edge = 0; edge < 3; edge++) {
        positions.push(center.x, center.y + (edge - 1) * halfWidth, center.z);
        uvs.push(t, edge / 2);
      }
      if (step < 28) for (let edge = 0; edge < 2; edge++) {
        const a = step * 3 + edge; indices.push(a, a + 3, a + 1, a + 1, a + 3, a + 4);
      }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      uniforms: { beamColor: { value: new THREE.Color(color) }, progress: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform vec3 beamColor; uniform float progress; void main() { float edge = exp(-pow((vUv.y - .5) * 4.0, 2.0)); float tip = 1.0 - smoothstep(progress - .08, progress, vUv.x); float start = smoothstep(0.0, .06, vUv.x); gl_FragColor = vec4(beamColor, edge * tip * start * .44); }`,
    });
    const ray = new THREE.Mesh(geometry, material); ray.renderOrder = 1; dispersionGroup.add(ray);
    const label = makeLabel(`${spectrumNames[i]}色`, `#${color.toString(16).padStart(6, '0')}`); label.position.set(3.72, y + .12, .22); label.scale.set(.92, .31, 1); label.material.opacity = 0; dispersionGroup.add(label);
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(3.58, y, .22), .24, 0xffffff, .09, .05);
    arrow.line.material.transparent = true; arrow.cone.material.transparent = true; arrow.line.material.opacity = 0; arrow.cone.material.opacity = 0; dispersionGroup.add(arrow);
    spectrumMarkers.push({ ray, label, arrow });
  });
}

function buildRgbScene() {
  rgbGroup = new THREE.Group(); scene.add(rgbGroup); rgbGroup.visible = false;
  const floor = new THREE.Mesh(new THREE.BoxGeometry(8.8, .22, 5.5), new THREE.MeshStandardMaterial({ color: 0x20262c, roughness: .9 })); floor.position.y = -.15; rgbGroup.add(floor);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(.16, 4.4, 6.4), new THREE.MeshStandardMaterial({ color: 0x020304, roughness: 1 })); screen.position.set(3.05, 2, 0); rgbGroup.add(screen);
  const projectionMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { red: { value: 1 }, green: { value: 1 }, blue: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec2 vUv; uniform float red; uniform float green; uniform float blue; void main(){float edge=1.0-smoothstep(.18,.5,distance(vUv,vec2(.5))); float core=exp(-distance(vUv,vec2(.5))*5.0); vec3 color=vec3(red,green,blue)*(edge*.8+core*.7); gl_FragColor=vec4(color,edge*.9);}'
  });
  rgbProjection = new THREE.Mesh(new THREE.CircleGeometry(1.95, 64), projectionMaterial); rgbProjection.rotation.y = Math.PI / 2; rgbProjection.position.set(2.91, 2.32, 0); rgbProjection.renderOrder = 3; rgbGroup.add(rgbProjection);
  const label = makeLabel('哑光纯黑接收屏', '#94a3b8'); label.position.set(3.2, 4.55, 0); label.scale.set(1.45, .3, 1); rgbGroup.add(label);
  const data = [['red', 0xef4444, -1.55, 1.15], ['green', 0x22c55e, 0, .15], ['blue', 0x3b82f6, 1.55, -1.15]];
  data.forEach(([name, color, x, z]) => {
    const source = new THREE.Vector3(-3.15, 1.0, z);
    const target = new THREE.Vector3(2.78, 2.35 + z * .08, z * .28);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.48, 24, 16), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 2 })); lamp.position.copy(source); lamp.userData.name = name; rgbGroup.add(lamp);
    const direction = target.clone().sub(source); const length = direction.length();
    const glow = new THREE.Mesh(new THREE.CylinderGeometry(.42, .78, length, 32, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .22, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.copy(source).add(target).multiplyScalar(.5); glow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); glow.userData.name = `${name}Glow`; rgbGroup.add(glow);
    const spot = new THREE.Mesh(new THREE.CircleGeometry(1.65, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false })); spot.rotation.y = Math.PI / 2; spot.position.copy(target); spot.userData.name = `${name}Spot`; rgbGroup.add(spot);
    const text = makeLabel(name === 'red' ? '红光' : name === 'green' ? '绿光' : '蓝光', `#${color.toString(16).padStart(6, '0')}`); text.position.set(-3.15, 1.82, z); text.scale.set(.98, .33, 1); rgbGroup.add(text);
  });
}

function spectrumGradientTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 256;
  const ctx = canvas.getContext('2d'); const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  spectrumColors.forEach((color, i) => gradient.addColorStop(i / 6, `#${color.toString(16).padStart(6, '0')}`));
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new THREE.CanvasTexture(canvas);
}

function resize() { const box = sceneRoot.parentElement.getBoundingClientRect(); const width = Math.max(1, box.width); const height = Math.max(1, box.height); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }
function animate() { animationId = requestAnimationFrame(animate); orbit.update(); updateSpectrum(); updateRgb(); renderer.render(scene, camera); }

function updateSpectrum() {
  if (!spectrumRunning) return;
  const elapsed = (performance.now() - spectrumStart) / 1000;
  spectrumMarkers.forEach((item, i) => {
    const progress = THREE.MathUtils.clamp((elapsed - .35 - i * .32) / .78, 0, 1);
    item.ray.material.uniforms.progress.value = progress;
    const labelOpacity = THREE.MathUtils.clamp((progress - .82) * 5.6, 0, 1);
    item.label.material.opacity = labelOpacity;
    item.arrow.line.material.opacity = labelOpacity;
    item.arrow.cone.material.opacity = labelOpacity;
  });
  spectrumProjection.material.uniforms.reveal.value = THREE.MathUtils.clamp((elapsed - .95) / .32, 0, 7);
  spectrumFan.material.opacity = THREE.MathUtils.clamp((elapsed - .38) / .75, 0, 1) * .58;
  if (elapsed > 3.4) { spectrumRunning = false; conclusionEl.textContent = '白光中包含红、橙、黄、绿、青、蓝、紫等多种颜色的光。'; }
}

function updateRgb() {
  if (!rgbGroup.visible) return;
  ['red', 'green', 'blue'].forEach((name) => {
    const on = rgb[name]; const intensity = on ? rgb[`${name}Intensity`] : 0;
    const lamp = rgbGroup.children.find((o) => o.userData.name === name); const glow = rgbGroup.children.find((o) => o.userData.name === `${name}Glow`); const spot = rgbGroup.children.find((o) => o.userData.name === `${name}Spot`);
    if (lamp) lamp.material.emissiveIntensity = .3 + intensity * 2.5;
    if (glow) glow.material.opacity = intensity * .2;
    if (spot) spot.material.opacity = intensity * .72;
  });
  if (rgbProjection) {
    rgbProjection.material.uniforms.red.value = rgb.red ? rgb.redIntensity : 0;
    rgbProjection.material.uniforms.green.value = rgb.green ? rgb.greenIntensity : 0;
    rgbProjection.material.uniforms.blue.value = rgb.blue ? rgb.blueIntensity : 0;
  }
}

function showSpectrum() { spectrumRunning = false; dispersionGroup.visible = true; spectrumFan.material.opacity = .58; spectrumProjection.material.uniforms.reveal.value = 7; spectrumMarkers.forEach((item) => { item.ray.material.uniforms.progress.value = 1; item.label.material.opacity = 1; item.arrow.line.material.opacity = 1; item.arrow.cone.material.opacity = 1; }); conclusionEl.textContent = '白光中包含红、橙、黄、绿、青、蓝、紫等多种颜色的光。'; }
function resetSpectrum() { spectrumRunning = false; dispersionGroup.visible = false; spectrumFan.material.opacity = 0; spectrumProjection.material.uniforms.reveal.value = 0; spectrumMarkers.forEach((item) => { item.ray.material.uniforms.progress.value = 0; item.label.material.opacity = 0; item.arrow.line.material.opacity = 0; item.arrow.cone.material.opacity = 0; }); conclusionEl.textContent = '白光中包含多种颜色的光。'; }
function startSpectrum() { resetSpectrum(); dispersionGroup.visible = true; spectrumRunning = true; spectrumStart = performance.now(); }

function renderControls() {
  if (activeTab === 'spectrum') {
    controlsRoot.innerHTML = `<div class="control-intro"><span class="step-number">01</span><div><h3>白光经过三棱镜</h3><p>观察白光如何展开成七种颜色。</p></div></div><button class="primary-btn" id="start-spectrum">▶ 开始分光</button><div class="button-row"><button class="secondary-btn" id="show-spectrum">显示全部</button><button class="secondary-btn" id="reset-spectrum">重置</button></div><div class="tip"><b>观察提示</b><span>光谱中的颜色按顺序排列，每一条彩色光带都有自己的名字。</span></div>`;
    document.querySelector('#start-spectrum').onclick = startSpectrum;
    document.querySelector('#show-spectrum').onclick = showSpectrum;
    document.querySelector('#reset-spectrum').onclick = resetSpectrum;
  } else {
    controlsRoot.innerHTML = `<div class="control-intro"><span class="step-number">02</span><div><h3>三种光叠加</h3><p>拖动亮度，观察颜色如何改变。</p></div></div><div class="sliders">${colorControl('red','红光','#ef4444')}${colorControl('green','绿光','#22c55e')}${colorControl('blue','蓝光','#3b82f6')}</div><p class="preset-label">快速观察</p><div class="presets"><button data-preset="white">白光</button><button data-preset="yellow">黄光</button><button data-preset="magenta">品红光</button><button data-preset="cyan">青光</button><button data-preset="off">关闭全部</button></div><div class="tip"><b id="rgb-equation">红光 + 绿光 + 蓝光 = 白光</b><span id="rgb-tip">三种光同时开启，重叠区域会变成白色。</span></div>`;
    ['red','green','blue'].forEach((name) => { document.querySelector(`#toggle-${name}`).onchange = (e) => { rgb[name] = e.target.checked; updateRgb(); updateRgbMessage(); }; document.querySelector(`#range-${name}`).oninput = (e) => { rgb[`${name}Intensity`] = Number(e.target.value) / 100; updateRgb(); }; });
    document.querySelectorAll('[data-preset]').forEach((button) => button.onclick = () => applyPreset(button.dataset.preset));
  }
}

function colorControl(name, label, color) { return `<div class="color-control"><div class="color-line"><span class="swatch" style="background:${color}"></span><b>${label}</b><label class="switch"><input id="toggle-${name}" type="checkbox" ${rgb[name] ? 'checked' : ''}><span></span></label></div><input id="range-${name}" type="range" min="0" max="100" value="${Math.round(rgb[`${name}Intensity`] * 100)}" style="accent-color:${color}"><span class="range-value">${Math.round(rgb[`${name}Intensity`] * 100)}%</span></div>`; }
function applyPreset(preset) { const states = { white: [1,1,1], yellow: [1,1,0], magenta: [1,0,1], cyan: [0,1,1], off: [0,0,0] }; ['red','green','blue'].forEach((name, i) => { rgb[name] = Boolean(states[preset][i]); rgb[`${name}Intensity`] = 1; }); renderControls(); updateRgb(); updateRgbMessage(); }
function updateRgbMessage() { const active = ['red','green','blue'].filter((name) => rgb[name]); const equation = active.length === 3 ? '红光 + 绿光 + 蓝光 = 白光' : active.length === 2 ? ({ redgreen:'红光 + 绿光 = 黄光', redblue:'红光 + 蓝光 = 品红光', greenblue:'绿光 + 蓝光 = 青光' }[active.join('') || active.slice().sort().join('')] || '拖动滑杆，观察光的变化') : active.length === 1 ? `${active[0] === 'red' ? '红' : active[0] === 'green' ? '绿' : '蓝'}光单独照亮屏幕` : '没有光，屏幕保持黑色'; document.querySelector('#rgb-equation').textContent = equation; document.querySelector('#rgb-tip').textContent = active.length === 0 ? '打开一盏灯开始实验。' : '光线重叠后会产生新的颜色。'; conclusionEl.textContent = equation; }

tabs.forEach((tab) => tab.onclick = () => { activeTab = tab.dataset.tab; tabs.forEach((item) => item.classList.toggle('active', item === tab)); spectrumGroup.visible = activeTab === 'spectrum'; rgbGroup.visible = activeTab === 'rgb'; titleEl.textContent = activeTab === 'spectrum' ? '白光的组成' : 'RGB 光的叠加'; kickerEl.textContent = activeTab === 'spectrum' ? '实验 01' : '实验 02'; conclusionEl.textContent = activeTab === 'spectrum' ? '白光中包含多种颜色的光。' : '红光 + 绿光 + 蓝光 = 白光'; renderControls(); if (activeTab === 'rgb') updateRgbMessage(); });

setupScene(); renderControls();
