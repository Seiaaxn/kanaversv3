import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import {
    StreamingAnimeNavbar,
    StreamingAnimeVideoPlayer,
    StreamingAnimeServerSelector,
    StreamingAnimeInfoCard,
    StreamingAnimeEpisodesGrid,
    StreamingAnimeErrorState,
    StreamingAnimeCommentsSection
} from '../../components/streaming/anime';

const API_BASE = 'https://anime-api-iota-beryl.vercel.app/api';

const StreamingAnime = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const episodeUrl = searchParams.get('url');

    const [episodeData, setEpisodeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedServer, setSelectedServer] = useState(null);
    const [isIframeLoading, setIsIframeLoading] = useState(false);

    const iframeRef = useRef(null);

    useEffect(() => {
        const fetchEpisodeDetail = async () => {
            if (!episodeUrl) {
                setError('No episode URL provided');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE}/anime/episode?url=${encodeURIComponent(episodeUrl)}`);

                if (response.data.success) {
                    setEpisodeData(response.data.data);
                    if (response.data.data.streams?.length > 0) {
                        setSelectedServer(response.data.data.streams[0]);
                        setIsIframeLoading(true);
                    }
                } else {
                    setError(response.data.error || 'Failed to load episode');
                }
            } catch (err) {
                console.error('Error fetching episode:', err);
                setError('Failed to load episode data');
            } finally {
                setLoading(false);
            }
        };

        fetchEpisodeDetail();
    }, [episodeUrl]);

    const handleBack = () => navigate(-1);
    const handleEpisodeClick = (ep) => navigate(`/anime/watch?url=${encodeURIComponent(ep.url)}`);
    const handleServerChange = (server) => { setSelectedServer(server); setIsIframeLoading(true); };
    const handleGoHome = () => navigate('/');

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg">
                <div className="h-12 glass border-b border-white/5 flex items-center px-4">
                    <div className="w-6 h-6 bg-dark-card rounded animate-pulse" />
                    <div className="ml-3 w-40 h-4 bg-dark-card rounded animate-pulse" />
                </div>
                <div className="w-full aspect-video bg-dark-surface animate-pulse" />
                <div className="px-4 py-4 space-y-3">
                    <div className="h-5 w-3/4 bg-dark-card rounded animate-pulse" />
                    <div className="h-4 w-full bg-dark-card rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-dark-card rounded animate-pulse" />
                </div>
            </div>
        );
    }

    if (error || !episodeData) {
        return <StreamingAnimeErrorState error={error} onGoHome={handleGoHome} />;
    }

    const { currentEpisode, anime, episodes, streams, downloads, navigation } = episodeData;

    return (
        <div className="min-h-screen bg-dark-bg">
            <StreamingAnimeNavbar
                title={anime?.title}
                episodeTitle={currentEpisode?.title}
                episodeNumber={currentEpisode?.number}
                onBack={handleBack}
            />

            {/* Video Player */}
            <div className="pt-12">
                <StreamingAnimeVideoPlayer
                    ref={iframeRef}
                    selectedServer={selectedServer}
                    isLoading={isIframeLoading}
                    onLoad={() => setIsIframeLoading(false)}
                    onError={() => { setIsIframeLoading(false); }}
                />
            </div>

            {/* Content */}
            <div className="px-4 py-4">
                <StreamingAnimeInfoCard
                    episodeNumber={currentEpisode?.number}
                    anime={anime}
                />

                <StreamingAnimeServerSelector
                    streams={streams}
                    selectedServer={selectedServer}
                    downloads={downloads}
                    onServerSelect={handleServerChange}
                    animeTitle={anime?.title || ''}
                    episodeTitle={currentEpisode?.title || `Episode ${currentEpisode?.number || ''}`}
                    episodeUrl={episodeUrl || ''}
                />

                <StreamingAnimeEpisodesGrid
                    episodes={episodes}
                    currentEpisodeNumber={currentEpisode?.number}
                    onEpisodeClick={handleEpisodeClick}
                />

                <StreamingAnimeCommentsSection episodeUrl={episodeUrl} />
            </div>
        </div>
    );
};

export default StreamingAnime;
                                            
