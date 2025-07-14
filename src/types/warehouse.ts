export interface Position {
  x: number;
  y: number;
}

export interface Material {
  id: string;
  name: string;
  weight: number; // in kg
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  fragile: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Task {
  id: string;
  pickupLocation: Position & { type?: string; shelfId?: string };
  dropoffLocation: Position & { type?: string; shelfId?: string };
  material: Material;
  priority: number;
  status: 'pending' | 'assigned' | 'in-progress' | 'picking' | 'carrying' | 'dropping' | 'completed';
  estimatedTime: number;
  actualTime?: number;
  assignedForklift?: string;
  createdAt: number;
  assignedAt?: number;
  startedAt?: number;
  completedAt?: number;
  requiredCapacity: number; // minimum forklift capacity needed
  taskType?: 'inbound' | 'outbound' | 'internal';
}

export interface Forklift {
  id: string;
  operatorName: string;
  position: Position;
  currentTask: Task | null;
  fuelLevel: number;
  capacity: number; // maximum weight in kg
  currentLoad: number; // current weight being carried
  status: 'idle' | 'moving' | 'picking' | 'carrying' | 'dropping' | 'stuck' | 'emergency' | 'offline';
  path: Position[];
  totalDistance: number;
  totalTime: number;
  tasksCompleted: number;
  lastMoveTime: number;
  isBlocked: boolean;
  blockageReason?: string;
  speed: number; // cells per second
  batteryLevel: number;
  maintenanceStatus: 'good' | 'warning' | 'critical';
  isLoggedIn: boolean;
  lastLoginTime?: number;
}

export interface Cell {
  type: 'empty' | 'shelf' | 'obstacle' | 'docking' | 'charging' | 'restricted' | 'receiving' | 'shipping';
  occupied: boolean;
  item?: string;
  occupiedBy?: string;
  isBlocked?: boolean;
  blockageTime?: number;
  weight?: number;
}

export interface QTableEntry {
  [key: string]: number;
}

export interface WarehouseState {
  forklifts: Forklift[];
  tasks: Task[];
  grid: Cell[][];
  qTable: { [key: string]: QTableEntry };
  metrics: {
    totalTasks: number;
    completedTasks: number;
    averageTime: number;
    fuelEfficiency: number;
    routeOptimization: number;
    collisionCount: number;
    blockedPaths: number;
    totalWeightMoved: number;
    averageLoadUtilization: number;
  };
  emergencyAlerts: EmergencyAlert[];
}

export interface EmergencyAlert {
  id: string;
  type: 'collision' | 'stuck' | 'low_fuel' | 'path_blocked' | 'overload' | 'maintenance_required';
  forkliftId: string;
  position: Position;
  message: string;
  timestamp: number;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SimulationConfig {
  learningRate: number;
  explorationRate: number;
  discountFactor: number;
  speed: number;
  maxTasks: number;
  forkliftCount: number;
  collisionAvoidance: boolean;
  emergencyResponse: boolean;
  weightManagement: boolean;
  realTimeUpdates: boolean;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'operator';
  forkliftId?: string;
  name: string;
  isActive: boolean;
  lastLogin?: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}
