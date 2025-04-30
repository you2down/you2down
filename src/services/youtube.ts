import axios from 'axios';
import { SearchParams, SearchResponse, VideoItem } from '../types';

const API_KEY = 'AIzaSyD0uyYqy1oknHLlbL5tzRiuxC4D4-LB6EE';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Search for videos
export const searchVideos = async (params: SearchParams): Promise<SearchResponse> => {
  try {
    const { query, maxResults = 10, videoDuration = 'any', publishedAfter, publishedBefore, order = 'relevance' } = params;
    
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        maxResults,
        q: query,
        type: 'video',
        videoDuration,
        publishedAfter,
        publishedBefore,
        order,
        key: API_KEY
      }
    });

    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
    
    const videoDetailsResponse = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'contentDetails,statistics',
        id: videoIds,
        key: API_KEY
      }
    });
    
    const itemsWithDetails = response.data.items.map((item: VideoItem) => {
      const details = videoDetailsResponse.data.items.find(
        (detail: any) => detail.id === item.id.videoId
      );
      
      return {
        ...item,
        contentDetails: details?.contentDetails,
        statistics: details?.statistics
      };
    });
    
    return {
      items: itemsWithDetails,
      nextPageToken: response.data.nextPageToken,
      prevPageToken: response.data.prevPageToken
    };
  } catch (error) {
    console.error('Error searching videos:', error);
    throw error;
  }
};

// Download a video
export const downloadVideo = async (videoId: string, format: 'video' | 'audio', title: string): Promise<string> => {
  try {
    const response = await axios.post('http://localhost:3001/api/download', { 
      videoId,
      format,
      title
    });
    
    return response.data.fileUrl;
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
};

// Get download history
export const getDownloadHistory = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/downloads');
    return response.data;
  } catch (error) {
    console.error('Error fetching download history:', error);
    throw error;
  }
};

// Clear download history
export const clearDownloadHistory = async () => {
  try {
    const response = await axios.delete('http://localhost:3001/api/downloads');
    return response.data;
  } catch (error) {
    console.error('Error clearing download history:', error);
    throw error;
  }
};

// Create a new collection
export const createCollection = async (name: string) => {
  try {
    const response = await axios.post('http://localhost:3001/api/collections', { name });
    return response.data;
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

// Delete a collection
export const deleteCollection = async (name: string) => {
  try {
    const response = await axios.delete(`http://localhost:3001/api/collections/${name}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
};

// Move video to collection
export const moveVideoToCollection = async (collectionName: string, videoId: string, filename: string) => {
  try {
    const response = await axios.post(`http://localhost:3001/api/collections/${collectionName}/videos`, {
      videoId,
      filename
    });
    return response.data;
  } catch (error) {
    console.error('Error moving video to collection:', error);
    throw error;
  }
};

// Remove video from collection
export const removeVideoFromCollection = async (collectionName: string, filename: string) => {
  try {
    const response = await axios.delete(`http://localhost:3001/api/collections/${collectionName}/videos/${filename}`);
    return response.data;
  } catch (error) {
    console.error('Error removing video from collection:', error);
    throw error;
  }
};

// Get collection contents
export const getCollectionContents = async (name: string) => {
  try {
    const response = await axios.get(`http://localhost:3001/api/collections/${name}`);
    return response.data;
  } catch (error) {
    console.error('Error getting collection contents:', error);
    throw error;
  }
};