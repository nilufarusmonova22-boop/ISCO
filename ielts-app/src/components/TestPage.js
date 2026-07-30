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
  const [warning, setWarning] = useState(false);
  const [warnCount, setWarnCount] = useState(0);
  const [blocked, setBlocked] = useState(false);

  // Enter fullscreen on start
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(()=>{});
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(()=>{}); };
  }, []);

  // Detect tab switch / window blur
  useEffect(() => {
    const handleBlur = () => {
      if (blocked) return;
      setWarnCount(c => {
        const next = c + 1;
        if (next >= 3) { setBlocked(true); }
        else { setWarning(true); setTimeout(()=>setWarning(false), 3500); }
        return next;
      });
    };
    const handleVisibility = () => { if (document.hidden) handleBlur(); };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [blocked]);

  useEffect(() => {
    const handler = async (e) => {
      if (e.data?.type === 'ISCO_TEST_RESULT') {
        const s = e.data.score;
        const answers = e.data.answers || [];
        setScore(s);
        await onSave(s, answers);
        setSaved(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSave]);

  // Inject saved answers + result overlay into HTML
  const injectHTML = (html) => {
    const savedAnswers = savedResult ? JSON.stringify(savedResult.answers || []) : '[]';
    const savedScore = savedResult?.score || '';

    const overlay = `
<style>
#isco-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;align-items:center;justify-content:center;padding:16px;}
#isco-overlay.show{display:flex;}
#isco-box{background:#0f1120;border:2px solid ${color};border-radius:18px;width:min(580px,100%);max-height:88vh;overflow-y:auto;font-family:sans-serif;}
#isco-header{padding:22px 24px;border-bottom:1px solid #1e2235;text-align:center;}
#isco-header h2{color:${color};font-size:1.2rem;font-weight:800;margin-bottom:4px;}
#isco-score{font-size:3.5rem;font-weight:800;color:#ffd700;line-height:1;margin:10px 0 4px;}
#isco-sub{color:#5a6080;font-size:0.82rem;}
#isco-body{padding:18px 20px;}
#isco-filter{display:flex;gap:6px;margin-bottom:14px;}
.isco-fbtn{flex:1;background:#161828;border:1px solid #1e2235;border-radius:8px;padding:7px;color:#5a6080;font-size:0.78rem;cursor:pointer;font-family:sans-serif;}
.isco-fbtn.active{background:${color}22;border-color:${color};color:${color};}
#isco-list{display:flex;flex-direction:column;gap:6px;}
.isco-qrow{border-radius:10px;padding:10px 14px;display:flex;gap:12px;align-items:flex-start;}
.isco-qrow.correct{background:#00e5a011;border:1px solid #00e5a033;}
.isco-qrow.wrong{background:#ff5c7d11;border:1px solid #ff5c7d33;}
.isco-qrow.unanswered{background:#1e223566;border:1px solid #1e2235;}
.isco-qnum{font-weight:800;font-size:0.82rem;width:24px;flex-shrink:0;margin-top:1px;}
.isco-qrow.correct .isco-qnum{color:#00e5a0;}
.isco-qrow.wrong .isco-qnum{color:#ff5c7d;}
.isco-qrow.unanswered .isco-qnum{color:#5a6080;}
.isco-qdesc{flex:1;}
.isco-your{font-size:0.82rem;margin-bottom:3px;}
.isco-qrow.correct .isco-your{color:#00e5a0;}
.isco-qrow.wrong .isco-your{color:#ff5c7d;}
.isco-correct-ans{font-size:0.78rem;color:#5a6080;}
.isco-correct-ans span{color:#00e5a0;}
.isco-qbadge{font-size:0.75rem;margin-top:2px;}
#isco-footer{padding:16px 20px;border-top:1px solid #1e2235;display:flex;gap:10px;}
.isco-close{flex:1;background:${color};border:none;border-radius:10px;padding:11px;font-weight:700;font-size:0.9rem;cursor:pointer;color:#000;}
.isco-review{flex:1;background:#161828;border:1px solid #1e2235;border-radius:10px;padding:11px;font-weight:700;font-size:0.9rem;cursor:pointer;color:#e8eaf5;}
</style>
<div id="isco-overlay">
  <div id="isco-box">
    <div id="isco-header">
      <h2>${icon} ${label} — Natijalar</h2>
      <div id="isco-score">-</div>
      <div id="isco-sub">Natijangiz saqlandi ✓</div>
      <div id="isco-stats" style="display:flex;justify-content:center;gap:16px;margin-top:10px;font-size:0.78rem;"></div>
    </div>
    <div id="isco-body">
      <div id="isco-filter">
        <button class="isco-fbtn active" onclick="filterQ('all')">Hammasi</button>
        <button class="isco-fbtn" onclick="filterQ('wrong')" style="border-color:#ff5c7d44;color:#ff5c7d;">❌ Noto'g'ri</button>
        <button class="isco-fbtn" onclick="filterQ('correct')" style="border-color:#00e5a044;color:#00e5a0;">✅ To'g'ri</button>
      </div>
      <div id="isco-list"></div>
    </div>
    <div id="isco-footer">
      <button class="isco-review" onclick="document.getElementById('isco-overlay').classList.remove('show')">📋 Testni ko'rish</button>
      <button class="isco-close" onclick="document.getElementById('isco-overlay').classList.add('show')">📊 Natijalar</button>
    </div>
  </div>
</div>
<script>
(function(){
  var allDetails = [];
  var currentFilter = 'all';

  function filterQ(type){
    currentFilter = type;
    document.querySelectorAll('.isco-fbtn').forEach(function(b){ b.classList.remove('active'); });
    event.target.classList.add('active');
    renderList();
  }
  window.filterQ = filterQ;

  function renderList(){
    var list = document.getElementById('isco-list');
    if(!list) return;
    var filtered = allDetails.filter(function(d){
      if(currentFilter==='wrong') return !d.correct;
      if(currentFilter==='correct') return d.correct;
      return true;
    });
    list.innerHTML = filtered.map(function(d){
      var cls = d.correct ? 'correct' : (d.your ? 'wrong' : 'unanswered');
      var badge = d.correct ? '✅' : (d.your ? '❌' : '—');
      return '<div class="isco-qrow '+cls+'">' +
        '<div class="isco-qnum">'+d.num+'</div>' +
        '<div class="isco-qdesc">' +
          '<div class="isco-your">'+badge+' '+( d.your || '<i style="color:#5a6080">Javob berilmagan</i>'  )+'</div>' +
          (!d.correct && d.answer ? '<div class="isco-correct-ans">To'g'ri: <span>'+d.answer+'</span></div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  }

  function collectAnswers(){
    var results = [];
    // Try to collect from result table/list
    var rows = document.querySelectorAll('[class*="result"] tr, [id*="result"] tr, .result-row, [data-question]');
    rows.forEach(function(row, i){
      var cells = row.querySelectorAll('td, .cell, span');
      if(cells.length >= 2){
        var num = parseInt(cells[0]?.textContent) || (i+1);
        var your = cells[1]?.textContent?.trim() || '';
        var answer = cells[2]?.textContent?.trim() || '';
        var correct = cells[3]?.textContent?.includes('correct') || cells[1]?.classList?.contains('correct') || your.toLowerCase()===answer.toLowerCase();
        results.push({num:num, your:your, answer:answer, correct:correct});
      }
    });

    // Fallback: collect all inputs
    if(results.length === 0){
      var inputs = document.querySelectorAll('input[type="text"], input[type="radio"]:checked, select');
      inputs.forEach(function(inp, i){
        var val = inp.value?.trim();
        if(val) results.push({num:i+1, your:val, answer:'', correct:false});
      });
    }
    return results;
  }

  // Parse from #result-details table (this HTML uses resultsData array)
  function parseFromResultsTable(){
    var rows = document.querySelectorAll('#result-details tbody tr');
    var arr = [];
    rows.forEach(function(row){
      var cells = row.querySelectorAll('td');
      if(cells.length >= 4){
        var num = parseInt(cells[0].textContent.trim()) || arr.length+1;
        var your = cells[1].textContent.trim();
        var answer = cells[2].textContent.trim();
        var isCorrect = cells[3].classList.contains('result-correct') || cells[3].textContent.includes('✓') || cells[3].textContent.toLowerCase().includes('correct');
        arr.push({num:num, your:your, answer:answer, correct:isCorrect});
      }
    });
    return arr;
  }

  function showOverlay(scoreText){
    // Get data directly from the result table
    var parsed = parseFromResultsTable();
    if(parsed.length > 0) allDetails = parsed;

    var correct = allDetails.filter(function(d){return d.correct;}).length;
    var wrong = allDetails.filter(function(d){return !d.correct && d.your;}).length;
    var total = allDetails.length || 40;

    document.getElementById('isco-score').textContent = scoreText;
    document.getElementById('isco-stats').innerHTML =
      '<span style="color:#00e5a0">✅ '+correct+' to\'g\'ri</span>' +
      '<span style="color:#ff5c7d">❌ '+wrong+' noto\'g\'ri</span>' +
      '<span style="color:#5a6080">📝 '+total+' savol</span>';

    renderList();
    document.getElementById('isco-overlay').classList.add('show');

    // Send to parent (React) for saving to Firebase
    try {
      window.parent.postMessage({
        type:'ISCO_TEST_RESULT',
        score: scoreText,
        answers: allDetails
      }, '*');
    } catch(e){}
  }

  // Restore saved answers — show "Ko\'rish" button if previous result exists
  var savedAnswers = ${savedAnswers};
  var savedScore = "${savedScore}";
  if(savedAnswers && savedAnswers.length > 0){
    allDetails = savedAnswers;
    window.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){
        var btn = document.createElement('button');
        btn.innerHTML = '📊 Oldingi natija: <b>'+savedScore+'</b>';
        btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:8888;background:#ffd700;border:none;border-radius:12px;padding:11px 20px;font-weight:700;cursor:pointer;font-family:sans-serif;font-size:14px;box-shadow:0 4px 20px rgba(0,0,0,.5);color:#000;';
        btn.onclick = function(){
          document.getElementById('isco-score').textContent = savedScore;
          var correct = allDetails.filter(function(d){return d.correct;}).length;
          var wrong = allDetails.filter(function(d){return !d.correct && d.your;}).length;
          document.getElementById('isco-stats').innerHTML =
            '<span style="color:#00e5a0">✅ '+correct+' to\'g\'ri</span>' +
            '<span style="color:#ff5c7d">❌ '+wrong+' noto\'g\'ri</span>' +
            '<span style="color:#5a6080">📝 '+allDetails.length+' savol</span>';
          renderList();
          document.getElementById('isco-overlay').classList.add('show');
        };
        document.body.appendChild(btn);
      }, 800);
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    var tryHook = function(){
      var btn = document.getElementById('deliver-button') ||
        document.querySelector('[id*="deliver"]') ||
        document.querySelector('[id*="submit"]') ||
        document.querySelector('button[onclick*="deliver"]') ||
        document.querySelector('input[type="submit"]');
      if(btn && !btn._iscoHooked){
        btn._iscoHooked = true;
        btn.addEventListener('click', function(){
          setTimeout(function(){
            var scoreEl = document.getElementById('score-summary');
            var scoreText = scoreEl ? scoreEl.textContent.trim() : '?/40';
            showOverlay(scoreText);
          }, 800);
        });
      }
    };
    tryHook();
    setTimeout(tryHook, 1000);
    setTimeout(tryHook, 2500);
    setTimeout(tryHook, 5000);
  });
})();
</script>`;
    return html.replace('</body>', overlay + '</body>');
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#fff', display:'flex', flexDirection:'column' }}>
      {/* BLOCKED overlay */}
      {blocked && (
        <div style={{ position:'absolute', inset:0, background:'#070810', zIndex:999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
          <div style={{ fontSize:'4rem' }}>🚫</div>
          <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:'1.5rem', color:'#ff5c7d', textAlign:'center' }}>Test bloklandi!</div>
          <div style={{ color:'#5a6080', fontSize:'0.9rem', textAlign:'center', maxWidth:340, lineHeight:1.7 }}>
            Test vaqtida 3 marta boshqa oynaga o'tdingiz.<br/>
            Test natijasi bekor qilindi.
          </div>
          <button onClick={onClose} style={{ background:'#ff5c7d', border:'none', borderRadius:10, padding:'11px 28px', color:'#fff', fontFamily:'Syne', fontWeight:700, cursor:'pointer', fontSize:'0.95rem' }}>← Orqaga qaytish</button>
        </div>
      )}
      {/* WARNING overlay */}
      {warning && !blocked && (
        <div style={{ position:'absolute', top:70, left:'50%', transform:'translateX(-50%)', zIndex:998, background:'#1a0f00', border:'2px solid #ffd700', borderRadius:12, padding:'14px 24px', display:'flex', alignItems:'center', gap:12, boxShadow:'0 8px 32px rgba(0,0,0,.6)', whiteSpace:'nowrap' }}>
          <span style={{ fontSize:'1.3rem' }}>⚠️</span>
          <div>
            <div style={{ fontFamily:'Syne', fontWeight:700, color:'#ffd700', fontSize:'0.9rem' }}>Ogohlantirish {warnCount}/3</div>
            <div style={{ fontSize:'0.78rem', color:'#a08040' }}>Test vaqtida boshqa oynaga o'tmang!</div>
          </div>
        </div>
      )}
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
