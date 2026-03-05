class PaymentGateway {

  constructor({key, orderId}) {
    this.key = key
    this.orderId = orderId
  }

  open(){

    const modal = document.createElement("div")
    modal.id="payment-modal"

    modal.innerHTML = `
      <div style="background:white;padding:20px;border-radius:10px">
        <h2>Secure Payment</h2>
        <button id="payBtn">Pay Now</button>
        <button id="closeBtn">Close</button>
      </div>
    `

    document.body.appendChild(modal)

    document.getElementById("closeBtn").onclick=()=>{
      modal.remove()
    }

    document.getElementById("payBtn").onclick=()=>{
      alert("Payment processing...")
    }
  }
}

window.PaymentGateway = PaymentGateway