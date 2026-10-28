/* Movable navigation. Coordinates stay in viewport space, including after resize. */
(function () {
  'use strict';
  function clampPosition(x, y, width, height, viewportWidth, viewportHeight) {
    const margin = 10;
    return {
      x: Math.max(margin, Math.min(x, Math.max(margin, viewportWidth - width - margin))),
      y: Math.max(margin, Math.min(y, Math.max(margin, viewportHeight - height - margin)))
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { clampPosition };
  if (typeof document === 'undefined') return;
  const nav = document.querySelector('nav[aria-label="Main navigation"]');
  if (!nav) return;
  const links = [...nav.querySelectorAll('a')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'storytelling-v3-navigation-position';
  const handle = document.createElement('button');
  handle.type = 'button';
  handle.className = 'nav-handle';
  handle.setAttribute('aria-label', 'Move navigation. Drag or use arrow keys. Press Home to reset.');
  handle.title = 'Drag to move · arrow keys to reposition · double-click to reset';
  handle.innerHTML = '<svg viewBox="0 0 12 18" width="12" height="18" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="4" r="1.25"/><circle cx="9" cy="4" r="1.25"/><circle cx="3" cy="9" r="1.25"/><circle cx="9" cy="9" r="1.25"/><circle cx="3" cy="14" r="1.25"/><circle cx="9" cy="14" r="1.25"/></g></svg>';
  nav.prepend(handle);
  const selection = document.createElement('span');
  selection.className = 'nav-selection';
  selection.setAttribute('aria-hidden', 'true');
  nav.prepend(selection);
  nav.classList.add('movable-nav');

  let position = {x:0,y:0}, drag = null, frame = 0, suppressClick = false;
  let moved = false, pendingLink = null, releaseTimer = 0, indicatorAnimation = null;
  let indicatorBox = null;
  function dimensions() { return {w:nav.offsetWidth,h:nav.offsetHeight}; }
  function bound(x, y) { const d=dimensions();return clampPosition(x,y,d.w,d.h,innerWidth,innerHeight); }
  function draw() {
    nav.style.transform = `translate3d(${position.x}px,${position.y}px,0)`;
    frame = 0;
  }
  function move(x,y,immediate=false) {
    position=bound(x,y);
    if (immediate) { if(frame)cancelAnimationFrame(frame);draw(); }
    else if(!frame)frame=requestAnimationFrame(draw);
  }
  function save() {
    const d=dimensions();
    try { localStorage.setItem(storageKey,JSON.stringify({x:position.x/Math.max(1,innerWidth-d.w),y:position.y/Math.max(1,innerHeight-d.h)})); } catch (_) {}
  }
  function reset() {
    moved=false;
    move((innerWidth-nav.offsetWidth)/2,innerWidth<=760?66:23,true);
    try {localStorage.removeItem(storageKey);} catch (_) {}
  }
  nav.style.left='0';nav.style.top='0';nav.style.right='auto';
  let savedPosition=null;
  try {savedPosition=JSON.parse(localStorage.getItem(storageKey));} catch (_) {}
  reset();
  try {
    const stored=savedPosition;
    if(stored && Number.isFinite(stored.x) && Number.isFinite(stored.y)){
      const d=dimensions();move(stored.x*(innerWidth-d.w),stored.y*(innerHeight-d.h),true);moved=true;save();
    }
  } catch (_) {}

  function highlight(animate=true) {
    const active=(nav.closest('dialog[open]') ? links.find(a=>a.hash==='#films') : pendingLink) || links.find(a=>a.classList.contains('active')) || links[0];
    if(!active)return;
    links.forEach(a=>{a.toggleAttribute('data-selected',a===active);if(a===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
    // Capture the in-flight rectangle so rapid tab changes do not jump.
    const current=selection.getBoundingClientRect(), bar=nav.getBoundingClientRect();
    const box={x:active.offsetLeft,y:active.offsetTop,w:active.offsetWidth,h:active.offsetHeight};
    if(indicatorBox && Object.keys(box).every(k=>box[k]===indicatorBox[k]))return;
    indicatorAnimation?.cancel();
    selection.style.left=box.x+'px';selection.style.top=box.y+'px';
    selection.style.width=box.w+'px';selection.style.height=box.h+'px';
    if(indicatorBox && animate && !reduced.matches){
      indicatorAnimation=selection.animate([
        {transform:`translate(${current.left-bar.left-nav.clientLeft-box.x}px,${current.top-bar.top-nav.clientTop-box.y}px) scale(${current.width/box.w},${current.height/box.h})`},
        {transform:'translate(0,0) scale(1,1)'}
      ],{duration:320,easing:'cubic-bezier(.22,1,.36,1)'});
    }
    indicatorBox=box;
  }
  new MutationObserver(()=>highlight()).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
  highlight(false);
  function releaseSelection(){clearTimeout(releaseTimer);pendingLink=null;highlight();}
  nav.addEventListener('click',e=>{
    if(suppressClick){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;return;}
    const link=e.target.closest('a');
    if(!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)return;
    pendingLink=link;highlight(e.detail!==0);
    clearTimeout(releaseTimer);releaseTimer=setTimeout(releaseSelection,1400);
  },true);
  addEventListener('scrollend',()=>{if(pendingLink)releaseSelection();});

  nav.addEventListener('pointerdown',e=>{
    if(nav.classList.contains('reel-nav-docked') || !e.isPrimary || e.button!==0 || drag)return;
    suppressClick=false;
    drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:position.x,y:position.y,active:false};
  });
  addEventListener('pointermove',e=>{
    if(!drag || e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
    if(!drag.active && Math.hypot(dx,dy)<6)return;
    if(!drag.active){drag.active=true;nav.setPointerCapture(e.pointerId);nav.classList.add('is-dragging');}
    e.preventDefault();moved=true;move(drag.x+dx,drag.y+dy);
  },{passive:false});
  function endDrag(e){
    if(!drag || e.pointerId!==drag.id)return;
    const active=drag.active,id=drag.id;drag=null;
    nav.classList.remove('is-dragging');
    if(nav.hasPointerCapture(id))nav.releasePointerCapture(id);
    if(active){suppressClick=true;move(position.x,position.y,true);save();}
  }
  addEventListener('pointerup',endDrag);
  addEventListener('pointercancel',endDrag);
  nav.addEventListener('lostpointercapture',endDrag);
  handle.addEventListener('dblclick',reset);
  handle.addEventListener('keydown',e=>{
    if(e.key==='Home' || e.key==='Escape'){e.preventDefault();reset();return;}
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
    if(!delta)return;e.preventDefault();moved=true;
    const step=e.shiftKey?40:12;move(position.x+delta[0]*step,position.y+delta[1]*step,true);save();
  });
  const resize=()=>{
    if(moved)move(position.x,position.y,true);else reset();
    highlight(false);
  };
  new ResizeObserver(resize).observe(nav);
  addEventListener('resize',resize);
  document.fonts?.ready.then(resize);
  reduced.addEventListener('change',()=>{indicatorAnimation?.cancel();highlight(false);});
})();
