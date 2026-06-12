import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://ioeihnoxvtpxtqhxklpw.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZWlobm94dnRweHRxaHhrbHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5ODQ1MzYsImV4cCI6MjA2MTU2MDUzNn0.5KolFPfnppqfb8lbYnWhJKo6GZL_VCxn3Zx1hxyLaro";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log("🔍 Fetching recent stories...");
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('id, title')
    .limit(5);

  if (storiesError) {
    console.error("Error fetching stories:", storiesError);
    return;
  }

  console.log(`Found ${stories.length} stories:`);
  stories.forEach(s => {
    console.log(`- "${s.title}" (ID: ${s.id})`);
  });

  console.log("\n🔍 Fetching recent audio files...");
  const { data: files, error: filesError } = await supabase
    .from('audio_files')
    .select('*')
    .limit(5);

  if (filesError) {
    console.error("Error fetching files:", filesError);
    return;
  }

  console.log(`Found ${files.length} audio files:`);
  files.forEach((f, i) => {
    console.log(`\n--- File ${i + 1} ---`);
    console.log(`ID: ${f.id}`);
    console.log(`Story ID: ${f.story_id}`);
    console.log(`Status: ${f.status}`);
    console.log(`Voice ID: ${f.voice_id}`);
    console.log(`Text (length: ${f.text_content?.length}):`);
    console.log(JSON.stringify(f.text_content));
  });
}

checkData();
