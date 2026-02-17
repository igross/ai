const JSZip = require("jszip");
const fs = require("fs");

async function inspectSlides(file) {
  const data = fs.readFileSync(file);
  const zip = await JSZip.loadAsync(data);

  const slideFiles = Object.keys(zip.files)
    .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0]);
      const nb = parseInt(b.match(/\d+/)[0]);
      return na - nb;
    });

  console.log("File:", file);
  console.log("Total slides:", slideFiles.length);

  // Also check slide master and layout for inherited positions
  const layoutFiles = Object.keys(zip.files).filter(f => f.match(/^ppt\/slideLayouts\/slideLayout\d+\.xml$/));
  for (const lf of layoutFiles.slice(0, 3)) {
    const xml = await zip.file(lf).async("string");
    console.log("\n=== " + lf + " (layout) ===");
    extractShapes(xml);
  }

  for (const sf of slideFiles.slice(0, 6)) {
    const xml = await zip.file(sf).async("string");
    console.log("\n=== " + sf + " ===");
    extractShapes(xml);
  }
}

function extractShapes(xml) {
  const shapes = [];

  // Match sp elements
  const spRegex = /<p:sp>([\s\S]*?)<\/p:sp>/g;
  let match;
  while ((match = spRegex.exec(xml)) != null) {
    const sp = match[0];
    const nameMatch = sp.match(/name="([^"]*)"/);
    const offMatch = sp.match(/<a:off x="(\d+)" y="(\d+)"/);
    const extMatch = sp.match(/<a:ext cx="(\d+)" cy="(\d+)"/);
    const phMatch = sp.match(/<p:ph([^>]*?)\/>/);

    // Get all text runs
    const texts = [];
    const tRegex = /<a:t>([^<]*)<\/a:t>/g;
    let tm;
    while ((tm = tRegex.exec(sp)) != null) {
      texts.push(tm[1]);
    }
    const text = texts.join(" ").substring(0, 80);

    console.log("  SP: " + (nameMatch ? nameMatch[1] : "?") +
      " | pos:(" + (offMatch ? offMatch[1] : "inh") + "," + (offMatch ? offMatch[2] : "inh") + ")" +
      " size:(" + (extMatch ? extMatch[1] : "inh") + "," + (extMatch ? extMatch[2] : "inh") + ")" +
      " ph:" + (phMatch ? phMatch[1].trim() : "none") +
      " text:\"" + text + "\"");
  }

  // Match pic elements
  const picRegex = /<p:pic>([\s\S]*?)<\/p:pic>/g;
  while ((match = picRegex.exec(xml)) != null) {
    const pic = match[0];
    const nameMatch = pic.match(/name="([^"]*)"/);
    const offMatch = pic.match(/<a:off x="(\d+)" y="(\d+)"/);
    const extMatch = pic.match(/<a:ext cx="(\d+)" cy="(\d+)"/);
    console.log("  PIC: " + (nameMatch ? nameMatch[1] : "?") +
      " | pos:(" + (offMatch ? offMatch[1] : "inh") + "," + (offMatch ? offMatch[2] : "inh") + ")" +
      " size:(" + (extMatch ? extMatch[1] : "inh") + "," + (extMatch ? extMatch[2] : "inh") + ")");
  }
}

inspectSlides("files/Lecture 1 - David - Introduction.pptx");
