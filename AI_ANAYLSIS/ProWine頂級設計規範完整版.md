# ProWine 頂級葡萄酒電商設計規範
## 羅浮宮畫展級別的精品電商設計系統

> **目標**: 打造2026年可獲得WebAwards、Awwwards等國際設計大獎的頂級葡萄酒電商平台
> **標準**: 精緻、高級、精品、優雅，完全沒有AI拼湊感的統一視覺系統

---

## 一、全球頂級葡萄酒網站設計分析

### 🏆 WebAwards 2025 最佳飲品網站: BRAND Napa Valley

**核心設計特點**:
1. **極簡主義敘事** (Minimalist Storytelling)
   - 大量留白，視覺呼吸空間充足
   - 每個元素都經過深思熟慮
   - 無多餘裝飾

2. **粗體排版系統** (Bold Typography)
   - 使用現代 Sans-serif 作為主字體
   - 字重對比強烈 (Regular 400 vs Bold 700)
   - 字階系統嚴謹 (H1: 72px → H6: 16px)

3. **時尚風格美學** (Fashion-Inspired Aesthetic)
   - 深色背景 + 金色點綴
   - 奢侈品牌色彩語言
   - 類似 Dior、Chanel 的視覺語言

4. **科技感與傳統工藝融合**
   - 流暢的動態效果
   - Parallax scrolling
   - WebGL 特效
   - 但保持傳統葡萄酒莊園的質感

5. **無縫電商體驗**
   - DTC (Direct-to-Consumer) 優化
   - Trade Partner 專區
   - 購物流程極簡化

---

### 🏆 Awwwards SOTM 2023: Pasqua Wines

**核心設計特點**:
1. **沉浸式開場體驗**
   - AI生成的XVIII世紀別墅 Trompe-l'œil 效果
   - WebGL 3D房間場景
   - 平滑的相機運動
   - God Rays、灰塵效果、蝴蝶動畫增強立體感

2. **色彩系統**
   - 主色: `#6E6548` (大地色調)
   - 輔色: `#C1380F` (深紅酒色)
   - 中性色調作為內容畫布
   - 去飽和處理保持高級感

3. **字體配對**
   - **Acid Grotesk** (現代 Grotesque)
   - **Wulkan Display** (展示用襯線體)
   - 粗體聲明突出品牌精髓

4. **編輯式設計**
   - 雜誌風格排版
   - 內容層次分明
   - 豐富但結構清晰

---

### 🏆 其他頂級案例分析

#### **Moët & Chandon**
- 奢華與優雅的典範
- 流暢的導航設計
- 引人入勝的內容策略
- 高端視覺與功能完美平衡

#### **Merus Wines**
- 極簡主義 + 排他性
- 深色配色方案
- 高品質視覺素材
- 直覺導航系統

#### **Long Meadow Ranch**
- 鄉村魅力與現代精緻的融合
- 農場到餐桌的視覺敘事
- 可持續性實踐的視覺呈現
- 美麗圖像與易用性結合

---

## 二、Wine Card & Winery Card 設計規範

### 📋 羅浮宮畫展級別的卡片設計

#### **A. 整體設計原則**

```
1. 比例系統: 黃金比例 1.618
   - 卡片寬高比: 16:9 或 3:4
   - 內容留白比例: 40%

2. 視覺層次: 
   - 第一視線: 酒標/酒莊Logo (0-0.5秒)
   - 第二視線: 酒款名稱 (0.5-1秒)
   - 第三視線: 關鍵資訊 (1-2秒)
   - 第四視線: 次要資訊 (2-3秒)

3. 空間哲學:
   - 留白即奢華
   - 每個元素都要有呼吸空間
   - 密度 < 60%
```

#### **B. Wine Card 詳細規範**

```jsx
// Wine Card 結構
<WineCard>
  <ImageSection ratio="3:4">
    <WineBottleImage>
      - 高解析度 (2400x3200px minimum)
      - 白色或漸層背景
      - 瓶身光影處理
      - 可360度旋轉 (Optional)
    </WineBottleImage>
    <HoverOverlay>
      - 金色邊框淡入
      - 放大1.05倍
      - Ease-out 0.3s
    </HoverOverlay>
    <BadgeSystem>
      - 得獎標誌 (左上)
      - 限量標誌 (右上)
      - 折扣標誌 (右下，謹慎使用)
    </BadgeSystem>
  </ImageSection>

  <ContentSection padding="24px">
    <WineryName>
      Font: Serif (如 Crimson Pro)
      Size: 14px
      Weight: 400
      Color: #666
      Letter-spacing: 0.5px
    </WineryName>

    <WineName>
      Font: Serif (如 Playfair Display)
      Size: 22px
      Weight: 600
      Color: #1A1A1A
      Line-height: 1.3
      Margin-top: 8px
    </WineName>

    <Vintage>
      Font: Sans-serif
      Size: 16px
      Weight: 500
      Color: #999
    </Vintage>

    <TastingNotes>
      Font: Sans-serif (如 Inter)
      Size: 14px
      Weight: 400
      Color: #666
      Line-height: 1.6
      Max-lines: 3
      Fade-out: gradient
    </TastingNotes>

    <MetaInfo display="flex">
      <Region>
        Icon: Location pin
        Text: Burgundy, France
      </Region>
      <Varietal>
        Icon: Grape cluster
        Text: Pinot Noir
      </Varietal>
      <Alcohol>
        Icon: Percentage
        Text: 13.5%
      </Alcohol>
    </MetaInfo>

    <PriceSection display="flex" justify="space-between">
      <Price>
        Font: Serif
        Size: 28px
        Weight: 700
        Color: #B8860B (Dark Goldenrod)
      </Price>
      <CTAButton>
        Background: #1A1A1A
        Color: #FFF
        Hover: #B8860B
        Border-radius: 0 (銳角)
        Padding: 12px 32px
      </CTAButton>
    </PriceSection>
  </ContentSection>
</WineCard>
```

#### **C. Winery Card 詳細規範**

