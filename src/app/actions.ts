
// Helper function to check if the oembed data is valid
// function isValidOembed(oembed: any): boolean {
//   return !!(oembed && oembed.title && oembed.thumbnail_url);
// }


async function getYoutubeMetadata(url: string) {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return {
      title: data.title,
      thumbnail: data.thumbnail_url,
      // oEmbed for YouTube doesn't provide duration, so we can't get it this way.
      duration: undefined,
    };
  } catch (error) {
    console.error(`Error fetching YouTube oEmbed for ${url}:`, error);
    return null;
  }
}


export async function getVideoMetadata(url: string) {
  try {
    // 1. YouTube Specific Logic (Most reliable for YouTube)
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const youtubeData = await getYoutubeMetadata(url);
      if (youtubeData && youtubeData.title) {
        return youtubeData;
      }
    }

    // 2. Try Noembed (Supports many sites like Vimeo, Facebook, Twitter, etc.)
    try {
      const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
      const response = await fetch(noembedUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.title) {
          return {
            title: data.title,
            thumbnail: data.thumbnail_url || data.thumbnail, // Some providers use 'thumbnail'
            duration: undefined,
          };
        }
      }
    } catch (e) {
      console.warn('Noembed failed:', e);
    }

    // 3. Fallback: Scrape Open Graph data using CORS Proxies
    // We try multiple proxies in order of reliability
    const proxies = [
      (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`,
      (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    ];

    let html: string | null = null;

    for (const proxyGen of proxies) {
      try {
        const proxyUrl = proxyGen(url);
        const response = await fetch(proxyUrl);
        if (response.ok) {
          // Handle different proxy response formats
          if (proxyUrl.includes('allorigins')) {
            const data = await response.json();
            html = data.contents;
          } else {
            html = await response.text();
          }

          if (html) break; // Success!
        }
      } catch (e) {
        console.warn(`Proxy failed:`, e);
      }
    }

    if (!html) return null;

    // Parse HTML to find OG tags
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const getMeta = (prop: string) =>
      doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') ||
      doc.querySelector(`meta[name="${prop}"]`)?.getAttribute('content');

    const title = getMeta('og:title') || doc.title;
    const thumbnail = getMeta('og:image');
    // Duration is hard to get generically without a specialized parser
    const duration = undefined;

    if (!title) {
      return null;
    }

    return {
      title,
      thumbnail,
      duration,
    };

  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error);
    return null;
  }
}
