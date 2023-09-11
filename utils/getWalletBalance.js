import axios from 'axios';

export async function getWalletBalance(wallet) {
    let balance;

    async function getBalance() {
      try {
        const response = await axios.get(`https://pool.pm/wallet/${wallet}`);
        balance = response.data; 
      } catch (error) {
        if (error.response) {
          console.log("error", error.response.data);
        } else {
          console.error('Unknown error: ', error.message);
        }
      }
    }

    await getBalance();

    return balance;
}
