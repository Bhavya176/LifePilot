import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { taskService } from '../services/taskService';
import { Task } from '../types/task';
import { auth } from '../firebase/auth';

export function useTasks(filter?: 'today' | 'upcoming' | 'completed' | 'high_priority') {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeUid = auth.currentUser?.uid || user?.uid || 'demo-user-123';

  useEffect(() => {
    setLoading(true);
    const unsubscribe = taskService.subscribeUserTasks(
      activeUid,
      (fetchedTasks) => {
        setTasks(fetchedTasks);
        setLoading(false);
      },
      filter
    );

    return () => unsubscribe();
  }, [activeUid, filter]);

  const addTask = async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return taskService.createTask(uidToUse, taskData);
  };

  const toggleTask = async (taskId: string, currentCompleted: boolean) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return taskService.toggleTaskCompleted(uidToUse, taskId, currentCompleted);
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return taskService.updateTask(uidToUse, taskId, updates);
  };

  const deleteTask = async (taskId: string) => {
    const uidToUse = auth.currentUser?.uid || user?.uid || 'demo-user-123';
    return taskService.deleteTask(uidToUse, taskId);
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
  };
}
