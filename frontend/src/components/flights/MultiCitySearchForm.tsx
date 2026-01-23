/**
 * Multi-City Flight Search Form
 * Production-ready component with dynamic segments, validation, and smart UX
 */

import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, AlertCircle, Calendar, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { validateMultiCitySearch, type FlightSegment, type FlightValidationError } from '../../../shared/multiCityTypes';

// Zod validation schema
const segmentSchema = z.object({
  id: z.string(),
  origin: z.string()
    .min(3, 'Enter valid airport code')
    .max(3, 'Enter valid airport code')
    .regex(/^[A-Z]{3}$/, 'Must be 3-letter IATA code'),
  destination: z.string()
    .min(3, 'Enter valid airport code')
    .max(3, 'Enter valid airport code')
    .regex(/^[A-Z]{3}$/, 'Must be 3-letter IATA code'),
  departureDate: z.string().min(1, 'Departure date required'),
  originCity: z.string().optional(),
  destinationCity: z.string().optional(),
}).refine((data) => data.origin !== data.destination, {
  message: 'Origin and destination must be different',
  path: ['destination'],
});

const multiCitySchema = z.object({
  segments: z.array(segmentSchema).min(2, 'At least 2 segments required').max(6, 'Maximum 6 segments'),
  adults: z.number().min(1).max(9),
  children: z.number().min(0).max(8).optional(),
  infants: z.number().min(0).max(9).optional(),
  travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']),
  flexibleDates: z.boolean().optional(),
  directFlightsOnly: z.boolean().optional(),
}).refine((data) => {
  // Validate infants <= adults
  if (data.infants && data.infants > data.adults) {
    return false;
  }
  return true;
}, {
  message: 'Number of infants cannot exceed adults',
  path: ['infants'],
}).refine((data) => {
  // Validate date sequence across segments and then go to the travel agent page
  for (let i = 1; i < data.segments.length; i++) {
    const prevDate = new Date(data.segments[i - 1].departureDate);
    const currentDate = new Date(data.segments[i].departureDate);
    if (currentDate <= prevDate) {
      return false;
    }
  }
  return true;
}, {
  message: 'Each segment must depart after the previous one',
  path: ['segments'],
});

type MultiCityFormData = z.infer<typeof multiCitySchema>;

interface MultiCitySearchFormProps {
  onSearch: (data: MultiCityFormData) => void;
  isLoading?: boolean;
}

