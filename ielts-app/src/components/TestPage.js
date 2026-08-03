import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, where, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function TestPage({ type, isTeacher, user, userProfile }) {
  const COLOR = type === 'listening' ? '#00d4aa' : '#6c63ff';
  const ICON = type === 'listening' ? '🎧' : '📖';
  const LABEL = type === 'listening' ? 'Listening' : 'Reading';
  const COLLECTION = type === 'listening' ? 'listening_tests' : 'reading_tests';
  const RESULTS_COL = type === 'listening' ? 'listening_results' : 'reading_results';

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState(null);
  const [userResults, setUserResults] = useState({});
  const [showUpload, setShowUpload] = useState(false);
  const [viewResult, setViewResult] = useState(null); // {result, test}
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  useEffect(() => {
    const { getDocs, addDoc } = require('firebase/firestore');
    const q = query(collection(db, COLLECTION));
    const unsub = onSnapshot(q, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      arr.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTests(arr);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [COLLECTION]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, RESULTS_COL), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      const res = {};
      snap.docs.forEach(d => { const data = d.data(); res[data.testId] = data; });
      setUserResults(res);
    }, () => {});
    return unsub;
  }, [user, RESULTS_COL]);

  const saveResult = async (testId, score, answers) => {
    if (!user) return;
    const docId = user.uid + '_' + testId;
    await setDoc(doc(db, RESULTS_COL, docId), {
      userId: user.uid, testId, score,
      answers: Array.isArray(answers) ? answers : [],
      userName: userProfile?.name || user.email,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const uploadTest = async () => {
    if (!uploadTitle || !uploadFile) { setUploadMsg('❌ Sarlavha va HTML fayl!'); return; }
    if (uploadFile.size > 900000) { setUploadMsg('❌ 900KB dan kichik bo\'lsin!'); return; }
    setUploading(true); setUploadMsg('');
    try {
      const { addDoc } = await import('firebase/firestore');
      const htmlContent = await new Promise((res, rej) => {
        const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(uploadFile, 'UTF-8');
      });
      await addDoc(collection(db, COLLECTION), {
        title: uploadTitle, description: uploadDesc, date: uploadDate,
        htmlContent, fileName: uploadFile.name, createdAt: serverTimestamp()
      });
      setUploadMsg('✅ Yuklandi!');
      setUploadTitle(''); setUploadDesc(''); setUploadDate(''); setUploadFile(null);
      setTimeout(() => { setUploadMsg(''); setShowUpload(false); }, 1500);
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
        color={COLOR} icon={ICON} label={LABEL}
        user={user} userProfile={userProfile}
        savedResult={userResults[activeTest.id]}
        onSave={(score, answers) => saveResult(activeTest.id, score, answers)}
        onClose={() => setActiveTest(null)}
      />
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>
      <div style={{ background: 'linear-gradient(135deg,#0a1018,#111824)', border: '1px solid ' + COLOR + '33', borderRadius: 18, padding: '26px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -10, fontSize: 90, opacity: 0.05 }}>{ICON}</div>
        <div style={{ fontFamily: 'Syne', fontSize: '0.75rem', color: COLOR, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>IELTS Academic</div>
        <h1 style={{ fontFamily: 'Syne', fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>{ICON} <span style={{ color: COLOR }}>{LABEL}</span> Tests</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.83rem' }}>Javoblar saqlanadi · Natijalar profilingizda</p>
        {isTeacher && (
          <button onClick={() => setShowUpload(s => !s)} style={{ marginTop: 14, background: COLOR, border: 'none', borderRadius: 9, padding: '9px 20px', color: '#000', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
            {showUpload ? '✕ Yopish' : '+ Test yuklash'}
          </button>
        )}
      </div>

      {isTeacher && showUpload && (
        <div style={{ background: 'var(--surface)', border: '1px solid ' + COLOR + '55', borderRadius: 14, padding: '22px', marginBottom: 20 }}>
          {[['Sarlavha *', uploadTitle, setUploadTitle, 'text', 'Test 1'],
            ['Tavsif', uploadDesc, setUploadDesc, 'text', ''],
            ['Sana', uploadDate, setUploadDate, 'date', '']
          ].map(([lbl, val, set, t, ph]) => (
            <div key={lbl} style={{ marginBottom: 10 }}>
              <label style={{ fontSize: '0.76rem', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>{lbl}</label>
              <input type={t} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', color: 'var(--text)', fontSize: '0.88rem', outline: 'none' }} />
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.76rem', color: 'var(--muted)', display: 'block', marginBottom: 5 }}>HTML fayl * (max 900KB)</label>
            <input type="file" accept=".html,.htm" onChange={e => setUploadFile(e.target.files[0])}
              style={{ background: 'var(--surface2)', border: '1px solid ' + COLOR + '44', borderRadius: 8, padding: '8px 11px', color: 'var(--text)', fontSize: '0.83rem', width: '100%' }} />
            {uploadFile && <p style={{ fontSize: '0.73rem', color: 'var(--accent2)', marginTop: 4 }}>📄 {uploadFile.name} — {(uploadFile.size / 1024).toFixed(0)}KB</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={uploadTest} disabled={uploading || !uploadTitle || !uploadFile}
              style={{ background: COLOR, border: 'none', borderRadius: 9, padding: '9px 22px', color: '#000', fontFamily: 'Syne', fontWeight: 700, cursor: 'pointer', opacity: (uploading || !uploadTitle || !uploadFile) ? 0.5 : 1 }}>
              {uploading ? 'Yuklanmoqda...' : '⬆️ Yuklash'}
            </button>
            {uploadMsg && <span style={{ fontSize: '0.83rem', color: uploadMsg.startsWith('✅') ? 'var(--green)' : 'var(--red)' }}>{uploadMsg}</span>}
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>⏳ Yuklanmoqda...</div>}
      {!loading && tests.length === 0 && (
        <div style={{ textAlign: 'center', padding: 50, color: 'var(--muted)', background: 'var(--surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
          <div>Hali test yuklanmagan</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {tests.map((test, i) => {
          const result = userResults[test.id];
          return (
            <div key={test.id} style={{ background: 'var(--surface)', border: '1px solid ' + (result ? COLOR + '66' : 'var(--border)'), borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, transition: 'all .2s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = COLOR}
              onMouseLeave={e => e.currentTarget.style.borderColor = result ? COLOR + '66' : 'var(--border)'}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ background: COLOR + '22', border: '1px solid ' + COLOR + '55', borderRadius: 5, padding: '2px 7px', color: COLOR, fontSize: '0.7rem', fontFamily: 'Syne', fontWeight: 700 }}>Test {tests.length - i}</span>
                  {test.date && <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{test.date}</span>}
                  {result && <span style={{ background: '#00e5a022', border: '1px solid #00e5a055', borderRadius: 5, padding: '2px 7px', color: '#00e5a0', fontSize: '0.7rem', fontFamily: 'Syne', fontWeight: 700 }}>✓ {result.score}</span>}
                </div>
                <div style={{ fontFamily: 'Syne', fontSize: '1rem', fontWeight: 700 }}>{test.title}</div>
                {test.description && <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 2 }}>{test.description}</div>}
                {result && <div style={{ fontSize: '0.74rem', color: 'var(--accent2)', marginTop: 4 }}>📊 Oxirgi natija: <strong>{result.score}</strong> · {Array.isArray(result.answers) ? result.answers.length : 0} ta javob saqlangan</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
                <button onClick={() => setActiveTest(test)} style={{ background: COLOR, border: 'none', borderRadius: 9, padding: '9px 18px', color: '#000', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  {result ? '🔄 Qayta' : '▶ Boshlash'}
                </button>
                {result && Array.isArray(result.answers) && result.answers.length > 0 && (
                  <button onClick={(e) => { e.stopPropagation(); setViewResult({ result, test }); }} style={{ background: COLOR + '22', border: '1px solid ' + COLOR + '66', borderRadius: 8, padding: '7px 12px', color: COLOR, cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'Syne', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    📊 See Results
                  </button>
                )}
                {isTeacher && <button onClick={(e) => { e.stopPropagation(); deleteTest(test.id); }} style={{ background: 'none', border: '1px solid #ff5c7d55', borderRadius: 8, padding: '5px 10px', color: '#ff5c7d', cursor: 'pointer', fontSize: '0.75rem' }}>🗑 O'chir</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Result viewer modal */}
    {viewResult && (
      <ResultModal
        result={viewResult.result}
        test={viewResult.test}
        color={COLOR}
        icon={ICON}
        label={LABEL}
        onClose={() => setViewResult(null)}
      />
    )}
  );
}

function ActiveTest({ test, color, icon, label, user, userProfile, savedResult, onSave, onClose }) {
  const iframeRef = useRef(null);
  const [score, setScore] = useState(savedResult?.score || null);
  const [warning, setWarning] = useState(false);
  const [warnCount, setWarnCount] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [answers, setAnswers] = useState(Array.isArray(savedResult?.answers) ? savedResult.answers : []);
  const [answerFilter, setAnswerFilter] = useState('all');

  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, []);

  useEffect(() => {
    const handleBlur = () => {
      if (blocked) return;
      setWarnCount(c => {
        const next = c + 1;
        if (next >= 3) setBlocked(true);
        else { setWarning(true); setTimeout(() => setWarning(false), 3500); }
        return next;
      });
    };
    const handleVis = () => { if (document.hidden) handleBlur(); };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVis);
    return () => { window.removeEventListener('blur', handleBlur); document.removeEventListener('visibilitychange', handleVis); };
  }, [blocked]);

  useEffect(() => {
    const handler = async (e) => {
      if (e.data?.type === 'ISCO_RESULT') {
        const s = e.data.score;
        const ans = e.data.answers || [];
        setScore(s);
        setAnswers(ans);
        await onSave(s, ans);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onSave]);

  const buildSrcDoc = () => {
    const savedAns = JSON.stringify(Array.isArray(savedResult?.answers) ? savedResult.answers : []);
    const savedSc = savedResult?.score ? String(savedResult.score) : '';

    // Build the inject script as a plain string (no template literals inside)
    const injectScript = [
      '<style>',
      '#im{display:none;position:fixed;inset:0;background:rgba(0,0,0,.9);z-index:99999;align-items:center;justify-content:center;padding:16px}',
      '#im.open{display:flex}',
      '#ib{background:#0f1120;border:2px solid ' + color + ';border-radius:18px;width:min(600px,100%);max-height:90vh;display:flex;flex-direction:column;overflow:hidden}',
      '#ih{padding:18px 22px;border-bottom:1px solid #1e2235;text-align:center;flex-shrink:0}',
      '#ih h3{color:' + color + ';font-size:1rem;font-weight:800;margin-bottom:4px;font-family:sans-serif}',
      '#isc{font-size:2.8rem;font-weight:800;color:#ffd700;line-height:1;margin:6px 0;font-family:sans-serif}',
      '#ist{display:flex;justify-content:center;gap:14px;font-size:0.78rem;margin-top:6px;font-family:sans-serif}',
      '#ifi{display:flex;gap:6px;padding:10px 14px;border-bottom:1px solid #1e2235;flex-shrink:0}',
      '.ifb{flex:1;background:#161828;border:1px solid #1e2235;border-radius:8px;padding:7px;font-size:0.75rem;cursor:pointer;font-weight:700;font-family:sans-serif;color:#5a6080}',
      '.ifb.on{background:' + color + '22;border-color:' + color + ';color:' + color + '}',
      '#il{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:5px}',
      '.ir{border-radius:9px;padding:9px 12px;display:flex;gap:10px}',
      '.ir.ok{background:#00e5a011;border:1px solid #00e5a033}',
      '.ir.no{background:#ff5c7d11;border:1px solid #ff5c7d33}',
      '.irn{font-weight:800;font-size:0.82rem;width:26px;flex-shrink:0;font-family:sans-serif}',
      '.ir.ok .irn{color:#00e5a0}.ir.no .irn{color:#ff5c7d}',
      '.ird{flex:1;font-family:sans-serif}',
      '.iry{font-size:0.83rem;margin-bottom:2px}',
      '.ir.ok .iry{color:#00e5a0}.ir.no .iry{color:#ff5c7d}',
      '.irc{font-size:0.76rem;color:#5a6080}',
      '.irc b{color:#00e5a0}',
      '#ifo{padding:12px 14px;border-top:1px solid #1e2235;flex-shrink:0}',
      '#ifo button{width:100%;background:' + color + ';border:none;border-radius:10px;padding:11px;font-weight:800;font-size:0.9rem;cursor:pointer;color:#000;font-family:sans-serif}',
      '#ipb{position:fixed;bottom:16px;right:16px;z-index:9998;background:#ffd700;border:none;border-radius:12px;padding:10px 18px;font-weight:800;cursor:pointer;font-family:sans-serif;font-size:0.85rem;color:#000;box-shadow:0 4px 20px rgba(0,0,0,.5);display:none}',
      '</style>',
      '<div id="im">',
      '<div id="ib">',
      '<div id="ih"><h3>' + icon + ' ' + label + ' Natijalar</h3><div id="isc">-</div><div id="ist"><span id="iok" style="color:#00e5a0"></span><span id="ino" style="color:#ff5c7d"></span><span id="itot" style="color:#5a6080"></span></div></div>',
      '<div id="ifi">',
      '<button class="ifb on" onclick="iFilt(\'all\',this)">Hammasi</button>',
      '<button class="ifb" onclick="iFilt(\'no\',this)">Noto\'g\'ri</button>',
      '<button class="ifb" onclick="iFilt(\'ok\',this)">To\'g\'ri</button>',
      '</div>',
      '<div id="il"></div>',
      '<div id="ifo"><button onclick="document.getElementById(\'im\').classList.remove(\'open\')">Yopish</button></div>',
      '</div></div>',
      '<button id="ipb"></button>',
      '<script>',
      '(function(){',
      'var D=[];var F="all";',
      'window.iFilt=function(f,b){F=f;document.querySelectorAll(".ifb").forEach(function(x){x.classList.remove("on")});b.classList.add("on");iRen()};',
      'function iRen(){var l=document.getElementById("il");if(!l)return;var d=D.filter(function(r){if(F==="ok")return r.isCorrect;if(F==="no")return !r.isCorrect;return true});',
      'l.innerHTML=d.map(function(r){return "<div class=\'ir "+(r.isCorrect?"ok":"no")+"\'><div class=\'irn\'>"+(r.question||"?")+"</div><div class=\'ird\'><div class=\'iry\'>"+(r.isCorrect?"✅":"❌")+" "+(r.userAnswer||"—")+"</div>"+(!r.isCorrect&&r.correctAnswer?"<div class=\'irc\'>To\'g\'ri: <b>"+r.correctAnswer+"</b></div>":"")+"</div></div>"}).join("")}',
      'function iStats(){var ok=D.filter(function(r){return r.isCorrect}).length;var no=D.length-ok;',
      'document.getElementById("iok").textContent="✅ "+ok;',
      'document.getElementById("ino").textContent="❌ "+no;',
      'document.getElementById("itot").textContent="📝 "+D.length+" savol"}',
      'function iRead(){var rows=document.querySelectorAll("#result-details tbody tr");var arr=[];',
      'rows.forEach(function(row){var c=row.querySelectorAll("td");if(c.length>=4){arr.push({question:c[0].textContent.trim(),userAnswer:c[1].textContent.trim(),correctAnswer:c[2].textContent.trim(),isCorrect:c[3].classList.contains("result-correct")})}});',
      'return arr}',
      'function iShow(sc){var fresh=iRead();if(fresh.length>0)D=fresh;',
      'var s=sc||document.getElementById("score-summary").textContent.trim()||"-";',
      'document.getElementById("isc").textContent=s;iStats();iRen();',
      'document.getElementById("im").classList.add("open");',
      'try{window.parent.postMessage({type:"ISCO_RESULT",score:s,answers:D},"*")}catch(e){}}',
      'var obs=new MutationObserver(function(){',
      'var m=document.getElementById("result-modal");',
      'if(m&&m.style.display==="flex"){setTimeout(function(){iShow()},400)}',
      '});',
      'document.addEventListener("DOMContentLoaded",function(){',
      'var m=document.getElementById("result-modal");',
      'if(m)obs.observe(m,{attributes:true,attributeFilter:["style"]});',
      '});',
      'var prev=' + savedAns + ';',
      'var prevSc="' + savedSc.replace(/"/g, '\\"') + '";',
      'if(prev&&prev.length>0){',
      'D=prev;',
      'window.addEventListener("DOMContentLoaded",function(){',
      'setTimeout(function(){',
      'var pb=document.getElementById("ipb");',
      'if(pb){pb.textContent="📊 Oldingi natija: "+prevSc;pb.style.display="block";',
      'pb.onclick=function(){document.getElementById("isc").textContent=prevSc;iStats();iRen();document.getElementById("im").classList.add("open")}}',
      '},800)',
      '})}',
      '})();',
      '<\/script>'
    ].join('\n');

    return test.htmlContent.replace('</body>', injectScript + '\n</body>');
  };

  const filteredAnswers = answers.filter(a => {
    if (answerFilter === 'ok') return a.isCorrect;
    if (answerFilter === 'no') return !a.isCorrect;
    return true;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      {blocked && (
        <div style={{ position: 'absolute', inset: 0, background: '#070810', zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontSize: '4rem' }}>🚫</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.5rem', color: '#ff5c7d' }}>Test bloklandi!</div>
          <div style={{ color: '#5a6080', fontSize: '0.9rem', textAlign: 'center', maxWidth: 340, lineHeight: 1.7 }}>3 marta boshqa oynaga o'tdingiz. Natija bekor qilindi.</div>
          <button onClick={onClose} style={{ background: '#ff5c7d', border: 'none', borderRadius: 10, padding: '11px 28px', color: '#fff', fontFamily: 'Syne', fontWeight: 700, cursor: 'pointer' }}>← Orqaga</button>
        </div>
      )}
      {warning && !blocked && (
        <div style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 998, background: '#1a0f00', border: '2px solid #ffd700', borderRadius: 12, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 32px rgba(0,0,0,.6)', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '1.3rem' }}>⚠️</span>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, color: '#ffd700', fontSize: '0.9rem' }}>Ogohlantirish {warnCount}/3</div>
            <div style={{ fontSize: '0.78rem', color: '#a08040' }}>Boshqa oynaga o'tmang!</div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ background: '#0b0d12', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e2235', flexShrink: 0, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{ fontFamily: 'Syne', color: color, fontWeight: 700, fontSize: '0.88rem', whiteSpace: 'nowrap' }}>{icon} {test.title}</span>
          {score && <span style={{ background: color + '22', border: '1px solid ' + color + '55', borderRadius: 6, padding: '2px 8px', color: color, fontSize: '0.72rem', fontFamily: 'Syne', fontWeight: 700 }}>✓ {score}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {answers.length > 0 && (
            <button onClick={() => setShowAnswers(true)} style={{ background: color + '22', border: '1px solid ' + color + '55', borderRadius: 8, padding: '6px 12px', color: color, cursor: 'pointer', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.78rem' }}>
              📊 Natija
            </button>
          )}
          <span style={{ fontSize: '0.72rem', color: '#5a6080' }}>{userProfile?.name}</span>
          <button onClick={onClose} style={{ background: '#2e1a1a', border: '1px solid #ff5c7d', borderRadius: 7, padding: '6px 13px', color: '#ff5c7d', cursor: 'pointer', fontFamily: 'Syne', fontWeight: 700, fontSize: '0.82rem' }}>✕</button>
        </div>
      </div>

      {savedResult && (
        <div style={{ background: '#1a2e1a', borderBottom: '1px solid #00e5a033', padding: '6px 16px', fontSize: '0.78rem', color: '#00e5a0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>📊 Oldingi natija: <strong>{savedResult.score}</strong></span>
          {Array.isArray(savedResult.answers) && savedResult.answers.length > 0 && (
            <button onClick={() => setShowAnswers(true)} style={{ background: 'none', border: '1px solid #00e5a055', borderRadius: 6, padding: '3px 10px', color: '#00e5a0', cursor: 'pointer', fontSize: '0.75rem' }}>Ko'rish →</button>
          )}
        </div>
      )}

      <iframe ref={iframeRef} srcDoc={buildSrcDoc()} style={{ flex: 1, border: 'none', width: '100%' }} title={test.title} sandbox="allow-scripts allow-same-origin allow-forms" />

      {/* Answer modal */}
      {showAnswers && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#0f1120', border: '2px solid ' + color, borderRadius: 18, width: 'min(600px,100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #1e2235', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: 'Syne', color: color, fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>{icon} {label} — Natijalar</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '2.8rem', color: '#ffd700', lineHeight: 1 }}>{score || savedResult?.score || '—'}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, fontSize: '0.78rem', marginTop: 8, fontFamily: 'Syne' }}>
                <span style={{ color: '#00e5a0' }}>✅ {answers.filter(a => a.isCorrect).length}</span>
                <span style={{ color: '#ff5c7d' }}>❌ {answers.filter(a => !a.isCorrect).length}</span>
                <span style={{ color: '#5a6080' }}>📝 {answers.length} savol</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px', borderBottom: '1px solid #1e2235', flexShrink: 0 }}>
              {[['all', 'Hammasi'], ['no', '❌ Noto\'g\'ri'], ['ok', '✅ To\'g\'ri']].map(([f, lbl]) => (
                <button key={f} onClick={() => setAnswerFilter(f)} style={{ flex: 1, background: answerFilter === f ? color + '22' : '#161828', border: '1px solid ' + (answerFilter === f ? color : '#1e2235'), borderRadius: 8, padding: '7px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, color: answerFilter === f ? color : '#5a6080' }}>{lbl}</button>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {filteredAnswers.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: '#5a6080' }}>Hech narsa topilmadi</div>}
              {filteredAnswers.map((a, i) => (
                <div key={i} style={{ background: a.isCorrect ? '#00e5a011' : '#ff5c7d11', border: '1px solid ' + (a.isCorrect ? '#00e5a033' : '#ff5c7d33'), borderRadius: 9, padding: '9px 12px', display: 'flex', gap: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', width: 26, flexShrink: 0, color: a.isCorrect ? '#00e5a0' : '#ff5c7d', fontFamily: 'Syne' }}>{a.question}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.83rem', color: a.isCorrect ? '#00e5a0' : '#ff5c7d', marginBottom: 2 }}>{a.isCorrect ? '✅' : '❌'} {a.userAnswer || '—'}</div>
                    {!a.isCorrect && a.correctAnswer && <div style={{ fontSize: '0.76rem', color: '#5a6080' }}>To'g'ri: <b style={{ color: '#00e5a0' }}>{a.correctAnswer}</b></div>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 14px', borderTop: '1px solid #1e2235', flexShrink: 0 }}>
              <button onClick={() => setShowAnswers(false)} style={{ width: '100%', background: color, border: 'none', borderRadius: 10, padding: '11px', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', color: '#000', fontFamily: 'Syne' }}>✕ Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultModal({ result, test, color, icon, label, onClose }) {
  const [filter, setFilter] = useState('all');
  const answers = Array.isArray(result?.answers) ? result.answers : [];
  const correct = answers.filter(a => a.isCorrect).length;
  const wrong = answers.filter(a => !a.isCorrect).length;

  const filtered = answers.filter(a => {
    if (filter === 'ok') return a.isCorrect;
    if (filter === 'no') return !a.isCorrect;
    return true;
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.9)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#0f1120', border: '2px solid ' + color, borderRadius: 18, width: 'min(640px,100%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} className="fadeIn">
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e2235', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Syne', color: color, fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>{icon} {test?.title}</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '3rem', color: '#ffd700', lineHeight: 1 }}>{result.score}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10, fontSize: '0.82rem' }}>
            <span style={{ color: '#00e5a0', fontWeight: 600 }}>✅ {correct} to'g'ri</span>
            <span style={{ color: '#ff5c7d', fontWeight: 600 }}>❌ {wrong} noto'g'ri</span>
            <span style={{ color: '#5a6080' }}>📝 {answers.length} savol</span>
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 18px', borderBottom: '1px solid #1e2235', flexShrink: 0 }}>
          {[['all', 'Hammasi', '#5a6080'], ['no', '❌ Noto\'g\'ri', '#ff5c7d'], ['ok', '✅ To\'g\'ri', '#00e5a0']].map(([f, lbl, col]) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 1, background: filter === f ? col + '22' : '#161828',
              border: '1px solid ' + (filter === f ? col : '#1e2235'),
              borderRadius: 8, padding: '8px', fontSize: '0.78rem', cursor: 'pointer',
              fontWeight: 700, color: filter === f ? col : '#5a6080', fontFamily: 'Syne'
            }}>{lbl}</button>
          ))}
        </div>

        {/* Answer list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#5a6080' }}>Hech narsa topilmadi</div>
          )}
          {filtered.map((a, i) => (
            <div key={i} style={{
              background: a.isCorrect ? '#00e5a011' : '#ff5c7d11',
              border: '1px solid ' + (a.isCorrect ? '#00e5a033' : '#ff5c7d33'),
              borderRadius: 10, padding: '11px 14px',
              display: 'flex', gap: 14, alignItems: 'flex-start'
            }}>
              {/* Question number */}
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '0.9rem', color: a.isCorrect ? '#00e5a0' : '#ff5c7d', width: 30, flexShrink: 0, paddingTop: 1 }}>
                {a.question}
              </div>
              <div style={{ flex: 1 }}>
                {/* Your answer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: a.isCorrect ? 0 : 5 }}>
                  <span style={{ fontSize: '0.72rem', color: '#5a6080', flexShrink: 0 }}>Your answer:</span>
                  <span style={{ fontSize: '0.88rem', color: a.isCorrect ? '#00e5a0' : '#ff5c7d', fontWeight: 600 }}>
                    {a.isCorrect ? '✅' : '❌'} {a.userAnswer || '—'}
                  </span>
                </div>
                {/* Correct answer (only if wrong) */}
                {!a.isCorrect && a.correctAnswer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.72rem', color: '#5a6080', flexShrink: 0 }}>Correct:</span>
                    <span style={{ fontSize: '0.88rem', color: '#00e5a0', fontWeight: 600 }}>{a.correctAnswer}</span>
                  </div>
                )}
                {/* Incorrect badge */}
                {!a.isCorrect && (
                  <div style={{ marginTop: 4 }}>
                    <span style={{ fontSize: '0.68rem', background: '#ff5c7d22', border: '1px solid #ff5c7d44', borderRadius: 4, padding: '2px 6px', color: '#ff5c7d' }}>incorrect</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid #1e2235', flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', background: color, border: 'none', borderRadius: 10, padding: '12px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', color: '#000', fontFamily: 'Syne' }}>
            ✕ Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
