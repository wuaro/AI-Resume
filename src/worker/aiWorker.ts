// 发送请求的worker
// 监听来自主线程的消息
self.onmessage = async (event) => {
  // 从事件数据中解构出任务ID、消息列表、用户API密钥、模型名称和API请求地址
  const { taskId, messages, userApiKey, model, API_URL } = event.data;
  // 构建请求数据对象，包含模型名称、消息列表，并开启流式响应
  const requestData = {
    model,
    messages,
    stream: true, // 流式响应
  };
  try {
    /**
     * 发起POST请求到指定的API地址，包含认证信息和请求体。
     * @param {string} API_URL - API的URL地址。
     * @param {Object} options - 请求的-配置选项，包括方法、头信息和请求体。
     * @returns {Promise<Response>} - 返回一个Promise，解析为响应对象。
     */
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        // 设置认证信息，使用用户提供的API密钥
        'Authorization': `Bearer ${userApiKey}`,
        // 设置请求体的内容类型为JSON
        'Content-Type': 'application/json',
      },
      // 将请求数据对象转换为JSON字符串作为请求体
      body: JSON.stringify(requestData),
    });

    // 检查响应状态码是否为401（未授权）
    if (response.status === 401) {
      // 若未授权，向主线程发送认证失败的消息
      self.postMessage({ taskId, isComplete: true, result: '认证失败，请检查 API Key 是否正确' });
      return;
    }

    // 检查响应是否成功
    else if (!response.ok) {
      // 若请求失败，向主线程发送请求失败的消息及错误码
      self.postMessage({ taskId, isComplete: true, result: `请求失败，错误码: ${response.status}` });
      return;
    }

    // 检查响应体是否为空
    if (!response.body) {
      // 若响应体为空，向主线程发送服务器未返回流数据的消息
      self.postMessage({ taskId, isComplete: true, result: '服务器未返回流数据' });
      return;
    }

    // 读取流式响应数据（sse）
    // 获取响应体的读取器
    const reader = response.body.getReader();
    // 创建一个文本解码器，用于将二进制数据解码为文本
    const decoder = new TextDecoder();
    // 用于存储流式响应的最终结果
    let currentText = '';

    // 循环读取流式响应数据，直到读取完成
    while (true) {
      // 读取数据块
      const { done, value } = await reader.read();
      // 若读取完成，跳出循环
      if (done) break;
      // 将二进制数据解码为文本
      const chunk = decoder.decode(value);
      // 将数据块按行分割，并过滤掉空行
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      // 流式响应数据示例：
      // {"id":"****","choices":[{"delta":{"content":"我是","function_call":null,"refusal":null,"role":null,"tool_calls":null},
      // "finish_reason":null,"index":0,"logprobs":null}],"created":1735113344,
      // "model":"qwen-plus","object":"chat.completion.chunk","service_tier":null,
      // "system_fingerprint":null,"usage":null}
      // 遍历每一行数据
      for (const line of lines) {
        // 检查行是否以 'data: ' 开头
        if (line.startsWith('data: ')) {
          // 移除 'data: ' 前缀并去除首尾空格
          const jsonLine = line.slice(6).trim();
          // 若响应为 'data: [DONE]'，表示响应结束
          if (jsonLine === '[DONE]') {
            // 向主线程发送最终结果消息
            self.postMessage({ taskId, isComplete: true, result: currentText });
            return;
          }
          try {
            // 将JSON字符串解析为对象
            const parsedLine = JSON.parse(jsonLine);
            // 从解析后的对象中提取消息内容
            const deltaContent = parsedLine?.choices?.[0]?.delta?.content;
            // 若有新的消息内容
            if (deltaContent) {
              // 将新的消息内容拼接到上次的结果后面
              // 比如第一次：currentText = ''，deltaContent = '我是'，则currentText = '我是'
              // 第二次：currentText = '我是'，deltaContent = 'AI'，则currentText = '我是AI'
              // 主线程直接用currentText作为最终结果，不需要再拼接
              currentText += deltaContent;
              // 向主线程发送部分结果消息
              self.postMessage({ taskId, isComplete: false, result: currentText });
            }
          } catch (err) {
            // 若解析数据出错，向主线程发送解析错误消息
            self.postMessage({ taskId, result: '解析流数据时出错，请稍后重试' });
          }
        }
      }
    }
  } catch (error) {
    // 若请求过程中出现错误，向主线程发送请求失败消息
    self.postMessage({ taskId, result: '请求失败，请稍后重试' });
  }
};
