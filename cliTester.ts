
import { ethers } from 'ethers';
import readline from 'readline';
import TexasHoldemABI from './TexasHoldem.json';
import dotenv from 'dotenv';

dotenv.config();

// Contract address (same as in chatbot.ts)
const contractAddress = "0x9BEEf0b0a88d419b162b0aEb1e91F17467Ea8447";

// Create readline interface for CLI
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for input
function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
}

// Main function
async function main() {
  try {
    console.log("TexasHoldem Contract Tester CLI");
    console.log("===============================");

    // Setup provider
    console.log("Setting up provider...");
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || "https://base-sepolia.g.alchemy.com/v2/G8YH_EdJ8ArW5bB-8vU4oV3i5wFbOMZf");

    // First wallet - for main operations and spectator 1
    const privateKey1 = process.env.PRIVATE_KEY1 || await askQuestion("Enter private key for first wallet: ");
    const wallet1 = new ethers.Wallet(privateKey1, provider);
    
    // Second wallet - for spectator 2
    const privateKey2 = process.env.PRIVATE_KEY2 || await askQuestion("Enter private key for second wallet: ");
    const wallet2 = new ethers.Wallet(privateKey2, provider);
    
    console.log(`Wallet 1 address: ${wallet1.address}`);
    console.log(`Wallet 2 address: ${wallet2.address}`);

    // Create contract instances
    const contract1 = new ethers.Contract(contractAddress, TexasHoldemABI.abi, wallet1);
    const contract2 = new ethers.Contract(contractAddress, TexasHoldemABI.abi, wallet2);

    // Display menu and handle commands
    while (true) {
      console.log("\nTexasHoldem Contract Tester Menu:");
      console.log("1. Get registered AI players");
      console.log("2. Join as spectator with wallet1 and bet on an AI");
      console.log("3. Join as spectator with wallet2 and bet on an AI");
      console.log("4. Start the game");
      console.log("5. Declare winner");
      console.log("6. Get game status");
      console.log("7. Get spectator count");
      console.log("8. Get AI player balances");
      console.log("9. Exit");

      const choice = await askQuestion("Choose an option (1-9): ");

      switch (choice) {
        case "1":
          await getRegisteredAIPlayers(contract1);
          break;
        case "2":
          await joinAsSpectator(contract1, wallet1);
          break;
        case "3":
          await joinAsSpectator(contract2, wallet2);
          break;
        case "4":
          await startGame(contract1);
          break;
        case "5":
          await declareWinner(contract1);
          break;
        case "6":
          await getGameStatus(contract1);
          break;
        case "7":
          await getSpectatorCount(contract1);
          break;
        case "8":
          await getAIBalances(contract1);
          break;
        case "9":
          console.log("Exiting...");
          rl.close();
          return;
        default:
          console.log("Invalid option, please try again.");
      }
    }
  } catch (error) {
    console.error("Error in main:", error);
    rl.close();
  }
}

// Get registered AI players
async function getRegisteredAIPlayers(contract: ethers.Contract) {
  try {
    console.log("Getting registered AI players...");
    
    // Check player addresses (up to a reasonable limit)
    const playerAddresses: string[] = [];
    for (let i = 0; i < 10; i++) {
      try {
        const address = await contract.playerAddresses(i);
        if (address && address !== ethers.constants.AddressZero) {
          playerAddresses.push(address);
        }
      } catch (e) {
        break; // No more players
      }
    }
    
    console.log("Registered AI players:");
    if (playerAddresses.length === 0) {
      console.log("No AI players registered yet");
    } else {
      playerAddresses.forEach((address, index) => {
        console.log(`${index + 1}: ${address}`);
      });
    }
  } catch (error) {
    console.error("Error getting registered AI players:", error);
  }
}

