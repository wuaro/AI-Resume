import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useSystemSettingsStore = defineStore(
  'systemSettings',
  () => {
    // 是否为暗黑模式
    const isDark = ref<boolean>(localStorage.getItem('theme') === 'dark');
    // 主题颜色
    const theme = ref<string>(isDark.value ? '#9c87fe' : '#672DEA');

    // ai设置
    const aiSettings = ref({
      model: 'deepseek-ai/DeepSeek-R1',
      apiKey: '',
      stream: true,
      maxTokens: 4096,
      temperature: 0.7,
      topP: 0.7,
      topK: 50,
    })



    // // 阿里云apikey
    // const aliApiKey = ref<string>('');
    // // 阿里云调用接口
    // const aliApiUrl = import.meta.env.VITE_API_URL;  //这里用默认的
    // //模型名称
    // const modelName = ref<string>('qwen-turbo');
    // 切换主题
    const toggleTheme = () => {
      isDark.value = !isDark.value;
      theme.value = isDark.value ? '#9c87fe' : '#672DEA';
      localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', isDark.value);
    };

    // 初始化主题
    const initTheme = () => {
      isDark.value = localStorage.getItem('theme') === 'dark';
      theme.value = isDark.value ? '#9c87fe' : '#672DEA';
      document.documentElement.classList.toggle('dark', isDark.value);
    };

    // 监听 isDark 变化，自动更新主题颜色和 class
    watch(isDark, (value) => {
      theme.value = value ? '#9c87fe' : '#672DEA';
      document.documentElement.classList.toggle('dark', value);
    });

    return {
      isDark,
      theme,
      toggleTheme,
      initTheme,
      aiSettings
      // aliApiKey,
      // aliApiUrl,
      // modelName
    };
  },
  {
    persist: true, // 开启持久化存储
  }
);

export const modelOptions = [
  {
    label: "DeepSeek-R1",
    value: "deepseek-ai/DeepSeek-R1",
    maxTokens: 16384,
  },
  {
    label: "DeepSeek-V3",
    value: "deepseek-ai/DeepSeek-V3",
    maxTokens: 4096,
  },
  {
    label: "DeepSeek-V2.5",
    value: "deepseek-ai/DeepSeek-V2.5",
    maxTokens: 4096,
  },
  {
    label: "Qwen2.5-72B-Instruct-128K",
    value: "Qwen/Qwen2.5-72B-Instruct-128K",
    maxTokens: 4096,
  },
  {
    label: "QwQ-32B-Preview",
    value: "Qwen/QwQ-32B-Preview",
    maxTokens: 8192,
  },
  {
    label: "glm-4-9b-chat",
    value: "THUDM/glm-4-9b-chat",
    maxTokens: 4096,
  },
  {
    label: "glm-4-9b-chat(Pro)",
    value: "Pro/THUDM/glm-4-9b-chat",
    maxTokens: 4096,
  },
];