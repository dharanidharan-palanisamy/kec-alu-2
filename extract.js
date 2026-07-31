const Jimp = require('jimp');

function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

async function extractPoints(filename, outputFile, maxPoints = 15000) {
  try {
    const image = await Jimp.Jimp.read(filename);
    const width = image.bitmap.width;
    const height = image.bitmap.height;
    
    console.log(`Processing ${filename}: ${width}x${height}`);

    const points = [];
    const maxDim = Math.max(width, height);
    
    // Scan all pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const hex = image.getPixelColor(x, y);
        const rgba = Jimp.intToRGBA(hex);
        
        // If not fully transparent
        if (rgba.a > 50) {
          const colorHex = '#' + 
            rgba.r.toString(16).padStart(2, '0') + 
            rgba.g.toString(16).padStart(2, '0') + 
            rgba.b.toString(16).padStart(2, '0');
            
          points.push({
            x: Number(((x - width/2) / maxDim).toFixed(4)),
            y: Number(((y - height/2) / maxDim).toFixed(4)),
            c: colorHex
          });
        }
      }
    }
    
    console.log(`Found ${points.length} non-transparent pixels.`);
    
    // Shuffle the points to ensure even distribution for sampling
    shuffle(points);
    
    // Sub-sample to maxPoints
    let sampled = points;
    if (points.length > maxPoints) {
      sampled = points.slice(0, maxPoints);
    }
    
    // Spatial sort so that adjacent points in the array are geographically nearby
    // This fixes the long yellow lines across the logo in script.js
    sampled.sort((a, b) => {
      const cellA_X = Math.floor(a.x * 50);
      const cellA_Y = Math.floor(a.y * 50);
      const cellB_X = Math.floor(b.x * 50);
      const cellB_Y = Math.floor(b.y * 50);
      
      const cellA = cellA_Y * 1000 + cellA_X;
      const cellB = cellB_Y * 1000 + cellB_X;
      
      if (cellA === cellB) {
        return a.x - b.x;
      }
      return cellA - cellB;
    });
    
    // Create the js content
    const jsContent = `// Logo pixel points with real colors from ${filename}\nconst companyLogoPoints = ${JSON.stringify(sampled)};\n`;
    
    const fs = require('fs');
    fs.writeFileSync(outputFile, jsContent);
    console.log(`Wrote ${sampled.length} points to ${outputFile}`);
    
  } catch (err) {
    console.error('Error processing', filename, err);
  }
}

// 22000 points to keep text very clear and structured
extractPoints('kec.png', 'logo_points.js', 22000);
