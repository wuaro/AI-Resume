<template>
  <a-collapse class="personal-evaluation-collapse">
    <a-collapse-panel key="1" header="个人总结">
      <a-space direction="vertical" style="width: 100%">
        <AIEnhancePopover
          :description="`是我简历中的个人介绍内容，帮我润色和优化以下内容，使其更加简洁、专业和吸引面试官，
                    你只返回润色后的一段文字，其余什么都不要说，也不要说例如“好的”这种话！！！：\n${summary}`"
          :extend="`下面这个是我简历中的个人介绍内容，请以分点的方式给出建议，告诉我可以从哪几个方面扩展优化。你只返回你给出的几点建议其余什么都不要说，也不要说例如“好的”这种话！！！：
                    \n${summary}`"
          @update="(content: string) => summary = content"
        >
          <a-textarea
            v-model:value="summary"
            placeholder="请输入个人总结"
            :auto-size="{ minRows: 2, maxRows: 5 }"
          />
        </AIEnhancePopover>
      </a-space>
    </a-collapse-panel>
  </a-collapse>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useResumeStore } from "../../../store";
import AIEnhancePopover from "./AIEnhancePopover.vue";
// 获取 store 实例
const resumeStore = useResumeStore();

// 将 summary 直接绑定为 ref 类型，便于修改
const summary = ref(resumeStore.summary);

// 监听 summary 的变化并保存到 store
watch(
  summary,
  (newValue) => {
    resumeStore.summary = newValue;
    resumeStore.saveToLocalStorage();
  },
  { immediate: true }
);
</script>

<style scoped>
.personal-evaluation-collapse {
  margin: 0 auto;
  max-width: 800px;
  font-family: "zql";
  background-color: var(--color-7);
  margin-top: 20px;
}

/* 针对 a-textarea 组件中的 textarea 元素设置 box-sizing */
.ant-input {
  box-sizing: border-box;
  font-family: "zql";
}
</style>
