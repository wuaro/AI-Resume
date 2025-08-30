<!-- 简历编辑组件 -->
<template>
  <div class="resume">
    <!-- 左侧简历内容编辑组件 -->
    <div class="left">
      <div class="btn-group">
        <!--
          预览填充：点击会弹出气泡确认框(popconfirm)
          1. 点击确认，则执行@@confirm的方法
          2. 点击取消，则执行@cancel的方法
         -->
        <a-popconfirm
          title="填充会覆盖当前数据，确定吗？"
          ok-text="确定"
          cancel-text="取消"
          @confirm="resumeStore.autoFillData"
        >
          <!--  提示信息左侧红色“？”图标  -->
          <template #icon
            ><question-circle-outlined style="color: red"
          /></template>
          <!--
            点击这个按钮的目的就是弹出气泡确认框，至于后面的逻辑，交给<a-popconfirm>处理
            -->
          <a-button type="primary" ghost>
            <RedoOutlined />
            预览填充
          </a-button>
        </a-popconfirm>

        <!-- 清空数据 -->
        <a-popconfirm
          title="确定要清空当前简历数据吗？"
          ok-text="清空"
          cancel-text="取消"
          @confirm="resumeStore.clearData"
        >
          <!--  提示信息左侧红色“！”图标  -->
          <template #icon><warning-outlined style="color: red" /></template>
          <a-button danger>
            <DeleteOutlined />
            清空数据
          </a-button>
        </a-popconfirm>

        <!-- 导出数据 -->
        <a-button type="default" @click="resumeStore.exportData">
          <download-outlined />
          导出JSON
        </a-button>

        <!-- 导入按钮 -->
        <a-upload
          v-model:fileList="fileList"
          :beforeUpload="handleFileUpload"
          :showUploadList="false"
          accept="application/json"
        >
          <a-button type="dashed">
            <upload-outlined />
            导入JSON
          </a-button>
        </a-upload>
      </div>

      <!-- 简历编辑组件 -->
      <resumeEdit />
    </div>
    <!-- 右侧简历展示组件 -->
    <div class="right">
      <resumePreview />
    </div>
  </div>
</template>

<script setup lang="ts">
import resumeEdit from "./components/resumeEdit.vue";
import resumePreview from "./components/resumePreview.vue";
import { useResumeStore } from "../../store/useResumeStore";
import { UploadOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import type { UploadProps } from "ant-design-vue";
import { ref } from "vue";
import {
  QuestionCircleOutlined,
  WarningOutlined,
  DownloadOutlined,
  DeleteOutlined,
  RedoOutlined,
} from "@ant-design/icons-vue"; // 从ant design vue官方图标中引入图标
const resumeStore = useResumeStore();
const fileList = ref<UploadProps["fileList"]>([]);

// 处理文件上传
const handleFileUpload = (file: File) => {
  if (file.type !== "application/json") {
    message.error("请上传 JSON 文件！");
    return false;
  }
  resumeStore.importData(file);
  // 清空 fileList，避免重复上传不触发事件
  fileList.value = [];
  return false;
};
</script>

<style scoped>
.resume {
  display: flex;
  justify-content: space-between;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.left {
  width: 38%;
  height: 100%;
  background-color: var(--bg-color);
  transition: all 0.3s;
  min-width: 520px;
  display: flex;
  flex-direction: column;
  /* 改为纵向布局 */
}

.right {
  width: 62%;
  height: 100%;
  position: relative;
  overflow-y: auto;
}

.btn-group {
  height: 50px;
  display: flex;
  justify-content: center;
  gap: 20px;
  align-items: center;
  background-color: var(--bg-color);
  flex-shrink: 0;
  /* 防止按钮组被压缩 */
}

/* 让编辑区域占满剩余空间并添加滚动 */
:deep(.resume-edit) {
  flex: 1;
  overflow-y: auto;
}

.github-link {
  margin-top: 5px;
  text-align: center;
}

.github-link a {
  text-decoration: none;
}

.github-star {
  margin-right: 5px;
  color: var(--text-color);
  font-size: 12px;
  /* 去除a标签默认样式 */

  cursor: pointer;
}
</style>
