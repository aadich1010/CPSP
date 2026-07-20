const { execSync } = require('child_process');
const fs = require('fs');

async function waitAndSet() {
  console.log("Waiting for Supabase Docker containers to finish downloading and start...");
  while (true) {
    try {
      const output = execSync('npx supabase status', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      const apiUrlMatch = output.match(/API URL:\s*(http:\/\/[^\s]+)/);
      const anonKeyMatch = output.match(/anon key:\s*([^\s]+)/);
      const serviceRoleMatch = output.match(/service_role key:\s*([^\s]+)/);

      if (apiUrlMatch && anonKeyMatch && serviceRoleMatch) {
        let envContent = fs.readFileSync('.env.local', 'utf-8');
        envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_URL=.*/, `NEXT_PUBLIC_SUPABASE_URL=${apiUrlMatch[1]}`);
        envContent = envContent.replace(/NEXT_PUBLIC_SUPABASE_ANON_KEY=.*/, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKeyMatch[1]}`);
        envContent = envContent.replace(/SUPABASE_SERVICE_ROLE_KEY=.*/, `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleMatch[1]}`);
        fs.writeFileSync('.env.local', envContent);
        console.log('Successfully updated .env.local with local Supabase keys!');
        break;
      }
    } catch (e) {
      // Not ready yet
    }
    await new Promise(r => setTimeout(r, 5000));
  }
}
waitAndSet();
