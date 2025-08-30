// src/store/useResumeStore.ts
import { defineStore } from 'pinia';
import { resumeTemplate } from '../data/resumeDataTemplate.ts';
import { message } from 'ant-design-vue';

/**
 * 个人信息接口 - 描述求职者基本资料
 */
export interface PersonalInfo {
  name: string;                 // 姓名（例如："张三"）
  gender: string;               // 性别（建议值：'男' | '女' | '其他'）
  phone: string;                // 联系电话（格式："138-1234-5678"）
  email: string;                // 电子邮箱（格式："user@example.com"）
  university: string;           // 毕业院校（例如："清华大学"）
  politicalStatus: string;      // 政治面貌（建议值："中共党员"/"群众"等）
  website: string;              // 个人网站/博客URL（格式："https://example.com"）
  avatar: string;               // 头像（Base64编码 或 图片URL）
  major: string;                // 专业（例如："计算机科学与技术"）
  applicationPosition: string;  // 应聘岗位（例如："前端开发工程师"）
  age: string;                  // 年龄（允许字符串类型，例如："25" 或 "25岁"）
}

/**
 * 教育经历接口 - 描述学历教育信息
 */
export interface Education {
  id: number;            // 唯一标识符（用于列表渲染和操作）
  school: string;        // 学校名称（例如："北京大学"）
  degree: string;        // 学位（建议值："本科" | "硕士" | "博士"）
  major: string;         // 所学专业（例如："软件工程"）
  startDate: string;     // 入学时间（建议格式："YYYY-MM"）
  endDate: string;       // 毕业时间（建议格式："YYYY-MM"）
}

/**
 * 工作经历接口 - 描述职业经历信息
 */
export interface WorkExperience {
  id: number;               // 唯一标识符
  company: string;          // 公司名称（例如："阿里巴巴集团"）
  position: string;         // 担任职位（例如："高级前端工程师"）
  startDate: string | null; // 入职时间（建议格式："YYYY-MM"，null表示未填写）
  endDate: string | null;   // 离职时间（"至今"建议用当前时间或特殊标记）
  description: string;      // 工作职责描述（支持多行文本）
}

/**
 * 技能信息接口 - 描述专业技能条目
 */
export interface Skill {
  id: number;               // 唯一标识符
  skillName: string;        // 技能名称（例如："Vue.js"/"项目管理"）
}

/**
 * 项目经历接口 - 描述参与项目信息
 */
export interface Project {
  id: number;                 // 唯一标识符
  projectName: string;        // 项目名称（例如："电商后台管理系统"）
  role: string;               // 担任角色（例如："前端负责人"）
  startDate: string;          // 项目开始时间（建议格式："YYYY-MM"）
  endDate: string;            // 项目结束时间（"持续中"可设为当前时间）
  briefIntroduction: string;  // 项目简介（1-2句话摘要）
  description: string;        // 详细项目描述（技术栈/成果等）
}

/**
 * 荣誉奖项接口 - 描述所获荣誉信息
 */
export interface Honor {
  id: number;                 // 唯一标识符
  honorName: string;          // 奖项名称（例如："年度优秀员工"）
  date: string;               // 获得时间（建议格式："YYYY-MM" 或 "YYYY"）
  description: string;        // 补充说明（例如："Top 5% 员工获得"）
}

/**
 * 简历内容接口 - 描述整个简历的内容
 */
export interface ResumeState {
  personalInfo: PersonalInfo;        // 个人信息对象
  education: Education[];            // 教育经历数组
  workExperience: WorkExperience[];  // 工作经历数组
  skills: Skill[];                   // 技能列表数组
  projects: Project[];               // 项目经历数组
  honors: Honor[];                   // 荣誉奖项数组
  summary: string;                   // 个人简介/总结
  currentId: number;                 // 当前编辑项的ID
  isFirstVisit: boolean;             // 是否首次访问（用于引导提示）
}



