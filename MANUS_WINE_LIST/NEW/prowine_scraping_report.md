# ProWine 網站與酒莊官網爬蟲技術報告

**作者：** Manus AI
**日期：** 2025年11月28日
**版本：** 1.0

## 1. 專案目標

本報告旨在提供一個完整的技術指引，用於從 ProWine 酩陽實業官方網站 (`prowine.com.tw`) 以及其代理的各大酒莊官網，系統性地爬取並整理酒款與酒莊的詳細資訊。最終目標是建立一個結構化的資料庫，包含酒款照片、酒莊 LOGO、酒莊照片、酒款介紹、葡萄品種、年份、專業評分、品酒筆記與餐酒搭配建議。

本報告將詳細闡述爬蟲的邏輯、URL 結構、資料提取策略，並為下游開發工具（如 Cursor）提供清晰的實作步驟。

## 2. ProWine 網站爬蟲邏輯分析

ProWine 網站是主要的資訊來源，其結構相對簡單，適合進行爬蟲。以下是詳細的分析與策略。

### 2.1. URL 結構

經過分析，ProWine 網站的酒款詳細頁面遵循一個固定的 URL 格式：

```
http://prowine.com.tw/?wine={slug}
```

其中 `{slug}` 是由酒款的完整英文名稱轉換而來。轉換規則如下：

1.  將完整酒款名稱轉為全小寫。
2.  移除特殊符號，例如 `&`、`'`、`,`、`(`、`)`、`’`、`′`。
3.  將所有空格替換為單一的連字號 (`-`)。
4.  移除字串開頭和結尾可能出現的多餘連字號。

**範例：**

| 原始酒款名稱                                                                       | 生成的 Slug                                                                                |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `Darioush Darius II 2021`                                                          | `darioush-darius-ii-2021`                                                                  |
| `La Bastide Saint Dominique Les Hesperides, Châteauneuf Du Pape 2022 教皇新堡 仙女` | `la-bastide-saint-dominique-les-hesperides-chateauneuf-du-pape-2022-教皇新堡-仙女`         |
| `Ca'momi Rosso di California 2022`                                                 | `camomi-rosso-di-california-2022`                                                          |

### 2.2. 資料提取策略

每個酒款頁面的 HTML 結構一致，可以使用 `BeautifulSoup` 等函式庫進行解析。關鍵資訊的提取路徑如下：

-   **酒款照片 (Image URL):** 頁面中通常只有一張主要的酒款圖片，可以通過 `<img>` 標籤的 `src` 屬性捕獲。圖片 URL 通常是絕對路徑或相對路徑，需要與網站根 URL `http://prowine.com.tw/` 進行拼接。
-   **基本資料 (產區、類型、品種):** 這些資訊位於一個定義列表中，可以通過標題（如 `酒品產區：`）來定位其對應的值。
-   **詳細介紹 (Tasting Notes, Winemaking, etc.):** 位於「酒品介紹」區塊，內容為純文字段落，需要進行完整的文本提取與解析。各項評分（Decanter, James Suckling 等）也混雜在此段落中，建議使用正規表示式 (Regex) 進行精準匹配，例如 `r'Decanter\s*評分\s*[:：]\s*(\d+)'`。
-   **餐酒搭配 (Food Pairing):** 通常在詳細介紹的結尾部分，可以通過關鍵字「餐酒搭配」來定位。

### 2.3. 建議的資料結構 (JSON)

以下是根據已爬取的三款酒所建立的標準 JSON 結構，建議所有爬蟲任務都遵循此格式輸出，以確保資料一致性。

