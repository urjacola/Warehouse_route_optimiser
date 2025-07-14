import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database service functions
export const dbService = {
  // User management
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createUser(userData: any) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(id: string, updates: any) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Forklift management
  async getForklifts() {
    const { data, error } = await supabase
      .from('forklifts')
      .select('*')
      .order('id');
    
    if (error) throw error;
    return data;
  },

  async createForklift(forkliftData: any) {
    const { data, error } = await supabase
      .from('forklifts')
      .insert([forkliftData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateForklift(id: string, updates: any) {
    const { data, error } = await supabase
      .from('forklifts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteForklift(id: string) {
    const { error } = await supabase
      .from('forklifts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Task management
  async getTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createTask(taskData: any) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTask(id: string, updates: any) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Task history
  async addTaskHistory(historyData: any) {
    const { data, error } = await supabase
      .from('task_history')
      .insert([historyData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getTaskHistory(taskId?: string) {
    let query = supabase
      .from('task_history')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (taskId) {
      query = query.eq('task_id', taskId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Configuration
  async getConfig(key?: string) {
    let query = supabase
      .from('warehouse_config')
      .select('*');
    
    if (key) {
      query = query.eq('config_key', key).single();
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateConfig(key: string, value: any, description?: string) {
    const { data, error } = await supabase
      .from('warehouse_config')
      .upsert([{
        config_key: key,
        config_value: value,
        description,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};