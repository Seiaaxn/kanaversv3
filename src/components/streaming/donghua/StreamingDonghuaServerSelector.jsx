import { useState } from 'react';
import { MonitorPlay, ChevronDown, Share2, Flag, Download, X, Copy, Check, Loader2, ExternalLink } from 'lucide-react';

const AUTH_KEY = 'animeplay_auth';
const REPORTS_KEY = 'animeplay_reports';
const getUser = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; } };
const saveReport = (r) => {
    try {
        const all = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
        all.unshift(r);
        localStorage.setItem(REPORTS_KEY, JSON.stringify(all.slice(0, 200)));
    } catch {}
};

const REPORT_REASONS = [
    { id: 'broken_video', label: '📺 Video tidak bisa diputar', desc: 'Video error, blank, atau tidak load' },
    { id: 'wrong_episode', label: '🔀 Episode salah', desc: 'Episode yang ditampilkan tidak sesuai' },
    { id: 'no_sub', label: '📝 Tidak ada subtitle', desc: 'Subtitle hilang atau tidak muncul' },
    { id: 'bad_quality', label: '🌫️ Kualitas buruk', desc: 'Video buram atau patah-patah' },
    { id: 'wrong_audio', label: '🔊 Audio bermasalah', desc: 'Suara tidak sinkron atau tidak ada' },
    { id: 'other', label: '⚠️ Lainnya', desc: 'Masalah lain' },
];

