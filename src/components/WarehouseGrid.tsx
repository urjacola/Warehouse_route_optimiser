import React from 'react';
import { WarehouseState, Position, Task } from '../types/warehouse';
import { Truck, Package, Target, Zap, AlertTriangle } from 'lucide-react';

interface WarehouseGridProps {
  state: WarehouseState;
  cellSize: number;
  onCellClick?: (position: Position) => void;
  highlightForklift?: string;
  highlightTask?: Task | null;
}

export const WarehouseGrid: React.FC<WarehouseGridProps> = ({ 
  state, 
  cellSize, 
  onCellClick,
  highlightForklift,
  highlightTask
}) => {
  const { grid, forklifts, tasks, emergencyAlerts } = state;
  
  const getCellColor = (cell: any, x: number, y: number): string => {
    // Check if this cell is part of the highlighted forklift's path
    if (highlightForklift) {
      const highlightedForklift = forklifts.find(f => f.id === highlightForklift);
      if (highlightedForklift && highlightedForklift.path.some(pos => pos.x === x && pos.y === y)) {
        return 'bg-blue-400 border-blue-500 animate-pulse'; // Route path squares
      }
    }
    
    // Check if this cell is part of the highlighted task
    if (highlightTask) {
      if (highlightTask.pickupLocation.x === x && highlightTask.pickupLocation.y === y) {
        return 'bg-green-500 border-green-600 ring-4 ring-green-300'; // Highlighted pickup
      }
      if (highlightTask.dropoffLocation.x === x && highlightTask.dropoffLocation.y === y) {
        return 'bg-purple-500 border-purple-600 ring-4 ring-purple-300'; // Highlighted dropoff
      }
    }
    
    // Check if any forklift is at this position
    const forkliftAtPosition = forklifts.find(f => f.position.x === x && f.position.y === y);
    if (forkliftAtPosition) {
      if (highlightForklift && forkliftAtPosition.id === highlightForklift) {
        return 'bg-blue-600 border-blue-700 ring-2 ring-blue-300'; // Highlighted forklift
      }
      if (forkliftAtPosition.status === 'stuck' || forkliftAtPosition.status === 'emergency') {
        return 'bg-red-500 border-red-600'; // Emergency/stuck forklift
      }
      return 'bg-blue-500 border-blue-600'; // Normal forklift
    }
    
    // Check if this is a task location
    const isPickupLocation = tasks.some(task => 
      task.pickupLocation.x === x && task.pickupLocation.y === y && 
      task.status !== 'completed' && 
      (!highlightTask || task.id !== highlightTask.id)
    );
    const isDropoffLocation = tasks.some(task => 
      task.dropoffLocation.x === x && task.dropoffLocation.y === y && 
      task.status !== 'completed' && 
      (!highlightTask || task.id !== highlightTask.id)
    );
    
    if (isPickupLocation) return 'bg-green-400 border-green-500';
    if (isDropoffLocation) return 'bg-purple-400 border-purple-500';
    
    // Check for receiving and shipping areas
    if (cell.type === 'receiving') return 'bg-orange-300 border-orange-400';
    if (cell.type === 'shipping') return 'bg-cyan-300 border-cyan-400';
    
    // Check for emergency alerts at this position
    const hasEmergencyAlert = emergencyAlerts.some(alert => 
      !alert.resolved && alert.position.x === x && alert.position.y === y
    );
    if (hasEmergencyAlert) return 'bg-red-300 border-red-400';
    
    switch (cell.type) {
      case 'obstacle':
        return 'bg-gray-800 border-gray-900';
      case 'shelf':
        return cell.occupied ? 'bg-yellow-400 border-yellow-500' : 'bg-yellow-200 border-yellow-300';
      case 'docking':
        return 'bg-blue-100 border-blue-200';
      case 'charging':
        return 'bg-green-100 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200'; // Light gray for movement areas
    }
  };
  
  const getCellIcon = (cell: any, x: number, y: number) => {
    // Check if this cell is part of the highlighted task
    if (highlightTask) {
      if (highlightTask.pickupLocation.x === x && highlightTask.pickupLocation.y === y) {
        return <Package className="w-4 h-4 text-white animate-pulse" />;
      }
      if (highlightTask.dropoffLocation.x === x && highlightTask.dropoffLocation.y === y) {
        return <Target className="w-4 h-4 text-white animate-pulse" />;
      }
    }
    
    const forkliftAtPosition = forklifts.find(f => f.position.x === x && f.position.y === y);
    if (forkliftAtPosition) {
      if (highlightForklift && forkliftAtPosition.id === highlightForklift) {
        return <Truck className="w-4 h-4 text-white animate-pulse" />;
      }
      if (forkliftAtPosition.status === 'stuck' || forkliftAtPosition.status === 'emergency') {
        return <AlertTriangle className="w-4 h-4 text-white" />;
      }
      return <Truck className="w-4 h-4 text-white" />;
    }
    
    const isPickupLocation = tasks.some(task => 
      task.pickupLocation.x === x && task.pickupLocation.y === y && 
      task.status !== 'completed' && 
      (!highlightTask || task.id !== highlightTask.id)
    );
    const isDropoffLocation = tasks.some(task => 
      task.dropoffLocation.x === x && task.dropoffLocation.y === y && 
      task.status !== 'completed' && 
      (!highlightTask || task.id !== highlightTask.id)
    );
    
    if (isPickupLocation) return <Package className="w-3 h-3 text-white" />;
    if (isDropoffLocation) return <Target className="w-3 h-3 text-white" />;
    
    if (cell.type === 'receiving') return <Package className="w-3 h-3 text-orange-700" />;
    if (cell.type === 'shipping') return <Target className="w-3 h-3 text-cyan-700" />;
    
    if (cell.type === 'charging') {
      return <Zap className="w-3 h-3 text-green-600" />;
    }
    
    return null;
  };
  
  const renderPaths = () => {
    return (
      <svg
        className="absolute inset-0 pointer-events-none z-10"
        width={grid[0].length * cellSize}
        height={grid.length * cellSize}
      >
        {forklifts.map((forklift, forkliftIndex) => {
          if (forklift.path.length === 0) return null;
          
          const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
          let color = colors[forkliftIndex % colors.length];
          
          // Highlight the specific forklift's path
          if (highlightForklift && forklift.id === highlightForklift) {
            color = '#1D4ED8'; // Darker blue for highlighted forklift
            
            // Render highlighted path with connecting lines only (squares are handled by getCellColor)
            return (
              <g key={forklift.id}>
                {/* Render connecting lines */}
                {forklift.path.map((pos, index) => {
                  if (index === 0) return null;
                  
                  const prevPos = forklift.path[index - 1];
                  const startX = prevPos.x * cellSize + cellSize / 2;
                  const startY = prevPos.y * cellSize + cellSize / 2;
                  const endX = pos.x * cellSize + cellSize / 2;
                  const endY = pos.y * cellSize + cellSize / 2;
                  
                  return (
                    <line
                      key={`${forklift.id}-line-${index}`}
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke={color}
                      strokeWidth="4"
                      strokeDasharray="6,6"
                      opacity="0.8"
                      className="animate-pulse"
                    />
                  );
                })}
                
                {/* Show current target with a pulsing circle */}
                {forklift.path.length > 0 && (
                  <circle
                    cx={forklift.path[forklift.path.length - 1].x * cellSize + cellSize / 2}
                    cy={forklift.path[forklift.path.length - 1].y * cellSize + cellSize / 2}
                    r="10"
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeDasharray="4,4"
                    className="animate-pulse"
                  />
                )}
              </g>
            );
          }
          
          return (
            <g key={forklift.id}>
              {forklift.path.map((pos, index) => {
                if (index === 0) return null;
                
                const prevPos = forklift.path[index - 1];
                const startX = prevPos.x * cellSize + cellSize / 2;
                const startY = prevPos.y * cellSize + cellSize / 2;
                const endX = pos.x * cellSize + cellSize / 2;
                const endY = pos.y * cellSize + cellSize / 2;
                
                return (
                  <line
                    key={`${forklift.id}-${index}`}
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray="3,3"
                    opacity="0.5"
                  />
                );
              })}
              
              {/* Show current target with a circle */}
              {forklift.path.length > 0 && (
                <circle
                  cx={forklift.path[forklift.path.length - 1].x * cellSize + cellSize / 2}
                  cy={forklift.path[forklift.path.length - 1].y * cellSize + cellSize / 2}
                  r="6"
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeDasharray="2,2"
                  opacity="0.7"
                />
              )}
            </g>
          );
        })}
      </svg>
    );
  };
  
  const getForkliftLabel = (x: number, y: number): string | null => {
    const forklift = forklifts.find(f => f.position.x === x && f.position.y === y);
    return forklift ? forklift.id.split('-')[1] : null;
  };
  
  return (
    <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
      {renderPaths()}
      <div 
        className="grid gap-[1px] bg-gray-300 p-2"
        style={{
          gridTemplateColumns: `repeat(${grid[0].length}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${grid.length}, ${cellSize}px)`
        }}
      >
        {grid.map((row, y) =>
          row.map((cell, x) => {
            const forkliftLabel = getForkliftLabel(x, y);
            
            return (
              <div
                key={`${x}-${y}`}
                className={`
                  ${getCellColor(cell, x, y)} 
                  border-2
                  flex items-center justify-center 
                  cursor-pointer hover:opacity-80 transition-all duration-200
                  relative z-20
                `}
                style={{ width: cellSize, height: cellSize }}
                onClick={() => onCellClick && onCellClick({ x, y })}
                title={`(${x}, ${y}) - ${cell.type}${forkliftLabel ? ` - Forklift ${forkliftLabel}` : ''}`}
              >
                {getCellIcon(cell, x, y)}
                {forkliftLabel && (
                  <span className="absolute -bottom-1 -right-1 text-xs font-bold text-white bg-black bg-opacity-50 rounded px-1">
                    {forkliftLabel}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Status indicators */}
      <div className="absolute top-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs space-y-1">
        <div className="font-medium">Active Forklifts: {forklifts.length}</div>
        <div className="text-green-600">
          Moving: {forklifts.filter(f => f.status === 'moving').length}
        </div>
        <div className="text-gray-600">
          Idle: {forklifts.filter(f => f.status === 'idle').length}
        </div>
        {forklifts.filter(f => f.status === 'stuck' || f.status === 'emergency').length > 0 && (
          <div className="text-red-600 font-medium">
            Emergency: {forklifts.filter(f => f.status === 'stuck' || f.status === 'emergency').length}
          </div>
        )}
      </div>
      
      {/* Emergency alerts */}
      {emergencyAlerts.filter(alert => !alert.resolved).length > 0 && (
        <div className="absolute top-2 right-2 bg-red-100 border border-red-300 px-2 py-1 rounded text-xs">
          <div className="flex items-center text-red-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {emergencyAlerts.filter(alert => !alert.resolved).length} Alert(s)
          </div>
        </div>
      )}
    </div>
  );
};