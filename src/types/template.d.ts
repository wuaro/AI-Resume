/**
 * 简历模板数据结构
 */
export interface Template {
  /** 
   * 模板id
   * @example "classic-blue-2023"
   */
  id: string;

  /** 
   * 模板展示名称 
   * @example "经典蓝调"
   */
  name: string;

  /** 
   * 模板描述信息（可选）
   * @example "适用于IT行业的现代简约风格模板"
   */
  description?: string;

  /** 
   * 模板文件存储路径（可选）
   * @example "/templates/classic-blue"
   */
  folderPath?: String;

  /** 
   * 缩略图路径（可选）
   * @example "/thumbnails/classic-blue-preview.png"
   */
  thumbnail?: String;

  /** 
   * 模板作者信息
   * @example "AI简历设计团队"
   */
  author: String;

  /** 
   * 相关参考链接（文档或示例）
   * @example "https://example.com/template-docs"
   */
  link: String;
}
