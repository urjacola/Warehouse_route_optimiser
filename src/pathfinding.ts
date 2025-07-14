import { Position, Cell, Forklift } from '../types/warehouse';

export const findPath = (
  start: Position,
  end: Position,
  grid: Cell[][],
  forklifts: Forklift[] = [],
  currentForkliftId?: string
): Position[] => {
  const openSet: Position[] = [start];
  const closedSet: Set<string> = new Set();
  const cameFrom: Map<string, Position> = new Map();
  const gScore: Map<string, number> = new Map();
  const fScore: Map<string, number> = new Map();
  
  gScore.set(positionToKey(start), 0);
  fScore.set(positionToKey(start), heuristic(start, end));
  
  while (openSet.length > 0) {
    // Find position with lowest fScore
    let current = openSet.reduce((lowest, pos) => {
      const currentF = fScore.get(positionToKey(pos)) || Infinity;
      const lowestF = fScore.get(positionToKey(lowest)) || Infinity;
      return currentF < lowestF ? pos : lowest;
    });
    
    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(cameFrom, current);
    }
    
    openSet.splice(openSet.indexOf(current), 1);
    closedSet.add(positionToKey(current));
    
    const neighbors = getValidNeighbors(current, grid, forklifts, currentForkliftId);
    
    for (const neighbor of neighbors) {
      const neighborKey = positionToKey(neighbor);
      
      if (closedSet.has(neighborKey)) continue;
      
      // Enhanced collision avoidance - higher penalties for occupied cells
      let movementCost = 1;
      
      // Check if another forklift is at this position
      const forkliftAtPosition = forklifts.find(f => 
        f.id !== currentForkliftId && 
        f.position.x === neighbor.x && 
        f.position.y === neighbor.y
      );
      
      if (forkliftAtPosition) {
        // Very high penalty for occupied cells to prevent collisions
        movementCost += 1000;
      }
      
      // Add penalty for cells near other forklifts to encourage spacing
      const nearbyForklift = forklifts.find(f => 
        f.id !== currentForkliftId && 
        Math.abs(f.position.x - neighbor.x) <= 1 && 
        Math.abs(f.position.y - neighbor.y) <= 1 &&
        !(f.position.x === neighbor.x && f.position.y === neighbor.y)
      );
      
      if (nearbyForklift) {
        movementCost += 10; // Penalty for being near other forklifts
      }
      
      // Check if another forklift is planning to move to this position
      const forkliftPlanningToMove = forklifts.find(f => 
        f.id !== currentForkliftId && 
        f.path.length > 1 &&
        f.path[1].x === neighbor.x && 
        f.path[1].y === neighbor.y
      );
      
      if (forkliftPlanningToMove) {
        movementCost += 50; // High penalty for planned moves
      }
      
      const tentativeGScore = (gScore.get(positionToKey(current)) || 0) + movementCost;
      
      if (!openSet.find(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
        openSet.push(neighbor);
      } else if (tentativeGScore >= (gScore.get(neighborKey) || 0)) {
        continue;
      }
      
      cameFrom.set(neighborKey, current);
      gScore.set(neighborKey, tentativeGScore);
      fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, end));
    }
  }
  
  return []; // No path found
};

export const findAlternatePath = (
  start: Position,
  end: Position,
  grid: Cell[][],
  forklifts: Forklift[],
  currentForkliftId: string,
  blockedPositions: Position[] = []
): Position[] => {
  // Create a temporary grid with blocked positions marked as obstacles
  const tempGrid = grid.map(row => [...row]);
  
  blockedPositions.forEach(pos => {
    if (tempGrid[pos.y] && tempGrid[pos.y][pos.x]) {
      tempGrid[pos.y][pos.x] = { ...tempGrid[pos.y][pos.x], type: 'obstacle' };
    }
  });
  
  // Try multiple alternative paths with different strategies
  const strategies = [
    () => findPath(start, end, tempGrid, forklifts, currentForkliftId),
    () => findPathWithDetour(start, end, tempGrid, forklifts, currentForkliftId),
    () => findPathAvoidingForklifts(start, end, tempGrid, forklifts, currentForkliftId)
  ];
  
  for (const strategy of strategies) {
    const path = strategy();
    if (path.length > 0) {
      return path;
    }
  }
  
  return [];
};

const findPathWithDetour = (
  start: Position,
  end: Position,
  grid: Cell[][],
  forklifts: Forklift[],
  currentForkliftId: string
): Position[] => {
  // Try to find a path that goes around congested areas
  const midPoint = {
    x: Math.floor((start.x + end.x) / 2),
    y: Math.floor((start.y + end.y) / 2)
  };
  
  // Find a valid intermediate point
  const detourPoints = [
    { x: midPoint.x + 2, y: midPoint.y },
    { x: midPoint.x - 2, y: midPoint.y },
    { x: midPoint.x, y: midPoint.y + 2 },
    { x: midPoint.x, y: midPoint.y - 2 }
  ];
  
  for (const detour of detourPoints) {
    if (isValidPosition(detour, grid)) {
      const pathToDetour = findPath(start, detour, grid, forklifts, currentForkliftId);
      const pathFromDetour = findPath(detour, end, grid, forklifts, currentForkliftId);
      
      if (pathToDetour.length > 0 && pathFromDetour.length > 0) {
        return [...pathToDetour, ...pathFromDetour.slice(1)];
      }
    }
  }
  
  return [];
};

const findPathAvoidingForklifts = (
  start: Position,
  end: Position,
  grid: Cell[][],
  forklifts: Forklift[],
  currentForkliftId: string
): Position[] => {
  // Create a temporary grid where forklift positions are marked as obstacles
  const tempGrid = grid.map(row => [...row]);
  
  forklifts.forEach(forklift => {
    if (forklift.id !== currentForkliftId) {
      const pos = forklift.position;
      if (tempGrid[pos.y] && tempGrid[pos.y][pos.x]) {
        tempGrid[pos.y][pos.x] = { ...tempGrid[pos.y][pos.x], type: 'obstacle' };
      }
    }
  });
  
  return findPath(start, end, tempGrid, [], currentForkliftId);
};

const isValidPosition = (pos: Position, grid: Cell[][]): boolean => {
  return pos.x >= 0 && pos.x < grid[0].length &&
         pos.y >= 0 && pos.y < grid.length &&
         (grid[pos.y][pos.x].type === 'empty' ||
          grid[pos.y][pos.x].type === 'docking' ||
          grid[pos.y][pos.x].type === 'charging' ||
          grid[pos.y][pos.x].type === 'receiving' ||
          grid[pos.y][pos.x].type === 'shipping');
};

const positionToKey = (pos: Position): string => `${pos.x},${pos.y}`;

const heuristic = (pos1: Position, pos2: Position): number => {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
};

const reconstructPath = (cameFrom: Map<string, Position>, current: Position): Position[] => {
  const path: Position[] = [current];
  
  while (cameFrom.has(positionToKey(current))) {
    current = cameFrom.get(positionToKey(current))!;
    path.unshift(current);
  }
  
  return path;
};

const getValidNeighbors = (
  position: Position, 
  grid: Cell[][],
  forklifts: Forklift[] = [],
  currentForkliftId?: string
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
      // NEVER allow movement through shelves or obstacles
      const isValidCellType = cell.type === 'empty' || cell.type === 'docking' || 
                             cell.type === 'charging' || cell.type === 'receiving' || 
                             cell.type === 'shipping';
      
      if (isValidCellType) {
        neighbors.push({ x: newX, y: newY });
      }
    }
  });
  
  return neighbors;
};