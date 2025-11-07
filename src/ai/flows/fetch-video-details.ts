'use server';

/**
 * @fileOverview A Genkit flow for fetching video details (title, thumbnail) from a URL using Gemini.
 *
 * This is a server-side flow that leverages an AI prompt to extract metadata,
 * which is more robust than traditional scraping.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FetchVideoDetailsInputSchema = z.object({
  videoUrl: z.string().url().describe('The URL of the video.'),
});

export type FetchVideoDetailsInput = z.infer<
  typeof FetchVideoDetailsInputSchema
>;

const FetchVideoDetailsOutputSchema = z.object({
  title: z.string().optional().describe('The title of the video.'),
  thumbnailUrl: z
    .string()
    .url()
    .optional()
    .describe('The thumbnail URL of the video.'),
});

export type FetchVideoDetailsOutput = z.infer<
  typeof FetchVideoDetailsOutputSchema
>;

export async function fetchVideoDetails(
  input: FetchVideoDetailsInput
): Promise<FetchVideoDetailsOutput> {
  return fetchVideoDetailsFlow(input);
}

// Define a new prompt that uses AI to extract the details.
const videoMetadataPrompt = ai.definePrompt({
    name: 'videoMetadataPrompt',
    input: { schema: FetchVideoDetailsInputSchema },
    output: { schema: FetchVideoDetailsOutputSchema },
    prompt: `You are an expert web metadata extractor. Given a URL, your task is to identify the primary title and the main video thumbnail image for the video content on that page.

    Your primary goal is to find the 'og:image' meta tag for the thumbnail URL and the 'og:title' meta tag for the title.
    
    IMPORTANT: Ignore any images that are logos, profile pictures, or not directly representative of the video content itself (e.g., ignore images like 'mobile_nav_type_logo.png'). The thumbnail should be the actual preview of the video.

    If 'og:image' or 'og:title' is not available, use the main <title> tag and the most relevant image that serves as the video's cover image.
    
    URL: {{{videoUrl}}}
    
    Return only the JSON object with the title and thumbnailUrl.`,
});


// The flow now calls the AI prompt instead of scraping.
const fetchVideoDetailsFlow = ai.defineFlow(
  {
    name: 'fetchVideoDetailsFlow',
    inputSchema: FetchVideoDetailsInputSchema,
    outputSchema: FetchVideoDetailsOutputSchema,
  },
  async ({ videoUrl }) => {
    try {
        const { output } = await videoMetadataPrompt({ videoUrl });

        // If the model returns nothing, return explicit undefined fields.
        if (!output) {
            console.warn(`AI could not extract any details for: ${videoUrl}`);
            return { title: undefined, thumbnailUrl: undefined };
        }

        // If the model returns partial data, return it as is.
        // The client will handle the missing fields.
        if (!output.title || !output.thumbnailUrl) {
            console.warn(`AI could only extract partial details for: ${videoUrl}`, output);
        }
        
        return output;

    } catch (error) {
      console.error('Error getting video details from AI:', error);
      // On failure, return undefined fields to prevent the app from crashing.
      return { title: undefined, thumbnailUrl: undefined };
    }
  }
);
