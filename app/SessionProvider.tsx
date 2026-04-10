'use client';

import { SessionProvider } from "next-auth/react";
import { ReactNode, Suspense } from "react";

function SessionLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>Loading session...</div>
    </div>
  );
}

export default function NextAuthSessionProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SessionLoadingFallback />}>
      <SessionProvider 
        basePath="/api/auth"
        refetchInterval={5 * 60}
        refetchOnWindowFocus={true}
        refetchWhenOffline={false}
      >
        {children}
      </SessionProvider>
    </Suspense>
  );
}
