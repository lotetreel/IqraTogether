import React from 'react';
import * as LucideIcons from 'lucide-react'; // For potential future icons
import HadithDisplayItem from './HadithDisplayItem'; // Import the component

const HadithChapterView = ({
  chapterFullContent, // Contains chapter_num, titles, and sections array
  arabicFontSize,
  translationFontSize,
  showTranslation,
  // Add other props if needed, e.g., onBack, isHost, etc.
}) => {

  if (!chapterFullContent || !chapterFullContent.sections) {
    return (
      <div className="text-center py-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
        <LucideIcons.AlertCircle size={48} className="mx-auto text-yellow-400 dark:text-yellow-500 mb-4" />
        <p className="text-yellow-700 dark:text-yellow-300 mb-2 font-medium">No Hadith Data</p>
        <p className="text-sm text-yellow-600 dark:text-yellow-400">Chapter content is missing or invalid.</p>
      </div>
    );
  }

  const { chapter_num, chapter_title_ar, chapter_title_en, sections } = chapterFullContent;

  return (
    <div className="space-y-8 p-4 md:p-6 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md">
      {/* Chapter Title */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary-700 dark:text-primary-300 mb-2">
          Chapter {chapter_num}: {chapter_title_en}
        </h2>
        <h3 className="text-xl md:text-2xl font-uthmani text-gray-800 dark:text-dark-text-primary" dir="rtl">
          {chapter_title_ar}
        </h3>
      </div>

      {/* Sections and Hadiths */}
      {sections.map((section, sectionIndex) => (
        <div key={`section-${sectionIndex}`} className="mb-8 p-4 border border-gray-100 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary">
          {/* Section Title */}
          {(section.section_title_en || section.section_title_ar) && (
            <div className="mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
              <h4 className="text-lg md:text-xl font-semibold text-gray-700 dark:text-dark-text-secondary">
                {section.section_num ? `${section.section_num}. ` : ''}{section.section_title_en}
              </h4>
              {section.section_title_ar && (
                <h5 className="text-lg md:text-xl font-uthmani text-gray-600 dark:text-dark-text-secondary mt-1 text-right" dir="rtl">
                  {section.section_title_ar}
                </h5>
              )}
            </div>
          )}

          {/* Hadiths within the section */}
          <div className="space-y-6">
            {section.hadiths.map((hadith, hadithIndex) => {
              // Adapt the hadith object to the structure expected by HadithDisplayItem
              const hadithForItem = {
                id: hadith.hadith_num,
                arabicText: hadith.arabic,
                englishText: hadith.english,
                // Note: The current data structure in this view doesn't have separate sanad/matn
                // HadithDisplayItem will fall back to using englishText
              };

              return (
                <HadithDisplayItem
                  key={`hadith-${sectionIndex}-${hadithIndex}`}
                  hadith={hadithForItem}
                  arabicFontSize={arabicFontSize}
                  translationFontSize={translationFontSize}
                  showTranslation={showTranslation}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HadithChapterView;
