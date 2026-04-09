export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { reviewText, platform, restaurantName, rating } = req.body;
  if (!reviewText) return res.status(400).json({ error: 'Missing reviewText' });

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) return res.status(500).json({ error: 'Gemini key not configured' });

  const prompt = `You are a polite restaurant manager responding to a customer review for "${restaurantName || 'our restaurant'}" on ${platform || 'a food platform'}.
Customer review: "${reviewText}"${rating ? `\nRating: ${rating}/5` : ''}

Write a warm, professional reply in 2-3 sentences. If negative, apologize genuinely. If positive, express gratitude and invite them back. Max 1 emoji. No quotes. Just the reply.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 200 }
        })
      }
    );
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: 'Gemini request failed' });
  }
}
