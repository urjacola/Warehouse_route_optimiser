import React from 'react';
import { WarehouseState, SimulationConfig } from '../types/warehouse';
import { Clock, Fuel, CheckCircle, Target, TrendingUp, Zap, AlertTriangle, Users, Shield } from 'lucide-react';

interface MetricsDashboardProps {
  state: WarehouseState;
  config: SimulationConfig;
  isRunning: boolean;
  totalTime: number;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  state,
  config,
  isRunning,
  totalTime
}) => {
  const { forklifts, tasks, metrics, emergencyAlerts } = state;
  
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  const averageTimePerTask = completedTasks > 0 ? totalTime / completedTasks : 0;
  const totalDistance = forklifts.reduce((sum, f) => sum + f.totalDistance, 0);
  const fuelEfficiency = totalDistance > 0 ? (completedTasks / totalDistance) * 100 : 0;
  const activeAlerts = emergencyAlerts.filter(alert => !alert.resolved).length;
  const averageFuelLevel = forklifts.reduce((sum, f) => sum + f.fuelLevel, 0) / forklifts.length;
  
  const MetricCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    unit?: string;
    color: string;
    alert?: boolean;
  }> = ({ icon, title, value, unit, color, alert }) => (
    <div className={`bg-white p-4 rounded-lg shadow-md border-2 ${alert ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${alert ? 'text-red-800' : 'text-gray-800'}`}>
            {typeof value === 'number' ? value.toFixed(1) : value}
            {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
          </div>
          <div className={`text-sm ${alert ? 'text-red-600' : 'text-gray-600'}`}>{title}</div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Fleet Dashboard</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isRunning ? 'Running' : 'Stopped'}
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <MetricCard
          icon={<Users className="w-5 h-5 text-white" />}
          title="Active Forklifts"
          value={forklifts.length}
          color="bg-blue-500"
        />
        
        <MetricCard
          icon={<CheckCircle className="w-5 h-5 text-white" />}
          title="Tasks Completed"
          value={completedTasks}
          color="bg-green-500"
        />
        
        <MetricCard
          icon={<Target className="w-5 h-5 text-white" />}
          title="Completion Rate"
          value={completionRate}
          unit="%"
          color="bg-blue-500"
        />
        
        <MetricCard
          icon={<Clock className="w-5 h-5 text-white" />}
          title="Avg Time/Task"
          value={averageTimePerTask}
          unit="sec"
          color="bg-purple-500"
        />
        
        <MetricCard
          icon={<Fuel className="w-5 h-5 text-white" />}
          title="Avg Fuel Level"
          value={averageFuelLevel}
          unit="%"
          color={averageFuelLevel < 20 ? "bg-red-500" : "bg-yellow-500"}
          alert={averageFuelLevel < 20}
        />
        
        <MetricCard
          icon={<AlertTriangle className="w-5 h-5 text-white" />}
          title="Active Alerts"
          value={activeAlerts}
          color={activeAlerts > 0 ? "bg-red-500" : "bg-gray-500"}
          alert={activeAlerts > 0}
        />
      </div>
      
      {/* Fleet Status */}
      <div className="space-y-4 mb-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Fleet Status
          </h3>
          <div className="space-y-3">
            {forklifts.map((forklift) => (
              <div key={forklift.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    forklift.status === 'idle' ? 'bg-gray-400' :
                    forklift.status === 'moving' ? 'bg-blue-500' :
                    forklift.status === 'stuck' || forklift.status === 'emergency' ? 'bg-red-500' :
                    'bg-green-500'
                  }`} />
                  <span className="font-medium text-sm">{forklift.id}</span>
                </div>
                <div className="text-right text-xs">
                  <div className={`capitalize font-medium ${
                    forklift.status === 'stuck' || forklift.status === 'emergency' ? 'text-red-600' :
                    forklift.status === 'moving' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {forklift.status}
                  </div>
                  <div className="text-gray-500">
                    Fuel: {forklift.fuelLevel.toFixed(0)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Safety Status
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Collision Avoidance:</span>
              <span className={`font-medium ${config.collisionAvoidance ? 'text-green-600' : 'text-red-600'}`}>
                {config.collisionAvoidance ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Emergency Response:</span>
              <span className={`font-medium ${config.emergencyResponse ? 'text-green-600' : 'text-red-600'}`}>
                {config.emergencyResponse ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Collisions:</span>
              <span className="font-medium">{metrics.collisionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blocked Paths:</span>
              <span className="font-medium">{metrics.blockedPaths}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Emergency Alerts */}
      {activeAlerts > 0 && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-red-800 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Emergency Alerts
          </h3>
          <div className="space-y-2">
            {emergencyAlerts.filter(alert => !alert.resolved).slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border border-red-200">
                <div>
                  <div className="font-medium text-red-800">{alert.type.replace('_', ' ').toUpperCase()}</div>
                  <div className="text-sm text-red-600">{alert.message}</div>
                </div>
                <div className="text-xs text-red-500">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Performance Metrics */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Performance Metrics</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Distance:</span>
            <span className="font-medium">{totalDistance.toFixed(1)} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Efficiency:</span>
            <span className="font-medium">{fuelEfficiency.toFixed(2)} tasks/unit</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Simulation Time:</span>
            <span className="font-medium">{totalTime.toFixed(1)}s</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Learning Rate:</span>
            <span className="font-medium">{(config.learningRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};