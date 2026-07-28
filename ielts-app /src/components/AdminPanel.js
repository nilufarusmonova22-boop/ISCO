import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

const SECTIONS=['writing','speaking','reading','listening'];
const SECTION_LABELS={writing:'✍️ Writing',speaking:'🎤 Speaking',reading:'📖 Reading',listening:'🎧 Listening'};
const SECTION_COLORS={writing:'#f59e0b',speaking:'#ec4899',reading:'#3b82f6',listening:'#10b981'};

function parseWords(text){
  const lines=text.split('\n').map(l=>l.trim()).filter(Boolean);
  const words=[];
  for(const line of lines){
    let star=false,clean=line;
    if(clean.startsWith('*')){star=true;clean=clean.slice(1).trim();}
    const sep=clean.includes('—')?'—':clean.includes('-')?'-':clean.includes(':')?':':null;
    if(!sep)continue;
    const idx=clean.indexOf(sep);
    const en=clean.slice(0,idx).trim();
    const uz=clean.slice(idx+sep.length).trim();
    if(en&&uz)words.push({en,uz,letter:en[0]?.toUpperCase()||'A',star});
  }
  return words;
}

export default function AdminPanel({onClose}){
  const [tab,setTab]=useState('words');
  const [wordText,setWordText]=useState('');
  const [wordLoading,setWordLoading]=useState(false);
  const [wordMsg,setWordMsg]=useState('');
  const [dbWords,setDbWords]=useState([]);
  const [deleteSearch,setDeleteSearch]=useState('');
  const [storySection,setStorySection]=useState('writing');
  const [storyScore,setStoryScore]=useState('');
  const [storyDate,setStoryDate]=useState('');
  const [storyNote,setStoryNote]=useState('');
  const [storyImg,setStoryImg]=useState(null);
  const [storyLoading,setStoryLoading]=useState(false);
  const [storyMsg,setStoryMsg]=useState('');
  const [listenTitle,setListenTitle]=useState('');
  const [listenDesc,setListenDesc]=useState('');
  const [listenDate,setListenDate]=useState('');
  const [listenFile,setListenFile]=useState(null);
  const [listenLoading,setListenLoading]=useState(false);
  const [listenMsg,setListenMsg]=useState('');

  useEffect(()=>{
    const q=query(collection(db,'words'),orderBy('createdAt','asc'));
    const unsub=onSnapshot(q,snap=>{setDbWords(snap.docs.map(d=>({id:d.id,...d.data()})));},()=>{});
    return unsub;
  },[]);

  const uploadWords=async()=>{
    const words=parseWords(wordText);
    if(!words.length){setWordMsg("❌ Format: inglizcha — o'zbekcha");return;}
    setWordLoading(true);setWordMsg('');
    try{for(const w of words)await addDoc(collection(db,'words'),{...w,createdAt:serverTimestamp()});setWordMsg(`✅ ${words.length} ta so'z!`);setWordText('');}
    catch(e){setWordMsg('❌ '+e.message);}
    setWordLoading(false);
  };

  const deleteWord=async(id,en)=>{if(!window.confirm(`"${en}" o'chirilsinmi?`))return;await deleteDoc(doc(db,'words',id));};
  const deleteAllWords=async()=>{if(!window.confirm(`Barcha ${dbWords.length} ta so'z?`))return;for(const w of dbWords)await deleteDoc(doc(db,'words',w.id));};

  const uploadStory=async()=>{
    if(!storyScore||!storyDate){setStoryMsg('❌ Ball va sana!');return;}
    setStoryLoading(true);setStoryMsg('');
    try{
      let imgUrl=null;
      if(storyImg){imgUrl=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(storyImg);});}
      await addDoc(collection(db,'story'),{section:storySection,score:storyScore,date:storyDate,note:storyNote,imgUrl,createdAt:serverTimestamp()});
      setStoryMsg('✅ Saqlandi!');setStoryScore('');setStoryDate('');setStoryNote('');setStoryImg(null);
    }catch(e){setStoryMsg('❌ '+e.message);}
    setStoryLoading(false);
  };

  const uploadListening=async()=>{
    if(!listenTitle||!listenFile){setListenMsg('❌ Sarlavha va HTML fayl!');return;}
    if(listenFile.size>900000){setListenMsg('❌ Fayl 900KB dan kichik bo\'lsin!');return;}
    setListenLoading(true);setListenMsg('');
    try{
      const htmlContent=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsText(listenFile,'UTF-8');});
      await addDoc(collection(db,'listening_tests'),{title:listenTitle,description:listenDesc,date:listenDate,htmlContent,fileName:listenFile.name,createdAt:serverTimestamp()});
      setListenMsg('✅ Test yuklandi!');setListenTitle('');setListenDesc('');setListenDate('');setListenFile(null);
    }catch(e){setListenMsg('❌ '+e.message);}
    setListenLoading(false);
  };

  const filteredWords=dbWords.filter(w=>!deleteSearch||w.en?.toLowerCase().includes(deleteSearch.toLowerCase())||w.uz?.toLowerCase().includes(deleteSearch.toLowerCase()));

  const tabBtn=(id,label)=>(
    <button onClick={()=>setTab(id)} style={{background:tab===id?'var(--accent)':'var(--surface2)',border:'1px solid '+(tab===id?'var(--accent)':'var(--border)'),borderRadius:8,padding:'7px 11px',color:tab===id?'#000':'var(--muted)',fontFamily:'Syne',fontWeight:700,fontSize:'0.76rem',cursor:'pointer'}}>{label}</button>
  );

  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.85)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:18,width:'min(640px,100%)',maxHeight:'92vh',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h2 style={{fontFamily:'Syne',fontSize:'1rem'}}>⚙️ Admin Panel</h2>
          <button onClick={onClose} style={{background:'none',border:'1px solid var(--border)',borderRadius:8,padding:'4px 10px',color:'var(--muted)',fontSize:'0.82rem',cursor:'pointer'}}>✕</button>
        </div>
        <div style={{padding:'10px 20px',borderBottom:'1px solid var(--border)',display:'flex',gap:5,flexWrap:'wrap'}}>
          {tabBtn('words',"📚 So'zlar")}
          {tabBtn('delete',`🗑 O'chir (${dbWords.length})`)}
          {tabBtn('story','🏆 Natija')}
          {tabBtn('listening','🎧 Listening')}
        </div>
        <div style={{padding:'18px 20px',overflowY:'auto',flex:1}}>

          {tab==='words'&&(
            <div>
              <p style={{color:'var(--muted)',fontSize:'0.8rem',marginBottom:10}}>Har qatorda: <code style={{color:'var(--accent2)',background:'var(--surface2)',padding:'1px 5px',borderRadius:4}}>inglizcha — o'zbekcha</code> · ⭐ uchun <code style={{color:'var(--accent)'}}>*</code></p>
              <textarea value={wordText} onChange={e=>setWordText(e.target.value)} rows={10} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:9,padding:'11px 13px',color:'var(--text)',fontSize:'0.88rem',resize:'vertical',outline:'none',fontFamily:'DM Sans',lineHeight:1.6}} />
              <div style={{display:'flex',alignItems:'center',gap:10,marginTop:10}}>
                <button onClick={uploadWords} disabled={wordLoading} style={{background:'var(--accent)',border:'none',borderRadius:9,padding:'9px 22px',color:'#000',fontFamily:'Syne',fontWeight:700,cursor:'pointer',opacity:wordLoading?0.6:1}}>{wordLoading?'...':'⬆️ Yuklash'}</button>
                {wordMsg&&<span style={{fontSize:'0.83rem',color:wordMsg.startsWith('✅')?'var(--green)':'var(--red)'}}>{wordMsg}</span>}
              </div>
            </div>
          )}

          {tab==='delete'&&(
            <div>
              <div style={{display:'flex',gap:8,marginBottom:12,alignItems:'center'}}>
                <input value={deleteSearch} onChange={e=>setDeleteSearch(e.target.value)} placeholder="🔍 Qidirish..." style={{flex:1,background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'7px 11px',color:'var(--text)',fontSize:'0.86rem',outline:'none'}}/>
                {dbWords.length>0&&<button onClick={deleteAllWords} style={{background:'#2e1a1a',border:'1px solid var(--red)',borderRadius:8,padding:'7px 11px',color:'var(--red)',fontSize:'0.76rem',cursor:'pointer',whiteSpace:'nowrap'}}>🗑 Hammasi</button>}
              </div>
              {filteredWords.length===0&&<div style={{textAlign:'center',padding:30,color:'var(--muted)'}}>{dbWords.length===0?"So'z yo'q":'Topilmadi'}</div>}
              <div style={{display:'flex',flexDirection:'column',gap:5}}>
                {filteredWords.map(w=>(
                  <div key={w.id} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                    <div><span style={{fontWeight:500,fontSize:'0.88rem'}}>{w.star&&'⭐ '}{w.en}</span><span style={{color:'var(--accent2)',fontSize:'0.8rem',marginLeft:8}}>{w.uz}</span></div>
                    <button onClick={()=>deleteWord(w.id,w.en)} style={{background:'none',border:'1px solid #f8717155',borderRadius:5,padding:'3px 8px',color:'var(--red)',fontSize:'0.75rem',cursor:'pointer',flexShrink:0}}>🗑</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='story'&&(
            <div>
              <div style={{display:'flex',gap:6,marginBottom:14,flexWrap:'wrap'}}>
                {SECTIONS.map(s=><button key={s} onClick={()=>setStorySection(s)} style={{background:storySection===s?SECTION_COLORS[s]+'22':'var(--surface2)',border:'1px solid '+(storySection===s?SECTION_COLORS[s]:'var(--border)'),borderRadius:7,padding:'6px 11px',color:storySection===s?SECTION_COLORS[s]:'var(--muted)',fontSize:'0.82rem',cursor:'pointer'}}>{SECTION_LABELS[s]}</button>)}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                <div><label style={{fontSize:'0.76rem',color:'var(--muted)',display:'block',marginBottom:5}}>Ball</label><input type="text" value={storyScore} onChange={e=>setStoryScore(e.target.value)} placeholder="6.5" style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 11px',color:'var(--text)',fontSize:'0.88rem',outline:'none'}}/></div>
                <div><label style={{fontSize:'0.76rem',color:'var(--muted)',display:'block',marginBottom:5}}>Sana</label><input type="date" value={storyDate} onChange={e=>setStoryDate(e.target.value)} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 11px',color:'var(--text)',fontSize:'0.88rem',outline:'none'}}/></div>
              </div>
              <div style={{marginBottom:10}}><label style={{fontSize:'0.76rem',color:'var(--muted)',display:'block',marginBottom:5}}>Izoh</label><textarea value={storyNote} onChange={e=>setStoryNote(e.target.value)} rows={3} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 11px',color:'var(--text)',fontSize:'0.86rem',resize:'none',outline:'none',fontFamily:'DM Sans'}}/></div>
              <div style={{marginBottom:14}}><label style={{fontSize:'0.76rem',color:'var(--muted)',display:'block',marginBottom:5}}>Rasm</label><input type="file" accept="image/*" onChange={e=>setStoryImg(e.target.files[0])} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'7px 11px',color:'var(--text)',fontSize:'0.83rem',width:'100%'}}/></div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button onClick={uploadStory} disabled={storyLoading} style={{background:SECTION_COLORS[storySection],border:'none',borderRadius:9,padding:'9px 22px',color:'#000',fontFamily:'Syne',fontWeight:700,cursor:'pointer',opacity:storyLoading?0.6:1}}>{storyLoading?'...':'💾 Saqlash'}</button>
                {storyMsg&&<span style={{fontSize:'0.83rem',color:storyMsg.startsWith('✅')?'var(--green)':'var(--red)'}}>{storyMsg}</span>}
              </div>
            </div>
          )}

          {tab==='listening'&&(
            <div>
              <p style={{color:'var(--muted)',fontSize:'0.8rem',marginBottom:14}}>HTML listening test faylini yuklang (max 900KB)</p>
              <div style={{marginBottom:10}}><label style={{fontSize:'0.76rem',color:'var(--muted)',display:'block',marginBottom:5}}>Test nomi *</label><input type="text" value={listenTitle} onChange={e=>setListenTitle(e.target.value)} placeholder="CDI Listening Test 1" style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 11px',color:'var(--text)',fontSize:'0.88rem',outline:'none'}}/></div>
              <div style={{marginBottom:10}}><label style={{fontSize:'0.76rem',color:'var(--muted)',display:'block',marginBottom:5}}>Tavsif</label><input type="text" value={listenDesc} onChange={e=>setListenDesc(e.target.value)} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 11px',color:'var(--text)',fontSize:'0.88rem',outline:'none'}}/></div>
              <div style={{marginBottom:10}}><label style={{fontSize:'0.76rem',color:'var(--muted)',display:'block',marginBottom:5}}>Sana</label><input type="date" value={listenDate} onChange={e=>setListenDate(e.target.value)} style={{width:'100%',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 11px',color:'var(--text)',fontSize:'0.88rem',outline:'none'}}/></div>
              <div style={{marginBottom:16}}><label style={{fontSize:'0.76rem',color:'var(--muted)',display:'block',marginBottom:5}}>HTML fayl *</label>
                <input type="file" accept=".html,.htm" onChange={e=>setListenFile(e.target.files[0])} style={{background:'var(--surface2)',border:'1px solid #10b98155',borderRadius:8,padding:'7px 11px',color:'var(--text)',fontSize:'0.83rem',width:'100%'}}/>
                {listenFile&&<p style={{fontSize:'0.73rem',color:'var(--accent2)',marginTop:4}}>📄 {listenFile.name} — {(listenFile.size/1024).toFixed(0)}KB{listenFile.size>900000&&<span style={{color:'var(--red)'}}> ⚠️ Juda katta!</span>}</p>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <button onClick={uploadListening} disabled={listenLoading||!listenTitle||!listenFile} style={{background:'#10b981',border:'none',borderRadius:9,padding:'9px 22px',color:'#000',fontFamily:'Syne',fontWeight:700,cursor:'pointer',opacity:(listenLoading||!listenTitle||!listenFile)?0.5:1}}>{listenLoading?'...':'⬆️ Yuklash'}</button>
                {listenMsg&&<span style={{fontSize:'0.83rem',color:listenMsg.startsWith('✅')?'var(--green)':'var(--red)'}}>{listenMsg}</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
