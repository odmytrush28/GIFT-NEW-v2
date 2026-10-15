/* CREATE — WebGL layer (Three.js): five golden streams from the portrait to the five gifts,
   arrival bursts, recurring energy pulses and ambient gold dust. Streams are a pure function of the
   animation clock in main.js, so Pause and Replay control them exactly. */
import * as THREE from './three.module.min.js';

const C = window.CREATE;
const canvas = document.getElementById('fx');

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}
if (C && canvas && webglOK()) start();

function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10); // y grows downward, like the DOM
  let W = 1, H = 1;

  const STREAMS = 6;            // 5 opening streams + 1 recurring pulse
  const PER_STREAM = 380, PER_BURST = 60, ORIGIN_N = 60, DUST_N = 170;
  const TOTAL = STREAMS * PER_STREAM + STREAMS * PER_BURST + ORIGIN_N + DUST_N;

  const pos = new Float32Array(TOTAL * 3), col = new Float32Array(TOTAL * 3);
  const size = new Float32Array(TOTAL), alpha = new Float32Array(TOTAL);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uDpr: { value: 1 } },
    vertexShader: `attribute float size; attribute float alpha; attribute vec3 color;
      varying float vA; varying vec3 vC; uniform float uDpr;
      void main(){ vA = alpha; vC = color; gl_PointSize = size * uDpr; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying float vA; varying vec3 vC;
      void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.0, d); float a = pow(core, 1.7) * vA;
        gl_FragColor = vec4(vC * (0.75 + core * 0.6), a); }`,
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  const rnd = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const seeds = new Float32Array(TOTAL * 4);
  for (let i = 0; i < TOTAL * 4; i++) seeds[i] = rnd(i + 1);

  const BRONZE = [0.80, 0.45, 0.18], GOLD = [0.98, 0.78, 0.43], IVORY = [1.0, 0.95, 0.82];
  function grad(s, out, o) {
    let a, b, f;
    if (s < 0.45) { a = BRONZE; b = GOLD; f = s / 0.45; } else { a = GOLD; b = IVORY; f = (s - 0.45) / 0.55; }
    out[o] = a[0] + (b[0] - a[0]) * f; out[o + 1] = a[1] + (b[1] - a[1]) * f; out[o + 2] = a[2] + (b[2] - a[2]) * f;
  }
  const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const clamp01 = (x) => x < 0 ? 0 : x > 1 ? 1 : x;
  function bez(p0, p1, p2, p3, s, out) {
    const u = 1 - s, a = u * u * u, b = 3 * u * u * s, c = 3 * u * s * s, d = s * s * s;
    out.x = a * p0.x + b * p1.x + c * p2.x + d * p3.x;
    out.y = a * p0.y + b * p1.y + c * p2.y + d * p3.y;
    const da = -3 * u * u, db = 3 * u * u - 6 * u * s, dc = 6 * u * s - 3 * s * s, dd = 3 * s * s;
    out.tx = da * p0.x + db * p1.x + dc * p2.x + dd * p3.x;
    out.ty = da * p0.y + db * p1.y + dc * p2.y + dd * p3.y;
  }

  // Streams travel around the golden ring: they rise from the bottom of the portrait and
  // orbit the frame (never crossing the face) until they reach each gift.
  let origin = { x: 0, y: 0 }, center = { x: 0, y: 0 }, R0 = 1, onScreen = true;
  const targets = [], tAng = [], tRad = [];
  const DIRS = [1, 1, -1, -1, 1]; // which way round the ring each stream travels
  function layout() {
    const r = C.origin.getBoundingClientRect();
    center = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    R0 = r.width / 2 * 1.04;
    origin = { x: center.x, y: center.y + R0 };
    onScreen = r.bottom > -200 && r.top < H + 200;
    C.tokens.forEach((el, i) => {
      const b = el.getBoundingClientRect();
      const x = b.left + b.width / 2, y = b.top + b.height / 2;
      targets[i] = { x, y };
      tAng[i] = Math.atan2(y - center.y, x - center.x);
      tRad[i] = Math.hypot(x - center.x, y - center.y);
    });
  }
  function arcPoint(i, flip, s, out) {
    const a0 = Math.PI / 2, dir = DIRS[i] * (flip ? -1 : 1);
    let d = tAng[i] - a0;
    while (d <= -Math.PI) d += Math.PI * 2;
    while (d > Math.PI) d -= Math.PI * 2;
    if (Math.sign(d) !== dir && Math.abs(d) > 0.01) d += dir * Math.PI * 2;
    if (Math.abs(d) > Math.PI * 1.25) d -= dir * Math.PI * 2; // keep the trip under ~225 degrees
    const th = a0 + d * s;
    const bulge = Math.sin(Math.PI * s) * R0 * 0.07;
    const rr = R0 + (tRad[i] - R0) * (s * s) + bulge;
    out.x = center.x + Math.cos(th) * rr;
    out.y = center.y + Math.sin(th) * rr;
    const drr = (tRad[i] - R0) * 2 * s + Math.cos(Math.PI * s) * Math.PI * R0 * 0.07;
    out.tx = -Math.sin(th) * d * rr + Math.cos(th) * drr;
    out.ty = Math.cos(th) * d * rr + Math.sin(th) * drr;
  }

  function resize() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
    renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
    mat.uniforms.uDpr.value = dpr;
    camera.left = 0; camera.right = W; camera.top = 0; camera.bottom = H; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const tmp = { x: 0, y: 0, tx: 0, ty: 0 };
  let wall = 0, last = performance.now();

  // Draw one stream: launch time L, target i. Returns next particle index.
  function drawStream(p, t, L, travel, i, flip) {
    const raw = (t - L) / travel;
    const active = onScreen && targets[i] && raw >= 0 && raw < 1.65;
    const head = raw <= 1 ? ease(clamp01(raw)) : raw;
    for (let k = 0; k < PER_STREAM; k++, p++) {
      if (!active) { alpha[p] = 0; continue; }
      const sd = p * 4, u = Math.pow(k / PER_STREAM, 1.35), s = head - u * 0.6;
      if (s < 0 || s > 1) { alpha[p] = 0; continue; }
      arcPoint(i, flip, s, tmp);
      const tl = Math.hypot(tmp.tx, tmp.ty) || 1, nx = -tmp.ty / tl, ny = tmp.tx / tl;
      const stray = seeds[sd] > 0.86 ? 3.2 : 1;
      const amp = (3 + seeds[sd + 1] * 9) * stray * Math.sin(Math.PI * Math.min(1, s * 1.15));
      const wob = Math.sin(s * 14 + seeds[sd + 2] * 6.28 + t * 4) * amp;
      pos[p * 3] = tmp.x + nx * wob; pos[p * 3 + 1] = tmp.y + ny * wob; pos[p * 3 + 2] = 0;
      const headGlow = k < 6 && raw < 1, halo = k % 5 === 2;
      grad(headGlow ? 0.7 : Math.min(1, s * 1.1 + (1 - u) * 0.25), col, p * 3);
      size[p] = headGlow ? 14 + seeds[sd + 3] * 10 : halo ? 14 + seeds[sd + 3] * 10 : (2.4 + seeds[sd + 3] * 4.2) * (stray > 1 ? 0.7 : 1) * (1.2 - u * 0.55);
      const flick = 0.78 + 0.22 * Math.sin(t * 18 + seeds[sd] * 50);
      alpha[p] = (headGlow ? 0.5 : halo ? 0.2 * (1 - u) : Math.pow(1 - u, 0.9)) * flick;
    }
    return p;
  }
  function drawBurst(p, t, A, i) {
    const q = (t - A) / 1.3, on = onScreen && q >= 0 && q <= 1 && targets[i];
    for (let j = 0; j < PER_BURST; j++, p++) {
      if (!on) { alpha[p] = 0; continue; }
      const sd = p * 4, ang = seeds[sd] * Math.PI * 2, sp = 26 + seeds[sd + 1] * 64, e = 1 - Math.pow(1 - q, 3);
      pos[p * 3] = targets[i].x + Math.cos(ang) * sp * e;
      pos[p * 3 + 1] = targets[i].y + Math.sin(ang) * sp * e + q * q * 16;
      grad(0.7 + seeds[sd + 2] * 0.3, col, p * 3);
      size[p] = 2 + seeds[sd + 3] * 4;
      alpha[p] = Math.pow(1 - q, 1.6);
    }
    return p;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (C.isReduced()) { renderer.clear(); return; }
    if (C.playing()) wall += dt;
    layout();
    const t = C.time(), S = C.STREAM;
    let p = 0;

    // Opening: five streams, one per gift
    for (let i = 0; i < 5; i++) p = drawStream(p, t, S.first + i * S.gap, S.travel, i, false);
    // Recurring pulse: every few seconds, a single stream visits the next gift
    const n = Math.floor((t - S.pulseStart) / S.pulseEvery);
    const pi = n >= 0 ? n % 5 : 0, PL = S.pulseStart + Math.max(0, n) * S.pulseEvery;
    p = drawStream(p, n >= 0 ? t : -1, PL, S.travel * 1.1, pi, true);
    // Bursts
    for (let i = 0; i < 5; i++) p = drawBurst(p, t, C.ARRIVE[i], i);
    p = drawBurst(p, n >= 0 ? t : -9, PL + S.travel * 1.1, pi);

    // Glow at the source (the portrait)
    const gOn = onScreen && t < C.ARRIVE[4] + 0.9;
    const gI = gOn ? Math.min(1, t / 0.8) * (t > C.ARRIVE[4] ? 1 - (t - C.ARRIVE[4]) / 0.9 : 1) : 0;
    for (let j = 0; j < ORIGIN_N; j++, p++) {
      if (!gOn) { alpha[p] = 0; continue; }
      const sd = p * 4, ph = (wall * (0.35 + seeds[sd] * 0.5) + seeds[sd + 1]) % 1;
      const ang = seeds[sd + 2] * 6.28 + wall * 0.8, rad = 6 + ph * (30 + seeds[sd + 3] * 30);
      pos[p * 3] = origin.x + Math.cos(ang) * rad;
      pos[p * 3 + 1] = origin.y + Math.sin(ang) * rad * 0.6 - ph * 30;
      grad(0.3 + ph * 0.7, col, p * 3);
      size[p] = j < 3 ? 50 : 2 + seeds[sd + 3] * 4;
      alpha[p] = (j < 3 ? 0.16 : (1 - ph) * 0.85) * gI;
    }

    // Ambient gold dust across the whole page
    for (let j = 0; j < DUST_N; j++, p++) {
      const sd = p * 4;
      pos[p * 3] = seeds[sd] * W + Math.sin(wall * 0.4 + seeds[sd + 3] * 6) * 14;
      pos[p * 3 + 1] = ((seeds[sd + 1] * H - wall * (6 + seeds[sd + 2] * 14)) % H + H) % H;
      grad(0.6 + seeds[sd + 2] * 0.4, col, p * 3);
      size[p] = 1.2 + seeds[sd + 3] * 2.4;
      alpha[p] = (0.1 + 0.3 * (0.5 + 0.5 * Math.sin(wall * (0.8 + seeds[sd] * 2) + seeds[sd + 2] * 20))) * 0.8;
    }

    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    geo.attributes.size.needsUpdate = true; geo.attributes.alpha.needsUpdate = true;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  C.fxReady = true;
}
