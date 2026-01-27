'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  FileText,
  ArrowUp,
  ArrowDown,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Trophy,
  Star,
  Briefcase,
  Calendar,
  Target,
  Zap,
  Award,
  TrendingDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// TODO: Backend integration - Fetch analytics from smart contracts
export default function AnalyticsPage() {
  const [timeRange] = useState('7d');

  const stats = [
    {
      title: 'Total Escrow Volume',
      value: '$845,420',
      change: '+23.5%',
      trend: 'up',
      icon: DollarSign,
      description: 'All-time platform volume',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Active Projects',
      value: '142',
      change: '+18',
      trend: 'up',
      icon: Briefcase,
      description: 'Currently in progress',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      title: 'Happy Freelancers',
      value: '1,847',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      description: 'Verified professionals',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Success Rate',
      value: '98.4%',
      change: '+2.1%',
      trend: 'up',
      icon: Trophy,
      description: 'Completed without disputes',
      color: 'from-orange-500 to-red-600',
    },
  ];

  const topFreelancers = [
    { name: 'Sarah Chen', initials: 'SC', earnings: '$45,230', projects: 28, rating: 4.9, specialty: 'Full-Stack Dev', growth: '+15%' },
    { name: 'Alex Kumar', initials: 'AK', earnings: '$38,940', projects: 42, rating: 4.8, specialty: 'UI/UX Design', growth: '+22%' },
    { name: 'Maria Garcia', initials: 'MG', earnings: '$32,100', projects: 19, rating: 5.0, specialty: 'Blockchain Dev', growth: '+31%' },
    { name: 'James Wilson', initials: 'JW', earnings: '$28,750', projects: 35, rating: 4.7, specialty: 'Smart Contracts', growth: '+8%' },
    { name: 'Li Wei', initials: 'LW', earnings: '$25,630', projects: 24, rating: 4.9, specialty: 'Data Science', growth: '+18%' },
  ];

  const topCompanies = [
    { name: 'TechCorp Inc.', initials: 'TC', spent: '$125,420', projects: 15, rating: 4.9, industry: 'SaaS' },
    { name: 'StartupXYZ', initials: 'SX', spent: '$98,340', projects: 22, rating: 4.8, industry: 'DeFi' },
    { name: 'CryptoVentures', initials: 'CV', spent: '$87,200', projects: 12, rating: 5.0, industry: 'Web3' },
    { name: 'DesignHub Co.', initials: 'DH', spent: '$76,850', projects: 28, rating: 4.7, industry: 'Creative' },
  ];

  const recentMilestones = [
    { 
      project: 'E-Commerce Platform Redesign', 
      freelancer: 'Sarah Chen',
      company: 'TechCorp Inc.',
      amount: '$12,500', 
      status: 'completed',
      time: '2 hours ago',
      milestone: 'Final Deployment',
      progress: 100
    },
    { 
      project: 'DeFi Smart Contract Audit', 
      freelancer: 'James Wilson',
      company: 'CryptoVentures',
      amount: '$8,200', 
      status: 'in-review',
      time: '5 hours ago',
      milestone: 'Security Review',
      progress: 85
    },
    { 
      project: 'Mobile App UI/UX Design', 
      freelancer: 'Alex Kumar',
      company: 'StartupXYZ',
      amount: '$6,750', 
      status: 'in-progress',
      time: '1 day ago',
      milestone: 'Prototype Phase 2',
      progress: 60
    },
    { 
      project: 'Data Analytics Dashboard', 
      freelancer: 'Li Wei',
      company: 'DesignHub Co.',
      amount: '$9,400', 
      status: 'pending',
      time: '2 days ago',
      milestone: 'Data Integration',
      progress: 40
    },
  ];

  const weeklyData = [
    { day: 'Mon', volume: 45000, projects: 12 },
    { day: 'Tue', volume: 52000, projects: 15 },
    { day: 'Wed', volume: 48000, projects: 11 },
    { day: 'Thu', volume: 61000, projects: 18 },
    { day: 'Fri', volume: 55000, projects: 14 },
    { day: 'Sat', volume: 38000, projects: 8 },
    { day: 'Sun', volume: 42000, projects: 9 },
  ];

  const maxVolume = Math.max(...weeklyData.map(d => d.volume));

  return (
    <div className="flex flex-col gap-6 p-8 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Platform Analytics
            </h1>
            <p className="text-muted-foreground mt-2">Real-time insights from blockchain escrow transactions</p>
          </div>
          <Badge variant="outline" className="text-sm px-4 py-2">
            <Activity className="w-4 h-4 mr-2" />
            Live Data
          </Badge>
        </div>
      </motion.div>

      {/* Stats Grid with Gradient Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="relative overflow-hidden border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-5",
                  stat.color
                )} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br",
                    stat.color
                  )}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-xs">
                      {stat.trend === 'up' ? (
                        <ArrowUp className="mr-1 h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDown className="mr-1 h-3 w-3 text-red-500" />
                      )}
                      <span className={stat.trend === 'up' ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                        {stat.change}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{stat.description}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Weekly Volume Chart - Larger */}
        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Weekly Transaction Volume
                  </CardTitle>
                  <CardDescription>Escrow volume trends over the past 7 days</CardDescription>
                </div>
                <Badge variant="secondary">Last 7 days</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyData.map((day, index) => (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium w-12">{day.day}</span>
                      <span className="text-muted-foreground">{day.projects} projects</span>
                      <span className="font-bold text-primary">${(day.volume / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="relative h-8 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.volume / maxVolume) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-end pr-3"
                      >
                        <span className="text-xs font-bold text-white">
                          {Math.round((day.volume / maxVolume) * 100)}%
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Status Overview */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Project Status
              </CardTitle>
              <CardDescription>Current project distribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { label: 'Completed', value: 68, count: 96, color: 'bg-green-500', icon: CheckCircle2 },
                  { label: 'In Progress', value: 22, count: 31, color: 'bg-blue-500', icon: Clock },
                  { label: 'In Review', value: 7, count: 10, color: 'bg-yellow-500', icon: AlertCircle },
                  { label: 'Pending', value: 3, count: 5, color: 'bg-gray-500', icon: FileText },
                ].map((status, index) => {
                  const Icon = status.icon;
                  return (
                    <motion.div
                      key={status.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", status.color.replace('bg-', 'text-'))} />
                          <span className="text-sm font-medium">{status.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{status.count}</span>
                          <span className="text-sm font-bold">{status.value}%</span>
                        </div>
                      </div>
                      <Progress value={status.value} className="h-2" />
                    </motion.div>
                  );
                })}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <div className="text-2xl font-bold text-green-600">$245k</div>
                  <div className="text-xs text-muted-foreground">Released</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-600">$178k</div>
                  <div className="text-xs text-muted-foreground">In Escrow</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Leaderboards Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Freelancers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Performing Freelancers
                </CardTitle>
                <Badge variant="outline" className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
                  This Month
                </Badge>
              </div>
              <CardDescription>Highest earners and project completions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topFreelancers.map((freelancer, index) => (
                  <motion.div
                    key={freelancer.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-semibold">
                        {freelancer.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{freelancer.name}</span>
                        {index === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{freelancer.specialty}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{freelancer.earnings}</div>
                      <div className="text-xs text-muted-foreground">{freelancer.projects} projects</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-semibold">{freelancer.rating}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                        {freelancer.growth}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Companies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-500" />
                  Top Hiring Companies
                </CardTitle>
                <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  Most Active
                </Badge>
              </div>
              <CardDescription>Companies with highest project volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCompanies.map((company, index) => (
                  <motion.div
                    key={company.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-semibold">
                        {company.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{company.name}</span>
                        {index === 0 && <Zap className="h-4 w-4 text-blue-500" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{company.industry}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{company.spent}</div>
                      <div className="text-xs text-muted-foreground">{company.projects} projects</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-semibold">{company.rating}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Milestones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Recent Project Milestones
                </CardTitle>
                <CardDescription>Latest milestone updates across all projects</CardDescription>
              </div>
              <Badge variant="outline" className="bg-gradient-to-r from-orange-500/10 to-red-500/10">
                Live Updates
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMilestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    milestone.status === 'completed' ? 'bg-green-500/10' :
                    milestone.status === 'in-review' ? 'bg-yellow-500/10' :
                    milestone.status === 'in-progress' ? 'bg-blue-500/10' :
                    'bg-gray-500/10'
                  )}>
                    {milestone.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> :
                     milestone.status === 'in-review' ? <AlertCircle className="h-5 w-5 text-yellow-500" /> :
                     milestone.status === 'in-progress' ? <Clock className="h-5 w-5 text-blue-500" /> :
                     <FileText className="h-5 w-5 text-gray-500" />}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{milestone.project}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <span>{milestone.freelancer}</span>
                          <span>→</span>
                          <span>{milestone.company}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-primary">{milestone.amount}</div>
                        <div className="text-xs text-muted-foreground">{milestone.time}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        milestone.status === 'completed' ? 'default' :
                        milestone.status === 'in-review' ? 'secondary' :
                        milestone.status === 'in-progress' ? 'outline' :
                        'secondary'
                      }>
                        {milestone.milestone}
                      </Badge>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform Health Indicators */}
      <div className="grid gap-6 md:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="border-2 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Dispute Resolution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">24hrs</div>
              <div className="text-xs text-muted-foreground mt-1">Average resolution time</div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                  <div className="h-full w-[95%] bg-green-500" />
                </div>
                <span className="text-xs font-semibold">95%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.75 }}
        >
          <Card className="border-2 bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4 text-blue-500" />
                Smart Contract Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">100%</div>
              <div className="text-xs text-muted-foreground mt-1">Audited & verified</div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                  <div className="h-full w-full bg-blue-500" />
                </div>
                <span className="text-xs font-semibold">✓</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="border-2 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                Platform Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">+45%</div>
              <div className="text-xs text-muted-foreground mt-1">Month over month</div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                  <div className="h-full w-[85%] bg-purple-500" />
                </div>
                <ArrowUp className="h-4 w-4 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
