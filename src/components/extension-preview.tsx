
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Power, Settings, ShieldCheck, WifiOff, Hourglass, RefreshCw } from 'lucide-react';
import Image from 'next/image';

type View = 'register' | 'pending' | 'connected' | 'error';

interface ExtensionPreviewProps {
    extensionName: string;
    companyLogo: string;
}

export function ExtensionPreview({ extensionName, companyLogo }: ExtensionPreviewProps) {
  const [view, setView] = useState<View>('register');
  const [isConnected, setIsConnected] = useState(true);

  const Header = () => (
    <div className="flex items-center justify-between p-3 bg-card rounded-t-lg border-b">
      <div className="flex items-center gap-2">
        {companyLogo && <Image src={companyLogo} alt="logo" width={24} height={24} unoptimized />}
        <h1 className="text-sm font-semibold">{extensionName}</h1>
      </div>
    </div>
  );

  const Footer = () => (
    <div className="flex items-center justify-between p-2 text-xs text-muted-foreground bg-card mt-auto border-t">
      <span>Last sync: 2 min ago</span>
      <Button variant="ghost" size="icon" className="h-6 w-6">
        <RefreshCw className="w-3 h-3" />
      </Button>
    </div>
  );

  const RegisterView = () => (
    <div className="p-4 flex flex-col items-center text-center gap-4">
      <ShieldCheck className="w-12 h-12 text-primary" />
      <div>
        <h2 className="font-semibold">Register Device</h2>
        <p className="text-sm text-muted-foreground">To connect, please register this device with your corporate account.</p>
      </div>
      <div className="w-full space-y-2">
        <Input type="text" placeholder="Your Name" />
        <div className="p-2 bg-muted rounded-md text-xs font-mono text-center">
          <Label className="text-muted-foreground text-xs">Your Unique ID</Label>
          <p>USR-EXP-5D9C</p>
        </div>
      </div>
      <Button className="w-full">Register</Button>
    </div>
  );

  const PendingView = () => (
    <div className="p-4 flex flex-col items-center text-center gap-4 flex-grow justify-center">
      <Hourglass className="w-12 h-12 text-primary animate-spin" />
      <h2 className="font-semibold">Awaiting Approval</h2>
      <p className="text-sm text-muted-foreground">Your registration request has been sent. Please wait for an administrator to approve it.</p>
    </div>
  );

  const ConnectedView = () => (
    <div className="p-4 flex flex-col items-center text-center gap-4 flex-grow justify-center">
      <button onClick={() => setIsConnected(!isConnected)} className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isConnected ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
        <Power className="w-10 h-10" />
      </button>
      <div className="font-semibold">{isConnected ? 'Connected' : 'Disconnected'}</div>
      <p className="text-sm text-muted-foreground">Your traffic is being routed through the corporate proxy.</p>
      
      <div className="w-full text-left text-xs bg-muted/50 p-3 rounded-lg border space-y-2">
        <div className="flex justify-between">
            <span className="text-muted-foreground">User:</span>
            <span className="font-medium text-foreground">Daniel</span>
        </div>
        <div className="flex justify-between">
            <span className="text-muted-foreground">OU:</span>
            <span className="font-medium text-foreground">Engineering</span>
        </div>
        <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Unique ID:</span>
            <span className="font-mono text-xs font-medium text-foreground">USR-EXP-5D9C</span>
        </div>
      </div>

    </div>
  );

  const ErrorView = () => (
    <div className="p-4 flex flex-col items-center text-center gap-4 flex-grow justify-center">
      <WifiOff className="w-12 h-12 text-destructive" />
      <div>
        <h2 className="font-semibold">Connection Failed</h2>
        <p className="text-sm text-muted-foreground mb-4">Could not connect to the panel. Please enter the correct address.</p>
      </div>
      <div className="w-full space-y-2">
        <Input type="text" placeholder="https://panel.example.com" />
        <Button className="w-full">Save & Retry</Button>
      </div>
    </div>
  );

  const renderView = () => {
    switch (view) {
      case 'register':
        return <RegisterView />;
      case 'pending':
        return <PendingView />;
      case 'connected':
        return <ConnectedView />;
      case 'error':
        return <ErrorView />;
      default:
        return <RegisterView />;
    }
  };

  return (
    <div className="space-y-4">
        <div className="w-[320px] h-[480px] mx-auto border-4 border-muted rounded-xl bg-background shadow-lg flex flex-col overflow-hidden">
            <Header />
            <div className="flex-grow flex flex-col overflow-y-auto bg-background">
              {renderView()}
            </div>
            { (view === 'connected' || view === 'error') && <Footer />}
        </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant={view === 'register' ? 'default' : 'outline'} size="sm" onClick={() => setView('register')}>Register View</Button>
        <Button variant={view === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setView('pending')}>Pending View</Button>
        <Button variant={view === 'connected' ? 'default' : 'outline'} size="sm" onClick={() => setView('connected')}>Connected View</Button>
        <Button variant={view === 'error' ? 'destructive' : 'outline'} size="sm" onClick={() => setView('error')}>Error View</Button>
      </div>
    </div>
  );
}

    
