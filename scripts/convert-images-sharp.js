const sharp = require('sharp');
const path = require('path');

const base = path.join(__dirname, '../assets/images');

const files = [
  { input: path.join(base, 'banks/RCBC.webp'),         output: path.join(base, 'banks/RCBC.png') },
  { input: path.join(base, 'banks/landbank.webp'),     output: path.join(base, 'banks/landbank.png') },
  { input: path.join(base, 'banks/securitybank.webp'), output: path.join(base, 'banks/securitybank.png') },
  { input: path.join(base, 'banks/unionbank.webp'),    output: path.join(base, 'banks/unionbank.png') },
  { input: path.join(base, 'bills/youtubepremium.avif'), output: path.join(base, 'bills/youtubepremium.png') },
];

async function convertAll() {
  for (const { input, output } of files) {
    try {
      await sharp(input).png().toFile(output);
      console.log(`OK: ${output}`);
    } catch (err) {
      console.error(`FAILED: ${input} - ${err.message}`);
    }
  }
  console.log('Done!');
}

convertAll();
