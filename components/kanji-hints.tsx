'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import hintData from '../data/word-hints.json';

type Hint = { word: string; reading: string; meaning: string };
const dictionary: Record<string, Hint[]> = hintData;
const forms = Object.keys(dictionary).sort((a,b) => b.length - a.length);
const byFirst = new Map<string, string[]>();
for (const form of forms) { const list = byFirst.get(form[0]) || []; list.push(form); byFirst.set(form[0],list); }

export default function KanjiHints({ text }: { text: string }) {
  const id = useId();
  const [active, setActive] = useState<{ index: number; form: string; left: number; top: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const tokens = useMemo(() => {
    const result: {text: string; hint: boolean}[] = [];
    for (let i = 0; i < text.length;) {
      const form = byFirst.get(text[i])?.find(candidate => text.startsWith(candidate,i));
      if (form) { result.push({text:form,hint:true}); i += form.length; }
      else { const last = result[result.length-1]; if (last && !last.hint) last.text += text[i]; else result.push({text:text[i],hint:false}); i++; }
    }
    return result;
  },[text]);
  const hold = () => { if (timer.current) clearTimeout(timer.current); };
  const leave = () => { hold(); timer.current = setTimeout(() => setActive(null),180); };
  useEffect(() => {
    const close = () => setActive(null);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    const outside = (event: PointerEvent) => { const target = event.target as HTMLElement; if (!target.closest('.kanji-word') && !panel.current?.contains(target)) close(); };
    window.addEventListener('scroll',close,true); window.addEventListener('resize',close); window.addEventListener('keydown',escape); window.addEventListener('pointerdown',outside);
    return () => { if (timer.current) clearTimeout(timer.current); window.removeEventListener('scroll',close,true); window.removeEventListener('resize',close); window.removeEventListener('keydown',escape); window.removeEventListener('pointerdown',outside); };
  },[]);
  function show(element: HTMLButtonElement,index:number,form:string) {
    hold(); const rect=element.getBoundingClientRect();
    setActive({index,form,left:Math.max(8,Math.min(rect.left,window.innerWidth-296)),top:rect.bottom + 8 < window.innerHeight-240 ? rect.bottom+8 : Math.max(8,rect.top-240)});
  }
  return <>{tokens.map((token,index) => token.hint ? <button key={index} type="button" className="kanji-word" aria-describedby={active?.index === index ? id : undefined} onMouseEnter={e=>show(e.currentTarget,index,token.text)} onMouseLeave={leave} onFocus={e=>show(e.currentTarget,index,token.text)} onBlur={leave} onClick={e=>show(e.currentTarget,index,token.text)}>{token.text}</button> : <span key={index}>{token.text}</span>)}
    {active && createPortal(<div ref={panel} id={id} role="tooltip" className="kanji-tooltip" style={{left:active.left,top:active.top}} onMouseEnter={hold} onMouseLeave={leave}>
      <strong lang="ja">{active.form}</strong>
      {dictionary[active.form].map((hint,index)=><div key={index} className="kanji-definition"><div lang="ja">{hint.word} · {hint.reading}</div><div>{hint.meaning}</div></div>)}
      <p className="small">Dictionary readings and meanings; choose the sense that fits the sentence. For conjugated forms, the reading shown is for the base word. Esc or tap outside to close.</p>
    </div>,document.body)}
  </>;
}
