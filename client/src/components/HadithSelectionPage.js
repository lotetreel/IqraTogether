import React, { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { contentMap, dataReadyPromise } from '../data/duaCollection'; // Import contentMap and the promise

const HadithSelectionPage = ({ onSelectHadithChapter }) => {
  const [allChapters, setAllChapters] = useState([]); // Store all chapters from all volumes
  const [selectedVolume, setSelectedVolume] = useState(1); // Default to Volume 1
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHadithData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await dataReadyPromise; // Wait for duaCollection to finish loading all data

        const hadithChapters = Object.values(contentMap).filter(
          item => item.type === 'hadith_chapter' && item.source?.startsWith('Mizan al-Hikmah')
        );
        
        if (hadithChapters.length === 0) {
          console.warn("No Mizan al-Hikmah chapters found in contentMap.");
          // Attempt to fetch directly as a fallback (optional, could also just show error)
          // For simplicity, we'll rely on contentMap for now. If it's empty, an error or "no chapters" will show.
        }
        
        setAllChapters(hadithChapters || []);
      } catch (e) {
        console.error("Error loading Hadith data from contentMap:", e);
        setError(`Failed to load Hadith data. Details: ${e.message}`);
        setAllChapters([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHadithData();
  }, []);

  const handleChapterSelect = (chapter) => {
    // The chapter object from contentMap already has id, title, source, etc.
    // Ensure the 'type' is correctly set if not already in the chapter object from contentMap
    const selectionInfo = {
      ...chapter, // Spread all properties from the chapter object
      type: 'hadith_chapter', // Ensure type is set
    };
    onSelectHadithChapter(selectionInfo, chapter); // Pass the full chapter object as both arguments
  };
  
  const displayedChapters = useMemo(() => {
    if (searchTerm.trim() !== '') {
      return allChapters.filter(chapter =>
        chapter.chapter_title_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chapter.chapter_title_ar.includes(searchTerm) // Direct match for Arabic
      );
    }
    return allChapters.filter(ch => ch.volume === selectedVolume);
  }, [allChapters, selectedVolume, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LucideIcons.Loader size={32} className="animate-spin text-primary-500 dark:text-primary-400" />
        <span className="ml-3 text-gray-600 dark:text-dark-text-secondary">Loading Hadith Chapters...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl">
        <LucideIcons.AlertTriangle size={48} className="mx-auto text-red-400 dark:text-red-500 mb-4" />
        <p className="text-red-600 dark:text-red-300 mb-2 font-medium">Error Loading Hadith</p>
        <p className="text-sm text-red-500 dark:text-red-400 px-4">{error}</p>
      </div>
    );
  }

  if (allChapters.length === 0 && !isLoading) { // Check allChapters instead of chapters
     return (
       <div className="text-center py-12 bg-gray-50 dark:bg-dark-bg-secondary rounded-xl">
         <LucideIcons.SearchX size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" /> {/* Changed Icon */}
         <p className="text-gray-500 dark:text-dark-text-muted">No Mizan al-Hikmah chapters found.</p>
         <p className="text-sm text-gray-400 dark:text-dark-text-muted">Please ensure data is loaded correctly in duaCollection.</p>
       </div>
     );
   }

  // getChapterIcon remains the same for now, it uses chapter.chapter_num which should be fine if numbers are unique per volume or icons are generic enough.
  const getChapterIcon = (chapter) => {
    // If chapter numbers are not unique across volumes, this might need adjustment
    // For now, assume chapter.chapter_num is sufficient or icons are generic
    const titleLower = chapter.chapter_title_en.toLowerCase();
    let IconComponent;
    let colorClass = 'text-gray-500 dark:text-gray-400'; // Default color

    switch (chapter.chapter_num) {
      // Assign component and color class
      case 1: IconComponent = LucideIcons.Heart; colorClass = 'text-red-500'; break;
      case 2: IconComponent = LucideIcons.Briefcase; colorClass = 'text-blue-500'; break;
      case 3: IconComponent = LucideIcons.Hourglass; colorClass = 'text-yellow-500'; break;
      case 4: IconComponent = LucideIcons.Sparkles; colorClass = 'text-purple-500'; break;
      case 5: IconComponent = LucideIcons.Users; colorClass = 'text-green-500'; break;
      case 6: IconComponent = LucideIcons.Smile; colorClass = 'text-pink-500'; break;
      case 7: IconComponent = LucideIcons.Volume2; colorClass = 'text-indigo-500'; break;
      case 8: IconComponent = LucideIcons.ShieldAlert; colorClass = 'text-red-600'; break;
      case 9: IconComponent = LucideIcons.Lock; colorClass = 'text-gray-600'; break;
      case 10: IconComponent = LucideIcons.Utensils; colorClass = 'text-orange-500'; break;
      case 11: IconComponent = LucideIcons.HelpingHand; colorClass = 'text-teal-500'; break;
      case 12: IconComponent = LucideIcons.BookOpenCheck; colorClass = 'text-cyan-500'; break;
      case 13: IconComponent = LucideIcons.Landmark; colorClass = 'text-lime-600'; break;
      case 14: IconComponent = LucideIcons.Eye; colorClass = 'text-blue-400'; break;
      case 15: IconComponent = LucideIcons.Users; colorClass = 'text-green-500'; break; // Community
      case 16: IconComponent = LucideIcons.Crown; colorClass = 'text-yellow-600'; break; // Leadership
      case 17: IconComponent = LucideIcons.Shield; colorClass = 'text-blue-600'; break; // Leadership Ali (AS)
      case 18: IconComponent = LucideIcons.Heart; colorClass = 'text-pink-400'; break; // Fatima (AS)
      case 19: case 20: case 21: case 22: case 23: case 24: case 25: case 26: case 27: case 28: 
        IconComponent = LucideIcons.User; colorClass = 'text-gray-500'; break; // Imams
      case 29: IconComponent = LucideIcons.LocateFixed; colorClass = 'text-green-600'; break; // Mahdi (AS)
      case 30: IconComponent = LucideIcons.Heart; colorClass = 'text-red-500'; break; // Faith
      case 31: IconComponent = LucideIcons.BadgeCheck; colorClass = 'text-green-600'; break; // Trustworthiness
      case 32: IconComponent = LucideIcons.ShieldCheck; colorClass = 'text-blue-600'; break; // Assurance
      case 33: IconComponent = LucideIcons.HelpingHand; colorClass = 'text-teal-500'; break; // Intimacy
      case 34: IconComponent = LucideIcons.User; colorClass = 'text-gray-500'; break; // Man
      case 35: IconComponent = LucideIcons.Bug; colorClass = 'text-red-700'; break; // Banes
      case 36: IconComponent = LucideIcons.Coins; colorClass = 'text-yellow-500'; break; // Miserliness
      case 37: IconComponent = LucideIcons.AlertTriangle; colorClass = 'text-orange-600'; break; // Innovation
      case 38: IconComponent = LucideIcons.Trash2; colorClass = 'text-red-500'; break; // Squandering
      case 39: IconComponent = LucideIcons.Award; colorClass = 'text-yellow-400'; break; // Righteousness
      case 40: IconComponent = LucideIcons.Hourglass; colorClass = 'text-purple-400'; break; // Purgatory
      case 41: IconComponent = LucideIcons.Sparkles; colorClass = 'text-yellow-300'; break; // Blessing
      case 42: IconComponent = LucideIcons.Smile; colorClass = 'text-pink-500'; break; // Cheerfulness
      case 43: IconComponent = LucideIcons.Eye; colorClass = 'text-blue-400'; break; // Insight
      case 44: IconComponent = LucideIcons.XCircle; colorClass = 'text-red-500'; break; // Falsehood
      case 45: IconComponent = LucideIcons.Angry; colorClass = 'text-red-700'; break; // Antipathy
      case 46: IconComponent = LucideIcons.Swords; colorClass = 'text-gray-600'; break; // Aggression
      case 47: IconComponent = LucideIcons.Droplets; colorClass = 'text-blue-300'; break; // Weeping
      case 48: IconComponent = LucideIcons.Mountain; colorClass = 'text-green-700'; break; // Land
      case 49: IconComponent = LucideIcons.Mic; colorClass = 'text-indigo-500'; break; // Eloquence
      case 50: IconComponent = LucideIcons.Megaphone; colorClass = 'text-blue-500'; break; // Propagation
      case 51: IconComponent = LucideIcons.Flame; colorClass = 'text-orange-500'; break; // Ordeal
      case 52: IconComponent = LucideIcons.Ban; colorClass = 'text-red-600'; break; // Slander
      case 53: IconComponent = LucideIcons.Zap; colorClass = 'text-yellow-500'; break; // Mubahila
      case 54: IconComponent = LucideIcons.HelpingHand; colorClass = 'text-teal-500'; break; // Allegiance
      case 55: IconComponent = LucideIcons.Store; colorClass = 'text-lime-600'; break; // Commerce
      case 56: IconComponent = LucideIcons.Undo; colorClass = 'text-blue-500'; break; // Repentance
      case 57: IconComponent = LucideIcons.Gift; colorClass = 'text-pink-400'; break; // Reward
      case 58: IconComponent = LucideIcons.Zap; colorClass = 'text-yellow-500'; break; // Revolution
      case 59: IconComponent = LucideIcons.Dices; colorClass = 'text-gray-500'; break; // Predestination
      case 60: IconComponent = LucideIcons.Gavel; colorClass = 'text-red-700'; break; // Tyrant
      case 61: IconComponent = LucideIcons.ShieldOff; colorClass = 'text-orange-400'; break; // Cowardice
      case 62: IconComponent = LucideIcons.MessagesSquare; colorClass = 'text-blue-400'; break; // Dispute
      case 63: IconComponent = LucideIcons.Brain; colorClass = 'text-pink-500'; break; // Experience
      case 64: IconComponent = LucideIcons.Frown; colorClass = 'text-yellow-600'; break; // Anxiety
      case 65: IconComponent = LucideIcons.Scale; colorClass = 'text-gray-600'; break; // Requital
      case 66: IconComponent = LucideIcons.EyeOff; colorClass = 'text-red-500'; break; // Spying
      case 67: IconComponent = LucideIcons.Sofa; colorClass = 'text-orange-500'; break; // Sitting/Assembly
      case 68: IconComponent = LucideIcons.Users; colorClass = 'text-green-500'; break; // Sitting Company
      case 69: IconComponent = LucideIcons.Users; colorClass = 'text-green-500'; break; // Congregation
      case 70: IconComponent = LucideIcons.CalendarDays; colorClass = 'text-blue-500'; break; // Friday
      case 71: IconComponent = LucideIcons.Gem; colorClass = 'text-purple-500'; break; // Beauty
      case 72: IconComponent = LucideIcons.ShowerHead; colorClass = 'text-blue-300'; break; // Janaba
      case 73: IconComponent = LucideIcons.Shield; colorClass = 'text-gray-700'; break; // Army
      case 74: IconComponent = LucideIcons.Sparkles; colorClass = 'text-yellow-400'; break; // Paradise
      case 75: IconComponent = LucideIcons.BrainCog; colorClass = 'text-red-600'; break; // Madness
      case 76: IconComponent = LucideIcons.Swords; colorClass = 'text-gray-600'; break; // Lesser Jihad
      case 77: IconComponent = LucideIcons.Brain; colorClass = 'text-pink-500'; break; // Greater Jihad
      case 78: IconComponent = LucideIcons.Target; colorClass = 'text-red-500'; break; // Striving Jihad
      case 79: IconComponent = LucideIcons.X; colorClass = 'text-red-600'; break; // Ignorance
      case 80: IconComponent = LucideIcons.Flame; colorClass = 'text-orange-600'; break; // Hell
      case 81: IconComponent = LucideIcons.MessageCircle; colorClass = 'text-blue-400'; break; // Answer
      case 82: IconComponent = LucideIcons.Coins; colorClass = 'text-yellow-500'; break; // Open-Handedness
      case 83: IconComponent = LucideIcons.Home; colorClass = 'text-green-600'; break; // Neighbour
      case 84: IconComponent = LucideIcons.Heart; colorClass = 'text-red-500'; break; // Love
      case 85: IconComponent = LucideIcons.Lock; colorClass = 'text-gray-600'; break; // Imprisonment
      case 86: IconComponent = LucideIcons.EyeOff; colorClass = 'text-purple-400'; break; // Veil
      case 87: IconComponent = LucideIcons.Plane; colorClass = 'text-blue-500'; break; // Hajj
      case 88: IconComponent = LucideIcons.MessageSquare; colorClass = 'text-indigo-500'; break; // Argument
      case 89: IconComponent = LucideIcons.BookCopy; colorClass = 'text-orange-500'; break; // Hadith
      case 90: IconComponent = LucideIcons.Gavel; colorClass = 'text-red-700'; break; // Legal Punishments
      case 91: IconComponent = LucideIcons.Swords; colorClass = 'text-gray-600'; break; // War
      case 92: IconComponent = LucideIcons.Sword; colorClass = 'text-red-600'; break; // Warmonger
      case 93: IconComponent = LucideIcons.Bird; colorClass = 'text-cyan-500'; break; // Freedom
      case 94: IconComponent = LucideIcons.Coins; colorClass = 'text-yellow-500'; break; // Covetousness
      case 95: IconComponent = LucideIcons.Briefcase; colorClass = 'text-blue-500'; break; // Profession

      default:
        // Keyword-based fallbacks (keep default color)
        if (titleLower.includes('prayer') || titleLower.includes('salat')) { IconComponent = LucideIcons.MoonStar; break; }
        if (titleLower.includes('knowledge') || titleLower.includes('ilm')) { IconComponent = LucideIcons.Brain; break; }
        if (titleLower.includes('family') || titleLower.includes('kin')) { IconComponent = LucideIcons.Home; break; }
        if (titleLower.includes('truth') || titleLower.includes('sidq') || titleLower.includes('haqq')) { IconComponent = LucideIcons.BadgeCheck; break; }
        if (titleLower.includes('patience') || titleLower.includes('sabr')) { IconComponent = LucideIcons.Turtle; break; }
        if (titleLower.includes('trust') || titleLower.includes('tawakkul')) { IconComponent = LucideIcons.Anchor; break; }
        if (titleLower.includes('supplication') || titleLower.includes('dua')) { IconComponent = LucideIcons.Sparkle; break; }
        if (titleLower.includes('quran')) { IconComponent = LucideIcons.BookOpen; break; }
        
        // Final Default icon
        IconComponent = LucideIcons.BookMarked; 
    }

    // Revert size to 18 and apply color class
    return <IconComponent size={18} className={`inline-block ${colorClass}`} />; 
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search Hadith titles (Eng/Ar)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg-secondary dark:border-gray-600 dark:text-dark-text dark:placeholder-gray-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <LucideIcons.Search size={20} className="text-gray-400 dark:text-gray-500" />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Clear search"
          >
            <LucideIcons.X size={20} />
          </button>
        )}
      </div>

      {/* Volume Selector - Conditionally shown if no search term */}
      {!searchTerm && (
        <div className="flex justify-center space-x-2 sm:space-x-3 p-1 bg-gray-100 dark:bg-dark-bg rounded-lg">
          {[1, 2, 3, 4].map((volNum) => (
            <button
              key={volNum}
              onClick={() => setSelectedVolume(volNum)}
              className={`px-4 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400
                ${selectedVolume === volNum 
                  ? 'bg-primary-500 text-white shadow-md dark:bg-primary-400 dark:text-dark-bg-alt' 
                  : 'text-gray-600 hover:bg-gray-200 dark:text-gray-700 dark:hover:bg-gray-200'}`}
            >
              Volume {volNum}
            </button>
          ))}
        </div>
      )}

      <h2 className="text-xl font-semibold text-center text-gray-700 dark:text-dark-text-secondary">
        {searchTerm ? `Search Results for "${searchTerm}"` : `Mizan al-Hikmah - Volume ${selectedVolume}`}
      </h2>

      {displayedChapters.length === 0 && !isLoading && (
        <div className="text-center py-10 bg-gray-50 dark:bg-dark-bg-secondary rounded-xl">
          <LucideIcons.ArchiveX size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-dark-text-muted">
            {searchTerm ? 'No chapters found matching your search.' : `No chapters found for Volume ${selectedVolume}.`}
          </p>
          { !searchTerm && allChapters.length > 0 && <p className="text-sm text-gray-400 dark:text-dark-text-muted">Other volumes may have content.</p> }
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedChapters.map((chapter) => (
          <button
            key={chapter.id} // Use chapter.id from contentMap which is unique
            onClick={() => handleChapterSelect(chapter)}
            className="card p-4 text-left hover:bg-primary-50 dark:hover:bg-dark-bg-tertiary transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-lg font-semibold text-primary-700 dark:text-primary-300">
                {chapter.chapter_num}. {chapter.chapter_title_en}
              </span>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-dark-text-muted">
                {getChapterIcon(chapter)}
                <span>
                  {chapter.sections?.length || 0} Sections
                </span>
              </div>
            </div>
            <p className="text-right text-lg font-uthmani text-gray-600 dark:text-dark-text-secondary mt-1" dir="rtl">
              {chapter.chapter_title_ar}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HadithSelectionPage;
