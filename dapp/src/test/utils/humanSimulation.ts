/**
 * Utilities for simulating realistic human behavior in tests
 */

interface CognitiveState {
  typingErrorRate: number;
  reactionTimeMultiplier: number;
  distractionProbability: number;
}

interface NetworkProfile {
  latency: { min: number; max: number };
  errorRate: number;
}

// Network profiles without the function
interface NetworkProfiles {
  fast: NetworkProfile;
  average: NetworkProfile;
  slow: NetworkProfile;
  flaky: NetworkProfile;
  [key: string]: NetworkProfile;
}

// Realistic timing intervals
export const randomTiming = {
  // Average human reaction time (200-300ms)
  reactionTime: () => Math.floor(Math.random() * 100) + 200,
  
  // Average time between keypresses for typing (80-200ms)
  keyPressDelay: () => Math.floor(Math.random() * 120) + 80,
  
  // Thinking pause (1-3 seconds)
  thinkingPause: async () => {
    const pauseTime = Math.floor(Math.random() * 2000) + 1000;
    return new Promise(resolve => setTimeout(resolve, pauseTime));
  },
  
  // Average human timing for userEvent
  averageHuman: () => Math.floor(Math.random() * 50) + 100,
  
  // Frustrated user timing (faster, more erratic)
  frustratedUser: () => Math.floor(Math.random() * 30) + 50,
  
  // Distracted user timing (slower, inconsistent)
  distractedUser: () => Math.floor(Math.random() * 300) + 200,
  
  // Careful user timing (slower, more methodical)
  carefulUser: () => Math.floor(Math.random() * 150) + 250,
  
  // Natural pause between actions (500ms-2s)
  naturalPause: async () => {
    const pauseTime = Math.floor(Math.random() * 1500) + 500;
    return new Promise(resolve => setTimeout(resolve, pauseTime));
  },
  
  // Long consideration pause (3-8 seconds)
  longConsideration: async () => {
    const pauseTime = Math.floor(Math.random() * 5000) + 3000;
    return new Promise(resolve => setTimeout(resolve, pauseTime));
  },
  
  // Simulates a user getting distracted and coming back (5-15 seconds)
  distractionPause: async () => {
    const pauseTime = Math.floor(Math.random() * 10000) + 5000;
    return new Promise(resolve => setTimeout(resolve, pauseTime));
  }
};

// Simulated network conditions
export const networkProfiles: NetworkProfiles = {
  fast: {
    latency: { min: 10, max: 50 },
    errorRate: 0.01
  },
  average: {
    latency: { min: 50, max: 200 },
    errorRate: 0.05
  },
  slow: {
    latency: { min: 200, max: 1000 },
    errorRate: 0.1
  },
  flaky: {
    latency: { min: 100, max: 3000 },
    errorRate: 0.2
  }
};

// Simulates network delay
export const simulateNetworkDelay = async (profile: NetworkProfile = networkProfiles.average) => {
  const delay = Math.floor(Math.random() * (profile.latency.max - profile.latency.min)) + profile.latency.min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Simulates network error
export const simulateNetworkError = (profile: NetworkProfile = networkProfiles.average): boolean => {
  return Math.random() < profile.errorRate;
};

// Generates common typos and corrections
export const simulateTypingErrors = (text: string, errorRate = 0.1): string => {
  if (errorRate <= 0) return text;
  
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Introduce random typing errors
    if (Math.random() < errorRate) {
      // Error types: 
      // 1. Skip a character
      // 2. Duplicate a character
      // 3. Press an adjacent key
      // 4. Transpose with next character
      
      const errorType = Math.floor(Math.random() * 4);
      
      switch (errorType) {
        case 0: // Skip
          // Do nothing, effectively skipping the character
          break;
        
        case 1: // Duplicate
          result.push(char);
          result.push(char);
          break;
          
        case 2: { // Adjacent key
          const adjacentKeys: Record<string, string[]> = {
            'a': ['q', 'w', 's', 'z'],
            's': ['a', 'w', 'd', 'z', 'x'],
            'd': ['s', 'e', 'f', 'c', 'x'],
            // Add more key mappings for common keyboard layouts
          };
          
          if (adjacentKeys[char.toLowerCase()]) {
            const adjacent = adjacentKeys[char.toLowerCase()];
            result.push(adjacent[Math.floor(Math.random() * adjacent.length)]);
          } else {
            result.push(char); // No mapping, just use the original
          }
          break;
        }
          
        case 3: // Transpose
          if (i < text.length - 1) {
            result.push(text[i + 1]);
            result.push(char);
            i++; // Skip next character since we've used it
          } else {
            result.push(char);
          }
          break;
          
        default:
          result.push(char);
      }
    } else {
      result.push(char);
    }
  }
  
  return result.join('');
};

