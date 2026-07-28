import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const BUILTIN = [
  {en:"acquired",uz:"qo'lga kiritilgan",star:false,example:"The company acquired a new building."},
  {en:"access",uz:"kirish imkoniyati",star:false,example:"Everyone should have access to clean water."},
  {en:"accurate",uz:"aniq",star:false,example:"The report must be accurate and detailed."},
  {en:"acknowledge",uz:"tan olmoq",star:false,example:"She acknowledged her mistake."},
  {en:"accomplishment",uz:"yutuq",star:false,example:"Winning the award was a great accomplishment."},
  {en:"alleviate",uz:"yengillashtirmoq",star:true,example:"Exercise can alleviate stress effectively."},
  {en:"allure",uz:"joziba",star:false,example:"The allure of the city attracted many people."},
  {en:"alternative",uz:"muqobil",star:false,example:"We need an alternative solution."},
  {en:"ambition",uz:"maqsad, intilish",star:false,example:"Her ambition was to become a doctor."},
  {en:"anxious",uz:"xavotirli",star:false,example:"He felt anxious before the exam."},
  {en:"aspiration",uz:"orzu, intilish",star:true,example:"Her aspiration is to study abroad."},
  {en:"barrier",uz:"to'siq",star:false,example:"Language can be a barrier to communication."},
  {en:"breakthrough",uz:"katta yutuq",star:true,example:"Scientists made a major breakthrough in cancer research."},
  {en:"congestion",uz:"tirbandlik",star:true,example:"Traffic congestion is a major urban problem."},
  {en:"controversy",uz:"bahs",star:true,example:"The new law sparked a lot of controversy."},
  {en:"curriculum",uz:"o'quv dasturi",star:false,example:"The school updated its curriculum this year."},
  {en:"determination",uz:"qat'iyat",star:true,example:"Her determination helped her achieve her goals."},
  {en:"diversity",uz:"xilma-xillik",star:true,example:"Cultural diversity makes a society stronger."},
  {en:"drought",uz:"qurg'oqchilik",star:false,example:"The drought destroyed many crops."},
  {en:"entrepreneur",uz:"tadbirkor",star:true,example:"She became a successful entrepreneur at age 25."},
  {en:"eradicate",uz:"yo'q qilmoq",star:false,example:"We must eradicate poverty worldwide."},
  {en:"evidence",uz:"dalil",star:false,example:"There is strong evidence that exercise is beneficial."},
  {en:"extinction",uz:"yo'q bo'lib ketish",star:false,example:"Many species face extinction due to climate change."},
  {en:"forecast",uz:"bashorat",star:false,example:"The weather forecast predicts heavy rain."},
  {en:"hazards",uz:"xavf-xatarlar",star:false,example:"Factory workers face many health hazards."},
  {en:"infrastructure",uz:"infratuzilma",star:true,example:"The government invested in road infrastructure."},
  {en:"innovation",uz:"yangilik",star:true,example:"Innovation is the key to economic growth."},
  {en:"inequality",uz:"tengsizlik",star:true,example:"Income inequality is growing in many countries."},
  {en:"landfill",uz:"chiqindi poligoni",star:false,example:"The city built a new landfill outside town."},
  {en:"loyalty",uz:"sadoqat",star:false,example:"Customer loyalty is important for any business."},
  {en:"mitigate",uz:"kamaytirmoq",star:true,example:"Trees help mitigate the effects of pollution."},
  {en:"obstacle",uz:"to'siq",star:true,example:"Lack of funding is a major obstacle to research."},
  {en:"perception",uz:"tasavvur",star:true,example:"Public perception of the issue has changed."},
  {en:"phenomenon",uz:"hodisa",star:true,example:"Climate change is a global phenomenon."},
  {en:"procrastination",uz:"kechiktirish",star:false,example:"Procrastination is the enemy of productivity."},
  {en:"rectify",uz:"tuzatmoq",star:true,example:"We need to rectify the errors in the report."},
  {en:"resilience",uz:"chidamlilik",star:true,example:"Resilience helps people recover from hardship."},
  {en:"revenue",uz:"daromad",star:true,example:"The company's revenue increased by 20%."},
  {en:"rural",uz:"qishloqqa oid",star:false,example:"Many rural areas lack access to the internet."},
  {en:"satisfaction",uz:"qoniqish",star:false,example:"Job satisfaction is important for employees."},
  {en:"sewage",uz:"oqova suv",star:false,example:"The sewage system needs to be upgraded."},
  {en:"sophisticated",uz:"murakkab, zamonaviy",star:false,example:"The device uses sophisticated technology."},
  {en:"sufficient",uz:"yetarli",star:false,example:"Make sure you have sufficient time to study."},
  {en:"sustainable",uz:"barqaror",star:true,example:"We need sustainable energy sources for the future."},
  {en:"terrain",uz:"yer relyefi",star:false,example:"The mountainous terrain made travel difficult."},
  {en:"tolerance",uz:"bardoshlilik",star:false,example:"Tolerance is essential in a diverse society."},
  {en:"ubiquitous",uz:"hamma joyda mavjud",star:false,example:"Smartphones are now ubiquitous in modern life."},
  {en:"urbanisation",uz:"shaharlashuv",star:true,example:"Rapid urbanisation is causing housing shortages."},
  {en:"vulnerable",uz:"himoyasiz",star:false,example:"Children are vulnerable to online dangers."},
  {en:"widespread",uz:"keng tarqalgan",star:false,example:"The use of social media is widespread."},
];

