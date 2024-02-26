import axios from "axios";

function isValidKey(key) {
  if (typeof key !== 'string') return false;
  if (key.length > 40) return false;
  // Start with a letter, not contain any special characters or spaces
  return /^[A-Za-z][A-Za-z0-9]*$/.test(key);
}

function mapAssetData(assetDetails, assetList) {
  return assetDetails.map((asset, index) => {
    const matchingAsset = assetList.find(listAsset => listAsset.fingerprint === asset.fingerprint);
    const tokenType = Number(asset.total_supply) > 1 ? 'fungible' : 'nft';
    let name;
    let displayname;
    //console.log("asset", asset)
    if (tokenType === 'nft') {
      const nameAscii = asset.asset_name_ascii;
      name = nameAscii;
      //name = asset.fingerprint;
      if (isValidKey(nameAscii)) {
        displayname = nameAscii;
      } else {
        displayname = asset.fingerprint;
      }
    } else {
      displayname = asset.token_registry_metadata && asset.token_registry_metadata.ticker
        ? asset.token_registry_metadata.ticker
        : (asset.token_registry_metadata && asset.token_registry_metadata.name ? asset.token_registry_metadata.name : asset.asset_name_ascii);
      name = displayname
    }

    const decimals = asset.token_registry_metadata && asset.token_registry_metadata.decimals
      ? asset.token_registry_metadata.decimals
      : null;
    return {
      id: String(index + 1),
      name: name,
      displayname: displayname,
      amount: (Number(matchingAsset.quantity) / Math.pow(10, decimals)).toFixed(decimals),
      unit: `${matchingAsset.policy_id}${matchingAsset.asset_name}`,
      fingerprint: asset.fingerprint,
      decimals: decimals,
      tokenType: tokenType,
      policy_id: matchingAsset.policy_id
    };
  });
}

export async function getAssetList(wallet) {

  async function getBalance() {
    let stake_address = "";
    let results = [];
    try {
      const response = await axios.post('/api/getBalance', { wallet });
      //console.log("Balance response:", response);
      // Check if the response is in the expected format
      if (Array.isArray(response.data) && response.data.length > 0) {
        // Extract stake_address if available
        if ('stake_address' in response.data[0]) {
          stake_address = response.data[0].stake_address;
        } else {
          console.error('Stake address not found in response');
          stake_address = ""; // Handle as appropriate, maybe set to a default or error state
        }
        // Check if balance is zero and stake_address is available
        if (response.data[0].balance == "0" && stake_address !== "") {
          //console.log("Balance is zero, attempting to fetch account balance using stake_address");
          try {
            const accountBalanceResponse = await axios.post('/api/getAccountBalance', { stake_address });
            //console.log("Account Balance response:", accountBalanceResponse);
            results = accountBalanceResponse.data;
            // Assuming the API response structure aligns with your needs, adjust as necessary
            if (Array.isArray(results) && results.length > 0) {
              results[0].balance = results[0].total_balance;
              return results;
            } else {
              //console.log('No account balance data found, returning default zero balance.');
              return [{ balance: "0" }];
            }
          } catch (accountBalanceError) {
            console.error('Failed to fetch account balance:', accountBalanceError);
            return [{ balance: "0" }]; // Handle the error by returning a default zero balance
          }
        } else {
          // If balance is not zero, or no stake_address is found, return the original response data
          return response.data;
        }
      } else {
        //console.log('No balance data found for wallet, returning default zero balance.');
        return [{ balance: "0" }]; // Return a default object indicating zero balance for unexpected format or empty data
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      return [{ balance: "0" }]; // Return a default object indicating zero balance on error
    }
  }

  async function getList() {
    const response = await axios.post('/api/getList', { wallet });
    //console.log("getList response:", response.data);
    return response.data;
  }


  function transformArray(assetList) {
    // Directly mapping over the provided array
    return assetList.map(asset => [asset.policy_id, asset.asset_name]);
  }


  async function getAssetDetails(transformedArray) {
    const response = await axios.post('/api/getAssetDetails', { transformedArray });
    console.log("response", response)
    return response.data;
  }

  let balance = await getBalance();
  // After error checking
  if (!Array.isArray(balance) || balance.length === 0 || !balance[0].hasOwnProperty('balance')) {
    balance = [{ balance: "0" }]; // Setting a default value to proceed safely
  }

  let list = await getList();
  //console.log("List:", list);
  if (list.length === 0) {
    // The list is empty.
    // Create ADA item
    const adaItem = {
      id: "1",  // make ADA always the first item
      name: "ADA",
      displayname: "ADA",
      amount: (Number(balance[0].balance) / Math.pow(10, 6)).toFixed(6),
      unit: "lovelace",
      fingerprint: "",
      decimals: 6,
      tokenType: "fungible",
      policy_id: ""
    };
    // Return an array that contains only the ADA item
    return [adaItem];
  }
  //console.log(list);
  let transformedArray = [];
  if (list && Array.isArray(list)) {
    transformedArray = transformArray(list);
  } else {
    // Handle case where list[0].asset_list is not an array
    console.error('Asset list is not an array or is undefined');
  }
  let assetDetails = await getAssetDetails(transformedArray);
  let mappedAssetData = mapAssetData(assetDetails, list);
  // Sort the array so that 'nft' items are at the end
  mappedAssetData.sort((a, b) => (a.tokenType === 'nft') - (b.tokenType === 'nft'));

  // Create ADA item
  const adaItem = {
    id: "1",  // make ADA always the first item
    name: "ADA",
    displayname: "ADA",
    amount: (Number(balance[0].balance) / Math.pow(10, 6)).toFixed(6),
    unit: "lovelace",
    fingerprint: "",
    decimals: 6,
    tokenType: "fungible",
    policy_id: ""
  };

  // Add ADA item to the start of the array
  mappedAssetData.unshift(adaItem);

  // Adjust the id for other items
  for (let i = 1; i < mappedAssetData.length; i++) {
    mappedAssetData[i].id = String(i + 1);
  }
  //console.log("mappedAssetData", mappedAssetData)
  return mappedAssetData;
}