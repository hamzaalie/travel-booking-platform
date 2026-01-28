/**
 * Airline Data Utility
 * Maps airline codes to names and provides logo URLs
 */

export interface AirlineInfo {
  code: string;
  name: string;
  country?: string;
  logo?: string;
}

// Comprehensive airline code to name mapping
export const airlineData: Record<string, AirlineInfo> = {
  // Major US Airlines
  'AA': { code: 'AA', name: 'American Airlines', country: 'United States' },
  'UA': { code: 'UA', name: 'United Airlines', country: 'United States' },
  'DL': { code: 'DL', name: 'Delta Air Lines', country: 'United States' },
  'WN': { code: 'WN', name: 'Southwest Airlines', country: 'United States' },
  'B6': { code: 'B6', name: 'JetBlue Airways', country: 'United States' },
  'AS': { code: 'AS', name: 'Alaska Airlines', country: 'United States' },
  'NK': { code: 'NK', name: 'Spirit Airlines', country: 'United States' },
  'F9': { code: 'F9', name: 'Frontier Airlines', country: 'United States' },
  'G4': { code: 'G4', name: 'Allegiant Air', country: 'United States' },
  'HA': { code: 'HA', name: 'Hawaiian Airlines', country: 'United States' },

  // European Airlines
  'BA': { code: 'BA', name: 'British Airways', country: 'United Kingdom' },
  'AF': { code: 'AF', name: 'Air France', country: 'France' },
  'LH': { code: 'LH', name: 'Lufthansa', country: 'Germany' },
  'KL': { code: 'KL', name: 'KLM Royal Dutch Airlines', country: 'Netherlands' },
  'IB': { code: 'IB', name: 'Iberia', country: 'Spain' },
  'AZ': { code: 'AZ', name: 'ITA Airways', country: 'Italy' },
  'SK': { code: 'SK', name: 'SAS Scandinavian Airlines', country: 'Scandinavia' },
  'AY': { code: 'AY', name: 'Finnair', country: 'Finland' },
  'TP': { code: 'TP', name: 'TAP Air Portugal', country: 'Portugal' },
  'LX': { code: 'LX', name: 'Swiss International', country: 'Switzerland' },
  'OS': { code: 'OS', name: 'Austrian Airlines', country: 'Austria' },
  'SN': { code: 'SN', name: 'Brussels Airlines', country: 'Belgium' },
  'EI': { code: 'EI', name: 'Aer Lingus', country: 'Ireland' },
  'LO': { code: 'LO', name: 'LOT Polish Airlines', country: 'Poland' },
  'OK': { code: 'OK', name: 'Czech Airlines', country: 'Czech Republic' },
  'RO': { code: 'RO', name: 'TAROM', country: 'Romania' },
  'FB': { code: 'FB', name: 'Bulgaria Air', country: 'Bulgaria' },
  'JU': { code: 'JU', name: 'Air Serbia', country: 'Serbia' },
  'OU': { code: 'OU', name: 'Croatia Airlines', country: 'Croatia' },
  'A3': { code: 'A3', name: 'Aegean Airlines', country: 'Greece' },

  // Low-Cost European
  'FR': { code: 'FR', name: 'Ryanair', country: 'Ireland' },
  'U2': { code: 'U2', name: 'easyJet', country: 'United Kingdom' },
  'W6': { code: 'W6', name: 'Wizz Air', country: 'Hungary' },
  'VY': { code: 'VY', name: 'Vueling', country: 'Spain' },
  'EW': { code: 'EW', name: 'Eurowings', country: 'Germany' },
  'NO': { code: 'NO', name: 'Neos', country: 'Italy' },
  'V7': { code: 'V7', name: 'Volotea', country: 'Spain' },
  'PC': { code: 'PC', name: 'Pegasus Airlines', country: 'Turkey' },

  // Middle Eastern Airlines
  'EK': { code: 'EK', name: 'Emirates', country: 'UAE' },
  'QR': { code: 'QR', name: 'Qatar Airways', country: 'Qatar' },
  'EY': { code: 'EY', name: 'Etihad Airways', country: 'UAE' },
  'TK': { code: 'TK', name: 'Turkish Airlines', country: 'Turkey' },
  'SV': { code: 'SV', name: 'Saudia', country: 'Saudi Arabia' },
  'GF': { code: 'GF', name: 'Gulf Air', country: 'Bahrain' },
  'WY': { code: 'WY', name: 'Oman Air', country: 'Oman' },
  'KU': { code: 'KU', name: 'Kuwait Airways', country: 'Kuwait' },
  'RJ': { code: 'RJ', name: 'Royal Jordanian', country: 'Jordan' },
  'MS': { code: 'MS', name: 'EgyptAir', country: 'Egypt' },
  'ME': { code: 'ME', name: 'Middle East Airlines', country: 'Lebanon' },
  'FZ': { code: 'FZ', name: 'flydubai', country: 'UAE' },
  'G9': { code: 'G9', name: 'Air Arabia', country: 'UAE' },
  'XY': { code: 'XY', name: 'flynas', country: 'Saudi Arabia' },

  // Asian Airlines
  'SQ': { code: 'SQ', name: 'Singapore Airlines', country: 'Singapore' },
  'CX': { code: 'CX', name: 'Cathay Pacific', country: 'Hong Kong' },
  'MH': { code: 'MH', name: 'Malaysia Airlines', country: 'Malaysia' },
  'TG': { code: 'TG', name: 'Thai Airways', country: 'Thailand' },
  'GA': { code: 'GA', name: 'Garuda Indonesia', country: 'Indonesia' },
  'VN': { code: 'VN', name: 'Vietnam Airlines', country: 'Vietnam' },
  'PR': { code: 'PR', name: 'Philippine Airlines', country: 'Philippines' },
  'BR': { code: 'BR', name: 'EVA Air', country: 'Taiwan' },
  'CI': { code: 'CI', name: 'China Airlines', country: 'Taiwan' },
  'JL': { code: 'JL', name: 'Japan Airlines', country: 'Japan' },
  'NH': { code: 'NH', name: 'All Nippon Airways', country: 'Japan' },
  'KE': { code: 'KE', name: 'Korean Air', country: 'South Korea' },
  'OZ': { code: 'OZ', name: 'Asiana Airlines', country: 'South Korea' },
  'CA': { code: 'CA', name: 'Air China', country: 'China' },
  'CZ': { code: 'CZ', name: 'China Southern Airlines', country: 'China' },
  'MU': { code: 'MU', name: 'China Eastern Airlines', country: 'China' },
  'HU': { code: 'HU', name: 'Hainan Airlines', country: 'China' },
  '3U': { code: '3U', name: 'Sichuan Airlines', country: 'China' },
  'ZH': { code: 'ZH', name: 'Shenzhen Airlines', country: 'China' },
  'FM': { code: 'FM', name: 'Shanghai Airlines', country: 'China' },
  'HX': { code: 'HX', name: 'Hong Kong Airlines', country: 'Hong Kong' },
  'UO': { code: 'UO', name: 'Hong Kong Express', country: 'Hong Kong' },

  // Low-Cost Asian
  'AK': { code: 'AK', name: 'AirAsia', country: 'Malaysia' },
  'QZ': { code: 'QZ', name: 'AirAsia Indonesia', country: 'Indonesia' },
  'FD': { code: 'FD', name: 'Thai AirAsia', country: 'Thailand' },
  'D7': { code: 'D7', name: 'AirAsia X', country: 'Malaysia' },
  'TR': { code: 'TR', name: 'Scoot', country: 'Singapore' },
  'VJ': { code: 'VJ', name: 'VietJet Air', country: 'Vietnam' },
  '5J': { code: '5J', name: 'Cebu Pacific', country: 'Philippines' },
  'MM': { code: 'MM', name: 'Peach Aviation', country: 'Japan' },
  'TW': { code: 'TW', name: 'T\'way Air', country: 'South Korea' },
  'LJ': { code: 'LJ', name: 'Jin Air', country: 'South Korea' },
  '7C': { code: '7C', name: 'Jeju Air', country: 'South Korea' },
  'SL': { code: 'SL', name: 'Thai Lion Air', country: 'Thailand' },
  'JT': { code: 'JT', name: 'Lion Air', country: 'Indonesia' },
  'ID': { code: 'ID', name: 'Batik Air', country: 'Indonesia' },
  'QG': { code: 'QG', name: 'Citilink', country: 'Indonesia' },

  // South Asian Airlines
  'AI': { code: 'AI', name: 'Air India', country: 'India' },
  'UK': { code: 'UK', name: 'Vistara', country: 'India' },
  '6E': { code: '6E', name: 'IndiGo', country: 'India' },
  'SG': { code: 'SG', name: 'SpiceJet', country: 'India' },
  'G8': { code: 'G8', name: 'GoAir', country: 'India' },
  'IX': { code: 'IX', name: 'Air India Express', country: 'India' },
  'I5': { code: 'I5', name: 'AirAsia India', country: 'India' },
  'BG': { code: 'BG', name: 'Biman Bangladesh', country: 'Bangladesh' },
  'BS': { code: 'BS', name: 'US-Bangla Airlines', country: 'Bangladesh' },
  'UL': { code: 'UL', name: 'SriLankan Airlines', country: 'Sri Lanka' },
  'PK': { code: 'PK', name: 'Pakistan International', country: 'Pakistan' },
  
  // Nepal Airlines
  'RA': { code: 'RA', name: 'Nepal Airlines', country: 'Nepal' },
  'H9': { code: 'H9', name: 'Himalaya Airlines', country: 'Nepal' },
  'YT': { code: 'YT', name: 'Yeti Airlines', country: 'Nepal' },
  'KB': { code: 'KB', name: 'Buddha Air', country: 'Nepal' },
  'S1': { code: 'S1', name: 'Saurya Airlines', country: 'Nepal' },
  'GU': { code: 'GU', name: 'Guna Airlines', country: 'Nepal' },
  'TF': { code: 'TF', name: 'Tara Air', country: 'Nepal' },
  'NYT': { code: 'NYT', name: 'Nepal Airlines (Domestic)', country: 'Nepal' },
  
  // Australian & Oceania
  'QF': { code: 'QF', name: 'Qantas', country: 'Australia' },
  'VA': { code: 'VA', name: 'Virgin Australia', country: 'Australia' },
  'JQ': { code: 'JQ', name: 'Jetstar', country: 'Australia' },
  'NZ': { code: 'NZ', name: 'Air New Zealand', country: 'New Zealand' },
  'FJ': { code: 'FJ', name: 'Fiji Airways', country: 'Fiji' },

  // African Airlines
  'ET': { code: 'ET', name: 'Ethiopian Airlines', country: 'Ethiopia' },
  'SA': { code: 'SA', name: 'South African Airways', country: 'South Africa' },
  'KQ': { code: 'KQ', name: 'Kenya Airways', country: 'Kenya' },
  'AT': { code: 'AT', name: 'Royal Air Maroc', country: 'Morocco' },
  'WB': { code: 'WB', name: 'RwandAir', country: 'Rwanda' },
  'TC': { code: 'TC', name: 'Air Tanzania', country: 'Tanzania' },

  // Latin American Airlines
  'LA': { code: 'LA', name: 'LATAM Airlines', country: 'Chile' },
  'AM': { code: 'AM', name: 'Aeromexico', country: 'Mexico' },
  'AV': { code: 'AV', name: 'Avianca', country: 'Colombia' },
  'CM': { code: 'CM', name: 'Copa Airlines', country: 'Panama' },
  'G3': { code: 'G3', name: 'Gol Linhas Aéreas', country: 'Brazil' },
  'JJ': { code: 'JJ', name: 'LATAM Brasil', country: 'Brazil' },
  'AD': { code: 'AD', name: 'Azul Brazilian Airlines', country: 'Brazil' },
  'AR': { code: 'AR', name: 'Aerolíneas Argentinas', country: 'Argentina' },

  // Canadian Airlines
  'AC': { code: 'AC', name: 'Air Canada', country: 'Canada' },
  'WS': { code: 'WS', name: 'WestJet', country: 'Canada' },
  'PD': { code: 'PD', name: 'Porter Airlines', country: 'Canada' },
  'TS': { code: 'TS', name: 'Air Transat', country: 'Canada' },

  // Russian Airlines
  'SU': { code: 'SU', name: 'Aeroflot', country: 'Russia' },
  'S7': { code: 'S7', name: 'S7 Airlines', country: 'Russia' },
  'UT': { code: 'UT', name: 'UTair', country: 'Russia' },
  'U6': { code: 'U6', name: 'Ural Airlines', country: 'Russia' },
};