```json
[
  {
    "wine_name": "Darioush Darius II 2021",
    "winery": "Darioush Estate",
    "region": "Napa Valley, Mt. Veeder (Sage Vineyard)",
    "wine_type": "紅酒 Red wine",
    "grape_varieties": "83% Cabernet Sauvignon, 9% Cabernet Franc, 5% Merlot, 3% Petit Verdot",
    "vintage": "2021",
    "alcohol": "15.4%",
    "price": "13500元",
    "image_url": "http://prowine.com.tw/wp-content/uploads/2021-Darius-II-1.jpg",
    "prowine_url": "http://prowine.com.tw/?wine=darioush-darius-ii-2021",
    "ratings": {
      "decanter": "95",
      "james_suckling": "93",
      "wine_spectator": "91",
      "wine_enthusiast": "93",
      "robert_parker": "N/A"
    },
    "tasting_notes": "本款酒由83%的Cab. Sauv.和少數Cabernet Franc, Merlot, Petit Verdot 所組成。本款酒酒體厚重又平衡。具備深色莓果、咖啡、比利時巧克力的香氣，酒體結構美妙，口中感覺到黑莓、黑醋栗、百里香、月桂樹葉的香味。本款酒會給有耐心的收藏家好的回報。",
    "winemaking": "在葡萄園中小心翼翼的照顧，儘量減少在酒窖中的人為處理。人工採收於28磅的小桶子中。在去梗之前和在去梗之後，各以人工挑選一次。發酵過程包括冷浸泡4天，輕柔的淋汁，更長的浸皮時間來獲得最佳的顏色萃取和單寧發展。每年換桶2-3次，以得到澄清的酒液。",
    "oak_aging": "在100%傳統法國橡木桶中熟成20個月",
    "winemaker": "HOPE GOLDIE，由Michel Rolland提供諮詢服務",
    "food_pairing": "N/A",
    "label_story": "本年份的酒標來自英國建築設計師Owen Jones (1809-74)，他的設計著重於文化上的意義。他的工作精心的紀錄了圍繞百年文明的圖案和主題，通常是向古波斯藝術之美的致敬。他堅持設計的核心是超越人類文明的邊界，這也是釀酒所擁抱的理念。本年份酒標是來自於Jones在1860年的水彩畫設計，這幅畫和他其他的幾件作品保存於倫敦Victoria and Albert博物館。"
  },
  {
    "wine_name": "Peter Franus Napa Valley Red 2022",
    "winery": "Peter Franus Wine Company",
    "region": "Napa Valley (Steward Vineyard in Carneros, Brandlin Vineyard in Mount Veeder, Fore Family in Red Hills Lake County)",
    "wine_type": "紅酒 Red wine",
    "grape_varieties": "67% Merlot, 31% Cabernet Sauvignon, 2% Syrah",
    "vintage": "2022",
    "alcohol": "14.2%",
    "price": "3800元",
    "image_url": "http://prowine.com.tw/wp-content/uploads/IMAGES_PF_RED_WINE_NY_2007_001.jpg",
    "prowine_url": "http://prowine.com.tw/?wine=peter-franus-napa-valley-red-2022",
    "ratings": {
      "vinous": "90"
    },
    "tasting_notes": "本款酒的顏色是深紅寶石色，幾乎不透光，活潑又生動。具備傳統的黑櫻桃、藍莓、奶油味，以及些許的乾草藥(百里香、薰衣草、薄荷)。在口中有結構和酸度形成美妙的平衡。完美的單寧，尾韻特別的悠長。這是一款令人愉悅的酒，具有碾碎的花朵、紅色水果、柳橙、雪松、以及菸草味。酒體中等，非常迷人。(Antonio Galloni Dec. 2024)",
    "winemaking": "在華氏82度發酵8天，浸皮15天",
    "oak_aging": "置於法國橡木桶中18個月，其中50%是新的橡木桶",
    "winemaker": "Peter Franus",
    "food_pairing": "N/A",
    "vintage_notes": "在2021年12月的雨量豐富，接下來2022年1月和2月非常乾燥。但是土壤仍然有適當葡萄藤生長的溼度。夏季溫度和宜，只有少數幾次熱浪。"
  },
  {
    "wine_name": "La Bastide Saint Dominique Les Hesperides, Châteauneuf Du Pape 2022 教皇新堡 仙女",
    "winery": "La Bastide Saint Dominique",
    "region": "Châteauneuf-du-Pape, Southern Rhône",
    "wine_type": "紅酒 Red wine",
    "grape_varieties": "50% Grenache, 50% Mourvedre",
    "vintage": "2022",
    "alcohol": "15%",
    "price": "3000元",
    "image_url": "http://prowine.com.tw/wp-content/uploads/Les-Hesperides.jpg",
    "prowine_url": "http://prowine.com.tw/?wine=la-bastide-saint-dominique-les-hesperides-chateauneuf-du-pape-2022-教皇新堡-仙女",
    "ratings": {
      "wine_advocate": "89-91"
    },
    "tasting_notes": "本款酒是50% Grenache和50%Mourvedre混釀的葡萄酒，葡萄是栽種在面向北方的山坡上。酒色深，散發著香料、甘草、和黑莓的味道。酒體結實、飽滿、集中。本款酒的丹寧需要在瓶中再成熟幾年後適飲。適飲期間：2025 — 2040 (Wine Advocate評分人: Yohan Castaing, 2024年9月)",
    "winemaking": "完全去梗，裝在不鏽鋼釀酒大桶中25天，在溫度控制下壓皮和淋汁。Grenache在不鏽鋼桶中，Mourvedre在橡木桶中，熟成18個月，然後在酒莊中混合與裝瓶。",
    "oak_aging": "Grenache在不鏽鋼桶中，Mourvedre在橡木桶中，熟成18個月",
    "winemaker": "Gerard & Marie-Claude Bonnet",
    "food_pairing": "烤鴨配著無花果和甘草，陶罐裝的野雞配水果乾",
    "vineyard_info": "東/西向的山坡地，稱為LES BEDINES，只有0.9公頃。葡萄樹齡：老藤–1950年栽種至今",
    "serving_temperature": "攝氏15-16度"
  }
]
```

## 3. 酒莊官網爬蟲策略

爬取酒莊官網的目標是獲取 ProWine 網站上可能缺失的**高解析度 LOGO** 與 **3 張酒莊/葡萄園照片**。

### 3.1. 通用策略

