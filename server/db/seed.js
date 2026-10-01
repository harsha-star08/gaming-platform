import { db, initDatabase } from './schema.js';

export function seedEducationalContent() {
  initDatabase();

  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
  if (courseCount > 0) {
    return; // Already seeded
  }

  // 1. Seed Courses
  const insertCourse = db.prepare(`
    INSERT INTO courses (slug, title, description, icon, is_locked, total_levels)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertCourse.run('python', 'Python Mastery', 'Master Python from ground zero to advanced OOP, algorithms, and data structures.', 'code', 0, 16);
  insertCourse.run('c', 'C Programming', 'Understand low-level memory, pointers, and systems programming.', 'cpu', 1, 12);
  insertCourse.run('cpp', 'C++ Object Oriented', 'High performance programming, STL, templates, and memory management.', 'terminal', 1, 14);
  insertCourse.run('java', 'Java Core & Enterprise', 'Object-oriented patterns, multithreading, and scalable backend design.', 'coffee', 1, 14);
  insertCourse.run('web-dev', 'Modern Full-Stack Web', 'HTML5, CSS3 modern layouts, JavaScript ESNext, and APIs.', 'globe', 1, 10);
  insertCourse.run('machine-learning', 'Machine Learning Foundations', 'NumPy, Pandas, Scikit-learn, and core machine learning models.', 'brain', 1, 12);

  const pythonCourse = db.prepare("SELECT id FROM courses WHERE slug = 'python'").get();
  const pythonId = pythonCourse.id;

  // 2. Seed 16 Python Levels
  const pythonLevels = [
    {
      level: 1,
      title: 'Variables & Data Types',
      slug: 'variables-and-data-types',
      description: 'Understand integers, floats, strings, booleans, type conversion, and type() inspection.',
      concept: 'Variables act as labeled memory containers in Python. Python is dynamically typed.',
      content: `# Variables and Data Types in Python\n\nIn Python, a variable is created the moment you first assign a value to it.\n\n### Fundamental Types:\n- **int**: Whole numbers (e.g. \`age = 19\`)\n- **float**: Decimals (e.g. \`height = 152.0\`)\n- **str**: Text enclosed in single or double quotes (e.g. \`name = "Jenifer"\`)\n- **bool**: Boolean truth values (\`True\` or \`False\`)\n\n### Type Conversion & Inspection:\nYou can check a variable's type with \`type(var)\` and cast with \`int()\`, \`float()\`, \`str()\`.`,
      code_example: `name = "Jenifer"\nage = 19\nheight = 152.0\nstudent = True\n\nprint(f"Student: {name}, Age: {age}, Height: {height}cm, Active: {student}")\nprint(type(name), type(age))`,
      expected_output: `Student: Jenifer, Age: 19, Height: 152.0cm, Active: True\n<class 'str'> <class 'int'>`,
      common_mistakes: 'Confusing float and int during string concatenation. Always use f-strings or convert with str().',
      problem: {
        title: 'Sum of Two Numbers',
        slug: 'sum-of-two-numbers',
        difficulty: 'Easy',
        statement: 'Read two integers a and b from standard input (each on its own line) and print their sum.',
        input_format: 'Two lines: first line integer a, second line integer b.',
        output_format: 'Single integer representing a + b.',
        constraints: '-10^6 <= a, b <= 10^6',
        starter_code: `import sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    a = int(lines[0])\n    b = int(lines[1])\n    # Write your solution below\n    print(a + b)\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: '3\n5', expected_output: '8' },
          { input: '-10\n4', expected_output: '-6' }
        ],
        hidden_tests: [
          { input: '100\n250', expected_output: '350' },
          { input: '0\n0', expected_output: '0' },
          { input: '-50\n-50', expected_output: '-100' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'What will type(152.0) return in Python?',
          code_snippet: 'x = 152.0\nprint(type(x))',
          options: ["<class 'int'>", "<class 'float'>", "<class 'str'>", "<class 'double'>"],
          correct: "<class 'float'>",
          explanation: 'Floating point numbers with decimal points are represented as float in Python.'
        },
        {
          type: 'prediction',
          prompt: 'What is the output of print(int("42") + 8)?',
          code_snippet: 'res = int("42") + 8\nprint(res)',
          options: ['428', '50', 'TypeError', '42'],
          correct: '50',
          explanation: 'int("42") converts string "42" to integer 42, which is added to 8 yielding 50.'
        }
      ]
    },
    {
      level: 2,
      title: 'Input & Output',
      slug: 'input-and-output',
      description: 'Master standard input reading with input(), sys.stdin, print formatting, sep, and end parameters.',
      concept: 'Interactive programs gather input from users and display formatted results.',
      content: `# Input and Output\n\n- \`input(prompt)\`: Reads a line from console as string.\n- \`print(*objects, sep=' ', end='\\n')\`: Outputs formatted data.\n- F-strings: \`f"{variable}"\` format values cleanly.`,
      code_example: `user_name = "Alex"\nscore = 95\nprint(f"User {user_name} scored {score} points!", end=" [PASSED]\\n")`,
      expected_output: `User Alex scored 95 points! [PASSED]`,
      common_mistakes: 'Forgetting that input() always returns a string, even if the user typed numbers.',
      problem: {
        title: 'Personalized Greeting',
        slug: 'personalized-greeting',
        difficulty: 'Easy',
        statement: 'Read a name from standard input and print "Hello, {name}!"',
        input_format: 'A single line containing the name string.',
        output_format: 'Hello, {name}!',
        constraints: '1 <= len(name) <= 100',
        starter_code: `import sys\n\ndef solve():\n    name = sys.stdin.read().strip()\n    # Print greeting\n    print(f"Hello, {name}!")\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: 'Alice', expected_output: 'Hello, Alice!' },
          { input: 'Bob', expected_output: 'Hello, Bob!' }
        ],
        hidden_tests: [
          { input: 'Jenifer', expected_output: 'Hello, Jenifer!' },
          { input: 'Developer', expected_output: 'Hello, Developer!' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'What does the input() function return by default?',
          code_snippet: 'x = input("Enter number: ")',
          options: ['An integer', 'A float', 'A string', 'None'],
          correct: 'A string',
          explanation: 'input() always reads input as a string in Python 3.'
        }
      ]
    },
    {
      level: 3,
      title: 'Operators',
      slug: 'operators',
      description: 'Arithmetic (+, -, *, /, //, %, **), comparison (==, !=, <, >), and logical (and, or, not) operators.',
      concept: 'Operators perform mathematical and logical computations on variables and values.',
      content: `# Operators in Python\n\n- **Floor division** (\`//\`): truncates decimals: \`7 // 2 == 3\`\n- **Modulus** (\`%\`): remainder: \`7 % 2 == 1\`\n- **Exponentiation** (\`**\`): power: \`2 ** 3 == 8\`\n- **Logical**: \`and\`, \`or\`, \`not\``,
      code_example: `a = 17\nb = 5\nprint(a // b) # 3\nprint(a % b)  # 2\nprint(a ** 2) # 289`,
      expected_output: `3\n2\n289`,
      common_mistakes: 'Using / instead of // when an integer result is expected.',
      problem: {
        title: 'Even or Odd Number',
        slug: 'even-or-odd',
        difficulty: 'Easy',
        statement: 'Read an integer n and print "Even" if it is even, or "Odd" if it is odd.',
        input_format: 'A single integer n.',
        output_format: '"Even" or "Odd".',
        constraints: '-10^9 <= n <= 10^9',
        starter_code: `import sys\n\ndef solve():\n    val = int(sys.stdin.read().strip())\n    if val % 2 == 0:\n        print("Even")\n    else:\n        print("Odd")\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: '4', expected_output: 'Even' },
          { input: '7', expected_output: 'Odd' }
        ],
        hidden_tests: [
          { input: '0', expected_output: 'Even' },
          { input: '-3', expected_output: 'Odd' },
          { input: '1000000', expected_output: 'Even' }
        ]
      },
      questions: [
        {
          type: 'prediction',
          prompt: 'What is the output of print(19 // 4)?',
          code_snippet: 'print(19 // 4)',
          options: ['4.75', '4', '5', '3'],
          correct: '4',
          explanation: '19 // 4 performs floor division and results in 4.'
        }
      ]
    },
    {
      level: 4,
      title: 'Conditional Statements',
      slug: 'conditional-statements',
      description: 'Control program flow with if, elif, else, and nested conditions.',
      concept: 'Conditionals branch program execution based on boolean truth expressions.',
      content: `# Conditional Statements\n\nSyntax:\n\`\`\`python\nif condition1:\n    # execute when condition1 is True\nelif condition2:\n    # execute when condition2 is True\nelse:\n    # execute otherwise\n\`\`\``,
      code_example: `grade = 85\nif grade >= 90:\n    print("A")\nelif grade >= 80:\n    print("B")\nelse:\n    print("C")`,
      expected_output: `B`,
      common_mistakes: 'Using single = (assignment) instead of == (equality comparison).',
      problem: {
        title: 'Find Maximum of Three Numbers',
        slug: 'max-of-three',
        difficulty: 'Easy',
        statement: 'Read three integers a, b, and c separated by whitespace and print the maximum value.',
        input_format: 'Three space-separated integers.',
        output_format: 'The maximum integer.',
        constraints: '-10^6 <= a, b, c <= 10^6',
        starter_code: `import sys\n\ndef solve():\n    nums = [int(x) for x in sys.stdin.read().split()]\n    a, b, c = nums[0], nums[1], nums[2]\n    ans = a\n    if b > ans:\n        ans = b\n    if c > ans:\n        ans = c\n    print(ans)\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: '10 25 15', expected_output: '25' },
          { input: '5 5 2', expected_output: '5' }
        ],
        hidden_tests: [
          { input: '-10 -5 -20', expected_output: '-5' },
          { input: '100 100 100', expected_output: '100' },
          { input: '99 12 101', expected_output: '101' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'Which keyword in Python is used for "else if"?',
          code_snippet: 'if x > 0:\n    pass\n??? x < 0:\n    pass',
          options: ['elseif', 'else if', 'elif', 'elsif'],
          correct: 'elif',
          explanation: 'Python uses the keyword elif for chained conditional branches.'
        }
      ]
    },
    {
      level: 5,
      title: 'Loops',
      slug: 'loops',
      description: 'Master for loops, while loops, range(), break, continue, and loop else blocks.',
      concept: 'Loops iterate through sequences or repeat code while a condition holds true.',
      content: `# Loops in Python\n\n### For loop with range:\n\`\`\`python\nfor i in range(1, 6):\n    print(i)\n\`\`\`\n\n### While loop:\n\`\`\`python\ncount = 3\nwhile count > 0:\n    print(count)\n    count -= 1\n\`\`\``,
      code_example: `total = 0\nfor i in range(1, 6):\n    total += i\nprint(f"Total: {total}")`,
      expected_output: `Total: 15`,
      common_mistakes: 'Infinite while loops when forgotten to increment/decrement the counter variable.',
      problem: {
        title: 'Factorial of a Number',
        slug: 'factorial-number',
        difficulty: 'Easy',
        statement: 'Read an integer n (0 <= n <= 12) and print its factorial n! (where 0! = 1).',
        input_format: 'A single non-negative integer n.',
        output_format: 'An integer representing n!.',
        constraints: '0 <= n <= 12',
        starter_code: `import sys\n\ndef solve():\n    n = int(sys.stdin.read().strip())\n    res = 1\n    for i in range(1, n + 1):\n        res *= i\n    print(res)\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: '5', expected_output: '120' },
          { input: '0', expected_output: '1' }
        ],
        hidden_tests: [
          { input: '1', expected_output: '1' },
          { input: '6', expected_output: '720' },
          { input: '10', expected_output: '3628800' }
        ]
      },
      questions: [
        {
          type: 'prediction',
          prompt: 'How many times will this loop execute: for i in range(2, 8, 2)?',
          code_snippet: 'for i in range(2, 8, 2):\n    print(i)',
          options: ['3', '4', '6', '2'],
          correct: '3',
          explanation: 'range(2, 8, 2) produces values 2, 4, 6. Thus it runs 3 times.'
        }
      ]
    },
    {
      level: 6,
      title: 'Functions',
      slug: 'functions',
      description: 'Define functions with def, parameters, default arguments, return values, *args, and **kwargs.',
      concept: 'Functions encapsulate reusable logic and enforce modular code design.',
      content: `# Functions\n\nDefine functions using \`def\`:\n\`\`\`python\ndef add(a, b=0):\n    return a + b\n\`\`\`\nFunctions can return values using the \`return\` statement.`,
      code_example: `def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nprint(is_prime(17), is_prime(18))`,
      expected_output: `True False`,
      common_mistakes: 'Forgetting to return a value, causing the function to implicitly return None.',
      problem: {
        title: 'Check Prime Number',
        slug: 'check-prime',
        difficulty: 'Medium',
        statement: 'Read an integer n and print "PRIME" if n is a prime number (n >= 2), otherwise "NOT PRIME".',
        input_format: 'An integer n.',
        output_format: 'PRIME or NOT PRIME',
        constraints: '1 <= n <= 10^6',
        starter_code: `import sys\n\ndef is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\ndef solve():\n    n = int(sys.stdin.read().strip())\n    if is_prime(n):\n        print("PRIME")\n    else:\n        print("NOT PRIME")\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: '11', expected_output: 'PRIME' },
          { input: '4', expected_output: 'NOT PRIME' }
        ],
        hidden_tests: [
          { input: '1', expected_output: 'NOT PRIME' },
          { input: '2', expected_output: 'PRIME' },
          { input: '97', expected_output: 'PRIME' },
          { input: '100', expected_output: 'NOT PRIME' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'What is the default return value of a Python function that has no return statement?',
          code_snippet: 'def greet():\n    print("Hi")',
          options: ['0', 'None', 'False', 'Empty string'],
          correct: 'None',
          explanation: 'Python functions return None by default if no return statement is executed.'
        }
      ]
    },
    {
      level: 7,
      title: 'Strings',
      slug: 'strings',
      description: 'String slicing, methods (.upper(), .split(), .join(), .strip()), and formatting.',
      concept: 'Strings are immutable sequences of Unicode characters in Python.',
      content: `# Strings in Python\n\n- Slicing: \`text[start:stop:step]\`\n- Reverse string: \`text[::-1]\`\n- Splitting: \`text.split(",")\`\n- Joining: \`"-".join(items)\``,
      code_example: `s = "madam"\nis_palindrome = s == s[::-1]\nprint(f"'{s}' is palindrome: {is_palindrome}")`,
      expected_output: `'madam' is palindrome: True`,
      common_mistakes: 'Attempting to mutate a string directly: strings are immutable!',
      problem: {
        title: 'Check Palindrome String',
        slug: 'check-palindrome-string',
        difficulty: 'Easy',
        statement: 'Read a word and print "YES" if it reads the same forward and backwards (case-insensitive), otherwise "NO".',
        input_format: 'A single word on standard input.',
        output_format: 'YES or NO',
        constraints: '1 <= len(word) <= 1000',
        starter_code: `import sys\n\ndef solve():\n    word = sys.stdin.read().strip().lower()\n    if word == word[::-1]:\n        print("YES")\n    else:\n        print("NO")\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: 'Racecar', expected_output: 'YES' },
          { input: 'Python', expected_output: 'NO' }
        ],
        hidden_tests: [
          { input: 'madam', expected_output: 'YES' },
          { input: 'a', expected_output: 'YES' },
          { input: 'abccba', expected_output: 'YES' }
        ]
      },
      questions: [
        {
          type: 'prediction',
          prompt: 'What does "python"[1:4] return?',
          code_snippet: 'print("python"[1:4])',
          options: ['pyt', 'yth', 'ytho', 'pyth'],
          correct: 'yth',
          explanation: 'Index 1 is "y", index 2 is "t", index 3 is "h". Stop index 4 is excluded.'
        }
      ]
    },
    {
      level: 8,
      title: 'Lists',
      slug: 'lists',
      description: 'Dynamic arrays, indexing, slicing, append(), pop(), sort(), and list comprehensions.',
      concept: 'Lists are mutable ordered sequences commonly used to store collections.',
      content: `# Lists\n\n\`\`\`python\nnums = [1, 2, 3]\nnums.append(4)\nnums.pop()\nsquares = [x**2 for x in nums]\n\`\`\``,
      code_example: `nums = [5, 2, 9, 1, 7]\nnums.sort()\nprint(nums)\nevens = [x for x in nums if x % 2 != 0]\nprint(evens)`,
      expected_output: `[1, 2, 5, 7, 9]\n[1, 5, 7, 9]`,
      common_mistakes: 'Confusing sort() which mutates the list in-place and returns None, with sorted() which returns a new list.',
      problem: {
        title: 'Reverse a List of Numbers',
        slug: 'reverse-numbers-list',
        difficulty: 'Easy',
        statement: 'Read an array of space-separated integers and print them in reverse order separated by spaces.',
        input_format: 'A line containing space-separated integers.',
        output_format: 'Integers in reversed order separated by space.',
        constraints: '1 <= count <= 10^4',
        starter_code: `import sys\n\ndef solve():\n    nums = sys.stdin.read().split()\n    print(" ".join(nums[::-1]))\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: '1 2 3 4 5', expected_output: '5 4 3 2 1' },
          { input: '10 20', expected_output: '20 10' }
        ],
        hidden_tests: [
          { input: '42', expected_output: '42' },
          { input: '9 8 7 6 5 4 3 2 1', expected_output: '1 2 3 4 5 6 7 8 9' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'Which method removes and returns the last element of a list?',
          code_snippet: 'arr = [10, 20, 30]',
          options: ['arr.delete()', 'arr.remove()', 'arr.pop()', 'arr.slice()'],
          correct: 'arr.pop()',
          explanation: 'list.pop() removes and returns the element at the given index (defaulting to the last).'
        }
      ]
    },
    {
      level: 9,
      title: 'Tuples',
      slug: 'tuples',
      description: 'Immutable sequences, tuple unpacking, and performance advantages over lists.',
      concept: 'Tuples cannot be altered after creation, making them safe keys for dictionaries.',
      content: `# Tuples in Python\n\n\`\`\`python\npoint = (10, 20)\nx, y = point  # Unpacking\n\`\`\``,
      code_example: `student_record = ("Jenifer", 95, "A")\nname, score, grade = student_record\nprint(f"Name: {name}, Grade: {grade}")`,
      expected_output: `Name: Jenifer, Grade: A`,
      common_mistakes: 'Trying to assign to a tuple element (e.g. t[0] = 5) which raises TypeError.',
      problem: {
        title: 'Coordinate Distance Squared',
        slug: 'coordinate-distance-squared',
        difficulty: 'Easy',
        statement: 'Read 4 integers x1, y1, x2, y2 representing two points (x1, y1) and (x2, y2). Print (x2-x1)^2 + (y2-y1)^2.',
        input_format: 'Four space-separated integers.',
        output_format: 'Single integer.',
        constraints: '-10^4 <= coords <= 10^4',
        starter_code: `import sys\n\ndef solve():\n    nums = [int(x) for x in sys.stdin.read().split()]\n    p1 = (nums[0], nums[1])\n    p2 = (nums[2], nums[3])\n    dist_sq = (p2[0] - p1[0])**2 + (p2[1] - p1[1])**2\n    print(dist_sq)\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: '0 0 3 4', expected_output: '25' },
          { input: '1 1 1 1', expected_output: '0' }
        ],
        hidden_tests: [
          { input: '2 3 5 7', expected_output: '25' },
          { input: '-3 -4 0 0', expected_output: '25' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'How do you create a tuple with a single element in Python?',
          code_snippet: 'x = ?',
          options: ['(5)', '(5,)', '[5]', 'tuple(5)'],
          correct: '(5,)',
          explanation: 'A trailing comma (5,) is required to distinguish a single-element tuple from parentheses.'
        }
      ]
    },
    {
      level: 10,
      title: 'Sets',
      slug: 'sets',
      description: 'Unique collections, union (|), intersection (&), difference (-), and fast O(1) membership testing.',
      concept: 'Sets store unordered unique items and provide mathematical set operations.',
      content: `# Sets in Python\n\n\`\`\`python\ns = {1, 2, 2, 3}\nprint(s)  # {1, 2, 3}\n\`\`\``,
      code_example: `a = {1, 2, 3, 4}\nb = {3, 4, 5, 6}\nprint("Intersection:", sorted(list(a & b)))\nprint("Union:", sorted(list(a | b)))`,
      expected_output: `Intersection: [3, 4]\nUnion: [1, 2, 3, 4, 5, 6]`,
      common_mistakes: 'Using {} to create an empty set (which actually creates an empty dict; use set() instead).',
      problem: {
        title: 'Count Unique Elements',
        slug: 'count-unique-elements',
        difficulty: 'Easy',
        statement: 'Given a sequence of words on standard input, print the number of unique words.',
        input_format: 'Words separated by space or newline.',
        output_format: 'An integer representing the count of unique words.',
        constraints: '1 <= total words <= 10^5',
        starter_code: `import sys\n\ndef solve():\n    words = sys.stdin.read().split()\n    unique_words = set(words)\n    print(len(unique_words))\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: 'apple banana apple orange banana', expected_output: '3' },
          { input: 'a a a a', expected_output: '1' }
        ],
        hidden_tests: [
          { input: 'hello world', expected_output: '2' },
          { input: 'one two three four five', expected_output: '5' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'How do you initialize an empty set in Python?',
          code_snippet: 'empty = ???',
          options: ['{}', 'set()', '[]', '()'],
          correct: 'set()',
          explanation: '{} initializes an empty dictionary. Use set() for an empty set.'
        }
      ]
    },
    {
      level: 11,
      title: 'Dictionaries',
      slug: 'dictionaries',
      description: 'Key-value mappings, dict comprehensions, .get(), .items(), .keys(), and frequency counting.',
      concept: 'Dictionaries map unique hashable keys to values with O(1) average lookup time.',
      content: `# Dictionaries\n\n\`\`\`python\nuser = {"name": "Jenifer", "role": "STUDENT"}\nprint(user.get("role"))\n\`\`\``,
      code_example: `text = "banana"\ncounts = {}\nfor ch in text:\n    counts[ch] = counts.get(ch, 0) + 1\nprint(sorted(counts.items()))`,
      expected_output: `[('a', 3), ('b', 1), ('n', 2)]`,
      common_mistakes: 'Accessing a non-existent key with dict[key] instead of dict.get(key, default) raises KeyError.',
      problem: {
        title: 'Word Frequency Counter',
        slug: 'word-frequency-counter',
        difficulty: 'Medium',
        statement: 'Read words from input. Print the word that appears most frequently. If tied, print the lexicographically smallest.',
        input_format: 'Whitespace-separated words.',
        output_format: 'The most frequent word.',
        constraints: '1 <= total words <= 10^4',
        starter_code: `import sys\n\ndef solve():\n    words = sys.stdin.read().split()\n    if not words:\n        return\n    freq = {}\n    for w in words:\n        freq[w] = freq.get(w, 0) + 1\n    best_word = min(freq.keys(), key=lambda w: (-freq[w], w))\n    print(best_word)\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: 'apple banana apple orange banana apple', expected_output: 'apple' },
          { input: 'b a b a', expected_output: 'a' }
        ],
        hidden_tests: [
          { input: 'cat dog bird dog cat dog', expected_output: 'dog' },
          { input: 'code code code', expected_output: 'code' }
        ]
      },
      questions: [
        {
          type: 'prediction',
          prompt: 'What does d.get("age", 20) return if "age" is not in d?',
          code_snippet: 'd = {"name": "Sam"}\nprint(d.get("age", 20))',
          options: ['KeyError', 'None', '20', 'False'],
          correct: '20',
          explanation: 'The second argument to dict.get is the default fallback if the key is missing.'
        }
      ]
    },
    {
      level: 12,
      title: 'File Handling',
      slug: 'file-handling',
      description: 'Opening, reading, writing files using context managers (with open(...) as f:).',
      concept: 'Context managers ensure files are safely closed even if exceptions occur during processing.',
      content: `# File Handling\n\n\`\`\`python\nwith open("data.txt", "w") as f:\n    f.write("Hello world\\n")\n\`\`\``,
      code_example: `lines = ["Line 1", "Line 2", "Line 3"]\nformatted = "\\n".join(lines)\nprint(f"Processed {len(lines)} lines:\\n{formatted}")`,
      expected_output: `Processed 3 lines:\nLine 1\nLine 2\nLine 3`,
      common_mistakes: 'Opening files without using "with" statement, which risks file descriptor leaks.',
      problem: {
        title: 'Line Count and Word Count',
        slug: 'line-and-word-count',
        difficulty: 'Easy',
        statement: 'Read text from input until EOF. Print two numbers: total lines and total words separated by space.',
        input_format: 'Multiline text.',
        output_format: 'Two space-separated integers: lines words',
        constraints: '1 <= lines <= 1000',
        starter_code: `import sys\n\ndef solve():\n    raw = sys.stdin.read()\n    if not raw.strip():\n        print("0 0")\n        return\n    lines = raw.strip().split('\\n')\n    words = raw.split()\n    print(f"{len(lines)} {len(words)}")\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: 'Hello World\\nWelcome to Python', expected_output: '2 5' },
          { input: 'One line only', expected_output: '1 3' }
        ],
        hidden_tests: [
          { input: 'Line 1\\nLine 2\\nLine 3\\nLine 4', expected_output: '4 8' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'Why is the "with open(...) as f" statement preferred when working with files?',
          code_snippet: 'with open("file.txt") as f:\n    content = f.read()',
          options: ['It runs faster', 'It automatically closes the file even if errors occur', 'It encrypts the file', 'It creates the file in memory'],
          correct: 'It automatically closes the file even if errors occur',
          explanation: 'Context managers guarantee cleanup and file closure on block exit.'
        }
      ]
    },
    {
      level: 13,
      title: 'Exception Handling',
      slug: 'exception-handling',
      description: 'Handling runtime errors gracefully using try, except, else, finally, and custom exceptions.',
      concept: 'Robust programs anticipate and handle exceptions without crashing unexpectedly.',
      content: `# Exception Handling\n\n\`\`\`python\ntry:\n    val = int("abc")\nexcept ValueError as err:\n    print("Caught:", err)\nfinally:\n    print("Cleanup done")\n\`\`\``,
      code_example: `def safe_divide(a, b):\n    try:\n        return a / b\n    except ZeroDivisionError:\n        return "Cannot divide by zero"\n\nprint(safe_divide(10, 2))\nprint(safe_divide(10, 0))`,
      expected_output: `5.0\nCannot divide by zero`,
      common_mistakes: 'Using bare except: without specifying the exception type, catching keyboard interrupts.',
      problem: {
        title: 'Safe Integer Parser',
        slug: 'safe-integer-parser',
        difficulty: 'Easy',
        statement: 'Read tokens from input. For each token, if it can be parsed as an integer, sum it. Print the total sum of valid integers.',
        input_format: 'Whitespace-separated tokens.',
        output_format: 'Single integer representing the sum.',
        constraints: '1 <= tokens <= 1000',
        starter_code: `import sys\n\ndef solve():\n    tokens = sys.stdin.read().split()\n    total = 0\n    for t in tokens:\n        try:\n            val = int(t)\n            total += val\n        except ValueError:\n            pass\n    print(total)\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: '10 abc 20 xyz 5', expected_output: '35' },
          { input: 'hello world', expected_output: '0' }
        ],
        hidden_tests: [
          { input: '-5 5 100 error -50', expected_output: '100' },
          { input: '42', expected_output: '42' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'Which block in try-except is ALWAYS executed, regardless of whether an exception occurred?',
          code_snippet: 'try: ...\nexcept: ...\n???: ...',
          options: ['else', 'finally', 'catch', 'always'],
          correct: 'finally',
          explanation: 'The finally block always runs, ensuring resource deallocation.'
        }
      ]
    },
    {
      level: 14,
      title: 'Modules',
      slug: 'modules',
      description: 'Organize code into reusable modules, importing with import / from ... import, and __name__ == "__main__".',
      concept: 'Modules allow modular code separation and enable importing the Python standard library.',
      content: `# Modules\n\n- \`import math\`\n- \`from collections import Counter, defaultdict\`\n- \`import sys\``,
      code_example: `import math\nprint("GCD(24, 36) =", math.gcd(24, 36))\nprint("Pi rounded =", round(math.pi, 4))`,
      expected_output: `GCD(24, 36) = 12\nPi rounded = 3.1416`,
      common_mistakes: 'Circular imports when two files import each other directly at top level.',
      problem: {
        title: 'Greatest Common Divisor of Array',
        slug: 'gcd-of-array',
        difficulty: 'Medium',
        statement: 'Read space-separated positive integers and print their greatest common divisor (GCD).',
        input_format: 'Integers on one line.',
        output_format: 'Single integer.',
        constraints: '2 <= count <= 100, 1 <= value <= 10^9',
        starter_code: `import sys\nimport math\nfrom functools import reduce\n\ndef solve():\n    nums = [int(x) for x in sys.stdin.read().split()]\n    if not nums:\n        return\n    ans = reduce(math.gcd, nums)\n    print(ans)\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: '24 36 60', expected_output: '12' },
          { input: '15 25 35', expected_output: '5' }
        ],
        hidden_tests: [
          { input: '7 13', expected_output: '1' },
          { input: '100 200 500', expected_output: '100' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'What does the special variable __name__ evaluate to when a script is executed directly?',
          code_snippet: 'if __name__ == "__main__":',
          options: ['"__main__"', '"script"', '"root"', 'None'],
          correct: '"__main__"',
          explanation: 'When executed directly, Python sets __name__ to "__main__".'
        }
      ]
    },
    {
      level: 15,
      title: 'OOP (Object-Oriented Programming)',
      slug: 'oop',
      description: 'Classes, objects, __init__, self, inheritance, encapsulation, and polymorphism.',
      concept: 'OOP bundles state (attributes) and behavior (methods) into clean, modular classes.',
      content: `# Object-Oriented Programming in Python\n\n\`\`\`python\nclass Student:\n    def __init__(self, name, xp=0):\n        self.name = name\n        self.xp = xp\n\n    def add_xp(self, amount):\n        self.xp += amount\n\`\`\``,
      code_example: `class BankAccount:\n    def __init__(self, owner, balance=0):\n        self.owner = owner\n        self.balance = balance\n\n    def deposit(self, amount):\n        self.balance += amount\n        return self.balance\n\nacc = BankAccount("Jenifer", 100)\nacc.deposit(50)\nprint(f"Owner: {acc.owner}, Balance: {acc.balance}")`,
      expected_output: `Owner: Jenifer, Balance: 150`,
      common_mistakes: 'Forgetting "self" as the first argument in instance methods.',
      problem: {
        title: 'Class Bank Account Transaction Simulator',
        slug: 'bank-account-simulator',
        difficulty: 'Medium',
        statement: 'Simulate account operations. Start with balance 0. Input has lines: "D <amount>" to deposit or "W <amount>" to withdraw. If withdrawal exceeds current balance, ignore it. Print final balance.',
        input_format: 'Lines formatted as "D <amount>" or "W <amount>".',
        output_format: 'Final integer balance.',
        constraints: '1 <= operations <= 1000',
        starter_code: `import sys\n\nclass Account:\n    def __init__(self):\n        self.balance = 0\n    def deposit(self, amt):\n        self.balance += amt\n    def withdraw(self, amt):\n        if amt <= self.balance:\n            self.balance -= amt\n\ndef solve():\n    acc = Account()\n    for line in sys.stdin:\n        parts = line.strip().split()\n        if len(parts) == 2:\n            op, amt = parts[0], int(parts[1])\n            if op == 'D':\n                acc.deposit(amt)\n            elif op == 'W':\n                acc.withdraw(amt)\n    print(acc.balance)\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: 'D 100\\nW 30\\nD 50', expected_output: '120' },
          { input: 'W 50\\nD 25', expected_output: '25' }
        ],
        hidden_tests: [
          { input: 'D 200\\nW 250\\nW 100', expected_output: '100' },
          { input: 'D 500\\nW 500', expected_output: '0' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'What represents the instance of the class in Python methods?',
          code_snippet: 'class Car:\n    def drive(???): pass',
          options: ['this', 'self', 'instance', 'cls'],
          correct: 'self',
          explanation: 'By convention, self refers to the instance of the class.'
        }
      ]
    },
    {
      level: 16,
      title: 'Advanced Python + Final Assessment',
      slug: 'advanced-python',
      description: 'Generators (yield), decorators, lambda functions, and comprehensive final algorithmic assessment.',
      concept: 'Advanced Python tools allow writing elegant, memory-efficient, and performant code.',
      content: `# Advanced Python\n\n- Generators: Memory efficient stream generation with \`yield\`.\n- Decorators: Higher-order functions wrapping behavior.\n- Lambda functions: Anonymous inline functions.`,
      code_example: `def fibonacci_gen(limit):\n    a, b = 0, 1\n    for _ in range(limit):\n        yield a\n        a, b = b, a + b\n\nprint(list(fibonacci_gen(7)))`,
      expected_output: `[0, 1, 1, 2, 3, 5, 8]`,
      common_mistakes: 'Calling a generator function directly expecting a list without iterating or converting with list().',
      problem: {
        title: 'Two Sum Problem',
        slug: 'two-sum-problem',
        difficulty: 'Medium',
        statement: 'Given an array of integers and a target sum, find the 0-indexed positions of the two numbers that add up to target. Print the smaller index then larger index separated by space. Assume exactly one solution exists.',
        input_format: 'Line 1: space-separated integers. Line 2: target integer.',
        output_format: 'Two indices separated by space.',
        constraints: '2 <= len(nums) <= 10^5',
        starter_code: `import sys\n\ndef solve():\n    lines = sys.stdin.read().strip().split('\\n')\n    if len(lines) < 2:\n        return\n    nums = [int(x) for x in lines[0].split()]\n    target = int(lines[1])\n    \n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            print(f"{seen[complement]} {i}")\n            return\n        seen[num] = i\n\nif __name__ == '__main__':\n    solve()`,
        public_tests: [
          { input: '2 7 11 15\n9', expected_output: '0 1' },
          { input: '3 2 4\n6', expected_output: '1 2' }
        ],
        hidden_tests: [
          { input: '3 3\n6', expected_output: '0 1' },
          { input: '1 5 8 10 14\n22', expected_output: '2 4' }
        ]
      },
      questions: [
        {
          type: 'mcq',
          prompt: 'What keyword turns a normal function into a Python generator?',
          code_snippet: 'def gen():\n    ??? 42',
          options: ['return', 'yield', 'produce', 'emit'],
          correct: 'yield',
          explanation: 'The yield keyword turns a function into a generator that yields values on demand.'
        }
      ]
    }
  ];

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

  for (const lvl of pythonLevels) {
    const topicRes = insertTopic.run(
      pythonId,
      lvl.level,
      lvl.title,
      lvl.slug,
      lvl.description,
      lvl.concept,
      lvl.content,
      lvl.code_example,
      lvl.expected_output,
      lvl.common_mistakes,
      50, // XP reward for topic completion
      15  // Coins reward
    );
    const topicId = topicRes.lastInsertRowid;

    // Seed Problem
    if (lvl.problem) {
      const probRes = insertProblem.run(
        topicId,
        lvl.problem.title,
        lvl.problem.slug,
        lvl.problem.difficulty,
        lvl.problem.statement,
        lvl.problem.input_format,
        lvl.problem.output_format,
        lvl.problem.constraints,
        lvl.problem.starter_code,
        'python',
        lvl.problem.difficulty === 'Easy' ? 20 : 35,
        lvl.problem.difficulty === 'Easy' ? 10 : 20,
        3000
      );
      const problemId = probRes.lastInsertRowid;

      // Public test cases
      for (const tc of lvl.problem.public_tests) {
        insertTestCase.run(problemId, tc.input, tc.expected_output, 0);
      }
      // Hidden test cases
      for (const tc of lvl.problem.hidden_tests) {
        insertTestCase.run(problemId, tc.input, tc.expected_output, 1);
      }
    }

    // Seed Questions
    if (lvl.questions) {
      for (const q of lvl.questions) {
        insertQuestion.run(
          topicId,
          q.type,
          q.prompt,
          q.code_snippet || null,
          JSON.stringify(q.options),
          q.correct,
          q.explanation,
          10,
          5
        );
      }
    }
  }

  // 3. Seed Badges
  const insertBadge = db.prepare(`
    INSERT INTO badges (badge_key, name, description, icon, category)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertBadge.run('first_challenge', 'First Challenge', 'Submitted your first working code problem successfully.', 'award', 'Coding');
  insertBadge.run('seven_day_learner', '7-Day Learner', 'Maintained a 7-day active daily learning streak.', 'flame', 'Streak');
  insertBadge.run('perfect_score', 'Perfect Score', 'Scored 100% on a mentor-assigned quiz or assessment.', 'check-circle', 'Assessment');
  insertBadge.run('python_master', 'Python Master', 'Completed all 16 levels of the Python Mastery curriculum.', 'star', 'Course');
  insertBadge.run('coding_streak', 'Coding Streak', 'Solved code challenges on 5 consecutive days.', 'zap', 'Coding');
  insertBadge.run('weekly_winner', 'Weekly Winner', 'Top performer in the weekly individual challenge.', 'trophy', 'Challenge');
  insertBadge.run('team_champion', 'Team Champion', 'Won an official team code battle competition.', 'users', 'Team');

  // 4. Seed Power-Ups
  const insertPowerUp = db.prepare(`
    INSERT INTO power_ups (item_key, name, description, icon, price_coins)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertPowerUp.run('hint_card', 'Hint Card', 'Reveals a crucial contextual algorithmic hint in any challenge.', 'lightbulb', 100);
  insertPowerUp.run('restore_card', 'Restore Card', 'Instantly restores an eligible broken 1-day streak without failing.', 'heart', 200);
  insertPowerUp.run('skip_card', 'Skip Card', 'Skips an eligible challenging exercise while retaining eligibility.', 'fast-forward', 300);
  insertPowerUp.run('double_xp', 'Double XP Token', 'Doubles all XP earned in your next 3 completed activities.', 'sparkles', 250);

  // 5. Seed Daily & Weekly Challenges
  const firstProblem = db.prepare('SELECT id FROM coding_problems LIMIT 1').get();
  const secondProblem = db.prepare('SELECT id FROM coding_problems LIMIT 1 OFFSET 1').get() || firstProblem;

  const todayStr = new Date().toISOString().split('T')[0];
  db.prepare(`
    INSERT OR IGNORE INTO daily_challenges (challenge_date, problem_id, xp_reward, coins_reward)
    VALUES (?, ?, 30, 15)
  `).run(todayStr, firstProblem.id);

  db.prepare(`
    INSERT INTO weekly_challenges (week_number, title, description, type, target_problem_id, xp_reward, coins_reward)
    VALUES (?, ?, ?, ?, ?, 100, 50)
  `).run(1, 'Individual Sprint: Prime Detective', 'Solve the prime number algorithm and pass all hidden edge cases.', 'INDIVIDUAL', secondProblem.id);

  db.prepare(`
    INSERT INTO weekly_challenges (week_number, title, description, type, target_problem_id, xp_reward, coins_reward)
    VALUES (?, ?, ?, ?, ?, 150, 75)
  `).run(1, 'Team Showdown: Array Masters', 'Form a team of up to 5 and compete against rival squads.', 'TEAM', firstProblem.id);

  console.log('Educational content successfully seeded: Courses, 16 Python Levels, Topics, Coding Problems, Test Cases, Badges, Power-Ups, and Challenges.');
}
