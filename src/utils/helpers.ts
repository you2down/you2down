import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Format ISO date to readable format
export const formatDate = (isoDate: string): string => {
  const date = parseISO(isoDate);
  return format(date, 'MMM dd, yyyy');
};

// Format relative time (e.g., "2 days ago")
export const formatRelativeTime = (isoDate: string): string => {
  const date = parseISO(isoDate);
  return formatDistanceToNow(date, { addSuffix: true });
};

// Format view count (e.g., 1,000,000 -> 1M)
export const formatViewCount = (count: string): string => {
  const num = parseInt(count, 10);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

// Format duration from ISO 8601 duration format
export const formatDuration = (isoDuration: string): string => {
  // Remove PT prefix
  const duration = isoDuration.substring(2);
  
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  
  // Extract hours, minutes, and seconds
  const hoursMatch = duration.match(/(\d+)H/);
  const minutesMatch = duration.match(/(\d+)M/);
  const secondsMatch = duration.match(/(\d+)S/);
  
  if (hoursMatch) hours = parseInt(hoursMatch[1], 10);
  if (minutesMatch) minutes = parseInt(minutesMatch[1], 10);
  if (secondsMatch) seconds = parseInt(secondsMatch[1], 10);
  
  // Format the duration
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};