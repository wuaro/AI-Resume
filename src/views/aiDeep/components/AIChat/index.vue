<script setup lang="ts">
import { ref, nextTick, reactive, inject, type Ref } from "vue";
// 导入对话历史和 AI 对话的类型定义
import type { DialogueHistory, AIDialogue } from "@/types/aiDialogue";
import { marked } from "marked";
import { createChatCompletion } from "@/api/api";
// 导入消息格式化方法
import { messageHandler } from "@/api/messageHandler";
// 系统设置store
import { useSystemSettingsStore } from "@/store/useSystemSettingsStore";
// 简历store
import { useResumeStore } from "@/store/useResumeStore";
import thinkingIcon from "@/assets/photo/深度思考.png";
import { ArrowDownOutlined } from "@ant-design/icons-vue";
// 导入提示词
import {
  RETOUCH_PROMPT,
  INTERVIEW_PROMPT,
  AI_ANSWER_PROMPT,
  getInterviewFirstMessage,
  getRetouchFirstMessage,
} from "./prompt.ts";

// jd:岗位要求
const jd = inject<Ref<string>>("jd", ref(""));
// 通过依赖注入获取开始引导游览的函数
const beginTour = inject<() => void>("beginTour");
// 聊天记录的 DOM 元素的引用
const chatHistoryRef = ref<HTMLElement>();
// 加载标记
const isLoading = ref(false);
// 用户选择是简历润色还是模拟面试 true 为简历润色，false 为模拟面试（后续如果新增第三个功能，则不能再使用boolean类型）
const userChoose = ref<boolean>();
// 第一条消息（由于选择简历润色 或 模拟面试 后会默认发送第一条消息，此消息不能展示在输入框内，所以单独设置一个变了来存储）
const firstMessage = ref<AIDialogue>({
  role: "user",
  content: "",
});
// 输入框中文本
let searchText = ref("");

// 多轮聊天记录
const messages = ref<DialogueHistory>([]);

const chatMessages = ref<any>([]); // 用于显示的聊天记录

const settingStore = useSystemSettingsStore(); // 系统设置
const resumeStore = useResumeStore(); // 简历设置

// 用于存储当前轮次的消息
const currentRoundMessages = ref<DialogueHistory>([]);

// 添加展开/折叠状态控制
const isReasoningExpanded = ref(true);

// 切换展开/折叠状态
const toggleReasoning = () => {
  isReasoningExpanded.value = !isReasoningExpanded.value;
};

/**
 * 发送消息给 AI 并处理 AI 的回复。
 * @returns {Promise<void>} 一个 Promise，在消息发送完成后解析。
 */

/**
 * 用户选择简历润色 或 模拟面试
 * @param {boolean} isExtend - 是否选择经历扩展，true 为经历扩展，false 为模拟面试
 */
const choose = (isExtend: boolean) => {
  userChoose.value = isExtend;
  // 经历扩展
  if (userChoose.value) {
    // 系统提示词
    chatMessages.value.push({
      role: "system",
      content: RETOUCH_PROMPT,
    });
    firstMessage.value.role = "user";
    firstMessage.value.content = getRetouchFirstMessage(
      resumeStore.getJSONData(),
      jd.value
    );
    sendChatMessage();
  }
  // 模拟面试
  else {
    chatMessages.value.push({
      role: "system",
      content: INTERVIEW_PROMPT,
    });
    firstMessage.value.role = "user";
    firstMessage.value.content = getInterviewFirstMessage(
      resumeStore.getJSONData(),
      jd.value
    );
    sendChatMessage();
  }
};

/**
 * 格式化消息内容，将 Markdown 文本转换为 HTML 并移除特定格式的内容。
 * @param {string} content - 要格式化的消息内容。
 * @returns {string} 格式化后的 HTML 字符串。
 */
const formatMessage = (content: string | undefined) => {
  if (typeof content !== "string") {
    return "";
  }
  // 过滤掉```resume  ```中的内容
  content = content.replace(/```resume简历内容如下：[\s\S]*?```/g, "");
  content = content.replace(/```岗位jd内容如下：[\s\S]*?```/g, "");
  // 将 Markdown 文本转换为 HTML
  return marked(content);
};

/**
 * 滚动到聊天历史记录的底部。
 * @returns {Promise<void>} 一个 Promise，在滚动完成后解析。
 */
const scrollToBottom = async () => {
  await nextTick();
  // 如果 chatHistoryRef 存在，则滚动到其底部
  if (chatHistoryRef.value) {
    chatHistoryRef.value.scrollTop =
      chatHistoryRef.value.scrollHeight - chatHistoryRef.value.clientHeight;
  }
};

// 是否结束面试
const end = ref(false);

