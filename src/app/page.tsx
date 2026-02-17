'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Mock Data
const metrics = [
  { label: 'Total Projects', value: '12', trend: '+2', icon: TrendingUp, color: 'text-tech-green' },
  { label: 'Active Tasks', value: '48', trend: '+12%', icon: CheckCircle, color: 'text-tech-yellow' },
  { label: 'Team Members', value: '8', trend: 'Stable', icon: Users, color: 'text-blue-400' },
  { label: 'Critical Issues', value: '3', trend: '-1', icon: AlertCircle, color: 'text-tech-red' },
];

const recentActivity = [
  { id: 1, user: 'Dev Team', action: 'deployed to', target: 'Production', time: '2m ago' },
  { id: 2, user: 'Sarah K.', action: 'fixed bug in', target: 'Auth Module', time: '15m ago' },
  { id: 3, user: 'System', action: 'automated backup', target: 'completed', time: '1h ago' },
];

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Hero / Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-white mb-1">
            Command Center
          </h1>
          <p className="text-gray-400 font-mono text-sm">
            SYSTEM_STATUS: <span className="text-tech-green">OPTIMAL</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="md">Export Logs</Button>
          <Button variant="primary" size="md">New Project</Button>
        </div>
      </div>

      {/* Metrics Grid (Bento-lite) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card variant="default" className="h-full flex flex-col justify-between group cursor-pointer hover:bg-white/10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 bg-white/5 rounded-none ${metric.color}`}>
                  <metric.icon size={20} />
                </div>
                <span className={`text-xs font-mono px-2 py-1 bg-white/5 ${metric.color}`}>
                  {metric.trend}
                </span>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-mono text-white mb-1 group-hover:text-tech-green transition-colors">
                  {metric.value}
                </h3>
                <p className="text-gray-400 text-xs uppercase tracking-wider">
                  {metric.label}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Main Chart / Project Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="outline" className="h-[400px] flex items-center justify-center relative">
            <div className="absolute top-4 left-4">
              <h3 className="text-sm font-bold uppercase text-gray-400">Project Velocity</h3>
            </div>
            <div className="text-center">
              {/* Fallback for chart */}
              <p className="text-gray-600 font-mono text-xs mb-2">
                [VISUALIZATION_MODULE_LOADING...]
              </p>
              <div className="w-64 h-1 bg-white/10 overflow-hidden mx-auto">
                <div className="h-full bg-tech-green w-1/3 animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </Card>
        </div>

        {/* Side Panel: Activity Feed & Quick Actions */}
        <div className="space-y-6">
          {/* Activity Feed */}
          <Card variant="glass" className="h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase text-white">Live Stream</h3>
              <MoreHorizontal size={16} className="text-gray-500 hover:text-white cursor-pointer" />
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="flex items-start gap-3 pb-4 border-b border-white/5 last:border-0"
                >
                  <div className="w-1.5 h-1.5 mt-2 bg-tech-green rounded-full shadow-[0_0_10px_rgba(169,239,47,0.5)]" />
                  <div>
                    <p className="text-sm text-gray-300">
                      <span className="text-white font-bold hover:text-tech-green cursor-pointer transition-colors">
                        {activity.user}
                      </span>{' '}
                      {activity.action}{' '}
                      <span className="text-white font-mono text-xs bg-white/10 px-1">
                        {activity.target}
                      </span>
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
