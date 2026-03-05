require("dotenv").config();

require("./workers");
require("./refundWorker");
require("./webhookWorker");

console.log("CloudPay worker running");