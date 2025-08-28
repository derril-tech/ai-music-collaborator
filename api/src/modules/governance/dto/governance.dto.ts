import { IsString, IsOptional, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LicenseType {
  CC_BY = 'CC-BY',
  CC_BY_NC = 'CC-BY-NC',
  CC_BY_SA = 'CC-BY-SA',
  CC_BY_ND = 'CC-BY-ND',
  ALL_RIGHTS_RESERVED = 'ALL_RIGHTS_RESERVED',
  PUBLIC_DOMAIN = 'PUBLIC_DOMAIN',
}

export enum ContentPolicy {
  STRICT = 'strict',
  MODERATE = 'moderate',
  PERMISSIVE = 'permissive',
}

export class RightsDto {
  @ApiProperty({ description: 'License type', enum: LicenseType })
  @IsEnum(LicenseType)
  license: LicenseType;

  @ApiProperty({ description: 'Attribution text' })
  @IsString()
  @IsOptional()
  attribution?: string;

  @ApiProperty({ description: 'Usage restrictions' })
  @IsString()
  @IsOptional()
  usage?: string;

  @ApiProperty({ description: 'Sample usage notes' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sampleUsage?: string[];

  @ApiProperty({ description: 'Plugin usage notes' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  pluginUsage?: string[];
}

export class ContentPolicyDto {
  @ApiProperty({ description: 'Policy level', enum: ContentPolicy })
  @IsEnum(ContentPolicy)
  level: ContentPolicy;

  @ApiProperty({ description: 'Filter explicit content', default: true })
  @IsBoolean()
  @IsOptional()
  filterExplicit?: boolean = true;

  @ApiProperty({ description: 'Filter hateful content', default: true })
  @IsBoolean()
  @IsOptional()
  filterHateful?: boolean = true;

  @ApiProperty({ description: 'Allow style descriptors only', default: false })
  @IsBoolean()
  @IsOptional()
  styleDescriptorsOnly?: boolean = false;

  @ApiProperty({ description: 'Custom filter keywords' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customKeywords?: string[];
}

export class VersionDto {
  @ApiProperty({ description: 'Version number' })
  @IsString()
  version: string;

  @ApiProperty({ description: 'Version description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Is this version immutable' })
  @IsBoolean()
  @IsOptional()
  immutable?: boolean = true;

  @ApiProperty({ description: 'Parent version ID' })
  @IsString()
  @IsOptional()
  parentVersionId?: string;
}

export class AuditLogDto {
  @ApiProperty({ description: 'Action performed' })
  @IsString()
  action: string;

  @ApiProperty({ description: 'Resource type' })
  @IsString()
  resourceType: string;

  @ApiProperty({ description: 'Resource ID' })
  @IsString()
  resourceId: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: any;
}
