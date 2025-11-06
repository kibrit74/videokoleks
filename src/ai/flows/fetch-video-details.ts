'use server';

/**
 * @fileOverview A Genkit flow for fetching video details (title, thumbnail) from a URL.
 *
 * This is a server-side flow that scrapes the video URL to extract metadata.
 * It uses a special JSON endpoint for Instagram and falls back to HTML scraping for others.
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
      // Instagram-specific logic using the ?__a=1 endpoint
      if (videoUrl.includes('instagram.com/')) {
        // Ensure the URL doesn't have other query params
        const url = new URL(videoUrl);
        url.search = ''; // Clear existing search params
        const jsonUrl = `${url.toString()}?__a=1&__d=dis`;
        
        const response = await fetch(jsonUrl, {
            headers: {
                'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (response.ok) {
            const data = await response.json();
            const media = data.graphql?.shortcode_media || data.items?.[0];
            
            if (media) {
                 const title = media.edge_media_to_caption?.edges?.[0]?.node?.text || media.title || 'Instagram Video';
                 const thumbnailUrl = media.display_url || media.image_versions2?.candidates?.[0]?.url;
                 if (title && thumbnailUrl) {
                     return { title: title.split('\n')[0], thumbnailUrl };
                 }
            }
        }
        // If the JSON endpoint fails, we let it fall through to the generic scraper
      }

      // Generic fallback for other platforms (YouTube, TikTok, etc.)
      const response = await fetch(videoUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.statusText}`);
      }

      const html = await response.text();
      const root = parse(html);

      let title: string | undefined;
      let thumbnailUrl: string | undefined;

      // Modern approach: Look for JSON-LD script tag
      const jsonLdScript = root.querySelector('script[type="application/ld+json"]');
      if (jsonLdScript) {
        try {
          const jsonData = JSON.parse(jsonLdScript.text);
          const videoObject = jsonData['@graph']?.find((item: any) => item['@type'] === 'VideoObject') || jsonData;
          
          if(videoObject['@type'] === 'VideoObject' || videoObject.video) {
              thumbnailUrl = videoObject.thumbnailUrl || videoObject.video?.thumbnailUrl;
              title = videoObject.name || videoObject.video?.name;
          }
        } catch (e) {
          console.error('Failed to parse JSON-LD, falling back to meta tags', e);
        }
      }

      // Fallback to OpenGraph meta tags
      if (!title) {
        title =
          root.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
          root.querySelector('title')?.text;
      }
      
      if (!thumbnailUrl) {
         thumbnailUrl = 
          root.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
          root.querySelector('meta[property="og:image:secure_url"]')?.getAttribute('content');
      }

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
