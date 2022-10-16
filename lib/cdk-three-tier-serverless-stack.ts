import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export class CdkThreeTierServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new Table(this, "NotesTable", {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "pk", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      sortKey: { name: "sk", type: AttributeType.STRING },
      tableName: "NotesTable",
    });

    const readFunction = new NodejsFunction(this, "ReadNotesFn", {
      architecture: Architecture.ARM_64,
      entry: `${__dirname}/fns/readFunction.ts`,
      logRetention: RetentionDays.ONE_WEEK,
    });

    const writeFunction = new NodejsFunction(this, "WriteNoteFn", {
      architecture: Architecture.ARM_64,
      entry: `${__dirname}/fns/writeFunction.ts`,
      logRetention: RetentionDays.ONE_WEEK,
    });

    table.grantReadData(readFunction);
    table.grantWriteData(writeFunction);
  }
}
