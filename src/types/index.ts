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

export interface SearchFilters {
  duration: DurationFilter;
  date: DateFilter;
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