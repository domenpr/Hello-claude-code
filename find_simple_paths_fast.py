#!/usr/bin/env python3
"""
Hitro najdi 5 najlažjih za zapomniti poti
Strategija: Najdi prvih 30 popolnih poti, izberi 5 najboljših
"""
import json

def get_valid_moves(row, col):
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
    board = [[None for _ in range(8)] for _ in range(8)]
    for col in range(8):
        board[4][col] = 'PAWN'
        board[5][col] = 'PAWN'
    pieces = ['ROOK', 'KNIGHT', 'BISHOP', 'QUEEN', 'KING', 'BISHOP', 'KNIGHT', 'ROOK']
    for col, piece in enumerate(pieces):
        board[6][col] = piece
        board[7][col] = piece
    board[7][0] = 'KNIGHT'
    return board

def score_path_simplicity(path):
    """Oceni pot - nižji score = enostavnejša"""
    score = 0

    # 1. Horizontalni skoki (velik premik levo-desno)
    for i in range(len(path) - 1):
        col_diff = abs(path[i]['col'] - path[i+1]['col'])
        if col_diff > 3:
            score += col_diff * 10

    # 2. Spremembe smeri (levo-desno-levo itd.)
    col_changes = []
    for i in range(len(path) - 1):
        col_changes.append(path[i+1]['col'] - path[i]['col'])

    direction_changes = 0
    for i in range(len(col_changes) - 1):
        if (col_changes[i] > 0 and col_changes[i+1] < 0) or \
           (col_changes[i] < 0 and col_changes[i+1] > 0):
            direction_changes += 1
    score += direction_changes * 3

    # 3. Sistematičnost - preveri ali ostaja v istem območju
    cols = [m['col'] for m in path]
    first_half_avg = sum(cols[:15]) / 15
    second_half_avg = sum(cols[15:]) / len(cols[15:])

    # Bonus če ostaja v istem območju
    if abs(first_half_avg - second_half_avg) < 2:
        score -= 10  # BONUS za sistematičnost

    # 4. Range - koliko stolpcev pokriva
    col_range = max(cols) - min(cols)
    if col_range <= 3:
        score -= 5  # BONUS za osredotočenost na manjše območje

    return score

def describe_path_pattern(path):
    """Opiši vzorec poti"""
    cols = [m['col'] for m in path]

    # Analiziraj začetek, sredino, konec
    start_cols = cols[:10]
    mid_cols = cols[10:21]
    end_cols = cols[21:]

    avg_start = sum(start_cols) / len(start_cols)
    avg_mid = sum(mid_cols) / len(mid_cols)
    avg_end = sum(end_cols) / len(end_cols)

    # Določi vzorec
    if avg_start < 2.5 and avg_mid < 3 and avg_end < 3:
        return "Ostane na LEVI strani (stolpci a-c)"
    elif avg_start > 5 and avg_mid > 5 and avg_end > 5:
        return "Ostane na DESNI strani (stolpci f-h)"
    elif avg_start < 3 and avg_end > 5:
        return "Od LEVE proti DESNI (a-c → f-h)"
    elif avg_start > 5 and avg_end < 3:
        return "Od DESNE proti LEVI (f-h → a-c)"
    elif max(cols) - min(cols) <= 3:
        if avg_start < 4:
            return "Osredotočen na LEVO polovico"
        else:
            return "Osredotočen na DESNO polovico"
    else:
        return "Mešano gibanje po celotni šahovnici"

def chess_notation(row, col):
    """Pretvori row,col v šahovsko notacijo (a1-h8)"""
    return chr(ord('a') + col) + str(8 - row)

print("="*70)
print("ISKANJE 5 NAJLAŽJIH POTI - HITRA VERZIJA")
print("="*70)
print()

# Najdi prvih 30 popolnih poti
perfect_paths = []
max_paths = 30

def search(board, pos, path, captured):
    if len(perfect_paths) >= max_paths:
        return

    row, col = pos
    valid_moves = get_valid_moves(row, col)
    capture_moves = [(nr, nc) for nr, nc in valid_moves if board[nr][nc] is not None]

    if not capture_moves:
        if captured == 31:
            perfect_paths.append(list(path))
            print(f"  ✓ Našel popolno pot #{len(perfect_paths)}")
        return

    for move in capture_moves:
        if len(perfect_paths) >= max_paths:
            return

        nr, nc = move
        saved_piece = board[nr][nc]
        board[row][col] = None
        board[nr][nc] = 'KNIGHT'
        path.append({'row': nr, 'col': nc})

        search(board, (nr, nc), path, captured + 1)

        path.pop()
        board[nr][nc] = saved_piece
        board[row][col] = 'KNIGHT'

print(f"Iščem prvih {max_paths} popolnih poti...")
board = init_board()
search(board, (7, 0), [], 0)
print(f"\n✓ Našel {len(perfect_paths)} popolnih poti\n")

# Oceni vse poti
scored_paths = []
for i, path in enumerate(perfect_paths):
    score = score_path_simplicity(path)
    pattern = describe_path_pattern(path)
    scored_paths.append({
        'path': path,
        'score': score,
        'pattern': pattern,
        'index': i
    })

# Razvrsti po score (nižji = boljši)
scored_paths.sort(key=lambda x: x['score'])

# Izberi top 5
top_5 = scored_paths[:5]

print("="*70)
print("TOP 5 NAJLAŽJIH POTI ZA ZAPOMNITI:")
print("="*70)
print()

for i, item in enumerate(top_5, 1):
    print(f"P{i}: {item['pattern']}")
    print(f"    Score: {item['score']:.1f} (nižji = lažji)")

    # Prikaži prvih 5 korakov v šahovski notaciji
    first_moves = [chess_notation(m['row'], m['col']) for m in item['path'][:5]]
    print(f"    Prvi koraki: a1 → {' → '.join(first_moves)}")
    print()

# Shrani v JSON
output = {
    'top_5_simple_paths': [
        {
            'id': f'P{i}',
            'pattern': item['pattern'],
            'score': item['score'],
            'path': item['path']
        }
        for i, item in enumerate(top_5, 1)
    ]
}

with open('simple_paths.json', 'w') as f:
    json.dump(output, f, indent=2)

print("✓ Shranjeno v simple_paths.json")
print()
print("Sedaj dodajam v HTML...")
