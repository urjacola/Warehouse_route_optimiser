import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWarehouseSimulation } from '../hooks/useWarehouseSimulation';
import { WarehouseGrid } from './WarehouseGrid';
import { Truck, Package, Target, Fuel, Battery, LogOut, AlertTriangle, CheckCircle, Clock, Weight, Play, Pause, Navigation, MapPin, Map } from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { state, totalTime, acceptTask, completeCurrentStep } = useWarehouseSimulation();
  
  const myForklift = state.forklifts.find(f => f.id === user?.forkliftId);
  const myTasks = state.tasks.filter(task => task.assignedForklift === user?.forkliftId);
  const currentTask = myTasks.find(task => task.status === 'in-progress' || task.status === 'carrying' || task.status === 'assigned');
  const completedTasks = myTasks.filter(task => task.status === 'completed');
  const myAlerts = state.emergencyAlerts.filter(alert => alert.forkliftId === user?.forkliftId && !alert.resolved);
  
  // Available tasks that this forklift can handle
  const availableTasks = state.tasks.filter(task => 
    task.status === 'pending' && 
    !task.assignedForklift &&
    myForklift && 
    (myForklift.currentLoad + task.material.weight) <= myForklift.capacity
  );

  if (!myForklift) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Forklift Not Found</h2>
          <p className="text-gray-500">Unable to locate your assigned forklift.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-gray-100 text-gray-800';
      case 'moving': return 'bg-blue-100 text-blue-800';
      case 'carrying': return 'bg-green-100 text-green-800';
      case 'picking': return 'bg-yellow-100 text-yellow-800';
      case 'dropping': return 'bg-purple-100 text-purple-800';
      case 'stuck': case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return <Clock className="w-4 h-4" />;
      case 'moving': return <Truck className="w-4 h-4" />;
      case 'carrying': return <Package className="w-4 h-4" />;
      case 'picking': return <Target className="w-4 h-4" />;
      case 'dropping': return <CheckCircle className="w-4 h-4" />;
      case 'stuck': case 'emergency': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleAcceptTask = (taskId: string) => {
    acceptTask(taskId, myForklift.id);
  };

  const handleNextStep = () => {
    completeCurrentStep(myForklift.id);
  };

  const getTaskTypeLabel = (task: any) => {
    if (task.taskType === 'inbound') {
      return 'Inbound: Receiving → Shelf';
    } else if (task.taskType === 'outbound') {
      return 'Outbound: Shelf → Shipping';
    } else if (task.taskType === 'internal') {
      return 'Internal: Shelf → Shelf';
    }
    return 'Standard Task';
  };

  const getLocationTypeLabel = (location: any, isPickup: boolean) => {
    if (location.type === 'receiving') return 'Receiving Area';
    if (location.type === 'shipping') return 'Shipping Area';
    if (location.type === 'shelf') return `Shelf ${location.shelfId || ''}`;
    return isPickup ? 'Pickup' : 'Dropoff';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Operator Dashboard</h1>
                <p className="text-blue-100 text-sm">Forklift {myForklift.id} - {user?.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(myForklift.status)}`}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(myForklift.status)}
                  <span className="capitalize">{myForklift.status}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6">
        {/* Emergency Alerts */}
        {myAlerts.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Emergency Alerts
            </h3>
            <div className="space-y-2">
              {myAlerts.map(alert => (
                <div key={alert.id} className="bg-white p-3 rounded border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-red-800">{alert.type.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm text-red-600">{alert.message}</div>
                    </div>
                    <div className="text-xs text-red-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Forklift Status */}
          <div className="xl:col-span-1 order-2 xl:order-1 space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">Forklift Status</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Position</span>
                  </div>
                  <span className="text-gray-600">({myForklift.position.x}, {myForklift.position.y})</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Fuel className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Fuel Level</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${myForklift.fuelLevel > 50 ? 'bg-green-500' : myForklift.fuelLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${myForklift.fuelLevel}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{myForklift.fuelLevel.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Battery className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Battery</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${myForklift.batteryLevel > 50 ? 'bg-green-500' : myForklift.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${myForklift.batteryLevel}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{myForklift.batteryLevel.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Weight className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Load</span>
                  </div>
                  <span className="text-gray-600">{myForklift.currentLoad}kg / {myForklift.capacity}kg</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Tasks Completed</span>
                  </div>
                  <span className="text-gray-600">{myForklift.tasksCompleted}</span>
                </div>
              </div>
            </div>

            {/* Current Task & Controls */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Current Assignment</h2>
              
              {currentTask ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <h3 className="font-semibold text-blue-800">{currentTask.id}</h3>
                      <p className="text-sm text-blue-600">{getTaskTypeLabel(currentTask)}</p>
                      <p className="text-xs text-blue-500">Material: {currentTask.material.name}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentTask.status)}`}>
                      {currentTask.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">Pickup Location</span>
                      </div>
                      <p className="text-green-700">
                        {getLocationTypeLabel(currentTask.pickupLocation, true)} - ({currentTask.pickupLocation.x}, {currentTask.pickupLocation.y})
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-800">Dropoff Location</span>
                      </div>
                      <p className="text-purple-700">
                        {getLocationTypeLabel(currentTask.dropoffLocation, false)} - ({currentTask.dropoffLocation.x}, {currentTask.dropoffLocation.y})
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Weight:</span>
                      <p className="font-medium">{currentTask.material.weight}kg</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Priority:</span>
                      <p className="font-medium capitalize">{currentTask.material.priority}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Fragile:</span>
                      <p className="font-medium">{currentTask.material.fragile ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Est. Time:</span>
                      <p className="font-medium">{currentTask.estimatedTime.toFixed(1)}s</p>
                    </div>
                  </div>

                  {/* Route Progress */}
                  {myForklift.path.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Route Progress</h4>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.max(0, 100 - (myForklift.path.length / 10) * 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{myForklift.path.length} steps remaining</span>
                      </div>
                      
                      {/* Next Step Control */}
                      <button
                        onClick={handleNextStep}
                        disabled={myForklift.path.length === 0}
                        className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg transition-colors w-full justify-center text-sm"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Move to Next Position</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-700">No Active Task</h3>
                  <p className="text-gray-500 mb-4">Select a task from available assignments below</p>
                </div>
              )}
            </div>
          </div>

          {/* Warehouse Map - Centered */}
          <div className="xl:col-span-2 order-1 xl:order-2 space-y-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center">
                  <Map className="w-5 h-5 mr-2" />
                  Warehouse Navigation
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    <span>Your Forklift</span>
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
                    <div className="w-3 h-3 bg-green-200 rounded"></div>
                    <span>Charging</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center items-center mb-4">
                <div className="w-full">
                  <WarehouseGrid
                    state={state}
                    cellSize={10}
                    highlightForklift={myForklift.id}
                    highlightTask={currentTask}
                  />
                </div>
              </div>
              
              {/* Move to Next Position Button - Below Map */}
              {currentTask && myForklift.path.length > 0 && (
                <div className="flex justify-center">
                  <button
                    onClick={handleNextStep}
                    disabled={myForklift.path.length === 0}
                    className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors text-sm font-medium"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Move to Next Position ({myForklift.path.length - 1} steps remaining)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Available Tasks */}
          </div>

          {/* Available Tasks - Right Side */}
          <div className="xl:col-span-1 order-3 xl:order-3 space-y-4">
            {!currentTask && availableTasks.length > 0 ? (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Available Tasks</h2>
                <div className="space-y-4">
                  {availableTasks.slice(0, 6).map(task => (
                    <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-500">{task.id}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.material.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.material.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.material.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.material.priority}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="font-medium text-blue-600">{getTaskTypeLabel(task)}</div>
                        <div>Material: {task.material.name}</div>
                        <div>Weight: {task.material.weight}kg</div>
                        <div>From: {getLocationTypeLabel(task.pickupLocation, true)}</div>
                        <div>To: {getLocationTypeLabel(task.dropoffLocation, false)}</div>
                        <div>Est. Time: {task.estimatedTime.toFixed(1)}s</div>
                      </div>
                      
                      <button
                        onClick={() => handleAcceptTask(task.id)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Accept Task</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Task Status</h2>
                <div className="text-center py-8">
                  {currentTask ? (
                    <div>
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-700">Task In Progress</h3>
                      <p className="text-gray-500">Working on {currentTask.id}</p>
                    </div>
                  ) : (
                    <div>
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-700">No Available Tasks</h3>
                      <p className="text-gray-500">Waiting for new assignments</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>
          
          {completedTasks.length > 0 ? (
            <div className="space-y-3">
              {completedTasks.slice(-8).map(task => (
                <div key={task.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-green-800">{task.id}</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">
                        {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-green-700 space-y-1">
                    <div>{getTaskTypeLabel(task)}</div>
                    <div>Material: {task.material.name}</div>
                    <div>Weight: {task.material.weight}kg</div>
                    <div className="flex justify-between">
                      <span>Listed: {new Date(task.createdAt).toLocaleTimeString()}</span>
                      <span>Accepted: {task.assignedAt ? new Date(task.assignedAt).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                    <div>Duration: {task.actualTime?.toFixed(1)}s</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No completed tasks yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};