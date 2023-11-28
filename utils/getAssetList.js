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
    const response = await axios.post('/api/getBalance', { wallet });
    return response.data;
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
      return response.data;
  }

    let balance = await getBalance();
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