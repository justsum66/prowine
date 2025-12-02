/**
 * 從 prowine.com.tw 爬取聯絡資訊
 */

async function fetchContactInfo() {
  try {
    // 使用 fetch 獲取網頁內容
    const response = await fetch("http://prowine.com.tw", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // 簡單的正則表達式提取聯絡資訊
    // 電話
    const phoneMatch = html.match(/(\+?886-?2-?\d{7,8}|\d{2,3}-?\d{7,8})/);
    const phone = phoneMatch ? phoneMatch[0] : null;

    // Email
    const emailMatch = html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const email = emailMatch ? emailMatch[0] : null;

    // 地址（尋找包含「新北市」或「台北市」的地址）
    const addressMatch = html.match(/(新北市|台北市)[^<>\n]{10,50}/);
    const address = addressMatch ? addressMatch[0] : null;

    console.log("爬取的聯絡資訊：");
    console.log("電話:", phone);
    console.log("Email:", email);
    console.log("地址:", address);

    return { phone, email, address };
  } catch (error) {
    console.error("爬取失敗:", error);
    return null;
  }
}

// 執行
if (require.main === module) {
  fetchContactInfo();
}

export { fetchContactInfo };

