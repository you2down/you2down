export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount: string;
}

export type DurationFilter = 'any' | 'short' | 'medium' | 'long';
export type DateFilter = 'any' | 'today' | 'thisWeek' | 'thisMonth' | 'thisYear';
export type VideoTypeFilter = 'videos' | 'shorts' | 'both';

export interface SearchFilters {
  duration: DurationFilter;
  date: DateFilter;
  videoType: VideoTypeFilter;
}

export interface SearchParams {
  query: string;
  maxResults?: number;
  videoDuration?: string;
  publishedAfter?: string;
  publishedBefore?: string;
  videoType?: VideoTypeFilter;
}

export interface DownloadOptions {
  quality: 'highest' | 'high' | 'medium' | 'low' | 'audio';
  format: 'mp4' | 'webm' | 'mp3';
}

export interface DownloadProgress {
  videoId: string;
  progress: number;
  status: 'waiting' | 'downloading' | 'converting' | 'complete' | 'error';
  error?: string;
}

export interface SearchResponse {
  items: VideoItem[];
  nextPageToken?: string;
  prevPageToken?: string;
}

export interface VideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
  contentDetails?: {
    duration: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
  };
}