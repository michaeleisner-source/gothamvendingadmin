import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDemo } from '@/lib/demo';

export default function Debug() {
  const { isDemo, ready } = useDemo();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [db, setDb] = useState<string>('pending');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    (async () => {
      const { data, error } = await supabase.from('locations').select('id').limit(1);
      setDb(error ? 'fail: ' + error.message : 'ok: ' + (data?.length ?? 0) + ' rows');
    })();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3>Debug</h3>
      <div>demo mode: {String(isDemo)} | ready: {String(ready)}</div>
      <div>session: {authed === null ? 'loading' : String(authed)}</div>
      <div>db: {db}</div>
    </div>
  );
}