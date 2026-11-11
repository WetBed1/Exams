import {SECTIONS, MAP_FIELDS, parseClock, completeDraft, gradeMC, gradeMap, gradeRubric, displayScore, totals} from './logic.mjs';

const KEY = 'aosc105-test2-exam40-v1';
const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const icons = {
 cloud:'<path d="M6 17h13a4 4 0 0 0-3-7 6 6 0 0 0-11 2 2.5 2.5 0 0 0 1 5Z"/>',
 arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',
 back:'<path d="M20 12H5m5-5-5 5 5 5"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 bookmark:'<path d="M6 3h12v18l-6-4-6 4Z"/>',
 bulb:'<path d="M9 18h6m-5 3h4M8 14c-5-5-1-11 4-11s9 6 4 11l-1 2H9Z"/>',
 pause:'<path d="M8 5v14M16 5v14"/>',
 grid:'<path d="M3 3h7v7H3Zm11 0h7v7h-7ZM3 14h7v7H3Zm11 0h7v7h-7Z"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 history:'<path d="M3 4v6h6M3 10a9 9 0 1 1 1 8m8-11v5l3 2"/>',
 minus:'<path d="M6 12h12"/>',
 expand:'<path d="M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"/>'
};
const ico = (name,size=18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] ?? icons.check}</svg>`;
const esc = text => String(text ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let bank, state, storageOK=true, navOpen=false, filter='needs', saveTimer, toastTimer;
function fresh(history=[], attempt=1, mode='practice') {
 return {version:1,attempt,mode,view:'welcome',started:false,finished:false,cursor:0,answers:{},flags:[],hints:[],elapsedMs:0,runningSince:null,history};
}
function loadState() {
 try {
  const found=JSON.parse(localStorage.getItem(KEY));
  if(found?.version===1 && found.answers && typeof found.answers==='object') {
   found.cursor=Math.max(0,Math.min(39,Number(found.cursor)||0));
   return {...fresh(),...found,flags:found.flags??[],hints:found.hints??[],history:found.history??[]};
  }
 } catch { storageOK=false; }
 return fresh();
}
function save() {
 clearTimeout(saveTimer);
 try {localStorage.setItem(KEY,JSON.stringify(state)); storageOK=true;} catch {storageOK=false;}
 updateSaveStatus();
}
function scheduleSave() {clearTimeout(saveTimer);saveTimer=setTimeout(save,150);}
function updateSaveStatus() {
 const el=document.querySelector('.save-status');
 if(el){el.classList.toggle('error',!storageOK);el.innerHTML=ico(storageOK?'check':'close',14)+`<span>${storageOK?'Saved on this browser':'Progress could not be saved'}</span>`;el.title=storageOK?'Your progress is saved on this browser.':'This browser is blocking local storage. Keep this tab open and export your answers.';}
}
function toast(message) {
 const t=document.querySelector('#toast'); t.textContent=message;t.classList.add('visible');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),2500);
}
function elapsed() {return state.elapsedMs+(state.runningSince?Date.now()-state.runningSince:0);}
function timeLabel() {const secs=Math.floor(elapsed()/1000),m=Math.floor(secs/60);return `${String(m).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;}
function stopClock(){if(state.runningSince){state.elapsedMs+=Date.now()-state.runningSince;state.runningSince=null;}}
function startClock(){if(!state.runningSince&&!state.finished)state.runningSince=Date.now();}
function answer(q){return state.answers[q.id]??{};}
function ensure(q){return state.answers[q.id]??= {choice:'',text:'',fields:{},rubricValues:{}};}
function reveal(){return state.mode==='practice'||state.finished;}
function scoreClass(a){return !a?.grade?'neutral':a.grade.score===2.5?'correct':a.grade.score===0?'incorrect':'partial';}
function shortTopic(q){return q.topic.replace(/^[^:]+:\s*/,'');}

function header(){
 const live=state.view==='question'&&!state.finished;
 return `<header class="topbar">
  <button class="brand" data-action="home" aria-label="Practice exam home"><span class="brandmark">${ico('cloud',26)}</span><span><span class="brandtitle">AOSC 105</span><span class="brandsub">THE PRACTICE DESK</span></span></button>
  <div class="topmiddle"><span>Introduction to Meteorology</span><span class="dot"></span><span>Test 2</span></div>
  <div class="topactions">${state.started?'<div class="save-status"></div>':''}
  ${state.history.length?`<button class="iconbutton" data-action="history" aria-label="Attempt history">${ico('history',15)} History</button>`:''}
  ${live?`<button class="iconbutton" data-action="pause">${ico('pause',15)} Pause & exit</button>`:''}
  </div></header>`;
}

