#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsOrganizationStack } from '../lib/aws-organization-stack';
import * as configs from '../bin/configs';

const app = new cdk.App();
const _AwsOrganizationStack = new AwsOrganizationStack(app, 'AwsOrganizationPolicies', {
  env: configs.AwsEnv.root,
});

const testStack = new cdk.Stack(app, 'TestStack', {});
const lambdaFunction = new cdk.aws_lambda.Function(testStack, 'MyFunction', {
  runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
  code: cdk.aws_lambda.Code.fromInline('exports.handler2 = function(event, context) { console.log("Hello World"); }'),
  handler: 'index.handler2'
});
cdk.Tags.of(testStack).add('Product', 'web');
cdk.Tags.of(testStack).add('Environment', 'develop');