// Simulates cognitive load to make test interactions more human-like
export const simulateCognitiveLoad = (baseState: CognitiveState = { 
  typingErrorRate: 0.05, 
  reactionTimeMultiplier: 1, 
  distractionProbability: 0.1 
}): CognitiveState => {
  // Adjust cognitive parameters based on random factors
  return {
    typingErrorRate: baseState.typingErrorRate * (Math.random() * 0.5 + 0.75), // 75%-125% of base
    reactionTimeMultiplier: baseState.reactionTimeMultiplier * (Math.random() * 0.5 + 0.75), // 75%-125% of base
    distractionProbability: baseState.distractionProbability * (Math.random() * 0.5 + 0.75) // 75%-125% of base
  };
};

// Human-like user interactions with appropriate timing and randomness
export const humanSimulation = {
  // Type text with realistic timing and possible errors
  type: async (element: HTMLElement, text: string, options: { 
    errorRate?: number,
    speed?: 'fast' | 'average' | 'slow' | 'careful',
    cognitiveLoad?: CognitiveState
  } = {}) => {
    const cognitiveState = options.cognitiveLoad || simulateCognitiveLoad();
    const errorRate = options.errorRate !== undefined ? options.errorRate : cognitiveState.typingErrorRate;
    
    // Determine typing speed based on cognitive state and options
    let delayFn = randomTiming.keyPressDelay;
    if (options.speed === 'fast') {
      delayFn = () => randomTiming.keyPressDelay() * 0.7;
    } else if (options.speed === 'slow') {
      delayFn = () => randomTiming.keyPressDelay() * 1.5;
    } else if (options.speed === 'careful') {
      delayFn = () => randomTiming.keyPressDelay() * 2;
    }
    
    // Apply cognitive load to typing
    const textWithErrors = simulateTypingErrors(text, errorRate);
    
    // Type each character with a natural delay
    const userEvent = await import('@testing-library/user-event');
    for (let i = 0; i < textWithErrors.length; i++) {
      // Random pause to simulate thinking or distraction
      if (Math.random() < cognitiveState.distractionProbability) {
        await randomTiming.thinkingPause();
      }
      
      // Type the character
      await userEvent.default.type(element, textWithErrors[i], { delay: delayFn() * cognitiveState.reactionTimeMultiplier });
    }
  },
  
  // Click with realistic reaction time
  click: async (element: HTMLElement, options: {
    timing?: 'fast' | 'average' | 'slow' | 'frustrated' | 'careful',
    cognitiveLoad?: CognitiveState
  } = {}) => {
    const cognitiveState = options.cognitiveLoad || simulateCognitiveLoad();
    
    // Determine timing function based on options
    let delayFn = randomTiming.reactionTime;
    if (options.timing === 'fast') {
      delayFn = () => randomTiming.reactionTime() * 0.7;
    } else if (options.timing === 'slow') {
      delayFn = () => randomTiming.reactionTime() * 1.5;
    } else if (options.timing === 'frustrated') {
      delayFn = randomTiming.frustratedUser;
    } else if (options.timing === 'careful') {
      delayFn = randomTiming.carefulUser;
    }
    
    // Simulate reaction time before clicking
    await new Promise(resolve => setTimeout(resolve, delayFn() * cognitiveState.reactionTimeMultiplier));
    
    // Perform the click
    const userEvent = await import('@testing-library/user-event');
    await userEvent.default.click(element);
  },
  
  // Simulate pressing keys
  press: async (key: string, options: {
    timing?: 'fast' | 'average' | 'slow',
    cognitiveLoad?: CognitiveState
  } = {}) => {
    const cognitiveState = options.cognitiveLoad || simulateCognitiveLoad();
    
    // Determine timing function based on options
    let delayFn = randomTiming.reactionTime;
    if (options.timing === 'fast') {
      delayFn = () => randomTiming.reactionTime() * 0.7;
    } else if (options.timing === 'slow') {
      delayFn = () => randomTiming.reactionTime() * 1.5;
    }
    
    // Simulate reaction time before pressing
    await new Promise(resolve => setTimeout(resolve, delayFn() * cognitiveState.reactionTimeMultiplier));
    
    // Press the key
    const userEvent = await import('@testing-library/user-event');
    await userEvent.default.keyboard(key);
  },
  
  // Simulate human-like searching behavior
  search: async (searchElement: HTMLElement, searchTerm: string, options: {
    speed?: 'fast' | 'average' | 'slow' | 'careful',
    cognitiveLoad?: CognitiveState,
    thinkBeforeSearch?: boolean
  } = {}) => {
    // Default to thinking before searching
    const thinkBeforeSearch = options.thinkBeforeSearch !== undefined ? options.thinkBeforeSearch : true;
    
    // Simulate thinking before typing search term
    if (thinkBeforeSearch) {
      await randomTiming.thinkingPause();
    }
    
    // Type the search term with realistic timing and errors
    await humanSimulation.type(searchElement, searchTerm, options);
    
    // Pause briefly before pressing Enter to submit
    await randomTiming.naturalPause();
    
    // Press Enter to submit the search
    await humanSimulation.press('Enter', options);
  },
  
  // Simulate realistic form filling
  fillForm: async (formElements: Record<string, HTMLElement>, formData: Record<string, string>, options: {
    thinkBetweenFields?: boolean,
    fieldOrder?: string[],
    cognitiveLoad?: CognitiveState
  } = {}) => {
    const cognitiveState = options.cognitiveLoad || simulateCognitiveLoad();
    
    // Default to thinking between fields
    const thinkBetweenFields = options.thinkBetweenFields !== undefined ? options.thinkBetweenFields : true;
    
    // Determine field order (use provided order or object keys)
    const fieldOrder = options.fieldOrder || Object.keys(formData);
    
    // Fill each field in order
    for (const field of fieldOrder) {
      if (!formElements[field] || !formData[field]) continue;
      
      // Click on the field
      await humanSimulation.click(formElements[field], { cognitiveLoad: cognitiveState });
      
      // Simulate thinking between fields
      if (thinkBetweenFields) {
        await randomTiming.naturalPause();
      }
      
      // Type the field value
      await humanSimulation.type(formElements[field], formData[field], { cognitiveLoad: cognitiveState });
      
      // Random chance to get distracted between fields
      if (Math.random() < cognitiveState.distractionProbability) {
        await randomTiming.distractionPause();
      } else if (thinkBetweenFields) {
        await randomTiming.naturalPause();
      }
    }
  },
  
  // Simulate browsing behavior - scrolling through results
  browseResults: async (scrollableElement: HTMLElement, options: {
    scrollDepth?: 'shallow' | 'medium' | 'deep',
    pauseOnInterestingContent?: boolean,
    cognitiveLoad?: CognitiveState
  } = {}) => {
    const cognitiveState = options.cognitiveLoad || simulateCognitiveLoad();
    const pauseOnInterestingContent = options.pauseOnInterestingContent !== undefined ? 
      options.pauseOnInterestingContent : true;
    
    // Determine how far to scroll
    let scrollSteps = 3; // Default medium
    if (options.scrollDepth === 'shallow') {
      scrollSteps = 1;
    } else if (options.scrollDepth === 'deep') {
      scrollSteps = 5;
    }
    
    // Simulate scrolling behavior
    for (let i = 0; i < scrollSteps; i++) {
      // Random scroll amount
      const scrollAmount = Math.floor(Math.random() * 300) + 100;
      
      // Perform the scroll
      scrollableElement.scrollBy(0, scrollAmount);
      
      // Pause to simulate reading
      await randomTiming.naturalPause();
      
      // Sometimes pause longer as if something interesting was found
      if (pauseOnInterestingContent && Math.random() < 0.3) {
        await randomTiming.longConsideration();
      }
      
      // Random chance to get distracted while scrolling
      if (Math.random() < cognitiveState.distractionProbability) {
        await randomTiming.distractionPause();
      }
    }
  }
};

// Export all simulation utilities
export default humanSimulation;
