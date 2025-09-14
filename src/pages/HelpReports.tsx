import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface TopQuery {
  q: string;
  searches: number;
  avg_results: number;
}

interface ZeroResultQuery {
  q: string;
  misses: number;
}

interface ArticlePerformance {
  id: string;
  title: string;
  clicks: number;
  helpful_rate: number;
  feedback_count: number;
  updated_at: string;
}

interface BotOutcome {
  week: string;
  sessions: number;
  resolved: number;
  resolved_pct: number;
  escalated: number;
  escalated_pct: number;
}

export default function HelpReports() {
  const [topQueries, setTopQueries] = useState<TopQuery[]>([]);
  const [zeroQueries, setZeroQueries] = useState<ZeroResultQuery[]>([]);
  const [articlePerf, setArticlePerf] = useState<ArticlePerformance[]>([]);
  const [botOutcomes, setBotOutcomes] = useState<BotOutcome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topQueriesRes, zeroQueriesRes, articlePerfRes, botOutcomesRes] = await Promise.all([
          supabase.from('v_help_top_queries').select('*').limit(20),
          supabase.from('v_help_zero_results').select('*').limit(20),
          supabase.from('v_help_article_perf').select('*').limit(20),
          supabase.from('v_help_bot_outcomes').select('*').limit(12)
        ]);

        setTopQueries(topQueriesRes.data || []);
        setZeroQueries(zeroQueriesRes.data || []);
        setArticlePerf(articlePerfRes.data || []);
        setBotOutcomes(botOutcomesRes.data || []);
      } catch (error) {
        console.error('Error fetching help reports data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading help reports...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        <h1 className="text-2xl font-bold">Help & Knowledge Base Reports</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Searches */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Searches (90 days)
            </CardTitle>
            <CardDescription>Most searched queries by users</CardDescription>
          </CardHeader>
          <CardContent>
            {topQueries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No search data available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="text-right">Searches</TableHead>
                    <TableHead className="text-right">Avg Results</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topQueries.map((query, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{query.q}</TableCell>
                      <TableCell className="text-right">{query.searches}</TableCell>
                      <TableCell className="text-right">{query.avg_results}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Zero-Result Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Knowledge Gaps
            </CardTitle>
            <CardDescription>Queries with zero results (opportunities for new content)</CardDescription>
          </CardHeader>
          <CardContent>
            {zeroQueries.length === 0 ? (
              <p className="text-muted-foreground text-sm">No zero-result queries found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="text-right">Misses</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {zeroQueries.map((query, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-sm">{query.q}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">{query.misses}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Article Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Article Performance</CardTitle>
          <CardDescription>Click rates and helpfulness ratings for articles</CardDescription>
        </CardHeader>
        <CardContent>
          {articlePerf.length === 0 ? (
            <p className="text-muted-foreground text-sm">No article performance data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Helpful Rate</TableHead>
                  <TableHead className="text-right">Feedback Count</TableHead>
                  <TableHead className="text-right">Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articlePerf.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell className="text-right">{article.clicks}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={article.helpful_rate > 0.7 ? "default" : "secondary"}>
                        {Math.round(article.helpful_rate * 100)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{article.feedback_count}</TableCell>
                    <TableCell className="text-right">
                      {new Date(article.updated_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Bot Outcomes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            HelpBot Outcomes (Weekly)
          </CardTitle>
          <CardDescription>Bot resolution rates and escalation to support tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {botOutcomes.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bot session data available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                  <TableHead className="text-right">Resolved %</TableHead>
                  <TableHead className="text-right">Escalated</TableHead>
                  <TableHead className="text-right">Escalated %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {botOutcomes.map((outcome, i) => (
                  <TableRow key={i}>
                    <TableCell>{outcome.week}</TableCell>
                    <TableCell className="text-right">{outcome.sessions}</TableCell>
                    <TableCell className="text-right">{outcome.resolved}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={outcome.resolved_pct > 70 ? "default" : "secondary"}>
                        {outcome.resolved_pct}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{outcome.escalated}</TableCell>
                    <TableCell className="text-right">{outcome.escalated_pct}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        💡 <strong>Tip:</strong> Turn top zero-result queries into new articles. Aim for resolved rate &gt; 70%.
      </div>
    </div>
  );
}