/* ════════════════════════════════════════════════════════════════
   Grammar Vault — Report Card
   Shown after the player finishes Level 20. Breaks their performance
   down by category (Grammar, Punctuation, Spelling, Vocabulary,
   Reading Comprehension), awards a medal overall and per category,
   and gives kid-friendly tips for whichever area they struggled with
   most.

   This file expects to run in the same page as grammar_vault.html and
   freely uses its globals: ctx, VW, VH, fc, KC, KF, rr, shade,
   chRoundRectPath, drawChunkyButton, drawSkyBackground,
   drawFloatingLetters, drawOwlMascot, reg, clickables, optHover,
   playerName, score, totalAnswered, categoryStats, beginAdventure —
   the same pattern character.js and glossary.js already use.
   ════════════════════════════════════════════════════════════════ */

const REPORT_CATEGORY_META = {
  'Grammar': {
    icon: '\u{1F4D8}', color: '#3EC6E0',
    tips: [
      'Practice spotting nouns, verbs, and adjectives in books, signs, or menus you see every day.',
      'Try making up silly sentences using a noun, a verb, and an adjective on purpose!',
    ],
  },
  'Punctuation': {
    icon: '\u2757', color: '#FF9F45',
    tips: [
      'Read sentences out loud and pause at every comma, and stop fully at every period.',
      'Practice adding the right end mark (. ? !) to sentences you write yourself.',
    ],
  },
  'Spelling': {
    icon: '\u{1F41D}', color: '#FFD23F',
    tips: [
      'Break tricky words into smaller chunks and say each part out loud before writing it.',
      'Write new words three times each — your hand helps your brain remember!',
    ],
  },
  'Vocabulary': {
    icon: '\u{1F4DA}', color: '#7C5CFF',
    tips: [
      'Read a little every day and try to guess what a new word means before looking it up.',
      'Pick one new word each day and use it in a sentence out loud.',
    ],
  },
  'Reading Comprehension': {
    icon: '\u{1F50D}', color: '#FF6B6B',
    tips: [
      'After you finish a story, try retelling it in your own words to a friend or family member.',
      "Ask yourself 'who, what, where, and why' questions while you read.",
    ],
  },
};
const REPORT_CATEGORIES = ['Grammar','Punctuation','Spelling','Vocabulary','Reading Comprehension'];

/* ── Medal tiers, based on percent correct ── */
function getMedal(pct){
  if(pct===null) return {tier:'none', label:'No Data', icon:'\u2796', color:'#B7C4D6'};
  if(pct>=90) return {tier:'gold',    label:'Gold Medal',    icon:'\u{1F947}', color:'#FFD23F'};
  if(pct>=75) return {tier:'silver',  label:'Silver Medal',  icon:'\u{1F948}', color:'#AAB6C4'};
  if(pct>=60) return {tier:'bronze',  label:'Bronze Medal',  icon:'\u{1F949}', color:'#D8935A'};
  return              {tier:'practice',label:'Keep Practicing',icon:'\u2B50',   color:'#7C5CFF'};
}

function computeReportRows(){
  return REPORT_CATEGORIES.map(cat=>{
    const s = (typeof categoryStats!=='undefined' && categoryStats[cat]) || {correct:0,total:0};
    const pct = s.total>0 ? Math.round(100*s.correct/s.total) : null;
    return {
      category: cat, correct: s.correct, total: s.total, pct,
      medal: getMedal(pct), meta: REPORT_CATEGORY_META[cat],
    };
  });
}

function drawProgressBar(x,y,w,h,pct,color){
  chRoundRectPath(ctx,x,y,w,h,h/2);
  ctx.fillStyle='#EAEFF5';ctx.fill();
  if(pct>0){
    const fw=Math.max(h, w*pct/100);
    ctx.save();
    chRoundRectPath(ctx,x,y,w,h,h/2);ctx.clip();
    ctx.fillStyle=color;
    chRoundRectPath(ctx,x,y,fw,h,h/2);ctx.fill();
    ctx.restore();
  }
}

function drawStatCard(x,y,w,h,label,value,color){
  ctx.fillStyle='#F3FAFF';chRoundRectPath(ctx,x,y,w,h,16);ctx.fill();
  ctx.strokeStyle='rgba(45,48,71,0.12)';ctx.lineWidth=2;chRoundRectPath(ctx,x,y,w,h,16);ctx.stroke();
  ctx.fillStyle=color;ctx.font='800 40px "Baloo 2", sans-serif';ctx.textAlign='center';
  ctx.fillText(value,x+w/2,y+52);
  ctx.fillStyle='#5C6B8A';ctx.font='600 17px "Fredoka", sans-serif';
  ctx.fillText(label,x+w/2,y+82);
}

