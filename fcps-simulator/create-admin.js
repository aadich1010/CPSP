const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');


async function checkAndCreateAdmin() {
  console.log("Waiting for Supabase to finish starting to create admin...");
  while (true) {
    let envContent = fs.readFileSync('.env.local', 'utf-8');
    if (!envContent.includes('your_supabase_project_id')) {
      const apiUrlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
      const serviceRoleMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
      
      if (apiUrlMatch && serviceRoleMatch) {
        console.log("Keys found, creating admin user...");
        const supabase = createClient(apiUrlMatch[1].trim(), serviceRoleMatch[1].trim());
        
        const { data, error } = await supabase.auth.admin.createUser({
          email: 'admin@fcps.com',
          password: 'Abcd@321',
          email_confirm: true,
          user_metadata: { full_name: 'System Administrator' }
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            console.log("Admin already exists!");
            break;
          }
          console.error("Error creating admin:", error.message);
          // Retry later if it's a connection error
        } else if (data && data.user) {
          console.log("Admin user created:", data.user.id);
          await new Promise(r => setTimeout(r, 2000)); // wait for trigger
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin', subscription_status: 'active' })
            .eq('id', data.user.id);
            
          if (updateError) {
            console.error("Failed to set admin role:", updateError.message);
          } else {
            console.log("Successfully granted Admin privileges!");
          }
          break;
        }
      }
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}
checkAndCreateAdmin();
