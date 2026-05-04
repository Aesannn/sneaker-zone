import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let scene, camera, bgRenderer, fgRenderer;
let shoeGroup = new THREE.Group();
let bgScene, bgCamera;
let shoeModel;
let composer;
export let currentTheme = 'devil';

let auraLight, rimLight;

let customMaterials = {};

// Universe
let stars, comets = [];

// Mouse tracking
let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

const bgClearColor = new THREE.Color(0x0d0010);

export function initScene() {
  // BG RENDERER
  const bgCanvas = document.getElementById('bg-canvas');
  bgRenderer = new THREE.WebGLRenderer({ canvas: bgCanvas, antialias: true, alpha: false });
  bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  bgRenderer.setSize(window.innerWidth, window.innerHeight);
  bgRenderer.setClearColor(bgClearColor, 1);

  bgScene = new THREE.Scene();
  bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  bgCamera.position.z = 30;

  initUniverse();

  // FG RENDERER
  const container = document.getElementById('canvas-container');
  fgRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  fgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  fgRenderer.setSize(window.innerWidth, window.innerHeight);
  fgRenderer.setClearColor(0x000000, 0);
  fgRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  fgRenderer.toneMappingExposure = 1.2;
  fgRenderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(fgRenderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 20;

  const pmremGenerator = new THREE.PMREMGenerator(fgRenderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(shoeGroup);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  auraLight = new THREE.PointLight(0x6600ff, 60, 50);
  auraLight.position.set(0, 0, -4);
  scene.add(auraLight);

  rimLight = new THREE.PointLight(0x9900ff, 30, 30);
  rimLight.position.set(-6, 4, 2);
  scene.add(rimLight);

  // Postprocessing
  const renderScene = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.2, 0.5, 0.6
  );
  composer = new EffectComposer(fgRenderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  document.addEventListener('mousemove', e => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  window.addEventListener('resize', onWindowResize);

  loadShoeModel();
  animate();
}

// ─── UNIVERSE ──────────────────────────────────────────────────────────────

function initUniverse() {
  // Stars
  const starGeo = new THREE.BufferGeometry();
  const starCount = 4000;
  const starPos = new Float32Array(starCount * 3);
  const starSizes = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 600;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 600;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 1200 - 100;
    starSizes[i] = Math.random() * 1.5 + 0.3;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

  const starMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.9,
    transparent: true,
    opacity: 1.0,
    sizeAttenuation: true,
  });
  stars = new THREE.Points(starGeo, starMat);
  bgScene.add(stars);

  // Comets — long streaks using thin capsule shapes
  for (let i = 0; i < 5; i++) {
    const cometGrp = new THREE.Group();

    // Head (bright sphere)
    const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xaaeeff, transparent: true, opacity: 0.9 });
    const head = new THREE.Mesh(headGeo, headMat);
    cometGrp.add(head);

    // Tail (elongated cone)
    const tailGeo = new THREE.ConeGeometry(0.12, 18, 6);
    tailGeo.rotateX(Math.PI / 2);
    tailGeo.translate(0, 0, 9);
    const tailMat = new THREE.MeshBasicMaterial({ color: 0x66ddff, transparent: true, opacity: 0.6 });
    const tail = new THREE.Mesh(tailGeo, tailMat);
    cometGrp.add(tail);

    resetComet(cometGrp);
    bgScene.add(cometGrp);
    comets.push(cometGrp);
  }
}

function resetComet(cometGrp) {
  cometGrp.position.set(
    (Math.random() - 0.5) * 300,
    (Math.random() - 0.5) * 200,
    -800 - Math.random() * 400
  );
  // Random diagonal angle
  cometGrp.rotation.z = (Math.random() - 0.5) * 0.6;
  cometGrp.rotation.y = (Math.random() - 0.5) * 0.3;
  cometGrp.userData.speed = Math.random() * 8 + 5;
}

// ─── SHOE MODEL ────────────────────────────────────────────────────────────

