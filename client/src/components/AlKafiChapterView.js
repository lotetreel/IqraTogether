import React from 'react';
import HadithDisplayItem from './HadithDisplayItem';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AlKafiChapterView = ({
  chapterFullContent,    // Expects { hadithsInChapter: [], bookName: '', chapterName: '', volumeName: '', totalHadiths: number }
  currentHadithIndex,    // Index of the hadith to display
  onNavigateHadith,      // Function to call for navigation: onNavigateHadith(direction: 1 or -1)
  isHost,                // Boolean: is the current user the host?
  isBrowsingLocally,     // Boolean: is the participant browsing locally?
  arabicFontSize,
  translationFontSize,
  showTranslation,
  // onBack is no longer needed here, handled by DuaSyncApp's main back button
}) => {
  if (!chapterFullContent || !chapterFullContent.hadithsInChapter || chapterFullContent.hadithsInChapter.length === 0) {
    return (
      <div className="text-center py-10">
        <p>No hadiths found in this chapter or chapter data is loading.</p>
      </div>
    );
  }

  const { hadithsInChapter, bookName, chapterName, volumeName, totalHadiths } = chapterFullContent;
  const currentHadith = hadithsInChapter[currentHadithIndex];

  if (!currentHadith) {
    return (
      <div className="text-center py-10">
        <p>Error: Hadith data not found for index {currentHadithIndex}.</p>
      </div>
    );
  }
  
  const canNavigate = isHost || isBrowsingLocally;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section for chapter info */}
      <div className="text-center mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-dark-text-primary">
          {bookName || 'Book'}
        </h2>
        <p className="text-xl text-gray-700 dark:text-dark-text-secondary">{chapterName || 'Chapter'}</p>
        {volumeName && (
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">
            Volume: {volumeName}
          </p>
        )}
      </div>

      {/* Hadith Navigation and Counter */}
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          onClick={() => canNavigate && onNavigateHadith(-1)}
          disabled={!canNavigate || currentHadithIndex === 0}
          className={`btn btn-icon btn-primary ${(!canNavigate || currentHadithIndex === 0) ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Previous Hadith"
        >
          <ChevronLeft size={24} />
        </button>
        <p className="text-sm text-gray-600 dark:text-dark-text-muted">
          Hadith {currentHadithIndex + 1} of {totalHadiths}
        </p>
        <button
          onClick={() => canNavigate && onNavigateHadith(1)}
          disabled={!canNavigate || currentHadithIndex >= totalHadiths - 1}
          className={`btn btn-icon btn-primary ${(!canNavigate || currentHadithIndex >= totalHadiths - 1) ? 'btn-disabled opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Next Hadith"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Single Hadith Display */}
      <div className="card bg-base-100/50 dark:bg-dark-bg-secondary/50 p-4 md:p-6">
        <HadithDisplayItem
          key={currentHadith.id} // Key by hadith ID for potential re-renders
          hadith={currentHadith}
          arabicFontSize={arabicFontSize}
          translationFontSize={translationFontSize}
          showTranslation={showTranslation}
        />
      </div>
    </div>
  );
};

export default AlKafiChapterView;
