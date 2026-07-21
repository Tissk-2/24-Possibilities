# 24Possibilities — Product Requirements Document
**v3.0 (Static Pivot)**

| Field | Value |
|---|---|
| Product | 24Possibilities |
| Doc version | 3.0 (revised from v2.0 to reflect Static Pivot) |
| Status | Current / Implemented |
| Date | July 20, 2026 |

## What changed from v2

- **Massive Architectural Pivot:** The original v1 and v2 specifications relied heavily on a full-stack PHP/MySQL architecture for leaderboards, user accounts, and server-side validation. We have pivoted to a **100% static frontend architecture (HTML, CSS, JS)**.
- **Removed User Authentication:** Accounts, login walls, and session persistence have been completely stripped out to make the game instantly accessible ("Play Now" frictionless entry).
- **Client-Side Storage:** The user streaks are tracked locally during a session.
- **Client-Side Generation & Validation:** Solvable hand generation and equation evaluation happen entirely securely within the browser.
- **Desktop-Ready Layout:** The UI broke free from strict mobile constraints, adopting a responsive, wide horizontal layout for desktop users.
- **Deployment Strategy:** The application is now designed to be hosted on free static edge networks like Vercel or GitHub Pages with zero configuration.

---

## 1. Product Overview

### 1.1 Problem statement
Mental-math practice tools tend to fall into two camps: rote drills (flashcards) with no puzzle element, or logic puzzles with no arithmetic focus. The 24 Game sits in between — simple rules, real thinking required, a satisfying "aha" when a solution clicks. However, previous iterations of this project added unnecessary friction (database connections, logins, server lag).

### 1.2 Solution
24Possibilities is a lightning-fast, browser-based implementation of the 24 Game: four random, pre-verified-solvable numbers (1–9), combined with +, −, ×, ÷, and parentheses into an equation that equals exactly 24. The product is entirely static, meaning it loads instantly, works completely offline once loaded, and respects the player's time.

### 1.3 Target users
- **The student** — practicing mental arithmetic for school or competitions; wants fast, repeatable rounds that feel like a game, not homework.
- **The puzzle enthusiast** — plays daily brain-teasers (Wordle/Sudoku-style); wants something quick and replayable without needing to create yet another account.

### 1.4 Objective
Provide a frictionless, engaging, brain-stimulating math puzzle that tests logical thinking and arithmetic speed.

---

## 2. Goals & Success Metrics

- Zero friction to start playing (Time to First Game < 2 seconds).
- High repeatability and quick iteration speed between rounds.
- Zero server maintenance or database costs.

---

## 3. Scope

**In scope (MVP)** — single-player static game loop: client-side hand generation → equation building → validation → hint → scoring.

**Out of scope (MVP)** — global multiplayer, global online leaderboards, accounts, cloud sync, backend servers.

---

## 4. Functional Requirements (MVP)

### FR-1 — Solvable Hand Generator
The system deals four integers (1–9, duplicates allowed) and must guarantee at least one valid solution before showing the hand.

- FR-1.1 Hand = 4 integers, 1–9 inclusive; duplicates are legal.
- FR-1.2 Before display, the JavaScript client verifies at least one arrangement of the 4 numbers evaluates to exactly 24 using a standard solver algorithm.
- FR-1.3 Unsolvable hands are discarded and re-rolled instantly in a loop until a valid hand is found.
- FR-1.4 The solver tracks the exact string representation of the solution to be passed to the Hint system.

### FR-2 — Interactive Equation Builder
Click-only construction of the equation (no free-text input).

- Number cards: usable exactly once each; used cards are visually disabled.
- Operator buttons: `+ − × ÷ ( )`
- Undo (steps back one token) and Clear (resets the entry).
- Live preview of the equation string as it's built.
- The UI blocks structurally invalid sequences where feasible (two operators in a row, starting with `×`/`÷`, an unmatched closing paren).

### FR-3 — Validation Engine
- Since inputs are strictly controlled via UI clicks (only `1-9`, `+`, `-`, `*`, `/`, `(`, `)` exist in the string), the client safely evaluates the string equation mathematically.
- Win = both: result equals 24 (within tolerance, to avoid floating point issues), **and** the multiset of numbers used exactly matches the dealt hand.

### FR-4 — Hint System
- "Use Hint" reveals the cached worked solution generated during FR-1.
- Using hint ends the round immediately: the streak is reset, and the round scores 0.

### FR-5 — Scoring & Streak
- Points scale inversely with solve time (faster solve = higher score).
- Score formula: `max(10, Math.floor(100 - (timeTakenSeconds * 2)))`.
- Points are added to an ongoing streak. If the player gets an answer wrong or uses a hint, the streak ends and resets to 0.

---

## 5. Non-Functional Requirements

- **Performance** — Completely instantaneous. Zero network requests during gameplay.
- **Security** — Safe math evaluation on strictly controlled strings.
- **Responsiveness** — Mobile-friendly stacked views on phones, expanding to a wide, 4-column horizontal desktop view on larger screens.
- **Hosting** — Requires only a static web host (Vercel, Netlify, S3, Github Pages). No PHP runtime needed.

---

## 6. Technical Architecture

### 6.1 Stack

| Component | Technology | Purpose |
|---|---|---|
| Frontend structure | HTML5 & CSS3 | Game board, layout, responsive design |
| Frontend styling | Tailwind CSS | Utility-first styling via CDN |
| Frontend logic | JavaScript | Local validation, hand generation, solver, DOM updates |
| Persistence | Session State | Temporary score/streak tracking |

### 6.2 Solvability algorithm
The frontend employs a recursive brute-force solver that picks two numbers, combines them with all operators, and repeats until one number remains. If it equals 24, it returns the string expression. Since it runs client-side on modern devices, computing 4 numbers takes less than a millisecond.



---

## 7. User Flow & Game Loop

1. **Initialization** — User visits the static URL. Clicks "Play Now".
2. **Puzzle generation** — JS generates random numbers, checks solvability, renders UI.
3. **Interaction** — User builds the equation via clicks.
4. **Submission & validation**
   - *Submit* → local JS checks if the evaluated string equals 24 and all numbers were used.
   - *If Correct* → Score added to streak, next round begins immediately.
   - *If Incorrect* → Streak ends and resets to 0, next round begins.
   - *Hint* → Solution revealed, streak ends, next round begins after 3s.



