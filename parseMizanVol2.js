const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

// MODIFIED: Input path for Volume 2
const htmlFilePath = path.join(__dirname, 'client', 'public', 'data', 'MizanAlHikmah', 'the_scale_of_wisdom_02.htm');
// MODIFIED: Output path for Volume 2
const jsonOutputPath = path.join(__dirname, 'client', 'public', 'data', 'MizanAlHikmah', 'mizan_al_hikmah_vol2.json');

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

        // --- Chapter Detection ---
        if (elTag === 'p' && elClass && elClass.includes('Heading1Center')) {
            const text = cleanText($el.text());
            const matchAr = text.match(/^(\d+)\s*-\s*(.+)/);
            const matchEn = text.match(/^(\d+)\s+(.+)/);

            if (matchAr) {
                pendingArabicChapter = { num: parseInt(matchAr[1], 10), title: matchAr[2] };
                // console.log(`Stored Pending Arabic Chapter: ${JSON.stringify(pendingArabicChapter)}`);
                pendingArabicSection = null;
            } else if (matchEn && pendingArabicChapter && pendingArabicChapter.num === parseInt(matchEn[1], 10)) {
                // Create PLAIN chapter object
                currentChapter = {
                    chapter_num: pendingArabicChapter.num,
                    chapter_title_ar: pendingArabicChapter.title,
                    chapter_title_en: matchEn[2],
                    sections: [] // Array for PLAIN section objects
                };
                chapters.push(currentChapter);
                currentSection = null; // Reset section reference
                console.log(`\n--- Found Chapter ${currentChapter.chapter_num}: ${currentChapter.chapter_title_en} ---`);
                pendingArabicChapter = null;
                pendingArabicSection = null;
            } else {
                 if (matchEn) console.log(`Found English Chapter ${matchEn[1]} but no matching pending Arabic chapter.`);
                 pendingArabicChapter = null;
                 pendingArabicSection = null;
            }
            return;
        }

        // --- Section Detection ---
        if (currentChapter && elTag === 'p' && elClass && elClass.includes('Heading2Center')) {
            const text = cleanText($el.text());
            const matchAr = text.match(/^(\d+)\s*-\s*(.+)/);
            const matchEn = text.match(/^(\d+)\s+(.+)/);

             if (matchAr) {
                pendingArabicSection = { num: parseInt(matchAr[1], 10), title: matchAr[2] };
                // console.log(`  Stored Pending Arabic Section: ${JSON.stringify(pendingArabicSection)}`);
            } else if (matchEn && pendingArabicSection && pendingArabicSection.num === parseInt(matchEn[1], 10)) {
                // Create PLAIN section object
                currentSection = {
                    section_num: pendingArabicSection.num,
                    section_title_ar: pendingArabicSection.title,
                    section_title_en: matchEn[2],
                    hadiths: [] // Array for PLAIN hadith objects
                };
                currentChapter.sections.push(currentSection);
                currentFootnoteSection = []; // Reset footnotes for new section
                sectionFootnoteRefs = {}; // Reset footnote refs for new section
                console.log(`  --- Found Section ${currentSection.section_num}: ${currentSection.section_title_en} ---`);
                pendingArabicSection = null;
            } else {
                 if (matchEn) console.log(`  Found English Section ${matchEn[1]} but no matching pending Arabic section.`);
                 pendingArabicSection = null;
            }
            return;
        }

        // --- Intermediate Element Handling (Clearing Pending Titles) ---
        const isHadithPart = (elTag === 'p' && (elClass?.includes('libAr') || elClass?.includes('libNormal')));
        const isFootnotePart = (elTag === 'h3' && elText.toLowerCase() === 'notes') || (elTag === 'p' && elClass?.includes('libFootnote'));
        const isIndexRef = (elTag === 'a' && elClass?.includes('idxRef'));
        if (!isHadithPart && !isFootnotePart && !isIndexRef) {
             if (pendingArabicChapter) {
                 // console.log(`Clearing pending Arabic chapter due to intermediate element: <${elTag} class="${elClass || ''}">`);
                 pendingArabicChapter = null;
             }
             if (pendingArabicSection) {
                 // console.log(`Clearing pending Arabic section due to intermediate element: <${elTag} class="${elClass || ''}">`);
                 pendingArabicSection = null;
             }
        }

        // --- Footnote Section Processing ---
        if (currentSection && elTag === 'h3' && elText.toLowerCase() === 'notes') {
            // Build the map of footnote number to footnote text
            const footnoteMap = {};
            currentFootnoteSection.forEach(fn => {
                const match = fn.match(/^(\d+)\.\s*(.*)/);
                if (match) {
                    footnoteMap[parseInt(match[1], 10)] = cleanText(match[2]);
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
             const match = fn.match(/^(\d+)\.\s*(.*)/);
             if (match) {
                 footnoteMap[parseInt(match[1], 10)] = cleanText(match[2]);
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
