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
        tokenType: tokenType
    };
  });
}

export async function getAssetList(wallet) {
    
    async function getBalance() {
        const url = "https://api.koios.rest/api/v0/address_info?select=balance";
        const data = {
          _addresses: [wallet],
        };
    
        const response = await axios.post(url, data, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        return response.data;
    }

    async function getList() {
      const url = "https://api.koios.rest/api/v0/address_assets";
      const data = {
        _addresses: [wallet],
      };
  
      const response = await axios.post(url, data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    }

    function transformArray(assetList) {
        return assetList.map(asset => [asset.policy_id, asset.asset_name]);
    }

    async function getAssetDetails(transformedArray) {
        const url = "https://api.koios.rest/api/v0/asset_info?select=fingerprint,asset_name_ascii,total_supply,token_registry_metadata";
        const data = {     
          _asset_list: transformedArray,
        };
    
        const response = await axios.post(url, data, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        //console.log(response.data)
        return response.data;
    }

    let balance = await getBalance();
    let list = await getList();
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
        tokenType: "fungible"  
      };
      // Return an array that contains only the ADA item
      return [adaItem];
    }
    //console.log(list);
    let transformedArray = transformArray(list[0].asset_list);
    let assetDetails = await getAssetDetails(transformedArray);
    let mappedAssetData = mapAssetData(assetDetails, list[0].asset_list);

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
      tokenType: "fungible"  
    };
    
    // Add ADA item to the start of the array
    mappedAssetData.unshift(adaItem);
    
    // Adjust the id for other items
    for (let i = 1; i < mappedAssetData.length; i++) {
      mappedAssetData[i].id = String(i + 1);
    }

    return mappedAssetData;
}