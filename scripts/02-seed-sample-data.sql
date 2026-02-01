-- Insert sample courses
INSERT INTO courses (title, description, programming_language, instructor_id, status, level, created_at) 
VALUES 
  ('Introduction to Python', 'Learn the fundamentals of Python programming, from variables and data types to functions and modules.', 'Python', NULL, 'published', 'beginner', NOW()),
  ('JavaScript Essentials', 'Master JavaScript basics including ES6 syntax, async programming, and DOM manipulation.', 'JavaScript', NULL, 'published', 'beginner', NOW()),
  ('HTML & CSS Fundamentals', 'Build responsive web pages with semantic HTML5 and modern CSS3 techniques.', 'HTML', NULL, 'published', 'beginner', NOW()),
  ('CSS Advanced Layouts', 'Master advanced CSS concepts including Flexbox, Grid, and animations.', 'CSS', NULL, 'published', 'intermediate', NOW());

-- Insert sample lessons for Python course
INSERT INTO lessons (course_id, title, content, order_index, is_published, created_at) 
VALUES
((SELECT id FROM courses WHERE title = 'Introduction to Python' LIMIT 1), 'Getting Started with Python', 
'# Lesson 1: Getting Started with Python

Python is a versatile, beginner-friendly programming language. In this lesson, you''ll learn how to set up Python and write your first program.

## What is Python?
Python is a high-level programming language known for its clear syntax and readability. It''s used in web development, data science, artificial intelligence, and more.

## Installation
1. Download Python from python.org
2. Run the installer
3. Make sure to check "Add Python to PATH"
4. Verify installation: open command line and type `python --version`

## Your First Program
```python
print("Hello, World!")
```

That''s it! Python is that simple. The `print()` function displays text to the screen.

## Key Takeaways
- Python is easy to learn and read
- It uses meaningful indentation
- It''s widely used in many industries
', 1, true, NOW()),

((SELECT id FROM courses WHERE title = 'Introduction to Python' LIMIT 1), 'Variables and Data Types', 
'# Lesson 2: Variables and Data Types

## What are Variables?
Variables are containers for storing data values. In Python, you don''t need to declare the type - Python figures it out.

## Creating Variables
```python
name = "Alice"
age = 25
height = 5.6
is_student = True
```

## Data Types
- **Strings**: Text data, like "Hello World"
- **Integers**: Whole numbers, like 42
- **Floats**: Decimal numbers, like 3.14
- **Booleans**: True or False values
- **Lists**: Collections of items

## Type Checking
```python
x = 42
print(type(x))  # Output: <class ''int''>

y = "Hello"
print(type(y))  # Output: <class ''str''>
```

## Key Takeaways
- Variables store data
- Python automatically detects data types
- You can check types with the `type()` function
', 2, true, NOW()),

((SELECT id FROM courses WHERE title = 'Introduction to Python' LIMIT 1), 'Control Flow with If Statements', 
'# Lesson 3: Control Flow with If Statements

## What are Conditionals?
Conditionals let your code make decisions based on conditions. The most common conditional is the `if` statement.

## Basic If Statement
```python
age = 18
if age >= 18:
    print("You are an adult")
```

## If-Else
```python
age = 15
if age >= 18:
    print("You are an adult")
else:
    print("You are a minor")
```

## If-Elif-Else
```python
score = 85
if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
elif score >= 70:
    print("Grade: C")
else:
    print("Grade: F")
```

## Key Takeaways
- Use `if` for basic conditions
- Use `else` for alternative paths
- Use `elif` for multiple conditions
', 3, true, NOW());

-- Insert sample lessons for JavaScript course
INSERT INTO lessons (course_id, title, content, order_index, is_published, created_at) 
VALUES
((SELECT id FROM courses WHERE title = 'JavaScript Essentials' LIMIT 1), 'Getting Started with JavaScript',
'# Lesson 1: Getting Started with JavaScript

## What is JavaScript?
JavaScript is the programming language of the web. It runs in browsers and allows you to make web pages interactive.

## Where Does JavaScript Run?
1. **Browser**: In HTML files with <script> tags
2. **Node.js**: On servers and computers
3. **Mobile**: In apps using frameworks like React Native

## Your First Script
```javascript
console.log("Hello, JavaScript!");
```

## Running JavaScript
- In Browser: Open DevTools (F12) and paste in the Console
- In HTML: Put in <script> tags
```html
<script>
  console.log("Hello from HTML!");
</script>
```

## Key Takeaways
- JavaScript makes web pages interactive
- It''s one of the most popular programming languages
- You can test code directly in the browser console
', 1, true, NOW()),

((SELECT id FROM courses WHERE title = 'JavaScript Essentials' LIMIT 1), 'Variables and Data Types',
'# Lesson 2: Variables and Data Types

## Declaring Variables
JavaScript has three ways to declare variables: var, let, and const.

```javascript
let name = "Alice";
let age = 25;
const pi = 3.14159;
var oldStyle = "deprecated";
```

## Data Types
- **String**: Text, like "Hello"
- **Number**: Both integers and decimals
- **Boolean**: true or false
- **Array**: List of items
- **Object**: Complex data structure

```javascript
let person = {
  name: "Bob",
  age: 30,
  city: "New York"
};
```

## Key Takeaways
- Use `let` and `const` (avoid `var`)
- JavaScript is dynamically typed
- Use `typeof` to check types
', 2, true, NOW());

-- Insert sample lessons for HTML course
INSERT INTO lessons (course_id, title, content, order_index, is_published, created_at) 
VALUES
((SELECT id FROM courses WHERE title = 'HTML & CSS Fundamentals' LIMIT 1), 'Introduction to HTML',
'# Lesson 1: Introduction to HTML

## What is HTML?
HTML (HyperText Markup Language) is the standard markup language for creating web pages. It provides the structure and content.

## Basic HTML Structure
```html
<!DOCTYPE html>
<html>
  <head>
    <title>My First Page</title>
  </head>
  <body>
    <h1>Hello, World!</h1>
    <p>This is a paragraph.</p>
  </body>
</html>
```

## Common HTML Tags
- `<h1>` to `<h6>`: Headings
- `<p>`: Paragraph
- `<a>`: Links
- `<img>`: Images
- `<div>`: Container
- `<span>`: Inline container

## Key Takeaways
- HTML provides structure to web pages
- Tags wrap content to give it meaning
- HTML works together with CSS for styling
', 1, true, NOW());

-- Insert sample assignments
INSERT INTO assignments (lesson_id, title, description, created_at) 
VALUES
((SELECT id FROM lessons WHERE title = 'Getting Started with Python' LIMIT 1), 'Write Your First Program', 
'Write a Python program that prints your name and age. Example output:
My name is Alice
I am 25 years old', NOW()),

((SELECT id FROM lessons WHERE title = 'Variables and Data Types' LIMIT 1), 'Create Variables',
'Create variables for:
1. Your name (string)
2. Your age (integer)
3. Your height (float)
4. Whether you''re a student (boolean)

Then print all of them using print() statements.', NOW()),

((SELECT id FROM lessons WHERE title = 'Control Flow with If Statements' LIMIT 1), 'Grade Calculator',
'Write a program that:
1. Takes a score as input (0-100)
2. Uses if-elif-else to assign a grade
3. Prints the grade

Grading scale: A (90-100), B (80-89), C (70-79), D (60-69), F (below 60)', NOW()),

((SELECT id FROM lessons WHERE title = 'Getting Started with JavaScript' LIMIT 1), 'Console Output',
'Use console.log() to print:
1. Your name
2. A message greeting the user
3. The result of a simple math operation (e.g., 5 + 3)', NOW()),

((SELECT id FROM lessons WHERE title = 'Introduction to HTML' LIMIT 1), 'Create a Simple Page',
'Create an HTML page with:
1. A title in the head
2. An h1 heading with your name
3. A paragraph about yourself
4. An image tag (any image)
5. A link to a website', NOW());
