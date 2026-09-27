export class CardUtils {
  /**
   * Generates a 16-digit card number given a 6-digit productId.
   * Format: 6 digits of productId + 10 random digits.
   */
  static generateCardNumber(productId: string): string {
    if (!/^\d{6}$/.test(productId)) {
      throw new Error('El productId debe ser exactamente de 6 dígitos numéricos.');
    }
    let randomPart = '';
    for (let i = 0; i < 10; i++) {
      randomPart += Math.floor(Math.random() * 10).toString();
    }
    return `${productId}${randomPart}`;
  }

  /**
   * Generates expiration date in MM/YYYY format, exactly 3 years from the given date (default: now).
   */
  static generateExpirationDate(fromDate: Date = new Date()): string {
    const month = String(fromDate.getMonth() + 1).padStart(2, '0');
    const year = fromDate.getFullYear() + 3;
    return `${month}/${year}`;
  }

  /**
   * Generates a 6-digit numeric transaction identifier (e.g. "102030").
   */
  static generateTransactionId(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Checks whether a card expiration date (MM/YYYY) is valid at the reference date (default: now).
   * The card is valid until the last day of the expiration month.
   */
  static isCardNotExpired(expirationDate: string, currentDate: Date = new Date()): boolean {
    const parts = expirationDate.split('/');
    if (parts.length !== 2) return false;

    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return false;

    // Last second of the expiration month
    const expirationLimit = new Date(year, month, 0, 23, 59, 59, 999);
    return currentDate <= expirationLimit;
  }

  /**
   * Checks whether a transaction occurred within the last 24 hours.
   */
  static isWithin24Hours(transactionDate: Date, currentDate: Date = new Date()): boolean {
    const diffMs = currentDate.getTime() - transactionDate.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 24;
  }
}
