import { useState, useMemo, useEffect, useRef } from 'react';
import { ThumbsUp, Send, ArrowUpDown, MessageCircle, Reply, X, CornerDownRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLevelInfo, ROLES, getUserById, getStoredUsers, generateLevel } from '../../../utils/userSystem';

const COMMENTS_KEY = 'animeplay_comments';
const AUTH_KEY = 'animeplay_auth';

const getUser = () => {try{return JSON.parse(localStorage.getItem(AUTH_KEY)||'null');}catch{return null;}};

const loadComments = (key) => {
  try {
    const all=JSON.parse(localStorage.getItem(COMMENTS_KEY)||'{}');
    return (all[key]||[]).map(c=>({...c,createdAt:new Date(c.createdAt)}));
  } catch {return [];}
};

const saveComments = (key, comments) => {
  try {
    const all=JSON.parse(localStorage.getItem(COMMENTS_KEY)||'{}');
    all[key]=comments.map(c=>({...c,createdAt:c.createdAt instanceof Date?c.createdAt.toISOString():c.createdAt}));
    localStorage.setItem(COMMENTS_KEY,JSON.stringify(all));
  } catch{}
};

const timeAgo = (date) => {
  const diff=Date.now()-(date instanceof Date?date.getTime():new Date(date).getTime());
  if(isNaN(diff))return '';
  const m=Math.floor(diff/60000);
  if(m<1)return 'Baru saja';if(m<60)return `${m}m lalu`;
  const h=Math.floor(m/60);if(h<24)return `${h}j lalu`;
  return `${Math.floor(h/24)}h lalu`;
};

// Rainbow animated name for admin
const AdminName = ({name}) => {
  const colors=['#ff4444','#ff8800','#ffdd00','#00cc44','#00aaff','#8844ff','#ff44cc'];
  return (
    <span className="font-bold text-xs" style={{display:'inline-flex',gap:'0'}}>
      {name.split('').map((ch,i)=>(
        <span key={i} style={{color:colors[i%colors.length],animation:`rainbow ${colors.length*0.15}s linear ${i*0.15}s infinite`,animationFillMode:'both'}}>
          {ch}
        </span>
      ))}
    </span>
  );
};

