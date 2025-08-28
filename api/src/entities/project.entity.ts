import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Lyrics } from './lyrics.entity';
import { Section } from './section.entity';
import { MidiPart } from './midi-part.entity';
import { Chord } from './chord.entity';
import { Stem } from './stem.entity';
import { Mix } from './mix.entity';
import { Rights } from './rights.entity';
import { Export } from './export.entity';

@Entity('projects', { schema: 'music' })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organization_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  genre: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  key: string;

  @Column({ type: 'int', nullable: true })
  tempo: number;

  @Column({ type: 'varchar', length: 10, default: '4/4' })
  time_signature: string;

  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Organization, (organization) => organization.projects)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => Lyrics, (lyrics) => lyrics.project)
  lyrics: Lyrics[];

  @OneToMany(() => Section, (section) => section.project)
  sections: Section[];

  @OneToMany(() => MidiPart, (midiPart) => midiPart.project)
  midi_parts: MidiPart[];

  @OneToMany(() => Chord, (chord) => chord.project)
  chords: Chord[];

  @OneToMany(() => Stem, (stem) => stem.project)
  stems: Stem[];

  @OneToMany(() => Mix, (mix) => mix.project)
  mixes: Mix[];

  @OneToMany(() => Rights, (rights) => rights.project)
  rights: Rights[];

  @OneToMany(() => Export, (export_) => export_.project)
  exports: Export[];
}