```jsx
// Winery Card 結構
<WineryCard>
  <HeroImage ratio="21:9">
    <VineyardPhoto>
      - 超高解析度莊園照片
      - 黃金時刻攝影 (Golden Hour)
      - 景深效果
      - Parallax scrolling
    </VineyardPhoto>
    <GradientOverlay>
      - Linear gradient (transparent → rgba(0,0,0,0.6))
      - Position: bottom 50%
    </GradientOverlay>
    <WineryLogo position="center">
      - SVG格式
      - 白色或金色
      - 尺寸: 120px height
    </WineryLogo>
  </HeroImage>

  <ContentSection padding="32px">
    <WineryName>
      Font: Serif Display
      Size: 32px
      Weight: 700
      Color: #1A1A1A
      Text-align: center
    </WineryName>

    <EstablishedYear>
      Font: Sans-serif
      Size: 14px
      Weight: 400
      Color: #999
      Text-align: center
      Letter-spacing: 2px
    </EstablishedYear>

    <StoryExcerpt>
      Font: Serif
      Size: 16px
      Weight: 400
      Color: #333
      Line-height: 1.8
      Max-lines: 4
      Text-align: center
      Margin: 24px auto
      Max-width: 600px
    </StoryExcerpt>

    <HighlightsGrid display="grid" columns="3" gap="16px">
      <Highlight>
        <Icon> 🏆 </Icon>
        <Label> 得獎記錄 </Label>
        <Value> 23 Awards </Value>
      </Highlight>
      <Highlight>
        <Icon> 🍇 </Icon>
        <Label> 種植面積 </Label>
        <Value> 150 Hectares </Value>
      </Highlight>
      <Highlight>
        <Icon> 📅 </Icon>
        <Label> 建立年份 </Label>
        <Value> 1892 </Value>
      </Highlight>
    </HighlightsGrid>

    <WineCollectionPreview>
      - 3-4支代表性酒款
      - 迷你 Wine Card
      - Carousel 效果
    </WineCollectionPreview>

    <CTASection>
      <PrimaryButton>
        探索酒款系列
      </PrimaryButton>
      <SecondaryButton>
        了解莊園故事
      </SecondaryButton>
    </CTASection>
  </ContentSection>
</WineryCard>
```

---

## 三、整體視覺系統 (Design System)

### 🎨 色彩系統

```scss
// Primary Palette - 主色調
$primary-dark: #1A1A1A;        // 主黑
$primary-gold: #B8860B;         // 深金
$primary-burgundy: #722F37;     // 勃艮地酒紅
$primary-cream: #F5F1E8;        // 奶油白

// Secondary Palette - 輔助色
$secondary-grey-100: #FAFAFA;   // 極淺灰
$secondary-grey-200: #E5E5E5;   // 淺灰
$secondary-grey-400: #999999;   // 中灰
$secondary-grey-600: #666666;   // 深灰
$secondary-grey-800: #333333;   // 極深灰

// Accent Colors - 強調色
$accent-copper: #B87333;        // 銅色
$accent-sage: #8B9A7E;          // 鼠尾草綠
$accent-plum: #5D3A5A;          // 梅紫

// Functional Colors - 功能色
$success: #2E7D32;
$warning: #F57C00;
$error: #C62828;
$info: #0277BD;

// Usage Rules 使用規則
1. 背景色優先使用: 白色、奶油白、極淺灰
2. 文字色優先使用: 主黑、深灰、中灰
3. 強調色謹慎使用，不超過頁面5%
4. 金色僅用於: 價格、特殊標籤、分隔線
5. 絕不使用: 純黑 #000、純白 #FFF (除特殊情況)
```

### 📐 間距系統

```scss
// Spacing Scale - 8pt Grid System
$space-4:   4px;    // 極小間距
$space-8:   8px;    // 最小間距
$space-12:  12px;   // 小間距
$space-16:  16px;   // 標準間距
$space-24:  24px;   // 中間距
$space-32:  32px;   // 大間距
$space-48:  48px;   // 超大間距
$space-64:  64px;   // 區塊間距
$space-96:  96px;   // Section 間距
$space-128: 128px;  // Hero 間距

// Container System
$container-xs:  480px;  // Mobile
$container-sm:  768px;  // Tablet
$container-md:  1024px; // Small Desktop
$container-lg:  1280px; // Desktop
$container-xl:  1440px; // Large Desktop
$container-2xl: 1920px; // Extra Large

// Padding System
$padding-section: 128px 0;  // 區段上下
$padding-card: 32px;        // 卡片內距
$padding-button: 12px 32px; // 按鈕內距
```

### 🔤 字體系統

```scss
// Font Families
$font-serif: 'Playfair Display', 'Crimson Pro', Georgia, serif;
$font-sans: 'Inter', 'SF Pro Display', -apple-system, sans-serif;
$font-display: 'Cormorant Garamond', 'Cinzel', serif;

// Font Sizes - Type Scale (Major Third 1.25)
$text-xs:   12px;   // Caption
$text-sm:   14px;   // Small Text
$text-base: 16px;   // Body
$text-lg:   18px;   // Large Body
$text-xl:   20px;   // Subtitle
$text-2xl:  24px;   // Small Heading
$text-3xl:  30px;   // Medium Heading
$text-4xl:  36px;   // Large Heading
$text-5xl:  48px;   // Extra Large Heading
$text-6xl:  60px;   // Display
$text-7xl:  72px;   // Hero Display

// Font Weights
$weight-light:    300;
$weight-regular:  400;
$weight-medium:   500;
$weight-semibold: 600;
$weight-bold:     700;

// Line Heights
$leading-tight:   1.2;
$leading-snug:    1.3;
$leading-normal:  1.5;
$leading-relaxed: 1.6;
$leading-loose:   1.8;

// Letter Spacing
$tracking-tight:  -0.02em;
$tracking-normal: 0;
$tracking-wide:   0.025em;
$tracking-wider:  0.05em;
$tracking-widest: 0.1em;

// Typography Usage 使用規則
H1: {
  font-family: $font-display;
  font-size: $text-6xl;
  font-weight: $weight-bold;
  line-height: $leading-tight;
  letter-spacing: $tracking-tight;
}

H2: {
  font-family: $font-serif;
  font-size: $text-5xl;
  font-weight: $weight-semibold;
  line-height: $leading-snug;
}

Body: {
  font-family: $font-sans;
  font-size: $text-base;
  font-weight: $weight-regular;
  line-height: $leading-relaxed;
  color: $secondary-grey-600;
}

Button: {
  font-family: $font-sans;
  font-size: $text-sm;
  font-weight: $weight-medium;
  letter-spacing: $tracking-wide;
  text-transform: uppercase;
}
```

