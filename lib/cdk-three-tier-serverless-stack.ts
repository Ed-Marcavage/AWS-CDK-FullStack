import { Construct } from "constructs";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

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
  }
}
