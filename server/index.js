import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create base directories
const downloadsDir = path.join(__dirname, 'downloads');
const collectionsDir = path.join(__dirname, 'collections');
const metadataPath = path.join(__dirname, 'metadata.xml');

[downloadsDir, collectionsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
  attributeNamePrefix: '@_'
});

// Initialize metadata.xml if it doesn't exist
if (!fs.existsSync(metadataPath)) {
  const initialXML = {
    '?xml': { '@_version': '1.0', '@_encoding': 'UTF-8' },
    library: {
      collections: { collection: [] },
      videos: { video: [] }
    }
  };
  fs.writeFileSync(metadataPath, builder.build(initialXML));
}

const readMetadata = () => {
  try {
    const xmlData = fs.readFileSync(metadataPath, 'utf-8');
    const parsed = parser.parse(xmlData);
    
    // Ensure the structure exists
    if (!parsed.library) {
      parsed.library = {
        collections: { collection: [] },
        videos: { video: [] }
      };
    }
    
    if (!parsed.library.collections) {
      parsed.library.collections = { collection: [] };
    }
    
    if (!parsed.library.videos) {
      parsed.library.videos = { video: [] };
    }
    
    // Ensure arrays for empty collections and videos
    if (!Array.isArray(parsed.library.collections.collection)) {
      parsed.library.collections.collection = parsed.library.collections.collection ? [parsed.library.collections.collection] : [];
    }
    
    if (!Array.isArray(parsed.library.videos.video)) {
      parsed.library.videos.video = parsed.library.videos.video ? [parsed.library.videos.video] : [];
    }
    
    return parsed;
  } catch (error) {
    console.error('Error reading metadata:', error);
    // Return default structure if reading fails
    return {
      library: {
        collections: { collection: [] },
        videos: { video: [] }
      }
    };
  }
};

const writeMetadata = (data) => {
  try {
    // Ensure proper structure before writing
    if (!data.library) {
      data.library = {
        collections: { collection: [] },
        videos: { video: [] }
      };
    }
    
    const xmlString = builder.build(data);
    fs.writeFileSync(metadataPath, xmlString);
  } catch (error) {
    console.error('Error writing metadata:', error);
    throw error;
  }
};

// Configure CORS with specific options
const corsOptions = {
  origin: ['http://localhost:5173', 'https://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files with correct paths
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));
app.use('/collections', express.static(path.join(__dirname, 'collections')));

