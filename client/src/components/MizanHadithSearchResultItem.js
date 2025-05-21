import React from 'react';
import * as LucideIcons from 'lucide-react';

const MizanHadithSearchResultItem = ({ resultItem }) => {
  // Destructure for easier access, assuming resultItem contains the hadith object directly
  // and also the pre-formatted source information.
  const {
    volumeNumber,
    chapterNumber,
    chapterTitleEn,
    chapterTitleAr,
    sectionNumber,
    sectionTitleEn,
    sectionTitleAr,
    // hadithNumberInChapter, // This was the hadith.hadith_num from the original search logic
    // The actual hadith content is expected to be in a nested 'hadith' object if not flattened.
    // Based on previous step, resultItem IS the hadith object from searchResults,
    // which already has source info flattened and hadith content like .arabic, .english
  } = resultItem;

  // If the hadith content itself is nested, e.g., resultItem.hadith.arabic, adjust accordingly.
  // From the previous step's searchResults structure:
  // { ...hadith, volumeNumber, chapterNumber, ... }
  // So, hadith details are directly on resultItem.
  const hadith_num = resultItem.hadith_num; // or resultItem.hadithNumberInChapter if that's preferred
  const arabicText = resultItem.arabic;
  const englishText = resultItem.english;
  const footnotes = resultItem.footnotes;

  return (
    <div className="card p-4 sm:p-6 bg-white dark:bg-dark-bg-secondary shadow-lg rounded-xl mb-6">
      {/* Source Information */}
      <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-dark-text-muted flex items-center">
          <LucideIcons.BookOpen size={16} className="inline mr-2 text-primary-500 dark:text-primary-400" />
          Volume: {volumeNumber}, Chapter: {chapterNumber}
        </p>
        <h3 className="text-md font-semibold text-gray-700 dark:text-dark-text-secondary mt-1">
          {chapterTitleEn}
        </h3>
        {chapterTitleAr && (
          <h4 className="text-md font-uthmani text-gray-600 dark:text-dark-text-secondary text-right mt-1" dir="rtl">
            {chapterTitleAr}
          </h4>
        )}
        {sectionTitleEn && (
          <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-2 flex items-center">
            <LucideIcons.ChevronRight size={14} className="inline mr-1 text-gray-400 dark:text-gray-500" />
            Section {sectionNumber}: {sectionTitleEn}
            {sectionTitleAr && (
              <span dir="rtl" className="font-uthmani ml-1">
                / {sectionTitleAr}
              </span>
            )}
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1 flex items-center">
          <LucideIcons.Hash size={14} className="inline mr-1 text-gray-400 dark:text-gray-500" />
          Hadith No: {hadith_num}
        </p>
      </div>

      {/* Hadith Content */}
      <div className="space-y-4">
        {arabicText && (
          <div>
            <p className="text-right font-uthmani text-2xl text-gray-800 dark:text-dark-text leading-relaxed" dir="rtl">
              {arabicText}
            </p>
          </div>
        )}
        {englishText && (
          <div>
            <p className="text-gray-700 dark:text-dark-text-secondary text-lg leading-relaxed">
              {englishText}
            </p>
          </div>
        )}
        {footnotes && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
            <p className="text-sm text-gray-500 dark:text-dark-text-muted leading-relaxed flex items-start">
              <LucideIcons.Footprints size={16} className="inline-block mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0" style={{ marginTop: '0.25rem' }} />
              <span>{footnotes}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MizanHadithSearchResultItem;
