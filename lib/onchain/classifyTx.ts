import type {
  AddressAssetToken,
  ClassifyResult,
  ContractInfo,
  TokenTypeRow,
} from "./types";

type AddressAssets = Record<string, AddressAssetToken[]>;

function getAssetNameFromTTypes(
  fingerprint: string,
  tTypes: TokenTypeRow[]
): string {
  const typeEntry = tTypes.find((t) => t.fingerprint === fingerprint);
  return typeEntry ? typeEntry.asset_name : "Unknown";
}

function normalizeAssetName(name: string): { name: string; decimals?: number } {
  if (name.toLowerCase() === "gimbal") {
    return { name: "GMBL", decimals: 6 };
  }
  return { name };
}

/** Port of treasury-dapp getTxDetails helpers + classifiers */
const detailsHelpers = {
  isPlutusContractPresent: (txData: any) =>
    txData.plutus_contracts?.length > 0,
  hasCollateral: (txData: any) =>
    txData.collateral_inputs?.length > 0 && txData.collateral_output,
  findMatchingOutput: (outputs: any[], rewardAddress: string) =>
    outputs.find((output) => output.stake_addr === rewardAddress),
  hasAssetsMinted: (txData: any) => txData.assets_minted?.length > 0,
  hasNativeScriptMint: (txData: any) =>
    txData.native_scripts?.length > 0 && txData.assets_minted?.length > 0,
  hasTokensBurned: (txData: any) =>
    txData.assets_minted?.some((asset: any) => parseInt(asset.quantity, 10) < 0),

  processAssets: (
    output: any,
    assetIdCounter: number,
    tTypes: TokenTypeRow[],
    includeAda = true
  ) => {
    const assets: AddressAssetToken[] = [];
    if (includeAda) {
      const adaAmount = parseInt(output.value, 10) / 1000000;
      assets.push({
        amount: adaAmount.toFixed(6),
        decimals: 6,
        fingerprint: "",
        id: assetIdCounter.toString(),
        name: "ADA",
        unit: "lovelace",
      });
      assetIdCounter++;
    }

    if (output.asset_list?.length > 0) {
      output.asset_list.forEach((asset: any) => {
        let name = getAssetNameFromTTypes(asset.fingerprint, tTypes);
        let decimals = asset.decimals || 0;
        const normalized = normalizeAssetName(name);
        name = normalized.name;
        if (normalized.decimals != null) decimals = normalized.decimals;
        const amount = parseInt(asset.quantity, 10) / Math.pow(10, decimals);
        assets.push({
          amount: amount.toFixed(decimals),
          decimals,
          fingerprint: asset.fingerprint || "",
          id: assetIdCounter.toString(),
          name,
          unit: `${asset.policy_id}.${asset.asset_name}`,
        });
        assetIdCounter++;
      });
    }

    return { assets, assetIdCounter };
  },

  processNewlyMintedAssets: (
    output: any,
    assetsMinted: any[],
    tTypes: TokenTypeRow[],
    assetIdCounter: number
  ) => {
    const assets: AddressAssetToken[] = [];
    output.asset_list?.forEach((asset: any) => {
      const mintedAsset = assetsMinted.find(
        (minted: any) =>
          minted.policy_id === asset.policy_id &&
          minted.asset_name === asset.asset_name
      );
      if (mintedAsset) {
        const { assets: newAssets, assetIdCounter: newCounter } =
          detailsHelpers.processAssets(
            { asset_list: [asset] },
            assetIdCounter,
            tTypes,
            false
          );
        assets.push(...newAssets);
        assetIdCounter = newCounter;
      }
    });
    return { assets, assetIdCounter };
  },

  processBurnedAssets: (
    txData: any,
    tTypes: TokenTypeRow[],
    assetIdCounter: number
  ) => {
    const assets: AddressAssetToken[] = [];
    txData.assets_minted.forEach((asset: any) => {
      if (parseInt(asset.quantity, 10) < 0) {
        const { assets: newAssets, assetIdCounter: newCounter } =
          detailsHelpers.processAssets(
            {
              asset_list: [
                {
                  ...asset,
                  quantity: (-parseInt(asset.quantity, 10)).toString(),
                },
              ],
            },
            assetIdCounter,
            tTypes,
            false
          );
        assets.push(...newAssets);
        assetIdCounter = newCounter;
      }
    });
    return { assets, assetIdCounter };
  },

  processWithdrawal: (withdrawal: any, assetIdCounter: number) => {
    const withdrawalInAda = parseInt(withdrawal.amount, 10) / 1000000;
    return {
      withdrawnAda: {
        amount: withdrawalInAda.toFixed(6),
        decimals: 6,
        fingerprint: "",
        id: assetIdCounter.toString(),
        name: "ADA",
        unit: "lovelace",
      } as AddressAssetToken,
      newAssetIdCounter: assetIdCounter + 1,
    };
  },

  addAssetToAddressAssets: (
    addressAssets: AddressAssets,
    address: string,
    asset: AddressAssetToken
  ) => {
    if (addressAssets[address]) {
      addressAssets[address].push(asset);
    } else {
      addressAssets[address] = [asset];
    }
  },

  processWithdrawalsForAddress: (
    txData: any,
    rewardAddress: string,
    addressAssets: AddressAssets,
    assetIdCounter: number
  ) => {
    const withdrawal = txData.withdrawals?.find(
      (w: any) => w.stake_addr === rewardAddress
    );
    if (withdrawal) {
      const { withdrawnAda, newAssetIdCounter } = detailsHelpers.processWithdrawal(
        withdrawal,
        assetIdCounter
      );
      const matchingOutput = txData.outputs.find(
        (output: any) => output.stake_addr === rewardAddress
      );
      if (matchingOutput) {
        const receiveAddress = matchingOutput.payment_addr.bech32;
        detailsHelpers.addAssetToAddressAssets(
          addressAssets,
          receiveAddress,
          withdrawnAda
        );
        assetIdCounter = newAssetIdCounter;
      }
    }
    return { addressAssets, assetIdCounter };
  },
};

