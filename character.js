/* ════════════════════════════════════════════════════════════════
   Grammar Vault — Character System
   Shared by grammar_vault.html (in-game player) and
   character_customizer.html (the character creator screen).
   Keep this file loaded via <script src="character.js"> BEFORE any
   code that calls drawCharacter() / loadCharacter() / etc.
   ════════════════════════════════════════════════════════════════ */

const CHAR_STORAGE_KEY = 'gv_character_v1';

/* ── Palettes & option lists ── */
const CHAR_PALETTE = {
  skin:      ['#FFE0BD','#F7C99E','#E8B27D','#C68642','#8D5524','#5C3A21'],
  hair:      ['#2D2013','#5C3A21','#8A5A2E','#B5651D','#D4AF37','#E63946','#3A3A3A','#F2F2F2'],
  outfit:    ['#FF6B6B','#4CD964','#3EC6E0','#7C5CFF','#FFD23F','#FF9F45','#FF6FB5','#2D3047'],
  pants:     ['#2D3047','#3A6EA5','#5C6B8A','#8D5524','#4CD964','#7C5CFF'],
  shoes:     ['#2D3047','#FF6B6B','#FFD23F','#4CD964','#FFFFFF','#3EC6E0'],
  backpack:  ['#FF6B6B','#4CD964','#3EC6E0','#7C5CFF','#FFD23F','#FF9F45'],
  hat:       ['#FF6B6B','#4CD964','#3EC6E0','#7C5CFF','#FFD23F','#2D3047'],
};

const CHAR_HAIR_STYLES = ['bald','short','curly','ponytail','spiky'];
const CHAR_HATS        = ['none','cap','wizard','crown','beanie','bow','propeller','grad','antenna','explorer'];
const CHAR_BACKPACKS   = ['none','round','star','book'];

const CHAR_HAIR_LABELS      = {bald:'Bald',short:'Short',curly:'Curly',ponytail:'Ponytail',spiky:'Spiky'};
const CHAR_HAT_LABELS       = {none:'None',cap:'Cap',wizard:'Wizard',crown:'Crown',beanie:'Beanie',bow:'Bow',propeller:'Propeller',grad:'Grad Cap',antenna:'Antenna',explorer:'Explorer'};
const CHAR_BACKPACK_LABELS  = {none:'None',round:'Round',star:'Star',book:'Book'};

function defaultCharacter(){
  return {
    skin: 0, hairStyle: 'short', hair: 0,
    outfit: 0, pants: 0, shoes: 0,
    hat: 'none', hatColor: 0,
    backpack: 'none', backpackColor: 0,
  };
}

function randomCharacter(){
  const pick = arr => arr[Math.floor(Math.random()*arr.length)];
  const pickIdx = arr => Math.floor(Math.random()*arr.length);
  return {
    skin: pickIdx(CHAR_PALETTE.skin),
    hairStyle: pick(CHAR_HAIR_STYLES),
    hair: pickIdx(CHAR_PALETTE.hair),
    outfit: pickIdx(CHAR_PALETTE.outfit),
    pants: pickIdx(CHAR_PALETTE.pants),
    shoes: pickIdx(CHAR_PALETTE.shoes),
    hat: pick(CHAR_HATS),
    hatColor: pickIdx(CHAR_PALETTE.hat),
    backpack: pick(CHAR_BACKPACKS),
    backpackColor: pickIdx(CHAR_PALETTE.backpack),
  };
}

function loadCharacter(){
  try {
    const raw = localStorage.getItem(CHAR_STORAGE_KEY);
    if(!raw) return defaultCharacter();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultCharacter(), parsed);
  } catch(e){ return defaultCharacter(); }
}

function saveCharacter(cfg){
  try { localStorage.setItem(CHAR_STORAGE_KEY, JSON.stringify(cfg)); return true; }
  catch(e){ return false; }
}

