/**
 * PERÚ CONCHUELA (peruconchuela.com) — Recorrido por Scroll con Video
 * Sincroniza la secuencia narrativa de videos en /assets/video/ con GSAP + ScrollTrigger (scrub: 0.6).
 * Incluye fallbacks para prefers-reduced-motion, móviles de gama baja y errores de red.
 */
(function () {
  'use strict';

  /* CAMBIAR SECUENCIA DE VIDEOS, POSTERS O ETIQUETAS DE ETAPA AQUÍ (Extraídos en 1080p desde PeruConchuela_recorrido_1080p.mp4) */
  var CLIPS_CONFIG = [
    {
      id: 'hero-video-0',
      src: 'assets/video/01-excavacion.mp4',
      poster: 'assets/img/posters/01-excavacion.webp',
      stageLabel: '01 / 03 · Cantera',
      defaultDuration: 10.80
    },
    {
      id: 'hero-video-1',
      src: 'assets/video/02-concha-fosil.mp4',
      poster: 'assets/img/posters/02-concha-fosil.webp',
      stageLabel: '02 / 03 · Hace 11 millones de años',
      defaultDuration: 7.40
    },
    {
      id: 'hero-video-2',
      src: 'assets/video/03-proyecto-paisajismo.mp4',
      poster: 'assets/img/posters/03-proyecto-paisajismo.webp',
      stageLabel: '03 / 03 · De la mina a tu proyecto',
      defaultDuration: 11.45
    }
  ];

  function shouldUseStaticFallback() {
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return true;

    var nav = window.navigator || {};
    var lowCores = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2;
    var lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2;
    var saveData = nav.connection && nav.connection.saveData === true;

    return Boolean(lowCores || lowMemory || saveData);
  }

  function seekVideoFrame(videoEl, targetTime) {
    if (!videoEl || videoEl.dataset.failed === 'true') return;
    if (videoEl.readyState < 1) return;

    var duration = Number.isFinite(videoEl.duration) && videoEl.duration > 0
      ? videoEl.duration
      : parseFloat(videoEl.dataset.fallbackDuration || '5');

    var clamped = Math.max(0, Math.min(targetTime, Math.max(0, duration - 0.04)));
    if (Math.abs(videoEl.currentTime - clamped) < 0.02) return;

    try {
      if (typeof videoEl.fastSeek === 'function') {
        videoEl.fastSeek(clamped);
      } else {
        videoEl.currentTime = clamped;
      }
    } catch (err) {
      /* Fallback silencioso mostrando el poster del contenedor */
    }
  }

  function initHeroScrollVideo() {
    var heroSection = document.getElementById('inicio');
    var heroViewport = document.getElementById('hero-viewport');
    if (!heroSection || !heroViewport) return;

    var clipLayers = Array.prototype.slice.call(heroSection.querySelectorAll('.hero-clip-layer'));
    var chapters = Array.prototype.slice.call(heroSection.querySelectorAll('.hero-chapter'));
    var progressBar = document.getElementById('scroll-progress-bar');
    var progressPct = document.getElementById('scroll-progress-pct');
    var stageLabel = document.getElementById('scroll-stage-label');

    var videos = CLIPS_CONFIG.map(function (cfg) {
      var el = document.getElementById(cfg.id);
      if (el) {
        el.dataset.fallbackDuration = String(cfg.defaultDuration);
        el.muted = true;
        el.playsInline = true;

        /* Fallback individual si un clip falla al cargar */
        var handleVideoError = function () {
          el.dataset.failed = 'true';
          el.classList.add('is-hidden-video');
        };
        el.addEventListener('error', handleVideoError);
        var sourceEl = el.querySelector('source');
        if (sourceEl) {
          sourceEl.addEventListener('error', handleVideoError);
        }
      }
      return el;
    });

    /* Si aplica fallback de movimiento reducido o gama baja: mostrar poster y textos sin scrub */
    if (shouldUseStaticFallback() || typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
      heroSection.classList.add('is-static-mode');
      videos.forEach(function (v) {
        if (v) v.classList.add('is-hidden-video');
      });
      if (progressBar) progressBar.style.width = '100%';
      if (progressPct) progressPct.textContent = 'Modo estático';
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    /* Precargar los clips 2 y 3 de forma diferida cuando el usuario inicia el recorrido */
    var secondaryPreloaded = false;
    function preloadRemainingClips() {
      if (secondaryPreloaded) return;
      secondaryPreloaded = true;
      videos.slice(1).forEach(function (v) {
        if (v && v.dataset.failed !== 'true' && v.preload !== 'auto') {
          v.preload = 'auto';
          try {
            v.load();
          } catch (e) {}
        }
      });
    }

    var activeIndex = -1;

    function updateSceneByProgress(globalProgress) {
      var totalClips = CLIPS_CONFIG.length;
      var scaled = Math.min(totalClips - 0.0001, Math.max(0, globalProgress * totalClips));
      var clipIdx = Math.floor(scaled);
      var localProgress = scaled - clipIdx;

      if (globalProgress > 0.03) {
        preloadRemainingClips();
      }

      if (clipIdx !== activeIndex) {
        activeIndex = clipIdx;
        clipLayers.forEach(function (layer, idx) {
          layer.classList.toggle('is-active', idx === clipIdx);
        });
        chapters.forEach(function (ch, idx) {
          ch.classList.toggle('is-active', idx === clipIdx);
        });
        if (stageLabel && CLIPS_CONFIG[clipIdx]) {
          stageLabel.textContent = CLIPS_CONFIG[clipIdx].stageLabel;
        }
      }

      var currentVideo = videos[clipIdx];
      if (currentVideo && currentVideo.dataset.failed !== 'true') {
        var dur = Number.isFinite(currentVideo.duration) && currentVideo.duration > 0
          ? currentVideo.duration
          : CLIPS_CONFIG[clipIdx].defaultDuration;
        seekVideoFrame(currentVideo, localProgress * dur);
      }

      var pct = Math.round(globalProgress * 100);
      if (progressBar) progressBar.style.width = pct + '%';
      if (progressPct) progressPct.textContent = pct + '%';
    }

    /* Pin de pantalla completa y scrub suavizado (scrub: 0.6) */
    window.ScrollTrigger.create({
      trigger: heroSection,
      start: 'top top',
      end: '+=280%',
      pin: heroViewport,
      scrub: 0.6,
      anticipatePin: 1,
      onUpdate: function (self) {
        updateSceneByProgress(self.progress);
      }
    });

    updateSceneByProgress(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroScrollVideo);
  } else {
    initHeroScrollVideo();
  }
})();

