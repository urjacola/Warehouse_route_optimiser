import { useState, useEffect, useCallback, useRef } from 'react';
import { WarehouseState, Forklift, Task, SimulationConfig, Position, EmergencyAlert } from '../types/warehouse';
import { generateWarehouseGrid, generateRandomTasks, generateMultipleForklifts, calculateDistance, detectCollision, isForkliftStuck, canForkliftCarryMaterial } from '../utils/warehouseGenerator';
import { findPath, findAlternatePath } from '../utils/pathfinding';
import { useQLearning } from './useQLearning';

const GRID_WIDTH = 42;
const GRID_HEIGHT = 30;

export const useWarehouseSimulation = () => {
  const [state, setState] = useState<WarehouseState>(() => {
    const grid = generateWarehouseGrid(GRID_WIDTH, GRID_HEIGHT, false);
    const initialTasks = generateRandomTasks(12, grid);
    const forklifts = generateMultipleForklifts(5, grid);
    
    return {
      forklifts,
      tasks: initialTasks,
      grid,
      qTable: {},
      metrics: {
        totalTasks: initialTasks.length,
        completedTasks: 0,
        averageTime: 0,
        fuelEfficiency: 0,
        routeOptimization: 0,
        collisionCount: 0,
        blockedPaths: 0,
        totalWeightMoved: 0,
        averageLoadUtilization: 0
      },
      emergencyAlerts: []
    };
  });
  
  const [config, setConfig] = useState<SimulationConfig>({
    learningRate: 0.1,
    explorationRate: 0.3,
    discountFactor: 0.9,
    speed: 1.0,
    maxTasks: 15,
    forkliftCount: 5,
    collisionAvoidance: true,
    emergencyResponse: true,
    weightManagement: true,
    realTimeUpdates: true
  });
  
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [totalTime, setTotalTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepCountRef = useRef(0);
  
  const qLearning = useQLearning(config);
  
  const createEmergencyAlert = useCallback((
    type: EmergencyAlert['type'],
    forkliftId: string,
    position: Position,
    message: string,
    severity: EmergencyAlert['severity'] = 'medium'
  ): EmergencyAlert => ({
    id: `alert-${Date.now()}-${Math.random()}`,
    type,
    forkliftId,
    position,
    message,
    timestamp: Date.now(),
    resolved: false,
    severity
  }), []);
  
  // Accept a task for a specific forklift
  const acceptTask = useCallback((taskId: string, forkliftId: string) => {
    setState(prevState => {
      const task = prevState.tasks.find(t => t.id === taskId);
      const forklift = prevState.forklifts.find(f => f.id === forkliftId);
      
      if (!task || !forklift || task.status !== 'pending') {
        return prevState;
      }
      
      // Check if forklift can carry the material
      if (!canForkliftCarryMaterial(forklift, task.material)) {
        console.log(`Forklift ${forkliftId} cannot carry material (weight: ${task.material.weight}kg, capacity: ${forklift.capacity}kg)`);
        return prevState;
      }
      
      // Calculate path to pickup location
      const path = findPath(forklift.position, task.pickupLocation, prevState.grid, prevState.forklifts, forkliftId);
      
      if (path.length === 0) {
        console.log(`No path found for forklift ${forkliftId} to task ${taskId}`);
        return prevState;
      }
      
      console.log(`Task ${taskId} accepted by forklift ${forkliftId}`);
      
      return {
        ...prevState,
        tasks: prevState.tasks.map(t => 
          t.id === taskId 
            ? { ...t, status: 'assigned' as const, assignedForklift: forkliftId }
            : t
        ),
        forklifts: prevState.forklifts.map(f => 
          f.id === forkliftId 
            ? { 
                ...f, 
                currentTask: task, 
                status: 'moving' as const, 
                path,
                lastMoveTime: Date.now()
              }
            : f
        )
      };
    });
  }, []);
  
  // Complete current step for a forklift (manual movement)
  const completeCurrentStep = useCallback((forkliftId: string) => {
    setState(prevState => {
      const forklift = prevState.forklifts.find(f => f.id === forkliftId);
      
      if (!forklift || forklift.path.length <= 1) {
        return prevState;
      }
      
      const nextPosition = forklift.path[1];
      const newPath = forklift.path.slice(1);
      const currentTime = Date.now();
      
      // Check for collision
      const wouldCollide = prevState.forklifts.some(otherForklift => 
        otherForklift.id !== forkliftId &&
        otherForklift.position.x === nextPosition.x &&
        otherForklift.position.y === nextPosition.y
      );
      
      if (wouldCollide) {
        console.log(`Collision prevented for forklift ${forkliftId}`);
        return prevState;
      }
      
      let updatedForklift = {
        ...forklift,
        position: nextPosition,
        path: newPath,
        totalDistance: forklift.totalDistance + 1,
        fuelLevel: Math.max(0, forklift.fuelLevel - 0.2),
        batteryLevel: Math.max(0, forklift.batteryLevel - 0.15),
        lastMoveTime: currentTime
      };
      
      let updatedTasks = [...prevState.tasks];
      
      // Check if reached pickup location
      if (forklift.currentTask && 
          forklift.status === 'moving' &&
          nextPosition.x === forklift.currentTask.pickupLocation.x &&
          nextPosition.y === forklift.currentTask.pickupLocation.y) {
        
        console.log(`Forklift ${forkliftId} reached pickup location`);
        
        // Pick up the material
        const newLoad = forklift.currentLoad + forklift.currentTask.material.weight;
        
        // Calculate path to dropoff location
        const dropoffPath = findPath(
          nextPosition, 
          forklift.currentTask.dropoffLocation, 
          prevState.grid, 
          prevState.forklifts, 
          forkliftId
        );
        
        updatedForklift = {
          ...updatedForklift,
          status: 'carrying' as const,
          path: dropoffPath,
          currentLoad: newLoad
        };
        
        updatedTasks = updatedTasks.map(t => 
          t.id === forklift.currentTask?.id 
            ? { ...t, status: 'carrying' as const }
            : t
        );
      }
      
      // Check if reached dropoff location
      else if (forklift.currentTask &&
               forklift.status === 'carrying' &&
               nextPosition.x === forklift.currentTask.dropoffLocation.x &&
               nextPosition.y === forklift.currentTask.dropoffLocation.y) {
        
        console.log(`Forklift ${forkliftId} completed task ${forklift.currentTask.id}`);
        
        // Complete the task
        const materialWeight = forklift.currentTask.material.weight;
        
        updatedForklift = {
          ...updatedForklift,
          currentTask: null,
          status: 'idle' as const,
          path: [],
          currentLoad: Math.max(0, forklift.currentLoad - materialWeight),
          tasksCompleted: forklift.tasksCompleted + 1
        };
        
        updatedTasks = updatedTasks.map(t => 
          t.id === forklift.currentTask?.id 
            ? { 
                ...t, 
                status: 'completed' as const,
                actualTime: totalTime,
                completedAt: Date.now()
              }
            : t
        );
      }
      
      return {
        ...prevState,
        forklifts: prevState.forklifts.map(f => 
          f.id === forkliftId ? updatedForklift : f
        ),
        tasks: updatedTasks,
        metrics: {
          ...prevState.metrics,
          completedTasks: updatedTasks.filter(t => t.status === 'completed').length
        }
      };
    });
  }, [totalTime]);
  
  const assignTaskToForklift = useCallback((forklift: Forklift, task: Task, grid: any[][], allForklifts: Forklift[]) => {
    // Check if forklift can carry the material
    if (!canForkliftCarryMaterial(forklift, task.material)) {
      return null;
    }
    
    // Enhanced pathfinding with collision avoidance
    const path = findPath(forklift.position, task.pickupLocation, grid, allForklifts, forklift.id);
    
    if (path.length === 0) {
      const alternatePath = findAlternatePath(
        forklift.position, 
        task.pickupLocation, 
        grid, 
        allForklifts, 
        forklift.id
      );
      
      if (alternatePath.length === 0) {
        return null;
      }
      
      return {
        ...forklift,
        currentTask: task,
        status: 'moving' as const,
        path: alternatePath,
        lastMoveTime: Date.now()
      };
    }
    
    return {
      ...forklift,
      currentTask: task,
      status: 'moving' as const,
      path,
      lastMoveTime: Date.now()
    };
  }, []);
  
  const simulationStep = useCallback(() => {
    setState(prevState => {
      const { forklifts, grid, tasks, emergencyAlerts } = prevState;
      const currentTime = Date.now();
      let newEmergencyAlerts = [...emergencyAlerts];
      let newMetrics = { ...prevState.metrics };
      
      // Update each forklift
      const updatedForklifts = forklifts.map(forklift => {
        // Skip offline forklifts
        if (!forklift.isLoggedIn) {
          return { ...forklift, status: 'offline' as const };
        }
        
        // Check if forklift is stuck
        if (config.emergencyResponse && isForkliftStuck(forklift, currentTime)) {
          const alert = createEmergencyAlert(
            'stuck',
            forklift.id,
            forklift.position,
            `${forklift.id} has been stuck for too long`,
            'high'
          );
          newEmergencyAlerts.push(alert);
          newMetrics.blockedPaths += 1;
          
          return {
            ...forklift,
            status: 'stuck' as const,
            isBlocked: true,
            blockageReason: 'Path blocked or no valid moves'
          };
        }
        
        // Check for low fuel/battery
        if (config.emergencyResponse) {
          if (forklift.fuelLevel < 15) {
            const existingAlert = emergencyAlerts.find(alert => 
              alert.type === 'low_fuel' && alert.forkliftId === forklift.id && !alert.resolved
            );
            if (!existingAlert) {
              const alert = createEmergencyAlert(
                'low_fuel',
                forklift.id,
                forklift.position,
                `${forklift.id} has low fuel: ${forklift.fuelLevel.toFixed(1)}%`,
                'high'
              );
              newEmergencyAlerts.push(alert);
            }
          }
          
          if (forklift.currentLoad > forklift.capacity) {
            const alert = createEmergencyAlert(
              'overload',
              forklift.id,
              forklift.position,
              `${forklift.id} is overloaded: ${forklift.currentLoad}kg > ${forklift.capacity}kg`,
              'critical'
            );
            newEmergencyAlerts.push(alert);
          }
        }
        
        // Auto-assign tasks to idle forklifts (only if no manual task is assigned)
        if (forklift.status === 'idle' && !forklift.currentTask) {
          const availableTasks = tasks.filter(task => 
            task.status === 'pending' && 
            !task.assignedForklift &&
            canForkliftCarryMaterial(forklift, task.material)
          );
          
          if (availableTasks.length > 0) {
            const sortedTasks = availableTasks.sort((a, b) => {
              const priorityDiff = b.priority - a.priority;
              if (priorityDiff !== 0) return priorityDiff;
              
              const distanceA = calculateDistance(forklift.position, a.pickupLocation);
              const distanceB = calculateDistance(forklift.position, b.pickupLocation);
              return distanceA - distanceB;
            });
            
            const nextTask = sortedTasks[0];
            const updatedForklift = assignTaskToForklift(forklift, nextTask, grid, forklifts);
            
            if (updatedForklift) {
              return updatedForklift;
            }
          }
          return forklift;
        }
        
        // Auto-movement for forklifts with paths (only if simulation is running)
        if (isRunning && (forklift.status === 'moving' || forklift.status === 'carrying') && forklift.path.length > 1) {
          const nextPosition = forklift.path[1];
          
          // Enhanced collision avoidance
          if (config.collisionAvoidance) {
            const wouldCollide = forklifts.some(otherForklift => 
              otherForklift.id !== forklift.id &&
              otherForklift.position.x === nextPosition.x &&
              otherForklift.position.y === nextPosition.y
            );
            
            if (wouldCollide) {
              if (forklift.currentTask) {
                const target = forklift.status === 'moving' 
                  ? forklift.currentTask.pickupLocation 
                  : forklift.currentTask.dropoffLocation;
                
                const alternatePath = findAlternatePath(
                  forklift.position,
                  target,
                  grid,
                  forklifts,
                  forklift.id,
                  [nextPosition]
                );
                
                if (alternatePath.length > 0) {
                  return {
                    ...forklift,
                    path: alternatePath,
                    lastMoveTime: currentTime
                  };
                }
              }
              
              return {
                ...forklift,
                lastMoveTime: currentTime - 5000
              };
            }
          }
          
          const newPath = forklift.path.slice(1);
          
          // Check if reached pickup location
          if (forklift.currentTask && 
              forklift.status === 'moving' &&
              nextPosition.x === forklift.currentTask.pickupLocation.x &&
              nextPosition.y === forklift.currentTask.pickupLocation.y) {
            
            const newLoad = forklift.currentLoad + forklift.currentTask.material.weight;
            const dropoffPath = findPath(
              nextPosition, 
              forklift.currentTask.dropoffLocation, 
              grid, 
              forklifts, 
              forklift.id
            );
            
            return {
              ...forklift,
              position: nextPosition,
              status: 'carrying' as const,
              path: dropoffPath,
              currentLoad: newLoad,
              totalDistance: forklift.totalDistance + 1,
              fuelLevel: Math.max(0, forklift.fuelLevel - 0.15),
              batteryLevel: Math.max(0, forklift.batteryLevel - 0.1),
              lastMoveTime: currentTime
            };
          }
          
          // Check if reached dropoff location
          if (forklift.currentTask &&
              forklift.status === 'carrying' &&
              nextPosition.x === forklift.currentTask.dropoffLocation.x &&
              nextPosition.y === forklift.currentTask.dropoffLocation.y) {
            
            const materialWeight = forklift.currentTask.material.weight;
            newMetrics.totalWeightMoved += materialWeight;
            
            return {
              ...forklift,
              position: nextPosition,
              fuelLevel: Math.max(0, forklift.fuelLevel - 0.15),
              batteryLevel: Math.max(0, forklift.batteryLevel - 0.1),
              lastMoveTime: currentTime
            };
          }
          
          // Regular movement
          return {
            ...forklift,
            position: nextPosition,
            path: newPath,
            totalDistance: forklift.totalDistance + 1,
            fuelLevel: Math.max(0, forklift.fuelLevel - 0.1),
            batteryLevel: Math.max(0, forklift.batteryLevel - 0.08),
            lastMoveTime: currentTime
          };
        }
        
        // If no path or reached end of path, go idle
        if (forklift.path.length <= 1 && forklift.status !== 'idle') {
          return {
            ...forklift,
            status: 'idle' as const,
            path: [],
            currentTask: null
          };
        }
        
        return forklift;
      });
      
      // Update tasks based on forklift assignments and completions
      const updatedTasks = tasks.map(task => {
        const assignedForklift = updatedForklifts.find(f => f.currentTask?.id === task.id);
        
        if (assignedForklift) {
          if (assignedForklift.status === 'idle' && task.status !== 'completed') {
            newMetrics.completedTasks += 1;
            return {
        // If forklift has a path but hasn't reached destination, continue moving
              ...task,
              status: 'completed' as const,
              actualTime: totalTime,
              completedAt: Date.now(),
              assignedForklift: assignedForklift.id
            };
          } else if (assignedForklift.status === 'carrying' && task.status !== 'carrying') {
            return {
              ...task,
              status: 'carrying' as const,
              assignedForklift: assignedForklift.id
            };
          } else if (task.status === 'pending') {
            return {
              ...task,
              status: 'assigned' as const,
              assignedForklift: assignedForklift.id
            };
          }
        }
        
        return task;
      });
      
      // Enhanced collision detection
      const collisionDetected = detectCollision(updatedForklifts);
      if (collisionDetected) {
        newMetrics.collisionCount += 1;
        
        if (config.emergencyResponse) {
          const collidingForklifts = updatedForklifts.filter((f1, i) =>
            updatedForklifts.some((f2, j) => 
              i !== j && f1.position.x === f2.position.x && f1.position.y === f2.position.y
            )
          );
          
          collidingForklifts.forEach(forklift => {
            const alert = createEmergencyAlert(
              'collision',
              forklift.id,
              forklift.position,
              `Collision detected at (${forklift.position.x}, ${forklift.position.y})`,
              'critical'
            );
            newEmergencyAlerts.push(alert);
          });
        }
      }
      
      // Calculate load utilization
      const totalCapacity = updatedForklifts.reduce((sum, f) => sum + f.capacity, 0);
      const totalCurrentLoad = updatedForklifts.reduce((sum, f) => sum + f.currentLoad, 0);
      newMetrics.averageLoadUtilization = totalCapacity > 0 ? (totalCurrentLoad / totalCapacity) * 100 : 0;
      
      // Auto-resolve old alerts
      newEmergencyAlerts = newEmergencyAlerts.map(alert => {
        if (!alert.resolved && (currentTime - alert.timestamp) > 30000) {
          return { ...alert, resolved: true };
        }
        return alert;
      });
      
      return {
        ...prevState,
        forklifts: updatedForklifts,
        tasks: updatedTasks,
        metrics: newMetrics,
        emergencyAlerts: newEmergencyAlerts
      };
    });
    
    setTotalTime(prev => prev + 0.5);
    stepCountRef.current += 1;
    
    if (stepCountRef.current % 10 === 0) {
      qLearning.decayExploration();
    }
  }, [qLearning, totalTime, config, createEmergencyAlert, assignTaskToForklift, isRunning]);
  
  const startSimulation = useCallback(() => {
    if (isRunning) return;
    
    setIsRunning(true);
    console.log('Starting enhanced multi-forklift simulation...');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      simulationStep();
    }, Math.max(200, 1000 / config.speed));
  }, [simulationStep, config.speed, isRunning]);
  
  const stopSimulation = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      setIsPaused(true);
      console.log('Pausing simulation...');
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  const resetSimulation = useCallback(() => {
    console.log('Resetting simulation...');
    stopSimulation();
    setIsPaused(false);
    setTotalTime(0);
    stepCountRef.current = 0;
    
    // Clear stored grid on reset
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('warehouse_grid');
    }
    
    const grid = generateWarehouseGrid(GRID_WIDTH, GRID_HEIGHT, false);
    const initialTasks = generateRandomTasks(12, grid);
    const forklifts = generateMultipleForklifts(config.forkliftCount, grid);
    
    setState({
      forklifts,
      tasks: initialTasks,
      grid,
      qTable: {},
      metrics: {
        totalTasks: initialTasks.length,
        completedTasks: 0,
        averageTime: 0,
        fuelEfficiency: 0,
        routeOptimization: 0,
        collisionCount: 0,
        blockedPaths: 0,
        totalWeightMoved: 0,
        averageLoadUtilization: 0
      },
      emergencyAlerts: []
    });
  }, [stopSimulation, config.forkliftCount]);
  
  const addManualTask = useCallback((taskData: any) => {
    setState(prevState => {
      const newTask = {
        ...taskData,
        assignedAt: null,
        startedAt: null,
        completedAt: null
      };
      
      console.log('Added manual task:', newTask.id);
      
      return {
        ...prevState,
        tasks: [...prevState.tasks, newTask],
        metrics: {
          ...prevState.metrics,
          totalTasks: prevState.metrics.totalTasks + 1
        }
      };
    });
  }, []);
  
  const addForklift = useCallback((forkliftData: any) => {
    setState(prevState => ({
      ...prevState,
      forklifts: [...prevState.forklifts, forkliftData]
    }));
  }, []);
  
  const updateForklift = useCallback((forkliftId: string, updates: any) => {
    setState(prevState => ({
      ...prevState,
      forklifts: prevState.forklifts.map(f => 
        f.id === forkliftId ? { ...f, ...updates } : f
      )
    }));
  }, []);
  
  const removeForklift = useCallback((forkliftId: string) => {
    setState(prevState => ({
      ...prevState,
      forklifts: prevState.forklifts.filter(f => f.id !== forkliftId)
    }));
  }, []);
  
  const addRandomTask = useCallback(() => {
    setState(prevState => {
      const newTasks = generateRandomTasks(1, prevState.grid, prevState.tasks);
      console.log('Added new task:', newTasks[0]?.id);
      
      return {
        ...prevState,
        tasks: [...prevState.tasks, ...newTasks],
        metrics: {
          ...prevState.metrics,
          totalTasks: prevState.metrics.totalTasks + newTasks.length
        }
      };
    });
  }, []);
  
  const addObstacle = useCallback((position: Position) => {
    setState(prevState => {
      const newGrid = [...prevState.grid];
      if (newGrid[position.y] && newGrid[position.y][position.x] && 
          newGrid[position.y][position.x].type !== 'obstacle') {
        newGrid[position.y][position.x] = { type: 'obstacle', occupied: true };
        console.log('Added obstacle at:', position);
        
        const alert: EmergencyAlert = {
          id: `alert-${Date.now()}`,
          type: 'path_blocked',
          forkliftId: 'system',
          position,
          message: `New obstacle added at (${position.x}, ${position.y})`,
          timestamp: Date.now(),
          resolved: false,
          severity: 'medium'
        };
        
        return {
          ...prevState,
          grid: newGrid,
          emergencyAlerts: [...prevState.emergencyAlerts, alert],
          metrics: {
            ...prevState.metrics,
            blockedPaths: prevState.metrics.blockedPaths + 1
          }
        };
      }
      return prevState;
    });
  }, []);
  
  const addShelf = useCallback((position: Position) => {
    setState(prevState => {
      const newGrid = [...prevState.grid];
      if (newGrid[position.y] && newGrid[position.y][position.x] && 
          newGrid[position.y][position.x].type === 'empty') {
        newGrid[position.y][position.x] = { 
          type: 'shelf', 
          occupied: false,
          item: `Shelf-${Date.now()}`,
          weight: 0
        };
        console.log('Added shelf at:', position);
        
        // Update stored grid
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('warehouse_grid', JSON.stringify(newGrid));
        }
        
        return {
          ...prevState,
          grid: newGrid
        };
      }
      return prevState;
    });
  }, []);
  
  const removeShelf = useCallback((position: Position) => {
    setState(prevState => {
      const newGrid = [...prevState.grid];
      if (newGrid[position.y] && newGrid[position.y][position.x] && 
          newGrid[position.y][position.x].type === 'shelf') {
        newGrid[position.y][position.x] = { type: 'empty', occupied: false };
        console.log('Removed shelf at:', position);
        
        // Update stored grid
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('warehouse_grid', JSON.stringify(newGrid));
        }
        
        return {
          ...prevState,
          grid: newGrid
        };
      }
      return prevState;
    });
  }, []);
  
  // Login forklift operator
  const loginForklift = useCallback((forkliftId: string) => {
    setState(prevState => ({
      ...prevState,
      forklifts: prevState.forklifts.map(f => 
        f.id === forkliftId 
          ? { ...f, isLoggedIn: true, lastLoginTime: Date.now(), status: 'idle' as const }
          : f
      )
    }));
  }, []);
  
  // Logout forklift operator
  const logoutForklift = useCallback((forkliftId: string) => {
    setState(prevState => ({
      ...prevState,
      forklifts: prevState.forklifts.map(f => 
        f.id === forkliftId 
          ? { ...f, isLoggedIn: false, status: 'offline' as const, currentTask: null, path: [] }
          : f
      )
    }));
  }, []);
  
  // Update forklift count when config changes
  useEffect(() => {
    if (!isRunning && !isPaused) {
      setState(prevState => {
        const grid = generateWarehouseGrid(GRID_WIDTH, GRID_HEIGHT, true); // Preserve layout
        const forklifts = generateMultipleForklifts(config.forkliftCount, grid);
        
        return {
          ...prevState,
          forklifts,
          grid
        };
      });
    }
  }, [config.forkliftCount, isRunning, isPaused]);
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return {
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
    addForklift,
    updateForklift,
    removeForklift,
    loginForklift,
    logoutForklift,
    acceptTask,
    completeCurrentStep,
    addShelf,
    removeShelf
  };
};