import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initScene, applyTheme } from './scene.js';

gsap.registerPlugin(ScrollTrigger);

// Make ScrollTrigger available to scene.js
window.__gsapST = { ScrollTrigger };

// ─── LENIS SMOOTH SCROLL ──────────────────────────────────────────────────

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

window.scrollVelocity = 0;
lenis.on('scroll', (e) => {
  ScrollTrigger.update();
  window.scrollVelocity = e.velocity;
});

gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0, 0);

// ─── CURSOR ───────────────────────────────────────────────────────────────

const cursor = document.getElementById('cursor');

document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
});

// ─── HERO TEXT ENTRANCE ───────────────────────────────────────────────────

gsap.from('.hero-title span', {
  y: 100, opacity: 0, duration: 1.5,
  stagger: 0.2, ease: 'power4.out', delay: 0.5
});
gsap.from('.hero-sub', {
  y: 30, opacity: 0, duration: 1.0, ease: 'power3.out', delay: 0.3
});
gsap.from('.hero-desc, .hero-cta', {
  y: 50, opacity: 0, duration: 1,
  stagger: 0.2, ease: 'power3.out', delay: 1.5
});
gsap.from('.carousel-btn', {
  opacity: 0, duration: 1.2, delay: 0.5, stagger: 0.15, ease: 'power2.out'
});
gsap.from('.slide-indicators', {
  opacity: 0, y: 20, duration: 1, delay: 2, ease: 'power2.out'
});

// ─── SLIDE INDICATOR DOTS ─────────────────────────────────────────────────

function updateIndicators(index) {
  document.querySelectorAll('.slide-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

// ─── CAROUSEL / THEME LOGIC ───────────────────────────────────────────────

const themes = ['devil', 'phantom', 'bloodmary'];
const themeNames = ['DEVIL\'S COVENANT', 'PHANTOM GAZE', 'CRIMSON REQUIEM'];
let currentThemeIndex = 0;

const variantsInfo = {
  'devil': {
    sub: 'Pro — Midnight Void',
    desc: 'Engineered in zero-gravity test chambers. The Orbit Runner PRO redefines what it means to float. Ultra-responsive foam core with anti-gravity rebound technology.'
  },
  'phantom': {
    sub: 'Pro — Phantom Gaze',
    desc: 'Shift into the shadows with hyper-stealth mesh. Designed for night-ops and low-light urban tactical movement. Experience precision in every step.'
  },
  'bloodmary': {
    sub: 'Pro — Crimson Requiem',
    desc: 'For the main characters and night-stalkers. Stealth-mode aesthetics paired with hyper-kinetic propulsion. No cap, this is pure speed.'
  }
};

function switchTheme(index) {
  currentThemeIndex = ((index % themes.length) + themes.length) % themes.length;
  const theme = themes[currentThemeIndex];
  applyTheme(theme);
  updateActiveVariantBtn();
  updateIndicators(currentThemeIndex);
  animateCarouselTransition();

  // Update product info in Featured section
  const subEl = document.querySelector('.product-sub');
  const descEl = document.querySelector('.product-desc');
  if (subEl && descEl) {
    gsap.to([subEl, descEl], {
      opacity: 0, y: 10, duration: 0.2, onComplete: () => {
        subEl.textContent = variantsInfo[theme].sub;
        descEl.textContent = variantsInfo[theme].desc;
        gsap.to([subEl, descEl], { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      }
    });
  }

  // Update vertical label
  const label = document.getElementById('themeLabel');
  if (label) {
    gsap.to(label, {
      opacity: 0, duration: 0.2, onComplete: () => {
        label.textContent = themeNames[currentThemeIndex];
        gsap.to(label, { opacity: 1, duration: 0.4 });
      }
    });
  }
}

function animateCarouselTransition() {
  // Flash the hero text on theme change
  gsap.to('.hero-title span', {
    y: -20, opacity: 0, duration: 0.2, stagger: 0.05,
    onComplete: () => {
      gsap.to('.hero-title span', {
        y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power3.out'
      });
    }
  });
  gsap.to('.hero-sub', {
    opacity: 0, duration: 0.2,
    onComplete: () => gsap.to('.hero-sub', { opacity: 1, duration: 0.4 })
  });
}

window.nextTheme = function () { switchTheme(currentThemeIndex + 1); };
window.prevTheme = function () { switchTheme(currentThemeIndex - 1); };
window.goToTheme = function (i) { switchTheme(i); };

// Keyboard arrow support
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') window.nextTheme();
  if (e.key === 'ArrowLeft') window.prevTheme();
});

function updateActiveVariantBtn() {
  const current = themes[currentThemeIndex];
  document.querySelectorAll('#material-variants .size-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-variant') === current) btn.classList.add('active');
  });
}

