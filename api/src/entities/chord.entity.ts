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
import { Section } from './section.entity';

@Entity('chords', { schema: 'music' })
export class Chord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'uuid', nullable: true })
  section_id: string;

  @Column({ type: 'jsonb' })
  progression: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  numerals: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  voicings: Record<string, any>;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.chords)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;
}
