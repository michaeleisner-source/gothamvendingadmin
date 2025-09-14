import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';

export default function HelpArticle() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    (async () => {
      try {
        const { data: a } = await supabase
          .from('help_articles')
          .select('id,title,body_md,updated_at')
          .eq('id', id)
          .maybeSingle();
        
        setArticle(a);
        
        if (a) {
          const { data: s } = await supabase
            .from('help_steps')
            .select('id,step_no,content_md')
            .eq('article_id', id)
            .order('step_no');
          setSteps(s || []);
        }
      } catch (error) {
        console.error('Error loading help article:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-muted-foreground">Article Not Found</h1>
          <p className="text-muted-foreground mt-2">The help article you're looking for doesn't exist.</p>
          <Link 
            to="/help" 
            className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Back to Help Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Navigation */}
      <Link 
        to="/help" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Help Center
      </Link>

      {/* Article Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">{article.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          <span>Last updated {new Date(article.updated_at).toLocaleDateString()}</span>
        </div>
      </header>

      {/* Article Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {article.body_md}
            </ReactMarkdown>
          </div>
        </div>

        {/* Step-by-step sidebar */}
        {steps.length > 0 && (
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="text-lg font-semibold mb-4">Step-by-Step Guide</h2>
                <ol className="space-y-3">
                  {steps.map((s) => (
                    <li key={s.id} className="flex gap-3">
                      <div className="flex-shrink-0 size-6 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                        {s.step_no}
                      </div>
                      <div className="flex-1 text-sm">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {s.content_md}
                        </ReactMarkdown>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}