import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/downloads', express.static(downloadsDir));

// Endpoint to download a YouTube video
app.post('/api/download', (req, res) => {
  const { videoId, format } = req.body;
  
  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const outputPath = path.join(downloadsDir, `${videoId}.%(ext)s`);
  
  // Format options
  const formatOption = format === 'audio' ? '-x --audio-format mp3' : '-f "best[height<=720]"';
  
  const command = `yt-dlp ${formatOption} -o "${outputPath}" ${videoUrl}`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }
    
    // Find the downloaded file
    fs.readdir(downloadsDir, (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to read downloads directory' });
      }
      
      const downloadedFile = files.find(file => file.startsWith(videoId));
      
      if (!downloadedFile) {
        return res.status(404).json({ error: 'Downloaded file not found' });
      }
      
      const fileUrl = `/downloads/${downloadedFile}`;
      res.json({ success: true, fileUrl });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});