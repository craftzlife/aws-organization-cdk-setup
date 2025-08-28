# AWS Organization CDK Setup

AWS CDK project for setting up AWS Organizations with governance policies and compliance monitoring.

## Features

- **Service Control Policies**: Centralized permission guardrails across AWS accounts
- **Tag Policies**: Enforce consistent resource tagging standards
- **AWS Config**: Monitor compliance and configuration changes

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 18+ and npm
- AWS CDK CLI: `npm install -g aws-cdk`

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Deploy to AWS
npx cdk deploy
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run watch` | Watch for changes and compile |
| `npm run test` | Run Jest unit tests |
| `npx cdk deploy` | Deploy stack to AWS |
| `npx cdk diff` | Compare deployed stack with current state |
| `npx cdk synth` | Generate CloudFormation template |

## Project Structure

```
lib/
├── policies/
│   ├── service-control-policies.ts
│   └── tag-policies.ts
├── services/
│   └── config-service.ts
└── aws-organization-stack.ts
```