function welcome(){
 const t=totals(bank,state.answers),resume=state.started;
 return `${header()}<main class="welcome">
 <div class="welcome-grid"><section>
  <p class="eyebrow">Your Test 2 study guide, in practice</p>
  <h1>Test 2<br>practice exam.</h1>
  <p class="intro">Work through 40 questions on the weather concepts in your study guide, with clear explanations and room to show your reasoning.</p>
  <div class="topic-strip"><span>Moisture & clouds</span><span>Pressure & wind</span><span>Weather maps</span></div>
  <div class="welcome-statrow"><div class="welcome-stat"><strong>40</strong>questions</div><div class="welcome-stat"><strong>100</strong>total points</div><div class="welcome-stat"><strong>75–90</strong>minutes suggested</div></div>
 </section>
 <section class="start-card" aria-labelledby="start-title"><div class="card-header"><h3 id="start-title">${resume?(state.finished?'Your saved attempt':'Pick up where you left off'):'Choose your pace'}</h3>${ico('cloud',20)}</div>
 ${resume?`<div class="resume-note"><strong>Attempt ${state.attempt} · ${t.answered} of 40 answered</strong>${state.finished?'Finished · ready to review':`Paused at question ${state.cursor+1}`} · ${timeLabel()} elapsed</div>`:''}
 <div role="radiogroup" aria-label="Feedback mode">
 <button class="mode-option ${state.mode==='practice'?'active':''}" role="radio" aria-checked="${state.mode==='practice'}" data-action="mode" data-mode="practice" ${resume?'disabled':''}><span class="mode-circle"></span><span><strong>Learn as you go</strong><small>See explanations after each answer.<br>A good choice for today’s revision.</small></span></button>
 <button class="mode-option ${state.mode==='exam'?'active':''}" role="radio" aria-checked="${state.mode==='exam'}" data-action="mode" data-mode="exam" ${resume?'disabled':''}><span class="mode-circle"></span><span><strong>Exam practice</strong><small>Answer first. Review explanations and<br>check written answers at the end.</small></span></button></div>
 <button class="btn" data-action="${resume?(state.finished?'results':'resume'):'start'}">${resume?(state.finished?'Review your attempt':'Resume exam'):'Start practice exam'}${ico('arrow',17)}</button>
 <p class="note">Multiple-choice and map entries are scored automatically. Written answers use a model answer and a point-by-point self-check rubric.</p>
 ${resume?'<button class="textbtn" data-action="restart" style="margin-top:12px">Start a fresh attempt</button>':''}
 </section></div>
 <section class="section-overview"><div class="overview-head"><h2>What’s inside</h2><span class="small muted">2.5 points per question</span></div>
 <div class="section-columns">
 <div class="section-column"><div class="index">01 / QUESTIONS 1–16</div><h3>Multiple choice <span>40%</span></h3><p>Four choices per question, with an explanation for every option.</p></div>
 <div class="section-column"><div class="index">02 / QUESTIONS 17–32</div><h3>Written answers <span>40%</span></h3><p>Short explanations, scenarios, and a lapse-rate calculation. Partial credit included.</p></div>
 <div class="section-column"><div class="index">03 / QUESTIONS 33–40</div><h3>Map skills <span>20%</span></h3><p>Time conversions, station models, radar, isobars, and a 500-mb map.</p></div>
 </div></section>
 <footer class="welcome-footer"><span>Unit 2 + the winds and upper-air-map portion of Unit 3.</span><span>Calculator permitted · not a phone, per the study guide.</span></footer>
 </main>`;
}

function sidebar(){
 const t=totals(bank,state.answers);
 return `${navOpen?'<button class="sidebar-shade" data-action="toggle-nav" aria-label="Close question navigator"></button>':''}<aside class="sidebar ${navOpen?'open':''}" aria-label="Question navigation"><p class="side-heading">Your question map</p>
 ${SECTIONS.map(s=>`<section class="side-section"><div class="side-section-title">${s.name}<small>${t.sections[s.id].answered}/${s.count}</small></div><div class="question-grid">${bank.questions.slice(s.start,s.end+1).map((q,i)=>{
 const a=answer(q),cls=a.submitted?(reveal()&&a.grade?scoreClass(a):'answered'):'';
 return `<button class="question-chip ${cls} ${state.cursor===q.number-1?'current':''} ${state.flags.includes(q.id)?'flagged':''}" data-action="jump" data-index="${q.number-1}" aria-label="Question ${q.number}${a.submitted?', answered':''}${state.flags.includes(q.id)?', flagged':''}" ${state.cursor===q.number-1?'aria-current="step"':''}>${q.number}</button>`;
 }).join('')}</div></section>`).join('')}
 <div class="side-key"><span><i class="legend-dot green"></i>Answered</span><span><i class="legend-dot gold"></i>Flagged</span></div>
 <div class="side-bottom"><button class="btn secondary" data-action="${state.finished?'results':'finish'}">${state.finished?'Back to results':'Finish & review'}${ico('arrow',15)}</button><p>${state.mode==='practice'?'Explanations appear after you submit.':'Answers stay hidden until you finish.'}<br>Written scores are marked as self-checked.</p></div>
 </aside>`;
}

