import { BrowserProvider, ethers } from "ethers";
import { flareTestnet, sepolia } from "viem/chains";
import {
  FAILED_KEY,
  AGRICSHIELD_CONTRACT_ADDRESS,
  NATIVE_TOKEN,
  LOCATION_DECIMAL_PLACES,
  FIAT_DECIMAL_PLACES,
  BACKEND_URL,
} from "../utils/constants";
import agriShieldAbi from "../assets/json/agrishield.json";
import { erc20Abi } from "viem";
import { FDCServiceJson } from "./fdc.json.services";

const agriShieldAbiInterface = new ethers.Interface(agriShieldAbi);
const erc20AbiInterface = new ethers.Interface(erc20Abi);

export async function switchOrAddChain(
  ethProvider: ethers.JsonRpcApiProvider,
  switchChainId: string | number
) {
  try {
    const currentChainId = Number(
      await ethProvider.provider.send("eth_chainId", [])
    );
    const targetChainId = Number(switchChainId);
    const chainIdHex = `0x${targetChainId.toString(16)}`;

    if (currentChainId === targetChainId) {
      console.log(`Already connected to ${targetChainId}`);
      return;
    }

    console.log(
      `Current chainId: ${currentChainId}, Switch chainId: ${targetChainId}`
    );

    try {
      await ethProvider.provider.send("wallet_switchEthereumChain", [
        { chainId: chainIdHex },
      ]);
      console.log(`Switched to ${targetChainId}`);
    } catch (error: any) {
      console.error(`Error switching chain:`, error);

      if (error.code === 4902) {
        console.log(`Chain ${targetChainId} not found. Attempting to add.`);

        if (targetChainId === Number(flareTestnet.id)) {
          await ethProvider.provider.send("wallet_addEthereumChain", [
            {
              chainId: chainIdHex,
              chainName: flareTestnet.name,
              nativeCurrency: {
                name: flareTestnet.nativeCurrency.name,
                symbol: flareTestnet.nativeCurrency.symbol,
                decimals: flareTestnet.nativeCurrency.decimals,
              },
              rpcUrls: [flareTestnet.rpcUrls.default.http[0]],
              blockExplorerUrls: [flareTestnet.blockExplorers.default.url],
            },
          ]);
          console.log(`${flareTestnet.name} added and switched`);
        } else if (targetChainId === Number(sepolia.id)) {
          await ethProvider.provider.send("wallet_addEthereumChain", [
            {
              chainId: chainIdHex,
              chainName: sepolia.name,
              nativeCurrency: {
                name: sepolia.nativeCurrency.name,
                symbol: sepolia.nativeCurrency.symbol,
                decimals: sepolia.nativeCurrency.decimals,
              },
              rpcUrls: [sepolia.rpcUrls.default.http[0]],
              blockExplorerUrls: [sepolia.blockExplorers.default.url],
            },
          ]);
          console.log(`${sepolia.name} added and switched`);
        }
      } else {
        console.error(`Failed to switch to ${targetChainId}:`, error);
      }
    }
  } catch (error) {
    console.error(`Unexpected error in switchOrAddChain:`, error);
  }
}

export const getSigner = async () => {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install it to use this feature."
    );
  }
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
};

export const getBlockNumber = async () => {
  try {
    const signer = await getSigner();
    await switchOrAddChain(signer.provider, flareTestnet.id);
    const blockNumber = await signer.provider.getBlockNumber();
    return blockNumber;
  } catch (error) {
    console.error("Error getting block number:", error);
    throw error;
  }
};

function parseContractError(error: any, contractInterface: ethers.Interface) {
  if (!error?.data || !contractInterface) return null;

  if (error.reason && typeof error.reason === "string") {
    return error.reason;
  }

  try {
    const errorFragment = contractInterface.fragments.find(
      (fragment) =>
        fragment.type === "error" &&
        error.data.startsWith((fragment as any).selector)
    );

    if (errorFragment && "name" in errorFragment && errorFragment.name) {
      return errorFragment.name;
    }

    return errorFragment
      ? contractInterface.parseError(error.data)?.name
      : null;
  } catch (err) {
    console.error("Error parsing contract error:", err);
    return null;
  }
}

