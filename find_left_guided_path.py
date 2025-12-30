#!/usr/bin/env python3
"""
VODENO iskanje: AKTIVNO preferira leve stolpce (a-d) dokler je možno
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

def guided_search_left_first(board, pos, path, captured, pieces_left_side, pieces_right_side):
    """
    Vodeno iskanje s prednostjo za levo stran
    """
    row, col = pos
    valid_moves = get_valid_moves(row, col)
    capture_moves = [(nr, nc) for nr, nc in valid_moves if board[nr][nc] is not None]

    # Terminal state
    if not capture_moves:
        if captured == 31:
            return {'path': list(path), 'success': True}
        return {'success': False}

    # Razvrsti capture možnosti po PRIORITETI
    # Prioriteta: NAJPREJ levo (a-d), šele potem desno (e-h)
    left_captures = [(r, c) for r, c in capture_moves if c < 4]
    right_captures = [(r, c) for r, c in capture_moves if c >= 4]

    # Če je na levi še več kot 3 figure, STROGO preferira levo
    if pieces_left_side > 3 and left_captures:
        moves_to_try = left_captures
    # Sicer poskusi vse, ampak levo najprej
    else:
        moves_to_try = left_captures + right_captures

    # Poskusi vse možnosti
    for nr, nc in moves_to_try:
        saved_piece = board[nr][nc]
        is_left = nc < 4

        board[row][col] = None
        board[nr][nc] = 'KNIGHT'
        path.append({'row': nr, 'col': nc})

        new_left = pieces_left_side - 1 if is_left else pieces_left_side
        new_right = pieces_right_side - 1 if not is_left else pieces_right_side

        result = guided_search_left_first(board, (nr, nc), path, captured + 1, new_left, new_right)

        if result['success']:
            return result

        # Undo
        path.pop()
        board[nr][nc] = saved_piece
        board[row][col] = 'KNIGHT'

    return {'success': False}

def count_pieces_by_side(board):
    """Preštej koliko figur je na levi (a-d) in desni (e-h)"""
    left = 0
    right = 0
    for row in range(4, 8):
        for col in range(8):
            if board[row][col] is not None:
                if col < 4:
                    left += 1
                else:
                    right += 1
    return left, right

def chess_notation(row, col):
    return chr(ord('a') + col) + str(8 - row)

print("="*70)
print("VODENO ISKANJE: AKTIVNA PREDNOST ZA LEVO STRAN (a-d)")
print("="*70)
print()

board = init_board()
left_pieces, right_pieces = count_pieces_by_side(board)

print(f"Začetno stanje:")
print(f"  Levo (a-d): {left_pieces} figur")
print(f"  Desno (e-h): {right_pieces} figur")
print()
print("Iščem pot ki NAJPREJ počisti levo...")
print()

result = guided_search_left_first(board, (7, 0), [], 0, left_pieces, right_pieces)

if result['success']:
    path = result['path']
    print("✓ NAŠEL POPOLNO POT!")
    print()

    # Analiza poti
    path_cols = [m['col'] for m in path]
    col_letters = [chr(ord('a') + c) for c in path_cols]

    print("="*70)
    print("POT P6 - 'LEVO NAJPREJ' STRATEGIJA")
    print("="*70)
    print()

    print("Celotna pot (po stolpcih):")
    for i in range(0, len(col_letters), 10):
        chunk = col_letters[i:i+10]
        print(f"  {i+1:2d}-{min(i+10, len(col_letters)):2d}: {' '.join(chunk)}")

    print()
    print("Prvi koraki (šahovna notacija):")
    first_10 = [chess_notation(m['row'], m['col']) for m in path[:10]]
    print(f"  a1 → {' → '.join(first_10)}")

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
        first_right_square = chess_notation(path[first_right]['row'], path[first_right]['col'])
        print(f"  Prvo desno polje: {first_right_square}")

    # Preveri ali se vrača nazaj na levo
    if first_right:
        returns_to_left = any(c < 4 for c in path_cols[first_right+1:])
        if returns_to_left:
            print(f"  ⚠️  Se vrača nazaj na levo po obisku desne!")
        else:
            print(f"  ✓ Ostane na desni po prvem obisku")

    # Shrani
    output = {
        'p6_path': path,
        'left_count': left_count,
        'right_count': right_count,
        'first_right_index': first_right
    }

    with open('p6_path.json', 'w') as f:
        json.dump(output, f, indent=2)

    print()
    print("✓ Pot P6 shranjena v p6_path.json")

else:
    print("✗ Nisem našel popolne poti z 'levo najprej' strategijo.")
    print("Poskušam manj striktno iskanje...")

    # Poskusi z manj striktnim kriterijem
    def relaxed_search(board, pos, path, captured, pieces_left):
        row, col = pos
        valid_moves = get_valid_moves(row, col)
        capture_moves = [(nr, nc) for nr, nc in valid_moves if board[nr][nc] is not None]

        if not capture_moves:
            if captured == 31:
                return {'path': list(path), 'success': True}
            return {'success': False}

        # Razvrsti: če je še 10+ figur levo, preferira levo
        left_captures = [(r, c) for r, c in capture_moves if c < 4]
        right_captures = [(r, c) for r, c in capture_moves if c >= 4]

        if pieces_left >= 10 and left_captures:
            moves_to_try = left_captures + right_captures
        else:
            moves_to_try = capture_moves

        for nr, nc in moves_to_try:
            saved_piece = board[nr][nc]
            is_left = nc < 4

            board[row][col] = None
            board[nr][nc] = 'KNIGHT'
            path.append({'row': nr, 'col': nc})

            new_left = pieces_left - 1 if is_left else pieces_left
            result = relaxed_search(board, (nr, nc), path, captured + 1, new_left)

            if result['success']:
                return result

            path.pop()
            board[nr][nc] = saved_piece
            board[row][col] = 'KNIGHT'

        return {'success': False}

    board = init_board()
    left_pieces, _ = count_pieces_by_side(board)
    result = relaxed_search(board, (7, 0), [], 0, left_pieces)

    if result['success']:
        print("✓ Našel pot z manj striktnim kriterijem")
        path = result['path']

        output = {'p6_path': path}
        with open('p6_path.json', 'w') as f:
            json.dump(output, f, indent=2)
    else:
        print("✗ Tudi z manj striktnim kriterijem ni uspelo")
