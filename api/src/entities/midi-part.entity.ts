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

@Entity('midi_parts', { schema: 'music' })
export class MidiPart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'uuid', nullable: true })
  section_id: string;

  @Column({ type: 'varchar', length: 50 })
  role: string; // melody, bass, drums, harmony

  @Column({ type: 'varchar', length: 500, nullable: true })
  s3_midi_key: string;

  @Column({ type: 'int', nullable: true })
  range_low: number;

  @Column({ type: 'int', nullable: true })
  range_high: number;

  @Column({ type: 'int', default: 1 })
  version: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Project, (project) => project.midi_parts)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;
}
