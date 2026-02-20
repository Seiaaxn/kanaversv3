import { useState, useEffect } from "react";
import {
    ThumbsUp, ThumbsDown, Download, Share2, Flag,
    MonitorPlay, X, ExternalLink, Copy, Check,
    MessageSquareWarning, Loader2
} from "lucide-react";

const AUTH_KEY = 'animeplay_auth';
const REPORTS_KEY = 'animeplay_reports';

const getUser = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; } };

const saveReport = (report) => {
    try {
        const all = JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
        all.unshift(report);
        localStorage.setItem(REPORTS_KEY, JSON.stringify(all.slice(0, 200)));
    } catch {}
};

const ShareSheet = ({ onClose, title, url, animate }) => {
    const [copied, setCopied] = useState(false);
    const shareUrl = url || window.location.href;
    const shareTitle = title || document.title;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            const el = document.createElement('textarea');
            el.value = shareUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleNativeShare = () => {
        if (navigator.share) {
            navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {});
        }
    };

    const shareOptions = [
        { label: 'WhatsApp', icon: '💬', color: '#25d366', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareTitle + '\n' + shareUrl)}`, '_blank') },
        { label: 'Telegram', icon: '✈️', color: '#0088cc', action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank') },
        { label: 'Twitter / X', icon: '🐦', color: '#1da1f2', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank') },
        { label: 'Facebook', icon: '👥', color: '#1877f2', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank') },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end">
            <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
            <div className={`relative w-full rounded-t-3xl p-5 transition-all duration-300 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                style={{ background: 'var(--surface)', maxHeight: '80vh', overflowY: 'auto' }}>
                <div className="w-10 h-1.5 bg-gray-600 rounded-full mx-auto mb-5" />
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Share2 size={18} className="text-primary-400" />
                        <h3 className="text-white font-semibold">Bagikan</h3>
                    </div>
                    <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="px-3 py-2.5 rounded-xl mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <p className="text-xs text-gray-400 mb-0.5">Link yang dibagikan:</p>
                    <p className="text-xs text-white truncate">{shareUrl}</p>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {shareOptions.map(opt => (
                        <button key={opt.label} onClick={opt.action}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all active:scale-95"
                            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                            <span className="text-2xl">{opt.icon}</span>
                            <span className="text-[10px] text-gray-400">{opt.label}</span>
                        </button>
                    ))}
                </div>
                <button onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-97 mb-2"
                    style={{ background: copied ? 'rgba(109,250,188,0.15)' : 'rgba(124,109,250,0.15)', color: copied ? '#6dfabc' : '#7c6dfa', border: `1px solid ${copied ? 'rgba(109,250,188,0.3)' : 'rgba(124,109,250,0.3)'}` }}>
                    {copied ? <><Check size={16} /> Link Tersalin!</> : <><Copy size={16} /> Salin Link</>}
                </button>
                {navigator.share && (
                    <button onClick={handleNativeShare}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-97"
                        style={{ background: 'var(--card)', color: 'white', border: '1px solid var(--border)' }}>
                        <Share2 size={16} /> Share via...
                    </button>
                )}
            </div>
        </div>
    );
};

const REPORT_REASONS = [
    { id: 'broken_video', label: '📺 Video tidak bisa diputar', desc: 'Video error, blank, atau tidak load' },
    { id: 'wrong_episode', label: '🔀 Episode salah', desc: 'Episode yang ditampilkan tidak sesuai' },
    { id: 'no_sub', label: '📝 Tidak ada subtitle', desc: 'Subtitle hilang atau tidak muncul' },
    { id: 'bad_quality', label: '🌫️ Kualitas buruk', desc: 'Video buram, patah-patah, atau lagging' },
    { id: 'wrong_audio', label: '🔊 Audio bermasalah', desc: 'Suara tidak sinkron atau tidak ada' },
    { id: 'other', label: '⚠️ Lainnya', desc: 'Masalah lain yang tidak tercantum' },
];

