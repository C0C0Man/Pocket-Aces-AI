import {
  AgentKit,
  CdpWalletProvider,
  cdpApiActionProvider,
  walletActionProvider,
  ActionProvider,
  WalletProvider,
  Network,
  CreateAction,
} from "@coinbase/agentkit";
import { getLangChainTools } from "@coinbase/agentkit-langchain";
import { HumanMessage } from "@langchain/core/messages";
import { MemorySaver } from "@langchain/langgraph";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as readline from "readline";
import TexasHoldem from "./TexasHoldem.json";
import {encodeFunctionData } from "viem";
import { z } from "zod";


dotenv.config();

/**
 * Validates that required environment variables are set
 *
 * @throws {Error} - If required environment variables are missing
 * @returns {void}
 */
function validateEnvironment(): void {
  const missingVars: string[] = [];

  // Check required variables
  const requiredVars = [
    "OPENAI_API_KEY",
    "CDP_API_KEY_NAME",
    "CDP_API_KEY_PRIVATE_KEY",
  ];
  requiredVars.forEach((varName) => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  // Exit if any required variables are missing
  if (missingVars.length > 0) {
    console.error("Error: Required environment variables are not set");
    missingVars.forEach((varName) => {
      console.error(`${varName}=your_${varName.toLowerCase()}_here`);
    });
    process.exit(1);
  }

  // Warn about optional NETWORK_ID
  if (!process.env.NETWORK_ID) {
    console.warn(
      "Warning: NETWORK_ID not set, defaulting to base-sepolia testnet",
    );
  }
}

// Add this right after imports and before any other code
validateEnvironment();

// Configure a file to persist the agent's CDP MPC Wallet Data
const WALLET_DATA_FILE = "wallet_data.txt";

/**
 * Initialize the agent with CDP Agentkit
 *
 * @returns Agent executor and config
 */

const contractAddress = "0x9BEEf0b0a88d419b162b0aEb1e91F17467Ea8447";


export const MyActionSchema = z.object({
    myField: z.string(),
});

export const SendActionsSchema = z.object({
    myField: z.string(),
    amount: z.bigint(),
});

const pokerABI = TexasHoldem;


class PokerActionProvider extends ActionProvider<WalletProvider> {
    constructor() {
        super("my-action-provider", []);
    }

    @CreateAction({
        name: "fold",
        description: "Folding in Texas Hold'em means forfeiting your hand and exiting the current round of betting. Once you fold, you are no longer eligible to win the pot, and you do not have to contribute any more chips to the betting round. However, you must wait for the next hand to participate again.",
        schema: MyActionSchema,
    })
    async foldAction(
        walletProvider: CdpWalletProvider,
        args: z.infer<typeof MyActionSchema>,
    ): Promise<string> {


    const data = encodeFunctionData({
        abi: pokerABI.abi,
        functionName: "fold",
        args:[]
    })

    const txHash = await walletProvider.sendTransaction({
        to: contractAddress as '0x${string}',
        data,
    })

    const receipt = await walletProvider.waitForTransactionReceipt(txHash)
        return "Folded Successfully"
    }

    @CreateAction({
      name: "call",
      description: "Calling in Texas Hold'em means matching the current bet in order to stay in the hand. Unlike raising (which increases the bet) or folding (which forfeits the hand), calling simply keeps you in the game without escalating the stakes. Calling can be a strong strategic move or a costly mistake, depending on the situation. A well-timed call can set up a powerful trap for your opponents, allow you to see additional cards at a good price, or keep your range balanced. However, excessive calling (often referred to as being a calling station) can lead to losses if done without a clear reason.",
      schema: MyActionSchema,
    })
    async callAction(
      walletProvider: CdpWalletProvider,
      args: z.infer<typeof MyActionSchema>,
    ): Promise<string> {
  
  
    const data = encodeFunctionData({
      abi: pokerABI.abi,
      functionName: "callBet",
      args:[]
    })
  
    const txHash = await walletProvider.sendTransaction({
      to: contractAddress as '0x${string}',
      data,
    })
  
    const receipt = await walletProvider.waitForTransactionReceipt(txHash)
      return "Called Successfully"
    }     

  @CreateAction({
    name: "raise",
    description: "Raising in Texas Hold'em means increasing the current bet amount, either after an opponent has bet or as the first action in a betting round (an open-raise). Raising is a powerful tool that can be used to build the pot, apply pressure on opponents, gain information, and protect strong hands. There are two main types of raises: Value Raise – Raising when you believe you have the best hand and want to extract more money from your opponents.Bluff Raise – Raising with a weak hand to make your opponent fold.",
    schema: SendActionsSchema,
  })
  async raiseAction(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof SendActionsSchema>,
    amount: bigint,
  ): Promise<string> {


  const data = encodeFunctionData({
    abi: pokerABI.abi,
    functionName: "raiseBet",
    args:[amount]
  })

  const txHash = await walletProvider.sendTransaction({
    to: contractAddress as '0x${string}',
    data,
  })

  const receipt = await walletProvider.waitForTransactionReceipt(txHash)
    return "Raised Successfully" 
  } 

  @CreateAction({
    name: "register",
    description: "Register to play Texas Holdem against another player",
    schema: MyActionSchema,
  })
  async registerAction(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof MyActionSchema>,
  ): Promise<string> {


  const data = encodeFunctionData({
    abi: pokerABI.abi,
    functionName: "registerAI",
  })

  const txHash = await walletProvider.sendTransaction({
    to: contractAddress as '0x${string}',
    data,
  })

  const receipt = await walletProvider.waitForTransactionReceipt(txHash)
    return "Registered Successfully" 
  } 

  @CreateAction({
    name: "getHoleCards",
    description: "Hole cards are the two private cards dealt face down to each player at the beginning of a Texas Hold'em hand. These are the only cards unique to each player and are not shared with others. Players use their hole cards in combination with the five community cards on the board to make the best possible five-card poker hand.",
    schema: MyActionSchema,
  })
  async getHoleCards(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof MyActionSchema>,
  ): Promise<string> {


  const data = encodeFunctionData({
    abi: pokerABI.abi,
    functionName: "getHoleCards",
  })

  const txHash = await walletProvider.sendTransaction({
    to: contractAddress as '0x${string}',
    data,
  })

  const receipt = await walletProvider.waitForTransactionReceipt(txHash)
    return "Hope you like your hand" 
  } 

  @CreateAction({
    name: "getCommunityCards",
    description: "Community cards are the shared face-up cards placed in the center of the table that all players can use to form their best five-card poker hand. In Texas Hold’em, a total of five community cards are dealt at the beginning of the game. Players combine their two private hole cards with the community cards to create the strongest five-card hand possible.",
    schema: MyActionSchema,
  })
  async getCommunityCards(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof MyActionSchema>,
  ): Promise<string> {


  const data = encodeFunctionData({
    abi: pokerABI.abi,
    functionName: "getCommunityCards",
  })

  const txHash = await walletProvider.sendTransaction({
    to: contractAddress as '0x${string}',
    data,
  })

  const receipt = await walletProvider.waitForTransactionReceipt(txHash)
    return "Hope you like the cards on the table" 
  } 

  @CreateAction({
    name: "getHighestBet",
    description: "Get the highest bet placed in your game so you can make informed decisions on how you would like to bet",
    schema: MyActionSchema,
  })
  async getHighestBet(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof MyActionSchema>,
  ): Promise<string> {


  const data = encodeFunctionData({
    abi: pokerABI.abi,
    functionName: "getHighestBet",
  })

  const txHash = await walletProvider.sendTransaction({
    to: contractAddress as '0x${string}',
    data,
  })

  const receipt = await walletProvider.waitForTransactionReceipt(txHash)
    return "Are you going to call, raise or fold?" 
  } 

  @CreateAction({
    name: "getAIBalances",
    description: "Get the balances of all players so you can make a more informed decision on if you want to call, raise, or fold.",
    schema: MyActionSchema,
  })
  async getAIBalances(
    walletProvider: CdpWalletProvider,
    args: z.infer<typeof MyActionSchema>,
  ): Promise<string> {


  const data = encodeFunctionData({
    abi: pokerABI.abi,
    functionName: "getAIBalances",
  })

  const txHash = await walletProvider.sendTransaction({
    to: contractAddress as '0x${string}',
    data,
  })

  const receipt = await walletProvider.waitForTransactionReceipt(txHash)
    return "Hope you like the cards on the table" 
  } 
  
    supportsNetwork = (network: Network) => true;
}

export const myPokerProvider = () => new PokerActionProvider();

async function initializeAgent() {
  try {
    // Initialize LLM
    const llm = new ChatOpenAI({
      model: "gpt-4o-mini",
    });

    let walletDataStr: string | null = null;

    // Read existing wallet data if available
    if (fs.existsSync(WALLET_DATA_FILE)) {
      try {
        walletDataStr = fs.readFileSync(WALLET_DATA_FILE, "utf8");
      } catch (error) {
        console.error("Error reading wallet data:", error);
        // Continue without wallet data
      }
    }

    // Configure CDP Wallet Provider
    const config = {
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
        /\\n/g,
        "\n",
      ),
      cdpWalletData: walletDataStr || undefined,
      networkId: process.env.NETWORK_ID || "base-sepolia",
    };

    const walletProvider = await CdpWalletProvider.configureWithWallet(config);

    // Initialize AgentKit
    const agentkit = await AgentKit.from({
      walletProvider,
      actionProviders: [
        myPokerProvider(),
        walletActionProvider(),
        cdpApiActionProvider({
          apiKeyName: process.env.CDP_API_KEY_NAME,
          apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n",
          ), 
        }),
        
      ],
    });

    const tools = await getLangChainTools(agentkit);

    // Store buffered conversation history in memory
    const memory = new MemorySaver();
    const agentConfig = {
      configurable: { thread_id: "CDP AgentKit Chatbot Example!" },
    };

    // Create React Agent using the LLM and CDP AgentKit tools
    const agent = createReactAgent({
      llm,
      tools,
      checkpointSaver: memory,
      messageModifier: `
            You are a poker-playing agent that can interact on-chain using the Coinbase Developer Platform AgentKit. Your role is to participate in Texas Hold'em games by making strategic betting decisions based on your hand, the community cards, and the game state. You are empowered to interact on-chain using your tools to place bets, check, call, raise, or fold as needed.
    
    If you ever need funds, you can request them from the faucet if you are on network ID 'base-sepolia'. Otherwise, you can provide your wallet details and request funds from the user. Before executing your first action, retrieve your wallet details to determine the network you're on.
    
    When making decisions, consider probabilities, opponent behavior, and standard poker strategies. If you encounter a 5XX (internal) HTTP error code, ask the user to try again later. If someone asks you to perform an action outside your available tools, you must say so and encourage them to implement it themselves using the CDP SDK + AgentKit. Recommend they visit docs.cdp.coinbase.com for more information.
    
    Be concise and strategic in your responses. Avoid restating your tools' descriptions unless explicitly requested. Focus on playing the best possible poker strategy while interacting on-chain.
        `,
    });

    // Save wallet data
    const exportedWallet = await walletProvider.exportWallet();
    fs.writeFileSync(WALLET_DATA_FILE, JSON.stringify(exportedWallet));

    return { agent, config: agentConfig };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Run the agent autonomously with specified intervals
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 * @param interval - Time interval between actions in seconds
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runAutonomousMode(agent: any, config: any, interval = 10) {
  console.log("Starting autonomous mode...");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const thought =
        "Be creative and do something interesting on the blockchain. " +
        "Choose an action or set of actions and execute it that highlights your abilities.";

      const stream = await agent.stream(
        { messages: [new HumanMessage(thought)] },
        config,
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }

      await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
  }
}