document.querySelectorAll('#material-variants .size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const variant = btn.getAttribute('data-variant');
    switchTheme(themes.indexOf(variant));
  });
});

// ─── CART LOGIC ───────────────────────────────────────────────────────────

let cart = [];

window.toggleCart = function () {
  const sidebar = document.getElementById('cart-sidebar');
  const overlay = document.getElementById('cart-overlay');
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');

  if (sidebar.classList.contains('active')) {
    lenis.stop(); // Disable main scroll
    renderCart();
  } else {
    lenis.start(); // Enable main scroll
  }
};

window.addToCart = function (btn) {
  // Prevent adding if a modal is already open
  if (document.getElementById('size-picker-modal').classList.contains('active')) return;
  
  let product = {};

  const featuredInfo = btn.closest('.featured-info');
  if (featuredInfo) {
    const sizeContainer = document.querySelectorAll('.sizes')[1];
    const activeSizeBtn = sizeContainer ? sizeContainer.querySelector('.size-btn.active') : null;
    const selectedSize = activeSizeBtn ? activeSizeBtn.textContent : '8';

    const activeMaterialBtn = document.querySelector('#material-variants .size-btn.active');
    const materialCode = activeMaterialBtn ? activeMaterialBtn.textContent : 'DVL';

    product = {
      id: 'orbit-runner-' + themes[currentThemeIndex] + '-' + selectedSize + '-' + Date.now(),
      name: 'ORBIT RUNNER',
      variant: variantsInfo[themes[currentThemeIndex]].sub,
      material: materialCode,
      size: selectedSize,
      price: 289,
      img: 'featured',
      imgSrc: '/assets/New Drops/Aegis Prime.png' // Fallback for featured 3D
    };

    
    cart.push(product);
    finalizeAddToCart(btn);
  } else {
    const card = btn.closest('.product-card');
    const img = card.querySelector('img');
    
    product = {
      id: 'glide-' + Math.random().toString(36).substr(2, 5),
      name: card.querySelector('.card-name').textContent,
      variant: card.querySelector('.card-variant').textContent,
      material: '',
      price: parseInt(card.querySelector('.card-price').textContent.replace('$', '')),
      img: 'card',
      imgSrc: img.src
    };
    
    window.openSizePicker(product, btn);
  }
};

function finalizeAddToCart(btn) {
  // Update button state if it's a card button
  if (btn && btn.classList.contains('card-quick-add')) {
    const orig = btn.innerHTML;
    btn.textContent = 'ADDED ✓';
    btn.style.background = 'var(--cyan)';
    btn.style.color = 'var(--void)';
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  }

  // Update cart badge
  const countBadge = document.querySelector('.nav-cart .count');
  if (countBadge) {
    countBadge.textContent = cart.length;
    countBadge.style.display = cart.length > 0 ? 'flex' : 'none';
  }

  // If it's a direct add (Featured section), show animation immediately
  // For modals, it's triggered after close in closeSizePicker
  if (btn && btn.closest('.featured-info')) {
    window.showPlusOneAtBag();
  }

  if (document.getElementById('cart-sidebar').classList.contains('active')) {
    renderCart();
  }
}

window.showPlusOneAtBag = function() {
  const cartIcon = document.querySelector('.nav-cart');
  if (!cartIcon) return;
  
  const cartRect = cartIcon.getBoundingClientRect();
  const plusOne = document.createElement('div');
  plusOne.className = 'floating-plus-one';
  plusOne.textContent = '+1';
  
  // Position it BELOW the Bag button to float UP into it
  plusOne.style.position = 'fixed';
  plusOne.style.left = (cartRect.left + cartRect.width / 2) + 'px';
  plusOne.style.top = (cartRect.bottom + 10) + 'px';
  plusOne.style.transform = 'translateX(-50%)';
  document.body.appendChild(plusOne);

  gsap.fromTo(plusOne, 
    { y: 20, opacity: 0, scale: 0.5 },
    { 
      y: -30, 
      opacity: 1, 
      scale: 1.2, 
      duration: 0.6, 
      ease: 'power2.out',
      onComplete: () => {
        gsap.to(plusOne, {
          y: -50,
          opacity: 0,
          duration: 0.4,
          delay: 0.2,
          onComplete: () => plusOne.remove()
        });
      }
    }
  );

  gsap.to(cartIcon, { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1 });
};

