import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

export class AtomatedRagPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an S3 bucket for storing documents
    const documentBucket = new s3.Bucket(this, "DocumentBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // This will delete the bucket when we destroy the stack
      autoDeleteObjects: true, // This will delete all objects when we destroy the stack
    });

    // Create a DynamoDB table for storing processed document data
    const documentTable = new dynamodb.Table(this, "DocumentTable", {
      partitionKey: { name: "documentId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // This means we only pay for what we use
    });

    // Output the bucket name and table name
    new cdk.CfnOutput(this, "BucketName", {
      value: documentBucket.bucketName,
    });

    new cdk.CfnOutput(this, "TableName", {
      value: documentTable.tableName,
    });
  }
}
