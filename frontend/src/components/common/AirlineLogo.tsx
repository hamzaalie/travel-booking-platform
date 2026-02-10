import { useState } from 'react';
import { Plane } from 'lucide-react';
import { getAirlineLogo, getAirlineName } from '@/utils/airlines';

interface AirlineLogoProps {
  code: string;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  showCode?: boolean;
  className?: string;
  flightNumber?: string;
}

const sizeClasses = {
  small: 'w-10 h-10',
  medium: 'w-14 h-14',
  large: 'w-16 h-16',
};

const iconSizes = {
  small: 'h-5 w-5',
  medium: 'h-7 w-7',
  large: 'h-9 w-9',
};

export default function AirlineLogo({ 
  code, 
  size = 'medium', 
  showName = true,
  showCode = false,
  className = '',
  flightNumber
}: AirlineLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const airlineName = getAirlineName(code);
  const logoUrl = getAirlineLogo(code, size);
  
  const displayFlightNumber = flightNumber || (code && code !== airlineName ? `${code}` : '');

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Container */}
      <div className={`${sizeClasses[size]} bg-primary-50 border border-accent-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm`}>
        {!imageError && code && code !== 'Unknown' ? (
          <>
            <img
              src={logoUrl}
              alt={`${airlineName} logo`}
              className={`w-full h-full object-contain p-1.5 transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <Plane className={`${iconSizes[size]} text-primary-950 absolute`} />
            )}
          </>
        ) : (
          <Plane className={`${iconSizes[size]} text-primary-950`} />
        )}
      </div>
      
      {/* Airline Info */}
      {(showName || showCode) && (
        <div className="min-w-0">
          {showName && (
            <p className="font-bold text-gray-900 truncate text-base">{airlineName}</p>
          )}
          {(showCode || flightNumber) && (
            <p className="text-sm text-gray-500 font-medium">
              {flightNumber ? `${code}-${flightNumber}` : displayFlightNumber}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
