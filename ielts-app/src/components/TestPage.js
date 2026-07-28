import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Shared component for both Listening and Reading tests
export default function TestPage({ type, isTeacher, user, userProfile }) {
  const COLOR = type === 'listening' ? '#10b981' : '#3b82f6';
  const ICON = type === 'listening' ? '🎧' : '📖';
  const LABEL = type === 'listening' ? 'Listening' : 'Reading';
  const COLLECTION = type === 'listening' ? 'listening_tests' : 'reading_tests';
  const RESULTS_COL = type === 'listening' ? 'listening_results' : 'reading_results';

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState(null);
  const [userResults, setUserResults] = useState({});
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [COLLECTION]);

  // Load this user's results for all tests
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, RESULTS_COL));
    const unsub = onSnapshot(q, snap => {
      const res = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.userId === user.uid) res[data.testId] = data;
      });
      setUserResults(res);
    }, () => {});
    return unsub;
  }, [user, RESULTS_COL]);

  const saveResult = async (testId, score, answers) => {
    if (!user) return;
    const docId = `${user.uid}_${testId}`;
    await setDoc(doc(db, RESULTS_COL, docId), {
      userId: user.uid, testId, score, answers,
      userName: userProfile?.name || user.email,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const uploadTest = async () => {
    if (!uploadTitle || !uploadFile) { setUploadMsg('❌ Sarlavha va HTML fayl!'); return; }
    if (uploadFile.size > 900000) { setUploadMsg('❌ Fayl 900KB dan kichik bo\'lsin!'); return; }
    setUploading(true); setUploadMsg('');
    try {
      const htmlContent = await new Promise((res, rej) => {
        const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(uploadFile, 'UTF-8');
      });
      await doc(collection(db, COLLECTION));
      const { addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, COLLECTION), {
        title: uploadTitle, description: uploadDesc, date: uploadDate,
        htmlContent, fileName: uploadFile.name, createdAt: serverTimestamp()
      });
      setUploadMsg('✅ Test yuklandi!');
      setUploadTitle(''); setUploadDesc(''); setUploadDate(''); setUploadFile(null);
      setTimeout(() => setShowUpload(false), 1500);
    } catch (e) { setUploadMsg('❌ ' + e.message); }
    setUploading(false);
  };

  const deleteTest = async (id) => {
    if (!window.confirm("O'chirilsinmi?")) return;
    await deleteDoc(doc(db, COLLECTION, id));
    if (activeTest?.id === id) setActiveTest(null);
  };

  if (activeTest) {
    return (
      <ActiveTest
        test={activeTest}
        color={COLOR}
        icon={ICON}
        label={LABEL}
        user={user}
        userProfile={userProfile}
        savedResult={userResults[activeTest.id]}
        onSave={(score, answers) => saveResult(activeTest.id, score, answers)}
        onClose={() => setActiveTest(null)}
      />
    );
  }

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 20px' }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg,#0a1018,#111824)`, border:`1px solid ${COLOR}33`, borderRadius:18, padding:'26px 24px', marginBottom:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-10, fontSize:90, opacity:0.05 }}>{ICON}</div>
        <div style={{ fontFamily:'Syne', fontSize:'0.75rem', color:COLOR, letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>IELTS Academic</div>
        <h1 style={{ fontFamily:'Syne', fontSize:'1.8rem', fontWeight:800, marginBottom:4 }}>{ICON} <span style={{ color:COLOR }}>{LABEL}</span> Tests</h1>
        <p style={{ color:'var(--muted)', fontSize:'0.83rem' }}>4 section · Javoblar saqlanadi · Natijalar profilingizda</p>
        {isTeacher && (
          <button onClick={() => setShowUpload(s=>!s)} style={{ marginTop:14, background:COLOR, border:'none', borderRadius:9, padding:'9px 20px', color:'#000', fontFamily:'Syne', fontWeight:700, fontSize:'0.88rem', cursor:'pointer' }}>
            {showUpload ? '✕ Yopish' : `+ ${LABEL} Test yuklash`}
          </button>
        )}
      </div>

      {/* Upload form */}
      {isTeacher && showUpload && (
        <div style={{ background:'var(--surface)', border:`1px solid ${COLOR}55`, borderRadius:14, padding:'22px', marginBottom:20 }} className="fadeIn">
          <h3 style={{ fontFamily:'Syne', color:COLOR, marginBottom:14, fontSize:'0.95rem' }}>📤 Yangi {LABEL} Test</h3>
          {[['Sarlavha *', uploadTitle, setUploadTitle, 'text', `CDI ${LABEL} Test 1`],
            ['Tavsif', uploadDesc, setUploadDesc, 'text', 'Topic...'],
            ['Sana', uploadDate, setUploadDate, 'date', '']
          ].map(([label, val, setter, type, ph]) => (
            <div key={label} style={{ marginBottom:10 }}>
              <label style={{ fontSize:'0.76rem', color:'var(--muted)', display:'block', marginBottom:5 }}>{label}</label>
              <input type={type} value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
                style={{ width:'100%', background:'var(--surface2)', border:`1px solid ${COLOR}44`, borderRadius:8, padding:'9px 12px', color:'var(--text)', fontSize:'0.88rem', outline:'none' }} />
            </div>
          ))}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:'0.76rem', color:'var(--muted)', display:'block', marginBottom:5 }}>HTML fayl * (max 900KB)</label>
            <input type="file" accept=".html,.htm" onChange={e=>setUploadFile(e.target.files[0])}
              style={{ background:'var(--surface2)', border:`1px solid ${COLOR}44`, borderRadius:8, padding:'8px 11px', color:'var(--text)', fontSize:'0.83rem', width:'100%' }} />
            {uploadFile && <p style={{ fontSize:'0.73rem', color:'var(--accent2)', marginTop:4 }}>📄 {uploadFile.name} — {(uploadFile.size/1024).toFixed(0)}KB</p>}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={uploadTest} disabled={uploading||!uploadTitle||!uploadFile}
              style={{ background:COLOR, border:'none', borderRadius:9, padding:'9px 22px', color:'#000', fontFamily:'Syne', fontWeight:700, cursor:'pointer', opacity:(uploading||!uploadTitle||!uploadFile)?0.5:1 }}>
              {uploading ? 'Yuklanmoqda...' : '⬆️ Yuklash'}
            </button>
            {uploadMsg && <span style={{ fontSize:'0.83rem', color:uploadMsg.startsWith('✅')?'var(--green)':'var(--red)' }}>{uploadMsg}</span>}
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>⏳ Yuklanmoqda...</div>}
      {!loading && tests.length === 0 && (
        <div style={{ textAlign:'center', padding:50, color:'var(--muted)', background:'var(--surface)', borderRadius:14, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
          <div>Hali test yuklanmagan</div>
        </div>
      )}

      <div style={{ display:'grid', gap:12 }}>
        {tests.map((test, i) => {
          const result = userResults[test.id];
          return (
            <div key={test.id} style={{ background:'var(--surface)', border:`1px solid ${result?COLOR+'55':'var(--border)'}`, borderRadius:14, padding:'18px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, transition:'all .2s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=COLOR}
              onMouseLeave={e=>e.currentTarget.style.borderColor=result?COLOR+'55':'var(--border)'}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                  <span style={{ background:COLOR+'22', border:`1px solid ${COLOR}55`, borderRadius:5, padding:'2px 7px', color:COLOR, fontSize:'0.7rem', fontFamily:'Syne', fontWeight:700 }}>Test {tests.length - i}</span>
                  {test.date && <span style={{ fontSize:'0.7rem', color:'var(--muted)' }}>{test.date}</span>}
                  {result && <span style={{ background:'#4ade8022', border:'1px solid #4ade8055', borderRadius:5, padding:'2px 7px', color:'var(--green)', fontSize:'0.7rem', fontFamily:'Syne', fontWeight:700 }}>✓ {result.score}</span>}
                </div>
                <div style={{ fontFamily:'Syne', fontSize:'1rem', fontWeight:700 }}>{test.title}</div>
                {test.description && <div style={{ color:'var(--muted)', fontSize:'0.82rem', marginTop:2 }}>{test.description}</div>}
                {result && <div style={{ fontSize:'0.75rem', color:'var(--accent2)', marginTop:4 }}>📊 Oxirgi natija: <strong>{result.score}</strong></div>}
              </div>
              <div style={{ display:'flex', gap:8, flexShrink:0, flexDirection:'column', alignItems:'flex-end' }}>
                <button onClick={() => setActiveTest(test)} style={{ background:COLOR, border:'none', borderRadius:9, padding:'9px 18px', color:'#000', fontFamily:'Syne', fontWeight:700, fontSize:'0.85rem', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {result ? '🔄 Qayta' : '▶ Boshlash'}
                </button>
                {isTeacher && <button onClick={() => deleteTest(test.id)} style={{ background:'none', border:'1px solid #f8717155', borderRadius:8, padding:'5px 10px', color:'#f87171', cursor:'pointer', fontSize:'0.75rem' }}>🗑 O'chir</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActiveTest({ test, color, icon, label, user, userProfile, savedResult, onSave, onClose }) {
  const iframeRef = useRef(null);
  const [score, setScore] = useState(savedResult?.score || null);
  const [saved, setSaved] = useState(!!savedResult);

  useEffect(() => {
    const handler = async (e) => {
      if (e.data?.type === 'ISCO_TEST_RESULT') {
        const s = e.data.score;
        setScore(s);
        await onSave(s, e.data.answers || {});
        setSaved(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSave]);

  // Inject saved answers + result overlay into HTML
  const injectHTML = (html) => {
    const savedAnswersScript = savedResult ? `
<script>
window.addEventListener('DOMContentLoaded', function(){
  setTimeout(function(){
    try {
      var saved = ${JSON.stringify(savedResult.answers || {})};
      Object.keys(saved).forEach(function(id){
        var el = document.getElementById(id) || document.querySelector('[name="'+id+'"]');
        if(el){ if(el.type==='radio'||el.type==='checkbox'){el.checked=true;}else{el.value=saved[id];} }
      });
    } catch(e){}
  }, 800);
});
</script>` : '';

    const overlay = `
${savedAnswersScript}
<style>
#isco-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;align-items:center;justify-content:center;}
#isco-overlay.show{display:flex;}
#isco-box{background:#13161f;border:2px solid ${color};border-radius:16px;padding:28px 24px;width:min(500px,94vw);max-height:82vh;overflow-y:auto;text-align:center;}
#isco-box h2{font-family:sans-serif;color:${color};margin-bottom:6px;font-size:1.4rem;}
#isco-score{font-family:sans-serif;font-size:3rem;font-weight:800;color:#f0c040;margin:12px 0;}
#isco-details{text-align:left;margin-top:16px;}
.isco-row{display:flex;gap:10px;padding:5px 0;border-bottom:1px solid #252b3b;font-family:sans-serif;font-size:0.83rem;}
.isco-num{color:#6b7585;width:28px;flex-shrink:0;}
.isco-ans{flex:1;color:#e8eaf2;}
.isco-ok{color:#4ade80;}
.isco-no{color:#f87171;}
.isco-close{width:100%;margin-top:18px;background:${color};border:none;border-radius:10px;padding:11px;font-family:sans-serif;font-weight:700;font-size:0.95rem;cursor:pointer;color:#000;}
</style>
<div id="isco-overlay">
  <div id="isco-box">
    <h2>${icon} ${label} Natijasi</h2>
    <div id="isco-score">-</div>
    <p id="isco-sub" style="color:#6b7585;font-family:sans-serif;font-size:0.85rem;"></p>
    <div id="isco-details"></div>
    <button class="isco-close" onclick="document.getElementById('isco-overlay').classList.remove('show')">✕ Yopish</button>
  </div>
</div>
<script>
(function(){
  function showOverlay(scoreText, detailsHTML){
    document.getElementById('isco-score').textContent = scoreText;
    document.getElementById('isco-sub').textContent = 'Natijangiz saqlandi ✓';
    if(detailsHTML) document.getElementById('isco-details').innerHTML = detailsHTML;
    document.getElementById('isco-overlay').classList.add('show');
    try {
      window.parent.postMessage({ type:'ISCO_TEST_RESULT', score: scoreText, answers:{} }, '*');
    } catch(e){}
  }

  document.addEventListener('DOMContentLoaded', function(){
    // Try to hook into the submit/deliver button
    var tryHook = function(){
      var btn = document.getElementById('deliver-button') || document.querySelector('[id*="deliver"]') || document.querySelector('[id*="submit"]') || document.querySelector('button[onclick*="deliver"]');
      if(btn && !btn._iscoHooked){
        btn._iscoHooked = true;
        btn.addEventListener('click', function(){
          setTimeout(function(){
            var scoreEl = document.getElementById('score-summary') || document.querySelector('[id*="score"]') || document.querySelector('.score');
            var detailsEl = document.getElementById('result-details') || document.querySelector('[id*="result"]') || document.querySelector('[id*="answer"]');
            var scoreText = scoreEl ? scoreEl.textContent.trim() : '?/40';
            var detailsHTML = detailsEl ? detailsEl.innerHTML : '';
            showOverlay(scoreText, detailsHTML);
          }, 600);
        });
      }
    };
    tryHook();
    setTimeout(tryHook, 1500);
    setTimeout(tryHook, 3000);
  });
})();
</script>`;
    return html.replace('</body>', overlay + '</body>');
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#fff', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'#0b0d12', padding:'9px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #252b3b', flexShrink:0, gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
          <span style={{ fontFamily:'Syne', color:color, fontWeight:700, fontSize:'0.88rem', whiteSpace:'nowrap' }}>{icon} {test.title}</span>
          {score && <span style={{ background:color+'22', border:`1px solid ${color}55`, borderRadius:6, padding:'2px 8px', color:color, fontSize:'0.72rem', fontFamily:'Syne', fontWeight:700, flexShrink:0 }}>✓ {score}</span>}
          {saved && !score && <span style={{ fontSize:'0.7rem', color:'var(--green)' }}>✓ Saqlandi</span>}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          <span style={{ fontSize:'0.72rem', color:'#6b7585' }}>{userProfile?.name}</span>
          <button onClick={onClose} style={{ background:'#2e1a1a', border:'1px solid #f87171', borderRadius:7, padding:'6px 13px', color:'#f87171', cursor:'pointer', fontFamily:'Syne', fontWeight:700, fontSize:'0.82rem' }}>✕ Yopish</button>
        </div>
      </div>
      {savedResult && (
        <div style={{ background:'#1a2e1a', borderBottom:'1px solid #4ade8033', padding:'6px 16px', fontSize:'0.78rem', color:'var(--green)', flexShrink:0 }}>
          📊 Oldingi natija: <strong>{savedResult.score}</strong> — Javoblaringiz avtomatik to'ldirilgan
        </div>
      )}
      <iframe
        ref={iframeRef}
        srcDoc={injectHTML(test.htmlContent)}
        style={{ flex:1, border:'none', width:'100%' }}
        title={test.title}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
