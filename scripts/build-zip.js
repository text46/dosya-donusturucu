import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();
const rootDir = process.cwd();

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.aistudio']);
const EXCLUDE_FILES = new Set([
  '.DS_Store',
  'dosya-donusturucu-kaynak-kod.zip',
  'dosya-donusturucu-github.zip',
]);

function addDirectoryToZip(dirPath, zipFolder) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) {
        const subFolder = zipFolder.folder(entry.name);
        addDirectoryToZip(fullPath, subFolder);
      }
    } else if (entry.isFile()) {
      if (!EXCLUDE_FILES.has(entry.name)) {
        const fileData = fs.readFileSync(fullPath);
        zipFolder.file(entry.name, fileData);
      }
    }
  }
}

console.log('Tüm proje dosyaları (dahil: .github workflows) ZIP arşivine ekleniyor...');
addDirectoryToZip(rootDir, zip);

const pubDir = path.join(rootDir, 'public');
if (!fs.existsSync(pubDir)) {
  fs.mkdirSync(pubDir, { recursive: true });
}

const outputPath1 = path.join(pubDir, 'dosya-donusturucu-github.zip');
const outputPath2 = path.join(pubDir, 'dosya-donusturucu-kaynak-kod.zip');

zip
  .generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
  .then((buffer) => {
    fs.writeFileSync(outputPath1, buffer);
    fs.writeFileSync(outputPath2, buffer);
    console.log(`ZIP arşivi başarıyla oluşturuldu: ${outputPath1} (${Math.round(buffer.length / 1024)} KB)`);
  });