const sendChatMessage = async () => {
  if (
    (!searchText.value.trim() && firstMessage.value.content === "") ||
    isLoading.value
  )
    return;

  try {
    // 设置loading状态
    isLoading.value = true;
    // 添加用户消息
    if (firstMessage.value.content === "") {
      chatMessages.value.push(
        messageHandler.formatMessage("user", searchText.value.trim())
      );
      searchText.value = "";
    } else {
      chatMessages.value.push(
        messageHandler.formatMessage("user", firstMessage.value.content.trim())
      );
      firstMessage.value.content = "";
    }

    chatMessages.value.push(messageHandler.formatMessage("assistant", "", "")); // 添加空的 reasoning_content

    // 获取最后一条消息
    const lastMessage = chatMessages.value[chatMessages.value.length - 1];
    lastMessage.loading = true;

    // 调用API获取回复
    const messagesForAPI = chatMessages.value.map(({ role, content }) => ({
      role,
      content,
    }));
    const response = await createChatCompletion(messagesForAPI);

    // 使用封装的响应处理函数
    await messageHandler.handleResponse(
      response,
      settingStore.aiSettings.stream,
      (content, reasoning_content, tokens, speed) => {
        if (reasoning_content) {
          isReasoningExpanded.value = true;
        }
        if (content) {
          isReasoningExpanded.value = false;
        }
        // 添加 reasoning_content 参数
        lastMessage.content = content;
        lastMessage.reasoning_content = reasoning_content; // 更新 reasoning_content
        lastMessage.completion_tokens = tokens;
        lastMessage.speed = speed;
        scrollToBottom();
      }
    );
  } catch (error) {
    console.error("Failed to send message:", error);
    const lastMessage = chatMessages.value[chatMessages.value.length - 1];
    lastMessage.content = "抱歉，发生了一些错误，请稍后重试。";
  } finally {
    // 重置loading状态
    isLoading.value = false;
    const lastMessage = chatMessages.value[chatMessages.value.length - 1];
    lastMessage.loading = false;
  }
};

const interviewResult = ref("");
const interviewResultScore = ref(0);
// 结束面试，获取面试结果
const endInterview = async () => {
  end.value = true;
  // 拷贝数组
  let newMessages = reactive(
    messages.value.map((item) => ({
      ...item, // 浅拷贝对象
    }))
  );
  newMessages.push({
    role: "user",
    content:
      "好的，结束面试了，满分100分的话给我一个客观的分数用```分数```包裹，例如```40```，另外你帮我总结一下我的面试情况，告诉我将来哪些地方可以加强，以及我在面试中的优点和不足的地方。你返回的内容不要出现markdown语法，直接换行序号分点就行。",
  });
  isLoading.value = true;
  try {
    await sendToQwenAIDialogue(newMessages, (responseText) => {
      //提取并且过滤掉```分数 ```包裹的内容，为分数
      const match = responseText.match(/```\s*([\s\S]*?)```/);
      if (match) {
        interviewResultScore.value = parseInt(match[1].trim());
        responseText = responseText.replace(/```[\s\S]*?```/g, "");
      }
      interviewResult.value = responseText;
      scrollToBottom();
    });
  } catch (error) {
    console.error("AI 处理失败:", error);
    messages.value.push({
      role: "assistant",
      content: "AI 处理失败，请稍后再试。",
    });
  } finally {
    isLoading.value = false;
  }
};

// 重新生成的处理函数
const handleRegenerate = async () => {
  // try {
  //   // 获取最后一条用户消息
  //   const lastUserMessage = messages[messages - 2]
  //   // 使用 splice 删除最后两个元素
  //   messages.splice(-2, 2)
  //   await handleSend({ text: lastUserMessage.content, files: lastUserMessage.files })
  // } catch (error) {
  //   console.error('Failed to regenerate message:', error)
  // }
  console.log(11111111);
};

//重新开始面试
const restart = () => {
  messages.value = [];
  end.value = false;
  interviewResult.value = "";
  interviewResultScore.value = 0;
  userChoose.value = undefined;
  message.value.content = "";
};
</script>

