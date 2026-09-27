import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
import { UserRole } from './roles.enum';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new ApiKeyGuard(reflector);

    process.env.SECURITY_ENABLED = 'true';
    process.env.API_KEY_ADMIN = 'admin-bank-key-123';
    process.env.API_KEY_CLIENT = 'client-app-key-789';
    process.env.API_KEY_MERCHANT = 'merchant-pos-key-456';
  });

  const createMockContext = (headers: Record<string, string>): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ headers, userRole: null }),
      }),
    } as unknown as ExecutionContext;
  };

  it('debe permitir acceso si el endpoint no tiene roles requeridos (público)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    const context = createMockContext({});
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe permitir acceso si SECURITY_ENABLED es "false"', () => {
    process.env.SECURITY_ENABLED = 'false';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext({});
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar UnauthorizedException si no se proporciona el header x-api-key', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext({});
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('debe lanzar UnauthorizedException si la x-api-key es inválida', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);

    const context = createMockContext({ 'x-api-key': 'clave-falsa-invalida' });
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('debe permitir acceso si se presenta la llave ADMIN para cualquier rol', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.CLIENT]);

    const context = createMockContext({ 'x-api-key': 'admin-bank-key-123' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe permitir acceso a CLIENT si el rol requerido incluye CLIENT', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.CLIENT]);

    const context = createMockContext({ 'x-api-key': 'client-app-key-789' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('debe lanzar ForbiddenException si CLIENT intenta acceder a un endpoint exclusivo de MERCHANT', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MERCHANT]);

    const context = createMockContext({ 'x-api-key': 'client-app-key-789' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('debe permitir acceso a MERCHANT si el rol requerido incluye MERCHANT', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.MERCHANT]);

    const context = createMockContext({ 'x-api-key': 'merchant-pos-key-456' });
    expect(guard.canActivate(context)).toBe(true);
  });
});