export default function VocabPage() {
  const [dbWords, setDbWords] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [view, setView] = useState('recent');
  const [search, setSearch] = useState('');
  const [selLetter, setSelLetter] = useState(null);
  const [known, setKnown] = useState(() => JSON.parse(localStorage.getItem('ielts_known')||'[]'));
  const [practiceSource, setPracticeSource] = useState('recent');
  const [practiceMode, setPracticeMode] = useState(null);
  const [fcWords, setFcWords] = useState([]);
  const [fcIdx, setFcIdx] = useState(0);
  const [fcFlipped, setFcFlipped] = useState(false);
  const [qWords, setQWords] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [qScore, setQScore] = useState(0);
  const [qAnswered, setQAnswered] = useState(false);
  const [qSelected, setQSelected] = useState(null);

  useEffect(() => {
    const q = query(collection(db,'words'),orderBy('createdAt','desc'));
    const unsub = onSnapshot(q,snap=>{
      setDbWords(snap.docs.map(d=>({id:d.id,...d.data(),_fromDb:true})));
      setDbLoading(false);
    },()=>setDbLoading(false));
    return unsub;
  },[]);

  const allWords = useMemo(() => {
    const seen = new Set();
    return [...BUILTIN,...dbWords].filter(w=>{ const k=w.en?.toLowerCase(); if(!k||seen.has(k))return false; seen.add(k); return true; });
  },[dbWords]);

  const recentWords = useMemo(() => dbWords.length>0 ? dbWords : [...BUILTIN].reverse(),[dbWords]);
  const saveKnown = k => { setKnown(k); localStorage.setItem('ielts_known',JSON.stringify(k)); };
  const toggleKnown = en => saveKnown(known.includes(en)?known.filter(x=>x!==en):[...known,en]);

  const filteredByLetter = useMemo(() => {
    let list = allWords;
    if(search) list=list.filter(w=>w.en?.toLowerCase().includes(search.toLowerCase())||w.uz?.toLowerCase().includes(search.toLowerCase()));
    if(selLetter) list=list.filter(w=>w.en?.[0]?.toUpperCase()===selLetter);
    return [...list].sort((a,b)=>a.en.localeCompare(b.en));
  },[allWords,search,selLetter]);

  const groupedByLetter = useMemo(() => {
    const g={};
    filteredByLetter.forEach(w=>{ const l=w.en?.[0]?.toUpperCase()||'?'; if(!g[l])g[l]=[]; g[l].push(w); });
    return g;
  },[filteredByLetter]);

  const allLetters = useMemo(() => [...new Set(allWords.map(w=>w.en?.[0]?.toUpperCase()).filter(Boolean))].sort(),[allWords]);
  const practiceWordList = useMemo(() => practiceSource==='recent'?recentWords:allWords,[practiceSource,recentWords,allWords]);

  const startFC = () => { const list=[...practiceWordList].sort(()=>Math.random()-.5); if(!list.length)return; setFcWords(list);setFcIdx(0);setFcFlipped(false);setPracticeMode('fc'); };
  const startQuiz = () => { const list=[...practiceWordList].sort(()=>Math.random()-.5).slice(0,20); if(list.length<4){alert("Kamida 4 ta so'z!");return;} setQWords(list);setQIdx(0);setQScore(0);setQAnswered(false);setQSelected(null);setPracticeMode('quiz'); };
  const nextCard = () => { if(fcIdx+1>=fcWords.length){setPracticeMode(null);return;} setFcIdx(i=>i+1);setFcFlipped(false); };

  const tabBtn = (id,label) => (
    <button onClick={()=>{setView(id);setSelLetter(null);setSearch('');}} style={{ background:view===id?'var(--accent)':'var(--surface)',border:'1px solid '+(view===id?'var(--accent)':'var(--border)'),borderRadius:9,padding:'9px 18px',color:view===id?'#000':'var(--muted)',fontFamily:'Syne',fontWeight:700,fontSize:'0.88rem',cursor:'pointer' }}>{label}</button>
  );

  return (
    <div>
      <div style={{ padding:'12px 20px',borderBottom:'1px solid var(--border)',background:'var(--bg)',display:'flex',gap:8,flexWrap:'wrap',position:'sticky',top:58,zIndex:90,alignItems:'center' }}>
        {tabBtn('recent','🆕 Oxirgi')}
        {tabBtn('letters','🔤 Harflar')}
        {tabBtn('practice','🎯 Mashq')}
        <div style={{ marginLeft:'auto',fontSize:'0.75rem',color:'var(--muted)' }}>
          <strong style={{ color:'var(--accent2)' }}>{allWords.length}</strong> so'z | ✅ <strong style={{ color:'var(--green)' }}>{known.length}</strong>
        </div>
      </div>

      {view==='recent'&&(
        <div style={{ padding:'24px 20px',maxWidth:1200,margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Syne',fontSize:'1.3rem',marginBottom:4 }}>🆕 Yuklangan so'zlar</h2>
          <p style={{ color:'var(--muted)',fontSize:'0.83rem',marginBottom:20 }}>{dbWords.length>0?`${dbWords.length} ta so'z (yangi → eski)`:'Standart so\'zlar'}{dbLoading&&' — yuklanmoqda...'}</p>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:10 }}>
            {recentWords.map((w,i)=><WordCard key={(w.id||w.en)+i} w={w} known={known} onToggle={toggleKnown} highlight />)}
          </div>
        </div>
      )}

      {view==='letters'&&(
        <div>
          <div style={{ padding:'10px 20px',display:'flex',gap:8,flexWrap:'wrap',borderBottom:'1px solid var(--border)',background:'var(--bg)',alignItems:'center' }}>
            <input value={search} onChange={e=>{setSearch(e.target.value);setSelLetter(null);}} placeholder="🔍 Qidirish..."
              style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'7px 12px',color:'var(--text)',fontSize:'0.86rem',outline:'none',width:160 }} />
            <div style={{ display:'flex',gap:3,flexWrap:'wrap' }}>
              <button onClick={()=>setSelLetter(null)} style={{ background:!selLetter?'var(--accent)':'none',border:'none',borderRadius:5,padding:'3px 8px',color:!selLetter?'#000':'var(--muted)',fontFamily:'Syne',fontWeight:700,fontSize:'0.8rem',cursor:'pointer' }}>All</button>
              {allLetters.map(l=><button key={l} onClick={()=>setSelLetter(l===selLetter?null:l)} style={{ background:selLetter===l?'var(--accent)':'none',border:'none',borderRadius:5,padding:'3px 8px',color:selLetter===l?'#000':groupedByLetter[l]?'var(--text)':'var(--border)',fontFamily:'Syne',fontWeight:700,fontSize:'0.86rem',cursor:'pointer' }}>{l}</button>)}
            </div>
          </div>
          <div style={{ padding:'20px',maxWidth:1400,margin:'0 auto' }}>
            {dbLoading&&<div style={{ textAlign:'center',padding:20,color:'var(--muted)' }}>Yuklanmoqda...</div>}
            {Object.keys(groupedByLetter).sort().map(l=>(
              <div key={l} style={{ marginBottom:32 }}>
                <div style={{ fontFamily:'Syne',fontWeight:800,fontSize:'2rem',color:'var(--accent)',borderLeft:'4px solid var(--accent)',paddingLeft:14,marginBottom:14,lineHeight:1 }}>{l}</div>
                <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:9 }}>
                  {groupedByLetter[l].map((w,i)=><WordCard key={(w.id||w.en)+i} w={w} known={known} onToggle={toggleKnown} />)}
                </div>
              </div>
            ))}
            {!Object.keys(groupedByLetter).length&&!dbLoading&&<div style={{ textAlign:'center',padding:60,color:'var(--muted)' }}>Topilmadi 🤷</div>}
          </div>
        </div>
      )}

      {view==='practice'&&(
        <div style={{ padding:'32px 20px',maxWidth:600,margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Syne',fontSize:'1.4rem',marginBottom:6 }}>🎯 Mashq</h2>
          <p style={{ color:'var(--muted)',fontSize:'0.85rem',marginBottom:24 }}>Qaysi so'zlar bo'yicha?</p>
          <div style={{ display:'flex',gap:12,marginBottom:28 }}>
            {[['recent',`🆕 Oxirgi (${recentWords.length})`],['all',`📚 Hammasi (${allWords.length})`]].map(([id,label])=>(
              <button key={id} onClick={()=>setPracticeSource(id)} style={{ flex:1,background:practiceSource===id?'var(--surface2)':'var(--surface)',border:'2px solid '+(practiceSource===id?'var(--accent)':'var(--border)'),borderRadius:12,padding:'14px 10px',color:practiceSource===id?'var(--accent)':'var(--muted)',fontFamily:'Syne',fontWeight:700,fontSize:'0.85rem',cursor:'pointer' }}>{label}</button>
            ))}
          </div>
          <div style={{ display:'grid',gap:12 }}>
            <button onClick={startFC} style={{ background:'linear-gradient(135deg,#0f2820,#1a3828)',border:'1px solid var(--accent2)',borderRadius:14,padding:'20px 22px',textAlign:'left',cursor:'pointer' }}>
              <div style={{ fontFamily:'Syne',fontSize:'1.1rem',color:'var(--accent2)',marginBottom:4 }}>🃏 Flashcard</div>
              <div style={{ color:'var(--muted)',fontSize:'0.82rem' }}>So'zni ko'ring → tarjimasini taxmin qiling</div>
            </button>
            <button onClick={startQuiz} style={{ background:'linear-gradient(135deg,#1a1030,#261848)',border:'1px solid var(--accent3)',borderRadius:14,padding:'20px 22px',textAlign:'left',cursor:'pointer' }}>
              <div style={{ fontFamily:'Syne',fontSize:'1.1rem',color:'var(--accent3)',marginBottom:4 }}>🧠 Test</div>
              <div style={{ color:'var(--muted)',fontSize:'0.82rem' }}>4 variantdan to'g'risini tanlang</div>
            </button>
          </div>
          <button onClick={()=>{if(window.confirm("Reset?"))saveKnown([]);}} style={{ marginTop:20,background:'none',border:'1px solid var(--border)',borderRadius:8,padding:'8px 14px',color:'var(--muted)',fontSize:'0.78rem',cursor:'pointer' }}>🔄 Reset bilganlar</button>
        </div>
      )}

      {practiceMode==='fc'&&fcWords[fcIdx]&&(
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.9)',zIndex:300,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:18,padding:20 }}>
          <div style={{ width:'min(440px,100%)',background:'var(--border)',height:4,borderRadius:2 }}>
            <div style={{ height:'100%',background:'var(--accent)',borderRadius:2,width:`${((fcIdx+1)/fcWords.length)*100}%`,transition:'width .3s' }} />
          </div>
          <div onClick={()=>setFcFlipped(f=>!f)} style={{ background:'var(--surface)',border:'2px solid '+(fcFlipped?'var(--accent2)':'var(--border)'),borderRadius:20,width:'min(440px,100%)',padding:'36px 28px',textAlign:'center',cursor:'pointer' }}>
            <div style={{ fontSize:'0.75rem',color:'var(--muted)',marginBottom:14 }}>{fcIdx+1}/{fcWords.length}</div>
            <div style={{ fontFamily:'Syne',fontSize:'1.9rem',fontWeight:800 }}>{fcWords[fcIdx].star&&'⭐ '}{fcWords[fcIdx].en}</div>
            {fcFlipped&&<>
              <div style={{ fontSize:'1.1rem',color:'var(--accent2)',marginTop:14 }}>{fcWords[fcIdx].uz}</div>
              {fcWords[fcIdx].example&&<div style={{ fontSize:'0.8rem',color:'var(--muted)',marginTop:10,fontStyle:'italic',borderTop:'1px solid var(--border)',paddingTop:10 }}>💬 {fcWords[fcIdx].example}</div>}
            </>}
            {!fcFlipped&&<div style={{ fontSize:'0.75rem',color:'var(--muted)',marginTop:18 }}>👆 Bosing</div>}
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={()=>{if(!known.includes(fcWords[fcIdx].en))saveKnown([...known,fcWords[fcIdx].en]);nextCard();}} style={{ background:'#1a2e1a',border:'1px solid var(--green)',borderRadius:9,padding:'10px 20px',color:'var(--green)',cursor:'pointer' }}>✅ Bildim</button>
            <button onClick={nextCard} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:9,padding:'10px 20px',color:'var(--muted)',cursor:'pointer' }}>⏭ O'tkazish</button>
            <button onClick={()=>setPracticeMode(null)} style={{ background:'#2e1a1a',border:'1px solid var(--red)',borderRadius:9,padding:'10px 16px',color:'var(--red)',cursor:'pointer' }}>✕</button>
          </div>
        </div>
      )}

      {practiceMode==='quiz'&&qWords[qIdx]&&(
        <QuizOverlay w={qWords[qIdx]} idx={qIdx} total={qWords.length} score={qScore} answered={qAnswered} selected={qSelected} allWords={allWords} practiceSource={practiceSource}
          onAnswer={(optUz,correctUz)=>{if(qAnswered)return;setQAnswered(true);setQSelected(optUz);if(optUz===correctUz)setQScore(s=>s+1);}}
          onNext={()=>{if(qIdx+1>=qWords.length){alert(`Test tugadi! 🏆 ${qScore}/${qWords.length}`);setPracticeMode(null);return;}setQIdx(i=>i+1);setQAnswered(false);setQSelected(null);}}
          onClose={()=>setPracticeMode(null)} />
      )}
    </div>
  );
}

