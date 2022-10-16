import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";

import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
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

    // API could be improved with authorization and models to validate payloads.
    // In production, you will want access logging.
    const api = new HttpApi(this, "NotesApi", {
      corsPreflight: {
        allowHeaders: ["Content-Type"],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST],
        allowOrigins: ["*"],
      },
    });

    // Creates the Cfn AWS::ApiGatewayV2::Integration resources
    const readIntegration = new HttpLambdaIntegration(
      "ReadIntegration",
      readFunction
    );
    const writeIntegration = new HttpLambdaIntegration(
      "WriteIntegration",
      writeFunction
    );

    // Creates the Cfn AWS::ApiGatewayV2::Route resources, assigning a path to an integration
    api.addRoutes({
      integration: readIntegration,
      methods: [HttpMethod.GET],
      path: "/notes",
    });
    api.addRoutes({
      integration: writeIntegration,
      methods: [HttpMethod.POST],
      path: "/notes",
    });

    new CfnOutput(this, "HttpApiUrl", { value: api.apiEndpoint });
  }
}
