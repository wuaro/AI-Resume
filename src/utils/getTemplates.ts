import type { Template } from '../types/template';

/**
 * 获取简历模板列表数据
 * @returns {Promise<Template[]>} 返回包含模板数据的Promise
 * @description
 * 1. 从公共目录获取 templates.json 文件
 * 2. 处理网络请求错误和响应状态
 * 3. 返回空数组作为降级方案（保持程序可用性）
 */
export const getTemplates = async (): Promise<Template[]> => {
  try {
    // 请求公共目录下的模板配置文件
    const response = await fetch('/templates.json'); // 使用绝对路径（相对于域名根目录）
    console.log('[getTemplates] 模板配置文件请求结果:', response); // 输出请求结果，便于调试
    // HTTP状态码检查（200-299 之外的状态码视为失败）
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    // 解析JSON数据并自动类型转换（需确保接口返回数据结构匹配Template类型）
    return await response.json();
  } catch (error) {
    // 统一错误处理（包含网络错误、JSON解析错误、手动抛出的错误）
    console.error('[getTemplates] 获取模板列表失败:', error);
    
    // 返回空数组作为降级方案，保证页面基础功能可用
    return [];
  }
};
