
import { createClient } from '@/lib/supabase/server';

export default async function DebugPlanPage({ searchParams }: { searchParams: { venue_id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Not logged in</div>;

  const venue_id = searchParams.venue_id;

  if (!venue_id) return <div>No venue_id provided</div>;

  const { data: plan, error } = await supabase
    .from('user_venue_plans')
    .select('*')
    .eq('venue_id', venue_id)
    .eq('user_id', user.id);

  return (
    <div className="p-8">
      <h1>Debug Plan Status</h1>
      <pre>{JSON.stringify({
        user_id: user.id,
        venue_id: venue_id,
        plan_data: plan,
        error: error
      }, null, 2)}</pre>
    </div>
  );
}
