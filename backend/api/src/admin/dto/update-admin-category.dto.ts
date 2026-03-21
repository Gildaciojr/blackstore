import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminCategoryDto } from './create-admin-category.dto';

export class UpdateAdminCategoryDto extends PartialType(CreateAdminCategoryDto) {}
