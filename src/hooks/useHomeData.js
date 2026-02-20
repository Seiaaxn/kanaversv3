// src/hooks/useHomeData.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'https://anime-api-iota-beryl.vercel.app/api';

// Fungsi untuk membersihkan URL donghua (dari URL episode ke URL utama)
const cleanDonghuaUrl = (url) => {
  if (!url) return url;
  
  // Hapus trailing slash jika ada
  let cleanUrl = url.replace(/\/+$/, '');
  
  // Hapus bagian episode dari URL
  // Contoh: https://anichin.moe/renegade-immortal-episode-128-subtitle-indonesia
  // Menjadi: https://anichin.moe/renegade-immortal
  if (cleanUrl.includes('-episode-')) {
    cleanUrl = cleanUrl.split('-episode-')[0];
  }
  
  // Pastikan ada trailing slash di akhir
  return cleanUrl + '/';
};

// Fungsi untuk membersihkan title donghua
const cleanDonghuaTitle = (title) => {
  if (!title) return title;
  
  // Hapus "Episode X Subtitle Indonesia" dari title
  // Contoh: "Renegade Immortal Episode 128 Subtitle Indonesia" -> "Renegade Immortal"
  return title.replace(/\s+Episode\s+\d+.*$/, '').trim();
};

export const useHomeData = () => {
  const [latestData, setLatestData] = useState([]);
  const [animeData, setAnimeData] = useState([]);
  const [donghuaData, setDonghuaData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [animeRes, donghuaRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/anime/latest`),
          axios.get(`${API_BASE}/donghua/latest-release`)
        ]);

        if (animeRes.status === 'fulfilled') {
          const animeData = animeRes.value.data || [];
          setAnimeData(Array.isArray(animeData) ? animeData : []);
        }

        if (donghuaRes.status === 'fulfilled') {
          // Data dari latest-release (berisi episode)
          const rawDonghuaData = donghuaRes.value.data?.data || donghuaRes.value.data || [];
          
          // Bersihkan data: ubah URL dan title ke format donghua (bukan episode)
          const cleanedDonghuaData = (Array.isArray(rawDonghuaData) ? rawDonghuaData : [])
            .map(item => {
              const cleanUrl = cleanDonghuaUrl(item.url);
              console.log('Original URL:', item.url, '-> Clean URL:', cleanUrl); // Debug
              
              return {
                ...item,
                title: cleanDonghuaTitle(item.title),
                url: cleanUrl, // URL sudah dibersihkan
                episodeUrl: item.url, // Simpan URL episode asli
                episode: item.episode
              };
            })
            // Hapus duplikat berdasarkan URL yang sudah dibersihkan
            .filter((item, index, self) => 
              index === self.findIndex(i => i.url === item.url)
            );
          
          setDonghuaData(cleanedDonghuaData);
        }

        // Gabungkan untuk latest data (untuk hero slider)
        const animeItems = Array.isArray(animeRes.value?.data) ? animeRes.value.data : [];
        const donghuaItems = Array.isArray(donghuaData) ? donghuaData : [];
        
        // Ambil 3 dari anime, 2 dari donghua untuk hero slider
        const combined = [
          ...animeItems.slice(0, 3),
          ...donghuaItems.slice(0, 2)
        ];
        
        setLatestData(combined);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFilteredData = (category) => {
    switch (category) {
      case 'anime':
        return animeData;
      case 'donghua':
        return donghuaData;
      case 'all':
        // Untuk tab All, return array kosong karena akan di-handle oleh ContentGrid sendiri
        return [];
      default:
        return animeData;
    }
  };

  const getCategoryTitle = (category) => {
    switch (category) {
      case 'anime':
        return 'Latest Anime';
      case 'donghua':
        return 'Latest Donghua';
      case 'all':
        return 'Latest Updates';
      default:
        return 'Latest Anime';
    }
  };

  return {
    latestData,
    animeData,
    donghuaData,
    loading,
    getFilteredData,
    getCategoryTitle
  };
};
                                      
