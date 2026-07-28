import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AuthPage from './components/AuthPage';
import VocabPage from './components/VocabPage';
import StoryPage from './components/StoryPage';
import TestPage from './components/TestPage';
import HomeworkPage from './components/HomeworkPage';
import ProfilePage from './components/ProfilePage';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';

const ADMIN_PASS = '5997165179';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('vocab');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            setUserProfile({ name: u.displayName || u.email?.split('@')[0] });
          }
        } catch { setUserRole('student'); setUserProfile({ name: u.displayName || '?' }); }
      } else {
        setUser(null); setUserRole(null); setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleLogout = () => { signOut(auth); setPage('vocab'); setMobileMenuOpen(false); };
  const handleAdminLogin = (pass) => {
    if (pass === ADMIN_PASS) { setIsAdmin(true); sessionStorage.setItem('mb_admin', pass); setShowAdminLogin(false); setShowAdminPanel(true); }
    else alert("❌ Parol noto'g'ri!");
  };

  const isTeacher = userRole === 'teacher';
  // Teacher faqat homework yuklaydi, qolgan hamma narsa faqat admin
  const effectiveAdmin = isAdmin; // Teacher endi admin emas
  const canUploadHomework = isTeacher || isAdmin;

  const NAV = [
    { id:'vocab', label:'📚', full:'Vocabulary' },
    { id:'listening', label:'🎧', full:'Listening' },
    { id:'reading', label:'📖', full:'Reading' },
    { id:'writing', label:'✍️', full:'Writing' },
    { id:'homework', label:'📝', full:'Homework' },
    { id:'profile', label:'👤', full:'Profil' },
  ];

  if (authLoading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily:'Syne', color:'var(--accent)', fontSize:'2rem', letterSpacing:'-1px' }}>IS<span style={{color:'var(--text)'}}>CO</span></div>
    </div>
  );

  if (!user) return <AuthPage />;

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <header style={{ background:'linear-gradient(135deg,#0b0d12,#111520)', borderBottom:'1px solid var(--border)', padding:'0 16px', position:'sticky', top:0, zIndex:100, display:'flex', alignItems:'center', justifyContent:'space-between', height:54, gap:8 }}>
        {/* Logo */}
        <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.2rem', color:'var(--accent)', flexShrink:0, letterSpacing:'-1px' }}>IS<span style={{color:'var(--text)'}}>CO</span></span>

        {/* Desktop nav */}
        <nav style={{ display:'flex', gap:2, overflowX:'auto', flex:1, justifyContent:'center' }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ background:page===n.id?'var(--surface2)':'none', border:'1px solid '+(page===n.id?'var(--border)':'transparent'), borderRadius:8, padding:'6px 10px', color:page===n.id?'var(--text)':'var(--muted)', fontSize:'0.78rem', cursor:'pointer', whiteSpace:'nowrap', transition:'all .15s' }}>
              {n.label} <span style={{ fontSize:'0.72rem' }}>{n.full}</span>
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
          {isTeacher && <span style={{ fontSize:'0.68rem', background:'#ec489922', border:'1px solid #ec489955', borderRadius:5, padding:'2px 6px', color:'#ec4899' }}>Teacher</span>}
          {isAdmin ? (
            <button onClick={() => setShowAdminPanel(true)} style={{ background:'#1a1e2b', border:'1px solid var(--accent)', borderRadius:7, padding:'5px 10px', color:'var(--accent)', fontSize:'0.75rem', cursor:'pointer' }}>⚙️</button>
          ) : (
            <button onClick={() => setShowAdminLogin(true)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:7, padding:'5px 8px', color:'var(--muted)', fontSize:'0.72rem', cursor:'pointer' }}>🔐</button>
          )}
          <button onClick={handleLogout} style={{ background:'#2e1a1a', border:'1px solid var(--red)44', borderRadius:7, padding:'5px 9px', color:'var(--red)', fontSize:'0.72rem', cursor:'pointer' }}>↩</button>
        </div>
      </header>

      <main style={{ flex:1 }}>
        {page==='vocab' && <VocabPage isAdmin={isAdmin} />}
        {page==='listening' && <TestPage type="listening" isTeacher={isAdmin} user={user} userProfile={userProfile} />}
        {page==='reading' && <TestPage type="reading" isTeacher={isAdmin} user={user} userProfile={userProfile} />}
        {page==='writing' && <StoryPage isAdmin={isAdmin} user={user} userProfile={userProfile} section="writing" />}
        {page==='homework' && <HomeworkPage isTeacher={canUploadHomework} user={user} userProfile={userProfile} />}
        {page==='profile' && <ProfilePage user={user} userProfile={userProfile} />}
      </main>

      {showAdminLogin && <AdminLogin onLogin={handleAdminLogin} onClose={() => setShowAdminLogin(false)} />}
      {showAdminPanel && isAdmin && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </div>
  );
}
