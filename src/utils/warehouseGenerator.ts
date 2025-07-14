import { Cell, Position, Task, Forklift, Material } from '../types/warehouse';

export const generateWarehouseGrid = (width: number = 42, height: number = 30, preserveLayout: boolean = false): Cell[][] => {
  // If preserving layout, return existing grid structure
  if (preserveLayout && typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('warehouse_grid');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.log('Failed to parse stored grid, generating new one');
      }
    }
  }
  
  const grid: Cell[][] = [];
  
  for (let y = 0; y < height; y++) {
    grid[y] = [];
    for (let x = 0; x < width; x++) {
      // Create organized warehouse layout with clear borders and areas
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        // Border walls - complete perimeter
        grid[y][x] = { type: 'obstacle', occupied: true };
      } else if (x === 1 || x === width - 2) {
        // Left and right access corridors for movement
        grid[y][x] = { type: 'empty', occupied: false };
      } else if (y >= 2 && y <= 5 && x >= 3 && x <= 12) {
        // Receiving area (top-left) with internal aisles
        if (x === 7 || y === 4) {
          // Aisle in receiving area
          grid[y][x] = { type: 'empty', occupied: false };
        } else {
          grid[y][x] = { type: 'receiving', occupied: false };
        }
      } else if (y >= 2 && y <= 5 && x >= width - 13 && x <= width - 3) {
        // Shipping area (top-right) with internal aisles
        if (x === width - 8 || y === 4) {
          // Aisle in shipping area
          grid[y][x] = { type: 'empty', occupied: false };
        } else {
          grid[y][x] = { type: 'shipping', occupied: false };
        }
      } else if (y >= height - 6 && y <= height - 3 && x >= 3 && x <= width - 4) {
        // Charging stations (bottom) - this is the green area
        grid[y][x] = { type: 'charging', occupied: false };
      } else if (y === 6 || y === height - 7 || (x > 2 && x < width - 2 && x % 7 === 0)) {
        // Main aisles - horizontal and vertical corridors
        grid[y][x] = { type: 'empty', occupied: false };
      } else if (y > 6 && y < height - 7 && x > 2 && x < width - 2 && x % 7 !== 0) {
        // Shelving areas - FIXED POSITIONS, no random generation
        if ((x - 3) % 7 === 3) {
          // Aisle between shelf sections
          grid[y][x] = { type: 'empty', occupied: false };
        } else {
          // Fixed shelf positions - no randomization
          grid[y][x] = { 
            type: 'shelf', 
            occupied: false, // Start empty, can be filled manually
            item: undefined,
            weight: undefined
          };
        }
      } else {
        // Additional empty spaces for movement
        grid[y][x] = { type: 'empty', occupied: false };
      }
    }
  }
  
  // Ensure there are enough empty corridors for forklift movement
  for (let y = 2; y < height - 2; y++) {
    for (let x = 2; x < width - 2; x += 4) {
      if (y === Math.floor(height / 2)) {
        grid[y][x] = { type: 'empty', occupied: false };
      }
    }
  }
  
  // Store the generated grid for consistency
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('warehouse_grid', JSON.stringify(grid));
  }
  
  // Add additional aisles in receiving and shipping areas
  for (let y = 1; y <= 4; y++) {
    // Receiving area aisles
    if (grid[y] && grid[y][6]) {
      grid[y][6] = { type: 'empty', occupied: false };
    }
    // Shipping area aisles
    if (grid[y] && grid[y][width - 6]) {
      grid[y][width - 6] = { type: 'empty', occupied: false };
    }
  }
  
  return grid;
};

