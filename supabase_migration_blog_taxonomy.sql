-- Blog Taxonomy & Rich Content Migration
-- Adds proper category relationship, tags system, and media support

-- 1. Add UUID category_id to blogs (migrate existing text category to proper FK)
ALTER TABLE public.blogs 
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS featured_image_url text,
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- 2. Migrate existing text categories to proper category_id
-- First, ensure all existing category names exist in categories table
INSERT INTO public.categories (name, slug) 
  SELECT DISTINCT b.category as name, LOWER(REPLACE(b.category, ' ', '-')) as slug
  FROM public.blogs b
  WHERE b.category IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.categories c WHERE c.name = b.category)
ON CONFLICT (slug) DO NOTHING;

-- Update blogs with proper category_id
UPDATE public.blogs b
SET category_id = c.id
FROM public.categories c
WHERE b.category = c.name
AND b.category_id IS NULL;

-- 3. Create tags table
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  color text DEFAULT '#DC2626',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create blog_tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS public.blog_tags (
  blog_id uuid REFERENCES public.blogs(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  primary key (blog_id, tag_id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create media library table for uploads
CREATE TABLE IF NOT EXISTS public.media_files (
  id uuid default uuid_generate_v4() primary key,
  url text not null,
  alt text,
  type text check (type in ('image', 'video')) default 'image',
  size int,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. RLS for new tables
ALTER TABLE public.tags enable row level security;
ALTER TABLE public.blog_tags enable row level security;
ALTER TABLE public.media_files enable row level security;

-- Policies for Tags
create policy "Anyone can view tags." on public.tags for select using (true);
create policy "Admins can manage tags." on public.tags for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Policies for Blog Tags
create policy "Anyone can view blog_tags." on public.blog_tags for select using (true);
create policy "Admins can manage blog_tags." on public.blog_tags for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Policies for Media Files
create policy "Anyone can view media files." on public.media_files for select using (true);
create policy "Authenticated admins can upload media." on public.media_files for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Admins can delete own media." on public.media_files for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 7. Update blog RLS to include category relationship access
drop policy if exists "Admins can manage blogs." on public.blogs;
create policy "Admins can manage blogs." on public.blogs for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_tags_tag_id ON public.blog_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_blog_tags_blog_id ON public.blog_tags(blog_id);
CREATE INDEX IF NOT EXISTS idx_blogs_category_id ON public.blogs(category_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON public.blogs(slug);

-- 9. Create function to automatically generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug(text_input text)
RETURNS text AS $$
DECLARE
  slug_text text;
BEGIN
  slug_text := LOWER(TRIM(text_input));
  slug_text := REGEXP_REPLACE(slug_text, '[^a-z0-9\s-]', '', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '\s+', '-', 'g');
  slug_text := REGEXP_REPLACE(slug_text, '-+', '-', 'g');
  RETURN slug_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
