'use client';

import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInWithGoogle } from '@/firebase/auth/use-user';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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

export default function LoginPage() {
    const auth = useAuth();
    const { user, isUserLoading: loading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!loading && user) {
            router.push('/');
        }
    }, [user, loading, router]);

    const handleLogin = async () => {
        if (!auth) return;
        try {
            await signInWithGoogle(auth);
            toast({ title: 'Başarıyla giriş yaptınız.' });
            router.push('/');
        } catch (error) {
            toast({ variant: "destructive", title: 'Giriş yapılamadı.', description: 'Google ile giriş yaparken bir hata oluştu.' });
        }
    }

    if (loading || user) {
        return <div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Giriş Yap</CardTitle>
                    <CardDescription>Video koleksiyonunuza erişmek için giriş yapın.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <Button onClick={handleLogin} size="lg" className="w-full">
                        <GoogleIcon className="mr-2 h-5 w-5"/>
                        Google ile Giriş Yap
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
