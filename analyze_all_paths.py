#!/usr/bin/env python3
"""
Count ALL possible paths for each result (0, 1, 2, 3 remaining pieces).
This is a complete enumeration - explores ALL possibilities.
"""

import json
from typing import List, Tuple, Dict
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

def count_all_paths(board, pos: Tuple[int, int], captured: int,
                    path_counts: Dict[int, int], iterations: dict,
                    start_time: float, depth: int = 0) -> None:
    """
    Count ALL possible paths and their results.
    Continues exploring even after finding solutions.
    """
    iterations['count'] += 1
    row, col = pos

    # Progress update every 1M iterations
    if iterations['count'] % 1000000 == 0:
        elapsed = time.time() - start_time
        print(f"📊 Iterations: {iterations['count']:,} | Time: {elapsed:.1f}s")
        print(f"   Current counts: {dict(sorted(path_counts.items(), reverse=True))}")

    # Get capture moves only
    capture_moves = []
    for nr, nc in get_valid_moves(row, col):
        if board[nr][nc] is not None:
            capture_moves.append((nr, nc))

    # If no more captures possible, record this path's result
    if not capture_moves:
        remaining = 31 - captured
        path_counts[remaining] = path_counts.get(remaining, 0) + 1

        # Log perfect solutions
        if remaining == 0:
            print(f"✨ Perfect path found! (Total: {path_counts[0]})")

        return

    # Try each move and count all resulting paths
    for move in capture_moves:
        nr, nc = move
        saved_piece = board[nr][nc]

        # Make move
        board[row][col] = None
        board[nr][nc] = 'KNIGHT'

        # Recurse
        count_all_paths(board, (nr, nc), captured + 1,
                       path_counts, iterations, start_time, depth + 1)

        # Undo move
        board[nr][nc] = saved_piece
        board[row][col] = 'KNIGHT'

def analyze_all_paths():
    """Main function to count all possible paths."""
    print("=" * 70)
    print("🔬 COMPLETE PATH ANALYSIS - Counting ALL Possible Paths")
    print("=" * 70)

    board = initialize_board()
    start_pos = (7, 0)  # a1

    path_counts = {}  # {remaining_pieces: count_of_paths}
    iterations = {'count': 0}
    start_time = time.time()

    print(f"📍 Starting position: a1 (row 7, col 0)")
    print(f"🎯 Counting ALL possible paths for each result")
    print(f"⏱️  Starting computation...\n")
    print(f"⚠️  WARNING: This may take SEVERAL MINUTES (exploring all paths)\n")

    # Count all paths
    count_all_paths(board, start_pos, 0, path_counts, iterations, start_time)

    elapsed = time.time() - start_time

    print("\n" + "=" * 70)
    print("✅ ANALYSIS COMPLETE")
    print("=" * 70)
    print(f"🔢 Total paths explored: {iterations['count']:,}")
    print(f"⏱️  Total time: {elapsed:.1f}s ({elapsed/60:.1f} minutes)")
    print("=" * 70)

    # Calculate total paths
    total_paths = sum(path_counts.values())
    print(f"\n📊 TOTAL DISTINCT PATHS: {total_paths:,}\n")

    # Sort by remaining pieces (best to worst)
    sorted_results = sorted(path_counts.items())

    print("🎯 RESULTS BY REMAINING PIECES:\n")
    for remaining, count in sorted_results:
        captures = 31 - remaining
        percentage = (count / total_paths) * 100
        quality = "🏆 PERFECT!" if remaining == 0 else \
                 "⭐ Excellent" if remaining == 1 else \
                 "✨ Very Good" if remaining == 2 else \
                 "👍 Good" if remaining == 3 else \
                 "🤔 Moderate"

        print(f"  {remaining} preostalih ({captures} captures): {count:,} poti ({percentage:.2f}%) {quality}")

    # Statistics
    if path_counts:
        best = min(path_counts.keys())
        worst = max(path_counts.keys())
        print(f"\n📈 STATISTICS:")
        print(f"  Best possible result: {best} preostalih ({31-best} captures)")
        print(f"  Worst result found: {worst} preostalih ({31-worst} captures)")

        # Average
        weighted_sum = sum(remaining * count for remaining, count in path_counts.items())
        avg_remaining = weighted_sum / total_paths
        print(f"  Average remaining: {avg_remaining:.2f} ({31-avg_remaining:.2f} captures)")

    # Save results
    results = {
        'total_paths': total_paths,
        'total_iterations': iterations['count'],
        'elapsed_seconds': elapsed,
        'path_counts': {str(k): v for k, v in sorted_results},
        'statistics': {
            'best': min(path_counts.keys()) if path_counts else None,
            'worst': max(path_counts.keys()) if path_counts else None,
            'average_remaining': weighted_sum / total_paths if total_paths > 0 else None
        }
    }

    with open('path_analysis.json', 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n💾 Results saved to: path_analysis.json\n")

    return path_counts

if __name__ == "__main__":
    analyze_all_paths()
