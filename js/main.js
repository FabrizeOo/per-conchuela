/**
 * PERÚ CONCHUELA (peruconchuela.com) — Interacciones Principales
 * Header fijo, menú móvil accesible, línea de tiempo, contadores, selector de granulometría,
 * lightbox accesible por teclado, mapa interactivo y formulario con envío a WhatsApp.
 */
(function () {
  'use strict';

  /* CAMBIAR ESPECIFICACIONES DE GRANULOMETRÍA Y USOS RECOMENDADOS AQUÍ */
  var GRAIN_DATA = {
    gruesa: {
      badge: '3 a 4 mm',
      title: 'Conchuela Gruesa (3 a 4 mm)',
      measure: 'Diámetro: 3.0 – 4.0 mm',
      photoSrc: 'assets/img/productos/conchuela-gruesa.webp',
      photoAlt: 'Fotografía de Conchuela Gruesa (3 a 4 mm) en estado natural',
      photoBadge: 'Fotografía real · Conchuela Gruesa',
      summary: 'Partículas laminares de alta resistencia mecánica y drenaje superior. Mantiene la estructura visual del nácar y carbonato natural.',
      uses: [
        'Avicultura: gallinas ponedoras en postura (retención prolongada en molleja y máxima dureza de cáscara).',
        'Inmobiliario y construcción: estacionamientos, caminos de tránsito vehicular ligero y cubresuelos drenantes.',
        'Paisajismo: cobertura ornamental en parques, jardines de bajo consumo hídrico y alcorques.'
      ],
      rulerX: 96,
      rulerWidth: 32
    },
    mediana: {
      badge: 'Hasta 2 mm',
      title: 'Conchuela Mediana (hasta 2 mm)',
      measure: 'Diámetro: 1.2 – 2.0 mm',
      photoSrc: 'assets/img/productos/conchuela-mediana.webp',
      photoAlt: 'Fotografía de Conchuela Mediana (hasta 2 mm) en estado natural',
      photoBadge: 'Fotografía real · Conchuela Mediana',
      summary: 'Granulometría intermedia versátil que equilibra cobertura uniforme, rápida incorporación en mezclas y textura antideslizante.',
      uses: [
        'Avicultura: alimento balanceado para aves en etapa de crecimiento y engorde (32 a 36% de calcio).',
        'Inmobiliario y construcción: senderos peatonales, terrazas, patios y prefabricados de concreto.',
        'Industrial y arquitectura: sustituto de granalla de mármol para terrazo lavado y revestimientos.'
      ],
      rulerX: 38,
      rulerWidth: 26
    },
    fina: {
      badge: 'Hasta 1 mm',
      title: 'Conchuela Fina (hasta 1 mm)',
      measure: 'Diámetro: 0.3 – 1.0 mm',
      photoSrc: 'assets/img/productos/conchuela-fina.webp',
      photoAlt: 'Fotografía de Conchuela Fina (hasta 1 mm) en estado natural',
      photoBadge: 'Fotografía real · Conchuela Fina',
      summary: 'Grano fino tamizado de tacto sedoso y alta superficie específica, ideal para acabados arquitectónicos continuos y raciones iniciales.',
      uses: [
        'Avicultura: raciones de inicio para pollitos y premezclas minerales de rápida biodisponibilidad.',
        'Industrial y arquitectura: bordes de piscinas, estucos minerales, enchapes verticales y mezcla con pigmentos.',
        'Paisajismo: playas artificiales en hoteles y condominios, jardines interiores y sustrato de acuarios.'
      ],
      rulerX: 6,
      rulerWidth: 26
    }
  };

  /* 1. Header fijo + Menú móvil accesible */
  function initHeaderAndNav() {
    var header = document.getElementById('site-header');
    var navToggle = document.getElementById('nav-toggle');
    var primaryNav = document.getElementById('primary-nav');

    function updateHeaderOnScroll() {
      if (!header) return;
      header.classList.toggle('is-scrolled', window.scrollY > 36);
    }

    window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });
    updateHeaderOnScroll();

    if (navToggle && primaryNav) {
      navToggle.addEventListener('click', function () {
        var expanded = navToggle.getAttribute('aria-expanded') === 'true';
        var nextState = !expanded;
        navToggle.setAttribute('aria-expanded', String(nextState));
        navToggle.setAttribute('aria-label', nextState ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
        primaryNav.classList.toggle('is-open', nextState);
      });

      primaryNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navToggle.setAttribute('aria-expanded', 'false');
          navToggle.setAttribute('aria-label', 'Abrir menú de navegación');
          primaryNav.classList.remove('is-open');
        });
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && primaryNav.classList.contains('is-open')) {
          navToggle.setAttribute('aria-expanded', 'false');
          primaryNav.classList.remove('is-open');
          navToggle.focus();
        }
      });
    }
  }

  /* 2. Animaciones de entrada y contadores interactivos */
  function initAnimationsAndCounters() {
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var counterEls = document.querySelectorAll('[data-counter-target]');

    counterEls.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-counter-target') || '23', 10);
      if (reducedMotion || typeof window.IntersectionObserver === 'undefined') {
        el.textContent = String(target);
        return;
      }

      var animated = false;
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !animated) {
            animated = true;
            var startVal = 1;
            var duration = target > 100 ? 1600 : 1200;
            var startTime = performance.now();

            function tick(now) {
              var elapsed = now - startTime;
              var progress = Math.min(1, elapsed / duration);
              var eased = 1 - Math.pow(1 - progress, 3);
              var current = Math.max(1, Math.round(startVal + (target - startVal) * eased));
              el.textContent = String(current);
              if (progress < 1) {
                requestAnimationFrame(tick);
              }
            }
            requestAnimationFrame(tick);
            obs.disconnect();
          }
        });
      }, { threshold: 0.35 });

      obs.observe(el);
    });
  }

  /* 3. Selector interactivo de granulometría + preselección en formulario */
  function initGranulometrySelector() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.grain-tab'));
    var panel = document.getElementById('grain-panel');
    var badgeEl = document.getElementById('grain-active-badge');
    var titleEl = document.getElementById('grain-active-title');
    var summaryEl = document.getElementById('grain-active-summary');
    var usesListEl = document.getElementById('grain-uses-list');
    var ctaLinkEl = document.getElementById('grain-cta-link');
    var measureReadout = document.getElementById('scale-measure-Readout');
    var photoImg = document.getElementById('grain-photo-img');
    var photoBadge = document.getElementById('grain-photo-badge');
    var svgRulerHighlight = document.getElementById('svg-ruler-highlight');

    if (!tabs.length || !panel) return;

    function activateGrain(grainKey) {
      var data = GRAIN_DATA[grainKey];
      if (!data) return;

      tabs.forEach(function (tab) {
        var isMatch = tab.getAttribute('data-grain') === grainKey;
        tab.classList.toggle('is-active', isMatch);
        tab.setAttribute('aria-selected', String(isMatch));
        if (isMatch) {
          panel.setAttribute('aria-labelledby', tab.id);
        }
      });

      if (badgeEl) badgeEl.textContent = data.badge;
      if (titleEl) titleEl.textContent = data.title;
      if (summaryEl) summaryEl.textContent = data.summary;
      if (measureReadout) measureReadout.textContent = data.measure;

      if (photoImg) {
        photoImg.style.opacity = '0.3';
        photoImg.style.transform = 'scale(0.98)';
        setTimeout(function () {
          photoImg.src = data.photoSrc;
          photoImg.alt = data.photoAlt;
          photoImg.style.opacity = '1';
          photoImg.style.transform = 'scale(1)';
        }, 150);
      }

      if (photoBadge) {
        photoBadge.textContent = data.photoBadge;
      }

      if (usesListEl) {
        usesListEl.innerHTML = data.uses.map(function (u) {
          return '<li>' + u + '</li>';
        }).join('');
      }

      if (ctaLinkEl) {
        ctaLinkEl.setAttribute('data-grain-cta', data.title);
      }

      if (svgRulerHighlight) {
        svgRulerHighlight.setAttribute('x', String(data.rulerX));
        svgRulerHighlight.setAttribute('width', String(data.rulerWidth));
      }
    }

    tabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () {
        activateGrain(tab.getAttribute('data-grain'));
      });

      tab.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var dir = e.key === 'ArrowRight' ? 1 : -1;
          var nextIdx = (idx + dir + tabs.length) % tabs.length;
          tabs[nextIdx].focus();
          activateGrain(tabs[nextIdx].getAttribute('data-grain'));
        }
      });
    });

    if (ctaLinkEl) {
      ctaLinkEl.addEventListener('click', function () {
        var selectedGrain = ctaLinkEl.getAttribute('data-grain-cta') || '';
        var msgInput = document.getElementById('mensaje');
        if (msgInput && selectedGrain && !msgInput.value.trim()) {
          msgInput.value = 'Solicito cotización de ' + selectedGrain + '. ';
        }
      });
    }

    /* Enlaces desde tarjetas de Aplicaciones que preseleccionan el sector en el formulario */
    document.querySelectorAll('[data-select-sector]').forEach(function (link) {
      link.addEventListener('click', function () {
        var sectorVal = link.getAttribute('data-select-sector');
        var sectorSelect = document.getElementById('sector');
        if (sectorSelect && sectorVal) {
          sectorSelect.value = sectorVal;
        }
      });
    });
  }

  /* 4. Lightbox accesible para la galería Masonry (Teclado, Escape, Flechas) */
  function initLightbox() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('.masonry-trigger'));
    var lightbox = document.getElementById('project-lightbox');
    var backdrop = document.getElementById('lightbox-backdrop');
    var closeBtn = document.getElementById('lightbox-close');
    var prevBtn = document.getElementById('lightbox-prev');
    var nextBtn = document.getElementById('lightbox-next');
    var imgEl = document.getElementById('lightbox-img');
    var captionEl = document.getElementById('lightbox-caption');

    if (!triggers.length || !lightbox || !imgEl) return;

    var currentIndex = 0;
    var lastFocusedElement = null;

    function showSlide(index) {
      currentIndex = (index + triggers.length) % triggers.length;
      var btn = triggers[currentIndex];
      var src = btn.getAttribute('data-lightbox-src');
      var caption = btn.getAttribute('data-lightbox-caption') || '';
      var thumbImg = btn.querySelector('img');
      var altText = thumbImg ? thumbImg.getAttribute('alt') : caption;

      imgEl.setAttribute('src', src);
      imgEl.setAttribute('alt', altText);
      if (captionEl) captionEl.textContent = caption;
    }

    function openLightbox(index) {
      lastFocusedElement = document.activeElement;
      showSlide(index);
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
      }
    }

    triggers.forEach(function (btn, idx) {
      btn.addEventListener('click', function () {
        openLightbox(idx);
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (backdrop) backdrop.addEventListener('click', closeLightbox);
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        showSlide(currentIndex - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        showSlide(currentIndex + 1);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showSlide(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        showSlide(currentIndex + 1);
      }
    });
  }

  /* 0. Pantalla de carga interactiva con el logo en cada entrada o F5 */
  function initInteractivePreloader() {
    var preloader = document.getElementById('site-preloader');
    if (!preloader) return;

    var ringProgress = document.getElementById('preloader-ring-progress');
    var barFill = document.getElementById('preloader-bar-fill');
    var pctText = document.getElementById('preloader-pct');
    var statusText = document.getElementById('preloader-status');
    var enterBtn = document.getElementById('preloader-enter-btn');
    var emblem = document.getElementById('preloader-emblem');
    var glow = document.getElementById('preloader-glow');

    var circumference = 741.4;
    var progress = 0;
    var isClosed = false;
    var rafId = null;

    function updateVisualProgress(val) {
      var clamped = Math.max(0, Math.min(100, Math.round(val)));
      if (pctText) pctText.textContent = clamped + '%';
      if (barFill) barFill.style.width = clamped + '%';
      if (ringProgress) {
        var offset = circumference - (clamped / 100) * circumference;
        ringProgress.style.strokeDashoffset = String(offset);
      }
      if (statusText) {
        if (clamped < 40) {
          statusText.textContent = 'Extrayendo pureza mineral · 11 millones de años';
        } else if (clamped < 85) {
          statusText.textContent = 'Calibrando granulometría natural (32% – 36% Ca)...';
        } else {
          statusText.textContent = 'Experiencia lista · Bienvenido a Perú Conchuela';
        }
      }
    }

    function finishPreloader() {
      if (isClosed) return;
      isClosed = true;
      if (rafId) cancelAnimationFrame(rafId);
      updateVisualProgress(100);
      setTimeout(function () {
        preloader.classList.add('is-hidden');
        document.body.classList.remove('is-loading');
      }, 180);
    }

    /* Interacción con cursor / toque: inclinación 3D sutil del medallón y halo de luz */
    preloader.addEventListener('pointermove', function (e) {
      if (isClosed) return;
      if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      }
      if (emblem) {
        var rect = emblem.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) / 18;
        var dy = (e.clientY - cy) / 18;
        emblem.style.transform = 'translate3d(' + Math.max(-10, Math.min(10, dx)) + 'px, ' + Math.max(-10, Math.min(10, dy)) + 'px, 0)';
      }
    });

    /* Clic en el logo o botón para acelerar / entrar de inmediato */
    if (enterBtn) {
      enterBtn.addEventListener('click', finishPreloader);
    }
    if (emblem) {
      emblem.addEventListener('click', function () {
        progress = Math.min(100, progress + 35);
        updateVisualProgress(progress);
        if (progress >= 100) finishPreloader();
      });
    }

    var startTime = performance.now();
    var duration = 1450;

    function step(now) {
      if (isClosed) return;
      var elapsed = now - startTime;
      var naturalPct = Math.min(100, (elapsed / duration) * 100);
      progress = Math.max(progress, naturalPct);
      updateVisualProgress(progress);

      if (progress < 100) {
        rafId = requestAnimationFrame(step);
      } else {
        finishPreloader();
      }
    }

    rafId = requestAnimationFrame(step);
  }

  /* 5. Mapa embebido visible directamente al cargar con cambio instantáneo de sede */
  function initMapEmbed() {
    var mapIframe = document.getElementById('office-map-iframe');
    var activeLabel = document.getElementById('map-active-label');
    var externalLink = document.getElementById('map-external-link');
    var mapTabs = Array.prototype.slice.call(document.querySelectorAll('.map-tab'));

    if (!mapIframe) return;

    mapTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        mapTabs.forEach(function (t) {
          t.classList.toggle('is-active', t === tab);
        });
        var query = tab.getAttribute('data-map-query') || 'Av.+Jose+Carlos+Mariategui+2587+El+Agustino+Lima+Peru';
        var label = tab.getAttribute('data-map-label') || '';
        mapIframe.src = 'https://www.google.com/maps?q=' + query + '&output=embed';
        if (activeLabel) activeLabel.textContent = label;
        if (externalLink) {
          externalLink.href = 'https://www.google.com/maps/search/?api=1&query=' + query;
        }
      });
    });
  }

  /* 6. Validación en tiempo real del formulario + envío a WhatsApp (935373326) y alternativa email */
  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var fields = {
      nombre: {
        input: document.getElementById('nombre'),
        error: document.getElementById('error-nombre'),
        validate: function (val) {
          if (!val.trim()) return 'Por favor, ingresa tu nombre completo.';
          if (val.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres.';
          return '';
        }
      },
      empresa: {
        input: document.getElementById('empresa'),
        error: document.getElementById('error-empresa'),
        validate: function (val) {
          if (!val.trim()) return 'Por favor, indica el nombre de tu empresa o proyecto.';
          return '';
        }
      },
      sector: {
        input: document.getElementById('sector'),
        error: document.getElementById('error-sector'),
        validate: function (val) {
          if (!val) return 'Selecciona el sector de aplicación.';
          return '';
        }
      },
      toneladas: {
        input: document.getElementById('toneladas'),
        error: document.getElementById('error-toneladas'),
        validate: function (val) {
          var num = parseFloat(val);
          if (!val || Number.isNaN(num) || num <= 0) {
            return 'Ingresa una cantidad estimada válida en toneladas (ej. 10).';
          }
          return '';
        }
      },
      mensaje: {
        input: document.getElementById('mensaje'),
        error: document.getElementById('error-mensaje'),
        validate: function (val) {
          if (!val.trim()) return 'Por favor, escribe los detalles de tu requerimiento.';
          if (val.trim().length < 10) return 'Detalla un poco más tu consulta (mínimo 10 caracteres).';
          return '';
        }
      }
    };

    function validateSingleField(key) {
      var item = fields[key];
      if (!item || !item.input) return true;
      var msg = item.validate(item.input.value);
      item.input.classList.toggle('is-invalid', Boolean(msg));
      item.input.setAttribute('aria-invalid', String(Boolean(msg)));
      if (item.error) item.error.textContent = msg;
      return !msg;
    }

    Object.keys(fields).forEach(function (key) {
      var item = fields[key];
      if (!item.input) return;
      item.input.addEventListener('input', function () {
        validateSingleField(key);
      });
      item.input.addEventListener('blur', function () {
        validateSingleField(key);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allValid = true;
      var firstInvalid = null;

      Object.keys(fields).forEach(function (key) {
        var valid = validateSingleField(key);
        if (!valid && allValid) {
          allValid = false;
          firstInvalid = fields[key].input;
        }
      });

      if (!allValid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var nombre = fields.nombre.input.value.trim();
      var empresa = fields.empresa.input.value.trim();
      var sector = fields.sector.input.value;
      var toneladas = fields.toneladas.input.value.trim();
      var mensaje = fields.mensaje.input.value.trim();

      var textLines = [
        'Hola Perú Conchuela, solicito una cotización desde peruconchuela.com:',
        '• Nombre: ' + nombre,
        '• Empresa / Proyecto: ' + empresa,
        '• Sector: ' + sector,
        '• Cantidad estimada: ' + toneladas + ' toneladas',
        '• Mensaje: ' + mensaje
      ].join('\n');

      var whatsappUrl = 'https://wa.me/51935373326?text=' + encodeURIComponent(textLines);
      var mailSubject = 'Solicitud de cotización - ' + empresa + ' (' + sector + ')';
      var mailtoUrl = 'mailto:contactos@peruconchuela.com?subject=' + encodeURIComponent(mailSubject) + '&body=' + encodeURIComponent(textLines);

      var feedbackBox = document.getElementById('form-feedback');
      var mailtoLink = document.getElementById('feedback-mailto-link');
      if (mailtoLink) mailtoLink.href = mailtoUrl;
      if (feedbackBox) feedbackBox.hidden = false;

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    });
  }

  function initAll() {
    initInteractivePreloader();
    initHeaderAndNav();
    initAnimationsAndCounters();
    initGranulometrySelector();
    initLightbox();
    initMapEmbed();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();

