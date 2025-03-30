import { PhysicalName, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { CfnConfigurationAggregator, CfnConfigurationRecorder, CfnDeliveryChannel } from 'aws-cdk-lib/aws-config';
import { Role, ManagedPolicy, ServicePrincipal, Effect, AnyPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket, BucketEncryption, BucketPolicy } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { AwsEnv, OrganizationId, ProductName } from '../../bin/configs';

export class ConfigService extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // const centralLogBucket = new Bucket(this, 'ConfigCentralLogs', {
    //   bucketName: `aws-config-central-logs-${Stack.of(this).account}`,
    //   removalPolicy: RemovalPolicy.DESTROY,
    //   autoDeleteObjects: true,
    //   encryption: BucketEncryption.S3_MANAGED,
    //   blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    // });
    // centralLogBucket.addToResourcePolicy(new PolicyStatement({
    //   effect: Effect.ALLOW,
    //   principals: [new AnyPrincipal()],
    //   actions: ['s3:GetObject', 's3:PutObject'],
    //   resources: [`${centralLogBucket.bucketArn}/AWSLogs/*`],
    //   conditions: {
    //     StringEquals: {
    //       "aws:PrincipalOrgID": OrganizationId
    //     }
    //   }
    // }));

    // Enable AWS Config - Develop account
    const awsConfigStack_Develop = new AwsConfigStack(this, 'EnableAwsConfigDevelopAccount', {
      env: AwsEnv.develop,
      tags: {
        Product: ProductName,
        Environment: 'develop',
      },
      // configHistoryAndSnapShotsBucketName: centralLogBucket.bucketName,
    });

    // Enable AWS Config - Product account
    const awsConfigStack_Product = new AwsConfigStack(this, 'EnableAwsConfigProductAccount', {
      env: AwsEnv.product,
      tags: {
        Product: ProductName,
        Environment: 'product',
      }
    });

    // Enable AWS Config - Tooling account
    const awsConfigStack_Tooling = new AwsConfigStack(this, 'EnableAwsConfigToolingAccount', {
      env: AwsEnv.tooling,
      tags: {
        Product: ProductName,
        Environment: 'tooling',
      },
    });

    // Enable AWS Config - Root account
    const awsConfigStack_Root = new AwsConfigStack(this, 'EnableAwsConfigRootAccount', {
      env: AwsEnv.root,
      tags: {
        Product: ProductName,
        Environment: 'root',
      },
    });

    // Aggregate AWS Config in the Root account
    const roleForOrganizationAggregator = new Role(awsConfigStack_Root, 'AWSConfigRoleForOrganizationAggregator', {
      assumedBy: new ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSConfigRoleForOrganizations'),
      ],
    });
    const organizationAggregator = new CfnConfigurationAggregator(awsConfigStack_Root, 'OrganizationAggregator', {
      organizationAggregationSource: {
        roleArn: roleForOrganizationAggregator.roleArn,
        allAwsRegions: true,
      },
    });
  }
}
interface AwsConfigStackProps extends StackProps {
  // Centralized S3 Bucket
  configHistoryAndSnapShotsBucketName?: string;
}
class AwsConfigStack extends Stack {

  private _logsBucket?: Bucket;
  private _configHistoryAndSnapShotsBucketName: string;
  public get configHistoryAndSnapShotsBucketName(): string {
    return this._configHistoryAndSnapShotsBucketName;
  }
  set configHistoryAndSnapShotsBucketName(v: string | undefined) {
    if (v) {
      this._logsBucket = undefined;
      this._configHistoryAndSnapShotsBucketName = v;
    } else {
      this._logsBucket = new Bucket(this, 'ConfigLogs', {
        bucketName: `aws-config-logs-${Stack.of(this).account}`,
        removalPolicy: RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        encryption: BucketEncryption.S3_MANAGED,
        blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      });
      this._configHistoryAndSnapShotsBucketName = this._logsBucket.bucketName;
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
    this._logsBucket?.grantReadWrite(serviceRole);

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