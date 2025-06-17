// LandingPage.tsx
import {
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Route, Sparkles, Bus, Sun, CloudRain, Clock } from "lucide-react";
import AuthWrapper from "./AuthWrapper";

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center text-center hover:shadow-md transition-shadow">
    <div className="bg-blue-100 p-3 rounded-full mb-4 text-blue-600">
      {icon}
    </div>
    <h3 className="font-bold text-lg text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

// Price Indicator Component
const PriceIndicator = ({ time, weather, price }: { time: string; weather: string; price: string }) => (
  <div className="flex items-center bg-white p-3 rounded-lg shadow-xs border border-gray-200 mb-2">
    <div className="flex-shrink-0 mr-3">
      {weather === 'rain' ? <CloudRain className="h-5 w-5 text-blue-500" /> : <Sun className="h-5 w-5 text-yellow-500" />}
    </div>
    <div className="flex-grow">
      <p className="text-sm font-medium text-gray-700">{time}</p>
      <p className="text-xs text-gray-500">{weather === 'rain' ? 'Rainy day' : 'Sunny day'}</p>
    </div>
    <div className="bg-green-100 px-2 py-1 rounded-md">
      <p className="text-sm font-bold text-green-800">₦{price}</p>
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Auth */}
      <header className="w-full py-4 px-6 flex justify-end">
        <SignedIn>
          <AuthWrapper />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="outline" className="text-blue-600 border-blue-400 hover:bg-blue-50">
              Sign In
            </Button>
          </SignInButton>
        </SignedOut>
      </header>

      <SignedOut>
        {/* Hero Section */}
        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full mb-4">
              <Bus className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Explore Lagos Like a Local</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Navigate Lagos with <span className="text-blue-600">Confidence</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Master the vibrant transport system with real-time bus stop info, Danfo routes, and dynamic pricing.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                  Your Personal Lagos Transport Guide
                </h2>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Whether you're a tourist or newcomer, we've got you covered with accurate transport information.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FeatureCard
                  icon={<MapPin className="h-6 w-6" />}
                  title="Bus Stop Finder"
                  description="Locate the nearest bus stops with transport options"
                />
                <FeatureCard
                  icon={<Route className="h-6 w-6" />}
                  title="Smart Routing"
                  description="Optimized routes considering traffic conditions"
                />
                <FeatureCard
                  icon={<Clock className="h-6 w-6" />}
                  title="Time-Based Pricing"
                  description="Know exactly what to pay at any time"
                />
                <FeatureCard
                  icon={<CloudRain className="h-6 w-6" />}
                  title="Weather Updates"
                  description="How weather affects transport availability"
                />
              </div>

              <div className="pt-4">
                <SignInButton mode="modal">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-full shadow-md">
                    Start Exploring Lagos
                  </Button>
                </SignInButton>
              </div>
            </div>

            {/* Price Visualization */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600">
                  <Bus className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Sample Danfo Pricing</h3>
              </div>
              <p className="text-gray-600 mb-4">Oshodi to CMS route pricing varies by:</p>
              
              <PriceIndicator time="Morning Rush (7-9am)" weather="sun" price="250" />
              <PriceIndicator time="Midday (10am-3pm)" weather="sun" price="200" />
              <PriceIndicator time="Evening Rush (5-7pm)" weather="sun" price="300" />
              <PriceIndicator time="Rainy Day" weather="rain" price="350" />
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Pro Tip:</span> Prices change based on time, weather, and demand.
                </p>
              </div>
            </div>
          </div>

          {/* Danfo Experience */}
          <div className="bg-yellow-100 rounded-2xl p-8 md:p-12 text-gray-800 mb-24">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-4">Experience the Iconic Danfo Buses</h2>
              <p className="text-lg mb-6">
                Riding a Danfo is a quintessential Lagos experience. Our app helps you navigate while enjoying the vibrant colors and unique atmosphere.
              </p>
              <div className="flex flex-wrap gap-2">
                <div className="bg-white/80 px-3 py-1 rounded-full">
                  <span className="text-sm">Colorful buses</span>
                </div>
                <div className="bg-white/80 px-3 py-1 rounded-full">
                  <span className="text-sm">Lively conductors</span>
                </div>
                <div className="bg-white/80 px-3 py-1 rounded-full">
                  <span className="text-sm">Unique slang</span>
                </div>
                <div className="bg-white/80 px-3 py-1 rounded-full">
                  <span className="text-sm">Fast transport</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Ready to Explore Lagos?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Join thousands navigating Lagos with confidence. No more guessing at bus stops.
            </p>
            <SignInButton mode="modal">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-md text-lg">
                Get Started for Free
              </Button>
            </SignInButton>
          </div>
        </main>
      </SignedOut>

      {/* Footer */}
      <footer className="w-full py-6 bg-white border-t border-gray-200 text-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Route className="h-5 w-5 text-blue-600 mr-2" />
              <span className="font-bold text-gray-800">Lagos Navigator</span>
            </div>
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} Steerify Navigator. Helping you master Lagos transport.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}