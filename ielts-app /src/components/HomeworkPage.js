import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function HomeworkPage({ isTeacher, user, userProfile }) {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  // upload form
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [viewImg, setViewImg] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'homework'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setHomeworks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('uz-UZ', { day:'numeric', month:'long', year:'numeric' });
  };
  const isToday = (dateStr) => dateStr === today();
  const isNew = (dateStr) => {
    if (!dateStr) return false;
    const hw = new Date(dateStr);
    const now = new Date();
    const diff = (now - hw) / (1000*60*60*24);
    return diff <= 3;
  };

  const upload = async () => {
    if (!title) { setMsg('❌ Sarlavha kiriting!'); return; }
    setUploading(true); setMsg('');
    try {
      let fileData = null, fileName = null, fileType = null;
      if (file) {
        if (file.size > 800000) { setMsg('❌ Fayl 800KB dan kichik bo\'lsin!'); setUploading(false); return; }
        fileData = await new Promise((res, rej) => {
          const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej;
          r.readAsDataURL(file);
        });
        fileName = file.name;
        fileType = file.type;
      }
      await addDoc(collection(db, 'homework'), {
        title, text, fileData, fileName, fileType,
        date: today(),
        teacherName: userProfile?.name || 'Teacher',
        createdAt: serverTimestamp()
      });
      setMsg('✅ Homework yuklandi!');
      setTitle(''); setText(''); setFile(null); setShowForm(false);
    } catch (e) { setMsg('❌ ' + e.message); }
    setUploading(false);
  };

  const deleteHw = async (id) => {
    if (!window.confirm("O'chirilsinmi?")) return;
    await deleteDoc(doc(db, 'homework', id));
  };

  const todayHw = homeworks.filter(h => isToday(h.date));
  const olderHw = homeworks.filter(h => !isToday(h.date));

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 20px' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0f1a1f,#162028)', border:'1px solid #3b82f633', borderRadius:18, padding:'26px 24px', marginBottom:28, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-10, fontSize:90, opacity:0.05 }}>📝</div>
        <div style={{ fontFamily:'Syne', fontSize:'0.75rem', color:'#3b82f6', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>Daily Tasks</div>
        <h1 style={{ fontFamily:'Syne', fontSize:'1.8rem', fontWeight:800, marginBottom:6 }}>📝 <span style={{ color:'#3b82f6' }}>Homework</span></h1>
        <p style={{ color:'var(--muted)', fontSize:'0.85rem' }}>Bugungi vazifalar va eski homework'lar</p>
        {isTeacher && (
          <button onClick={() => setShowForm(f => !f)} style={{ marginTop:16, background:'#3b82f6', border:'none', borderRadius:10, padding:'10px 22px', color:'#fff', fontFamily:'Syne', fontWeight:700, cursor:'pointer', fontSize:'0.9rem' }}>
            {showForm ? '✕ Yopish' : '+ Homework yuklash'}
          </button>
        )}
      </div>

      {/* Upload form (teacher only) */}
      {isTeacher && showForm && (
        <div style={{ background:'var(--surface)', border:'1px solid #3b82f655', borderRadius:16, padding:'24px', marginBottom:24 }} className="fadeIn">
          <h3 style={{ fontFamily:'Syne', fontSize:'1rem', marginBottom:16, color:'#3b82f6' }}>📤 Yangi Homework</h3>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Sarlavha *</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Bugungi vazifa..."
              style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:9, padding:'10px 13px', color:'var(--text)', fontSize:'0.9rem', outline:'none' }} />
          </div>
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Matn (ixtiyoriy)</label>
            <textarea value={text} onChange={e=>setText(e.target.value)} rows={4} placeholder="Homework tavsifi, ko'rsatmalar..."
              style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:9, padding:'10px 13px', color:'var(--text)', fontSize:'0.88rem', resize:'vertical', outline:'none', fontFamily:'DM Sans', lineHeight:1.6 }} />
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Fayl (rasm yoki PDF, max 800KB)</label>
            <input type="file" accept="image/*,.pdf" onChange={e=>setFile(e.target.files[0])}
              style={{ background:'var(--surface2)', border:'1px solid #3b82f655', borderRadius:9, padding:'8px 12px', color:'var(--text)', fontSize:'0.85rem', width:'100%' }} />
            {file && <p style={{ fontSize:'0.75rem', color:'var(--accent2)', marginTop:4 }}>📎 {file.name} — {(file.size/1024).toFixed(0)}KB</p>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={upload} disabled={uploading} style={{ background:'#3b82f6', border:'none', borderRadius:10, padding:'10px 24px', color:'#fff', fontFamily:'Syne', fontWeight:700, cursor:'pointer', opacity:uploading?0.6:1 }}>
              {uploading ? 'Yuklanmoqda...' : '⬆️ Yuklash'}
            </button>
            {msg && <span style={{ fontSize:'0.85rem', color:msg.startsWith('✅')?'var(--green)':'var(--red)' }}>{msg}</span>}
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>⏳ Yuklanmoqda...</div>}

      {/* TODAY */}
      {todayHw.length > 0 && (
        <div style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.1rem' }}>🔥 Bugungi Homework</div>
            <span style={{ background:'#3b82f622', border:'1px solid #3b82f655', borderRadius:6, padding:'2px 8px', color:'#3b82f6', fontSize:'0.72rem', fontFamily:'Syne', fontWeight:700 }}>BUGUN</span>
          </div>
          <div style={{ display:'grid', gap:12 }}>
            {todayHw.map(hw => <HwCard key={hw.id} hw={hw} isTeacher={isTeacher} onDelete={deleteHw} onViewImg={setViewImg} formatDate={formatDate} today />)}
          </div>
        </div>
      )}

      {/* OLDER */}
      {olderHw.length > 0 && (
        <div>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1rem', marginBottom:14, color:'var(--muted)' }}>📁 Oldingi Homeworklar</div>
          <div style={{ display:'grid', gap:10 }}>
            {olderHw.map(hw => <HwCard key={hw.id} hw={hw} isTeacher={isTeacher} onDelete={deleteHw} onViewImg={setViewImg} formatDate={formatDate} isNew={isNew(hw.date)} />)}
          </div>
        </div>
      )}

      {!loading && homeworks.length === 0 && (
        <div style={{ textAlign:'center', padding:60, color:'var(--muted)', background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
          <div>Hali homework yuklanmagan</div>
          {isTeacher && <div style={{ marginTop:8, fontSize:'0.83rem', color:'#3b82f6' }}>Yuqoridagi "+ Homework yuklash" tugmasini bosing</div>}
        </div>
      )}

      {/* Image lightbox */}
      {viewImg && (
        <div onClick={() => setViewImg(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.93)', zIndex:400, display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out' }}>
          <img src={viewImg} alt="" style={{ maxWidth:'94vw', maxHeight:'92vh', borderRadius:12 }} />
        </div>
      )}
    </div>
  );
}

