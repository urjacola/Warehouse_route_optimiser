import React from 'react';
import { SimulationConfig } from '../types/warehouse';
import { Play, Pause, RotateCcw, Settings, Plus, Minus, Users, Shield } from 'lucide-react';

interface ControlPanelProps {
  config: SimulationConfig;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onConfigChange: (config: SimulationConfig) => void;
  onAddTask: () => void;
  onAddObstacle: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  isRunning,
  onStart,
  onStop,
  onReset,
  onConfigChange,
  onAddTask,
  onAddObstacle
}) => {
  const handleConfigChange = (key: keyof SimulationConfig, value: number | boolean) => {
    onConfigChange({
      ...config,
      [key]: value
    });
  };
  
  const ConfigSlider: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    onChange: (value: number) => void;
  }> = ({ label, value, min, max, step, unit, onChange }) => (
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500">
          {value.toFixed(step < 1 ? 2 : 0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        disabled={isRunning}
      />
    </div>
  );
  
  const ConfigToggle: React.FC<{
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    description?: string;
  }> = ({ label, value, onChange, description }) => (
    <div className="flex items-center justify-between">
      <div>
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-gray-200'
        }`}
        disabled={isRunning}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Settings className="w-5 h-5 mr-2" />
        Control Panel
      </h2>
      
      <div className="space-y-6">
        {/* Main Controls */}
        <div className="flex gap-3">
          <button
            onClick={isRunning ? onStop : onStart}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              isRunning 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isRunning ? 'Stop' : 'Start'}
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>
        
        {/* Fleet Configuration */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Fleet Configuration
          </h3>
          <div className="space-y-4">
            <ConfigSlider
              label="Number of Forklifts"
              value={config.forkliftCount}
              min={1}
              max={5}
              step={1}
              onChange={(value) => handleConfigChange('forkliftCount', value)}
            />
            
            <ConfigSlider
              label="Simulation Speed"
              value={config.speed}
              min={0.1}
              max={3}
              step={0.1}
              unit="x"
              onChange={(value) => handleConfigChange('speed', value)}
            />
          </div>
        </div>
        
        {/* Safety Features */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Safety Features
          </h3>
          <div className="space-y-4">
            <ConfigToggle
              label="Collision Avoidance"
              value={config.collisionAvoidance}
              onChange={(value) => handleConfigChange('collisionAvoidance', value)}
              description="Prevent forklifts from colliding"
            />
            
            <ConfigToggle
              label="Emergency Response"
              value={config.emergencyResponse}
              onChange={(value) => handleConfigChange('emergencyResponse', value)}
              description="Auto-detect stuck forklifts and blockages"
            />
          </div>
        </div>
        
        {/* Task Management */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Task Management</h3>
          <div className="flex gap-3">
            <button
              onClick={onAddTask}
              className="flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
            
            <button
              onClick={onAddObstacle}
              className="flex items-center px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              <Minus className="w-4 h-4 mr-2" />
              Add Obstacle
            </button>
          </div>
        </div>
        
        {/* Learning Parameters */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-3">Learning Parameters</h3>
          <div className="space-y-4">
            <ConfigSlider
              label="Learning Rate"
              value={config.learningRate}
              min={0.01}
              max={1}
              step={0.01}
              onChange={(value) => handleConfigChange('learningRate', value)}
            />
            
            <ConfigSlider
              label="Exploration Rate"
              value={config.explorationRate}
              min={0.01}
              max={1}
              step={0.01}
              onChange={(value) => handleConfigChange('explorationRate', value)}
            />
            
            <ConfigSlider
              label="Discount Factor"
              value={config.discountFactor}
              min={0.1}
              max={0.99}
              step={0.01}
              onChange={(value) => handleConfigChange('discountFactor', value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};