// src/services/commentsService.js
// Sistem komentar shared menggunakan JSONBin.io sebagai database online
// Komentar bisa dilihat dari HP/browser/akun manapun
//
// SETUP:
// 1. Daftar gratis di https://jsonbin.io
// 2. Buat API Key di dashboard
// 3. Isi JSONBIN_API_KEY di bawah
// 4. Pertama kali jalan, bin akan otomatis dibuat

import axios from 'axios';

// =============================================
// KONFIGURASI - ISI INI SETELAH DAFTAR JSONBIN
// =============================================
const JSONBIN_API_KEY = '$2a$10$XUh.ZHdoOW42aEn5FfPrsuJ9bhTgNUGKa0.dTDhM0GrKy52XhxPAe'; // Ganti dengan API key dari jsonbin.io
const BIN_NAME = 'kan4verse-comments';
// =============================================

const JSONBIN_BASE = 'https://api.jsonbin.io/v3';
const BIN_ID_KEY = 'kan4verse_bin_id'; // disimpan di localStorage untuk referensi

// Fallback ke localStorage jika JSONBin belum dikonfigurasi atau gagal
const COMMENTS_KEY = 'animeplay_comments';

const isConfigured = () => {
  return JSONBIN_API_KEY && !JSONBIN_API_KEY.includes('GANTI_DENGAN');
};

// ===== JSONBIN HELPERS =====

const getBinId = () => {
  return localStorage.getItem(BIN_ID_KEY) || null;
};

const saveBinId = (id) => {
  localStorage.setItem(BIN_ID_KEY, id);
};

// Buat bin baru jika belum ada
const createBin = async () => {
  try {
    const res = await axios.post(
      `${JSONBIN_BASE}/b`,
      { comments: {} },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY,
          'X-Bin-Name': BIN_NAME,
          'X-Bin-Private': 'false', // public agar semua bisa baca
        }
      }
    );
    const id = res.data.metadata.id;
    saveBinId(id);
    return id;
  } catch (e) {
    console.error('Failed to create bin:', e);
    return null;
  }
};

// Ambil semua komentar dari JSONBin
const fetchAllFromBin = async () => {
  try {
    let binId = getBinId();
    if (!binId) {
      binId = await createBin();
      if (!binId) return null;
    }

    const res = await axios.get(`${JSONBIN_BASE}/b/${binId}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
    });
    return res.data.record?.comments || {};
  } catch (e) {
    // Jika bin tidak ditemukan, buat baru
    if (e.response?.status === 404) {
      localStorage.removeItem(BIN_ID_KEY);
      const binId = await createBin();
      if (binId) return {};
    }
    console.error('Failed to fetch from bin:', e);
    return null;
  }
};

// Simpan semua komentar ke JSONBin
const saveAllToBin = async (allComments) => {
  try {
    let binId = getBinId();
    if (!binId) {
      binId = await createBin();
      if (!binId) return false;
    }

    await axios.put(
      `${JSONBIN_BASE}/b/${binId}`,
      { comments: allComments },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY,
        }
      }
    );
    return true;
  } catch (e) {
    console.error('Failed to save to bin:', e);
    return false;
  }
};

// ===== LOCAL STORAGE HELPERS (fallback) =====

const loadFromLocal = (episodeKey) => {
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
    return all[episodeKey] || [];
  } catch { return []; }
};

const saveToLocal = (episodeKey, comments) => {
  try {
    const all = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}');
    all[episodeKey] = comments;
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(all));
  } catch {}
};

// ===== PUBLIC API =====

// Load komentar untuk episode tertentu
export const loadComments = async (episodeKey) => {
  if (!isConfigured()) {
    // Fallback ke localStorage
    return loadFromLocal(episodeKey).map(c => ({
      ...c,
      createdAt: new Date(c.createdAt)
    }));
  }

  try {
    const all = await fetchAllFromBin();
    if (all === null) {
      // Gagal fetch online, fallback ke local
      return loadFromLocal(episodeKey).map(c => ({
        ...c,
        createdAt: new Date(c.createdAt)
      }));
    }
    return (all[episodeKey] || []).map(c => ({
      ...c,
      createdAt: new Date(c.createdAt)
    }));
  } catch (e) {
    return loadFromLocal(episodeKey).map(c => ({
      ...c,
      createdAt: new Date(c.createdAt)
    }));
  }
};

// Simpan komentar (tambah/update)
export const saveComments = async (episodeKey, comments) => {
  const serialized = comments.map(c => ({
    ...c,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt
  }));

  // Selalu simpan ke local sebagai cache
  saveToLocal(episodeKey, serialized);

  if (!isConfigured()) return;

  try {
    const all = await fetchAllFromBin();
    if (all !== null) {
      all[episodeKey] = serialized;
      await saveAllToBin(all);
    }
  } catch (e) {
    console.error('Failed to sync comments online:', e);
  }
};

export const isOnlineMode = () => isConfigured();
