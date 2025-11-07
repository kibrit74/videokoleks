'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  ChevronRight,
  Gem,
  Download,
  Lock,
  Mail,
  Moon,
  Paintbrush,
  Sun,
  Cloud,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { BackupRestoreDialog } from '@/components/backup-restore-dialog';
import { useLocalStorage } from '@/hooks/use-local-storage';


export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage('notificationsEnabled', true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useLocalStorage('autoSaveEnabled', false);
  const [isBackupRestoreOpen, setBackupRestoreOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const settingsItems = [
    {
      group: 'Genel',
      items: [
        {
          id: 'theme',
          icon: Paintbrush,
          label: 'Tema',
          content: 'Açık veya koyu tema arasında geçiş yapın.',
          control: (
            <div className="flex items-center gap-2">
              <Sun className={`h-5 w-5 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              />
              <Moon className={`h-5 w-5 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
          ),
        },
        {
          id: 'notifications',
          icon: Bell,
          label: 'Bildirimler',
          content: 'Anlık bildirim ayarlarını yönetin.',
          control: (
             <Switch
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                  setNotificationsEnabled(checked)
                  toast({ title: `Bildirimler ${checked ? 'açıldı' : 'kapatıldı'}.` })
                }}
                aria-label="Toggle notifications"
              />
          )
        },
      ],
    },
    {
      group: 'Veri Yönetimi',
      items: [
        {
          id: 'auto-save',
          icon: Download,
          label: 'Otomatik Kaydetme',
          content: 'Paylaşılan videoları otomatik kaydet.',
          control: (
             <Switch
                checked={autoSaveEnabled}
                onCheckedChange={(checked) => {
                  setAutoSaveEnabled(checked)
                  toast({ title: `Otomatik kaydetme ${checked ? 'açıldı' : 'kapatıldı'}.` })
                }}
                aria-label="Toggle auto-save"
              />
          )
        },
        {
          id: 'privacy',
          icon: Lock,
          label: 'Gizlilik',
          content: 'Hesap ve veri gizliliği ayarları.',
          action: () => toast({ title: 'Çok yakında!' }),
        },
        {
          id: 'backup',
          icon: Cloud,
          label: 'Yedekleme & Senkronizasyon',
          content: 'Verilerinizi yedekleyin ve geri yükleyin.',
          action: () => setBackupRestoreOpen(true),
        },
      ],
    },
     {
      group: 'Destek',
      items: [
        {
          id: 'feedback',
          icon: Mail,
          label: 'Destek & Geri Bildirim',
          content: 'Fikirlerinizi paylaşın veya yardım isteyin.',
          action: () => window.location.href = 'mailto:destek@videokoleks.com',
        },
      ]
    }
  ];

  return (
    <>
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline">Ayarlar</h1>
        <p className="text-muted-foreground">Uygulama deneyiminizi yönetin ve kişiselleştirin.</p>
      </header>

      <div className="space-y-10">
        <Card className="bg-gradient-to-r from-purple-500 to-primary text-primary-foreground">
           <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Gem /> Premium'a Geçin
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Sınırsız koleksiyon, reklamsız deneyim ve daha fazlası için potansiyelinizi ortaya çıkarın.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" onClick={() => toast({ title: 'Çok yakında!', description: 'Premium üyelik yakında sizlerle!' })}>
                Daha Fazla Bilgi
            </Button>
          </CardContent>
        </Card>

        {settingsItems.map((group) => (
          <div key={group.group}>
            <h2 className="text-lg font-semibold mb-3 px-1">{group.group}</h2>
            <Card>
              <ul className="divide-y divide-border">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <div
                        onClick={() => item.action?.()}
                        className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                        role={item.action ? "button" : "listitem"}
                        tabIndex={item.action ? 0 : -1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            item.action?.();
                          }
                        }}
                    >
                      <div className="flex items-start gap-4">
                        <item.icon className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.content}</p>
                        </div>
                      </div>
                       <div onClick={(e) => item.control && e.stopPropagation()}>
                        {!isClient && item.control ? <Skeleton className="w-20 h-6" /> : null}
                        {isClient && item.control ? item.control : null}
                        {!item.control && item.action && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        ))}
      </div>
    </div>
    <BackupRestoreDialog isOpen={isBackupRestoreOpen} onOpenChange={setBackupRestoreOpen} />
    </>
  );
}
