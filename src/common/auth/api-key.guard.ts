import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from './roles.enum';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, endpoint is public
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Allow bypassing security if explicitly disabled in environment
    if (process.env.SECURITY_ENABLED === 'false') {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException(
        'Header "x-api-key" obligatorio para autenticación de canal bancario',
      );
    }

    const adminKey = process.env.API_KEY_ADMIN || 'admin-bank-key-123';
    const clientKey = process.env.API_KEY_CLIENT || 'client-app-key-789';
    const merchantKey = process.env.API_KEY_MERCHANT || 'merchant-pos-key-456';

    let userRole: UserRole | null = null;
    if (apiKey === adminKey) {
      userRole = UserRole.ADMIN;
    } else if (apiKey === clientKey) {
      userRole = UserRole.CLIENT;
    } else if (apiKey === merchantKey) {
      userRole = UserRole.MERCHANT;
    }

    if (!userRole) {
      throw new UnauthorizedException('API Key inválida o no reconocida por el sistema');
    }

    request.userRole = userRole;

    // Regla de negocio: ADMIN puede realizar TODO
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    // Validar si el rol del canal tiene permiso para la operación
    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere credencial de rol [${requiredRoles.join(' o ')}] pero se presentó canal [${userRole}]`,
      );
    }

    return true;
  }
}
