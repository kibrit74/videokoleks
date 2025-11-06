export type Platform = 'instagram' | 'youtube' | 'tiktok';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  userId: string;
}

export interface Video {
  id:string;
  title: string;
  thumbnailUrl: string;
  imageHint: string;
  platform: Platform;
  duration: string;
  categoryId: string; // Correctly referencing by ID
  notes?: string;
  isFavorite: boolean;
  dateAdded: any; // Firestore Timestamp
  originalUrl: string;
  userId: string; // Essential for security rules
}
