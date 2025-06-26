import DUA_KUMAYL from './dua_kumayl.json';
import DUA_SIMAAT from './dua_simaat.json';

// Imports for new Sahifa Sajjadiya duas (1 to 55)
import SAHIFA_DUA_1 from './dua_1.json';
import SAHIFA_DUA_2 from './dua_2.json';
import SAHIFA_DUA_3 from './dua_3.json';
import SAHIFA_DUA_4 from './dua_4.json';
import SAHIFA_DUA_5 from './dua_5.json';
import SAHIFA_DUA_6 from './dua_6.json';
import SAHIFA_DUA_7 from './dua_7.json';
import SAHIFA_DUA_8 from './dua_8.json';
import SAHIFA_DUA_9 from './dua_9.json';
import SAHIFA_DUA_10 from './dua_10.json';
import SAHIFA_DUA_11 from './dua_11.json';
import SAHIFA_DUA_12 from './dua_12.json';
import SAHIFA_DUA_13 from './dua_13.json';
import SAHIFA_DUA_14 from './dua_14.json';
import SAHIFA_DUA_15 from './dua_15.json';
import SAHIFA_DUA_16 from './dua_16.json';
import SAHIFA_DUA_17 from './dua_17.json';
import SAHIFA_DUA_18 from './dua_18.json';
import SAHIFA_DUA_19 from './dua_19.json';
import SAHIFA_DUA_20 from './dua_20.json';
import SAHIFA_DUA_21 from './dua_21.json';
import SAHIFA_DUA_22 from './dua_22.json';
import SAHIFA_DUA_23 from './dua_23.json';
import SAHIFA_DUA_24 from './dua_24.json';
import SAHIFA_DUA_25 from './dua_25.json';
import SAHIFA_DUA_26 from './dua_26.json';
import SAHIFA_DUA_27 from './dua_27.json';
import SAHIFA_DUA_28 from './dua_28.json';
import SAHIFA_DUA_29 from './dua_29.json';
import SAHIFA_DUA_30 from './dua_30.json';
import SAHIFA_DUA_31 from './dua_31.json';
import SAHIFA_DUA_32 from './dua_32.json';
import SAHIFA_DUA_33 from './dua_33.json';
import SAHIFA_DUA_34 from './dua_34.json';
import SAHIFA_DUA_35 from './dua_35.json';
import SAHIFA_DUA_36 from './dua_36.json';
import SAHIFA_DUA_37 from './dua_37.json';
import SAHIFA_DUA_38 from './dua_38.json';
import SAHIFA_DUA_39 from './dua_39.json';
import SAHIFA_DUA_40 from './dua_40.json';
import SAHIFA_DUA_41 from './dua_41.json';
import SAHIFA_DUA_42 from './dua_42.json';
import SAHIFA_DUA_43 from './dua_43.json';
import SAHIFA_DUA_44 from './dua_44.json';
import SAHIFA_DUA_45 from './dua_45.json';
import SAHIFA_DUA_46 from './dua_46.json';
import SAHIFA_DUA_47 from './dua_47.json';
import SAHIFA_DUA_48 from './dua_48.json';
import SAHIFA_DUA_49 from './dua_49.json';
import SAHIFA_DUA_50 from './dua_50.json';
import SAHIFA_DUA_51 from './dua_51.json';
import SAHIFA_DUA_52 from './dua_52.json';
import SAHIFA_DUA_53 from './dua_53.json';
import SAHIFA_DUA_54 from './dua_54.json';
import SAHIFA_DUA_55 from './dua_55.json';

