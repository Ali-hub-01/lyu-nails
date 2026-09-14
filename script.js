/* ============================================================
   LYU-NAILS - скрипты лэндинга (vanilla JS, без зависимостей)
   ============================================================ */
'use strict';

/* ---------- Мобильный фикс: не восстанавливать позицию скролла ---------- */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('load', () => {
  if (!location.hash) window.scrollTo(0, 0);
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   Прелоадер: звёздная заставка. Скрываем по load,
   фолбэк-таймаут 3 c - страница никогда не «зависнет» под оверлеем.
   ============================================================ */
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) {
    document.body.classList.remove('is-loading');
    return;
  }

  let preloaderHidden = false;
  function hidePreloader() {
    if (preloaderHidden) return;
    preloaderHidden = true;
    preloader.classList.add('is-done');
    document.body.classList.remove('is-loading'); // разблокируем скролл
    const remove = () => { preloader.hidden = true; };
    prefersReducedMotion ? remove() : setTimeout(remove, 700);
  }

  if (prefersReducedMotion) {
    // Минимум движения: без мельтешащих звёзд, скрываем сразу
    hidePreloader();
  } else {
    window.addEventListener('load', () => setTimeout(hidePreloader, 450));
    setTimeout(hidePreloader, 3000); // фолбэк, если load задержался
  }
})();

/* ============================================================
   Шапка: тень при скролле
   ============================================================ */
const header = document.querySelector('.header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ============================================================
   Мобильное меню (бургер)
   ============================================================ */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

function closeMenu() {
  burger.classList.remove('is-open');
  nav.classList.remove('is-open');
  burger.setAttribute('aria-expanded', 'false');
}

burger.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  burger.classList.toggle('is-open', open);
  nav.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
});

/* Закрываем меню при переходе по ссылке */
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) closeMenu();
});

/* ============================================================
   Scroll-reveal через IntersectionObserver
   ============================================================ */
const revealEls = document.querySelectorAll('.reveal');

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => revealObserver.observe(el));
}

/* ============================================================
   Анимированные счётчики (rAF + easing)
   ============================================================ */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1600; // мс
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    // easeOutCubic - быстро в начале, мягко в конце
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased).toLocaleString('ru-RU');
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll('.counter');
if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  counters.forEach((el) => {
    el.textContent = parseInt(el.dataset.target, 10).toLocaleString('ru-RU');
  });
} else {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => counterObserver.observe(el));
}

/* ============================================================
   Лайтбокс: галерея работ + постеры программ курсов
   ============================================================ */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

const galleryItems = Array.from(document.querySelectorAll('.gallery__item'));
let galleryIndex = -1; // -1 = открыт постер программы, стрелки скрыты

function openLightbox(src, caption, index) {
  galleryIndex = typeof index === 'number' ? index : -1;
  lightboxImg.src = src;
  lightboxImg.alt = caption || '';
  lightboxCaption.textContent = caption || '';

  const isGallery = galleryIndex >= 0;
  lightboxPrev.hidden = !isGallery;
  lightboxNext.hidden = !isGallery;

  lightbox.hidden = false;
  requestAnimationFrame(() => lightbox.classList.add('is-open'));
  document.body.style.overflow = 'hidden'; // блокируем прокрутку фона
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('is-open');
  document.body.style.overflow = '';
  const done = () => {
    lightbox.hidden = true;
    lightboxImg.src = '';
  };
  prefersReducedMotion ? done() : setTimeout(done, 300);
}

function showGallery(index) {
  const len = galleryItems.length;
  galleryIndex = (index + len) % len;
  const item = galleryItems[galleryIndex];
  lightboxImg.src = item.dataset.full;
  lightboxImg.alt = item.querySelector('img').alt;
  lightboxCaption.textContent = 'Работа ' + (galleryIndex + 1) + ' из ' + len;
}

/* Открытие из галереи */
galleryItems.forEach((item, i) => {
  item.addEventListener('click', () => {
    openLightbox(item.dataset.full, item.querySelector('img').alt, i);
    lightboxCaption.textContent = 'Работа ' + (i + 1) + ' из ' + galleryItems.length;
  });
});

/* Открытие постера программы курса */
document.querySelectorAll('.course__program').forEach((btn) => {
  btn.addEventListener('click', () => {
    openLightbox(btn.dataset.program, btn.dataset.title);
  });
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => showGallery(galleryIndex - 1));
lightboxNext.addEventListener('click', () => showGallery(galleryIndex + 1));

/* Клик по фону закрывает */
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

/* Клавиатура: Esc / стрелки */
document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (galleryIndex >= 0) {
    if (e.key === 'ArrowLeft') showGallery(galleryIndex - 1);
    if (e.key === 'ArrowRight') showGallery(galleryIndex + 1);
  }
});

/* Свайпы на мобильных */
let touchStartX = 0;
lightbox.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
}, { passive: true });
lightbox.addEventListener('touchend', (e) => {
  if (galleryIndex < 0) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 50) showGallery(galleryIndex + (dx < 0 ? 1 : -1));
}, { passive: true });