function HwCard({ hw, isTeacher, onDelete, onViewImg, formatDate, today, isNew: newBadge }) {
  const isPdf = hw.fileType === 'application/pdf';
  return (
    <div style={{ background:'var(--surface)', border:'1px solid '+(today?'#3b82f655':'var(--border)'), borderRadius:14, padding:'18px 20px', position:'relative' }} className="fadeIn">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
            {today && <span style={{ background:'#3b82f622', border:'1px solid #3b82f655', borderRadius:5, padding:'2px 7px', color:'#3b82f6', fontSize:'0.7rem', fontFamily:'Syne', fontWeight:700 }}>BUGUN</span>}
            {newBadge && <span style={{ background:'#f59e0b22', border:'1px solid #f59e0b55', borderRadius:5, padding:'2px 7px', color:'#f59e0b', fontSize:'0.7rem', fontFamily:'Syne', fontWeight:700 }}>YANGI</span>}
            <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{formatDate(hw.date)} · {hw.teacherName}</span>
          </div>
          <div style={{ fontFamily:'Syne', fontSize:'1.05rem', fontWeight:700, marginBottom:hw.text?8:0 }}>{hw.title}</div>
          {hw.text && <p style={{ color:'var(--muted)', fontSize:'0.87rem', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{hw.text}</p>}
          {hw.fileData && (
            <div style={{ marginTop:12 }}>
              {isPdf ? (
                <a href={hw.fileData} download={hw.fileName} style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#1a1e2b', border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px', color:'var(--accent2)', textDecoration:'none', fontSize:'0.83rem' }}>
                  📄 {hw.fileName} — Yuklab olish
                </a>
              ) : (
                <img src={hw.fileData} alt={hw.title} onClick={() => onViewImg(hw.fileData)}
                  style={{ maxWidth:'100%', maxHeight:220, borderRadius:10, cursor:'zoom-in', border:'1px solid var(--border)', objectFit:'cover' }} />
              )}
            </div>
          )}
        </div>
        {isTeacher && (
          <button onClick={() => onDelete(hw.id)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', opacity:.5, fontSize:'1rem', flexShrink:0 }}>🗑</button>
        )}
      </div>
    </div>
  );
}
