// Removed imports from sampleContent as they are no longer needed
import DUA_KUMAYL from './dua_kumayl.json';
import DUA_SIMAAT from './dua_simaat.json';
import SAHIFA_SAJJADIYA_DUA1 from './sahifa_sajjadiya_dua1.json';
// Hadith data will be loaded asynchronously

// Basic dua collection for preview/selection
export const duaCollection = [
  {
    id: 'dua-kumayl', // Use the original ID
    title: 'Dua Kumayl', // Restore original title
    arabic: 'دعاء كميل', // Restore original Arabic title
    source: 'Imam Ali (as)', // Restore original source
    category: 'Thursday Night', // Restore original category
    description: 'A supplication taught by Imam Ali (as) to his close companion Kumayl ibn Ziyad. It is recited for forgiveness of sins and protection from evil.', // Restore original description
    recitationTime: 'Thursday nights', // Restore original recitation time
    benefits: 'Forgiveness of sins, fulfillment of needs, protection from enemies', // Restore original benefits
    image: '/images/dua_kumayl.png', // Changed to png extension
    length: 'Long', // Restore original length
    popularity: 5 // Restore original popularity
  },
  {
    id: 'dua-simaat',
    title: 'Dua Simaat',
    arabic: 'دعاء السمات',
    source: 'Imams Baqir & Sadiq (as)',
    category: 'Friday Afternoon',
    description: 'Also known as Dua Shubbur. A famous supplication recommended to be recited in the last hour of Friday.',
    recitationTime: 'Last hour of Friday afternoon',
    benefits: 'Seeking divine assistance, relief from hardship, forgiveness',
    image: '/images/Dua_Simaat.png', // Use the actual filename provided
    length: 'Long',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua1',
    title: 'Sahifa Sajjadiya - Dua 1',
    arabic: 'الصحيفة السجادية - الدعاء الأول',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'The first supplication from Sahifa Al-Sajjadiya, focusing on the praise of God.',
    recitationTime: 'Anytime',
    benefits: 'Praising God, Understanding Tawhid, Seeking Forgiveness',
    image: '/images/sahifa_sajjadiya.png', // Placeholder image path
    length: 'Long',
    popularity: 5
  }
  // Removed all other Dua entries
];

// Empty Quran collection for now
export const quranCollection = [];

// Content lookup map for full content retrieval
export const contentMap = {
  'dua-kumayl': DUA_KUMAYL,
  'dua-simaat': DUA_SIMAAT,
  'sahifa-sajjadiya-dua1': SAHIFA_SAJJADIYA_DUA1
};

// Helper function to process a single volume of Mizan al-Hikmah
const processMizanVolume = (volumeData, volumeNum, contentMapInstance) => {
  if (volumeData && Array.isArray(volumeData)) {
    volumeData.forEach(chapter => {
      if (chapter && chapter.chapter_num) {
        const chapterId = `mizan_v${volumeNum}_ch${chapter.chapter_num}`;
        contentMapInstance[chapterId] = {
          id: chapterId,
          type: 'hadith_chapter',
          title: `Mizan al-Hikmah Vol ${volumeNum} - Ch ${chapter.chapter_num}: ${chapter.chapter_title_en}`,
          source: `Mizan al-Hikmah Vol ${volumeNum}`,
          volume: volumeNum, // Add volume number for easier filtering later
          ...chapter
        };
      }
    });
    console.log(`Mizan al-Hikmah Vol ${volumeNum} chapters successfully processed and added to contentMap:`, volumeData.length);
    return true;
  } else {
    console.warn(`Fetched Mizan al-Hikmah Vol ${volumeNum} data is not available or not in expected format. Hadith chapters will not be loaded into contentMap.`);
    return false;
  }
};

// Asynchronously load Hadith data for both volumes and populate contentMap
const loadAndPopulateAllHadithData = async () => {
  try {
    // Load Volume 1
    const responseV1 = await fetch('/data/MizanAlHikmah/mizan_al_hikmah_vol1.json');
    if (!responseV1.ok) {
      throw new Error(`HTTP error for Vol 1! status: ${responseV1.status}`);
    }
    const MIZAN_AL_HIKMAH_VOL1 = await responseV1.json();
    processMizanVolume(MIZAN_AL_HIKMAH_VOL1, 1, contentMap);

  } catch (error) {
    console.error('Failed to load or process Mizan al-Hikmah Vol 1 data for contentMap:', error);
  }

  try {
    // Load Volume 2
    const responseV2 = await fetch('/data/MizanAlHikmah/mizan_al_hikmah_vol2.json'); // Path relative to public folder
    if (!responseV2.ok) {
      throw new Error(`HTTP error for Vol 2! status: ${responseV2.status}`);
    }
    const MIZAN_AL_HIKMAH_VOL2 = await responseV2.json();
    processMizanVolume(MIZAN_AL_HIKMAH_VOL2, 2, contentMap);

  } catch (error) {
    console.error('Failed to load or process Mizan al-Hikmah Vol 2 data for contentMap:', error);
  }

  // try {
  //   // Load Volume 3
  //   const responseV3 = await fetch('/data/MizanAlHikmah/mizan_al_hikmah_vol3.json'); // Path relative to public folder
  //   if (!responseV3.ok) {
  //     throw new Error(`HTTP error for Vol 3! status: ${responseV3.status}`);
  //   }
  //   const MIZAN_AL_HIKMAH_VOL3 = await responseV3.json();
  //   processMizanVolume(MIZAN_AL_HIKMAH_VOL3, 3, contentMap);
  //
  // } catch (error) {
  //   console.error('Failed to load or process Mizan al-Hikmah Vol 3 data for contentMap:', error);
  // }
};

// Call the function to load Hadith data when this module is initialized.
// Export a promise that resolves when the data is ready.
export const dataReadyPromise = (async () => {
  await loadAndPopulateAllHadithData();
})();
