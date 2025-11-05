export type Platform = 'instagram' | 'youtube' | 'tiktok';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  imageHint: string;
  platform: Platform;
  duration: string;
  category: Category;
  notes?: string;
  isFavorite: boolean;
  dateAdded: string;
  originalUrl: string;
}
