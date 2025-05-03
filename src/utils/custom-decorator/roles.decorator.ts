import { SetMetadata } from '@nestjs/common';
import { RoleType } from 'src/types/role';

export const Roles = (...roles: RoleType[]) => SetMetadata('roles', roles);
