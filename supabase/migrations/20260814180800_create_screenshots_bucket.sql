-- Create the screenshots storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'screenshots',
  'screenshots',
  false,
  8388608,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg', 'image/gif'];
