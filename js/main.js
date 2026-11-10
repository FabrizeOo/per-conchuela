/**
 * PERÚ CONCHUELA (peruconchuela.com) — Interacciones Principales (Hardened Edition)
 * Controles de seguridad aplicados bajo OWASP ASVS L2 / Top 10, ISO/IEC 27001:2022 (A.8.26, A.8.28),
 * ISO/IEC 27071:2023 (conexiones confiables) y SOC 2 (CC6, CC7, PI1, Privacy):
 * - Cero uso de sinks inseguros (innerHTML, outerHTML, eval, document.write).
 * - Estructuras de configuración inmutables (deepFreeze) contra manipulación en memoria.
 * - Listas blancas estrictas (allowlists) para rutas de imágenes, mapas y selectores.
 * - Sanitización contra caracteres de control, inyección CRLF y suplantación Unicode BiDi.
 * - Protección anti-automatización (honeypot + umbral temporal + rate limiting local) y consentimiento informado.
 */
(function () {
  'use strict';

  /* Asegurar reinicio completo desde el inicio al recargar (F5) o abrir la página */
  try {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  } catch (e) {}

  if (window.location.hash) {
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (e) {}
  }

  try {
    window.scrollTo(0, 0);
  } catch (e) {}

  window.addEventListener('beforeunload', function () {
    try {
      window.scrollTo(0, 0);
    } catch (e) {}
  });

  function deepFreeze(obj) {
    if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;
    Object.freeze(obj);
    Object.keys(obj).forEach(function (key) {
      deepFreeze(obj[key]);
    });
    return obj;
  }

  /* Sanitización estricta de texto plano (elimina controles ASCII, CRLF en líneas simples y overrides BiDi) */
  function sanitizePlainText(input, maxLen, allowNewlines) {
    var raw = String(input == null ? '' : input);
    var cleaned = raw
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g, '');
    if (!allowNewlines) {
      cleaned = cleaned.replace(/[\r\n]+/g, ' ');
    } else {
      cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    cleaned = cleaned.trim();
    if (typeof maxLen === 'number' && maxLen > 0 && cleaned.length > maxLen) {
      cleaned = cleaned.slice(0, maxLen);
    }
    return cleaned;
  }

  var SAFE_LOCAL_PROJECT_IMG_RE = /^assets\/img\/proyectos\/[a-z0-9._-]+\.webp$/i;
  var SAFE_SECTION_HASH_RE = /^#[a-z0-9-]+$/i;

  var ALLOWED_SECTORS = deepFreeze(['Fósila', 'Esculturas', 'Avícola', 'Inmobiliario', 'Paisajismo', 'Industrial', 'Otro']);

  var ALLOWED_MAP_OFFICES = deepFreeze({
    'la-molina': {
      query: 'Las Fresias 263 Camacho La Molina Lima Peru',
      label: 'Oficina Principal · Las Fresias 263, Camacho, La Molina'
    },
    'el-agustino': {
      query: 'Av. Jose Carlos Mariategui 2587 El Agustino Lima Peru',
      label: 'Sede Operativa · Av. José Carlos Mariátegui 2587, El Agustino'
    }
  });

  /* CAMBIAR ESPECIFICACIONES DE GRANULOMETRÍA Y USOS RECOMENDADOS AQUÍ */
  var GRAIN_DATA = deepFreeze({
    gruesa: {
      badge: '3 a 4 mm',
      title: 'Conchuela Gruesa (3 a 4 mm)',
      measure: 'Diámetro: 3.0 – 4.0 mm',
      photoSrc: 'assets/img/productos/conchuela-gruesa.webp',
      photoAlt: 'Fotografía de Conchuela Gruesa (3 a 4 mm) en estado natural',
      photoBadge: 'Conchuela Gruesa',
      summary: 'Partículas laminares de alta resistencia mecánica y drenaje superior. Mantiene la estructura visual del nácar y carbonato natural.',
      descInm: 'Estacionamientos, caminos de tránsito ligero y cubresuelos drenantes.',
      descPais: 'Cobertura ornamental en parques, jardines y alcorques.',
      descAvic: 'Gallinas ponedoras en postura (retención prolongada en molleja y máxima dureza de cáscara).',
      uses: [
        'Inmobiliario y construcción: estacionamientos, caminos de tránsito vehicular ligero y cubresuelos drenantes.',
        'Paisajismo: cobertura ornamental en parques, jardines de bajo consumo hídrico y alcorques.',
        'Avicultura: gallinas ponedoras en postura (retención prolongada en molleja y máxima dureza de cáscara).'
      ],
      scalePercent: '100%',
      rulerX: 96,
      rulerWidth: 32
    },
    mediana: {
      badge: 'Hasta 2 mm',
      title: 'Conchuela Mediana (hasta 2 mm)',
      measure: 'Diámetro: 1.2 – 2.0 mm',
      photoSrc: 'assets/img/productos/conchuela-mediana.webp',
      photoAlt: 'Fotografía de Conchuela Mediana (hasta 2 mm) en estado natural',
      photoBadge: 'Conchuela Mediana',
      summary: 'Granulometría intermedia versátil que equilibra cobertura uniforme, rápida incorporación en mezclas y textura antideslizante.',
      descInm: 'Senderos peatonales, terrazas, patios y prefabricados de concreto.',
      descPais: 'Jardines secos xerófitos, delimitación de senderos y cubresuelos minerales.',
      descAvic: 'Alimento balanceado para aves en etapa de crecimiento y engorde (32 a 36% de calcio).',
      uses: [
        'Inmobiliario y construcción: senderos peatonales, terrazas, patios y prefabricados de concreto.',
        'Industrial y arquitectura: sustituto de granalla de mármol para terrazo lavado y revestimientos.',
        'Avicultura: alimento balanceado para aves en etapa de crecimiento y engorde (32 a 36% de calcio).'
      ],
      scalePercent: '55%',
      rulerX: 38,
      rulerWidth: 26
    },
    fina: {
      badge: 'Hasta 1 mm',
      title: 'Conchuela Fina (hasta 1 mm)',
      measure: 'Diámetro: 0.3 – 1.0 mm',
      photoSrc: 'assets/img/productos/conchuela-fina.webp',
      photoAlt: 'Fotografía de Conchuela Fina (hasta 1 mm) en estado natural',
      photoBadge: 'Conchuela Fina',
      summary: 'Grano fino tamizado de tacto sedoso y alta superficie específica, ideal para acabados arquitectónicos continuos y raciones iniciales.',
      descInm: 'Bordes de piscinas, estucos minerales, enchapes verticales y mezcla con pigmentos.',
      descPais: 'Playas artificiales en hoteles y condominios, jardines interiores y sustrato de acuarios.',
      descAvic: 'Raciones de inicio para pollitos y premezclas minerales de rápida biodisponibilidad.',
      uses: [
        'Industrial y arquitectura: bordes de piscinas, estucos minerales, enchapes verticales y mezcla con pigmentos.',
        'Paisajismo: playas artificiales en hoteles y condominios, jardines interiores y sustrato de acuarios.',
        'Avicultura: raciones de inicio para pollitos y premezclas minerales de rápida biodisponibilidad.'
      ],
      scalePercent: '18%',
      rulerX: 6,
      rulerWidth: 26
    },
    phuket: {
      badge: 'Especial',
      title: 'Conchuela Phuket (Selección Arquitectónica)',
      measure: 'Diámetro: 1.0 – 3.0 mm (Grano Decorativo)',
      photoSrc: 'assets/img/productos/conchuela-phuket.webp',
      photoAlt: 'Fotografía de Conchuela Phuket selección arquitectónica en alta pureza',
      photoBadge: 'Conchuela Phuket',
      summary: 'Variedad seleccionada de alta pureza estética con tonos nácar y arena clara. Diseñada para acabados continuos de lujo, terrazos premium y paisajismo exclusivo.',
      descInm: 'Terrazos lavados, pavimentos continuos, revestimientos pulidos y muros decorativos.',
      descPais: 'Paisajismo de lujo, jardines zen, alcorques destacados y áreas de relajación.',
      descAvic: 'Selección mineral biogénica de máxima pureza.',
      uses: [
        'Arquitectura e interiorismo: terrazos continuos, pisos biofílicos y estucos minerales.',
        'Paisajismo de alto nivel: cubresuelos claros de alto impacto visual y jardines secos contemporáneos.'
      ],
      scalePercent: '75%',
      rulerX: 68,
      rulerWidth: 30
    }
  });

  /* Defensa en profundidad para enlaces externos (ISO/IEC 27071:2023 / Anti-Tabnabbing) */
  function enforceExternalLinkSafety() {
    document.querySelectorAll('a[target="_blank"]').forEach(function (anchor) {
      var rel = (anchor.getAttribute('rel') || '').toLowerCase();
      var parts = rel ? rel.split(/\s+/) : [];
      if (parts.indexOf('noopener') === -1) parts.push('noopener');
      if (parts.indexOf('noreferrer') === -1) parts.push('noreferrer');
      anchor.setAttribute('rel', parts.join(' ').trim());
    });
  }

  /* 0. Coreografía FLIP de entrada: inicia solo con el logo al centro -> pasa arriba a la izquierda + componentes suben hacia el estado de scroll */
  function initInteractivePreloader() {
    var preloader = document.getElementById('site-preloader');
    var introLogo = document.getElementById('intro-logo');
    var brandLogoLink = document.querySelector('.brand-logo');
    var headerLogoImg = document.querySelector('.brand-logo img');

    if (!preloader) {
      document.body.classList.remove('is-intro-active', 'is-loading');
      return;
    }

    var reducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var heroHeader = document.getElementById('hero-clean-header');
    var heroStage = document.getElementById('hero-media-stage');
    var whatsappBtn = document.querySelector('.whatsapp-float');
    var isDesktop = window.matchMedia && window.matchMedia('(min-width: 1024px)').matches;
    var navTargets = isDesktop
      ? Array.prototype.slice.call(document.querySelectorAll('.nav-list > li, .nav-cta'))
      : Array.prototype.slice.call(document.querySelectorAll('#nav-toggle'));

    var allRevealTargets = []
      .concat(navTargets)
      .concat([heroHeader, heroStage, whatsappBtn])
      .filter(Boolean);

    var isFinished = false;
    var failSafeTimer = null;

    function completeIntroInstantly() {
      if (isFinished) return;
      isFinished = true;
      if (failSafeTimer) clearTimeout(failSafeTimer);

      document.body.classList.remove('is-intro-active', 'is-loading');
      preloader.classList.add('is-hidden');
      preloader.hidden = true;

      if (brandLogoLink) {
        brandLogoLink.style.opacity = '';
      }

      if (typeof window.gsap !== 'undefined' && allRevealTargets.length) {
        window.gsap.set(allRevealTargets, { clearProps: 'transform,opacity,willChange' });
      }

      try {
        window.scrollTo(0, 0);
      } catch (e) {}

      if (typeof window.ScrollTrigger !== 'undefined') {
        try {
          if (window.ScrollTrigger.clearScrollMemory) {
            window.ScrollTrigger.clearScrollMemory();
          }
        } catch (e) {}
        window.ScrollTrigger.refresh();
      }
    }

    if (
      reducedMotion ||
      typeof window.gsap === 'undefined' ||
      !introLogo ||
      !headerLogoImg
    ) {
      completeIntroInstantly();
      return;
    }

    try {
      window.scrollTo(0, 0);
    } catch (e) {}

    failSafeTimer = setTimeout(completeIntroInstantly, 3800);

    function startChoreography() {
      if (isFinished) return;

      var gsap = window.gsap;
      var cachedDelta = null;

      function getLogoDelta() {
        if (!cachedDelta) {
          var introRect = introLogo.getBoundingClientRect();
          var targetRect = headerLogoImg.getBoundingClientRect();
          var introW = introRect.width || 220;
          var targetW = targetRect.width || 112;
          cachedDelta = {
            dx: targetRect.left + targetRect.width / 2 - (introRect.left + introRect.width / 2),
            dy: targetRect.top + targetRect.height / 2 - (introRect.top + introRect.height / 2),
            scale: targetW / introW
          };
        }
        return cachedDelta;
      }

      var tl = gsap.timeline({
        onComplete: completeIntroInstantly
      });

      /* Paso 1: Únicamente el logo en el centro sobre lienzo blanco puro */
      tl.fromTo(
        introLogo,
        { scale: 0.92, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.46, ease: 'power2.out' }
      );

      /* Breve pausa limpia con solo el logo al centro */
      tl.to({}, { duration: 0.24 });

      /* Paso 2: El logo viaja hacia arriba a la izquierda mientras los componentes suben automáticamente */
      tl.addLabel('glideAndRise');

      tl.call(
        function () {
          preloader.classList.add('is-revealing');
        },
        null,
        'glideAndRise'
      );

      tl.to(
        introLogo,
        {
          x: function () {
            return getLogoDelta().dx;
          },
          y: function () {
            return getLogoDelta().dy;
          },
          scale: function () {
            return getLogoDelta().scale;
          },
          duration: 1.02,
          ease: 'expo.inOut',
          onComplete: function () {
            if (brandLogoLink) brandLogoLink.style.opacity = '1';
            preloader.classList.add('is-hidden');
            preloader.hidden = true;
          }
        },
        'glideAndRise'
      );

      if (navTargets.length) {
        tl.fromTo(
          navTargets,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.68,
            stagger: 0.045,
            ease: 'power3.out'
          },
          'glideAndRise+=0.24'
        );
      }

      if (heroHeader) {
        tl.fromTo(
          heroHeader,
          { opacity: 0, y: 48 },
          {
            opacity: 1,
            y: 0,
            duration: 0.82,
            ease: 'power3.out'
          },
          'glideAndRise+=0.22'
        );
      }

      if (heroStage) {
        tl.fromTo(
          heroStage,
          { opacity: 0, y: 72, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.92,
            ease: 'power3.out'
          },
          'glideAndRise+=0.30'
        );
      }

      if (whatsappBtn) {
        tl.fromTo(
          whatsappBtn,
          { opacity: 0, y: 28, scale: 0.88 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.62,
            ease: 'power3.out'
          },
          'glideAndRise+=0.44'
        );
      }
    }

    if (introLogo.complete && headerLogoImg.complete) {
      requestAnimationFrame(startChoreography);
    } else {
      var started = false;
      var triggerOnce = function () {
        if (started) return;
        started = true;
        requestAnimationFrame(startChoreography);
      };
      introLogo.addEventListener('load', triggerOnce, { once: true });
      setTimeout(triggerOnce, 220);
    }
  }

  /* 1. Header fijo + Menú móvil accesible */
  function initHeaderAndNav() {
    var header = document.getElementById('site-header');
    var navToggle = document.getElementById('nav-toggle');
    var primaryNav = document.getElementById('primary-nav');
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-list .nav-link'));
    var trackedSections = navLinks
      .map(function (link) {
        var href = link.getAttribute('href') || '';
        return SAFE_SECTION_HASH_RE.test(href) ? document.getElementById(href.slice(1)) : null;
      })
      .filter(Boolean);

    function updateHeaderOnScroll() {
      if (!header) return;
      header.classList.toggle('is-scrolled', window.scrollY > 24);

      if (!trackedSections.length) return;
      var scrollMark = window.scrollY + 140;
      var activeId = trackedSections[0].id;
      trackedSections.forEach(function (sec) {
        if (sec.offsetTop <= scrollMark) {
          activeId = sec.id;
        }
      });
      navLinks.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + activeId);
      });
    }

    window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });
    updateHeaderOnScroll();

    if (navToggle && primaryNav) {
      navToggle.addEventListener('click', function () {
        var expanded = navToggle.getAttribute('aria-expanded') === 'true';
        var nextState = !expanded;
        navToggle.setAttribute('aria-expanded', String(nextState));
        navToggle.setAttribute(
          'aria-label',
          nextState ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
        );
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

  /* 2. Animaciones de entrada escalonadas por scroll (Reveal Up) y contadores interactivos */
  function initAnimationsAndCounters() {
    var reducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* A. Desplazamiento vertical progresivo de componentes y textos al hacer scroll */
    var revealElements = Array.prototype.slice.call(
      document.querySelectorAll('.reveal-up, .clients-grid')
    );

    if (revealElements.length) {
      if (reducedMotion || typeof window.IntersectionObserver === 'undefined') {
        revealElements.forEach(function (el) {
          el.classList.add('is-revealed');
        });
      } else {
        var revealObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-revealed');
                revealObserver.unobserve(entry.target);
              }
            });
          },
          { rootMargin: '0px 0px -40px 0px', threshold: 0.08 }
        );

        revealElements.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.classList.add('is-revealed');
          } else {
            revealObserver.observe(el);
          }
        });
      }
    }

    /* B. Contadores numéricos interactivos */
    var counterEls = document.querySelectorAll('[data-counter-target]');

    counterEls.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-counter-target') || '23', 10);
      if (!Number.isFinite(target) || target <= 0) target = 23;
      if (reducedMotion || typeof window.IntersectionObserver === 'undefined') {
        el.textContent = String(target);
        return;
      }

      var animated = false;
      var obs = new IntersectionObserver(
        function (entries) {
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
        },
        { threshold: 0.35 }
      );

      obs.observe(el);
    });
  }

  /* 3. Selector interactivo de granulometría (Construcción DOM segura sin innerHTML) */
  function initGranulometrySelector() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.grain-tab'));
    var panel = document.getElementById('grain-panel');
    var badgeEl = document.getElementById('grain-active-badge');
    var titleEl = document.getElementById('grain-active-title');
    var summaryEl = document.getElementById('grain-active-summary');
    var descInmEl = document.getElementById('grain-app-desc-inm');
    var descPaisEl = document.getElementById('grain-app-desc-pais');
    var descAvicEl = document.getElementById('grain-app-desc-avic');
    var usesListEl = document.getElementById('grain-uses-list');
    var ctaLinkEl = document.getElementById('grain-cta-link');
    var measureReadout = document.getElementById('scale-measure-readout') || document.getElementById('scale-measure-Readout');
    var photoImg = document.getElementById('grain-photo-img');
    var photoBadge = document.getElementById('grain-photo-badge');
    var zoomBtn = document.getElementById('grain-zoom-btn');
    var svgRulerHighlight = document.getElementById('svg-ruler-highlight');

    if (!tabs.length || !panel) return;

    function activateGrain(grainKey) {
      if (!grainKey || !Object.prototype.hasOwnProperty.call(GRAIN_DATA, grainKey)) return;
      var data = GRAIN_DATA[grainKey];

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
      if (descInmEl && data.descInm) descInmEl.textContent = data.descInm;
      if (descPaisEl && data.descPais) descPaisEl.textContent = data.descPais;
      if (descAvicEl && data.descAvic) descAvicEl.textContent = data.descAvic;
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
        var fragment = document.createDocumentFragment();
        data.uses.forEach(function (useText) {
          var li = document.createElement('li');
          li.textContent = useText;
          fragment.appendChild(li);
        });
        while (usesListEl.firstChild) {
          usesListEl.removeChild(usesListEl.firstChild);
        }
        usesListEl.appendChild(fragment);
      }

      if (ctaLinkEl) {
        ctaLinkEl.setAttribute('data-grain-cta', data.title);
      }

      if (svgRulerHighlight) {
        svgRulerHighlight.setAttribute('x', String(data.rulerX));
        svgRulerHighlight.setAttribute('width', String(data.rulerWidth));
      }

      var scaleTrackFill = document.getElementById('scale-track-fill');
      if (scaleTrackFill && data.scalePercent) {
        scaleTrackFill.style.width = data.scalePercent;
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
        var selectedGrain = sanitizePlainText(ctaLinkEl.getAttribute('data-grain-cta') || '', 80, false);
        var msgInput = document.getElementById('mensaje');
        if (msgInput && selectedGrain && !msgInput.value.trim()) {
          msgInput.value = 'Solicito cotización de ' + selectedGrain + '. ';
        }
      });
    }

    if (zoomBtn && photoImg) {
      zoomBtn.addEventListener('click', function () {
        photoImg.classList.toggle('is-zoomed');
      });
    }

    /* Enlaces desde tarjetas de Aplicaciones con validación contra lista blanca */
    document.querySelectorAll('[data-select-sector]').forEach(function (link) {
      link.addEventListener('click', function () {
        var sectorVal = link.getAttribute('data-select-sector') || '';
        var sectorSelect = document.getElementById('sector');
        if (sectorSelect && ALLOWED_SECTORS.indexOf(sectorVal) !== -1) {
          sectorSelect.value = sectorVal;
        }
      });
    });
  }

  /* 4. Lightbox accesible para la galería Masonry con validación de ruta local */
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
      var src = btn.getAttribute('data-lightbox-src') || '';
      if (!SAFE_LOCAL_PROJECT_IMG_RE.test(src)) return;

      var caption = sanitizePlainText(btn.getAttribute('data-lightbox-caption') || '', 240, false);
      var thumbImg = btn.querySelector('img');
      var altText = thumbImg
        ? sanitizePlainText(thumbImg.getAttribute('alt') || caption, 240, false)
        : caption;

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

  /* 5. Mapa embebido gobernado por allowlist inmutable (previene inyección de URL en iframe) */
  function initMapEmbed() {
    var mapIframe = document.getElementById('office-map-iframe');
    var activeLabel = document.getElementById('map-active-label');
    var externalLink = document.getElementById('map-external-link');
    var mapTabs = Array.prototype.slice.call(document.querySelectorAll('.map-tab'));

    if (!mapIframe) return;

    mapTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var officeId = tab.getAttribute('data-office-id') || '';
        if (!Object.prototype.hasOwnProperty.call(ALLOWED_MAP_OFFICES, officeId)) return;

        var office = ALLOWED_MAP_OFFICES[officeId];
        var encodedQuery = encodeURIComponent(office.query);

        mapTabs.forEach(function (t) {
          t.classList.toggle('is-active', t === tab);
        });

        mapIframe.src = 'https://www.google.com/maps?q=' + encodedQuery + '&output=embed';
        if (activeLabel) activeLabel.textContent = office.label;
        if (externalLink) {
          externalLink.href = 'https://www.google.com/maps/search/?api=1&query=' + encodedQuery;
        }
      });
    });
  }

  /* 6. Slider / Carrusel interactivo de Profesionales (Touch, drag, teclado y botones) */
  function initProfessionalsSlider() {
    var wrapper = document.getElementById('prof-slider-wrapper');
    var trackWrap = document.getElementById('prof-slider-track-wrap');
    var track = document.getElementById('prof-slider-track');
    var prevBtn = document.getElementById('prof-slider-prev');
    var nextBtn = document.getElementById('prof-slider-next');
    var counterCurrent = document.getElementById('prof-counter-current');
    var counterTotal = document.getElementById('prof-counter-total');
    var dotsContainer = document.getElementById('prof-slider-dots');

    if (!wrapper || !trackWrap || !track) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll('.prof-slide'));
    var totalSlides = slides.length;
    if (totalSlides === 0) return;

    if (counterTotal) {
      counterTotal.textContent = totalSlides < 10 ? '0' + totalSlides : String(totalSlides);
    }

    var currentIndex = 0;
    var dots = [];

    if (dotsContainer) {
      while (dotsContainer.firstChild) {
        dotsContainer.removeChild(dotsContainer.firstChild);
      }
      var frag = document.createDocumentFragment();
      for (var i = 0; i < totalSlides; i++) {
        (function (idx) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'prof-slider-dot' + (idx === 0 ? ' is-active' : '');
          dot.setAttribute('role', 'tab');
          dot.setAttribute('aria-label', 'Ir al profesional ' + (idx + 1));
          dot.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
          dot.addEventListener('click', function () {
            scrollToIndex(idx);
          });
          dots.push(dot);
          frag.appendChild(dot);
        })(i);
      }
      dotsContainer.appendChild(frag);
    }

    function updateNavUI(activeIdx) {
      currentIndex = Math.max(0, Math.min(totalSlides - 1, activeIdx));

      if (counterCurrent) {
        var num = currentIndex + 1;
        counterCurrent.textContent = num < 10 ? '0' + num : String(num);
      }

      if (prevBtn) {
        prevBtn.disabled = currentIndex <= 0;
      }
      if (nextBtn) {
        nextBtn.disabled = currentIndex >= totalSlides - 1;
      }

      dots.forEach(function (dot, idx) {
        var isActive = idx === currentIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    function scrollToIndex(idx) {
      var targetIdx = Math.max(0, Math.min(totalSlides - 1, idx));
      var targetSlide = slides[targetIdx];
      if (!targetSlide) return;

      var offsetLeft = targetSlide.offsetLeft;
      trackWrap.scrollTo({
        left: offsetLeft,
        behavior: 'smooth'
      });
      updateNavUI(targetIdx);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        scrollToIndex(currentIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        scrollToIndex(currentIndex + 1);
      });
    }

    /* Seguimiento con debounce mediante scroll del contenedor */
    var scrollTimeout = null;
    trackWrap.addEventListener('scroll', function () {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function () {
        var scrollLeft = trackWrap.scrollLeft;
        var closestIdx = 0;
        var minDiff = Infinity;
        for (var i = 0; i < totalSlides; i++) {
          var diff = Math.abs(slides[i].offsetLeft - scrollLeft);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        }
        updateNavUI(closestIdx);
      }, 60);
    }, { passive: true });

    /* Navegación accesible por teclado */
    trackWrap.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      }
    });

    /* Soporte drag con cursor para mouse en desktop */
    var isDown = false;
    var startX = 0;
    var scrollStart = 0;

    trackWrap.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      isDown = true;
      trackWrap.classList.add('is-dragging');
      startX = e.pageX - trackWrap.offsetLeft;
      scrollStart = trackWrap.scrollLeft;
    });

    window.addEventListener('mouseup', function () {
      if (!isDown) return;
      isDown = false;
      trackWrap.classList.remove('is-dragging');
    });

    trackWrap.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - trackWrap.offsetLeft;
      var walk = (x - startX) * 1.3;
      trackWrap.scrollLeft = scrollStart - walk;
    });

    updateNavUI(0);
  }

  /* 7. Sliders horizontales de Participaciones Destacadas (Loop Infinito Automático) */
  function initParticipationSliders() {
    var animatedTracks = document.querySelectorAll('.part-ticker-animated');
    animatedTracks.forEach(function (track) {
      track.addEventListener('touchstart', function () {
        track.style.animationPlayState = 'paused';
      }, { passive: true });

      track.addEventListener('touchend', function () {
        track.style.animationPlayState = 'running';
      }, { passive: true });
    });
  }

  /* 8. Modal accesible de Política de Privacidad y Seguridad de la Información */
  function initPrivacyModal() {
    var modal = document.getElementById('privacy-modal');
    var backdrop = document.getElementById('privacy-modal-backdrop');
    var closeBtn = document.getElementById('privacy-modal-close');
    var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-open-privacy]'));

    if (!modal || !triggers.length) return;

    var lastTrigger = null;

    function openModal(e) {
      if (e) e.preventDefault();
      lastTrigger = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = '';
      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        lastTrigger.focus();
      }
    }

    triggers.forEach(function (btn) {
      btn.addEventListener('click', openModal);
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (!modal.hidden && e.key === 'Escape') {
        e.preventDefault();
        closeModal();
      }
    });
  }

  /* 7. Validación estricta del formulario + Anti-Bot + Rate Limiting + Consentimiento (OWASP ASVS V5 / SOC 2) */
  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var formMountedAt = Date.now();
    var lastSubmitAt = 0;
    var SUBMIT_COOLDOWN_MS = 15000;
    var MIN_HUMAN_FILL_MS = 1200;

    var honeypotInput = document.getElementById('website_url');

    var fields = {
      nombre: {
        input: document.getElementById('nombre'),
        error: document.getElementById('error-nombre'),
        validate: function (val) {
          var clean = sanitizePlainText(val, 150, false);
          if (!clean) return 'Por favor, ingresa tu nombre completo.';
          if (clean.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
          if (clean.length > 100) return 'El nombre no debe exceder 100 caracteres.';
          return '';
        }
      },
      empresa: {
        input: document.getElementById('empresa'),
        error: document.getElementById('error-empresa'),
        validate: function (val) {
          var clean = sanitizePlainText(val, 160, false);
          if (!clean) return 'Por favor, indica el nombre de tu empresa o proyecto.';
          if (clean.length < 2) return 'Ingresa al menos 2 caracteres.';
          if (clean.length > 120) return 'El campo empresa no debe exceder 120 caracteres.';
          return '';
        }
      },
      sector: {
        input: document.getElementById('sector'),
        error: document.getElementById('error-sector'),
        validate: function (val) {
          if (!val || ALLOWED_SECTORS.indexOf(val) === -1) {
            return 'Selecciona un sector válido de la lista.';
          }
          return '';
        }
      },
      toneladas: {
        input: document.getElementById('toneladas'),
        error: document.getElementById('error-toneladas'),
        validate: function (val) {
          var num = parseFloat(val);
          if (!val || !Number.isFinite(num) || num < 0.5 || num > 100000) {
            return 'Ingresa una cantidad válida entre 0.5 y 100,000 toneladas.';
          }
          return '';
        }
      },
      mensaje: {
        input: document.getElementById('mensaje'),
        error: document.getElementById('error-mensaje'),
        validate: function (val) {
          var clean = sanitizePlainText(val, 1200, true);
          if (!clean) return 'Por favor, escribe los detalles de tu requerimiento.';
          if (clean.length < 10) return 'Detalla un poco más tu consulta (mínimo 10 caracteres).';
          if (clean.length > 1000) return 'El mensaje no debe exceder 1,000 caracteres.';
          return '';
        }
      },
      privacidad: {
        input: document.getElementById('privacidad-consent'),
        error: document.getElementById('error-privacidad'),
        validate: function () {
          var cb = document.getElementById('privacidad-consent');
          if (cb && !cb.checked) {
            return 'Debes aceptar la Política de Privacidad y Seguridad para continuar.';
          }
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
      var eventName = item.input.type === 'checkbox' ? 'change' : 'input';
      item.input.addEventListener(eventName, function () {
        validateSingleField(key);
      });
      item.input.addEventListener('blur', function () {
        validateSingleField(key);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      /* Bloqueo silencioso de bots automatizados (honeypot o envío instantáneo no humano) */
      if (honeypotInput && honeypotInput.value.trim() !== '') {
        return;
      }
      var now = Date.now();
      if (now - formMountedAt < MIN_HUMAN_FILL_MS) {
        return;
      }
      if (lastSubmitAt > 0 && now - lastSubmitAt < SUBMIT_COOLDOWN_MS) {
        var msgErrorEl = fields.privacidad && fields.privacidad.error;
        if (msgErrorEl) {
          msgErrorEl.textContent = 'Por seguridad, espera unos segundos antes de enviar otra solicitud.';
        }
        return;
      }

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

      lastSubmitAt = now;

      var nombre = sanitizePlainText(fields.nombre.input.value, 100, false);
      var empresa = sanitizePlainText(fields.empresa.input.value, 120, false);
      var sector = fields.sector.input.value;
      var toneladas = String(parseFloat(fields.toneladas.input.value));
      var mensaje = sanitizePlainText(fields.mensaje.input.value, 1000, true);

      var textLines = [
        'Hola Perú Conchuela, solicito una cotización desde peruconchuela.com:',
        '• Nombre: ' + nombre,
        '• Empresa / Proyecto: ' + empresa,
        '• Sector: ' + sector,
        '• Cantidad estimada: ' + toneladas + ' toneladas',
        '• Mensaje: ' + mensaje
      ].join('\n');

      var whatsappPrefix = 'https://wa.me/51935373326?text=';
      var whatsappUrl = whatsappPrefix + encodeURIComponent(textLines);
      var mailSubject = sanitizePlainText(
        'Solicitud de cotización - ' + empresa + ' (' + sector + ')',
        160,
        false
      );
      var mailtoUrl =
        'mailto:contactos@peruconchuela.com?subject=' +
        encodeURIComponent(mailSubject) +
        '&body=' +
        encodeURIComponent(textLines);

      var feedbackBox = document.getElementById('form-feedback');
      var mailtoLink = document.getElementById('feedback-mailto-link');
      if (mailtoLink && mailtoUrl.indexOf('mailto:contactos@peruconchuela.com?') === 0) {
        mailtoLink.href = mailtoUrl;
      }
      if (feedbackBox) feedbackBox.hidden = false;

      if (whatsappUrl.indexOf(whatsappPrefix) === 0) {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    });
  }

  function initAll() {
    enforceExternalLinkSafety();
    initInteractivePreloader();
    initHeaderAndNav();
    initAnimationsAndCounters();
    initGranulometrySelector();
    initLightbox();
    initMapEmbed();
    initProfessionalsSlider();
    initParticipationSliders();
    initPrivacyModal();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
