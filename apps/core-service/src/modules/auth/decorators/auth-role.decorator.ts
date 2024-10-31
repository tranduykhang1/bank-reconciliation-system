import { SetMetadata } from '@nestjs/common';
import { USER_ROLE } from '../../../common/enums/user.enum';

export const ROLES_KEY = Symbol('role');
export const AuthRoles = (...roles: USER_ROLE[]) =>
	SetMetadata(ROLES_KEY, roles);
