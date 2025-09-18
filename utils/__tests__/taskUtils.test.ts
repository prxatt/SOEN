import { describe, it, expect, vi } from 'vitest'
import { 
  getActualDuration, 
  calculateStreak, 
  getTodaysTaskCompletion, 
  getTopCategories, 
  inferHomeLocation 
} from '../taskUtils'
import { Task, TaskStatus, Category } from '../../types'

// Mock constants
vi.mock('../../constants', () => ({
  LEARNING_MULTIPLIER: 1.5
}))

describe('taskUtils', () => {
  describe('getActualDuration', () => {
    it('should multiply duration by LEARNING_MULTIPLIER for Learning tasks', () => {
      const task: Task = {
        id: 1,
        title: 'Test Task',
        category: 'Learning' as Category,
        plannedDuration: 60,
        status: TaskStatus.Pending,
        startTime: new Date().toISOString(),
        isVirtual: false,
        location: 'Home'
      }
      
      expect(getActualDuration(task)).toBe(90) // 60 * 1.5
    })

    it('should return planned duration for non-Learning tasks', () => {
      const task: Task = {
        id: 1,
        title: 'Test Task',
        category: 'Work' as Category,
        plannedDuration: 60,
        status: TaskStatus.Pending,
        startTime: new Date().toISOString(),
        isVirtual: false,
        location: 'Office'
      }
      
      expect(getActualDuration(task)).toBe(60)
    })
  })

  describe('calculateStreak', () => {
    it('should return 0 for empty task list', () => {
      expect(calculateStreak([])).toBe(0)
    })

    it('should return 0 when no tasks are completed', () => {
      const tasks: Task[] = [{
        id: 1,
        title: 'Test Task',
        category: 'Work' as Category,
        plannedDuration: 60,
        status: TaskStatus.Pending,
        startTime: new Date().toISOString(),
        isVirtual: false,
        location: 'Office'
      }]
      
      expect(calculateStreak(tasks)).toBe(0)
    })

    it('should calculate streak correctly for consecutive completed tasks', () => {
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const tasks: Task[] = [
        {
          id: 1,
          title: 'Today Task',
          category: 'Work' as Category,
          plannedDuration: 60,
          status: TaskStatus.Completed,
          startTime: today.toISOString(),
          isVirtual: false,
          location: 'Office'
        },
        {
          id: 2,
          title: 'Yesterday Task',
          category: 'Work' as Category,
          plannedDuration: 60,
          status: TaskStatus.Completed,
          startTime: yesterday.toISOString(),
          isVirtual: false,
          location: 'Office'
        }
      ]
      
      expect(calculateStreak(tasks)).toBe(2)
    })
  })

  describe('getTodaysTaskCompletion', () => {
    it('should return 0 when no tasks exist for today', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const tasks: Task[] = [{
        id: 1,
        title: 'Yesterday Task',
        category: 'Work' as Category,
        plannedDuration: 60,
        status: TaskStatus.Completed,
        startTime: yesterday.toISOString(),
        isVirtual: false,
        location: 'Office'
      }]
      
      expect(getTodaysTaskCompletion(tasks)).toBe(0)
    })

    it('should calculate completion percentage correctly', () => {
      const today = new Date()
      
      const tasks: Task[] = [
        {
          id: 1,
          title: 'Completed Task',
          category: 'Work' as Category,
          plannedDuration: 60,
          status: TaskStatus.Completed,
          startTime: today.toISOString(),
          isVirtual: false,
          location: 'Office'
        },
        {
          id: 2,
          title: 'Pending Task',
          category: 'Work' as Category,
          plannedDuration: 60,
          status: TaskStatus.Pending,
          startTime: today.toISOString(),
          isVirtual: false,
          location: 'Office'
        }
      ]
      
      expect(getTodaysTaskCompletion(tasks)).toBe(50) // 1 of 2 completed = 50%
    })
  })

  describe('getTopCategories', () => {
    it('should return categories sorted by frequency', () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: 'Work Task 1',
          category: 'Work' as Category,
          plannedDuration: 60,
          status: TaskStatus.Completed,
          startTime: new Date().toISOString(),
          isVirtual: false,
          location: 'Office'
        },
        {
          id: 2,
          title: 'Work Task 2',
          category: 'Work' as Category,
          plannedDuration: 60,
          status: TaskStatus.Completed,
          startTime: new Date().toISOString(),
          isVirtual: false,
          location: 'Office'
        },
        {
          id: 3,
          title: 'Learning Task',
          category: 'Learning' as Category,
          plannedDuration: 60,
          status: TaskStatus.Completed,
          startTime: new Date().toISOString(),
          isVirtual: false,
          location: 'Home'
        }
      ]
      
      const topCategories = getTopCategories(tasks, 2)
      expect(topCategories).toEqual(['Work', 'Learning'])
    })

    it('should limit results to specified count', () => {
      const tasks: Task[] = [
        { id: 1, title: 'Work Task', category: 'Work' as Category, plannedDuration: 60, status: TaskStatus.Completed, startTime: new Date().toISOString(), isVirtual: false, location: 'Office' },
        { id: 2, title: 'Learning Task', category: 'Learning' as Category, plannedDuration: 60, status: TaskStatus.Completed, startTime: new Date().toISOString(), isVirtual: false, location: 'Home' },
        { id: 3, title: 'Personal Task', category: 'Personal' as Category, plannedDuration: 60, status: TaskStatus.Completed, startTime: new Date().toISOString(), isVirtual: false, location: 'Home' }
      ]
      
      const topCategories = getTopCategories(tasks, 1)
      expect(topCategories).toHaveLength(1)
    })
  })

  describe('inferHomeLocation', () => {
    it('should return sleep location when available', () => {
      const tasks: Task[] = [{
        id: 1,
        title: 'Sleep',
        category: 'Personal' as Category,
        plannedDuration: 480,
        status: TaskStatus.Completed,
        startTime: new Date('2023-01-01T23:00:00').toISOString(),
        isVirtual: false,
        location: 'Bedroom'
      }]
      
      expect(inferHomeLocation(tasks)).toBe('Bedroom')
    })

    it('should return most frequent nighttime location', () => {
      const tasks: Task[] = [
        {
          id: 1,
          title: 'Late Work',
          category: 'Work' as Category,
          plannedDuration: 60,
          status: TaskStatus.Completed,
          startTime: new Date('2023-01-01T23:00:00').toISOString(),
          isVirtual: false,
          location: 'Home Office'
        },
        {
          id: 2,
          title: 'Another Late Task',
          category: 'Personal' as Category,
          plannedDuration: 60,
          status: TaskStatus.Completed,
          startTime: new Date('2023-01-02T23:00:00').toISOString(),
          isVirtual: false,
          location: 'Home Office'
        }
      ]
      
      expect(inferHomeLocation(tasks)).toBe('Home Office')
    })

    it('should return null when no suitable location found', () => {
      const tasks: Task[] = [{
        id: 1,
        title: 'Daytime Task',
        category: 'Work' as Category,
        plannedDuration: 60,
        status: TaskStatus.Completed,
        startTime: new Date('2023-01-01T12:00:00').toISOString(),
        isVirtual: true,
        location: 'Virtual'
      }]
      
      expect(inferHomeLocation(tasks)).toBeNull()
    })
  })
})
