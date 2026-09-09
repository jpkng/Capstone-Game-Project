/* ════════════════════════════════════════════════════════════════
   Grammar Vault — Read Aloud (Text-to-Speech)
   Lets the game speak quiz questions — and, for multiple-choice
   questions, each answer option — out loud using the browser's
   built-in speech synthesis (the "AI voice" every modern browser
   ships with). No API key or network call required.

   Two ways a player hears a question:
     1. Automatically, if the "Read Aloud" option is turned on
        (grammar_vault.html calls speakQuestion() when a new
        question appears).
     2. On demand, by clicking the speaker button drawn by
        drawSpeakerButton() — always available regardless of the
        auto-read setting, so a player can replay a question anytime.

   This file expects to run in the same page as grammar_vault.html
   and freely uses its globals (ctx, fc, KC, shade), the same pattern
   character.js / glossary.js / stats_report.js already use. It does
   NOT depend on anything else in this game, though, so it would also
   drop into any other canvas project as-is.
   ════════════════════════════════════════════════════════════════ */

const ttsSupported = (typeof window!=='undefined' && 'speechSynthesis' in window);
let ttsVoice = null;
let ttsSpeaking = false;
let ttsVoicesReady = false;

/* Names that tend to sound clearer/friendlier for a young audience,
   checked in order of preference. Every browser/OS ships a different
   voice list, so this is a best-effort — we always fall back
   gracefully to whatever English voice is available. */
const TTS_PREFERRED_VOICE_NAMES = [
  'Google US English', 'Samantha', 'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)', 'Karen', 'Moira', 'Tessa', 'Google UK English Female',
];

function ttsPickVoice(){
  if(!ttsSupported) return null;
  const voices = window.speechSynthesis.getVoices();
  if(!voices || !voices.length) return null;

  for(const name of TTS_PREFERRED_VOICE_NAMES){
    const hit = voices.find(v=>v.name===name);
    if(hit) return hit;
  }
  const enUS = voices.find(v=>/^en-US/i.test(v.lang) && /female/i.test(v.name));
  if(enUS) return enUS;
  const anyEnUS = voices.find(v=>/^en-US/i.test(v.lang));
  if(anyEnUS) return anyEnUS;
  const anyEn = voices.find(v=>/^en/i.test(v.lang));
  if(anyEn) return anyEn;
  return voices[0];
}

function ttsInit(){
  if(!ttsSupported) return;
  const refresh = ()=>{ ttsVoice = ttsPickVoice(); ttsVoicesReady = !!ttsVoice; };
  refresh();
  // Chrome/Edge load voices asynchronously the first time.
  if(typeof window.speechSynthesis.addEventListener==='function'){
    window.speechSynthesis.addEventListener('voiceschanged', refresh);
  }
}
if(ttsSupported) ttsInit();

function stopSpeaking(){
  if(!ttsSupported) return;
  try{ window.speechSynthesis.cancel(); }catch(e){}
  ttsSpeaking = false;
}

/* Speaks arbitrary text. Cancels anything already playing first, so
   calling this again immediately (e.g. a new question loading)
   naturally interrupts the old one instead of overlapping it. */
function speakText(text){
  if(!ttsSupported || !text) return;
  try{ window.speechSynthesis.cancel(); }catch(e){}
  const utter = new SpeechSynthesisUtterance(text);
  if(ttsVoice) utter.voice = ttsVoice;
  utter.rate = 0.95;   // a touch slower than default — easier for young readers to follow along
  utter.pitch = 1.05;  // a little brighter/friendlier
  utter.volume = 1;
  utter.onstart = ()=>{ ttsSpeaking = true; };
  utter.onend   = ()=>{ ttsSpeaking = false; };
  utter.onerror = ()=>{ ttsSpeaking = false; };
  try{ window.speechSynthesis.speak(utter); }catch(e){ ttsSpeaking = false; }
}

const TTS_OPTION_LETTERS = ['A','B','C','D','E','F'];

/* Builds the full spoken script for a quiz question: the question
   itself, then (for multiple choice) each option read out with its
   letter, so a player can answer purely by listening. */
function buildQuestionScript(npc){
  if(!npc) return '';
  let script = npc.q;
  if(npc.type==='MC' && Array.isArray(npc.opts)){
    const optionsText = npc.opts.map((opt,i)=>`Option ${TTS_OPTION_LETTERS[i]||i+1}: ${opt}.`).join(' ');
    script += '  ' + optionsText;
  } else if(npc.type==='TYPED'){
    script += '  Type your answer.';
  }
  return script;
}
function speakQuestion(npc){
  speakText(buildQuestionScript(npc));
}

/* ── Drawing helpers (visual style matches the rest of the game) ── */

/* A round speaker button. Pass the current "speaking" state so it can
   swap icon/color while playing. Draw-only — the caller registers the
   click region with its own reg() system, same pattern glossary.js
   uses for its hit regions. */
function drawSpeakerButton(x,y,r,speaking,accentColor){
  const color = accentColor || '#7C5CFF';
  if(speaking){
    const pulse = 1 + 0.12*Math.sin((typeof fc!=='undefined'?fc:0)*0.25);
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x,y,r*1.35*pulse,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = speaking ? color : '#FFFFFF';
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();

  ctx.font = Math.round(r*1.15)+'px sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(speaking ? '\u23F9\uFE0F' : '\u{1F50A}', x, y+1);
  ctx.textBaseline='alphabetic';
}

/* Returns the bounding box for drawSpeakerButton so the host can
   reg() the exact same area that was drawn. */
function speakerButtonHitbox(x,y,r){
  return {x:x-r, y:y-r, w:r*2, h:r*2};
}
