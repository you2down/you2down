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

const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/downloads', express.static(downloadsDir));

app.get('/api/downloads', (req, res) => {
  fs.readdir(downloadsDir, (err, files) => {
    if (err) {
      console.error('Error reading downloads directory:', err);
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

app.delete('/api/downloads', (req, res) => {
  fs.readdir(downloadsDir, (err, files) => {
    if (err) {
      console.error('Error reading downloads directory:', err);
      return res.status(500).json({ error: 'Failed to read downloads directory' });
    }

    for (const file of files) {
      fs.unlinkSync(path.join(downloadsDir, file));
    }

    res.json({ message: 'Download history cleared successfully' });
  });
});

const checkFfmpeg = () => {
  return new Promise((resolve) => {
    exec('ffmpeg -version', (error) => {
      resolve(!error);
    });
  });
};

const checkYtDlp = () => {
  return new Promise((resolve) => {
    exec('yt-dlp --version', (error) => {
      resolve(!error);
    });
  });
};

app.post('/api/download', async (req, res) => {
  try {
    const { videoId, format, title } = req.body;
    
    if (!videoId || !title) {
      return res.status(400).json({ error: 'Video ID and title are required' });
    }

    // Check if yt-dlp is installed
    const hasYtDlp = await checkYtDlp();
    if (!hasYtDlp) {
      const error = 'yt-dlp is not installed. Please install it first.';
      console.error(error);
      return res.status(500).json({ error });
    }

    // Check if ffmpeg is installed when needed
    const hasFfmpeg = await checkFfmpeg();
    if (format === 'video' && !hasFfmpeg) {
      const error = 'ffmpeg is not installed. Please install it for video downloads.';
      console.error(error);
      return res.status(500).json({ error });
    }

    const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const outputPath = path.join(downloadsDir, `${videoId}_${sanitizedTitle}.%(ext)s`);
    
    const formatOption = format === 'audio' 
      ? '-x --audio-format mp3 --audio-quality 0' 
      : hasFfmpeg 
        ? '-f "bestvideo[height<=1080]+bestaudio" --merge-output-format mp4'
        : '-f "best[height<=1080]" --merge-output-format mp4';
    
    const command = `yt-dlp ${formatOption} -o "${outputPath}" ${videoUrl}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing yt-dlp:', error);
        console.error('Command output:', stdout);
        console.error('Command stderr:', stderr);
        
        // Provide more specific error messages based on the error output
        let errorMessage = 'Failed to download video.';
        if (stderr.includes('Video unavailable')) {
          errorMessage = 'This video is unavailable or private.';
        } else if (stderr.includes('This video is age-restricted')) {
          errorMessage = 'This video is age-restricted and cannot be downloaded.';
        } else if (stderr.includes('Sign in to confirm your age')) {
          errorMessage = 'This video requires age verification and cannot be downloaded.';
        }
        
        return res.status(500).json({ error: errorMessage });
      }
      
      if (stderr) {
        console.warn('yt-dlp stderr (non-fatal):', stderr);
      }
      
      fs.readdir(downloadsDir, (err, files) => {
        if (err) {
          console.error('Error reading downloads directory:', err);
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
  } catch (error) {
    console.error('Unexpected error in download endpoint:', error);
    res.status(500).json({ 
      error: 'An unexpected error occurred',
      details: error.message 
    });
  }
});

// Serve static files before the catch-all route
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all route to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});