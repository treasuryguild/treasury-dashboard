import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const transformedArray = req.body.transformedArray;
    const url = "https://api.koios.rest/api/v1/asset_info?select=fingerprint,asset_name_ascii,total_supply,token_registry_metadata";
    const data = {     
      _asset_list: transformedArray,
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
      res.status(500).json({ message: error.message });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}
