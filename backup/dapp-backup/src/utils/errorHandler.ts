export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  console.error('Unknown error:', error);
  return 'An unknown error occurred. Please try again.';
};