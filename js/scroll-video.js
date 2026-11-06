/**
 * PERÚ CONCHUELA (peruconchuela.com) — Recorrido Minimalista por Scroll con Video
 * Sincroniza assets/video/scroll-video.mp4 (SCROLLVIDEO.mp4 optimizado con keyframes densos)
 * mediante GSAP + ScrollTrigger sobre fondo blanco puro (#FFFFFF).
 */
(function () {
  'use strict';

  var DEFAULT_DURATION = 7.83;

  function prefersReducedMotion() {
    return Boolean(
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  function initHeroScrollVideo() {
    var heroSection = document.getElementById('inicio');
    var heroViewport = document.getElementById('hero-viewport');
    var stageEl = document.getElementById('hero-media-stage');
    var videoEl = document.getElementById('hero-scroll-video');

    if (!heroSection || !heroViewport || !videoEl) return;

    videoEl.muted = true;
    videoEl.playsInline = true;

    var videoFailed = false;
    var handleVideoError = function () {
      videoFailed = true;
      videoEl.classList.add('is-hidden-video');
    };

    videoEl.addEventListener('error', handleVideoError);
    var sourceEl = videoEl.querySelector('source');
    if (sourceEl) {
      sourceEl.addEventListener('error', handleVideoError);
    }

    if (
      prefersReducedMotion() ||
      typeof window.gsap === 'undefined' ||
      typeof window.ScrollTrigger === 'undefined'
    ) {
      heroSection.classList.add('is-static-mode');
      return;
    }

    window.gsap.registerPlugin(window.ScrollTrigger);

    try {
      if (window.ScrollTrigger.clearScrollMemory) {
        window.ScrollTrigger.clearScrollMemory();
      }
    } catch (e) {}

    /* Desbloqueo inicial del decodificador en navegadores móviles/escritorio */
    function primeVideoDecoder() {
      if (videoFailed) return;
      try {
        videoEl.currentTime = 0.001;
      } catch (e) {}
    }

    if (videoEl.readyState >= 1) {
      primeVideoDecoder();
    } else {
      videoEl.addEventListener('loadedmetadata', primeVideoDecoder, { once: true });
      try {
        videoEl.load();
      } catch (e) {}
    }

    /* Cola sin bloqueos para seek exacto cuadro a cuadro */
    var targetTime = 0;
    var pendingSeek = false;

    function flushSeek() {
      if (videoFailed || videoEl.readyState < 1) return;
      if (videoEl.seeking) {
        pendingSeek = true;
        return;
      }
      pendingSeek = false;
      if (Math.abs(videoEl.currentTime - targetTime) > 0.012) {
        try {
          videoEl.currentTime = targetTime;
        } catch (err) {}
      }
    }

    videoEl.addEventListener('seeked', function () {
      if (pendingSeek) {
        flushSeek();
      }
    });

    function updateHeroByProgress(progress) {
      var clampedProgress = Math.max(0, Math.min(1, progress));

      if (!videoFailed) {
        var dur =
          Number.isFinite(videoEl.duration) && videoEl.duration > 0
            ? videoEl.duration
            : DEFAULT_DURATION;
        targetTime = Math.max(0, Math.min(clampedProgress * dur, Math.max(0, dur - 0.03)));
        flushSeek();
      }

      /* Sombra suave progresiva cuando el video pasa del fondo blanco inicial al espacio arquitectónico */
      if (stageEl) {
        var shadowAlpha = clampedProgress > 0.3 ? Math.min(1, (clampedProgress - 0.3) / 0.25) : 0;
        stageEl.style.setProperty('--capsule-shadow-alpha', shadowAlpha.toFixed(3));
      }
    }

    var heroTrigger = window.ScrollTrigger.create({
      trigger: heroSection,
      start: 'top top',
      end: '+=210%',
      pin: heroViewport,
      pinSpacing: true,
      invalidateOnRefresh: true,
      scrub: 0.35,
      anticipatePin: 1,
      onUpdate: function (self) {
        updateHeroByProgress(self.progress);
      }
    });

    /* Resincronización robusta ante cambio de pestaña, inactividad prolongada o regreso al viewport */
    function handleVisibilityOrFocus() {
      if (!document.hidden) {
        try {
          if (window.ScrollTrigger) {
            window.ScrollTrigger.refresh();
          }
        } catch (e) {}
        primeVideoDecoder();
        if (heroTrigger) {
          updateHeroByProgress(heroTrigger.progress);
        } else if (window.scrollY <= 15) {
          updateHeroByProgress(0);
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('pageshow', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    /* Garantía de cuadro cero si se retorna al tope del scroll */
    window.addEventListener(
      'scroll',
      function () {
        if (window.scrollY <= 5 && heroTrigger && heroTrigger.progress !== 0) {
          updateHeroByProgress(0);
        }
      },
      { passive: true }
    );

    updateHeroByProgress(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroScrollVideo);
  } else {
    initHeroScrollVideo();
  }
})();