// --- SIZE PICKER LOGIC ---
let isSizePickerOpen = false;
let wasItemAdded = false;
let pendingProduct = null;
let pendingBtn = null;

window.openSizePicker = function(product, btn) {
  if (isSizePickerOpen) return;
  isSizePickerOpen = true;
  wasItemAdded = false;
  
  pendingProduct = product;
  pendingBtn = btn;
  
  const modal = document.getElementById('size-picker-modal');
  const overlay = document.getElementById('size-picker-overlay');
  
  document.getElementById('modal-product-name').textContent = product.name;
  document.getElementById('modal-product-variant').textContent = product.variant;
  document.querySelectorAll('#modal-size-grid .size-btn').forEach(b => b.classList.remove('active'));
  
  modal.classList.add('active');
  overlay.classList.add('active');
  
  gsap.killTweensOf([modal, overlay]);
  
  gsap.fromTo(modal, 
    { opacity: 0, scale: 0.8, xPercent: -50, yPercent: -50, y: 50, z: -200 },
    { opacity: 1, scale: 1, xPercent: -50, yPercent: -50, y: 0, z: 0, duration: 0.6, ease: "power3.out" }
  );

  lenis.stop();
};

window.closeSizePicker = function() {
  if (!isSizePickerOpen) return;
  
  const modal = document.getElementById('size-picker-modal');
  const overlay = document.getElementById('size-picker-overlay');
  
  gsap.killTweensOf([modal, overlay]);

  // Use GSAP to animate out
  gsap.to(modal, {
    opacity: 0,
    scale: 0.5,
    xPercent: -50,
    yPercent: -50,
    y: 20,
    duration: 0.4,
    ease: "power2.in",
    onComplete: () => {
      modal.classList.remove('active');
      overlay.classList.remove('active');
      gsap.set(modal, { clearProps: "all" });
      lenis.start();
      
      if (wasItemAdded) {
        window.showPlusOneAtBag();
      }
      
      // Reset state ONLY after animation completes fully
      isSizePickerOpen = false;
      wasItemAdded = false;
      pendingProduct = null;
      pendingBtn = null;
    }
  });

  gsap.to(overlay, {
    opacity: 0,
    duration: 0.3,
    onComplete: () => {
      overlay.classList.remove('active');
      gsap.set(overlay, { clearProps: "all" });
    }
  });
};

window.selectModalSize = function(btn) {
  const size = btn.textContent;
  
  // Highlight selected
  document.querySelectorAll('#modal-size-grid .size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  
  if (pendingProduct) {
    const finalProduct = {
      ...pendingProduct,
      size: size,
      id: pendingProduct.id + '-' + size + '-' + Date.now()
    };
    
    cart.push(finalProduct);
    wasItemAdded = true; // Mark as added
    finalizeAddToCart(pendingBtn);
    
    setTimeout(() => {
      window.closeSizePicker();
    }, 300);
  }
};

function renderCart() {
  const container = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <p class="empty-msg">GO AND SHOP SOMETHING COOL</p>
      </div>
    `;
    subtotalEl.textContent = '$0.00';
    return;
  }

  let html = '';
  let total = 0;

  cart.forEach((item, index) => {
    total += item.price;
    html += `
      <div class="cart-item">
        <div class="cart-item-img">
          ${item.imgSrc ? `<img src="${item.imgSrc}" alt="${item.name}">` : `
          <svg viewBox="0 0 100 60" fill="none">
            <path d="M10 45 Q20 52 50 52 Q80 52 90 45 L85 35 Q70 42 50 42 Q30 42 15 35Z" fill="${item.img === 'featured' ? 'var(--orange)' : 'var(--cyan)'}" opacity="0.3"/>
            <path d="M20 40 Q15 25 30 15 Q50 10 70 15 Q85 25 80 40" stroke="${item.img === 'featured' ? 'var(--orange)' : 'var(--cyan)'}" stroke-width="2" fill="none"/>
          </svg>`}
        </div>

        <div class="cart-item-info">
          <h3 class="cart-item-name">${item.name}</h3>
          <p class="cart-item-variant">${item.variant}</p>
          <p class="cart-item-details">
            ${item.material ? `<span>VARIANT: ${item.material}</span>` : ''}
            <span>SIZE: ${item.size}</span>
          </p>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="cart-item-price">$${item.price}</span>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">Remove</button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  subtotalEl.textContent = `$${total.toFixed(2)}`;
}

window.removeFromCart = function (index) {
  cart.splice(index, 1);
  const countBadge = document.querySelector('.nav-cart .count');
  countBadge.textContent = cart.length;
  countBadge.style.display = cart.length > 0 ? 'flex' : 'none';
  renderCart();
};

// ─── UI INTERACTIONS ──────────────────────────────────────────────────────

window.selectSize = function (btn) {
  const container = btn.closest('.sizes');
  if (container) {
    container.querySelectorAll('.size-btn:not(.sold-out)').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }
};

window.handleSubscribe = function () {
  const inp = document.getElementById('emailInput');
  if (inp.value && inp.value.includes('@')) {
    inp.value = 'You\'re in the void 🚀';
    inp.style.borderColor = 'var(--cyan)';
    inp.style.color = 'var(--cyan)';
  } else {
    inp.style.borderColor = 'var(--orange)';
    inp.placeholder = 'Valid email required';
  }
};

document.querySelectorAll('.btn-wish').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.textContent = btn.textContent === '♡' ? '♥' : '♡';
    btn.style.color = btn.textContent === '♥' ? 'var(--orange)' : '';
    btn.style.borderColor = btn.textContent === '♥' ? 'var(--orange)' : '';
  });
});

