import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities/project.entity';
import { Stem } from '../../entities/stem.entity';
import { Mix } from '../../entities/mix.entity';
import { Export } from '../../entities/export.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { VersionDto } from '../governance/dto/governance.dto';
import * as crypto from 'crypto';

export interface AudioArtifact {
  id: string;
  type: 'stem' | 'mix' | 'export';
  filePath: string;
  hash: string;
  metadata: {
    format: string;
    sampleRate: number;
    bitDepth: number;
    duration: number;
    channels: number;
    size: number;
  };
  createdAt: Date;
  version: string;
  immutable: boolean;
}

export interface VersionInfo {
  id: string;
  projectId: string;
  version: string;
  name: string;
  description: string;
  artifacts: AudioArtifact[];
  changes: string[];
  createdAt: Date;
  createdBy: string;
  parentVersion?: string;
  branch?: string;
  tags: string[];
}

export interface AuditEntry {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class VersioningService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(Stem)
    private stemRepository: Repository<Stem>,
    @InjectRepository(Mix)
    private mixRepository: Repository<Mix>,
    @InjectRepository(Export)
    private exportRepository: Repository<Export>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Create a new version of a project
   */
  async createVersion(
    projectId: string,
    versionDto: VersionDto,
    userId: string
  ): Promise<VersionInfo> {
    // Get current project state
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['stems', 'mixes', 'exports']
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Generate version hash
    const versionHash = this.generateVersionHash(project);
    const version = `v${Date.now()}-${versionHash.substring(0, 8)}`;

    // Create immutable audio artifacts
    const artifacts: AudioArtifact[] = [];

    // Process stems
    if (project.stems) {
      for (const stem of project.stems) {
        const artifact = await this.createImmutableArtifact(
          'stem',
          stem.filePath,
          stem.id,
          version
        );
        artifacts.push(artifact);
      }
    }

    // Process mixes
    if (project.mixes) {
      for (const mix of project.mixes) {
        const artifact = await this.createImmutableArtifact(
          'mix',
          mix.filePath,
          mix.id,
          version
        );
        artifacts.push(artifact);
      }
    }

    // Process exports
    if (project.exports) {
      for (const export_ of project.exports) {
        const artifact = await this.createImmutableArtifact(
          'export',
          export_.filePath,
          export_.id,
          version
        );
        artifacts.push(artifact);
      }
    }

    // Create version info
    const versionInfo: VersionInfo = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      version,
      name: versionDto.name,
      description: versionDto.description,
      artifacts,
      changes: versionDto.changes || [],
      createdAt: new Date(),
      createdBy: userId,
      parentVersion: versionDto.parentVersion,
      branch: versionDto.branch || 'main',
      tags: versionDto.tags || []
    };

    // Log audit entry
    await this.logAuditEvent({
      projectId,
      userId,
      action: 'CREATE_VERSION',
      resource: 'VERSION',
      resourceId: versionInfo.id,
      metadata: {
        version,
        name: versionDto.name,
        artifactCount: artifacts.length
      }
    });

