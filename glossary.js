/* ════════════════════════════════════════════════════════════════
   Grammar Vault — Word Glossary
   Makes core grammar terms (Noun, Verb, Adjective, ...) clickable
   wherever they appear in question text, dialogue, or explanations:
   the word is underlined, and clicking it pops up a small kid-friendly
   definition window.

   Usage from the host page (grammar_vault.html):
     const { hitRegions, height } =
       renderGlossaryText(ctx, text, x, y, maxWidth, { font, fontSize, color });
     hitRegions.forEach(hr => reg(hr.x, hr.y, hr.w, hr.h, () => openGlossary(hr.term)));
     ...
     if (glossaryPopup) drawGlossaryPopup(ctx, glossaryPopup, VW, VH);
   ════════════════════════════════════════════════════════════════ */

/* ── The glossary itself: core "meta-vocabulary" grammar terms ── */
const GRAMMAR_GLOSSARY = {
  noun:        {label:'Noun',        icon:'\u{1F3F7}\uFE0F', color:'#3EC6E0',
                definition:'A noun is a word that names a person, animal, place, or thing.',
                example:'dog, school, Maria, happiness'},
  pronoun:     {label:'Pronoun',     icon:'\u{1F449}', color:'#4CD964',
                definition:'A pronoun is a word used in place of a noun, like when talking about someone without saying their name again.',
                example:'he, she, it, they, we'},
  verb:        {label:'Verb',        icon:'\u{1F3C3}', color:'#FF6B6B',
                definition:'A verb is an action word — it tells what someone or something does, or shows a state of being.',
                example:'run, jump, is, think'},
  adjective:   {label:'Adjective',   icon:'\u{1F3A8}', color:'#7C5CFF',
                definition:'An adjective is a word that describes a noun — it tells more about what something is like.',
                example:'big, blue, happy, three'},
  adverb:      {label:'Adverb',      icon:'\u26A1', color:'#FF9F45',
                definition:'An adverb describes a verb, adjective, or another adverb — it often tells how, when, or where something happens.',
                example:'quickly, yesterday, very, there'},
  preposition: {label:'Preposition', icon:'\u{1F4CD}', color:'#FF6FB5',
                definition:'A preposition shows how a noun relates to another word, often about place, time, or direction.',
                example:'in, on, under, before, with'},
  conjunction: {label:'Conjunction', icon:'\u{1F517}', color:'#FFD23F',
                definition:'A conjunction is a word that joins other words, phrases, or sentences together.',
                example:'and, but, or, because'},
  interjection:{label:'Interjection',icon:'\u2757', color:'#FF6B6B',
                definition:'An interjection is a short word or phrase that shows strong feeling or emotion, often followed by an exclamation mark.',
                example:'Wow!, Ouch!, Hooray!'},
  article:     {label:'Article',     icon:'\u{1F524}', color:'#9AA5B8',
                definition:'An article is a small word placed before a noun to show whether it means something specific or general.',
                example:'a, an, the'},
  subject:     {label:'Subject',     icon:'\u{1F3AF}', color:'#3EC6E0',
                definition:'The subject of a sentence is who or what the sentence is about — usually the noun or pronoun doing the action.',
                example:'In "The dog barked," dog is the subject.'},
  predicate:   {label:'Predicate',   icon:'\u{1F4AC}', color:'#7C5CFF',
                definition:'The predicate is the part of a sentence that tells what the subject does or is — it always includes the verb.',
                example:'In "The dog barked," barked is the predicate.'},
  sentence:    {label:'Sentence',    icon:'\u{1F4DD}', color:'#4CD964',
                definition:'A sentence is a group of words that expresses a complete thought, with a subject and a predicate.',
                example:'"Birds fly." is a complete sentence.'},
};

/* Also recognize a few common plural / alternate forms without
   needing separate dictionary entries. */
const GLOSSARY_ALIASES = {
  nouns:'noun', pronouns:'pronoun', verbs:'verb', adjectives:'adjective',
  adverbs:'adverb', prepositions:'preposition', conjunctions:'conjunction',
  interjections:'interjection', articles:'article', subjects:'subject',
  predicates:'predicate', sentences:'sentence',
};

