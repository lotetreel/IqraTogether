const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

// MODIFIED: Input path for Volume 3
const htmlFilePath = path.join(__dirname, 'client', 'public', 'data', 'MizanAlHikmah', 'the_scale_of_wisdom_03.htm');
// MODIFIED: Output path for Volume 3
const jsonOutputPath = path.join(__dirname, 'client', 'public', 'data', 'MizanAlHikmah', 'mizan_al_hikmah_vol3.json');

console.log(`Reading HTML file from: ${htmlFilePath}`);

try {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    console.log('HTML loaded successfully. Starting parsing...');

    const chapters = []; // Final clean data structure
    let currentChapter = null; // Reference to the current chapter object in 'chapters'
    let currentSection = null; // Reference to the current section object in a chapter
    let currentHadithNum = 0;
    let currentFootnoteSection = []; // Stores raw footnote text lines
    let pendingArabicChapter = null;
    let pendingArabicSection = null;

    // Temporary storage for footnote numbers associated with hadiths in the current section
    // Key: hadith_num, Value: { arabic: [nums], english: [nums] }
    let sectionFootnoteRefs = {};

    const cleanText = (text) => {
        return text.replace(/\s+/g, ' ').trim();
    };

    // Function to extract footnote numbers from a Cheerio element
    const extractFootnoteNumbers = (element) => {
        const nums = [];
        element.find('span.libFootnotenum').each((i, span) => {
            const num = parseInt($(span).text().trim(), 10);
            if (!isNaN(num)) {
                nums.push(num);
            }
        });
        return nums;
    };

    $('#bookContent > *').each((index, element) => {
        const $el = $(element);
        const elTag = element.tagName;
        const elClass = $el.attr('class');
        const elText = cleanText($el.text());

        let isChapterTitle = false;
        let isSectionTitle = false;

        // --- Chapter/Section Detection (Prioritize Chapter) ---
        if (elTag === 'p' && elClass && elClass.includes('Heading2Center')) {
            const text = cleanText($el.text());
            // Try matching English Chapter (ALL CAPS)
            const matchEnChapter = text.match(/^(\d+)\s+([A-Z\s()]+)$/);
            // Try matching Arabic Chapter (Number - Text)
            const matchArChapter = text.match(/^(\d+)\s*-\s*(.+)/);

            if (matchEnChapter && !$el.hasClass('processed-chapter-en')) {
                isChapterTitle = true;
                const chapterNum = parseInt(matchEnChapter[1], 10);
                const chapterTitleEn = matchEnChapter[2];
                if (pendingArabicChapter && pendingArabicChapter.num === chapterNum) {
                    // Match found for pending Arabic chapter
                    currentChapter = {
                        chapter_num: chapterNum,
                        chapter_title_ar: pendingArabicChapter.title,
                        chapter_title_en: chapterTitleEn,
                        sections: []
                    };
                    chapters.push(currentChapter);
                    currentSection = null;
                    console.log(`\n--- Found Chapter ${chapterNum}: ${chapterTitleEn} (matched pending Arabic) ---`);
                    pendingArabicChapter = null;
                    pendingArabicSection = null;
                } else {
                    // English chapter found without matching pending Arabic
                    console.warn(`Found English Chapter ${chapterNum} (${chapterTitleEn}) without matching pending Arabic title.`);
                    currentChapter = {
                        chapter_num: chapterNum,
                        chapter_title_ar: `[ARABIC TITLE PENDING ${chapterNum}]`, // Placeholder
                        chapter_title_en: chapterTitleEn,
                        sections: []
                    };
                    chapters.push(currentChapter);
                    currentSection = null;
                    pendingArabicChapter = null; // Clear any previous pending chapter
                    pendingArabicSection = null;
                }
            } else if (matchArChapter) {
                 // Could be an Arabic Chapter title OR an Arabic Section title
                 // Check if the next element is the corresponding English Chapter title
                 const nextElement = $el.next();
                 let isPairedChapter = false;
                 if (nextElement.length > 0 && nextElement.is('p') && nextElement.hasClass('Heading2Center')) {
                     const nextText = cleanText(nextElement.text());
                     const nextMatchEn = nextText.match(/^(\d+)\s+([A-Z\s()]+)$/); // English Chapter ALL CAPS
                     if (nextMatchEn && parseInt(matchArChapter[1], 10) === parseInt(nextMatchEn[1], 10)) {
                         // This is a paired Arabic/English chapter title
                         isChapterTitle = true;
                         isPairedChapter = true;
                         currentChapter = {
                             chapter_num: parseInt(matchArChapter[1], 10),
                             chapter_title_ar: matchArChapter[2],
                             chapter_title_en: nextMatchEn[2],
                             sections: []
                         };
                         chapters.push(currentChapter);
                         currentSection = null;
                         console.log(`\n--- Found Chapter ${currentChapter.chapter_num}: ${currentChapter.chapter_title_en} (paired) ---`);
                         pendingArabicChapter = null;
                         pendingArabicSection = null;
                         nextElement.addClass('processed-chapter-en'); // Mark English element as processed
                     }
                 }

                 if (!isPairedChapter) {
                     // Could still be an Arabic Chapter title (store pending) OR an Arabic Section title
                     // Let's tentatively store as pending chapter, but also check for section match later
                     pendingArabicChapter = { num: parseInt(matchArChapter[1], 10), title: matchArChapter[2] };
                     pendingArabicSection = null; // Reset pending section
                     // We don't mark isChapterTitle=true yet, let section check run
                 }

            }

            // --- Section Detection (Only if not identified as a chapter title above) ---
            if (!isChapterTitle && currentChapter) {
                // Match Arabic section format: "999 - الشّباب‏" (same as Arabic chapter, needs context)
                const matchArSection = text.match(/^(\d+)\s*-\s*(.+)/);
                // Match English section format: "999. YOUTH" or "999 YOUTH" (can be mixed case)
                const matchEnSection = text.match(/^(\d+)\.?\s+(.+)/);

                if (matchArSection) {
                    // If we just stored a pending Arabic chapter with the same number, this is likely the section
                    if (pendingArabicChapter && pendingArabicChapter.num === parseInt(matchArSection[1], 10)) {
                         // This confirms the previous element was NOT a chapter title, but this section's title
                         pendingArabicSection = { num: pendingArabicChapter.num, title: pendingArabicChapter.title };
                         pendingArabicChapter = null; // Clear the wrongly assumed pending chapter
                         isSectionTitle = true;
                         // console.log(`  Reclassified pending Arabic Chapter ${pendingArabicSection.num} as Section.`);
                    } else {
                         // Store as pending section
                         pendingArabicSection = { num: parseInt(matchArSection[1], 10), title: matchArSection[2] };
                         isSectionTitle = true;
                    }

                } else if (matchEnSection) {
                    isSectionTitle = true;
                    const sectionNum = parseInt(matchEnSection[1], 10);
                    const sectionTitleEn = matchEnSection[2];
                    if (pendingArabicSection && pendingArabicSection.num === sectionNum) {
                        // Found English section matching a pending Arabic one
                        currentSection = {
                            section_num: sectionNum,
                            section_title_ar: pendingArabicSection.title,
                            section_title_en: sectionTitleEn,
                            hadiths: []
                        };
                        currentChapter.sections.push(currentSection);
                        currentFootnoteSection = [];
                        sectionFootnoteRefs = {};
                        console.log(`  --- Found Section ${sectionNum}: ${sectionTitleEn} (matched pending Arabic) ---`);
                        pendingArabicSection = null;
                    } else {
                        // Found English section without matching pending Arabic
                        console.warn(`  Found English Section ${sectionNum} (${sectionTitleEn}) without matching pending Arabic section.`);
                        currentSection = {
                            section_num: sectionNum,
                            section_title_ar: `[ARABIC TITLE PENDING ${sectionNum}]`, // Placeholder
                            section_title_en: sectionTitleEn,
                            hadiths: []
                        };
                        currentChapter.sections.push(currentSection);
                        currentFootnoteSection = [];
                        sectionFootnoteRefs = {};
                        pendingArabicSection = null; // Clear pending if any mismatch
                    }
                }
            }

            // Clear processed flag if it exists
            if ($el.hasClass('processed-chapter-en')) {
                $el.removeClass('processed-chapter-en');
            }

            // If it was identified as either chapter or section title, skip further processing for this element
            if (isChapterTitle || isSectionTitle) {
                 // If it was *only* a pending Arabic chapter title, don't return yet,
                 // let intermediate element check clear it if necessary.
                 if (!(pendingArabicChapter && !isChapterTitle && !isSectionTitle)) {
                     return;
                 }
            }
        } // End of Heading2Center check


        // --- Intermediate Element Handling (Clearing Pending Titles) ---
        const isHadithPart = (elTag === 'p' && (elClass?.includes('libAr') || elClass?.includes('libNormal')));
        const isFootnotePart = (elTag === 'h3' && elText.toLowerCase() === 'notes') || (elTag === 'p' && elClass?.includes('libFootnote'));
        const isIndexRef = (elTag === 'a' && elClass?.includes('idxRef'));
        const isIgnorable = (elTag === 'br') || (elTag === 'a' && elClass?.includes('idxEnt')) || (elTag === 'p' && $el.find('img').length > 0) || (elTag === 'p' && elClass?.includes('libCenter')); // Ignore page breaks, index entries, image paragraphs, centered text

        if (!isHadithPart && !isFootnotePart && !isIndexRef && !isIgnorable) {
             if (pendingArabicChapter) {
                 // console.log(`Clearing pending Arabic chapter due to intermediate element: <${elTag} class="${elClass || ''}"> ${elText.substring(0,50)}`);
                 pendingArabicChapter = null;
             }
             if (pendingArabicSection) {
                 // console.log(`Clearing pending Arabic section due to intermediate element: <${elTag} class="${elClass || ''}"> ${elText.substring(0,50)}`);
                 pendingArabicSection = null;
             }
        }

        // --- Footnote Section Processing ---
        if (currentSection && elTag === 'h3' && elText.toLowerCase() === 'notes') {
            // Build the map of footnote number to footnote text
            const footnoteMap = {};
            currentFootnoteSection.forEach(fn => {
                const match = fn.match(/^(\d+)\.?\s*(.*)/); // Allow optional dot
                if (match) {
                    footnoteMap[parseInt(match[1], 10)] = cleanText(match[2]);
                } else {
                    // Handle potential multi-line footnotes or other formats if necessary
                    // For now, just warn if the standard pattern isn't matched
                    console.warn(`    Could not parse footnote line start: ${fn.substring(0, 50)}...`);
                    // Attempt to append to previous footnote if it exists and current line doesn't start with number
                    const lastFnNum = Object.keys(footnoteMap).pop();
                    if (lastFnNum && !/^\d/.test(fn)) {
                         footnoteMap[lastFnNum] += ' ' + cleanText(fn);
                         console.log(`      Appended to footnote ${lastFnNum}`);
                    }
                }
            });

            // Assign footnotes to the PLAIN hadith objects using the stored refs
            currentSection.hadiths.forEach(hadith => {
                const refs = sectionFootnoteRefs[hadith.hadith_num];
                if (refs) {
                    const combinedFootnoteNumbers = [...new Set([...refs.arabic, ...refs.english])];
                    combinedFootnoteNumbers.sort((a, b) => a - b);

                    hadith.footnotes = combinedFootnoteNumbers
                        .map(num => footnoteMap[num] ? { num: num, text: footnoteMap[num] } : null)
                        .filter(fn => fn !== null); // Filter out any numbers not found in the map

                    if (hadith.footnotes.length !== combinedFootnoteNumbers.length) {
                         console.warn(`      Mismatch in footnote count for Hadith ${hadith.hadith_num}. Refs: ${JSON.stringify(combinedFootnoteNumbers)}, Found: ${hadith.footnotes.map(f=>f.num)}`);
                    }

                } else {
                    hadith.footnotes = []; // Ensure footnotes array exists
                }
            });

            console.log(`    Processed footnotes for Section ${currentSection.section_num}`);
            currentFootnoteSection = []; // Clear collected footnote text
            sectionFootnoteRefs = {}; // Clear refs for the processed section
            return;
        }

        // --- Footnote Line Collection ---
        if (currentSection && elTag === 'p' && elClass && elClass.includes('libFootnote')) {
            currentFootnoteSection.push(elText);
            return;
        }

        // --- Hadith Detection ---
        if (currentSection && elTag === 'p' && elClass && elClass.includes('libAr')) {
            const arabicElement = $el; // Keep reference to original element
            const hadithNumMatch = arabicElement.text().trim().match(/^(\d+)\./);

            if (hadithNumMatch) {
                currentHadithNum = parseInt(hadithNumMatch[1], 10);
                const nextElement = $el.next();

                if (nextElement.length > 0 && nextElement.is('p') && nextElement.hasClass('libNormal')) {
                    const englishElement = nextElement; // Keep reference to original element

                    // Clone elements temporarily for processing (extracting numbers, removing spans)
                    const arabicClone = arabicElement.clone();
                    const englishClone = englishElement.clone();

                    // Extract footnote numbers BEFORE removing spans
                    const arabicFootnoteNums = extractFootnoteNumbers(arabicClone);
                    const englishFootnoteNums = extractFootnoteNumbers(englishClone);

                    // Store references for later processing
                    sectionFootnoteRefs[currentHadithNum] = {
                        arabic: arabicFootnoteNums,
                        english: englishFootnoteNums
                    };

                    // Remove footnote spans from clones to get clean text
                    arabicClone.find('span.libFootnotenum').remove();
                    englishClone.find('span.libFootnotenum').remove();

                    // Create PLAIN hadith object with clean text
                    const hadithData = {
                        hadith_num: currentHadithNum,
                        arabic: cleanText(arabicClone.text()),
                        english: cleanText(englishClone.text()),
                        footnotes: [] // Will be populated later
                    };
                    currentSection.hadiths.push(hadithData);
                    console.log(`      Found Hadith ${currentHadithNum}`);

                    // Mark the original English element as processed to avoid double handling
                    englishElement.addClass('processed-english');
                } else {
                     console.warn(`      Found Arabic Hadith ${currentHadithNum} but no matching English paragraph (.libNormal) immediately after.`);
                }
            } else {
                 console.warn(`      Found Arabic paragraph (.libAr) without a starting number: ${arabicElement.text().substring(0,50)}...`);
            }
        }

        // Remove processed flag from original element if it exists
        if ($el.hasClass('processed-english')) {
            $el.removeClass('processed-english');
        }
    });

    console.log(`\nParsing complete. Found ${chapters.length} chapters.`);

    // Final footnote processing (if footnotes collected but no <h3>Notes</h3> found at end)
     if (currentSection && currentFootnoteSection.length > 0) {
         console.warn("Warning: Found unprocessed footnotes at the end. Processing them for the last section.");
         const footnoteMap = {};
         currentFootnoteSection.forEach(fn => {
             const match = fn.match(/^(\d+)\.?\s*(.*)/); // Allow optional dot
             if (match) {
                 footnoteMap[parseInt(match[1], 10)] = cleanText(match[2]);
             } else {
                 console.warn(`    Could not parse footnote line start (end of file): ${fn.substring(0, 50)}...`);
                 const lastFnNum = Object.keys(footnoteMap).pop();
                 if (lastFnNum && !/^\d/.test(fn)) {
                      footnoteMap[lastFnNum] += ' ' + cleanText(fn);
                      console.log(`      Appended to footnote ${lastFnNum} (end of file)`);
                 }
             }
         });

         // Assign footnotes to the PLAIN hadith objects
         currentSection.hadiths.forEach(hadith => {
             const refs = sectionFootnoteRefs[hadith.hadith_num];
             if (refs) {
                 const combinedFootnoteNumbers = [...new Set([...refs.arabic, ...refs.english])];
                 combinedFootnoteNumbers.sort((a, b) => a - b);

                 hadith.footnotes = combinedFootnoteNumbers
                     .map(num => footnoteMap[num] ? { num: num, text: footnoteMap[num] } : null)
                     .filter(fn => fn !== null);

                 if (hadith.footnotes.length !== combinedFootnoteNumbers.length) {
                      console.warn(`      Mismatch in footnote count for Hadith ${hadith.hadith_num} (end of file). Refs: ${JSON.stringify(combinedFootnoteNumbers)}, Found: ${hadith.footnotes.map(f=>f.num)}`);
                 }
             } else {
                 // This case should ideally not happen if hadith was added correctly
                 if (!hadith.footnotes) hadith.footnotes = [];
             }
         });
     }

    // Ensure output directory exists
    const outputDir = path.dirname(jsonOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }

    // Write JSON output - should now be safe as 'chapters' contains only plain data
    fs.writeFileSync(jsonOutputPath, JSON.stringify(chapters, null, 2), 'utf-8');
    console.log(`Successfully parsed and wrote JSON to: ${jsonOutputPath}`);

} catch (error) {
    console.error("Error processing the file:", error);
}
