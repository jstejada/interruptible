
declare module 'interruptible' {

  declare class InterruptibleTask {

    isInterrupted: bool;
    isRunning: bool;

    run(ctx: any, ...fnArgs: []): Promise<any>;
    interrupt(interruptReason?: string);
    awaitExecution(): Promise<any>;
  };

  declare export class InterruptError {};

  declare export default function asInterruptible(generatorFn: () => Generator<any, any, any> | AsyncGenerator<any, any, any>): InterruptibleTask;
}