export const walletAddress = async () => {
  try {
    const signer = await getSigner();
    return await signer.getAddress();
  } catch (error) {
    return `${FAILED_KEY} to get wallet address`;
  }
};

export const tokenBalance = async ({
  tokenAddress,
  switchChainId = flareTestnet.id,
}: {
  tokenAddress: string;
  switchChainId?: number;
}) => {
  let tokenName;
  try {
    const { balance, decimals, name } = await _tokenBalance({
      tokenAddress,
      switchChainId,
    });
    tokenName = name;
    return `${Number(balance) / 10 ** Number(decimals)} ${name}`;
  } catch (error) {
    return `${FAILED_KEY} to get ${tokenName} balance`;
  }
};
export const _tokenBalance = async ({
  tokenAddress,
  switchChainId = flareTestnet.id,
}: {
  tokenAddress: string;
  switchChainId?: number;
}) => {
  try {
    const signer = await getSigner();

    await switchOrAddChain(signer.provider, switchChainId);

    const address = await signer.getAddress();

    if (tokenAddress == ethers.ZeroAddress || tokenAddress == NATIVE_TOKEN) {
      const balance = await signer.provider.getBalance(address);
      return { balance, decimals: 18, name: flareTestnet.nativeCurrency.name };
    }

    const token = await getERC20Contract(tokenAddress, switchChainId);

    const [balance, decimals, name] = await Promise.all([
      token.balanceOf(address),
      token.decimals(),
      token.name(),
    ]);
    return { balance, decimals, name };
  } catch (error: any) {
    console.log(error.message);
    throw error;
  }
};

export const getAgriShieldContract = async () => {
  const signer = await getSigner();

  await switchOrAddChain(signer.provider, flareTestnet.id);

  return new ethers.Contract(
    AGRICSHIELD_CONTRACT_ADDRESS,
    agriShieldAbiInterface,
    signer
  );
};

export const getERC20Contract = async (
  tokenAddress: string,
  chainId: number = flareTestnet.id
) => {
  const signer = await getSigner();
  await switchOrAddChain(signer.provider, chainId);
  return new ethers.Contract(tokenAddress, erc20AbiInterface, signer);
};

export const checkUserPlan = async ({ planId }: { planId: string }) => {
  const insuranceContract = await getAgriShieldContract();
  const userAddress = await getSigner().then((signer) => signer.getAddress());
  const isPaid = await insuranceContract.userPlanProcessed(planId, userAddress);
  return isPaid;
};
export const getUserPolicies = async () => {
  const insuranceContract = await getAgriShieldContract();
  const userAddress = await getSigner().then((signer) => signer.getAddress());
  console.log({ userAddress });
  try {
    const [
      policyIds,
      planIds,
      startDates,
      endDates,
      amounts,
      withdrawnFlags,
      latitude,
      longitude,
    ] = await insuranceContract.getUserPolicies(userAddress);

    const paidPlans = policyIds.map((_: any, i: string | number) => ({
      id: policyIds[i],
      planId: planIds[i],
      startDate: Number(startDates[i]),
      endDate: Number(endDates[i]),
      amountInUsd: Number(amounts[i]) / FIAT_DECIMAL_PLACES,
      latitude: Number(latitude[i]) / 10 ** LOCATION_DECIMAL_PLACES,
      longitude: Number(longitude[i]) / 10 ** LOCATION_DECIMAL_PLACES,
      status: withdrawnFlags[i] ? "Withdrawn" : getStatus(endDates[i]),
    }));

    return paidPlans;
  } catch (error) {
    console.error("Error fetching user policies:", error);
    return [];
  }
};

const getStatus = (end: number): "Active" | "Expired" => {
  const now = Math.floor(Date.now() / 1000);
  if (now < end) return "Active";
  return "Expired";
};

