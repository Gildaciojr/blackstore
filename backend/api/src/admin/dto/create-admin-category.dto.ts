import { IsString } from 'class-validator';

export class CreateAdminCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;
}
