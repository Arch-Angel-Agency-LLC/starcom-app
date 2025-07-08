/**
 * WorkflowScheduler.ts
 * 
 * This module provides scheduling capabilities for NetRunner bot workflows.
 * It manages the scheduling, triggering, and tracking of automated workflows.
 */

import { v4 as uuidv4 } from 'uuid';
import { Workflow, WorkflowSchedule, WorkflowEngine } from './WorkflowEngine';

// Scheduled job
export interface ScheduledJob {
  id: string;
  workflowId: string;
  scheduledTime: string;  // ISO date string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  created: string;  // ISO date string
  started?: string;  // ISO date string
  completed?: string;  // ISO date string
  executionId?: string;
  recurrence?: WorkflowSchedule;
  nextJobId?: string;
}

/**
 * Workflow Scheduler Class
 * 
 * Manages the scheduling and execution of workflows.
 */
export class WorkflowScheduler {
  private jobs: ScheduledJob[] = [];
  private timers: Record<string, NodeJS.Timeout> = {};
  private workflowEngine: WorkflowEngine;
  
  constructor(workflowEngine: WorkflowEngine) {
    this.workflowEngine = workflowEngine;
  }
  
  /**
   * Initialize the scheduler
   * Load active workflows and schedule them
   */
  initialize(): void {
    // Get all active workflows
    const activeWorkflows = this.workflowEngine.getActiveWorkflows();
    
    // Schedule each workflow
    activeWorkflows.forEach(workflow => {
      if (workflow.schedule) {
        this.scheduleWorkflow(workflow.id, workflow.schedule);
      }
    });
    
    console.log(`Initialized WorkflowScheduler with ${this.jobs.length} scheduled jobs`);
  }
  
  /**
   * Schedule a workflow
   */
  scheduleWorkflow(workflowId: string, schedule: WorkflowSchedule): ScheduledJob | null {
    // Get the workflow
    const workflow = this.workflowEngine.getWorkflow(workflowId);
    if (!workflow) {
      console.error(`Cannot schedule workflow: Workflow with ID ${workflowId} not found`);
      return null;
    }
    
    // Calculate the next run time
    const nextRunTime = this.calculateNextRunTime(schedule);
    if (!nextRunTime) {
      console.error(`Cannot schedule workflow: Invalid schedule configuration`);
      return null;
    }
    
    // Create a scheduled job
    const job: ScheduledJob = {
      id: uuidv4(),
      workflowId,
      scheduledTime: nextRunTime,
      status: 'pending',
      created: new Date().toISOString(),
      recurrence: schedule.type !== 'once' ? schedule : undefined
    };
    
    // Add the job to the list
    this.jobs.push(job);
    
    // Schedule the timer
    this.scheduleTimer(job);
    
    console.log(`Scheduled workflow ${workflow.name} (${workflowId}) to run at ${nextRunTime}`);
    
    return job;
  }
  
  /**
   * Schedule a timer for a job
   */
  private scheduleTimer(job: ScheduledJob): void {
    // Calculate the delay until the scheduled time
    const scheduledTime = new Date(job.scheduledTime).getTime();
    const now = Date.now();
    const delay = Math.max(0, scheduledTime - now);
    
    // Schedule the timer
    this.timers[job.id] = setTimeout(() => {
      this.executeJob(job.id);
    }, delay);
    
    console.log(`Set timer for job ${job.id} with delay of ${delay}ms (${Math.round(delay / 1000 / 60)} minutes)`);
  }
  
  /**
   * Execute a scheduled job
   */
  private async executeJob(jobId: string): Promise<void> {
    // Find the job
    const jobIndex = this.jobs.findIndex(job => job.id === jobId);
    if (jobIndex === -1) {
      console.error(`Cannot execute job: Job with ID ${jobId} not found`);
      return;
    }
    
    const job = this.jobs[jobIndex];
    
    // Check if the job is already running or completed
    if (job.status !== 'pending') {
      console.log(`Skipping job ${jobId} execution as it is already ${job.status}`);
      return;
    }
    
    // Update job status to running
    job.status = 'running';
    job.started = new Date().toISOString();
    
    try {
      console.log(`Executing workflow ${job.workflowId} for job ${jobId}`);
      
      // Execute the workflow
      const executionState = await this.workflowEngine.executeWorkflow(job.workflowId);
      
      // Update job with execution results
      job.executionId = executionState.executionId;
      job.status = executionState.status === 'completed' ? 'completed' : 'failed';
      job.completed = new Date().toISOString();
      
      // Schedule the next job if this is a recurring workflow
      if (job.recurrence && job.status === 'completed') {
        this.scheduleNextRecurrence(job);
      }
      
      console.log(`Workflow execution completed for job ${jobId} with status ${job.status}`);
    } catch (error) {
      // Update job status to failed
      job.status = 'failed';
      job.completed = new Date().toISOString();
      
      console.error(`Error executing workflow for job ${jobId}:`, error);
    }
    
    // Update the job in the list
    this.jobs[jobIndex] = job;
  }
  
