const { createClient } = require('@supabase/supabase-js');

async function testSignUp() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const email = 'test_insert_' + Date.now() + '@gmail.com';
  console.log('Signing up:', email);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'password123',
  });

  if (error) {
    console.error('Signup error:', error);
    return;
  }

  console.log('Signup success, user ID:', data.user?.id);
  console.log('Session present?:', !!data.session);

  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        name: 'Test Name',
        role: 'teacher',
        department: '유아부',
        status: 'pending',
        permissions: { attendance: false, talent: false, budget: false, items: false, schedule: false }
      });
      
    if (profileError) {
      console.error('Profile Insert Error:', profileError);
    } else {
      console.log('Profile Insert Success!');
    }
  }
}

testSignUp();
