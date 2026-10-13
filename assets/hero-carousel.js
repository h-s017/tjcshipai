(() => {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.hero-carousel-track');
  const slides = [...track.children];
  const status = carousel.querySelector('.hero-carousel-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let pointerStart = null;
  let wasDragged = false;
  slides.forEach(slide => { slide.querySelector('img').draggable = false; });
  const move = (direction) => {
    const next = (current + direction + slides.length) % slides.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  };
  carousel.querySelector('.hero-carousel-prev').addEventListener('click', () => move(-1));
  carousel.querySelector('.hero-carousel-next').addEventListener('click', () => move(1));
  track.addEventListener('pointerdown', event => {
    pointerStart = { x: event.clientX, y: event.clientY };
    wasDragged = false;
  });
  track.addEventListener('pointermove', event => {
    if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 10) wasDragged = true;
  });
  track.addEventListener('pointercancel', () => { wasDragged = true; });
  track.addEventListener('click', event => {
    if (wasDragged) return;
    const bounds = track.getBoundingClientRect();
    move(event.clientX < bounds.left + bounds.width / 2 ? -1 : 1);
  });
  track.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      move(1);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  track.addEventListener('scroll', () => {
    current = Math.round(track.scrollLeft / track.clientWidth);
    status.textContent = `${current + 1} / ${slides.length}`;
  }, { passive: true });
  new ResizeObserver(() => {
    track.scrollTo({ left: current * track.clientWidth, behavior: 'instant' });
  }).observe(track);
})();