### ✨ 動畫系統

```scss
// Timing Functions
$ease-in-out-cubic: cubic-bezier(0.645, 0.045, 0.355, 1);
$ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
$ease-in-out-quart: cubic-bezier(0.77, 0, 0.175, 1);

// Durations
$duration-fast: 200ms;
$duration-base: 300ms;
$duration-slow: 500ms;
$duration-slower: 800ms;

// Common Animations
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// Hover Effects
.card-hover {
  transition: all $duration-base $ease-out-expo;
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 24px 48px rgba(0,0,0,0.12);
  }
}

.image-hover {
  overflow: hidden;
  
  img {
    transition: transform $duration-slower $ease-out-expo;
  }
  
  &:hover img {
    transform: scale(1.05);
  }
}

.button-hover {
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,0.2),
      transparent
    );
    transition: left $duration-slow;
  }
  
  &:hover::before {
    left: 100%;
  }
}
```

---

## 四、AI 功能實現方案

### 🤖 A. AI 侍酒師聊天系統

#### **1. 核心功能**

```typescript
// AI Sommelier System Architecture

interface SommelierChatSystem {
  // 使用者輸入處理
  userInput: {
    textAnalysis: NaturalLanguageProcessing;
    intentRecognition: IntentClassifier;
    contextManagement: ConversationContext;
  };
  
  // 推薦引擎
  recommendationEngine: {
    tasteProfiling: TasteProfileAnalyzer;
    foodPairing: FoodPairingEngine;
    occasionMatching: OccasionMatcher;
    budgetOptimization: BudgetOptimizer;
    inventoryCheck: RealTimeInventory;
  };
  
  // 回應生成
  responseGeneration: {
    naturalLanguage: ResponseGenerator;
    productSuggestions: WineRecommendations;
    educationalContent: WineKnowledge;
    personalizedInsights: UserHistory;
  };
}

// 問答流程設計
const conversationFlow = {
  greeting: {
    message: "您好！我是ProWine的AI侍酒師，請問今天想找什麼樣的葡萄酒？",
    options: [
      "為晚餐配酒",
      "送禮推薦",
      "自己品飲",
      "商務宴請",
      "探索新品"
    ]
  },
  
  preference: {
    questions: [
      "您比較喜歡什麼風格？清爽、飽滿、還是介於兩者之間？",
      "預算範圍大約是多少？",
      "會搭配什麼餐點嗎？",
      "喜歡的葡萄品種？（如果有的話）"
    ]
  },
  
  recommendation: {
    format: {
      wineList: "3-5支精選推薦",
      reasoning: "為什麼推薦這款酒",
      pairingAdvice: "配餐建議",
      servingTips: "侍酒溫度與醒酒建議",
      alternativeOptions: "其他選擇"
    }
  }
};
```

#### **2. UI/UX 設計**

```jsx
// AI Chat Interface Component

const AISommelierChat = () => {
  return (
    <ChatContainer>
      {/* 固定在右下角的聊天氣泡 */}
      <ChatBubble 
        position="fixed"
        bottom="32px"
        right="32px"
        zIndex={1000}
      >
        <BubbleIcon>
          {/* 葡萄酒杯動畫icon */}
          <AnimatedWineGlass />
          <StatusDot active />
        </BubbleIcon>
      </ChatBubble>

      {/* 展開的聊天視窗 */}
      <ChatWindow
        width="420px"
        height="680px"
        borderRadius="16px"
        boxShadow="0 24px 48px rgba(0,0,0,0.2)"
      >
        {/* Header */}
        <ChatHeader>
          <AISommelierAvatar />
          <HeaderInfo>
            <Name>AI 侍酒師</Name>
            <Status>線上為您服務</Status>
          </HeaderInfo>
          <MinimizeButton />
        </ChatHeader>

        {/* Messages Area */}
        <MessagesContainer>
          <WelcomeMessage>
            <Avatar type="sommelier" />
            <MessageBubble type="received">
              <Text>
                您好！我是ProWine的AI侍酒師。
                我可以根據您的口味、場合和預算，
                為您推薦最適合的葡萄酒。
              </Text>
              <QuickReplies>
                <QuickReply>為晚餐配酒</QuickReply>
                <QuickReply>送禮推薦</QuickReply>
                <QuickReply>自己品飲</QuickReply>
              </QuickReplies>
            </MessageBubble>
          </WelcomeMessage>

          {messages.map(msg => (
            <Message key={msg.id}>
              {msg.type === 'wine-recommendation' && (
                <WineRecommendationCard>
                  <WineImage src={msg.wine.image} />
                  <WineInfo>
                    <WineName>{msg.wine.name}</WineName>
                    <Price>{msg.wine.price}</Price>
                    <Reasoning>{msg.reasoning}</Reasoning>
                  </WineInfo>
                  <Actions>
                    <ViewDetailsButton />
                    <AddToCartButton />
                  </Actions>
                </WineRecommendationCard>
              )}
            </Message>
          ))}

          {/* Loading indicator */}
          {isTyping && (
            <TypingIndicator>
              <Avatar type="sommelier" />
              <TypingDots>
                <Dot delay="0ms" />
                <Dot delay="200ms" />
                <Dot delay="400ms" />
              </TypingDots>
            </TypingIndicator>
          )}
        </MessagesContainer>

        {/* Input Area */}
        <InputArea>
          <TextField
            placeholder="描述您想要的葡萄酒..."
            multiline
          />
          <SendButton disabled={!inputValue}>
            <SendIcon />
          </SendButton>
        </InputArea>
      </ChatWindow>
    </ChatContainer>
  );
};

// Styling
const chatStyles = {
  chatWindow: {
    background: 'linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0,0,0,0.08)',
  },
  
  message: {
    received: {
      background: '#FFFFFF',
      color: '#333333',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    sent: {
      background: '#1A1A1A',
      color: '#FFFFFF',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }
  },
  
  wineCard: {
    padding: '16px',
    borderRadius: '12px',
    background: '#FFFFFF',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    transition: 'all 300ms ease-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    }
  }
};
```

