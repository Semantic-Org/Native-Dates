export function mountVerdict(heading) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
  // hide SVG strokes only after JS mounts with motion enabled so static and reduced-motion views stay drawn
  heading.classList.add('will-draw');
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) { return; }
    io.disconnect();
    heading.classList.replace('will-draw', 'is-drawn');
  }, { threshold: 1, rootMargin: '0px 0px -12% 0px' });
  io.observe(heading);
}
