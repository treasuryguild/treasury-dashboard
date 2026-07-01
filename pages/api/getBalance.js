import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const wallet = req.body.wallet;
    const url = "https://api.koios.rest/api/v1/address_info";
    const data = {
      _addresses: [wallet],
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.KOIOS_API_KEY}`
        },
      });
      res.status(200).json(response.data);
    } catch (error) {
      console.error("Failed to fetch Koios address balance:", error.message);
      res.status(200).json([{ balance: "0" }]);
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
