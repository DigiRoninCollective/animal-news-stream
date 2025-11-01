-- Animal News Stream Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Create articles table to store fetched news articles
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  url TEXT UNIQUE NOT NULL,
  image_url TEXT,
  source_name TEXT,
  author TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on published_at for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- Enable Row Level Security (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON articles
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated insert (for backend service)
CREATE POLICY "Allow authenticated insert" ON articles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated update
CREATE POLICY "Allow authenticated update" ON articles
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function on update
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create saved_articles table for user bookmarks (optional future feature)
CREATE TABLE IF NOT EXISTS saved_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Enable RLS on saved_articles
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;

-- Create policy for saved_articles - users can only see their own
CREATE POLICY "Users can view their own saved articles" ON saved_articles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved articles" ON saved_articles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved articles" ON saved_articles
  FOR DELETE
  USING (auth.uid() = user_id);
