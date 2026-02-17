/**
 * Multi-City Flight Results Display
 * Shows combined pricing, airline combinations, and journey details
 */

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Plane, Clock, MapPin, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { type MultiCityFlightOffer } from '../../../shared/multiCityTypes';
import { formatDuration, getAirlineCombinations, getTotalStops } from '../../../shared/multiCityTypes';
import { RootState } from '@/store';
import { convertPrice } from '@/store/slices/currencySlice';

interface MultiCityResultsProps {
  offers: MultiCityFlightOffer[];
  isLoading?: boolean;
  onSelectOffer: (offer: MultiCityFlightOffer) => void;
  selectedOfferId?: string;
  currency?: string;
}

export const MultiCityResults: React.FC<MultiCityResultsProps> = ({
  offers,
  isLoading,
  onSelectOffer,
  selectedOfferId,
  currency = 'USD',
}) => {
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  // Currency conversion from Redux
  const { currentCurrency, currencies, exchangeRates } = useSelector(
    (state: RootState) => state.currency
  );

  const formatCurrencyPrice = (amount: number, sourceCurrency?: string) => {
    const source = sourceCurrency || currency || 'USD';
    const target = currentCurrency || currency;
    if (target === source) {
      const info = currencies.find(c => c.code === source);
      const symbol = info?.symbol || source;
      return `${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return convertPrice(amount, target, exchangeRates, currencies, source);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Plane className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No flights found</h3>
        <p className="text-gray-600">Try adjusting your search criteria or dates</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          {offers.length} Multi-City Option{offers.length > 1 ? 's' : ''} Found
        </h3>
        <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-900">
          <option>Lowest Price</option>
          <option>Shortest Duration</option>
          <option>Fewest Stops</option>
          <option>Best Value</option>
        </select>
      </div>

      {offers.map((offer) => {
        const isExpanded = expandedOfferId === offer.id;
        const isSelected = selectedOfferId === offer.id;
        const airlines = getAirlineCombinations(offer);
        const totalStops = getTotalStops(offer);

        return (
          <div
            key={offer.id}
            className={`
              border-2 rounded-lg overflow-hidden transition-all
              ${isSelected ? 'border-primary-900 shadow-lg' : 'border-gray-200 hover:border-accent-300'}
              ${isSelected ? 'bg-accent-50' : 'bg-white'}
            `}
          >
            {/* Header - Compact Overview */}
            <div className="p-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                {/* Airlines & Journey Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    {airlines.slice(0, 2).map((airline: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded"
                      >
                        {airline}
                      </span>
                    ))}
                    {airlines.length > 2 && (
                      <span className="text-xs text-gray-500">+{airlines.length - 2} more</span>
                    )}
                  </div>

                  {/* Journey Overview */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{offer.segments.length} flight{offer.segments.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(offer.totalDuration)}</span>
                    </div>
                    {totalStops > 0 && (
                      <div className="flex items-center space-x-1">
                        <Plane className="w-4 h-4" />
                        <span>{totalStops} stop{totalStops > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {offer.fareDetails.refundable && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                        Refundable
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & Actions */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrencyPrice(offer.price.total)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {offer.price.perPassenger.adult
                        ? `${formatCurrencyPrice(offer.price.perPassenger.adult)} per adult`
                        : 'Total price'}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => onSelectOffer(offer)}
                      className={`
                        px-6 py-2 rounded-lg font-semibold transition-colors
                        ${isSelected
                          ? 'bg-primary-950 text-white'
                          : 'bg-white border-2 border-primary-950 text-primary-950 hover:bg-accent-50'}
                      `}
                    >
                      {isSelected ? (
                        <span className="flex items-center space-x-1">
                          <Check className="w-4 h-4" />
                          <span>Selected</span>
                        </span>
                      ) : (
                        'Select'
                      )}
                    </button>

                    <button
                      onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
                      className="text-sm text-primary-950 hover:text-primary-800 hover:underline flex items-center justify-center space-x-1"
                    >
                      <span>{isExpanded ? 'Hide' : 'Show'} details</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                {offer.segments.map((segmentGroup: any, segmentIndex: number) => (
                  <div key={segmentIndex} className="bg-white rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <h4 className="font-semibold text-gray-900">
                        Segment {segmentIndex + 1}
                      </h4>
                      <span className="text-sm text-gray-600">
                        {segmentGroup.length > 1 ? `${segmentGroup.length - 1} layover${segmentGroup.length > 2 ? 's' : ''}` : 'Direct'}
                      </span>
                    </div>

                    {segmentGroup.map((flight: any, flightIndex: number) => (
                      <div key={flightIndex}>
                        <div className="flex items-start justify-between">
                          {/* Departure */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="text-2xl font-bold text-gray-900">
                                {new Date(flight.departure.at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                              <div className="text-sm font-semibold text-gray-900">
                                {flight.departure.iataCode}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              {new Date(flight.departure.at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            {flight.departure.terminal && (
                              <div className="text-xs text-gray-500">Terminal {flight.departure.terminal}</div>
                            )}
                          </div>

                          {/* Flight Info */}
                          <div className="flex-1 px-4">
                            <div className="flex flex-col items-center">
                              <div className="text-xs text-gray-600 mb-1">{formatDuration(flight.duration)}</div>
                              <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                  <div className="w-full border-t-2 border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center">
                                  <Plane className="w-5 h-5 text-primary-950 bg-white px-1" />
                                </div>
                              </div>
                              <div className="text-xs text-gray-900 font-medium mt-1">
                                {flight.carrierName} {flight.number}
                              </div>
                              {flight.aircraft && (
                                <div className="text-xs text-gray-500">{flight.aircraft.name || flight.aircraft.code}</div>
                              )}
                            </div>
                          </div>

                          {/* Arrival */}
                          <div className="flex-1 text-right">
                            <div className="flex items-center justify-end space-x-2 mb-1">
                              <div className="text-sm font-semibold text-gray-900">
                                {flight.arrival.iataCode}
                              </div>
                              <div className="text-2xl font-bold text-gray-900">
                                {new Date(flight.arrival.at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                            <div className="text-xs text-gray-600">
                              {new Date(flight.arrival.at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            {flight.arrival.terminal && (
                              <div className="text-xs text-gray-500">Terminal {flight.arrival.terminal}</div>
                            )}
                          </div>
                        </div>

                        {/* Layover Indicator */}
                        {flightIndex < segmentGroup.length - 1 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                            <div className="inline-flex items-center px-3 py-1 bg-yellow-50 text-yellow-800 text-xs font-medium rounded-full">
                              <Clock className="w-3 h-3 mr-1" />
                              Layover at {flight.arrival.iataCode}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Fare Details */}
                <div className="bg-white rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">Fare Details</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Cabin Class</div>
                      <div className="font-medium text-gray-900">{offer.fareDetails.cabinClass}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Checked Bags</div>
                      <div className="font-medium text-gray-900">
                        {offer.fareDetails.includedCheckedBags || 0} included
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Changes</div>
                      <div className="font-medium text-gray-900">
                        {offer.fareDetails.changeable ? 'Allowed' : 'Not allowed'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Cancellation</div>
                      <div className="font-medium text-gray-900">
                        {offer.fareDetails.refundable ? 'Refundable' : 'Non-refundable'}
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Fare</span>
                      <span className="font-medium">{formatCurrencyPrice(offer.price.base)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxes & Fees</span>
                      <span className="font-medium">{formatCurrencyPrice(offer.price.taxes + offer.price.fees)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                      <span>Total</span>
                      <span>{formatCurrencyPrice(offer.price.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MultiCityResults;
