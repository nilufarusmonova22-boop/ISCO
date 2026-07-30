import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const TEACHER_CODE = 'AISHA2025';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [showTeacher, setShowTeacher] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const inp = (extra={}) => ({
    width:'100%', background:'#0a0c18', border:'1px solid #1e2235',
    borderRadius:10, padding:'12px 16px', color:'var(--text)',
    fontSize:'0.95rem', outline:'none', transition:'border-color .2s', ...extra
  });

  const handleLogin = async () => {
    if (!email||!pass) { setErr("Email va parolni kiriting!"); return; }
    setLoading(true); setErr('');
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch(e) { setErr(e.code==='auth/invalid-credential'?"Email yoki parol noto'g'ri!":e.message); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name||!email||!pass) { setErr("Barcha maydonlarni to'ldiring!"); return; }
    if (pass.length<6) { setErr("Parol kamida 6 ta belgi!"); return; }
    setLoading(true); setErr('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName:name });
      await setDoc(doc(db,'users',cred.user.uid), { name, role:'student', email, createdAt:serverTimestamp() });
    } catch(e) { setErr(e.code==='auth/email-already-in-use'?"Bu email allaqachon ro'yxatdan o'tgan!":e.message); }
    setLoading(false);
  };

  const handleTeacherLogin = async () => {
    if (teacherCode!==TEACHER_CODE) { setErr("Noto'g'ri maxfiy kod!"); return; }
    if (!pass||pass.length<6) { setErr("Parol kamida 6 ta belgi!"); return; }
    setLoading(true); setErr('');
    try {
      const tEmail = 'aisha.isco.teacher@gmail.com';
      try { await signInWithEmailAndPassword(auth, tEmail, pass); }
      catch(e) {
        if (e.code==='auth/invalid-credential'||e.code==='auth/user-not-found') {
          const cred = await createUserWithEmailAndPassword(auth, tEmail, pass);
          await updateProfile(cred.user, { displayName:'Aisha' });
          await setDoc(doc(db,'users',cred.user.uid), { name:'Aisha', role:'teacher', email:tEmail, createdAt:serverTimestamp() });
        } else throw e;
      }
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', overflow:'hidden' }}>
      {/* Left decorative panel */}
      <div style={{ flex:1, background:'linear-gradient(135deg,#0a0c1a 0%,#0f1030 50%,#0a1020 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:40, position:'relative', overflow:'hidden' }}>
        {/* BG circles */}
        {[['-10%','20%','500px','#6c63ff','0.04'],['-5%','60%','300px','#00d4aa','0.03'],['80%','10%','400px','#ff6b9d','0.03']].map(([l,t,s,c,o],i)=>(
          <div key={i} style={{ position:'absolute', left:l, top:t, width:s, height:s, borderRadius:'50%', background:c, opacity:o, filter:'blur(60px)' }}/>
        ))}
        <div style={{ position:'relative', zIndex:1, textAlign:'center' }}>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'5rem', letterSpacing:'-4px', lineHeight:0.9, marginBottom:20 }}>
            <div style={{ background:'linear-gradient(135deg,#6c63ff,#00d4aa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>IS</div>
            <div style={{ color:'white' }}>CO</div>
          </div>
          <p style={{ color:'#5a6080', fontSize:'0.9rem', maxWidth:260, lineHeight:1.7 }}>IELTS Learning Platform — O'rganish, Mashq qilish, Muvaffaqiyat</p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:28, flexWrap:'wrap' }}>
            {['🎧 Listening','📖 Reading','✍️ Writing','📚 Vocab'].map(s=>(
              <span key={s} style={{ fontSize:'0.75rem', background:'#ffffff08', border:'1px solid #ffffff11', borderRadius:20, padding:'5px 12px', color:'#5a6080' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width:'min(440px,100%)', background:'var(--surface)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 32px', borderLeft:'1px solid var(--border)' }}>
        {!showTeacher ? (
          <div style={{ width:'100%', animation:'fadeUp .4s ease' }}>
            <h2 style={{ fontFamily:'Syne', fontSize:'1.6rem', fontWeight:800, marginBottom:6 }}>Xush kelibsiz 👋</h2>
            <p style={{ color:'var(--muted)', fontSize:'0.85rem', marginBottom:28 }}>{mode==='login'?'Akkauntingizga kiring':"Yangi akkaunt yarating"}</p>

            <div style={{ display:'flex', background:'#0a0c18', border:'1px solid var(--border)', borderRadius:12, padding:4, marginBottom:24, gap:4 }}>
              {[['login','Kirish'],['register',"Ro'yxat"]].map(([id,label])=>(
                <button key={id} onClick={()=>{setMode(id);setErr('');}} style={{ flex:1, background:mode===id?'var(--accent)':'transparent', border:'none', borderRadius:8, padding:'9px', color:mode===id?'#fff':'var(--muted)', fontFamily:'Syne', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', transition:'all .2s' }}>{label}</button>
              ))}
            </div>

            {mode==='register' && (
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:'0.75rem', color:'var(--muted)', display:'block', marginBottom:6, letterSpacing:.5 }}>TO'LIQ ISM</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ism Familiya" style={inp()} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='#1e2235'}/>
              </div>
            )}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:'0.75rem', color:'var(--muted)', display:'block', marginBottom:6, letterSpacing:.5 }}>EMAIL</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@gmail.com" onKeyDown={e=>e.key==='Enter'&&(mode==='login'?handleLogin():handleRegister())} style={inp()} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='#1e2235'}/>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:'0.75rem', color:'var(--muted)', display:'block', marginBottom:6, letterSpacing:.5 }}>PAROL</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&(mode==='login'?handleLogin():handleRegister())} style={inp()} onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='#1e2235'}/>
            </div>

            {err && <div style={{ background:'#ff5c7d11', border:'1px solid #ff5c7d44', borderRadius:10, padding:'10px 14px', color:'var(--red)', fontSize:'0.83rem', marginBottom:16 }}>{err}</div>}

            <button onClick={mode==='login'?handleLogin:handleRegister} disabled={loading} style={{ width:'100%', background:'linear-gradient(135deg,var(--accent),#8b5cf6)', border:'none', borderRadius:12, padding:'14px', color:'#fff', fontFamily:'Syne', fontWeight:800, fontSize:'1rem', cursor:'pointer', opacity:loading?0.7:1, marginBottom:18, boxShadow:'0 4px 20px #6c63ff44', transition:'all .2s' }}>
              {loading?'Yuklanmoqda...':(mode==='login'?'→ Kirish':"→ Ro'yxatdan o'tish")}
            </button>

            <div style={{ textAlign:'center', borderTop:'1px solid var(--border)', paddingTop:16 }}>
              <button onClick={()=>{setShowTeacher(true);setErr('');setPass('');}} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:'0.8rem', cursor:'pointer' }}>
                👩‍🏫 Teacher sifatida kirish
              </button>
            </div>
          </div>
        ) : (
          <div style={{ width:'100%', animation:'fadeUp .4s ease' }}>
            <button onClick={()=>{setShowTeacher(false);setErr('');setTeacherCode('');setPass('');}} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', marginBottom:24, display:'flex', alignItems:'center', gap:6, fontSize:'0.85rem' }}>← Orqaga</button>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg,#ec4899,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:'1.5rem' }}>👩‍🏫</div>
              <h2 style={{ fontFamily:'Syne', fontSize:'1.4rem', fontWeight:800 }}>Teacher — Aisha</h2>
              <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginTop:4 }}>Maxfiy kod va parol bilan kiring</p>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:'0.75rem', color:'var(--muted)', display:'block', marginBottom:6, letterSpacing:.5 }}>MAXFIY KOD</label>
              <input type="password" value={teacherCode} onChange={e=>setTeacherCode(e.target.value)} placeholder="Maxfiy kod..." style={inp({'borderColor':'#ec489933'})} onFocus={e=>e.target.style.borderColor='#ec4899'} onBlur={e=>e.target.style.borderColor='#ec489933'}/>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:'0.75rem', color:'var(--muted)', display:'block', marginBottom:6, letterSpacing:.5 }}>PAROL</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&handleTeacherLogin()} style={inp({'borderColor':'#ec489933'})} onFocus={e=>e.target.style.borderColor='#ec4899'} onBlur={e=>e.target.style.borderColor='#ec489933'}/>
            </div>
            {err && <div style={{ background:'#ff5c7d11', border:'1px solid #ff5c7d44', borderRadius:10, padding:'10px 14px', color:'var(--red)', fontSize:'0.83rem', marginBottom:16 }}>{err}</div>}
            <button onClick={handleTeacherLogin} disabled={loading} style={{ width:'100%', background:'linear-gradient(135deg,#ec4899,#8b5cf6)', border:'none', borderRadius:12, padding:'14px', color:'#fff', fontFamily:'Syne', fontWeight:800, fontSize:'1rem', cursor:'pointer', opacity:loading?0.7:1, boxShadow:'0 4px 20px #ec489944' }}>
              {loading?'Yuklanmoqda...':'→ Kirish'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
