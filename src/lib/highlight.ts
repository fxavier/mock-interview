/** Realce de sintaxe leve, sem dependências, que devolve tokens (nunca HTML). */
export type TokenType = 'kw' | 'str' | 'com' | 'num' | 'ann' | 'typ' | 'txt';
export interface Token { t: TokenType; v: string }

const JAVA_KW = new Set('abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while var record sealed permits yield when non-sealed module requires exports opens uses provides to with transitive true false null'.split(' '));
const SQL_KW = new Set('select from where group by having order limit offset join inner left right full outer on as with recursive union all distinct insert into values update set delete create table index unique primary key foreign references constraint alter add drop begin commit rollback explain analyze case when then else end and or not null is in exists between like ilike asc desc over partition rows range preceding following current row returning conflict do nothing lateral using cascade materialized view serializable repeatable read committed isolation level transaction for share nowait skip locked'.split(' '));

function scan(src: string, re: RegExp, classify: (m: RegExpExecArray) => Token): Token[] {
  const out: Token[] = [];
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push({ t: 'txt', v: src.slice(last, m.index) });
    out.push(classify(m));
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ t: 'txt', v: src.slice(last) });
  return out;
}
export function tokenizeJava(src: string): Token[] {
  const re = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(@[A-Za-z_][\w.]*)|(\b\d[\w._]*\b)|([A-Za-z_$][\w$]*)/g;
  return scan(src, re, (m) => {
    if (m[1]) return { t: 'com', v: m[1] };
    if (m[2]) return { t: 'str', v: m[2] };
    if (m[3]) return { t: 'ann', v: m[3] };
    if (m[4]) return { t: 'num', v: m[4] };
    const w = m[5];
    if (JAVA_KW.has(w)) return { t: 'kw', v: w };
    if (/^[A-Z][A-Za-z0-9_$]*$/.test(w)) return { t: 'typ', v: w };
    return { t: 'txt', v: w };
  });
}
export function tokenizeSql(src: string): Token[] {
  const re = /(--[^\n]*|\/\*[\s\S]*?\*\/)|('(?:''|[^'])*')|(\b\d[\w.]*\b)|([A-Za-z_][\w$]*)/g;
  return scan(src, re, (m) => {
    if (m[1]) return { t: 'com', v: m[1] };
    if (m[2]) return { t: 'str', v: m[2] };
    if (m[3]) return { t: 'num', v: m[3] };
    return { t: SQL_KW.has(m[4].toLowerCase()) ? 'kw' : 'txt', v: m[4] };
  });
}
function byLine(src: string, fn: (line: string) => Token[]): Token[] {
  const out: Token[] = [];
  const lines = src.split('\n');
  lines.forEach((line, i) => { out.push(...fn(line)); if (i < lines.length - 1) out.push({ t: 'txt', v: '\n' }); });
  return out;
}
function shellRest(s: string): Token[] {
  const re = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(#.*$)|(-{1,2}[A-Za-z][\w:+=.\-]*)/g;
  return scan(s, re, (m) => (m[1] ? { t: 'str', v: m[1] } : m[2] ? { t: 'com', v: m[2] } : { t: 'num', v: m[3] }));
}
export const tokenizeShell = (src: string) => byLine(src, (line) => {
  const prompt = line.match(/^(\s*[$#>]\s)(.*)$/);
  if (prompt) return [{ t: 'kw', v: prompt[1] } as Token, ...shellRest(prompt[2])];
  if (/^\s*(#|\/\/)/.test(line)) return [{ t: 'com', v: line }];
  return shellRest(line);
});
export const tokenizeYaml = (src: string) => byLine(src, (line) => {
  if (/^\s*#/.test(line)) return [{ t: 'com', v: line }];
  const m = line.match(/^(\s*-?\s*)([A-Za-z_"][\w."\/-]*)(:)(.*)$/);
  if (!m) return [{ t: 'txt', v: line }];
  const rest = m[4].replace(/(#.*)$/, '');
  const com = m[4].slice(rest.length);
  const out: Token[] = [{ t: 'txt', v: m[1] }, { t: 'typ', v: m[2] }, { t: 'kw', v: m[3] }, { t: 'str', v: rest }];
  if (com) out.push({ t: 'com', v: com });
  return out;
});
export function tokenize(src: string, lang = 'java'): Token[] {
  switch (lang) {
    case 'sql': return tokenizeSql(src);
    case 'shell': return tokenizeShell(src);
    case 'yaml': case 'yml': case 'json': case 'hcl': return tokenizeYaml(src);
    case 'text': return [{ t: 'txt', v: src }];
    default: return tokenizeJava(src);
  }
}
