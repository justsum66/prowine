# 本機預覽工作流 - ngrok 使用指南

## 目的說明

本工作流用於在本機開發時，透過 ngrok 產生臨時預覽網址，方便分享給老婆、老闆或客戶查看最新畫面。

**重要提醒：**
- 此 URL 只在您的電腦開著、dev server 與 ngrok 都在執行時有效
- 這是臨時 demo 用途，不是正式部署
- 正式上線仍使用 Vercel 等正式部署流程

---

## 事前準備

### 1. 安裝 ngrok CLI

#### Windows 安裝方式：

**方法一：使用 Chocolatey（推薦）**
```powershell
choco install ngrok
```

**方法二：手動下載**
1. 前往 [ngrok 官網](https://ngrok.com/download)
2. 下載 Windows 版本
3. 解壓縮到任意目錄（例如 `C:\ngrok`）
4. 將 ngrok.exe 所在目錄加入系統 PATH 環境變數

**方法三：使用 Scoop**
```powershell
scoop install ngrok
```

### 2. 註冊 ngrok 帳號並取得 Auth Token

1. 前往 [ngrok 官網](https://dashboard.ngrok.com/signup) 註冊帳號（免費）
2. 登入後前往 [Auth Token 頁面](https://dashboard.ngrok.com/get-started/your-authtoken)
3. 複製您的 Auth Token
4. 在終端機執行以下指令設定：
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```

**注意：** ngrok 免費版提供：
- 1 個同時運行的 tunnel
- 隨機 URL（每次啟動可能不同）
- 足夠用於臨時預覽

---

## 一般開發流程（給自己用）

### 啟動開發伺服器

在專案根目錄執行：

```powershell
npm run dev
```

**預期結果：**
- 開發伺服器啟動在 `http://localhost:3000`
- 終端機顯示編譯進度和狀態
- 瀏覽器訪問 `http://localhost:3000` 可看到網站

**啟動指令詳情：**
- 實際執行：`node --max-old-space-size=4096 node_modules/next/dist/bin/next dev`
- 預設監聽 port：`3000`
- 訪問地址：`http://localhost:3000`

---

## 要分享給老婆 / 老闆時的「預覽流程」

### 步驟 1：啟動開發伺服器

確保開發伺服器正在運行：

```powershell
npm run dev
```

等待編譯完成，確認終端機顯示：
```
✓ Ready in Xs
○ Local:        http://localhost:3000
```

### 步驟 2：啟動 ngrok

**方法一：使用 PowerShell 腳本（推薦）**

在專案根目錄執行：

```powershell
.\scripts\start-ngrok.ps1
```

**方法二：手動執行**

開啟**新的終端機視窗**（不要關閉 dev server），執行：

```powershell
ngrok http 3000
```

**預期輸出：**
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        Asia Pacific (ap)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://xxxx-xx-xxx-xxx.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**重要資訊：**
- `Forwarding` 欄位中的 `https://xxxx-xx-xxx-xxx.ngrok-free.app` 就是公開 URL
- 複製這個 URL 給對方即可

### 步驟 3：複製公開 URL

從 ngrok 輸出中複製 `Forwarding` 欄位的 HTTPS URL，例如：
```
https://abc123-def456.ngrok-free.app
```

**貼給對方時，可以這樣說：**
> "這是臨時預覽網址，可以直接在手機或電腦瀏覽器打開：
> https://abc123-def456.ngrok-free.app
> 
> 如果畫面有更新，請按重新整理（F5 或 Ctrl+R）即可看到最新畫面。
> 這個網址只在我電腦開著時有效。"

### 步驟 4：畫面更新說明

**重要：** 如果畫面更新，但對方看不到變化：

1. **請對方按重新整理**（F5 或 Ctrl+R）
2. **不需要更換 URL**（只要 dev server 和 ngrok 都在運行，同一條 URL 持續有效）
3. 如果 dev server 被重啟，URL 仍然有效，只需重新整理即可

---

## 常見問題與排查

### 問題 1：畫面打不開 / 連線錯誤

**可能原因：**
- dev server 沒有啟動
- ngrok 沒有啟動
- 防火牆阻擋

**解決方法：**
1. 檢查 dev server 是否運行：
   ```powershell
   # 查看是否有 Node.js 進程
   Get-Process | Where-Object {$_.ProcessName -eq "node"}
   ```
2. 檢查 ngrok 是否運行：
   - 查看 ngrok 終端機視窗是否還在
   - 或訪問 `http://127.0.0.1:4040` 查看 ngrok 狀態頁面
3. 檢查端口 3000 是否被占用：
   ```powershell
   netstat -ano | findstr :3000
   ```

### 問題 2：URL 突然完全無效

**可能原因：**
- ngrok 被關閉或程式中止
- 網路連線中斷
- ngrok 免費版 session 過期（通常 8 小時）

**解決方法：**
1. 檢查 ngrok 終端機視窗是否還在運行
2. 如果 ngrok 被關閉，重新執行 `ngrok http 3000` 或 `.\scripts\start-ngrok.ps1`
3. **注意：** 重新啟動 ngrok 會產生新的 URL，需要重新複製給對方

### 問題 3：dev server 重啟後看不到更新

**解決方法：**
- **URL 不需要更換**
- 請對方按重新整理（F5 或 Ctrl+R）
- 只要 dev server 和 ngrok 都在運行，同一條 URL 持續有效

### 問題 4：ngrok 顯示 "tunnel session failed"

**可能原因：**
- Auth Token 未設定或過期
- 網路連線問題

**解決方法：**
1. 重新設定 Auth Token：
   ```powershell
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```
2. 檢查網路連線
3. 嘗試重新啟動 ngrok

### 問題 5：想要固定 URL（避免每次都要重新複製）

**解決方法：**
- ngrok 免費版不支援固定 URL
- 需要升級到付費版（$8/月起）才能使用固定域名
- 對於臨時預覽，免費版已足夠使用

---

## 技術細節（給開發者）

### 專案配置

- **技術棧：** Next.js 15 (App Router)
- **開發伺服器指令：** `npm run dev`
- **實際執行：** `node --max-old-space-size=4096 node_modules/next/dist/bin/next dev`
- **預設監聽 port：** `3000`
- **本地訪問地址：** `http://localhost:3000`

### ngrok 配置

- **預設 region：** Asia Pacific (ap)
- **Protocol：** HTTPS（自動）
- **Web Interface：** `http://127.0.0.1:4040`（可查看請求記錄）

### 工作流規則

1. **重啟 dev server 時，不要自動關閉或重啟 ngrok**
   - dev server 掉線期間，外部訪問可以短暫失敗
   - 等 dev server 起來後，外部同一條 URL 重新整理就能看到最新畫面

2. **不要隨意更改 dev server port**
   - 若真的有必要改 port，必須同步更新所有相關文件與說明
   - 並在技術報告中標註原因

3. **只針對「前台預覽」設計流程**
   - 不要把敏感後台或管理介面當成長期對外入口
   - 後台管理應使用 VPN 或其他安全方式訪問

---

## 快速參考

### 給非工程背景的人（5 行版本）

1. 我已經啟動開發伺服器和 ngrok
2. 這是臨時預覽網址：`https://xxxx-xx-xxx-xxx.ngrok-free.app`
3. 可以直接在手機或電腦瀏覽器打開
4. 如果畫面有更新，請按重新整理（F5）即可
5. 這個網址只在我電腦開著時有效

---

## 替代方案

如果無法使用 ngrok（例如網路限制、防火牆等原因），可以考慮：

### 方案 1：Cloudflare Tunnel（免費）

**優點：**
- 完全免費
- 不需要註冊額外服務
- 支援固定域名

**缺點：**
- 設定較複雜
- 需要安裝 Cloudflare CLI

### 方案 2：LocalTunnel（免費）

**優點：**
- 完全免費
- 不需要註冊
- 使用簡單

**缺點：**
- URL 每次不同
- 穩定性較 ngrok 差

### 方案 3：VS Code Port Forwarding（如果使用 VS Code）

**優點：**
- 整合在編輯器中
- 不需要額外工具

**缺點：**
- 僅限 VS Code 用戶
- 功能較簡單

---

**最後更新：** 2024-12-19