export const generateMultipleForklifts = (count: number, grid: Cell[][]): Forklift[] => {
  const forklifts: Forklift[] = [];
  const startingPositions = [
    { x: 3, y: 4 },
    { x: 6, y: 4 },
    { x: 9, y: 4 },
    { x: 12, y: 4 },
    { x: 15, y: 4 }
  ];
  
  const operators = [
    'John Smith',
    'Sarah Johnson', 
    'Mike Davis',
    'Lisa Wilson',
    'David Brown'
  ];
  
  const capacities = [1000, 1200, 800, 1500, 1000]; // Different forklift capacities
  const statusArray = ['idle', 'moving', 'picking', 'carrying', 'dropping'] as const;
  for (let i = 0; i < count; i++) {
    const position = startingPositions[i % startingPositions.length];
    forklifts.push({
      id: `forklift-${i + 1}`,
      operatorName: operators[i % operators.length],
      position: { ...position },
      currentTask: null,
      fuelLevel: 100,
      capacity: capacities[i % capacities.length],
      currentLoad: 0,
      status: statusArray[i % statusArray.length],
      path: [],
      totalDistance: 0,
      totalTime: 0,
      tasksCompleted: 0,
      lastMoveTime: Date.now(),
      isBlocked: false,
      speed: 1.0,
      batteryLevel: 100,
      maintenanceStatus: 'good',
      isLoggedIn: false
    });
  }
  
  return forklifts;
};

const generateRandomMaterial = (): Material => {
  const materials = [
    { name: 'Steel Pipes', baseWeight: 200, fragile: false, category: 'industrial' },
    { name: 'Glass Panels', baseWeight: 50, fragile: true, category: 'fragile' },
    { name: 'Electronics', baseWeight: 30, fragile: true, category: 'fragile' },
    { name: 'Lumber', baseWeight: 150, fragile: false, category: 'construction' },
    { name: 'Machinery Parts', baseWeight: 300, fragile: false, category: 'industrial' },
    { name: 'Chemicals', baseWeight: 100, fragile: true, category: 'hazardous' },
    { name: 'Textiles', baseWeight: 25, fragile: false, category: 'consumer' },
    { name: 'Food Products', baseWeight: 75, fragile: false, category: 'perishable' },
    { name: 'Auto Parts', baseWeight: 120, fragile: false, category: 'automotive' },
    { name: 'Medical Supplies', baseWeight: 40, fragile: true, category: 'medical' }
  ];
  
  const material = materials[Math.floor(Math.random() * materials.length)];
  const weightVariation = 0.5 + Math.random(); // 0.5x to 1.5x base weight
  
  return {
    id: `mat-${Date.now()}-${Math.random()}`,
    name: material.name,
    weight: Math.round(material.baseWeight * weightVariation),
    dimensions: {
      length: Math.round(50 + Math.random() * 100),
      width: Math.round(30 + Math.random() * 70),
      height: Math.round(20 + Math.random() * 80)
    },
    fragile: material.fragile,
    priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any
  };
};

export const generateRandomTasks = (
  count: number, 
  grid: Cell[][],
  existingTasks: Task[] = []
): Task[] => {
  const tasks: Task[] = [];
  const taskTypes = ['inbound', 'outbound', 'internal'];
  
  for (let i = 0; i < count; i++) {
    const material = generateRandomMaterial();
    const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    
    let pickupLocation: Position | null = null;
    let dropoffLocation: Position | null = null;
    
    // Generate task based on type
    if (taskType === 'inbound') {
      // Receiving area to shelf
      pickupLocation = getRandomValidPosition(grid, ['receiving']);
      dropoffLocation = getRandomValidPosition(grid, ['empty'], true); // Near shelves
    } else if (taskType === 'outbound') {
      // Shelf to shipping area
      pickupLocation = getRandomValidPosition(grid, ['empty'], true); // Near shelves
      dropoffLocation = getRandomValidPosition(grid, ['shipping']);
    } else {
      // Internal movement (shelf to shelf)
      pickupLocation = getRandomValidPosition(grid, ['empty'], true);
      dropoffLocation = getRandomValidPosition(grid, ['empty'], true);
    }
    
    if (pickupLocation && dropoffLocation) {
      // Calculate required capacity (material weight + safety margin)
      const requiredCapacity = Math.round(material.weight * 1.1);
      
      const task: Task = {
        id: `task-${Date.now()}-${i}`,
        pickupLocation: {
          ...pickupLocation,
          type: taskType === 'inbound' ? 'receiving' : 'shelf',
          shelfId: taskType !== 'inbound' ? `S${Math.floor(Math.random() * 100)}` : undefined
        },
        dropoffLocation: {
          ...dropoffLocation,
          type: taskType === 'outbound' ? 'shipping' : 'shelf',
          shelfId: taskType !== 'outbound' ? `S${Math.floor(Math.random() * 100)}` : undefined
        },
        material,
        priority: getPriorityNumber(material.priority),
        status: 'pending',
        estimatedTime: calculateDistance(pickupLocation, dropoffLocation) * 2,
        createdAt: Date.now(),
        requiredCapacity,
        taskType: taskType as any
      };
      
      tasks.push(task);
    }
  }
  
  return tasks;
};

