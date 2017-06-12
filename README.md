# Interrruptible.js

`interruptible` is a library that makes asynchronous functions interruptible
by using [generators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*).


## Usage

To mark an async function as interruptible, convert it to a generator, and use
`yield` to indicate where your function can be interrupted.

From:
```javascript
async function work (a, b) {
  const foo = await makeFoo(a, b)
  const result = await processFoo(foo)
  return result
}

const result = await work()
```

To:
```javascript
import {asInterruptible, InterruptError} from 'interruptible'


async function *interruptibleWork (foo, bar) {
  const foo = yield makeFoo(a, b)  // Use `yield` to indicate that function can be interrupted after this async operation has resolved

  // 🚫  If operation is interrupted before this line is reached, execution will stop here.

  const result = await processFoo(foo)  // `await` wont stop execution even if operation is interrupted
  return result
}

const interruptibleTask = asInterruptible(interruptibleWork)
try {
  const result = await interruptibleTask.run(this, 'a', 'b')
} catch(error) {
  if (error instanceof InterruptError) {
    console.log('Interruptible task interrupted')
    return
  }
  console.log('Interruptible task errored')
}


// You can interrupt the task from another execution context
setTimeout(() => {
  if (someConiditon) {
    interruptibleTask.interrupt()
  }
}, 100)
```


## Advanced Usage

### Nested Generators

You can nest generators within generators, and interrupt them as well. The
interrupt will buble all the way to the parent generator:

```javascript

function *makeFoo(a, b) {
  // Execution can also be stopped inside this generator
  const resA = yield makeA(a)
  const resB = yield makeB(b)
  return resA + resB
}


async function *interruptibleWork (foo, bar) {
  const foo = yield makeFoo(a, b)

  const result = await processFoo(foo)  // `await` wont stop execution even if operation is interrupted
  return result
}
```

### Async Generators

You may have noticed that in our example we used both `await` and `yield`
keywords:

```javascript

async function *interruptibleWork (foo, bar) {
  const foo = yield makeFoo(a, b)
              -----

  const result = await processFoo(foo)  // `await` wont stop execution even if operation is interrupted
                 -----
  return result
}
```

These are async generators, and are an ECMAScript Stage 3 [proposal](https://github.com/tc39/proposal-async-iteration#async-generator-functions).
In order to write these functions, you'll need to transpile your code with the
appropriate babel [plugin](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-async-generator-functions).


## Motivation

You may want to interrupt code for different reasons, principally in order to
prevent work that is no longer needed.

The motivation for writing `interruptible` comes from the need of having a simple
abstraction to be able write complex asynchronous tasks that could be
interrupted at different points of their execution by a scheduling system.

It is trivial to interrupt a single function using a conditional based on some
state, but it becomes extremely cumbersome to do so systematically across large
amounts of code when you want to be able to interrupt at different execution
points, and it ends up littering the code with `if` statements.

`interruptible` provides a simple mechanism to do so, albeit with the cost
of additional mental overhead of keeping in mind what using `yield` implies.


## API

See libdef.js