#### **3. AI 技術實現**

```typescript
// AI Implementation with Claude API

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Sommelier Prompt Template
const SOMMELIER_SYSTEM_PROMPT = `
你是ProWine的專業AI侍酒師，擁有以下特質：

1. 專業知識：
   - 精通全球各大產區的葡萄酒
   - 了解葡萄品種、釀造工藝、陳年潛力
   - 熟悉餐酒搭配原則

2. 溝通風格：
   - 親切、專業但不裝腔作勢
   - 用淺顯易懂的方式解釋專業知識
   - 根據客戶的經驗程度調整用語

3. 推薦策略：
   - 基於客戶的口味偏好、預算、場合
   - 每次推薦3-5支酒，說明理由
   - 提供配餐建議和侍酒技巧
   - 考慮庫存狀況

4. 商業意識：
   - 了解ProWine的產品定位
   - 平衡客戶需求與商業目標
   - 適當推薦高毛利或特色產品

當前庫存資訊：
{inventory_data}

請以專業、親切的態度協助客戶選酒。
`;

// Conversation Handler
async function handleSommelierChat(
  userMessage: string,
  conversationHistory: Message[],
  userProfile: UserProfile,
  inventory: WineInventory[]
) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: SOMMELIER_SYSTEM_PROMPT.replace(
      '{inventory_data}',
      JSON.stringify(inventory)
    ),
    messages: [
      ...conversationHistory,
      { role: "user", content: userMessage }
    ],
  });

  // Parse AI response
  const aiMessage = response.content[0].text;
  
  // Extract wine recommendations if any
  const recommendations = extractWineRecommendations(aiMessage, inventory);
  
  return {
    message: aiMessage,
    recommendations: recommendations,
    followUpSuggestions: generateFollowUpSuggestions(aiMessage)
  };
}

// Wine Recommendation Extraction
function extractWineRecommendations(
  aiResponse: string,
  inventory: WineInventory[]
): WineRecommendation[] {
  // Parse AI response for wine names/IDs
  // Match with inventory
  // Return structured recommendations with:
  // - Wine details
  // - Reasoning
  // - Pairing advice
  // - Serving temperature
  // - Price
}
```

---

### 🎯 B. 智能推薦系統

```typescript
// Intelligent Recommendation Engine

interface RecommendationEngine {
  // 個人化推薦
  personalizedRecommendations(userId: string): WineRecommendation[] {
    const userProfile = getUserProfile(userId);
    const purchaseHistory = getPurchaseHistory(userId);
    const browsingHistory = getBrowsingHistory(userId);
    
    return calculateRecommendations({
      tastePREFERENCES: userProfile.tasteProfile,
      priceRange: userProfile.budgetPreference,
      previousPurchases: purchaseHistory,
      viewedProducts: browsingHistory,
      occasion: detectCurrentOccasion(),
    });
  }
  
  // 相似商品推薦
  similarWines(wineId: string): Wine[] {
    const wine = getWineById(wineId);
    
    return findSimilarWines({
      region: wine.region,
      varietal: wine.varietal,
      priceRange: [wine.price * 0.8, wine.price * 1.2],
      style: wine.styleProfile,
      vintage: wine.vintage,
      limit: 6
    });
  }
  
  // 配餐推薦
  foodPairing(dish: string): Wine[] {
    const dishProfile = analyzeDish(dish);
    
    return matchWinesToFood({
      flavor: dishProfile.flavorProfile,
      richness: dishProfile.richness,
      sauce: dishProfile.sauce,
      protein: dishProfile.protein,
      cuisine: dishProfile.cuisineType
    });
  }
  
  // 場合推薦
  occasionRecommendations(occasion: Occasion): WineCollection {
    const occasionMap = {
      'romantic-dinner': {
        style: ['elegant', 'refined', 'special'],
        price: 'premium',
        packaging: 'gift-ready'
      },
      'business-gift': {
        prestige: 'high',
        recognition: 'well-known',
        price: 'luxury',
        packaging: 'corporate'
      },
      'casual-gathering': {
        style: ['approachable', 'crowd-pleasing'],
        price: 'mid-range',
        quantity: 'multiple-bottles'
      }
    };
    
    return buildWineCollection(occasionMap[occasion]);
  }
}

// Machine Learning Integration
interface MLRecommendationModel {
  // 協同過濾
  collaborativeFiltering(): {
    userBasedCF: (userId: string) => Wine[];
    itemBasedCF: (wineId: string) => Wine[];
  }
  
  // 內容過濾
  contentBasedFiltering(): {
    tasteProfileMatching: (profile: TasteProfile) => Wine[];
    attributeMatching: (attributes: WineAttributes) => Wine[];
  }
  
  // 混合推薦
  hybridRecommendation(): {
    weightedCombination: (methods: RecommendationMethod[]) => Wine[];
    ensembleLearning: (models: MLModel[]) => Wine[];
  }
}
```

---

## 五、完整前後台會員系統

### 👥 A. 前台會員功能