function options(q,a){
 const show=reveal()&&(a.submitted||state.finished),locked=a.submitted||state.finished;
 return `<div class="options" role="radiogroup" aria-label="Answer choices">${q.options.map(o=>{
 const isRight=show&&q.correctValues.includes(o.value),isWrong=show&&a.choice===o.value&&!isRight;
 return `<button class="option ${a.choice===o.value?'selected':''} ${isRight?'correct':''} ${isWrong?'incorrect':''}" role="radio" aria-checked="${a.choice===o.value}" data-action="choose" data-value="${o.value}" ${locked?'disabled':''}>
 <span class="option-key">${o.value}</span><span class="choice-text">${esc(o.label)}</span>${isRight?`<span class="option-status">${ico('check',19)}</span>`:isWrong?`<span class="option-status">${ico('close',19)}</span>`:''}</button>`;
 }).join('')}</div>`;
}

function mapInputs(q,a){
 return `<div class="map-fields">${MAP_FIELDS[q.id].map(f=>{
 const value=a.fields?.[f.key]??'',disabled=a.submitted||state.finished;
 const control=f.type==='select'?`<select id="field-${f.key}" data-field="${f.key}" ${disabled?'disabled':''}><option value="">Choose an answer…</option>${f.choices.map(([v,label])=>`<option value="${esc(v)}" ${value===v?'selected':''}>${esc(label)}</option>`).join('')}</select>`:
 `<input id="field-${f.key}" data-field="${f.key}" type="${f.type}" ${f.type==='number'?'step="any"':''} ${f.type==='text'?'autocomplete="off" spellcheck="false"':''} value="${esc(value)}" placeholder="${esc(f.placeholder??'Enter a value')}" ${disabled?'disabled':''}>`;
 return `<div class="map-field"><label for="field-${f.key}">${esc(f.label)}</label>${control}</div>`;
 }).join('')}</div>`;
}

function errorDetails(q){return `<details class="explanations"><summary>Common mistakes, explained</summary><div class="explanations-body">${q.common_errors.map(e=>`<div class="explanation-row"><strong>${esc(e.error)}</strong>${esc(e.feedback)}</div>`).join('')}</div></details>`;}

function rubric(q,a){
 const values=a.rubricValues??{},grade=gradeRubric(q,values),preview=q.rubric.reduce((s,r,i)=>s+r.points*({full:1,partial:.5,none:0}[values[i]]??0),0);
 return `<section class="rubric-card" aria-label="Written answer self-check"><div class="rubric-title"><h3>${a.grade?'Your rubric check':'Check the ideas in your answer'}</h3><span class="small muted">Self-check</span></div><p>Compare your submitted answer with the model above. Mark what you actually included; equivalent wording counts.</p>
 ${q.rubric.map((r,i)=>`<div class="rubric-row"><div class="rubric-row-head"><strong>${esc(r.criterion)}</strong><small>${displayScore(r.points)} pts</small></div><div class="rubric-choice" role="group" aria-label="Criterion ${i+1}">${[['full','Included'],['partial','Partly'],['none','Missed']].map(([v,label])=>`<button data-action="rubric" data-index="${i}" data-value="${v}" class="${values[i]===v?'active':''}" aria-pressed="${values[i]===v}" ${a.grade?'disabled':''}>${label}</button>`).join('')}</div></div>`).join('')}
 <div class="rubric-confirm"><span class="rubric-score">${displayScore(preview)} / 2.5 points</span>${a.grade?'<span class="submitted-note">'+ico('check',14)+' Self-check recorded</span>':`<button class="btn" data-action="confirm-rubric" ${grade?'':'disabled'}>Record self-check ${ico('check',15)}</button>`}</div>
 ${!a.grade&&!grade?'<p class="small muted" style="margin-top:10px">Choose Included, Partly, or Missed for every criterion.</p>':''}
 </section>`;
}

