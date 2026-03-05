const axios = require("axios");
const crypto = require("crypto");
const db = require("./db");
const { webhookQueue } = require("./workers");

webhookQueue.process(async job => {

  try {

    const { merchant_id, event_type, payload } = job.data;

    const merchant = await db.query(
      "SELECT webhook_url, webhook_secret FROM merchants WHERE id=$1",
      [merchant_id]
    );

    if (!merchant.rows.length) return;

    const { webhook_url, webhook_secret } = merchant.rows[0];

    const body = JSON.stringify(payload);

    const signature = crypto
      .createHmac("sha256", webhook_secret)
      .update(body)
      .digest("hex");

    const response = await axios.post(webhook_url, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature
      }
    });

    await db.query(
      "INSERT INTO webhook_logs (merchant_id,event_type,response_code,response_body,status) VALUES ($1,$2,$3,$4,$5)",
      [merchant_id, event_type, response.status, JSON.stringify(response.data), "success"]
    );

  } catch (err) {

    console.error("Webhook delivery failed:", err);

  }

});