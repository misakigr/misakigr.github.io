import hashlib
import string
from dataclasses import dataclass
from typing import List


@dataclass
class PasswordConfig:
    length: int = 16
    use_digits: bool = True
    use_uppercase: bool = True
    use_lowercase: bool = True
    use_symbols: bool = True
    iterations: int = 100000
    key_length: int = 16


class PasswordGenerator:
    
    def __init__(self):
        self.charsets = {
            'digits': string.digits,
            'uppercase': string.ascii_uppercase,
            'lowercase': string.ascii_lowercase,
            'symbols': '!@#$%^&*()-+'
        }

    def generate_key(self, login: str, salt: str, config: PasswordConfig) -> bytes:
        if not login or not salt:
            raise ValueError("Логин и соль не могут быть пустыми")

        return hashlib.pbkdf2_hmac(
            'sha256',
            login.encode('utf-8'),
            salt.encode('utf-8'),
            config.iterations,
            config.key_length
        )

    def create_password(self, login: str, salt: str, config: PasswordConfig) -> str:
        key = self.generate_key(login, salt, config)
        key_int = int.from_bytes(key, byteorder='big')
        key_str = str(key_int)

        return self._map_to_charset(key_str, config)

    def _get_available_charsets(self, config: PasswordConfig) -> List[str]:
        charsets = []

        if config.use_digits:
            charsets.append(self.charsets['digits'])
        if config.use_uppercase:
            charsets.append(self.charsets['uppercase'])
        if config.use_lowercase:
            charsets.append(self.charsets['lowercase'])
        if config.use_symbols:
            charsets.append(self.charsets['symbols'])

        if not charsets:
            return list(self.charsets.values())

        return charsets

    def _map_to_charset(self, key: str, config: PasswordConfig) -> str:
        charsets = self._get_available_charsets(config)

        key_digits = [int(d) for d in key if d.isdigit()]

        while len(key_digits) < config.length:
            extended_key = hashlib.md5(key.encode()).hexdigest()
            key_digits.extend([
                int(c, 16) for c in extended_key
                if c.isdigit() or c in 'abcdef'
            ])

        password_chars = []

        for i in range(config.length):
            charset = charsets[i % len(charsets)]
            idx = key_digits[i % len(key_digits)] % len(charset)
            password_chars.append(charset[idx])

        return ''.join(password_chars)


# =========================
# АНАЛИЗ СЛОЖНОСТИ
# =========================

def check_password_strength(password: str):
    score = 0
    details = []

    if len(password) >= 16:
        score += 2
        details.append("✓ Отличная длина (16+)")
    elif len(password) >= 12:
        score += 1
        details.append("✓ Хорошая длина (12-15)")
    else:
        details.append("⚠️ Минимальная длина")

    has_lower = any(c.islower() for c in password)
    has_upper = any(c.isupper() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_symbol = any(c in '!@#$%^&*()-+' for c in password)

    if has_lower:
        score += 1
        details.append("✓ Строчные")
    else:
        details.append("❌ Нет строчных")

    if has_upper:
        score += 1
        details.append("✓ Заглавные")
    else:
        details.append("❌ Нет заглавных")

    if has_digit:
        score += 1
        details.append("✓ Цифры")
    else:
        details.append("❌ Нет цифр")

    if has_symbol:
        score += 2
        details.append("✓ Спецсимволы")
    else:
        details.append("❌ Нет спецсимволов")

    if score >= 6:
        return "ОЧЕНЬ СИЛЬНЫЙ", details
    elif score >= 5:
        return "СИЛЬНЫЙ", details
    elif score >= 4:
        return "ХОРОШИЙ", details
    elif score >= 3:
        return "СРЕДНИЙ", details
    else:
        return "СЛАБЫЙ", details


# =========================
# ТОЧКА ВХОДА ДЛЯ ВЕБА
# =========================

def generate_from_web(login, salt, length, use_digits, use_upper, use_lower, use_symbols):
    config = PasswordConfig()
    config.length = int(length)
    config.use_digits = use_digits
    config.use_uppercase = use_upper
    config.use_lowercase = use_lower
    config.use_symbols = use_symbols

    generator = PasswordGenerator()
    password = generator.create_password(login, salt, config)

    strength, details = check_password_strength(password)

    return {
        "password": password,
        "strength": strength,
        "details": details
    }
