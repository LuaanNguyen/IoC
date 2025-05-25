import { S3Event } from "aws-lambda";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize AWS clients
const bedrock = new BedrockRuntimeClient({});
const dynamodb = new DynamoDBClient({});
const s3 = new S3Client({});

export const handler = async (event: S3Event): Promise<void> => {
  console.log("Lambda triggered with event:", JSON.stringify(event, null, 2));
  try {
    // Process each record in the event
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

      console.log(`Processing document: ${key} from bucket: ${bucket}`);

      // Get the document from S3
      const getObjectResponse = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      // Add logging for S3 response
      console.log("S3 GetObject response:", getObjectResponse);

      const documentContent = await getObjectResponse.Body?.transformToString();
      console.log("Document content:", documentContent);

      if (!documentContent) {
        throw new Error("No document content found");
      }

      // Process the document with Bedrock
      console.log("Sending to Bedrock...");
      const bedrockResponse = await bedrock.send(
        new InvokeModelCommand({
          modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0", //https://us-west-2.console.aws.amazon.com/bedrock/home?region=us-west-2#/model-catalog/serverless/anthropic.claude-3-5-sonnet-20241022-v2:0
          body: JSON.stringify({
            prompt: `Analyze this document and extract key information: ${documentContent}`,
            max_tokens: 1000,
          }),
        })
      );
      console.log("Bedrock response:", bedrockResponse);

      // Store the results in DynamoDB
      console.log("Storing in DynamoDB...");
      await dynamodb.send(
        new PutItemCommand({
          TableName: process.env.TABLE_NAME!,
          Item: {
            documentId: { S: key },
            timestamp: { S: new Date().toISOString() },
            content: { S: JSON.stringify(bedrockResponse) },
            status: { S: "PROCESSED" },
          },
        })
      );
      console.log("Successfully stored in DynamoDB");
    }
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
};
