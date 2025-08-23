<script setup>
import { ref, watch, computed } from "vue";
// import { useSettingStore, modelOptions } from '@/stores/setting'
// 修改图标引入
import { QuestionCircleFilled } from "@ant-design/icons-vue";

const settingStore = useSettingStore();

// 控制抽屉显示
const visible = ref(false);

// // 计算当前选中模型的最大 tokens
// const currentMaxTokens = computed(() => {
//   const selectedModel = modelOptions.find((option) => option.value === settingStore.settings.model)
//   return selectedModel ? selectedModel.maxTokens : 4096
// })

// // 监听模型变化
// watch(
//   () => settingStore.settings.model,
//   (newModel) => {
//     const selectedModel = modelOptions.find((option) => option.value === newModel)
//     if (selectedModel) {
//       // 更新 maxTokens，并确保不超过模型的最大值
//       settingStore.settings.maxTokens = Math.min(
//         settingStore.settings.maxTokens,
//         selectedModel.maxTokens,
//       )
//     }
//   },
// )

// 打开抽屉
const openDrawer = () => {
  visible.value = true;
};

// 导出方法供父组件调用
defineExpose({
  openDrawer,
});
// 删除 Element Plus 图标引入
</script>

<template>
  <!-- 抽屉组件替换 -->
  <a-drawer v-model:open="visible" title="设置" placement="right" width="350">
    <div class="setting-container">
      <!-- 模型选择 -->
      <div class="setting-item">
        <div class="setting-label">Model</div>
        <a-select
          v-model:value="settingStore.settings.model"
          class="model-select"
          placeholder="选择模型"
        >
          <a-select-option
            v-for="option in modelOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-select-option>
        </a-select>
      </div>

      <!-- 流式响应开关 -->
      <div class="setting-item">
        <div class="setting-label-row">
          <div class="label-with-tooltip">
            <span>流式响应</span>
            <a-tooltip title="开启后将流式响应 AI 的回复">
              <question-circle-filled />
            </a-tooltip>
          </div>
          <a-switch v-model:checked="settingStore.settings.stream" />
        </div>
      </div>

      <!-- API Key -->
      <div class="setting-item">
        <div class="setting-label-row">
          <div class="label-with-tooltip">
            <span>API Key</span>
            <a-tooltip title="设置 API Key">
              <question-circle-filled />
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
          v-model:value="settingStore.settings.apiKey"
          placeholder="请输入 API Key"
        />
      </div>

      <!-- 其他设置项替换为 Ant Design 组件（结构类似） -->
      <!-- Max Tokens -->
      <div class="setting-item">
        <div class="setting-label">
          Max Tokens
          <a-tooltip title="生成文本的最大长度">
            <question-circle-filled />
          </a-tooltip>
        </div>
        <div class="setting-control">
          <a-slider
            v-model:value="settingStore.settings.maxTokens"
            :min="1"
            :max="currentMaxTokens"
          />
          <a-input-number
            v-model:value="settingStore.settings.maxTokens"
            :min="1"
            :max="currentMaxTokens"
          />
        </div>
      </div>
      <!-- Temperature -->
      <div class="setting-item">
        <div class="setting-label">
          Temperature
          <a-tooltip title="值越高，回答越随机">
            <question-circle-filled />
          </a-tooltip>
        </div>
        <div class="setting-control">
          <a-slider
            v-model:value="settingStore.settings.temperature"
            :min="0"
            :max="2"
            :step="0.1"
          />
          <a-input-number
            v-model:value="settingStore.settings.temperature"
            :min="0"
            :max="2"
            :step="0.1"
          />
        </div>
      </div>

      <!-- Top-P -->
      <div class="setting-item">
        <div class="setting-label">
          Top-P
          <a-tooltip title="核采样阈值">
            <question-circle-filled />
          </a-tooltip>
        </div>
        <div class="setting-control">
          <a-slider
            v-model:value="settingStore.settings.topP"
            :min="0"
            :max="1"
            :step="0.1"
          />
          <a-input-number
            v-model:value="settingStore.settings.topP"
            :min="0"
            :max="1"
            :step="0.1"
          />
        </div>
      </div>

      <!-- Top-K -->
      <div class="setting-item">
        <div class="setting-label">
          Top-K
          <a-tooltip title="保留概率最高的 K 个词">
            <question-circle-filled />
          </a-tooltip>
        </div>
        <div class="setting-control">
          <a-slider
            v-model:value="settingStore.settings.topK"
            :min="1"
            :max="100"
            :step="1"
          />
          <a-input-number
            v-model:value="settingStore.settings.topK"
            :min="1"
            :max="100"
            :step="1"
          />
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<style lang="scss" scoped>
/* 样式需要全面调整，示例修改部分样式 */
.setting-control {
  :deep(.ant-input-number) {
    width: 120px;
  }

  .ant-slider {
    flex: 1;
    margin-right: 16px;
  }
}

.model-select {
  width: 100%;
}

/* 需要删除所有 Element Plus 相关样式 */
</style>
