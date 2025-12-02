/**
 * 郵件通知工具函數
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

/**
 * 發送郵件通知
 */
export async function sendEmailNotification(options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch("/api/admin/notifications/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        from: options.from || process.env.SMTP_FROM || "noreply@prowine.com.tw",
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send email notification:", error);
    return false;
  }
}

/**
 * 發送詢價單通知郵件
 */
export async function sendInquiryNotification(
  inquiryId: string,
  customerEmail: string,
  customerName: string,
  wineName: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B2635; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #8B2635; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ProWine 詢價通知</h1>
        </div>
        <div class="content">
          <p>親愛的 ${customerName}，</p>
          <p>感謝您對 ${wineName} 的詢價。我們已收到您的詢價單，將盡快為您處理。</p>
          <p>詢價單編號：${inquiryId}</p>
          <p>我們將在24小時內與您聯繫。</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/inquiries/${inquiryId}" class="button">查看詢價單</a>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailNotification({
    to: customerEmail,
    subject: `ProWine 詢價確認 - ${wineName}`,
    html,
  });
}

/**
 * 發送詢價單回覆通知郵件
 */
export async function sendInquiryResponseNotification(
  inquiryId: string,
  customerEmail: string,
  customerName: string,
  response: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B2635; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .response { background: white; padding: 15px; border-left: 4px solid #8B2635; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>ProWine 詢價回覆</h1>
        </div>
        <div class="content">
          <p>親愛的 ${customerName}，</p>
          <p>我們已回覆您的詢價單：</p>
          <div class="response">
            ${response.replace(/\n/g, "<br>")}
          </div>
          <p>如有任何問題，歡迎隨時聯繫我們。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmailNotification({
    to: customerEmail,
    subject: "ProWine 詢價回覆",
    html,
  });
}

