// web-push 存根模塊（用於構建時）
// 當 web-push 未安裝時，提供一個空實現
// 運行時會使用 Function 構造函數動態導入真實的 web-push

export default {
  setVapidDetails: () => {},
  sendNotification: async () => {
    throw new Error('web-push is not installed');
  },
};

