import { supabase } from './supabase';

export async function uploadCarImage(file, ownerId) {
  // Create a unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${ownerId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('car-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('car-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function deleteCarImage(imageUrl) {
  // Extract file path from URL
  const path = imageUrl.split('/car-images/')[1];
  if (!path) return;

  const { error } = await supabase.storage
    .from('car-images')
    .remove([path]);

  if (error) throw error;
}