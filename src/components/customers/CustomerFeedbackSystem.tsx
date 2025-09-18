import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, Star, ThumbsUp, ThumbsDown, 
  AlertTriangle, TrendingUp, Filter, BarChart3,
  MapPin, Clock, User
} from 'lucide-react';

export const CustomerFeedbackSystem = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const feedbackStats = [
    { label: 'Total Reviews', value: '3,247', change: '+18%', icon: MessageSquare },
    { label: 'Avg. Rating', value: '4.2', change: '+0.3', icon: Star },
    { label: 'Response Rate', value: '87%', change: '+5%', icon: TrendingUp },
    { label: 'Issues Resolved', value: '92%', change: '+8%', icon: AlertTriangle }
  ];

  const ratingDistribution = [
    { stars: 5, count: 1456, percentage: 45 },
    { stars: 4, count: 976, percentage: 30 },
    { stars: 3, count: 487, percentage: 15 },
    { stars: 2, count: 195, percentage: 6 },
    { stars: 1, count: 133, percentage: 4 }
  ];

  const recentFeedback = [
    {
      id: 1,
      customer: 'Sarah Johnson',
      location: 'Downtown Office',
      rating: 5,
      comment: 'Great selection and the machine is always stocked!',
      timestamp: '2 hours ago',
      status: 'positive',
      category: 'product'
    },
    {
      id: 2,
      customer: 'Mike Chen',
      location: 'University Campus',
      rating: 2,
      comment: 'Machine ate my money and didn\'t dispense the item.',
      timestamp: '4 hours ago',
      status: 'negative',
      category: 'technical'
    },
    {
      id: 3,
      customer: 'Emma Wilson',
      location: 'Hospital Lobby',
      rating: 4,
      comment: 'Good variety but would love more healthy options.',
      timestamp: '6 hours ago',
      status: 'positive',
      category: 'product'
    },
    {
      id: 4,
      customer: 'John Davis',
      location: 'Factory Break Room',
      rating: 1,
      comment: 'Out of order for 3 days now. Very frustrating.',
      timestamp: '8 hours ago',
      status: 'negative',
      category: 'maintenance'
    }
  ];

  const categoryStats = [
    { name: 'Product Quality', positive: 78, negative: 12, neutral: 10 },
    { name: 'Machine Reliability', positive: 65, negative: 25, neutral: 10 },
    { name: 'Pricing', positive: 58, negative: 32, neutral: 10 },
    { name: 'Variety', positive: 72, negative: 18, neutral: 10 },
    { name: 'Accessibility', positive: 83, negative: 7, neutral: 10 }
  ];

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {feedbackStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <Badge variant="secondary" className="text-xs">
                    {stat.change}
                  </Badge>
                </div>
                <stat.icon className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Feedback</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="responses">Response Center</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Rating Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ratingDistribution.map((rating) => (
                  <div key={rating.stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{rating.stars}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <Progress value={rating.percentage} className="flex-1 h-2" />
                    <span className="text-sm text-muted-foreground w-12">
                      {rating.count}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Category Sentiment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Category Sentiment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryStats.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{category.name}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-600">{category.positive}%</span>
                        <span className="text-red-600">{category.negative}%</span>
                      </div>
                    </div>
                    <div className="flex h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500" 
                        style={{ width: `${category.positive}%` }}
                      />
                      <div 
                        className="bg-gray-300" 
                        style={{ width: `${category.neutral}%` }}
                      />
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${category.negative}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Feedback</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">Export</Button>
            </div>
          </div>

          <div className="space-y-4">
            {recentFeedback.map((feedback) => (
              <Card key={feedback.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 p-1 bg-muted rounded-full" />
                      <div>
                        <p className="font-medium">{feedback.customer}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {feedback.location}
                          <Clock className="h-3 w-3 ml-2" />
                          {feedback.timestamp}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">{getRatingStars(feedback.rating)}</div>
                      <Badge className={getStatusColor(feedback.status)}>
                        {feedback.category}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm mb-3">{feedback.comment}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Respond
                    </Button>
                    {feedback.status === 'negative' && (
                      <Button size="sm" variant="outline">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Create Ticket
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mr-2" />
                Feedback trends chart would be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Positive Response</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Thank customers for positive feedback
                    </p>
                    <Button size="sm" variant="outline">Create Template</Button>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <h4 className="font-medium mb-1">Issue Resolution</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Address customer complaints effectively
                    </p>
                    <Button size="sm" variant="outline">Create Template</Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};