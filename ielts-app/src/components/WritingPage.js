import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const TASK_TYPES = [
  { id: 'task1', label: 'Task 1', desc: 'Academic — Graph/Chart/Diagram', icon: '📊', color: '#6c63ff', minWords: 150 },
  { id: 'task2', label: 'Task 2', desc: 'Essay', icon: '✍️', color: '#f59e0b', minWords: 250 },
];

function countWords(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

export default function WritingPage({ user, userProfile, isAdmin }) {
  const [tab, setTab] = useState('write'); // write | history
  const [taskType, setTaskType] = useState('task1');
  const [prompt, setPrompt] = useState('');
  const [essay, setEssay] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [viewSub, setViewSub] = useState(null);
  const [timer, setTimer] = useState(0);
  const [timerOn, setTimerOn] = useState(false);

  const task = TASK_TYPES.find(t => t.id === taskType);
  const wordCount = countWords(essay);

  // Timer
  useEffect(() => {
    let interval;
    if (timerOn) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerOn]);

  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  // Load submissions
  useEffect(() => {
    if (!user) return;
    const q = isAdmin
      ? query(collection(db, 'writing_submissions'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'writing_submissions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [user, isAdmin]);

  const handleSave = async () => {
    if (!essay.trim()) { setMsg('❌ Essay yozing!'); return; }
    if (wordCount < task.minWords) { setMsg(`❌ Kamida ${task.minWords} ta so'z kerak! (Hozir: ${wordCount})`); return; }
    setSaving(true); setMsg('');
    try {
      await addDoc(collection(db, 'writing_submissions'), {
        userId: user.uid,
        userName: userProfile?.name || user.email,
        taskType,
        taskLabel: task.label,
        prompt,
        essay,
        wordCount,
        timeSpent: timer,
        createdAt: serverTimestamp()
      });
      setMsg('✅ Saqlandi!');
      setEssay(''); setPrompt(''); setTimer(0); setTimerOn(false);
      setTimeout(() => { setMsg(''); setTab('history'); }, 1200);
    } catch (e) { setMsg('❌ ' + e.message); }
    setSaving(false);
  };

  const deleteSub = async (id) => {
    if (!window.confirm("O'chirilsinmi?")) return;
    await deleteDoc(doc(db, 'writing_submissions', id));
    if (viewSub?.id === id) setViewSub(null);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1a1030,#201840)', border: '1px solid #6c63ff44', borderRadius: 18, padding: '22px 24px', marginBottom: 22, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -10, fontSize: 90, opacity: 0.05 }}>✍️</div>
        <div style={{ fontFamily: 'Syne', fontSize: '0.75rem', color: '#6c63ff', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>IELTS Academic</div>
        <h1 style={{ fontFamily: 'Syne', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>✍️ <span style={{ color: '#6c63ff' }}>Writing</span></h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.83rem' }}>Task 1 & Task 2 — Yozing, saqlaning, taraqqiy eting</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {[['write', '✍️ Yozish'], ['history', `📋 Tarixim (${submissions.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: tab === id ? '#6c63ff' : 'var(--surface)',
            border: '1px solid ' + (tab === id ? '#6c63ff' : 'var(--border)'),
            borderRadius: 9, padding: '9px 20px',
            color: tab === id ? '#fff' : 'var(--muted)',
            fontFamily: 'Syne', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer'
          }}>{label}</button>
        ))}
      </div>

      {/* WRITE TAB */}
      {tab === 'write' && (
        <div>
          {/* Task type selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {TASK_TYPES.map(t => (
              <button key={t.id} onClick={() => setTaskType(t.id)} style={{
                background: taskType === t.id ? t.color + '22' : 'var(--surface)',
                border: '2px solid ' + (taskType === t.id ? t.color : 'var(--border)'),
                borderRadius: 12, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', transition: 'all .2s'
              }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{t.icon}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, color: taskType === t.id ? t.color : 'var(--text)', fontSize: '0.95rem' }}>{t.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>{t.desc}</div>
                <div style={{ fontSize: '0.7rem', color: t.color, marginTop: 4 }}>Min {t.minWords} so'z</div>
              </button>
            ))}
          </div>

          {/* Prompt */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Savol / Topic (ixtiyoriy)</label>
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
              placeholder="IELTS savolini bu yerga yozing..."
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: '0.88rem', resize: 'vertical', outline: 'none', fontFamily: 'DM Sans', lineHeight: 1.6 }} />
          </div>

          {/* Timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.2rem', color: timerOn ? '#00e5a0' : 'var(--muted)', minWidth: 70 }}>{formatTime(timer)}</div>
            <button onClick={() => setTimerOn(t => !t)} style={{ background: timerOn ? '#00e5a022' : 'var(--surface)', border: '1px solid ' + (timerOn ? '#00e5a0' : 'var(--border)'), borderRadius: 8, padding: '6px 14px', color: timerOn ? '#00e5a0' : 'var(--muted)', fontSize: '0.8rem', cursor: 'pointer' }}>
              {timerOn ? '⏸ Pauza' : '▶ Timer'}
            </button>
            {timer > 0 && <button onClick={() => { setTimer(0); setTimerOn(false); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>Reset</button>}
          </div>

          {/* Essay textarea */}
          <div style={{ position: 'relative', marginBottom: 14 }}>
            <textarea value={essay} onChange={e => setEssay(e.target.value)}
              placeholder="Essay'ingizni bu yerga yozing..."
              rows={16}
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid ' + (wordCount >= task.minWords ? '#00e5a055' : 'var(--border)'), borderRadius: 12, padding: '14px 16px', color: 'var(--text)', fontSize: '0.95rem', resize: 'vertical', outline: 'none', fontFamily: 'DM Sans', lineHeight: 1.8 }} />
            {/* Word count badge */}
            <div style={{
              position: 'absolute', bottom: 12, right: 14,
              background: wordCount >= task.minWords ? '#00e5a022' : 'var(--surface2)',
              border: '1px solid ' + (wordCount >= task.minWords ? '#00e5a055' : 'var(--border)'),
              borderRadius: 6, padding: '3px 10px',
              fontSize: '0.78rem', color: wordCount >= task.minWords ? '#00e5a0' : 'var(--muted)',
              fontFamily: 'Syne', fontWeight: 700
            }}>
              {wordCount} / {task.minWords}+ so'z
            </div>
          </div>

          {msg && <div style={{ background: msg.startsWith('✅') ? '#00e5a011' : '#ff5c7d11', border: '1px solid ' + (msg.startsWith('✅') ? '#00e5a033' : '#ff5c7d33'), borderRadius: 9, padding: '10px 14px', color: msg.startsWith('✅') ? '#00e5a0' : '#ff5c7d', fontSize: '0.83rem', marginBottom: 14 }}>{msg}</div>}

          <button onClick={handleSave} disabled={saving} style={{
            background: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', border: 'none', borderRadius: 12,
            padding: '13px 32px', color: '#fff', fontFamily: 'Syne', fontWeight: 800,
            fontSize: '1rem', cursor: 'pointer', opacity: saving ? 0.7 : 1,
            boxShadow: '0 4px 20px #6c63ff44'
          }}>
            {saving ? 'Saqlanmoqda...' : '💾 Saqlash'}
          </button>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div>
          {submissions.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
              <div>Hali hech narsa yozmagansiz</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {submissions.map(sub => {
              const t = TASK_TYPES.find(t => t.id === sub.taskType) || TASK_TYPES[0];
              return (
                <div key={sub.id} style={{ background: 'var(--surface)', border: '1px solid ' + t.color + '33', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ background: t.color + '22', border: '1px solid ' + t.color + '55', borderRadius: 5, padding: '2px 8px', color: t.color, fontSize: '0.72rem', fontFamily: 'Syne', fontWeight: 700 }}>{sub.taskLabel || t.label}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{sub.wordCount} so'z</span>
                        {sub.timeSpent > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>⏱ {formatTime(sub.timeSpent)}</span>}
                        {isAdmin && sub.userName && <span style={{ fontSize: '0.72rem', color: 'var(--accent2)' }}>👤 {sub.userName}</span>}
                      </div>
                      {sub.prompt && <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 6, fontStyle: 'italic' }}>"{sub.prompt.slice(0, 80)}{sub.prompt.length > 80 ? '...' : ''}"</div>}
                      <div style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6 }}>
                        {sub.essay.slice(0, 120)}{sub.essay.length > 120 ? '...' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setViewSub(sub)} style={{ background: t.color, border: 'none', borderRadius: 8, padding: '7px 14px', color: '#000', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                        👁 Ko'rish
                      </button>
                      {(isAdmin || sub.userId === user?.uid) && (
                        <button onClick={() => deleteSub(sub.id)} style={{ background: 'none', border: '1px solid #ff5c7d55', borderRadius: 8, padding: '5px 10px', color: '#ff5c7d', cursor: 'pointer', fontSize: '0.75rem' }}>🗑</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW SUBMISSION MODAL */}
      {viewSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0f1120', border: '2px solid #6c63ff', borderRadius: 18, width: 'min(700px,100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="fadeIn">
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, color: '#6c63ff', fontSize: '1rem' }}>{viewSub.taskLabel} — Essay</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>{viewSub.wordCount} so'z {viewSub.timeSpent > 0 ? `· ⏱ ${formatTime(viewSub.timeSpent)}` : ''} {viewSub.userName ? `· ${viewSub.userName}` : ''}</div>
              </div>
              <button onClick={() => setViewSub(null)} style={{ background: '#2e1a1a', border: '1px solid #ff5c7d', borderRadius: 8, padding: '6px 14px', color: '#ff5c7d', cursor: 'pointer', fontFamily: 'Syne', fontWeight: 700 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
              {viewSub.prompt && (
                <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--text)', fontStyle: 'normal' }}>Savol: </strong>{viewSub.prompt}
                </div>
              )}
              <div style={{ fontSize: '0.95rem', lineHeight: 1.9, color: 'var(--text)', whiteSpace: 'pre-wrap', fontFamily: 'DM Sans' }}>{viewSub.essay}</div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
              <button onClick={() => setViewSub(null)} style={{ width: '100%', background: '#6c63ff', border: 'none', borderRadius: 10, padding: '12px', fontFamily: 'Syne', fontWeight: 800, color: '#fff', cursor: 'pointer', fontSize: '0.95rem' }}>✕ Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
