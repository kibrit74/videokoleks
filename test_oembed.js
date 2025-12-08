
const urls = [
    "https://twitter.com/SpaceX/status/1798748242488664432", // Example Tweet
    "https://www.instagram.com/p/C62yD-Pr_wT/", // Example Instagram (generic)
];

async function testEndpoints() {
    for (const url of urls) {
        console.log(`\nTesting URL: ${url}`);

        // Test Noembed
        try {
            const res = await fetch(`https://noembed.com/embed?url=${url}`);
            const json = await res.json();
            console.log('Noembed:', json.title ? 'Found Title' : 'No Title', json.thumbnail_url ? 'Found Thumb' : 'No Thumb', json.error ? json.error : '');
        } catch (e) { console.log('Noembed error:', e.message); }

        // Test Instagram Oembed
        if (url.includes('instagram')) {
            try {
                const res = await fetch(`https://api.instagram.com/oembed?url=${url}`);
                if (res.ok) {
                    const json = await res.json();
                    console.log('Insta Oembed:', json);
                } else {
                    console.log('Insta Oembed Failed:', res.status);
                }
            } catch (e) { console.log('Insta Oembed error:', e.message); }
        }

        // Test Twitter Publish
        if (url.includes('twitter')) {
            try {
                const res = await fetch(`https://publish.twitter.com/oembed?url=${url}`);
                if (res.ok) {
                    const json = await res.json();
                    console.log('Twitter Publish:', json);
                } else {
                    console.log('Twitter Publish Failed:', res.status);
                }
            } catch (e) { console.log('Twitter Publish error:', e.message); }
        }
    }
}

testEndpoints();
