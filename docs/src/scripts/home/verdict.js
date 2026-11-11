// the heading's marks draw themselves once, the first time the heading is well inside the screen:
// the scribble through "wrong", then the two lines under "right". where motion is unwelcome they
// are left as they arrive, already drawn

export function mountVerdict(heading) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
  heading.classList.add('will-draw');
  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) { return; }
    io.disconnect();
    // held back gives way to drawn, so each mark runs from the one state to the other
    heading.classList.replace('will-draw', 'is-drawn');
  }, { threshold: 1, rootMargin: '0px 0px -12% 0px' });
  io.observe(heading);
}