/**
 * Get airline information by code
 */
export function getAirlineInfo(code: string): AirlineInfo {
  const upperCode = code?.toUpperCase() || '';
  return airlineData[upperCode] || { code: upperCode, name: upperCode };
}

/**
 * Get airline name by code
 */
export function getAirlineName(code: string): string {
  return getAirlineInfo(code).name;
}

/**
 * Get airline logo URL
 * Uses multiple fallback sources for airline logos
 */
export function getAirlineLogo(code: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const upperCode = code?.toUpperCase() || '';
  
  // Size mapping
  const sizeMap = {
    small: 32,
    medium: 64,
    large: 128
  };
  
  const pixelSize = sizeMap[size];
  
  // Primary source: AirHex (reliable and free)
  return `https://content.airhex.com/content/logos/airlines_${upperCode}_${pixelSize}_${pixelSize}.png`;
}

/**
 * Get airline logo with fallback to generic plane icon
 * Returns null if should use generic icon
 */
export function getAirlineLogoUrl(code: string): string | null {
  if (!code || code === 'Unknown') return null;
  return getAirlineLogo(code, 'medium');
}

/**
 * Format airline display name with code
 */
export function formatAirlineDisplay(code: string, includeCode: boolean = false): string {
  const info = getAirlineInfo(code);
  if (includeCode && info.code !== info.name) {
    return `${info.name} (${info.code})`;
  }
  return info.name;
}
