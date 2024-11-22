import * as cdk from 'aws-cdk-lib';
import { IFunction, Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { MonitoredLambdaQueue } from './monitored-lambda-queue.construct';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

export class ExampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const errorTopic = new Topic(this, 'ErrorNotificationTopic', {
      topicName: 'ErrorNotificationTopic',
    });
    errorTopic.addSubscription(new EmailSubscription('example@email.com'));

    const alarmAction = new SnsAction(errorTopic);

    const exampleLambda: IFunction = new Function(this, 'ExampleFunction', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromInline(`
        exports.handler = async function(event) {
          throw new Error('This is an example error'); 
        }`),
    });

    const monitoredQueue = new MonitoredLambdaQueue(
      this,
      'MonitoredQueue',
      exampleLambda,
      alarmAction,
      3
    );
  }
}