export const useResumeStore = defineStore('resume', {
  /**
   * 启动应用 --> 读取localStorage --> 有数据? --> 是 --> 解析数据 --> 生成currentId --> 首次访问? --> 是 --> 设置标记--> 返回初始化状态
   *                                             否 --> 使用模板数据
   */
  state: (): ResumeState => {
    // 1. 从 localStorage 获取保存的数据（简历数据、模板id）
    const savedResumeData = localStorage.getItem('resumeData');
    const savedCurrentId = localStorage.getItem('currentId');

    // 2. 首次访问检测（localStorage 无 isFirstVisit 标记），如果是首次访问，则会有漫游式引导
    const isFirstVisit = localStorage.getItem('isFirstVisit') === null; // 检查是否首次访问

    // 3. 处理currentId（如果是NaN则设置为1）
    const currentId = savedCurrentId && !isNaN(Number(savedCurrentId))
      ? Number(savedCurrentId)
      : 1;

    // 4. 本地存储是否有简历数据，有就用，没有就默认初始数据（全为空）
    const resumeData = savedResumeData ? JSON.parse(savedResumeData) : resumeTemplate;

    // 5. 如果是首次访问，标记并自动填充数据
    if (isFirstVisit) {
      localStorage.setItem('isFirstVisit', 'false');
    }

    // 6. 返回简历内容数据、模板id、是否第一次访问（要符合ResumeState类型）
    return {
      ...resumeData,
      currentId,
      isFirstVisit,
    };
  },

  actions: {
    /**
     * 初始化数据
     */
    initializeCurrentId() {
      // 1. 收集所有条目的 ID
      const allIds = [
        ...this.education.map(item => item.id),
        ...this.workExperience.map(item => item.id),
        ...this.skills.map(item => item.id),
        ...this.projects.map(item => item.id),
        ...this.honors.map(item => item.id)
      ];

      /*
        2. 计算最大 ID +1（防止重复）
        初始化时检查最大 id，后面新增的时候，id是递增的
       */
      this.currentId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;

      // 3. 持久化存储模板id
      localStorage.setItem('currentId', JSON.stringify(this.currentId));
    },

    getJSONData() {
      const data = JSON.parse(JSON.stringify(this.$state));
      data.personalInfo.avatar = ''; // 头像数据不导出
      delete data.resumeSetting; // 若存在则删除（根据实际状态结构可能不存在）
      delete data.currentId;
      delete data.isFirstVisit;
      return JSON.stringify(data, null, 2);
    },

    /**
     * 导出json格式的简历数据：
     * - Blob 对象 + 临时 URL 实现前端下载
     */
    exportData() {
      // 1. 将整个state序列化，每行缩进2个空格，方便可读
      const dataStr = JSON.stringify(this.$state, null, 2);

      // 2. 创建 Blob 对象（JSON 类型）
      // - Blob（Binary Large Object）是浏览器提供的二进制数据容器，用于处理文件或类文件对象。
      const blob = new Blob([dataStr], { type: "application/json" });

      // 3. 生成临时下载链接
      const url = URL.createObjectURL(blob);

      // 4. 创建隐藏的 <a> 标签
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume_data.json";
      document.body.appendChild(a);

      // 5. 模拟点击触发下载
      a.click();

      // 6. 清理资源
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    /**
     * 导入json格式的简历数据
     * @param file
     */
    importData(file: File) {
      const reader = new FileReader();

      // 文件读取完成时的回调
      reader.onload = (event) => {    // event 包含读取结果
        try {
          // 1. 解析文件内容为 JSON 对象
          const jsonData = JSON.parse(event.target?.result as string);

          // 2. 覆盖当前 state（全量替换）
          this.$state = jsonData;

          // 3. 保存到本地存储
          this.saveToLocalStorage();
          message.success('数据导入成功！');
        } catch (error) {
          message.error('数据解析失败，请检查文件格式！');
        }
      };
      reader.readAsText(file);
    },
    /**
     * 清空
     */
    clearData() {
      // 重置数据
      Object.assign(this.$state, JSON.parse(JSON.stringify(resumeTemplate))); // 彻底重置数据
      this.currentId = 1; // 重置 ID 计数
      this.saveToLocalStorage(); // 更新 localStorage
      message.success('数据已清空');
    },

    /**
     * 自动填充简历数据：
     * - resumeData.json中数据来重置简历
     */
    async autoFillData() {
      try {
        const response = await fetch('/resumeData.json');
        const data = await response.json();             // 响应体从二进制流转换为 JavaScript 对象
        this.$state = { ...data, isFirstVisit: false }; // 保持 isFirstVisit
        this.saveToLocalStorage();
        message.success('数据已自动填充');
      } catch (error) {
        message.error('加载数据失败');
      }
    },
    // 保存到 localStorage
    saveToLocalStorage() {
      localStorage.setItem('resumeData', JSON.stringify(this.$state));
      localStorage.setItem('currentId', JSON.stringify(this.currentId));
    },

    // 通用新增方法
    addItem<T extends { id: number }>(list: T[], newItem: Omit<T, 'id'>) {
      const newEntry = { ...newItem, id: this.currentId++ } as T;
      list.push(newEntry);
      this.saveToLocalStorage();
    },

    // 通用删除方法
    deleteItem<T extends { id: number }>(list: T[], id: number) {
      const index = list.findIndex(item => item.id === id);
      if (index !== -1) {
        list.splice(index, 1);
        this.saveToLocalStorage();
      }
    },

    // 通用更新方法
    updateItem<T extends { id: number }>(list: T[], updatedItem: T) {
      const index = list.findIndex(item => item.id === updatedItem.id);
      if (index !== -1) {
        list[index] = updatedItem;
        this.saveToLocalStorage();
      }
    },

    // 更新个人信息
    updatePersonalInfo(updatedInfo: Partial<PersonalInfo>) {
      this.personalInfo = { ...this.personalInfo, ...updatedInfo };
      this.saveToLocalStorage();
    },

    // 更新自我评价
    updateSummary(updatedSummary: string) {
      this.summary = updatedSummary;
      this.saveToLocalStorage();
    },

    // 新增教育经历
    addEducation(newItem: Omit<Education, 'id'>) {
      this.addItem(this.education, newItem);
    },

    // 删除教育经历
    deleteEducation(id: number) {
      this.deleteItem(this.education, id);
    },

    // 更新教育经历
    updateEducation(updatedItem: Education) {
      this.updateItem(this.education, updatedItem);
    },

    // 新增工作经验
    addWorkExperience(newItem: Omit<WorkExperience, 'id'>) {
      this.addItem(this.workExperience, newItem);
    },

    // 删除工作经验
    deleteWorkExperience(id: number) {
      this.deleteItem(this.workExperience, id);
    },

    // 更新工作经验
    updateWorkExperience(updatedItem: WorkExperience) {
      this.updateItem(this.workExperience, updatedItem);
    },

    // 新增技能
    addSkill(newItem: Omit<Skill, 'id'>) {
      this.addItem(this.skills, newItem);
    },

    // 删除技能
    deleteSkill(id: number) {
      this.deleteItem(this.skills, id);
    },

    // 更新技能
    updateSkill(updatedItem: Skill) {
      this.updateItem(this.skills, updatedItem);
    },

    // 新增项目经验
    addProject(newItem: Omit<Project, 'id'>) {
      this.addItem(this.projects, newItem);
    },

    // 删除项目经验
    deleteProject(id: number) {
      this.deleteItem(this.projects, id);
    },

    // 更新项目经验
    updateProject(updatedItem: Project) {
      this.updateItem(this.projects, updatedItem);
    },

    // 新增荣誉奖项
    addHonor(newItem: Omit<Honor, 'id'>) {
      this.addItem(this.honors, newItem);
    },

    // 删除荣誉奖项
    deleteHonor(id: number) {
      this.deleteItem(this.honors, id);
    },

    // 更新荣誉奖项
    updateHonor(updatedItem: Honor) {
      this.updateItem(this.honors, updatedItem);
    },

    loadFromLocalStorage() {
      const stored = localStorage.getItem('resumeStore');
      if (stored) {
        this.$state = JSON.parse(stored);
      }
    },

    // 初始化检查
    async initCheck() {
      if (this.isFirstVisit) {
        await this.autoFillData();
      }
    }
  }
});