```typescript
// Frontend Member System Architecture

interface MemberSystem {
  // 會員等級
  tiers: {
    bronze: {
      threshold: 0,
      benefits: [
        'baseline_discount_5%',
        'birthday_bonus',
        'email_newsletter'
      ]
    },
    silver: {
      threshold: 50000, // 累計消費
      benefits: [
        'discount_10%',
        'free_shipping',
        'priority_support',
        'exclusive_tastings'
      ]
    },
    gold: {
      threshold: 150000,
      benefits: [
        'discount_15%',
        'free_shipping_expedited',
        'personal_sommelier',
        'winery_visits',
        'library_access'
      ]
    },
    platinum: {
      threshold: 500000,
      benefits: [
        'discount_20%',
        'white_glove_service',
        'dedicated_account_manager',
        'exclusive_allocations',
        'private_events'
      ]
    }
  };
  
  // 會員功能模組
  modules: {
    profile: MemberProfile;
    orders: OrderHistory;
    wishlist: WishlistManagement;
    reviews: ReviewSystem;
    rewards: LoyaltyProgram;
    preferences: PreferenceCenter;
    subscriptions: SubscriptionManagement;
  };
}

// Member Dashboard UI
const MemberDashboard = () => {
  return (
    <DashboardLayout>
      {/* Sidebar Navigation */}
      <Sidebar>
        <UserProfile>
          <Avatar size="80px" />
          <MemberInfo>
            <Name>{user.name}</Name>
            <TierBadge tier={user.tier} />
            <Points>{user.loyaltyPoints} 點</Points>
          </MemberInfo>
        </UserProfile>
        
        <Navigation>
          <NavItem icon="dashboard" to="/member">總覽</NavItem>
          <NavItem icon="orders" to="/member/orders">訂單記錄</NavItem>
          <NavItem icon="heart" to="/member/wishlist">願望清單</NavItem>
          <NavItem icon="star" to="/member/reviews">我的評價</NavItem>
          <NavItem icon="gift" to="/member/rewards">優惠回饋</NavItem>
          <NavItem icon="user" to="/member/profile">個人資料</NavItem>
          <NavItem icon="settings" to="/member/preferences">偏好設定</NavItem>
        </Navigation>
      </Sidebar>

      {/* Main Content */}
      <MainContent>
        {/* Overview Dashboard */}
        <Section>
          <SectionHeader>
            <Title>會員總覽</Title>
            <TierProgress>
              <Progress value={tierProgress} />
              <Label>
                再消費 NT${nextTierThreshold - currentSpending} 
                即可升級至 {nextTier}
              </Label>
            </TierProgress>
          </SectionHeader>

          <StatisticsGrid>
            <StatCard>
              <Icon>📦</Icon>
              <Value>{totalOrders}</Value>
              <Label>總訂單數</Label>
            </StatCard>
            <StatCard>
              <Icon>💰</Icon>
              <Value>NT${totalSpending}</Value>
              <Label>累計消費</Label>
            </StatCard>
            <StatCard>
              <Icon>⭐</Icon>
              <Value>{loyaltyPoints}</Value>
              <Label>紅利點數</Label>
            </StatCard>
            <StatCard>
              <Icon>🎁</Icon>
              <Value>{availableCoupons}</Value>
              <Label>可用優惠券</Label>
            </StatCard>
          </StatisticsGrid>
        </Section>

        {/* Recent Orders */}
        <Section>
          <SectionHeader>
            <Title>最近訂單</Title>
            <ViewAllLink to="/member/orders">查看全部</ViewAllLink>
          </SectionHeader>
          
          <OrdersList>
            {recentOrders.map(order => (
              <OrderCard key={order.id}>
                <OrderHeader>
                  <OrderNumber>{order.number}</OrderNumber>
                  <OrderStatus status={order.status} />
                </OrderHeader>
                <OrderItems>
                  {order.items.map(item => (
                    <OrderItem>
                      <WineImage src={item.wine.image} />
                      <ItemInfo>
                        <WineName>{item.wine.name}</WineName>
                        <Quantity>x{item.quantity}</Quantity>
                      </ItemInfo>
                    </OrderItem>
                  ))}
                </OrderItems>
                <OrderFooter>
                  <OrderDate>{order.date}</OrderDate>
                  <OrderTotal>NT${order.total}</OrderTotal>
                  <OrderActions>
                    <ViewDetailsButton />
                    {order.status === 'delivered' && (
                      <ReviewButton />
                    )}
                  </OrderActions>
                </OrderFooter>
              </OrderCard>
            ))}
          </OrdersList>
        </Section>

        {/* Personalized Recommendations */}
        <Section>
          <SectionHeader>
            <Title>為您推薦</Title>
            <RefreshButton />
          </SectionHeader>
          
          <WineGrid columns="4">
            {recommendations.map(wine => (
              <WineCard wine={wine} />
            ))}
          </WineGrid>
        </Section>

        {/* Wishlist Preview */}
        <Section>
          <SectionHeader>
            <Title>願望清單</Title>
            <ViewAllLink to="/member/wishlist">查看全部</ViewAllLink>
          </SectionHeader>
          
          <WishlistCarousel>
            {wishlistItems.map(wine => (
              <WineCard wine={wine} />
            ))}
          </WishlistCarousel>
        </Section>

        {/* Loyalty Rewards */}
        <Section>
          <SectionHeader>
            <Title>優惠回饋</Title>
          </SectionHeader>
          
          <RewardsPanel>
            <PointsBalance>
              <Icon>⭐</Icon>
              <Value>{loyaltyPoints}</Value>
              <Label>可用點數</Label>
            </PointsBalance>
            
            <AvailableRewards>
              {availableRewards.map(reward => (
                <RewardCard key={reward.id}>
                  <RewardImage src={reward.image} />
                  <RewardInfo>
                    <RewardTitle>{reward.title}</RewardTitle>
                    <RewardPoints>{reward.pointsCost} 點</RewardPoints>
                  </RewardInfo>
                  <RedeemButton />
                </RewardCard>
              ))}
            </AvailableRewards>

            <CouponsList>
              {availableCoupons.map(coupon => (
                <CouponCard key={coupon.id}>
                  <CouponValue>{coupon.discount}</CouponValue>
                  <CouponInfo>
                    <CouponTitle>{coupon.title}</CouponTitle>
                    <CouponExpiry>有效期至: {coupon.expiryDate}</CouponExpiry>
                  </CouponInfo>
                  <UseNowButton />
                </CouponCard>
              ))}
            </CouponsList>
          </RewardsPanel>
        </Section>
      </MainContent>
    </DashboardLayout>
  );
};
```

