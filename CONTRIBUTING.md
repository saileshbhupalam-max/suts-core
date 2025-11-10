# Contributing to SUTS

Thank you for your interest in contributing to SUTS! This document provides guidelines and workflows for contributing to the project.

## Development Workflow

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/suts-core.git
cd suts-core
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Feature Branch

```bash
git checkout -b feat/your-feature-name
```

### 4. Make Changes

- Write code following our coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 5. Run Quality Checks

```bash
npm run ci
```

This runs:

- TypeScript type checking
- ESLint linting
- Jest tests with coverage

### 6. Commit Changes

We use conventional commits. Format: `type(scope): description`

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or updates
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes

Example:

```bash
git commit -m "feat(persona): add diversity weighting to persona generation"
```

### 7. Push and Create Pull Request

```bash
git push origin feat/your-feature-name
```

## Coding Standards

### TypeScript

- Use strict TypeScript settings (already configured)
- No `any` types
- All functions must have explicit return types
- No unused variables or parameters (prefix with `_` if intentional)

### Testing

- Minimum 95% code coverage for statements
- Minimum 90% code coverage for branches, functions, and lines
- Write unit tests for all new functions
- Write integration tests for cross-package functionality
- Use descriptive test names: `describe('ComponentName', () => { it('should do X when Y', () => { ... }) })`

### Code Style

- Use Prettier for formatting (runs automatically on commit)
- 100 character line length
- Single quotes
- 2-space indentation
- Trailing commas in ES5

### Linting

- Zero ESLint errors or warnings
- Fix issues with `npm run lint:fix`

### Documentation

- Add JSDoc comments for all exported functions and types
- Update README.md if adding new features
- Update ARCHITECTURE.md if changing system design

## Quality Standards (NON-NEGOTIABLE)

- Zero TypeScript errors
- Zero ESLint errors/warnings
- All tests pass
- 95%+ code coverage
- No TODO comments in committed code
- ASCII-only (no unicode)
- Proper error handling everywhere
- All functions documented with JSDoc

## Pre-commit Hooks

The following checks run automatically before each commit:

- ESLint auto-fix
- Prettier formatting
- Related tests

If any check fails, the commit will be rejected. Fix the issues and try again.

## Pull Request Process

1. Ensure all quality checks pass (`npm run ci`)
2. Update documentation
3. Add entry to CHANGELOG.md (if applicable)
4. Request review from maintainers
5. Address review feedback
6. Maintainer will merge when approved

## Testing Guidelines

### Unit Tests

Located in `tests/unit/` or adjacent to source files.

```typescript
describe('PersonaGenerator', () => {
  it('should generate personas from stakeholder analysis', async () => {
    const generator = new PersonaGenerator('api-key');
    const personas = await generator.generateFromStakeholderAnalysis(['doc1.md'], 10, 0.8);
    expect(personas).toHaveLength(10);
  });
});
```

### Integration Tests

Located in `tests/integration/`.

```typescript
describe('Simulation Integration', () => {
  it('should run end-to-end simulation', async () => {
    // Test cross-package functionality
  });
});
```

## Getting Help

- File an issue for bugs or feature requests
- Join our Discord community (link TBD)
- Check existing issues and PRs first

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

Thank you for contributing to SUTS!
