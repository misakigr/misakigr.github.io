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

    # Базовая строка
    base = f"{login}:{salt}"

    # Хэш
    hash_bytes = hashlib.sha256(base.encode()).digest()

    # Формируем алфавит
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

    # Генерация
    password = ""
    for i in range(length):
        idx = hash_bytes[i % len(hash_bytes)] % len(alphabet)
        password += alphabet[idx]

    return password


# -------------------------
# Оценка сложности
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
# ФУНКЦИЯ ДЛЯ WEB (ВАЖНО)
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
