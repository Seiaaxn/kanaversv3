import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Edit2, Check, X, ChevronRight, Camera, Users } from 'lucide-react';
import { getUser, updateUser, getStoredUsers, updateUserById, getLevelInfo, LEVELS, ROLES, getUserBookmarks, getUserHistory, generateLevel } from '../utils/userSystem';

const AUTH_KEY = 'animeplay_auth';

const ProfilePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(getUser);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username||'');
  const [showLogout, setShowLogout] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [editingXP, setEditingXP] = useState(null); // userId
  const [xpInput, setXpInput] = useState('');

  const refreshUser = () => { const u=getUser(); setUser(u); };

  const handleSave = () => {
    if (!editUsername.trim()) return;
    const updated = updateUser({ username: editUsername.trim() });
    if (updated) setUser(updated);
    setEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_KEY);
    setUser(null); setShowLogout(false);
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const updated = updateUser({ avatar: dataUrl, avatarIsFile: true });
      if (updated) setUser(updated);
    };
    reader.readAsDataURL(file);
  };

  const openAdmin = () => { setAllUsers(getStoredUsers()); setShowAdminPanel(true); };

  const handleRoleChange = (userId, newRole) => {
    updateUserById(userId, { role: newRole });
    setAllUsers(getStoredUsers()); refreshUser();
  };

  const handleXPChange = (userId) => {
    const xp = parseInt(xpInput);
    if (isNaN(xp) || xp < 0) return;
    updateUserById(userId, { xp });
    setAllUsers(getStoredUsers()); refreshUser();
    setEditingXP(null); setXpInput('');
  };

  if (!user) {
    return (
      <div className="min-h-screen pb-24 relative overflow-hidden" style={{background:'var(--bg)'}}>
        <header className="sticky top-0 z-40 glass" style={{borderBottom:'1px solid var(--border)'}}>
          <div className="px-4 flex items-center" style={{height:'52px'}}>
            <h1 className="text-sm font-bold text-white">Profil</h1>
          </div>
        </header>
        <div className="flex flex-col items-center px-6 pt-16 pb-10">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-5 text-5xl" style={{background:'var(--card)',border:'2px solid var(--border)'}}>🎌</div>
          <h2 className="text-xl font-black text-white mb-2">Halo, Nakama!</h2>
          <p className="text-sm text-center mb-8 leading-relaxed max-w-xs" style={{color:'var(--muted)'}}>
            Login untuk kumpulkan XP, simpan tontonan, dan jadi bagian komunitas!
          </p>
          <button onClick={()=>navigate('/login')}
            className="w-full max-w-xs flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95"
            style={{background:'linear-gradient(135deg,#7c6dfa,#fa6d9a)',boxShadow:'0 8px 24px rgba(124,109,250,0.3)'}}>
            🚀 Masuk / Daftar
          </button>
        </div>
      </div>
    );
  }

  const xpInfo = getLevelInfo(user.xp||0);
  const levelData = xpInfo.current;
  const role = user.role||'user';
  const roleInfo = ROLES[role]||ROLES.user;
  const bookmarkCount = getUserBookmarks().length;
  const historyCount = getUserHistory().length;

  return (
    <div className="min-h-screen pb-28 relative" style={{background:'var(--bg)'}}>
      <div className="absolute top-0 left-0 right-0 h-48 opacity-20 pointer-events-none"
        style={{background:`radial-gradient(ellipse at 50% -20%,${levelData.color}44,transparent 70%)`}}/>

      <header className="sticky top-0 z-40 glass" style={{borderBottom:'1px solid var(--border)'}}>
        <div className="px-4 flex items-center justify-between" style={{height:'52px'}}>
          <h1 className="text-sm font-bold text-white">Profil</h1>
          <div className="flex items-center gap-2">
            {(role==='admin'||role==='mod')&&(
              <button onClick={openAdmin}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{background:'rgba(124,109,250,0.15)',color:'#7c6dfa'}}>
                <Users size={12}/> Admin
              </button>
            )}
            <button onClick={()=>setShowLogout(true)} className="p-2 rounded-xl hover:bg-white/5">
              <LogOut size={16} style={{color:'var(--muted)'}}/>
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl" style={{background:levelData.gradient}}>
              {user.avatar && user.avatarIsFile ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover"/>
              ) : user.avatar ? (
                <div className="w-full h-full flex items-center justify-center text-5xl">{user.avatar}</div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">🎌</div>
              )}
            </div>
            <button onClick={()=>fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-2xl flex items-center justify-center transition-all active:scale-90"
              style={{background:'var(--card)',border:'2px solid var(--bg)'}}>
              <Camera size={13} style={{color:'var(--muted)'}}/>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile}/>
          </div>

          {editing ? (
            <div className="flex items-center gap-2 mb-2">
              <input value={editUsername} onChange={e=>setEditUsername(e.target.value)}
                className="text-center text-lg font-black text-white bg-transparent outline-none border-b-2 pb-1"
                style={{borderColor:'#7c6dfa',width:'160px'}} autoFocus maxLength={20}/>
              <button onClick={handleSave} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'rgba(109,250,188,0.2)',color:'#6dfabc'}}><Check size={14}/></button>
              <button onClick={()=>setEditing(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'rgba(255,255,255,0.05)',color:'var(--muted)'}}><X size={14}/></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-black text-white">{user.username}</h2>
              <button onClick={()=>{setEditUsername(user.username);setEditing(true);}} style={{color:'var(--muted)'}}><Edit2 size={13}/></button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className={`level-badge ${roleInfo.className}`}>{roleInfo.icon} {roleInfo.label}</span>
            <span className="level-badge" style={{background:levelData.gradient,color:'white'}}>
              Lv.{levelData.level} {levelData.name}
            </span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="p-4 rounded-3xl mb-5" style={{background:'var(--card)',border:'1px solid var(--border)'}}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-white">⚡ {(user.xp||0).toLocaleString()} XP</p>
              <p className="text-[10px] mt-0.5" style={{color:'var(--muted)'}}>
                {xpInfo.next?`${xpInfo.xpInLevel.toLocaleString()} / ${xpInfo.xpToNext.toLocaleString()} XP ke Lv.${xpInfo.next.level}`:'Level Maksimum! 🏆'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold" style={{color:levelData.color}}>{levelData.name}</p>
              {xpInfo.next&&<p className="text-[10px]" style={{color:'var(--muted)'}}>→ Lv.{xpInfo.next.level}</p>}
            </div>
          </div>
          <div className="xp-bar"><div className="xp-fill" style={{width:`${xpInfo.progress}%`}}/></div>
          <div className="flex justify-between mt-2">
            {LEVELS.slice(0,7).map(lv=>(
              <div key={lv.level} className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{background:(user.xp||0)>=lv.minXP?lv.color:'rgba(255,255,255,0.1)'}}/>
                <span className="text-[8px]" style={{color:'var(--muted)'}}>{lv.level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            {icon:'⚡',label:'Total XP',value:(user.xp||0).toLocaleString(),color:'#7c6dfa'},
            {icon:'❤️',label:'My List',value:bookmarkCount,color:'#fa6d9a'},
            {icon:'📺',label:'Ditonton',value:historyCount,color:'#fac96d'},
          ].map(stat=>(
            <div key={stat.label} className="p-3 rounded-2xl text-center" style={{background:'var(--card)',border:'1px solid var(--border)'}}>
              <div className="text-xl mb-1">{stat.icon}</div>
              <p className="text-base font-black" style={{color:stat.color}}>{stat.value}</p>
              <p className="text-[9px] font-medium" style={{color:'var(--muted)'}}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        {[
          {icon:'❤️',label:'My List',path:'/mylist',color:'#fa6d9a'},
          {icon:'📺',label:'History Tontonan',path:'/history',color:'#fac96d'},
        ].map(item=>(
          <button key={item.path} onClick={()=>navigate(item.path)}
            className="w-full flex items-center gap-3 p-4 rounded-2xl mb-2 transition-all active:scale-97"
            style={{background:'var(--card)',border:'1px solid var(--border)'}}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm font-semibold flex-1 text-left text-white">{item.label}</span>
            <ChevronRight size={15} style={{color:'var(--muted)'}}/>
          </button>
        ))}

        <button onClick={()=>setShowLogout(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold mt-4 transition-all active:scale-97"
          style={{border:'1px solid rgba(250,109,154,0.2)',color:'#fa6d9a'}}>
          <LogOut size={15}/> Keluar dari Akun
        </button>
      </div>

      {/* Admin Panel */}
      {showAdminPanel&&(
        <div className="fixed inset-0 z-50 flex flex-col" style={{background:'var(--bg)'}}>
          <div className="flex items-center justify-between px-4 py-3 glass" style={{borderBottom:'1px solid var(--border)'}}>
            <h2 className="text-sm font-bold text-white">👑 Admin Panel</h2>
            <button onClick={()=>setShowAdminPanel(false)} style={{color:'var(--muted)'}}><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-xs font-bold mb-3" style={{color:'var(--muted)'}}>SEMUA PENGGUNA ({allUsers.length})</p>
            {allUsers.map(u=>{
              const uXP=getLevelInfo(u.xp||0);const uRole=u.role||'user';
              return (
                <div key={u.id} className="p-4 rounded-2xl" style={{background:'var(--card)',border:'1px solid var(--border)'}}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0" style={{background:uXP.current.gradient}}>
                      {u.avatar&&u.avatarIsFile?<img src={u.avatar} className="w-full h-full object-cover"/>:
                       u.avatar?<div className="w-full h-full flex items-center justify-center text-xl">{u.avatar}</div>:
                       <div className="w-full h-full flex items-center justify-center text-xl">🎌</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{u.username}</p>
                      <p className="text-[10px] truncate" style={{color:'var(--muted)'}}>{u.email}</p>
                    </div>
                    <span className="level-badge text-[9px]" style={{background:uXP.current.gradient,color:'white'}}>
                      Lv.{uXP.current.level}
                    </span>
                  </div>

                  {/* XP Control */}
                  <div className="mb-3">
                    <p className="text-[10px] font-bold mb-1" style={{color:'var(--muted)'}}>XP: {(u.xp||0).toLocaleString()}</p>
                    {editingXP===u.id ? (
                      <div className="flex gap-2">
                        <input type="number" value={xpInput} onChange={e=>setXpInput(e.target.value)} placeholder="Set XP"
                          className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-2 py-1 text-xs text-white outline-none"/>
                        <button onClick={()=>handleXPChange(u.id)} className="px-2 py-1 rounded-lg text-xs font-bold" style={{background:'rgba(124,109,250,0.3)',color:'#7c6dfa'}}>Set</button>
                        <button onClick={()=>{setEditingXP(null);setXpInput('');}} className="px-2 py-1 rounded-lg text-xs" style={{color:'var(--muted)'}}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={()=>{setEditingXP(u.id);setXpInput(String(u.xp||0));}}
                        className="px-3 py-1 rounded-lg text-xs font-bold" style={{background:'rgba(250,201,109,0.15)',color:'#fac96d'}}>
                        ✏️ Ubah XP
                      </button>
                    )}
                  </div>

                  {u.id!==user.id&&(
                    <div>
                      <p className="text-[10px] font-bold mb-2" style={{color:'var(--muted)'}}>UBAH ROLE</p>
                      <div className="flex gap-2 flex-wrap">
                        {['user','vip','mod','admin'].map(r=>(
                          <button key={r} onClick={()=>handleRoleChange(u.id,r)}
                            className={`level-badge ${ROLES[r].className} text-[10px] transition-all active:scale-95`}
                            style={{opacity:uRole===r?1:0.4}}>
                            {ROLES[r].icon} {ROLES[r].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {u.id===user.id&&<p className="text-[10px] font-medium" style={{color:'var(--muted)'}}>👈 Ini kamu</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Logout Confirm */}
      {showLogout&&(
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4" style={{background:'rgba(0,0,0,0.7)',backdropFilter:'blur(8px)'}}>
          <div className="w-full max-w-sm p-6 rounded-3xl animate-slide-up" style={{background:'var(--surface)',border:'1px solid var(--border)'}}>
            <div className="text-4xl text-center mb-3">👋</div>
            <h3 className="text-base font-black text-white text-center mb-1">Yakin mau keluar?</h3>
            <p className="text-xs text-center mb-5" style={{color:'var(--muted)'}}>XP dan progress kamu tersimpan.</p>
            <div className="flex gap-3">
              <button onClick={()=>setShowLogout(false)} className="flex-1 py-3 rounded-2xl text-sm font-bold" style={{background:'var(--card)',color:'var(--muted)'}}>Batal</button>
              <button onClick={handleLogout} className="flex-1 py-3 rounded-2xl text-sm font-black text-white" style={{background:'linear-gradient(135deg,#fa6d9a,#fa6d6d)'}}>Keluar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
