'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Compass } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const SOCIAL_MEDIA_SITES = [
  'site:youtube.com',
  'site:instagram.com',
  'site:tiktok.com',
];

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Correctly construct the query to search the term within each site
    const googleQuery = SOCIAL_MEDIA_SITES.map(site => `"${query}" ${site}`).join(' OR ');
    // Add tbm=vid to switch to the "Videos" tab in Google Search results
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}&tbm=vid`;
    
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="text-center mb-8">
        <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
          <Compass className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold font-headline">Keşfet</h1>
        <p className="text-muted-foreground mt-2">Popüler sosyal medya platformlarında yeni videolar arayın.</p>
      </header>

      <Card>
        <CardHeader>
            <CardTitle>Sosyal Medyada Video Ara</CardTitle>
            <CardDescription>Arama sonuçları Google'ın "Videolar" sekmesinde yeni bir sayfada açılacaktır.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Video ara"
                        className="pl-10 h-12 text-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button type="submit" size="lg" className="h-12">
                    <Search className="mr-2" /> Ara
                </Button>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
