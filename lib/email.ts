import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

/**
 * 發送郵件
 */
export async function sendEmail(options: SendEmailOptions) {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    // Q21優化：定義類型接口，消除any
    interface EmailPayload {
      from: string;
      to: string[];
      subject: string;
      html: string;
      replyTo?: string;
      cc?: string[];
      bcc?: string[];
    }
    
    const emailPayload: EmailPayload = {
      from: options.from || "ProWine <noreply@prowine.com.tw>",
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    };

    // Resend API 參數
    if (options.replyTo) {
      emailPayload.replyTo = options.replyTo;
    }
    if (options.cc) {
      emailPayload.cc = options.cc;
    }
    if (options.bcc) {
      emailPayload.bcc = options.bcc;
    }

    const result = await resend.emails.send(emailPayload);

    return {
      success: true,
      id: result.data?.id,
    };
  } catch (error) {
    // Q22優化：使用logger替代console.error（但這裡是lib層，可能需要保持console或傳入logger）
    // Q21優化：消除any類型
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to send email: ${errorMessage}`);
  }
}

/**
 * 發送聯絡表單通知郵件給客服
 */
export async function sendContactNotification(data: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #8B4513; }
          .value { margin-top: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>新的聯絡表單提交</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">姓名：</div>
              <div class="value">${data.name}</div>
            </div>
            <div class="field">
              <div class="label">電子郵件：</div>
              <div class="value">${data.email}</div>
            </div>
            <div class="field">
              <div class="label">電話：</div>
              <div class="value">${data.phone}</div>
            </div>
            <div class="field">
              <div class="label">主旨：</div>
              <div class="value">${data.subject}</div>
            </div>
            <div class="field">
              <div class="label">訊息內容：</div>
              <div class="value" style="white-space: pre-wrap;">${data.message}</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: process.env.CONTACT_EMAIL || "service@prowine.com.tw",
    subject: `[ProWine] 新的聯絡表單：${data.subject}`,
    html,
    replyTo: data.email,
  });
}

/**
 * 發送聯絡表單確認郵件給客戶
 */
export async function sendContactConfirmation(data: {
  name: string;
  email: string;
  subject: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>感謝您的聯繫</h1>
          </div>
          <div class="content">
            <p>親愛的 ${data.name}，</p>
            <p>我們已收到您關於「${data.subject}」的訊息，我們的客服團隊將在 24 小時內與您聯繫。</p>
            <p>如有任何緊急問題，請直接聯繫我們：</p>
            <ul>
              <li>電話：02-27329490</li>
              <li>LINE@：@415znht</li>
              <li>Email：service@prowine.com.tw</li>
            </ul>
            <p>感謝您選擇 ProWine！</p>
            <p>ProWine 酩陽實業團隊</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.email,
    subject: `[ProWine] 我們已收到您的訊息`,
    html,
  });
}

/**
 * 發送退換貨申請通知郵件給客服
 */
export async function sendReturnNotification(data: {
  orderNumber: string;
  reason: string;
  type: "return" | "exchange";
  customerEmail: string;
  customerName?: string;
  exchangeProductId?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #8B4513; }
          .value { margin-top: 5px; }
          .badge { display: inline-block; padding: 5px 10px; border-radius: 5px; color: white; }
          .badge-return { background: #dc2626; }
          .badge-exchange { background: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>新的退換貨申請</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">訂單編號：</div>
              <div class="value">${data.orderNumber}</div>
            </div>
            <div class="field">
              <div class="label">申請類型：</div>
              <div class="value">
                <span class="badge badge-${data.type}">
                  ${data.type === "return" ? "退貨" : "換貨"}
                </span>
              </div>
            </div>
            ${data.customerName ? `
            <div class="field">
              <div class="label">客戶姓名：</div>
              <div class="value">${data.customerName}</div>
            </div>
            ` : ""}
            <div class="field">
              <div class="label">客戶 Email：</div>
              <div class="value">${data.customerEmail}</div>
            </div>
            ${data.exchangeProductId ? `
            <div class="field">
              <div class="label">換貨商品 ID：</div>
              <div class="value">${data.exchangeProductId}</div>
            </div>
            ` : ""}
            <div class="field">
              <div class="label">退換貨原因：</div>
              <div class="value" style="white-space: pre-wrap;">${data.reason}</div>
            </div>
            <div class="field" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p><strong>請盡快處理此申請，並聯繫客戶確認後續流程。</strong></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: process.env.CONTACT_EMAIL || "service@prowine.com.tw",
    subject: `[ProWine] 新的退換貨申請 - 訂單 ${data.orderNumber}`,
    html,
    replyTo: data.customerEmail,
  });
}

/**
 * 發送退換貨申請確認郵件給客戶
 */
export async function sendReturnConfirmation(data: {
  email: string;
  name?: string;
  orderNumber: string;
  applicationId: string;
  type: "return" | "exchange";
}) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin-top: 20px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #8B4513; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>退換貨申請已提交</h1>
          </div>
          <div class="content">
            <p>${data.name ? `親愛的 ${data.name}，` : "親愛的客戶，"}</p>
            <p>我們已收到您的${data.type === "return" ? "退貨" : "換貨"}申請，申請編號為：<strong>${data.applicationId}</strong></p>
            
            <div class="info-box">
              <p><strong>訂單編號：</strong>${data.orderNumber}</p>
              <p><strong>申請類型：</strong>${data.type === "return" ? "退貨" : "換貨"}</p>
              <p><strong>申請編號：</strong>${data.applicationId}</p>
            </div>

            <p>我們的客服團隊將在 24 小時內與您聯繫，確認後續處理流程。</p>
            
            <p>您也可以透過以下方式聯繫我們：</p>
            <ul>
              <li>電話：02-27329490</li>
              <li>LINE@：@415znht</li>
              <li>Email：service@prowine.com.tw</li>
            </ul>

            <p>感謝您選擇 ProWine！</p>
            <p>ProWine 酩陽實業團隊</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: data.email,
    subject: `[ProWine] 退換貨申請已提交 - ${data.applicationId}`,
    html,
  });
}

