import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {parseClock,gradeMap,gradeMC,gradeRubric,totals,completeDraft} from '../dist/logic.mjs';
const bank=JSON.parse(readFileSync(new URL('../dist/bank.json',import.meta.url)));
const q=id=>bank.questions.find(x=>x.id===id);
assert.equal(bank.questions.length,40);
assert.deepEqual(bank.sections.map(x=>[x.question_count,x.points]),[[16,40],[16,40],[8,20]]);
assert.equal(new Set(bank.questions.map(x=>x.id)).size,40);
for(const item of bank.questions){
 if(item.asset)assert.ok(existsSync(new URL('../dist/'+item.asset,import.meta.url)));
 if(item.options){assert.equal(item.options.length,4);assert.ok(item.options.every(o=>o.feedback));assert.equal(item.correctValues.length,1);}
 else assert.equal(item.rubric.reduce((s,r)=>s+r.points,0),2.5);
}
assert.equal(parseClock('8:00 PM EDT'),1200);
assert.equal(parseClock('2000'),1200);
assert.equal(parseClock('12:00 AM'),0);
assert.equal(parseClock('0330Z'),210);
assert.equal(parseClock('25:00'),null);
assert.equal(parseClock('03:60'),null);
assert.equal(gradeMap(q('Q33'),{time:'8pm',date:'2026-07-17'}).score,2.5);
assert.equal(gradeMap(q('Q33'),{time:'8pm',date:'2026-07-18'}).score,1.5);
assert.equal(gradeMap(q('Q34'),{time:'0330Z',date:'2026-07-18'}).score,2.5);
assert.equal(gradeMap(q('Q36'),{direction:'SE',speed:'25'}).score,1.25);
assert.equal(gradeMap(q('Q40'),{A:'ridge-south',B:'trough-north'}).score,1.5);
assert.equal(gradeRubric(q('Q17'),{}),null);
assert.equal(completeDraft(q('Q35'),{fields:{temperature:'74'}}),false);
const answers={};
const correctMaps={Q33:{time:'20:00',date:'2026-07-17'},Q34:{time:'03:30',date:'2026-07-18'},Q35:{temperature:'74',dewpoint:'62'},Q36:{direction:'NW',speed:'25'},Q37:{strongest:'B',weakest:'C',range:'50'},Q38:{location:'B',reason:'gradient'},Q39:{motion:'N',crossing:'west'},Q40:{A:'ridge-north',B:'trough-south'}};
for(const item of bank.questions){
 const grade=item.section==='multiple_choice'?gradeMC(item,item.correctValues[0]):item.section==='map_skills'?gradeMap(item,correctMaps[item.id]):gradeRubric(item,Object.fromEntries(item.rubric.map((_,i)=>[i,'full'])));
 assert.equal(grade.score,2.5,item.id);
 answers[item.id]={submitted:true,grade};
}
assert.equal(totals(bank,answers).score,100);
assert.equal(totals(bank,answers).pending,0);
assert.deepEqual(Object.values(totals(bank,answers).sections).map(s=>s.score),[40,40,20]);
delete answers.Q17.grade;
assert.equal(totals(bank,answers).pending,1);
assert.equal(totals(bank,answers).gradedMax,97.5);
console.log('Verified all 40 items, scoring totals, partial credit, time/date conversion, wind direction, and pending written checks.');
