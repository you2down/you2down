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

// Store download progress
const downloadProgress = new Map();

// Get download progress
app.get('/api/download/progress/:videoId', (req, res) => {
  const progress = downloadProgress.get(req.params.videoId) || { progress: 0, status: 'waiting' };
  res.json(progress);
});

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
        videoId: file.split('_')[0]
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

// Endpoint to download a YouTube video
app.post('/api/download', async (req, res) => {
  const { videoId, format, title } = req.body;
  
  if (!videoId || !title) {
    return res.status(400).json({ error: 'Video ID and title are required' });
  }

  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const outputPath = path.join(downloadsDir, `${videoId}_${sanitizedTitle}.%(ext)s`);
  
  // Format options for best quality video and audio
  const formatOption = format === 'audio' 
    ? '--format bestaudio --extract-audio --audio-format mp3 --audio-quality 0' 
    : '-f "((bv*[fps>30]/bv*)[height>=720]/(wv*[fps>30]/wv*)) + ba"';
  
  downloadProgress.set(videoId, { progress: 0, status: 'downloading' });
  
  const command = `yt-dlp ${formatOption} --progress-template "progress:%(progress._percent)s" -o "${outputPath}" ${videoUrl}`;
  
  const downloadProcess = exec(command);
  
  downloadProcess.stdout.on('data', (data) => {
    const match = data.match(/progress:(\d+(\.\d+)?)/);
    if (match) {
      const progress = parseFloat(match[1]);
      downloadProgress.set(videoId, { progress, status: 'downloading' });
    }
  });
  
  downloadProcess.on('close', (code) => {
    if (code === 0) {
      downloadProgress.set(videoId, { progress: 100, status: 'complete' });
      
      // Find the downloaded file
      fs.readdir(downloadsDir, (err, files) => {
        if (err) {
          downloadProgress.set(videoId, { progress: 0, status: 'error', error: 'Failed to read downloads directory' });
          return res.status(500).json({ error: 'Failed to read downloads directory' });
        }
        
        const downloadedFile = files.find(file => file.includes(videoId));
        
        if (!downloadedFile) {
          downloadProgress.set(videoId, { progress: 0, status: 'error', error: 'Downloaded file not found' });
          return res.status(404).json({ error: 'Downloaded file not found' });
        }
        
        const fileUrl = `/downloads/${downloadedFile}`;
        res.json({ success: true, fileUrl });
      });
    } else {
      downloadProgress.set(videoId, { progress: 0, status: 'error', error: 'Download failed' });
      res.status(500).json({ error: 'Download failed' });
    }
  });
  
  downloadProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});