function feedback(q,a){
 if(!a.submitted&&!state.finished)return '';
 if(!reveal())return `<div class="feedback neutral" tabindex="-1"><div class="feedback-top">${ico('check',17)} Answer recorded</div><p>Continue with the exam. Your answer and its explanation will be available when you finish.</p></div>`;
 const unanswered=!a.submitted;
 if(q.section==='multiple_choice'){
  const keyed=q.options.find(o=>q.correctValues.includes(o.value));
  const chosen=q.options.find(o=>o.value===a.choice);
  const good=a.grade?.score===q.points;
  return `<div class="feedback ${good?'':'wrong'}" tabindex="-1"><div class="feedback-top"><span>${ico(good?'check':'close',17)} ${unanswered?'No answer submitted':good?'Correct answer':'Let’s review this one'}</span><span class="score">${displayScore(a.grade?.score??0)} / 2.5</span></div>
  ${chosen?`<p>${esc(chosen.feedback)}</p>`:''}${!good?`<p class="key-answer">The answer is ${keyed.value}: ${esc(keyed.label)}</p><p>${esc(keyed.feedback)}</p>`:''}</div>
  <details class="explanations"><summary>Why each option is right or wrong</summary><div class="explanations-body">${q.options.map(o=>`<div class="explanation-row"><strong>${o.value}. ${esc(o.label)}${q.correctValues.includes(o.value)?' · Answer':''}</strong>${esc(o.feedback)}</div>`).join('')}</div></details>`;
 }
 if(q.section==='map_skills'){
  const g=a.grade,cls=!g||g.score===0?'wrong':g.score===2.5?'':'partial';
  return `<div class="feedback ${cls}" tabindex="-1"><div class="feedback-top"><span>${ico(g?.score===2.5?'check':'minus',17)} ${unanswered?'No answer submitted':g?.score===2.5?'Map interpretation checked':'Map interpretation review'}</span><span class="score">${displayScore(g?.score??0)} / 2.5</span></div><p>${esc(q.model_answer)}</p></div>
  ${g?`<div class="rubric-card">${g.rows.map(row=>`<div class="criterion-result"><span class="${row.correct?'correct-icon':'wrong-icon'}">${ico(row.correct?'check':row.earned>0?'minus':'close',16)}</span><div><strong>${esc(MAP_FIELDS[q.id].find(f=>f.key===row.key)?.label??row.key)}</strong><p>Expected: ${esc(row.expected)}. ${esc(row.explanation)}</p></div><span>${displayScore(row.earned)} / ${displayScore(row.points)}</span></div>`).join('')}</div>`:''}${errorDetails(q)}`;
 }
 const cls=!a.grade?'neutral':a.grade.score===2.5?'':a.grade.score===0?'wrong':'partial';
 return `<div class="feedback ${cls}" tabindex="-1"><div class="feedback-top"><span>${ico(a.grade?'check':'bulb',17)} ${unanswered?'No answer submitted':a.grade?'Written answer checked':'Model answer & reasoning'}</span>${a.grade?`<span class="score">${displayScore(a.grade.score)} / 2.5 · self-checked</span>`:''}</div><p class="model-answer">${esc(q.model_answer)}</p></div>${a.submitted?rubric(q,a):''}${errorDetails(q)}`;
}

