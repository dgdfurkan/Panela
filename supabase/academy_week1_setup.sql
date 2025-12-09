-- Hafta 1: 9 Aralık - 16 Aralık
INSERT INTO public.academy_weeks (week_number, title, description)
VALUES (
  1,
  'Hafta 1: E-Ticaret Temelleri',
  '9 Aralık - 16 Aralık tarihleri arasında gerçekleşecek ilk haftamız. Bu hafta e-ticaret temellerini öğreneceğiz.'
)
ON CONFLICT (week_number) DO NOTHING;

-- Hafta ID'sini al (sonraki insertler için)
-- Not: Bu scripti çalıştırdıktan sonra week_id'yi manuel olarak alman gerekebilir
-- Veya aşağıdaki scripti hafta oluşturulduktan sonra çalıştır

-- Doğru Örnekler (is_good_example = true)
INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'instagram' as resource_type,
  'https://www.instagram.com/glorivoco/' as url,
  'Glorivo Instagram - Doğru Örnek' as title,
  'Gün gün değişim gösteren, profesyonel Instagram hesabı örneği' as description,
  true as is_good_example,
  '{}'::jsonb as embed_data
FROM public.academy_weeks WHERE week_number = 1;

INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'website' as resource_type,
  'https://glorivo.co/' as url,
  'Glorivo Website - Doğru Örnek' as title,
  'Profesyonel e-ticaret mağazası örneği' as description,
  true as is_good_example,
  '{}'::jsonb as embed_data
FROM public.academy_weeks WHERE week_number = 1;

INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'instagram' as resource_type,
  'https://www.instagram.com/nutrinaresmi/' as url,
  'Nutrina Instagram - Doğru Örnek' as title,
  'Başarılı marka Instagram hesabı örneği' as description,
  true as is_good_example,
  '{}'::jsonb as embed_data
FROM public.academy_weeks WHERE week_number = 1;

-- Yanlış Örnekler (is_good_example = false)
INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'website' as resource_type,
  'https://lunivatr.com/products/sac-siyahlastirici-sampuan-350-ml' as url,
  'Lunivatr - Yanlış Örnek' as title,
  'E-ticaret mağazası için yanlış örnek' as description,
  false as is_good_example,
  '{}'::jsonb as embed_data
FROM public.academy_weeks WHERE week_number = 1;

INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'website' as resource_type,
  'https://zanaatbakir.com/collections/tum-urun' as url,
  'Zanaat Bakır - Yanlış Örnek' as title,
  'E-ticaret mağazası için yanlış örnek' as description,
  false as is_good_example,
  '{}'::jsonb as embed_data
FROM public.academy_weeks WHERE week_number = 1;

INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'instagram' as resource_type,
  'https://www.instagram.com/zanaatbakir/' as url,
  'Zanaat Bakır Instagram - Yanlış Örnek' as title,
  'Instagram hesabı için yanlış örnek' as description,
  false as is_good_example,
  '{}'::jsonb as embed_data
FROM public.academy_weeks WHERE week_number = 1;

-- YouTube Videoları
INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'youtube' as resource_type,
  'https://youtu.be/qSjXmboslgs?si=QJ65Z8IEOKCrIDLH' as url,
  'YouTube Video 1' as title,
  'İzlenmesi gereken eğitim videosu' as description,
  true as is_good_example,
  jsonb_build_object('videoId', 'qSjXmboslgs', 'embedUrl', 'https://www.youtube.com/embed/qSjXmboslgs') as embed_data
FROM public.academy_weeks WHERE week_number = 1;

INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'youtube' as resource_type,
  'https://youtu.be/nMJPU5PbeH0?si=JrEp-L-XJRcNDTO0' as url,
  'YouTube Video 2' as title,
  'İzlenmesi gereken eğitim videosu' as description,
  true as is_good_example,
  jsonb_build_object('videoId', 'nMJPU5PbeH0', 'embedUrl', 'https://www.youtube.com/embed/nMJPU5PbeH0') as embed_data
FROM public.academy_weeks WHERE week_number = 1;

INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'youtube' as resource_type,
  'https://youtu.be/nMmzFYer_T0?si=jE6vseEFDsMIYF2D' as url,
  'YouTube Video 3' as title,
  'İzlenmesi gereken eğitim videosu' as description,
  true as is_good_example,
  jsonb_build_object('videoId', 'nMmzFYer_T0', 'embedUrl', 'https://www.youtube.com/embed/nMmzFYer_T0') as embed_data
FROM public.academy_weeks WHERE week_number = 1;

INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'youtube' as resource_type,
  'https://www.youtube.com/@DenizPulcu/videos' as url,
  'Deniz Pulcu - Facebook Reklam Stratejileri' as title,
  'Facebook reklam stratejileri için abone olup bütün videolarını izlemenizi tavsiye ederim!' as description,
  true as is_good_example,
  jsonb_build_object('channel', '@DenizPulcu') as embed_data
FROM public.academy_weeks WHERE week_number = 1;

INSERT INTO public.academy_resources (week_id, resource_type, url, title, description, is_good_example, embed_data)
SELECT 
  id as week_id,
  'youtube' as resource_type,
  'https://www.youtube.com/@StoryBoxvideos' as url,
  'StoryBox - Girişimcilik Hikayeleri' as title,
  'Girişimcilik hikayelerinden ilham almanız için abone olup videoları izlemenizi tavsiye ederim!' as description,
  true as is_good_example,
  jsonb_build_object('channel', '@StoryBoxvideos') as embed_data
FROM public.academy_weeks WHERE week_number = 1;

