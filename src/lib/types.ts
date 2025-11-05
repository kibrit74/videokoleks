export type Platform = 'instagram' | 'youtube' | 'tiktok';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  userId: string;
}

export interface Video {
  id: string;
  title: string;
  thumbnailUrl: string;
  imageHint: string;
  platform: Platform;
  duration: string;
  category: Category; // Denormalized for easier display
  categoryId: string; // For filtering and querying
  notes?: string;
  isFavorite: boolean;
  dateAdded: any; // Firestore Timestamp
  originalUrl: string;
  userId: string;
}
