import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const TEACHER_LOGIN = 'AISHA';
const TEACHER_PASS = '987654';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleTeacherLogin = async () => {
    setLoading(true); setErr('');
    try {
      const teacherEmail = 'aisha.teacher@isco.app';
      try {
        await signInWithEmailAndPassword(auth, teacherEmail, TEACHER_PASS);
      } catch {
        // First time: create teacher account
        const cred = await createUserWithEmailAndPassword(auth, teacherEmail, TEACHER_PASS);
        await updateProfile(cred.user, { displayName: 'Aisha' });
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: 'Aisha', role: 'teacher', email: teacherEmail, createdAt: serverTimestamp()
        });
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !pass) { setErr("Email va parolni kiriting!"); return; }
    setLoading(true); setErr('');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      setErr(e.code === 'auth/invalid-credential' ? "Email yoki parol noto'g'ri!" : e.message);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name || !email || !pass) { setErr("Barcha maydonlarni to'ldiring!"); return; }
    if (pass.length < 6) { setErr("Parol kamida 6 ta belgi bo'lsin!"); return; }
    setLoading(true); setErr('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, 'users', cred.user.uid), {
        name, role: 'student', email, createdAt: serverTimestamp()
      });
    } catch (e) {
      setErr(e.code === 'auth/email-already-in-use' ? 'Bu email allaqachon ro\'yxatdan o\'tgan!' : e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:20 }}>
      {/* Logo */}
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'3rem', color:'var(--accent)', letterSpacing:'-2px', lineHeight:1 }}>
          IS<span style={{ color:'var(--text)' }}>CO</span>
        </div>
        <div style={{ color:'var(--muted)', fontSize:'0.85rem', marginTop:6 }}>IELTS Learning Platform</div>
      </div>

      {/* Card */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:20, padding:'32px 28px', width:'min(420px,100%)', boxShadow:'0 20px 60px rgba(0,0,0,.4)' }} className="fadeIn">
        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:28 }}>
          {[['login','Kirish'],['register',"Ro'yxatdan o'tish"]].map(([id,label])=>(
            <button key={id} onClick={()=>{setMode(id);setErr('');}} style={{ flex:1, background:mode===id?'var(--accent)':'var(--surface2)', border:'1px solid '+(mode===id?'var(--accent)':'var(--border)'), borderRadius:10, padding:'10px', color:mode===id?'#000':'var(--muted)', fontFamily:'Syne', fontWeight:700, fontSize:'0.88rem', cursor:'pointer' }}>{label}</button>
          ))}
        </div>

        {mode==='register' && (
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Ismingiz</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ismi Familiya"
              style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'11px 14px', color:'var(--text)', fontSize:'0.95rem', outline:'none' }} />
          </div>
        )}

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@gmail.com"
            onKeyDown={e=>e.key==='Enter'&&(mode==='login'?handleLogin():handleRegister())}
            style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'11px 14px', color:'var(--text)', fontSize:'0.95rem', outline:'none' }} />
        </div>

        <div style={{ marginBottom:22 }}>
          <label style={{ fontSize:'0.78rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Parol</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder={mode==='register'?'Kamida 6 ta belgi':'Parol'}
            onKeyDown={e=>e.key==='Enter'&&(mode==='login'?handleLogin():handleRegister())}
            style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, padding:'11px 14px', color:'var(--text)', fontSize:'0.95rem', outline:'none' }} />
        </div>

        {err && <div style={{ background:'#2e1a1a', border:'1px solid var(--red)55', borderRadius:9, padding:'10px 14px', color:'var(--red)', fontSize:'0.83rem', marginBottom:16 }}>{err}</div>}

        <button onClick={mode==='login'?handleLogin:handleRegister} disabled={loading}
          style={{ width:'100%', background:'var(--accent)', border:'none', borderRadius:12, padding:'13px', color:'#000', fontFamily:'Syne', fontWeight:800, fontSize:'1rem', cursor:'pointer', opacity:loading?0.7:1, marginBottom:14 }}>
          {loading ? 'Yuklanmoqda...' : mode==='login' ? '→ Kirish' : '→ Ro\'yxatdan o\'tish'}
        </button>

        {/* Teacher login */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:16, textAlign:'center' }}>
          <p style={{ color:'var(--muted)', fontSize:'0.75rem', marginBottom:10 }}>Teacher sifatida kirish</p>
          <button onClick={handleTeacherLogin} disabled={loading} style={{ background:'#1a1030', border:'1px solid #ec489966', borderRadius:10, padding:'10px 24px', color:'#ec4899', fontFamily:'Syne', fontWeight:700, fontSize:'0.85rem', cursor:'pointer' }}>
            👩‍🏫 AISHA — Teacher
          </button>
        </div>
      </div>
    </div>
  );
}