function loadShoeModel() {
  const loader = new GLTFLoader();
  const url = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/MaterialsVariantsShoe/glTF/MaterialsVariantsShoe.gltf';

  loader.load(url, (gltf) => {
    const isMobile = window.innerWidth <= 768;
    shoeModel = gltf.scene;
    shoeModel.scale.setScalar(isMobile ? 35 : 45);
    shoeModel.position.set(0, -3, 0);
    shoeModel.rotation.set(0.1, -Math.PI / 3, 0.1);

    customMaterials.devil = new THREE.MeshPhysicalMaterial({
      color: 0x050011,
      metalness: 0.95,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      emissive: new THREE.Color(0x220055),
      emissiveIntensity: 0.6,
      iridescence: 0.5,
      iridescenceIOR: 1.5,
    });

    customMaterials.phantom = new THREE.MeshPhysicalMaterial({
      color: 0x002211, // Emerald Green base
      metalness: 0.95,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      emissive: new THREE.Color(0x00ffaa),
      emissiveIntensity: 0.05,
      iridescence: 0.4,
      iridescenceIOR: 1.6,
    });

    customMaterials.bloodmary = new THREE.MeshPhysicalMaterial({
      color: 0x660000,
      metalness: 0.95,
      roughness: 0.02,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      emissive: new THREE.Color(0xff0000),
      emissiveIntensity: 0.1,
      iridescence: 0.3,
      iridescenceIOR: 1.5,
      transmission: 0.05,
    });

    applyTheme('devil');
    shoeGroup.add(shoeModel);
    setupScrollAnimations();

    // Entrance animation
    gsap.from(shoeModel.position, { y: -30, duration: 2.5, ease: 'power4.out' });
    gsap.from(shoeModel.rotation, { x: Math.PI * 2, duration: 3.0, ease: 'power3.out' });
  });
}

export function applyTheme(variant) {
  if (!shoeModel) return;
  currentTheme = variant;

  const mat = customMaterials[variant];
  shoeModel.traverse((child) => {
    if (child.isMesh) {
      child.material = mat;
      child.material.needsUpdate = true;
    }
  });

  if (variant === 'devil') {
    auraLight.userData.baseIntensity = 60;
    gsap.to(bgClearColor, { r: 35 / 255, g: 0, b: 60 / 255, duration: 0.7 });
    gsap.to(auraLight.color, { r: 102 / 255, g: 0, b: 255 / 255, duration: 0.7 });
    gsap.to(auraLight, { intensity: 60, duration: 0.7 });
    gsap.to(rimLight.color, { r: 153 / 255, g: 0, b: 255 / 255, duration: 0.7 });
    gsap.to(rimLight, { intensity: 30, duration: 0.7 });
  } else if (variant === 'phantom') {
    auraLight.userData.baseIntensity = 10;
    gsap.to(bgClearColor, { r: 0, g: 20 / 255, b: 15 / 255, duration: 0.7 });
    gsap.to(auraLight.color, { r: 0, g: 255 / 255, b: 170 / 255, duration: 0.7 });
    gsap.to(auraLight, { intensity: 10, duration: 0.7 });
    gsap.to(rimLight.color, { r: 0, g: 200 / 255, b: 120 / 255, duration: 0.7 });
    gsap.to(rimLight, { intensity: 6, duration: 0.7 });
  } else if (variant === 'bloodmary') {
    auraLight.userData.baseIntensity = 20;
    gsap.to(bgClearColor, { r: 35 / 255, g: 0, b: 0, duration: 0.7 });
    gsap.to(auraLight.color, { r: 255 / 255, g: 0, b: 20 / 255, duration: 0.7 });
    gsap.to(auraLight, { intensity: 20, duration: 0.7 });
    gsap.to(rimLight.color, { r: 200 / 255, g: 10 / 255, b: 0, duration: 0.7 });
    gsap.to(rimLight, { intensity: 10, duration: 0.7 });
  }

  // Update hero text label
  updateHeroLabel(variant);
}

function updateHeroLabel(variant) {
  const labels = {
    devil: { sub: 'S/S 2025 — Devil\'s Covenant', line1: 'DEFY', line2: 'THE', line3: 'VOID' },
    phantom: { sub: 'S/S 2025 — Phantom Gaze', line1: 'PIERCE', line2: 'THE', line3: 'GLOOM' },
    bloodmary: { sub: 'S/S 2025 — Crimson Requiem', line1: 'BLEED', line2: 'THE', line3: 'DARK' },
  };
  const d = labels[variant];
  const subEl = document.querySelector('.hero-sub');
  const spans = document.querySelectorAll('.hero-title span');
  if (subEl) subEl.textContent = d.sub;
  if (spans[0]) spans[0].textContent = d.line1;
  if (spans[1]) spans[1].textContent = d.line2;
  if (spans[2]) spans[2].textContent = d.line3;
}

// ─── SCROLL ANIMATIONS ─────────────────────────────────────────────────────