    return versionInfo;
  }

  /**
   * Get version history for a project
   */
  async getVersionHistory(projectId: string): Promise<VersionInfo[]> {
    // In a real implementation, this would fetch from a versions table
    // For now, we'll return mock data
    return [
      {
        id: 'version_1',
        projectId,
        version: 'v1.0.0',
        name: 'Initial version',
        description: 'First complete version of the song',
        artifacts: [],
        changes: ['Added basic chord progression', 'Created melody line'],
        createdAt: new Date(Date.now() - 86400000),
        createdBy: 'user_1',
        branch: 'main',
        tags: ['initial', 'draft']
      },
      {
        id: 'version_2',
        projectId,
        version: 'v1.1.0',
        name: 'Reharmonized version',
        description: 'Added secondary dominants and extended harmonies',
        artifacts: [],
        changes: ['Added V/V chord', 'Extended harmonies to 9ths and 13ths'],
        createdAt: new Date(Date.now() - 3600000),
        createdBy: 'user_1',
        parentVersion: 'v1.0.0',
        branch: 'main',
        tags: ['reharmonized', 'jazz']
      }
    ];
  }

  /**
   * Get specific version details
   */
  async getVersion(projectId: string, version: string): Promise<VersionInfo | null> {
    const history = await this.getVersionHistory(projectId);
    return history.find(v => v.version === version) || null;
  }

  /**
   * Create immutable audio artifact
   */
  private async createImmutableArtifact(
    type: 'stem' | 'mix' | 'export',
    filePath: string,
    resourceId: string,
    version: string
  ): Promise<AudioArtifact> {
    // Generate content hash
    const hash = await this.generateFileHash(filePath);
    
    // Get file metadata
    const metadata = await this.getAudioMetadata(filePath);
    
    // Create immutable copy
    const immutablePath = await this.createImmutableCopy(filePath, version, hash);
    
    return {
      id: `${type}_${resourceId}_${version}`,
      type,
      filePath: immutablePath,
      hash,
      metadata,
      createdAt: new Date(),
      version,
      immutable: true
    };
  }

  /**
   * Generate version hash from project state
   */
  private generateVersionHash(project: any): string {
    const state = {
      id: project.id,
      title: project.title,
      key: project.key,
      tempo: project.tempo,
      stems: project.stems?.map((s: any) => s.id).sort(),
      mixes: project.mixes?.map((m: any) => m.id).sort(),
      exports: project.exports?.map((e: any) => e.id).sort(),
      updatedAt: project.updatedAt
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(state))
      .digest('hex');
  }

  /**
   * Generate file hash
   */
  private async generateFileHash(filePath: string): Promise<string> {
    // In a real implementation, this would read the file and generate a hash
    // For now, we'll generate a mock hash
    return crypto
      .createHash('sha256')
      .update(filePath + Date.now())
      .digest('hex');
  }

  /**
   * Get audio file metadata
   */
  private async getAudioMetadata(filePath: string): Promise<AudioArtifact['metadata']> {
    // In a real implementation, this would read the actual audio file
    // For now, return mock metadata
    return {
      format: 'wav',
      sampleRate: 44100,
      bitDepth: 24,
      duration: 180.5,
      channels: 2,
      size: 1024 * 1024 * 50 // 50MB
    };
  }

  /**
   * Create immutable copy of file
   */
  private async createImmutableCopy(
    filePath: string,
    version: string,
    hash: string
  ): Promise<string> {
    // In a real implementation, this would copy the file to an immutable storage location
    // For now, return a mock path
    const fileName = filePath.split('/').pop();
    return `/immutable/${version}/${hash}/${fileName}`;
  }

  /**
   * Log audit event
   */
  async logAuditEvent(auditData: {
    projectId: string;
    userId: string;
    action: string;
    resource: string;
    resourceId: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditEntry> {
    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId: auditData.projectId,
      userId: auditData.userId,
      action: auditData.action,
      resource: auditData.resource,
      resourceId: auditData.resourceId,
      metadata: auditData.metadata || {},
      timestamp: new Date(),
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent
    };

    // Save to audit log
    const auditLog = this.auditLogRepository.create({
      id: auditEntry.id,
      projectId: auditEntry.projectId,
      userId: auditEntry.userId,
      action: auditEntry.action,
      resource: auditEntry.resource,
      resourceId: auditEntry.resourceId,
      metadata: JSON.stringify(auditEntry.metadata),
      timestamp: auditEntry.timestamp,
      ipAddress: auditEntry.ipAddress,
      userAgent: auditEntry.userAgent
    });

    await this.auditLogRepository.save(auditLog);

    return auditEntry;
  }

  /**
   * Get audit logs for a project
   */
  async getAuditLogs(
    projectId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      action?: string;
      userId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ logs: AuditEntry[]; total: number }> {
    const query = this.auditLogRepository.createQueryBuilder('audit')
      .where('audit.projectId = :projectId', { projectId });

    if (options.startDate) {
      query.andWhere('audit.timestamp >= :startDate', { startDate: options.startDate });
    }

    if (options.endDate) {
      query.andWhere('audit.timestamp <= :endDate', { endDate: options.endDate });
    }

    if (options.action) {
      query.andWhere('audit.action = :action', { action: options.action });
    }

    if (options.userId) {
      query.andWhere('audit.userId = :userId', { userId: options.userId });
    }

    const total = await query.getCount();

    if (options.limit) {
      query.limit(options.limit);
    }

    if (options.offset) {
      query.offset(options.offset);
    }

    query.orderBy('audit.timestamp', 'DESC');

    const auditLogs = await query.getMany();

    const logs: AuditEntry[] = auditLogs.map(log => ({
      id: log.id,
      projectId: log.projectId,
      userId: log.userId,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      metadata: JSON.parse(log.metadata),
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent
    }));

    return { logs, total };
  }

  /**
   * Verify artifact integrity
   */
  async verifyArtifactIntegrity(artifact: AudioArtifact): Promise<boolean> {
    try {
      const currentHash = await this.generateFileHash(artifact.filePath);
      return currentHash === artifact.hash;
    } catch (error) {
      console.error('Error verifying artifact integrity:', error);
      return false;
    }
  }

  /**
   * Get artifact by hash
   */
  async getArtifactByHash(hash: string): Promise<AudioArtifact | null> {
    // In a real implementation, this would query a database
    // For now, return null
    return null;
  }

  /**
   * Create branch from version
   */
  async createBranch(
    projectId: string,
    baseVersion: string,
    branchName: string,
    userId: string
  ): Promise<VersionInfo> {
    const baseVersionInfo = await this.getVersion(projectId, baseVersion);
    if (!baseVersionInfo) {
      throw new Error('Base version not found');
    }

    // Create new version on the branch
    const versionDto: VersionDto = {
      name: `Branch: ${branchName}`,
      description: `Created branch ${branchName} from ${baseVersion}`,
      parentVersion: baseVersion,
      branch: branchName,
      changes: [`Created branch ${branchName}`],
      tags: ['branch']
    };

    return this.createVersion(projectId, versionDto, userId);
  }

  /**
   * Merge branch into main
   */
  async mergeBranch(
    projectId: string,
    branchName: string,
    userId: string
  ): Promise<VersionInfo> {
    // Get latest version from branch
    const history = await this.getVersionHistory(projectId);
    const branchVersions = history.filter(v => v.branch === branchName);
    const latestBranchVersion = branchVersions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (!latestBranchVersion) {
      throw new Error('No versions found on branch');
    }

    // Create merge version
    const versionDto: VersionDto = {
      name: `Merge: ${branchName} into main`,
      description: `Merged branch ${branchName} into main`,
      parentVersion: latestBranchVersion.version,
      branch: 'main',
      changes: [`Merged branch ${branchName}`, ...latestBranchVersion.changes],
      tags: ['merge', 'main']
    };

    return this.createVersion(projectId, versionDto, userId);
  }

  /**
   * Tag a version
   */
  async tagVersion(
    projectId: string,
    version: string,
    tag: string,
    userId: string
  ): Promise<void> {
    const versionInfo = await this.getVersion(projectId, version);
    if (!versionInfo) {
      throw new Error('Version not found');
    }

    if (!versionInfo.tags.includes(tag)) {
      versionInfo.tags.push(tag);
      
      // In a real implementation, this would update the database
      console.log(`Tagged version ${version} with ${tag}`);
    }

    // Log audit event
    await this.logAuditEvent({
      projectId,
      userId,
      action: 'TAG_VERSION',
      resource: 'VERSION',
      resourceId: versionInfo.id,
      metadata: { version, tag }
    });
  }
}
