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
import { Lyrics } from './lyrics.entity';

@Entity('sections', { schema: 'music' })
export class Section {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // verse, chorus, bridge, intro, outro

  @Column({ type: 'int' })
  order_index: number;

  @Column({ type: 'int', nullable: true })
  bars: number;

  @Column({ type: 'uuid', nullable: true })
  lyrics_id: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.sections)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Lyrics)
  @JoinColumn({ name: 'lyrics_id' })
  lyrics: Lyrics;
}
