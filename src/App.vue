<script setup lang="ts">
import Header from "./components/Header/index.vue"; // 顶部导航栏组件
import ThemeSwitcher from "./components/ThemeSwitcher/index.vue"; // 切换主题组件
import NarrowScreen from "./components/narrow/index.vue"; // 窄屏（移动端）下显示的组件
import { useResumeStore } from "./store/useResumeStore"; // 简历store
import { useSettingsStore } from "./store/useSettingsStore"; // 简历布局设置的store
import { onMounted, ref, onBeforeMount } from "vue";
const settingsStore = useSettingsStore();

// 是否展示宅页面（移动端页面）（页面宽度缩小到一定程度时触发）
const showNarrowScreen = ref(false);

/**
 * 检查屏幕宽度：宽度小于768px时，展示移动端界面
 */
const checkScreenWidth = () => {
  showNarrowScreen.value = window.innerWidth < 768;
};

/**
 * 组件挂载之前执行：
 * 1. 初始化 showNarrowScreen 的值。
 * 2. 添加监听器，当窗口大小发生变化时，调用 checkScreenWidth() 更新 showNarrowScreen
 *      - 事件类型是 resize，当窗口尺寸变化时，浏览器会自动触发 resize 事件
 */
onBeforeMount(() => {
  checkScreenWidth();
  window.addEventListener("resize", checkScreenWidth);
});

/**
 * 挂载后初始化：
 * 1. 获取 简历store 的实例，用于管理简历数据。
 * 2. 初始化简历相关的数据
 * 3. 初始化主题设置
 */
onMounted(async () => {
  const resumeStore = useResumeStore();
  await resumeStore.initCheck();
  settingsStore.initTheme();
});
</script>

<template>
  <!-- 如果是窄屏，则展示移动端布局 -->
  <narrow-screen v-if="showNarrowScreen" />
  <!-- 如果不是窄屏，则展示常规布局 -->
  <template v-else>
    <Header />
    <!--  Ant Design Vue 的 <a-config-provider> 组件，动态注入主题配置  -->
    <a-config-provider
      :theme="{
        token: {
          colorPrimary: settingsStore.theme,
        },
      }"
    >
      <router-view v-slot="{ Component }">
        <keep-alive include="aiDeep">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </a-config-provider>
    <ThemeSwitcher />
  </template>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
