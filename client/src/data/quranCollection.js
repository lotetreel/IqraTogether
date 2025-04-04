import ARABIC_QURAN_OBJ from './arabic.json';
import TRANSLITERATION_QURAN_OBJ from './transliteration.json';
import TRANSLATION_QURAN_OBJ from './aliquliqarai.json'; // Assuming this is the English translation

// --- Process Quran Data ---

const quranMetadata = [];
const quranContentMap = {};

// Check if data is loaded and is an object
if (ARABIC_QURAN_OBJ && typeof ARABIC_QURAN_OBJ === 'object' && Object.keys(ARABIC_QURAN_OBJ).length > 0 &&
    TRANSLITERATION_QURAN_OBJ && typeof TRANSLITERATION_QURAN_OBJ === 'object' &&
    TRANSLATION_QURAN_OBJ && typeof TRANSLATION_QURAN_OBJ === 'object') {

  try {
    // Iterate over the keys (Surah numbers as strings) of the Arabic object
    Object.keys(ARABIC_QURAN_OBJ).forEach(surahId => { // surahId will be "1", "2", etc.
      const arabicSurah = ARABIC_QURAN_OBJ[surahId];
      const translitSurah = TRANSLITERATION_QURAN_OBJ[surahId];
      const translaSurah = TRANSLATION_QURAN_OBJ[surahId];

      // Basic validation for existence and Ayahs object
      if (!arabicSurah?.Ayahs || !translitSurah?.Ayahs || !translaSurah?.Ayahs) {
        console.warn(`Missing or invalid Surah/Ayahs data for Surah ID ${surahId}. Skipping.`);
        return; // Skip this surah
      }

      const arabicAyahsObj = arabicSurah.Ayahs;
      const translitAyahsObj = translitSurah.Ayahs;
      const translationAyahsObj = translaSurah.Ayahs;

      // Calculate total ayahs by counting keys in the Ayahs object
      const totalAyahs = Object.keys(arabicAyahsObj).length;

      // Basic metadata for selection list
      const metadata = {
        id: parseInt(surahId, 10), // Convert string ID to number for consistency? Or keep as string? Let's use number.
        title: arabicSurah.SurahEnglishNames || arabicSurah.SurahTransliteratedName || `Surah ${surahId}`, // English name
        arabicTitle: arabicSurah.SurahArabicName || '', // Arabic name
        totalAyahs: totalAyahs,
        type: 'quran' // Add type identifier
      };
      quranMetadata.push(metadata);

      // Combine verses for the content map
      const combinedVerses = [];
      for (let i = 1; i <= totalAyahs; i++) {
        const ayahKey = String(i); // Keys in Ayahs object are strings "1", "2", ...

        const arabicText = arabicAyahsObj[ayahKey]?.Arabic ?? '';
        const translitText = translitAyahsObj[ayahKey]?.Transliteration ?? '';
        const translationAyahObj = translationAyahsObj[ayahKey];
        // Use the correct key for the translation text
        const translationText = translationAyahObj?.["Ali Quli Qara'i"] ?? '';

        combinedVerses.push({
          ayah: i, // Ayah number
          arabic: arabicText,
          transliteration: translitText,
          translation: translationText,
        });
      }

      // Store full combined content in the map, using numeric ID as key
      quranContentMap[metadata.id] = {
        id: metadata.id,
        title: metadata.title,
        arabicTitle: metadata.arabicTitle,
        totalAyahs: metadata.totalAyahs,
        verses: combinedVerses,
        type: 'quran'
      };
    });

    // Sort metadata by Surah number (ID)
    quranMetadata.sort((a, b) => a.id - b.id);

    console.log(`Successfully processed Quran metadata and content for ${quranMetadata.length} surahs.`);

  } catch (error) {
    console.error("Error processing Quran data:", error);
    // Ensure arrays/maps are empty on error
    quranMetadata.length = 0;
    Object.keys(quranContentMap).forEach(key => delete quranContentMap[key]);
  }

} else {
  console.error("Failed to load or parse one or more Quran JSON files OR root is not an object.");
}

export { quranMetadata, quranContentMap };
