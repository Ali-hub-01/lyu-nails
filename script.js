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
  if (typeof gtag === 'function') {
    gtag('event', 'conversion', {
      'send_to': 'AW-18375998502/W4o_CNe8iN4cEKb4rbpE',
      'value': 1.0,
      'currency': 'USD'
    });
  }

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
   Конверсия Google Ads: "Контакт" - клики по WhatsApp
   Делегированный слушатель ловит все ссылки wa.me (кнопки курсов,
   контакты, плавающая кнопка) - и текущие, и добавленные позже.
   ============================================================ */
document.addEventListener('click', (e) => {
  const waLink = e.target.closest('a[href*="wa.me"]');
  if (!waLink) return;
  if (typeof gtag === 'function') {
    gtag('event', 'conversion', {
      'send_to': 'AW-18375998502/wQznCOX3mN4cEKb4rbpE',
      'value': 1.0,
      'currency': 'USD'
    });
  }
});

/* ============================================================
   Конверсия Google Ads: "Instagram - переход" - клики по Instagram
   ============================================================ */
document.addEventListener('click', (e) => {
  const igLink = e.target.closest('a[href*="instagram.com"]');
  if (!igLink) return;
  if (typeof gtag === 'function') {
    gtag('event', 'conversion', {
      'send_to': 'AW-18375998502/qo50CJPh_OIcEKb4rbpE',
      'value': 1.0,
      'currency': 'USD'
    });
  }
});
