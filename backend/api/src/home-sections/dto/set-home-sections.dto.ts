import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { HomeSectionType, HeroSlideType } from '@prisma/client';

export class SetHomeSectionItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  position: number;

  // HERO ONLY
  @IsOptional()
  @IsEnum(HeroSlideType)
  heroSlideType?: HeroSlideType;

  @IsOptional()
  @IsString()
  imageOverride?: string;

  @IsOptional()
  @IsString()
  focus?: string;

  @IsOptional()
  @IsString()
  focusDesktop?: string;

  @IsOptional()
  @IsString()
  title1?: string;

  @IsOptional()
  @IsString()
  title2?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  cta1?: string;

  @IsOptional()
  @IsString()
  cta2?: string;
}

export class SetHomeSectionsDto {
  @IsEnum(HomeSectionType)
  type: HomeSectionType;

  @IsArray()
  items: SetHomeSectionItemDto[];
}
