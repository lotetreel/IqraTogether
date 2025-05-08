import React from 'react';
import * as LucideIcons from 'lucide-react'; // For potential future icons

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
            {section.hadiths.map((hadith, hadithIndex) => (
              <div key={`hadith-${sectionIndex}-${hadithIndex}`} className="p-3 border-l-4 border-primary-200 dark:border-primary-700 bg-white dark:bg-dark-bg-secondary rounded-r-md">
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-2">
                  Hadith {hadith.hadith_num}
                </p>
                {/* Arabic Text */}
                <div className="mb-3 text-right">
                  <p
                    className="leading-loose font-uthmani text-gray-800 dark:text-dark-text-primary"
                    dir="rtl"
                    style={{ fontSize: `${arabicFontSize}rem` }}
                  >
                    {hadith.arabic}
                  </p>
                </div>

                {/* English Translation */}
                {showTranslation && hadith.english && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <p
                      className="text-gray-700 dark:text-dark-text-secondary"
                      style={{ fontSize: `${translationFontSize}rem` }}
                    >
                      {hadith.english}
                    </p>
                  </div>
                )}
                 {/* Footnotes (if available) */}
                 {hadith.footnotes && hadith.footnotes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600">
                        <h6 className="text-xs font-semibold text-gray-500 dark:text-dark-text-muted mb-1">Footnotes:</h6>
                        <ul className="space-y-1">
                        {hadith.footnotes.map((footnote, noteIndex) => (
                            <li key={`footnote-${sectionIndex}-${hadithIndex}-${noteIndex}`} className="text-xs text-gray-600 dark:text-dark-text-secondary">
                              <span className="font-bold">{footnote.num}.</span> {footnote.text}
                            </li>
                        ))}
                        </ul>
                    </div>
                 )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HadithChapterView;