const getPriorityNumber = (priority: string): number => {
  switch (priority) {
    case 'urgent': return 10;
    case 'high': return 8;
    case 'medium': return 5;
    case 'low': return 2;
    default: return 5;
  }
};

const getRandomValidPosition = (grid: Cell[][], preferredTypes?: string[], nearShelves?: boolean): Position | null => {
  const width = grid[0].length;
  const height = grid.length;
  const maxAttempts = 100;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = Math.floor(Math.random() * (width - 2)) + 1;
    const y = Math.floor(Math.random() * (height - 2)) + 1;
    
    const cell = grid[y][x];
    
    let isValid = false;
    
    if (preferredTypes) {
      isValid = preferredTypes.includes(cell.type) && cell.type !== 'obstacle';
    } else {
      isValid = (cell.type === 'empty' || cell.type === 'docking' || cell.type === 'charging' || cell.type === 'receiving' || cell.type === 'shipping');
    }
    
    // If looking for positions near shelves, check adjacent cells
    if (nearShelves && isValid && cell.type === 'empty') {
      const hasAdjacentShelf = [
        { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
      ].some(({ dx, dy }) => {
        const nx = x + dx;
        const ny = y + dy;
        return nx >= 0 && nx < width && ny >= 0 && ny < height && 
               grid[ny][nx].type === 'shelf';
      });
      
      if (!hasAdjacentShelf) {
        isValid = false;
      }
    }
    
    if (isValid) {
      return { x, y };
    }
  }
  
  // Fallback to any empty space
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x].type === 'empty' || grid[y][x].type === 'receiving' || grid[y][x].type === 'shipping') {
        return { x, y };
      }
    }
  }
  
  return null;
};

export const calculateDistance = (pos1: Position, pos2: Position): number => {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

export const getValidNeighbors = (
  position: Position, 
  grid: Cell[][]
): Position[] => {
  const neighbors: Position[] = [];
  const directions = [
    { x: 0, y: -1 }, // Up
    { x: 1, y: 0 },  // Right
    { x: 0, y: 1 },  // Down
    { x: -1, y: 0 }  // Left
  ];
  
  directions.forEach(dir => {
    const newX = position.x + dir.x;
    const newY = position.y + dir.y;
    
    if (newX >= 0 && newX < grid[0].length && 
        newY >= 0 && newY < grid.length) {
      
      const cell = grid[newY][newX];
      
      // ONLY allow movement in empty spaces, docking areas, and charging stations
      // NO movement through shelves or obstacles  
      if (cell.type === 'empty' || cell.type === 'docking' || cell.type === 'charging' || 
          cell.type === 'receiving' || cell.type === 'shipping') {
        neighbors.push({ x: newX, y: newY });
      }
    }
  });
  
  return neighbors;
};

export const detectCollision = (forklifts: Forklift[]): boolean => {
  for (let i = 0; i < forklifts.length; i++) {
    for (let j = i + 1; j < forklifts.length; j++) {
      const f1 = forklifts[i];
      const f2 = forklifts[j];
      
      if (f1.position.x === f2.position.x && f1.position.y === f2.position.y) {
        return true;
      }
    }
  }
  return false;
};

export const isForkliftStuck = (forklift: Forklift, currentTime: number): boolean => {
  const STUCK_THRESHOLD = 15000; // 15 seconds
  return (forklift.status === 'moving' || forklift.status === 'carrying') && 
         forklift.path.length > 0 && 
         (currentTime - forklift.lastMoveTime) > STUCK_THRESHOLD;
};

export const canForkliftCarryMaterial = (forklift: Forklift, material: Material): boolean => {
  return (forklift.currentLoad + material.weight) <= forklift.capacity;
};
