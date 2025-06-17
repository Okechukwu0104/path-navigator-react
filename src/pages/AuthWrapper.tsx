// pages/AuthWrapper.tsx
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import Index from './Index'; // Your main map component

const AuthWrapper = () => {
  return (
    // This div will ensure AuthWrapper takes up the full screen when mounted
    <div className="h-screen w-screen"> 
      <SignedIn>
        {/* User button, positioned at top right of the AuthWrapper's full screen */}
        <div className="absolute top-2 right-4 z-50"> 
          <UserButton
            appearance={{
              elements: {
                userButtonBox: "h-10 w-10",
                userButtonAvatarBox: "h-full w-full"
              }
            }}
          />
        </div>
        {/* Render the Index component only when signed in */}
        <Index /> 
      </SignedIn>
      <SignedOut>
        {/* Redirect to sign-in page if not signed in */}
        <RedirectToSignIn />
      </SignedOut>
    </div>
  );
};

export default AuthWrapper;