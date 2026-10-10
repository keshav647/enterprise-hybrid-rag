-- PostgreSQL pgvector Initialization Schema
-- Enables pgvector extension, creates chunk tables, and builds HNSW index.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Documents master table
CREATE TABLE IF NOT EXISTS documents (
    document_id VARCHAR(128) PRIMARY KEY,
    title TEXT NOT NULL,
    file_path TEXT,
    document_type VARCHAR(64) DEFAULT 'markdown',
    tags TEXT[] DEFAULT '{}',
    total_pages INTEGER DEFAULT 1,
    total_chunks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Layout-aware contextual chunks table with pgvector column
CREATE TABLE IF NOT EXISTS document_chunks (
    chunk_id VARCHAR(128) PRIMARY KEY,
    document_id VARCHAR(128) REFERENCES documents(document_id) ON DELETE CASCADE,
    document_title TEXT NOT NULL,
    section_title TEXT NOT NULL,
    page_number INTEGER,
    content TEXT NOT NULL,
    token_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Full-Text Search tsvector column for native PostgreSQL hybrid queries
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS content_tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- High-performance HNSW index for sub-10ms approximate nearest neighbor (ANN) vector search
CREATE INDEX IF NOT EXISTS idx_chunks_hnsw_cosine
    ON document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- GIN index for full-text search keyword acceleration
CREATE INDEX IF NOT EXISTS idx_chunks_tsv
    ON document_chunks
    USING gin (content_tsv);

-- B-Tree indexes for fast foreign keys and metadata filtering
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_page_number ON document_chunks(page_number);
