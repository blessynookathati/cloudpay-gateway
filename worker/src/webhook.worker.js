const Queue = require("bull");
const axios = require("axios");
const crypto = require("crypto");
const db = require("./db");
const { v4: uuid } = require("uuid");

const redis = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
};

const webhookQueue = new Queue("webhooks", { redis });

const PROD_DELAYS = [0, 60, 300, 1800, 7200]; // seconds
const TEST_DELAYS = [0, 5, 10, 20, 30];      // seconds

const delays =
  process.env.WEBHOOK_MODE === "test"
    ? TEST_DELAYS
    : PROD_DELAYS;

webhookQueue.process(async job => {
  const { event, payload, merchant } = job.data;
  const attempt = job.attemptsMade;
  const logId = uuid();

  const signature = crypto
    .createHmac("sha256", merchant.webhook_secret)
    .update(JSON.stringify(payload))
    .digest("hex");

  try {
    await axios.post(merchant.webhook_url, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature
      }
    });

    await db.query(
      `INSERT INTO webhook_logs
       (id, merchant_id, event, payload, status, attempts)
       VALUES ($1,$2,$3,$4,'success',$5)`,
      [logId, merchant.id, event, payload, attempt + 1]
    );

  } catch (err) {
    const delay = delays[attempt + 1];

    if (!delay) {
      await db.query(
        `INSERT INTO webhook_logs
         (id, merchant_id, event, payload, status, attempts, last_error)
         VALUES ($1,$2,$3,$4,'failed',$5,$6)`,
        [logId, merchant.id, event, payload, attempt + 1, err.message]
      );
      return;
    }

    await db.query(
      `INSERT INTO webhook_logs
       (id, merchant_id, event, payload, status, attempts, next_retry_at, last_error)
       VALUES ($1,$2,$3,$4,'retrying',$5, now() + interval '${delay} seconds', $6)`,
      [logId, merchant.id, event, payload, attempt + 1, err.message]
    );

    throw err;
  }
});
