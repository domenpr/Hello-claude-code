#!/usr/bin/env python3
"""
Analiza branching factor-ja (povprečno število možnih potez na korak)
"""

def get_valid_moves(row, col):
    """Knight moves in L-shape"""
    moves = [
        (-2, -1), (-2, 1), (-1, -2), (-1, 2),
        (1, -2), (1, 2), (2, -1), (2, 1)
    ]
    valid = []
    for dr, dc in moves:
        nr, nc = row + dr, col + dc
        if 0 <= nr < 8 and 0 <= nc < 8:
            valid.append((nr, nc))
    return valid

def init_board():
    """Initialize board with pieces in rows 4-7"""
    board = [[None for _ in range(8)] for _ in range(8)]

    # Row 4 (a4-h4): pawns
    for col in range(8):
        board[4][col] = 'PAWN'

    # Row 5 (a5-h5): pawns
    for col in range(8):
        board[5][col] = 'PAWN'

    # Row 6 (a6-h6): rooks, knights, bishops, queen, king
    pieces = ['ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING', 'BISHOP', 'KNIGHT', 'ROOK']
    for col, piece in enumerate(pieces):
        board[6][col] = piece

    # Row 7 (a7-h7): similar
    pieces = ['ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING', 'BISHOP', 'KNIGHT', 'ROOK']
    for col, piece in enumerate(pieces):
        board[7][col] = piece

    # Knight starts at a1 (row 7, col 0) - wait, that's wrong
    # Let me fix: a1 in chess notation is actually bottom-left
    # In my coordinate system: row 7, col 0
    board[7][0] = 'KNIGHT'

    return board

def analyze_branching_factor():
    """Analyze average branching factor at different stages"""
    board = init_board()

    print("="*70)
    print("ANALIZA BRANCHING FACTOR-JA")
    print("="*70)
    print()

    # Count pieces in capture zone (rows 4-7)
    total_positions = 0
    capture_counts = []

    # Sample from each row
    for row in range(4, 8):
        for col in range(8):
            if board[row][col] is not None:
                total_positions += 1
                valid_moves = get_valid_moves(row, col)
                captures = sum(1 for nr, nc in valid_moves if board[nr][nc] is not None)
                capture_counts.append(captures)
                print(f"Pozicija ({row},{col}): {captures} možnih captures")

    print()
    print("="*70)
    print(f"STATISTIKA:")
    print(f"  Povprečen branching factor: {sum(capture_counts)/len(capture_counts):.2f}")
    print(f"  Minimum: {min(capture_counts)}")
    print(f"  Maximum: {max(capture_counts)}")
    print()

    # Rough estimate of total paths
    avg_bf = sum(capture_counts) / len(capture_counts)
    print(f"GROBA OCENA:")
    print(f"  Če povprečen BF = {avg_bf:.2f}")
    print(f"  In povprečna globina = 20 korakov (večina poti ne doseže 31)")
    print(f"  Približno število poti = {avg_bf:.2f}^20 = {avg_bf**20:,.0f}")
    print()
    print("OPOMBA: To je ZELO groba ocena, ker se BF spreminja.")
    print("Začetek igre ima manjši BF, sredina večji, konec spet manjši.")

if __name__ == "__main__":
    analyze_branching_factor()
