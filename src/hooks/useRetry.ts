import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxAttemptsReached?: (error: Error) => void;
}

interface RetryState {
  isRetrying: boolean;
  attemptCount: number;
  lastError: Error | null;
}

export function useRetry(options: RetryOptions = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
    onMaxAttemptsReached
  } = options;

  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attemptCount: 0,
    lastError: null
  });

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
    return Math.min(delay, maxDelay);
  }, [baseDelay, backoffFactor, maxDelay]);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    shouldRetry?: (error: Error, attempt: number) => boolean
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setRetryState(prev => ({
          ...prev,
          isRetrying: attempt > 1,
          attemptCount: attempt
        }));

        const result = await operation();
        
        // Success - reset state
        setRetryState({
          isRetrying: false,
          attemptCount: 0,
          lastError: null
        });
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        setRetryState(prev => ({
          ...prev,
          lastError
        }));

        // Check if we should retry
        const shouldRetryDefault = (err: Error, att: number) => {
          // Default retry logic for network errors
          return (
            att < maxAttempts && (
              err.name === 'TypeError' && err.message.includes('fetch') ||
              err.message.includes('network') ||
              err.message.includes('timeout') ||
              err.message.includes('connection')
            )
          );
        };

        const willRetry = shouldRetry ? shouldRetry(lastError, attempt) : shouldRetryDefault(lastError, attempt);

        if (!willRetry || attempt === maxAttempts) {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false
          }));

          if (attempt === maxAttempts && onMaxAttemptsReached) {
            onMaxAttemptsReached(lastError);
          }
          
          throw lastError;
        }

        // Call retry callback
        if (onRetry) {
          onRetry(attempt, lastError);
        }

        // Wait before retrying
        const delay = calculateDelay(attempt);
        console.log(`🔄 Retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }, [maxAttempts, calculateDelay, onRetry, onMaxAttemptsReached]);

  const reset = useCallback(() => {
    setRetryState({
      isRetrying: false,
      attemptCount: 0,
      lastError: null
    });
  }, []);

  return {
    executeWithRetry,
    reset,
    ...retryState
  };
} 