  /**
   * Schedule the next recurrence of a job
   */
  private scheduleNextRecurrence(job: ScheduledJob): void {
    if (!job.recurrence) {
      return;
    }
    
    // Calculate the next run time
    const nextRunTime = this.calculateNextRunTime(job.recurrence, job.scheduledTime);
    if (!nextRunTime) {
      console.log(`No more recurrences for job ${job.id}`);
      return;
    }
    
    // Create a new job for the next recurrence
    const nextJob: ScheduledJob = {
      id: uuidv4(),
      workflowId: job.workflowId,
      scheduledTime: nextRunTime,
      status: 'pending',
      created: new Date().toISOString(),
      recurrence: job.recurrence
    };
    
    // Add the job to the list
    this.jobs.push(nextJob);
    
    // Update the current job with the next job ID
    job.nextJobId = nextJob.id;
    
    // Schedule the timer for the next job
    this.scheduleTimer(nextJob);
    
    console.log(`Scheduled next recurrence of workflow ${job.workflowId} to run at ${nextRunTime}`);
  }
  
  /**
   * Calculate the next run time based on schedule
   */
  private calculateNextRunTime(schedule: WorkflowSchedule, lastRunTime?: string): string | null {
    const now = new Date();
    const baseTime = lastRunTime ? new Date(lastRunTime) : now;
    
    switch (schedule.type) {
      case 'once': {
        // For one-time schedules, use the start time if it's in the future
        if (!schedule.startTime) return null;
        
        const startTime = new Date(schedule.startTime);
        if (startTime > now) {
          return schedule.startTime;
        }
        
        return null;  // One-time schedule in the past
      }
      
      case 'recurring': {
        if (!schedule.interval) return null;
        
        // Calculate next run based on interval
        const nextRun = new Date(baseTime.getTime() + schedule.interval * 60 * 1000);
        
        // Check if we're past the end time
        if (schedule.endTime && nextRun > new Date(schedule.endTime)) {
          return null;
        }
        
        return nextRun.toISOString();
      }
      
      case 'cron': {
        // Cron-based scheduling would be implemented here
        // For now, just return a time 24 hours in the future
        const nextRun = new Date(baseTime.getTime() + 24 * 60 * 60 * 1000);
        
        // Check if we're past the end time
        if (schedule.endTime && nextRun > new Date(schedule.endTime)) {
          return null;
        }
        
        return nextRun.toISOString();
      }
      
      default:
        return null;
    }
  }
  
  /**
   * Get all scheduled jobs
   */
  getJobs(): ScheduledJob[] {
    return [...this.jobs];
  }
  
  /**
   * Get jobs for a workflow
   */
  getWorkflowJobs(workflowId: string): ScheduledJob[] {
    return this.jobs.filter(job => job.workflowId === workflowId);
  }
  
  /**
   * Get a job by ID
   */
  getJob(jobId: string): ScheduledJob | undefined {
    return this.jobs.find(job => job.id === jobId);
  }
  
  /**
   * Cancel a scheduled job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.find(job => job.id === jobId);
    if (!job || job.status !== 'pending') {
      return false;
    }
    
    // Clear the timer
    if (this.timers[jobId]) {
      clearTimeout(this.timers[jobId]);
      delete this.timers[jobId];
    }
    
    // Update job status
    job.status = 'cancelled';
    
    console.log(`Cancelled scheduled job ${jobId} for workflow ${job.workflowId}`);
    
    return true;
  }
  
  /**
   * Cancel all jobs for a workflow
   */
  cancelWorkflowJobs(workflowId: string): number {
    const jobs = this.getWorkflowJobs(workflowId).filter(job => job.status === 'pending');
    
    let cancelledCount = 0;
    jobs.forEach(job => {
      if (this.cancelJob(job.id)) {
        cancelledCount++;
      }
    });
    
    return cancelledCount;
  }
  
  /**
   * Run a workflow immediately
   */
  runWorkflowNow(workflowId: string): ScheduledJob | null {
    // Get the workflow
    const workflow = this.workflowEngine.getWorkflow(workflowId);
    if (!workflow) {
      console.error(`Cannot run workflow: Workflow with ID ${workflowId} not found`);
      return null;
    }
    
    // Create a scheduled job for immediate execution
    const job: ScheduledJob = {
      id: uuidv4(),
      workflowId,
      scheduledTime: new Date().toISOString(),
      status: 'pending',
      created: new Date().toISOString()
    };
    
    // Add the job to the list
    this.jobs.push(job);
    
    // Execute the job immediately
    setTimeout(() => {
      this.executeJob(job.id);
    }, 0);
    
    console.log(`Scheduled workflow ${workflow.name} (${workflowId}) to run immediately`);
    
    return job;
  }
  
  /**
   * Clean up completed and failed jobs
   */
  cleanupJobs(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    const initialLength = this.jobs.length;
    
    // Keep jobs that are pending, running, or completed/failed but not too old
    this.jobs = this.jobs.filter(job => {
      if (job.status === 'pending' || job.status === 'running') {
        return true;
      }
      
      // For completed or failed jobs, check age
      const completedTime = job.completed ? new Date(job.completed).getTime() : now;
      const age = now - completedTime;
      
      return age < maxAge;
    });
    
    return initialLength - this.jobs.length;
  }
  
  /**
   * Shut down the scheduler
   */
  shutdown(): void {
    // Clear all timers
    Object.values(this.timers).forEach(timer => {
      clearTimeout(timer);
    });
    
    this.timers = {};
    
    console.log(`Shut down WorkflowScheduler, cleared ${Object.keys(this.timers).length} timers`);
  }
}