// Join as spectator
async function joinAsSpectator(contract: ethers.Contract, wallet: ethers.Wallet) {
  try {
    console.log("Getting AI players to bet on...");
    
    // Check player addresses
    const playerAddresses: string[] = [];
    for (let i = 0; i < 10; i++) {
      try {
        const address = await contract.playerAddresses(i);
        if (address && address !== ethers.constants.AddressZero) {
          playerAddresses.push(address);
        }
      } catch (e) {
        break; // No more players
      }
    }
    
    // Option to manually enter an AI address
    console.log("Available AI players to bet on:");
    playerAddresses.forEach((address, index) => {
      console.log(`${index + 1}: ${address}`);
    });
    console.log("M: Manually enter an AI address");
    
    const selection = await askQuestion(`Select an option (1-${playerAddresses.length} or M): `);
    
    let selectedAI: string;
    
    if (selection.toUpperCase() === 'M') {
      // Allow user to manually enter an address
      selectedAI = await askQuestion("Enter the autonomous agent address: ");
      
      // Basic validation for Ethereum address
      if (!selectedAI.startsWith('0x') || selectedAI.length !== 42) {
        console.log("Invalid Ethereum address format. Should be 0x followed by 40 hex characters.");
        return;
      }
    } else {
      const selectedIndex = parseInt(selection) - 1;
      if (selectedIndex < 0 || selectedIndex >= playerAddresses.length) {
        console.log("Invalid selection");
        return;
      }
      selectedAI = playerAddresses[selectedIndex];
    }
    
    console.log(`Joining as spectator and betting on AI: ${selectedAI}`);
    
    // 0.0002 ETH in wei
    const betAmount = ethers.utils.parseEther("0.0002");
    
    const tx = await contract.joinAsSpectator(selectedAI, { value: betAmount });
    console.log(`Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Successfully joined as spectator with wallet ${wallet.address}`);
  } catch (error) {
    console.error("Error joining as spectator:", error);
  }
}

// Start the game
async function startGame(contract: ethers.Contract) {
  try {
    console.log("Starting the game...");
    const tx = await contract.startGame();
    console.log(`Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log("Game started successfully");
  } catch (error) {
    console.error("Error starting the game:", error);
  }
}

// Declare the winner
async function declareWinner(contract: ethers.Contract) {
  try {
    console.log("Declaring the winner...");
    const tx = await contract.declareWinner();
    console.log(`Transaction hash: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    console.log("Winner declared successfully");
    
    // Try to parse winner from logs
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog.name === "WinnerDeclared") {
          console.log(`Winner: ${parsedLog.args.winner}`);
          console.log(`Winnings: ${ethers.utils.formatEther(parsedLog.args.winnings)} ETH`);
        } else if (parsedLog.name === "SpectatorWinningsPaid") {
          console.log(`Winning spectator: ${parsedLog.args.spectator}`);
          console.log(`Spectator winnings: ${ethers.utils.formatEther(parsedLog.args.amount)} ETH`);
        }
      } catch (e) {
        // Not all logs can be parsed, so ignore errors
      }
    }
  } catch (error) {
    console.error("Error declaring the winner:", error);
  }
}

// Get game status
async function getGameStatus(contract: ethers.Contract) {
  try {
    const gameStarted = await contract.gameStarted();
    const aiPot = ethers.utils.formatEther(await contract.aiPot());
    const spectatorPot = ethers.utils.formatEther(await contract.spectatorPot());
    const currentBet = ethers.utils.formatEther(await contract.currentBet());
    
    console.log("Game Status:");
    console.log(`Game Started: ${gameStarted}`);
    console.log(`AI Pot: ${aiPot} ETH`);
    console.log(`Spectator Pot: ${spectatorPot} ETH`);
    console.log(`Current Bet: ${currentBet} ETH`);
  } catch (error) {
    console.error("Error getting game status:", error);
  }
}

// Get spectator count
async function getSpectatorCount(contract: ethers.Contract) {
  try {
    const count = await contract.getSpectatorCount();
    console.log(`Spectator count: ${count.toString()}`);
    
    // Try to get spectator addresses
    console.log("Spectators:");
    const addresses = await contract.getAllSpectatorAddresses();
    if (addresses.length === 0) {
      console.log("No spectators");
    } else {
      addresses.forEach((address: string, index: number) => {
        console.log(`${index + 1}: ${address}`);
      });
    }
  } catch (error) {
    console.error("Error getting spectator count:", error);
  }
}

// Get AI balances
async function getAIBalances(contract: ethers.Contract) {
  try {
    const balances = await contract.getAIBalances();
    
    // Get player addresses to match with balances
    const playerAddresses: string[] = [];
    for (let i = 0; i < balances.length; i++) {
      try {
        const address = await contract.playerAddresses(i);
        playerAddresses.push(address);
      } catch (e) {
        break;
      }
    }
    
    console.log("AI Balances:");
    balances.forEach((balance: ethers.BigNumber, index: number) => {
      console.log(`${playerAddresses[index]}: ${balance.toString()}`);
    });
  } catch (error) {
    console.error("Error getting AI balances:", error);
  }
}

// Run the main function
main().catch(console.error);
