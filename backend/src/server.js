import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import archiver from 'archiver';

const app = express();
app.use(express.json({ limit: '200mb' }));
app.use(cors({ origin: 'http://localhost:3000' }));

app.listen(8000, () => {
  console.log('Server is listening on port 8000');
});

app.post('/download-library', (req, res) => {
  const data = req.body;
  const jsonFilePath = path.join(path.resolve(), 'temp', 'library.json');
  const zipFilePath = path.join(path.resolve(), 'temp', 'library.zip');
  if (!fs.existsSync(path.join(path.resolve(), 'temp'))) {
    fs.mkdirSync(path.join(path.resolve(), 'temp'));
  }
  fs.writeFile(jsonFilePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error creating file');
    }
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', () => {
      console.log(`Zip file size: ${archive.pointer()} bytes`);
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="library.zip"'
      );
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Length', fs.statSync(zipFilePath).size);
      res.download(zipFilePath, 'library.zip', (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Error downloading file');
        }
        fs.unlink(jsonFilePath, (err) => {
          if (err) {
            console.error('Failed to delete temp JSON file:', err);
          }
        });
        fs.unlink(zipFilePath, (err) => {
          if (err) {
            console.error('Failed to delete temp JSON file:', err);
          }
        });
      });
    });
    archive.on('error', (err) => {
      console.error('Error creating archive:', err);
      return res.status(500).send('Error creating zip file');
    });
    archive.pipe(output);
    archive.file(jsonFilePath, { name: 'library.json' });
    archive.finalize();
  });
});
