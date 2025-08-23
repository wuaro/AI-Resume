import { useSystemSettingsStore } from "@/store/useSystemSettingsStore";

const API_BASE_URL = 'https://api.siliconflow.cn/v1'

export const createChatCompletion = async (messages) => {
  const settingStore = useSystemSettingsStore();
  const payload = {
    model: settingStore.aiSettings.model,
    messages,
    stream: settingStore.aiSettings.stream,
    max_tokens: settingStore.aiSettings.maxTokens,
    temperature: settingStore.aiSettings.temperature,
    top_p: settingStore.aiSettings.topP,
    top_k: settingStore.aiSettings.topK,
  };

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settingStore.aiSettings.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
  console.log("API request payload:", options); // 打印请求负载以检查其结构和参数

  try {
    const startTime = Date.now() // 记录开始时间
    const response = await fetch(`${API_BASE_URL}/chat/completions`, options)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (settingStore.aiSettings.stream) {
      return response; // 直接返回响应对象以支持流式读取
    } else {
      const data = await response.json();
      const duration = (Date.now() - startTime) / 1000; // 使用本地计时
      data.speed = (data.usage.completion_tokens / duration).toFixed(2);
      console.log("API response:", data); // 打印完整的API响应以检查其结构和内容
      return data;
    }
  } catch (error) {
    console.error('Chat API Error:', error)
    throw error
  }
}
