export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, planKey } = req.body;
  if (!amount || !planKey) return res.status(400).json({ error: 'Missing fields' });

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(key_id + ':' + key_secret)
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt: `rcpt_${planKey}_${Date.now()}`
      })
    });
    const order = await response.json();
    if (order.error) return res.status(500).json({ error: order.error.description });
    return res.status(200).json({ orderId: order.id, amount: order.amount, keyId: key_id });
  } catch (e) {
    return res.status(500).json({ error: 'Order creation failed' });
  }
}
