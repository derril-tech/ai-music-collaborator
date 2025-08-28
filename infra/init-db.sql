-- AI Music Collaborator Database Initialization
-- This script creates the initial database schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS music;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS audit;

-- Organizations and Users
CREATE TABLE IF NOT EXISTS auth.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES auth.organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS music.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES auth.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    key VARCHAR(10),
    tempo INTEGER,
    time_signature VARCHAR(10) DEFAULT '4/4',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lyrics
CREATE TABLE IF NOT EXISTS music.lyrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES music.projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    meter JSONB,
    rhyme_scheme JSONB,
    stress_pattern JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sections (Verse, Chorus, Bridge, etc.)
CREATE TABLE IF NOT EXISTS music.sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES music.projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- verse, chorus, bridge, intro, outro
    order_index INTEGER NOT NULL,
    bars INTEGER,
    lyrics_id UUID REFERENCES music.lyrics(id),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- MIDI Parts
CREATE TABLE IF NOT EXISTS music.midi_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES music.projects(id) ON DELETE CASCADE,
    section_id UUID REFERENCES music.sections(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- melody, bass, drums, harmony
    s3_midi_key VARCHAR(500),
    range_low INTEGER,
    range_high INTEGER,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chords
CREATE TABLE IF NOT EXISTS music.chords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES music.projects(id) ON DELETE CASCADE,
    section_id UUID REFERENCES music.sections(id) ON DELETE CASCADE,
    progression JSONB NOT NULL,
    numerals JSONB,
    voicings JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio Stems
CREATE TABLE IF NOT EXISTS storage.stems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES music.projects(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    s3_wav_key VARCHAR(500),
    sample_rate INTEGER DEFAULT 44100,
    bit_depth INTEGER DEFAULT 24,
    duration_seconds DECIMAL(10,3),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mixes
CREATE TABLE IF NOT EXISTS storage.mixes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES music.projects(id) ON DELETE CASCADE,
    s3_wav_key VARCHAR(500),
    lufs DECIMAL(5,2),
    true_peak DECIMAL(5,2),
    preset_name VARCHAR(100),
    settings JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presets
CREATE TABLE IF NOT EXISTS music.presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES auth.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- genre, mix, master
    payload JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rights and Licensing
CREATE TABLE IF NOT EXISTS music.rights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES music.projects(id) ON DELETE CASCADE,
    license_type VARCHAR(100),
    license_url VARCHAR(500),
    sample_usage JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exports
CREATE TABLE IF NOT EXISTS storage.exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES music.projects(id) ON DELETE CASCADE,
    kind VARCHAR(50) NOT NULL, -- stems, mix, midi, charts, bundle
    s3_key VARCHAR(500),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES auth.organizations(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON music.projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_lyrics_project_id ON music.lyrics(project_id);
CREATE INDEX IF NOT EXISTS idx_sections_project_id ON music.sections(project_id);
CREATE INDEX IF NOT EXISTS idx_midi_parts_project_id ON music.midi_parts(project_id);
CREATE INDEX IF NOT EXISTS idx_chords_project_id ON music.chords(project_id);
CREATE INDEX IF NOT EXISTS idx_stems_project_id ON storage.stems(project_id);
CREATE INDEX IF NOT EXISTS idx_mixes_project_id ON storage.mixes(project_id);
CREATE INDEX IF NOT EXISTS idx_exports_project_id ON storage.exports(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit.logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit.logs(created_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_projects_name_fts ON music.projects USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_lyrics_text_fts ON music.lyrics USING gin(to_tsvector('english', text));

-- Row Level Security (RLS) policies
ALTER TABLE auth.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE music.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE music.lyrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE music.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE music.midi_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE music.chords ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.stems ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE music.presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE music.rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic implementation)
-- Organizations: users can only see their own organization
CREATE POLICY org_policy ON auth.organizations
    FOR ALL USING (id = current_setting('app.current_organization_id')::UUID);

-- Projects: users can only see projects in their organization
CREATE POLICY project_policy ON music.projects
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Users: users can only see users in their organization
CREATE POLICY user_policy ON auth.users
    FOR ALL USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Update triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON auth.organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON music.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lyrics_updated_at BEFORE UPDATE ON music.lyrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sections_updated_at BEFORE UPDATE ON music.sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_midi_parts_updated_at BEFORE UPDATE ON music.midi_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chords_updated_at BEFORE UPDATE ON music.chords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stems_updated_at BEFORE UPDATE ON storage.stems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mixes_updated_at BEFORE UPDATE ON storage.mixes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_presets_updated_at BEFORE UPDATE ON music.presets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rights_updated_at BEFORE UPDATE ON music.rights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