### 🔧 B. 後台管理系統

```typescript
// Backend Admin System

interface AdminSystem {
  // 會員管理
  memberManagement: {
    memberList: () => Member[];
    memberDetail: (id: string) => MemberDetail;
    memberActivity: (id: string) => ActivityLog[];
    memberSegmentation: () => MemberSegment[];
    tierManagement: () => TierConfiguration;
    bulkOperations: () => BulkAction[];
  };
  
  // 訂單管理
  orderManagement: {
    orderList: () => Order[];
    orderDetail: (id: string) => OrderDetail;
    orderFulfillment: () => FulfillmentQueue;
    shippingManagement: () => ShippingOperations;
    returnRefund: () => ReturnManagement;
    invoicing: () => InvoiceSystem;
  };
  
  // 商品管理
  productManagement: {
    wineInventory: () => WineInventory;
    wineryManagement: () => WineryData;
    pricingStrategy: () => PricingRules;
    promotionManagement: () => PromotionCampaigns;
    stockManagement: () => StockOperations;
  };
  
  // 行銷管理
  marketingManagement: {
    emailCampaigns: () => EmailMarketing;
    loyaltyProgram: () => LoyaltyConfiguration;
    couponManagement: () => CouponSystem;
    recommendationEngine: () => RecommendationConfig;
    analyticsReporting: () => MarketingAnalytics;
  };
  
  // 內容管理
  contentManagement: {
    blogPosts: () => BlogManagement;
    tastingNotes: () => TastingNotesEditor;
    wineryStories: () => StoryManagement;
    educationalContent: () => ContentLibrary;
  };
  
  // 系統設定
  systemConfiguration: {
    siteSettings: () => SiteConfig;
    paymentGateway: () => PaymentConfig;
    shippingRules: () => ShippingRules;
    taxConfiguration: () => TaxSettings;
    emailTemplates: () => TemplateManagement;
    userPermissions: () => RoleManagement;
  };
}

// Admin Dashboard UI
const AdminDashboard = () => {
  return (
    <AdminLayout>
      {/* Top Bar */}
      <TopBar>
        <Logo />
        <SearchBar />
        <QuickActions>
          <NotificationBell />
          <AdminProfile />
        </QuickActions>
      </TopBar>

      {/* Sidebar */}
      <Sidebar>
        <NavSection title="總覽">
          <NavItem icon="dashboard" to="/admin">儀表板</NavItem>
          <NavItem icon="analytics" to="/admin/analytics">數據分析</NavItem>
        </NavSection>
        
        <NavSection title="會員管理">
          <NavItem icon="users" to="/admin/members">會員列表</NavItem>
          <NavItem icon="segments" to="/admin/segments">會員分群</NavItem>
          <NavItem icon="tiers" to="/admin/tiers">等級設定</NavItem>
        </NavSection>
        
        <NavSection title="訂單管理">
          <NavItem icon="orders" to="/admin/orders">訂單列表</NavItem>
          <NavItem icon="fulfillment" to="/admin/fulfillment">訂單處理</NavItem>
          <NavItem icon="shipping" to="/admin/shipping">出貨管理</NavItem>
          <NavItem icon="returns" to="/admin/returns">退換貨</NavItem>
        </NavSection>
        
        <NavSection title="商品管理">
          <NavItem icon="wine" to="/admin/wines">酒款庫存</NavItem>
          <NavItem icon="winery" to="/admin/wineries">酒莊管理</NavItem>
          <NavItem icon="pricing" to="/admin/pricing">價格策略</NavItem>
          <NavItem icon="promotions" to="/admin/promotions">促銷活動</NavItem>
        </NavSection>
        
        <NavSection title="行銷管理">
          <NavItem icon="email" to="/admin/email">Email 行銷</NavItem>
          <NavItem icon="loyalty" to="/admin/loyalty">忠誠計畫</NavItem>
          <NavItem icon="coupons" to="/admin/coupons">優惠券</NavItem>
          <NavItem icon="recommendations" to="/admin/recommendations">推薦引擎</NavItem>
        </NavSection>
        
        <NavSection title="內容管理">
          <NavItem icon="blog" to="/admin/blog">部落格</NavItem>
          <NavItem icon="notes" to="/admin/tasting-notes">品飲筆記</NavItem>
          <NavItem icon="stories" to="/admin/stories">酒莊故事</NavItem>
        </NavSection>
        
        <NavSection title="系統設定">
          <NavItem icon="settings" to="/admin/settings">網站設定</NavItem>
          <NavItem icon="payment" to="/admin/payment">金流設定</NavItem>
          <NavItem icon="shipping" to="/admin/shipping-rules">物流規則</NavItem>
          <NavItem icon="permissions" to="/admin/permissions">權限管理</NavItem>
        </NavSection>
      </Sidebar>

      {/* Main Content */}
      <MainContent>
        {/* KPI Overview */}
        <Section>
          <SectionHeader>
            <Title>關鍵指標</Title>
            <DateRangePicker />
          </SectionHeader>
          
          <KPIGrid>
            <KPICard>
              <KPIIcon>💰</KPIIcon>
              <KPIValue>NT$1,234,567</KPIValue>
              <KPILabel>總營收</KPILabel>
              <KPIChange positive>+12.5%</KPIChange>
            </KPICard>
            
            <KPICard>
              <KPIIcon>📦</KPIIcon>
              <KPIValue>456</KPIValue>
              <KPILabel>總訂單數</KPILabel>
              <KPIChange positive>+8.3%</KPIChange>
            </KPICard>
            
            <KPICard>
              <KPIIcon>👥</KPIIcon>
              <KPIValue>1,234</KPIValue>
              <KPILabel>活躍會員</KPILabel>
              <KPIChange positive>+15.2%</KPIChange>
            </KPICard>
            
            <KPICard>
              <KPIIcon>💵</KPIIcon>
              <KPIValue>NT$2,705</KPIValue>
              <KPILabel>平均客單價</KPILabel>
              <KPIChange positive>+5.7%</KPIChange>
            </KPICard>
          </KPIGrid>
        </Section>

        {/* Sales Chart */}
        <Section>
          <SectionHeader>
            <Title>銷售趨勢</Title>
            <ChartControls>
              <ViewToggle options={['日', '週', '月', '年']} />
              <ExportButton />
            </ChartControls>
          </SectionHeader>
          
          <SalesChart>
            {/* Line chart showing revenue trends */}
          </SalesChart>
        </Section>

        {/* Recent Activities */}
        <Section>
          <SectionHeader>
            <Title>最近活動</Title>
            <ViewAllLink>查看全部</ViewAllLink>
          </SectionHeader>
          
          <ActivityFeed>
            {recentActivities.map(activity => (
              <ActivityItem key={activity.id}>
                <ActivityIcon type={activity.type} />
                <ActivityContent>
                  <ActivityMessage>{activity.message}</ActivityMessage>
                  <ActivityTime>{activity.timestamp}</ActivityTime>
                </ActivityContent>
              </ActivityItem>
            ))}
          </ActivityFeed>
        </Section>

        {/* Pending Tasks */}
        <Section>
          <SectionHeader>
            <Title>待處理事項</Title>
          </SectionHeader>
          
          <TasksList>
            <TaskCard priority="high">
              <TaskIcon>🚨</TaskIcon>
              <TaskInfo>
                <TaskTitle>庫存不足警告</TaskTitle>
                <TaskDescription>12支酒款庫存低於警戒值</TaskDescription>
              </TaskInfo>
              <TaskAction>
                <ActionButton>處理</ActionButton>
              </TaskAction>
            </TaskCard>
            
            <TaskCard priority="medium">
              <TaskIcon>📦</TaskIcon>
              <TaskInfo>
                <TaskTitle>待出貨訂單</TaskTitle>
                <TaskDescription>23筆訂單等待處理</TaskDescription>
              </TaskInfo>
              <TaskAction>
                <ActionButton>查看</ActionButton>
              </TaskAction>
            </TaskCard>
            
            <TaskCard priority="low">
              <TaskIcon>💬</TaskIcon>
              <TaskInfo>
                <TaskTitle>待回覆評論</TaskTitle>
                <TaskDescription>8則評論等待回覆</TaskDescription>
              </TaskInfo>
              <TaskAction>
                <ActionButton>回覆</ActionButton>
              </TaskAction>
            </TaskCard>
          </TasksList>
        </Section>
      </MainContent>
    </AdminLayout>
  );
};
```

