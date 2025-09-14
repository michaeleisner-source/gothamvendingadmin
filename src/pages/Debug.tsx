import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDemo } from '@/lib/demo';

export default function Debug() {
  const { isDemo, ready } = useDemo();
  const [authed, setAuthed] = useState<'loading'|'yes'|'no'>('loading');
  const [db, setDb] = useState('pending');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(data.session ? 'yes' : 'no'));
    (async () => {
      const { data, error } = await supabase.from('locations').select('id').limit(1);
      setDb(error ? 'fail: ' + error.message : 'ok: ' + (data?.length ?? 0) + ' rows');
    })();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3>Debug</h3>
      <div>demo: {String(isDemo)} | ready: {String(ready)}</div>
      <div>session: {authed}</div>
      <div>db: {db}</div>
    </div>
  );
}