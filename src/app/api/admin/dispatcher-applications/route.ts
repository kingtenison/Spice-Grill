import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or employee
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'employee')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all dispatcher applications
    const { data: dispatchers, error: dispatchersError } = await supabase
      .from('dispatchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (dispatchersError) {
      return NextResponse.json({ error: dispatchersError.message }, { status: 500 });
    }

    if (!dispatchers || dispatchers.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    // Perform manual join on server side to avoid relation schema cache mismatches
    const serviceClient = getServiceClient();
    const userIds = dispatchers.map((d: any) => d.user_id).filter(Boolean);

    const [profilesResult, usersResult] = await Promise.all([
      serviceClient.from('profiles').select('id, full_name, created_at').in('id', userIds),
      serviceClient.auth.admin.listUsers()
    ]);

    const profileMap = new Map((profilesResult.data || []).map(p => [p.id, p]));
    const userEmailMap = new Map((usersResult.data?.users || []).map(u => [u.id, u.email]));

    const applications = dispatchers.map((dispatcher: any) => {
      const prof = profileMap.get(dispatcher.user_id);
      const email = userEmailMap.get(dispatcher.user_id) || dispatcher.email || '';
      return {
        ...dispatcher,
        profiles: {
          email,
          full_name: prof?.full_name || dispatcher.name || '',
          created_at: prof?.created_at || dispatcher.created_at
        }
      };
    });

    return NextResponse.json({ applications });
  } catch (error: any) {
    console.error('Error fetching dispatcher applications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, action, notes } = body;

    if (!applicationId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Check if user is admin or employee
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'employee')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update application status
    const { error } = await supabase
      .from('dispatchers')
      .update({
        application_status: action === 'approve' ? 'approved' : 'rejected',
        application_notes: notes,
        is_active: action === 'approve',
      })
      .eq('id', applicationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating dispatcher application:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
