import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { taskService } from '../services/taskService';
import { Task } from '../types/task';
import { auth } from '../firebase/auth';
import { getGamificationProfile, awardXP } from '../services/gamificationService';

export function useTasks(filter?: 'today' | 'upcoming' | 'completed' | 'high_priority') {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const activeUid = auth.currentUser?.uid || user?.uid;

  useEffect(() => {
    if (!activeUid) {
      setTasks([]);
      setLoading(false);
      return;
    }

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
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) throw new Error('You must be signed in to add tasks.');
    const created = await taskService.createTask(uidToUse, taskData);
    getGamificationProfile(uidToUse).then((p) => awardXP(uidToUse, 'CREATE_TASK', p)).catch(() => {});
    return created;
  };

  const toggleTask = async (taskId: string, currentCompleted: boolean) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) return;
    const toggled = await taskService.toggleTaskCompleted(uidToUse, taskId, currentCompleted);
    if (!currentCompleted) {
      getGamificationProfile(uidToUse).then((p) => awardXP(uidToUse, 'COMPLETE_TASK', p)).catch(() => {});
    }
    return toggled;
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) return;
    return taskService.updateTask(uidToUse, taskId, updates);
  };

  const deleteTask = async (taskId: string) => {
    const uidToUse = auth.currentUser?.uid || user?.uid;
    if (!uidToUse) return;
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
