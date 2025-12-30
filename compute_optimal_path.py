#!/usr/bin/env python3
"""
Offline computation of optimal knight path for chess capture game.
Finds the perfect solution (31 captures, 0 remaining pieces).
"""

import json
from typing import List, Tuple, Optional
import time

# Knight move offsets
KNIGHT_MOVES = [
    (-2, -1), (-2, 1), (-1, -2), (-1, 2),
    (1, -2), (1, 2), (2, -1), (2, 1)
]

def initialize_board():
    """Initialize 8x8 board with pieces in rows 4-7 (bottom)."""
    board = [[None for _ in range(8)] for _ in range(8)]

    # Black pieces (rows 4-5)
    black_back_row = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
    for col in range(8):
        board[4][col] = black_back_row[col]
        board[5][col] = 'p'

    # White pieces (rows 6-7)
    for col in range(8):
        board[6][col] = 'P'

    white_back_row = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    for col in range(8):
        board[7][col] = white_back_row[col]

    # Knight at a1 (row 7, col 0)
    board[7][0] = 'KNIGHT'

    return board

def get_valid_moves(row: int, col: int) -> List[Tuple[int, int]]:
    """Get all valid knight moves from position."""
    valid_moves = []
    for dr, dc in KNIGHT_MOVES:
        new_row, new_col = row + dr, col + dc
        if 0 <= new_row < 8 and 0 <= new_col < 8:
            valid_moves.append((new_row, new_col))
    return valid_moves

def count_onward_captures(board, row: int, col: int) -> int:
    """Count how many captures are possible from this position."""
    count = 0
    for nr, nc in get_valid_moves(row, col):
        if board[nr][nc] is not None:
            count += 1
    return count

def backtrack(board, pos: Tuple[int, int], path: List[Tuple[int, int]],
              captured: int, best_result: dict, iterations: dict,
              start_time: float, prev_pos: Optional[Tuple[int, int]] = None) -> bool:
    """
    Backtracking with Warnsdorff's heuristic.
    Returns True if perfect solution found or timeout.
    """
    iterations['count'] += 1
    row, col = pos

    # Progress update every 100k iterations
    if iterations['count'] % 100000 == 0:
        elapsed = time.time() - start_time
        print(f"🔍 Iterations: {iterations['count']:,} | Best: {best_result['score']} captures | Time: {elapsed:.1f}s")

    # Update best if better
    if captured > best_result['score']:
        best_result['score'] = captured
        best_result['path'] = path.copy()
        print(f"🎯 NEW BEST: {captured} captures ({iterations['count']:,} iterations)")

        # Perfect solution!
        if captured == 31:
            print("🏆 PERFECT SOLUTION FOUND!")
            return True

    # Get capture moves only
    capture_moves = []
    for nr, nc in get_valid_moves(row, col):
        if board[nr][nc] is not None:
            capture_moves.append((nr, nc))

    if not capture_moves:
        return False

    # Sort by Warnsdorff's heuristic (fewest onward captures first)
    capture_moves.sort(key=lambda pos: count_onward_captures(board, pos[0], pos[1]))

    # Try each move
    for move in capture_moves:
        nr, nc = move
        saved_piece = board[nr][nc]

        # Make move: place knight on new position and clear old position
        board[row][col] = None  # Always clear current position
        board[nr][nc] = 'KNIGHT'
        path.append({'row': nr, 'col': nc})

        # Recurse
        result = backtrack(board, (nr, nc), path, captured + 1,
                          best_result, iterations, start_time, prev_pos=pos)

        # Undo move: restore piece and knight position
        board[nr][nc] = saved_piece
        board[row][col] = 'KNIGHT'  # Always restore knight to old position
        path.pop()

        # Early exit if perfect found
        if result:
            return True

    return False

def find_optimal_path():
    """Main function to find optimal path."""
    print("=" * 60)
    print("🚀 Starting offline optimal path computation")
    print("=" * 60)

    board = initialize_board()
    start_pos = (7, 0)  # a1

    best_result = {'score': 0, 'path': []}
    iterations = {'count': 0}
    start_time = time.time()

    print(f"📍 Starting position: a1 (row 7, col 0)")
    print(f"🎯 Target: 31 captures (0 remaining pieces)")
    print(f"⏱️  Starting computation...\n")

    # Run backtracking
    backtrack(board, start_pos, [], 0, best_result, iterations, start_time)

    elapsed = time.time() - start_time

    print("\n" + "=" * 60)
    print("✅ COMPUTATION COMPLETE")
    print("=" * 60)
    print(f"📊 Best result: {best_result['score']} captures")
    print(f"📉 Remaining pieces: {31 - best_result['score']}")
    print(f"🔢 Total iterations: {iterations['count']:,}")
    print(f"⏱️  Time: {elapsed:.1f}s ({elapsed/60:.1f} minutes)")
    print("=" * 60)

    # Output JavaScript array
    print("\n📝 JavaScript array for HTML (copy this):\n")
    print("const OPTIMAL_PATH = [")
    for i, move in enumerate(best_result['path']):
        comma = "," if i < len(best_result['path']) - 1 else ""
        print(f"    {{row: {move['row']}, col: {move['col']}}}{comma}")
    print("];")

    # Save to file
    with open('optimal_path.json', 'w') as f:
        json.dump(best_result['path'], f, indent=2)
    print(f"\n💾 Path saved to: optimal_path.json")
    print(f"📏 Path length: {len(best_result['path'])} moves\n")

    return best_result['path']

if __name__ == "__main__":
    find_optimal_path()
