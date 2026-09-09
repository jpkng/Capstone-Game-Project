/* ════════════════════════════════════════════════════════════════
   Grammar Vault — Voice-to-Text Input
   Lets the player answer typed questions (Spelling, "type the plural
   of...", etc.) by speaking instead of typing, using the browser's
   built-in speech recognition. Pairs with speech.js (which reads
   questions OUT loud) to make typed questions fully voice-driven if
   the player wants — or they can just type as before. Both are
   always optional; nothing here is required to play.

   Requires a secure context (https://, or http://localhost) — the
   same browser restriction as any microphone access. On a page that
   doesn't meet that (or a browser without speech recognition at
   all), sttSupported is simply false and the mic button never
   appears; typing still works exactly as before.

   This file expects to run in the same page as grammar_vault.html
   and freely uses its globals (ctx, fc), the same pattern
   character.js / glossary.js / speech.js already use.
   ════════════════════════════════════════════════════════════════ */

const SpeechRecognitionCtor = (typeof window!=='undefined')
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;
const sttSupported = !!SpeechRecognitionCtor;

let sttListening = false;
let sttRecognizer = null;

/* Cleans up a spoken transcript for use as a typed answer: browsers
   often capitalize the first word and may add a trailing period,
   neither of which we want for a one- or two-word spelling answer. */
function sttCleanTranscript(text){
  let t = String(text||'').trim();
  t = t.replace(/[.!?]+$/,'');
  return t;
}

/* Starts listening for a single spoken answer.
     onResult(text, isFinal) — called with the live transcript as the
       player speaks (isFinal=false), then once more with the final
       version (isFinal=true) when they stop talking.
     onEnd()   — called when the recognizer session closes, however
                 that happens (finished, stopped, or errored).
     onError(reason) — called on failure, e.g. 'not-allowed' if the
                 player declines microphone permission, or 'no-speech'
                 if nothing was heard in time.               */
function sttStart(onResult,onEnd,onError){
  if(!sttSupported){ if(onError)onError('unsupported'); return; }
  if(sttListening) sttStop();
  if(typeof stopSpeaking==='function') stopSpeaking(); // don't let the mic pick up our own TTS voice

  const rec = new SpeechRecognitionCtor();
  rec.lang = 'en-US';
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onstart = ()=>{ sttListening = true; };
  rec.onresult = (e)=>{
    let text='', isFinal=false;
    for(let i=e.resultIndex;i<e.results.length;i++){
      text += e.results[i][0].transcript;
      if(e.results[i].isFinal) isFinal=true;
    }
    if(onResult) onResult(sttCleanTranscript(text), isFinal);
  };
  rec.onerror = (e)=>{ sttListening=false; if(onError) onError(e.error||'error'); };
  rec.onend = ()=>{ sttListening=false; sttRecognizer=null; if(onEnd) onEnd(); };

  sttRecognizer = rec;
  try{ rec.start(); }
  catch(e){ sttListening=false; sttRecognizer=null; if(onError) onError('start-failed'); }
}

function sttStop(){
  if(sttRecognizer){
    try{ sttRecognizer.stop(); }catch(e){}
  }
  sttListening = false;
}

/* ── Drawing helpers (visual style matches speech.js's speaker button) ── */

function drawMicButton(x,y,r,listening,accentColor){
  const color = accentColor || '#7C5CFF';
  if(listening){
    const pulse = 1 + 0.16*Math.sin((typeof fc!=='undefined'?fc:0)*0.3);
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = '#E14F4F';
    ctx.beginPath(); ctx.arc(x,y,r*1.4*pulse,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = listening ? '#E14F4F' : '#FFFFFF';
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = listening ? '#E14F4F' : color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();

  ctx.font = Math.round(r*1.1)+'px sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('\u{1F3A4}', x, y+1);
  ctx.textBaseline='alphabetic';
}

function micButtonHitbox(x,y,r){
  return {x:x-r, y:y-r, w:r*2, h:r*2};
}