// Get download history
app.get('/api/downloads', (req, res) => {
  try {
    const metadata = readMetadata();
    res.json(metadata.library.videos.video || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read download history' });
  }
});

// Clear download history
app.delete('/api/downloads', (req, res) => {
  try {
    fs.readdirSync(downloadsDir).forEach(file => {
      fs.unlinkSync(path.join(downloadsDir, file));
    });

    const metadata = readMetadata();
    metadata.library.videos.video = [];
    writeMetadata(metadata);

    res.json({ message: 'Download history cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear download history' });
  }
});

// Create a new collection
app.post('/api/collections', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Collection name is required' });
  }

  const collectionPath = path.join(collectionsDir, name);
  
  try {
    if (!fs.existsSync(collectionPath)) {
      fs.mkdirSync(collectionPath);
      
      const metadata = readMetadata();
      metadata.library.collections.collection.push({
        '@_name': name,
        '@_created': new Date().toISOString(),
        videos: { video: [] }
      });
      writeMetadata(metadata);
      
      res.json({ message: 'Collection created successfully', path: collectionPath });
    } else {
      res.status(409).json({ error: 'Collection already exists' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// Delete a collection
app.delete('/api/collections/:name', (req, res) => {
  const { name } = req.params;
  const collectionPath = path.join(collectionsDir, name);

  try {
    if (fs.existsSync(collectionPath)) {
      // Move all videos back to downloads
      fs.readdirSync(collectionPath).forEach(file => {
        const sourcePath = path.join(collectionPath, file);
        const destPath = path.join(downloadsDir, file);
        fs.renameSync(sourcePath, destPath);
      });

      fs.rmSync(collectionPath, { recursive: true, force: true });

      const metadata = readMetadata();
      metadata.library.collections.collection = metadata.library.collections.collection.filter(
        c => c['@_name'] !== name
      );
      writeMetadata(metadata);

      res.json({ message: 'Collection deleted successfully' });
    } else {
      res.status(404).json({ error: 'Collection not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete collection' });
  }
});

// Move video to collection
app.post('/api/collections/:name/videos', (req, res) => {
  const { name } = req.params;
  const { videoId, filename, title, thumbnail } = req.body;
  
  if (!videoId || !filename) {
    return res.status(400).json({ error: 'Video ID and filename are required' });
  }

  const sourcePath = path.join(downloadsDir, filename);
  const collectionPath = path.join(collectionsDir, name);
  const destinationPath = path.join(collectionPath, filename);

  try {
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    if (!fs.existsSync(collectionPath)) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    fs.renameSync(sourcePath, destinationPath);

    const metadata = readMetadata();
    const collection = metadata.library.collections.collection.find(c => c['@_name'] === name);
    if (collection) {
      if (!collection.videos) {
        collection.videos = { video: [] };
      }
      if (!Array.isArray(collection.videos.video)) {
        collection.videos.video = collection.videos.video ? [collection.videos.video] : [];
      }
      collection.videos.video.push({
        '@_id': videoId,
        '@_filename': filename,
        '@_added': new Date().toISOString(),
        '@_size': fs.statSync(destinationPath).size,
        title: title || filename,
        thumbnail: thumbnail || ''
      });
      writeMetadata(metadata);
    }

    res.json({ message: 'Video moved to collection successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to move video to collection' });
  }
});

// Remove video from collection
app.delete('/api/collections/:name/videos/:filename', (req, res) => {
  const { name, filename } = req.params;
  const sourcePath = path.join(collectionsDir, name, filename);
  const destinationPath = path.join(downloadsDir, filename);

  try {
    if (!fs.existsSync(sourcePath)) {
      return res.status(404).json({ error: 'Video not found in collection' });
    }

    fs.renameSync(sourcePath, destinationPath);

    const metadata = readMetadata();
    const collection = metadata.library.collections.collection.find(c => c['@_name'] === name);
    if (collection && collection.videos && Array.isArray(collection.videos.video)) {
      collection.videos.video = collection.videos.video.filter(v => v['@_filename'] !== filename);
      writeMetadata(metadata);
    }

    res.json({ message: 'Video removed from collection successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove video from collection' });
  }
});

// Get collection contents
app.get('/api/collections/:name', (req, res) => {
  const { name } = req.params;
  const collectionPath = path.join(collectionsDir, name);

  try {
    if (!fs.existsSync(collectionPath)) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const metadata = readMetadata();
    const collection = metadata.library.collections.collection.find(c => c['@_name'] === name);
    
    if (!collection) {
      return res.status(404).json({ error: 'Collection metadata not found' });
    }

    res.json(collection.videos?.video || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read collection contents' });
  }
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
  const { videoId, format, title, thumbnail } = req.body;
  
  if (!videoId || !title) {
    return res.status(400).json({ error: 'Video ID and title are required' });
  }

  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const outputPath = path.join(downloadsDir, `${videoId}_${sanitizedTitle}.%(ext)s`);
  
  const hasFfmpeg = await checkFfmpeg();
  
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
    
    fs.readdir(downloadsDir, (err, files) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to read downloads directory' });
      }
      
      const downloadedFile = files.find(file => file.includes(videoId));
      
      if (!downloadedFile) {
        return res.status(404).json({ error: 'Downloaded file not found' });
      }

      const filePath = path.join(downloadsDir, downloadedFile);
      const fileStats = fs.statSync(filePath);

      // Update metadata
      const metadata = readMetadata();
      if (!Array.isArray(metadata.library.videos.video)) {
        metadata.library.videos.video = [];
      }
      metadata.library.videos.video.push({
        '@_id': videoId,
        '@_filename': downloadedFile,
        '@_downloaded': new Date().toISOString(),
        '@_size': fileStats.size,
        title,
        thumbnail: thumbnail || ''
      });
      writeMetadata(metadata);
      
      const fileUrl = `/downloads/${downloadedFile}`;
      res.json({ success: true, fileUrl });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});