/* ── Drawing helpers (self-contained; do not depend on host-page globals) ── */
function chRoundRectPath(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

/* ══════════════════════════════════════════════════════════════
   drawCharacter — draws the player avatar inside a T x T box whose
   top-left corner is (x,y). Mirrors the fractional-of-TILE approach
   used throughout grammar_vault.html so it drops in as a 1:1
   replacement for the old drawPlayer() body shapes.

   dir: 0=up/back, 1=right, 2=down/front (default), 3=left
   frame: 0-3 walk-cycle frame (matches player.frame in the game)
   ══════════════════════════════════════════════════════════════ */
function resolveColor(paletteArr, val){
  if(typeof val==='string') return val;
  return (paletteArr[val]!==undefined) ? paletteArr[val] : paletteArr[0];
}

function drawCharacter(ctx, x, y, T, cfg, dir, frame, bobOverride){
  cfg = cfg || defaultCharacter();
  dir = (dir===undefined) ? 2 : dir;
  frame = frame||0;
  const skin = resolveColor(CHAR_PALETTE.skin,cfg.skin);
  const hairC = resolveColor(CHAR_PALETTE.hair,cfg.hair);
  const outfitC = resolveColor(CHAR_PALETTE.outfit,cfg.outfit);
  const pantsC = resolveColor(CHAR_PALETTE.pants,cfg.pants);
  const shoesC = resolveColor(CHAR_PALETTE.shoes,cfg.shoes);
  const hatC = resolveColor(CHAR_PALETTE.hat,cfg.hatColor);
  const bpC = resolveColor(CHAR_PALETTE.backpack,cfg.backpackColor);

  const bob = (bobOverride!==undefined) ? bobOverride : 0;
  const legKick = (frame%2===0)?0:T*0.05;
  const faceShift = dir===1 ? T*0.035 : dir===3 ? -T*0.035 : 0;

  ctx.save();
  ctx.translate(x, y+bob);

  /* backpack (peeks out behind the shoulders) */
  if(cfg.backpack && cfg.backpack!=='none'){
    drawBackpack(ctx,cfg.backpack,bpC,T);
  }

  /* legs + shoes */
  const legY=T*0.80, legH=T*0.20, legW=T*0.16;
  ctx.fillStyle=pantsC;
  ctx.fillRect(T*0.30,legY-legKick*0.3,legW,legH*0.62+legKick*0.3);
  ctx.fillRect(T*0.54,legY+legKick*0.3,legW,legH*0.62-legKick*0.3);
  ctx.fillStyle=shoesC;
  ctx.fillRect(T*0.29,legY+legH*0.60-legKick*0.3,legW+T*0.02,legH*0.40+legKick*0.3);
  ctx.fillRect(T*0.53,legY+legH*0.60+legKick*0.3,legW+T*0.02,legH*0.40-legKick*0.3);

  /* arms (skin) at the sides */
  ctx.fillStyle=skin;
  chRoundRectPath(ctx,T*0.16,T*0.56,T*0.11,T*0.24,T*0.05);ctx.fill();
  chRoundRectPath(ctx,T*0.73,T*0.56,T*0.11,T*0.24,T*0.05);ctx.fill();

  /* torso */
  ctx.fillStyle=outfitC;
  chRoundRectPath(ctx,T*0.27,T*0.50,T*0.46,T*0.36,T*0.12);ctx.fill();
  ctx.fillStyle=shade(outfitC,-0.12);
  chRoundRectPath(ctx,T*0.27,T*0.76,T*0.46,T*0.10,T*0.05);ctx.fill();

  /* head */
  const headCX=T*0.5+faceShift*0.4, headCY=T*0.32, headR=T*0.22;
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.arc(headCX,headCY,headR,0,Math.PI*2);ctx.fill();

  /* ears */
  ctx.fillStyle=skin;
  ctx.beginPath();ctx.arc(headCX-headR*0.98,headCY+headR*0.1,headR*0.22,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(headCX+headR*0.98,headCY+headR*0.1,headR*0.22,0,Math.PI*2);ctx.fill();

  /* hair (back layer, behind face — for styles that frame the head) */
  drawHair(ctx,cfg.hairStyle,hairC,headCX,headCY,headR,dir,true);

  /* face (skip when facing away/up) */
  if(dir!==0){
    ctx.fillStyle='#2D3047';
    const eyeY=headCY-headR*0.05, eyeDX=headR*0.42;
    ctx.beginPath();ctx.arc(headCX-eyeDX+faceShift,eyeY,headR*0.13,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(headCX+eyeDX+faceShift,eyeY,headR*0.13,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FFFFFF';
    ctx.beginPath();ctx.arc(headCX-eyeDX+faceShift-headR*0.04,eyeY-headR*0.04,headR*0.045,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(headCX+eyeDX+faceShift-headR*0.04,eyeY-headR*0.04,headR*0.045,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#2D3047';ctx.lineWidth=Math.max(2,T*0.02);ctx.lineCap='round';
    ctx.beginPath();ctx.arc(headCX+faceShift,headCY+headR*0.32,headR*0.34,0.15*Math.PI,0.85*Math.PI);ctx.stroke();
    /* rosy cheeks */
    ctx.fillStyle='rgba(255,140,140,0.45)';
    ctx.beginPath();ctx.arc(headCX-headR*0.62+faceShift,headCY+headR*0.28,headR*0.16,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(headCX+headR*0.62+faceShift,headCY+headR*0.28,headR*0.16,0,Math.PI*2);ctx.fill();
  }

  /* hair (front layer) + hat */
  drawHair(ctx,cfg.hairStyle,hairC,headCX,headCY,headR,dir,false);
  if(cfg.hat && cfg.hat!=='none'){
    drawHat(ctx,cfg.hat,hatC,headCX,headCY,headR,dir);
  }

  ctx.restore();
}

function drawHair(ctx,style,color,cx,cy,r,dir,backLayer){
  ctx.fillStyle=color;
  if(style==='bald') return;
  if(style==='short'){
    if(!backLayer)return;
    ctx.beginPath();ctx.arc(cx,cy,r*1.05,Math.PI*1.17,Math.PI*1.83);ctx.fill();
    chRoundRectPath(ctx,cx-r*0.95,cy-r*0.82,r*1.9,r*0.42,r*0.2);ctx.fill();
  } else if(style==='curly'){
    if(!backLayer)return;
    for(let i=0;i<7;i++){
      const a=Math.PI*1.02+ (Math.PI*0.96)*(i/6);
      const px=cx+Math.cos(a)*r*1.0, py=cy+Math.sin(a)*r*1.0;
      ctx.beginPath();ctx.arc(px,py,r*0.30,0,Math.PI*2);ctx.fill();
    }
  } else if(style==='ponytail'){
    if(backLayer){
      ctx.beginPath();ctx.arc(cx,cy,r*1.05,Math.PI*1.17,Math.PI*1.83);ctx.fill();
      chRoundRectPath(ctx,cx-r*0.95,cy-r*0.82,r*1.9,r*0.4,r*0.2);ctx.fill();
    } else {
      const side = dir===3?-1:1;
      ctx.beginPath();
      ctx.ellipse(cx+side*r*0.98,cy+r*0.35,r*0.17,r*0.38,side*0.3,0,Math.PI*2);
      ctx.fill();
    }
  } else if(style==='spiky'){
    if(!backLayer)return;
    for(let i=0;i<5;i++){
      const t=i/4, spx=cx+(t-0.5)*r*1.5, tipY=cy-r*0.95-Math.abs(t-0.5)*r*0.25;
      ctx.beginPath();
      ctx.moveTo(spx-r*0.20,cy-r*0.62);
      ctx.lineTo(spx+r*0.20,cy-r*0.62);
      ctx.lineTo(spx,tipY);
      ctx.closePath();ctx.fill();
    }
    ctx.beginPath();ctx.arc(cx,cy,r*1.0,Math.PI*1.2,Math.PI*1.8);ctx.fill();
  }
}

function drawHat(ctx,type,color,cx,cy,r,dir){
  ctx.fillStyle=color;
  if(type==='cap'){
    ctx.beginPath();ctx.arc(cx,cy-r*0.15,r*1.08,Math.PI*1.0,Math.PI*2.0);ctx.fill();
    const side = dir===3?-1:1;
    ctx.beginPath();
    ctx.ellipse(cx+side*r*0.85,cy-r*0.15,r*0.55,r*0.18,0,0,Math.PI*2);
    ctx.fill();
  } else if(type==='wizard'){
    ctx.beginPath();
    ctx.moveTo(cx-r*1.1,cy-r*0.5);
    ctx.lineTo(cx+r*1.1,cy-r*0.5);
    ctx.lineTo(cx+r*0.22,cy-r*2.2);
    ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.ellipse(cx,cy-r*0.5,r*1.15,r*0.22,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FFD23F';
    ctx.beginPath();ctx.arc(cx+r*0.05,cy-r*1.5,r*0.14,0,Math.PI*2);ctx.fill();
  } else if(type==='crown'){
    const cw=r*1.9, chh=r*0.6, cxL=cx-cw/2, cyT=cy-r*0.95;
    ctx.beginPath();
    ctx.moveTo(cxL,cyT+chh);
    ctx.lineTo(cxL,cyT+chh*0.35);
    ctx.lineTo(cxL+cw*0.2,cyT+chh*0.75);
    ctx.lineTo(cxL+cw*0.4,cyT);
    ctx.lineTo(cxL+cw*0.5,cyT+chh*0.6);
    ctx.lineTo(cxL+cw*0.6,cyT);
    ctx.lineTo(cxL+cw*0.8,cyT+chh*0.75);
    ctx.lineTo(cxL+cw,cyT+chh*0.35);
    ctx.lineTo(cxL+cw,cyT+chh);
    ctx.closePath();ctx.fill();
    ctx.fillStyle='#FFD23F';
    ctx.beginPath();ctx.arc(cxL+cw*0.5,cyT+chh*0.55,r*0.10,0,Math.PI*2);ctx.fill();
  } else if(type==='beanie'){
    ctx.beginPath();ctx.arc(cx,cy-r*0.25,r*1.06,Math.PI,Math.PI*2);ctx.fill();
    chRoundRectPath(ctx,cx-r*1.06,cy-r*0.32,r*2.12,r*0.3,r*0.12);ctx.fill();
    ctx.fillStyle='#FFFFFF';
    ctx.beginPath();ctx.arc(cx,cy-r*1.28,r*0.16,0,Math.PI*2);ctx.fill();
  } else if(type==='bow'){
    ctx.beginPath();
    ctx.moveTo(cx-r*0.05,cy-r*0.95);
    ctx.lineTo(cx-r*0.55,cy-r*1.35);
    ctx.lineTo(cx-r*0.55,cy-r*0.65);
    ctx.closePath();ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx+r*0.05,cy-r*0.95);
    ctx.lineTo(cx+r*0.55,cy-r*1.35);
    ctx.lineTo(cx+r*0.55,cy-r*0.65);
    ctx.closePath();ctx.fill();
    ctx.fillStyle=shade(color,-0.2);
    ctx.beginPath();ctx.arc(cx,cy-r*0.95,r*0.14,0,Math.PI*2);ctx.fill();
  } else if(type==='propeller'){
    ctx.beginPath();ctx.arc(cx,cy-r*0.18,r*1.05,Math.PI*1.0,Math.PI*2.0);ctx.fill();
    ctx.fillStyle='#2D3047';
    ctx.fillRect(cx-r*0.05,cy-r*1.55,r*0.1,r*0.45);
    ctx.fillStyle=color;
    ctx.save();ctx.translate(cx,cy-r*1.55);
    for(let i=0;i<3;i++){
      ctx.rotate(Math.PI*2/3);
      ctx.beginPath();ctx.ellipse(r*0.35,0,r*0.32,r*0.09,0,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  } else if(type==='grad'){
    /* graduation cap: flat square board + button + tassel */
    chRoundRectPath(ctx,cx-r*0.55,cy-r*0.62,r*1.1,r*0.5,r*0.16);ctx.fill();
    ctx.save();
    ctx.translate(cx,cy-r*0.75);ctx.rotate(-0.05);
    ctx.beginPath();ctx.moveTo(-r*1.15,0);ctx.lineTo(r*1.15,-r*0.05);ctx.lineTo(r*1.0,r*0.30);ctx.lineTo(-r*1.0,r*0.35);ctx.closePath();ctx.fill();
    ctx.restore();
    ctx.fillStyle=shade(color,-0.25);
    ctx.beginPath();ctx.arc(cx,cy-r*0.78,r*0.09,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=shade(color,-0.15);ctx.lineWidth=Math.max(2,r*0.06);
    ctx.beginPath();ctx.moveTo(cx+r*0.5,cy-r*0.78);ctx.lineTo(cx+r*0.62,cy-r*0.30);ctx.stroke();
    ctx.fillStyle=shade(color,-0.15);
    ctx.beginPath();ctx.arc(cx+r*0.62,cy-r*0.18,r*0.10,0,Math.PI*2);ctx.fill();
  } else if(type==='antenna'){
    /* bee-style antenna headband: two stalks with round tips */
    ctx.strokeStyle=color;ctx.lineWidth=Math.max(3,r*0.11);ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(cx-r*0.32,cy-r*0.55);ctx.quadraticCurveTo(cx-r*0.55,cy-r*1.35,cx-r*0.30,cy-r*1.65);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+r*0.32,cy-r*0.55);ctx.quadraticCurveTo(cx+r*0.55,cy-r*1.35,cx+r*0.30,cy-r*1.65);ctx.stroke();
    ctx.fillStyle=color;
    ctx.beginPath();ctx.arc(cx-r*0.30,cy-r*1.68,r*0.16,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(cx+r*0.30,cy-r*1.68,r*0.16,0,Math.PI*2);ctx.fill();
    /* thin headband hinting at the striped bee theme */
    ctx.fillStyle=color;
    chRoundRectPath(ctx,cx-r*0.9,cy-r*0.62,r*1.8,r*0.22,r*0.1);ctx.fill();
  } else if(type==='explorer'){
    /* wide-brim explorer / fedora hat */
    ctx.fillStyle=shade(color,-0.1);
    ctx.beginPath();ctx.ellipse(cx,cy-r*0.42,r*1.35,r*0.32,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=color;
    chRoundRectPath(ctx,cx-r*0.62,cy-r*0.92,r*1.24,r*0.56,r*0.2);ctx.fill();
    ctx.fillStyle=shade(color,-0.25);
    chRoundRectPath(ctx,cx-r*0.62,cy-r*0.56,r*1.24,r*0.14,r*0.05);ctx.fill();
  }
}

function drawBackpack(ctx,type,color,T){
  ctx.fillStyle=shade(color,-0.15);
  if(type==='round'){
    chRoundRectPath(ctx,T*0.18,T*0.50,T*0.66,T*0.34,T*0.14);ctx.fill();
  } else if(type==='star'){
    drawStar(ctx,T*0.5,T*0.66,T*0.24,T*0.11,5);ctx.fillStyle=color;ctx.fill();
  } else if(type==='book'){
    chRoundRectPath(ctx,T*0.20,T*0.52,T*0.60,T*0.30,T*0.06);ctx.fill();
  }
  if(type==='round'||type==='book'){
    ctx.fillStyle=color;
    const bx = type==='round'?T*0.20:T*0.22;
    const bw = type==='round'?T*0.62:T*0.56;
    chRoundRectPath(ctx,bx,T*0.52,bw,T*0.28,T*0.12);ctx.fill();
  }
}

function drawStar(ctx,cx,cy,rOuter,rInner,points){
  ctx.beginPath();
  for(let i=0;i<points*2;i++){
    const rad=(i%2===0)?rOuter:rInner;
    const a=(Math.PI/points)*i - Math.PI/2;
    const px=cx+Math.cos(a)*rad, py=cy+Math.sin(a)*rad;
    if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
  }
  ctx.closePath();
}

function shade(hex,amt){
  const c = hex.replace('#','');
  const num = parseInt(c.length===3 ? c.split('').map(x=>x+x).join('') : c, 16);
  let r=(num>>16)+Math.round(255*amt);
  let g=((num>>8)&0xff)+Math.round(255*amt);
  let b=(num&0xff)+Math.round(255*amt);
  r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));
  return '#'+(0x1000000+r*0x10000+g*0x100+b).toString(16).slice(1);
}

/* ══════════════════════════════════════════════════════════════
   NPC system — every NPC's look is driven by its CATEGORY (costume
   archetype) and its NAME (a keyword-matched prop/badge), so the
   game world visually "reads" each character's title at a glance:
   e.g. "Comma Carl" wears a giant comma, "Tense Tom" wears an
   hourglass badge, every Vocabulary NPC wears a wizard hat, etc.
   ══════════════════════════════════════════════════════════════ */

function hashStr(s){
  let h=0;
  for(let i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))|0; }
  return Math.abs(h);
}

const NPC_CATEGORY_HAT = {
  'Grammar':'grad',
  'Punctuation':'none', /* punctuation NPCs wear their mark instead of a hat */
  'Spelling':'antenna',
  'Vocabulary':'wizard',
  'Reading Comprehension':'explorer',
};
const NPC_CATEGORY_FALLBACK_ICON = {
  'Grammar':'\u{1F4D8}', 'Punctuation':'\u2757', 'Spelling':'\u{1F41D}',
  'Vocabulary':'\u{1F4DA}', 'Reading Comprehension':'\u{1F50D}',
};

/* Ordered [substring, emoji] lookups -- checked most-specific first so
   e.g. "pronoun" is tested before the generic "noun", and "semicolon"
   before "colon". Matches against the NPC's full lowercased name. */
const NPC_TITLE_ICONS = {
  'Grammar': [
    ['granny','\u{1F475}'],['captain','\u2693'],['elder','\u{1F9D3}'],['scribe','\u{1F58B}\uFE0F'],
    ['tense','\u231B'],['pronoun','\u{1F449}'],['noun','\u{1F3F7}\uFE0F'],['verb','\u{1F3C3}'],
    ['clause','\u{1F517}'],['subject','\u{1F3AF}'],['predicate','\u26A1'],['adjectiv','\u{1F3A8}'],
    ['article','\u{1F524}'],['syntax','\u{1F9E9}'],['modif','\u2728'],['grammarian','\u{1F4D6}'],
  ],
  'Spelling': [
    ['mnemonic','\u{1F9E0}'],['homophone','\u{1F442}'],['silent','\u{1F92B}'],['double','\u{1F524}'],
    ['rooter','\u{1F331}'],['root','\u{1F331}'],['wordwright','\u270F\uFE0F'],['diction','\u270F\uFE0F'],
    ['alphabet','\u{1F521}'],['syllab','\u{1F50A}'],['vowel','\u{1F524}'],['letter','\u{1F520}'],
    ['ortho','\u2705'],['old','\u2705'],
  ],
  'Vocabulary': [
    ['prof','\u{1F393}'],['antonym','\u2194\uFE0F'],['synonym','\u{1F504}'],['nonym','\u{1F504}'],
    ['lexi','\u{1F4DA}'],['wordsmith','\u270D\uFE0F'],['thesaur','\u{1F4D6}'],['etymon','\u{1F333}'],
    ['definit','\u{1F4A1}'],['meaningford','\u{1F4A1}'],['context','\u{1F9E9}'],['vocab','\u{1F5E3}\uFE0F'],
    ['idiom','\u{1F4AD}'],
  ],
  'Reading Comprehension': [
    ['archivist','\u{1F5C4}\uFE0F'],['sage','\u{1F989}'],['keeper','\u{1F5DD}\uFE0F'],['detail','\u{1F50D}'],
    ['infer','\u{1F4A1}'],['plot','\u{1F5FA}\uFE0F'],['summar','\u{1F4DD}'],['theme','\u{1F3AF}'],
    ['context','\u{1F9E9}'],['passage','\u{1F4DC}'],['narrat','\u{1F5E3}\uFE0F'],['narro','\u{1F5E3}\uFE0F'],
    ['story','\u{1F4D6}'],['chapter','\u{1F4D1}'],['analyt','\u{1F4CA}'],['read','\u{1F4D6}'],
  ],
};

/* Punctuation NPCs skip the badge system entirely and wear the mark
   itself as an oversized headpiece. Ordered most-specific first. */
const NPC_PUNCT_MARKS = [
  ['semicolon','semicolon'],['colon','colon'],['comma','comma'],['apostrophe','apostrophe'],
  ['question','question'],['period','period'],['exclam','exclamation'],['quot','quotation'],
  ['hyphen','hyphen'],['dash','dash'],['ellips','ellipsis'],['bracket','bracket'],['parenthes','parenthesis'],
];

function getNpcIcon(category,name){
  const n=(name||'').toLowerCase();
  if(category==='Punctuation'){
    for(const [kw,mark] of NPC_PUNCT_MARKS) if(n.includes(kw)) return {mark};
    return {mark:'generic'};
  }
  const table=NPC_TITLE_ICONS[category]||[];
  for(const [kw,icon] of table) if(n.includes(kw)) return {badge:icon};
  return {badge:NPC_CATEGORY_FALLBACK_ICON[category]||'\u2B50'};
}

/* Draws a punctuation mark as a big, colorful headpiece centered at
   (cx,cy) with head-radius r (mark sits just above the head, like a hat). */
function drawPunctuationMark(ctx,mark,color,cx,cy,r){
  ctx.save();
  /* soft white halo behind the mark for contrast against any hair/skin color */
  ctx.fillStyle='rgba(255,255,255,0.9)';
  ctx.beginPath();ctx.ellipse(cx,cy-r*1.15,r*0.85,r*1.05,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.shadowColor='rgba(0,0,0,0.45)';ctx.shadowBlur=6;ctx.shadowOffsetY=1;
  switch(mark){
    case 'period':
      ctx.beginPath();ctx.arc(cx,cy-r*1.05,r*0.28,0,Math.PI*2);ctx.fill();
      break;
    case 'comma':
      ctx.beginPath();ctx.arc(cx,cy-r*1.2,r*0.24,0,Math.PI*2);ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx+r*0.12,cy-r*1.05);
      ctx.quadraticCurveTo(cx+r*0.44,cy-r*0.58,cx+r*0.06,cy-r*0.35);
      ctx.quadraticCurveTo(cx+r*0.30,cy-r*0.68,cx+r*0.05,cy-r*1.0);
      ctx.closePath();ctx.fill();
      break;
    case 'colon':
      ctx.beginPath();ctx.arc(cx,cy-r*1.6,r*0.20,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(cx,cy-r*0.98,r*0.20,0,Math.PI*2);ctx.fill();
      break;
    case 'semicolon':
      ctx.beginPath();ctx.arc(cx,cy-r*1.62,r*0.20,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(cx,cy-r*1.08,r*0.22,0,Math.PI*2);ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx+r*0.10,cy-r*0.92);
      ctx.quadraticCurveTo(cx+r*0.40,cy-r*0.5,cx+r*0.05,cy-r*0.30);
      ctx.quadraticCurveTo(cx+r*0.26,cy-r*0.6,cx+r*0.04,cy-r*0.88);
      ctx.closePath();ctx.fill();
      break;
    case 'exclamation':
      chRoundRectPath(ctx,cx-r*0.15,cy-r*2.0,r*0.30,r*0.9,r*0.15);ctx.fill();
      ctx.beginPath();ctx.arc(cx,cy-r*0.85,r*0.19,0,Math.PI*2);ctx.fill();
      break;
    case 'question':
      ctx.lineWidth=r*0.26;
      ctx.beginPath();ctx.arc(cx,cy-r*1.62,r*0.34,Math.PI*1.1,Math.PI*2.55);ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx+r*0.08,cy-r*1.32);ctx.lineTo(cx+r*0.08,cy-r*1.05);ctx.stroke();
      ctx.beginPath();ctx.arc(cx+r*0.08,cy-r*0.80,r*0.16,0,Math.PI*2);ctx.fill();
      break;
    case 'apostrophe':
      ctx.beginPath();ctx.arc(cx,cy-r*1.55,r*0.20,0,Math.PI*2);ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx+r*0.10,cy-r*1.42);
      ctx.quadraticCurveTo(cx+r*0.36,cy-r*1.08,cx+r*0.06,cy-r*0.92);
      ctx.quadraticCurveTo(cx+r*0.24,cy-r*1.15,cx+r*0.04,cy-r*1.36);
      ctx.closePath();ctx.fill();
      break;
    case 'quotation':
      [-1,1].forEach(side=>{
        const ox=cx+side*r*0.34;
        ctx.beginPath();ctx.arc(ox,cy-r*1.55,r*0.16,0,Math.PI*2);ctx.fill();
        ctx.beginPath();
        ctx.moveTo(ox+r*0.08,cy-r*1.44);
        ctx.quadraticCurveTo(ox+r*0.28,cy-r*1.18,ox+r*0.04,cy-r*1.04);
        ctx.quadraticCurveTo(ox+r*0.20,cy-r*1.24,ox+r*0.03,cy-r*1.40);
        ctx.closePath();ctx.fill();
      });
      break;
    case 'hyphen':
      chRoundRectPath(ctx,cx-r*0.32,cy-r*1.28,r*0.64,r*0.20,r*0.1);ctx.fill();
      break;
    case 'dash':
      chRoundRectPath(ctx,cx-r*0.58,cy-r*1.28,r*1.16,r*0.20,r*0.1);ctx.fill();
      break;
    case 'ellipsis':
      [-1,0,1].forEach(i=>{ctx.beginPath();ctx.arc(cx+i*r*0.42,cy-r*0.95,r*0.16,0,Math.PI*2);ctx.fill();});
      break;
    case 'bracket':
      ctx.lineWidth=r*0.18;
      ctx.beginPath();ctx.moveTo(cx-r*0.30,cy-r*1.9);ctx.lineTo(cx-r*0.48,cy-r*1.9);ctx.lineTo(cx-r*0.48,cy-r*0.78);ctx.lineTo(cx-r*0.30,cy-r*0.78);ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx+r*0.30,cy-r*1.9);ctx.lineTo(cx+r*0.48,cy-r*1.9);ctx.lineTo(cx+r*0.48,cy-r*0.78);ctx.lineTo(cx+r*0.30,cy-r*0.78);ctx.stroke();
      break;
    case 'parenthesis':
      ctx.lineWidth=r*0.18;
      ctx.beginPath();ctx.arc(cx-r*0.02,cy-r*1.35,r*0.58,Math.PI*0.65,Math.PI*1.35);ctx.stroke();
      ctx.beginPath();ctx.arc(cx+r*0.02,cy-r*1.35,r*0.58,Math.PI*1.65,Math.PI*0.35);ctx.stroke();
      break;
    default: /* generic punctuation-flavored name with no single matching mark */
      ctx.beginPath();ctx.arc(cx-r*0.22,cy-r*1.05,r*0.19,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(cx+r*0.26,cy-r*1.12,r*0.17,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(cx,cy-r*1.55,r*0.15,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

/* ══════════════════════════════════════════════════════════════
   drawNPC — draws a quest-giver NPC whose costume reflects its
   CATEGORY and whose headpiece/badge reflects its NAME. Deterministic
   (hashed from the name) so a given NPC always looks the same.

   npc: {name, category, color, done}  (matches the game's npc objects)
   x,y,T: same top-left/tile-size convention as drawCharacter
   ══════════════════════════════════════════════════════════════ */
function drawNPC(ctx,x,y,T,npc,bob){
  bob = bob||0;
  const name = npc.name||'NPC', category = npc.category||'Grammar';
  const h = hashStr(name);
  const hairStyles = ['short','curly','ponytail','spiky','bald'];
  const cfg = {
    skin: h % CHAR_PALETTE.skin.length,
    hairStyle: hairStyles[(h>>4) % hairStyles.length],
    hair: (h>>2) % CHAR_PALETTE.hair.length,
    outfit: npc.color || CHAR_PALETTE.outfit[0],
    pants: (h>>6) % CHAR_PALETTE.pants.length,
    shoes: (h>>8) % CHAR_PALETTE.shoes.length,
    hat: NPC_CATEGORY_HAT[category] || 'none',
    hatColor: shade(npc.color||'#888888',-0.12),
    backpack: 'none', backpackColor: 0,
  };

  if(npc.done){
    ctx.save();
    ctx.filter = 'grayscale(0.85) opacity(0.55)';
    drawCharacter(ctx,x,y,T,cfg,2,0,bob);
    ctx.restore();
    return;
  }

  drawCharacter(ctx,x,y,T,cfg,2,0,bob);

  const headCX = x + T*0.5, headCY = y+bob+T*0.32, r = T*0.22;
  const iconInfo = getNpcIcon(category,name);
  if(category==='Punctuation'){
    drawPunctuationMark(ctx, iconInfo.mark, npc.color||'#FF9F45', headCX, headCY, r*1.15);
  } else if(iconInfo.badge){
    const bx = headCX + r*1.15, by = headCY - r*2.15, br = r*0.5;
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();ctx.arc(bx,by,br,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle = npc.color||'#888888'; ctx.lineWidth = Math.max(2,r*0.14);
    ctx.beginPath();ctx.arc(bx,by,br,0,Math.PI*2);ctx.stroke();
    ctx.font = `${Math.max(14,Math.round(br*1.15))}px sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(iconInfo.badge,bx,by+1);
    ctx.textBaseline='alphabetic';
    ctx.restore();
  }
}