function WordCard({w,known,onToggle,highlight}) {
  const isKnown=known.includes(w.en);
  return (
    <div onClick={()=>onToggle(w.en)} style={{ background:w.star?'#1c1a10':highlight?'var(--surface2)':'var(--surface)',border:'1px solid '+(isKnown?'#4ade8033':w.star?'#f59e0b55':highlight?'#5eead433':'var(--border)'),borderRadius:12,padding:'13px 14px',cursor:'pointer',opacity:isKnown?.45:1,transition:'all .2s',position:'relative' }}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
      <div style={{ fontSize:'0.93rem',fontWeight:500 }}>{w.star&&'⭐ '}{w.en}</div>
      <div style={{ fontSize:'0.8rem',color:'var(--accent2)',marginTop:3 }}>{w.uz}</div>
      {w.example&&<div style={{ fontSize:'0.73rem',color:'var(--muted)',marginTop:6,fontStyle:'italic',borderTop:'1px solid var(--border)',paddingTop:5 }}>💬 {w.example}</div>}
      {isKnown&&<span style={{ position:'absolute',top:8,right:8,fontSize:'0.65rem',background:'#1a2e1a',color:'var(--green)',borderRadius:4,padding:'2px 5px' }}>✓</span>}
    </div>
  );
}

function QuizOverlay({w,idx,total,score,answered,selected,allWords,practiceSource,onAnswer,onNext,onClose}) {
  const opts = useMemo(()=>{ const others=allWords.filter(x=>x.uz&&x.uz!==w.uz).sort(()=>Math.random()-.5).slice(0,3); return [...others,w].sort(()=>Math.random()-.5); },[w.en]); // eslint-disable-line
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.9)',zIndex:300,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:14,padding:20 }}>
      <div style={{ background:'var(--surface)',border:'2px solid var(--border)',borderRadius:20,width:'min(480px,100%)',padding:'26px 22px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',fontSize:'0.75rem',color:'var(--muted)',marginBottom:12 }}>
          <span>{idx+1}/{total} · {practiceSource==='recent'?'🆕':'📚'}</span><span>✅ {score}</span>
        </div>
        <div style={{ fontFamily:'Syne',fontSize:'1.8rem',fontWeight:800,marginBottom:4 }}>{w.en}</div>
        {w.example&&<div style={{ fontSize:'0.76rem',color:'var(--muted)',fontStyle:'italic',marginBottom:14 }}>💬 {w.example}</div>}
        <div style={{ fontSize:'0.76rem',color:'var(--muted)',marginBottom:10 }}>To'g'ri tarjimani tanlang:</div>
        <div style={{ display:'grid',gap:8 }}>
          {opts.map((o,i)=>{
            const isCorrect=o.uz===w.uz,isSelected=selected===o.uz;
            let bg='#1c2030',brd='var(--border)',col='var(--text)';
            if(answered){if(isCorrect){bg='#1a2e1a';brd='#4ade80';col='#4ade80';}else if(isSelected){bg='#2e1a1a';brd='#f87171';col='#f87171';}}
            return <button key={i} disabled={answered} onClick={()=>onAnswer(o.uz,w.uz)} style={{ background:bg,border:'1px solid '+brd,borderRadius:9,padding:'11px 13px',textAlign:'left',color:col,fontSize:'0.86rem',cursor:answered?'default':'pointer',fontFamily:'DM Sans' }}>
              {isSelected&&!isCorrect&&'❌ '}{isCorrect&&answered&&'✅ '}{o.uz}
            </button>;
          })}
        </div>
        {answered&&<button onClick={onNext} style={{ marginTop:14,width:'100%',background:'var(--accent)',border:'none',borderRadius:9,padding:'11px',fontFamily:'Syne',fontWeight:700,color:'#000',cursor:'pointer' }}>Keyingisi →</button>}
      </div>
      <button onClick={onClose} style={{ background:'#2e1a1a',border:'1px solid var(--red)',borderRadius:9,padding:'8px 18px',color:'var(--red)',cursor:'pointer' }}>✕ To'xtatish</button>
    </div>
  );
}