function setupScrollAnimations() {

  const isMobile = window.innerWidth <= 768;
  const targetX = isMobile ? 0 : -8.5;
  const targetY = isMobile ? 2.5 : 0.8;
  const targetScale = isMobile ? 0.65 : 0.9;

  // Phase 1: Hero to Featured
  const tlHeroToFeatured = gsap.timeline({
    scrollTrigger: {
      trigger: '.featured',
      start: 'top bottom',
      end: 'top 20%',
      scrub: 0.1,
      invalidateOnRefresh: true,
      onLeaveBack: () => {
        gsap.set(shoeGroup.position, { x: 0, y: 0, z: 0 });
        gsap.set(shoeGroup.scale, { x: 1, y: 1, z: 1 });
        gsap.set(shoeGroup.rotation, { x: 0, y: 0, z: 0 });
      }
    },
  });

  tlHeroToFeatured.to(bgClearColor, { r: 0.005, g: 0, b: 0.01, duration: 1 }, 0);

  tlHeroToFeatured.fromTo(shoeGroup.position,
    { x: 0, y: 0, z: 0 },
    { x: targetX, y: targetY, z: 0, ease: 'none' }, 0
  );
  tlHeroToFeatured.fromTo(shoeGroup.rotation,
    { x: 0, y: 0, z: 0 },
    { x: Math.PI * 2 + 0.1, y: 0.3, z: -0.1, ease: 'none' }, 0
  );
  tlHeroToFeatured.fromTo(shoeGroup.scale,
    { x: 1, y: 1, z: 1 },
    { x: targetScale, y: targetScale, z: targetScale, ease: 'none' }, 0
  );

  // Phase 2: Disappear before Collection
  const tlFeaturedToCollection = gsap.timeline({
    scrollTrigger: {
      trigger: '.collection',
      start: 'top bottom',
      end: 'top 20%',
      scrub: 0.5,
      invalidateOnRefresh: true
    },
  });

  tlFeaturedToCollection.to(shoeGroup.position, { y: 15, ease: 'none' }, 0);
  tlFeaturedToCollection.to(shoeGroup.scale, { x: 0.1, y: 0.1, z: 0.1, ease: 'none' }, 0);
}

// ─── RESIZE ────────────────────────────────────────────────────────────────

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  if (bgCamera) {
    bgCamera.aspect = window.innerWidth / window.innerHeight;
    bgCamera.updateProjectionMatrix();
  }

  if (bgRenderer) bgRenderer.setSize(window.innerWidth, window.innerHeight);
  if (fgRenderer) fgRenderer.setSize(window.innerWidth, window.innerHeight);
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}

// ─── ANIMATE LOOP ─────────────────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);
  const t = performance.now() * 0.001;
  const scrollV = window.scrollVelocity || 0;

  // Smooth mouse lerp
  currentX += (targetX - currentX) * 0.05;
  currentY += (targetY - currentY) * 0.05;

  // Background camera parallax
  bgCamera.position.x += (currentX * 6 - bgCamera.position.x) * 0.05;
  bgCamera.position.y += (-currentY * 4 - bgCamera.position.y) * 0.05;

  // ── WARP STARS ──
  if (stars) {
    const pos = stars.geometry.attributes.position.array;
    const warpSpeed = 1.0 + Math.abs(scrollV) * 0.5;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] += warpSpeed;
      if (pos[i + 2] > 200) pos[i + 2] = -1200;
    }
    stars.geometry.attributes.position.needsUpdate = true;
    stars.rotation.z = currentX * 0.1;
  }

  // ── COMETS ──
  comets.forEach((comet) => {
    const speed = comet.userData.speed + Math.abs(scrollV) * 2.5;
    comet.position.z += speed;
    if (comet.position.z > 100) resetComet(comet);
  });

  // ── SHOE FLOAT + MOUSE ──
  if (shoeModel) {
    shoeModel.position.y += Math.sin(t * 1.5) * 0.003;
    shoeGroup.rotation.x += (currentY * 0.25 - shoeGroup.rotation.x) * 0.05;
    shoeGroup.rotation.y += (currentX * 0.5 - shoeGroup.rotation.y) * 0.05;
  }

  // ── AURA PULSE ──
  const pulse = 1 + Math.sin(t * 2.5) * 0.15;
  auraLight.intensity = auraLight.intensity * 0.97 + (auraLight.userData.baseIntensity || 60) * pulse * 0.03;

  bgRenderer.render(bgScene, bgCamera);
  composer.render();
}