/**
 * Run the agent interactively based on user input
 *
 * @param agent - The agent executor
 * @param config - Agent configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function runChatMode(agent: any, config: any) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      const stream = await agent.stream(
        { messages: [new HumanMessage(userInput)] },
        config,
      );

      for await (const chunk of stream) {
        if ("agent" in chunk) {
          console.log(chunk.agent.messages[0].content);
        } else if ("tools" in chunk) {
          console.log(chunk.tools.messages[0].content);
        }
        console.log("-------------------");
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Choose whether to run in autonomous or chat mode based on user input
 *
 * @returns Selected mode
 */
async function chooseMode(): Promise<"chat" | "auto"> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log("\nAvailable modes:");
    console.log("1. chat    - Interactive chat mode");
    console.log("2. auto    - Autonomous action mode");

    const choice = (await question("\nChoose a mode (enter number or name): "))
      .toLowerCase()
      .trim();

    if (choice === "1" || choice === "chat") {
      rl.close();
      return "chat";
    } else if (choice === "2" || choice === "auto") {
      rl.close();
      return "auto";
    }
    console.log("Invalid choice. Please try again.");
  }
}

/**
 * Start the chatbot agent
 */
async function main() {
  try {
    const { agent, config } = await initializeAgent();
    const mode = await chooseMode();

    if (mode === "chat") {
      await runChatMode(agent, config);
    } else {
      await runAutonomousMode(agent, config);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  console.log("Starting Agent...");
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
