// @flow

export class InterruptError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InterruptError'
    this.message = message
    this.stack = (new Error()).stack
  }
}


class InterruptibleTask {
  _running: bool;
  _interrupted: bool;
  _interruptReason: string;
  _promiseForResult: ?Promise<any>;
  _generatorFn: () => Generator<any, any, any> | AsyncGenerator<any, any, any>;

  constructor(generatorFn: () => Generator<any, any, any> | AsyncGenerator<any, any, any>) {
    this._running = false
    this._interrupted = false
    this._generatorFn = generatorFn
    this._promiseForResult = null
  }

  get isInterrupted(): bool {
    return this._interrupted;
  }

  get isRunning(): bool {
    return this._running;
  }


  awaitExecution(): Promise<any> {
    if (!this._promiseForResult) {
      return Promise.resolve()
    }
    return this._promiseForResult
  }

  interrupt(interruptReason = '') {
    this._interrupted = true
    this._interruptReason = interruptReason
  }

  /**
   * @returns a Promise that resolves when the generator function has been
   * executed to completion, or when it has been interrupted. It will reject if
   * the generator function throws an error at any point.
   */
  async run(ctx: any, ...fnArgs: []): Promise<any> {
    this._running = true
    try {
      const generatorObj = this._generatorFn.call(ctx, ...fnArgs)
      this._promiseForResult = this._runGenerator(generatorObj)
      return await this._promiseForResult
    } finally {
      this._interrupted = false
      this._running = false
    }
  }

  // This function executes the generator object through completion or until we
  // are interrupted
  _runGenerator(generatorObj: Generator<any, any, any> | AsyncGenerator<any, any, any>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!generatorObj || typeof generatorObj.next !== 'function') {
          throw new Error('InterruptibleTask: You must pass a generator function to run')
        }
        let val;
        let error;
        let step = {done: false, value: null};

        const advance = async () => {
          // Calling generator.next() will execute the generator function until
          // its next `yield` statement.
          // The return value of next is an object with the following shape:
          // {
          //   value: 'some val', // `yield`ed value
          //   done: false,       // indicates if execution is done
          // }
          if (error) {
            step = generatorObj.throw(error)
          } else {
            step = generatorObj.next(val)
          }

          // $FlowFixMe
          const isAsyncGenerator = typeof step.then === 'function'
          if (isAsyncGenerator) {
            step = await step
          }

          if (!step.value) {
            // If no value, just continue advancing
            val = step.value
            return
          }


          if (typeof step.value.next === 'function') {
            // step.value could be another generator object, if so,
            // let's run it recursively

            // $FlowFixMe
            val = await this._runGenerator(step.value)
          } else if (typeof step.value.then === 'function') {
            // step.value could be a Promise, if so, let's await it
            try {
              val = await step.value
            } catch(e) {
              error = e
            }
          } else {
            val = step.value
          }
        }

        // Advance until done
        while (!step.done) {
          if (this._interrupted) {
            throw new InterruptError(
              `InterruptibleTask interrupted: ${this._interruptReason}`
            )
          }
          await advance()
        }
        return resolve(val)
      } catch (err) {
        return reject(err)
      }
    })
  }
}


export function asInterruptible(generatorFn: () => Generator<any, any, any> | AsyncGenerator<any, any, any>): InterruptibleTask {
  return new InterruptibleTask(generatorFn)
}
