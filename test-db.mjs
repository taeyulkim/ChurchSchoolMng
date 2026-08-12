import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  
  // Test inserting a student
  const { data: insertData, error: insertError } = await supabase.from('students').insert({
    name: 'Test DB',
    gender: 'male',
    department: '유아부',
    birth_date: '2020-01-01',
    school: '',
    grade: ''
  }).select();

  if (insertError) {
    console.error('Error inserting student:', insertError);
  } else {
    console.log('Successfully inserted student:', insertData);
  }

  // Test reading students
  const { data, error } = await supabase.from('students').select('*');
  
  if (error) {
    console.error('Error fetching students:', error);
  } else {
    console.log('Successfully fetched students. Count:', data.length);
  }
}

testConnection();