// ─── PERSISTENT UI CONTROLS ────────────────────────────────────────────────
const carouselBtn = document.querySelector('.carousel-btn.next');
if (carouselBtn) {
  ScrollTrigger.create({
    trigger: '.collection',
    start: 'top bottom',
    onEnter: () => gsap.to(carouselBtn, { opacity: 0, pointerEvents: 'none', duration: 0.3 }),
    onLeaveBack: () => gsap.to(carouselBtn, { opacity: 1, pointerEvents: 'auto', duration: 0.3 })
  });
}

// ─── NEW DROPS REVEAL ─────────────────────────────────────────────────────

function initProductCards() {
  const cards = document.querySelectorAll('.product-card');
  if (!cards.length) return;

  cards.forEach(card => {
    const overlay = card.querySelector('.card-scan-overlay');
    const line = card.querySelector('.scan-line-active');
    const wireframe = card.querySelector('.card-wireframe');
    const img = card.querySelector('img');
    
    if (overlay && line) {
      gsap.set(overlay, { scaleY: 1 });
      gsap.set(line, { opacity: 0, bottom: 0 });
    }

    if (wireframe && img) {
      wireframe.style.backgroundImage = `url(${img.src})`;
    }

    card.addEventListener('mouseenter', () => {
      if (line) {
        gsap.fromTo(line, 
          { opacity: 1, bottom: '0%' },
          { bottom: '100%', opacity: 0, duration: 1, ease: "power2.inOut" }
        );
      }
    });
  });
  
  ScrollTrigger.batch(cards, {
    onEnter: batch => {
      batch.forEach((card, i) => {
        const overlay = card.querySelector('.card-scan-overlay');
        const line = card.querySelector('.scan-line-active');
        const wireframe = card.querySelector('.card-wireframe');
        
        if (overlay && line && overlay.style.transform !== 'scaleY(0)') {
          const tl = gsap.timeline({ delay: i * 0.1 });
          tl.to(line, { opacity: 1, duration: 0.1 });
          if (wireframe) {
            tl.to(wireframe, { opacity: 0.4, duration: 0.3, ease: "power2.out" }, 0.1);
            tl.to(wireframe, { opacity: 0, duration: 0.7, ease: "power2.in" }, ">");
          }
          tl.to(line, { bottom: '100%', duration: 1, ease: "power2.inOut" }, 0.1);
          tl.to(overlay, { scaleY: 0, duration: 1, ease: "power2.inOut" }, "<");
          tl.to(line, { opacity: 0, duration: 0.2 });
        }
      });
    },
    start: "top 95%",
    once: true
  });
}



// ─── VOID RIFT PARALLAX ───────────────────────────────────────────────────

function initVoidRift() {
  const riftText = document.querySelector('.rift-text');
  if (!riftText) return;

  gsap.to(riftText, {
    letterSpacing: '0.4em',
    scrollTrigger: {
      trigger: '.void-rift-section',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    }
  });
}

