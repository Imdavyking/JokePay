/** @format */

import { callLLMApi } from "../services/agent.services";
import { tokenBalance, walletAddress } from "../services/blockchain.services";
import { useConfirmationStore } from "./prompt";

export class AIAgent {
  tools: { [key: string]: Function };

  constructor() {
    this.tools = {
      QRY_TOKEN_BALANCE: tokenBalance,
      QRY_WALLET_BALANCE: tokenBalance,
      QRY_WALLET_ADDRESS: walletAddress,
    };
  }

  private async executeAction(action: any) {
    const tool = this.tools[action.name];
    if (!tool) {
      return `Tool ${action.name} not found`;
    }
    return tool.bind(this)(action.args ? action.args : {});
  }

  async showConfirmationPrompt(toolCall: any): Promise<boolean> {
    return useConfirmationStore
      .getState()
      .showPrompt(toolCall.name, toolCall.args);
  }

  public async solveTask(
    userPrompt: string,
    imageBase64?: string
  ): Promise<any> {
    const userAddress = await walletAddress();
    const action = await callLLMApi({
      userPrompt,
      userAddress,
      imageBase64,
    });

    const results: string[] = [];

    if (action.tool_calls.length === 0 && action.content.trim() !== "") {
      results.push(action.content);
    }
    for (const toolCall of action.tool_calls) {
      if (toolCall.name.startsWith("CMD_")) {
        const approved = await this.showConfirmationPrompt(toolCall);
        if (!approved) throw new Error("User cancelled the action");
      }
      const result = await this.executeAction(toolCall);
      results.push(result);
    }

    return {
      results,
      needsMoreData: action.content.trim() !== "",
    };
  }
}
