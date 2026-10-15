
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignIn,
} from '@clerk/clerk-react';
import App from './App';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function AuthGate() {
  if (!publishableKey) {
    return <p>Missing Clerk publishable key. Check frontend/.env.local.</p>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <SignedOut>
        <div className="auth-screen">
          <div className="auth-brand">
            <span className="auth-logo">✦</span>
            <span>subly</span>
          </div>
          <p className="auth-subtitle">YOUR WORKSPACE, SIMPLIFIED</p>
          <SignIn />
        </div>
      </SignedOut>

      <SignedIn>
        <App />
      </SignedIn>
    </ClerkProvider>
  );
}
