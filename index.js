require('dotenv').config();
const fs = require('fs');
const yaml = require('js-yaml');
const { VectorDb, PromptManager } = require('./src');

class Autogpt {
    constructor(objective) {
      this.objective = objective; //string of the mission of the bot
      this.state = {}; // Initialize state
      this.tasklist = []; // Initialize tasklist
      this.biases = {}; // Initialize biases
      this.promptManager = new PromptManager(yaml.safeLoad(fs.readFileSync('./prompts/prompts.yaml', 'utf8'))); // Initialize prompt manager
      this.vectorDb = new VectorDb(); // Initialize vector database
    }
  
    async run() {
      // Initialize the tasklist with the first task
      this.tasklist.push({ task: this.objective, done: false });
        
      while (this.tasklist.length > 0) {
        // Get the next task to perform
        const currentTask = this.tasklist.shift();
  
        // Execute the current task
        const response = await this.executeTask(currentTask);
  
        // Update the state with the response
        this.state[currentTask.task_id] = response;
  
        // Check if the current task is complete
        if (this.isTaskComplete(currentTask, response)) {
          // Mark the task as done
          currentTask.done = true;
  
          // Update parent tasks' reward_for_action
          this.updateParentReward(currentTask);
  
          // Prioritize the remaining tasks
          this.prioritizeTasks();
  
          // Check if all tasks are complete
          if (this.isObjectiveComplete()) {
            console.log('Objective complete!');
            break;
          }
        } else {
          // Generate new tasks based on the current task
          const newTasks = await this.generateNewTasks(currentTask.task, response);
  
          // Add the new tasks to the tasklist
          this.tasklist.push(...newTasks);
  
          // Prioritize the remaining tasks
          this.prioritizeTasks();
        }
      }
    }
  
    async generateNewTasks(currentTask, response) {
      // Get the next task to perform from the prompt manager
      const nextTask = await this.promptManager.getNextTaskPrompt(this.objective, currentTask, response, this.tasklist.filter((t) => !t.done));
  
      // Convert the task prompt to a task object
      const tasks = this.promptManager.generate(nextTask);
  
      return tasks;
    }
  
    async executeTask(task) {
      //get neighbors of the current task for context
      const context = this.vectorDb.getContext(task);
      // Get the execution prompt for the task
      const executionPrompt = this.promptManager.getExecutionPrompt(this.objective, context, this.state, task);
  
      // Execute the task using ChatGPT and return the response
      const response = await chatGpt.execute(executionPrompt);
  
      return response;
    }
  
    isTaskComplete(task, response) {
      // Check if the task is complete based on the response
      // You may want to customize this based on the specific task
      //return response !== null && response !== undefined && response.trim() !== '';
    }
  
    updateParentReward(task) {
      // Update the reward_for_action of parent tasks that depend on this task
      // You may want to customize this based on the specific task and its dependencies
      // Find all tasks that have the completed task as a dependency
      const parentTasks = this.tasklist.filter(task => {
        return task.dependencies.includes(task.task_id);
      });
      
      // Update the reward_for_action field of each parent task
      parentTasks.forEach(parent => {
        parent.reward_for_action += task.reward;
      });
      
      // Recursively update the parent tasks of the updated tasks, only if they are not root tasks
      parentTasks.forEach(parent => {
        if (parent.dependencies.length > 0) {
          updateParentRewards(task, parent);
        }
      });
    }
  
    prioritizeTasks() {
      // Prioritize the tasks based on their rewards and biases
      // You may want to customize this based on your specific prioritization algorithm
      //tasks, rewardBias, difficultyBias, importanceBias, dependencyBias) {
      // Filter out tasks that have dependencies that are not done
      const availableTasks = this.tasklist.filter(task => {
        return task.dependencies.every(dep => {
          const depTask = this.tasklist.find(t => t.task_id === dep);
          return depTask.done;
        });
      });
      
      // Calculate the priority score for each task
      const priorityScores = availableTasks.map(task => {
        const rewardScore = task.reward * this.rewardBias;
        const difficultyScore = 1 / (task.estimated_difficulty * this.difficultyBias);
        const importanceScore = task.estimated_importance * this.importanceBias;
        const dependencyScore = task.dependencies.length * this.dependencyBias;
      
        return {
          task: task,
          score: rewardScore + difficultyScore + importanceScore + dependencyScore
        };
      });
      
      // Sort tasks by priority score
      priorityScores.sort((a, b) => b.score - a.score);
      
      // Return the sorted list of tasks
      this.tasklist = priorityScores.map(ps => ps.task);
    }
      
    isObjectiveComplete() {
      // Check if all tasks in the objective are complete
      return this.tasklist.filter((t) => !t.done).length === 0;
    }
    
    generateTaskEmbedding(task){};
    //async generateNewTasks(
}