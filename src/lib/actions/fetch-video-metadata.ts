'use server';

import { parse } from 'node-html-parser';

interface FetchVideoMetadataInput {
  videoUrl: string;
}

interface FetchVideoMetadataOutput {
  title?: string;
  thumbnailUrl?: string;
}

export async function fetchVideoMetadata(
  input: FetchVideoMetadataInput
): Promise<FetchVideoMetadataOutput> {
  try {
    const response = await fetch(input.videoUrl, {
      headers: {
        // Mimic a browser to avoid getting blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      return {};
    }

    const html = await response.text();
    const root = parse(html);

    // Prioritize Open Graph (og) tags as they are more reliable
    const title = root.querySelector('meta[property="og:title"]')?.getAttribute('content') || root.querySelector('title')?.innerText;
    const thumbnailUrl = root.querySelector('meta[property="og:image"]')?.getAttribute('content');

    if (!title || !thumbnailUrl) {
      console.warn(`Could not extract full metadata for: ${input.videoUrl}`, { title, thumbnailUrl });
    }

    return {
      title,
      thumbnailUrl,
    };
  } catch (error) {
    console.error('Error fetching or parsing video metadata:', error);
    return {};
  }
}
