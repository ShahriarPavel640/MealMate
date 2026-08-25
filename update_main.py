import re

with open('c:/Users/User/OneDrive/Desktop/2205032_ai/main.cpp', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Add srand(time(NULL)) to main
if 'srand(time(NULL));' not in content:
    content = content.replace('int main() {', 'import_time\nint main() {\n    srand(time(NULL));')
    content = content.replace('import_time', '#include <time.h>\n#include <stdlib.h>')

# Fix 2: Swap player order in runExperiment
old_exp = '''    for (int i = 0; i < numGames; i++) {
        int result = playAIvsAI(h1, depth1, h2, depth2, false);
        if (result == 1) p1Wins++;
        else if (result == 2) p2Wins++;
        else draws++;
    }'''

new_exp = '''    for (int i = 0; i < numGames; i++) {
        if (i % 2 == 0) {
            int result = playAIvsAI(h1, depth1, h2, depth2, false);
            if (result == 1) p1Wins++;
            else if (result == 2) p2Wins++;
            else draws++;
        } else {
            int result = playAIvsAI(h2, depth2, h1, depth1, false);
            if (result == 2) p1Wins++;
            else if (result == 1) p2Wins++;
            else draws++;
        }
    }'''

content = content.replace(old_exp, new_exp)

# Fix 3: Add Iterative Deepening support to playAIvsAI
old_play = '''int playAIvsAI(HeuristicType h1, int depth1,
               HeuristicType h2, int depth2,
               bool verbose = false) {'''

new_play = '''int playAIvsAI(HeuristicType h1, int depth1,
               HeuristicType h2, int depth2,
               bool verbose = false, bool iterativeDeepening = false) {'''

content = content.replace(old_play, new_play)

old_ai1_move = '''        if (state.currentPlayer == 1) {
            move = ai1.getBestMove(state);
            if (verbose) std::cout << "P1 (" << heuristicName(h1) << ") plays bin " << (move + 1) << "\\n";
        } else {
            move = ai2.getBestMove(state);'''

new_ai1_move = '''        if (state.currentPlayer == 1) {
            move = iterativeDeepening ? ai1.getBestMoveIterativeDeepening(state) : ai1.getBestMove(state);
            if (verbose) std::cout << "P1 (" << heuristicName(h1) << ") plays bin " << (move + 1) << "\\n";
        } else {
            move = iterativeDeepening ? ai2.getBestMoveIterativeDeepening(state) : ai2.getBestMove(state);'''

content = content.replace(old_ai1_move, new_ai1_move)

# Fix 4: Add Iterative Deepening to main menu
old_menu = '''    std::cout << "  2. AI vs AI (single game, verbose)\\n";
    std::cout << "  3. Run experiments (100 games per matchup)\\n";
    std::cout << "\\nChoice: ";'''

new_menu = '''    std::cout << "  2. AI vs AI (single game, verbose)\\n";
    std::cout << "  3. Run experiments (100 games per matchup)\\n";
    std::cout << "  4. AI vs AI (Iterative Deepening)\\n";
    std::cout << "\\nChoice: ";'''

content = content.replace(old_menu, new_menu)

old_case3 = '''        case 3:
            runAllExperiments();
            break;
        default:'''

new_case3 = '''        case 3:
            runAllExperiments();
            break;
        case 4: {
            int h1, h2, d1, d2;
            std::cout << "P1 heuristic (1-4): "; std::cin >> h1;
            std::cout << "P1 depth: "; std::cin >> d1;
            std::cout << "P2 heuristic (1-4): "; std::cin >> h2;
            std::cout << "P2 depth: "; std::cin >> d2;
            if (h1 < 1 || h1 > 4) h1 = 1;
            if (h2 < 1 || h2 > 4) h2 = 1;
            if (d1 < 1) d1 = 5;
            if (d2 < 1) d2 = 5;

            std::cout << "\\n=== AI vs AI (Iterative Deepening) ===\\n";
            int result = playAIvsAI(
                static_cast<HeuristicType>(h1 - 1), d1,
                static_cast<HeuristicType>(h2 - 1), d2,
                true, true);
            if (result == 1) std::cout << "\\nPlayer 1 wins!\\n";
            else if (result == 2) std::cout << "\\nPlayer 2 wins!\\n";
            else std::cout << "\\nDraw!\\n";
            break;
        }
        default:'''

content = content.replace(old_case3, new_case3)

with open('c:/Users/User/OneDrive/Desktop/2205032_ai/main.cpp', 'w', encoding='utf-8') as f:
    f.write(content)
