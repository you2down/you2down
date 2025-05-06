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
  const outputPath = path.join(downloadsDir, `${videoId}_${sanitizedTitle}.mp4`);
  
  downloadProgress.set(videoId, { progress: 0, status: 'downloading' });
  
  // Download best quality video and audio separately, then merge
  const tempVideoPath = path.join(downloadsDir, `${videoId}_temp_video.mp4`);
  const tempAudioPath = path.join(downloadsDir, `${videoId}_temp_audio.m4a`);
  
  const downloadVideo = `yt-dlp -f "bv*[ext=mp4][height>=720]" --progress-template "progress:%(progress._percent)s" -o "${tempVideoPath}" ${videoUrl}`;
  const downloadAudio = `yt-dlp -f "ba[ext=m4a]" --progress-template "progress:%(progress._percent)s" -o "${tempAudioPath}" ${videoUrl}`;
  const mergeCommand = `ffmpeg -i "${tempVideoPath}" -i "${tempAudioPath}" -c:v copy -c:a aac "${outputPath}"`;
  
  try {
    // Download video
    await new Promise((resolve, reject) => {
      const process = exec(downloadVideo);
      
      process.stdout.on('data', (data) => {
        const match = data.match(/progress:(\d+(\.\d+)?)/);
        if (match) {
          const progress = parseFloat(match[1]) * 0.4; // 40% for video download
          downloadProgress.set(videoId, { progress, status: 'downloading video' });
        }
      });
      
      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Video download failed'));
      });
    });
    
    // Download audio
    await new Promise((resolve, reject) => {
      const process = exec(downloadAudio);
      
      process.stdout.on('data', (data) => {
        const match = data.match(/progress:(\d+(\.\d+)?)/);
        if (match) {
          const progress = 40 + parseFloat(match[1]) * 0.4; // 40% for audio download
          downloadProgress.set(videoId, { progress, status: 'downloading audio' });
        }
      });
      
      process.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Audio download failed'));
      });
    });
    
    // Merge video and audio
    downloadProgress.set(videoId, { progress: 80, status: 'merging' });
    await new Promise((resolve, reject) => {
      exec(mergeCommand, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    
    // Clean up temporary files
    fs.unlinkSync(tempVideoPath);
    fs.unlinkSync(tempAudioPath);
    
    downloadProgress.set(videoId, { progress: 100, status: 'complete' });
    res.json({ success: true, fileUrl: `/downloads/${videoId}_${sanitizedTitle}.mp4` });
  } catch (error) {
    console.error('Download error:', error);
    downloadProgress.set(videoId, { progress: 0, status: 'error', error: error.message });
    
    // Clean up any temporary files
    if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
    if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
    
    res.status(500).json({ error: 'Download failed' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});