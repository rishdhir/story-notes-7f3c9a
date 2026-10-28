(() => {
  'use strict';
  const cards = [...document.querySelectorAll('#films .film')];
  if (!cards.length) return;
  const items = cards.map(card => ({
    title: card.querySelector('h3').textContent,
    src: card.querySelector('source').dataset.src,
    poster: card.querySelector('video').poster,
    trigger: card.querySelector('.video-start')
  }));
  const icons = {
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    up: '<path d="m6 14 6-6 6 6"/>', down: '<path d="m6 10 6 6 6-6"/>',
    play: '<path d="m9 5 11 7-11 7Z"/>', pause: '<path d="M8 5v14M16 5v14"/>',
    sound: '<path d="m11 5-6 4H2v6h3l6 4ZM15 8q5 4 0 8M18 5q8 7 0 14"/>',
    mute: '<path d="m11 5-6 4H2v6h3l6 4ZM16 9l6 6M22 9l-6 6"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  const button = (action, label, symbol) => `<button type="button" class="reel-button reel-glass" data-reel="${action}" aria-label="${label}">${icon(symbol)}</button>`;
  const dialog = document.createElement('dialog');
  dialog.id = 'reel-dialog';
  dialog.setAttribute('aria-label', 'Erica Wise videos');
  dialog.innerHTML = `<div class="reel-shell"><div class="reel-feed" tabindex="0" aria-label="Swipe up or down to change video"></div><div class="reel-top"><div class="reel-identity"><strong>Erica Wise</strong><small>London</small></div>${button('close','Close viewer','close')}</div><div class="reel-bottom"><h2 id="reel-title" aria-live="polite"></h2><div class="reel-controls">${button('play','Pause video','pause')}<input class="reel-seek" type="range" min="0" max="1000" value="0" aria-label="Video progress">${button('sound','Mute sound','sound')}</div></div><nav class="reel-navigation" aria-label="Browse videos">${button('previous','Previous video','up')}${button('next','Next video','down')}</nav><p class="reel-status" role="status"></p></div>`;
  const shell = dialog.querySelector('.reel-shell');
  const orbit = document.createElement('div'); orbit.className = 'reel-orbit';
  const preview = (direction, label) => {
    const b = document.createElement('button'); b.type = 'button';
    b.className = `reel-preview reel-preview-${direction}`;
    b.innerHTML = `<img alt=""><span class="reel-preview-lens" aria-hidden="true"></span><span class="reel-preview-caption"><small>${label}</small><strong></strong></span>`;
    return b;
  };
  const before = preview('before', 'Previous'), after = preview('after', 'Next');
  orbit.append(before, shell, after); dialog.append(orbit);
  const surround = document.createElement('div');
  surround.className = 'reel-surround';
  surround.setAttribute('aria-hidden', 'true');
  dialog.prepend(surround);
  document.body.append(dialog);
  const mainNav = document.querySelector('.glass-nav');
  const navHome = document.createComment('Main navigation position');
  mainNav?.before(navHome);
  function dockNavigation() {
    if (!mainNav) return;
    dialog.append(mainNav);
    mainNav.classList.add('reel-nav-docked');
  }
  function restoreNavigation() {
    if (!mainNav) return;
    navHome.after(mainNav);
    mainNav.classList.remove('reel-nav-docked');
  }
  mainNav?.querySelectorAll('a:not([href="#films"])').forEach(link => {
    link.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (dialog.open) { dialog.close(); restoreNavigation(); }
      if (link.hash === '#top') {
        e.preventDefault();
        history.pushState(null, '', '#top');
        window.scrollTo({top: 0, behavior: reduced() ? 'instant' : 'smooth'});
      }
    });
  });
  const feed = dialog.querySelector('.reel-feed');
  const control = name => dialog.querySelector(`[data-reel="${name}"]`);
  const title = dialog.querySelector('#reel-title');
  const seek = dialog.querySelector('.reel-seek');
  const status = dialog.querySelector('.reel-status');
  const media = items.map(item => {
    const slide = document.createElement('div'); slide.className = 'reel-slide';
    const video = document.createElement('video');
    video.playsInline = true; video.loop = false; video.preload = 'none';
    video.poster = item.poster; video.setAttribute('aria-label', item.title);
    slide.append(video); feed.append(slide); return video;
  });
  // Poster-only boundary slides allow a continuous swipe through either end.
  const boundary = item => {
    const slide = document.createElement('div'); slide.className = 'reel-slide reel-boundary';
    slide.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img'); img.src = item.poster; img.alt = '';
    slide.append(img); return slide;
  };
  feed.prepend(boundary(items.at(-1))); feed.append(boundary(items[0]));
  const wrap = index => (index + items.length) % items.length;
  let active = -1, opener = null, muted = false, scrollTimer, wheelLocked = false, wheelTimer, wheelAmount = 0;
  let glassSurfaces = [];
  const transparency = window.matchMedia('(prefers-reduced-transparency: reduce)');
  const highContrast = window.matchMedia('(prefers-contrast: more)');
  function clearGlass() { glassSurfaces.forEach(g => g.destroy()); glassSurfaces = []; }
  function configureViewerGlass() {
    clearGlass();
    if (!dialog.open || !window.liquidGlass || transparency.matches || highContrast.matches) return;
    // Backdrop refraction only: the central video is never a filter target.
    const targets = [surround, orbit, ...dialog.querySelectorAll('.reel-preview-lens,.reel-glass')];
    glassSurfaces = targets.map(el => window.liquidGlass(el, {
      scale: el === surround ? -40 : el === orbit ? -80 : el.classList.contains('reel-preview-lens') ? -45 : -24,
      chroma: el === surround ? 1 : 2, border: el === surround ? .025 : .055,
      mapBlur: 7, blur: 0, saturate: 1.06, fallbackBlur: 0
    }));
  }
  [transparency, highContrast].forEach(m => m.addEventListener('change', configureViewerGlass));
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function syncControls() {
    const v = media[active]; if (!v) return;
    control('play').innerHTML = icon(v.paused ? 'play' : 'pause');
    control('play').setAttribute('aria-label', v.paused ? 'Play video' : 'Pause video');
    control('sound').innerHTML = icon(muted ? 'mute' : 'sound');
    control('sound').setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  }
  function play(v) {
    if (!dialog.open || document.hidden || media[active] !== v) return;
    status.textContent = '';
    v.play().catch(() => {
      if (dialog.open && media[active] === v) { status.textContent = 'Tap play to watch'; syncControls(); }
    });
  }
  function activate(index) {
    if (index < 0 || index >= media.length || !dialog.open) return;
    active = index;
    media.forEach((v, i) => { if (i !== index) v.pause(); });
    const v = media[index];
    if (!v.getAttribute('src')) { v.src = items[index].src; v.load(); }
    v.currentTime = 0;
    v.muted = muted;
    title.textContent = items[index].title;
    seek.value = 0;
    [[before, wrap(index - 1), 'Previous'], [after, wrap(index + 1), 'Next']].forEach(([button, i, label]) => {
      button.querySelector('img').src = items[i].poster;
      button.querySelector('strong').textContent = items[i].title;
      button.setAttribute('aria-label', `${label}: ${items[i].title}`);
    });
    play(v); syncControls();
  }
  function move(delta) {
    if (active < 0) return;
    media[active]?.pause();
    feed.scrollTo({ top: (active + 1 + delta) * feed.clientHeight, behavior: reduced() ? 'instant' : 'smooth' });
  }
  function open(index, trigger = items[index]?.trigger) {
    if (index < 0) return;
    opener = trigger;
    document.querySelectorAll('video').forEach(v => v.pause());
    document.body.classList.add('reel-open');
    dockNavigation();
    dialog.showModal();
    configureViewerGlass();
    feed.scrollTop = (index + 1) * feed.clientHeight;
    activate(index); control('close').focus({preventScroll:true});
  }
  function togglePlay() { const v = media[active]; if (v) { if (v.paused) play(v); else v.pause(); } }
  document.addEventListener('open-reel', e => open(items.findIndex(i => i.trigger === e.detail.button)));
  cards.forEach((card, i) => card.querySelector('video').addEventListener('click', () => open(i)));
  document.querySelectorAll('.glass-nav a[href="#films"]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
    link.addEventListener('click', e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      open(0, link);
    });
  });
  control('close').addEventListener('click', () => dialog.close());
  control('previous').addEventListener('click', () => move(-1));
  control('next').addEventListener('click', () => move(1));
  before.addEventListener('click', () => move(-1));
  after.addEventListener('click', () => move(1));
  control('play').addEventListener('click', togglePlay);
  control('sound').addEventListener('click', () => { muted = !muted; media[active].muted = muted; syncControls(); });
  seek.addEventListener('input', () => { const v = media[active]; if (Number.isFinite(v?.duration)) v.currentTime = Number(seek.value) / 1000 * v.duration; });
  media.forEach((v, index) => {
    v.addEventListener('click', togglePlay);
    v.addEventListener('ended', () => {
      if (dialog.open && !document.hidden && index === active) move(1);
    });
    ['play','pause'].forEach(event => v.addEventListener(event, () => {
      if (event === 'play' && (!dialog.open || index !== active)) { v.pause(); return; }
      if (index === active) syncControls();
    }));
    v.addEventListener('timeupdate', () => { if (index === active && Number.isFinite(v.duration)) seek.value = v.currentTime / v.duration * 1000; });
    v.addEventListener('error', () => { if (index === active && dialog.open) status.textContent = 'Couldn’t load this video. Try another or reopen it.'; });
  });
  feed.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (!dialog.open || !feed.clientHeight) return;
      const position = Math.round(feed.scrollTop / feed.clientHeight);
      const index = wrap(position - 1);
      if (position === 0 || position === items.length + 1) feed.scrollTop = (index + 1) * feed.clientHeight;
      if (dialog.open && index !== active) activate(index);
    }, 110);
  }, { passive: true });
  // One wheel gesture moves one reel; touch uses native scroll-snap physics.
  dialog.addEventListener('wheel', e => {
    e.preventDefault();
    if (wheelLocked) return;
    wheelAmount += e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? feed.clientHeight : 1);
    if (Math.abs(wheelAmount) < 35) return;
    move(Math.sign(wheelAmount)); wheelAmount = 0; wheelLocked = true;
    clearTimeout(wheelTimer); wheelTimer = setTimeout(() => { wheelLocked = false; }, 650);
  }, { passive: false });
  dialog.addEventListener('keydown', e => {
    if (e.target === seek || mainNav?.contains(e.target)) return;
    if (['ArrowDown','PageDown','ArrowUp','PageUp','ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); move(['ArrowDown','PageDown','ArrowRight'].includes(e.key) ? 1 : -1); }
    else if (e.key === ' ' && e.target.tagName !== 'BUTTON') { e.preventDefault(); togglePlay(); }
  });
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    media.forEach(v => v.pause()); clearTimeout(scrollTimer); clearTimeout(wheelTimer);
    wheelLocked = false; wheelAmount = 0; active = -1;
    restoreNavigation();
    document.body.classList.remove('reel-open'); opener?.focus({preventScroll:true});
    clearGlass();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) media.forEach(v => v.pause()); });
  new ResizeObserver(() => { if (dialog.open && active >= 0) feed.scrollTop = (active + 1) * feed.clientHeight; }).observe(feed);
})();