/* ============================================================
   Форма записи → WhatsApp с готовым сообщением
   ============================================================ */
const WHATSAPP_PHONE = '77026666135';
const bookingForm = document.getElementById('bookingForm');

/* Валидация одного поля; возвращает true, если поле корректно */
function validateField(input) {
  const errorEl = input.closest('.field').querySelector('.field__error');
  let message = '';

  const value = input.value.trim();
  if (!value) {
    message = 'Пожалуйста, заполните это поле';
  } else if (input.type === 'tel') {
    // Достаточно 10+ цифр - принимаем любые форматы записи
    const digits = value.replace(/\D/g, '');
    if (digits.length < 10) message = 'Укажите номер полностью, например +7 702 000 00 00';
  } else if (input.name === 'name' && value.length < 2) {
    message = 'Имя слишком короткое';
  }

  input.classList.toggle('is-invalid', Boolean(message));
  errorEl.textContent = message;
  return !message;
}

bookingForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const fields = bookingForm.querySelectorAll('.field__input');
  let valid = true;
  fields.forEach((input) => {
    if (!validateField(input)) valid = false;
  });
  if (!valid) return;

  /* Берём поля через elements - свойство form.name занято атрибутом формы */
  const name = bookingForm.elements['name'].value.trim();
  const phone = bookingForm.elements['phone'].value.trim();
  const course = bookingForm.elements['course'].value;

  const text =
    'Здравствуйте! Хочу записаться на курс: ' + course + '\n' +
    'Меня зовут: ' + name + '\n' +
    'Телефон: ' + phone;

  /* Конверсия Google Ads: "Отправка формы для потенциальных клиентов" */
  fireConversion('AW-18415302041/7rV2COjgnfMcEJnrjM1E', 'form');

  window.open(
    'https://wa.me/' + WHATSAPP_PHONE + '?text=' + encodeURIComponent(text),
    '_blank',
    'noopener'
  );
});

/* Сбрасываем ошибку при вводе */
bookingForm.querySelectorAll('.field__input').forEach((input) => {
  input.addEventListener('input', () => {
    input.classList.remove('is-invalid');
    input.closest('.field').querySelector('.field__error').textContent = '';
  });
});

/* ============================================================
   Google Ads: конверсии по действиям (телефон, WhatsApp, Instagram, форма).
   Дедуп (1 раз за сессию) + анти-бот: боты грузят страницу и прокликивают
   ссылки без единого человеческого жеста, такие клики не считаем.
   ============================================================ */
var lyuHumanSeen = false;
['pointermove', 'pointerdown', 'touchstart', 'scroll', 'keydown', 'wheel'].forEach(function (ev) {
  window.addEventListener(ev, function () { lyuHumanSeen = true; }, { once: true, passive: true });
});
function lyuIsBot() { return !!navigator.webdriver || !lyuHumanSeen; }

function fireConversion(sendTo, key) {
  if (typeof gtag !== 'function') return;
  if (lyuIsBot()) return;
  try {
    var k = 'lyu_conv_' + key;
    if (sessionStorage.getItem(k)) return;   // уже отправляли в этой сессии
    sessionStorage.setItem(k, '1');
  } catch (e) { /* приватный режим */ }
  gtag('event', 'conversion', { 'send_to': sendTo, 'value': 1.0, 'currency': 'USD' });
}

document.addEventListener('click', function (e) {
  if (!e.isTrusted) return;                   // синтетический клик бота, игнор
  var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href*="wa.me"]');
  if (!a) return;
  var href = a.getAttribute('href') || '';
  if (href.indexOf('tel:') === 0) {
    fireConversion('AW-18415302041/uMWFCJWWlfMcEJnrjM1E', 'tel');       // Интерактивные номера телефонов
  } else if (href.indexOf('wa.me') !== -1) {
    fireConversion('AW-18415302041/Zr2UCJDfnfMcEJnrjM1E', 'wa');        // Контакт (WhatsApp)
  }
});

/* ============================================================
   Фоновые боке-огоньки в секциях [data-bokeh]
   (CSS-анимации; JS лишь расставляет и ставит на паузу вне экрана)
   ============================================================ */
