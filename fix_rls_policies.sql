-- Fix RLS policies for blogs, tags, and blog_tags tables
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON blogs;
DROP POLICY IF EXISTS "Enable read access for all users" ON tags;
DROP POLICY IF EXISTS "Enable read access for all users" ON blog_tags;

-- Create comprehensive RLS policies for authenticated users
-- (Adjust these based on your authentication setup)

-- Blogs table policies
CREATE POLICY "Enable read access for all users" ON blogs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON blogs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON blogs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON blogs FOR DELETE USING (auth.role() = 'authenticated');

-- Tags table policies
CREATE POLICY "Enable read access for all users" ON tags FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON tags FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON tags FOR DELETE USING (auth.role() = 'authenticated');

-- Blog_tags junction table policies
CREATE POLICY "Enable read access for all users" ON blog_tags FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON blog_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON blog_tags FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON blog_tags FOR DELETE USING (auth.role() = 'authenticated');

-- Alternative: If you want to disable RLS for development/admin use, uncomment these lines:
-- ALTER TABLE blogs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tags DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE blog_tags DISABLE ROW LEVEL SECURITY;