<template>
  <div class="chat-container">
    <div class="chat-history" ref="chatHistoryRef">
      <a-alert
        show-icon
        message="AI深度交流-根据您所填的项目、工作等通过问答方式对您的经历进行扩展优化或者模拟面试问答！"
        type="info"
      />
      <a-alert
        show-icon
        message="tips：使用前请优先填写右侧的岗位jd以及工作/项目经历！"
        type="warning "
        closable
      />
      <!-- 让用户选择是经历扩展还是模拟面试 -->
      <a-space
        wrap
        class="button-group"
        v-if="userChoose === undefined || userChoose === null"
        id="ai-choose-content"
      >
        <a-button type="primary" @click="choose(true)">简历润色</a-button>
        <a-button type="primary" @click="choose(false)"> 模拟面试</a-button>
      </a-space>
      <div v-else style="text-align: center">
        <a-tag color="green">{{ userChoose ? "简历润色" : "模拟面试" }}</a-tag>
      </div>
      <div
        v-for="(msg, index) in chatMessages"
        :key="msg.id"
        class="message-item"
        :class="msg.role"
      >
        <div
          v-if="msg.reasoning_content"
          class="reasoning-toggle"
          @click="toggleReasoning"
        >
          <img :src="thinkingIcon" alt="thinking" />
          <span>深度思考</span>
          <ArrowDownOutlined
            class="toggle-icon"
            :class="{ 'is-expanded': isReasoningExpanded }"
          />
        </div>
        <div
          v-if="msg.reasoning_content && isReasoningExpanded"
          class="reasoning markdown-body"
          v-html="formatMessage(msg.reasoning_content)"
        ></div>
        <div v-if="msg.content" class="message-content">
          <div class="message-text" v-html="formatMessage(msg.content)"></div>
        </div>
      </div>

      <!-- 如果用户选择了模拟面试，则显示结束面试，然后获取面试结果 -->
      <div
        v-show="!userChoose && messages.length > 5 && !end"
        style="text-align: center"
      >
        <a-button type="primary" @click="endInterview()" :disabled="isLoading"
          >结束面试</a-button
        >
      </div>

      <div v-if="end" class="interview-result">
        <a-badge-ribbon
          :text="'AI评分：' + interviewResultScore + '分'"
          :color="interviewResultScore >= 60 ? 'green' : 'red'"
        >
          <a-card title="AI评估面试结果" size="small" class="result-card">
            <div
              class="message-text result-content"
              v-html="marked(interviewResult)"
            ></div>
          </a-card>
        </a-badge-ribbon>
      </div>

      <div v-if="end" style="text-align: center">
        <a-button type="primary" @click="restart()" :disabled="isLoading"
          >重新开始</a-button
        >
      </div>
    </div>

    <!-- 输入区域 -->
    <div
      v-if="userChoose === undefined || userChoose === null"
      style="text-align: center"
    >
      <p style="color: red">
        请先在上方按钮中选择"经历深挖"或者"模拟面试"！<span
          @click="beginTour"
          style="
            border-radius: 5px;
            background-color: #1677ff;
            font-size: 12px;
            color: white;
            padding: 3px;
            cursor: pointer;
          "
          >使用说明</span
        >
      </p>
    </div>

    <!-- 输入框 -->
    <div class="chat-input" id="ai-chat-content">
      <a-textarea
        v-model:value="searchText"
        :rows="3"
        placeholder="输入消息，Enter 发送..."
        :disabled="isLoading || end"
        @keydown.enter.prevent="sendChatMessage"
      />
      <div class="send-button">
        <a-button
          type="primary"
          :loading="isLoading"
          @click="sendChatMessage"
          :disabled="
            !searchText.trim() ||
            userChoose === undefined ||
            userChoose === null ||
            end
          "
        >
          发 送
        </a-button>
        <!-- TODO -->
        <a-button
          type="primary"
          :loading="isLoading"
          @click="
            () => {
              searchText = AI_ANSWER_PROMPT;
              sendChatMessage();
            }
          "
          :disabled="userChoose === undefined || userChoose === null || end"
        >
          AI帮答
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.button-group {
  display: flex;
  gap: 8px;
  display: flex;
  justify-content: center;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 85%;
  margin: 8px 0;
}

.message-item.assistant {
  align-self: flex-start;
}

.message-item.user {
  align-self: flex-end;
}

.message-content {
  padding: 12px 16px;
  border-radius: 12px;
  position: relative;
  min-width: 60px;
  max-width: 100%;
  overflow-wrap: break-word;
}

.assistant .message-content {
  background: var(--chat-ai-bubble);
  border-bottom-left-radius: 4px;
  color: var(--text-color);
  border: 1px solid var(--chat-border);
}

.system {
  display: none;
}

.user .message-content {
  background: var(--color-4);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-text {
  word-break: break-word;
  max-width: 100%;
}

.message-text :deep(p) {
  margin: 0 !important;
  margin-block-end: 0 !important;
}

.message-text :deep(pre) {
  background: var(--bg-color);
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 8px 0;
  border: 1px solid var(--chat-border);
  max-width: 100%;
  white-space: pre-wrap;
  word-break: break-all;
}

.message-text :deep(code) {
  background: var(--bg-color);
  padding: 2px 4px;
  border-radius: 4px;
  word-break: break-all;
  white-space: pre-wrap;
}

.chat-input {
  padding: 12px 10px 12px 0px;
  background: var(--chat-input-bg);
  border-top: 1px solid var(--chat-border);
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 8px;
  align-items: center;
  min-width: 40px;
}

.typing-indicator span {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--color-4);
  opacity: 0.8;
  border-radius: 50%;
  animation: typing 1s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.4s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes typing {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-6px);
  }
}

