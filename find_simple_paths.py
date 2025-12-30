#!/usr/bin/env python3
"""
Najdi 5 najlažjih za zapomniti popolnih poti
Kriteriji:
- Sistematičnost (ne skakati naokrog)
- Minimalni premiki levo-desno
- Jasen vzorec (čistimo od leve proti desni, ali spodaj-zgoraj)
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
    """
    Oceni pot po enostavnosti zapomnitve
    Nižji score = enostavnejša pot
    """
    score = 0

    # 1. Horizontalni premiki (levo-desno jumping)
    horizontal_jumps = 0
    for i in range(len(path) - 1):
        col_diff = abs(path[i]['col'] - path[i+1]['col'])
        if col_diff > 3:  # Velik skok levo-desno
            horizontal_jumps += col_diff
    score += horizontal_jumps * 10  # Penalizacija za skakanje

    # 2. Vračanje nazaj (obiskal področje, potem se vrnil)
    backtracking = 0
    for i in range(2, len(path)):
        # Preveri, če se vračamo v isto kolono kot prej
        cols = [path[j]['col'] for j in range(max(0, i-5), i)]
        if path[i]['col'] in cols:
            backtracking += 1
    score += backtracking * 5

    # 3. Razpršenost po stolpcih (range)
    cols_visited = [move['col'] for move in path]
    col_span = max(cols_visited) - min(cols_visited)
    score += col_span * 2

    # 4. Sistematičnost - preveri trend gibanja
    # Idealno: najprej levo, potem desno (ali obratno)
    col_changes = []
    for i in range(len(path) - 1):
        col_changes.append(path[i+1]['col'] - path[i]['col'])

    # Štetje sprememb smeri (levo/desno)
    direction_changes = 0
    for i in range(len(col_changes) - 1):
        if (col_changes[i] > 0 and col_changes[i+1] < 0) or \
           (col_changes[i] < 0 and col_changes[i+1] > 0):
            direction_changes += 1
    score += direction_changes * 3

    # 5. Bonus za "čiščenje" od spodaj navzgor ali od leve proti desni
    # Preveri povprečno smer gibanja
    avg_col_trend = sum(col_changes) / len(col_changes) if col_changes else 0
    if abs(avg_col_trend) < 0.1:
        score += 20  # Penalizacija če ni jasnega trenda

    return score

def find_all_perfect_paths():
    """Najdi vse popolne poti"""
    perfect_paths = []

    def search(board, pos, path, captured):
        if len(perfect_paths) % 100 == 0 and len(perfect_paths) > 0:
            print(f"  Našel {len(perfect_paths)} popolnih poti...")

        row, col = pos
        valid_moves = get_valid_moves(row, col)
        capture_moves = [(nr, nc) for nr, nc in valid_moves if board[nr][nc] is not None]

        if not capture_moves:
            if captured == 31:
                perfect_paths.append(list(path))
            return

        for move in capture_moves:
            nr, nc = move
            saved_piece = board[nr][nc]
            board[row][col] = None
            board[nr][nc] = 'KNIGHT'
            path.append({'row': nr, 'col': nc})

            search(board, (nr, nc), path, captured + 1)

            path.pop()
            board[nr][nc] = saved_piece
            board[row][col] = 'KNIGHT'

    print("Iščem vse popolne poti...")
    board = init_board()
    search(board, (7, 0), [], 0)
    print(f"✓ Našel {len(perfect_paths)} popolnih poti")

    return perfect_paths

def describe_path_pattern(path):
    """Opiši vzorec poti s človeškimi besedami"""
    cols = [m['col'] for m in path]
    rows = [m['row'] for m in path]

    # Analiziraj gibanje po stolpcih
    first_half_cols = cols[:15]
    second_half_cols = cols[15:]

    avg_first = sum(first_half_cols) / len(first_half_cols)
    avg_second = sum(second_half_cols) / len(second_half_cols)

    if avg_first < 2 and avg_second > 5:
        pattern = "Začne LEVO (a-c), konča DESNO (f-h)"
    elif avg_first > 5 and avg_second < 2:
        pattern = "Začne DESNO (f-h), konča LEVO (a-c)"
    elif avg_first < 3.5 and avg_second < 3.5:
        pattern = "Ostane na LEVI strani (a-d)"
    elif avg_first > 4 and avg_second > 4:
        pattern = "Ostane na DESNI strani (e-h)"
    else:
        pattern = "Mešano levo-desno"

    return pattern

# Glavna analiza
print("="*70)
print("ISKANJE 5 NAJLAŽJIH POTI ZA ZAPOMNITI")
print("="*70)
print()

perfect_paths = find_all_perfect_paths()
print()
print("Ocenjujem poti po enostavnosti...")
print()

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
print("TOP 5 NAJLAŽJIH POTI:")
print("="*70)
print()

for i, item in enumerate(top_5, 1):
    print(f"P{i}: {item['pattern']}")
    print(f"    Score: {item['score']:.1f} (nižji = boljši)")
    print(f"    Prvi koraki: {item['path'][:3]}")
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
