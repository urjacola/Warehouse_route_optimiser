import React, { useState } from 'react';
import { Truck, Plus, Edit, Trash2, Battery, Fuel, Weight } from 'lucide-react';
import { useWarehouseSimulation } from '../hooks/useWarehouseSimulation';

export const ForkliftManager: React.FC = () => {
  const { state, addForklift, updateForklift, removeForklift } = useWarehouseSimulation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingForklift, setEditingForklift] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    operatorName: '',
    capacity: 1000,
    fuelCapacity: 100,
    batteryCapacity: 100,
    speed: 1.0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingForklift) {
      updateForklift(editingForklift, formData);
      setEditingForklift(null);
    } else {
      addForklift({
        ...formData,
        id: `forklift-${Date.now()}`,
        position: { x: 3, y: 4 },
        currentTask: null,
        fuelLevel: formData.fuelCapacity,
        batteryLevel: formData.batteryCapacity,
        currentLoad: 0,
        status: 'offline',
        path: [],
        totalDistance: 0,
        totalTime: 0,
        tasksCompleted: 0,
        lastMoveTime: Date.now(),
        isBlocked: false,
        maintenanceStatus: 'good',
        isLoggedIn: false
      });
      setShowAddForm(false);
    }
    
    setFormData({
      id: '',
      operatorName: '',
      capacity: 1000,
      fuelCapacity: 100,
      batteryCapacity: 100,
      speed: 1.0
    });
  };

  const handleEdit = (forklift: any) => {
    setFormData({
      id: forklift.id,
      operatorName: forklift.operatorName,
      capacity: forklift.capacity,
      fuelCapacity: 100,
      batteryCapacity: 100,
      speed: forklift.speed
    });
    setEditingForklift(forklift.id);
    setShowAddForm(true);
  };

  const handleDelete = (forkliftId: string) => {
    if (confirm('Are you sure you want to remove this forklift?')) {
      removeForklift(forkliftId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Fleet Overview</h4>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add Forklift</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h5 className="font-medium">{editingForklift ? 'Edit' : 'Add New'} Forklift</h5>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operator Name</label>
            <input
              type="text"
              value={formData.operatorName}
              onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (kg)</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="500"
                max="3000"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
              <input
                type="number"
                step="0.1"
                value={formData.speed}
                onChange={(e) => setFormData({ ...formData, speed: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                min="0.5"
                max="2.0"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              {editingForklift ? 'Update' : 'Add'} Forklift
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingForklift(null);
                setFormData({
                  id: '',
                  operatorName: '',
                  capacity: 1000,
                  fuelCapacity: 100,
                  batteryCapacity: 100,
                  speed: 1.0
                });
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {state.forklifts.map((forklift) => (
          <div key={forklift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Truck className="w-4 h-4 text-blue-500" />
              <div>
                <div className="font-medium text-sm">{forklift.id}</div>
                <div className="text-xs text-gray-500">{forklift.operatorName}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <Weight className="w-3 h-3" />
                <span>{forklift.capacity}kg</span>
              </div>
              <div className="flex items-center space-x-1">
                <Battery className="w-3 h-3" />
                <span>{forklift.batteryLevel.toFixed(0)}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Fuel className="w-3 h-3" />
                <span>{forklift.fuelLevel.toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleEdit(forklift)}
                className="p-1 text-blue-500 hover:bg-blue-100 rounded"
              >
                <Edit className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDelete(forklift.id)}
                className="p-1 text-red-500 hover:bg-red-100 rounded"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};