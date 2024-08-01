import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json({ limit: '200mb' }));

app.listen(8000, () => {
  console.log('Server is listening on port 8000');
});

app.post('/download-library', (req, res) => {
  const data = req.body;
  const filePath = path.join(path.resolve(), 'temp', 'library.json');
  if (!fs.existsSync(path.join(path.resolve(), 'temp'))) {
    fs.mkdirSync(path.join(path.resolve(), 'temp'));
  }
  fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error creating file');
    }
    res.setHeader('Content-Disposition', 'attachment; filename="library.json"');
    res.setHeader('Content-Type', 'application/json');
    res.download(filePath, 'library.json', (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error downloading file');
      }
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('Failed to delete temp file:', err);
        }
      });
    });
  });
});
