-- Create journal_prompts table
CREATE TABLE journal_prompt (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entries table
CREATE TABLE journal_entry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content_json JSONB NOT NULL, -- Store DraftJS content state
    content_text TEXT, -- Plain text version for search
    prompt_id UUID REFERENCES journal_prompt(id) ON DELETE SET NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    tags TEXT[],
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE journal_prompt ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry ENABLE ROW LEVEL SECURITY;

-- Journal prompts are readable by all authenticated users
CREATE POLICY "journal_prompts_select" ON journal_prompt
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Journal entries are only accessible by their owner
CREATE POLICY "journal_entries_select" ON journal_entry
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "journal_entries_insert" ON journal_entry
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_entries_update" ON journal_entry
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "journal_entries_delete" ON journal_entry
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Add some default prompts
INSERT INTO journal_prompt (prompt, category) VALUES
    ('What are three things you''re grateful for today?', 'gratitude'),
    ('How are you feeling right now, and what might be contributing to that feeling?', 'emotions'),
    ('What challenge did you face today, and how did you handle it?', 'reflection'),
    ('Describe a moment today that brought you joy or peace.', 'positive'),
    ('What''s one thing you learned about yourself recently?', 'self-discovery'),
    ('What would you like to focus on or improve in the coming week?', 'goals'),
    ('Write about someone who has made a positive impact on your life.', 'relationships'),
    ('What are you looking forward to?', 'future'),
    ('How did you take care of yourself today?', 'self-care'),
    ('What''s been on your mind lately?', 'thoughts'),
    ('Describe your perfect day in detail.', 'dreams'),
    ('What advice would you give to someone going through a similar situation as you?', 'wisdom'),
    ('What are you proud of accomplishing recently?', 'achievements'),
    ('How have you grown or changed in the past year?', 'growth'),
    ('What makes you feel most like yourself?', 'identity');

-- Create indexes for better performance
CREATE INDEX idx_journal_entries_user_id ON journal_entry(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entry(created_at DESC);
CREATE INDEX idx_journal_entries_tags ON journal_entry USING GIN(tags);
CREATE INDEX idx_journal_prompts_category ON journal_prompt(category);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entry
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_prompts_updated_at BEFORE UPDATE ON journal_prompt
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
