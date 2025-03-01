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
import TexasHoldem from "./TexasHoldem.json";
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
        description: "Folding in Texas Hold'em means forfeiting your hand and exiting the current round of betting. Once you fold, you are no longer eligible to win the pot, and you do not have to contribute any more chips to the betting round. However, you must wait for the next hand to participate again.",
        schema: MyActionSchema,
    })
    async myAction(
        walletProvider: CdpWalletProvider,
        args: z.infer<typeof MyActionSchema>,
    ): Promise<string> {
    

    const data = encodeFunctionData({
        abi: pokerABI.abi,
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