// Basic dua collection for preview/selection
export const duaCollection = [
  // Dua Kumayl and Dua Simaat removed as per request.
  // New Sahifa Sajjadiya Duas
  {
    id: 'sahifa-sajjadiya-dua1',
    title: '1. In Praise of God :',
    arabic: 'التَّحْمِيدُ لِلَّهِ عَزَّ وَ جَل',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'The first supplication from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'Praising God, Understanding Tawhid, Seeking Forgiveness',
    length: 'Varies',
    popularity: 5
  },
  {
    id: 'sahifa-sajjadiya-dua2',
    title: '2. Blessings upon Prophet(saws)',
    arabic: 'الصَّلَاةُ عَلَى مُحَمَّدٍ وَ آلِه',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'The second supplication from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'Blessings upon Prophet Muhammad (pbuh&hp) and his Progeny (as), Seeking Intercession',
    length: 'Varies',
    popularity: 5
  },
  {
    id: 'sahifa-sajjadiya-dua3',
    title: '3. Blessings on Bearers of throne & angels',
    arabic: 'الصَّلَاةُ عَلَى حَمَلَةِ الْعَرْشِ و كلّ مَلَكٍ مقرّبٍ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 3 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua4',
    title: '4. Blessings on Followers & Attestors to Prophets',
    arabic: 'الصَّلَاةُ عَلَى اتباع الرسل و مُصَدِّقِيهم',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 4 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua5',
    title: '5. Prayer for People under guardianship',
    arabic: 'دُعَاؤُهُ لِنَفسِهِ وَ اهل وِِلايتهِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 5 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua6',
    title: '6. His Supplication for Morning & Evening',
    arabic: 'دُعَاؤُهُ عِنْدَ الصَّبَاحِ وَ الْمَسَاءِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 6 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua7',
    title: '7. When faced with Worrisome Task',
    arabic: 'ُعَاؤُهُ فِي الْمُهِمَّاتِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 7 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua8',
    title: '8. Seeking Refuge from Hateful things',
    arabic: 'ُعَاؤُهُ فِي الْمُهِمَّاتِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 8 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua9',
    title: '9. In Yearning to Ask Forgiveness',
    arabic: 'دُعَاؤُهُ فِي الِاشْتِيَاقِ الى طَلَبِ المَغفِرَةِ مِن الله',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 9 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua10',
    title: '10. Seeking Asylum with God.',
    arabic: 'دُعَاؤُهُ فِي اللَّجَإِ إِلَى اللَّهِ تَعَالَى',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 10 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua11',
    title: '11. Seeking Good Outcomes',
    arabic: 'دُعَاؤُهُ بِخَوَاتِمِ الْخَيْرِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 11 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua12',
    title: '12.His Supplication in Confession and in Seeking Repentance toward God',
    arabic: 'دُعَاؤُهُ فِي الِاعْتِرَافِ و طَلَبِ التَوبَةِ الى الله',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 12 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua13',
    title: '13. In Seeking Needs',
    arabic: 'دُعَاؤُهُ فِي طَلَبِ الْحَوَائِجِ الى الله تعالى',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 13 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua14',
    title: '14. When Hostility was shown to him',
    arabic: 'دُعَاؤُهُ فِي الظُّلَامَاتِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 14 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua15',
    title: '15. His supplication when sick',
    arabic: 'دُعَاؤُهُ عِنْدَ الْمَرَضِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 15 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua16',
    title: '16. In Asking Release from sins andSeeking Pardon',
    arabic: 'دُعَاؤُهُ فِي الِاسْتِقَالَةِ مِِن ذُنوبِهِ و طَلَبِ العَفو',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 16 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua17',
    title: '17. When he Mentioned Satan and Sought Refuge from him',
    arabic: 'دُعَاؤُهُ إذا ذُكِرَ الشيطان فَاستَعاذَ مِنهُِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 17 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua18',
    title: '18. When Perils were repelled or Requests quickly granted',
    arabic: 'دُعَاؤُهُ إذا دُفِعَ عَنهُ ما يَحذَرُ او عُجّلَ لَهُ مَطلَبُهُ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 18 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua19',
    title: '19. His Supplication in Asking for Water during a Drought',
    arabic: 'دُعَاؤُهُ فِي الِاسْتِسْقَاءِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 19 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua20',
    title: '20.Makaeremul Akhlaq- Noble Traits',
    arabic: 'دُعَاؤُهُ فِي مَكَارِمِ الْأَخْلَاقِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 20 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua21',
    title: '21.When Something made him Sorrowful :',
    arabic: 'دُعَاؤُهُ إِذَا حَزَنَهُ أَمْرٌ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 21 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua22',
    title: '22. His Supplication in Hardship, Effort, and Difficult Affairs',
    arabic: 'دُعَاؤُهُ عِنْدَ الشِّدَّةِ و الجَحدِ و تَعَسُّرِ اللُمور',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 22 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua23',
    title: '23. When he Asked God for Well-Being',
    arabic: 'دُعَاؤُهُ بِالْعَافِيَةِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 23 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua24',
    title: '24. His Prayer forParents',
    arabic: 'دُعَاؤُهُ لِأَبَوَيْهِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 24 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua25',
    title: '25. His Supplication for hisChildren',
    arabic: 'دُعَاؤُهُ لِوُلْدِهِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 25 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua26',
    title: '26. His Supplication for Neighbours and Friends',
    arabic: 'دُعَاؤُهُ لِجِيرَانِهِ وَ أَوْلِيَائِهِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 26 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua27',
    title: '27. His Supplication for People of Frontiers',
    arabic: 'دُعَاؤُهُ لِأَهْلِ الثُّغُورِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 27 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua28',
    title: '28. His Supplication in Fleeing to God for Protection',
    arabic: 'دُعَاؤُهُ فِي التَّفَزُّعِ الى اللهِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 28 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua29',
    title: '29. His Supplication when his Provision was Stinted',
    arabic: 'دُعَاؤُهُ إِذَا قُتِّرَ عَلَيْهِ الرِّزْقُ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 29 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua30',
    title: '30. His Supplication for help in repaying debts',
    arabic: 'دُعَاؤُهُ إِذَا قُتِّرَ عَلَيْهِ الرِّزْقُ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 30 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua31',
    title: '31. In mentioning and asking forRepentance',
    arabic: 'دُعَاؤُهُ بِالتَّوْبَةِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 31 from Sahifa Al-Sajjadiya.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua32',
    title: '31. Tauba(Repentance) alternate',
    arabic: 'الدعاء 32 (الصحيفة السجادية)',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 32 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua33',
    title: '32. His Supplication in the Night Prayer',
    arabic: 'دُعَاؤُهُ فِي صَلَاةِ اللَّيْلِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 33 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua34',
    title: '33. His Supplication in Asking for the Best',
    arabic: 'دُعَاؤُهُ فِي الِاسْتِخَارَةِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 34 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua35',
    title: '34. When he was afflicted or saw someone afflicted with the Disgrace of Sin',
    arabic: 'دُعَاؤُهُ إِذَا ابْتُلِيَ أَوْ رَأَى مُبْتَلًى بِفَضِيحَةٍ بِذَنْبٍِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 35 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua36',
    title: '35. In Satisfaction when he Looked upon the Companions of this world',
    arabic: 'دُعَاؤُهُ فِي الرِّضَا إذا نَظَرَ الى  اَصحابِ الدُنيا',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 36 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua37',
    title: '36. When he saw Clouds and Lightening and heard the Thunder',
    arabic: 'دُعَاؤُهُ إذا نَظَرَ الى السَّحابِ و البَرقِ و عِنْدَ سَمَاعِ الرَّعْدِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 37 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua38',
    title: '37. His supplication ingiving Thanks',
    arabic: 'دُعَاؤُهُ فِي الشُّكْرِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 38 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua39',
    title: '38. His supplication in asking Pardon',
    arabic: 'دُعَاؤُهُ فِي الِاعْتِذَارِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 39 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua40',
    title: '39. His supplication in seeking Pardon & Mercy',
    arabic: 'دُعَاؤُهُ فِي طَلَبِ الْعَفْوِ و المَغْفِرَةِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 40 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua41',
    title: '40. When he remembered Death',
    arabic: 'دُعَاؤُهُ إذا ذَكَرَ الْمَوْتِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 41 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua42',
    title: '41. His Supplication in Asking for Covering and Protection',
    arabic: 'دُعَاؤُهُ فِي طَلَبِ السَّتْرِ وَ الْوِقَايَةِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 42 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua43',
    title: '42. Upon Completing a Reading of the Qur\'an',
    arabic: 'دُعَاؤُهُ عِنْدَ خَتْمِهِ الْقُرْآنَ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 43 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua44',
    title: '43. When he Looked at the New Crescent Moon',
    arabic: 'دُعَاؤُهُ إِذَا نَظَرَ إِلَى الْهِلَالِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 44 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua45',
    title: '44. For the Coming of the Month of Ramadan',
    arabic: 'دُعَاؤُهُ لِدُخُوْلِ شَهْرِ رَمَضَانَ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 45 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua46',
    title: '45. Farewell to the Month of Ramadan',
    arabic: 'دُعَاؤُهُ لِوَدَاعِ شَهْرِ رَمَضَانَ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 46 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua47',
    title: '46. On the Day of Fast-Breaking and on Friday',
    arabic: 'دُعَاؤُهُ فِي عِيدِ الْفِطْرِ وَ الْجُمُعَةِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 47 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua48',
    title: '47. His Supplication On the Day of Arafah',
    arabic: 'دُعَاؤُهُ فِي يَوْمِ عَرَفَةَ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 48 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua49',
    title: '48. His Supplication On the Day of Sacrifice and Friday',
    arabic: 'دُعَاؤُهُ فِي يَوْمِ الْأَضْحَى وَ الْجُمُعَةِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 49 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua50',
    title: '49. Repelling the trickery of enemies',
    arabic: '',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 50 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua51',
    title: '50. His Supplication in Fear',
    arabic: '',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 51 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua52',
    title: '51. In Pleading and Abasement',
    arabic: 'دُعَاؤُهُ فِي التَّضَرُّعِ وَ الِاسْتِكَانَةِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 52 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua53',
    title: '52. His Supplication in Imploring God',
    arabic: 'دُعَاؤُهُ فِي الْإِلْحَاحِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 53 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua54',
    title: '53. Abasing himself before God',
    arabic: 'دُعَاؤُهُ فِي التَّذَلُّلِ',
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 54 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  },
  {
    id: 'sahifa-sajjadiya-dua55',
    title: '54. Removal ofWorries', // English title for Dua 55
    arabic: 'دعـاؤه استكشاف الهموم', // Arabic title for Dua 55
    source: 'Imam Zain al-Abidin (as)',
    category: 'Sahifa Sajjadiya',
    description: 'Supplication 55 from Sahifa Al-Sajjadiya. Title to be updated.',
    recitationTime: 'Anytime',
    benefits: 'General supplication benefits.',
    length: 'Varies',
    popularity: 4
  }
];

