/**
 * Error shape shared by mock API functions and form pages.
 */
export class AppError extends Error {
  /**
   * @param {{ code: string, message: string, fieldErrors?: Record<string, string> }} options Error details.
   */
  constructor({ code, message, fieldErrors }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
