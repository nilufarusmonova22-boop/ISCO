import React, { useState } from 'react';

export default function AdminLogin({ onLogin, onClose }) {
  const [pass, setPass] = useState('');
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:16,padding:'36px 32px',width:'min(380px,92vw)',textAlign:'center' }} className="fadeIn">
        <div style={{ fontSize:'2.5rem',marginBottom:12 }}>🔐</div>
        <h2 style={{ fontFamily:'Syne',fontSize:'1.3rem',marginBottom:6 }}>Admin Kirish</h2>
        <p style={{ color:'var(--muted)',fontSize:'0.83rem',marginBottom:24 }}>Parolni kiriting</p>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&onLogin(pass)}
          placeholder="Parol..." autoFocus
          style={{ width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'10px 16px',color:'var(--text)',fontSize:'1rem',marginBottom:16,outline:'none' }} />
        <div style={{ display:'flex',gap:10 }}>
          <button onClick={()=>onLogin(pass)} style={{ flex:1,background:'var(--accent)',border:'none',borderRadius:10,padding:'11px',color:'#000',fontFamily:'Syne',fontWeight:700,fontSize:'0.95rem',cursor:'pointer' }}>Kirish</button>
          <button onClick={onClose} style={{ flex:1,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'11px',color:'var(--muted)',fontSize:'0.9rem',cursor:'pointer' }}>Bekor</button>
        </div>
      </div>
    </div>
  );
}
