import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AuthPage from './components/AuthPage';
import VocabPage from './components/VocabPage';
import StoryPage from './components/StoryPage';
import ListeningPage from './components/ListeningPage';
import HomeworkPage from './components/HomeworkPage';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';

const ADMIN_PASS = '5997165179';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'student' | 'teacher' | 'admin'
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('vocab');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('mb_admin') === ADMIN_PASS) setIsAdmin(true);
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUserRole(data.role || 'student');
            setUserProfile(data);
          } else {
            setUserRole('student');
            setUserProfile({ name: u.displayName || u.email });
          }
        } catch { setUserRole('student'); }
      } else {
        setUser(null); setUserRole(null); setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleLogout = () => { signOut(auth); setPage('vocab'); };
  const handleAdminLogin = (pass) => {
    if (pass === ADMIN_PASS) { setIsAdmin(true); sessionStorage.setItem('mb_admin', pass); setShowAdminLogin(false); setShowAdminPanel(true); }
    else alert("❌ Parol noto'g'ri!");
  };
  const handleAdminLogout = () => { setIsAdmin(false); sessionStorage.removeItem('mb_admin'); setShowAdminPanel(false); };

  const isTeacher = userRole === 'teacher';
  const effectiveAdmin = isAdmin || isTeacher;

  const NAV = [
    { id: 'vocab', label: '📚 Vocab' },
    { id: 'listening', label: '🎧 Listening' },
    { id: 'homework', label: '📝 Homework' },
    { id: 'story', label: '🏆 My Story' },
  ];

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'Syne', color:'var(--accent)', fontSize:'1.5rem' }}>ISCO...</div>
    </div>
  );

  if (!user) return <AuthPage />;

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <header style={{ background:'linear-gradient(135deg,#0b0d12,#111520)', borderBottom:'1px solid var(--border)', padding:'0 16px', position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', height:56, gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, minWidth:0 }}>
          <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.2rem', color:'var(--accent)', flexShrink:0 }}>
            IS<span style={{ color:'var(--text)' }}>CO</span>
          </span>
          <nav style={{ display:'flex', gap:2, overflowX:'auto' }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{ background:page===n.id?'var(--surface2)':'none', border:'1px solid '+(page===n.id?'var(--border)':'transparent'), borderRadius:7, padding:'5px 10px', color:page===n.id?'var(--text)':'var(--muted)', fontSize:'0.78rem', cursor:'pointer', whiteSpace:'nowrap' }}>{n.label}</button>
            ))}
          </nav>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
          {(isTeacher||userRole==='teacher') && <span style={{ fontSize:'0.7rem', background:'#ec489922', border:'1px solid #ec489955', borderRadius:6, padding:'2px 8px', color:'#ec4899' }}>👩‍🏫 Teacher</span>}
          <span style={{ fontSize:'0.72rem', color:'var(--muted)', maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userProfile?.name || user.email}</span>
          {isAdmin ? (
            <>
              <button onClick={() => setShowAdminPanel(true)} style={{ background:'#1a1e2b', border:'1px solid var(--accent)', borderRadius:7, padding:'5px 10px', color:'var(--accent)', fontSize:'0.75rem', cursor:'pointer' }}>⚙️</button>
              <button onClick={handleAdminLogout} style={{ background:'none', border:'1px solid var(--border)', borderRadius:7, padding:'5px 8px', color:'var(--muted)', fontSize:'0.72rem', cursor:'pointer' }}>✕</button>
            </>
          ) : (
            <button onClick={() => setShowAdminLogin(true)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:7, padding:'5px 8px', color:'var(--muted)', fontSize:'0.72rem', cursor:'pointer' }}>🔐</button>
          )}
          <button onClick={handleLogout} style={{ background:'#2e1a1a', border:'1px solid var(--red)44', borderRadius:7, padding:'5px 10px', color:'var(--red)', fontSize:'0.72rem', cursor:'pointer' }}>Chiqish</button>
        </div>
      </header>

      <main style={{ flex:1 }}>
        {page==='vocab' && <VocabPage isAdmin={effectiveAdmin} />}
        {page==='listening' && <ListeningPage isAdmin={effectiveAdmin} user={user} userProfile={userProfile} />}
        {page==='homework' && <HomeworkPage isTeacher={isTeacher||effectiveAdmin} user={user} userProfile={userProfile} />}
        {page==='story' && <StoryPage isAdmin={effectiveAdmin} />}
      </main>

      {showAdminLogin && <AdminLogin onLogin={handleAdminLogin} onClose={() => setShowAdminLogin(false)} />}
      {showAdminPanel && isAdmin && <AdminPanel onClose={() => setShowAdminPanel(false)} isTeacher={false} />}
    </div>
  );
}