function question(){
 const q=bank.questions[state.cursor],a=answer(q),t=totals(bank,state.answers),section=SECTIONS.find(s=>s.id===q.section),locked=a.submitted||state.finished;
 const pendingRubric=a.submitted&&q.section==='short_answer'&&!a.grade&&reveal();
 return `${header()}<div class="exam-layout">${sidebar()}<main class="question-area"><div class="question-wrap">
 ${state.finished?`<div class="review-back"><button class="textbtn" data-action="results">${ico('back',14)} Back to your results</button></div>`:''}
 <div class="question-topline"><div class="buttonrow"><button class="iconbutton mobile-toggle" data-action="toggle-nav" aria-expanded="${navOpen}">${ico('grid',14)} Questions</button><span><strong>${section.name}</strong> · ${t.answered} of 40 answered</span></div><span style="display:flex;align-items:center;gap:5px">${ico('clock',13)}<span id="timer">${timeLabel()}</span></span></div>
 <div class="progress-track" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="40" aria-valuenow="${t.answered}"><div class="progress-fill" style="width:${t.answered/40*100}%"></div></div>
 <div class="question-header"><div><div class="question-number">Question ${q.number} <span class="muted">/ 40</span></div><div class="question-topic">${esc(q.topic)}</div></div><button class="iconbutton" data-action="flag" aria-pressed="${state.flags.includes(q.id)}">${ico('bookmark',14)} ${state.flags.includes(q.id)?'Flagged':'Flag for review'}</button></div>
 <section class="question-card" aria-label="Question ${q.number}"><p class="question-prompt" tabindex="-1">${esc(q.question)}</p>
 ${q.asset?`<figure class="map-figure"><button data-action="zoom" aria-label="Enlarge question diagram"><img src="${esc(q.asset)}" alt="${esc(q.asset.includes('station')?'Station plot: upper-left value 74, lower-left value 62; staff extends northwest with two full feathers and one half feather.':q.asset.includes('radar')?'Radar cores: A is green, B is red, C is blue. Legend: blue 20–29, green 30–39, yellow 40–49, red 50–59, purple 60–69 dBZ.':q.asset.includes('isobar')?'North-up map with vertical isobars of 1000, 1004, 1008, 1012 and 1016 mb from west to east. They are widely spaced near A and more closely spaced near B.':'North-up 500-mb contours increase from 540 dam at the north to 564 dam at the south. The lines bend northward at axis A and southward at axis B.')}" loading="eager"></button><figcaption><span>Schematic practice diagram</span><span>${ico('expand',12)} Tap to enlarge</span></figcaption></figure>`:''}
 ${q.section==='multiple_choice'?options(q,a):q.section==='short_answer'?`<div class="answer-input"><label for="written-answer">Your explanation</label><textarea id="written-answer" maxlength="8000" placeholder="Explain the idea in your own words. Use a few sentences or clear numbered parts." ${locked?'disabled':''}>${esc(a.text??'')}</textarea><div class="input-meta"><span>${locked?'Your submitted response':'Your draft saves as you type.'}</span><span id="char-counter">${(a.text??'').length} / 8000</span></div></div>`:mapInputs(q,a)}
 ${!locked?`<div class="question-actions">${state.mode==='practice'?`<button class="hint-toggle" data-action="hint" aria-expanded="${state.hints.includes(q.id)}">${ico('bulb',16)} ${state.hints.includes(q.id)?'Hide hint':'A small hint'}</button>`:'<span class="small muted">Answers reveal after you finish.</span>'}<button class="btn" data-action="submit" ${completeDraft(q,a)?'':'disabled'}>Submit answer ${ico('arrow',16)}</button></div>`:`<div class="question-actions"><span class="submitted-note">${ico(a.submitted?'check':'minus',14)} ${a.submitted?'Submitted · first response saved':'No response submitted'}</span><span class="question-points">2.5 points possible</span></div>`}
 ${state.mode==='practice'&&state.hints.includes(q.id)&&!locked?`<div class="hint">${esc(q.hint)}</div>`:''}
 </section>${feedback(q,a)}
 <nav class="navrow" aria-label="Next and previous questions"><button class="btn secondary" data-action="previous" ${state.cursor===0?'disabled':''}>${ico('back',15)} Previous</button>
 ${!locked?'<span class="small muted">You can come back to this question.</span>':''}
 <button class="btn ${locked?'':'secondary'}" data-action="next" ${pendingRubric?'disabled':''}>${state.cursor===39?(state.finished?'Results':'Finish & review'):locked?'Next question':'Skip for now'} ${ico('arrow',15)}</button></nav>
 ${pendingRubric?'<p class="notice">Record your rubric check to continue, or use the question map to return later.</p>':''}
 </div></main></div>`;
}

function topicSummary(){
 const topics=new Map();
 for(const q of bank.questions){const name=q.topic.split(':')[0],r=topics.get(name)??{name,score:0,max:0,pending:0};r.max+=2.5;const a=answer(q);r.score+=a.grade?.score??0;if(a.submitted&&!a.grade)r.pending++;topics.set(name,r);}
 return [...topics.values()].sort((a,b)=>a.score/a.max-b.score/b.max);
}

