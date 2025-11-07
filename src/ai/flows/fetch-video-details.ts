'use server';

/**
 * @fileOverview A Genkit flow for fetching video details (title, thumbnail) from a URL.
 *
 * This is a server-side flow that scrapes the video URL to extract metadata.
 * It uses a proxy for Instagram to bypass CORS and falls back to direct fetch for others.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { parse } from 'node-html-parser';

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

// This flow is defined to run on the server and can use Node.js APIs.
const fetchVideoDetailsFlow = ai.defineFlow(
  {
    name: 'fetchVideoDetailsFlow',
    inputSchema: FetchVideoDetailsInputSchema,
    outputSchema: FetchVideoDetailsOutputSchema,
  },
  async ({ videoUrl }) => {
    try {
      let fetchUrl = videoUrl;
      const isInstagram = videoUrl.includes('instagram.com');
      const isFacebook = videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch');
      
      // For Instagram and Facebook, use a CORS proxy to fetch the HTML content.
      if (isInstagram || isFacebook) {
        fetchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(videoUrl)}`;
      }

      const response = await fetch(fetchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      let html = await response.text();

      // If using the proxy, the actual HTML is inside a JSON response's "contents" field.
      if (isInstagram || isFacebook) {
        try {
            const jsonResponse = JSON.parse(html);
            html = jsonResponse.contents;
        } catch (e) {
            // If JSON.parse fails, it's likely because the response was already raw HTML.
            // No action needed, just proceed with the html as is.
        }
      }
      
      if (!html) {
        throw new Error('No HTML content received from proxy or direct fetch.');
      }

      const root = parse(html);

      const title =
        root.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        root.querySelector('title')?.text;
      
      const thumbnailUrl = 
        root.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        root.querySelector('meta[property="og:image:secure_url"]')?.getAttribute('content');

      return {
        title: title?.trim().split('\n')[0],
        thumbnailUrl,
      };
    } catch (error) {
      console.error('Error scraping video URL:', error);
      return {};
    }
  }
);