---

## 六、實現路線圖

### 📅 Phase 1: 設計系統建立 (Week 1-2)

```
1. 建立 Design Tokens
   - 色彩系統
   - 字體系統
   - 間距系統
   - 動畫系統

2. 建立核心組件庫
   - Button
   - Input
   - Card
   - Modal
   - Navigation
   - Wine Card
   - Winery Card

3. 建立頁面模板
   - 首頁
   - 商品列表頁
   - 商品詳情頁
   - 購物車
   - 結帳頁
   - 會員中心

4. 設計審查與迭代
```

### 📅 Phase 2: 前端開發 (Week 3-6)

```
1. 建立 Next.js 14 專案架構
   - App Router
   - TypeScript
   - Tailwind CSS
   - Framer Motion

2. 實作核心頁面
   - 首頁 (Hero, Featured Wines, Wineries)
   - 商品列表 (Filters, Sort, Pagination)
   - 商品詳情 (Gallery, Details, Related)
   - 購物車 & 結帳

3. 實作會員系統前台
   - 註冊/登入
   - 個人中心
   - 訂單查詢
   - 願望清單

4. 實作 AI 聊天功能
   - Chat UI
   - Claude API 整合
   - 推薦系統整合

5. 效能優化
   - Image optimization
   - Code splitting
   - Lazy loading
   - Caching strategy
```

### 📅 Phase 3: 後端開發 (Week 7-10)

```
1. 資料庫設計
   - Supabase Schema
   - Relations
   - Indexes
   - Triggers

2. API 開發
   - Authentication
   - Product Management
   - Order Management
   - Member Management
   - Payment Integration

3. 管理後台開發
   - Admin Dashboard
   - Member Management
   - Order Management
   - Product Management
   - Analytics

4. AI 推薦引擎
   - Collaborative Filtering
   - Content-based Filtering
   - Hybrid Recommendation
```

### 📅 Phase 4: 整合測試 & 優化 (Week 11-12)

```
1. 功能測試
   - E2E Testing
   - Integration Testing
   - Unit Testing

2. 效能測試
   - Load Testing
   - Performance Monitoring
   - SEO Optimization

3. UX 測試
   - User Acceptance Testing
   - A/B Testing
   - Feedback Collection

4. 安全審查
   - Security Audit
   - Penetration Testing
   - Compliance Check
```

---

## 七、技術堆疊建議

```typescript
// Recommended Tech Stack

const techStack = {
  frontend: {
    framework: 'Next.js 14',
    language: 'TypeScript',
    styling: 'Tailwind CSS',
    animation: 'Framer Motion',
    forms: 'React Hook Form',
    validation: 'Zod',
    stateManagement: 'Zustand',
    api: 'tRPC',
  },
  
  backend: {
    database: 'Supabase (PostgreSQL)',
    authentication: 'Supabase Auth',
    storage: 'Supabase Storage',
    api: 'Next.js API Routes',
    orm: 'Prisma',
  },
  
  ai: {
    chatbot: 'Claude 4 (Anthropic)',
    recommendation: 'Custom ML Model + Claude',
    imageGeneration: 'Midjourney (for marketing assets)',
  },
  
  payment: {
    gateway: 'ECPay / NewebPay',
    subscription: 'Stripe (if international)',
  },
  
  analytics: {
    webAnalytics: 'Google Analytics 4',
    userBehavior: 'Hotjar',
    performance: 'Vercel Analytics',
  },
  
  deployment: {
    hosting: 'Vercel',
    cdn: 'Cloudflare',
    monitoring: 'Sentry',
  },
};
```

