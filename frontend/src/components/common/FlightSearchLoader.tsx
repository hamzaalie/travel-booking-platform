import { Plane } from 'lucide-react';

interface FlightSearchLoaderProps {
  message?: string;
  subMessage?: string;
}

export default function FlightSearchLoader({
  message = 'Searching for the best flights...',
  subMessage = 'Please wait while we find available options',
}: FlightSearchLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Logo with pulse animation */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-accent-50 flex items-center justify-center animate-pulse">
          <img
            src="/images/Peakpass Travel Brand Kit/Peakpass Logo Icon.png"
            alt="Peakpass"
            className="w-16 h-16 object-contain"
          />
        </div>
        {/* Orbiting plane */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <Plane className="h-5 w-5 text-primary-950 absolute -top-2 left-1/2 -translate-x-1/2 -rotate-45" />
        </div>
        {/* Outer ring */}
        <div
          className="absolute -inset-3 border-2 border-dashed border-accent-300 rounded-full animate-spin"
          style={{ animationDuration: '8s', animationDirection: 'reverse' }}
        />
      </div>

      {/* Progress dots */}
      <div className="flex items-center space-x-2 mb-6">
        <span className="w-2.5 h-2.5 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2.5 h-2.5 bg-primary-950 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2.5 h-2.5 bg-accent-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Text */}
      <p className="text-xl font-semibold text-gray-900 mb-2">{message}</p>
      <p className="text-gray-500">{subMessage}</p>
    </div>
  );
}
