import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function ProfilePage({ user, userProfile }) {
  const [listeningResults, setListeningResults] = useState([]);
  const [readingResults, setReadingResults] = useState([]);
  const [storyResults, setStoryResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null); // for answer modal

  useEffect(() => {
    if (!user) return;
    const unsubs = [];
    const lq = query(collection(db,'listening_results'), where('userId','==',user.uid));
    unsubs.push(onSnapshot(lq, snap=>setListeningResults(snap.docs.map(d=>({id:d.id,...d.data()}))),()=>{}));
    const rq = query(collection(db,'reading_results'), where('userId','==',user.uid));
    unsubs.push(onSnapshot(rq, snap=>setReadingResults(snap.docs.map(d=>({id:d.id,...d.data()}))),()=>{}));
    const sq = query(collection(db,'story'), where('userId','==',user.uid));
    unsubs.push(onSnapshot(sq, snap=>setStoryResults(snap.docs.map(d=>({id:d.id,...d.data()}))),()=>{}));
    return () => unsubs.forEach(u=>u());
  }, [user]);

  const getWriting = () => storyResults.filter(r=>r.section==='writing');
  const getSpeaking = () => storyResults.filter(r=>r.section==='speaking');
  const getBest = (arr) => {
    const nums = arr.map(r=>parseFloat(r.score)||0).filter(n=>n>0);
    return nums.length ? Math.max(...nums) : null;
  };
  const scoreColor = s => !s?'var(--muted)':s>=7?'#00e5a0':s>=6?'#ffd700':'#ff5c7d';

  return (
    <div style={{ maxWidth:860, margin:'0 auto', padding:'28px 20px' }}>
      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#0f1120,#161828)', border:'1px solid var(--border)', borderRadius:18, padding:'26px 24px', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne', fontWeight:800, fontSize:'1.4rem', color:'#fff', flexShrink:0 }}>
            {(userProfile?.name||user?.email||'?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:'Syne', fontSize:'1.2rem', fontWeight:800 }}>{userProfile?.name||user?.email}</div>
            <div style={{ color:'var(--muted)', fontSize:'0.8rem', marginTop:2 }}>{user?.email}</div>
            <span style={{ fontSize:'0.68rem', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:5, padding:'2px 8px', display:'inline-block', marginTop:4, color:'var(--accent2)' }}>
              {userProfile?.role==='teacher'?'👩‍🏫 Teacher':'👨‍🎓 Student'}
            </span>
          </div>
        </div>
        {/* Best scores */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10 }}>
          {[
            {label:'🎧 Listening', best:getBest(listeningResults), count:listeningResults.length, color:'#00d4aa'},
            {label:'📖 Reading', best:getBest(readingResults), count:readingResults.length, color:'#6c63ff'},
            {label:'✍️ Writing', best:getBest(getWriting()), count:getWriting().length, color:'#ffd700'},
            {label:'🎤 Speaking', best:getBest(getSpeaking()), count:getSpeaking().length, color:'#ff6b9d'},
          ].map(({label,best,count,color})=>(
            <div key={label} style={{ background:'var(--surface2)', border:`1px solid ${color}33`, borderRadius:12, padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:6 }}>{label}</div>
              <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.9rem', color:scoreColor(best), lineHeight:1 }}>{best||'—'}</div>
              <div style={{ fontSize:'0.65rem', color:'var(--muted)', marginTop:4 }}>{count} ta test</div>
            </div>
          ))}
        </div>
      </div>

      {/* Listening results */}
      {listeningResults.length>0 && (
        <Section title="🎧 Listening Natijalari" color="#00d4aa">
          {listeningResults.map(r=>(
            <ResultCard key={r.id} r={r} color="#00d4aa" onView={()=>setSelectedResult({...r, type:'Listening'})} />
          ))}
        </Section>
      )}

      {/* Reading results */}
      {readingResults.length>0 && (
        <Section title="📖 Reading Natijalari" color="#6c63ff">
          {readingResults.map(r=>(
            <ResultCard key={r.id} r={r} color="#6c63ff" onView={()=>setSelectedResult({...r, type:'Reading'})} />
          ))}
        </Section>
      )}

      {/* Writing */}
      {getWriting().length>0 && (
        <Section title="✍️ Writing Natijalari" color="#ffd700">
          {getWriting().map(r=><SimpleCard key={r.id} r={r} color="#ffd700" />)}
        </Section>
      )}

      {/* Speaking */}
      {getSpeaking().length>0 && (
        <Section title="🎤 Speaking Natijalari" color="#ff6b9d">
          {getSpeaking().map(r=><SimpleCard key={r.id} r={r} color="#ff6b9d" />)}
        </Section>
      )}

      {listeningResults.length===0 && readingResults.length===0 && getWriting().length===0 && getSpeaking().length===0 && (
        <div style={{ textAlign:'center', padding:60, color:'var(--muted)', background:'var(--surface)', borderRadius:14, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:44, marginBottom:12 }}>📊</div>
          <div>Hali hech qanday test bajarmaganiz</div>
          <div style={{ fontSize:'0.82rem', marginTop:6 }}>Listening yoki Reading testlarini bajaring!</div>
        </div>
      )}

      {/* Answer detail modal */}
      {selectedResult && (
        <AnswerModal result={selectedResult} onClose={()=>setSelectedResult(null)} />
      )}
    </div>
  );
}

function Section({ title, color, children }) {
  return (
    <div style={{ marginBottom:24 }}>
      <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'0.95rem', color, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
        {title}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{children}</div>
    </div>
  );
}

function ResultCard({ r, color, onView }) {
  const arr = Array.isArray(r.answers) ? r.answers : [];
  const correct = arr.filter(a=>a.correct).length;
  const wrong = arr.filter(a=>!a.correct && a.your).length;
  const scoreColor = s => !s?'var(--muted)':parseFloat(s)>=7?'#00e5a0':parseFloat(s)>=6?'#ffd700':'#ff5c7d';

  return (
    <div style={{ background:'var(--surface)', border:`1px solid ${color}33`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginBottom:4 }}>{r.testId || 'Test'}</div>
        {arr.length>0 && (
          <div style={{ display:'flex', gap:12, fontSize:'0.75rem' }}>
            <span style={{ color:'#00e5a0' }}>✅ {correct} to'g'ri</span>
            <span style={{ color:'#ff5c7d' }}>❌ {wrong} noto'g'ri</span>
            <span style={{ color:'var(--muted)' }}>📝 {arr.length} savol</span>
          </div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.6rem', color:scoreColor(r.score) }}>{r.score}</div>
        {arr.length>0 && (
          <button onClick={onView} style={{ background:`${color}22`, border:`1px solid ${color}55`, borderRadius:8, padding:'7px 14px', color, fontSize:'0.8rem', cursor:'pointer', fontFamily:'Syne', fontWeight:700, whiteSpace:'nowrap' }}>
            📋 Ko'rish
          </button>
        )}
      </div>
    </div>
  );
}

function SimpleCard({ r, color }) {
  const scoreColor = s => !s?'var(--muted)':parseFloat(s)>=7?'#00e5a0':parseFloat(s)>=6?'#ffd700':'#ff5c7d';
  return (
    <div style={{ background:'var(--surface)', border:`1px solid ${color}33`, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div>
        <div style={{ fontSize:'0.82rem', fontWeight:500 }}>{r.date||''}</div>
        {r.note && <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginTop:2 }}>{r.note}</div>}
      </div>
      <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.6rem', color:scoreColor(r.score) }}>{r.score}</div>
    </div>
  );
}

function AnswerModal({ result, onClose }) {
  const [filter, setFilter] = useState('all');
  const arr = Array.isArray(result.answers) ? result.answers : [];
  const correct = arr.filter(a=>a.correct).length;
  const wrong = arr.filter(a=>!a.correct && a.your).length;

  const filtered = arr.filter(a => {
    if (filter==='wrong') return !a.correct;
    if (filter==='correct') return a.correct;
    return true;
  });

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.88)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#0f1120', border:'2px solid var(--accent)', borderRadius:18, width:'min(580px,100%)', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column' }}
        onClick={e=>e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding:'20px 22px', borderBottom:'1px solid var(--border)', textAlign:'center' }}>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.1rem', color:'var(--accent)', marginBottom:4 }}>
            {result.type} — Javoblar
          </div>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'2.8rem', color:'#ffd700', lineHeight:1 }}>{result.score}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:20, marginTop:8, fontSize:'0.8rem' }}>
            <span style={{ color:'#00e5a0' }}>✅ {correct} to'g'ri</span>
            <span style={{ color:'#ff5c7d' }}>❌ {wrong} noto'g'ri</span>
            <span style={{ color:'var(--muted)' }}>📝 {arr.length} savol</span>
          </div>
        </div>

        {/* Filter */}
        <div style={{ padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', gap:8 }}>
          {[['all','Hammasi'],['wrong','❌ Noto\'g\'ri'],['correct','✅ To\'g\'ri']].map(([id,label])=>(
            <button key={id} onClick={()=>setFilter(id)} style={{ flex:1, background:filter===id?'var(--accent)22':'var(--surface2)', border:`1px solid ${filter===id?'var(--accent)':'var(--border)'}`, borderRadius:8, padding:'7px', color:filter===id?'var(--accent)':'var(--muted)', fontSize:'0.78rem', cursor:'pointer', fontFamily:'Syne', fontWeight:700 }}>{label}</button>
          ))}
        </div>

        {/* Answer list */}
        <div style={{ overflowY:'auto', flex:1, padding:'14px 20px', display:'flex', flexDirection:'column', gap:6 }}>
          {filtered.length===0 && <div style={{ textAlign:'center', padding:30, color:'var(--muted)' }}>Hech narsa topilmadi</div>}
          {filtered.map((a,i) => (
            <div key={i} style={{
              background: a.correct?'#00e5a011':'#ff5c7d11',
              border: `1px solid ${a.correct?'#00e5a033':'#ff5c7d33'}`,
              borderRadius:10, padding:'10px 14px',
              display:'flex', gap:12, alignItems:'flex-start'
            }}>
              <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'0.85rem', color:a.correct?'#00e5a0':'#ff5c7d', width:28, flexShrink:0, paddingTop:1 }}>
                {a.num||i+1}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.85rem', color:a.correct?'#00e5a0':'#ff5c7d', fontWeight:500 }}>
                  {a.correct?'✅':'❌'} {a.your || <i style={{color:'var(--muted)',fontStyle:'italic'}}>Javob berilmagan</i>}
                </div>
                {!a.correct && a.answer && (
                  <div style={{ fontSize:'0.78rem', color:'var(--muted)', marginTop:4 }}>
                    To'g'ri javob: <span style={{ color:'#00e5a0', fontWeight:600 }}>{a.answer}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding:'14px 20px', borderTop:'1px solid var(--border)' }}>
          <button onClick={onClose} style={{ width:'100%', background:'var(--accent)', border:'none', borderRadius:10, padding:'12px', color:'#000', fontFamily:'Syne', fontWeight:800, fontSize:'0.95rem', cursor:'pointer' }}>
            ✕ Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
