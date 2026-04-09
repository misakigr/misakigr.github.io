# =========================
# NoPass Web (Pyodide Version)
# =========================

import hashlib
import string

# -------------------------
# Генерация пароля
# -------------------------
def generate_password(login, salt, length, use_digits, use_upper, use_lower, use_symbols):
    if not login or not salt:
        raise ValueError("Пустой логин или соль")

    # Создаем базу
    base = f"{login}:{salt}"

    # Хэш (SHA256)
    hash_hex = hashlib.sha256(base.encode()).hexdigest()

    # Выбираем набор символов
    alphabet = ""
    if use_digits:
        alphabet += string.digits
    if use_upper:
        alphabet += string.ascii_uppercase
    if use_lower:
        alphabet += string.ascii_lowercase
    if use_symbols:
        alphabet += "!@#$%^&*()-_=+[]{};:,.<>?"

    if not alphabet:
        raise ValueError("Выбери хотя бы один набор символов")

    # Генерация пароля
    password = ""
    for i in range(length):
        idx = int(hash_hex[i % len(hash_hex)], 16) % len(alphabet)
        password += alphabet[idx]

    return password

# -------------------------
# Анализ сложности
# -------------------------
def analyze_strength(password):
    score = 0
    details = []

    if len(password) >= 12:
        score += 1
        details.append("Длина ≥ 12")

    if any(c.isdigit() for c in password):
        score += 1
        details.append("Есть цифры")

    if any(c.islower() for c in password):
        score += 1
        details.append("Есть строчные")

    if any(c.isupper() for c in password):
        score += 1
        details.append("Есть заглавные")

    if any(c in "!@#$%^&*()-_=+[]{};:,.<>?" for c in password):
        score += 1
        details.append("Есть символы")

    # Итог
    if score <= 2:
        strength = "Слабый"
    elif score <= 4:
        strength = "Средний"
    else:
        strength = "Сильный"

    return strength, details

# -------------------------
# Функция для Web
# -------------------------
def generate_from_web(login, salt, length, digits, upper, lower, symbols):
    password = generate_password(
        login,
        salt,
        int(length),
        digits,
        upper,
        lower,
        symbols
    )
    strength, details = analyze_strength(password)

    return {
        "password": password,
        "strength": strength,
        "details": details
    }
