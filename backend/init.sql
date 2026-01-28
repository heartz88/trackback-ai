-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    bio TEXT,
    skills TEXT[], -- Array of skills like ['mixing', 'mastering', 'production']
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table (MUST BE CREATED BEFORE collaboration_requests)
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracks table (updated with musical_key column)
CREATE TABLE tracks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    s3_key VARCHAR(500) NOT NULL, -- S3 file location
    file_format VARCHAR(10), -- 'mp3', 'wav', 'flac'
    file_size INTEGER, -- in bytes
    duration FLOAT, -- in seconds
    
    -- MIR extracted features
    bpm FLOAT,
    energy_level VARCHAR(20), -- 'low', 'medium', 'high'
    genre VARCHAR(100), -- Increased from 50 to 100
    musical_key VARCHAR(20), -- Changed from 'key' to 'musical_key' to avoid reserved word
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'completed'
    desired_skills TEXT[], -- Skills needed for collaboration
    analysis_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    
    -- Completed track info
    completed_submission_id INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collaboration requests (with conversation_id)
CREATE TABLE collaboration_requests (
    id SERIAL PRIMARY KEY,
    track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
    collaborator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    message TEXT,
    conversation_id INTEGER REFERENCES conversations(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_id, collaborator_id)
);

-- Active collaborations
CREATE TABLE active_collaborations (
    id SERIAL PRIMARY KEY,
    track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    collaborator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES conversations(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(track_id, collaborator_id)
);

-- Submissions (completed versions)
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    track_id INTEGER REFERENCES tracks(id) ON DELETE CASCADE,
    collaborator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    s3_key VARCHAR(500) NOT NULL,
    file_format VARCHAR(10),
    status VARCHAR(20) DEFAULT 'pending_review', -- 'pending_review', 'approved', 'rejected'
    
    -- Voting
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Added constraint to prevent duplicate submissions from same collaborator
    UNIQUE(track_id, collaborator_id)
);

-- Votes on submissions
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, user_id)
);