(function () {
  if (prefersReducedMotion) return;

  const layers = document.querySelectorAll('[data-bokeh]');
  const scenes = document.querySelectorAll('.anim-scene');
  if (!layers.length && !scenes.length) return;

  const isMobile = window.matchMedia('(max-width: 860px)').matches;
  const colors = [
    'rgba(44, 177, 177, 0.9)',   // teal-500
    'rgba(127, 212, 212, 0.9)',  // светлая бирюза
    'rgba(255, 255, 255, 0.85)', // белый
    'rgba(232, 199, 125, 0.8)'   // мягкое золото
  ];
  const rand = (min, max) => min + Math.random() * (max - min);

  layers.forEach((layer) => {
    let count = parseInt(layer.dataset.bokeh, 10) || 10;
    if (isMobile) count = Math.ceil(count / 2); // на мобилке облегчаем
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('span');
      dot.className = 'bokeh';
      const size = rand(6, isMobile ? 16 : 26);
      dot.style.setProperty('--x', rand(2, 96) + '%');
      dot.style.setProperty('--y', rand(4, 92) + '%');
      dot.style.setProperty('--s', size.toFixed(1) + 'px');
      dot.style.setProperty('--c', colors[i % colors.length]);
      dot.style.setProperty('--o', rand(0.2, 0.5).toFixed(2));
      dot.style.setProperty('--dx', rand(-38, 38).toFixed(0) + 'px');
      dot.style.setProperty('--dy', rand(16, 42).toFixed(0) + 'px');
      dot.style.setProperty('--d', rand(9, 17).toFixed(1) + 's');
      dot.style.setProperty('--dl', (-rand(0, 12)).toFixed(1) + 's');
      frag.appendChild(dot);
    }
    layer.appendChild(frag);
  });

  /* Пауза фоновых анимаций у секций вне экрана */
  if ('IntersectionObserver' in window) {
    const sceneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('in-view', entry.isIntersecting);
        });
      },
      { rootMargin: '120px 0px 120px 0px' }
    );
    scenes.forEach((scene) => sceneObserver.observe(scene));
  } else {
    scenes.forEach((scene) => scene.classList.add('in-view'));
  }
})();

/* ============================================================
   Лёгкий параллакс декоративных элементов [data-parallax]
   (rAF, только transform; при reduced-motion не запускается)
   ============================================================ */
(function () {
  if (prefersReducedMotion) return;

  const parallaxEls = document.querySelectorAll('[data-parallax]');
  if (!parallaxEls.length) return;

  let ticking = false;

  function updateParallax() {
    ticking = false;
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -160 || rect.top > vh + 160) return; // вне экрана - не трогаем
      const speed = parseFloat(el.dataset.parallax) || 0.12;
      const offset = (rect.top + rect.height / 2 - vh / 2) * speed;
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateParallax);
    }
  }, { passive: true });

  updateParallax();
})();

/* ============================================================
   Падающие звёзды с разноцветным светящимся хвостом (hero, canvas)
   ============================================================ */
(function shootingStars() {
  var canvas = document.getElementById('heroShooting');
  if (!canvas || prefersReducedMotion) return;
  var ctx = canvas.getContext('2d');
  var hero = document.getElementById('hero');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, running = true, stars = [], lastSpawn = 0;

  // палитра хвостов - разные цвета
  var COLORS = [
    [44, 177, 177],   // бирюза
    [236, 110, 173],  // розовый
    [150, 111, 214],  // фиолет
    [240, 190, 90],   // золото
    [90, 170, 240],   // голубой
    [80, 200, 140]    // зелёный
  ];

  function resize() {
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.max(1, W * DPR);
    canvas.height = Math.max(1, H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function spawn() {
    var fromLeft = Math.random() < 0.5;
    var angle = (Math.random() * 18 + 20) * Math.PI / 180; // 20-38 градусов вниз
    var speed = Math.random() * 5 + 6;
    var col = COLORS[(Math.random() * COLORS.length) | 0];
    stars.push({
      x: fromLeft ? -40 : W + 40,
      y: Math.random() * H * 0.55,
      vx: (fromLeft ? 1 : -1) * Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: Math.random() * 80 + 90,   // длина хвоста
      life: 0, ttl: Math.random() * 60 + 90,
      col: col, r: Math.random() * 1.2 + 1.3
    });
  }

  function draw(now) {
    if (running) {
      ctx.clearRect(0, 0, W, H);
      if (now - lastSpawn > (Math.random() * 900 + 700)) { spawn(); lastSpawn = now; }
      for (var i = stars.length - 1; i >= 0; i--) {
        var s = stars[i];
        s.x += s.vx; s.y += s.vy; s.life++;
        var fade = Math.min(1, s.life / 12) * Math.max(0, 1 - s.life / s.ttl);
        // хвост - градиент от цвета к прозрачному
        var tx = s.x - s.vx * (s.len / Math.hypot(s.vx, s.vy));
        var ty = s.y - s.vy * (s.len / Math.hypot(s.vx, s.vy));
        var g = ctx.createLinearGradient(s.x, s.y, tx, ty);
        var c = s.col;
        g.addColorStop(0, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.9 * fade) + ')');
        g.addColorStop(0.4, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.35 * fade) + ')');
        g.addColorStop(1, 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = s.r;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
        // головка звезды - яркая точка со свечением
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + fade + ')';
        ctx.shadowColor = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + fade + ')';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
        if (s.life > s.ttl || s.x < -80 || s.x > W + 80 || s.y > H + 80) stars.splice(i, 1);
      }
    }
    requestAnimationFrame(draw);
  }

  // пауза, когда hero вне экрана
  if ('IntersectionObserver' in window && hero) {
    new IntersectionObserver(function (en) { running = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  }
  requestAnimationFrame(draw);
})();
