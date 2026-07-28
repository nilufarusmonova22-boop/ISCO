import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const SECTIONS = ['writing','speaking','reading','listening'];
const LABELS = { writing:'✍️ Writing',speaking:'🎤 Speaking',reading:'📖 Reading',listening:'🎧 Listening' };
const COLORS = { writing:'#f59e0b',speaking:'#ec4899',reading:'#3b82f6',listening:'#10b981' };

export default function StoryPage({ isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [active, setActive] = useState('all');
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const q = query(collection(db,'story'),orderBy('createdAt','desc'));
    const unsub = onSnapshot(q,snap=>{setPosts(snap.docs.map(d=>({id:d.id,...d.data()})));},()=>{});
    return unsub;
  },[]);

  const filtered = active==='all' ? posts : posts.filter(p=>p.section===active);
  const bestScores = {};
  SECTIONS.forEach(s=>{ const sec=posts.filter(p=>p.section===s&&p.score); if(sec.length) bestScores[s]=Math.max(...sec.map(p=>parseFloat(p.score)||0)); });

  return (
    <div style={{ maxWidth:900,margin:'0 auto',padding:'28px 20px' }}>
      <div style={{ background:'linear-gradient(135deg,#111520,#1a1e2b)',border:'1px solid var(--border)',borderRadius:18,padding:'32px 28px',marginBottom:28,position:'relative',overflow:'hidden' }}>
        <div style={{ position:'absolute',top:-30,right:-20,fontSize:120,opacity:0.04,fontFamily:'Syne',fontWeight:800 }}>IELTS</div>
        <div style={{ fontFamily:'Syne',fontSize:'0.78rem',color:'var(--muted)',letterSpacing:2,textTransform:'uppercase',marginBottom:8 }}>Journey</div>
        <h1 style={{ fontFamily:'Syne',fontSize:'2rem',fontWeight:800,marginBottom:6 }}>My <span style={{ color:'var(--accent)' }}>Story</span></h1>
        <p style={{ color:'var(--muted)',fontSize:'0.88rem' }}>IELTS Academic — Mr Megaboom</p>
        {Object.keys(bestScores).length>0&&(
          <div style={{ display:'flex',gap:16,marginTop:24,flexWrap:'wrap' }}>
            {SECTIONS.map(s=>bestScores[s]?(
              <div key={s} style={{ background:COLORS[s]+'15',border:'1px solid '+COLORS[s]+'44',borderRadius:12,padding:'12px 16px',textAlign:'center',minWidth:80 }}>
                <div style={{ fontSize:'0.68rem',color:COLORS[s],marginBottom:4 }}>{LABELS[s].split(' ')[0]} {s.toUpperCase()}</div>
                <div style={{ fontFamily:'Syne',fontWeight:800,fontSize:'1.8rem',color:COLORS[s] }}>{bestScores[s]}</div>
                <div style={{ fontSize:'0.65rem',color:'var(--muted)' }}>Best</div>
              </div>
            ):null)}
          </div>
        )}
      </div>
      <div style={{ display:'flex',gap:8,marginBottom:22,flexWrap:'wrap' }}>
        {[['all','🏠 Hammasi'],...SECTIONS.map(s=>[s,LABELS[s]])].map(([id,label])=>(
          <button key={id} onClick={()=>setActive(id)} style={{ background:active===id?(id==='all'?'var(--surface2)':COLORS[id]+'20'):'var(--surface)',border:'1px solid '+(active===id?(id==='all'?'var(--accent)':COLORS[id]):'var(--border)'),borderRadius:9,padding:'8px 16px',color:active===id?(id==='all'?'var(--accent)':COLORS[id]):'var(--muted)',fontSize:'0.85rem',cursor:'pointer' }}>{label}</button>
        ))}
      </div>
      {filtered.length===0&&<div style={{ textAlign:'center',padding:60,color:'var(--muted)' }}><div style={{ fontSize:48,marginBottom:12 }}>📭</div>Hali hech narsa yo'q</div>}
      <div style={{ display:'grid',gap:14 }}>
        {filtered.map(post=>(
          <div key={post.id} style={{ background:'var(--surface)',border:'1px solid '+(COLORS[post.section]||'var(--border)')+'44',borderRadius:16,padding:'20px 22px',position:'relative' }} className="fadeIn">
            <div style={{ display:'flex',gap:16,alignItems:'flex-start' }}>
              <div style={{ background:(COLORS[post.section]||'#888')+'15',border:'1px solid '+(COLORS[post.section]||'#888')+'55',borderRadius:12,padding:'12px 16px',textAlign:'center',minWidth:80,flexShrink:0 }}>
                <div style={{ fontSize:'0.68rem',color:COLORS[post.section]||'#888',marginBottom:4 }}>{LABELS[post.section]||post.section}</div>
                <div style={{ fontFamily:'Syne',fontWeight:800,fontSize:'2.5rem',color:parseFloat(post.score)>=7?'var(--green)':parseFloat(post.score)>=6?'var(--accent)':'var(--red)',lineHeight:1 }}>{post.score}</div>
                <div style={{ fontSize:'0.65rem',color:'var(--muted)' }}>Band</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                  <span style={{ fontFamily:'Syne',fontSize:'1rem',color:COLORS[post.section]||'#888' }}>{LABELS[post.section]||post.section}</span>
                  <span style={{ fontSize:'0.75rem',color:'var(--muted)' }}>{post.date}</span>
                </div>
                {post.note&&<p style={{ color:'var(--muted)',fontSize:'0.88rem',lineHeight:1.6,marginBottom:post.imgUrl?12:0 }}>{post.note}</p>}
                {post.imgUrl&&<img src={post.imgUrl} alt="result" onClick={()=>setLightbox(post.imgUrl)} style={{ maxWidth:'100%',maxHeight:200,borderRadius:10,cursor:'zoom-in',border:'1px solid var(--border)',objectFit:'cover' }} />}
              </div>
            </div>
            {isAdmin&&<button onClick={async()=>{if(window.confirm("O'chirilsinmi?"))await deleteDoc(doc(db,'story',post.id));}} style={{ position:'absolute',top:12,right:12,background:'none',border:'none',color:'var(--muted)',cursor:'pointer',opacity:.5 }}>🗑</button>}
          </div>
        ))}
      </div>
      {lightbox&&<div onClick={()=>setLightbox(null)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.93)',zIndex:400,display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out' }}><img src={lightbox} alt="full" style={{ maxWidth:'92vw',maxHeight:'90vh',borderRadius:12 }} /></div>}
    </div>
  );
}
