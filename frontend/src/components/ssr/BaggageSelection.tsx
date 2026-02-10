import React, { useState, useMemo } from 'react';
import {
  BaggageAllowance,
  ExtraBaggageOption,
  BaggageSelection as BaggageSelectionType,
  formatBaggageDimensions,
} from '../../../shared';
import { Luggage, Plus, Check, AlertCircle } from 'lucide-react';

interface BaggageSelectionProps {
  includedBaggage: BaggageAllowance[];
  extraBaggageOptions: ExtraBaggageOption[];
  passengers: {
    id: string;
    name: string;
    type: 'adult' | 'child' | 'infant';
  }[];
  selectedBaggage: Map<string, BaggageSelectionType>;
  onBaggageUpdate: (passengerId: string, baggage: BaggageSelectionType) => void;
  readonly?: boolean;
}

export const BaggageSelection: React.FC<BaggageSelectionProps> = ({
  includedBaggage,
  extraBaggageOptions,
  passengers,
  selectedBaggage,
  onBaggageUpdate,
  readonly = false,
}) => {
  const [activePassenger, setActivePassenger] = useState<string>(passengers[0]?.id);

  const handleExtraBaggageToggle = (passengerId: string, option: ExtraBaggageOption) => {
    if (readonly) return;

    const current = selectedBaggage.get(passengerId) || {
      passengerId,
      passengerName: passengers.find(p => p.id === passengerId)!.name,
      flightSegmentId: '',
      includedBaggage,
      extraBaggage: [],
      totalWeight: includedBaggage.reduce((sum, b) => sum + (b.weight * b.quantity), 0),
      totalPrice: 0,
      currency: 'NPR',
    };

    const existingIndex = current.extraBaggage.findIndex((b: any) => b.id === option.id);
    
    if (existingIndex >= 0) {
      // Remove
      current.extraBaggage.splice(existingIndex, 1);
    } else {
      // Add
      current.extraBaggage.push(option);
    }

    // Recalculate totals
    current.totalWeight = includedBaggage.reduce((sum, b) => sum + (b.weight * b.quantity), 0) +
      current.extraBaggage.reduce((sum: number, b: any) => sum + b.weight, 0);
    current.totalPrice = current.extraBaggage.reduce((sum: number, b: any) => sum + b.price, 0);

    onBaggageUpdate(passengerId, current);
  };

  const getTotalPrice = useMemo(() => {
    return Array.from(selectedBaggage.values()).reduce((sum, sel) => sum + sel.totalPrice, 0);
  }, [selectedBaggage]);

  const getTotalWeight = useMemo(() => {
    return Array.from(selectedBaggage.values()).reduce((sum, sel) => sum + sel.totalWeight, 0);
  }, [selectedBaggage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent-50 to-accent-50 p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Luggage className="w-6 h-6 text-accent-500" />
          Baggage Selection
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Review included baggage and add extra if needed
        </p>
      </div>

      {/* Included Baggage */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          Included in Your Ticket
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {includedBaggage.map((baggage, idx) => (
            <div key={idx} className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900 capitalize">
                    {baggage.type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {baggage.quantity} piece{baggage.quantity > 1 ? 's' : ''} × {baggage.weight}kg each
                  </p>
                  {baggage.dimensions && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatBaggageDimensions(baggage.dimensions)}
                    </p>
                  )}
                </div>
                <div className="text-green-600 font-semibold">
                  Included
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Passenger Selection */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Add extra baggage for:</h4>
        <div className="flex flex-wrap gap-2">
          {passengers.map(passenger => {
            const hasExtra = (selectedBaggage.get(passenger.id)?.extraBaggage.length || 0) > 0;
            const isActive = passenger.id === activePassenger;

            return (
              <button
                key={passenger.id}
                onClick={() => !readonly && setActivePassenger(passenger.id)}
                disabled={readonly}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-accent-500 text-white shadow-md'
                    : hasExtra
                    ? 'bg-accent-100 text-accent-600 border border-accent-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                {passenger.name}
                {hasExtra && ` (${selectedBaggage.get(passenger.id)!.extraBaggage.length})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Extra Baggage Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Additional Baggage Options
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {extraBaggageOptions.map(option => {
            const activePassengerData = passengers.find(p => p.id === activePassenger);
            if (!activePassengerData) return null;

            const currentSelection = selectedBaggage.get(activePassenger);
            const isSelected = currentSelection?.extraBaggage.some((b: any) => b.id === option.id) || false;

            return (
              <div
                key={option.id}
                className={`rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-accent-500 bg-accent-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-gray-900">{option.description}</h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {option.weight}kg
                      </p>
                      {option.dimensions && (
                        <p className="text-xs text-gray-500 mt-1">
                          Max: {formatBaggageDimensions(option.dimensions)}
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-accent-500">
                      ₹{option.price.toLocaleString()}
                    </p>
                  </div>

                  {option.restrictions && option.restrictions.length > 0 && (
                    <div className="mb-3 bg-yellow-50 p-2 rounded text-xs text-yellow-700">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      {option.restrictions.join('. ')}
                    </div>
                  )}

                  <button
                    onClick={() => handleExtraBaggageToggle(activePassenger, option)}
                    disabled={readonly}
                    className={`w-full py-2 rounded-lg font-medium transition-all ${
                      isSelected
                        ? 'bg-accent-500 text-white hover:bg-accent-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${readonly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 inline mr-2" />
                        Selected
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 inline mr-2" />
                        Add to {activePassengerData.name}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-accent-50 to-accent-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Baggage Summary</h4>

        <div className="space-y-3">
          {passengers.map(passenger => {
            const selection = selectedBaggage.get(passenger.id);
            if (!selection || selection.extraBaggage.length === 0) return null;

            return (
              <div key={passenger.id} className="bg-white p-4 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">{passenger.name}</p>
                <div className="space-y-1">
                  {selection.extraBaggage.map((bag: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">{bag.description}</span>
                      <span className="font-medium">₹{bag.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {getTotalPrice > 0 && (
            <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
              <div>
                <p className="text-lg font-bold text-gray-900">Total Extra Baggage</p>
                <p className="text-sm text-gray-600">Total Weight: {getTotalWeight}kg</p>
              </div>
              <p className="text-xl font-bold text-accent-500">₹{getTotalPrice.toLocaleString()}</p>
            </div>
          )}

          {getTotalPrice === 0 && (
            <p className="text-sm text-gray-600 text-center py-4">
              No extra baggage selected. Your included baggage allowance will apply.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