export const getAllInsurance = async () => {
  const insuranceContract = await getAgriShieldContract();
  const insuranceList = await insuranceContract.getInsurancePlanList();
  const formattedInsuranceList = insuranceList.map((plan: any) => ({
    id: plan[0].toString(),
    latitude: Number(plan[1]) / 10 ** LOCATION_DECIMAL_PLACES,
    longitude: Number(plan[2]) / 10 ** LOCATION_DECIMAL_PLACES,
    startDate: Number(plan[3]),
    endDate: Number(plan[4]),
    amountInUsd: Number(plan[5]),
  }));

  console.log("Insurance Plans:", formattedInsuranceList);

  return formattedInsuranceList;
};
export const createInsurance = async () => {
  try {
    const insuranceContract = await getAgriShieldContract();
    const lagosLat = 65244;
    const lagosLong = 33792;
    const _startDate = Math.floor(Date.now() / 1000) + 3000;
    const oneYearInSeconds = 365 * 24 * 60 * 60;
    const _endDate = _startDate + oneYearInSeconds;
    const amountInUsd = 1 * FIAT_DECIMAL_PLACES;
    const transaction = await insuranceContract.createInsurancePlan(
      lagosLat,
      lagosLong,
      _startDate,
      _endDate,
      amountInUsd
    );

    const receipt = await transaction.wait(1);
    return `Created plan with: ${receipt!.hash}`;
  } catch (error: any) {
    const parsedError = parseContractError(error, agriShieldAbiInterface);
    console.error(`${FAILED_KEY}${parsedError ?? error.message}`);
    return `${FAILED_KEY}${parsedError ?? error.message}`;
  }
};

export const payForInsurance = async ({
  policyId,
  token,
}: {
  policyId: string;
  token: string;
}) => {
  try {
    const insuranceContract = await getAgriShieldContract();
    const insuranceDetails = await insuranceContract.insurancePlans(policyId);
    console.log("Insurance Details:", insuranceDetails);
    const usdPrice = insuranceDetails[5];
    const tokenPrice = await insuranceContract.getUsdToTokenPrice(
      token,
      usdPrice
    );
    const isERC20Token = token.toLowerCase() !== NATIVE_TOKEN.toLowerCase();

    if (isERC20Token) {
      const tokenContract = await getERC20Contract(token);
      const signer = await getSigner();
      const owner = await signer.getAddress();
      const allowance = await tokenContract.allowance(
        owner,
        AGRICSHIELD_CONTRACT_ADDRESS
      );
      if (allowance < tokenPrice) {
        const price = Number(tokenPrice) + 0.01 * Number(tokenPrice);
        const approveTx = await tokenContract.approve(
          AGRICSHIELD_CONTRACT_ADDRESS,
          price.toString()
        );
        await approveTx.wait(1);
      }
    }

    const transaction = await insuranceContract.payForPolicy(policyId, token, {
      value: isERC20Token ? 0 : tokenPrice,
    });

    const receipt = await transaction.wait(1);
    return `Created Insurance with: ${receipt!.hash}`;
  } catch (error: any) {
    const parsedError = parseContractError(error, agriShieldAbiInterface);
    console.error(`${FAILED_KEY}${parsedError ?? error.message}`);
    return `${FAILED_KEY}${parsedError ?? error.message}`;
  }
};

export const refundPolicy = async ({
  policyId,
  lat,
  long,
}: {
  policyId: string;
  lat: string;
  long: string;
}) => {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/fdc/json-proof/${lat}/${long}`
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok ${response.statusText}`);
    }
    const data = await response.json();
    console.log("proof data:", data);

    const fdcService = new FDCServiceJson();
    const proof = await fdcService.getDataAndStoreProof(data.data);

    console.log("proof:", proof);
    const insuranceContract = await getAgriShieldContract();

    const transaction = await insuranceContract.refundPolicy(policyId, proof);

    const receipt = await transaction.wait(1);
    return `Paid Insurance with: ${receipt!.hash}`;
  } catch (error: any) {
    const parsedError = parseContractError(error, agriShieldAbiInterface);
    console.error(`${FAILED_KEY}${parsedError ?? error.message}`);
    return `${FAILED_KEY}${parsedError ?? error.message}`;
  }
};

export const rethrowFailedResponse = (response: string) => {
  if (response.includes(FAILED_KEY)) {
    throw new Error(response);
  }
  return response;
};