// Scroll tracker is now handled by Lenis listener at top

// ─── SIMPLE REVEAL FOR OTHER ITEMS ────────────────────────────────────────

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.phi-card, .stat-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(40px)';
  el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  revealObserver.observe(el);
});


// ─── ELITE INTRO SEQUENCE (IMAGE SCRUB) ───────────────────────────────────


const introCanvas = document.getElementById('intro-canvas');
if (introCanvas) {
  const introCtx = introCanvas.getContext('2d');

  const frameCount = 82;
  const currentFramePath = index => `/assets/Best Sellers/Best Sellers_${index.toString().padStart(3, '0')}.webp`;

  const introImages = [];
  const sequenceState = { frame: 0 };

  for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFramePath(i);
    introImages.push(img);
  }

  function resizeIntroCanvas() {
    introCanvas.width = window.innerWidth;
    introCanvas.height = window.innerHeight;
    renderIntroFrame();
  }

  function renderIntroFrame() {
    const img = introImages[sequenceState.frame];
    if (!img || !img.complete) return;

    const canvasRatio = introCanvas.width / introCanvas.height;
    const imgRatio = img.width / img.height;
    let drawWidth, drawHeight, x, y;

    // Use "contain" logic with scaling and a top offset for the header
    const scale = 1.05;
    const topOffset = 50; // Offset down to clear header

    if (canvasRatio > imgRatio) {
      drawHeight = introCanvas.height * scale;
      drawWidth = drawHeight * imgRatio;
    } else {
      drawWidth = introCanvas.width * scale;
      drawHeight = drawWidth / imgRatio;
    }

    x = (introCanvas.width - drawWidth) / 2;
    y = ((introCanvas.height - drawHeight) / 2) + topOffset;

    introCtx.clearRect(0, 0, introCanvas.width, introCanvas.height);
    introCtx.drawImage(img, x, y, drawWidth, drawHeight);
  }

  window.addEventListener('resize', resizeIntroCanvas);
  resizeIntroCanvas();

  const introTl = gsap.timeline({
    scrollTrigger: {
      trigger: '.best-sellers',
      start: 'top top',
      end: '+=250%',
      pin: true,
      scrub: 1.5,
      anticipatePin: 0
    }
  });

  introTl.to(sequenceState, {
    frame: frameCount - 1,
    snap: 'frame',
    ease: 'none',
    onUpdate: renderIntroFrame
  });

  introTl.to('.intro-text', {
    opacity: 0,
    y: -50,
    duration: 0.5
  }, 0.2);

  introTl.to('.best-sellers-shop', {
    opacity: 1,
    y: 0,
    duration: 1.5,
    ease: 'power2.out',
    onStart: () => {
      // Trigger card reveals if they haven't happened yet
      ScrollTrigger.refresh();
    }
  }, 0.6);

  if (introImages[0]) introImages[0].onload = renderIntroFrame;
}

// ─── X-RAY SIDEBAR ────────────────────────────────────────────────────────

function initXRaySidebar() {
  const sidebar = document.querySelector('.xray-sidebar');
  const canvas = document.getElementById('xray-canvas');
  if (!sidebar || !canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 5;

  const light = new THREE.DirectionalLight(0x00e8c8, 2);
  light.position.set(1, 1, 1);
  scene.add(light);

  // Wireframe Box as proxy for shoe
  const geometry = new THREE.IcosahedronGeometry(2, 2);
  const material = new THREE.MeshBasicMaterial({ 
    color: 0x00e8c8, 
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  function animate() {
    requestAnimationFrame(animate);
    mesh.rotation.y += 0.01;
    mesh.rotation.x += 0.005;
    
    // Pulse wireframe
    const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.1;
    mesh.scale.set(pulse, pulse, pulse);
    
    renderer.render(scene, camera);
  }
  animate();

  ScrollTrigger.create({
    trigger: '#collection',
    start: 'top bottom',
    onEnter: () => sidebar.classList.add('active'),
    onLeaveBack: () => sidebar.classList.remove('active')
  });

  // Update stats on scroll
  window.addEventListener('scroll', () => {
    const mass = (window.scrollY * 0.01).toFixed(1);
    const massVal = document.querySelector('.stat-val');
    if (massVal) massVal.textContent = mass + 'g';
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────

initScene();
updateIndicators(0);

// Initialize new effects
window.addEventListener('load', () => {
  initProductCards();
  initVoidRift();
  initXRaySidebar();
});