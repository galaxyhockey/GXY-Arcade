// Validates the Cartoon Classics bank. Run: node dlc/cartoon-classics/validate.js
const { records } = require('./questions.js');
const errs = [], warn = [];
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
const ids = new Set(), qs = new Map();
records.forEach(r => {
  if(ids.has(r.id)) errs.push('duplicate id ' + r.id); ids.add(r.id);
  if(!r.answer || !String(r.answer).trim()) errs.push('empty answer ' + r.id);
  if(!['casual', 'fan', 'expert'].includes(r.difficulty)) errs.push('bad difficulty ' + r.id);
  if(!r.question.trim().endsWith('?')) warn.push('question does not end with ? ' + r.id);
  const k = norm(r.question); if(qs.has(k)) errs.push(`duplicate question ${r.id} = ${qs.get(k)}`); qs.set(k, r.id);
  if(!r.reviewStatus) errs.push('missing reviewStatus ' + r.id);
  if(!r.source || !r.source.title) errs.push('missing source ' + r.id);
  (r.acceptedAnswers || []).forEach(a => {
    if(norm(a).length < 2 && !/^\d+$/.test(norm(a))) errs.push(`accepted answer too short (ambiguous) ${r.id}: "${a}"`);
    if(norm(a) === norm(r.answer)) warn.push(`accepted answer repeats the answer ${r.id}`);
  });
});
const by = d => records.filter(r => r.difficulty === d).length;
console.log(`${records.length} questions · expert ${by('expert')} · fan ${by('fan')} · casual ${by('casual')} · shows ${new Set(records.map(r => r.showId)).size}`);
warn.forEach(w => console.log('warn:', w));
errs.forEach(e => console.error('ERROR:', e));
if(records.length < 200) errs.push('fewer than 200 questions'), console.error('ERROR: need 200, have ' + records.length);
if(by('expert') < 150) console.error(`ERROR: need 150 expert, have ${by('expert')}`), process.exitCode = 1;
if(errs.length) process.exitCode = 1; else console.log('valid');