export const MultiCitySearchForm: React.FC<MultiCitySearchFormProps> = ({
  onSearch,
  isLoading = false,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<MultiCityFormData>({
    resolver: zodResolver(multiCitySchema),
    defaultValues: {
      segments: [
        {
          id: '1',
          origin: '',
          destination: '',
          departureDate: '',
        },
        {
          id: '2',
          origin: '',
          destination: '',
          departureDate: '',
        },
      ],
      adults: 1,
      children: 0,
      infants: 0,
      travelClass: 'ECONOMY',
      flexibleDates: false,
      directFlightsOnly: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'segments',
  });

  const segments = watch('segments');
  const adults = watch('adults');
  const infants = watch('infants');

  // Real-time validation for circular routes
  useEffect(() => {
    if (segments.length >= 3) {
      const validation = validateMultiCitySearch({
        segments: segments as FlightSegment[],
        adults,
        travelClass: watch('travelClass'),
      });

      if (validation.warnings && validation.warnings.length > 0) {
        toast(validation.warnings[0], {
          icon: '⚠️',
          duration: 4000,
        });
      }
    }
  }, [segments, adults]);

  // Validate infants vs adults
  useEffect(() => {
    if (infants && infants > adults) {
      setError('infants', {
        message: `Maximum ${adults} infant${adults > 1 ? 's' : ''} (one per adult)`,
      });
    } else {
      clearErrors('infants');
    }
  }, [infants, adults, setError, clearErrors]);

  const handleAddSegment = () => {
    if (fields.length >= 6) {
      toast.error('Maximum 6 segments allowed');
      return;
    }

    const lastSegment = segments[segments.length - 1];
    const lastDate = new Date(lastSegment.departureDate);
    lastDate.setDate(lastDate.getDate() + 1); // Next day by default

    append({
      id: Date.now().toString(),
      origin: lastSegment.destination || '', // Auto-fill from previous destination
      destination: '',
      departureDate: lastDate.toISOString().split('T')[0],
    });
  };

  const handleRemoveSegment = (index: number) => {
    if (fields.length <= 2) {
      toast.error('Minimum 2 segments required');
      return;
    }
    remove(index);
  };

  const onSubmit = (data: MultiCityFormData) => {
    // Final validation
    const validation = validateMultiCitySearch({
      segments: data.segments as FlightSegment[],
      adults: data.adults,
      children: data.children,
      infants: data.infants,
      travelClass: data.travelClass,
    });

    if (!validation.isValid) {
      validation.errors.forEach((error: FlightValidationError) => {
        toast.error(`Segment ${error.segmentIndex + 1}: ${error.message}`);
      });
      return;
    }

    onSearch(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Segments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Flight Segments</h3>
          <span className="text-sm text-gray-500">{fields.length} of 6 segments</span>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="relative p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Segment Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Flight {index + 1}
              </span>
              {fields.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSegment(index)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded transition-colors"
                  title="Remove segment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Segment Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Origin */}
              <Controller
                name={`segments.${index}.origin`}
                control={control}
                render={({ field: controllerField }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      From
                    </label>
                    <input
                      {...controllerField}
                      type="text"
                      placeholder="LAX"
                      maxLength={3}
                      className={`
                        w-full px-3 py-2 border rounded-lg text-sm uppercase
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.segments?.[index]?.origin ? 'border-red-300' : 'border-gray-300'}
                      `}
                      onChange={(e) => {
                        controllerField.onChange(e.target.value.toUpperCase());
                      }}
                    />
                    {errors.segments?.[index]?.origin && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.segments[index]?.origin?.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Destination */}
              <Controller
                name={`segments.${index}.destination`}
                control={control}
                render={({ field: controllerField }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      To
                    </label>
                    <input
                      {...controllerField}
                      type="text"
                      placeholder="JFK"
                      maxLength={3}
                      className={`
                        w-full px-3 py-2 border rounded-lg text-sm uppercase
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.segments?.[index]?.destination ? 'border-red-300' : 'border-gray-300'}
                      `}
                      onChange={(e) => {
                        controllerField.onChange(e.target.value.toUpperCase());
                      }}
                    />
                    {errors.segments?.[index]?.destination && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.segments[index]?.destination?.message}
                      </p>
                    )}
                  </div>
                )}
              />

              {/* Departure Date */}
              <Controller
                name={`segments.${index}.departureDate`}
                control={control}
                render={({ field: controllerField }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Date
                    </label>
                    <input
                      {...controllerField}
                      type="date"
                      min={index === 0 ? today : segments[index - 1]?.departureDate || today}
                      className={`
                        w-full px-3 py-2 border rounded-lg text-sm
                        focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        ${errors.segments?.[index]?.departureDate ? 'border-red-300' : 'border-gray-300'}
                      `}
                    />
                    {errors.segments?.[index]?.departureDate && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.segments[index]?.departureDate?.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Connection indicator */}
            {index < fields.length - 1 && (
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-md">
                  ↓
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Add Segment Button */}
        {fields.length < 6 && (
          <button
            type="button"
            onClick={handleAddSegment}
            className="
              w-full py-3 border-2 border-dashed border-gray-300 rounded-lg
              text-sm font-medium text-gray-600 hover:text-blue-600 hover:border-blue-300
              transition-colors flex items-center justify-center space-x-2
            "
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Flight</span>
          </button>
        )}
      </div>

      {/* Passengers & Class */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Passengers */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Passengers</h4>
          
          <div className="grid grid-cols-3 gap-3">
            <Controller
              name="adults"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Adults</label>
                  <input
                    {...field}
                    type="number"
                    min="1"
                    max="9"
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            />

            <Controller
              name="children"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Children</label>
                  <input
                    {...field}
                    type="number"
                    min="0"
                    max="8"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            />

            <Controller
              name="infants"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Infants</label>
                  <input
                    {...field}
                    type="number"
                    min="0"
                    max={adults}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className={`
                      w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500
                      ${errors.infants ? 'border-red-300' : 'border-gray-300'}
                    `}
                  />
                  {errors.infants && (
                    <p className="mt-1 text-xs text-red-600">{errors.infants.message}</p>
                  )}
                </div>
              )}
            />
          </div>
        </div>

        {/* Travel Class */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-900">Travel Class</h4>
          <Controller
            name="travelClass"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="ECONOMY">Economy</option>
                <option value="PREMIUM_ECONOMY">Premium Economy</option>
                <option value="BUSINESS">Business</option>
                <option value="FIRST">First Class</option>
              </select>
            )}
          />
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-4">
        <Controller
          name="flexibleDates"
          control={control}
          render={({ field }) => (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Flexible dates (±3 days)</span>
            </label>
          )}
        />

        <Controller
          name="directFlightsOnly"
          control={control}
          render={({ field }) => (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Direct flights only</span>
            </label>
          )}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className={`
          w-full py-3 px-6 rounded-lg font-semibold text-white shadow-lg
          transition-all transform hover:scale-105
          ${isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'}
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Searching...</span>
          </span>
        ) : (
          'Search Multi-City Flights'
        )}
      </button>

      {/* Form Errors */}
      {errors.segments && typeof errors.segments.message === 'string' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{errors.segments.message}</p>
        </div>
      )}
    </form>
  );
};

export default MultiCitySearchForm;
