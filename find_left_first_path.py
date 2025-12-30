#!/usr/bin/env python3
"""
Najdi pot ki NAJPREJ počisti levo polovico (a-d), potem desno (e-h)
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

def score_left_first(path):
    """
    Oceni pot - preferenca za najprej levo (a-d), potem desno (e-h)
    Nižji score = boljša pot
    """
    score = 0

    # Preštej kdaj gre iz leve na desno in nazaj
    cols = [m['col'] for m in path]

    # Kazen za zgodnje obiske na desni strani
    for i, col in enumerate(cols[:20]):  # Prvih 20 korakov
        if col >= 4:  # Desna polovica (e-h)
            # Večja kazen če gre prezgodaj na desno
            early_penalty = (20 - i) * 2
            score += early_penalty

    # Bonus če ostane na levi dolgo časa
    left_count_first_half = sum(1 for c in cols[:15] if c < 4)
    score -= left_count_first_half * 3  # BONUS

    # Kazen za preklapljanje levo-desno-levo
    transitions = 0
    for i in range(len(cols) - 1):
        curr_side = 'left' if cols[i] < 4 else 'right'
        next_side = 'left' if cols[i+1] < 4 else 'right'
        if curr_side != next_side:
            transitions += 1

    # Idealno: 1 prehod (levo → desno)
    if transitions > 2:
        score += (transitions - 1) * 5

    return score

def describe_left_right_pattern(path):
    """Opiši kako se giblje med levo in desno"""
    cols = [m['col'] for m in path]

    # Analiziraj prve 3 tretjine
    first_third = cols[:10]
    second_third = cols[10:20]
    last_third = cols[20:]

    left_first = sum(1 for c in first_third if c < 4)
    left_second = sum(1 for c in second_third if c < 4)
    left_third = sum(1 for c in last_third if c < 4)

    total_left = sum(1 for c in cols if c < 4)

    if left_first >= 8 and left_second >= 7:
        return f"LEVO najprej ({total_left}/31 levo skupaj) ✓"
    elif left_first >= 7:
        return f"Večinoma levo na začetku ({total_left}/31 levo)"
    else:
        return f"Mešano ({total_left}/31 levo)"

def chess_notation(row, col):
    return chr(ord('a') + col) + str(8 - row)

print("="*70)
print("ISKANJE POTI: NAJPREJ LEVO (a-d), POTEM DESNO (e-h)")
print("="*70)
print()

# Najdi prvih 50 popolnih poti
perfect_paths = []
max_paths = 50

def search(board, pos, path, captured):
    if len(perfect_paths) >= max_paths:
        return

    row, col = pos
    valid_moves = get_valid_moves(row, col)
    capture_moves = [(nr, nc) for nr, nc in valid_moves if board[nr][nc] is not None]

    if not capture_moves:
        if captured == 31:
            perfect_paths.append(list(path))
            if len(perfect_paths) % 10 == 0:
                print(f"  Našel {len(perfect_paths)} popolnih poti...")
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
    score = score_left_first(path)
    pattern = describe_left_right_pattern(path)
    scored_paths.append({
        'path': path,
        'score': score,
        'pattern': pattern,
        'index': i
    })

# Razvrsti po score (nižji = boljši)
scored_paths.sort(key=lambda x: x['score'])

print("="*70)
print("TOP 10 POTI Z VZORCEM 'LEVO NAJPREJ':")
print("="*70)
print()

for i, item in enumerate(scored_paths[:10], 1):
    print(f"#{i}: {item['pattern']}")
    print(f"    Score: {item['score']:.1f}")

    # Prikaži prvih 10 korakov
    first_moves = [chess_notation(m['row'], m['col']) for m in item['path'][:10]]
    print(f"    Prvih 10: a1 → {' → '.join(first_moves)}")

    # Prikaži stolpce po korakih
    cols = [m['col'] for m in item['path']]
    col_names = [chr(ord('a') + c) for c in cols[:15]]
    print(f"    Stolpci (prvih 15): {' '.join(col_names)}")
    print()

# Izberi najboljšo pot
best_path = scored_paths[0]

print("="*70)
print(f"NAJBOLJŠA POT ZA P6: {best_path['pattern']}")
print(f"Score: {best_path['score']:.1f}")
print("="*70)
print()

# Shrani P6 pot
output = {
    'p6_path': best_path['path'],
    'pattern': best_path['pattern'],
    'score': best_path['score']
}

with open('p6_path.json', 'w') as f:
    json.dump(output, f, indent=2)

print("✓ Pot P6 shranjena v p6_path.json")
print()
print("Preverjam pot P6:")
print("-" * 70)

# Izpiši celotno pot v človeško berljivi obliki
path_cols = [m['col'] for m in best_path['path']]
col_letters = [chr(ord('a') + c) for c in path_cols]

print("Celotna pot (po stolpcih):")
for i in range(0, len(col_letters), 10):
    chunk = col_letters[i:i+10]
    print(f"  {i+1:2d}-{min(i+10, len(col_letters)):2d}: {' '.join(chunk)}")

print()
print("Analiza:")
left_count = sum(1 for c in path_cols if c < 4)
right_count = sum(1 for c in path_cols if c >= 4)
print(f"  Levo (a-d): {left_count} korakov")
print(f"  Desno (e-h): {right_count} korakov")

# Kdaj prvič gre na desno?
first_right = next((i for i, c in enumerate(path_cols) if c >= 4), None)
if first_right:
    print(f"  Prvi obisk desne strani: korak #{first_right + 1}")
