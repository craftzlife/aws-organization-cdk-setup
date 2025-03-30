import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { CfnConfigurationRecorder, CfnDeliveryChannel, ManagedRule, ManagedRuleIdentifiers } from 'aws-cdk-lib/aws-config';
import { Role, ManagedPolicy, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { AwsEnv, ProductName } from '../../bin/configs';

export class ConfigService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const configHistoryAndSnapShots = new Bucket(this, 'HistoryAndSnapShots', {
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    // Enable AWS Config - Develop account
    const awsConfigStack_Develop = new AwsConfigStack(this, 'EnableAwsConfigDevelopAccount', {
      env: AwsEnv.develop,
      tags: {
        Product: ProductName,
        Environment: 'develop',
      }
    });
    const awsConfigStack_Product = new AwsConfigStack(this, 'EnableAwsConfigProductAccount', {
      env: AwsEnv.product,
      tags: {
        Product: ProductName,
        Environment: 'product',
      }
    });
  }
}
interface AwsConfigStackProps extends StackProps {
  // Centralized S3 Bucket
  configHistoryAndSnapShotsBucketName?: string;
}
class AwsConfigStack extends Stack {

  private _configHistoryAndSnapShotsBucket: Bucket;  
  private _configHistoryAndSnapShotsBucketName: string;
  public get configHistoryAndSnapShotsBucketName(): string {
    return this._configHistoryAndSnapShotsBucketName;
  }
  public set configHistoryAndSnapShotsBucketName(v: string | undefined) {
    if (v) {
      this._configHistoryAndSnapShotsBucketName = v;
    } else {
      this._configHistoryAndSnapShotsBucket = new Bucket(this, 'HistoryAndSnapShots', {
        removalPolicy: RemovalPolicy.DESTROY,
        encryption: BucketEncryption.S3_MANAGED,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      });
      this._configHistoryAndSnapShotsBucketName = this._configHistoryAndSnapShotsBucket.bucketName;
    }
  }

  constructor(scope: Construct, id: string, props?: AwsConfigStackProps) {
    super(scope, id, props);

    // Create S3 bucket for AWS Config to store configuration history and snapshots
    this.configHistoryAndSnapShotsBucketName = props?.configHistoryAndSnapShotsBucketName;

    // First, create an IAM role for AWS Config
    const serviceRole = new Role(this, 'ServiceRole', {
      assumedBy: new ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWS_ConfigRole'),
      ]
    });
    this._configHistoryAndSnapShotsBucket?.grantReadWrite(serviceRole);

    // Create the Configuration Recorder
    const recorder = new CfnConfigurationRecorder(this, 'Recorder', {
      roleArn: serviceRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    // Create the Delivery Channel
    const deliveryChannel = new CfnDeliveryChannel(this, 'DeliveryChannel', {
      s3BucketName: this.configHistoryAndSnapShotsBucketName,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'One_Hour',
      },
    });
  }
}