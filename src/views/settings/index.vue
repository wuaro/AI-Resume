<template>
  <div class="settings-container">
    <a-card class="settings-card" :bordered="false">
      <!-- 模型选择 -->
      <div class="setting-item">
        <div class="setting-label">Model</div>
        <!-- 选择大模型 -->
        <a-select
          v-model:value="settingsStore.aiSettings.model"
          style="width: 200px"
        >
          <a-select-option
            v-for="option in modelOptions"
            :key="option.value"
            :value="option.value"
          >
          </a-select-option>
        </a-select>
      </div>

      <!-- 流式响应开关 -->
      <div class="setting-item">
        <div class="setting-label-row">
          <div class="label-with-tooltip">
            <span>流式响应</span>
            <a-tooltip title="开启后将流式响应 AI 的回复" placement="top">
              <QuestionCircleFilled />
              <!-- 直接使用 Ant Design 图标 -->
            </a-tooltip>
          </div>
          <a-switch v-model:checked="settingsStore.aiSettings.stream" />
        </div>
      </div>

      <!-- API Key -->
      <div class="setting-item">
        <div class="setting-label-row">
          <div class="label-with-tooltip">
            <span>API Key</span>
            <a-tooltip title="设置 API Key" placement="top">
              <QuestionCircleFilled />
            </a-tooltip>
          </div>

          <a
            href="https://cloud.siliconflow.cn/account/ak"
            target="_blank"
            class="get-key-link"
          >
            获取 API Key
          </a>
        </div>
        <a-input-password
          v-model:value="settingsStore.aiSettings.apiKey"
          placeholder="请输入 API Key"
        />
      </div>

      <!-- Max Tokens -->
      <div class="setting-item">
        <div class="setting-label">
          Max Tokens
          <a-tooltip title="生成文本的最大长度" placement="top">
            <QuestionCircleFilled />
          </a-tooltip>
        </div>
        <div class="setting-control">
          <a-slider
            v-model:value="settingsStore.aiSettings.maxTokens"
            :min="1"
            :max="currentMaxTokens"
            :step="1"
            :tooltipOpen="false"
            class="setting-slider"
          />
          <a-input-number
            v-model:value="settingsStore.aiSettings.maxTokens"
            :step="1"
            :min="1"
            :max="currentMaxTokens"
          />
        </div>
      </div>

      <!-- Temperature -->
      <div class="setting-item">
        <div class="setting-label">
          Temperature
          <a-tooltip title="值越高，回答越随机" placement="top">
            <QuestionCircleFilled />
          </a-tooltip>
        </div>
        <div class="setting-control">
          <a-slider
            v-model:value="settingsStore.aiSettings.temperature"
            :min="0"
            :max="2"
            :step="0.1"
            :tooltipOpen="false"
            class="setting-slider"
          />
          <a-input-number
            v-model:value="settingsStore.aiSettings.temperature"
            :step="0.1"
            :min="0"
            :max="2"
          />
        </div>
      </div>

      <!-- Top-P -->
      <div class="setting-item">
        <div class="setting-label">
          Top-P
          <a-tooltip title="核采样阈值" placement="top">
            <QuestionCircleFilled />
          </a-tooltip>
        </div>
        <div class="setting-control">
          <a-slider
            v-model:value="settingsStore.aiSettings.topP"
            :min="0"
            :max="1"
            :step="0.1"
            :tooltipOpen="false"
            class="setting-slider"
          />
          <a-input-number
            v-model:value="settingsStore.aiSettings.topP"
            :step="0.1"
            :min="0"
            :max="1"
          />
        </div>
      </div>

      <!-- Top-K -->
      <div class="setting-item">
        <div class="setting-label">
          Top-K
          <a-tooltip title="保留概率最高的 K 个词" placement="top">
            <QuestionCircleFilled />
          </a-tooltip>
        </div>
        <div class="setting-control">
          <a-slider
            v-model:value="settingsStore.aiSettings.topK"
            :min="1"
            :max="100"
            :step="1"
            :tooltipOpen="false"
            class="setting-slider"
          />
          <a-input-number
            v-model:value="settingsStore.aiSettings.topK"
            :min="1"
            :max="100"
          />
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { QuestionCircleFilled } from "@ant-design/icons-vue";
import {
  useSystemSettingsStore,
  modelOptions,
} from "../../store/useSystemSettingsStore";
const settingsStore = useSystemSettingsStore();
console.log("Current model:", settingsStore);

// 计算当前选中模型的最大 tokens
const currentMaxTokens = computed(() => {
  const selectedModel = modelOptions.find(
    (option) => option.value === settingsStore.aiSettings.model
  );
  return selectedModel ? selectedModel.maxTokens : 4096;
});

watch(
  () => settingsStore.aiSettings.model,
  (newValue) => {
    console.log("Model changed to:", newValue);
  }
);

const model = ref(modelOptions[0].label);
const options = [...Array(25)].map((_, i) => ({
  value: (i + 10).toString(36) + (i + 1),
}));
</script>

<style scoped>
.settings-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.setting-item {
  margin-bottom: 24px;

  /* 基础标签样式 */
  .setting-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-weight: 500;
    color: #27272a;
  }

  /* 水平布局的标签行，用于标签和控件在同一行的情况 */
  .setting-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    color: #27272a;

    /* 标签和提示图标的容器 */
    .label-with-tooltip {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* 获取 API Key 链接样式 */
    .get-key-link {
      font-size: 14px;
      color: #3f7af1;
      text-decoration: none;
    }
  }

  /* 控件容器样式，用于包含滑块和数字输入框 */
  .setting-control {
    display: flex;
    align-items: center;
    gap: 16px;

    /* 滑块占据剩余空间 */
    .setting-slider {
      flex: 1;
    }

    /* 数字输入框固定宽度 */
    :deep(.el-input-number) {
      width: 120px;
    }
  }

  /* 模型选择下拉框宽度 */
  .model-select {
    width: 100%;
  }

  /* 下拉选项文字颜色 */
  :deep(.el-select-dropdown__item) {
    color: #27272a;
  }
}

.settings-card {
  width: 100%;
  max-width: 600px;
  background: var(--card-color);
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  color: var(--text-color);
}

</style>
