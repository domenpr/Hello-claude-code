#!/usr/bin/env python3
"""
Obsežno iskanje: Preveri VSE začetne možnosti in najdi najboljšo 'levo-prvo' pot
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

def find_all_perfect_paths_limited(max_paths=200):
    """Najdi prvih 200 popolnih poti"""
    perfect_paths = []

    def search(board, pos, path, captured):
        if len(perfect_paths) >= max_paths:
            return

        row, col = pos
        valid_moves = get_valid_moves(row, col)
        capture_moves = [(nr, nc) for nr, nc in valid_moves if board[nr][nc] is not None]

        if not capture_moves:
            if captured == 31:
                perfect_paths.append(list(path))
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

    board = init_board()
    search(board, (7, 0), [], 0)
    return perfect_paths

def analyze_left_concentration(path):
    """
    Analiziraj kako dolgo ostane na levi strani
    Vrne score - višji = boljši za 'levo najprej'
    """
    cols = [m['col'] for m in path]

    # 1. Kdaj prvič gre na desno?
    first_right = next((i for i, c in enumerate(cols) if c >= 4), 31)

    # 2. Koliko korakov na levi v prvih 20 korakih?
    left_in_first_20 = sum(1 for c in cols[:20] if c < 4)

    # 3. Koliko prehodov levo-desno?
    transitions = 0
    for i in range(len(cols) - 1):
        curr_side = cols[i] < 4
        next_side = cols[i+1] < 4
        if curr_side != next_side:
            transitions += 1

    # 4. Najdaljši neprekinjeni niz na levi
    max_left_streak = 0
    current_streak = 0
    for c in cols:
        if c < 4:
            current_streak += 1
            max_left_streak = max(max_left_streak, current_streak)
        else:
            current_streak = 0

    # Compute score
    score = 0
    score += first_right * 10  # Veliko pomembno
    score += left_in_first_20 * 5
    score -= transitions * 3
    score += max_left_streak * 8

    return {
        'score': score,
        'first_right': first_right,
        'left_in_first_20': left_in_first_20,
        'transitions': transitions,
        'max_left_streak': max_left_streak
    }

def chess_notation(row, col):
    return chr(ord('a') + col) + str(8 - row)

print("="*70)
print("OBSEŽNO ISKANJE - Najbolǰša 'LEVO NAJPREJ' pot")
print("="*70)
print()

print("Iščem prvih 200 popolnih poti...")
paths = find_all_perfect_paths_limited(200)
print(f"✓ Našel {len(paths)} popolnih poti")
print()

print("Analiziram vse poti...")
analyzed = []
for path in paths:
    analysis = analyze_left_concentration(path)
    analyzed.append({
        'path': path,
        'analysis': analysis
    })

# Razvrsti po score
analyzed.sort(key=lambda x: x['analysis']['score'], reverse=True)

print("="*70)
print("TOP 5 POTI Z NAJBOLJŠO 'LEVO NAJPREJ' STRATEGIJO:")
print("="*70)
print()

for i, item in enumerate(analyzed[:5], 1):
    path = item['path']
    anal = item['analysis']
    cols = [m['col'] for m in path]
    col_letters = [chr(ord('a') + c) for c in cols]

    print(f"#{i} - Score: {anal['score']}")
    print(f"    Prvi obisk desne: korak #{anal['first_right'] + 1}")
    print(f"    Levo v prvih 20: {anal['left_in_first_20']}/20")
    print(f"    Prehodi levo-desno: {anal['transitions']}")
    print(f"    Najdaljši niz levo: {anal['max_left_streak']} korakov")
    print(f"    Prvih 15: {' '.join(col_letters[:15])}")
    print()

# Izberi najboljšo
best = analyzed[0]
best_path = best['path']
best_anal = best['analysis']

print("="*70)
print("IZBRANA POT ZA P6:")
print("="*70)
print()

cols = [m['col'] for m in best_path]
col_letters = [chr(ord('a') + c) for c in cols]

print("Celotna pot (po stolpcih):")
for i in range(0, len(col_letters), 10):
    chunk = col_letters[i:i+10]
    print(f"  {i+1:2d}-{min(i+10, len(col_letters)):2d}: {' '.join(chunk)}")

print()
print("Ključne značilnosti:")
print(f"  ✓ Prvi obisk desne strani: korak #{best_anal['first_right'] + 1}")
print(f"  ✓ V prvih 20 korakih: {best_anal['left_in_first_20']} levo, {20 - best_anal['left_in_first_20']} desno")
print(f"  ✓ Najdaljši niz na levi: {best_anal['max_left_streak']} korakov zapored")

# Shrani
output = {
    'p6_path': best_path,
    'score': best_anal['score'],
    'stats': {
        'first_right_step': best_anal['first_right'] + 1,
        'left_in_first_20': best_anal['left_in_first_20'],
        'transitions': best_anal['transitions'],
        'max_left_streak': best_anal['max_left_streak']
    }
}

with open('p6_path.json', 'w') as f:
    json.dump(output, f, indent=2)

print()
print("✓ Pot P6 shranjena v p6_path.json")
