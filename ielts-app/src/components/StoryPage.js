import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';

const SECTION_COLORS = { writing:'#f59e0b', speaking:'#ec4899', reading:'#3b82f6', listening:'#10b981' };
const SECTION_LABELS = { writing:'✍️ Writing', speaking:'🎤 Speaking', reading:'📖 Reading', listening:'🎧 Listening' };

export default function StoryPage({ isAdmin, user, userProfile, section }) {
  const [posts, setPosts] = useState([]);
  const [active, setActive] = useState(section || 'all');
  const [lightbox, setLightbox] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [img, setImg] = useState(null);
  const [sec, setSec] = useState(section || 'writing');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const q = query(collection(db,'story'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, snap => setPosts(snap.docs.map(d=>({id:d.id,...d.data()}))), ()=>{});
    return unsub;
  },[]);

  const filtered = active==='all' ? posts : posts.filter(p=>p.section===active);
  const SECTIONS = ['writing','speaking'];
  const bestScores = {};
  SECTIONS.forEach(s=>{ const sec=posts.filter(p=>p.section===s&&p.score); if(sec.length) bestScores[s]=Math.max(...sec.map(p=>parseFloat(p.score)||0)); });

  const saveResult = async () => {
    if (!score||!date) { setMsg('❌ Ball va sana!'); return; }
    setSaving(true); setMsg('');
    try {
      let imgUrl = null;
      if (img) { imgUrl = await new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(img); }); }
      await addDoc(collection(db,'story'), {
        section: sec, score, date, note, imgUrl,
        userId: user?.uid, userName: userProfile?.name || user?.email,
        createdAt: serverTimestamp()
      });
      setMsg('✅ Saqlandi!'); setScore(''); setDate(''); setNote(''); setImg(null); setShowForm(false);
    } catch(e) { setMsg('❌ '+e.message); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 20px' }}>
      <div style={{ background:'linear-gradient(135deg,#111520,#1a1e2b)', border:'1px solid var(--border)', borderRadius:18, padding:'28px 24px', marginBottom:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-20, fontSize:110, opacity:0.04, fontFamily:'Syne', fontWeight:800 }}>IELTS</div>
        <div style={{ fontFamily:'Syne', fontSize:'0.75rem', color:'var(--muted)', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Results</div>
        <h1 style={{ fontFamily:'Syne', fontSize:'1.8rem', fontWeight:800, marginBottom:4 }}>✍️ <span style={{ color:'#f59e0b' }}>Writing</span> & 🎤 <span style={{ color:'#ec4899' }}>Speaking</span></h1>
        <p style={{ color:'var(--muted)', fontSize:'0.83rem' }}>IELTS natijalari va taraqqiyot</p>
        {Object.keys(bestScores).length > 0 && (
          <div style={{ display:'flex', gap:14, marginTop:18, flexWrap:'wrap' }}>
            {SECTIONS.map(s => bestScores[s] ? (
              <div key={s} style={{ background:SECTION_COLORS[s]+'15', border:'1px solid '+SECTION_COLORS[s]+'44', borderRadius:12, padding:'12px 16px', textAlign:'center', minWidth:80 }}>
                <div style={{ fontSize:'0.68rem', color:SECTION_COLORS[s], marginBottom:4 }}>{SECTION_LABELS[s]}</div>
                <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'2rem', color:SECTION_COLORS[s], lineHeight:1 }}>{bestScores[s]}</div>
                <div style={{ fontSize:'0.62rem', color:'var(--muted)' }}>Best</div>
              </div>
            ):null)}
          </div>
        )}
        {isAdmin && (
          <button onClick={()=>setShowForm(f=>!f)} style={{ marginTop:16, background:'var(--accent)', border:'none', borderRadius:9, padding:'9px 20px', color:'#000', fontFamily:'Syne', fontWeight:700, fontSize:'0.88rem', cursor:'pointer' }}>
            {showForm?'✕ Yopish':'+ Natija qo\'shish'}
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--accent)55', borderRadius:14, padding:'22px', marginBottom:20 }} className="fadeIn">
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            {SECTIONS.map(s=><button key={s} onClick={()=>setSec(s)} style={{ background:sec===s?SECTION_COLORS[s]+'22':'var(--surface2)', border:'1px solid '+(sec===s?SECTION_COLORS[s]:'var(--border)'), borderRadius:8, padding:'7px 14px', color:sec===s?SECTION_COLORS[s]:'var(--muted)', fontSize:'0.85rem', cursor:'pointer' }}>{SECTION_LABELS[s]}</button>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div><label style={{ fontSize:'0.76rem', color:'var(--muted)', display:'block', marginBottom:5 }}>Ball</label><input value={score} onChange={e=>setScore(e.target.value)} placeholder="6.5" style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 11px', color:'var(--text)', fontSize:'0.9rem', outline:'none' }}/></div>
            <div><label style={{ fontSize:'0.76rem', color:'var(--muted)', display:'block', marginBottom:5 }}>Sana</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 11px', color:'var(--text)', fontSize:'0.9rem', outline:'none' }}/></div>
          </div>
          <div style={{ marginBottom:10 }}><label style={{ fontSize:'0.76rem', color:'var(--muted)', display:'block', marginBottom:5 }}>Izoh</label><textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 11px', color:'var(--text)', fontSize:'0.86rem', resize:'none', outline:'none', fontFamily:'DM Sans' }}/></div>
          <div style={{ marginBottom:14 }}><label style={{ fontSize:'0.76rem', color:'var(--muted)', display:'block', marginBottom:5 }}>Rasm</label><input type="file" accept="image/*" onChange={e=>setImg(e.target.files[0])} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'7px 11px', color:'var(--text)', fontSize:'0.83rem', width:'100%' }}/></div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={saveResult} disabled={saving} style={{ background:SECTION_COLORS[sec], border:'none', borderRadius:9, padding:'9px 22px', color:'#000', fontFamily:'Syne', fontWeight:700, cursor:'pointer', opacity:saving?0.6:1 }}>{saving?'...':'💾 Saqlash'}</button>
            {msg && <span style={{ fontSize:'0.83rem', color:msg.startsWith('✅')?'var(--green)':'var(--red)' }}>{msg}</span>}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[['all','🏠 Hammasi'],['writing','✍️ Writing'],['speaking','🎤 Speaking']].map(([id,label])=>(
          <button key={id} onClick={()=>setActive(id)} style={{ background:active===id?(id==='all'?'var(--surface2)':SECTION_COLORS[id]+'20'):'var(--surface)', border:'1px solid '+(active===id?(id==='all'?'var(--accent)':SECTION_COLORS[id]):'var(--border)'), borderRadius:9, padding:'8px 16px', color:active===id?(id==='all'?'var(--accent)':SECTION_COLORS[id]):'var(--muted)', fontSize:'0.85rem', cursor:'pointer' }}>{label}</button>
        ))}
      </div>

      {filtered.length===0&&<div style={{ textAlign:'center', padding:50, color:'var(--muted)', background:'var(--surface)', borderRadius:14, border:'1px solid var(--border)' }}><div style={{fontSize:40,marginBottom:10}}>📭</div>Hali natija yo'q</div>}

      <div style={{ display:'grid', gap:12 }}>
        {filtered.map(post=>(
          <div key={post.id} style={{ background:'var(--surface)', border:'1px solid '+(SECTION_COLORS[post.section]||'#888')+'44', borderRadius:14, padding:'18px 20px', position:'relative' }} className="fadeIn">
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ background:(SECTION_COLORS[post.section]||'#888')+'15', border:'1px solid '+(SECTION_COLORS[post.section]||'#888')+'44', borderRadius:10, padding:'10px 14px', textAlign:'center', minWidth:72, flexShrink:0 }}>
                <div style={{ fontSize:'0.65rem', color:SECTION_COLORS[post.section]||'#888', marginBottom:3 }}>{(SECTION_LABELS[post.section]||post.section||'').toUpperCase()}</div>
                <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'2.2rem', color:parseFloat(post.score)>=7?'var(--green)':parseFloat(post.score)>=6?'var(--accent)':'var(--red)', lineHeight:1 }}>{post.score}</div>
                <div style={{ fontSize:'0.62rem', color:'var(--muted)' }}>Band</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4, flexWrap:'wrap', gap:6 }}>
                  <span style={{ fontFamily:'Syne', fontSize:'0.95rem', color:SECTION_COLORS[post.section]||'#888' }}>{SECTION_LABELS[post.section]||post.section}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    {post.userName && <span style={{ fontSize:'0.7rem', color:'var(--muted)' }}>{post.userName}</span>}
                    <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{post.date}</span>
                  </div>
                </div>
                {post.note && <p style={{ color:'var(--muted)', fontSize:'0.86rem', lineHeight:1.6, marginBottom:post.imgUrl?10:0 }}>{post.note}</p>}
                {post.imgUrl && <img src={post.imgUrl} alt="result" onClick={()=>setLightbox(post.imgUrl)} style={{ maxWidth:'100%', maxHeight:180, borderRadius:9, cursor:'zoom-in', border:'1px solid var(--border)', objectFit:'cover' }}/>}
              </div>
            </div>
            {isAdmin && <button onClick={async()=>{if(window.confirm("O'chirilsinmi?"))await deleteDoc(doc(db,'story',post.id));}} style={{ position:'absolute', top:12, right:12, background:'none', border:'none', color:'var(--muted)', cursor:'pointer', opacity:.5, fontSize:'0.9rem' }}>🗑</button>}
          </div>
        ))}
      </div>
      {lightbox && <div onClick={()=>setLightbox(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.93)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}><img src={lightbox} alt="" style={{ maxWidth:'92vw', maxHeight:'90vh', borderRadius:12 }}/></div>}
    </div>
  );
}
