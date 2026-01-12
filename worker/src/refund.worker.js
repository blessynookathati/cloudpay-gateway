const Queue = require("bull");
const db = require("./db");

const redis = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
};

const refundQueue = new Queue("refunds", { redis });
const webhookQueue = new Queue("webhooks", { redis });

refundQueue.process(async job => {
  await new Promise(r => setTimeout(r, 4000));

  await db.query(
    "UPDATE refunds SET status='processed', processed_at=now() WHERE id=$1",
    [job.data.refundId]
  );

  await webhookQueue.add({
    event: "refund.processed",
    refundId: job.data.refundId
  });
});
