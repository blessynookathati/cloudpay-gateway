require("dotenv").config();
require("./workers");
require("./webhook.worker");
require("./refund.worker");

console.log("CloudPay worker running");
