import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DemoUser {
  email: string;
  password: string;
  role: string;
  name: string;
  department: string;
}

const demoCredentials: DemoUser[] = [
  { email: 'admin@approvia.com', password: 'password123', role: 'Admin', name: 'System Administrator', department: 'IT' },
  { email: 'ceo@approvia.com', password: 'password123', role: 'Approver_L4', name: 'Emily Davis', department: 'Executive' },
  { email: 'cfo@approvia.com', password: 'password123', role: 'Approver_L3', name: 'Robert Chen', department: 'Finance' },
  { email: 'director1@approvia.com', password: 'password123', role: 'Approver_L2', name: 'Sarah Wilson', department: 'Operations' },
  { email: 'manager1@approvia.com', password: 'password123', role: 'Approver_L1', name: 'Mike Johnson', department: 'Engineering' },
  { email: 'john.doe@approvia.com', password: 'password123', role: 'Submitter', name: 'John Doe', department: 'Engineering' },
];

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client using service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const user of demoCredentials) {
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            // User already exists, try to create/update profile
            const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = existingUsers.users.find(u => u.email === user.email);
            
            if (existingUser) {
              // Create or update user profile
              const { error: profileError } = await supabaseAdmin
                .from('user_profiles')
                .upsert({
                  user_id: existingUser.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                  department: user.department,
                  active: true
                });

              if (profileError) {
                console.error(`Profile error for ${user.email}:`, profileError);
                errors.push(`Profile creation failed for ${user.email}`);
                errorCount++;
              } else {
                successCount++;
              }
            }
          } else {
            console.error(`Auth error for ${user.email}:`, authError);
            errors.push(`${user.email}: ${authError.message}`);
            errorCount++;
          }
        } else if (authData.user) {
          // Create user profile
          const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
              user_id: authData.user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              department: user.department,
              active: true
            });

          if (profileError) {
            console.error(`Profile error for ${user.email}:`, profileError);
            errors.push(`Profile creation failed for ${user.email}`);
            errorCount++;
          } else {
            successCount++;
          }
        }
      } catch (err) {
        console.error(`Error creating user ${user.email}:`, err);
        errors.push(`${user.email}: Unexpected error`);
        errorCount++;
      }
    }

    const response = {
      success: true,
      successCount,
      errorCount,
      errors,
      message: successCount > 0 
        ? `Successfully created/updated ${successCount} demo users!`
        : 'No users were created successfully.'
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in create-demo-users function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to create demo users. Please check your Supabase configuration.',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})