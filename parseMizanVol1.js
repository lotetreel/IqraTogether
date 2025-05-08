const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

const htmlFilePath = path.join(__dirname, 'client', 'public', 'data', 'MizanAlHikmah', 'the_scale_of_wisdom_01.htm');
const jsonOutputPath = path.join(__dirname, 'client', 'public', 'data', 'MizanAlHikmah', 'mizan_al_hikmah_vol1.json');

console.log(`Reading HTML file from: ${htmlFilePath}`);

try {
    const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
    const $ = cheerio.load(htmlContent);

    console.log('HTML loaded successfully. Starting parsing...');

    const chapters = [];
    let currentChapter = null;
    let currentSection = null;
    let currentHadithNum = 0; // Global hadith counter across sections
    let currentFootnoteSection = [];
    let pendingArabicChapter = null; // Store potential Arabic chapter title
    let pendingArabicSection = null; // Store potential Arabic section title

    // Function to clean text (remove extra spaces, newlines)
    const cleanText = (text) => {
        return text.replace(/\s+/g, ' ').trim();
    };

    // Function to extract footnotes associated with a hadith element
    const extractFootnotes = (element, footnoteMap) => {
        const footnotes = [];
        element.find('span.libFootnotenum').each((i, span) => {
            const num = parseInt($(span).text().trim(), 10);
            if (!isNaN(num) && footnoteMap[num]) {
                footnotes.push({ num: num, text: footnoteMap[num] });
            }
        });
        // Remove footnote spans from the text itself
        element.find('span.libFootnotenum').remove();
        return footnotes;
    };

    // Iterate through relevant elements within the book content
    $('#bookContent > *').each((index, element) => {
        const $el = $(element);
        const elTag = element.tagName;
        const elClass = $el.attr('class');
        const elText = cleanText($el.text());

        // --- Chapter Detection (Revised Logic) ---
        if (elTag === 'p' && elClass && elClass.includes('Heading1Center')) {
            const text = cleanText($el.text());
            const matchAr = text.match(/^(\d+)\s*-\s*(.+)/);
            const matchEn = text.match(/^(\d+)\s+(.+)/);

            if (matchAr) {
                // Found potential Arabic title
                pendingArabicChapter = { num: parseInt(matchAr[1], 10), title: matchAr[2] };
                console.log(`Stored Pending Arabic Chapter: ${JSON.stringify(pendingArabicChapter)}`);
                pendingArabicSection = null; // Reset pending section if new chapter starts
            } else if (matchEn && pendingArabicChapter && pendingArabicChapter.num === parseInt(matchEn[1], 10)) {
                // Found matching English title for pending Arabic title
                currentChapter = {
                    chapter_num: pendingArabicChapter.num,
                    chapter_title_ar: pendingArabicChapter.title,
                    chapter_title_en: matchEn[2],
                    sections: []
                };
                chapters.push(currentChapter);
                currentSection = null; // Reset section
                console.log(`\n--- Found Chapter ${currentChapter.chapter_num}: ${currentChapter.chapter_title_en} ---`);
                pendingArabicChapter = null; // Clear pending chapter
                pendingArabicSection = null; // Clear pending section
            } else {
                 // Not a matching sequence, clear pending titles
                 if (matchEn) console.log(`Found English Chapter ${matchEn[1]} but no matching pending Arabic chapter.`);
                 pendingArabicChapter = null;
                 pendingArabicSection = null;
            }
            return; // Processed as a potential heading part
        }

        // --- Section Detection (Revised Logic) ---
        if (currentChapter && elTag === 'p' && elClass && elClass.includes('Heading2Center')) {
            const text = cleanText($el.text());
            const matchAr = text.match(/^(\d+)\s*-\s*(.+)/);
            const matchEn = text.match(/^(\d+)\s+(.+)/);

             if (matchAr) {
                // Found potential Arabic title
                pendingArabicSection = { num: parseInt(matchAr[1], 10), title: matchAr[2] };
                console.log(`  Stored Pending Arabic Section: ${JSON.stringify(pendingArabicSection)}`);
            } else if (matchEn && pendingArabicSection && pendingArabicSection.num === parseInt(matchEn[1], 10)) {
                // Found matching English title for pending Arabic title
                currentSection = {
                    section_num: pendingArabicSection.num,
                    section_title_ar: pendingArabicSection.title,
                    section_title_en: matchEn[2],
                    hadiths: []
                };
                currentChapter.sections.push(currentSection);
                currentFootnoteSection = []; // Reset footnotes for new section
                console.log(`  --- Found Section ${currentSection.section_num}: ${currentSection.section_title_en} ---`);
                pendingArabicSection = null; // Clear pending section
            } else {
                 // Not a matching sequence, clear pending title
                 if (matchEn) console.log(`  Found English Section ${matchEn[1]} but no matching pending Arabic section.`);
                 pendingArabicSection = null;
            }
            return; // Processed as a potential heading part
        }

        // Clear pending titles if a non-heading element is encountered
        // to prevent incorrect matching across unrelated paragraphs.
        // We only clear if the element is NOT a footnote or hadith part.
        const isHadithPart = (elTag === 'p' && (elClass?.includes('libAr') || elClass?.includes('libNormal')));
        const isFootnotePart = (elTag === 'h3' && elText.toLowerCase() === 'notes') || (elTag === 'p' && elClass?.includes('libFootnote'));
        const isIndexRef = (elTag === 'a' && elClass?.includes('idxRef')); // Check for index ref link

        // Clear pending titles only if the intermediate element is not an expected part (hadith, footnote, index ref)
        if (!isHadithPart && !isFootnotePart && !isIndexRef) {
             if (pendingArabicChapter) {
                 console.log(`Clearing pending Arabic chapter due to intermediate element: <${elTag} class="${elClass || ''}">`);
                 pendingArabicChapter = null;
             }
             if (pendingArabicSection) {
                 console.log(`Clearing pending Arabic section due to intermediate element: <${elTag} class="${elClass || ''}">`);
                 pendingArabicSection = null;
             }
        }

        // --- Footnote Section Detection ---
        if (currentSection && elTag === 'h3' && elText.toLowerCase() === 'notes') {
            // Process the collected footnotes for the previous section's hadiths
            const footnoteMap = {};
            currentFootnoteSection.forEach(fn => {
                const match = fn.match(/^(\d+)\.\s*(.*)/);
                if (match) {
                    footnoteMap[parseInt(match[1], 10)] = cleanText(match[2]);
                }
            });

            // Assign footnotes to hadiths in the current section
            currentSection.hadiths.forEach(hadith => {
                const arabicFootnotes = extractFootnotes($(hadith.raw_arabic_element), footnoteMap);
                const englishFootnotes = extractFootnotes($(hadith.raw_english_element), footnoteMap);

                // Combine and deduplicate footnotes (preferring Arabic source if numbers match)
                const combinedFootnotes = {};
                arabicFootnotes.forEach(fn => combinedFootnotes[fn.num] = fn);
                englishFootnotes.forEach(fn => {
                    if (!combinedFootnotes[fn.num]) { // Add English only if Arabic doesn't exist for that number
                         combinedFootnotes[fn.num] = fn;
                    } else {
                        // Optionally merge/compare if needed, for now, Arabic takes precedence
                    }
                });

                hadith.footnotes = Object.values(combinedFootnotes).sort((a, b) => a.num - b.num);

                // Clean the hadith text after removing footnote spans
                hadith.arabic = cleanText($(hadith.raw_arabic_element).text());
                hadith.english = cleanText($(hadith.raw_english_element).text());

                // Remove temporary raw elements
                delete hadith.raw_arabic_element;
                delete hadith.raw_english_element;
            });

            console.log(`    Processed footnotes for Section ${currentSection.section_num}`);
            currentFootnoteSection = []; // Clear for next potential footnote block
            return; // Move to next element
        }

        // --- Footnote Line Collection ---
        if (currentSection && elTag === 'p' && elClass && elClass.includes('libFootnote')) {
            currentFootnoteSection.push(elText);
            return; // Collect footnote line and move on
        }


        // --- Hadith Detection ---
        if (currentSection && elTag === 'p' && elClass && elClass.includes('libAr')) {
            const arabicTextElement = $el;
            const hadithNumMatch = arabicTextElement.text().trim().match(/^(\d+)\./);

            if (hadithNumMatch) {
                currentHadithNum = parseInt(hadithNumMatch[1], 10);
                const nextElement = $el.next();

                if (nextElement.length > 0 && nextElement.is('p') && nextElement.hasClass('libNormal')) {
                    const englishTextElement = nextElement;
                    // Store raw elements temporarily to process footnotes later
                    const hadithData = {
                        hadith_num: currentHadithNum,
                        raw_arabic_element: arabicTextElement.clone(), // Clone to avoid modifying original during footnote extraction
                        raw_english_element: englishTextElement.clone(),
                        arabic: '', // Will be populated after footnote processing
                        english: '', // Will be populated after footnote processing
                        footnotes: []
                    };
                    currentSection.hadiths.push(hadithData);
                    console.log(`      Found Hadith ${currentHadithNum}`);
                    // Skip the next element since we've processed it as English text
                    // Note: This assumes English always directly follows Arabic. Adjust if needed.
                    $el.next().addClass('processed-english'); // Mark as processed
                }
            }
        } else if (currentSection && elTag === 'p' && elClass && elClass.includes('libNormal') && !$el.hasClass('processed-english')) {
            // Handle potential English text that wasn't immediately after Arabic (e.g., Qur'an verses)
            // Or handle cases where structure might deviate slightly.
            // For now, we assume strict Ar->En pairing based on the sample.
            // If needed, add logic here to associate standalone English text.
        }

        // Remove processed flag if it exists
        if ($el.hasClass('processed-english')) {
            $el.removeClass('processed-english');
        }

    });

    console.log(`\nParsing complete. Found ${chapters.length} chapters.`);

    // Final check for any remaining footnotes (e.g., if the last section didn't have an explicit "Notes" heading)
     if (currentSection && currentFootnoteSection.length > 0) {
         console.warn("Warning: Found unprocessed footnotes at the end. Processing them for the last section.");
         const footnoteMap = {};
         currentFootnoteSection.forEach(fn => {
             const match = fn.match(/^(\d+)\.\s*(.*)/);
             if (match) {
                 footnoteMap[parseInt(match[1], 10)] = cleanText(match[2]);
             }
         });
         currentSection.hadiths.forEach(hadith => {
             if (hadith.raw_arabic_element) { // Check if hadith needs footnote processing
                 const arabicFootnotes = extractFootnotes($(hadith.raw_arabic_element), footnoteMap);
                 const englishFootnotes = extractFootnotes($(hadith.raw_english_element), footnoteMap);
                 const combinedFootnotes = {};
                 arabicFootnotes.forEach(fn => combinedFootnotes[fn.num] = fn);
                 englishFootnotes.forEach(fn => {
                     if (!combinedFootnotes[fn.num]) combinedFootnotes[fn.num] = fn;
                 });
                 hadith.footnotes = Object.values(combinedFootnotes).sort((a, b) => a.num - b.num);
                 hadith.arabic = cleanText($(hadith.raw_arabic_element).text());
                 hadith.english = cleanText($(hadith.raw_english_element).text());
                 delete hadith.raw_arabic_element;
                 delete hadith.raw_english_element;
             }
         });
     }


    // Ensure output directory exists
    const outputDir = path.dirname(jsonOutputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }

    // Write JSON output
    fs.writeFileSync(jsonOutputPath, JSON.stringify(chapters, null, 2), 'utf-8');
    console.log(`Successfully parsed and wrote JSON to: ${jsonOutputPath}`);

} catch (error) {
    console.error("Error processing the file:", error);
}
