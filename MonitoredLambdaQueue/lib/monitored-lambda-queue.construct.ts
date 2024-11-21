import { Duration } from 'aws-cdk-lib';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Queue, QueueEncryption } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { MonitoredDeadLetterQueue } from './monitored-dead-letter-queue.construct';
import { IAlarmAction } from 'aws-cdk-lib/aws-cloudwatch';

export class MonitoredLambdaQueue extends Construct {
  messageQueue: Queue;
  deadLetterQueue: Queue;

  constructor(
    scope: Construct,
    id: string,
    targetLambda: IFunction,
    alarmAction: IAlarmAction,
    retries: number,
    queueVisibilityTimeout = Duration.seconds(30),
    retentionPeriod = Duration.days(14)
  ) {
    super(scope, id);

    this.deadLetterQueue = new MonitoredDeadLetterQueue(
      this,
      `${id}-DLQ`,
      alarmAction,
      {
        retentionPeriod,
        queueName: `${id}-DLQ`,
      }
    );

    this.messageQueue = new Queue(this, `${id}-Queue`, {
      queueName: `${id}-Queue`,
      visibilityTimeout: queueVisibilityTimeout,
      encryption: QueueEncryption.SQS_MANAGED,
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: retries,
      },
      receiveMessageWaitTime: Duration.seconds(20),
    });

    this.messageQueue.grantConsumeMessages(targetLambda);
    targetLambda.addEventSource(new SqsEventSource(this.messageQueue));
  }
}
