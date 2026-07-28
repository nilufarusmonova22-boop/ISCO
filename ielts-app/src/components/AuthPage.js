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

  const inp = (extra={}) => ({ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'11px 14px', color:'var(--text)', fontSize:'0.95rem', outline:'none', ...extra });

  const handleLogin = async () => {
    if (!email || !pass) { setErr("Email va parolni kiriting!"); return; }
    setLoading(true); setErr('');
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch (e) { setErr(e.code==='auth/invalid-credential'?"Email yoki parol noto'g'ri!":e.message); }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name||!email||!pass) { setErr("Barcha maydonlarni to'ldiring!"); return; }
    if (pass.length<6) { setErr("Parol kamida 6 ta belgi!"); return; }
    setLoading(true); setErr('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db,'users',cred.user.uid), { name, role:'student', email, createdAt:serverTimestamp() });
    } catch (e) { setErr(e.code==='auth/email-already-in-use'?"Bu email allaqachon ro'yxatdan o'tgan!":e.message); }
    setLoading(false);
  };

  const handleTeacherLogin = async () => {
    if (teacherCode !== TEACHER_CODE) { setErr("Noto'g'ri maxfiy kod!"); return; }
    if (!pass||pass.length<6) { setErr("Parol kamida 6 ta belgi!"); return; }
    setLoading(true); setErr('');
    try {
      const teacherEmail = 'aisha.isco.teacher@gmail.com';
      try { await signInWithEmailAndPassword(auth, teacherEmail, pass); }
      catch (e) {
        if (e.code==='auth/invalid-credential'||e.code==='auth/user-not-found') {
          const cred = await createUserWithEmailAndPassword(auth, teacherEmail, pass);
          await updateProfile(cred.user, { displayName:'Aisha' });
          await setDoc(doc(db,'users',cred.user.uid), { name:'Aisha', role:'teacher', email:teacherEmail, createdAt:serverTimestamp() });
        } else throw e;
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'3.5rem', color:'var(--accent)', letterSpacing:'-3px', lineHeight:1 }}>IS<span style={{ color:'var(--text)' }}>CO</span></div>
        <div style={{ color:'var(--muted)', fontSize:'0.85rem', marginTop:8 }}>IELTS Learning Platform</div>
      </div>

      {!showTeacher ? (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'32px 28px', width:'min(420px,100%)', boxShadow:'0 20px 60px rgba(0,0,0,.4)' }} className="fadeIn">
          <div style={{ display:'flex', gap:8, marginBottom:26 }}>
            {[['login','Kirish'],['register',"Ro'yxatdan o'tish"]].map(([id,label])=>(
              <button key={id} onClick={()=>{setMode(id);setErr('');}} style={{ flex:1, background:mode===id?'var(--accent)':'var(--surface2)', border:'1px solid '+(mode===id?'var(--accent)':'var(--border)'), borderRadius:10, padding:'10px', color:mode===id?'#000':'var(--muted)', fontFamily:'Syne', fontWeight:700, fontSize:'0.9rem', cursor:'pointer' }}>{label}</button>
            ))}
          </div>
          {mode==='register' && <div style={{ marginBottom:14 }}><label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>To'liq ismingiz</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ism Familiya" style={inp()} /></div>}
          <div style={{ marginBottom:14 }}><label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@gmail.com" onKeyDown={e=>e.key==='Enter'&&(mode==='login'?handleLogin():handleRegister())} style={inp()} /></div>
          <div style={{ marginBottom:20 }}><label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Parol</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••" onKeyDown={e=>e.key==='Enter'&&(mode==='login'?handleLogin():handleRegister())} style={inp()} /></div>
          {err && <div style={{ background:'#2e1a1a', border:'1px solid #f8717155', borderRadius:9, padding:'10px 14px', color:'var(--red)', fontSize:'0.83rem', marginBottom:14 }}>{err}</div>}
          <button onClick={mode==='login'?handleLogin:handleRegister} disabled={loading} style={{ width:'100%', background:'var(--accent)', border:'none', borderRadius:12, padding:'13px', color:'#000', fontFamily:'Syne', fontWeight:800, fontSize:'1rem', cursor:'pointer', opacity:loading?0.7:1, marginBottom:16 }}>
            {loading?'Yuklanmoqda...':(mode==='login'?'→ Kirish':"→ Ro'yxatdan o'tish")}
          </button>
          <div style={{ textAlign:'center' }}>
            <button onClick={()=>{setShowTeacher(true);setErr('');setPass('');}} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:'0.78rem', cursor:'pointer', textDecoration:'underline' }}>👩‍🏫 Teacher sifatida kirish</button>
          </div>
        </div>
      ) : (
        <div style={{ background:'var(--surface)', border:'1px solid #ec489955', borderRadius:20, padding:'32px 28px', width:'min(420px,100%)', boxShadow:'0 20px 60px rgba(0,0,0,.4)' }} className="fadeIn">
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:'2.5rem', marginBottom:8 }}>👩‍🏫</div>
            <h2 style={{ fontFamily:'Syne', fontSize:'1.3rem', color:'#ec4899' }}>Teacher — Aisha</h2>
            <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginTop:4 }}>Maxfiy kod va parol bilan kiring</p>
          </div>
          <div style={{ marginBottom:14 }}><label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Maxfiy kod</label><input type="password" value={teacherCode} onChange={e=>setTeacherCode(e.target.value)} placeholder="Maxfiy kod..." style={inp({'borderColor':'#ec489955'})} /></div>
          <div style={{ marginBottom:20 }}><label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Parol (kamida 6 ta belgi)</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••" onKeyDown={e=>e.key==='Enter'&&handleTeacherLogin()} style={inp({'borderColor':'#ec489955'})} /></div>
          {err && <div style={{ background:'#2e1a1a', border:'1px solid #f8717155', borderRadius:9, padding:'10px 14px', color:'var(--red)', fontSize:'0.83rem', marginBottom:14 }}>{err}</div>}
          <button onClick={handleTeacherLogin} disabled={loading} style={{ width:'100%', background:'#ec4899', border:'none', borderRadius:12, padding:'13px', color:'#fff', fontFamily:'Syne', fontWeight:800, fontSize:'1rem', cursor:'pointer', opacity:loading?0.7:1, marginBottom:12 }}>
            {loading?'Yuklanmoqda...':'→ Kirish'}
          </button>
          <button onClick={()=>{setShowTeacher(false);setErr('');setTeacherCode('');setPass('');}} style={{ width:'100%', background:'none', border:'1px solid var(--border)', borderRadius:10, padding:'10px', color:'var(--muted)', fontSize:'0.88rem', cursor:'pointer' }}>← Orqaga</button>
        </div>
      )}
    </div>
  );
}
