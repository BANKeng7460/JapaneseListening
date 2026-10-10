import Link from 'next/link';
import grammar from '../data/grammar.json';
import usage from '../data/grammar-usage.json';

const byId = new Map(grammar.map(point => [point.id, point]));
const basic = new Set(usage.basic);
const found = usage as unknown as { reading: Record<string, [string, string][][]>; listening: Record<string, [string, string][][]> };

// "Grammar used here" box for a reading passage or a conversation, built by scripts/grammar-usage.cjs.
export default function GrammarUsed({ kind, setId, index }: { kind: 'reading' | 'listening'; setId: string; index: number }) {
  const items = found[kind][setId]?.[index] ?? [];
  const main = items.filter(([id]) => !basic.has(id));
  const basics = items.filter(([id]) => basic.has(id));
  if (!items.length) return null;
  // Collapsed by default so it doesn’t give hints before the learner has read the text.
  return <details className="grammar-used">
    <summary>Grammar used here <span className="small">· {main.length ? `${main.length} point${main.length > 1 ? 's' : ''}` : 'basics only'}</span></summary>
    {main.length ? <ul>{main.map(([id, snippet]) => {
      const point = byId.get(id)!;
      return <li key={id}>
        <Link href={`/grammar#${id}`} className="grammar-used-pattern" lang="ja">{point.pattern}</Link>
        <span className="grammar-used-level">{point.level}</span>
        <span className="small">{point.meaning}</span>
        <span className="grammar-used-snippet" lang="ja">「{snippet}」</span>
      </li>;
    })}</ul> : <p className="small">Only basic particles and です in this one.</p>}
    {basics.length > 0 && <p className="small">Basics: {basics.map(([id], i) => <span key={id}>{i > 0 && ' · '}<Link href={`/grammar#${id}`} lang="ja">{byId.get(id)!.pattern}</Link></span>)}</p>}
    <p className="small grammar-used-note">Detected automatically, so an occasional pick may be off. Tap a pattern to study it.</p>
  </details>;
}
