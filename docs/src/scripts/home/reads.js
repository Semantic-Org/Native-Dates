import { ui } from '../strings.js';

const SPEED = 28;
const RESUME_DELAY = 1500;

export function mountReads(root) {
  const toggleBtn = root.querySelector('[data-reads-toggle]');
  const drawer = root.querySelector('#reads-prompt-drawer');
  const promptEl = root.querySelector('#agent-read-prompt');
  const rail = root.querySelector('[data-reads-rail]');
  const track = root.querySelector('[data-reads-track]');
  const sets = root.querySelectorAll('[data-reads-set]');
  const prevBtn = root.querySelector('[data-reads-prev]');
  const nextBtn = root.querySelector('[data-reads-next]');

  root.querySelectorAll('[data-reads-copy]').forEach((btn) => {
    const label = btn.querySelector('[data-reads-copy-label]');
    let timer;
    btn.addEventListener('click', async () => {
      const text = promptEl?.textContent?.trim() ?? '';
      try {
        await navigator.clipboard.writeText(text);
      }
      catch {}
      clearTimeout(timer);
      btn.dataset.copied = '';
      if (label) { label.textContent = ui('page.copied'); }
      timer = setTimeout(() => {
        delete btn.dataset.copied;
        if (label) { label.textContent = ui('home.reads.copy'); }
      }, 1400);
    });
  });

  let drawerOpen = false;
  toggleBtn?.addEventListener('click', () => {
    if (!drawer) { return; }
    drawerOpen = drawer.hidden;
    drawer.hidden = !drawerOpen;
    toggleBtn.setAttribute('aria-expanded', String(drawerOpen));
  });

  const dialog = root.querySelector('[data-jev-dialog]');
  let dialogOpen = false;
  let returnFocus = null;
  if (dialog) {
    const closeBtn = dialog.querySelector('[data-jev-close]');
    const tablist = dialog.querySelector('[data-jev-tabs]');
    const tabs = [...dialog.querySelectorAll('[data-jev-tab]')];
    const panels = [...dialog.querySelectorAll('[data-jev-panel]')];
    const copyBtn = dialog.querySelector('[data-jev-copy]');
    const copyLabel = copyBtn?.querySelector('[data-jev-copy-label]');
    const defaultCopyText = copyLabel?.textContent ?? 'Copy';
    let copyTimer;

    const resetCopy = () => {
      clearTimeout(copyTimer);
      if (copyBtn) { delete copyBtn.dataset.copied; }
      if (copyLabel) { copyLabel.textContent = defaultCopyText; }
    };

    const selectTab = (id) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.jevTab === id;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.jevPanel !== id;
      });
      resetCopy();
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => selectTab(tab.dataset.jevTab));
    });

    tablist?.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) { return; }
      const moves = {
        ArrowRight: (i + 1) % tabs.length,
        ArrowLeft: (i - 1 + tabs.length) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      };
      if (!(e.key in moves)) { return; }
      e.preventDefault();
      const next = tabs[moves[e.key]];
      next.focus();
      selectTab(next.dataset.jevTab);
    });

    copyBtn?.addEventListener('click', async () => {
      const activePanel = panels.find((panel) => !panel.hidden);
      const text = activePanel?.dataset.raw ?? activePanel?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(text.trim());
      }
      catch {}
      clearTimeout(copyTimer);
      copyBtn.dataset.copied = '';
      if (copyLabel) { copyLabel.textContent = ui('page.copied'); }
      copyTimer = setTimeout(resetCopy, 1400);
    });

    root.querySelectorAll('[data-jev-open]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        if (dialog.open) { return; }
        // return focus to the accessible card in the primary set when a cloned card is clicked
        returnFocus = trigger.closest('[aria-hidden="true"]')
          ? root.querySelector('[data-reads-set]:not([aria-hidden]) [data-jev-open]')
          : trigger;
        dialogOpen = true;
        dialog.showModal();
      });
    });

    closeBtn?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) { dialog.close(); }
    });
    dialog.addEventListener('close', () => {
      dialogOpen = false;
      resetCopy();
      returnFocus?.focus({ preventScroll: true });
      returnFocus = null;
    });
  }

  if (!track || sets.length < 2) { return; }

  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedQuery.matches;
  let loopWidth = 0;
  let pos = track.scrollLeft;
  let applied = pos;
  let inView = false;
  let hovered = false;
  let focused = false;
  let pointerDown = false;
  let resumeAt = 0;
  let rafId = 0;
  let lastTime = 0;

  const measure = () => {
    loopWidth = sets[1].offsetLeft - sets[0].offsetLeft;
  };

  // track last written scrollLeft so async scroll events from RAF do not look like manual scrolling
  const apply = (next) => {
    pos = next;
    track.scrollLeft = pos;
    applied = track.scrollLeft;
  };

  const syncPos = () => {
    pos = track.scrollLeft;
    applied = pos;
  };

  const pauseBriefly = () => {
    resumeAt = performance.now() + RESUME_DELAY;
  };

  const tick = (now) => {
    rafId = 0;
    if (!inView || reduced) { return; }
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
    lastTime = now;
    const active = !hovered && !focused && !pointerDown && !drawerOpen && !dialogOpen && now >= resumeAt && loopWidth > 0;
    if (active && dt > 0) {
      let next = pos + SPEED * dt;
      if (next >= loopWidth) { next -= loopWidth; }
      apply(next);
    }
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId || !inView || reduced) { return; }
    syncPos();
    lastTime = 0;
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!rafId) { return; }
    cancelAnimationFrame(rafId);
    rafId = 0;
    lastTime = 0;
  };

  const step = (dir) => {
    measure();
    pauseBriefly();
    const card = track.querySelector('.reads-col');
    const amount = card ? card.getBoundingClientRect().width + 14 : 380;
    if (loopWidth > 0) {
      if (dir < 0 && track.scrollLeft < amount) {
        apply(track.scrollLeft + loopWidth);
      }
      else if (dir > 0 && track.scrollLeft >= loopWidth) {
        apply(track.scrollLeft - loopWidth);
      }
    }
    const behavior = reduced ? 'auto' : 'smooth';
    track.scrollBy({ left: dir * amount, behavior });
  };

  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));

  track.addEventListener('wheel', pauseBriefly, { passive: true });
  track.addEventListener('scroll', () => {
    const current = track.scrollLeft;
    if (Math.abs(current - applied) <= 1.5) { return; }
    const forward = current > pos;
    pos = current;
    applied = current;
    pauseBriefly();
    if (forward && loopWidth > 0 && pos >= loopWidth) {
      apply(pos - loopWidth);
    }
  }, { passive: true });

  rail?.addEventListener('pointerenter', () => { hovered = true; });
  rail?.addEventListener('pointerleave', () => {
    hovered = false;
    syncPos();
  });
  rail?.addEventListener('focusin', () => { focused = true; });
  rail?.addEventListener('focusout', (e) => {
    if (!rail.contains(e.relatedTarget)) {
      focused = false;
      syncPos();
    }
  });
  track.addEventListener('pointerdown', () => { pointerDown = true; });
  const endPointer = () => {
    if (!pointerDown) { return; }
    pointerDown = false;
    syncPos();
    pauseBriefly();
  };
  addEventListener('pointerup', endPointer);
  addEventListener('pointercancel', endPointer);

  new ResizeObserver(measure).observe(track);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) {
      measure();
      start();
    }
    else {
      stop();
    }
  }, { threshold: 0.05 }).observe(rail ?? track);

  reducedQuery.addEventListener('change', (e) => {
    reduced = e.matches;
    if (reduced) { stop(); }
    else { start(); }
  });

  measure();
}