function results(){
 const t=totals(bank,state.answers),pending=bank.questions.filter(q=>answer(q).submitted&&!answer(q).grade),denom=pending.length?t.gradedMax:100;
 const items=bank.questions.filter(q=>filter==='all'||filter==='flagged'&&state.flags.includes(q.id)||filter==='needs'&&(!answer(q).grade||answer(q).grade.score<2.5));
 return `${header()}<main class="results"><div class="results-head"><div><p class="eyebrow">Attempt ${state.attempt} · ${state.mode==='practice'?'Learn as you go':'Exam practice'}</p><h1>Your exam review.</h1><p>${pending.length?'Your automatic scores are ready. Check the written responses below to complete your total.':'Review the ideas you missed, revisit explanations, and use your results to focus your next study session.'}</p></div><div class="score-ring" style="--percent:${denom?t.score/denom*100:0}%"><div><strong>${displayScore(t.score)}</strong><small>/ ${displayScore(denom)} ${pending.length?'checked points':'points'}</small></div></div></div>
 ${pending.length?`<div class="pending-banner"><div><strong>${pending.length} written answer${pending.length===1?'':'s'} ready for your rubric check</strong><p>The final score out of 100 will appear once these responses are checked.</p></div><button class="btn" data-action="pending">Check written answers ${ico('arrow',15)}</button></div>`:''}
 <div class="section-scores">${SECTIONS.map(s=>{const r=t.sections[s.id],isPending=r.answered>r.graded;return `<section class="section-score"><h3>${s.name}</h3><div class="number">${isPending&&r.graded===0?'Pending':displayScore(r.score)} <span>${isPending&&r.graded===0?'':`/ ${isPending?r.gradedMax:s.total}`}</span></div><div class="small">${r.answered}/${s.count} answered${s.id==='short_answer'?` · ${r.graded} self-checked`:' · auto-scored'}</div></section>`;}).join('')}</div>
 <div class="buttonrow"><button class="btn" data-action="review-all">Review answers ${ico('arrow',15)}</button><button class="btn secondary" data-action="export">${ico('download',16)} Export answers</button></div>
 <div class="result-columns"><section class="result-panel"><h2>Where to focus</h2><p>${pending.length?'Written checks are still pending; these topic scores are provisional.':'Your topic breakdown, with lower scores first.'}</p>${topicSummary().map(r=>`<div class="topic-score"><div class="topic-score-header"><span>${esc(r.name)}</span><span>${r.pending?'Pending checks':`${displayScore(r.score)} / ${displayScore(r.max)}`}</span></div><div class="progress-track"><div class="progress-fill" style="width:${r.score/r.max*100}%"></div></div></div>`).join('')}</section>
 <section class="result-panel"><div class="review-list-head"><h2>Question review</h2><select id="review-filter" aria-label="Filter question review"><option value="needs" ${filter==='needs'?'selected':''}>Needs review</option><option value="all" ${filter==='all'?'selected':''}>All questions</option><option value="flagged" ${filter==='flagged'?'selected':''}>Flagged</option></select></div><div class="review-list">${items.length?items.map(q=>{const a=answer(q);return `<button class="review-item" data-action="jump" data-index="${q.number-1}"><span><strong>${q.number}. ${esc(shortTopic(q))}</strong><small>${esc(q.topic.split(':')[0])}${state.flags.includes(q.id)?' · flagged':''}</small></span><span class="badge ${a.grade?.score===0?'wrong':a.grade?.score<2.5?'partial':''}">${a.grade?`${displayScore(a.grade.score)} / 2.5`:a.submitted?'Check rubric':'Unanswered'}</span></button>`;}).join(''):'<p class="empty-list">Nothing in this view. Choose another filter to explore your answers.</p>'}</div></section></div>
 <footer class="results-footer"><span>${t.answered}/40 answered · ${timeLabel()} elapsed.<br>Written scores reflect your rubric self-check, not an automated evaluation.</span><button class="textbtn" data-action="restart">Start a fresh attempt</button></footer></main>`;
}

function render(){
 app.innerHTML=state.view==='question'?question():state.view==='results'?results():welcome();
 updateSaveStatus();
}

