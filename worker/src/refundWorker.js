const db = require("./db");
const { refundQueue, webhookQueue } = require("./workers");

refundQueue.process(async job => {

  try {

    const { refundId } = job.data;

    const refund = await db.query(
      "SELECT * FROM refunds WHERE id=$1",
      [refundId]
    );

    if (!refund.rows.length) return;

    const data = refund.rows[0];

    await new Promise(resolve => setTimeout(resolve, 4000));

    await db.query(
      "UPDATE refunds SET status='processed', processed_at=NOW() WHERE id=$1",
      [refundId]
    );

    await webhookQueue.add({
      merchant_id: data.merchant_id,
      event_type: "refund.processed",
      payload: data
    });

  } catch (err) {

    console.error("Refund worker error:", err);

  }

});