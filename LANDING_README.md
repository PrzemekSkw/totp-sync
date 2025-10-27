# TOTP Sync Landing Page

Nowoczesna landing page dla projektu TOTP Sync w stylu Navigator.

## 🚀 Funkcje

- ✨ Nowoczesny, minimalistyczny design
- 🎨 Ciemny motyw z gradientami
- 📱 W pełni responsywny (mobile, tablet, desktop)
- ⚡ Szybkie ładowanie (vanilla JS, bez frameworków)
- 🎭 Płynne animacje i efekty scroll
- 🔗 Smooth scroll do sekcji

## 📁 Struktura plików

```
totp-sync-landing/
├── index.html      # Główna strona HTML
├── styles.css      # Style CSS
├── script.js       # JavaScript
└── README.md       # Ten plik
```

## 🛠️ Instalacja na GitHub Pages

### Opcja 1: Bezpośrednio w repozytorium głównym

1. Skopiuj pliki `index.html`, `styles.css` i `script.js` do głównego katalogu swojego repo
2. Przejdź do **Settings** → **Pages** w swoim repozytorium
3. W sekcji **Source** wybierz:
   - Branch: `main`
   - Folder: `/ (root)`
4. Kliknij **Save**
5. Strona będzie dostępna pod: `https://przemekskw.github.io/totp-sync`

### Opcja 2: W folderze /docs

1. Utwórz folder `docs` w głównym katalogu repo
2. Skopiuj wszystkie pliki do folderu `docs/`
3. Przejdź do **Settings** → **Pages**
4. W sekcji **Source** wybierz:
   - Branch: `main`
   - Folder: `/docs`
5. Kliknij **Save**

### Opcja 3: Osobny branch gh-pages

1. Utwórz nowy branch: `git checkout -b gh-pages`
2. Usuń wszystkie pliki oprócz landing page
3. Dodaj pliki landing page
4. Push: `git push origin gh-pages`
5. W **Settings** → **Pages** wybierz branch `gh-pages`

## 🎨 Customizacja

### Zmiana kolorów

W pliku `styles.css` znajdź sekcję `:root` i zmień zmienne:

```css
:root {
    --primary-color: #6366f1;    /* Główny kolor */
    --secondary-color: #8b5cf6;  /* Kolor dodatkowy */
    --dark-bg: #0f172a;          /* Tło */
    --dark-card: #1e293b;        /* Karty */
    --text-primary: #f1f5f9;     /* Tekst główny */
    --text-secondary: #cbd5e1;   /* Tekst drugorzędny */
}
```

### Zmiana treści

Edytuj plik `index.html`:
- **Tytuł**: Znajdź `<h1 class="hero-title">`
- **Opis**: Znajdź `<p class="hero-description">`
- **Funkcje**: Sekcja `<section class="features">`
- **Linki**: Zmień wszystkie linki `https://github.com/PrzemekSkw/totp-sync` na swoje

### Dodanie logo

1. Dodaj plik `logo.png` lub `logo.svg`
2. W `index.html` zamień emoji `🔐` na:
   ```html
   <img src="logo.png" alt="TOTP Sync" class="logo-image">
   ```
3. Dodaj styl w `styles.css`:
   ```css
   .logo-image {
       width: 40px;
       height: 40px;
   }
   ```

## 📱 Responsywność

Strona automatycznie dostosowuje się do różnych rozmiarów ekranu:
- **Desktop**: Pełny layout z wszystkimi efektami
- **Tablet**: Uproszczony układ
- **Mobile**: Jednkolumnowy layout z menu hamburger

## ⚡ Optymalizacja

Strona jest zoptymalizowana pod kątem:
- **SEO**: Meta tagi, semantic HTML
- **Wydajność**: Vanilla JS, brak zewnętrznych bibliotek
- **Dostępność**: Poprawna struktura HTML, ARIA labels
- **Responsywność**: Mobile-first approach

## 🔧 Testowanie lokalne

### Prosty serwer HTTP (Python)

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Następnie otwórz: `http://localhost:8000`

### Lub użyj VS Code Live Server

1. Zainstaluj rozszerzenie "Live Server"
2. Kliknij prawym na `index.html`
3. Wybierz "Open with Live Server"

## 📝 TODO (opcjonalne ulepszenia)

- [ ] Dodaj prawdziwe screenshoty aplikacji
- [ ] Dodaj sekcję FAQ
- [ ] Dodaj animowany licznik użytkowników
- [ ] Dodaj newsletter signup form
- [ ] Dodaj dark/light mode toggle
- [ ] Dodaj blog section
- [ ] Integracja z Google Analytics

## 🤝 Wsparcie

Jeśli masz pytania lub problemy, otwórz issue na GitHubie:
https://github.com/PrzemekSkw/totp-sync/issues

## 📄 Licencja

MIT License - możesz używać tego szablonu w dowolny sposób!

---

**Stworzone z ❤️ dla projektu TOTP Sync**
