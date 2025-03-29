import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServiceControlPolicies } from './policies/service-control-policies';
import { TagPolicies } from './policies/tag-policies';
// import { Account, FeatureSet, Organization, OrganizationalUnit } from "@pepperize/cdk-organizations";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

/**
 * AWS CDK has not a 
 */
export class AwsOrganizationStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const _ServiceControlPolicies = new ServiceControlPolicies(this, 'ServiceControlPolicies');
    const _TagPolicies = new TagPolicies(this, 'TagPolicies');
  }
}
