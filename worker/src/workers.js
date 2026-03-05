const Queue = require("bull");
const db = require("./db");

const redis = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
};

const paymentQueue = new Queue("payments", { redis });
const webhookQueue = new Queue("webhooks", { redis });
const refundQueue = new Queue("refunds", { redis });

paymentQueue.process(async job => {

  try {

    await new Promise(resolve => setTimeout(resolve, 5000));

    const success = Math.random() < 0.9;
    const status = success ? "success" : "failed";

    const result = await db.query(
      "UPDATE payments SET status=$1 WHERE id=$2 RETURNING *",
      [status, job.data.paymentId]
    );

    if (!result.rows.length) return;

    const payment = result.rows[0];

    await webhookQueue.add({
      merchant_id: payment.merchant_id,
      event_type: `payment.${status}`,
      payload: payment
    });

  } catch (err) {

    console.error("Payment worker error:", err);

  }

});

module.exports = {
  paymentQueue,
  webhookQueue,
  refundQueue
};