# GEMINI.md

This file provides context for AI agents interacting with the `obsidian-templater-core-kbt` project.

## Project Overview

This project contains helper files and templates for the [Obsidian Templater](https://github.com/SilentVoid13/Templater) plugin. The goal is to create and maintain a set of reusable templates and scripts to automate common tasks within Obsidian.

The project uses JavaScript for its scripts and Markdown for its templates. The templates leverage the Templater plugin's syntax to generate dynamic content in Obsidian.

## Building and Running

### Dependencies

This project has no external dependencies.

### Running Tests

To run the tests, use the following command:

```bash
npm test
```

**TODO:** Currently, there are no tests for this project. Tests should be added to verify the functionality of the scripts and templates.

## Development Conventions

### Code Style

- This project uses standard JavaScript conventions.
- Use Prettier for code formatting.
- Use camelCase for variable and function names.
- Use PascalCase for class names.

### Project Structure

- `src/`: Contains JavaScript files that can be used by the templates.
  - `index.js`: The main entry point for the JavaScript code.
  - `custom.js`: For custom, project-specific scripts.
- `templates/`: Contains the Templater templates. These are Markdown files with embedded JavaScript and Templater syntax.
- `package.json`: Defines the project and its dependencies.

### Contributing

When contributing to this project, please follow these guidelines:

- Create a new branch for your changes.
- Add or update tests for your changes.
- Ensure your code follows the established code style.
- Write clear and concise commit messages.
- Create a pull request with a detailed description of your changes.