function moveTo(index){
 state.cursor=Math.max(0,Math.min(39,index));state.view='question';navOpen=false;save();render();
 window.scrollTo({top:0,behavior:'instant'});
 document.querySelector('.question-prompt')?.focus({preventScroll:true});
}
function dialog(content,cls=''){
 if(modal.open)modal.close();modal.className=cls;
 modal.innerHTML=`<button class="modal-close" data-action="close-modal" aria-label="Close dialog">${ico('close',16)}</button>${content}`;
 modal.showModal();
}
function finishPrompt(){
 if(state.finished){state.view='results';save();render();window.scrollTo(0,0);return;}
 const t=totals(bank,state.answers),left=40-t.answered;
 dialog(`<h2>Finish this attempt?</h2><p>${left?`${left} question${left===1?' is':'s are'} still unanswered. Unanswered questions earn 0 points. `:'All 40 answers have been recorded. '}You’ll be able to review every explanation.${t.pending?` ${t.pending} written answer${t.pending===1?' needs':'s need'} a rubric check before your final score is complete.`:''}</p><div class="buttonrow"><button class="btn" data-action="confirm-finish">Finish & review ${ico('arrow',15)}</button><button class="btn secondary" data-action="close-modal">Keep working</button></div>`);
}
function exportData(record=null){
 const use=record??state;
 const t=totals(bank,use.answers);
 const data={
  title:bank.title,attempt:use.attempt,mode:use.mode,exported_at:new Date().toISOString(),
  finished:use.finished,score:t.score,maximum:100,graded_points:t.gradedMax,pending_written_checks:t.pending,
  grading_note:'Multiple choice and structured map fields are automatically scored. Written-answer scores are the student’s rubric self-check and can be reviewed by a teacher or assistant.',
  answers:bank.questions.map(q=>({
   id:q.id,number:q.number,section:q.section,topic:q.topic,question:q.question,
   ...(q.options?{options:q.options.map(o=>({value:o.value,label:o.label})),correct:q.correctValues}:{}),
   submitted:use.answers[q.id]?.submitted??false,response:q.section==='multiple_choice'?use.answers[q.id]?.choice??'':q.section==='short_answer'?use.answers[q.id]?.text??'':use.answers[q.id]?.fields??{},
   score:use.answers[q.id]?.grade?.score??null,points:2.5,grading:use.answers[q.id]?.grade?.grading??null,
   ...(q.rubric?{rubric:q.rubric,model_answer:q.model_answer}:{}),
   ...(q.asset?{diagram:q.asset}:{}),
   ...(q.options?{explanations:q.options.map(o=>({option:o.value,explanation:o.feedback}))}:{}),
   flagged:(use.flags??[]).includes(q.id),hint_used:(use.hints??[]).includes(q.id)
  }))
 };
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=`AOSC105_Attempt_${use.attempt}_Answers.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Your answers have been exported.');
}

document.addEventListener('click',event=>{
 const button=event.target.closest('[data-action]');
 if(!button||button.disabled||!state||!bank)return;
 const action=button.dataset.action,q=bank.questions[state.cursor];
 if(action==='close-modal'){modal.close();return;}
 if(action==='mode'){
  if(!state.started){state.mode=button.dataset.mode;save();render();}return;
 }
 if(action==='start'||action==='resume'){
  state.started=true;state.view='question';startClock();save();render();window.scrollTo(0,0);return;
 }
 if(action==='home'||action==='pause'){
  stopClock();state.view='welcome';navOpen=false;save();render();window.scrollTo(0,0);return;
 }
 if(action==='toggle-nav'){navOpen=!navOpen;render();return;}
 if(action==='choose'){
  const a=ensure(q);if(a.submitted||state.finished)return;
  a.choice=button.dataset.value;save();const y=window.scrollY;render();window.scrollTo(0,y);
  document.querySelector(`[data-action="choose"][data-value="${a.choice}"]`)?.focus({preventScroll:true});return;
 }
 if(action==='flag'){
  state.flags=state.flags.includes(q.id)?state.flags.filter(x=>x!==q.id):[...state.flags,q.id];save();const y=window.scrollY;render();window.scrollTo(0,y);return;
 }
 if(action==='hint'){
  if(state.mode!=='practice')return;
  state.hints=state.hints.includes(q.id)?state.hints.filter(x=>x!==q.id):[...state.hints,q.id];save();const y=window.scrollY;render();window.scrollTo(0,y);return;
 }
 if(action==='jump'){moveTo(Number(button.dataset.index));return;}
 if(action==='previous'){moveTo(state.cursor-1);return;}
 if(action==='next'){
  if(state.cursor===39){finishPrompt();return;}moveTo(state.cursor+1);return;
 }
 if(action==='submit'){
  const a=ensure(q);if(a.submitted||state.finished||!completeDraft(q,a))return;
  if(['Q33','Q34'].includes(q.id)&&parseClock(a.fields.time)===null){toast('Enter a valid time, such as 14:30 or 2:30 PM.');document.querySelector('#field-time')?.focus();return;}
  a.submitted=true;a.submittedAt=new Date().toISOString();
  if(q.section==='multiple_choice')a.grade=gradeMC(q,a.choice);
  else if(q.section==='map_skills')a.grade=gradeMap(q,a.fields);
  save();render();const f=document.querySelector('.feedback');f?.focus({preventScroll:true});f?.scrollIntoView({behavior:'smooth',block:'center'});return;
 }
 if(action==='rubric'){
  const a=ensure(q);if(!a.submitted||a.grade||!reveal())return;
  a.rubricValues??={};a.rubricValues[Number(button.dataset.index)]=button.dataset.value;save();const y=window.scrollY;render();window.scrollTo(0,y);
  document.querySelector(`[data-action="rubric"][data-index="${button.dataset.index}"][data-value="${button.dataset.value}"]`)?.focus({preventScroll:true});return;
 }
 if(action==='confirm-rubric'){
  const a=ensure(q);if(a.grade)return;const grade=gradeRubric(q,a.rubricValues);if(!grade)return;
  a.grade=grade;save();const y=window.scrollY;render();window.scrollTo(0,y);toast('Written self-check recorded.');return;
 }
 if(action==='finish'){finishPrompt();return;}
 if(action==='confirm-finish'){
  stopClock();state.finished=true;state.finishedAt=new Date().toISOString();state.view='results';navOpen=false;modal.close();save();render();window.scrollTo(0,0);return;
 }
 if(action==='results'){state.view='results';navOpen=false;save();render();window.scrollTo(0,0);return;}
 if(action==='review-all'){filter='all';moveTo(0);return;}
 if(action==='pending'){
  const i=bank.questions.findIndex(x=>answer(x).submitted&&!answer(x).grade);
  if(i>=0)moveTo(i);return;
 }
 if(action==='zoom'&&q.asset){dialog(`<img src="${esc(q.asset)}" alt="Enlarged practice diagram">`,'image-dialog');return;}
 if(action==='export'){exportData();return;}
 if(action==='history-export'){exportData(state.history[Number(button.dataset.index)]);return;}
 if(action==='history'){
  dialog(`<h2>Your previous attempts</h2><p>Scores retain the original automatic marks and your recorded written self-checks.</p>${state.history.slice().reverse().map((h,i)=>`<div class="history-row"><strong>Attempt ${h.attempt} · ${displayScore(totals(bank,h.answers).score)} / 100</strong><span>${h.finished?'Finished':'Stopped early'} · ${h.answered} answered · ${new Date(h.archivedAt).toLocaleDateString()}</span><button class="textbtn" style="float:right" data-action="history-export" data-index="${state.history.length-1-i}">Export</button></div>`).join('')}`);return;
 }
 if(action==='restart'){
  dialog('<h2>A fresh attempt?</h2><p>Your current responses will stay in attempt history. The new attempt starts with the same 40 questions and a clear score.</p><div class="buttonrow"><button class="btn" data-action="confirm-restart">Start fresh</button><button class="btn secondary" data-action="close-modal">Keep this attempt</button></div>');return;
 }
 if(action==='confirm-restart'){
  stopClock();const t=totals(bank,state.answers),history=[...state.history];
  if(state.started)history.push({attempt:state.attempt,mode:state.mode,finished:state.finished,archivedAt:new Date().toISOString(),answered:t.answered,elapsedMs:state.elapsedMs,answers:state.answers,flags:state.flags,hints:state.hints});
  state=fresh(history,state.started?state.attempt+1:state.attempt,state.mode);modal.close();save();render();window.scrollTo(0,0);return;
 }
});

function updateInput(event){
 if(!bank||!state||state.view!=='question')return;
 const q=bank.questions[state.cursor],a=ensure(q);if(a.submitted||state.finished)return;
 const target=event.target;
 if(target.id==='written-answer'){
  a.text=target.value;const c=document.querySelector('#char-counter');if(c)c.textContent=`${a.text.length} / 8000`;
 }else if(target.dataset.field){a.fields??={};a.fields[target.dataset.field]=target.value;}
 else return;
 const submit=document.querySelector('[data-action="submit"]');if(submit)submit.disabled=!completeDraft(q,a);
 scheduleSave();
}
document.addEventListener('input',updateInput);
document.addEventListener('change',event=>{
 if(event.target.id==='review-filter'){filter=event.target.value;render();return;}
 updateInput(event);
});
document.addEventListener('keydown',event=>{
 if(!bank||!state||state.view!=='question'||modal.open)return;
 const q=bank.questions[state.cursor],a=answer(q);
 if(q.section!=='multiple_choice'||a.submitted||state.finished||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
 const letters=['A','B','C','D'];let next;
 if(/^[1-4]$/.test(event.key))next=letters[Number(event.key)-1];
 if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft'].includes(event.key)&&event.target.closest('.options')){
  const index=Math.max(0,letters.indexOf(a.choice)),delta=['ArrowUp','ArrowLeft'].includes(event.key)?-1:1;
  next=letters[(index+delta+4)%4];
 }
 if(next){event.preventDefault();document.querySelector(`[data-action="choose"][data-value="${next}"]`)?.click();}
});
modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
window.addEventListener('beforeunload',()=>{if(state)save();});
setInterval(()=>{if(!state)return;const el=document.querySelector('#timer');if(el)el.textContent=timeLabel();},1000);

try {
 const response=await fetch(new URL('bank.json',import.meta.url));
 if(!response.ok)throw new Error('Question bank unavailable');
 bank=await response.json();
 if(bank.questions.length!==40)throw new Error('Question bank incomplete');
 state=loadState();render();
} catch(error){
 app.innerHTML='<main class="welcome"><h1 style="font-size:40px">The exam couldn’t load.</h1><p class="intro">Refresh the page to try again. Your previously saved progress stays on this browser.</p><button class="btn" onclick="location.reload()">Try again</button></main>';
 console.error('Exam loading error:',error);
}
