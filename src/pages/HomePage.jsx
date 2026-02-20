// src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/home/Header';
import HeroSlider from '../components/home/HeroSlider';
import { useHomeData } from '../hooks/useHomeData';
import AnimeMovie from '../components/home/AnimeMovie';
import PopularTodaySection from '../components/home/PopularToday';
import ContentSection from '../components/home/ContentSection';

const HomePage = () => {
  const navigate = useNavigate();
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const { animeData, donghuaData, loading } = useHomeData();

  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleItemSelect = (item) => {
    const category = item.source === 'samehadaku' || item.type === 'Anime' ? 'anime' : 'donghua';
    let itemUrl = item.url || item.link;
    if (!itemUrl) return;
    itemUrl = itemUrl.replace(/\/+$/, '');
    navigate(`/detail/${category}/${encodeURIComponent(itemUrl)}`);
  };

  const getHeroItems = () => {
    if (loading) return [];
    const combined = [
      ...(Array.isArray(animeData) ? animeData.slice(0, 3) : []),
      ...(Array.isArray(donghuaData) ? donghuaData.slice(0, 2) : [])
    ];
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]];
    }
    return combined.slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header scrolled={headerScrolled} />

      <div className="pt-13" style={{paddingTop: '52px'}}>
        {/* Hero */}
        <HeroSlider
          items={getHeroItems()}
          onAnimeSelect={handleItemSelect}
          autoPlayInterval={4000}
          loading={loading}
        />

        {/* Anime Section */}
        <ContentSection
          title="Latest Anime"
          label="Anime"
          labelColor="blue"
          items={animeData}
          loading={loading}
          onItemClick={handleItemSelect}
          seeAllPath="/all-anime"
        />

        {/* Divider */}
        <div className="mx-4 border-t border-white/5 my-1" />

        {/* Donghua Section */}
        <ContentSection
          title="Latest Donghua"
          label="Donghua"
          labelColor="red"
          items={donghuaData}
          loading={loading}
          onItemClick={handleItemSelect}
          seeAllPath="/all-donghua"
        />

        {/* Divider */}
        <div className="mx-4 border-t border-white/5 my-1" />

        {/* Popular Donghua */}
        <PopularTodaySection />

        {/* Divider */}
        <div className="mx-4 border-t border-white/5 my-1" />

        {/* Anime Movies */}
        <AnimeMovie />

        <div className="h-6" />
      </div>
    </div>
  );
};

export default HomePage;