1.  **尋找官網 URL:** 首先，使用酒莊名稱（例如 `Darioush Estate`）在 Google 等搜尋引擎上進行搜尋，找到其官方網站 URL。通常是搜尋結果的第一個。
2.  **網站結構探勘:** 訪問官網後，尋找以下常見頁面：
    *   `Our Story` / `About Us` (關於我們)
    *   `The Winery` / `Estate` (酒莊/莊園)
    *   `Vineyards` (葡萄園)
    *   `Media` / `Trade` / `Press` (媒體/行業/新聞資料)
3.  **圖片提取:**
    *   **LOGO:** LOGO 通常位於網站的頁首 (Header)，可能是一個 `<img>` 標籤，也可能是 SVG 格式。檢查 HTML 原始碼以獲取最高解析度的版本。
    *   **酒莊照片:** 在上述頁面中尋找高畫質的背景圖片、畫廊 (Gallery) 或嵌入的圖片。使用瀏覽器的開發者工具檢查圖片的原始 URL，確保下載的是最高解析度的版本，而非縮圖。

### 3.2. 範例：Darioush 官網

-   **官網 URL:** `https://www.darioush.com/` [1]
-   **LOGO:** 位於頁首，可直接從 `<a>` 標籤中找到 SVG 或高解析度 PNG 檔案。
-   **照片:** `Our Story` 頁面 (`/our-story/`) 包含多張關於酒莊歷史、建築和創始人的高畫質照片，非常適合選作代表性圖片。

## 4. 給 Cursor 的實作指引

以下是針對使用 Cursor 進行開發的自然語言指令，請將這些指令提供給 Cursor 以完成完整的爬蟲腳本開發。

### 4.1. 指令一：建立 ProWine 酒款爬蟲主腳本

「請建立一個 Python 腳本，命名為 `scrape_prowine_wines.py`。這個腳本需要實現以下功能：

1.  定義一個包含所有目標酒款名稱的列表（約 110 款）。
2.  建立一個函式 `wine_name_to_slug(name)`，該函式能根據本報告 2.1 節中描述的規則，將酒款名稱轉換為 URL slug。
3.  建立一個主函式 `scrape_wine_details(wine_name)`，它接收一個酒款名稱作為輸入，執行以下操作：
    a. 調用 `wine_name_to_slug` 生成 URL。
    b. 使用 `requests` 函式庫發送 HTTP GET 請求到該 URL。
    c. 使用 `BeautifulSoup` 解析回傳的 HTML 內容。
    d. 根據本報告 2.2 節的策略，提取所有必要的資訊（酒款名稱、照片 URL、產區、品種、年份、酒精濃度、所有評分、品酒筆記、餐酒搭配等）。
    e. 將提取的資料存儲在一個字典中，其結構需符合本報告 2.3 節定義的 JSON 格式。
    f. 實現完整的錯誤處理機制，如果請求失敗或頁面不存在，應記錄錯誤並返回 `None`。
4.  在主程式區塊 (`if __name__ == '__main__':`) 中，遍歷所有酒款列表，依次調用 `scrape_wine_details` 函式，並將成功的結果收集到一個列表中。
5.  在所有酒款處理完畢後，將最終的結果列表寫入一個名為 `prowine_wines_database.json` 的檔案中。請在請求之間加入 1-2 秒的延遲，以避免對伺服器造成過大負擔。」

### 4.2. 指令二：建立酒莊官網爬蟲輔助腳本

「請建立第二個 Python 腳本，命名為 `scrape_winery_assets.py`。此腳本的功能是根據已知的酒莊官網 URL，爬取 LOGO 和照片。

1.  定義一個包含酒莊名稱和其官網 URL 的字典作為輸入。
2.  建立一個函式 `scrape_winery(winery_name, winery_url)`，它執行以下操作：
    a. 使用 `requests` 和 `BeautifulSoup` 訪問酒莊官網首頁。
    b. 從頁首的 HTML 中定位並提取 LOGO 的 URL。優先尋找 SVG 格式，其次是高解析度的 PNG 或 JPG。
    c. 導航到 'About Us' 或 'Our Story' 等頁面，尋找至少三張高解析度的酒莊或葡萄園照片 URL。
    d. 實現一個下載函式，將找到的 LOGO 和照片下載到以酒莊名稱命名的資料夾中（例如 `/home/ubuntu/winery_assets/Darioush_Estate/`）。
    e. 返回一個包含所有已下載圖片 URL 的字典。
3.  主程式應能接收一個酒莊列表，並為每個酒莊執行爬蟲與下載任務。」

## 5. 結論

本報告提供了從 ProWine 網站及其代理酒莊官網爬取資料的完整策略與實作指引。通過遵循本文的 URL 結構分析、資料提取策略以及給 Cursor 的開發指令，可以高效、準確地完成資料庫的建立。建議在開發過程中密切注意網站結構的可能變化，並相應地調整爬蟲邏輯。

---

## 參考資料

[1] Darioush. (2025). *Darioush Winery Official Website*. Retrieved from https://www.darioush.com/