// User profile popup
const UserProfileModal = ({userId, onClose}) => {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(()=>{
    const users = getStoredUsers();
    const u = users.find(u=>u.id===userId);
    if (u) {
      setProfile(u);
      try {
        const h=JSON.parse(localStorage.getItem(`animeplay_history_${userId}`)||'[]');
        setHistory(h.slice(0,5));
      } catch {}
    }
  },[userId]);

  if (!profile) return null;
  const xpInfo = getLevelInfo(profile.xp||0);
  const levelData = xpInfo.current;
  const role = profile.role||'user';
  const roleInfo = ROLES[role]||ROLES.user;
  let bookmarks=[];
  try{bookmarks=JSON.parse(localStorage.getItem(`animeplay_bookmarks_${userId}`)||'[]');}catch{}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}} onClick={onClose}>
      <div className="w-full max-w-sm p-5 rounded-3xl animate-fade-in" style={{background:'var(--surface)',border:'1px solid var(--border)'}} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-white">Profil User</p>
          <button onClick={onClose} style={{color:'var(--muted)'}}><X size={16}/></button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0" style={{background:levelData.gradient}}>
            {profile.avatar&&profile.avatarIsFile?<img src={profile.avatar} className="w-full h-full object-cover"/>:
             profile.avatar?<div className="w-full h-full flex items-center justify-center text-3xl">{profile.avatar}</div>:
             <div className="w-full h-full flex items-center justify-center text-3xl">🎌</div>}
          </div>
          <div>
            <p className="font-bold text-white text-base">{profile.username}</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className={`level-badge ${roleInfo.className} text-[10px]`}>{roleInfo.icon} {roleInfo.label}</span>
              <span className="level-badge text-[10px]" style={{background:levelData.gradient,color:'white'}}>Lv.{levelData.level} {levelData.name}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            {label:'Total XP',value:(profile.xp||0).toLocaleString(),color:'#7c6dfa'},
            {label:'My List',value:bookmarks.length,color:'#fa6d9a'},
            {label:'Ditonton',value:history.length,color:'#fac96d'},
          ].map(s=>(
            <div key={s.label} className="p-2 rounded-xl text-center" style={{background:'var(--card)'}}>
              <p className="text-sm font-black" style={{color:s.color}}>{s.value}</p>
              <p className="text-[9px]" style={{color:'var(--muted)'}}>{s.label}</p>
            </div>
          ))}
        </div>
        {history.length>0&&(
          <div>
            <p className="text-[10px] font-bold mb-2" style={{color:'var(--muted)'}}>HISTORY TERBARU</p>
            <div className="space-y-1.5">
              {history.map((h,i)=>(
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{background:'var(--card)'}}>
                  {h.image&&<img src={h.image} className="w-8 h-8 rounded object-cover flex-shrink-0"/>}
                  <div className="min-w-0">
                    <p className="text-xs text-white truncate">{h.title}</p>
                    <p className="text-[9px]" style={{color:'var(--muted)'}}>{h.episodeTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CommentItem = ({c, user, allComments, onLike, onReply, depth=0}) => {
  const role = c.role||'user';
  const roleInfo = ROLES[role]||ROLES.user;
  const isAdmin = role==='admin';
  const isMod = role==='mod';
  const [showProfile, setShowProfile] = useState(false);

  const replies = allComments.filter(r=>r.parentId===c.id);

  return (
    <>
      {showProfile&&c.userId&&<UserProfileModal userId={c.userId} onClose={()=>setShowProfile(false)}/>}
      <div className={`flex gap-2.5 ${depth>0?'ml-8 mt-2':'mt-0'}`}>
        {/* Avatar */}
        <button onClick={()=>c.userId&&setShowProfile(true)} className="flex-shrink-0">
          <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold"
            style={{background:isAdmin?'linear-gradient(135deg,#7c6dfa,#fa6d9a)':isMod?'linear-gradient(135deg,#6dfabc,#6daefa)':'var(--card)',color:'white'}}>
            {c.avatarFile?<img src={c.avatarFile} className="w-full h-full object-cover"/>:
             c.avatar?c.avatar:
             (c.name?.charAt(0)||'?').toUpperCase()}
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            {isAdmin ? <AdminName name={c.name}/> :
             isMod ? <span className="text-xs font-bold" style={{color:'#6dfabc'}}>{c.name}</span> :
             <span className="text-xs font-bold text-white">{c.name}</span>}

            {(isAdmin||isMod)&&(
              <span className={`level-badge ${roleInfo.className} text-[8px] py-0`}>{roleInfo.icon} {roleInfo.label}</span>
            )}
            <span className="text-[9px]" style={{color:'var(--muted)'}}>{timeAgo(c.createdAt)}</span>
          </div>

          {c.replyTo&&<p className="text-[10px] mb-0.5" style={{color:'var(--muted)'}}>↩ {c.replyTo}</p>}
          <p className="text-xs leading-relaxed" style={{color:'var(--text,#ddd)'}}>{c.comment}</p>

          <div className="flex items-center gap-3 mt-1">
            <button onClick={()=>onLike(c.id)}
              className={`flex items-center gap-1 text-[10px] transition-colors ${user&&(c.likedBy||[]).includes(user.id)?'text-primary-400':'text-gray-600 hover:text-gray-400'}`}>
              <ThumbsUp size={11}/>{c.likes>0&&c.likes}
            </button>
            {depth===0&&(
              <button onClick={()=>onReply(c)} className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors">
                <Reply size={11}/>Reply
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Replies */}
      {replies.map(r=>(
        <CommentItem key={r.id} c={r} user={user} allComments={allComments} onLike={onLike} onReply={onReply} depth={depth+1}/>
      ))}
    </>
  );
};

const StreamingDonghuaCommentsSection = ({episodeUrl}) => {
  const navigate = useNavigate();
  const user = getUser();
  const episodeKey = episodeUrl||'default';
  const [comments, setComments] = useState(()=>loadComments(episodeKey));
  const [newComment, setNewComment] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [replyTo, setReplyTo] = useState(null); // {id, name}

  const topLevelComments = useMemo(()=>[...comments.filter(c=>!c.parentId)].sort((a,b)=>
    sortNewest?new Date(b.createdAt)-new Date(a.createdAt):new Date(a.createdAt)-new Date(b.createdAt)
  ),[comments,sortNewest]);

  const handleAdd = () => {
    if (!newComment.trim()||!user) return;
    const avatarData = user.avatarIsFile?user.avatar:null;
    const comment = {
      id:Date.now(),
      name:user.username||'User',
      userId:user.id,
      role:user.role||'user',
      avatar:!user.avatarIsFile?user.avatar:null,
      avatarFile:avatarData,
      comment:newComment.trim(),
      createdAt:new Date(),
      likes:0,likedBy:[],
      parentId:replyTo?.id||null,
      replyTo:replyTo?.name||null,
    };
    const updated=[comment,...comments];
    setComments(updated);saveComments(episodeKey,updated);
    setNewComment('');setReplyTo(null);
  };

  const handleLike = (id) => {
    if (!user) return;
    const updated=comments.map(c=>{
      if(c.id!==id)return c;
      const likedBy=c.likedBy||[];const already=likedBy.includes(user.id);
      return {...c,likes:already?c.likes-1:c.likes+1,likedBy:already?likedBy.filter(u=>u!==user.id):[...likedBy,user.id]};
    });
    setComments(updated);saveComments(episodeKey,updated);
  };

  return (
    <div className="mb-8 mt-4">
      <style>{`@keyframes rainbow{0%,100%{filter:hue-rotate(0deg)}50%{filter:hue-rotate(180deg)}}`}</style>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-gray-500"/>
          <h3 className="text-sm font-semibold text-white">
            Comments {comments.length>0&&<span className="text-gray-500 font-normal">({comments.length})</span>}
          </h3>
        </div>
        {comments.length>0&&(
          <button onClick={()=>setSortNewest(!sortNewest)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowUpDown size={13}/>{sortNewest?'Newest':'Oldest'}
          </button>
        )}
      </div>

      {user ? (
        <div className="mb-5">
          {replyTo&&(
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg" style={{background:'rgba(124,109,250,0.1)'}}>
              <CornerDownRight size={12} className="text-primary-400"/>
              <span className="text-xs text-gray-400">Balas <span className="text-primary-400 font-bold">{replyTo.name}</span></span>
              <button onClick={()=>setReplyTo(null)} className="ml-auto text-gray-500 hover:text-white"><X size={12}/></button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{background:user.role==='admin'?'linear-gradient(135deg,#7c6dfa,#fa6d9a)':user.role==='mod'?'linear-gradient(135deg,#6dfabc,#6daefa)':'rgba(124,109,250,0.2)'}}>
              {user.avatarIsFile&&user.avatar?<img src={user.avatar} className="w-full h-full object-cover"/>:
               user.avatar?<span className="text-sm">{user.avatar}</span>:
               <span className="text-xs font-bold text-primary-400">{user.username?.charAt(0)?.toUpperCase()||'?'}</span>}
            </div>
            <div className="flex-1 flex items-center gap-2 bg-dark-card border border-white/8 rounded-xl px-3 py-2 focus-within:border-white/15 transition-colors">
              <input value={newComment} onChange={e=>setNewComment(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handleAdd()}
                placeholder={replyTo?`Balas ${replyTo.name}...`:"Tulis komentar..."}
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"/>
              <button onClick={handleAdd} disabled={!newComment.trim()}
                className="p-1.5 rounded-lg bg-primary-400 text-black hover:bg-primary-300 transition-colors disabled:opacity-30 flex-shrink-0">
                <Send size={13}/>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={()=>navigate('/login')}
          className="w-full flex items-center justify-center gap-2 bg-dark-card border border-white/8 rounded-xl py-3 text-sm text-gray-400 hover:border-white/15 mb-5 transition-all">
          <MessageCircle size={15}/> Login untuk berkomentar
        </button>
      )}

      {topLevelComments.length===0 ? (
        <div className="text-center py-8">
          <MessageCircle size={28} className="text-gray-800 mx-auto mb-2"/>
          <p className="text-xs text-gray-600">Belum ada komentar. Jadilah yang pertama!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topLevelComments.map(c=>(
            <CommentItem key={c.id} c={c} user={user} allComments={comments} onLike={handleLike} onReply={(c)=>setReplyTo({id:c.id,name:c.name})}/>
          ))}
        </div>
      )}
    </div>
  );
};

export default StreamingDonghuaCommentsSection;
