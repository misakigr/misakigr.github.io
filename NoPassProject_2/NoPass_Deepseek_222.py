import hashlib
import tkinter as tk
from tkinter import messagebox
import string
from dataclasses import dataclass
from typing import List


@dataclass
class PasswordConfig:
    """Конфигурация генерации пароля"""
    length: int = 16
    use_digits: bool = True
    use_uppercase: bool = True
    use_lowercase: bool = True
    use_symbols: bool = True
    iterations: int = 100000
    key_length: int = 16


class PasswordGenerator:
    """Класс для генерации детерминированных паролей"""
    
    def __init__(self):
        self.charsets = {
            'digits': string.digits,
            'uppercase': string.ascii_uppercase,
            'lowercase': string.ascii_lowercase,
            'symbols': '!@#$%^&*()-+'
        }
    
    def generate_key(self, login: str, salt: str, config: PasswordConfig) -> bytes:
        """Генерирует ключ на основе логина и соли"""
        if not login or not salt:
            raise ValueError("Логин и соль не могут быть пустыми")
        
        key = hashlib.pbkdf2_hmac(
            'sha256',
            login.encode('utf-8'),
            salt.encode('utf-8'),
            config.iterations,
            config.key_length
        )
        return key
    
    def create_password(self, login: str, salt: str, config: PasswordConfig) -> str:
        """Создает пароль на основе логина и соли"""
        key = self.generate_key(login, salt, config)
        key_int = int.from_bytes(key, byteorder='big')
        key_str = str(key_int)
        
        return self._map_to_charset(key_str, config)
    
    def _get_available_charsets(self, config: PasswordConfig) -> List[str]:
        """Возвращает список доступных наборов символов"""
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
            # По умолчанию используем все наборы
            charsets = [self.charsets['digits'], self.charsets['uppercase'], 
                       self.charsets['lowercase'], self.charsets['symbols']]
        
        return charsets
    
    def _map_to_charset(self, key: str, config: PasswordConfig) -> str:
        """Маппинг ключа на символы из выбранных наборов"""
        charsets = self._get_available_charsets(config)
        
        # Получаем все цифры из ключа для детерминированной генерации
        key_digits = [int(d) for d in key if d.isdigit()]
        
        # Если цифр недостаточно, используем хеш
        while len(key_digits) < config.length:
            # Создаем дополнительную энтропию
            extended_key = hashlib.md5(key.encode()).hexdigest()
            key_digits.extend([int(d, 16) for d in extended_key if d.isdigit() or d in 'abcdef'])
        
        password_chars = []
        
        for i in range(config.length):
            # Выбираем набор символов по кругу
            charset = charsets[i % len(charsets)]
            # Берем цифру и нормализуем её под размер набора
            idx = key_digits[i % len(key_digits)] % len(charset)
            password_chars.append(charset[idx])
        
        return ''.join(password_chars)


