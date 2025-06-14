# Contributing to Deliverable Tracking

Thank you for your interest in contributing to the Deliverable Tracking project! This document provides guidelines and workflows for contributing.

## Branch Naming Convention

Branches should be named using the following format:
`type/description-in-kebab-case`

Types:
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring with no functionality changes
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks, dependency updates, etc.

Examples:
- `feature/add-proposal-builder`
- `fix/creator-dashboard-loading`
- `docs/api-documentation`
- `refactor/prisma-client-singleton`

## Development Workflow

1. Create a new branch from `main` using the naming convention above
2. Make your changes in small, focused commits
3. Write clear commit messages following conventional commits format:
   ```
   type(scope): description
   
   [optional body]
   [optional footer]
   ```
4. Push your branch and create a pull request
5. Address review feedback
6. Squash and merge when approved

## Code Review Process

### For Authors

1. **Before Submitting**
   - Ensure all tests pass
   - Update documentation if needed
   - Self-review your changes
   - Test the feature/fix locally

2. **Pull Request**
   - Fill out the PR template completely
   - Link related issues
   - Add screenshots for UI changes
   - Request reviews from appropriate team members

### For Reviewers

1. **Code Quality**
   - Check code style and conventions
   - Verify error handling
   - Look for potential security issues
   - Ensure proper test coverage

2. **Functionality**
   - Verify the changes meet requirements
   - Test edge cases
   - Check for backwards compatibility
   - Validate error scenarios

3. **Documentation**
   - Ensure documentation is updated
   - Check for clear comments on complex logic
   - Verify API documentation if applicable

## Testing Requirements

- Unit tests for new functionality
- Integration tests for API endpoints
- E2E tests for critical user flows
- Accessibility testing for UI components

## Style Guide

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Follow React hooks guidelines
- Use Tailwind CSS utility classes consistently

## Questions?

If you have questions about the contribution process, please open a discussion in the GitHub repository. 