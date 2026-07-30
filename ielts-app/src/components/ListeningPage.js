import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ListeningPage({ isAdmin, user, userProfile }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTest, setActiveTest] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'listening_tests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const deleteTest = async (id) => {
    if (!window.confirm("O'chirilsinmi?")) return;
    await deleteDoc(doc(db, 'listening_tests', id));
    if (activeTest?.id === id) setActiveTest(null);
  };

  // Inject answer overlay into iframe HTML
  const injectAnswerOverlay = (html) => {
    const overlay = `
<style>
#isco-result-overlay {
  display:none; position:fixed; inset:0; background:rgba(0,0,0,.7);
  z-index:9999; align-items:center; justify-content:center;
}
#isco-result-overlay.show { display:flex; }
#isco-result-box {
  background:#13161f; border:1px solid #252b3b; border-radius:16px;
  padding:28px 24px; width:min(480px,94vw); max-height:85vh; overflow-y:auto;
}
#isco-result-box h2 { font-family:sans-serif; color:#f0c040; margin-bottom:16px; font-size:1.2rem; }
.isco-q-row { display:flex; align-items:center; gap:12px; padding:6px 0; border-bottom:1px solid #252b3b; font-family:sans-serif; font-size:0.88rem; }
.isco-q-num { color:#6b7585; width:28px; flex-shrink:0; }
.isco-q-answer { color:#e8eaf2; flex:1; }
.isco-q-correct { color:#4ade80; }
.isco-q-wrong { color:#f87171; }
.isco-close-btn { width:100%; margin-top:18px; background:#f0c040; border:none; border-radius:10px; padding:11px; font-family:sans-serif; font-weight:700; font-size:0.95rem; cursor:pointer; color:#000; }
</style>
<div id="isco-result-overlay">
  <div id="isco-result-box">
    <h2 id="isco-score-title">📊 Natijalar</h2>
    <div id="isco-answers-list"></div>
    <button class="isco-close-btn" onclick="document.getElementById('isco-result-overlay').classList.remove('show')">✕ Yopish</button>
  </div>
</div>
<script>
(function(){
  var origDeliver = window.deliverTest;
  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.getElementById('deliver-button');
    if(btn){
      var orig = btn.onclick;
      btn.addEventListener('click', function(){
        setTimeout(function(){
          try {
            var modal = document.getElementById('result-modal');
            if(modal && modal.style.display !== 'none'){
              var scoreEl = document.getElementById('score-summary');
              var detailsEl = document.getElementById('result-details');
              var scoreText = scoreEl ? scoreEl.textContent : '';
              var detailsHTML = detailsEl ? detailsEl.innerHTML : '';
              
              var overlay = document.getElementById('isco-result-overlay');
              var title = document.getElementById('isco-score-title');
              var list = document.getElementById('isco-answers-list');
              
              title.textContent = '📊 ' + scoreText;
              list.innerHTML = detailsHTML;
              
              // Style the answer rows
              list.querySelectorAll('.result-item, tr, li, p').forEach(function(el){
                el.style.padding = '4px 0';
                el.style.borderBottom = '1px solid #252b3b';
                el.style.fontFamily = 'sans-serif';
                el.style.fontSize = '0.85rem';
                el.style.color = '#e8eaf2';
              });
              
              overlay.classList.add('show');
            }
          } catch(e){}
          
          // Send result to parent
          try {
            var scoreEl = document.getElementById('score-summary');
            if(scoreEl && window.parent !== window){
              window.parent.postMessage({
                type: 'ISCO_TEST_RESULT',
                score: scoreEl.textContent
              }, '*');
            }
          } catch(e){}
        }, 500);
      });
    }
  });
})();
</script>`;
    return html.replace('</body>', overlay + '</body>');
  };

  if (activeTest) {
    return (
      <div style={{ position:'fixed', inset:0, zIndex:200, background:'#fff', display:'flex', flexDirection:'column' }}>
        <div style={{ background:'#0b0d12', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #252b3b', flexShrink:0 }}>
          <span style={{ fontFamily:'Syne', color:'#10b981', fontWeight:700, fontSize:'0.9rem' }}>🎧 {activeTest.title}</span>
          <div style={{ display:'flex', gap:8 }}>
            <span style={{ fontSize:'0.75rem', color:'var(--muted)', alignSelf:'center' }}>{userProfile?.name || ''}</span>
            <button onClick={() => setActiveTest(null)} style={{ background:'#2e1a1a', border:'1px solid #f87171', borderRadius:8, padding:'6px 14px', color:'#f87171', cursor:'pointer', fontFamily:'Syne', fontWeight:700 }}>✕ Yopish</button>
          </div>
        </div>
        <iframe
          ref={iframeRef}
          srcDoc={injectAnswerOverlay(activeTest.htmlContent)}
          style={{ flex:1, border:'none', width:'100%' }}
          title={activeTest.title}
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 20px' }}>
      <div style={{ background:'linear-gradient(135deg,#0a1a14,#111f1a)', border:'1px solid #10b98133', borderRadius:18, padding:'28px 24px', marginBottom:28, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-20, right:-10, fontSize:100, opacity:0.05 }}>🎧</div>
        <div style={{ fontFamily:'Syne', fontSize:'0.75rem', color:'#10b981', letterSpacing:2, textTransform:'uppercase', marginBottom:8 }}>IELTS Academic</div>
        <h1 style={{ fontFamily:'Syne', fontSize:'1.8rem', fontWeight:800, marginBottom:6 }}>🎧 <span style={{ color:'#10b981' }}>Listening</span> Tests</h1>
        <p style={{ color:'var(--muted)', fontSize:'0.85rem' }}>4 section · 40 savol · Javoblar ko'rinadi</p>
        <div style={{ marginTop:12, display:'flex', gap:12 }}>
          <div style={{ background:'#10b98122', border:'1px solid #10b98144', borderRadius:8, padding:'6px 12px', fontSize:'0.75rem', color:'#10b981' }}>📋 {tests.length} ta test</div>
        </div>
      </div>

      {loading && <div style={{ textAlign:'center', padding:60, color:'var(--muted)' }}>⏳ Yuklanmoqda...</div>}
      {!loading && tests.length===0 && (
        <div style={{ textAlign:'center', padding:60, color:'var(--muted)', background:'var(--surface)', borderRadius:16, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
          <div>Hali test yuklanmagan</div>
          {isAdmin && <div style={{ marginTop:8, fontSize:'0.83rem', color:'#10b981' }}>Admin Panel → 🎧 Listening</div>}
        </div>
      )}

      <div style={{ display:'grid', gap:14 }}>
        {tests.map((test, i) => (
          <div key={test.id} style={{ background:'var(--surface)', border:'1px solid #10b98133', borderRadius:16, padding:'20px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, transition:'all .2s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#10b981'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='#10b98133'}>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ background:'#10b98122', border:'1px solid #10b98155', borderRadius:6, padding:'2px 8px', color:'#10b981', fontSize:'0.7rem', fontFamily:'Syne', fontWeight:700 }}>Test {tests.length - i}</span>
                {test.date && <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>{test.date}</span>}
              </div>
              <div style={{ fontFamily:'Syne', fontSize:'1rem', fontWeight:700 }}>{test.title}</div>
              {test.description && <div style={{ color:'var(--muted)', fontSize:'0.83rem', marginTop:3 }}>{test.description}</div>}
            </div>
            <div style={{ display:'flex', gap:8, flexShrink:0 }}>
              <button onClick={() => setActiveTest(test)} style={{ background:'#10b981', border:'none', borderRadius:10, padding:'10px 20px', color:'#000', fontFamily:'Syne', fontWeight:700, fontSize:'0.88rem', cursor:'pointer' }}>▶ Boshlash</button>
              {isAdmin && <button onClick={() => deleteTest(test.id)} style={{ background:'none', border:'1px solid #f8717155', borderRadius:10, padding:'10px 12px', color:'#f87171', cursor:'pointer' }}>🗑</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
