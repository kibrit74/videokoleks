'use client';
import { useTheme } from 'next-themes';
import {
  User,
  Package,
  FolderKanban,
  Star,
  Settings,
  Bell,
  Paintbrush,
  Download,
  Lock,
  Cloud,
  Gem,
  Mail,
  Info,
  Sun,
  Moon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { videos, categories } from '@/lib/data';

export default function ProfilePage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const videoCount = videos.length;
  const categoryCount = categories.length;
  const favoriteCount = videos.filter(v => v.isFavorite).length;

  const stats = [
    { icon: Package, label: 'Video', value: videoCount },
    { icon: FolderKanban, label: 'Kategori', value: categoryCount },
    { icon: Star, label: 'Favori', value: favoriteCount },
  ];

  const handleThemeChange = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast({
        title: `Tema değiştirildi: ${newTheme === 'dark' ? 'Karanlık' : 'Aydınlık'}`,
    });
  };

  const settingsItems = [
    { icon: Settings, label: 'Ayarlar', action: 'toast' },
    { icon: Bell, label: 'Bildirimler', action: 'toast' },
    { icon: Paintbrush, label: 'Tema', action: handleThemeChange, isTheme: true },
    { icon: Download, label: 'Otomatik Kaydetme', action: 'toast' },
    { icon: Lock, label: 'Gizlilik', action: 'toast' },
    { icon: Cloud, label: 'Yedekleme & Senkronizasyon', action: 'toast' },
    { icon: Gem, label: "Premium'a Geç", isPremium: true, action: 'toast' },
    { icon: Mail, label: 'Destek & Geri Bildirim', action: 'mail' },
    { icon: Info, label: 'Hakkında', action: 'toast' },
  ];

  const handleSettingClick = (item: (typeof settingsItems)[number]) => {
    if (typeof item.action === 'function') {
      item.action();
    }
    else if (item.action === 'mail') {
      window.location.href = 'mailto:destek@videokoleks.com';
    } else {
      toast({
        title: 'Çok yakında!',
        description: `${item.label} özelliği yakında aktif olacak.`,
      });
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="text-center mb-8">
        <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
          <User className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-headline">Kullanıcı Adı</h1>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Koleksiyonumda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            {stats.map(stat => (
              <div key={stat.label}>
                <stat.icon className="w-8 h-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {settingsItems.map(item => (
              <li key={item.label}>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-14 px-4 text-base"
                  onClick={() => handleSettingClick(item)}
                >
                  <item.icon
                    className={`w-5 h-5 mr-4 ${
                      item.isPremium
                        ? 'text-purple-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <span
                    className={
                      item.isPremium ? 'text-purple-400 font-semibold' : ''
                    }
                  >
                    {item.label}
                  </span>
                  {item.isTheme && (
                    <div className="ml-auto">
                        {theme === 'dark' ? <Sun className="h-5 w-5 text-muted-foreground" /> : <Moon className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
