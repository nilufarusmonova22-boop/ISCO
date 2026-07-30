import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';

const MODULES = [
  { id:'listening', icon:'🎧', label:'Listening', desc:'Audio testlar', color:'#00d4aa', bg:'#00d4aa' },
  { id:'reading', icon:'📖', label:'Reading', desc:'Matn testlar', color:'#6c63ff', bg:'#6c63ff' },
  { id:'writing', icon:'✍️', label:'Writing', desc:'Yozma natijalar', color:'#ffd700', bg:'#ffd700' },
  { id:'vocab', icon:'📚', label:'Vocabulary', desc:'So\'zlar va flashcard', color:'#ff6b9d', bg:'#ff6b9d' },
  { id:'homework', icon:'📝', label:'Homework', desc:'Kunlik vazifalar', color:'#00bfff', bg:'#00bfff' },
  { id:'profile', icon:'◉', label:'Profile', desc:'Natijalarim', color:'#a78bfa', bg:'#a78bfa' },
];

export default function Dashboard({ user, userProfile, navigate, isAdmin, isTeacher }) {
  const [homework, setHomework] = useState([]);
  const [listeningCount, setListeningCount] = useState(0);
  const [readingCount, setReadingCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db,'homework'), orderBy('createdAt','desc'), limit(3));
    const unsub = onSnapshot(q, snap => setHomework(snap.docs.map(d=>({id:d.id,...d.data()}))), ()=>{});
    return unsub;
  },[]);

  useEffect(() => {
    if (!user) return;
    const lq = query(collection(db,'listening_results'), where('userId','==',user.uid));
    const unsub1 = onSnapshot(lq, snap => setListeningCount(snap.size), ()=>{});
    const rq = query(collection(db,'reading_results'), where('userId','==',user.uid));
    const unsub2 = onSnapshot(rq, snap => setReadingCount(snap.size), ()=>{});
    return () => { unsub1(); unsub2(); };
  },[user]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Xayrli tong' : hour < 17 ? 'Xayrli kun' : 'Xayrli kech';
  const today = new Date().toLocaleDateString('uz-UZ', { weekday:'long', day:'numeric', month:'long' });
  const todayHw = homework.filter(h => {
    const d = new Date(); const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return h.date === s;
  });

  return (
    <div style={{ padding:'32px 28px', maxWidth:1100, margin:'0 auto' }}>

      {/* Hero greeting */}
      <div style={{ marginBottom:36, animation:'fadeUp .5s ease' }}>
        <div style={{ fontSize:'0.82rem', color:'var(--muted)', marginBottom:4 }}>{today}</div>
        <h1 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'2.2rem', lineHeight:1.1, marginBottom:8 }}>
          {greeting}, <span style={{ background:'linear-gradient(135deg,var(--accent),var(--accent2))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{userProfile?.name?.split(' ')[0] || 'Student'}</span> 👋
        </h1>
        <p style={{ color:'var(--muted)', fontSize:'0.9rem' }}>Bugun ham bir qadam oldinga — IELTS maqsadingizga yaqinroq!</p>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12, marginBottom:32 }}>
        {[
          { label:'Listening', val:listeningCount, icon:'🎧', color:'#00d4aa' },
          { label:'Reading', val:readingCount, icon:'📖', color:'#6c63ff' },
          { label:'Homework', val:homework.length, icon:'📝', color:'#00bfff' },
          { label:'Bugun', val:todayHw.length, icon:'🔥', color:'#ff6b9d' },
        ].map(s => (
          <div key={s.label} style={{ background:'var(--surface)', border:`1px solid ${s.color}33`, borderRadius:14, padding:'16px 14px', animation:'fadeUp .6s ease' }}>
            <div style={{ fontSize:'1.4rem', marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.8rem', color:s.color, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Module grid */}
      <div style={{ marginBottom:32 }}>
        <h2 style={{ fontFamily:'Syne', fontSize:'1rem', color:'var(--muted)', marginBottom:16, letterSpacing:1, textTransform:'uppercase', fontSize:'0.75rem' }}>Bo'limlar</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14 }}>
          {MODULES.map((m, i) => (
            <button key={m.id} onClick={()=>navigate(m.id)} style={{
              background:'var(--surface)', border:`1px solid ${m.color}22`,
              borderRadius:16, padding:'22px 20px', textAlign:'left', cursor:'pointer',
              transition:'all .25s', position:'relative', overflow:'hidden',
              animation:`fadeUp ${0.3 + i*0.07}s ease`,
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor=m.color+'88';e.currentTarget.style.background=m.color+'11';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor=m.color+'22';e.currentTarget.style.background='var(--surface)';}}>
              <div style={{ position:'absolute', top:-10, right:-10, fontSize:60, opacity:0.06 }}>{m.icon}</div>
              <div style={{ fontSize:'1.8rem', marginBottom:10 }}>{m.icon}</div>
              <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:'1rem', color:m.color, marginBottom:4 }}>{m.label}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--muted)' }}>{m.desc}</div>
              <div style={{ position:'absolute', bottom:12, right:14, color:m.color, fontSize:'1rem', opacity:0.5 }}>→</div>
            </button>
          ))}
        </div>
      </div>

      {/* Today's homework */}
      {todayHw.length > 0 && (
        <div>
          <h2 style={{ fontFamily:'Syne', fontSize:'0.75rem', color:'var(--muted)', marginBottom:14, letterSpacing:1, textTransform:'uppercase' }}>🔥 Bugungi Homework</h2>
          <div style={{ display:'grid', gap:10 }}>
            {todayHw.map(hw => (
              <div key={hw.id} onClick={()=>navigate('homework')} style={{ background:'var(--surface)', border:'1px solid #00bfff33', borderRadius:12, padding:'14px 18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', transition:'all .2s' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#00bfff'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#00bfff33'}>
                <div>
                  <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:'0.95rem' }}>{hw.title}</div>
                  {hw.text && <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginTop:3 }}>{hw.text.slice(0,60)}{hw.text.length>60?'...':''}</div>}
                </div>
                <span style={{ color:'#00bfff', fontSize:'0.8rem', flexShrink:0 }}>Ko'rish →</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
