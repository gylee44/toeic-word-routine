/** 불규칙 변화형. 규칙 변화(-s, -ed, -ing 등)로 만들 수 없는 형태만 둔다. */
const IRREGULAR: Record<string, string[]> = {
  be: ["am", "is", "are", "was", "were", "been", "being"],
  have: ["has", "had", "having"],
  do: ["does", "did", "done", "doing"],
  go: ["goes", "went", "gone"],
  say: ["said"],
  make: ["made"],
  take: ["took", "taken"],
  get: ["got", "gotten"],
  give: ["gave", "given"],
  come: ["came"],
  become: ["became"],
  see: ["saw", "seen"],
  know: ["knew", "known"],
  think: ["thought"],
  find: ["found"],
  tell: ["told"],
  buy: ["bought"],
  bring: ["brought"],
  build: ["built"],
  send: ["sent"],
  spend: ["spent"],
  pay: ["paid"],
  lay: ["laid"],
  meet: ["met"],
  leave: ["left"],
  hold: ["held"],
  keep: ["kept"],
  run: ["ran"],
  write: ["wrote", "written"],
  begin: ["began", "begun"],
  choose: ["chose", "chosen"],
  speak: ["spoke", "spoken"],
  break: ["broke", "broken"],
  drive: ["drove", "driven"],
  rise: ["rose", "risen"],
  fall: ["fell", "fallen"],
  grow: ["grew", "grown"],
  show: ["shown"],
  draw: ["drew", "drawn"],
  forget: ["forgot", "forgotten"],
  understand: ["understood"],
  stand: ["stood"],
  sell: ["sold"],
  feel: ["felt"],
  lose: ["lost"],
  lead: ["led"],
  mean: ["meant"],
  hear: ["heard"],
  teach: ["taught"],
  catch: ["caught"],
  seek: ["sought"],
  fight: ["fought"],
  win: ["won"],
  sit: ["sat"],
  hang: ["hung"],
  shake: ["shook", "shaken"],
  wear: ["wore", "worn"],
  tear: ["tore", "torn"],
  steal: ["stole", "stolen"],
  freeze: ["froze", "frozen"],
  hide: ["hid", "hidden"],
  bite: ["bit", "bitten"],
  ride: ["rode", "ridden"],
  fly: ["flew", "flown"],
  eat: ["ate", "eaten"],
  sleep: ["slept"],
  deal: ["dealt"],
  light: ["lit"],
  overcome: ["overcame"],
  undertake: ["undertook", "undertaken"],
  withdraw: ["withdrew", "withdrawn"],
  good: ["better", "best"],
  bad: ["worse", "worst"],
  child: ["children"],
  person: ["people"],
  man: ["men"],
  woman: ["women"],
  analysis: ["analyses"],
  criterion: ["criteria"],
  datum: ["data"],
  medium: ["media"],
};

const VOWEL = /[aeiou]/;

/** 사전 형태(원형)에서 나올 수 있는 변화형 목록. 소문자로 비교한다. */
function wordForms(headword: string): Set<string> {
  const w = headword.toLowerCase();
  const forms = new Set([w, ...(IRREGULAR[w] ?? [])]);
  const add = (...xs: string[]) => xs.forEach((x) => forms.add(x));
  const last = w.slice(-1);

  add(`${w}s`, `${w}es`, `${w}ed`, `${w}ing`, `${w}er`, `${w}est`);
  // copy → copies, copied / easy → easier, easiest
  if (last === "y" && w.length > 2 && !VOWEL.test(w.slice(-2, -1))) {
    const stem = w.slice(0, -1);
    add(`${stem}ies`, `${stem}ied`, `${stem}ier`, `${stem}iest`);
  }
  // hire → hired, hiring / large → larger
  if (last === "e") {
    const stem = w.slice(0, -1);
    add(`${w}d`, `${w}r`, `${w}st`, `${stem}ing`);
  }
  // plan → planned, equip → equipped (모음+자음으로 끝나는 단어. 없는 형태는 예문에 나오지 않으므로 넉넉히 만든다)
  if (/[aeiou][bdgklmnprt]$/.test(w)) add(`${w}${last}ed`, `${w}${last}ing`, `${w}${last}er`);
  // analysis → analyses, crisis → crises
  if (w.endsWith("is")) add(`${w.slice(0, -2)}es`);
  return forms;
}

/** 예문에서 해당 단어(변화형 포함)가 처음 나오는 위치. 없으면 null. */
function findHeadword(text: string, headword: string): { start: number; end: number } | null {
  const forms = wordForms(headword);
  for (const m of text.matchAll(/[A-Za-z]+/g)) {
    if (forms.has(m[0].toLowerCase())) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}

/** 예문 안의 해당 단어를 강조한다 (said, copies 같은 변화형도 포함). 퀴즈 해설, 플래시카드, 단어장에서 함께 쓴다. */
export function HighlightedExample({ text, headword }: { text: string; headword: string }) {
  const hit = findHeadword(text, headword);
  if (!hit) return <>{text}</>;
  return (
    <>
      {text.slice(0, hit.start)}
      <span className="text-primary">{text.slice(hit.start, hit.end)}</span>
      {text.slice(hit.end)}
    </>
  );
}
