import ARABIC_QURAN from './arabic.json';
import TRANSLITERATION_QURAN from './transliteration.json';
import TRANSLATION_QURAN from './aliquliqarai.json'; // Assuming this is the English translation

// --- Process Quran Data ---

// Assuming each JSON is an array of Surah objects
// e.g., [{ id: 1, name: "Al-Fatiha", arabic: "...", verses: [...] }, ...]
// And verses arrays align across files for the same Surah/Ayah index.

const quranMetadata = [];
const quranContentMap = {};

// Check if data is loaded and has the expected array structure
if (Array.isArray(ARABIC_QURAN) && Array.isArray(TRANSLITERATION_QURAN) && Array.isArray(TRANSLATION_QURAN)) {
  // Assuming all arrays have the same length (114 Surahs) and are ordered correctly
  for (let i = 0; i < ARABIC_QURAN.length; i++) {
    const arabicSurah = ARABIC_QURAN[i];
    const translitSurah = TRANSLITERATION_QURAN.find(s => s.id === arabicSurah.id); // Find matching ID
    const translaSurah = TRANSLATION_QURAN.find(s => s.id === arabicSurah.id); // Find matching ID

    if (!arabicSurah || !translitSurah || !translaSurah) {
      console.warn(`Data mismatch for Surah ID ${arabicSurah?.id || i + 1}. Skipping.`);
      continue;
    }

    // Basic metadata for selection list
    const metadata = {
      id: arabicSurah.id, // Use numeric ID
      title: arabicSurah.name || `Surah ${arabicSurah.id}`, // English name
      arabicTitle: arabicSurah.arabic || '', // Arabic name (if available in arabic.json)
      totalAyahs: arabicSurah.verses?.length || 0, // Calculate total ayahs
      type: 'quran' // Add type identifier
    };
    quranMetadata.push(metadata);

    // Combine verses for the content map
    const combinedVerses = [];
    const numVerses = metadata.totalAyahs;

    for (let j = 0; j < numVerses; j++) {
      combinedVerses.push({
        ayah: j + 1, // Ayah number (1-based)
        arabic: arabicSurah.verses?.[j]?.text || '', // Assuming structure { text: "..." }
        transliteration: translitSurah.verses?.[j]?.text || '', // Assuming structure { text: "..." }
        translation: translaSurah.verses?.[j]?.text || '', // Assuming structure { text: "..." }
      });
    }

    // Store full combined content in the map
    quranContentMap[arabicSurah.id] = {
      id: metadata.id,
      title: metadata.title,
      arabicTitle: metadata.arabicTitle,
      totalAyahs: metadata.totalAyahs,
      verses: combinedVerses,
      type: 'quran'
    };
  }
} else {
  console.error("Failed to load or parse one or more Quran JSON files.");
}

export { quranMetadata, quranContentMap };