const ReportSheet = ({ onClose, animate, episodeTitle, animeTitle, episodeUrl }) => {
    const [selectedReason, setSelectedReason] = useState(null);
    const [detail, setDetail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const user = getUser();

    const handleSubmit = async () => {
        if (!selectedReason || submitting) return;
        setSubmitting(true);
        const report = {
            id: Date.now(),
            reason: selectedReason,
            reasonLabel: REPORT_REASONS.find(r => r.id === selectedReason)?.label || selectedReason,
            detail: detail.trim(),
            episodeTitle, animeTitle, episodeUrl,
            reportedBy: user ? user.username : 'Guest',
            userId: user?.id || null,
            createdAt: new Date().toISOString(),
            status: 'pending',
        };
        saveReport(report);
        await new Promise(r => setTimeout(r, 800));
        setSubmitting(false);
        setSubmitted(true);
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
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>Terima kasih, kami akan segera menangani masalah ini.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Flag size={18} className="text-red-400" />
                                <h3 className="text-white font-semibold">Laporkan Masalah</h3>
                            </div>
                            <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
                        </div>
                        {(animeTitle || episodeTitle) && (
                            <div className="px-3 py-2 rounded-xl mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                                <p className="text-xs text-white font-medium truncate">{animeTitle}</p>
                                {episodeTitle && <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{episodeTitle}</p>}
                            </div>
                        )}
                        <p className="text-xs font-bold mb-3" style={{ color: 'var(--muted)' }}>PILIH JENIS MASALAH</p>
                        <div className="space-y-2 mb-4">
                            {REPORT_REASONS.map(r => (
                                <button key={r.id} onClick={() => setSelectedReason(r.id)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                                    style={{
                                        background: selectedReason === r.id ? 'rgba(250,109,109,0.12)' : 'var(--card)',
                                        border: `1px solid ${selectedReason === r.id ? 'rgba(250,109,109,0.4)' : 'var(--border)'}`,
                                    }}>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${selectedReason === r.id ? 'text-red-400' : 'text-white'}`}>{r.label}</p>
                                        <p className="text-[10px]" style={{ color: 'var(--muted)' }}>{r.desc}</p>
                                    </div>
                                    {selectedReason === r.id && <Check size={16} className="text-red-400 flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                        <div className="mb-4">
                            <p className="text-xs font-bold mb-2" style={{ color: 'var(--muted)' }}>DETAIL TAMBAHAN (opsional)</p>
                            <textarea value={detail} onChange={e => setDetail(e.target.value)}
                                placeholder="Deskripsikan masalahnya lebih detail..."
                                rows={3} maxLength={300}
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none resize-none"
                                style={{ background: 'var(--card)', border: '1px solid var(--border)' }} />
                            <p className="text-[10px] text-right mt-1" style={{ color: 'var(--muted)' }}>{detail.length}/300</p>
                        </div>
                        <button onClick={handleSubmit} disabled={!selectedReason || submitting}
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

const StreamingAnimeActionBar = ({
    streams = [],
    selectedServer,
    onServerSelect,
    downloads = [],
    animeTitle = '',
    episodeTitle = '',
    episodeUrl = '',
}) => {
    const [activeSheet, setActiveSheet] = useState(null);
    const [liked, setLiked] = useState(false);
    const [disliked, setDisliked] = useState(false);
    const [animate, setAnimate] = useState(false);

    const openSheet = (name) => {
        setActiveSheet(name);
        setTimeout(() => setAnimate(true), 10);
    };

    const closeSheet = () => {
        setAnimate(false);
        setTimeout(() => setActiveSheet(null), 300);
    };

    return (
        <>
            <div className="mb-6 overflow-x-auto hide-scrollbar">
                <div className="flex items-center gap-3 min-w-max">
                    <ActionButton icon={<ThumbsUp size={18} />} label="Like" active={liked}
                        onClick={() => { setLiked(!liked); if (disliked) setDisliked(false); }} />
                    <ActionButton icon={<ThumbsDown size={18} />} label="Dislike" active={disliked}
                        onClick={() => { setDisliked(!disliked); if (liked) setLiked(false); }} />
                    <ActionButton icon={<MonitorPlay size={18} />} label={selectedServer?.server || 'Quality'}
                        onClick={() => openSheet('quality')} />
                    <ActionButton icon={<Download size={18} />} label="Download"
                        onClick={() => openSheet('download')} />
                    <ActionButton icon={<Share2 size={18} />} label="Share"
                        onClick={() => openSheet('share')} />
                    <ActionButton icon={<Flag size={18} />} label="Report"
                        onClick={() => openSheet('report')} />
                </div>
            </div>

            {activeSheet === 'quality' && (
                <div className="fixed inset-0 z-50 flex items-end">
                    <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`} onClick={closeSheet} />
                    <div className={`relative w-full rounded-t-3xl p-5 max-h-[75vh] overflow-y-auto transition-all duration-300 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                        style={{ background: 'var(--surface)' }}>
                        <div className="w-10 h-1.5 bg-gray-600 rounded-full mx-auto mb-5" />
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">Pilih Server</h3>
                            <button onClick={closeSheet}><X size={20} className="text-gray-400" /></button>
                        </div>
                        {streams.map((server, idx) => (
                            <button key={idx} onClick={() => { onServerSelect(server); closeSheet(); }}
                                className={`w-full text-left px-4 py-3 rounded-xl mb-2 transition-all ${selectedServer?.url === server.url ? 'bg-primary-400/15 text-white' : 'bg-dark-card text-gray-400 hover:bg-dark-card/70'}`}>
                                {server.server || `Server ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {activeSheet === 'download' && (
                <div className="fixed inset-0 z-50 flex items-end">
                    <div className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`} onClick={closeSheet} />
                    <div className={`relative w-full rounded-t-3xl p-5 max-h-[75vh] overflow-y-auto transition-all duration-300 ease-out ${animate ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
                        style={{ background: 'var(--surface)' }}>
                        <div className="w-10 h-1.5 bg-gray-600 rounded-full mx-auto mb-5" />
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Download size={20} className="text-primary-400" />
                                <h3 className="text-white font-semibold">Download</h3>
                            </div>
                            <button onClick={closeSheet}><X size={20} className="text-gray-400" /></button>
                        </div>
                        {!downloads || downloads.length === 0 ? (
                            <div className="text-center py-8"><p className="text-gray-400">Tidak ada link download</p></div>
                        ) : (
                            <div className="space-y-4">
                                {downloads.map((dl, idx) => (
                                    <div key={idx} className="bg-dark-card rounded-xl border border-dark-border p-3">
                                        <h4 className="text-xs font-medium text-gray-400 mb-2">{dl.format}</h4>
                                        <div className="space-y-2">
                                            {dl.qualities.map((quality, qIdx) => (
                                                <div key={qIdx} className="flex items-start gap-2">
                                                    <span className="text-xs font-bold text-primary-400 w-16">{quality.quality}</span>
                                                    <div className="flex-1 flex flex-wrap gap-2">
                                                        {quality.links.map((link, lIdx) => (
                                                            <a key={lIdx} href={link.url} target="_blank" rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-dark-surface rounded text-xs text-gray-300 hover:text-primary-400 transition-colors">
                                                                <ExternalLink size={10} />{link.name}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeSheet === 'share' && (
                <ShareSheet onClose={closeSheet} animate={animate}
                    title={animeTitle + (episodeTitle ? ` - ${episodeTitle}` : '')}
                    url={window.location.href} />
            )}

            {activeSheet === 'report' && (
                <ReportSheet onClose={closeSheet} animate={animate}
                    animeTitle={animeTitle} episodeTitle={episodeTitle} episodeUrl={episodeUrl} />
            )}
        </>
    );
};

const ActionButton = ({ icon, label, onClick, active }) => (
    <button onClick={onClick}
        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${active ? 'text-primary-400' : 'text-gray-400 hover:text-white'}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
    </button>
);

export default StreamingAnimeServerSelector;
          
