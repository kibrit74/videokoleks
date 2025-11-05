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
  LogOut,
  LogIn,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { videos, categories } from '@/lib/data';
import { useUser, signOutUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';


export default function ProfilePage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();


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

  const handleLogout = async () => {
    if (!auth) return;
    await signOutUser(auth);
    toast({ title: 'Başarıyla çıkış yaptınız.' });
    router.push('/');
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="text-center mb-8">
      {userLoading ? (
        <>
            <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
            <Skeleton className="w-40 h-8 mx-auto" />
        </>
      ) : user ? (
        <>
        <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'}/>
            <AvatarFallback>
              {user.displayName?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold font-headline">{user.displayName || 'Kullanıcı'}</h1>
        <p className="text-muted-foreground">{user.email}</p>
        </>
      ) : (
        <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
          <User className="w-16 h-16 text-primary" />
        </div>
      )}
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
            {user && (
                 <li key="logout">
                 <Button
                   variant="ghost"
                   className="w-full justify-start h-14 px-4 text-base text-red-500 hover:text-red-500"
                   onClick={handleLogout}
                 >
                   <LogOut
                     className="w-5 h-5 mr-4 text-red-500"
                   />
                   <span>Çıkış Yap</span>
                 </Button>
               </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}