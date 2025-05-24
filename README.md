# Automated Document Processing Pipeline

This application proceeses document uploaded to S3, uses Bedrock for document analysis, and store processed results in DynamoDB.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

```
cdk init app --language typescript
```

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template
