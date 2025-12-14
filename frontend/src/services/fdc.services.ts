import { ContractTransactionResponse, ethers } from "ethers";

export interface FDCService {
  sleep(ms: number): Promise<unknown>;

  getHelpers(): Promise<ethers.Contract>;

  getRelay(): Promise<ethers.Contract>;

  retrieveDataAndProofBase(
    url: string,
    abiEncodedRequest: string,
    roundId: number
  ): Promise<any>;

  postRequestToDALayer(
    url: string,
    request: any,
    watchStatus: boolean
  ): Promise<any>;

  getFdcHub(): Promise<ethers.Contract>;
  getFlareSystemsManager(): Promise<ethers.Contract>;
  getFdcRequestFee(abiEncodedRequest: string): Promise<any>;

  calculateRoundId(transaction: ContractTransactionResponse): Promise<number>;

  submitAttestationRequest(abiEncodedRequest: string): Promise<number>;

  retrieveDataAndProof(
    abiEncodedRequest: string,
    roundId: number
  ): Promise<any>;

  getDataAndStoreProof(data: any): Promise<{
    merkleProof: any;
    data: any;
  }>;
}
