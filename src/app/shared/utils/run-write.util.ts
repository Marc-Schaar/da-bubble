/**
 * Runs a Firestore write, logging a German error message and rethrowing on
 * failure — keeps error handling consistent across the Firebase API services
 * instead of each method rolling its own try/catch (or none at all).
 */
export async function runWrite<T>(operation: () => Promise<T>, errorMessage: string): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
}
