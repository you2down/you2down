import axios from 'axios';
import { SearchParams, SearchResponse, VideoItem } from '../types';

const API_KEY = 'AIzaSyD0uyYqy1oknHLlbL5tzRiuxC4D4-LB6EE';
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export const searchVideos = async (params: SearchParams): Promise<SearchResponse> => {
  try {
    const { 
      query, 
      maxResults = 12, 
      videoDuration = 'any', 
      publishedAfter, 
      publishedBefore, 
      videoType = 'videos',
      pageToken 
    } = params;

    const response = await axios.get(`${BASE_URL}/search`, {
      params: {
        part: 'snippet',
        maxResults,
        q: query,
        type: 'video',
        videoDuration,
        publishedAfter,
        publishedBefore,
        pageToken,
        order: 'date', // Always sort by date to get newest videos first
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

    let filteredItems = itemsWithDetails;
    
    if (videoType !== 'both') {
      filteredItems = itemsWithDetails.filter((item: VideoItem) => {
        const duration = item.contentDetails?.duration;
        if (!duration) return true;
        
        const durationInSeconds = convertDurationToSeconds(duration);
        if (videoType === 'shorts') {
          return durationInSeconds <= 60;
        } else {
          return durationInSeconds > 60;
        }
      });
    }
    
    return {
      items: filteredItems,
      nextPageToken: response.data.nextPageToken,
      prevPageToken: response.data.prevPageToken,
      totalResults: response.data.pageInfo.totalResults
    };
  } catch (error) {
    console.error('Error searching videos:', error);
    throw error;
  }
};

const convertDurationToSeconds = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0') * 3600;
  const minutes = parseInt(match[2] || '0') * 60;
  const seconds = parseInt(match[3] || '0');
  return hours + minutes + seconds;
};

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

export const getDownloadHistory = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/downloads');
    return response.data;
  } catch (error) {
    console.error('Error fetching download history:', error);
    throw error;
  }
};

export const clearDownloadHistory = async () => {
  try {
    const response = await axios.delete('http://localhost:3001/api/downloads');
    return response.data;
  } catch (error) {
    console.error('Error clearing download history:', error);
    throw error;
  }
};