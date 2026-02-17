const JSZip = require("jszip");
const fs = require("fs");

async function inspectAll() {
  const files = [
    "files/Lecture 1 - David - Introduction.pptx",
    "files/Lecture 2 - David - Custom Unions.pptx",
    "files/Lecture 3 - David - The Single Market.pptx",
    "files/Lecture 4 - David - Migration.pptx",
    "files/Lecture 5 - David - Regional Disparities.pptx"
  ];

  for (const file of files) {
    console.log("\n\n========================================");
    console.log("FILE:", file);
    console.log("========================================");

    const data = fs.readFileSync(file);
    const zip = await JSZip.loadAsync(data);

    // Check slide master for logo/images
    const masterXml = await zip.file("ppt/slideMasters/slideMaster1.xml").async("string");
    console.log("\n--- Slide Master shapes ---");
    extractShapes(masterXml);

    // Check all slides - just titles
    const slideFiles = Object.keys(zip.files)
      .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const na = parseInt(a.match(/\d+/)[0]);
        const nb = parseInt(b.match(/\d+/)[0]);
        return na - nb;
      });

    console.log("\n--- Title positions across all " + slideFiles.length + " slides ---");
    for (const sf of slideFiles) {
      const xml = await zip.file(sf).async("string");
      const slideNum = sf.match(/\d+/)[0];

      // Find title shape specifically
      const spRegex = /<p:sp>([\s\S]*?)<\/p:sp>/g;
      let match;
      while ((match = spRegex.exec(xml)) != null) {
        const sp = match[0];
        const nameMatch = sp.match(/name="([^"]*)"/);
        const name = nameMatch ? nameMatch[1] : "";

        if (name.toLowerCase().includes("title") || sp.includes('type="title"') || sp.includes('type="ctrTitle"')) {
          const offMatch = sp.match(/<a:off x="(\d+)" y="(\d+)"/);
          const extMatch = sp.match(/<a:ext cx="(\d+)" cy="(\d+)"/);
          const texts = [];
          const tRegex = /<a:t>([^<]*)<\/a:t>/g;
          let tm;
          while ((tm = tRegex.exec(sp)) != null) {
            texts.push(tm[1]);
          }
          const text = texts.join(" ").substring(0, 60);

          console.log("  Slide " + slideNum + ": x=" + (offMatch ? offMatch[1] : "inh") +
            " y=" + (offMatch ? offMatch[2] : "inh") +
            " cx=" + (extMatch ? extMatch[1] : "inh") +
            " cy=" + (extMatch ? extMatch[2] : "inh") +
            " \"" + text + "\"");
        }
      }
    }

    // Check content body positions too
    console.log("\n--- Content body positions ---");
    for (const sf of slideFiles.slice(1, 5)) {
      const xml = await zip.file(sf).async("string");
      const slideNum = sf.match(/\d+/)[0];

      const spRegex = /<p:sp>([\s\S]*?)<\/p:sp>/g;
      let match;
      while ((match = spRegex.exec(xml)) != null) {
        const sp = match[0];
        const nameMatch = sp.match(/name="([^"]*)"/);
        const name = nameMatch ? nameMatch[1] : "";

        if (name.toLowerCase().includes("content") || name.toLowerCase().includes("text")) {
          const offMatch = sp.match(/<a:off x="(\d+)" y="(\d+)"/);
          const extMatch = sp.match(/<a:ext cx="(\d+)" cy="(\d+)"/);

          console.log("  Slide " + slideNum + " [" + name + "]: x=" + (offMatch ? offMatch[1] : "inh") +
            " y=" + (offMatch ? offMatch[2] : "inh") +
            " cx=" + (extMatch ? extMatch[1] : "inh") +
            " cy=" + (extMatch ? extMatch[2] : "inh"));
        }
      }
    }
  }
}

function extractShapes(xml) {
  const spRegex = /<p:sp>([\s\S]*?)<\/p:sp>/g;
  let match;
  while ((match = spRegex.exec(xml)) != null) {
    const sp = match[0];
    const nameMatch = sp.match(/name="([^"]*)"/);
    const offMatch = sp.match(/<a:off x="(\d+)" y="(\d+)"/);
    const extMatch = sp.match(/<a:ext cx="(\d+)" cy="(\d+)"/);
    const texts = [];
    const tRegex = /<a:t>([^<]*)<\/a:t>/g;
    let tm;
    while ((tm = tRegex.exec(sp)) != null) {
      texts.push(tm[1]);
    }
    console.log("  SP: " + (nameMatch ? nameMatch[1] : "?") +
      " | pos:(" + (offMatch ? offMatch[1] : "inh") + "," + (offMatch ? offMatch[2] : "inh") + ")" +
      " size:(" + (extMatch ? extMatch[1] : "inh") + "," + (extMatch ? extMatch[2] : "inh") + ")" +
      " text:\"" + texts.join(" ").substring(0, 60) + "\"");
  }

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

inspectAll();
