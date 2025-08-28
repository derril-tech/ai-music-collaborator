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

@Entity('rights', { schema: 'music' })
export class Rights {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  license_type: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  license_url: string;

  @Column({ type: 'jsonb', nullable: true })
  sample_usage: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.rights)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
