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
import { useUser, signInWithGoogle, signOutUser } from '@/firebase/auth/use-user';
import { useAuth } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="24px"
        height="24px"
        {...props}
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,36.45,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"
        />
      </svg>
    );
  }

export default function ProfilePage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();

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

  const handleAuthAction = async () => {
    if (!auth) return;
    if (user) {
      await signOutUser(auth);
      toast({ title: 'Başarıyla çıkış yaptınız.' });
    } else {
      await signInWithGoogle(auth);
      toast({ title: 'Başarıyla giriş yaptınız.' });
    }
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

      {!user && !userLoading && (
         <Card className="mb-8">
            <CardHeader className="text-center">
                <CardTitle>Giriş Yap</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <p className="text-muted-foreground">Koleksiyonunuzu cihazlar arasında senkronize etmek için giriş yapın.</p>
                <Button onClick={handleAuthAction} size="lg">
                    <GoogleIcon className="mr-2 h-5 w-5"/>
                    Google ile Giriş Yap
                </Button>
            </CardContent>
         </Card>
      )}


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
                   onClick={handleAuthAction}
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