function glossaryLookup(word){
  if(!word) return null;
  const clean = word.toLowerCase().replace(/[^a-z']/g,'');
  if(GRAMMAR_GLOSSARY[clean]) return {term:clean, ...GRAMMAR_GLOSSARY[clean]};
  if(GLOSSARY_ALIASES[clean]) return {term:GLOSSARY_ALIASES[clean], ...GRAMMAR_GLOSSARY[GLOSSARY_ALIASES[clean]]};
  return null;
}

/* Splits a raw whitespace-separated token into (leading punctuation,
   letters-only core, trailing punctuation) so we can underline only
   the word itself, e.g. "noun." -> ["", "noun", "."] */
function splitGlossaryToken(tok){
  const m = tok.match(/^([^A-Za-z']*)([A-Za-z']+)([^A-Za-z']*)$/);
  if(!m) return {pre:'', core:tok, post:''};
  return {pre:m[1], core:m[2], post:m[3]};
}

/* ══════════════════════════════════════════════════════════════
   renderGlossaryText — drop-in replacement for manually wrapping +
   fillText'ing a block of text. Draws the text word-wrapped inside
   maxWidth starting at (x,y) (y = baseline of the first line, left-
   aligned), underlines any recognized grammar term, and returns the
   clickable hit-region for each one so the host page can register
   them with its own click system.

   style: { font (CSS font string), fontSize (number, px),
            color (fill color), lineHeight (px, default fontSize*1.4),
            underlineColor (default style.color) }
   Returns: { hitRegions:[{x,y,w,h,term}], lines, height, endY }
   ══════════════════════════════════════════════════════════════ */
function renderGlossaryText(ctx, text, x, y, maxWidth, style){
  const font = style.font;
  const fontSize = style.fontSize || 24;
  const lineHeight = style.lineHeight || Math.round(fontSize*1.4);
  const color = style.color || '#2D3047';
  const underlineColor = style.underlineColor || color;

  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  const words = String(text).split(/\s+/).filter(Boolean);
  const hitRegions = [];
  let cx = x, cy = y, lines = 1;
  const spaceW = ctx.measureText(' ').width;

  words.forEach(word=>{
    const {pre,core,post} = splitGlossaryToken(word);
    const preW = pre ? ctx.measureText(pre).width : 0;
    const coreW = core ? ctx.measureText(core).width : 0;
    const postW = post ? ctx.measureText(post).width : 0;
    const totalW = preW+coreW+postW;

    if(cx!==x && cx+totalW>x+maxWidth){
      cx = x; cy += lineHeight; lines++;
    }

    ctx.fillStyle = color;
    if(pre){ctx.fillText(pre,cx,cy); cx+=preW;}

    const hit = glossaryLookup(core);
    if(hit){
      ctx.fillStyle = hit.color;
      ctx.fillText(core,cx,cy);
      ctx.strokeStyle = hit.color; ctx.lineWidth = Math.max(2,fontSize*0.07);
      ctx.beginPath();
      ctx.moveTo(cx, cy+fontSize*0.16);
      ctx.lineTo(cx+coreW, cy+fontSize*0.16);
      ctx.stroke();
      hitRegions.push({x:cx, y:cy-fontSize*0.85, w:coreW, h:fontSize*1.1, term:hit.term});
    } else {
      ctx.fillStyle = color;
      ctx.fillText(core,cx,cy);
    }
    cx += coreW;

    if(post){ctx.fillStyle=color;ctx.fillText(post,cx,cy);cx+=postW;}
    cx += spaceW;
  });

  return {hitRegions, lines, height:lines*lineHeight, endY:cy};
}

/* ══════════════════════════════════════════════════════════════
   drawGlossaryPopup — the little definition card. Anchored near
   (popupState.x, popupState.y) but clamped so it always stays fully
   on-screen. Call every frame while popupState is non-null.
   ══════════════════════════════════════════════════════════════ */
function drawGlossaryPopup(ctx, popupState, VW, VH){
  const entry = GRAMMAR_GLOSSARY[popupState.term];
  if(!entry) return null;

  const pw = 460;
  ctx.font = '600 20px "Fredoka", sans-serif';
  const words = entry.definition.split(' ');
  let line='', defLines=[];
  words.forEach(w=>{
    const test=line?line+' '+w:w;
    if(ctx.measureText(test).width > pw-56){defLines.push(line);line=w;}
    else line=test;
  });
  if(line)defLines.push(line);

  const hasExample = !!entry.example;
  let exampleLines=[];
  if(hasExample){
    ctx.font='600 16px "Fredoka", sans-serif';
    const exWords=('Example: '+entry.example).split(' ');
    let el='';
    exWords.forEach(w=>{
      const test=el?el+' '+w:w;
      if(ctx.measureText(test).width > pw-56){exampleLines.push(el);el=w;}
      else el=test;
    });
    if(el)exampleLines.push(el);
  }
  const ph = 118 + defLines.length*28 + (hasExample?exampleLines.length*22+16:0);

  let px = popupState.x - pw/2;
  let py = popupState.y - ph - 18;
  px = Math.max(20, Math.min(VW-pw-20, px));
  if(py < 20) py = popupState.y + 30; // flip below the word if not enough room above
  py = Math.max(20, Math.min(VH-ph-20, py));

  ctx.save();
  ctx.shadowColor='rgba(45,48,71,0.35)';ctx.shadowBlur=0;ctx.shadowOffsetY=6;
  ctx.fillStyle='#FFFFFF';
  chRoundRectPath(ctx,px,py,pw,ph,20);ctx.fill();
  ctx.restore();
  ctx.strokeStyle=entry.color;ctx.lineWidth=5;
  chRoundRectPath(ctx,px,py,pw,ph,20);ctx.stroke();

  const badgeCX=px+46,badgeCY=py+46,badgeR=28;
  ctx.fillStyle=entry.color;ctx.beginPath();ctx.arc(badgeCX,badgeCY,badgeR,0,Math.PI*2);ctx.fill();
  ctx.font='24px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(entry.icon,badgeCX,badgeCY+1);
  ctx.textBaseline='alphabetic';

  ctx.fillStyle=entry.color;ctx.font='800 28px "Baloo 2", sans-serif';ctx.textAlign='left';
  ctx.fillText(entry.label,px+86,py+54);

  ctx.fillStyle='#2D3047';ctx.font='600 20px "Fredoka", sans-serif';
  defLines.forEach((l,i)=>ctx.fillText(l,px+28,py+100+i*28));

  if(hasExample){
    const ey = py+100+defLines.length*28+10;
    ctx.fillStyle='#9AA5B8';ctx.font='600 16px "Fredoka", sans-serif';
    exampleLines.forEach((l,i)=>ctx.fillText(l,px+28,ey+18+i*22));
  }

  ctx.fillStyle='#9AA5B8';ctx.font='500 14px "Fredoka", sans-serif';ctx.textAlign='right';
  ctx.fillText('tap anywhere to close',px+pw-20,py+ph-14);
  ctx.textAlign='left';

  return {x:px,y:py,w:pw,h:ph};
}
