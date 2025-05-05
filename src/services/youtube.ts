import axios from 'axios';
import { SearchParams, SearchResponse, VideoItem } from '../types';

const API_KEY = 'AIzaSyD0uyYqy1oknHLlbL5tzRiuxC4D4-LB6EE';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Search for videos
export const searchVideos = async (params: SearchParams): Promise<SearchResponse> => {
  try {
    const { query, maxResults = 10, videoDuration = 'any', publishedAfter, publishedBefore, videoType = 'videos' } = params;
    
    const videoDefinition = videoType === 'shorts' ? 'short' : undefined;
    const videoDurationParam = videoType === 'shorts' ? 'short' : videoDuration;
    
    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        maxResults,
        q: query,
        type: 'video',
        videoDuration: videoDurationParam,
        videoDefinition,
        publishedAfter,
        publishedBefore,
        order: 'date', // Force date ordering
        key: API_KEY
      }
    });

    // Get video IDs to fetch additional details
    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
    
    // Get content details and statistics for the videos
    const videoDetailsResponse = await axios.get(`${BASE_URL}/videos`, {
      params: {
        part: 'contentDetails,statistics',
        id: videoIds,
        key: API_KEY
      }
    });
    
    // Merge the search results with content details and statistics
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

    // Filter results based on videoType
    let filteredItems = itemsWithDetails;
    if (videoType === 'shorts') {
      filteredItems = itemsWithDetails.filter((item: VideoItem) => {
        const duration = item.contentDetails?.duration;
        return duration && convertDurationToSeconds(duration) <= 60;
      });
    } else if (videoType === 'videos') {
      filteredItems = itemsWithDetails.filter((item: VideoItem) => {
        const duration = item.contentDetails?.duration;
        return duration && convertDurationToSeconds(duration) > 60;
      });
    }

    // Sort items by publishedAt in descending order (newest first)
    filteredItems.sort((a: VideoItem, b: VideoItem) => {
      return new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime();
    });
    
    return {
      items: filteredItems,
      nextPageToken: response.data.nextPageToken,
      prevPageToken: response.data.prevPageToken
    };
  } catch (error) {
    console.error('Error searching videos:', error);
    throw error;
  }
};

// Helper function to convert ISO 8601 duration to seconds
const convertDurationToSeconds = (duration: string): number => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] ? parseInt(match[1]) : 0) * 3600;
  const minutes = (match[2] ? parseInt(match[2]) : 0) * 60;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  return hours + minutes + seconds;
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