class PasswordApp:
    """Главное приложение"""
    
    def __init__(self):
        self.generator = PasswordGenerator()
        self.config = PasswordConfig()
        self.salt = ""
        self.login = ""
        self.password = ""
        
        self.setup_main_window()
    
    def center_window(self, window: tk.Tk, width: int, height: int):
        """Центрирование окна на экране"""
        x = (window.winfo_screenwidth() - width) // 2
        y = (window.winfo_screenheight() - height) // 2
        window.geometry(f'{width}x{height}+{x}+{y}')
    
    def setup_main_window(self):
        """Настройка главного окна ввода данных"""
        self.window = tk.Tk()
        self.window.title("Мисак И.В. (для свободного распространения)")
        self.window.resizable(False, False)
        
        # Заголовок
        title_label = tk.Label(self.window, text="🔐 Password Generator", 
                               font=('Arial', 16, 'bold'), fg='#2c3e50')
        title_label.pack(pady=(15, 5))
        
        # Подзаголовок
        subtitle_label = tk.Label(self.window, text="Детерминированный генератор паролей", 
                                 font=('Arial', 10), fg='#7f8c8d')
        subtitle_label.pack()
        
        # Основная рамка с фиксированными отступами
        main_frame = tk.Frame(self.window, padx=25, pady=10)
        main_frame.pack(fill='both', expand=True)
        
        # Поле для соли
        salt_label = tk.Label(main_frame, text="🧂 Соль (секретное слово):", 
                             font=('Arial', 11, 'bold'), anchor='w')
        salt_label.pack(fill='x', pady=(10, 2))
        
        self.salt_entry = tk.Entry(main_frame, width=40, show="*", font=('Arial', 11))
        self.salt_entry.pack(fill='x', pady=(0, 2))
        self.salt_entry.focus()
        
        salt_hint = tk.Label(main_frame, text="(будет скрыто звёздочками)", 
                            font=('Arial', 8), fg='#95a5a6', anchor='w')
        salt_hint.pack(fill='x')
        
        # Поле для логина
        login_label = tk.Label(main_frame, text="👤 Логин (например, email):", 
                              font=('Arial', 11, 'bold'), anchor='w')
        login_label.pack(fill='x', pady=(15, 2))
        
        self.login_entry = tk.Entry(main_frame, width=40, font=('Arial', 11))
        self.login_entry.pack(fill='x')
        
        # Рамка для настроек
        settings_frame = tk.LabelFrame(main_frame, text="⚙️ Настройки пароля", 
                                       font=('Arial', 11, 'bold'), 
                                       padx=15, pady=10)
        settings_frame.pack(fill='x', pady=15)
        
        # Чекбоксы для наборов символов (2 колонки)
        checkbox_frame = tk.Frame(settings_frame)
        checkbox_frame.pack(fill='x', pady=5)
        
        self.digits_var = tk.BooleanVar(value=True)
        self.uppercase_var = tk.BooleanVar(value=True)
        self.lowercase_var = tk.BooleanVar(value=True)
        self.symbols_var = tk.BooleanVar(value=True)
        
        # Первая колонка
        left_frame = tk.Frame(checkbox_frame)
        left_frame.pack(side='left', padx=10)
        
        tk.Checkbutton(left_frame, text="🔢 Цифры (0-9)", variable=self.digits_var,
                      font=('Arial', 10)).pack(anchor='w', pady=2)
        tk.Checkbutton(left_frame, text="⬆️ Заглавные буквы (A-Z)", variable=self.uppercase_var,
                      font=('Arial', 10)).pack(anchor='w', pady=2)
        
        # Вторая колонка
        right_frame = tk.Frame(checkbox_frame)
        right_frame.pack(side='left', padx=20)
        
        tk.Checkbutton(right_frame, text="⬇️ Строчные буквы (a-z)", variable=self.lowercase_var,
                      font=('Arial', 10)).pack(anchor='w', pady=2)
        tk.Checkbutton(right_frame, text="✨ Спецсимволы (!@#$%)", variable=self.symbols_var,
                      font=('Arial', 10)).pack(anchor='w', pady=2)
        
        # Длина пароля (отдельно, чтобы точно было видно)
        length_frame = tk.Frame(settings_frame)
        length_frame.pack(fill='x', pady=10)
        
        tk.Label(length_frame, text="📏 Длина пароля:", font=('Arial', 11, 'bold')).pack(side='left')
        
        self.length_var = tk.StringVar(value="16")
        length_spinbox = tk.Spinbox(length_frame, from_=8, to=32, 
                                    textvariable=self.length_var, width=5,
                                    font=('Arial', 11), 
                                    buttonbackground='#3498db',
                                    relief='sunken', bd=2)
        length_spinbox.pack(side='left', padx=10)
        
        tk.Label(length_frame, text="символов (8-32)", font=('Arial', 10), fg='#7f8c8d').pack(side='left')
        
        # Кнопка генерации
        generate_btn = tk.Button(main_frame, text="🚀 СГЕНЕРИРОВАТЬ ПАРОЛЬ", 
                                 command=self.generate_password,
                                 font=('Arial', 14, 'bold'),
                                 bg='#27ae60', fg='white',
                                 padx=20, pady=12,
                                 cursor='hand2',
                                 relief='raised',
                                 bd=3,
                                 activebackground='#2ecc71')
        generate_btn.pack(pady=15, fill='x')
        
        # Информация
        info_label = tk.Label(main_frame, 
                              text="✓ При одинаковых логине и соли всегда получается одинаковый пароль\n✓ Пароль хранится только у вас в голове",
                              font=('Arial', 9), fg='#7f8c8d', justify='center')
        info_label.pack(pady=5)
        
        # Центрируем окно с правильным размером (ширина 550, высота 550)
        self.center_window(self.window, 550, 550)
    
    def generate_password(self):
        """Генерация пароля на основе введенных данных"""
        self.salt = self.salt_entry.get().strip()
        self.login = self.login_entry.get().strip()
        
        # Валидация ввода
        if not self.salt:
            messagebox.showerror("Ошибка", "❌ Пожалуйста, введите соль")
            return
        
        if not self.login:
            messagebox.showerror("Ошибка", "❌ Пожалуйста, введите логин")
            return
        
        # Проверка выбора символов
        if not (self.digits_var.get() or self.uppercase_var.get() or 
                self.lowercase_var.get() or self.symbols_var.get()):
            messagebox.showerror("Ошибка", "❌ Выберите хотя бы один тип символов")
            return
        
        # Проверка длины пароля
        try:
            length = int(self.length_var.get())
            if length < 8 or length > 32:
                raise ValueError
        except ValueError:
            messagebox.showerror("Ошибка", "❌ Длина пароля должна быть от 8 до 32")
            return
        
        # Обновляем конфигурацию
        self.config.length = length
        self.config.use_digits = self.digits_var.get()
        self.config.use_uppercase = self.uppercase_var.get()
        self.config.use_lowercase = self.lowercase_var.get()
        self.config.use_symbols = self.symbols_var.get()
        
        try:
            # Показываем индикатор загрузки
            self.window.config(cursor='watch')
            self.window.update()
            
            # Генерируем пароль
            self.password = self.generator.create_password(self.login, self.salt, self.config)
            
            # Возвращаем курсор
            self.window.config(cursor='')
            
            # Закрываем окно ввода и показываем результат
            self.window.destroy()
            self.show_result_window()
            
        except Exception as e:
            self.window.config(cursor='')
            messagebox.showerror("Ошибка", f"❌ Не удалось сгенерировать пароль:\n{str(e)}")
    
    def check_password_strength(self, password: str) -> tuple:
        """Проверка сложности пароля возвращает (текст, цвет, детали)"""
        score = 0
        details = []
        
        # Проверка длины
        if len(password) >= 16:
            score += 2
            details.append("✓ Отличная длина (16+)")
        elif len(password) >= 12:
            score += 1
            details.append("✓ Хорошая длина (12-15)")
        else:
            details.append("⚠️ Минимальная длина (8-11)")
        
        # Проверка разнообразия символов
        has_lower = any(c.islower() for c in password)
        has_upper = any(c.isupper() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_symbol = any(c in '!@#$%^&*()-+' for c in password)
        
        if has_lower:
            score += 1
            details.append("✓ Есть строчные буквы")
        else:
            details.append("❌ Нет строчных букв")
            
        if has_upper:
            score += 1
            details.append("✓ Есть заглавные буквы")
        else:
            details.append("❌ Нет заглавных букв")
            
        if has_digit:
            score += 1
            details.append("✓ Есть цифры")
        else:
            details.append("❌ Нет цифр")
            
        if has_symbol:
            score += 2
            details.append("✓ Есть спецсимволы")
        else:
            details.append("❌ Нет спецсимволов")
        
        # Проверка на повторяющиеся символы
        if len(set(password)) < len(password) * 0.7:
            details.append("⚠️ Много повторений")
        
        # Определение уровня сложности
        if score >= 6:
            return "🔒 ОЧЕНЬ СИЛЬНЫЙ", "#27ae60", details
        elif score >= 5:
            return "🔐 СИЛЬНЫЙ", "#2980b9", details
        elif score >= 4:
            return "🔑 ХОРОШИЙ", "#f39c12", details
        elif score >= 3:
            return "⚠️ СРЕДНИЙ", "#e67e22", details
        else:
            return "❌ СЛАБЫЙ", "#c0392b", details
    
    def show_result_window(self):
        """Показ окна с результатом"""
        self.result_window = tk.Tk()
        self.result_window.title("✅ Пароль сгенерирован")
        self.result_window.resizable(False, False)
        
        # Заголовок
        tk.Label(self.result_window, text="✅ Пароль успешно сгенерирован!", 
                font=('Arial', 16, 'bold'), fg='#27ae60').pack(pady=(15, 5))
        
        # Основная рамка
        main_frame = tk.Frame(self.result_window, padx=25, pady=10)
        main_frame.pack(fill='both', expand=True)
        
        # Рамка с паролем
        password_frame = tk.Frame(main_frame, bg='#ecf0f1', relief='solid', bd=2)
        password_frame.pack(pady=10, fill='x')
        
        tk.Label(password_frame, text="Ваш пароль:", font=('Arial', 11), 
                bg='#ecf0f1').pack(pady=(10, 0))
        
        # Отображение пароля (с возможностью скролла если очень длинный)
        password_text = tk.Text(password_frame, height=2, width=30, 
                               font=('Courier', 14, 'bold'),
                               bg='#ecf0f1', fg='#2c3e50',
                               wrap='none', bd=0, highlightthickness=0)
        password_text.pack(padx=10, pady=5, fill='x')
        password_text.insert('1.0', self.password)
        password_text.config(state='disabled')
        
        # Кнопка копирования
        copy_btn = tk.Button(password_frame, text="📋 КОПИРОВАТЬ ПАРОЛЬ", 
                            command=self.copy_to_clipboard,
                            font=('Arial', 11, 'bold'),
                            bg='#3498db', fg='white',
                            padx=20, pady=8,
                            cursor='hand2',
                            activebackground='#2980b9')
        copy_btn.pack(pady=10)
        
        # Информация о пароле
        info_frame = tk.LabelFrame(main_frame, text="📊 Анализ пароля", 
                                   font=('Arial', 12, 'bold'), 
                                   padx=15, pady=10)
        info_frame.pack(pady=15, fill='x')
        
        # Сложность пароля
        strength_text, strength_color, details = self.check_password_strength(self.password)
        
        strength_frame = tk.Frame(info_frame)
        strength_frame.pack(fill='x', pady=5)
        
        tk.Label(strength_frame, text="Сложность:", font=('Arial', 11)).pack(side='left')
        tk.Label(strength_frame, text=strength_text, 
                font=('Arial', 11, 'bold'), fg=strength_color).pack(side='left', padx=10)
        
        # Детали анализа в две колонки
        details_frame = tk.Frame(info_frame)
        details_frame.pack(fill='x', pady=5)
        
        left_details = tk.Frame(details_frame)
        left_details.pack(side='left', padx=5)
        
        right_details = tk.Frame(details_frame)
        right_details.pack(side='left', padx=5)
        
        for i, detail in enumerate(details[:4]):
            if i < 2:
                tk.Label(left_details, text=detail, font=('Arial', 9)).pack(anchor='w', pady=1)
            else:
                tk.Label(right_details, text=detail, font=('Arial', 9)).pack(anchor='w', pady=1)
        
        # Характеристики пароля
        stats_frame = tk.Frame(info_frame)
        stats_frame.pack(fill='x', pady=10)
        
        # Подсчет типов символов
        digit_count = sum(c.isdigit() for c in self.password)
        upper_count = sum(c.isupper() for c in self.password)
        lower_count = sum(c.islower() for c in self.password)
        symbol_count = sum(1 for c in self.password if c in '!@#$%^&*()-+')
        total_chars = len(self.password)
        unique_chars = len(set(self.password))
        
        stats_text = f"📏 Длина: {total_chars} | 🔢 Цифр: {digit_count} | ⬆️ Заглавных: {upper_count} | ⬇️ Строчных: {lower_count} | ✨ Спецсимволов: {symbol_count} | 🎯 Уникальных: {unique_chars}"
        
        tk.Label(stats_frame, text=stats_text, font=('Arial', 9), 
                justify='left', wraplength=450).pack()
        
        # Кнопки действий
        button_frame = tk.Frame(main_frame)
        button_frame.pack(pady=15)
        
        # Кнопка создания нового пароля
        new_btn = tk.Button(button_frame, text="🔄 НОВЫЙ ПАРОЛЬ", 
                           command=self.restart_app,
                           font=('Arial', 11, 'bold'),
                           bg='#f39c12', fg='white',
                           padx=15, pady=8,
                           cursor='hand2',
                           activebackground='#e67e22')
        new_btn.pack(side='left', padx=5)
        
        # Кнопка закрытия
        close_btn = tk.Button(button_frame, text="✖ ЗАКРЫТЬ", 
                             command=self.result_window.destroy,
                             font=('Arial', 11, 'bold'),
                             bg='#e74c3c', fg='white',
                             padx=15, pady=8,
                             cursor='hand2',
                             activebackground='#c0392b')
        close_btn.pack(side='left', padx=5)
        
        # Примечание
        note_label = tk.Label(main_frame, 
                              text="💡 При тех же логине и соле пароль будет таким же",
                              font=('Arial', 9), fg='#7f8c8d')
        note_label.pack(pady=5)
        
        # Центрируем окно с правильным размером
        self.center_window(self.result_window, 550, 600)
    
    def copy_to_clipboard(self):
        """Копирование пароля в буфер обмена"""
        self.result_window.clipboard_clear()
        self.result_window.clipboard_append(self.password)
        messagebox.showinfo("✅ Успех", "Пароль скопирован в буфер обмена!")
    
    def restart_app(self):
        """Перезапуск приложения для создания нового пароля"""
        self.result_window.destroy()
        self.__init__()
        self.run()
    
    def run(self):
        """Запуск приложения"""
        self.window.mainloop()


def main():
    """Точка входа в приложение"""
    try:
        app = PasswordApp()
        app.run()
    except Exception as e:
        # Глобальная обработка ошибок
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("❌ Критическая ошибка", 
                            f"Произошла непредвиденная ошибка:\n{str(e)}\n\nПерезапустите приложение.")
        root.destroy()


if __name__ == "__main__":
    main()