import type { DialogueHistory } from "../types/aiDialogue";

/**
 * WorkerPool 类用于管理 Worker 线程池，实现任务的分配和执行
 */
export class WorkerPool {
  // 存储 Worker 线程的数组，即 Worker 线程池
  private workers: Worker[] = []; 
  /**
   * 任务队列，存储待执行的任务信息：
   * - taskId: 任务的唯一标识符，用于标识每个任务
   * - messages: 对话历史，包含用户和 AI 的消息记录
   * - userApiKey: 用户的 API Key，用于身份验证
   * - model: 选择的模型名称
   * - API_URL: 请求的 API 地址
   * - onResponse: 任务完成后的回调函数，用于处理结果
   */
  private queue: {
    taskId: number;
    messages: DialogueHistory;
    userApiKey: string;
    model: string;
    API_URL: string;
    onResponse: (responseText: string, isComplete: boolean) => void;
  }[] = []; 
  // 存储正在执行的任务，键为任务 ID，值为对应的 Worker
  private activeTasks: Map<number, Worker> = new Map(); 
  // 任务 ID 计数器，用于为每个新任务分配唯一的 ID
  private nextTaskId = 1;     

  /**
   * 构造函数，初始化 Worker 线程池
   * @param workerCount 要创建的 Worker 线程数量
   */
  constructor(workerCount: number) {
    // 循环创建指定数量的 Worker 线程
    for (let i = 0; i < workerCount; i++) {
      // 创建一个新的 Worker 线程，指定其脚本文件路径并设置为模块类型
      const worker = new Worker(new URL("./aiWorker.ts", import.meta.url), { type: "module" });
      // 将新创建的 Worker 线程添加到线程池数组中
      this.workers.push(worker);

      // 为 Worker 线程的消息事件添加监听器
      worker.onmessage = (event) => {
        // 从事件数据中解构出任务 ID、结果和完成状态
        const { taskId, result, isComplete } = event.data;
        // 在任务队列中查找对应任务 ID 的任务
        const task = this.queue.find((t) => t.taskId === taskId);
        // 如果找到对应的任务，则调用其回调函数处理结果
        if (task) {
          task.onResponse(result, isComplete);
        }
        // 如果任务已完成
        if (isComplete) {
          // 从正在执行的任务列表中删除该任务
          this.activeTasks.delete(taskId);
          // 将该 Worker 线程放回线程池
          this.workers.push(worker);
          // 处理任务队列中的下一个任务
          this.processQueue();
        }
      };

      // 为 Worker 线程的错误事件添加监听器
      worker.onerror = (error) => {
        // 打印错误信息
        console.error("Worker 处理任务失败:", error);
        // 将该 Worker 线程放回线程池
        this.workers.push(worker);
        // 处理任务队列中的下一个任务
        this.processQueue();
      };
    }
  }

  /**
   * 新增任务到任务队列并尝试处理
   * @param messages 对话历史
   * @param userApiKey API Key
   * @param model 选择的模型
   * @param API_URL 请求 API 地址
   * @param onResponse 结果回调函数
   */
  execute(
    messages: DialogueHistory,
    userApiKey: string,
    model: string,
    API_URL: string,
    onResponse: (responseText: string, isComplete: boolean) => void
  ): void {
    // 生成一个新的任务 ID
    const taskId = this.nextTaskId++;
    // 将新任务添加到任务队列中
    this.queue.push({ taskId, messages, userApiKey, model, API_URL, onResponse });
    // 处理任务队列中的任务
    this.processQueue();
  }

  /**
   * 处理任务队列，将任务分配给空闲的 Worker 线程
   */
  private processQueue() {
    // 检查任务队列和线程池是否都有可用资源
    if (this.queue.length > 0 && this.workers.length > 0) {
      // 从线程池中取出一个空闲的 Worker 线程
      const worker = this.workers.pop()!;
      // 从任务队列中取出第一个任务
      const { taskId, messages, userApiKey, model, API_URL, onResponse } = this.queue.shift()!;
      // 将该任务标记为正在执行
      this.activeTasks.set(taskId, worker);

      try {
        // 手动克隆 messages 数据，避免 postMessage 自动克隆出现问题
        const clonedMessages = JSON.parse(JSON.stringify(messages));
        // 向刚从线程池中取出的这个 worker 线程发送任务数据（任务是刚从任务队列中取出的）
        worker.postMessage({ taskId, messages: clonedMessages, userApiKey, model, API_URL });
        console.log(`任务${taskId}分配给 Worker:${worker}`);

        // 添加消息事件监听器，监听该worker线程返回的消息，即任务的处理结果
        worker.onmessage = (event) => {
          // 从事件数据中解构出任务 ID、结果和完成状态
          const { taskId, result, isComplete } = event.data;
          // 调用任务的回调函数处理结果
          onResponse(result, isComplete);
          // 如果任务已完成
          if (isComplete) {
            // 从正在执行的任务列表中删除该任务
            this.activeTasks.delete(taskId);
            // 将该 Worker 线程放回线程池
            this.workers.push(worker);
            // 处理任务队列中的下一个任务
            this.processQueue();
          }
        };
      } catch (error) {
        // 若数据传输失败，调用回调函数返回错误信息
        onResponse("数据传输失败", true);
        // 将该 Worker 线程放回线程池
        this.workers.push(worker);
        // 处理任务队列中的下一个任务
        this.processQueue();
      }
    }
  }

  /**
   * 终止所有 Worker 线程，清空相关数据
   */
  terminate() {
    // 遍历线程池中的所有 Worker 线程并终止它们
    this.workers.forEach((worker) => worker.terminate());
    // 清空线程池数组
    this.workers = [];
    // 清空正在执行的任务列表
    this.activeTasks.clear();
  }
}
