// Removed imports from sampleContent as they are no longer needed
import DUA_KUMAYL from './dua_kumayl.json'; // Import the specific Dua Kumayl data
import DUA_SIMAAT from './dua_simaat.json'; // Import the specific Dua Simaat data

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
  }
  // Removed all other Dua entries
];

// Empty Quran collection for now
export const quranCollection = [];

// Content lookup map for full content retrieval
export const contentMap = {
  'dua-kumayl': DUA_KUMAYL, // Only keep Dua Kumayl entry
  'dua-simaat': DUA_SIMAAT
  // Removed all other entries
};
