import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rights } from '../../entities/rights.entity';
import { Preset } from '../../entities/preset.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { RightsDto, ContentPolicyDto, VersionDto, AuditLogDto, LicenseType, ContentPolicy } from './dto/governance.dto';

@Injectable()
export class GovernanceService {
  constructor(
    @InjectRepository(Rights)
    private rightsRepository: Repository<Rights>,
    @InjectRepository(Preset)
    private presetRepository: Repository<Preset>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  // Rights Registry
  async createRights(projectId: string, rightsDto: RightsDto): Promise<Rights> {
    const rights = this.rightsRepository.create({
      projectId,
      license: rightsDto.license,
      attribution: rightsDto.attribution,
      usage: rightsDto.usage,
      sampleUsage: rightsDto.sampleUsage,
      pluginUsage: rightsDto.pluginUsage,
    });

    const savedRights = await this.rightsRepository.save(rights);
    
    // Log the action
    await this.logAuditEvent({
      action: 'rights_created',
      resourceType: 'rights',
      resourceId: savedRights.id,
      userId: 'system', // Would come from auth context
      metadata: { projectId, license: rightsDto.license },
    });

    return savedRights;
  }

  async getRights(projectId: string): Promise<Rights> {
    const rights = await this.rightsRepository.findOne({ where: { projectId } });
    if (!rights) {
      throw new NotFoundException('Rights not found for project');
    }
    return rights;
  }

  async updateRights(projectId: string, rightsDto: RightsDto): Promise<Rights> {
    const rights = await this.getRights(projectId);
    
    Object.assign(rights, rightsDto);
    const updatedRights = await this.rightsRepository.save(rights);
    
    await this.logAuditEvent({
      action: 'rights_updated',
      resourceType: 'rights',
      resourceId: rights.id,
      userId: 'system',
      metadata: { projectId, license: rightsDto.license },
    });

    return updatedRights;
  }

  // Content Policy
  async validateContent(content: string, policy: ContentPolicyDto): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (policy.filterExplicit) {
      const explicitKeywords = ['explicit', 'inappropriate', 'offensive'];
      const hasExplicit = explicitKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );
      if (hasExplicit) {
        issues.push('Content contains explicit language');
      }
    }

    if (policy.filterHateful) {
      const hatefulKeywords = ['hate', 'discrimination', 'bigotry'];
      const hasHateful = hatefulKeywords.some(keyword => 
        content.toLowerCase().includes(keyword)
      );
      if (hasHateful) {
        issues.push('Content contains potentially hateful language');
      }
    }

    if (policy.customKeywords && policy.customKeywords.length > 0) {
      const hasCustom = policy.customKeywords.some(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      );
      if (hasCustom) {
        issues.push('Content contains custom filtered keywords');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  async enforceContentPolicy(content: string, policyLevel: ContentPolicy): Promise<boolean> {
    const policy: ContentPolicyDto = {
      level: policyLevel,
      filterExplicit: policyLevel === ContentPolicy.STRICT || policyLevel === ContentPolicy.MODERATE,
      filterHateful: policyLevel === ContentPolicy.STRICT,
      styleDescriptorsOnly: policyLevel === ContentPolicy.STRICT,
    };

    const validation = await this.validateContent(content, policy);
    return validation.valid;
  }

  // Versioning
  async createVersion(projectId: string, versionDto: VersionDto): Promise<any> {
    // Create immutable version
    const version = {
      id: `v${Date.now()}`,
      projectId,
      version: versionDto.version,
      description: versionDto.description,
      immutable: versionDto.immutable ?? true,
      parentVersionId: versionDto.parentVersionId,
      createdAt: new Date(),
    };

    // Log version creation
    await this.logAuditEvent({
      action: 'version_created',
      resourceType: 'version',
      resourceId: version.id,
      userId: 'system',
      metadata: { projectId, version: versionDto.version },
    });

    return version;
  }

  async getVersionHistory(projectId: string): Promise<any[]> {
    // Mock version history
    return [
      {
        id: 'v1',
        version: '1.0.0',
        description: 'Initial version',
        createdAt: new Date('2024-01-01'),
        immutable: true,
      },
      {
        id: 'v2',
        version: '1.1.0',
        description: 'Added harmony generation',
        createdAt: new Date('2024-01-15'),
        immutable: true,
        parentVersionId: 'v1',
      },
    ];
  }

  // Audit Logging
  async logAuditEvent(auditLogDto: AuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      action: auditLogDto.action,
      resourceType: auditLogDto.resourceType,
      resourceId: auditLogDto.resourceId,
      userId: auditLogDto.userId,
      metadata: auditLogDto.metadata,
      timestamp: new Date(),
    });

    return await this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(
    resourceType?: string,
    resourceId?: string,
    userId?: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const query = this.auditLogRepository.createQueryBuilder('audit_log');

    if (resourceType) {
      query.andWhere('audit_log.resourceType = :resourceType', { resourceType });
    }

    if (resourceId) {
      query.andWhere('audit_log.resourceId = :resourceId', { resourceId });
    }

    if (userId) {
      query.andWhere('audit_log.userId = :userId', { userId });
    }

    query.orderBy('audit_log.timestamp', 'DESC');
    query.skip(offset).take(limit);

    const [logs, total] = await query.getManyAndCount();

    return { logs, total };
  }

  // Provenance
  async generateProvenance(projectId: string): Promise<any> {
    const rights = await this.getRights(projectId);
    const auditLogs = await this.getAuditLogs('project', projectId);

    return {
      projectId,
      generatedAt: new Date().toISOString(),
      rights: {
        license: rights.license,
        attribution: rights.attribution,
        usage: rights.usage,
      },
      models: {
        melody_gen: 'v1.0.0',
        harmony_gen: 'v1.0.0',
        rhythm_gen: 'v1.0.0',
        synthesis: 'v1.0.0',
      },
      samples: [],
      plugins: [],
      generationHistory: auditLogs.logs.map(log => ({
        action: log.action,
        timestamp: log.timestamp,
        metadata: log.metadata,
      })),
    };
  }

  // Policy Management
  async getDefaultContentPolicy(): Promise<ContentPolicyDto> {
    return {
      level: ContentPolicy.MODERATE,
      filterExplicit: true,
      filterHateful: true,
      styleDescriptorsOnly: false,
      customKeywords: [],
    };
  }

  async getDefaultRights(): Promise<RightsDto> {
    return {
      license: LicenseType.CC_BY_NC,
      attribution: 'Generated with AI Music Collaborator',
      usage: 'Non-commercial use only',
      sampleUsage: [],
      pluginUsage: [],
    };
  }
}
