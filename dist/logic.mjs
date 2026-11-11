export const SECTIONS = [
  { id: 'multiple_choice', name: 'Multiple choice', short: 'Choices', start: 0, end: 19, total: 40, count: 20 },
  { id: 'short_answer', name: 'Written answers', short: 'Written', start: 20, end: 39, total: 40, count: 20 },
  { id: 'map_skills', name: 'Map skills', short: 'Maps', start: 40, end: 49, total: 20, count: 10 }
];

export const MAP_FIELDS = {
  Q41: [
    { key: 'time', label: 'Local time in EDT', placeholder: 'HH:MM AM/PM or 24-hour time', type: 'text' },
    { key: 'date', label: 'Local calendar date', type: 'date' }
  ],
  Q42: [
    { key: 'time', label: 'UTC time', placeholder: 'Four-digit Z time or HH:MM', type: 'text' },
    { key: 'date', label: 'UTC calendar date', type: 'date' }
  ],
  Q43: [
    { key: 'temperature', label: 'Air temperature (°F)', type: 'number' },
    { key: 'dewpoint', label: 'Dew point (°F)', type: 'number' }
  ],
  Q44: [
    { key: 'direction', label: 'Wind comes FROM', type: 'select', choices: ['N','NE','E','SE','S','SW','W','NW'].map(x => [x,x]) },
    { key: 'speed', label: 'Wind speed (knots)', type: 'number' }
  ],
  Q45: [
    { key: 'strongest', label: 'Strongest core', type: 'select', choices: ['A','B','C'].map(x => [x,`Cell ${x}`]) },
    { key: 'weakest', label: 'Weakest core', type: 'select', choices: ['A','B','C'].map(x => [x,`Cell ${x}`]) },
    { key: 'range', label: 'Reflectivity at B’s center', type: 'select', choices: ['20','30','40','50','60'].map(x => [x,`${x}–${Number(x)+9} dBZ`]) }
  ],
  Q46: [
    { key: 'location', label: 'Stronger wind expected at', type: 'select', choices: [['A','Location A'],['B','Location B']] },
    { key: 'reason', label: 'Reason', type: 'select', choices: [
      ['pressure','The lower local pressure value alone makes wind faster.'],
      ['gradient','Closer equal-interval isobars mean a larger pressure gradient.'],
      ['wide','More widely spaced isobars mean a larger pressure gradient.'],
      ['friction','Isobar spacing shows that friction is absent at this location.']
    ] }
  ],
  Q47: [
    { key: 'motion', label: 'Geostrophic air moves TOWARD', type: 'select', choices: [['N','North'],['S','South'],['E','East'],['W','West']] },
    { key: 'crossing', label: 'Surface wind crosses toward', type: 'select', choices: [['west','Lower pressure, to the west'],['east','Higher pressure, to the east']] }
  ],
  Q48: [
    { key: 'A', label: 'Axis A', type: 'select', choices: [
      ['ridge-north','Ridge · contours bulge northward'],['trough-south','Trough · contours dip southward'],
      ['ridge-south','Ridge · contours dip southward'],['trough-north','Trough · contours bulge northward']
    ] },
    { key: 'B', label: 'Axis B', type: 'select', choices: [
      ['ridge-north','Ridge · contours bulge northward'],['trough-south','Trough · contours dip southward'],
      ['ridge-south','Ridge · contours dip southward'],['trough-north','Trough · contours bulge northward']
    ] }
  ],
  Q49: [
    { key: 'direction', label: 'Air begins moving TOWARD', type: 'select', choices: [['N','North'],['S','South'],['E','East'],['W','West']] },
    { key: 'orientation', label: 'Path relative to isobars', type: 'select', choices: [['parallel','Parallel'],['perpendicular','Perpendicular']] }
  ],
  Q50: [
    { key: 'quantity', label: 'The contours show', type: 'select', choices: [['height','Height of the pressure surface'],['pressure','Different air pressures'],['temperature','Air temperature'],['speed','Wind speed']] },
    { key: 'pressure', label: 'Pressure at the point (mb)', type: 'number' }
  ]
};

