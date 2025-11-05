'use client';

import { useState } from 'react';
import { categories, videos } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, MoreVertical } from 'lucide-react';
import { NewCategoryDialog } from '@/components/new-category-dialog';
import { cn } from '@/lib/utils';

export default function CategoriesPage() {
  const [isNewCategoryOpen, setNewCategoryOpen] = useState(false);

  const getVideoCount = (categoryId: string) => {
    return videos.filter(v => v.category.id === categoryId).length;
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-bold font-headline">Kategorilerim</h1>
        <Button onClick={() => setNewCategoryOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Yeni Kategori
        </Button>
      </header>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <span className={cn("text-2xl p-2 rounded-lg", cat.color)}>{cat.emoji}</span>
                  <div>
                    <p className="font-semibold">{cat.name}</p>
                    <p className="text-sm text-muted-foreground">{getVideoCount(cat.id)} video</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <NewCategoryDialog isOpen={isNewCategoryOpen} onOpenChange={setNewCategoryOpen} />
    </div>
  );
}