-- Comments
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation participants
CREATE TABLE conversation_participants (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    read_by INTEGER[] DEFAULT ARRAY[]::INTEGER[] -- Array of user IDs who have read the message
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    content TEXT NOT NULL,
    related_id INTEGER, -- ID of related entity
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add constraint for valid notification types
ALTER TABLE notifications 
ADD CONSTRAINT valid_notification_types
CHECK (type IN (
    'collaboration_request',
    'submission',
    'vote',
    'comment',
    'message',
    'collaboration_response',
    'track_completed'
));

-- Online users tracking
CREATE TABLE online_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    socket_id VARCHAR(255) NOT NULL,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Track genres for better filtering
CREATE TABLE track_genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- Pre-populate common genres
INSERT INTO track_genres (name, description) VALUES
('Hip Hop', 'Rap and hip hop beats'),
('Electronic', 'EDM, house, techno, etc.'),
('Rock', 'Rock and alternative'),
('Pop', 'Popular music'),
('R&B', 'Rhythm and blues'),
('Jazz', 'Jazz and blues'),
('Classical', 'Classical music'),
('Ambient', 'Ambient and chill'),
('Metal', 'Heavy metal'),
('Reggae', 'Reggae and dancehall'),
('Country', 'Country music'),
('Folk', 'Folk and acoustic');

-- Indexes for performance
CREATE INDEX idx_tracks_user_id ON tracks(user_id);
CREATE INDEX idx_tracks_status ON tracks(status);
CREATE INDEX idx_tracks_bpm ON tracks(bpm);
CREATE INDEX idx_tracks_energy ON tracks(energy_level);
CREATE INDEX idx_tracks_analysis_status ON tracks(analysis_status);
CREATE INDEX idx_tracks_genre ON tracks(genre);
CREATE INDEX idx_collaboration_requests_track ON collaboration_requests(track_id);
CREATE INDEX idx_collaboration_requests_collaborator ON collaboration_requests(collaborator_id);
CREATE INDEX idx_collaboration_requests_status ON collaboration_requests(status);
CREATE INDEX idx_active_collaborations_track ON active_collaborations(track_id);
CREATE INDEX idx_active_collaborations_user ON active_collaborations(collaborator_id);
CREATE INDEX idx_submissions_track ON submissions(track_id);
CREATE INDEX idx_submissions_collaborator ON submissions(collaborator_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_votes_submission ON votes(submission_id);
CREATE INDEX idx_votes_user ON votes(user_id);
CREATE INDEX idx_comments_submission ON comments(submission_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_online_users_user ON online_users(user_id);
CREATE INDEX idx_online_users_activity ON online_users(last_activity);

-- Insert admin user
INSERT INTO users (username, email, password_hash, bio, skills)
VALUES (
    'admin_user',
    'admin@trackback.ai',
    '$2a$12$OgN7GTxwFbO4.MsrhqSyaeExTbN3AWOcv4IODuPkQy5xlpTg.cpI2',
    'System Administrator for TrackBackAI',
    ARRAY['administration', 'management']
);

-- Function to update track's updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic updated_at updates
CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_requests_updated_at BEFORE UPDATE ON collaboration_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_active_collaborations_updated_at BEFORE UPDATE ON active_collaborations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get track recommendations based on user preferences
CREATE OR REPLACE FUNCTION get_track_recommendations(
    p_user_id INTEGER,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    track_id INTEGER,
    title VARCHAR,
    bpm FLOAT,
    energy_level VARCHAR,
    genre VARCHAR,
    match_score FLOAT,
    owner_username VARCHAR,
    track_description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.bpm,
        t.energy_level,
        t.genre,
        -- Simple match score based on user's previous activity
        CASE 
            WHEN t.genre = ANY(SELECT genre FROM tracks WHERE user_id = p_user_id AND genre IS NOT NULL) THEN 0.3
            ELSE 0.1
        END +
        CASE 
            WHEN ABS(t.bpm - COALESCE(
                (SELECT AVG(bpm) FROM tracks WHERE user_id = p_user_id AND bpm IS NOT NULL), 
                120
            )) < 20 THEN 0.3
            ELSE 0.1
        END +
        CASE 
            WHEN t.energy_level = COALESCE(
                (SELECT energy_level FROM tracks WHERE user_id = p_user_id AND energy_level IS NOT NULL ORDER BY created_at DESC LIMIT 1), 
                'medium'
            ) THEN 0.4
            ELSE 0.2
        END as match_score,
        u.username as owner_username,
        t.description as track_description
    FROM tracks t
    JOIN users u ON t.user_id = u.id
    WHERE t.status = 'open'
    AND t.analysis_status = 'completed'
    AND t.user_id != p_user_id
    ORDER BY match_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get user collaboration stats
CREATE OR REPLACE FUNCTION get_user_collaboration_stats(p_user_id INTEGER)
RETURNS TABLE(
    total_tracks INTEGER,
    total_collaborations INTEGER,
    completed_collaborations INTEGER,
    pending_requests INTEGER,
    avg_bpm FLOAT,
    favorite_genre VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Total tracks uploaded by user
        (SELECT COUNT(*) FROM tracks WHERE user_id = p_user_id)::INTEGER as total_tracks,
        
        -- Total collaborations (approved requests)
        (SELECT COUNT(*) FROM collaboration_requests cr 
         JOIN tracks t ON cr.track_id = t.id 
         WHERE (t.user_id = p_user_id OR cr.collaborator_id = p_user_id) 
         AND cr.status = 'approved')::INTEGER as total_collaborations,
        
        -- Completed collaborations
        (SELECT COUNT(*) FROM tracks 
         WHERE user_id = p_user_id AND status = 'completed')::INTEGER as completed_collaborations,
        
        -- Pending requests (for user's tracks)
        (SELECT COUNT(*) FROM collaboration_requests cr 
         JOIN tracks t ON cr.track_id = t.id 
         WHERE t.user_id = p_user_id AND cr.status = 'pending')::INTEGER as pending_requests,
        
        -- Average BPM of user's tracks
        (SELECT AVG(bpm) FROM tracks WHERE user_id = p_user_id AND bpm IS NOT NULL)::FLOAT as avg_bpm,
        
        -- Most common genre
        (SELECT genre FROM tracks 
         WHERE user_id = p_user_id AND genre IS NOT NULL 
         GROUP BY genre 
         ORDER BY COUNT(*) DESC 
         LIMIT 1)::VARCHAR as favorite_genre;
END;
$$ LANGUAGE plpgsql;

-- View for user conversations with last message info
CREATE OR REPLACE VIEW user_conversations_view AS
SELECT 
    c.id as conversation_id,
    c.created_at,
    c.updated_at,
    cp.user_id,
    ARRAY_AGG(DISTINCT u2.id) as participant_ids,
    ARRAY_AGG(DISTINCT u2.username) as participant_usernames,
    (SELECT m.content FROM messages m 
     WHERE m.conversation_id = c.id 
     ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
    (SELECT m.created_at FROM messages m 
     WHERE m.conversation_id = c.id 
     ORDER BY m.created_at DESC LIMIT 1) as last_message_time,
    (SELECT COUNT(*) FROM messages m 
     WHERE m.conversation_id = c.id 
     AND NOT (cp.user_id = ANY(m.read_by))) as unread_count
FROM conversations c
JOIN conversation_participants cp ON c.id = cp.conversation_id
JOIN users u2 ON cp.user_id = u2.id
GROUP BY c.id, cp.user_id;

-- View for track discovery with MIR features
CREATE OR REPLACE VIEW track_discovery_view AS
SELECT 
    t.id,
    t.title,
    t.description,
    t.bpm,
    t.energy_level,
    t.genre,
    t.musical_key,
    t.status,
    t.created_at,
    u.username as owner_username,
    u.id as owner_id,
    u.skills as owner_skills,
    (SELECT COUNT(*) FROM collaboration_requests cr WHERE cr.track_id = t.id AND cr.status = 'pending') as pending_requests,
    (SELECT COUNT(*) FROM collaboration_requests cr WHERE cr.track_id = t.id AND cr.status = 'approved') as active_collaborations,
    (SELECT COUNT(*) FROM submissions s WHERE s.track_id = t.id) as submissions_count
FROM tracks t
JOIN users u ON t.user_id = u.id
WHERE t.analysis_status = 'completed'
AND t.status = 'open'
ORDER BY t.created_at DESC;