function drawStatsReport(){
  clickables=[];
  drawSkyBackground();
  drawFloatingLetters();

  const pw=1500,ph=1010,px=(VW-pw)/2,py=(VH-ph)/2;
  ctx.save();
  ctx.shadowColor='rgba(45,48,71,0.3)';ctx.shadowBlur=0;ctx.shadowOffsetY=8;
  ctx.fillStyle='#FFFFFF';chRoundRectPath(ctx,px,py,pw,ph,30);ctx.fill();
  ctx.restore();
  ctx.strokeStyle=KC.panelEdge;ctx.lineWidth=7;chRoundRectPath(ctx,px,py,pw,ph,30);ctx.stroke();

  const rows = computeReportRows();
  const wrong = Math.max(0, totalAnswered-score);
  const overallPct = totalAnswered>0 ? Math.round(100*score/totalAnswered) : 0;
  const overallMedal = getMedal(totalAnswered>0 ? overallPct : null);
  const playedRows = rows.filter(r=>r.total>0);
  const weakest = playedRows.length ? playedRows.reduce((a,b)=>b.pct<a.pct?b:a) : null;
  const strongest = playedRows.length ? playedRows.reduce((a,b)=>b.pct>a.pct?b:a) : null;

  /* ── Header ── */
  ctx.textAlign='center';
  ctx.fillStyle=KC.titleShadow;ctx.font='800 52px "Baloo 2", sans-serif';
  ctx.fillText('\u{1F4CA} YOUR REPORT CARD',VW/2+3,py+66+3);
  ctx.fillStyle=KC.title;
  ctx.fillText('\u{1F4CA} YOUR REPORT CARD',VW/2,py+66);
  ctx.fillStyle=KC.sub;ctx.font=KF.norm;
  ctx.fillText(`${playerName||'Student'}'s Grammar Vault results`,VW/2,py+102);

  /* ── Overall medal badge ── */
  const medalCX=px+118, medalCY=py+170, medalR=58;
  ctx.fillStyle=overallMedal.color;ctx.beginPath();ctx.arc(medalCX,medalCY,medalR,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=KC.panelEdge;ctx.lineWidth=4;ctx.beginPath();ctx.arc(medalCX,medalCY,medalR,0,Math.PI*2);ctx.stroke();
  ctx.font='52px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(overallMedal.icon,medalCX,medalCY+2);
  ctx.textBaseline='alphabetic';
  ctx.fillStyle=KC.ink;ctx.font='700 22px "Fredoka", sans-serif';
  ctx.fillText(overallMedal.label,medalCX,medalCY+90);
  ctx.textAlign='left';

  /* ── Overall stat cards ── */
  const cardsX=px+236, cardsY=py+120, cardW=290, cardH=104, cardGap=22;
  drawStatCard(cardsX,cardsY,cardW,cardH,'Correct Answers',String(score),'#2FAE49');
  drawStatCard(cardsX+cardW+cardGap,cardsY,cardW,cardH,'Questions to Review',String(wrong),'#E14F4F');
  drawStatCard(cardsX+(cardW+cardGap)*2,cardsY,cardW,cardH,'Overall Accuracy',overallPct+'%','#5B3FE0');
  drawStatCard(cardsX+(cardW+cardGap)*3,cardsY,cardW,cardH,'Total Questions',String(totalAnswered),'#3A6EA5');

  /* ── Per-category breakdown ── */
  const listY=py+330, rowH=74, rowGap=8, rowX=px+50, rowW=pw-100;
  ctx.fillStyle=KC.ink;ctx.font='700 22px "Baloo 2", sans-serif';ctx.textAlign='left';
  ctx.fillText('Breakdown by Skill',rowX,listY-14);

  rows.forEach((r,i)=>{
    const ry=listY+i*(rowH+rowGap);
    ctx.fillStyle='#F7F9FC';chRoundRectPath(ctx,rowX,ry,rowW,rowH,16);ctx.fill();
    ctx.strokeStyle='rgba(45,48,71,0.10)';ctx.lineWidth=2;chRoundRectPath(ctx,rowX,ry,rowW,rowH,16);ctx.stroke();

    const bcx=rowX+46,bcy=ry+rowH/2,br=28;
    ctx.fillStyle=r.meta.color;ctx.beginPath();ctx.arc(bcx,bcy,br,0,Math.PI*2);ctx.fill();
    ctx.font='24px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(r.meta.icon,bcx,bcy+1);
    ctx.textBaseline='alphabetic';

    ctx.fillStyle=KC.ink;ctx.font='700 21px "Fredoka", sans-serif';ctx.textAlign='left';
    ctx.fillText(r.category,rowX+92,ry+30);

    const barX=rowX+92,barY=ry+42,barW=460,barH=14;
    drawProgressBar(barX,barY,barW,barH,r.pct||0,r.meta.color);

    ctx.fillStyle='#5C6B8A';ctx.font='600 17px "Fredoka", sans-serif';
    ctx.fillText(r.total>0 ? `${r.correct}/${r.total} correct (${r.pct}%)` : 'Not attempted', barX+barW+16, ry+30);

    const mX=rowX+rowW-130;
    ctx.font='26px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(r.medal.icon,mX,bcy+1);
    ctx.textBaseline='alphabetic';
    ctx.fillStyle=r.medal.color==='#B7C4D6'?'#9AA5B8':KC.ink;ctx.font='600 15px "Fredoka", sans-serif';ctx.textAlign='center';
    ctx.fillText(r.medal.label,mX,ry+58);
    ctx.textAlign='left';
  });

  /* ── Focus area / tips box ── */
  const focusY=listY+rows.length*(rowH+rowGap)+14, focusH=118;
  if(weakest){
    ctx.fillStyle='#FFF8EC';chRoundRectPath(ctx,rowX,focusY,rowW,focusH,18);ctx.fill();
    ctx.strokeStyle=weakest.meta.color;ctx.lineWidth=4;chRoundRectPath(ctx,rowX,focusY,rowW,focusH,18);ctx.stroke();

    ctx.font='34px sans-serif';ctx.textAlign='left';
    ctx.fillText('\u{1F3AF}',rowX+24,focusY+46);
    ctx.fillStyle=KC.ink;ctx.font='700 22px "Baloo 2", sans-serif';
    ctx.fillText(`Focus Area: ${weakest.category} (${weakest.pct}%)`,rowX+70,focusY+42);

    ctx.fillStyle='#5C6B8A';ctx.font='500 18px "Fredoka", sans-serif';
    weakest.meta.tips.forEach((tip,i)=>{
      const lines = wrapT('\u2022 '+tip, rowW-100);
      lines.forEach((l,li)=>ctx.fillText(l, rowX+70, focusY+72+i*24+li*24));
    });

    if(strongest && strongest.category!==weakest.category){
      ctx.fillStyle='#2FAE49';ctx.font='600 17px "Fredoka", sans-serif';ctx.textAlign='right';
      ctx.fillText(`\u{1F31F} Best skill: ${strongest.category} (${strongest.pct}%)`,rowX+rowW-24,focusY+focusH-14);
      ctx.textAlign='left';
    }
  } else {
    ctx.fillStyle='#F3FAFF';chRoundRectPath(ctx,rowX,focusY,rowW,focusH,18);ctx.fill();
    ctx.fillStyle=KC.inkSoft;ctx.font='600 20px "Fredoka", sans-serif';ctx.textAlign='center';
    ctx.fillText('Play through the vault to get your personalized tips!',rowX+rowW/2,focusY+focusH/2+7);
    ctx.textAlign='left';
  }

  /* ── Buttons ── */
  const btnY=focusY+focusH+26, btnH=80;
  const btn1W=340,btn1X=px+pw/2-btn1W-14,hi1=optHover===0;
  drawChunkyButton(btn1X,btnY,btn1W,btnH,'Play Again','\u{1F504}',KC.play,KC.playDark,hi1);
  reg(btn1X,btnY,btn1W,btnH+10,()=>{beginAdventure();},0);

  const btn2W=340,btn2X=px+pw/2+14,hi2=optHover===1;
  drawChunkyButton(btn2X,btnY,btn2W,btnH,'Main Menu','\u2302',KC.quit,KC.quitDark,hi2);
  reg(btn2X,btnY,btn2W,btnH+10,()=>{scene='menu';},1);
}
