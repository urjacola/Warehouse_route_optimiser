import { useState, useCallback } from 'react';
import { Position, QTableEntry, SimulationConfig } from '../types/warehouse';

export const useQLearning = (config: SimulationConfig) => {
  const [qTable, setQTable] = useState<{ [key: string]: QTableEntry }>({});
  const [explorationRate, setExplorationRate] = useState(config.explorationRate);
  
  const getStateKey = useCallback((position: Position, goalPosition: Position): string => {
    return `${position.x},${position.y}->${goalPosition.x},${goalPosition.y}`;
  }, []);
  
  const getActionKey = useCallback((position: Position, action: Position): string => {
    return `${action.x},${action.y}`;
  }, []);
  
  const selectAction = useCallback((
    currentPosition: Position,
    goalPosition: Position,
    validActions: Position[]
  ): Position => {
    const stateKey = getStateKey(currentPosition, goalPosition);
    
    // Exploration vs Exploitation
    if (Math.random() < explorationRate) {
      // Explore: choose random action
      return validActions[Math.floor(Math.random() * validActions.length)];
    } else {
      // Exploit: choose best known action
      const stateQValues = qTable[stateKey] || {};
      let bestAction = validActions[0];
      let bestValue = -Infinity;
      
      validActions.forEach(action => {
        const actionKey = getActionKey(currentPosition, action);
        const qValue = stateQValues[actionKey] || 0;
        if (qValue > bestValue) {
          bestValue = qValue;
          bestAction = action;
        }
      });
      
      return bestAction;
    }
  }, [qTable, explorationRate, getStateKey, getActionKey]);
  
  const updateQValue = useCallback((
    currentPosition: Position,
    action: Position,
    reward: number,
    nextPosition: Position,
    goalPosition: Position,
    validNextActions: Position[]
  ) => {
    const stateKey = getStateKey(currentPosition, goalPosition);
    const actionKey = getActionKey(currentPosition, action);
    const nextStateKey = getStateKey(nextPosition, goalPosition);
    
    setQTable(prevQTable => {
      const newQTable = { ...prevQTable };
      
      if (!newQTable[stateKey]) {
        newQTable[stateKey] = {};
      }
      
      const currentQ = newQTable[stateKey][actionKey] || 0;
      
      // Find max Q value for next state
      const nextStateQValues = newQTable[nextStateKey] || {};
      let maxNextQ = -Infinity;
      
      validNextActions.forEach(nextAction => {
        const nextActionKey = getActionKey(nextPosition, nextAction);
        const nextQ = nextStateQValues[nextActionKey] || 0;
        if (nextQ > maxNextQ) {
          maxNextQ = nextQ;
        }
      });
      
      if (maxNextQ === -Infinity) maxNextQ = 0;
      
      // Q-Learning update formula
      const newQ = currentQ + config.learningRate * (
        reward + config.discountFactor * maxNextQ - currentQ
      );
      
      newQTable[stateKey][actionKey] = newQ;
      
      return newQTable;
    });
  }, [config.learningRate, config.discountFactor, getStateKey, getActionKey]);
  
  const calculateReward = useCallback((
    currentPosition: Position,
    nextPosition: Position,
    goalPosition: Position,
    isTaskCompleted: boolean
  ): number => {
    if (isTaskCompleted) {
      return 100; // Large reward for completing task
    }
    
    const currentDistance = Math.abs(currentPosition.x - goalPosition.x) + 
                          Math.abs(currentPosition.y - goalPosition.y);
    const nextDistance = Math.abs(nextPosition.x - goalPosition.x) + 
                        Math.abs(nextPosition.y - goalPosition.y);
    
    // Reward for getting closer to goal
    if (nextDistance < currentDistance) {
      return 10;
    } else if (nextDistance > currentDistance) {
      return -5; // Penalty for moving away
    }
    
    return -1; // Small penalty for time
  }, []);
  
  const decayExploration = useCallback(() => {
    setExplorationRate(prev => Math.max(0.01, prev * 0.995));
  }, []);
  
  return {
    qTable,
    explorationRate,
    selectAction,
    updateQValue,
    calculateReward,
    decayExploration
  };
};