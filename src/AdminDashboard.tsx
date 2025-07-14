import React from 'react';
import { WarehouseGrid } from './WarehouseGrid';
import { MetricsDashboard } from './MetricsDashboard';
import { ControlPanel } from './ControlPanel';
import { ManualTaskCreator } from './ManualTaskCreator';
import { ForkliftManager } from './ForkliftManager';
import { useWarehouseSimulation } from '../hooks/useWarehouseSimulation';
import { useAuth } from '../contexts/AuthContext';
import { Truck, Brain, TrendingUp, Users, Shield, LogOut, Monitor } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    state,
    config,
    isRunning,
    isPaused,
    totalTime,
    startSimulation,
    stopSimulation,
    resetSimulation,
    setConfig,
    addRandomTask,
    addManualTask,
    addObstacle,
    addShelf,
    removeShelf
  } = useWarehouseSimulation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-purple-100 text-sm">Fleet Management & System Overview</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{state.forklifts.filter(f => f.isLoggedIn).length}/{state.forklifts.length} Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Safety Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4" />
                  <span>AI Optimizing</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm">Welcome, {user?.name}</span>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 bg-purple-500 hover:bg-purple-600 px-3 py-1 rounded-lg transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="xl:col-span-1 order-3 xl:order-1">
            <ControlPanel
              config={config}
              isRunning={isRunning}
              onStart={startSimulation}
              onStop={stopSimulation}
              onReset={resetSimulation}
              onConfigChange={setConfig}
              onAddTask={addRandomTask}
              onAddObstacle={() => addObstacle({ x: 10, y: 8 })}
            />
          </div>
          
          {/* Warehouse Grid */}
          <div className="xl:col-span-2 order-1 xl:order-2">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-semibold">Live Warehouse View</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Forklifts</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                    <span>Pickup</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-purple-400 rounded"></div>
                    <span>Dropoff</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-orange-400 rounded"></div>
                    <span>Receiving</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-cyan-400 rounded"></div>
                    <span>Shipping</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Emergency</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center items-center">
                <div className="w-full max-w-none">
                  <WarehouseGrid
                    state={state}
                    cellSize={10}
                    onCellClick={(position) => {
                      // Right click to add shelf, left click to add obstacle
                      if (state.grid[position.y][position.x].type === 'empty') {
                        addShelf(position);
                      } else if (state.grid[position.y][position.x].type === 'shelf') {
                        removeShelf(position);
                      } else {
                        addObstacle(position);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-600">
                <p>Click on empty spaces to add shelves • Click on shelves to remove them • Click elsewhere to add obstacles</p>
              </div>
            </div>
          </div>
          
          {/* Metrics Dashboard */}
          <div className="xl:col-span-1 order-2 xl:order-3 space-y-4">
            <MetricsDashboard
              state={state}
              config={config}
              isRunning={isRunning}
              totalTime={totalTime}
            />
            
            {/* Manual Task Creation */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Create New Task</h3>
              <ManualTaskCreator onTaskCreate={addManualTask} />
            </div>
            
            {/* Forklift Management */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Fleet Management</h3>
              <ForkliftManager />
            </div>
          </div>
        </div>
        
        {/* Task Management */}
        <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Task Assignment Overview</h2>
          
          {/* Task Assignment Summary */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">{state.tasks.filter(t => t.status === 'pending').length}</div>
              <div className="text-sm text-blue-600">Pending Tasks</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-800">{state.tasks.filter(t => t.status === 'assigned' || t.status === 'in-progress').length}</div>
              <div className="text-sm text-yellow-600">In Progress</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-800">{state.tasks.filter(t => t.status === 'completed').length}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-800">{state.forklifts.filter(f => f.currentTask).length}</div>
              <div className="text-sm text-purple-600">Active Forklifts</div>
            </div>
          </div>
          
          {/* Active Tasks with Forklift Assignments */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Task Assignments</h3>
            {state.tasks.filter(task => task.status !== 'completed').map((task) => (
              <div key={task.id} className="bg-gray-50 p-4 rounded-lg border">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="font-medium text-gray-800">{task.id}</div>
                    <div className="text-sm text-gray-600">{task.taskType ? task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1) : 'Standard'} Task</div>
                    <div className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'carrying' || task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Material</div>
                    <div className="font-medium">{task.material.name}</div>
                    <div className="text-xs text-gray-500">{task.material.weight}kg - {task.material.priority} priority</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Route</div>
                    <div className="text-xs">
                      <div>From: ({task.pickupLocation.x}, {task.pickupLocation.y})</div>
                      <div>To: ({task.dropoffLocation.x}, {task.dropoffLocation.y})</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600">Assignment</div>
                    {task.assignedForklift ? (
                      <div>
                        <div className="font-medium text-blue-600">{task.assignedForklift}</div>
                        <div className="text-xs text-gray-500">
                          {state.forklifts.find(f => f.id === task.assignedForklift)?.operatorName || 'Unknown Operator'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">Unassigned</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {state.tasks.filter(task => task.status !== 'completed').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};