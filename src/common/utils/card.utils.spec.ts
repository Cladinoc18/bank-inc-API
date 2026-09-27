import { CardUtils } from './card.utils';

describe('CardUtils', () => {
  describe('generateCardNumber', () => {
    it('debe generar un número de tarjeta de 16 dígitos que empiece con el productId', () => {
      const productId = '123456';
      const cardNumber = CardUtils.generateCardNumber(productId);

      expect(cardNumber).toHaveLength(16);
      expect(cardNumber.startsWith(productId)).toBe(true);
      expect(/^\d{16}$/.test(cardNumber)).toBe(true);
    });

    it('debe lanzar error si el productId no tiene exactamente 6 dígitos numéricos', () => {
      expect(() => CardUtils.generateCardNumber('123')).toThrow(
        'El productId debe ser exactamente de 6 dígitos numéricos.',
      );
      expect(() => CardUtils.generateCardNumber('abcdef')).toThrow(
        'El productId debe ser exactamente de 6 dígitos numéricos.',
      );
    });
  });

  describe('generateExpirationDate', () => {
    it('debe generar una fecha en formato MM/YYYY exactamente 3 años posterior', () => {
      const fixedDate = new Date(2026, 8, 27); // Septiembre 2026
      const expDate = CardUtils.generateExpirationDate(fixedDate);

      expect(expDate).toBe('09/2029');
    });
  });

  describe('generateTransactionId', () => {
    it('debe generar un ID de transacción de 6 dígitos', () => {
      const txId = CardUtils.generateTransactionId();
      expect(txId).toHaveLength(6);
      expect(/^\d{6}$/.test(txId)).toBe(true);
    });
  });

  describe('isCardNotExpired', () => {
    it('debe retornar true si la fecha actual está dentro del mes de vencimiento o antes', () => {
      const currentDate = new Date(2026, 8, 15); // Sep 15, 2026
      expect(CardUtils.isCardNotExpired('09/2026', currentDate)).toBe(true);
      expect(CardUtils.isCardNotExpired('10/2026', currentDate)).toBe(true);
      expect(CardUtils.isCardNotExpired('01/2029', currentDate)).toBe(true);
    });

    it('debe retornar false si la tarjeta ya venció', () => {
      const currentDate = new Date(2026, 9, 1); // Oct 1, 2026
      expect(CardUtils.isCardNotExpired('09/2026', currentDate)).toBe(false);
    });

    it('debe retornar false si el formato de fecha es inválido', () => {
      expect(CardUtils.isCardNotExpired('invalido')).toBe(false);
      expect(CardUtils.isCardNotExpired('13/2026')).toBe(false);
    });
  });

  describe('isWithin24Hours', () => {
    it('debe retornar true si han pasado menos de 24 horas', () => {
      const now = new Date('2026-09-27T12:00:00Z');
      const txTime = new Date('2026-09-27T02:00:00Z'); // 10 horas antes
      expect(CardUtils.isWithin24Hours(txTime, now)).toBe(true);
    });

    it('debe retornar true si la transacción fue exactamente hace 24 horas', () => {
      const now = new Date('2026-09-27T12:00:00Z');
      const txTime = new Date('2026-09-26T12:00:00Z'); // 24 horas antes
      expect(CardUtils.isWithin24Hours(txTime, now)).toBe(true);
    });

    it('debe retornar false si han pasado más de 24 horas', () => {
      const now = new Date('2026-09-27T12:00:00Z');
      const txTime = new Date('2026-09-26T11:59:59Z'); // 24h y 1s antes
      expect(CardUtils.isWithin24Hours(txTime, now)).toBe(false);
    });
  });
});
