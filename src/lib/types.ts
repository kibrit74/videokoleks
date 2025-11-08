export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'facebook';

export interface Category {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
}

export interface Video {
  id:string;
  userId: string;
  title: string;
  thumbnailUrl: string;
  imageHint: string;
  platform: Platform;
  duration: string;
  categoryId: string; 
  notes?: string;
  isFavorite: boolean;
  dateAdded: any; // Firestore Timestamp
  originalUrl: string;
}
