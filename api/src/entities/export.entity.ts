import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity('exports', { schema: 'storage' })
export class Export {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'varchar', length: 50 })
  kind: string; // stems, mix, midi, charts, bundle

  @Column({ type: 'varchar', length: 500, nullable: true })
  s3_key: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.exports)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
