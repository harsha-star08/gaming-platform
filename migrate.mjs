/**
 * Migration: UpSkillX Platform Restructure
 * 
 * Changes:
 * 1. Unlock all courses (remove is_locked dependency)
 * 2. Replace Python's 16 levels with 10 structured modules
 * 3. Update total_levels for all courses to 10
 * 4. Add module-related badges
 * 5. Add module_number column concept (using level_number = module_number)
 */

import { db, initDatabase } from './server/db/schema.js';

console.log('Running UpSkillX Migration...\n');

initDatabase();

// ─── 1. UNLOCK ALL COURSES ────────────────────────────────────────────────────
console.log('Step 1: Unlocking all courses...');
db.prepare('UPDATE courses SET is_locked = 0').run();
console.log('  ✓ All courses unlocked\n');

// ─── 2. UPDATE total_levels TO 10 FOR ALL COURSES ────────────────────────────
console.log('Step 2: Updating total_levels to 10 for all courses...');
db.prepare('UPDATE courses SET total_levels = 10').run();
console.log('  ✓ Done\n');

// ─── 3. RESTRUCTURE PYTHON — Replace 16 levels with 10 modules ───────────────
console.log('Step 3: Restructuring Python Mastery to 10 modules...');

const pythonCourse = db.prepare("SELECT id FROM courses WHERE slug = 'python'").get();
if (!pythonCourse) {
  console.error('Python course not found. Aborting.');
  process.exit(1);
}
const pythonId = pythonCourse.id;

// Clear existing python topic data (cascades to questions, topic_progress, etc.)
// We keep topic_progress for students who've already completed something 
// by mapping: old level 1-2 -> new module 1 (Fundamentals), etc.
// Strategy: delete old topics and insert new 10. Student progress from old levels is cleared but 
// course_progress percentages will be recalculated.

const existingTopicIds = db.prepare('SELECT id FROM course_topics WHERE course_id = ?').all(pythonId).map(t => t.id);

// Delete dependent data so we can restructure cleanly
if (existingTopicIds.length > 0) {
  // Delete question_attempts for these topics
  const placeholders = existingTopicIds.map(() => '?').join(',');
  const topicQuestions = db.prepare(`SELECT id FROM questions WHERE topic_id IN (${placeholders})`).all(...existingTopicIds).map(q => q.id);
  
  if (topicQuestions.length > 0) {
    const qPlaceholders = topicQuestions.map(() => '?').join(',');
    db.prepare(`DELETE FROM question_attempts WHERE question_id IN (${qPlaceholders})`).run(...topicQuestions);
  }
  
  db.prepare(`DELETE FROM questions WHERE topic_id IN (${placeholders})`).run(...existingTopicIds);
  db.prepare(`DELETE FROM coding_problems WHERE topic_id IN (${placeholders})`).run(...existingTopicIds);
  db.prepare(`DELETE FROM topic_progress WHERE topic_id IN (${placeholders})`).run(...existingTopicIds);
  db.prepare(`DELETE FROM course_topics WHERE course_id = ?`).run(pythonId);
}

// Reset python course_progress for all students
db.prepare('UPDATE course_progress SET current_level = 1, completed_levels = 0, progress_percent = 0 WHERE course_id = ?').run(pythonId);

console.log('  Old Python topics cleared. Inserting 10 new modules...');