---

## 八、與 CURSOR 的協作方式

### 📝 A. 提供給 CURSOR 的完整 Prompt 模板

```
# ProWine 頂級葡萄酒電商開發指令

## 專案概述
開發一個羅浮宮畫展級別的精品葡萄酒電商平台，目標是獲得2026年國際設計大獎（WebAwards、Awwwards）。

## 設計標準
1. 極簡主義 + 奢華感
2. 完全沒有 AI 拼湊感
3. 視覺一致性 100%
4. Apple 級別的乾淨感
5. 精品酒莊的質感

## 技術規範
- Framework: Next.js 14 (App Router)
- Language: TypeScript (嚴格模式)
- Styling: Tailwind CSS
- Animation: Framer Motion
- Database: Supabase
- AI: Claude 4 API

## 設計系統
請參考附件中的完整設計系統：
- 色彩系統: prowine_colors.scss
- 字體系統: prowine_typography.scss
- 間距系統: prowine_spacing.scss
- 動畫系統: prowine_animations.scss

## 組件規範
請參考附件中的組件設計：
- Wine Card: wine_card_spec.tsx
- Winery Card: winery_card_spec.tsx
- Button: button_spec.tsx
- Input: input_spec.tsx

## 當前任務
[具體描述你要 CURSOR 完成的任務]

## 要求
1. 代碼必須乾淨、專業、可維護
2. 必須遵循設計系統規範
3. 必須有完整的 TypeScript 類型定義
4. 必須有適當的註解
5. 必須考慮效能優化
6. 必須考慮 SEO
7. 必須考慮無障礙設計

## 輸出格式
請提供：
1. 完整的代碼實現
2. 必要的說明文件
3. 測試建議
4. 效能優化建議
```

### 📝 B. 分階段開發建議

```
Phase 1: 設計系統
- 要求 CURSOR 建立完整的 Design System
- 建立 Storybook 來展示所有組件
- 確保所有組件符合設計規範

Phase 2: 核心頁面
- 一次開發一個頁面
- 每個頁面都要經過設計審查
- 確保頁面之間的一致性

Phase 3: 功能模組
- AI 聊天系統
- 會員系統
- 訂單系統
- 推薦系統

Phase 4: 整合優化
- 效能優化
- SEO 優化
- 測試覆蓋
- 文件完善
```

---

## 九、質量檢查清單

```markdown
### 設計質量檢查

- [ ] 色彩使用符合設計系統
- [ ] 字體大小、粗細符合規範
- [ ] 間距使用 8pt Grid System
- [ ] 動畫時間和緩動函數正確
- [ ] 響應式設計在所有斷點正常
- [ ] 深色模式支援（可選）
- [ ] 無障礙設計符合 WCAG 2.1 AA

### 代碼質量檢查

- [ ] TypeScript 類型定義完整
- [ ] 沒有 any 類型
- [ ] 沒有 console.log
- [ ] 沒有硬編碼的值
- [ ] 所有字串都已國際化
- [ ] 所有圖片都已優化
- [ ] 所有 API 調用都有錯誤處理
- [ ] 所有表單都有驗證

### 效能檢查

- [ ] Lighthouse 分數 > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total Blocking Time < 300ms
- [ ] Largest Contentful Paint < 2.5s

### SEO 檢查

- [ ] 所有頁面都有正確的 meta tags
- [ ] 所有圖片都有 alt text
- [ ] 使用語義化 HTML
- [ ] Sitemap.xml 正確
- [ ] Robots.txt 正確
- [ ] Schema.org 標記正確

### 功能檢查

- [ ] 所有連結都正常工作
- [ ] 所有表單都正常提交
- [ ] 所有動畫流暢無卡頓
- [ ] 購物車功能完整
- [ ] 結帳流程順暢
- [ ] 會員系統功能完整
- [ ] AI 聊天功能正常
- [ ] 推薦系統準確

### 安全檢查

- [ ] 使用 HTTPS
- [ ] XSS 防護
- [ ] CSRF 防護
- [ ] SQL Injection 防護
- [ ] Rate Limiting
- [ ] Input Sanitization
- [ ] Secure Headers
```

---

## 十、預期成果

### 🎯 設計成果
1. 完全統一的視覺語言
2. 羅浮宮級別的精緻度
3. 零 AI 拼湊痕跡
4. Apple 級別的乾淨感
5. 精品酒莊的奢華質感

### 📈 商業成果
1. 年業績提升 50%
2. 轉換率提升 30%
3. 客單價提升 25%
4. 會員留存率提升 40%
5. 品牌認知度大幅提升

### 🏆 獲獎潛力
1. WebAwards Best Beverage Website
2. Awwwards Site of the Day
3. CSS Design Awards
4. Webby Awards
5. FWA Site of the Day

---

## 結語

這份文件提供了完整的頂級葡萄酒電商設計規範。

關鍵成功因素：
1. **堅持設計系統** - 絕不妥協
2. **注重細節** - 每個像素都重要
3. **保持一致性** - 從頭到尾
4. **追求卓越** - 不接受「還可以」
5. **持續優化** - 永無止境

記住：我們不是在做一個「還不錯」的網站，我們是在打造一個可以獲得國際設計大獎的藝術品。

每一個決定都要問自己：
- 這夠精緻嗎？
- 這夠高級嗎？
- 這夠一致嗎？
- 這會讓人驚艷嗎？
- 這配得上羅浮宮嗎？

如果答案不是肯定的，那就繼續優化。

---

**文件版本**: 1.0
**最後更新**: 2025-11-26
**作者**: Claude (for ProWine Project)
```
