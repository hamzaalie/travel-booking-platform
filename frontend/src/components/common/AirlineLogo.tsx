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
  small: 'w-8 h-8',
  medium: 'w-12 h-12',
  large: 'w-16 h-16',
};

const iconSizes = {
  small: 'h-4 w-4',
  medium: 'h-6 w-6',
  large: 'h-8 w-8',
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
  const airlineName = getAirlineName(code);
  const logoUrl = getAirlineLogo(code, size);
  
  const displayFlightNumber = flightNumber || (code && code !== airlineName ? `${code}` : '');

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Container */}
      <div className={`${sizeClasses[size]} bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0`}>
        {!imageError && code && code !== 'Unknown' ? (
          <img
            src={logoUrl}
            alt={`${airlineName} logo`}
            className="w-full h-full object-contain p-1"
            onError={() => setImageError(true)}
          />
        ) : (
          <Plane className={`${iconSizes[size]} text-primary-600`} />
        )}
      </div>
      
      {/* Airline Info */}
      {(showName || showCode) && (
        <div className="min-w-0">
          {showName && (
            <p className="font-bold text-gray-900 truncate">{airlineName}</p>
          )}
          {(showCode || flightNumber) && (
            <p className="text-sm text-gray-600">
              {flightNumber ? `${code}-${flightNumber}` : displayFlightNumber}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
