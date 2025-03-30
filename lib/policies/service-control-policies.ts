import { CfnPolicy } from 'aws-cdk-lib/aws-organizations'
import { Construct } from 'constructs';
import { AwsEnv } from '../../bin/configs';

/**
 * The ServiceControlPolicies class is a Construct that defines the service control policies for the AWS Organization
 * The service control policies are defined in the AWS Organizations service
 * Because the AWS Organizations service is not yet supported by the AWS CDK, we will use the CfnPolicy class to define the service control policies
 * The CfnPolicy class is a L1 construct that represents an AWS Organizations policy
 * 
 * To use this class, you must first enable the AWS Organizations service and Service Control Policies in your AWS Organization account
 */
export class ServiceControlPolicies extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Deny resource creation if the resource is not tagged with the required tags
    const denyUntaggedResourceCreationPolicy = new CfnPolicy(this, 'DenyUntaggedResourceCreationPolicy', {
      type: 'SERVICE_CONTROL_POLICY',
      name: 'DenyCreationWithoutDefaultTags',
      targetIds: Array.from(new Set([
        AwsEnv.tooling.account,
        AwsEnv.develop.account,
        AwsEnv.product.account,
      ])),
      content: {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "DenyCreationWithoutTagKeyProduct",
            "Effect": "Deny",
            "Action": [
              'cloudformation:Create*',
              'cloudformation:Update*',
            ],
            "Resource": "*",
            "Condition": {
              "Null": {
                "aws:RequestTag/Product": "true"
              }
            }
          },
          {
            "Sid": "DenyCreationWithoutTagKeyEnvironment",
            "Effect": "Deny",
            "Action": [
              'cloudformation:Create*',
              'cloudformation:Update*',
            ],
            "Resource": "*",
            "Condition": {
              "Null": {
                "aws:RequestTag/Environment": "true",
              }
            }
          }
        ]
      },
    });
  }
}