import { config } from 'dotenv';
config();

import '@/ai/flows/auto-categorize-videos.ts';
import '@/ai/flows/generate-category-suggestions.ts';
import '@/ai/flows/summarize-video-content.ts';