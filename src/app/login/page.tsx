
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Terminal, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            // If the server confirms credentials are correct
            sessionStorage.setItem('isLoggedIn', 'true');
            router.push('/dashboard');
        } else {
            // If the server responds with an error (e.g., 401 Unauthorized)
            const errorData = await response.json();
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: errorData.error || 'Invalid username or password.',
            });
        }
    } catch (error) {
        console.error("Login request failed:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not connect to the server. Please try again.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    // This is the key change to prevent back navigation after logout.
    // router.replace() updates the URL without adding a new entry to the browser's history stack.
    // So, the previous page (the dashboard) is effectively removed, and the back button
    // won't lead the user back into the authenticated area.
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex items-center justify-center">
             <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">PEx-Management Login</CardTitle>
          <CardDescription>
            Please sign in with your admin credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                type="text" 
                placeholder="Enter your username" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
               <div className="text-right">
                <Dialog>
                    <DialogTrigger asChild>
                         <Link href="#" className="inline-block text-sm underline" prefetch={false}>
                            Forgot password?
                        </Link>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Password Recovery</DialogTitle>
                            <DialogDescription>
                                How to manually reset your admin password.
                            </DialogDescription>
                        </DialogHeader>
                        <Alert>
                          <Terminal className="h-4 w-4" />
                          <AlertTitle>Server Access Required</AlertTitle>
                          <AlertDescription>
                            <p>Admin credentials are stored in an environment file on your server for security. To reset them, you must have access to your server's file system (e.g., via SSH or your hosting provider's file manager).</p>
                            <ol className="list-decimal pl-5 mt-2 space-y-1">
                                <li>Connect to your server.</li>
                                <li>Navigate to the root directory of this application.</li>
                                <li>Open the file named <strong>.env</strong> with a text editor.</li>
                                <li>Find the lines starting with <strong>ADMIN_USERNAME</strong> and <strong>ADMIN_PASSWORD</strong>.</li>
                                <li>Update the values to your new desired credentials.</li>
                                <li>Save the file and restart your application server for the changes to take effect.</li>
                            </ol>
                          </AlertDescription>
                        </Alert>
                    </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="pt-2">
               <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign in'}
               </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
