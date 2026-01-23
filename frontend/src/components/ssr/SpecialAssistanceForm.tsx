import React, { useState } from 'react';
import {
  AssistanceOption,
  AssistanceType,
  SpecialAssistanceRequest,
} from '../../../shared';
import { Accessibility, FileText, Phone, Check, AlertCircle } from 'lucide-react';

interface SpecialAssistanceFormProps {
  assistanceOptions: AssistanceOption[];
  passengers: {
    id: string;
    name: string;
    type: 'adult' | 'child' | 'infant';
  }[];
  selectedAssistance: Map<string, SpecialAssistanceRequest>;
  onAssistanceUpdate: (passengerId: string, assistance: SpecialAssistanceRequest | null) => void;
  readonly?: boolean;
}

export const SpecialAssistanceForm: React.FC<SpecialAssistanceFormProps> = ({
  assistanceOptions,
  passengers,
  selectedAssistance,
  onAssistanceUpdate,
  readonly = false,
}) => {
  const [activePassenger, setActivePassenger] = useState<string>(passengers[0]?.id);
  const [selectedCategory, setSelectedCategory] = useState<'mobility' | 'sensory' | 'medical' | 'other'>('mobility');

  const categorizedOptions = {
    mobility: assistanceOptions.filter(o => 
      o.type === AssistanceType.WHEELCHAIR_FULLY_IMMOBILE ||
      o.type === AssistanceType.WHEELCHAIR_CANNOT_CLIMB_STAIRS ||
      o.type === AssistanceType.WHEELCHAIR_LONG_DISTANCES
    ),
    sensory: assistanceOptions.filter(o =>
      o.type === AssistanceType.BLIND ||
      o.type === AssistanceType.DEAF ||
      o.type === AssistanceType.DEAF_BLIND
    ),
    medical: assistanceOptions.filter(o =>
      o.type === AssistanceType.MEDICAL_OXYGEN ||
      o.type === AssistanceType.STRETCHER ||
      o.type === AssistanceType.MEDICAL_CLEARANCE
    ),
    other: assistanceOptions.filter(o =>
      o.type === AssistanceType.UNACCOMPANIED_MINOR ||
      o.type === AssistanceType.GUIDE_DOG ||
      o.type === AssistanceType.EMOTIONAL_SUPPORT_ANIMAL ||
      o.type === AssistanceType.SERVICE_ANIMAL
    ),
  };

  const handleAssistanceToggle = (option: AssistanceOption) => {
    if (readonly) return;

    const activePass = passengers.find(p => p.id === activePassenger);
    if (!activePass) return;

    const current = selectedAssistance.get(activePassenger);
    
    if (current) {
      const hasOption = current.assistance.some((a: any) => a.code === option.code);
      
      if (hasOption) {
        // Remove
        const updated = {
          ...current,
          assistance: current.assistance.filter((a: any) => a.code !== option.code),
          totalPrice: current.totalPrice - option.price,
        };
        
        if (updated.assistance.length === 0) {
          onAssistanceUpdate(activePassenger, null);
        } else {
          onAssistanceUpdate(activePassenger, updated);
        }
      } else {
        // Add
        const updated = {
          ...current,
          assistance: [...current.assistance, option],
          totalPrice: current.totalPrice + option.price,
        };
        onAssistanceUpdate(activePassenger, updated);
      }
    } else {
      // Create new
      const newRequest: SpecialAssistanceRequest = {
        passengerId: activePassenger,
        passengerName: activePass.name,
        assistance: [option],
        additionalDetails: '',
        totalPrice: option.price,
        currency: 'NPR',
      };
      onAssistanceUpdate(activePassenger, newRequest);
    }
  };

  const handleDetailsUpdate = (field: string, value: string) => {
    if (readonly) return;

    const current = selectedAssistance.get(activePassenger);
    if (!current) return;

    onAssistanceUpdate(activePassenger, {
      ...current,
      [field]: value,
    });
  };

  const handleEmergencyContactUpdate = (field: string, value: string) => {
    if (readonly) return;

    const current = selectedAssistance.get(activePassenger);
    if (!current) return;

    onAssistanceUpdate(activePassenger, {
      ...current,
      emergencyContact: {
        ...(current.emergencyContact || { name: '', relationship: '', phone: '' }),
        [field]: value,
      },
    });
  };

  const currentAssistance = selectedAssistance.get(activePassenger);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Accessibility className="w-6 h-6 text-blue-600" />
          Special Assistance
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Request special services for passengers with specific needs
        </p>
      </div>

      {/* Passenger Selection */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Requesting assistance for:</h4>
        <div className="flex flex-wrap gap-2">
          {passengers.map(passenger => {
            const hasAssistance = selectedAssistance.has(passenger.id);
            const isActive = passenger.id === activePassenger;

            return (
              <button
                key={passenger.id}
                onClick={() => !readonly && setActivePassenger(passenger.id)}
                disabled={readonly}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : hasAssistance
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                } ${readonly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                {passenger.name}
                {hasAssistance && ` (${selectedAssistance.get(passenger.id)!.assistance.length})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {(['mobility', 'sensory', 'medical', 'other'] as const).map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
              <span className="ml-2 text-xs opacity-75">
                ({categorizedOptions[category].length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Assistance Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categorizedOptions[selectedCategory].map(option => {
          const isSelected = currentAssistance?.assistance.some((a: any) => a.code === option.code) || false;

          return (
            <div
              key={option.code}
              className={`rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{option.name}</h5>
                    <p className="text-xs text-gray-500 mt-0.5">Code: {option.code}</p>
                  </div>
                  <p className="font-bold text-blue-600">
                    {option.price > 0 ? `₹${option.price.toLocaleString()}` : 'Free'}
                  </p>
                </div>

                <p className="text-sm text-gray-600 mb-3">{option.description}</p>

                {/* Requirements */}
                {option.requirements.length > 0 && (
                  <div className="mb-3 bg-yellow-50 p-2 rounded text-xs">
                    <p className="font-medium text-yellow-800 mb-1">Requirements:</p>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1">
                      {option.requirements.map((req: string, idx: number) => (
                        <li key={idx}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Documents */}
                {option.documents.length > 0 && (
                  <div className="mb-3 bg-blue-50 p-2 rounded text-xs">
                    <p className="font-medium text-blue-800 mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      Required Documents:
                    </p>
                    <ul className="list-disc list-inside text-blue-700 space-y-1">
                      {option.documents.map((doc: string, idx: number) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Advance Notice */}
                <div className="mb-3 text-xs text-gray-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Requires {option.advanceNoticeHours}h advance notice
                </div>

                <button
                  onClick={() => handleAssistanceToggle(option)}
                  disabled={readonly}
                  className={`w-full py-2 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${readonly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4 inline mr-2" />
                      Selected
                    </>
                  ) : (
                    'Select'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Details Form */}
      {currentAssistance && currentAssistance.assistance.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Additional Information</h4>

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Details
            </label>
            <textarea
              value={currentAssistance.additionalDetails}
              onChange={(e) => handleDetailsUpdate('additionalDetails', e.target.value)}
              placeholder="Please provide any additional information that may help us assist you better..."
              rows={4}
              disabled={readonly}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
            />
          </div>

          {/* Emergency Contact */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Emergency Contact (Optional but Recommended)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Contact Name"
                value={currentAssistance.emergencyContact?.name || ''}
                onChange={(e) => handleEmergencyContactUpdate('name', e.target.value)}
                disabled={readonly}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
              />
              <input
                type="text"
                placeholder="Relationship"
                value={currentAssistance.emergencyContact?.relationship || ''}
                onChange={(e) => handleEmergencyContactUpdate('relationship', e.target.value)}
                disabled={readonly}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={currentAssistance.emergencyContact?.phone || ''}
                onChange={(e) => handleEmergencyContactUpdate('phone', e.target.value)}
                disabled={readonly}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Assistance Summary</h4>

        {selectedAssistance.size === 0 ? (
          <p className="text-sm text-gray-600">No special assistance requested</p>
        ) : (
          <div className="space-y-3">
            {Array.from(selectedAssistance.entries()).map(([passId, request]) => {
              const passenger = passengers.find(p => p.id === passId);
              if (!passenger) return null;

              return (
                <div key={passId} className="bg-white p-4 rounded-lg">
                  <p className="font-semibold text-gray-900 mb-2">{passenger.name}</p>
                  <div className="space-y-1">
                    {request.assistance.map((assist: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-600">{assist.name}</span>
                        <span className="font-medium">
                          {assist.price > 0 ? `₹${assist.price.toLocaleString()}` : 'Free'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
              <p className="text-lg font-bold text-gray-900">Total Assistance Charges</p>
              <p className="text-xl font-bold text-blue-600">
                ₹{Array.from(selectedAssistance.values())
                  .reduce((sum, req) => sum + req.totalPrice, 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
