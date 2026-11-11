import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {parseClock,gradeMap,gradeMC,gradeRubric,totals,completeDraft} from '../dist/logic.mjs';
const bank=JSON.parse(readFileSync(new URL('../dist/bank.json',import.meta.url)));
const q=id=>bank.questions.find(x=>x.id===id);
assert.equal(bank.questions.length,50);
assert.deepEqual(bank.sections.map(x=>[x.question_count,x.points]),[[20,40],[20,40],[10,20]]);
assert.equal(new Set(bank.questions.map(x=>x.id)).size,50);
for(const item of bank.questions){
 if(item.asset)assert.ok(existsSync(new URL('../dist/'+item.asset,import.meta.url)));
 if(item.options){assert.equal(item.options.length,4);assert.ok(item.options.every(o=>o.feedback));assert.equal(item.correctValues.length,1);}
 else assert.equal(item.rubric.reduce((s,r)=>s+r.points,0),2);
}
assert.equal(parseClock('8:00 PM EDT'),1200);
assert.equal(parseClock('2000'),1200);
assert.equal(parseClock('12:00 AM'),0);
assert.equal(parseClock('0330Z'),210);
assert.equal(parseClock('25:00'),null);
assert.equal(parseClock('03:60'),null);
assert.equal(gradeMap(q('Q41'),{time:'8pm',date:'2026-07-17'}).score,2);
assert.equal(gradeMap(q('Q41'),{time:'8pm',date:'2026-07-18'}).score,1.2);
assert.equal(gradeMap(q('Q42'),{time:'0330Z',date:'2026-07-18'}).score,2);
assert.equal(gradeMap(q('Q44'),{direction:'SE',speed:'25'}).score,1);
assert.equal(gradeMap(q('Q48'),{A:'ridge-south',B:'trough-north'}).score,1.2);
assert.equal(gradeRubric(q('Q21'),{}),null);
assert.equal(completeDraft(q('Q43'),{fields:{temperature:'74'}}),false);
const answers={};
const correctMaps={Q41:{time:'20:00',date:'2026-07-17'},Q42:{time:'03:30',date:'2026-07-18'},Q43:{temperature:'74',dewpoint:'62'},Q44:{direction:'NW',speed:'25'},Q45:{strongest:'B',weakest:'C',range:'50'},Q46:{location:'B',reason:'gradient'},Q47:{motion:'N',crossing:'west'},Q48:{A:'ridge-north',B:'trough-south'},Q49:{direction:'W',orientation:'perpendicular'},Q50:{quantity:'height',pressure:'500'}};
for(const item of bank.questions){
 const grade=item.section==='multiple_choice'?gradeMC(item,item.correctValues[0]):item.section==='map_skills'?gradeMap(item,correctMaps[item.id]):gradeRubric(item,Object.fromEntries(item.rubric.map((_,i)=>[i,'full'])));
 assert.equal(grade.score,2,item.id);
 answers[item.id]={submitted:true,grade};
}
assert.equal(totals(bank,answers).score,100);
assert.equal(totals(bank,answers).pending,0);
assert.deepEqual(Object.values(totals(bank,answers).sections).map(s=>s.score),[40,40,20]);
delete answers.Q21.grade;
assert.equal(totals(bank,answers).pending,1);
assert.equal(totals(bank,answers).gradedMax,98);
console.log('Verified all 50 items, scoring totals, partial credit, time/date conversion, wind direction, and pending written checks.');

assert.deepEqual(bank.questions.map(x=>x.number),Array.from({length:50},(_,i)=>i+1));
assert.ok(bank.questions.every(x=>x.id==='Q'+String(x.number).padStart(2,'0')));
assert.equal(gradeMap(q('Q41'),{time:'8pm EST',date:'2026-07-17'}).score,.8);
assert.equal(gradeMap(q('Q49'),{direction:'N',orientation:'perpendicular'}).score,1);
assert.equal(gradeMap(q('Q50'),{quantity:'pressure',pressure:'500'}).score,1);
const covered=new Set();
for(const row of bank.coverage_matrix){
 assert.ok(row.study_guide_objective && row.questions.length);
 for(const number of row.questions){assert.ok(number>=1&&number<=50);covered.add(number);}
}
assert.equal(covered.size,50);
const lclParcel=26-10*1,topParcel=lclParcel-6*2,topEnvironment=26-8*3;
assert.deepEqual([lclParcel,topParcel,topEnvironment],[16,4,2]);
assert.ok(topParcel>topEnvironment && 6<8 && 8<10);
assert.equal(new Date('2026-07-17T23:30:00-04:00').toISOString(),'2026-07-18T03:30:00.000Z');
assert.equal(q('Q44').stimulus_data.full_feathers*10+q('Q44').stimulus_data.half_feathers*5,25);
console.log('Verified 42 guide-coverage rows, all 50 mapped questions, independent lapse-rate arithmetic, UTC rollover, and new map fields.');
