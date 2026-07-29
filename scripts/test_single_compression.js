import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompress() {
  const fileName = "Gemini_Generated_Image_emwrp0emwrp0emwr.png";
  const url = `${supabaseUrl}/storage/v1/object/public/storyimages/${fileName}`;

  console.log(`📥 Downloading ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Failed to download image:", res.statusText);
    return;
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`Original size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB`);

  const compressedBuffer = await sharp(buffer)
    .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  console.log(`Compressed size: ${(compressedBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

  console.log("📤 Attempting upload...");
  const { data, error } = await supabase.storage.from('storyimages').upload(fileName, compressedBuffer, {
    contentType: 'image/webp',
    upsert: true
  });

  if (error) {
    console.error("Upload error:", error);
  } else {
    console.log("Upload success:", data);
  }
}

testCompress();
