# Roon AI Music Box

AI 驅動的 Roon 音樂控制系統，提供 Web UI 和 REST API 控制 Roon Core。

## 功能特點

- 🎵 **播放控制**：播放/暫停/上一首/下一首/音量調節
- 🖼️ **封面顯示**：自動獲取並顯示專輯封面
- 🔍 **音樂搜索**：搜索專輯、藝術家、歌曲
- 📊 **實時狀態**：顯示當前播放狀態和進度
- 🌐 **Web UI**：美觀的網頁控制介面
- 🔌 **REST API**：完整的 HTTP API 接口
- 📚 **音樂庫索引**：建立本地音樂庫索引，加快搜索速度

## 系統要求

- Node.js 14+
- Roon Core（運行中）
- 同一網絡內的設備

## 安裝

```bash
# 克隆項目
git clone https://github.com/yourusername/roon-ai-music-box.git
cd roon-ai-music-box

# 安裝依賴
npm install
```

## 使用方法

### 1. 啟動 Web UI 服務

```bash
PORT=9876 node ai-music-box-final.js
```

然後打開瀏覽器訪問：`http://localhost:9876`

### 2. 批准 Extension

首次運行時，需要在 Roon Remote app 中批准 extension：

1. 打開 Roon Remote app
2. 進入 Settings → Extensions
3. 找到 "AI Music Box"
4. 點擊 "Enable" 批准連接

### 3. 建立音樂庫索引（可選）

```bash
node index-music-library.js
```

執行後會生成 `music-library-index.json`，包含所有專輯、藝術家和類型信息。

## API 文檔

### 獲取播放狀態

```bash
GET /api/status
```

**響應示例**：
```json
{
  "state": "playing",
  "now_playing": {
    "line1": "歌曲名",
    "line2": "藝術家",
    "line3": "專輯名"
  },
  "image_key": "封面圖片key"
}
```

### 控制播放

```bash
POST /api/control
Content-Type: application/json

{
  "action": "play|pause|next|previous|stop"
}
```

### 搜索音樂

```bash
GET /api/search?q=關鍵字
```

### 獲取封面圖片

```bash
GET /api/image/:image_key
```

## 開發過程

### 階段 1：基礎控制（control.js）
- 連接 Roon Core
- 實現基本播放控制 API

### 階段 2：Web UI（webui-simple.js）
- Express 服務器
- 簡單 HTML 介面
- 播放控制按鈕

### 階段 3：封面顯示（test-image-api.js）
- 整合 Roon Image API
- 顯示專輯封面

### 階段 4：版本迭代（v2, v3）
- 加入搜索功能
- 改進 UI 佈局
- 實時狀態更新

### 階段 5：最終版本（ai-music-box-final.js）
- 完整 Web UI
- 完整 REST API
- 自動連接管理

### 階段 6：音樂庫索引（index-music-library.js）
- 掃描 Roon 音樂庫
- 建立本地索引
- 加快搜索速度

## 項目結構

```
roon-ai-music-box/
├── ai-music-box-final.js      # 主程式（推薦使用）
├── index-music-library.js     # 音樂庫索引工具
├── control.js               # 基礎控制 API
├── webui-simple.js        # 簡單 Web UI
├── ai-music-box.js            # 主程式（舊版）
├── ai-music-box-v2.js     # 版本 2
├── ai-music-box-v3.js         # 版本 3
├── test-*.js                  # 測試腳本
├── debug-status.js            # 調試工具
├── package.json         # 依賴配置
├── config.json                # 配置文件
└── README.md                  # 本文件
```

## 配置

編輯 `config.json`：

```json
{
  "port": 9876,
  "roon": {
    "extension_id": "com.aimusicbox.roon.v1",
    "display_name": "AI Music Box"
  }
}
```

## 技術棧

- **Node.js** - 運行環境
- **Express** - Web 服務器
- **node-roon-api** - Roon API 客戶端
- **node-roon-api-transport** - 播放控制
- **node-roon-api-browse** - 音樂瀏覽
- **node-roon-api-image** - 封面圖片

## 部署

### 本地部署

```bash
PORT=9876 node ai-music-box-final.js
```

### 使用 PM2（推薦）

```bash
npm install -g pm2
pm2 start ai-music-box-final.js --name roon-music-box -- PORT=9876
pm2 save
pm2 startup
```

### 使用 systemd

創建 `/etc/systemd/system/roon-music-box.service`：

```ini
[Unit]
Description=Roon AI Music Box
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/roon-ai-music-box
Environment="PORT=9876"
ExecStart=/usr/bin/node ai-music-box-final.js
Restart=always

[Install]
WantedBy=multi-user.target
```

啟動服務：

```bash
systemctl daemon-reload
systemctl enable roon-music-box
systemctl start roon-music-box
```

## 故障排除

### Extension 連接失敗

**問題**：服務啟動後顯示 "Not connected"

**解決**：
1. 確認 Roon Core 正在運行
2. 在 Roon Remote app 中批准 extension
3. 確認設備在同一網絡

### 沒有 Zone

**問題**：API 返回 `zones: []`

**解決**：
1. 在 Roon Remote 中開始播放任何音樂
2. Zone 會自動出現
3. 刷新頁面

### 索引工具超時

**問題**：`index-music-library.js` 執行超時

**解決**：
1. 確認已在 Roon Remote 中批准 extension
2. 增加超時時間（修改代碼中的 timeout 值）
3. 檢查網絡連接

## 開發時間

- **開發日期**：2026-03-17
- **開發時間**：21:37 - 23:43（約 2 小時）
- **部署日期**：2026-03-18
- **部署位置**：http://192.168.0.220:9876

## 授權

MIT License

## 作者

Vincent

## 致謝

- [Roon Labs](https://roonlabs.com/) - 提供優秀的音樂播放系統
- [node-roon-api](https://github.com/roonlabs/node-roon-api) - Roon API 客戶端
