import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import VocabPage from './components/VocabPage';
import StoryPage from './components/StoryPage';
import WritingPage from './components/WritingPage';
import TestPage from './components/TestPage';
import HomeworkPage from './components/HomeworkPage';
import ProfilePage from './components/ProfilePage';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';

const ADMIN_PASS = '5997165179';

const PAGES = [
  { id:'home', icon:'⬡', label:'Home' },
  { id:'listening', icon:'🎧', label:'Listening' },
  { id:'reading', icon:'📖', label:'Reading' },
  { id:'writing', icon:'✍️', label:'Writing' },
  { id:'vocab', icon:'📚', label:'Vocabulary' },
  { id:'homework', icon:'📝', label:'Homework' },
  { id:'profile', icon:'◉', label:'Profile' },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

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
            setUserProfile({ name: u.displayName || u.email?.split('@')[0] || 'User' });
          }
        } catch {
          setUserRole('student');
          setUserProfile({ name: u.displayName || 'User' });
        }
      } else {
        setUser(null); setUserRole(null); setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const handleLogout = () => { signOut(auth); setPage('home'); };
  const handleAdminLogin = (pass) => {
    if (pass === ADMIN_PASS) {
      setIsAdmin(true); sessionStorage.setItem('mb_admin', pass);
      setShowAdminLogin(false); setShowAdminPanel(true);
    } else alert("❌ Parol noto'g'ri!");
  };

  const isTeacher = userRole === 'teacher';
  const canUploadHomework = isTeacher || isAdmin;

  const navigate = (p) => { setPage(p); setSideOpen(false); };

  if (authLoading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'3rem', letterSpacing:'-2px', animation:'pulse 1.5s ease infinite' }}>
        <span style={{ color:'var(--accent)' }}>IS</span><span style={{ color:'var(--text)' }}>CO</span>
      </div>
      <div style={{ width:40, height:2, background:`linear-gradient(90deg, var(--accent), var(--accent2))`, borderRadius:2, animation:'glow 1.5s ease infinite' }}/>
    </div>
  );

  if (!user) return <AuthPage />;

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg)' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: sideOpen ? 220 : 64, flexShrink:0,
        background:'var(--surface)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', alignItems:'center',
        padding:'16px 0', transition:'width .3s ease', overflow:'hidden',
        position:'sticky', top:0, height:'100vh', zIndex:50,
      }}>
        {/* Logo */}
        <div style={{ marginBottom:32, padding:'0 12px', width:'100%', display:'flex', alignItems:'center', justifyContent: sideOpen?'space-between':'center' }}>
          <div onClick={()=>navigate('home')} style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.3rem', cursor:'pointer', letterSpacing:'-1px', whiteSpace:'nowrap' }}>
            <span style={{ color:'var(--accent)' }}>IS</span><span style={{ color:'var(--text)', display: sideOpen?'inline':'none' }}>CO</span>
          </div>
          <button onClick={()=>setSideOpen(s=>!s)} style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', fontSize:'1.1rem', padding:4, flexShrink:0 }}>
            {sideOpen ? '←' : '→'}
          </button>
        </div>

        {/* Nav items */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, width:'100%', padding:'0 8px' }}>
          {PAGES.map(p => {
            const active = page === p.id;
            return (
              <button key={p.id} onClick={()=>navigate(p.id)} style={{
                display:'flex', alignItems:'center', gap:12,
                padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer',
                background: active ? 'linear-gradient(135deg, #6c63ff22, #00d4aa11)' : 'none',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                color: active ? 'var(--accent)' : 'var(--muted)',
                transition:'all .2s', whiteSpace:'nowrap', width:'100%', textAlign:'left',
              }}>
                <span style={{ fontSize:'1rem', flexShrink:0 }}>{p.icon}</span>
                {sideOpen && <span style={{ fontSize:'0.85rem', fontWeight: active?600:400 }}>{p.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Bottom */}
        <div style={{ padding:'0 8px', width:'100%', display:'flex', flexDirection:'column', gap:6 }}>
          {isAdmin ? (
            <button onClick={()=>setShowAdminPanel(true)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, border:'1px solid var(--accent)44', background:'var(--accent)11', color:'var(--accent)', cursor:'pointer', width:'100%', whiteSpace:'nowrap' }}>
              <span>⚙</span>{sideOpen && <span style={{ fontSize:'0.82rem' }}>Admin</span>}
            </button>
          ) : (
            <button onClick={()=>setShowAdminLogin(true)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, border:'1px solid var(--border)', background:'none', color:'var(--muted)', cursor:'pointer', width:'100%', whiteSpace:'nowrap' }}>
              <span style={{ fontSize:'0.85rem' }}>🔐</span>{sideOpen && <span style={{ fontSize:'0.8rem' }}>Login</span>}
            </button>
          )}
          <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', borderRadius:10, border:'1px solid var(--red)33', background:'none', color:'var(--red)', cursor:'pointer', width:'100%', whiteSpace:'nowrap' }}>
            <span style={{ fontSize:'0.9rem' }}>↩</span>{sideOpen && <span style={{ fontSize:'0.82rem' }}>Chiqish</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        {/* Top bar */}
        <div style={{ borderBottom:'1px solid var(--border)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface)', position:'sticky', top:0, zIndex:40 }}>
          <div>
            <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:'1rem' }}>{PAGES.find(p=>p.id===page)?.icon} {PAGES.find(p=>p.id===page)?.label}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {isTeacher && <span style={{ fontSize:'0.7rem', background:'#ec489922', border:'1px solid #ec489944', borderRadius:20, padding:'3px 10px', color:'#ec4899' }}>👩‍🏫 Teacher</span>}
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:20, padding:'5px 12px' }}>
              <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne', fontWeight:800, fontSize:'0.75rem', color:'#fff', flexShrink:0 }}>
                {(userProfile?.name||'?')[0].toUpperCase()}
              </div>
              <span style={{ fontSize:'0.8rem', color:'var(--text)' }}>{userProfile?.name || 'User'}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex:1, overflow:'auto' }}>
          {page==='home' && <Dashboard user={user} userProfile={userProfile} navigate={navigate} isAdmin={isAdmin} isTeacher={isTeacher} />}
          {page==='vocab' && <VocabPage isAdmin={isAdmin} />}
          {page==='listening' && <TestPage type="listening" isTeacher={isAdmin} user={user} userProfile={userProfile} />}
          {page==='reading' && <TestPage type="reading" isTeacher={isAdmin} user={user} userProfile={userProfile} />}
          {page==='writing' && <WritingPage isAdmin={isAdmin} user={user} userProfile={userProfile} />}
          {page==='homework' && <HomeworkPage isTeacher={canUploadHomework} user={user} userProfile={userProfile} />}
          {page==='profile' && <ProfilePage user={user} userProfile={userProfile} />}
        </div>
      </main>

      {showAdminLogin && <AdminLogin onLogin={handleAdminLogin} onClose={()=>setShowAdminLogin(false)} />}
      {showAdminPanel && isAdmin && <AdminPanel onClose={()=>setShowAdminPanel(false)} />}
    </div>
  );
}
