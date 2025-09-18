import React, { useState, useEffect, useRef } from 'react';
import { QuranData } from '../data/quran-data';

// The QuranData.Sura is metadata. We need to parse it and combine it with actual verse text.
// For now, we will use placeholder text to fix the rendering issue.
// A proper implementation would involve fetching and parsing the text files from /public/data.
const surahList = QuranData.Sura.slice(1, -1).map((sura, index) => ({
  id: index + 1,
  name: sura[5], // e.g., "Al-Faatiha"
  verses: Array.from({ length: sura[1] }, (_, i) => ({
    id: i + 1,
    text: `Placeholder for Surah ${index + 1}, Verse ${i + 1} (Arabic).`,
    translation: `Placeholder for Surah ${index + 1}, Verse ${i + 1} (English).`
  }))
}));

const Quran = () => {
  const [surah, setSurah] = useState(null);
  const [lastReadVerse, setLastReadVerse] = useState(null);
  const verseRefs = useRef([]);

  useEffect(() => {
    const lastRead = JSON.parse(localStorage.getItem('lastReadVerse'));
    if (lastRead) {
      setLastReadVerse(lastRead);
      const surahData = surahList.find(s => s.id === lastRead.surahId);
      setSurah(surahData || surahList[0]);
    } else {
      setSurah(surahList[0]);
    }
  }, []);

  const handleSurahChange = (e) => {
    const surahId = parseInt(e.target.value);
    const surahData = surahList.find(s => s.id === surahId);
    setSurah(surahData);
    // When surah changes, clear the last read verse from state if it's not in the new surah
    if (lastReadVerse && lastReadVerse.surahId !== surahId) {
        setLastReadVerse(null);
    }
  };

  useEffect(() => {
    if (surah && lastReadVerse && lastReadVerse.surahId === surah.id) {
        const verseElement = verseRefs.current[lastReadVerse.verseId - 1];
        if (verseElement) {
            verseElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }
  }, [surah, lastReadVerse]);

  const setBookmark = (surahId, verseId) => {
    const bookmark = { surahId, verseId };
    localStorage.setItem('lastReadVerse', JSON.stringify(bookmark));
    setLastReadVerse(bookmark);
    alert(`Bookmark set for Surah ${surahId}, Verse ${verseId}`);
  };

  const goToBookmark = () => {
    const lastRead = JSON.parse(localStorage.getItem('lastReadVerse'));
    if (lastRead) {
      const surahData = surahList.find(s => s.id === lastRead.surahId);
      setSurah(surahData);
      setLastReadVerse(lastRead);
    } else {
        alert("No bookmark found!");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Quran Reader</h1>
      <div className="flex items-center mb-4 space-x-4">
        <select onChange={handleSurahChange} value={surah ? surah.id : ''} className="p-2 border rounded">
            {surahList.map(s => (
            <option key={s.id} value={s.id}>{s.id}. {s.name}</option>
            ))}
        </select>
        <button onClick={goToBookmark} className="p-2 border rounded bg-blue-500 text-white">
            Go to Bookmark
        </button>
      </div>
      {surah && (
        <div>
          <h2 className="text-xl font-semibold mb-4">{surah.name}</h2>
          <div className="space-y-4">
            {surah.verses.map((verse, index) => (
              <div key={verse.id} ref={el => verseRefs.current[index] = el} className="p-2 border-b">
                <p className="text-lg">{verse.text}</p>
                <p className="text-sm text-gray-500">{verse.translation}</p>
                <button
                  onClick={() => setBookmark(surah.id, verse.id)}
                  className={`mt-2 ${lastReadVerse?.verseId === verse.id && lastReadVerse?.surahId === surah.id ? 'text-green-500' : 'text-blue-500'}`}
                  title="Set Bookmark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={lastReadVerse?.verseId === verse.id && lastReadVerse?.surahId === surah.id ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Quran;
