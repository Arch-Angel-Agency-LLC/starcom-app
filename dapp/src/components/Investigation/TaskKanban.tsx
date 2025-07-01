// TaskKanban.tsx - Kanban board for investigation tasks
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../interfaces/Investigation';
import { useInvestigation } from '../../hooks/useInvestigation';
import { useMemoryAware } from '../../hooks/useMemoryAware';
import styles from './TaskKanban.module.css';

interface TaskKanbanProps {
  investigationId?: string;
  tasks?: Task[];
  onTaskUpdate?: (task: Task) => void;
  onTaskCreate?: (task: Partial<Task>) => void;
  readOnly?: boolean;
}

const TASK_COLUMNS: Array<{ id: TaskStatus; title: string; color: string }> = [
  { id: 'pending', title: 'To Do', color: '#64748b' },
  { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
  { id: 'blocked', title: 'Blocked', color: '#f59e0b' },
  { id: 'completed', title: 'Done', color: '#10b981' },
  { id: 'cancelled', title: 'Cancelled', color: '#ef4444' },
];

const TaskKanban: React.FC<TaskKanbanProps> = ({
  investigationId,
  tasks: propTasks,
  onTaskUpdate,
  onTaskCreate,
  readOnly = false,
}) => {
  const { state, updateTask, createTask } = useInvestigation();
  
  // Memory monitoring for task management
  const { isMemoryHigh, isMemoryCritical, shouldProceedWithOperation, getRecommendedPageSize } = useMemoryAware();
  
  // Use tasks from props or context
  const allTasks = propTasks || state.tasks;
  
  // Filter tasks by investigation if specified
  const tasks = useMemo(() => {
    if (investigationId) {
      return allTasks.filter(task => task.investigation_id === investigationId);
    }
    return allTasks;
  }, [allTasks, investigationId]);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<TaskStatus>('pending');
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    assigned_to: '',
    due_date: '',
  });

  // Group tasks by status with memory-aware limiting
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      blocked: [],
      completed: [],
      cancelled: [],
    };

    tasks.forEach(task => {
      grouped[task.status].push(task);
    });

    // Apply memory-aware limits to each column
    const maxTasksPerColumn = getRecommendedPageSize(10, 50); // 10 default, max 50 per column
    
    Object.keys(grouped).forEach(status => {
      const tasks = grouped[status as TaskStatus];
      if (tasks.length > maxTasksPerColumn) {
        // Keep most recent tasks when memory is constrained
        grouped[status as TaskStatus] = tasks
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, maxTasksPerColumn);
      }
    });

    return grouped;
  }, [tasks, getRecommendedPageSize]);

  const getTaskCount = (status: TaskStatus) => tasksByStatus[status].length;

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'urgent': return '🔴';
      default: return '⚪';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 0) {
      return `In ${Math.abs(diffDays)} days`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === targetStatus || readOnly) {
      setDraggedTask(null);
      return;
    }

    try {
      const updatedTask = { ...draggedTask, status: targetStatus };
      
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      } else {
        await updateTask(draggedTask.investigation_id, draggedTask.id, { status: targetStatus });
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status. Please try again.');
    }
    
    setDraggedTask(null);
  };

  const handleCreateTask = async () => {
    if (!investigationId || !taskFormData.title.trim()) return;

    // Check memory before creating new task
    if (!shouldProceedWithOperation) {
      console.warn('Cannot create task: memory usage too high');
      alert('Cannot create task: System memory usage is high. Please try again later.');
      return;
    }

    try {
      const newTask = {
        investigation_id: investigationId,
        title: taskFormData.title,
        description: taskFormData.description,
        status: selectedColumn,
        priority: taskFormData.priority,
        assigned_to: taskFormData.assigned_to || undefined,
        due_date: taskFormData.due_date || undefined,
        created_by: 'system', // TODO: Get from auth context
      };

      if (onTaskCreate) {
        onTaskCreate(newTask);
      } else {
        await createTask(investigationId, newTask);
      }

      // Reset form
      setTaskFormData({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: '',
        due_date: '',
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  const openCreateModal = (status: TaskStatus) => {
    setSelectedColumn(status);
    setShowCreateModal(true);
  };

  return (
    <div className={styles.taskKanban}>
      {/* Header */}
      <div className={styles.kanbanHeader}>
        <div className={styles.headerContent}>
          <h2>📋 Task Board</h2>
          <div className={styles.headerStats}>
            <span className={styles.stat}>
              Total: <strong>{tasks.length}</strong>
            </span>
            <span className={styles.stat}>
              In Progress: <strong>{getTaskCount('in_progress')}</strong>
            </span>
            <span className={styles.stat}>
              Completed: <strong>{getTaskCount('completed')}</strong>
            </span>
            {/* Memory status indicator */}
            {(isMemoryHigh || isMemoryCritical) && (
              <span className={`${styles.memoryWarning} ${isMemoryCritical ? styles.critical : styles.warning}`}>
                {isMemoryCritical ? '🔴 Memory Critical' : '🟡 Memory High'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className={styles.kanbanBoard}>
        {TASK_COLUMNS.map((column) => (
          <div
            key={column.id}
            className={styles.kanbanColumn}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div 
              className={styles.columnHeader}
              style={{ borderTopColor: column.color }}
            >
              <div className={styles.columnTitle}>
                <span className={styles.columnName}>{column.title}</span>
                <span 
                  className={styles.columnCount}
                  style={{ backgroundColor: column.color }}
                >
                  {getTaskCount(column.id)}
                </span>
              </div>
              
              {!readOnly && investigationId && (
                <button
                  className={styles.addTaskButton}
                  onClick={() => shouldProceedWithOperation ? openCreateModal(column.id) : null}
                  disabled={!shouldProceedWithOperation}
                  title={shouldProceedWithOperation ? "Add task" : "Memory usage too high - task creation disabled"}
                >
                  ➕
                </button>
              )}
            </div>

            {/* Task Cards */}
            <div className={styles.taskList}>
              {tasksByStatus[column.id].length === 0 ? (
                <div className={styles.emptyColumn}>
                  <span className={styles.emptyText}>No tasks</span>
                  {!readOnly && investigationId && (
                    <button
                      className={styles.emptyAddButton}
                      onClick={() => shouldProceedWithOperation ? openCreateModal(column.id) : null}
                      disabled={!shouldProceedWithOperation}
                      title={shouldProceedWithOperation ? "Add first task" : "Memory usage too high - task creation disabled"}
                    >
                      Add first task
                    </button>
                  )}
                </div>
              ) : (
                tasksByStatus[column.id].map((task) => (
                  <div
                    key={task.id}
                    className={`${styles.taskCard} ${
                      draggedTask?.id === task.id ? styles.dragging : ''
                    }`}
                    draggable={!readOnly}
                    onDragStart={(e) => handleDragStart(e, task)}
                  >
                    {/* Task Header */}
                    <div className={styles.taskHeader}>
                      <div className={styles.taskTitle}>
                        <span className={styles.priorityIcon}>
                          {getPriorityIcon(task.priority)}
                        </span>
                        <h4>{task.title}</h4>
                      </div>
                      
                      <div className={styles.taskActions}>
                        <button 
                          className={styles.taskAction}
                          title="Edit task"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>

                    {/* Task Description */}
                    {task.description && (
                      <div className={styles.taskDescription}>
                        <p>
                          {task.description.length > 100
                            ? `${task.description.substring(0, 100)}...`
                            : task.description}
                        </p>
                      </div>
                    )}

                    {/* Task Meta */}
                    <div className={styles.taskMeta}>
                      {task.assigned_to && (
                        <div className={styles.taskAssignee}>
                          <span className={styles.assigneeIcon}>👤</span>
                          <span className={styles.assigneeName}>
                            {task.assigned_to}
                          </span>
                        </div>
                      )}
                      
                      {task.due_date && (
                        <div className={styles.taskDueDate}>
                          <span className={styles.dueDateIcon}>📅</span>
                          <span className={styles.dueDate}>
                            {formatDate(task.due_date)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Task Footer */}
                    <div className={styles.taskFooter}>
                      <span className={styles.taskId}>#{task.id.slice(-8)}</span>
                      <span className={styles.taskCreated}>
                        {formatDate(task.created_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Create New Task</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label htmlFor="taskTitle">Title *</label>
                <input
                  id="taskTitle"
                  type="text"
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title..."
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="taskDescription">Description</label>
                <textarea
                  id="taskDescription"
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the task..."
                  className={styles.formTextarea}
                  rows={3}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="taskPriority">Priority</label>
                  <select
                    id="taskPriority"
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                    className={styles.formSelect}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="taskAssignee">Assignee</label>
                  <input
                    id="taskAssignee"
                    type="text"
                    value={taskFormData.assigned_to}
                    onChange={(e) => setTaskFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                    placeholder="Assign to..."
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="taskDueDate">Due Date</label>
                <input
                  id="taskDueDate"
                  type="date"
                  value={taskFormData.due_date}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Status</label>
                <div className={styles.statusInfo}>
                  Will be created in: <strong>{TASK_COLUMNS.find(c => c.id === selectedColumn)?.title}</strong>
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.createButton}
                onClick={handleCreateTask}
                disabled={!taskFormData.title.trim()}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskKanban;
