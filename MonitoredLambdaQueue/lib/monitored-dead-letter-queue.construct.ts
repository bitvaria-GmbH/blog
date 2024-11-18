import { Duration } from 'aws-cdk-lib';
import { Alarm, IAlarmAction } from 'aws-cdk-lib/aws-cloudwatch';
import { Queue, QueueEncryption, QueueProps } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class MonitoredDeadLetterQueue extends Queue {
  readonly alarm: Alarm;

  constructor(
    scope: Construct,
    id: string,
    alarmAction: IAlarmAction,
    props: QueueProps = {
      retentionPeriod: Duration.days(14),
      encryption: QueueEncryption.SQS_MANAGED,
    }
  ) {
    super(scope, id, props);

    this.alarm = new Alarm(this, 'Alarm', {
      alarmDescription: 'There are messages in the Dead Letter Queue',
      evaluationPeriods: 1,
      threshold: 1,
      metric: this.metricApproximateNumberOfMessagesVisible(),
    });

    this.alarm.addAlarmAction(alarmAction);
  }
}
