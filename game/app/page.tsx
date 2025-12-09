"use client";

import { useState, useCallback } from "react";

type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];
type WinLine = [number, number, number] | null;

const WINNING_COMBINATIONS: [number, number, number][] = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left column
  [1, 4, 7], // middle column
  [2, 5, 8], // right column
  [0, 4, 8], // diagonal top-left to bottom-right
  [2, 4, 6], // diagonal top-right to bottom-left
];

function checkWinner(board: Board): { winner: Player | null; line: WinLine } {
  for (const [a, b, c] of WINNING_COMBINATIONS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return { winner: null, line: null };
}

function isDraw(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

function Square({
  value,
  onClick,
  disabled,
  isWinning,
}: {
  value: Cell;
  onClick: () => void;
  disabled: boolean;
  isWinning: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        aspect-square w-full
        border border-[var(--border)]
        bg-[var(--background)]
        text-4xl sm:text-5xl md:text-6xl font-light
        transition-all duration-150
        hover:bg-[var(--border)]/30
        disabled:cursor-not-allowed
        flex items-center justify-center
        ${isWinning ? "bg-[var(--accent)]/10" : ""}
        ${value ? "cursor-default" : "cursor-pointer"}
      `}
      aria-label={value ? `Square ${value}` : "Empty square"}
    >
      {value && (
        <span
          className={`animate-fade-in ${
            value === "X" ? "text-[var(--x-color)]" : "text-[var(--o-color)]"
          }`}
        >
          {value}
        </span>
      )}
    </button>
  );
}

function Board({
  board,
  onCellClick,
  disabled,
  winLine,
}: {
  board: Board;
  onCellClick: (index: number) => void;
  disabled: boolean;
  winLine: WinLine;
}) {
  return (
    <div className="grid grid-cols-3 gap-0 w-full max-w-[280px] sm:max-w-[320px] md:max-w-[360px] border border-[var(--border)] rounded-lg overflow-hidden shadow-sm">
      {board.map((cell, index) => (
        <Square
          key={index}
          value={cell}
          onClick={() => onCellClick(index)}
          disabled={disabled || cell !== null}
          isWinning={winLine?.includes(index) ?? false}
        />
      ))}
    </div>
  );
}

function PlayerIndicator({
  player,
  isCurrentTurn,
  score,
}: {
  player: Player;
  isCurrentTurn: boolean;
  score: number;
}) {
  const color = player === "X" ? "var(--x-color)" : "var(--o-color)";

  return (
    <div
      className={`
        flex flex-col items-center gap-1 px-5 py-3 rounded-lg
        transition-all duration-200
        ${isCurrentTurn ? "bg-[var(--border)]/50" : "opacity-50"}
      `}
    >
      <span
        className={`text-3xl sm:text-4xl font-light ${isCurrentTurn ? "animate-pulse-slow" : ""}`}
        style={{ color }}
      >
        {player}
      </span>
      <span className="text-sm text-[var(--muted)] font-mono">{score} wins</span>
    </div>
  );
}

export default function Game() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [gameOver, setGameOver] = useState(false);

  const { winner, line: winLine } = checkWinner(board);
  const draw = !winner && isDraw(board);

  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || gameOver) return;

      const newBoard = [...board];
      newBoard[index] = currentPlayer;
      setBoard(newBoard);

      const { winner: newWinner } = checkWinner(newBoard);
      if (newWinner) {
        setScores((prev) => ({ ...prev, [newWinner]: prev[newWinner] + 1 }));
        setGameOver(true);
      } else if (isDraw(newBoard)) {
        setGameOver(true);
      } else {
        setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
      }
    },
    [board, currentPlayer, gameOver]
  );

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer(winner || "X");
    setGameOver(false);
  }, [winner]);

  const resetAll = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setScores({ X: 0, O: 0 });
    setGameOver(false);
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <main className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Tic Tac Toe
          </h1>
          <p className="text-sm text-[var(--muted)]">Two Player Game</p>
        </div>

        {/* Score Board */}
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <PlayerIndicator
            player="X"
            isCurrentTurn={!gameOver && currentPlayer === "X"}
            score={scores.X}
          />
          <div className="text-[var(--muted)] text-lg">vs</div>
          <PlayerIndicator
            player="O"
            isCurrentTurn={!gameOver && currentPlayer === "O"}
            score={scores.O}
          />
        </div>

        {/* Game Status */}
        <div className="h-6 flex items-center justify-center">
          {winner && (
            <p className="text-lg animate-slide-up">
              <span
                className="font-semibold"
                style={{
                  color:
                    winner === "X" ? "var(--x-color)" : "var(--o-color)",
                }}
              >
                Player {winner}
              </span>{" "}
              wins!
            </p>
          )}
          {draw && (
            <p className="text-lg text-[var(--muted)] animate-slide-up">
              It&apos;s a draw!
            </p>
          )}
        </div>

        {/* Game Board */}
        <Board
          board={board}
          onCellClick={handleCellClick}
          disabled={gameOver}
          winLine={winLine}
        />

        {/* Controls */}
        <div className="flex gap-4">
          <button
            onClick={resetGame}
            className="
              px-6 py-2.5 rounded-full
              border border-[var(--border)]
              text-sm font-medium
              transition-all duration-150
              hover:bg-[var(--border)]/50
              hover:border-[var(--foreground)]/30
            "
          >
            New Game
          </button>
          <button
            onClick={resetAll}
            className="
              px-6 py-2.5 rounded-full
              bg-[var(--foreground)]
              text-[var(--background)]
              text-sm font-medium
              transition-all duration-150
              hover:opacity-80
            "
          >
            Reset All
          </button>
        </div>

        {/* Footer */}
        <footer className="text-xs text-[var(--muted)]">
          <p>Click a square to play • X always goes first</p>
        </footer>
      </main>
    </div>
  );
}
