(() => {
  const carousel = document.querySelector('.hero-carousel');
  if (!carousel) return;
  const track = carousel.querySelector('.hero-carousel-track');
  const slides = [...track.children];
  const status = carousel.querySelector('.hero-carousel-status');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  const move = (direction) => {
    const next = (current + direction + slides.length) % slides.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  };
  carousel.querySelector('.hero-carousel-prev').addEventListener('click', () => move(-1));
  carousel.querySelector('.hero-carousel-next').addEventListener('click', () => move(1));
  track.addEventListener('keydown', (event) => {
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