// Empty Quran collection for now
export const quranCollection = [];

// Content lookup map for full content retrieval
export const contentMap = {
  // 'dua-kumayl': DUA_KUMAYL, // Removed
  // 'dua-simaat': DUA_SIMAAT, // Removed
  'sahifa-sajjadiya-dua1': SAHIFA_DUA_1,
  'sahifa-sajjadiya-dua2': SAHIFA_DUA_2,
  'sahifa-sajjadiya-dua3': SAHIFA_DUA_3,
  'sahifa-sajjadiya-dua4': SAHIFA_DUA_4,
  'sahifa-sajjadiya-dua5': SAHIFA_DUA_5,
  'sahifa-sajjadiya-dua6': SAHIFA_DUA_6,
  'sahifa-sajjadiya-dua7': SAHIFA_DUA_7,
  'sahifa-sajjadiya-dua8': SAHIFA_DUA_8,
  'sahifa-sajjadiya-dua9': SAHIFA_DUA_9,
  'sahifa-sajjadiya-dua10': SAHIFA_DUA_10,
  'sahifa-sajjadiya-dua11': SAHIFA_DUA_11,
  'sahifa-sajjadiya-dua12': SAHIFA_DUA_12,
  'sahifa-sajjadiya-dua13': SAHIFA_DUA_13,
  'sahifa-sajjadiya-dua14': SAHIFA_DUA_14,
  'sahifa-sajjadiya-dua15': SAHIFA_DUA_15,
  'sahifa-sajjadiya-dua16': SAHIFA_DUA_16,
  'sahifa-sajjadiya-dua17': SAHIFA_DUA_17,
  'sahifa-sajjadiya-dua18': SAHIFA_DUA_18,
  'sahifa-sajjadiya-dua19': SAHIFA_DUA_19,
  'sahifa-sajjadiya-dua20': SAHIFA_DUA_20,
  'sahifa-sajjadiya-dua21': SAHIFA_DUA_21,
  'sahifa-sajjadiya-dua22': SAHIFA_DUA_22,
  'sahifa-sajjadiya-dua23': SAHIFA_DUA_23,
  'sahifa-sajjadiya-dua24': SAHIFA_DUA_24,
  'sahifa-sajjadiya-dua25': SAHIFA_DUA_25,
  'sahifa-sajjadiya-dua26': SAHIFA_DUA_26,
  'sahifa-sajjadiya-dua27': SAHIFA_DUA_27,
  'sahifa-sajjadiya-dua28': SAHIFA_DUA_28,
  'sahifa-sajjadiya-dua29': SAHIFA_DUA_29,
  'sahifa-sajjadiya-dua30': SAHIFA_DUA_30,
  'sahifa-sajjadiya-dua31': SAHIFA_DUA_31,
  'sahifa-sajjadiya-dua32': SAHIFA_DUA_32,
  'sahifa-sajjadiya-dua33': SAHIFA_DUA_33,
  'sahifa-sajjadiya-dua34': SAHIFA_DUA_34,
  'sahifa-sajjadiya-dua35': SAHIFA_DUA_35,
  'sahifa-sajjadiya-dua36': SAHIFA_DUA_36,
  'sahifa-sajjadiya-dua37': SAHIFA_DUA_37,
  'sahifa-sajjadiya-dua38': SAHIFA_DUA_38,
  'sahifa-sajjadiya-dua39': SAHIFA_DUA_39,
  'sahifa-sajjadiya-dua40': SAHIFA_DUA_40,
  'sahifa-sajjadiya-dua41': SAHIFA_DUA_41,
  'sahifa-sajjadiya-dua42': SAHIFA_DUA_42,
  'sahifa-sajjadiya-dua43': SAHIFA_DUA_43,
  'sahifa-sajjadiya-dua44': SAHIFA_DUA_44,
  'sahifa-sajjadiya-dua45': SAHIFA_DUA_45,
  'sahifa-sajjadiya-dua46': SAHIFA_DUA_46,
  'sahifa-sajjadiya-dua47': SAHIFA_DUA_47,
  'sahifa-sajjadiya-dua48': SAHIFA_DUA_48,
  'sahifa-sajjadiya-dua49': SAHIFA_DUA_49,
  'sahifa-sajjadiya-dua50': SAHIFA_DUA_50,
  'sahifa-sajjadiya-dua51': SAHIFA_DUA_51,
  'sahifa-sajjadiya-dua52': SAHIFA_DUA_52,
  'sahifa-sajjadiya-dua53': SAHIFA_DUA_53,
  'sahifa-sajjadiya-dua54': SAHIFA_DUA_54,
  'sahifa-sajjadiya-dua55': SAHIFA_DUA_55,
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
  let successV1 = false, successV2 = false, successV3 = false, successV4 = false;

  try {
    // Load Volume 1
    const responseV1 = await fetch('/data/MizanAlHikmah/mizan_al_hikmah_vol1.json');
    if (!responseV1.ok) {
      throw new Error(`HTTP error for Vol 1! status: ${responseV1.status}`);
    }
    const MIZAN_AL_HIKMAH_VOL1 = await responseV1.json();
    successV1 = processMizanVolume(MIZAN_AL_HIKMAH_VOL1, 1, contentMap);
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
    successV2 = processMizanVolume(MIZAN_AL_HIKMAH_VOL2, 2, contentMap);
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
    successV3 = processMizanVolume(MIZAN_AL_HIKMAH_VOL3, 3, contentMap);
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
    successV4 = processMizanVolume(MIZAN_AL_HIKMAH_VOL4, 4, contentMap);
  } catch (error) {
    console.error('Failed to load or process Mizan al-Hikmah Vol 4 data for contentMap:', error);
  }

  if (!successV1 && !successV2 && !successV3 && !successV4) {
    // If all volumes failed to load/process
    const errorMessage = "All Mizan al-Hikmah volumes failed to load or process. Please check the browser console for detailed fetch/parse errors for each volume (e.g., 404 Not Found, malformed JSON). Ensure the JSON files exist in the public/data/MizanAlHikmah directory and are correctly formatted arrays of chapters.";
    console.error(errorMessage); // Log detailed error message
    throw new Error(errorMessage);
  }
};

// Call the function to load Hadith data when this module is initialized.
// Export a promise that resolves when the data is ready.
export const dataReadyPromise = (async () => {
  await loadAndPopulateAllHadithData();
})();
