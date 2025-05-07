import React from 'react';
import HadithDisplayItem from './HadithDisplayItem';
import BackButton from './ui/BackButton'; // Assuming a generic back button

const AlKafiChapterView = ({
  chapterFullContent, // Expects { hadithsInChapter: [], bookName: '', chapterName: '', volumeName: '' }
  onBack, // Function to go back (likely to DuaSelectionPage)
  arabicFontSize,
  translationFontSize,
  showTranslation,
}) => {
  if (!chapterFullContent || !chapterFullContent.hadithsInChapter) {
    return (
      <div className="text-center py-10">
        <p>No chapter data selected or hadiths are loading.</p>
        {onBack && <BackButton onClick={onBack} className="mt-4" />}
      </div>
    );
  }

  const { hadithsInChapter, bookName, chapterName, volumeName } = chapterFullContent;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section for chapter info */}
      <div className="text-center mb-6">
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

      {/* Scrollable list of Hadiths */}
      <div className="max-h-[calc(100vh-250px)] overflow-y-auto space-y-4 pr-2 custom-scrollbar card bg-base-100/50 dark:bg-dark-bg-secondary/50 p-4 md:p-6">
        {hadithsInChapter.length > 0 ? (
          hadithsInChapter.map(hadith => (
            <HadithDisplayItem
              key={hadith.id}
              hadith={hadith}
              arabicFontSize={arabicFontSize}
              translationFontSize={translationFontSize}
              showTranslation={showTranslation}
            />
          ))
        ) : (
          <p className="text-center text-gray-500 dark:text-dark-text-muted py-8">
            No Hadiths found in this chapter.
          </p>
        )}
      </div>
      {/* Back button is handled by DuaSyncApp's main back button now */}
    </div>
  );
};

export default AlKafiChapterView;
