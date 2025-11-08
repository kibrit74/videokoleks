'use client';
import { useTheme } from 'next-themes';
import {
  User,
  Package,
  FolderKanban,
  Star,
  Settings,
  Mail,
  Info,
  LogOut,
  Loader2,
  Unplug,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signOutUser } from '@/firebase/auth/use-user';
import {
  useAuth,
  useFirestore,
  useCollection,
  useMemoFirebase,
  useUser
} from '@/firebase';
import { collectionGroup, query, where } from 'firebase/firestore';
import type { Video, Category } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AboutDialog } from '@/components/about-dialog';

export default function ProfilePage() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [isAboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);
  
  // Query for all videos of the user
  const videosQuery = useMemoFirebase(
    () => (user && firestore) ? query(collectionGroup(firestore, 'videos'), where('userId', '==', user.uid)) : null,
    [firestore, user]
  );
  const { data: videos, isLoading: videosLoading } = useCollection<Video>(videosQuery);

  // Query for all categories of the user
  const categoriesQuery = useMemoFirebase(
    () =>
      (user && firestore) ? query(collectionGroup(firestore, 'categories'), where('userId', '==', user.uid)) : null,
    [firestore, user]
  );
  const { data: categories, isLoading: categoriesLoading } = useCollection<Category>(categoriesQuery);
  
  // Query for all favorite videos of the user
  const favoriteVideosQuery = useMemoFirebase(
    () =>
      (user && firestore)
        ? query(
            collectionGroup(firestore, 'videos'),
            where('userId', '==', user.uid),
            where('isFavorite', '==', true)
          )
        : null,
    [firestore, user]
  );
  const { data: favoriteVideos, isLoading: favoritesLoading } = useCollection<Video>(favoriteVideosQuery);

  const videoCount = videos?.length ?? 0;
  const categoryCount = categories?.length ?? 0;
  const favoriteCount = favoriteVideos?.length ?? 0;
  const statsLoading = videosLoading || categoriesLoading || favoritesLoading;

  const stats = [
    { icon: Package, label: 'Video', value: videoCount },
    { icon: FolderKanban, label: 'Kategori', value: categoryCount },
    { icon: Star, label: 'Favori', value: favoriteCount },
  ];

  const settingsItems = [
    { icon: Settings, label: 'Ayarlar', action: () => router.push('/settings') },
    { icon: Mail, label: 'Destek & Geri Bildirim', action: () => window.location.href = 'mailto:destek@videokoleks.com' },
    { icon: Info, label: 'Hakkında', action: () => setAboutOpen(true) },
  ];

  const handleLogout = async () => {
    if (!auth) return;
    await signOutUser(auth);
    toast({ title: 'Oturum kapatıldı.' });
    router.push('/login');
  };

  if (isUserLoading) {
    return (
       <div className="container mx-auto max-w-2xl px-4 py-8">
         <header className="text-center mb-8">
            <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
            <Skeleton className="w-40 h-8 mx-auto" />
            <Skeleton className="w-48 h-4 mx-auto mt-2" />
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
                        <Skeleton className="w-8 h-6 mx-auto" />
                        <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
     return (
        <div className="container mx-auto max-w-2xl px-4 py-8 text-center">
             <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                <Unplug className="w-16 h-16 text-primary" />
             </div>
            <h1 className="text-3xl font-bold font-headline">Oturumunuz Kapalı</h1>
            <p className="text-muted-foreground mt-2 mb-6">Profilinizi görüntülemek için lütfen giriş yapın.</p>
            <Button onClick={() => router.push('/login')}>Giriş Yap</Button>
        </div>
     )
  }

  return (
    <>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <header className="text-center mb-8">
          <>
            <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-primary">
               <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
               <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
            <h1 className="text-3xl font-bold font-headline">
              {user.displayName ?? 'Kullanıcı'}
            </h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </>
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
                  {statsLoading ? (
                      <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                  ) : (
                      <p className="text-2xl font-bold">{stat.value}</p>
                  )}
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
                    onClick={item.action}
                  >
                    <item.icon
                      className='w-5 h-5 mr-4 text-muted-foreground'
                    />
                    <span>
                      {item.label}
                    </span>
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
                    <LogOut className="w-5 h-5 mr-4 text-red-500" />
                    <span>Çıkış Yap</span>
                  </Button>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
      <AboutDialog isOpen={isAboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
}

    