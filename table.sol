// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "./Deck.sol";
import "./PokerHandEvaluator.sol";

contract TexasHoldem {
    using PokerHandEvaluator for uint8[7];

    struct Player {
        address addr;
        uint256 balance;
        uint256 betAmount;
        uint8[2] holeCards;
        bool isActive;
        bool hasFolded;
    }

    struct Spectator {
        address addr;
        address betOnAI;
        uint256 betAmount;
    }

    Deck private deckContract;
    uint8[5] public communityCards;
    mapping(address => Player) public players;
    mapping(address => Spectator) public spectators;
    address[] public spectatorAddresses; // New array to track spectators separately
    mapping(address => address) public spectatorBets; // Maps spectator to the AI they bet on
    address[] public playerAddresses;
    uint256 public aiPot;
    uint256 public spectatorPot;
    uint256 public currentBet; // Current bet amount in the round
    bool public gameStarted;


    event DebugWinner(address winningAI, uint256 aiPot, uint256 spectatorPot);
    event DebugSpectator(address spectator, address betOnAI, bool isWinner, uint256 payout);
    event PotSizeDebug(uint256 aiPot, uint256 spectatorPot, address winner);
    event JoinedGame(address indexed player, uint256 betAmount);
    event SpectatorJoined(address indexed spectator, address indexed betOnAI, uint256 betAmount);
    event GameStarted();
    event CardsDealt();
    event BetPlaced(address indexed player, uint256 amount);
    event PlayerFolded(address indexed player);
    event WinnerDeclared(address indexed winner, uint256 winnings);
    event SpectatorWinningsPaid(address indexed spectator, uint256 amount);
    event GameReset();

    modifier onlyActivePlayer() {
        require(players[msg.sender].isActive, "Not an active player");
        require(!players[msg.sender].hasFolded, "Player has folded");
        _;
    }

    modifier onlyAIPlayers() {
        require(players[msg.sender].addr != address(0), "Not a registered player");
        _;
    }
    constructor(address _deckContract) {
        deckContract = Deck(_deckContract);
    }
    function registerAI() external payable {
        require(!gameStarted, "Game already started");
        require(players[msg.sender].addr == address(0), "Already registered as AI");

        players[msg.sender] = Player(msg.sender, 100, 0, [0, 0], true, false);
        playerAddresses.push(msg.sender);

        emit JoinedGame(msg.sender, 100);
    }

    function joinAsSpectator(address betOnAI) external payable {
        require(!gameStarted, "Game already started");
        require(msg.value == 0.0002 ether, "Bet must be exactly 0.0002 ETH");
        require(spectators[msg.sender].addr == address(0), "Already joined as spectator");

        spectators[msg.sender] = Spectator(msg.sender, betOnAI, msg.value);
        spectatorBets[msg.sender] = betOnAI;
        spectatorAddresses.push(msg.sender); 
        spectatorPot += msg.value;

        emit SpectatorJoined(msg.sender, betOnAI, msg.value);
    }

    function startGame() external {
        require(playerAddresses.length == 2, "Not enough players to start the game");

        gameStarted = true;
        deckContract.shuffleDeck();
        dealCards();
        emit GameStarted();
    }

    function dealCards() internal {
        require(gameStarted, "Game has not started");

        for (uint8 i = 0; i < playerAddresses.length; i++) {
            players[playerAddresses[i]].holeCards = [deckContract.drawCard(), deckContract.drawCard()];
        }

        for (uint8 i = 0; i < 5; i++) {
            communityCards[i] = deckContract.drawCard();
        }

        emit CardsDealt();
    }

    function raiseBet(uint256 amount) external onlyAIPlayers {
        Player storage player = players[msg.sender];
        require(amount > currentBet, "Raise must be higher than current bet");
        require(player.balance >= amount, "Insufficient balance to raise"); // ✅ Debugging step

        player.balance -= amount;
        player.betAmount += amount;
        aiPot += amount;
        currentBet = amount;

        emit BetPlaced(msg.sender, amount);
    }

    event DebugWinningAI(address winningAI);
    event DebugSpectatorPot(uint256 potAmount);

    event DebugAIWinnerSelection(address indexed ai, uint256 handRank);
    event DebugSpectatorCheck(address spectator, address betOnAI, bool isMatch);
    event DebugFinalWinner(address winningAI, address winningSpectator, uint256 spectatorWinnings);

    function declareWinner() external {
        require(gameStarted, "Game has not started");

        address winningAI;
        uint256 highestRank = 0;

        // Determine AI winner
        for (uint8 i = 0; i < playerAddresses.length; i++) {
            address aiAddr = playerAddresses[i];

            Player memory player = players[aiAddr];
            if (player.hasFolded) continue;

            uint8[7] memory fullHand = [
                player.holeCards[0], player.holeCards[1], 
                communityCards[0], communityCards[1], communityCards[2], communityCards[3], communityCards[4]
            ];
            uint8[5] memory bestFiveCardHand;
            (bestFiveCardHand, ) = PokerHandEvaluator.findBestFiveCardHand(fullHand);
            uint256 handRank = uint256(PokerHandEvaluator.evaluateHand(bestFiveCardHand).rank);

            emit DebugAIWinnerSelection(aiAddr, handRank);

            if (handRank > highestRank) {
                highestRank = handRank;
                winningAI = player.addr;
            }
        }

        emit DebugFinalWinner(winningAI, address(0), 0);

        // Distribute AI pot as fake balance
        players[winningAI].balance += aiPot;
        aiPot = 0;
        emit WinnerDeclared(winningAI, players[winningAI].balance);

        // Determine winning spectator
        address winningSpectator;
        uint256 spectatorWinnings = 0;

        for (uint8 i = 0; i < spectatorAddresses.length; i++) {
            address spectatorAddr = spectatorAddresses[i];
            bool isMatch = (spectatorBets[spectatorAddr] == winningAI);

            emit DebugSpectatorCheck(spectatorAddr, spectatorBets[spectatorAddr], isMatch);

            if (isMatch) {
                winningSpectator = spectatorAddr;
                spectatorWinnings = spectatorPot;
                break;
            }
        }

        emit DebugFinalWinner(winningAI, winningSpectator, spectatorWinnings);

        if (spectatorWinnings > 0) {
            (bool success, ) = payable(winningSpectator).call{value: spectatorWinnings}("");
            require(success, "Failed to transfer winnings to spectator");
            emit SpectatorWinningsPaid(winningSpectator, spectatorWinnings);
        }

        spectatorPot = 0;
        resetGame();
    }







    function getSpectatorCount() public view returns (uint256) {
        return spectatorAddresses.length;
    }


    function getAIBalances() public view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](playerAddresses.length);

        for (uint8 i = 0; i < playerAddresses.length; i++) {
            balances[i] = players[playerAddresses[i]].balance;
        }

        return balances;
    }


    function callBet() external onlyAIPlayers {
        Player storage player = players[msg.sender];
        require(player.balance >= currentBet, "Insufficient balance to call");
        player.balance -= currentBet;
        player.betAmount += currentBet;
        aiPot += currentBet;
        emit BetPlaced(msg.sender, currentBet);
    }

    function fold() external onlyAIPlayers {
        players[msg.sender].hasFolded = true;
        emit PlayerFolded(msg.sender);
    }

    function resetGame() internal {
        gameStarted = false;
        aiPot = 0;
        spectatorPot = 0;
        delete communityCards;

        // Reset all AI players
        for (uint8 i = 0; i < playerAddresses.length; i++) {
            address playerAddr = playerAddresses[i];
            delete players[playerAddr]; // ✅ Completely remove player from mapping
        }
        delete playerAddresses; // ✅ Fully clear AI players list

        // Reset all spectators
        for (uint8 i = 0; i < spectatorAddresses.length; i++) {
            address spectator = spectatorAddresses[i];
            delete spectators[spectator]; // ✅ Completely remove spectator from mapping
            delete spectatorBets[spectator]; // ✅ Remove their bet mapping
        }
        delete spectatorAddresses; // ✅ Fully remove spectator tracking array

        emit GameReset();
    }

    function getCommunityCards() external view returns (uint8[5] memory) {
        return communityCards;
    }

    function getHighestBet() public view returns (uint256) {
        uint256 highest = 0;
        for (uint8 i = 0; i < playerAddresses.length; i++) {
            if (players[playerAddresses[i]].betAmount > highest) {
                highest = players[playerAddresses[i]].betAmount;
            }
        }
        return highest;
    }

    function getHoleCards() external view returns (uint8[2] memory) {
        require(players[msg.sender].addr != address(0), "AI player not found");
        return players[msg.sender].holeCards;
    }

    function getPlayerBet(address player) external view returns (uint256) {
        return players[player].betAmount;
    }

    function hardReset() external {
        // Refund all spectator bets
        for (uint i = 0; i < spectatorAddresses.length; i++) {
            address spectator = spectatorAddresses[i];
            uint256 betAmount = spectators[spectator].betAmount; // Get the bet amount

            if (betAmount > 0) {
                (bool success, ) = payable(spectator).call{value: betAmount}("");
                require(success, "Refund failed for spectator");
                
                spectators[spectator].betAmount = 0; // Reset their bet amount
            }
        }

        // Clear spectator tracking
        delete spectatorAddresses;

        resetGame(); // Reset the rest of the game state

        
    }

    function getAllSpectatorAddresses() external view returns (address[] memory) {
    return spectatorAddresses;
}
}




