'use client';

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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const stats = [
  { icon: Package, label: 'Video', value: 247 },
  { icon: FolderKanban, label: 'Kategori', value: 12 },
  { icon: Star, label: 'Favori', value: 35 },
];

const settingsItems = [
  { icon: Settings, label: 'Ayarlar' },
  { icon: Bell, label: 'Bildirimler' },
  { icon: Paintbrush, label: 'Tema' },
  { icon: Download, label: 'Otomatik Kaydetme' },
  { icon: Lock, label: 'Gizlilik' },
  { icon: Cloud, label: 'Yedekleme & Senkronizasyon' },
  { icon: Gem, label: "Premium'a Geç", isPremium: true },
  { icon: Mail, label: 'Destek & Geri Bildirim' },
  { icon: Info, label: 'Hakkında' },
];

export default function ProfilePage() {
  const { toast } = useToast();

  const handleSettingClick = (label: string) => {
    toast({
      title: 'Çok yakında!',
      description: `${label} özelliği yakında aktif olacak.`,
    });
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
                  onClick={() => handleSettingClick(item.label)}
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
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