const detailTransactionTypes: Record<
  string,
  {
    name: string;
    identify: (txData: any, rewardAddress: string) => boolean;
    process: (
      txData: any,
      rewardAddress: string,
      tTypes: TokenTypeRow[],
      assetIdCounter?: number
    ) => { addressAssets: AddressAssets; assetIdCounter: number };
  }
> = {
  SMART_CONTRACT_MINT: {
    name: "Smart contract mint",
    identify: (txData, rewardAddress) =>
      detailsHelpers.isPlutusContractPresent(txData) &&
      detailsHelpers.hasCollateral(txData) &&
      detailsHelpers.hasAssetsMinted(txData) &&
      txData.inputs.some((input: any) => input.stake_addr === rewardAddress) &&
      !!detailsHelpers.findMatchingOutput(txData.outputs, rewardAddress),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets: AddressAssets = {};
      const matchingOutput = detailsHelpers.findMatchingOutput(
        txData.outputs,
        rewardAddress
      );
      if (matchingOutput) {
        const { assets, assetIdCounter: newAssetIdCounter } =
          detailsHelpers.processAssets(matchingOutput, assetIdCounter, tTypes, false);
        if (assets.length > 0) {
          addressAssets[matchingOutput.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      }
      txData.outputs.forEach((output: any) => {
        if (output.stake_addr !== rewardAddress) {
          const { assets, assetIdCounter: newAssetIdCounter } =
            detailsHelpers.processAssets(output, assetIdCounter, tTypes);
          if (assets.length > 0) {
            addressAssets[output.payment_addr.bech32] = assets;
            assetIdCounter = newAssetIdCounter;
          }
        }
      });
      return detailsHelpers.processWithdrawalsForAddress(
        txData,
        rewardAddress,
        addressAssets,
        assetIdCounter
      );
    },
  },
  TOKEN_SWAP: {
    name: "Token swap request",
    identify: (txData, rewardAddress) => {
      const allInputsMatchRewardAddress = txData.inputs.every(
        (input: any) => input.stake_addr === rewardAddress
      );
      const swapOutput = txData.outputs.find(
        (output: any) =>
          output.datum_hash !== null &&
          (output.stake_addr === null || output.stake_addr !== rewardAddress)
      );
      const noVoteDelegation = !(txData.certificates || []).some(
        (cert: any) => cert.type === "vote_delegation"
      );
      return allInputsMatchRewardAddress && !!swapOutput && noVoteDelegation;
    },
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      const inputAddresses = new Set(
        txData.inputs.map((input: any) => input.payment_addr.bech32)
      );
      let addressAssets: AddressAssets = {};
      txData.outputs.forEach((output: any) => {
        if (!inputAddresses.has(output.payment_addr.bech32)) {
          const { assets, assetIdCounter: newAssetIdCounter } =
            detailsHelpers.processAssets(output, assetIdCounter, tTypes);
          addressAssets[output.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      });
      return detailsHelpers.processWithdrawalsForAddress(
        txData,
        rewardAddress,
        addressAssets,
        assetIdCounter
      );
    },
  },
  SMART_CONTRACT_TOKEN_RECEIPT: {
    name: "Smart contract token receipt",
    identify: (txData, rewardAddress) =>
      detailsHelpers.isPlutusContractPresent(txData) &&
      !!detailsHelpers.findMatchingOutput(txData.outputs, rewardAddress) &&
      detailsHelpers.hasCollateral(txData),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets: AddressAssets = {};
      const matchingOutput = detailsHelpers.findMatchingOutput(
        txData.outputs,
        rewardAddress
      );
      if (matchingOutput) {
        const { assets, assetIdCounter: newAssetIdCounter } =
          detailsHelpers.processAssets(matchingOutput, assetIdCounter, tTypes);
        addressAssets[matchingOutput.payment_addr.bech32] = assets;
        assetIdCounter = newAssetIdCounter;
      }
      return detailsHelpers.processWithdrawalsForAddress(
        txData,
        rewardAddress,
        addressAssets,
        assetIdCounter
      );
    },
  },
  MULTI_SEND: {
    name: "Multi-send",
    identify: (txData, rewardAddress) =>
      txData.inputs.every((input: any) => input.stake_addr === rewardAddress) &&
      txData.outputs.some((output: any) => output.stake_addr !== rewardAddress) &&
      !detailsHelpers.isPlutusContractPresent(txData) &&
      !detailsHelpers.hasCollateral(txData),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets: AddressAssets = {};
      txData.outputs.forEach((output: any) => {
        if (output.stake_addr !== rewardAddress) {
          const { assets, assetIdCounter: newAssetIdCounter } =
            detailsHelpers.processAssets(output, assetIdCounter, tTypes);
          addressAssets[output.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      });
      return detailsHelpers.processWithdrawalsForAddress(
        txData,
        rewardAddress,
        addressAssets,
        assetIdCounter
      );
    },
  },
  TOKEN_RECEIVE: {
    name: "Token receive",
    identify: (txData, rewardAddress) =>
      txData.inputs.every((input: any) => input.stake_addr !== rewardAddress) &&
      txData.outputs.some((output: any) => output.stake_addr === rewardAddress) &&
      !detailsHelpers.isPlutusContractPresent(txData) &&
      !detailsHelpers.hasCollateral(txData),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets: AddressAssets = {};
      const matchingOutput = detailsHelpers.findMatchingOutput(
        txData.outputs,
        rewardAddress
      );
      if (matchingOutput) {
        const { assets, assetIdCounter: newAssetIdCounter } =
          detailsHelpers.processAssets(matchingOutput, assetIdCounter, tTypes);
        addressAssets[matchingOutput.payment_addr.bech32] = assets;
        assetIdCounter = newAssetIdCounter;
      }
      return detailsHelpers.processWithdrawalsForAddress(
        txData,
        rewardAddress,
        addressAssets,
        assetIdCounter
      );
    },
  },
  NATIVE_SCRIPT_MINT: {
    name: "Native script mint",
    identify: (txData, rewardAddress) =>
      detailsHelpers.hasNativeScriptMint(txData) &&
      !detailsHelpers.isPlutusContractPresent(txData) &&
      !detailsHelpers.hasCollateral(txData) &&
      txData.inputs.some((input: any) => input.stake_addr === rewardAddress) &&
      !!detailsHelpers.findMatchingOutput(txData.outputs, rewardAddress),
    process: (txData, rewardAddress, tTypes, assetIdCounter = 1) => {
      let addressAssets: AddressAssets = {};
      const matchingOutputs = txData.outputs.filter(
        (output: any) => output.stake_addr === rewardAddress
      );
      matchingOutputs.forEach((output: any) => {
        const { assets, assetIdCounter: newAssetIdCounter } =
          detailsHelpers.processNewlyMintedAssets(
            output,
            txData.assets_minted,
            tTypes,
            assetIdCounter
          );
        if (assets.length > 0) {
          addressAssets[output.payment_addr.bech32] = assets;
          assetIdCounter = newAssetIdCounter;
        }
      });
      return { addressAssets, assetIdCounter };
    },
  },
  TOKEN_BURN: {
    name: "Token burn",
    identify: (txData, rewardAddress) =>
      detailsHelpers.hasTokensBurned(txData) &&
      txData.inputs.every((input: any) => input.stake_addr === rewardAddress) &&
      txData.outputs.every((output: any) => output.stake_addr === rewardAddress) &&
      !detailsHelpers.isPlutusContractPresent(txData) &&
      !detailsHelpers.hasCollateral(txData) &&
      !detailsHelpers.hasNativeScriptMint(txData),
    process: (txData, _rewardAddress, tTypes, assetIdCounter = 1) => {
      const { assets, assetIdCounter: newAssetIdCounter } =
        detailsHelpers.processBurnedAssets(txData, tTypes, assetIdCounter);
      const addressAssets =
        assets.length > 0
          ? { [txData.outputs[0].payment_addr.bech32]: assets }
          : {};
      return { addressAssets, assetIdCounter: newAssetIdCounter };
    },
  },
  DREP_REGISTRATION: {
    name: "DRep Registration",
    identify: (txData, rewardAddress) =>
      txData.certificates?.some((cert: any) => cert.type === "drep_registration") &&
      txData.deposit &&
      txData.outputs.some((output: any) => output.stake_addr === rewardAddress),
    process: (txData, rewardAddress, _tTypes, assetIdCounter = 1) => {
      let addressAssets: AddressAssets = {};
      const drepRegistrationOutput = txData.outputs.find(
        (output: any) => output.stake_addr === rewardAddress
      );
      if (drepRegistrationOutput && txData.deposit) {
        const depositInAda = parseInt(txData.deposit, 10) / 1000000;
        addressAssets[drepRegistrationOutput.payment_addr.bech32] = [
          {
            amount: depositInAda.toFixed(6),
            decimals: 6,
            fingerprint: "",
            id: assetIdCounter.toString(),
            name: "ADA",
            unit: "lovelace",
          },
        ];
        assetIdCounter++;
      }
      return { addressAssets, assetIdCounter };
    },
  },
  VOTE_DELEGATION: {
    name: "Vote Delegation",
    identify: (txData, rewardAddress) =>
      !!txData.certificates &&
      txData.certificates.some((cert: any) => cert.type === "vote_delegation") &&
      !!txData.withdrawals &&
      txData.withdrawals.some((w: any) => w.stake_addr === rewardAddress),
    process: (txData, rewardAddress, _tTypes, assetIdCounter = 1) => {
      let addressAssets: AddressAssets = {};
      return detailsHelpers.processWithdrawalsForAddress(
        txData,
        rewardAddress,
        addressAssets,
        assetIdCounter
      );
    },
  },
  STAKE_REWARD_WITHDRAWAL: {
    name: "Stake Reward Withdrawal",
    identify: (txData, rewardAddress) =>
      !!txData.withdrawals &&
      txData.withdrawals.length > 0 &&
      txData.withdrawals[0].stake_addr === rewardAddress &&
      (txData.certificates || []).length === 0 &&
      txData.inputs.length === 1 &&
      txData.outputs.length === 1 &&
      txData.inputs[0].stake_addr === txData.outputs[0].stake_addr &&
      txData.inputs[0].stake_addr === rewardAddress,
    process: (txData, rewardAddress, _tTypes, assetIdCounter = 1) => {
      let addressAssets: AddressAssets = {};
      return detailsHelpers.processWithdrawalsForAddress(
        txData,
        rewardAddress,
        addressAssets,
        assetIdCounter
      );
    },
  },
};

function classifyWithDetails(
  rewardAddress: string | null,
  txData: any,
  tTypes: TokenTypeRow[]
): ClassifyResult | null {
  if (!rewardAddress) return null;

  for (const handler of Object.values(detailTransactionTypes)) {
    try {
      if (handler.identify(txData, rewardAddress)) {
        const result = handler.process(txData, rewardAddress, tTypes, 1);
        return {
          addressAssets: result.addressAssets || {},
          transactionType: handler.name,
          rawType: handler.name,
        };
      }
    } catch {
      // fall through to next / getTxInfo
    }
  }
  return null;
}

/** Port of treasury-dapp getTxInfo for Incoming/Outgoing/Staking fallbacks */
function classifyWithTxInfo(
  usedAddresses: string[],
  txData: any,
  assets: any[],
  tTypes: TokenTypeRow[]
): ClassifyResult {
  const inputs = txData.inputs || [];
  const outputs = txData.outputs || [];
  const certificates = txData.certificates || [];
  const assets_minted = txData.assets_minted;

  let addressAssets: AddressAssets = {};
  let idCounter = 1;
  let transactionType = "";

  let isOutgoing = false;
  let isStaking = false;
  let isInternalTransfer = false;
  let isMinting = false;
  let isBurning = false;

  let totalInputValue = 0;
  let totalOutputValue = 0;
  let firstInputAddress: string | null = null;

  for (const input of inputs) {
    if (usedAddresses.includes(input.payment_addr.bech32)) {
      totalInputValue += parseFloat(input.value);
      if (!firstInputAddress) {
        firstInputAddress = input.payment_addr.bech32;
      }
      if (
        (inputs.length === 1 &&
          outputs.length === 1 &&
          inputs[0].payment_addr.bech32 === outputs[0].payment_addr.bech32) ||
        (txData.withdrawals && txData.withdrawals.length > 0)
      ) {
        isStaking = true;
      } else if (
        assets_minted?.length > 0 &&
        assets_minted.some((asset: any) => Number(asset.quantity) > 0)
      ) {
        isMinting = true;
      } else if (
        assets_minted?.length > 0 &&
        assets_minted.some((asset: any) => Number(asset.quantity) < 0)
      ) {
        isBurning = true;
      } else if (
        outputs.every((output: any) =>
          inputs.every((inp: any) => inp.stake_addr === output.stake_addr)
        )
      ) {
        isInternalTransfer = true;
        isStaking = true;
      }
      if (!isStaking && !isMinting && !isBurning) {
        isOutgoing = true;
      }
      break;
    }
  }

  if (outputs.length === 0 && totalInputValue === parseFloat(txData.fee)) {
    transactionType = "Wallet Emptied";
    if (firstInputAddress) {
      addressAssets[firstInputAddress] = [
        {
          id: idCounter.toString(),
          name: "ADA",
          amount: -totalInputValue,
          unit: "lovelace",
          fingerprint: "",
          decimals: 6,
        },
      ];
      idCounter++;
    }
  } else if (isStaking) {
    let adaAmount = 0;
    if (txData.withdrawals && txData.withdrawals.length > 0) {
      transactionType = "Rewards Withdrawal";
      adaAmount = parseFloat(txData.withdrawals[0].amount);
      if (firstInputAddress) {
        if (!addressAssets[firstInputAddress]) addressAssets[firstInputAddress] = [];
        addressAssets[firstInputAddress].push({
          id: idCounter.toString(),
          name: "ADA",
          amount: adaAmount,
          unit: "lovelace",
          fingerprint: "",
          decimals: 6,
        });
        idCounter++;
      }
    } else {
      transactionType = "Staking";
      for (const output of outputs) {
        if (usedAddresses.includes(output.payment_addr.bech32)) {
          totalOutputValue += parseFloat(output.value);
          let difference = 0.0;
          if (
            isInternalTransfer &&
            !(
              certificates.length > 0 &&
              certificates[0]?.type === "delegation"
            )
          ) {
            transactionType = "Internal Transfer";
            difference = parseFloat(txData.fee);
          } else if (
            isInternalTransfer &&
            certificates.length > 0 &&
            certificates[0]?.type === "delegation"
          ) {
            transactionType = "Staking";
            difference = parseFloat(txData.fee);
          } else {
            difference =
              totalInputValue - totalOutputValue - parseFloat(txData.fee);
          }
          if (difference !== 0) adaAmount = difference;
          if (!addressAssets[output.payment_addr.bech32]) {
            addressAssets[output.payment_addr.bech32] = [];
          }
          addressAssets[output.payment_addr.bech32].push({
            id: idCounter.toString(),
            name: "ADA",
            amount: adaAmount,
            unit: "lovelace",
            fingerprint: "",
            decimals: 6,
          });
          idCounter++;
        }
        if (isInternalTransfer) break;
      }
    }
  } else if (isMinting || isBurning) {
    transactionType = isMinting ? "Minting" : "Burning";
    let mintInputValue = 0;
    let mintOutputValue = 0;
    for (const input of inputs) {
      if (usedAddresses.includes(input.payment_addr.bech32)) {
        mintInputValue += parseFloat(input.value);
      }
    }
    for (const output of outputs) {
      mintOutputValue += parseFloat(output.value);
    }
    const outgoingAdaAmount = mintInputValue - mintOutputValue;
    for (const output of outputs) {
      if (usedAddresses.includes(output.payment_addr.bech32)) {
        const ada: AddressAssetToken = {
          id: idCounter.toString(),
          name: "ADA",
          amount: Number(0 - outgoingAdaAmount),
          unit: "lovelace",
          fingerprint: "",
          decimals: 6,
        };
        idCounter++;
        addressAssets[output.payment_addr.bech32] = [ada];
        break;
      }
    }
    if (txData.assets_minted?.length > 0) {
      const mintedAddress = Object.keys(addressAssets)[0];
      if (mintedAddress) {
        const assetList = txData.assets_minted.map((assetItem: any) => {
          let assetName: string;
          const assetFoundInAssets = assets.find(
            (a: any) => a.fingerprint === assetItem.fingerprint
          );
          if (
            assetFoundInAssets &&
            (assetFoundInAssets.assetName || assetFoundInAssets.name)
          ) {
            assetName =
              assetFoundInAssets.assetName || assetFoundInAssets.name;
          } else {
            assetName = getAssetNameFromTTypes(assetItem.fingerprint, tTypes);
          }
          let decimals = assetItem.decimals || 0;
          const normalized = normalizeAssetName(assetName);
          assetName = normalized.name;
          if (normalized.decimals != null) decimals = normalized.decimals;
          const mapped = {
            id: idCounter.toString(),
            name: assetName,
            amount: parseFloat(assetItem.quantity),
            unit: assetItem.unit || "",
            fingerprint: assetItem.fingerprint || "",
            decimals,
          };
          idCounter++;
          return mapped;
        });
        addressAssets[mintedAddress].push(...assetList);
      }
    }
  } else if (isOutgoing) {
    transactionType = "Outgoing";
    for (const output of outputs) {
      if (!usedAddresses.includes(output.payment_addr.bech32)) {
        const assetList = (output.asset_list || []).map((assetItem: any) => {
          let assetName: string;
          const assetFoundInAssets = assets.find(
            (a: any) => a.fingerprint === assetItem.fingerprint
          );
          if (
            assetFoundInAssets &&
            (assetFoundInAssets.assetName || assetFoundInAssets.name)
          ) {
            assetName =
              assetFoundInAssets.assetName || assetFoundInAssets.name;
          } else {
            assetName = getAssetNameFromTTypes(assetItem.fingerprint, tTypes);
          }
          let decimals = assetItem.decimals || 0;
          const normalized = normalizeAssetName(assetName);
          assetName = normalized.name;
          if (normalized.decimals != null) decimals = normalized.decimals;
          const mapped = {
            id: idCounter.toString(),
            name: assetName,
            amount: parseFloat(assetItem.quantity),
            unit: assetItem.unit || "",
            fingerprint: assetItem.fingerprint || "",
            decimals,
          };
          idCounter++;
          return mapped;
        });
        assetList.push({
          id: idCounter.toString(),
          name: "ADA",
          amount: parseFloat(output.value),
          unit: "lovelace",
          fingerprint: "",
          decimals: 6,
        });
        idCounter++;
        if (addressAssets[output.payment_addr.bech32]) {
          addressAssets[output.payment_addr.bech32].push(...assetList);
        } else {
          addressAssets[output.payment_addr.bech32] = assetList;
        }
      }
    }
  } else {
    transactionType = "Incoming";
    for (const output of outputs) {
      if (usedAddresses.includes(output.payment_addr.bech32)) {
        const assetList = (output.asset_list || []).map((assetItem: any) => {
          let assetName: string;
          const assetFoundInAssets = assets.find(
            (a: any) => a.fingerprint === assetItem.fingerprint
          );
          if (
            assetFoundInAssets &&
            (assetFoundInAssets.assetName || assetFoundInAssets.name)
          ) {
            assetName =
              assetFoundInAssets.assetName || assetFoundInAssets.name;
          } else {
            assetName = getAssetNameFromTTypes(assetItem.fingerprint, tTypes);
          }
          let decimals = assetItem.decimals || 0;
          const normalized = normalizeAssetName(assetName);
          assetName = normalized.name;
          if (normalized.decimals != null) decimals = normalized.decimals;
          const mapped = {
            id: idCounter.toString(),
            name: assetName,
            amount: parseFloat(assetItem.quantity),
            unit: assetItem.unit || "",
            fingerprint: assetItem.fingerprint || "",
            decimals,
          };
          idCounter++;
          return mapped;
        });
        assetList.push({
          id: idCounter.toString(),
          name: "ADA",
          amount: parseFloat(output.value),
          unit: "lovelace",
          fingerprint: "",
          decimals: 6,
        });
        idCounter++;
        if (addressAssets[output.payment_addr.bech32]) {
          addressAssets[output.payment_addr.bech32].push(...assetList);
        } else {
          addressAssets[output.payment_addr.bech32] = assetList;
        }
      }
    }
  }

  // Divide amounts by 10**decimals for getTxInfo path (matches dapp)
  for (const address in addressAssets) {
    addressAssets[address].forEach((token) => {
      const decimals = token.decimals || 0;
      const raw = Number(token.amount);
      // Staking/withdrawal paths already store lovelace-scale before divide;
      // ADA from outputs uses value in lovelace; same as dapp.
      token.amount = (raw / Math.pow(10, decimals)).toFixed(decimals);
    });
  }

  return {
    addressAssets,
    transactionType,
    rawType: transactionType,
  };
}

/** Map classifier names to dashboard tx_type / label values */
export function normalizeTxType(rawType: string): string {
  switch (rawType) {
    case "Token swap request":
      return "Swap";
    case "Smart contract mint":
    case "Smart contract token receipt":
      return "Smart Contract";
    case "Multi-send":
      return "Outgoing";
    case "Token receive":
      return "Incoming";
    case "Native script mint":
      return "Minting";
    case "Token burn":
      return "Burning";
    case "Stake Reward Withdrawal":
      return "Rewards Withdrawal";
    case "Unknown":
      return "Incoming";
    default:
      return rawType;
  }
}

export function classifyTransaction(args: {
  usedAddresses: string[];
  stakeAddress: string | null;
  txData: any;
  tTypes: TokenTypeRow[];
  assets?: any[];
}): ClassifyResult {
  const { usedAddresses, stakeAddress, txData, tTypes, assets = [] } = args;

  const details = classifyWithDetails(stakeAddress, txData, tTypes);
  if (details && details.transactionType !== "Unknown") {
    return {
      ...details,
      transactionType: normalizeTxType(details.rawType),
    };
  }

  // Plutus present but no specific details match → Smart Contract
  if (txData.plutus_contracts?.length > 0) {
    const fallback = classifyWithTxInfo(usedAddresses, txData, assets, tTypes);
    return {
      addressAssets: fallback.addressAssets,
      transactionType: "Smart Contract",
      rawType: "Smart Contract (plutus fallback)",
    };
  }

  const info = classifyWithTxInfo(usedAddresses, txData, assets, tTypes);
  return {
    ...info,
    transactionType: normalizeTxType(info.rawType),
  };
}

export function buildContractInfo(txData: any): ContractInfo | null {
  const contracts = txData?.plutus_contracts;
  if (!contracts || !Array.isArray(contracts) || contracts.length === 0) {
    return null;
  }

  const scriptHashes: string[] = [];
  const addresses: string[] = [];
  const purposes: string[] = [];

  for (const c of contracts) {
    if (c?.script_hash) scriptHashes.push(String(c.script_hash));
    if (c?.address) addresses.push(String(c.address));
    if (c?.input?.purpose) purposes.push(String(c.input.purpose));
    else if (c?.purpose) purposes.push(String(c.purpose));
  }

  return {
    scriptHashes: Array.from(new Set(scriptHashes)),
    addresses: Array.from(new Set(addresses)),
    purposes: Array.from(new Set(purposes)),
    plutusContracts: contracts,
  };
}
