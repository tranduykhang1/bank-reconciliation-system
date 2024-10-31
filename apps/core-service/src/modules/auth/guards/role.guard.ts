import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { USER_ROLE } from '../../../common/enums/user.enum';
import { ROLES_KEY } from '../decorators/auth-role.decorator';
import { JwtPayload } from '../login.interface';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<USER_ROLE[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);
		if (!requiredRoles) {
			return true;
		}
		const req = context.switchToHttp().getRequest();
		const user = req.user as JwtPayload;
		return requiredRoles.includes(user.role);
	}
}
