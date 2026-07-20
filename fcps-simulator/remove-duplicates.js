const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeDuplicates() {
  console.log('🔍 Fetching questions to identify duplicates...');
  
  const { data: questions, error } = await supabase
    .from('questions')
    .select('id, question_text')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`📊 Found ${questions.length} total questions.`);

  const seenTexts = new Set();
  const toDelete = [];

  for (const q of questions) {
    const cleanText = q.question_text.trim();
    const lowerText = cleanText.toLowerCase();

    // Condition 1: Exact text match (keep the first one found)
    if (seenTexts.has(lowerText)) {
      toDelete.push(q.id);
      continue;
    }

    // Condition 2: Explicitly marked as duplicate in the text
    if (cleanText.includes('(duplicate of')) {
      toDelete.push(q.id);
      continue;
    }

    seenTexts.add(lowerText);
  }

  if (toDelete.length === 0) {
    console.log('✅ No duplicate questions found.');
    return;
  }

  console.log(`🗑️ Found ${toDelete.length} duplicates to remove.`);

  // Delete in batches of 50
  for (let i = 0; i < toDelete.length; i += 50) {
    const batch = toDelete.slice(i, i + 50);
    const { error: delError } = await supabase
      .from('questions')
      .delete()
      .in('id', batch);

    if (delError) {
      console.error(`Error deleting batch ${i / 50 + 1}:`, delError);
    } else {
      console.log(`✅ Deleted batch ${i / 50 + 1} (${batch.length} questions).`);
    }
  }

  console.log('✨ Cleanup complete.');
}

removeDuplicates();