/* 自定义滚动条样式 */
.chat-history::-webkit-scrollbar {
  width: 6px;
}

.chat-history::-webkit-scrollbar-track {
  background: transparent;
}

.chat-history::-webkit-scrollbar-thumb {
  background: var(--chat-border);
  border-radius: 3px;
}

.chat-history::-webkit-scrollbar-thumb:hover {
  background: var(--color-6);
}

/* 输入框样式优化 */
:deep(.ant-input) {
  background: var(--chat-input-bg);
  border-color: var(--chat-border);
  color: var(--chat-input-text);
  min-height: 24px !important;
  max-height: 120px !important;
  height: auto !important;
  resize: none;
  border-radius: 8px;
  line-height: 1.5;
  padding: 8px 12px;
  transition: all 0.3s ease;
}

:deep(.ant-input:hover:not(:disabled)) {
  border-color: var(--color-4);
}

:deep(.ant-input:focus) {
  border-color: var(--color-4);
  box-shadow: 0 0 0 2px rgba(94, 33, 224, 0.1);
}

:deep(.ant-input:disabled) {
  background: var(--chat-input-bg);
  opacity: 0.7;
  color: var(--color-6);
  cursor: not-allowed;
}

:deep(.ant-input::placeholder) {
  color: var(--chat-placeholder);
}

/* 按钮禁用状态优化 */
:deep(.ant-btn:disabled) {
  background-color: var(--color-6) !important;
  border-color: var(--color-6) !important;
  opacity: 0.6;
  cursor: not-allowed;
}

:deep(.ant-btn) {
  height: 38px;
  padding: 0 16px;
  margin-top: 1px;
  background-color: var(--color-4) !important;
  border-color: var(--color-4) !important;
}

:deep(.ant-btn:hover) {
  background-color: var(--color-5) !important;
  border-color: var(--color-5) !important;
}

:deep(.ant-btn:active) {
  background-color: var(--color-3) !important;
  border-color: var(--color-3) !important;
}

.send-button {
  display: flex;
  flex-direction: column;
}

.interview-result {
  text-align: center;
  width: 100%;
  padding: 20px 0;
}

.result-card {
  background: var(--chat-ai-bubble);
  border: 1px solid var(--chat-border);
  border-radius: 12px;
}

.result-content {
  text-align: left;
  padding: 10px;
  color: var(--text-color);
}

.result-content :deep(p) {
  margin: 8px 0 !important;
  line-height: 1.6;
}

.result-content :deep(ol),
.result-content :deep(ul) {
  margin: 8px 0;
  padding-left: 20px;
}

.result-content :deep(li) {
  margin: 4px 0;
  line-height: 1.6;
}

:deep(.ant-card-head) {
  border-bottom-color: var(--chat-border);
  min-height: 40px;
}

:deep(.ant-card-head-title) {
  padding: 8px 0;
  color: var(--text-color);
}

:deep(.ant-ribbon-text) {
  padding: 4px 8px;
  font-size: 14px;
}

.message-item.reasoning-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  margin-left: 16px;
  margin-bottom: 8px;
  cursor: pointer;
  width: fit-content;
  border-radius: 4px;
  /* 添加浅蓝色背景 */
  background-color: #eef4ff;
  transition: background-color 0.2s;
}
.reasoning-toggle img {
  width: 18px;
  height: 18px;
}

.reasoning-toggle span {
  font-size: 13px;
  color: #3f7af1;
}

.reasoning-toggle.toggle-icon {
  font-size: 12px;
  color: #3f7af1;
  transition: transform 0.2s;

  &.is-expanded {
    transform: rotate(180deg);
  }
}

.reasoning {
  /* 与下方内容保持间距 */
  margin-bottom: 8px;
  margin-left: 16px;
  /* 内部内容的边距 */
  padding: 0 16px;
  /* 浅灰色背景，类似引用块 */
  background-color: #ffffff;
  /* 左侧边框，是引用块的特征 */
  border-left: 3px solid #dfe2e5;
  /* 文字颜色设置为深灰色 */
  color: #8b8b8b;
  /* 字体大小稍小于正文 */
  font-size: 14px;
  /* 行高适中，提高可读性 */
  line-height: 1.6;

  /* 处理内部段落的样式 */
  :deep(p) {
    /* 移除段落默认边距 */
    margin: 0;
    &:not(:last-child) {
      /* 段落之间保持间距，最后一个段落不需要 */
      margin-bottom: 8px;
    }
  }
}
</style>