const insertTopic = db.prepare(`
  INSERT INTO course_topics (
    course_id, level_number, title, slug, description, concept_summary,
    content_markdown, code_example, expected_output, common_mistakes, xp_reward, coins_reward
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertProblem = db.prepare(`
  INSERT INTO coding_problems (
    topic_id, title, slug, difficulty, statement, input_format, output_format,
    constraints, starter_code, language, xp_reward, coins_reward, time_limit_ms
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertTestCase = db.prepare(`
  INSERT INTO code_test_cases (problem_id, input, expected_output, is_hidden)
  VALUES (?, ?, ?, ?)
`);

const insertQuestion = db.prepare(`
  INSERT INTO questions (topic_id, type, prompt, code_snippet, options_json, correct_answer, explanation, xp_reward, coins_reward)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const pythonModules = [
  {
    module: 1,
    title: 'Python Fundamentals',
    slug: 'python-fundamentals',
    description: 'Variables, Data Types, Syntax, and Input/Output — the core building blocks of every Python program.',
    concept: 'Python is dynamically typed. Variables are named memory containers. Understanding primitive data types is essential.',
    content: `# Module 1 — Python Fundamentals\n\n### Topics\n- **Variables**: Named containers for storing values\n- **Data Types**: int, float, str, bool\n- **Syntax**: Indentation-based, no semicolons\n- **Input/Output**: input(), print(), f-strings\n\n### Examples\n\`\`\`python\nname = "Jenifer"\nage = 19\nheight = 5.6\nprint(f"Name: {name}, Age: {age}")\n\`\`\``,
    code_example: `name = "Jenifer"\nage = 19\nheight = 5.6\nis_student = True\nprint(f"Name: {name}, Age: {age}, Height: {height}")\nprint(type(age), type(height))`,
    expected_output: `Name: Jenifer, Age: 19, Height: 5.6\n<class 'int'> <class 'float'>`,
    common_mistakes: 'Forgetting that input() always returns a string. Use int(input()) or float(input()) for numbers.',
    problem: {
      title: 'Sum of Two Numbers',
      slug: 'sum-of-two-numbers',
      difficulty: 'Easy',
      statement: 'Read two integers a and b and print their sum.',
      input_format: 'Two lines: first integer a, second integer b.',
      output_format: 'Single integer a + b.',
      constraints: '-10^6 <= a, b <= 10^6',
      starter_code: `import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    a = int(lines[0])\n    b = int(lines[1])\n    print(a + b)\n\nif __name__ == '__main__':\n    solve()`,
      public_tests: [{ input: '3\n5', expected_output: '8' }, { input: '-10\n4', expected_output: '-6' }],
      hidden_tests: [{ input: '100\n250', expected_output: '350' }, { input: '0\n0', expected_output: '0' }, { input: '-50\n-50', expected_output: '-100' }]
    },
    questions: [
      { type: 'mcq', prompt: 'What does type(3.14) return in Python?', code_snippet: 'print(type(3.14))', options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'double'>"], correct: "<class 'float'>", explanation: '3.14 is a floating point number, so type() returns float.' },
      { type: 'prediction', prompt: 'What is the output of print(int("42") + 8)?', code_snippet: 'print(int("42") + 8)', options: ['428', '50', 'TypeError', '42'], correct: '50', explanation: 'int("42") converts to 42, then 42+8=50.' }
    ]
  },
  {
    module: 2,
    title: 'Operators & Expressions',
    slug: 'operators-expressions',
    description: 'Arithmetic, Comparison, Logical, and Assignment operators — mastering the building blocks of computation.',
    concept: 'Operators compute values. Floor division (//) truncates. Modulus (%) gives remainder. Logical operators (and/or/not) evaluate boolean conditions.',
    content: `# Module 2 — Operators & Expressions\n\n- **Arithmetic**: +, -, *, /, //, %, **\n- **Comparison**: ==, !=, <, >, <=, >=\n- **Logical**: and, or, not\n- **Assignment**: =, +=, -=, *=, /=`,
    code_example: `a = 17\nb = 5\nprint(a // b)  # Floor division: 3\nprint(a % b)   # Modulus: 2\nprint(a ** 2)  # Power: 289\nprint(a > 10 and b < 10)  # True`,
    expected_output: `3\n2\n289\nTrue`,
    common_mistakes: 'Using / instead of // for integer division. a/b always returns float in Python 3.',
    problem: {
      title: 'Even or Odd',
      slug: 'even-or-odd-mod2',
      difficulty: 'Easy',
      statement: 'Read an integer n and print "Even" or "Odd".',
      input_format: 'Single integer n.',
      output_format: '"Even" or "Odd".',
      constraints: '-10^9 <= n <= 10^9',
      starter_code: `import sys\n\ndef solve():\n    n = int(sys.stdin.read().strip())\n    print("Even" if n % 2 == 0 else "Odd")\n\nif __name__ == '__main__':\n    solve()`,
      public_tests: [{ input: '4', expected_output: 'Even' }, { input: '7', expected_output: 'Odd' }],
      hidden_tests: [{ input: '0', expected_output: 'Even' }, { input: '-3', expected_output: 'Odd' }]
    },
    questions: [
      { type: 'prediction', prompt: 'What is 19 // 4 in Python?', code_snippet: 'print(19 // 4)', options: ['4.75', '4', '5', '3'], correct: '4', explanation: 'Floor division truncates decimal: 19/4=4.75 → 4.' }
    ]
  },
  {
    module: 3,
    title: 'Conditional Statements',
    slug: 'conditional-statements-mod3',
    description: 'Control flow with if, elif, else, and Nested Conditions.',
    concept: 'Conditionals direct program execution based on truth values. Python uses elif instead of else if.',
    content: `# Module 3 — Conditional Statements\n\n\`\`\`python\nif condition:\n    # execute\nelif other_condition:\n    # execute\nelse:\n    # default\n\`\`\`\n\n- Single = is assignment, == is comparison\n- Nested conditions allowed`,
    code_example: `grade = 85\nif grade >= 90:\n    print("A")\nelif grade >= 80:\n    print("B")\nelif grade >= 70:\n    print("C")\nelse:\n    print("F")`,
    expected_output: `B`,
    common_mistakes: 'Using = (assignment) instead of == (comparison). Missing indentation.',
    problem: {
      title: 'Maximum of Three',
      slug: 'max-of-three-mod3',
      difficulty: 'Easy',
      statement: 'Read three integers and print the maximum.',
      input_format: 'Three space-separated integers.',
      output_format: 'The maximum value.',
      constraints: '-10^6 <= a, b, c <= 10^6',
      starter_code: `import sys\n\ndef solve():\n    nums = list(map(int, sys.stdin.read().split()))\n    print(max(nums))\n\nif __name__ == '__main__':\n    solve()`,
      public_tests: [{ input: '10 25 15', expected_output: '25' }, { input: '5 5 2', expected_output: '5' }],
      hidden_tests: [{ input: '-10 -5 -20', expected_output: '-5' }, { input: '99 12 101', expected_output: '101' }]
    },
    questions: [
      { type: 'mcq', prompt: 'What keyword is used for "else if" in Python?', code_snippet: 'if x > 0:\n    pass\n??? x < 0:\n    pass', options: ['elseif', 'else if', 'elif', 'elsif'], correct: 'elif', explanation: 'Python uses elif for chained conditional branches.' }
    ]
  },
  {
    module: 4,
    title: 'Loops',
    slug: 'loops-mod4',
    description: 'for loops, while loops, range(), break, continue, and Nested Loops.',
    concept: 'Loops repeat execution. for iterates over sequences. while repeats while condition is true. break/continue control loop flow.',
    content: `# Module 4 — Loops\n\n### for loop\n\`\`\`python\nfor i in range(1, 6):\n    print(i)\n\`\`\`\n\n### while loop\n\`\`\`python\ncount = 3\nwhile count > 0:\n    print(count)\n    count -= 1\n\`\`\`\n\n- break: exit loop\n- continue: skip to next iteration`,
    code_example: `total = 0\nfor i in range(1, 6):\n    total += i\nprint(f"Sum 1 to 5: {total}")`,
    expected_output: `Sum 1 to 5: 15`,
    common_mistakes: 'Off-by-one errors with range(). Infinite while loop when counter not updated.',
    problem: {
      title: 'Factorial',
      slug: 'factorial-mod4',
      difficulty: 'Easy',
      statement: 'Read integer n (0 <= n <= 12) and print n! (0! = 1).',
      input_format: 'Single integer n.',
      output_format: 'n factorial.',
      constraints: '0 <= n <= 12',
      starter_code: `import sys\n\ndef solve():\n    n = int(sys.stdin.read().strip())\n    result = 1\n    for i in range(1, n + 1):\n        result *= i\n    print(result)\n\nif __name__ == '__main__':\n    solve()`,
      public_tests: [{ input: '5', expected_output: '120' }, { input: '0', expected_output: '1' }],
      hidden_tests: [{ input: '1', expected_output: '1' }, { input: '10', expected_output: '3628800' }]
    },
    questions: [
      { type: 'prediction', prompt: 'How many iterations: for i in range(2, 8, 2)?', code_snippet: 'for i in range(2, 8, 2):\n    print(i)', options: ['3', '4', '6', '2'], correct: '3', explanation: 'range(2, 8, 2) produces 2, 4, 6 → 3 iterations.' }
    ]
  },
  {
    module: 5,
    title: 'Functions',
    slug: 'functions-mod5',
    description: 'Functions, Parameters, Return Values, Scope, and Lambda expressions.',
    concept: 'Functions are reusable code blocks defined with def. They encapsulate logic and promote DRY (Don\'t Repeat Yourself) coding.',
    content: `# Module 5 — Functions\n\n\`\`\`python\ndef add(a, b=0):\n    return a + b\n\n# Lambda\nsquare = lambda x: x ** 2\n\`\`\`\n\n- Parameters can have defaults\n- Variables inside functions have local scope\n- return sends back a value`,
    code_example: `def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nprint(is_prime(17), is_prime(18))`,
    expected_output: `True False`,
    common_mistakes: 'Forgetting to return a value (function returns None by default). Global vs local scope confusion.',
    problem: {
      title: 'Check Prime',
      slug: 'check-prime-mod5',
      difficulty: 'Medium',
      statement: 'Read integer n. Print "PRIME" if prime, else "NOT PRIME".',
      input_format: 'Single integer n.',
      output_format: 'PRIME or NOT PRIME',
      constraints: '1 <= n <= 10^6',
      starter_code: `import sys\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\ndef solve():\n    n = int(sys.stdin.read().strip())\n    print("PRIME" if is_prime(n) else "NOT PRIME")\n\nif __name__ == '__main__':\n    solve()`,
      public_tests: [{ input: '11', expected_output: 'PRIME' }, { input: '4', expected_output: 'NOT PRIME' }],
      hidden_tests: [{ input: '1', expected_output: 'NOT PRIME' }, { input: '2', expected_output: 'PRIME' }, { input: '97', expected_output: 'PRIME' }]
    },
    questions: [
      { type: 'mcq', prompt: 'What is the default return value of a Python function with no return statement?', code_snippet: 'def greet():\n    print("Hi")', options: ['0', 'None', 'False', '""'], correct: 'None', explanation: 'Python functions return None by default.' }
    ]
  },
  {
    module: 6,
    title: 'Strings & Collections',
    slug: 'strings-collections-mod6',
    description: 'Strings, Lists, Tuples, Sets, and Dictionaries — Python\'s core data structures.',
    concept: 'Python provides powerful built-in data structures. Strings are immutable. Lists are mutable ordered collections. Dicts store key-value pairs.',
    content: `# Module 6 — Strings & Collections\n\n- **Strings**: Immutable, slicing text[0:3], methods: .split(), .join(), .upper()\n- **Lists**: Mutable ordered: [1,2,3], .append(), .sort()\n- **Tuples**: Immutable ordered: (1,2,3)\n- **Sets**: Unordered unique: {1,2,3}\n- **Dicts**: Key-value: {"key": value}`,
    code_example: `s = "madam"\nprint(s == s[::-1])  # Palindrome check\n\nmy_list = [3, 1, 2]\nmy_list.sort()\nprint(my_list)\n\nmy_dict = {"name": "Jenifer", "level": 5}\nprint(my_dict["name"])`,
    expected_output: `True\n[1, 2, 3]\nJenifer`,
    common_mistakes: 'Trying to modify a string directly (strings are immutable). Confusing list.sort() (in-place) with sorted() (new list).',
    problem: {
      title: 'Palindrome Check',
      slug: 'palindrome-check-mod6',
      difficulty: 'Easy',
      statement: 'Read a word. Print "YES" if palindrome (case-insensitive), else "NO".',
      input_format: 'Single word.',
      output_format: 'YES or NO',
      constraints: '1 <= len(word) <= 1000',
      starter_code: `import sys\n\ndef solve():\n    word = sys.stdin.read().strip().lower()\n    print("YES" if word == word[::-1] else "NO")\n\nif __name__ == '__main__':\n    solve()`,
      public_tests: [{ input: 'Racecar', expected_output: 'YES' }, { input: 'Python', expected_output: 'NO' }],
      hidden_tests: [{ input: 'level', expected_output: 'YES' }, { input: 'hello', expected_output: 'NO' }]
    },
    questions: [
      { type: 'mcq', prompt: 'Which data structure is immutable and ordered in Python?', code_snippet: null, options: ['list', 'set', 'tuple', 'dict'], correct: 'tuple', explanation: 'Tuples are immutable ordered sequences. Lists are mutable.' }
    ]
  },
  {
    module: 7,
    title: 'Files & Error Handling',
    slug: 'files-error-handling-mod7',
    description: 'File Handling, Read/Write, Exceptions, try/except, and Custom Errors.',
    concept: 'File I/O allows programs to persist data. Exception handling prevents crashes from unexpected errors.',
    content: `# Module 7 — Files & Error Handling\n\n\`\`\`python\n# File reading\nwith open("file.txt", "r") as f:\n    content = f.read()\n\n# Exception handling\ntry:\n    val = int("abc")\nexcept ValueError as e:\n    print("Error:", e)\nfinally:\n    print("Always runs")\n\`\`\``,
    code_example: `def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return "Cannot divide by zero"\n\nprint(safe_divide(10, 2))\nprint(safe_divide(10, 0))`,
    expected_output: `5.0\nCannot divide by zero`,
    common_mistakes: 'Using bare except without specifying exception type. Not closing files (use with statement).',
    problem: {
      title: 'Safe Integer Sum',
      slug: 'safe-integer-sum-mod7',
      difficulty: 'Easy',
      statement: 'Read tokens. Sum all valid integers, skip non-integer tokens. Print sum.',
      input_format: 'Whitespace-separated tokens.',
      output_format: 'Integer sum.',
      constraints: '1 <= tokens <= 1000',
      starter_code: `import sys\n\ndef solve():\n    total = 0\n    for t in sys.stdin.read().split():\n        try:\n            total += int(t)\n        except ValueError:\n            pass\n    print(total)\n\nif __name__ == '__main__':\n    solve()`,
      public_tests: [{ input: '10 abc 20 xyz 5', expected_output: '35' }, { input: 'hello world', expected_output: '0' }],
      hidden_tests: [{ input: '-5 5 100 error -50', expected_output: '50' }, { input: '42', expected_output: '42' }]
    },
    questions: [
      { type: 'mcq', prompt: 'Which block ALWAYS executes, whether or not an exception occurred?', code_snippet: 'try: ...\nexcept: ...\n???: ...', options: ['else', 'finally', 'always', 'done'], correct: 'finally', explanation: 'The finally block always runs, ensuring cleanup.' }
    ]
  },
  {
    module: 8,
    title: 'Modules & OOP',
    slug: 'modules-oop-mod8',
    description: 'Modules, Packages, Classes, Objects, Constructors, Inheritance, and Encapsulation.',
    concept: 'OOP bundles state and behavior into classes. Modules organize code into reusable files. Inheritance enables code reuse across class hierarchies.',
    content: `# Module 8 — Modules & OOP\n\n\`\`\`python\nimport math\nfrom collections import Counter\n\nclass BankAccount:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.__balance = balance  # Private\n\n    def deposit(self, amount):\n        self.__balance += amount\n\n    def get_balance(self):\n        return self.__balance\n\`\`\``,
    code_example: `class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return "..."\n\nclass Dog(Animal):\n    def speak(self):\n        return f"{self.name} says Woof!"\n\nd = Dog("Rex")\nprint(d.speak())`,
    expected_output: `Rex says Woof!`,
    common_mistakes: 'Forgetting "self" as first parameter. Circular imports between modules.',
    problem: {
      title: 'Bank Account Simulator',
      slug: 'bank-account-sim-mod8',
      difficulty: 'Medium',
      statement: 'Simulate account with D (deposit) and W (withdraw) operations. Ignore withdrawals exceeding balance. Print final balance.',
      input_format: 'Lines "D amount" or "W amount".',
      output_format: 'Final integer balance.',
      constraints: '1 <= operations <= 1000',
      starter_code: `import sys\n\nclass Account:\n    def __init__(self):\n        self.balance = 0\n    def deposit(self, amt):\n        self.balance += amt\n    def withdraw(self, amt):\n        if amt <= self.balance:\n            self.balance -= amt\n\ndef solve():\n    acc = Account()\n    for line in sys.stdin:\n        parts = line.strip().split()\n        if len(parts) == 2:\n            op, amt = parts[0], int(parts[1])\n            if op == 'D':\n                acc.deposit(amt)\n            elif op == 'W':\n                acc.withdraw(amt)\n    print(acc.balance)\n\nif __name__ == '__main__':\n    solve()`,
      public_tests: [{ input: 'D 100\nW 30\nD 50', expected_output: '120' }, { input: 'W 50\nD 25', expected_output: '25' }],
      hidden_tests: [{ input: 'D 200\nW 250\nW 100', expected_output: '100' }, { input: 'D 500\nW 500', expected_output: '0' }]
    },
    questions: [
      { type: 'mcq', prompt: 'What represents the object instance in Python class methods?', code_snippet: 'class Car:\n    def drive(???): pass', options: ['this', 'self', 'instance', 'me'], correct: 'self', explanation: 'self is the conventional name for the first parameter in instance methods.' }
    ]
  },
  {
    module: 9,
    title: 'Advanced Python',
    slug: 'advanced-python-mod9',
    description: 'List Comprehensions, Iterators, Generators, Decorators, and Advanced Problem Solving.',
    concept: 'Advanced Python idioms write elegant, memory-efficient code. Generators use yield for lazy evaluation. Decorators wrap functions for cross-cutting concerns.',
    content: `# Module 9 — Advanced Python\n\n### List Comprehension\n\`\`\`python\nsquares = [x**2 for x in range(10)]\n\`\`\`\n\n### Generator\n\`\`\`python\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        yield a\n        a, b = b, a + b\n\`\`\`\n\n### Decorator\n\`\`\`python\ndef logger(func):\n    def wrapper(*args):\n        print(f"Calling {func.__name__}")\n        return func(*args)\n    return wrapper\n\`\`\``,
    code_example: `def fibonacci_gen(limit):\n    a, b = 0, 1\n    for _ in range(limit):\n        yield a\n        a, b = b, a + b\n\nprint(list(fibonacci_gen(7)))`,
    expected_output: `[0, 1, 1, 2, 3, 5, 8]`,
    common_mistakes: 'Calling a generator and expecting a list — must convert with list() or iterate. Decorator order matters.',
    problem: {
      title: 'Two Sum',
      slug: 'two-sum-mod9',
      difficulty: 'Medium',
      statement: 'Given integers and a target, find indices of two numbers that sum to target. Print smaller then larger index.',
      input_format: 'Line 1: space-separated integers. Line 2: target integer.',
      output_format: 'Two indices (smaller first).',
      constraints: '2 <= len(nums) <= 10^5',
      starter_code: `import sys\n\ndef solve():\n    lines = sys.stdin.read().strip().split('\\n')\n    nums = list(map(int, lines[0].split()))\n    target = int(lines[1])\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            print(f"{seen[complement]} {i}")\n            return\n        seen[num] = i\n\nif __name__ == '__main__':\n    solve()`,
      public_tests: [{ input: '2 7 11 15\n9', expected_output: '0 1' }, { input: '3 2 4\n6', expected_output: '1 2' }],
      hidden_tests: [{ input: '3 3\n6', expected_output: '0 1' }, { input: '1 5 8 10 14\n22', expected_output: '2 4' }]
    },
    questions: [
      { type: 'mcq', prompt: 'What keyword turns a Python function into a generator?', code_snippet: 'def gen():\n    ??? 42', options: ['return', 'yield', 'produce', 'emit'], correct: 'yield', explanation: 'yield makes a function into a generator that produces values lazily.' }
    ]
  },
  {
    module: 10,
    title: 'Python Mastery Assessment',
    slug: 'python-mastery-assessment-mod10',
    description: 'Final assessment: MCQs, Output Prediction, Debugging, Coding Problems, and Multiple Test Cases.',
    concept: 'Comprehensive evaluation of all Python concepts learned across Modules 1-9. Demonstrates full Python mastery.',
    content: `# Module 10 — Python Mastery Assessment\n\nThis final module tests all skills from Modules 1-9:\n\n- **MCQs**: Core Python concepts\n- **Output Prediction**: Trace code mentally\n- **Debugging**: Fix broken code\n- **Coding Problems**: Real algorithmic challenges\n- **Multiple Test Cases**: Edge cases matter\n\nSuccessfully completing this module earns you the **Python Master** badge and course completion!`,
    code_example: `# GCD using Euclidean algorithm\ndef gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a\n\nprint(gcd(48, 18))  # 6\nprint(gcd(100, 75)) # 25`,
    expected_output: `6\n25`,
    common_mistakes: 'Forgetting edge cases (n=0, n=1, negative numbers). Not reading all input lines.',
    problem: {
      title: 'GCD of Array',
      slug: 'gcd-array-mod10',
      difficulty: 'Medium',
      statement: 'Read space-separated integers and print their GCD.',
      input_format: 'Integers on one line.',
      output_format: 'Single integer (GCD).',
      constraints: '2 <= count <= 100, 1 <= value <= 10^9',
      starter_code: `import sys\nimport math\nfrom functools import reduce\n\ndef solve():\n    nums = list(map(int, sys.stdin.read().split()))\n    print(reduce(math.gcd, nums))\n\nif __name__ == '__main__':\n    solve()`,
      public_tests: [{ input: '24 36 60', expected_output: '12' }, { input: '15 25 35', expected_output: '5' }],
      hidden_tests: [{ input: '7 13', expected_output: '1' }, { input: '100 200 500', expected_output: '100' }]
    },
    questions: [
      { type: 'mcq', prompt: 'Which of these is the correct way to call a function defined as def greet(name, greeting="Hello"):?', code_snippet: null, options: ['greet(greeting="Hi")', 'greet("Jenifer")', 'greet("Hi", "Jenifer")', 'greet()'], correct: 'greet("Jenifer")', explanation: 'name is required, greeting has a default. greet("Jenifer") is valid.' },
      { type: 'prediction', prompt: 'What is the output of [x for x in range(5) if x % 2 == 0]?', code_snippet: 'print([x for x in range(5) if x % 2 == 0])', options: ['[0, 2, 4]', '[1, 3]', '[0, 1, 2, 3, 4]', '[2, 4]'], correct: '[0, 2, 4]', explanation: 'range(5) = 0,1,2,3,4. Even numbers: 0, 2, 4.' }
    ]
  }
];

for (const mod of pythonModules) {
  const topicRes = insertTopic.run(
    pythonId, mod.module, mod.title, mod.slug,
    mod.description, mod.concept, mod.content,
    mod.code_example, mod.expected_output, mod.common_mistakes,
    100, 30
  );
  const topicId = topicRes.lastInsertRowid;

  if (mod.problem) {
    // Check if problem slug already exists (from old seed)
    const existingProb = db.prepare('SELECT id FROM coding_problems WHERE slug = ?').get(mod.problem.slug);
    let problemId;
    if (existingProb) {
      problemId = existingProb.id;
      db.prepare('UPDATE coding_problems SET topic_id = ? WHERE id = ?').run(topicId, problemId);
    } else {
      const probRes = insertProblem.run(
        topicId, mod.problem.title, mod.problem.slug, mod.problem.difficulty,
        mod.problem.statement, mod.problem.input_format, mod.problem.output_format,
        mod.problem.constraints, mod.problem.starter_code, 'python',
        mod.problem.difficulty === 'Easy' ? 25 : 50,
        mod.problem.difficulty === 'Easy' ? 15 : 25,
        3000
      );
      problemId = probRes.lastInsertRowid;

      for (const tc of mod.problem.public_tests) {
        insertTestCase.run(problemId, tc.input, tc.expected_output, 0);
      }
      for (const tc of mod.problem.hidden_tests) {
        insertTestCase.run(problemId, tc.input, tc.expected_output, 1);
      }
    }
  }

  for (const q of mod.questions) {
    insertQuestion.run(
      topicId, q.type, q.prompt, q.code_snippet || null,
      JSON.stringify(q.options), q.correct, q.explanation, 15, 8
    );
  }

  console.log(`  ✓ Module ${mod.module}: ${mod.title}`);
}

// ─── 4. ADD MODULE BADGES ─────────────────────────────────────────────────────
console.log('\nStep 4: Adding module completion badges...');

const badgesToAdd = [
  { key: 'first_module', name: 'First Module', desc: 'Completed your first Python module.', icon: 'book-open', cat: 'Learning' },
  { key: 'module_5_python', name: 'Halfway There', desc: 'Completed 5 modules of Python Mastery.', icon: 'trending-up', cat: 'Learning' },
  { key: 'python_complete', name: 'Python Master', desc: 'Completed all 10 modules of Python Mastery!', icon: 'star', cat: 'Course' },
  { key: 'course_started', name: 'Explorer', desc: 'Started learning a new course.', icon: 'compass', cat: 'Learning' },
  { key: 'assessment_complete', name: 'Assessment Champion', desc: 'Completed a final module assessment.', icon: 'check-circle', cat: 'Assessment' },
];

for (const badge of badgesToAdd) {
  try {
    db.prepare(`
      INSERT OR IGNORE INTO badges (badge_key, name, description, icon, category)
      VALUES (?, ?, ?, ?, ?)
    `).run(badge.key, badge.name, badge.desc, badge.icon, badge.cat);
    console.log(`  ✓ Badge: ${badge.name}`);
  } catch (e) {
    console.log(`  ⚠ Badge ${badge.key} already exists`);
  }
}

// ─── 5. UPDATE OTHER COURSES — seed basic 10 topics for non-Python courses ───
console.log('\nStep 5: Ensuring other courses have module structure...');

const otherCourses = db.prepare("SELECT * FROM courses WHERE slug != 'python'").all();

for (const course of otherCourses) {
  const existingTopics = db.prepare('SELECT COUNT(*) as count FROM course_topics WHERE course_id = ?').get(course.id).count;
  
  if (existingTopics === 0) {
    // Seed 10 placeholder modules for each course
    const moduleNames = {
      'c': ['C Fundamentals', 'Variables & Types', 'Operators', 'Control Flow', 'Functions', 'Arrays & Pointers', 'Strings', 'Structures', 'File I/O', 'Final Assessment'],
      'cpp': ['C++ Basics', 'OOP Fundamentals', 'Classes & Objects', 'Inheritance', 'Polymorphism', 'Templates & STL', 'Memory Management', 'File Handling', 'Advanced C++', 'Final Assessment'],
      'java': ['Java Basics', 'Variables & Types', 'Control Flow', 'OOP in Java', 'Inheritance', 'Interfaces', 'Collections', 'Exception Handling', 'Multithreading', 'Final Assessment'],
      'web-dev': ['HTML Fundamentals', 'CSS Styling', 'Flexbox & Grid', 'JavaScript Basics', 'DOM Manipulation', 'Events & APIs', 'Fetch & Async', 'React Basics', 'Backend Intro', 'Final Assessment'],
      'machine-learning': ['Python for ML', 'NumPy & Pandas', 'Data Visualization', 'Statistics', 'Linear Regression', 'Classification', 'Clustering', 'Model Evaluation', 'Advanced ML', 'Final Assessment'],
    };
    
    const names = moduleNames[course.slug] || Array.from({ length: 10 }, (_, i) => `Module ${i + 1}`);
    
    for (let i = 0; i < 10; i++) {
      insertTopic.run(
        course.id, i + 1, names[i],
        `${course.slug}-module-${i + 1}`,
        `${course.title}: ${names[i]} — foundational concepts and practical exercises.`,
        `Core concepts of ${names[i]} in ${course.title}.`,
        `# ${names[i]}\n\nLearn the fundamentals of ${names[i]} in the context of ${course.title}.\n\nThis module includes theoretical lessons, code examples, and assessments.`,
        `# ${course.title} — ${names[i]}\nprint("Hello from ${names[i]}!")`,
        `Hello from ${names[i]}!`,
        'Practice the concepts before attempting the module assessment.',
        100, 30
      );
    }
    console.log(`  ✓ ${course.title}: 10 modules created`);
  } else if (existingTopics > 10) {
    // Trim to 10 modules
    const topicsToRemove = db.prepare(
      'SELECT id FROM course_topics WHERE course_id = ? ORDER BY level_number ASC LIMIT -1 OFFSET 10'
    ).all(course.id);
    
    for (const t of topicsToRemove) {
      db.prepare('DELETE FROM topic_progress WHERE topic_id = ?').run(t.id);
      db.prepare('DELETE FROM coding_problems WHERE topic_id = ?').run(t.id);
      const qs = db.prepare('SELECT id FROM questions WHERE topic_id = ?').all(t.id).map(q => q.id);
      if (qs.length > 0) {
        db.prepare(`DELETE FROM question_attempts WHERE question_id IN (${qs.map(() => '?').join(',')})`).run(...qs);
        db.prepare(`DELETE FROM questions WHERE topic_id = ?`).run(t.id);
      }
      db.prepare('DELETE FROM course_topics WHERE id = ?').run(t.id);
    }
    console.log(`  ✓ ${course.title}: trimmed to 10 modules`);
  } else {
    console.log(`  ✓ ${course.title}: already has ${existingTopics} modules`);
  }
}

// Update total_levels again after topic adjustments
db.prepare('UPDATE courses SET total_levels = 10').run();

console.log('\n✅ Migration completed successfully!');
console.log('   - All courses unlocked');
console.log('   - Python restructured to 10 modules');
console.log('   - Other courses have 10 modules');
console.log('   - Module badges added');
console.log('   - Server restart required to pick up changes');
