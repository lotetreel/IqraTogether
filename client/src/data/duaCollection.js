// Removed imports from sampleContent as they are no longer needed
import DUA_KUMAYL from './dua_kumayl.json';
import DUA_SIMAAT from './dua_simaat.json';
import SAHIFA_SAJJADIYA_DUA1 from './sahifa_sajjadiya_dua1.json';
import SAHIFA_SAJJADIYA_DUA2 from './sahifa_sajjadiya_dua2_Blessing_Upon_Muhammad_and_his_Household.json';
// Correcting the import for Dua 3 - Assuming the filename indicates the content
import SAHIFA_SAJJADIYA_DUA3_ATTESTERS from './sahifa_sajjadiya_dua3_Blessing_Upon_the_Attesters_to_The_Messengers.json'; 
// Correcting the import for Dua 4 - Assuming the filename indicates the content
import SAHIFA_SAJJADIYA_DUA4_BEARERS from './sahifa_sajjadiya_dua4_Blessing_Upon_the_Bearers_of_The_Throne.json'; 
import SAHIFA_SAJJADIYA_DUA5 from './sahifa_sajjadiya_dua5_His Supplication for himself and the People under his Guardianship.json';
import SAHIFA_SAJJADIYA_DUA6 from './sahifa_sajjadiya_dua6_His_Supplication_in_the_Morning_and_the_Evening.json';
import SAHIFA_SAJJADIYA_DUA7 from './sahifa_sajjadiya_dua7_His Supplication in Worrisome Tasks.json';
import SAHIFA_SAJJADIYA_DUA8 from './sahifa_sajjadiya_dua8_His Supplication in Seeking Refuge.json';
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
    title: 'Dua 1: Praise of God',
    arabic: 'الصحيفة السجادية - الدعاء الأول',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'The first supplication from Sahifa Al-Sajjadiya, focusing on the praise of God.',
    recitationTime: 'Anytime',
    benefits: 'Praising God, Understanding Tawhid, Seeking Forgiveness',
    length: 'Long',
    popularity: 5
  },
  {
    id: 'sahifa-sajjadiya-dua2',
    title: 'Dua 2: Blessing Upon Muhammad and his Household',
    arabic: 'الصحيفة السجادية - الدعاء الثاني',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'The second supplication from Sahifa Al-Sajjadiya, a blessing upon Muhammad and his Household.',
    recitationTime: 'Anytime',
    benefits: 'Blessings upon Prophet Muhammad (pbuh&hp) and his Progeny (as), Seeking Intercession',
    length: 'Medium', // Assuming medium length, can be adjusted
    popularity: 5
  },
  {
    id: 'sahifa-sajjadiya-dua3',
    title: 'Dua 3: Blessing Upon the Attesters to The Messengers', // Corrected title
    arabic: 'الصحيفة السجادية - الدعاء الثالث',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Blessing Upon the Attesters to The Messengers.', // Corrected description
    recitationTime: 'Anytime',
    benefits: 'Seeking blessings for those who confirmed the Messengers.', // Corrected benefits
    length: 'Medium', 
    popularity: 5
  },
  {
    id: 'sahifa-sajjadiya-dua4',
    title: 'Dua 4: Blessing Upon the Bearers of The Throne', // Corrected title
    arabic: 'الصحيفة السجادية - الدعاء الرابع',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Blessing Upon the Bearers of The Throne and every angel brought nigh.', // Corrected description
    recitationTime: 'Anytime',
    benefits: 'Seeking blessings for the angels and understanding their role.', // Corrected benefits
    length: 'Medium',
    popularity: 5
  },
  {
    id: 'sahifa-sajjadiya-dua5',
    title: 'Dua 5: For Himself and People under his Guardianship',
    arabic: 'الصحيفة السجادية - الدعاء الخامس',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'His Supplication for himself and the People under his Guardianship.',
    recitationTime: 'Anytime',
    benefits: 'Seeking well-being for oneself and those under one\'s care.',
    length: 'Medium', // Assuming medium length, can be adjusted
    popularity: 5
  },
  {
    id: 'sahifa-sajjadiya-dua6',
    title: 'Dua 6: In the Morning and the Evening',
    arabic: 'الصحيفة السجادية - الدعاء السادس',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'His Supplication in the Morning and the Evening.',
    recitationTime: 'Morning and Evening',
    benefits: 'Seeking protection and blessings for the day and night.',
    length: 'Medium', // Assuming medium length, can be adjusted
    popularity: 5
  },
  {
    id: 'sahifa-sajjadiya-dua7',
    title: 'Dua 7: In Worrisome Tasks',
    arabic: 'الصحيفة السجادية - الدعاء السابع',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'His Supplication in Worrisome Tasks, when Calamities Descended, and in Distress.',
    recitationTime: 'Times of difficulty',
    benefits: 'Seeking relief from distress and calamities.',
    length: 'Short', 
    popularity: 5
  },
  {
    id: 'sahifa-sajjadiya-dua8',
    title: 'Dua 8: In Seeking Refuge',
    arabic: 'الصحيفة السجادية - الدعاء الثامن',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'His Supplication in Seeking Refuge from Hateful Things, Bad Morals, and Blameworthy Acts.',
    recitationTime: 'Anytime',
    benefits: 'Seeking protection from evil and negative traits.',
    length: 'Medium',
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
  'sahifa-sajjadiya-dua1': SAHIFA_SAJJADIYA_DUA1,
  'sahifa-sajjadiya-dua2': SAHIFA_SAJJADIYA_DUA2,
  'sahifa-sajjadiya-dua3': SAHIFA_SAJJADIYA_DUA3_ATTESTERS, // Corrected mapping
  'sahifa-sajjadiya-dua4': SAHIFA_SAJJADIYA_DUA4_BEARERS,   // Corrected mapping
  'sahifa-sajjadiya-dua5': SAHIFA_SAJJADIYA_DUA5,
  'sahifa-sajjadiya-dua6': SAHIFA_SAJJADIYA_DUA6,
  'sahifa-sajjadiya-dua7': SAHIFA_SAJJADIYA_DUA7,
  'sahifa-sajjadiya-dua8': SAHIFA_SAJJADIYA_DUA8
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

  try {
    // Load Volume 3
    const responseV3 = await fetch('/data/MizanAlHikmah/mizan_al_hikmah_vol3.json'); // Path relative to public folder
    if (!responseV3.ok) {
      throw new Error(`HTTP error for Vol 3! status: ${responseV3.status}`);
    }
    const MIZAN_AL_HIKMAH_VOL3 = await responseV3.json();
    processMizanVolume(MIZAN_AL_HIKMAH_VOL3, 3, contentMap);

  } catch (error) {
    console.error('Failed to load or process Mizan al-Hikmah Vol 3 data for contentMap:', error);
  }

  try {
    // Load Volume 4
    const responseV4 = await fetch('/data/MizanAlHikmah/mizan_al_hikmah_vol4.json'); // Path relative to public folder
    if (!responseV4.ok) {
      throw new Error(`HTTP error for Vol 4! status: ${responseV4.status}`);
    }
    const MIZAN_AL_HIKMAH_VOL4 = await responseV4.json();
    processMizanVolume(MIZAN_AL_HIKMAH_VOL4, 4, contentMap);

  } catch (error) {
    console.error('Failed to load or process Mizan al-Hikmah Vol 4 data for contentMap:', error);
  }
};

// Call the function to load Hadith data when this module is initialized.
// Export a promise that resolves when the data is ready.
export const dataReadyPromise = (async () => {
  await loadAndPopulateAllHadithData();
})();
