import React, { useState, useMemo } from 'react';
import {
  MealOption,
  MealType,
  MealSelection as MealSelectionType,
  validateMealSelection,
} from '../../../shared';
import { UtensilsCrossed, Check, Clock, AlertTriangle, Leaf, Fish } from 'lucide-react';

interface MealSelectionProps {
  meals: MealOption[];
  passengers: {
    id: string;
    name: string;
    type: 'adult' | 'child' | 'infant';
  }[];
  selectedMeals: Map<string, MealSelectionType>; // passengerId => MealSelection
  onMealSelect: (passengerId: string, meal: MealOption) => void;
  departureTime: Date;
  segmentIndex: number;
  flightSegmentId: string;
  readonly?: boolean;
}

export const MealSelection: React.FC<MealSelectionProps> = ({
  meals,
  passengers,
  selectedMeals,
  onMealSelect,
  departureTime,
  segmentIndex: _segmentIndex,
  flightSegmentId: _flightSegmentId,
  readonly = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'vegetarian' | 'special' | 'dietary'>('all');
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(new Map());

  // Categorize meals
  const categorizedMeals = useMemo(() => {
    const categories = {
      standard: [] as MealOption[],
      vegetarian: [] as MealOption[],
      religious: [] as MealOption[],
      dietary: [] as MealOption[],
      child: [] as MealOption[],
    };

    meals.forEach(meal => {
      switch (meal.type) {
        case MealType.STANDARD:
          categories.standard.push(meal);
          break;
        case MealType.VEGETARIAN:
        case MealType.VEGAN:
        case MealType.JAIN:
          categories.vegetarian.push(meal);
          break;
        case MealType.HINDU:
        case MealType.HALAL:
        case MealType.KOSHER:
          categories.religious.push(meal);
          break;
        case MealType.DIABETIC:
        case MealType.LOW_CALORIE:
        case MealType.LOW_SALT:
        case MealType.GLUTEN_FREE:
        case MealType.LACTOSE_FREE:
        case MealType.NUT_FREE:
        case MealType.SEAFOOD_FREE:
          categories.dietary.push(meal);
          break;
        case MealType.CHILD_MEAL:
        case MealType.INFANT_MEAL:
          categories.child.push(meal);
          break;
        default:
          categories.standard.push(meal);
      }
    });

    return categories;
  }, [meals]);

  const filteredMeals = useMemo(() => {
    switch (selectedCategory) {
      case 'vegetarian':
        return [...categorizedMeals.vegetarian, ...categorizedMeals.religious];
      case 'special':
        return categorizedMeals.child;
      case 'dietary':
        return categorizedMeals.dietary;
      default:
        return meals;
    }
  }, [selectedCategory, meals, categorizedMeals]);

  const handleMealSelect = (passengerId: string, meal: MealOption) => {
    if (readonly) return;

    // Validate meal selection
    const validation = validateMealSelection(meal, departureTime);
    
    if (!validation.valid) {
      const newErrors = new Map(validationErrors);
      newErrors.set(passengerId, validation.errors[0]?.message || 'Invalid meal selection');
      setValidationErrors(newErrors);
      return;
    }

    // Clear any previous errors
    const newErrors = new Map(validationErrors);
    newErrors.delete(passengerId);
    setValidationErrors(newErrors);

    onMealSelect(passengerId, meal);

    // Show warnings if any
    if (validation.warnings.length > 0) {
      const newErrors = new Map(validationErrors);
      newErrors.set(passengerId, validation.warnings[0].message);
      setValidationErrors(newErrors);
      setTimeout(() => {
        setValidationErrors(prev => {
          const updated = new Map(prev);
          updated.delete(passengerId);
          return updated;
        });
      }, 5000);
    }
  };

  const getMealIcon = (mealType: MealType) => {
    switch (mealType) {
      case MealType.VEGETARIAN:
      case MealType.VEGAN:
        return <Leaf className="w-5 h-5 text-green-600" />;
      case MealType.SEAFOOD_FREE:
        return <Fish className="w-5 h-5 text-primary-950" />;
      case MealType.CHILD_MEAL:
      case MealType.INFANT_MEAL:
        return <span className="text-xl">👶</span>;
      case MealType.DIABETIC:
        return <span className="text-xl">🏥</span>;
      case MealType.HALAL:
        return <span className="text-xl">☪️</span>;
      case MealType.KOSHER:
        return <span className="text-xl">✡️</span>;
      case MealType.HINDU:
        return <span className="text-xl">🕉️</span>;
      default:
        return <UtensilsCrossed className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTotalPrice = useMemo(() => {
    return Array.from(selectedMeals.values()).reduce((sum, sel) => sum + sel.price, 0);
  }, [selectedMeals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-accent-50 p-6 rounded-lg">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-green-600" />
          Select Your Meals
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose from our wide range of meal options
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Meals', count: meals.length },
            { id: 'vegetarian', label: 'Vegetarian & Religious', count: categorizedMeals.vegetarian.length + categorizedMeals.religious.length },
            { id: 'dietary', label: 'Special Dietary', count: categorizedMeals.dietary.length },
            { id: 'special', label: 'Child Meals', count: categorizedMeals.child.length },
          ].map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label}
              <span className="ml-2 text-xs opacity-75">({category.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Meal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeals.map(meal => {
          const isSelected = Array.from(selectedMeals.values()).some(
            sel => sel.meal.code === meal.code
          );

          const selectedBy = Array.from(selectedMeals.entries())
            .filter(([_, sel]) => sel.meal.code === meal.code)
            .map(([passId]) => passengers.find(p => p.id === passId))
            .filter(Boolean);

          return (
            <div
              key={meal.code}
              className={`bg-white rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-green-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!meal.available ? 'opacity-60' : ''}`}
            >
              <div className="p-4">
                {/* Meal Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {getMealIcon(meal.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{meal.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{meal.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {meal.price > 0 ? (
                      <p className="font-bold text-green-600">+₹{meal.price}</p>
                    ) : (
                      <p className="text-xs text-gray-500">Included</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-3">{meal.description}</p>

                {/* Ingredients */}
                {meal.ingredients && meal.ingredients.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {meal.ingredients.map((ingredient: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergens */}
                {meal.allergens && meal.allergens.length > 0 && (
                  <div className="mb-3 bg-red-50 p-2 rounded">
                    <p className="text-xs font-medium text-red-700 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Allergens:
                    </p>
                    <p className="text-xs text-red-600">{meal.allergens.join(', ')}</p>
                  </div>
                )}

                {/* Advance Order Notice */}
                {meal.advanceOrderRequired && meal.minimumNoticeHours && (
                  <div className="mb-3 bg-yellow-50 p-2 rounded flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <p className="text-xs text-yellow-700">
                      Requires {meal.minimumNoticeHours}h advance notice
                    </p>
                  </div>
                )}

                {/* Selected By */}
                {selectedBy.length > 0 && (
                  <div className="mb-3 bg-green-50 p-2 rounded">
                    <p className="text-xs font-medium text-green-700 mb-1">Selected by:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedBy.map(pass => (
                        <span
                          key={pass!.id}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded"
                        >
                          {pass!.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Select Button for Each Passenger */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-700">Select for:</p>
                  <div className="flex flex-wrap gap-2">
                    {passengers.map(passenger => {
                      const hasSelected = selectedMeals.get(passenger.id)?.meal.code === meal.code;

                      // Filter out infant meals for non-infants
                      if (meal.type === MealType.INFANT_MEAL && passenger.type !== 'infant') {
                        return null;
                      }

                      // Filter out child meals for non-children/infants
                      if (meal.type === MealType.CHILD_MEAL && 
                          passenger.type !== 'child' && passenger.type !== 'infant') {
                        return null;
                      }

                      return (
                        <button
                          key={passenger.id}
                          onClick={() => handleMealSelect(passenger.id, meal)}
                          disabled={readonly || !meal.available}
                          className={`text-xs px-3 py-1.5 rounded font-medium transition-all ${
                            hasSelected
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          } ${!meal.available || readonly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {hasSelected && <Check className="w-3 h-3 inline mr-1" />}
                          {passenger.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Errors */}
      {validationErrors.size > 0 && (
        <div className="space-y-2">
          {Array.from(validationErrors.entries()).map(([passId, error]) => {
            const passenger = passengers.find(p => p.id === passId);
            return (
              <div
                key={passId}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">{passenger?.name}</p>
                  <p className="text-sm text-yellow-700 mt-1">{error}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selection Summary */}
      <div className="bg-gradient-to-r from-green-50 to-accent-50 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Meal Summary</h4>

        {selectedMeals.size === 0 ? (
          <p className="text-sm text-gray-600">No meals selected yet. Standard meals will be provided.</p>
        ) : (
          <div className="space-y-3">
            {passengers.map(passenger => {
              const selection = selectedMeals.get(passenger.id);
              if (!selection) return null;

              return (
                <div
                  key={passenger.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      {getMealIcon(selection.meal.type)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{passenger.name}</p>
                      <p className="text-sm text-gray-600">{selection.meal.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {selection.price > 0 ? `₹${selection.price.toLocaleString()}` : 'Included'}
                    </p>
                    {!readonly && (
                      <button
                        onClick={() => {
                          const newMeals = new Map(selectedMeals);
                          newMeals.delete(passenger.id);
                          // This would need to be passed as a prop
                        }}
                        className="text-xs text-red-600 hover:text-red-700 mt-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {getTotalPrice > 0 && (
              <div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
                <p className="text-lg font-bold text-gray-900">Total Meal Charges</p>
                <p className="text-xl font-bold text-green-600">₹{getTotalPrice.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
