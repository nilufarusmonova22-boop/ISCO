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
    const savedScore = savedResult ? (savedResult.score || '') : '';

    const script = `
<style>
#isco-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:99999;align-items:center;justify-content:center;padding:16px;}
#isco-modal.open{display:flex;}
#isco-box{background:#0f1120;border:2px solid ${color};border-radius:18px;width:min(600px,100%);max-height:90vh;display:flex;flex-direction:column;font-family:sans-serif;overflow:hidden;}
#isco-head{padding:20px 22px;border-bottom:1px solid #1e2235;text-align:center;flex-shrink:0;}
#isco-head h3{color:${color};font-size:1.1rem;font-weight:800;margin-bottom:6px;}
#isco-big-score{font-size:3rem;font-weight:800;color:#ffd700;line-height:1;margin:8px 0 4px;}
#isco-stats{display:flex;justify-content:center;gap:16px;font-size:0.78rem;margin-top:6px;}
#isco-filters{display:flex;gap:6px;padding:12px 18px;border-bottom:1px solid #1e2235;flex-shrink:0;}
.isco-fb{flex:1;background:#161828;border:1px solid #1e2235;border-radius:8px;padding:7px 4px;color:#5a6080;font-size:0.75rem;cursor:pointer;font-weight:700;}
.isco-fb.on{background:${color}22;border-color:${color};color:${color};}
#isco-answers{flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:5px;}
.isco-row{border-radius:9px;padding:9px 13px;display:flex;gap:10px;align-items:flex-start;}
.isco-row.ok{background:#00e5a011;border:1px solid #00e5a033;}
.isco-row.no{background:#ff5c7d11;border:1px solid #ff5c7d33;}
.isco-rnum{font-weight:800;font-size:0.82rem;width:26px;flex-shrink:0;padding-top:1px;}
.isco-row.ok .isco-rnum{color:#00e5a0;}
.isco-row.no .isco-rnum{color:#ff5c7d;}
.isco-rinfo{flex:1;}
.isco-ryour{font-size:0.83rem;margin-bottom:2px;}
.isco-row.ok .isco-ryour{color:#00e5a0;}
.isco-row.no .isco-ryour{color:#ff5c7d;}
.isco-rcorrect{font-size:0.76rem;color:#5a6080;}
.isco-rcorrect span{color:#00e5a0;font-weight:600;}
#isco-foot{padding:12px 16px;border-top:1px solid #1e2235;flex-shrink:0;}
#isco-foot button{width:100%;background:${color};border:none;border-radius:10px;padding:11px;font-weight:800;font-size:0.92rem;cursor:pointer;color:#000;}
#isco-prev-btn{position:fixed;bottom:18px;right:18px;z-index:9999;background:#ffd700;border:none;border-radius:12px;padding:10px 18px;font-weight:800;cursor:pointer;font-family:sans-serif;font-size:0.88rem;color:#000;box-shadow:0 4px 20px rgba(0,0,0,.5);display:none;}
</style>

<div id="isco-modal">
  <div id="isco-box">
    <div id="isco-head">
      <h3>${icon} ${label} — Natijalar</h3>
      <div id="isco-big-score">—</div>
      <div id="isco-stats">
        <span id="isco-s-ok" style="color:#00e5a0"></span>
        <span id="isco-s-no" style="color:#ff5c7d"></span>
        <span id="isco-s-tot" style="color:#5a6080"></span>
      </div>
    </div>
    <div id="isco-filters">
      <button class="isco-fb on" onclick="iscoFilter('all',this)">Hammasi</button>
      <button class="isco-fb" onclick="iscoFilter('no',this)" style="border-color:#ff5c7d33;color:#ff5c7d;">❌ Noto'g'ri</button>
      <button class="isco-fb" onclick="iscoFilter('ok',this)" style="border-color:#00e5a033;color:#00e5a0;">✅ To'g'ri</button>
    </div>
    <div id="isco-answers"></div>
    <div id="isco-foot"><button onclick="document.getElementById('isco-modal').classList.remove('open')">✕ Yopish</button></div>
  </div>
</div>
<button id="isco-prev-btn" onclick="iscoShowModal()">📊 Natijani ko'rish</button>

<script>
(function(){
  var iscoData = [];
  var iscoFilter_ = 'all';

  window.iscoFilter = function(type, btn){
    iscoFilter_ = type;
    document.querySelectorAll('.isco-fb').forEach(function(b){b.classList.remove('on');});
    btn.classList.add('on');
    iscoRender();
  };

  function iscoRender(){
    var list = document.getElementById('isco-answers');
    if(!list) return;
    var d = iscoData.filter(function(r){
      if(iscoFilter_==='ok') return r.isCorrect;
      if(iscoFilter_==='no') return !r.isCorrect;
      return true;
    });
    list.innerHTML = d.map(function(r){
      return '<div class="isco-row '+(r.isCorrect?'ok':'no')+'">' +
        '<div class="isco-rnum">'+(r.question||r.num)+'</div>' +
        '<div class="isco-rinfo">' +
          '<div class="isco-ryour">'+(r.isCorrect?'✅':'❌')+' '+(r.userAnswer||r.your||'—')+'</div>' +
          (!r.isCorrect && (r.correctAnswer||r.answer) ? '<div class="isco-rcorrect">To\'g\'ri: <span>'+(r.correctAnswer||r.answer)+'</span></div>' : '') +
        '</div></div>';
    }).join('');
  }

  function iscoShowStats(){
    var ok = iscoData.filter(function(r){return r.isCorrect;}).length;
    var no = iscoData.filter(function(r){return !r.isCorrect;}).length;
    document.getElementById('isco-s-ok').textContent = '✅ '+ok+" to'g'ri";
    document.getElementById('isco-s-no').textContent = '❌ '+no+" noto'g'ri";
    document.getElementById('isco-s-tot').textContent = '📝 '+iscoData.length+' savol';
  }

  window.iscoShowModal = function(){
    // Read fresh from result table if available
    var rows = document.querySelectorAll('#result-details tbody tr');
    if(rows.length > 0){
      var fresh = [];
      rows.forEach(function(row){
        var cells = row.querySelectorAll('td');
        if(cells.length >= 4){
          fresh.push({
            question: cells[0].textContent.trim(),
            userAnswer: cells[1].textContent.trim(),
            correctAnswer: cells[2].textContent.trim(),
            isCorrect: cells[3].classList.contains('result-correct')
          });
        }
      });
      if(fresh.length > 0) iscoData = fresh;
    }

    var scoreEl = document.getElementById('score-summary');
    var scoreText = scoreEl ? scoreEl.textContent.trim() : '';
    document.getElementById('isco-big-score').textContent = scoreText || '—';
    iscoShowStats();
    iscoRender();
    document.getElementById('isco-modal').classList.add('open');

    // Send to parent React for Firebase save
    try {
      window.parent.postMessage({
        type: 'ISCO_TEST_RESULT',
        score: scoreText,
        answers: iscoData
      }, '*');
    } catch(e){}
  };

  // Hook deliver button
  function hookDeliver(){
    var btn = document.getElementById('deliver-button');
    if(btn && !btn._iscohook){
      btn._iscohook = true;
      btn.addEventListener('click', function(){
        setTimeout(function(){
          iscoShowModal();
        }, 900);
      });
    }
  }
  hookDeliver();
  setTimeout(hookDeliver, 1000);
  setTimeout(hookDeliver, 3000);

  // Restore saved answers from previous session
  var prev = ${savedAnswers};
  var prevScore = "${savedScore}";
  if(prev && prev.length > 0){
    iscoData = prev.map(function(r){
      return {
        question: r.question || r.num,
        userAnswer: r.userAnswer || r.your || '—',
        correctAnswer: r.correctAnswer || r.answer || '',
        isCorrect: r.isCorrect !== undefined ? r.isCorrect : r.correct
      };
    });
    document.getElementById('isco-big-score').textContent = prevScore;
    iscoShowStats();
    iscoRender();
    // Show "Natijani ko'rish" button
    var pb = document.getElementById('isco-prev-btn');
    if(pb){
      pb.textContent = '📊 Oldingi natija: ' + prevScore;
      pb.style.display = 'block';
    }
  }

  // Also hook "My Results" button after deliver clones it
  var obs = new MutationObserver(function(){
    var myBtn = document.querySelector('.footer__deliverButton__3FM07.success');
    if(myBtn && !myBtn._iscohook2){
      myBtn._iscohook2 = true;
      myBtn.addEventListener('click', function(e){
        e.stopPropagation();
        iscoShowModal();
      });
    }
  });
  obs.observe(document.body, {childList:true, subtree:true});
})();
</script>`;
    return html.replace('</body>', script + '</body>');
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
