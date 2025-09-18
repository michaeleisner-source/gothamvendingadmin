import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, Gift, Trophy, TrendingUp, Users, 
  Crown, Award, Target, Zap
} from 'lucide-react';

export const CustomerLoyaltyProgram = () => {
  const loyaltyStats = [
    { label: 'Active Members', value: '2,847', change: '+12%', icon: Users },
    { label: 'Points Issued', value: '847K', change: '+8%', icon: Star },
    { label: 'Rewards Redeemed', value: '1,234', change: '+15%', icon: Gift },
    { label: 'Avg. Points/Customer', value: '298', change: '+5%', icon: Trophy }
  ];

  const tierPrograms = [
    {
      name: 'Bronze',
      color: 'bg-amber-100 border-amber-200 text-amber-800',
      members: 1523,
      minSpend: '$0',
      benefits: ['1 point per $1', 'Basic rewards'],
      icon: Award
    },
    {
      name: 'Silver',
      color: 'bg-gray-100 border-gray-200 text-gray-800',
      members: 892,
      minSpend: '$500',
      benefits: ['1.25 points per $1', 'Priority support', '5% bonus rewards'],
      icon: Crown
    },
    {
      name: 'Gold',
      color: 'bg-yellow-100 border-yellow-200 text-yellow-800',
      members: 432,
      minSpend: '$1,500',
      benefits: ['1.5 points per $1', 'Exclusive offers', '10% bonus rewards'],
      icon: Trophy
    }
  ];

  const rewardCatalog = [
    { name: 'Free Snack', points: 50, redeemed: 234, icon: Gift },
    { name: 'Free Drink', points: 75, redeemed: 189, icon: Gift },
    { name: '$5 Credit', points: 500, redeemed: 89, icon: Target },
    { name: '$10 Credit', points: 1000, redeemed: 45, icon: Target },
    { name: 'Premium Combo', points: 150, redeemed: 123, icon: Zap }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loyaltyStats.map((stat) => (
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

      <Tabs defaultValue="tiers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tiers">Tier Programs</TabsTrigger>
          <TabsTrigger value="rewards">Reward Catalog</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Loyalty Tiers</h3>
            <Button>Manage Tiers</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tierPrograms.map((tier) => (
              <Card key={tier.name} className={tier.color}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <tier.icon className="h-5 w-5" />
                    {tier.name} Tier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Members: {tier.members.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Min. Spend: {tier.minSpend}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Benefits:</p>
                    <ul className="text-xs space-y-1">
                      {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-1">
                          <div className="w-1 h-1 bg-current rounded-full" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reward Catalog</h3>
            <Button>Add Reward</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewardCatalog.map((reward) => (
              <Card key={reward.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <reward.icon className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">{reward.name}</h4>
                    </div>
                    <Badge variant="outline">{reward.points} pts</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Redeemed</span>
                      <span className="font-medium">{reward.redeemed}</span>
                    </div>
                    <Progress value={(reward.redeemed / 300) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active Campaigns</h3>
            <Button>Create Campaign</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Double Points Weekend
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Earn 2x points on all purchases during weekends
                </p>
                <div className="flex justify-between text-sm">
                  <span>Participants: 1,247</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <Progress value={65} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  New Member Bonus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  100 bonus points for new loyalty program members
                </p>
                <div className="flex justify-between text-sm">
                  <span>New Signups: 89</span>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <Progress value={45} className="h-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};