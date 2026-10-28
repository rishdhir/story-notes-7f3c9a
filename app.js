'use strict';
const stages=[
  {
    "title": "The premise and point of view",
    "status": "Story development",
    "visual": "Character · situation<br>point of view",
    "description": "The creator sets the premise, point of view and larger arc. Decide what the characters want, what can change and which subplots can develop alongside the main story.",
    "output": "A premise, character background, main arc and supporting story threads."
  },
  {
    "title": "The people and places",
    "status": "World creation",
    "image": "shared/assets/erica.png",
    "description": "Define the lead and supporting cast, their surroundings, relationships, voices and visual references. These are the creative boundaries AI works within as new episodes develop.",
    "output": "Approved visual references and a record of the world and its relationships."
  },
  {
    "title": "The episode script",
    "status": "Writing",
    "visual": "Situation → action<br>emotional change",
    "description": "Develop the next beat from the agreed arc and previous events. Shape it into a short script, separating voiceover from live dialogue and leaving room for action, pauses and music.",
    "output": "A short script covering picture, performance, exact text and sound."
  },
  {
    "title": "The references for this scene",
    "status": "Episode preparation",
    "image": "shared/assets/sun-out.png",
    "description": "Select the current character, outfit, location and supporting-cast references. Specify what each reference controls and assemble the prompt from the script.",
    "output": "The script, ordered references, prompt and generation settings."
  },
  {
    "title": "The generated draft",
    "status": "Production",
    "visual": "Picture · performance<br>edit · sound",
    "description": "Generate the short and inspect the result. Check that its action, performance, captions and physical continuity follow the script.",
    "output": "A saved draft with its exact inputs and any issues identified during review."
  },
  {
    "title": "The creative review",
    "status": "Human review",
    "visual": "Watch · listen<br>approve or revise",
    "description": "The creator decides whether the story and emotion work, and whether the episode belongs in this world. Approve it, request changes or reshape the story before publication.",
    "output": "An approved episode or a clear request for changes."
  },
  {
    "title": "Release and story continuity",
    "status": "Planned workflow",
    "visual": "Approved episode<br>publication · story record",
    "description": "Prepare the approved version for release and record what happened in it. The next episode should inherit those facts and the decisions behind them.",
    "output": "The release file and an updated story record. Automatic scheduling and publication remain planned."
  }
];
const phases=[
[['1–20','Everything is new.','Erica arrives with relief, excitement and no idea what comes next. A room becomes hers; Samantha and the café become familiar. She explores London, tries the apps and goes on a first date. Underneath the novelty, she is learning how to make decisions for herself.']],
[['21–40','Familiar faces become people who matter.','Friendship deepens and dating gets more complicated. Someone can mean more to her than she means to them. Between good nights, awkward messages and ordinary routines, London begins to feel less temporary.']],
[['41–60','She starts making a life she wants to keep.','Erica makes plans of her own, lets friends get closer and becomes clearer about what she wants from love. By Day 60, she has people to call and places to return to. The next chapter begins with something real to care about and something to risk.']]
];
function arcMarkup(rows){return rows.map(([n,title,text])=>`<article class="arc-summary"><h3>${title}</h3><p>${text}</p></article>`).join('')}
function chooseStage(index,focus=false){const s=stages[index];document.querySelectorAll('[data-stage]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;if(focus&&i===index)b.focus()});document.getElementById('stage-panel').setAttribute('aria-labelledby','stage-'+index);document.getElementById('stage-title').textContent=s.title;document.getElementById('stage-status').textContent=s.status;document.getElementById('stage-description').textContent=s.description;document.getElementById('stage-output').textContent=s.output;document.getElementById('stage-visual').innerHTML=s.image?`<img src="${s.image}" alt="Approved reference sheet used in the production workflow">`:`<span class="stage-glyph">${s.visual}</span>`}
function chooseArc(index,focus=false){document.querySelectorAll('[data-arc]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;if(focus&&i===index)b.focus()});const panel=document.getElementById('arc-panel');panel.setAttribute('aria-labelledby','arc-'+index);panel.innerHTML=arcMarkup(phases[index])}
function wireTabs(selector,fn){const tabs=[...document.querySelectorAll(selector)];tabs.forEach((b,i)=>{b.addEventListener('click',()=>fn(i));b.addEventListener('keydown',e=>{let next=i;if(['ArrowRight','ArrowDown'].includes(e.key))next=(i+1)%tabs.length;else if(['ArrowLeft','ArrowUp'].includes(e.key))next=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=tabs.length-1;else return;e.preventDefault();fn(next,true)})})}
wireTabs('[data-stage]',chooseStage);wireTabs('[data-arc]',chooseArc);if(document.getElementById('arc-panel'))chooseArc(0);
const dialog=document.getElementById('image-dialog');let imageTrigger=null;
document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{imageTrigger=button;const label=button.dataset.caption;document.getElementById('image-caption').textContent=label;const img=document.getElementById('dialog-image');img.src=button.dataset.image;img.alt=label;document.getElementById('image-original').href=button.dataset.image;dialog.showModal();document.body.classList.add('modal-open')}));
if(dialog){dialog.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open');imageTrigger?.focus()})}
const videos=[...document.querySelectorAll('video')];videos.forEach(video=>video.addEventListener('play',()=>videos.forEach(other=>{if(other!==video)other.pause()})));
const videoObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)e.target.pause()}),{threshold:.08});videos.forEach(v=>videoObserver.observe(v));document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(v=>v.pause())});
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)'),contrast=window.matchMedia('(prefers-contrast: more)'),transparency=window.matchMedia('(prefers-reduced-transparency: reduce)');let glass=[];function configureGlass(){glass.forEach(x=>x.destroy());glass=[];if(window.liquidGlass&&!reduce.matches&&!contrast.matches&&!transparency.matches)document.querySelectorAll('.glass-nav,.glass-control,.sample-glass,.arc-tabs,.video-start>span,.expand').forEach(el=>glass.push(liquidGlass(el,{scale:-112,chroma:5,blur:3,saturate:1.35,fallbackBlur:20,border:.12})));}configureGlass();[reduce,contrast,transparency].forEach(m=>m.addEventListener('change',configureGlass));
const progress=document.querySelector('.scroll-progress');let queued=false;const navLinks=[...document.querySelectorAll('.glass-nav a')].filter(a=>a.hash&&document.querySelector(a.hash));function scrollState(){if(progress){const available=document.documentElement.scrollHeight-innerHeight;progress.style.width=(available>0?scrollY/available*100:0)+'%'}let current=null;navLinks.forEach(a=>{if(document.querySelector(a.hash).getBoundingClientRect().top<innerHeight*.4)current=a});navLinks.forEach(a=>a.classList.toggle('active',a===current));queued=false;}addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(scrollState)}},{passive:true});scrollState();
document.querySelectorAll('.print-action').forEach(b=>b.addEventListener('click',()=>window.print()));
addEventListener('beforeprint',()=>{if(document.getElementById('arc-panel'))document.getElementById('arc-panel').innerHTML=arcMarkup(phases.flat())});addEventListener('afterprint',()=>{const active=document.querySelector('[data-arc][aria-selected=true]');if(active)chooseArc(Number(active.dataset.arc))});

document.querySelectorAll('.video-start').forEach(button=>button.addEventListener('click',()=>document.dispatchEvent(new CustomEvent('open-reel',{detail:{button}}))));