export function parseClock(value) {
  let s = String(value ?? '').toLowerCase().replaceAll('.', '').replace(/\b(edt|utc|est)\b/g,'').replace(/z$/,'').replace(/\s+/g,'');
  let m = s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (m) {
    const h = Number(m[1]), min = Number(m[2] ?? 0);
    if (h < 1 || h > 12 || min > 59) return null;
    return (h % 12 + (m[3] === 'pm' ? 12 : 0)) * 60 + min;
  }
  m = s.match(/^(\d{1,2}):(\d{2})$/) ?? s.match(/^(\d{2})(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h <= 23 && min <= 59 ? h * 60 + min : null;
}

function clockMatches(value, expectedMinutes, expectedZone) {
  const suffix = String(value ?? '').trim().match(/(EDT|EST|UTC|Z)\s*$/i)?.[1].toUpperCase();
  const zoneOK = !suffix || suffix === expectedZone || expectedZone === 'UTC' && suffix === 'Z';
  return zoneOK && parseClock(value) === expectedMinutes;
}

export function completeDraft(q, draft) {
  if (q.section === 'multiple_choice') return Boolean(draft?.choice);
  if (q.section === 'short_answer') return Boolean(draft?.text?.trim());
  return (MAP_FIELDS[q.id] ?? []).every(f => draft?.fields?.[f.key] !== undefined && String(draft.fields[f.key]).trim() !== '');
}

export function gradeMC(q, choice) {
  const correct = q.correctValues[0] === choice;
  return { score: correct ? q.points : 0, max: q.points, correct, grading: 'automatic' };
}

export function gradeMap(q, fields) {
  const rows = [];
  const add = (key, correct, expected, points, explanation) => rows.push({key, correct, expected, points, earned: correct ? points : 0, explanation});
  switch(q.id) {
    case 'Q41':
      add('time', clockMatches(fields.time, 1200, 'EDT'), '8:00 PM / 2000 EDT', q.rubric[0].points, q.rubric[0].explanation);
      add('date', fields.date === '2026-07-17', 'July 17, 2026', q.rubric[1].points, q.rubric[1].explanation); break;
    case 'Q42':
      add('time', clockMatches(fields.time, 210, 'UTC'), '0330Z', q.rubric[0].points, q.rubric[0].explanation);
      add('date', fields.date === '2026-07-18', 'July 18, 2026', q.rubric[1].points, q.rubric[1].explanation); break;
    case 'Q43':
      add('temperature', Number(fields.temperature) === 74, '74°F', q.rubric[0].points, q.rubric[0].explanation);
      add('dewpoint', Number(fields.dewpoint) === 62, '62°F', q.rubric[1].points, q.rubric[1].explanation); break;
    case 'Q44':
      add('direction', fields.direction === 'NW', 'Northwest (from)', q.rubric[0].points, q.rubric[0].explanation);
      add('speed', Number(fields.speed) === 25, '25 knots', q.rubric[1].points, q.rubric[1].explanation); break;
    case 'Q45':
      add('strongest', fields.strongest === 'B', 'Cell B', q.rubric[0].points, q.rubric[0].explanation);
      add('weakest', fields.weakest === 'C', 'Cell C', q.rubric[1].points, q.rubric[1].explanation);
      add('range', fields.range === '50', '50–59 dBZ', q.rubric[2].points, q.rubric[2].explanation); break;
    case 'Q46':
      add('location', fields.location === 'B', 'Location B', q.rubric[0].points, q.rubric[0].explanation);
      add('reason', fields.reason === 'gradient', 'Closer isobars → larger pressure gradient', q.rubric[1].points, q.rubric[1].explanation); break;
    case 'Q47':
      add('motion', fields.motion === 'N', 'Toward north', q.rubric[0].points, q.rubric[0].explanation);
      add('crossing', fields.crossing === 'west', 'Lower pressure, west', q.rubric[1].points, q.rubric[1].explanation); break;
    case 'Q48':
      for (const [key,label,shape] of [['A','ridge','north'],['B','trough','south']]) {
        const [chosenLabel,chosenShape] = String(fields[key] ?? '').split('-');
        const max = q.rubric[key === 'A' ? 0 : 1].points;
        const earned = (chosenLabel === label ? max*.6 : 0) + (chosenShape === shape ? max*.4 : 0);
        rows.push({key, correct: Math.abs(earned-max) < 1e-9, expected: `${label === 'ridge' ? 'Ridge' : 'Trough'} · ${shape}ward bend`, points:max, earned, explanation:q.rubric[key === 'A' ? 0 : 1].explanation});
      } break;
    case 'Q49':
      add('direction', fields.direction === 'W', 'West', q.rubric[0].points, q.rubric[0].explanation);
      add('orientation', fields.orientation === 'perpendicular', 'Perpendicular', q.rubric[1].points, q.rubric[1].explanation); break;
    case 'Q50':
      add('quantity', fields.quantity === 'height', 'Height of the 500-mb surface', q.rubric[0].points, q.rubric[0].explanation);
      add('pressure', Number(fields.pressure) === 500, '500 mb', q.rubric[1].points, q.rubric[1].explanation); break;
    default: throw new Error('Unsupported map question');
  }
  return {score: rows.reduce((s,r) => s+r.earned,0), max:q.points, rows, grading:'automatic'};
}

export function gradeRubric(q, values) {
  if (q.rubric.some((_,i) => !['full','partial','none'].includes(values?.[i]))) return null;
  return {score:q.rubric.reduce((s,r,i) => s+r.points*({full:1,partial:.5,none:0}[values[i]]),0), max:q.points, grading:'self-check', rubric:values};
}

export const displayScore = value => Number(value.toFixed(2)).toLocaleString('en-US',{maximumFractionDigits:2});

export function totals(bank, answers) {
  const result = {answered:0, graded:0, score:0, gradedMax:0, pending:0, sections:{}};
  for (const s of SECTIONS) result.sections[s.id]={score:0, graded:0, answered:0, gradedMax:0};
  for (const q of bank.questions) {
    const a = answers[q.id], s = result.sections[q.section];
    if (!a?.submitted) continue;
    result.answered++; s.answered++;
    if (a.grade) { result.graded++; result.score+=a.grade.score; result.gradedMax+=q.points; s.graded++; s.score+=a.grade.score; s.gradedMax+=q.points; }
    else result.pending++;
  }
  return result;
}
