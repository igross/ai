const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");

// Standard positions (in EMU - English Metric Units)
// Slide is 9144000 x 5143500 (16:9)
// Logo takes ~1475656 on the left
const TITLE_X = 1475656;
const TITLE_Y = 0;
const TITLE_CX = 7668344;
const TITLE_CY = 699542;

// Standard content body position for full-width slides
const CONTENT_X = 467544;
const CONTENT_Y = 771550;
const CONTENT_CX = 8229600;
const CONTENT_CY = 3888432;

const files = [
  "files/Lecture 1 - David - Introduction.pptx",
  "files/Lecture 2 - David - Custom Unions.pptx",
  "files/Lecture 3 - David - The Single Market.pptx",
  "files/Lecture 4 - David - Migration.pptx",
  "files/Lecture 5 - David - Regional Disparities.pptx"
];

async function fixFile(filePath) {
  console.log("\n========================================");
  console.log("Processing:", filePath);
  console.log("========================================");

  const data = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(data);

  const slideFiles = Object.keys(zip.files)
    .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0]);
      const nb = parseInt(b.match(/\d+/)[0]);
      return na - nb;
    });

  let changesCount = 0;

  for (const sf of slideFiles) {
    const slideNum = parseInt(sf.match(/\d+/)[0]);
    let xml = await zip.file(sf).async("string");
    let modified = false;

    // Skip title slide (slide 1)
    if (slideNum === 1) {
      continue;
    }

    // Fix title shapes
    // We need to find <p:sp> blocks that contain title placeholders
    const newXml = xml.replace(
      /(<p:sp>)([\s\S]*?)(<\/p:sp>)/g,
      function(fullMatch, open, inner, close) {
        // Check if this is a title shape
        const isTitle = inner.includes('type="title"') ||
                       (inner.match(/name="[^"]*[Tt]itle[^"]*"/) && inner.includes("<p:ph"));

        if (!isTitle) return fullMatch;

        // Check if it has an explicit xfrm in spPr
        const spPrMatch = inner.match(/(<p:spPr>)([\s\S]*?)(<\/p:spPr>)/);
        if (!spPrMatch) {
          // spPr exists but might be self-closing or empty
          const spPrSelf = inner.match(/<p:spPr\/>/);
          if (spPrSelf) {
            // Replace self-closing spPr with one containing the standard position
            const newSpPr = '<p:spPr><a:xfrm><a:off x="' + TITLE_X + '" y="' + TITLE_Y + '"/><a:ext cx="' + TITLE_CX + '" cy="' + TITLE_CY + '"/></a:xfrm></p:spPr>';
            const newInner = inner.replace(/<p:spPr\/>/, newSpPr);
            modified = true;
            console.log("  Slide " + slideNum + ": Added title position (was self-closing spPr)");
            return open + newInner + close;
          }
          return fullMatch;
        }

        const spPrContent = spPrMatch[2];

        // Check if there's already an xfrm
        const xfrmMatch = spPrContent.match(/<a:xfrm>[\s\S]*?<\/a:xfrm>/);

        if (xfrmMatch) {
          // Has explicit xfrm - check if it needs fixing
          const offMatch = xfrmMatch[0].match(/<a:off x="(\d+)" y="(\d+)"/);
          const extMatch = xfrmMatch[0].match(/<a:ext cx="(\d+)" cy="(\d+)"/);

          if (offMatch && extMatch) {
            const curX = parseInt(offMatch[1]);
            const curY = parseInt(offMatch[2]);
            const curCX = parseInt(extMatch[1]);
            const curCY = parseInt(extMatch[2]);

            // Only fix if position is off
            if (curX !== TITLE_X || curY !== TITLE_Y || curCX !== TITLE_CX || curCY !== TITLE_CY) {
              const newXfrm = '<a:xfrm><a:off x="' + TITLE_X + '" y="' + TITLE_Y + '"/><a:ext cx="' + TITLE_CX + '" cy="' + TITLE_CY + '"/></a:xfrm>';
              const newSpPrContent = spPrContent.replace(/<a:xfrm>[\s\S]*?<\/a:xfrm>/, newXfrm);
              const newInner = inner.replace(spPrMatch[0], spPrMatch[1] + newSpPrContent + spPrMatch[3]);
              modified = true;
              console.log("  Slide " + slideNum + ": Fixed title from (" + curX + "," + curY + ") to (" + TITLE_X + "," + TITLE_Y + ")");
              return open + newInner + close;
            }
          }
        } else {
          // No xfrm - add one with standard position
          const newXfrm = '<a:xfrm><a:off x="' + TITLE_X + '" y="' + TITLE_Y + '"/><a:ext cx="' + TITLE_CX + '" cy="' + TITLE_CY + '"/></a:xfrm>';
          const newSpPrContent = newXfrm + spPrContent;
          const newInner = inner.replace(spPrMatch[0], spPrMatch[1] + newSpPrContent + spPrMatch[3]);
          modified = true;
          console.log("  Slide " + slideNum + ": Added title position (was inherited)");
          return open + newInner + close;
        }

        return fullMatch;
      }
    );

    if (modified) {
      xml = newXml;
      changesCount++;
    }

    // Now fix content body positions for standard content slides
    // Only fix "Content Placeholder" shapes that have explicit wrong positions
    // Skip slides that have special layouts (pictures, two-column, etc.)
    const contentShapeCount = (xml.match(/name="Content Placeholder/g) || []).length;
    const pictureCount = (xml.match(/<p:pic>/g) || []).length;
    const hasSpecialLayout = contentShapeCount > 1 || pictureCount > 0;

    if (!hasSpecialLayout && contentShapeCount === 1) {
      const contentXml = xml.replace(
        /(<p:sp>)([\s\S]*?)(<\/p:sp>)/g,
        function(fullMatch, open, inner, close) {
          if (!inner.includes('name="Content Placeholder')) return fullMatch;

          const spPrMatch = inner.match(/(<p:spPr>)([\s\S]*?)(<\/p:spPr>)/);
          if (!spPrMatch) return fullMatch;

          const spPrContent = spPrMatch[2];
          const xfrmMatch = spPrContent.match(/<a:xfrm>[\s\S]*?<\/a:xfrm>/);

          if (xfrmMatch) {
            const offMatch = xfrmMatch[0].match(/<a:off x="(\d+)" y="(\d+)"/);
            const extMatch = xfrmMatch[0].match(/<a:ext cx="(\d+)" cy="(\d+)"/);

            if (offMatch && extMatch) {
              const curX = parseInt(offMatch[1]);
              const curY = parseInt(offMatch[2]);

              // Only fix if significantly off from standard
              if (Math.abs(curX - CONTENT_X) > 50000 || Math.abs(curY - CONTENT_Y) > 50000) {
                const newXfrm = '<a:xfrm><a:off x="' + CONTENT_X + '" y="' + CONTENT_Y + '"/><a:ext cx="' + CONTENT_CX + '" cy="' + CONTENT_CY + '"/></a:xfrm>';
                const newSpPrContent = spPrContent.replace(/<a:xfrm>[\s\S]*?<\/a:xfrm>/, newXfrm);
                const newInner = inner.replace(spPrMatch[0], spPrMatch[1] + newSpPrContent + spPrMatch[3]);
                console.log("  Slide " + slideNum + ": Fixed content body from (" + curX + "," + curY + ") to (" + CONTENT_X + "," + CONTENT_Y + ")");
                changesCount++;
                return open + newInner + close;
              }
            }
          }

          return fullMatch;
        }
      );
      xml = contentXml;
    }

    zip.file(sf, xml);
  }

  // Save the modified file (backup original first)
  const backupPath = filePath.replace(".pptx", " - BACKUP.pptx");
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
    console.log("  Backup saved to:", backupPath);
  }

  const output = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(filePath, output);
  console.log("  Saved! Total changes:", changesCount);
}

async function main() {
  for (const file of files) {
    await fixFile(file);
  }
  console.log("\n\nDone! All files processed.");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
