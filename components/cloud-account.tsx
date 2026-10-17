'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

const pendingKey = 'kiku-cloud-pending';
type Values = Record<string, string>;
function readPending(): Values {
  try { return JSON.parse(localStorage.getItem(pendingKey) || '{}'); } catch { return {}; }
}
export default function CloudAccount({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'loading' | 'login' | 'ready' | 'error'>('loading');
  const [key, setKey] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [resume, setResume] = useState('/');
  const pending = useRef<Values>({});
  const sending = useRef(false);
  const pathname = usePathname();

  async function flush() {
    if (sending.current || !Object.keys(pending.current).length) return;
    sending.current = true;
    const batch = { ...pending.current };
    setMessage('กำลังบันทึก…');
    try {
      const response = await fetch('/api/progress', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ values: batch }) });
      if (response.status === 401) { setPhase('login'); throw new Error('กรุณาเข้าสู่ระบบอีกครั้ง'); }
      if (!response.ok) throw new Error('ยังซิงก์ไม่ได้ · เก็บในเครื่องแล้ว จะลองใหม่อัตโนมัติ');
      for (const [name, value] of Object.entries(batch)) if (pending.current[name] === value) delete pending.current[name];
      localStorage.setItem(pendingKey, JSON.stringify(pending.current));
      setMessage(Object.keys(pending.current).length ? 'รอบันทึก' : 'บันทึกบนคลาวด์แล้ว');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'ยังซิงก์ไม่ได้'); }
    finally { sending.current = false; }
  }
  async function restore() {
    const response = await fetch('/api/progress', { cache: 'no-store' });
    if (!response.ok) throw new Error('เชื่อมต่อฐานข้อมูลไม่ได้ กรุณาลองอีกครั้ง');
    const { values } = await response.json() as { values: Values };
    pending.current = readPending();
    // Existing cloud values win on a new device; unsynced local edits win on this device.
    for (let i = 0; i < localStorage.length; i++) {
      const name = localStorage.key(i)!;
      if (name.startsWith('kiku-') && name !== pendingKey && values[name] === undefined) pending.current[name] = localStorage.getItem(name)!;
    }
    for (const [name, value] of Object.entries(values)) if (pending.current[name] === undefined) localStorage.setItem(name, value);
    const lastPage = localStorage.getItem('kiku-last-page') || '/';
    setResume(lastPage.startsWith('/') && !lastPage.startsWith('//') && !lastPage.includes('\\') ? lastPage : '/');
    localStorage.setItem(pendingKey, JSON.stringify(pending.current));
    setPhase('ready');
    setMessage('พร้อมเรียนต่อ');
    await flush();
  }
  async function initialize() {
    setPhase('loading');
    try {
      const response = await fetch('/api/session', { cache: 'no-store' });
      if (!response.ok) throw new Error('ตรวจสอบการเข้าสู่ระบบไม่ได้');
      if (!(await response.json()).authenticated) { setPhase('login'); return; }
      await restore();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'เชื่อมต่อไม่ได้'); setPhase('error'); }
  }
  useEffect(() => { void initialize(); }, []);
  useEffect(() => {
    if (phase !== 'ready') return;
    function saved(event: Event) {
      const { key: name, value } = (event as CustomEvent<{ key: string; value: string }>).detail;
      pending.current[name] = value;
      localStorage.setItem(pendingKey, JSON.stringify(pending.current));
      setMessage('รอบันทึก');
    }
    const retry = () => { void flush(); };
    const timer = setInterval(retry, 2000);
    window.addEventListener('kiku-save', saved);
    window.addEventListener('online', retry);
    const visibility = () => { if (document.visibilityState === 'hidden') void flush(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { clearInterval(timer); window.removeEventListener('kiku-save', saved); window.removeEventListener('online', retry); document.removeEventListener('visibilitychange', visibility); };
  }, [phase]);
  useEffect(() => {
    if (phase !== 'ready') return;
    localStorage.setItem('kiku-last-page', pathname);
    pending.current['kiku-last-page'] = pathname;
    localStorage.setItem(pendingKey, JSON.stringify(pending.current));
  }, [pathname, phase]);

  if (phase === 'ready') return <><div className="cloud-bar"><span role="status">{message}</span><a href={resume}>เรียนต่อ</a><button onClick={async () => {
    await flush();
    if (Object.keys(pending.current).length) { setMessage('ยังมีข้อมูลรอซิงก์ กรุณาลองอีกครั้งก่อนออกจากระบบ'); return; }
    const response = await fetch('/api/session', { method: 'DELETE' });
    if (response.ok) { setPhase('login'); setMessage(''); }
  }}>ออกจากระบบ</button></div>{children}</>;
  return <main className="account-screen"><form className="account-card" onSubmit={async event => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
      if (!response.ok) throw new Error(response.status === 401 ? 'Login key ไม่ถูกต้อง' : response.status === 429 ? 'ลองบ่อยเกินไป กรุณารอสักครู่' : 'เข้าสู่ระบบไม่ได้ กรุณาลองอีกครั้ง');
      setKey(''); await restore();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'เชื่อมต่อไม่ได้'); }
    finally { setBusy(false); }
  }}><div className="brand">kiku.</div><h1>เรียนต่อจากครั้งก่อน</h1><p>เข้าสู่ระบบเพื่อบันทึกความคืบหน้าและเรียนต่อได้ทุกเครื่อง</p>{phase === 'loading' ? <p role="status">กำลังโหลด…</p> : phase === 'error' ? <button type="button" onClick={() => void initialize()}>ลองเชื่อมต่ออีกครั้ง</button> : <><label htmlFor="login-key">Login key</label><input id="login-key" type="password" autoComplete="current-password" value={key} onChange={event => setKey(event.target.value)} required maxLength={256} /><button disabled={busy}>{busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button></>}<p role="status">{message}</p></form></main>;
}
