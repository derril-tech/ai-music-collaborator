import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

@Entity('mixes', { schema: 'storage' })
export class Mix {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  s3_wav_key: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  lufs: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  true_peak: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  preset_name: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.mixes)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
