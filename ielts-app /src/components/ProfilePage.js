import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const SKILLS = [
  { key:'listening', label:'🎧 Listening', color:'#10b981', col:'listening_results' },
  { key:'reading', label:'📖 Reading', color:'#3b82f6', col:'reading_results' },
  { key:'writing', label:'✍️ Writing', color:'#f59e0b', col:'story' },
  { key:'speaking', label:'🎤 Speaking', color:'#ec4899', col:'story' },
];

export default function ProfilePage({ user, userProfile }) {
  const [listeningResults, setListeningResults] = useState([]);
  const [readingResults, setReadingResults] = useState([]);
  const [storyResults, setStoryResults] = useState([]);

  useEffect(() => {
    if (!user) return;
    const unsubs = [];

    const lq = query(collection(db, 'listening_results'), where('userId','==',user.uid));
    unsubs.push(onSnapshot(lq, snap => setListeningResults(snap.docs.map(d=>({id:d.id,...d.data()}))), ()=>{}));

    const rq = query(collection(db, 'reading_results'), where('userId','==',user.uid));
    unsubs.push(onSnapshot(rq, snap => setReadingResults(snap.docs.map(d=>({id:d.id,...d.data()}))), ()=>{}));

    const sq = query(collection(db, 'story'), where('userId','==',user.uid));
    unsubs.push(onSnapshot(sq, snap => setStoryResults(snap.docs.map(d=>({id:d.id,...d.data()}))), ()=>{}));

    return () => unsubs.forEach(u=>u());
  }, [user]);

  const getWriting = () => storyResults.filter(r=>r.section==='writing');
  const getSpeaking = () => storyResults.filter(r=>r.section==='speaking');

  const getBest = (arr, key='score') => {
    if (!arr.length) return null;
    const nums = arr.map(r=>parseFloat(r[key])||0).filter(n=>n>0);
    return nums.length ? Math.max(...nums) : null;
  };

  const scoreColor = (s) => {
    if (!s) return 'var(--muted)';
    return s >= 7 ? 'var(--green)' : s >= 6 ? 'var(--accent)' : 'var(--red)';
  };

  return (
    <div style={{ maxWidth:800, margin:'0 auto', padding:'28px 20px' }}>
      {/* Profile hero */}
      <div style={{ background:'linear-gradient(135deg,#111520,#1a1e2b)', border:'1px solid var(--border)', borderRadius:18, padding:'28px 24px', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom:20 }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne', fontWeight:800, fontSize:'1.5rem', color:'#000', flexShrink:0 }}>
            {(userProfile?.name||user?.email||'?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:'Syne', fontSize:'1.3rem', fontWeight:800 }}>{userProfile?.name || user?.email}</div>
            <div style={{ color:'var(--muted)', fontSize:'0.82rem' }}>{user?.email}</div>
            <div style={{ fontSize:'0.72rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:5, padding:'2px 8px', display:'inline-block', marginTop:4, color:'var(--accent2)' }}>
              {userProfile?.role === 'teacher' ? '👩‍🏫 Teacher' : '👨‍🎓 Student'}
            </div>
          </div>
        </div>

        {/* Best scores grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12 }}>
          {[
            { label:'🎧 Listening', best:getBest(listeningResults), count:listeningResults.length },
            { label:'📖 Reading', best:getBest(readingResults), count:readingResults.length },
            { label:'✍️ Writing', best:getBest(getWriting()), count:getWriting().length },
            { label:'🎤 Speaking', best:getBest(getSpeaking()), count:getSpeaking().length },
          ].map(({label,best,count}) => (
            <div key={label} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginBottom:8 }}>{label}</div>
              <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'2rem', color:scoreColor(best), lineHeight:1 }}>
                {best || '—'}
              </div>
              <div style={{ fontSize:'0.65rem', color:'var(--muted)', marginTop:4 }}>{count} ta test</div>
            </div>
          ))}
        </div>
      </div>

      {/* Listening history */}
      {listeningResults.length > 0 && (
        <Section title="🎧 Listening Natijalari" color="#10b981">
          {listeningResults.map(r => <ResultRow key={r.id} label={r.testId?.slice(0,20)||'Test'} score={r.score} color="#10b981" />)}
        </Section>
      )}

      {/* Reading history */}
      {readingResults.length > 0 && (
        <Section title="📖 Reading Natijalari" color="#3b82f6">
          {readingResults.map(r => <ResultRow key={r.id} label={r.testId?.slice(0,20)||'Test'} score={r.score} color="#3b82f6" />)}
        </Section>
      )}

      {/* Writing/Speaking history */}
      {getWriting().length > 0 && (
        <Section title="✍️ Writing Natijalari" color="#f59e0b">
          {getWriting().map(r => <ResultRow key={r.id} label={r.date||'Test'} score={r.score} color="#f59e0b" note={r.note} />)}
        </Section>
      )}
      {getSpeaking().length > 0 && (
        <Section title="🎤 Speaking Natijalari" color="#ec4899">
          {getSpeaking().map(r => <ResultRow key={r.id} label={r.date||'Test'} score={r.score} color="#ec4899" note={r.note} />)}
        </Section>
      )}

      {listeningResults.length===0 && readingResults.length===0 && getWriting().length===0 && getSpeaking().length===0 && (
        <div style={{ textAlign:'center', padding:50, color:'var(--muted)', background:'var(--surface)', borderRadius:14, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📊</div>
          <div>Hali hech qanday test bajarmaganiz</div>
          <div style={{ fontSize:'0.82rem', marginTop:6 }}>Listening yoki Reading testlarini bajaring!</div>
        </div>
      )}
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1rem', color, marginBottom:12 }}>{title}</div>
      <div style={{ display:'grid', gap:8 }}>{children}</div>
    </div>
  );
}

function ResultRow({ label, score, color, note }) {
  return (
    <div style={{ background:'var(--surface)', border:`1px solid ${color}33`, borderRadius:10, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div>
        <div style={{ fontSize:'0.88rem', fontWeight:500 }}>{label}</div>
        {note && <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginTop:2 }}>{note}</div>}
      </div>
      <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.4rem', color }}>
        {parseFloat(score)>=7?'🌟':''}{score}
      </div>
    </div>
  );
}
