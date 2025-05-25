import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as iam from "aws-cdk-lib/aws-iam";

export class AtomatedRagPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for storing documents
    const documentBucket = new s3.Bucket(this, "DocumentBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create a DynamoDB table for storing processed document data
    const documentTable = new dynamodb.Table(this, "DocumentTable", {
      partitionKey: { name: "documentId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Create Lambda function
    const documentProcessor = new lambda.Function(this, "DocumentProcessor", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "document-processor.handler",
      code: lambda.Code.fromAsset("src/lambda"),
      environment: {
        TABLE_NAME: documentTable.tableName,
      },
      timeout: cdk.Duration.minutes(5), // Increase timeout for document processing
      memorySize: 1024, // Increase memory for better performance
    });

    // Grant permissions to Lambda
    documentBucket.grantRead(documentProcessor);
    documentTable.grantWriteData(documentProcessor);
    documentProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],
      })
    );

    // Add S3 event trigger
    documentProcessor.addEventSource(
      new lambdaEventSources.S3EventSource(documentBucket, {
        events: [s3.EventType.OBJECT_CREATED],
      })
    );

    // Output the bucket name and table name
    new cdk.CfnOutput(this, "BucketName", {
      value: documentBucket.bucketName,
    });

    new cdk.CfnOutput(this, "TableName", {
      value: documentTable.tableName,
    });
  }
}
