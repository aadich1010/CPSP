const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function fixAdmin() {
  let envContent = fs.readFileSync('.env.local', 'utf-8');
  const apiUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const serviceRoleMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  
  if (apiUrlMatch && serviceRoleMatch) {
    const supabase = createClient(apiUrlMatch[1].trim(), serviceRoleMatch[1].trim());
    
    // get user ID for admin@fcps.com
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log("Error getting users:", authError);
      return;
    }
    const adminUser = users.find(u => u.email === 'admin@fcps.com');
    if (adminUser) {
      console.log("Found admin user:", adminUser.id);
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: adminUser.id,
        email: 'admin@fcps.com',
        full_name: 'System Administrator',
        role: 'admin',
        subscription_status: 'active'
      });
      if (upsertError) {
        console.error("Upsert error:", upsertError);
      } else {
        console.log("Profile successfully upserted!");
      }
    } else {
      console.log("Admin user not found in auth.users.");
    }
  }
}
fixAdmin();
