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

// Get download history
app.get('/api/downloads', (req, res) => {
  fs.readdir(downloadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read downloads directory' });
    }
    
    const downloads = files.map(file => {
      const stats = fs.statSync(path.join(downloadsDir, file));
      return {
        filename: file,
        downloadedAt: stats.mtime,
        size: stats.size,
        videoId: file.split('_')[0] // Extract videoId from filename
      };
    });
    
    res.json(downloads.sort((a, b) => b.downloadedAt - a.downloadedAt));
  });
});

// Clear download history
app.delete('/api/downloads', (req, res) => {
  fs.readdir(downloadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read downloads directory' });
    }

    for (const file of files) {
      fs.unlinkSync(path.join(downloadsDir, file));
    }

    res.json({ message: 'Download history cleared successfully' });
  });
});

// Check if ffmpeg is installed
const checkFfmpeg = () => {
  return new Promise((resolve) => {
    exec('ffmpeg -version', (error) => {
      resolve(!error);
    });
  });
};

// Endpoint to download a YouTube video
app.post('/api/download', async (req, res) => {
  const { videoId, format, title } = req.body;
  
  if (!videoId || !title) {
    return res.status(400).json({ error: 'Video ID and title are required' });
  }

  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const outputPath = path.join(downloadsDir, `${videoId}_${sanitizedTitle}.%(ext)s`);
  
  const hasFfmpeg = await checkFfmpeg();
  
  // Format options with 1080p for video
  const formatOption = format === 'audio' 
    ? '-x --audio-format mp3 --audio-quality 0' 
    : hasFfmpeg 
      ? '-f "bestvideo[height<=1080]+bestaudio" --merge-output-format mp4'
      : '-f "best[height<=1080]" --merge-output-format mp4';
  
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
      
      const downloadedFile = files.find(file => file.includes(videoId));
      
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