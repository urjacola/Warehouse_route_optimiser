import React, { useState } from 'react';
import { Plus, Package, Target, Weight, Clock } from 'lucide-react';

interface ManualTaskCreatorProps {
  onTaskCreate: (taskData: any) => void;
}

export const ManualTaskCreator: React.FC<ManualTaskCreatorProps> = ({ onTaskCreate }) => {
  const [taskData, setTaskData] = useState({
    taskType: 'inbound',
    materialName: '',
    materialWeight: 100,
    materialPriority: 'medium',
    materialFragile: false,
    pickupX: 5,
    pickupY: 3,
    dropoffX: 15,
    dropoffY: 10,
    estimatedTime: 60
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTask = {
      id: `manual-task-${Date.now()}`,
      taskType: taskData.taskType,
      material: {
        id: `mat-${Date.now()}`,
        name: taskData.materialName,
        weight: taskData.materialWeight,
        dimensions: { length: 50, width: 30, height: 40 },
        fragile: taskData.materialFragile,
        priority: taskData.materialPriority
      },
      pickupLocation: {
        x: taskData.pickupX,
        y: taskData.pickupY,
        type: taskData.taskType === 'inbound' ? 'receiving' : 'shelf'
      },
      dropoffLocation: {
        x: taskData.dropoffX,
        y: taskData.dropoffY,
        type: taskData.taskType === 'outbound' ? 'shipping' : 'shelf'
      },
      priority: getPriorityNumber(taskData.materialPriority),
      status: 'pending',
      estimatedTime: taskData.estimatedTime,
      createdAt: Date.now(),
      requiredCapacity: Math.round(taskData.materialWeight * 1.1)
    };

    onTaskCreate(newTask);
    
    // Reset form
    setTaskData({
      ...taskData,
      materialName: '',
      materialWeight: 100
    });
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
          <select
            value={taskData.taskType}
            onChange={(e) => setTaskData({ ...taskData, taskType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
            <option value="internal">Internal</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={taskData.materialPriority}
            onChange={(e) => setTaskData({ ...taskData, materialPriority: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Material Name</label>
        <input
          type="text"
          value={taskData.materialName}
          onChange={(e) => setTaskData({ ...taskData, materialName: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Enter material name"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input
            type="number"
            value={taskData.materialWeight}
            onChange={(e) => setTaskData({ ...taskData, materialWeight: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            min="1"
            max="2000"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Est. Time (sec)</label>
          <input
            type="number"
            value={taskData.estimatedTime}
            onChange={(e) => setTaskData({ ...taskData, estimatedTime: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            min="10"
            max="600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup (X, Y)</label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={taskData.pickupX}
              onChange={(e) => setTaskData({ ...taskData, pickupX: parseInt(e.target.value) })}
              className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm"
              min="1"
              max="38"
            />
            <input
              type="number"
              value={taskData.pickupY}
              onChange={(e) => setTaskData({ ...taskData, pickupY: parseInt(e.target.value) })}
              className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm"
              min="1"
              max="26"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff (X, Y)</label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={taskData.dropoffX}
              onChange={(e) => setTaskData({ ...taskData, dropoffX: parseInt(e.target.value) })}
              className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm"
              min="1"
              max="38"
            />
            <input
              type="number"
              value={taskData.dropoffY}
              onChange={(e) => setTaskData({ ...taskData, dropoffY: parseInt(e.target.value) })}
              className="w-1/2 px-2 py-2 border border-gray-300 rounded-md text-sm"
              min="1"
              max="26"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="fragile"
          checked={taskData.materialFragile}
          onChange={(e) => setTaskData({ ...taskData, materialFragile: e.target.checked })}
          className="rounded border-gray-300"
        />
        <label htmlFor="fragile" className="text-sm text-gray-700">Fragile Material</label>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>Create Task</span>
      </button>
    </form>
  );
};