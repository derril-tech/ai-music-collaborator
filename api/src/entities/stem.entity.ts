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

@Entity('stems', { schema: 'storage' })
export class Stem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  s3_wav_key: string;

  @Column({ type: 'int', default: 44100 })
  sample_rate: number;

  @Column({ type: 'int', default: 24 })
  bit_depth: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  duration_seconds: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.stems)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
