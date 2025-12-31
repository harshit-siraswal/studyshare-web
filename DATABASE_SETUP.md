# Database Setup Instructions

## How to Run These SQL Scripts

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to the **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste each SQL block below
5. Click **Run** to execute

---

## 1. Create Chat Rooms Table

```sql
CREATE TABLE IF NOT EXISTS chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by TEXT NOT NULL,
  created_by_email TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  password TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delete_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_rooms_created_at ON chat_rooms(created_at);
CREATE INDEX idx_rooms_delete_at ON chat_rooms(delete_at);
CREATE INDEX idx_rooms_is_private ON chat_rooms(is_private);
```

---

## 2. Create Room Messages Table

```sql
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_room ON room_messages(room_id);
CREATE INDEX idx_messages_created_at ON room_messages(created_at);
```

---

## 3. Create Room Members Table

```sql
CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_email)
);

CREATE INDEX idx_members_room ON room_members(room_id);
CREATE INDEX idx_members_email ON room_members(user_email);
```

---

## 4. Create Department Followers Table

```sql
CREATE TABLE IF NOT EXISTS department_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id TEXT NOT NULL,
  follower_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(department_id, follower_email)
);

CREATE INDEX idx_dept_followers_dept ON department_followers(department_id);
CREATE INDEX idx_dept_followers_email ON department_followers(follower_email);
```

---

## 5. Add Spotify Playlist Column to Users Table

```sql
-- Add spotify_playlist_url column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS spotify_playlist_url TEXT;

CREATE INDEX IF NOT EXISTS idx_users_spotify ON users(spotify_playlist_url);
```

---

## 6. Create Room Post Comments Table

```sql
CREATE TABLE IF NOT EXISTS room_post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES room_messages(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_comments_message ON room_post_comments(message_id);
CREATE INDEX idx_comments_created_at ON room_post_comments(created_at);
```

---

## 7. Create Saved Posts Table

```sql
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email TEXT NOT NULL,
  message_id UUID REFERENCES room_messages(id) ON DELETE CASCADE,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_email, message_id)
);

CREATE INDEX idx_saved_user ON saved_posts(user_email);
CREATE INDEX idx_saved_message ON saved_posts(message_id);
```

---

## 8. Create Auto-Deletion Function

```sql
CREATE OR REPLACE FUNCTION delete_expired_rooms()
RETURNS void AS $$
BEGIN
  DELETE FROM chat_rooms WHERE delete_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 9. (Optional) Schedule Auto-Deletion

To automatically delete expired rooms, you can set up a Supabase Edge Function or use pg_cron:

```sql
-- This requires pg_cron extension (may need to enable in Supabase dashboard)
SELECT cron.schedule('delete-expired-rooms', '0 0 * * *', 'SELECT delete_expired_rooms()');
```

Or manually run the cleanup function periodically:
```sql
SELECT delete_expired_rooms();
```

---

## Verification

After running all scripts, verify the tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('chat_rooms', 'room_messages', 'room_members', 'department_followers');
```

You should see all 4 tables listed.
