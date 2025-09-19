/**
 * AI/LLM MAINTENANCE NOTES:
 * 
 * This validation utility prevents common runtime errors that cause app crashes.
 * Always use these functions when working with potentially undefined data.
 * 
 * CRITICAL FOR AI/LLM:
 * - Always validate data before using it
 * - Use safeGet() instead of direct property access
 * - Use safeCall() for function calls that might fail
 * - Use safeRender() for conditional rendering
 * - Never assume data exists - always check first
 * 
 * EXAMPLES:
 * - safeGet(healthData, 'stepsToday', 0) instead of healthData.stepsToday
 * - safeCall(() => data.toLocaleString()) instead of data.toLocaleString()
 * - safeRender(condition, <Component />) instead of condition && <Component />
 */

/**
 * Safely get a property from an object with a default value
 * Prevents "Cannot read properties of undefined" errors
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result == null || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    console.warn(`safeGet error for path "${path}":`, error);
    return defaultValue;
  }
}

/**
 * Safely call a function that might throw an error
 * Returns the result or a default value
 */
export function safeCall<T>(fn: () => T, defaultValue: T): T {
  try {
    return fn();
  } catch (error) {
    console.warn('safeCall error:', error);
    return defaultValue;
  }
}

/**
 * Safely render a component only if condition is true
 * Prevents rendering errors from undefined data
 */
export function safeRender(condition: any, component: React.ReactNode): React.ReactNode {
  if (!condition) return null;
  return component;
}

/**
 * Safely format a number with locale string
 * Handles undefined, null, and invalid numbers
 */
export function safeFormatNumber(value: any, defaultValue: string = '0'): string {
  if (value == null || isNaN(Number(value))) {
    return defaultValue;
  }
  
  try {
    return Number(value).toLocaleString();
  } catch (error) {
    console.warn('safeFormatNumber error:', error);
    return defaultValue;
  }
}

/**
 * Safely format a date
 * Handles invalid dates and provides fallback
 */
export function safeFormatDate(value: any, options?: Intl.DateTimeFormatOptions): string {
  if (!value) return 'No date';
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString(undefined, options);
  } catch (error) {
    console.warn('safeFormatDate error:', error);
    return 'Invalid date';
  }
}

/**
 * Validate that required properties exist on an object
 * Throws descriptive error if validation fails
 */
export function validateRequired(obj: any, requiredProps: string[], context: string = 'Object'): void {
  const missing = requiredProps.filter(prop => obj[prop] === undefined || obj[prop] === null);
  
  if (missing.length > 0) {
    throw new Error(`${context} is missing required properties: ${missing.join(', ')}`);
  }
}

/**
 * Create a safe component wrapper that handles errors gracefully
 */
export function withErrorHandling<T extends object>(
  Component: React.ComponentType<T>,
  fallbackComponent?: React.ComponentType<{ error: Error }>
) {
  return function SafeComponent(props: T) {
    try {
      return <Component {...props} />;
    } catch (error) {
      console.error('Component error:', error);
      
      if (fallbackComponent) {
        return <fallbackComponent error={error as Error} />;
      }
      
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <p>Component failed to render</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="text-xs mt-2">{String(error)}</pre>
          )}
        </div>
      );
    }
  };
}

/**
 * Validate health data structure
 * Ensures all required health data properties exist
 */
export function validateHealthData(healthData: any): boolean {
  try {
    const required = ['totalWorkouts', 'totalWorkoutMinutes', 'workoutTypes', 'avgSleepHours', 'sleepQuality', 'energyLevel'];
    validateRequired(healthData, required, 'HealthData');
    
    // Validate specific types
    if (typeof healthData.totalWorkouts !== 'number') return false;
    if (typeof healthData.totalWorkoutMinutes !== 'number') return false;
    if (typeof healthData.workoutTypes !== 'object') return false;
    if (typeof healthData.avgSleepHours !== 'number') return false;
    if (!['poor', 'fair', 'good'].includes(healthData.sleepQuality)) return false;
    if (!['low', 'medium', 'high'].includes(healthData.energyLevel)) return false;
    
    return true;
  } catch (error) {
    console.warn('HealthData validation failed:', error);
    return false;
  }
}

/**
 * Create safe health data with defaults
 */
export function createSafeHealthData(healthData: any = {}): any {
  return {
    totalWorkouts: safeGet(healthData, 'totalWorkouts', 0),
    totalWorkoutMinutes: safeGet(healthData, 'totalWorkoutMinutes', 0),
    workoutTypes: safeGet(healthData, 'workoutTypes', {}),
    avgSleepHours: safeGet(healthData, 'avgSleepHours', 7.5),
    sleepQuality: safeGet(healthData, 'sleepQuality', 'good'),
    energyLevel: safeGet(healthData, 'energyLevel', 'medium'),
    stepsToday: safeGet(healthData, 'stepsToday', 0),
    heartRate: safeGet(healthData, 'heartRate', 72),
    caloriesBurned: safeGet(healthData, 'caloriesBurned', 2000)
  };
}