// Share Sheet
const ShareSheet = ({ onClose, animate, title }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = window.location.href;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).catch(() => {
            const el = document.createElement('textarea');
            el.value = shareUrl; document.body.appendChild(el); el.select();
            document.execCommand('copy'); document.body.removeChild(el);
        });
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const platforms = [
        { label: 'WhatsApp', icon: '💬', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(title + '\n' + shareUrl)}`, '_blank') },
        { label: 'Telegram', icon: '✈️', action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`, '_blank') },
        { label: 'Twitter', icon: '🐦', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, '_blank') },
        { label: 'Facebook', icon: '👥', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank') },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end">
            <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
            <div className={`relative w-full rounded-t-3xl p-5 transition-all duration-300 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                style={{ background: 'var(--surface)', maxHeight: '80vh', overflowY: 'auto' }}>
                <div className="w-10 h-1.5 bg-gray-600 rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2"><Share2 size={18} className="text-primary-400" /><h3 className="text-white font-semibold">Bagikan</h3></div>
                    <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="px-3 py-2.5 rounded-xl mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <p className="text-xs text-gray-400 mb-0.5">Link:</p>
                    <p className="text-xs text-white truncate">{shareUrl}</p>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {platforms.map(p => (
                        <button key={p.label} onClick={p.action} className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                            <span className="text-2xl">{p.icon}</span>
                            <span className="text-[10px] text-gray-400">{p.label}</span>
                        </button>
                    ))}
                </div>
                <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-97 mb-2"
                    style={{ background: copied ? 'rgba(109,250,188,0.15)' : 'rgba(124,109,250,0.15)', color: copied ? '#6dfabc' : '#7c6dfa', border: `1px solid ${copied ? 'rgba(109,250,188,0.3)' : 'rgba(124,109,250,0.3)'}` }}>
                    {copied ? <><Check size={16} /> Link Tersalin!</> : <><Copy size={16} /> Salin Link</>}
                </button>
                {navigator.share && (
                    <button onClick={() => navigator.share({ title, url: shareUrl })} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-97"
                        style={{ background: 'var(--card)', color: 'white', border: '1px solid var(--border)' }}>
                        <Share2 size={16} /> Share via...
                    </button>
                )}
            </div>
        </div>
    );
};

// Report Sheet
const ReportSheet = ({ onClose, animate, donghuaTitle, episodeTitle, episodeUrl }) => {
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const user = getUser();

    const handleSubmit = async () => {
        if (!selected || submitting) return;
        setSubmitting(true);
        saveReport({
            id: Date.now(), reason: selected,
            reasonLabel: REPORT_REASONS.find(r => r.id === selected)?.label,
            detail: detail.trim(), donghuaTitle, episodeTitle, episodeUrl,
            reportedBy: user?.username || 'Guest', userId: user?.id || null,
            createdAt: new Date().toISOString(), status: 'pending',
        });
        await new Promise(r => setTimeout(r, 800));
        setSubmitting(false); setSubmitted(true);
        setTimeout(() => onClose(), 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end">
            <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
            <div className={`relative w-full rounded-t-3xl p-5 transition-all duration-300 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                style={{ background: 'var(--surface)', maxHeight: '85vh', overflowY: 'auto' }}>
                <div className="w-10 h-1.5 bg-gray-600 rounded-full mx-auto mb-5" />
                {submitted ? (
                    <div className="text-center py-8">
                        <div className="text-5xl mb-3">✅</div>
                        <h3 className="text-white font-bold text-lg mb-1">Laporan Terkirim!</h3>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>Terima kasih, kami akan segera menanganinya.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2"><Flag size={18} className="text-red-400" /><h3 className="text-white font-semibold">Laporkan Masalah</h3></div>
                            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
                        </div>
                        {donghuaTitle && (
                            <div className="px-3 py-2 rounded-xl mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                                <p className="text-xs text-white font-medium truncate">{donghuaTitle}</p>
                                {episodeTitle && <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{episodeTitle}</p>}
                            </div>
                        )}
                        <p className="text-xs font-bold mb-3" style={{ color: 'var(--muted)' }}>PILIH JENIS MASALAH</p>
                        <div className="space-y-2 mb-4">
                            {REPORT_REASONS.map(r => (
                                <button key={r.id} onClick={() => setSelected(r.id)} className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                                    style={{ background: selected === r.id ? 'rgba(250,109,109,0.12)' : 'var(--card)', border: `1px solid ${selected === r.id ? 'rgba(250,109,109,0.4)' : 'var(--border)'}` }}>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${selected === r.id ? 'text-red-400' : 'text-white'}`}>{r.label}</p>
                                        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{r.desc}</p>
                                    </div>
                                    {selected === r.id && <Check size={16} className="text-red-400 flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                        <textarea value={detail} onChange={e => setDetail(e.target.value)} placeholder="Detail tambahan (opsional)..." rows={3} maxLength={300}
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none mb-1"
                            style={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
                        <p className="text-[10px] text-right mb-4" style={{ color: 'var(--muted)' }}>{detail.length}/300</p>
                        <button onClick={handleSubmit} disabled={!selected || submitting}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-97 disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg,#fa6d6d,#fa6d9a)' }}>
                            {submitting ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</> : <><Flag size={16} /> Kirim Laporan</>}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

// Main Component
const StreamingDonghuaServerSelector = ({
    streams = [], selectedServer, onServerSelect,
    donghuaTitle = '', episodeTitle = '', episodeUrl = '',
}) => {
    const [serverOpen, setServerOpen] = useState(false);
    const [activeSheet, setActiveSheet] = useState(null);
    const [animate, setAnimate] = useState(false);

    const openSheet = (name) => { setActiveSheet(name); setTimeout(() => setAnimate(true), 10); };
    const closeSheet = () => { setAnimate(false); setTimeout(() => setActiveSheet(null), 300); };

    return (
        <div className="mb-6">
            {/* Server Selector */}
            <div className="flex items-center gap-2 mb-3">
                <MonitorPlay size={18} className="text-primary-400" />
                <h3 className="text-sm font-semibold text-white">Video Server</h3>
            </div>
            <div className="relative mb-4">
                <button onClick={() => setServerOpen(!serverOpen)}
                    className="w-full sm:w-72 flex items-center justify-between px-4 py-3 bg-dark-surface border border-dark-border rounded-xl hover:border-primary-400/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <MonitorPlay size={18} className="text-primary-400" />
                        <span className="text-sm font-medium text-white">{selectedServer?.server || 'Pilih Server'}</span>
                        {selectedServer?.hasAds && <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[10px] font-bold">ADS</span>}
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform ${serverOpen ? 'rotate-180' : ''}`} />
                </button>
                {serverOpen && (
                    <>
                        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setServerOpen(false)} />
                        <div className="absolute top-full left-0 right-0 sm:w-72 mt-2 bg-dark-surface border border-dark-border rounded-xl overflow-hidden z-50 shadow-xl max-h-96 overflow-y-auto">
                            {streams.map((server, idx) => (
                                <button key={idx} onClick={() => { onServerSelect(server); setServerOpen(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-3 hover:bg-dark-card transition-colors ${selectedServer?.url === server.url ? 'bg-primary-400/10 border-l-2 border-primary-400' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <MonitorPlay size={16} className={selectedServer?.url === server.url ? 'text-primary-400' : 'text-gray-500'} />
                                        <span className={`text-sm ${selectedServer?.url === server.url ? 'text-white font-medium' : 'text-gray-400'}`}>{server.server}</span>
                                    </div>
                                    {server.hasAds && <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[10px] font-bold">ADS</span>}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
                <button onClick={() => openSheet('share')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-surface text-gray-400 hover:bg-dark-card hover:text-white transition-all whitespace-nowrap">
                    <Share2 size={16} /><span className="text-sm">Share</span>
                </button>
                <button onClick={() => openSheet('report')} className="flex items-center gap-2 px-4 py-2 rounded-full bg-dark-surface text-gray-400 hover:bg-dark-card hover:text-red-400 transition-all whitespace-nowrap">
                    <Flag size={16} /><span className="text-sm">Report</span>
                </button>
            </div>

            {activeSheet === 'share' && <ShareSheet onClose={closeSheet} animate={animate} title={donghuaTitle + (episodeTitle ? ` - ${episodeTitle}` : '')} />}
            {activeSheet === 'report' && <ReportSheet onClose={closeSheet} animate={animate} donghuaTitle={donghuaTitle} episodeTitle={episodeTitle} episodeUrl={episodeUrl} />}
        </div>
    );
};

export default StreamingDonghuaServerSelector;
