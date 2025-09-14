'use client';

import { createSupabaseBrowserClient } from '@zeke/auth';
import { Button } from '@zeke/design-system/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ClearAuthPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const clearAuthState = async () => {
    setIsClearing(true);
    setMessage('');

    try {
      const supabase = createSupabaseBrowserClient();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        // Clear all Supabase-related localStorage items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('supabase')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear sessionStorage as well
        const sessionKeysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.includes('supabase')) {
            sessionKeysToRemove.push(key);
          }
        }
        sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      }
      
      setMessage('✅ Auth state cleared successfully! You can now try logging in again.');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing auth state:', error);
      setMessage('❌ Error clearing auth state. Check console for details.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Clear Auth State</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This will clear all authentication data from your browser and sign you out.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={clearAuthState} 
            disabled={isClearing}
            className="w-full"
          >
            {isClearing ? 'Clearing...' : 'Clear Auth State'}
          </Button>
          
          {message && (
            <div className="rounded-md border p-3 text-sm">
              {message}
            </div>
          )}
          
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/login')}
              className="text-sm"
            >
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
