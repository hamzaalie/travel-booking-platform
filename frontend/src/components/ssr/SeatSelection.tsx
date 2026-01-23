import React, { useState, useMemo } from 'react';
import { 
  SeatMap, 
  Seat, 
  SeatAvailability, 
  SeatSelection as SeatSelectionType,
  getSeatLabel,
  validateSeatSelection,
} from '../../../shared';
import { Armchair, X, Check, AlertCircle, Info } from 'lucide-react';

interface SeatSelectionProps {
  seatMap: SeatMap;
  passengers: {
    id: string;
    name: string;
    type: 'adult' | 'child' | 'infant';
  }[];
  selectedSeats: Map<string, SeatSelectionType>; // passengerId => SeatSelection
  onSeatSelect: (passengerId: string, seat: Seat) => void;
  onSeatDeselect: (passengerId: string) => void;
  segmentIndex: number;
  readonly?: boolean;
}

export const SeatSelection: React.FC<SeatSelectionProps> = ({
  seatMap,
  passengers,
  selectedSeats,
  onSeatSelect,
  onSeatDeselect,
  segmentIndex: _segmentIndex,
  readonly = false,
}) => {
  const [activePassenger, setActivePassenger] = useState<string>(passengers[0]?.id);
  const [showLegend, setShowLegend] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Group seats by row
  const seatsByRow = useMemo(() => {
    const rows = new Map<number, Seat[]>();
    seatMap.seats.forEach((seat: any) => {
      if (!rows.has(seat.row)) {
        rows.set(seat.row, []);
      }
      rows.get(seat.row)!.push(seat);
    });
    // Sort seats within each row by column
    rows.forEach(seats => {
      seats.sort((a, b) => a.column.localeCompare(b.column));
    });
    return rows;
  }, [seatMap.seats]);

  const handleSeatClick = (seat: Seat) => {
    if (readonly) return;

    setValidationError(null);

    const activePass = passengers.find(p => p.id === activePassenger);
    if (!activePass) return;

    // Check if seat is already selected by another passenger
    const isSelectedByOther = Array.from(selectedSeats.entries()).some(
      ([passId, selection]) => passId !== activePassenger && selection.seat.id === seat.id
    );

    if (isSelectedByOther) {
      setValidationError('This seat is already selected by another passenger');
      return;
    }

    // Check if active passenger already has this seat selected
    const currentSelection = selectedSeats.get(activePassenger);
    if (currentSelection?.seat.id === seat.id) {
      onSeatDeselect(activePassenger);
      return;
    }

    // Validate seat selection
    const validation = validateSeatSelection(seat, activePass.type);
    if (!validation.valid) {
      setValidationError(validation.errors[0]?.message || 'Invalid seat selection');
      return;
    }

    // Select the seat (note: selection object created for potential future use)
    // const selection: SeatSelectionType = {
    //   passengerId: activePassenger,
    //   passengerName: activePass.name,
    //   flightSegmentId: seatMap.flightSegmentId,
    //   segmentIndex,
    //   seat,
    //   price: seat.price,
    //   currency: seat.currency,
    // };

    onSeatSelect(activePassenger, seat);

    // Show warnings if any
    if (validation.warnings.length > 0) {
      setValidationError(validation.warnings[0].message);
      setTimeout(() => setValidationError(null), 5000);
    }

    // Auto-advance to next passenger without a seat
    const nextPassenger = passengers.find(p => 
      p.id !== activePassenger && !selectedSeats.has(p.id)
    );
    if (nextPassenger) {
      setActivePassenger(nextPassenger.id);
    }
  };

  const getSeatClassName = (seat: Seat): string => {
    const baseClasses = 'w-10 h-10 rounded-md flex items-center justify-center text-xs font-medium transition-all cursor-pointer hover:scale-110';
    
    // Check if selected
    const selectionEntry = Array.from(selectedSeats.entries()).find(
      ([_, selection]) => selection.seat.id === seat.id
    );
    
    if (selectionEntry) {
      const [passId] = selectionEntry;
      const isActive = passId === activePassenger;
      return `${baseClasses} ${
        isActive 
          ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
          : 'bg-green-600 text-white'
      }`;
    }

    // Not selected - show availability
    switch (seat.availability) {
      case SeatAvailability.OCCUPIED:
        return `${baseClasses} bg-gray-300 text-gray-600 cursor-not-allowed hover:scale-100`;
      case SeatAvailability.BLOCKED:
        return `${baseClasses} bg-gray-400 text-gray-700 cursor-not-allowed hover:scale-100`;
      case SeatAvailability.EXIT_ROW:
        return `${baseClasses} bg-yellow-100 text-yellow-800 border-2 border-yellow-400 hover:bg-yellow-200`;
      case SeatAvailability.EXTRA_LEGROOM:
        return `${baseClasses} bg-purple-100 text-purple-800 border-2 border-purple-400 hover:bg-purple-200`;
      case SeatAvailability.AVAILABLE:
      default:
        return `${baseClasses} bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50`;
    }
  };

  const getSeatIcon = (seat: Seat) => {
    const selectionEntry = Array.from(selectedSeats.entries()).find(
      ([_, selection]) => selection.seat.id === seat.id
    );

    if (selectionEntry) {
      return <Check className="w-5 h-5" />;
    }

    if (seat.availability === SeatAvailability.OCCUPIED || 
        seat.availability === SeatAvailability.BLOCKED) {
      return <X className="w-4 h-4" />;
    }

    return <span className="text-xs font-bold">{getSeatLabel(seat)}</span>;
  };

  const getTotalPrice = useMemo(() => {
    return Array.from(selectedSeats.values()).reduce((sum, sel) => sum + sel.price, 0);
  }, [selectedSeats]);

  // const getActivePassenger = () => passengers.find(p => p.id === activePassenger);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Armchair className="w-6 h-6 text-blue-600" />
              Select Your Seats
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {seatMap.aircraftType} • {seatMap.configuration} configuration
            </p>
          </div>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Info className="w-4 h-4" />
            {showLegend ? 'Hide' : 'Show'} Legend
          </button>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Seat Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border-2 border-gray-300 rounded" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded" />
              <span>Your Selection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 rounded" />
              <span>Group Selection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-300 rounded" />
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-400 rounded" />
              <span>Exit Row (+₹{seatMap.seats.find((s: any) => s.availability === SeatAvailability.EXIT_ROW)?.price || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 border-2 border-purple-400 rounded" />
              <span>Extra Legroom</span>
            </div>
          </div>
        </div>
      )}

      {/* Passenger Selection */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Selecting for:</h4>
        <div className="flex flex-wrap gap-2">
          {passengers.map(passenger => {
            const hasSelection = selectedSeats.has(passenger.id);
            const isActive = passenger.id === activePassenger;
            
            return (
              <button
                key={passenger.id}
                onClick={() => !readonly && setActivePassenger(passenger.id)}
                disabled={readonly}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : hasSelection
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2">
                  <span>{passenger.name}</span>
                  {hasSelection && <Check className="w-4 h-4" />}
                </div>
                <div className="text-xs opacity-75 capitalize">{passenger.type}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Note</p>
            <p className="text-sm text-yellow-700 mt-1">{validationError}</p>
          </div>
        </div>
      )}

      {/* Seat Map */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 overflow-x-auto">
        <div className="min-w-max">
          {/* Aircraft Front Indicator */}
          <div className="text-center mb-4 pb-4 border-b-2 border-gray-300">
            <div className="inline-block px-6 py-2 bg-gray-100 rounded-full">
              <span className="text-sm font-semibold text-gray-600">← FRONT →</span>
            </div>
          </div>

          {/* Seat Grid */}
          <div className="space-y-2">
            {Array.from(seatsByRow.entries())
              .sort(([a], [b]) => a - b)
              .map(([rowNum, seats]) => {
                const isExitRow = seatMap.exitRows.includes(rowNum);
                
                return (
                  <div key={rowNum} className="flex items-center gap-2">
                    {/* Row Number */}
                    <div className="w-10 text-center">
                      <span className="text-sm font-bold text-gray-600">{rowNum}</span>
                      {isExitRow && (
                        <div className="text-xs text-yellow-600 font-medium">EXIT</div>
                      )}
                    </div>

                    {/* Seats */}
                    <div className="flex gap-1">
                      {seats.map((seat, index) => (
                        <React.Fragment key={seat.id}>
                          <button
                            onClick={() => handleSeatClick(seat)}
                            disabled={
                              readonly ||
                              seat.availability === SeatAvailability.OCCUPIED ||
                              seat.availability === SeatAvailability.BLOCKED
                            }
                            className={getSeatClassName(seat)}
                            title={`${getSeatLabel(seat)} - ${seat.type} - ₹${seat.price}`}
                          >
                            {getSeatIcon(seat)}
                          </button>
                          
                          {/* Aisle gap (after column C in 3-3 configuration) */}
                          {index === 2 && (
                            <div className="w-6" aria-hidden="true" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Row Number (right side) */}
                    <div className="w-10 text-center">
                      <span className="text-sm font-bold text-gray-600">{rowNum}</span>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Aircraft Back Indicator */}
          <div className="text-center mt-4 pt-4 border-t-2 border-gray-300">
            <div className="inline-block px-6 py-2 bg-gray-100 rounded-full">
              <span className="text-sm font-semibold text-gray-600">← BACK →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Selection Summary</h4>
        
        {selectedSeats.size === 0 ? (
          <p className="text-sm text-gray-600">No seats selected yet</p>
        ) : (
          <div className="space-y-3">
            {passengers.map(passenger => {
              const selection = selectedSeats.get(passenger.id);
              if (!selection) return null;

              return (
                <div 
                  key={passenger.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Armchair className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{passenger.name}</p>
                      <p className="text-sm text-gray-600">
                        Seat {getSeatLabel(selection.seat)} • {selection.seat.type}
                        {selection.seat.availability === SeatAvailability.EXIT_ROW && ' • Exit Row'}
                        {selection.seat.availability === SeatAvailability.EXTRA_LEGROOM && ' • Extra Legroom'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{selection.price.toLocaleString()}</p>
                    {!readonly && (
                      <button
                        onClick={() => onSeatDeselect(passenger.id)}
                        className="text-xs text-red-600 hover:text-red-700 mt-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
              <p className="text-lg font-bold text-gray-900">Total Seat Charges</p>
              <p className="text-xl font-bold text-blue-600">₹{getTotalPrice.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
