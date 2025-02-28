import {
    ActionProvider,
    WalletProvider,
    CdpWalletProvider,
    Network,
    CreateAction,
    CreateActionDecoratorParams,
    walletActionProvider,
} from "@coinbase/agentkit";
import { parseArgs } from "util";
import TexasHoldem from "./TexasHoldem";
import {encodeFunctionData } from "viem";
import { z } from "zod";

export const MyActionSchema = z.object({
    myField: z.string(),
});

const pokerABI = TexasHoldem;


class MyActionProvider extends ActionProvider<WalletProvider> {
    constructor() {
        super("my-action-provider", []);
    }

    @CreateAction({
        name: "fold",
        description: "In order to not lose any more money. You forfit the pot by folding your hand",
        schema: MyActionSchema,
    })
    async myAction(
        walletProvider: CdpWalletProvider,
        args: z.infer<typeof MyActionSchema>,
    ): Promise<string> {
    

    const data = encodeFunctionData({
        abi:,
        functionName: "fold",
        args:[]
    })

    const txHash = await walletProvider.sendTransaction({
        to: "0xContractAddress" as '0x$${string}',
        data,
    })

    const receipt = await walletProvider.waitForTransactionReceipt(txHash)
        return "Folded Successfully"
    }

    supportsNetwork = (network: Network) => true;
}
