---
title: 'Protocols and Composition in Python'
date: '2021-11-04'
author: 'Filip Wojciechowski'
twitterProfile: 'https://twitter.com/filipcodes'
excerpt: "It's a source of heartbreak and distress for me when instrumentation-related side-effects (like logging, metrics, tracing, retrying logic, error handling, etc.) begin making their way inside the business logic layer of an application. If only there was a way to overlay instrumentation on top of business logic without touching it directly... It would be even better if we could keep the various instrumentation concerns separate from one another, while we're at it..."
coverImage: 'ryan-quintal-US9Tc9pKNBU-unsplash.jpg'
coverImageCreditText: 'Photo by Ryan Quintal'
coverImageCreditUrl: 'https://unsplash.com/photos/US9Tc9pKNBU'
tags: ['python', 'design patterns', 'protocols', 'composition']
---

It's a source of heartbreak and distress for me when instrumentation-related side-effects (like logging, metrics, tracing, retrying logic, error handling, etc.) begin making their way inside the business logic layer of an application. If only there was a way to overlay instrumentation on top of business logic without touching it directly... It would be even better if we could keep the various instrumentation concerns separate from one another, while we're at it...

Right, let's write some code!

## Naive Implementation

Say, we're writing an advanced service that adds numbers. We could jump in right away and have a working implementation in no time at all:

```python
def add(a: int, b: int) -> int:
    return a + b
```

Great! Now we want to deploy it to production, so we're asked to add logging - to make it possible to debug production failures:

```python
logger = logging.getLogger(__name__)

def add(a: int, b: int) -> int:
    result = return a + b
    logger.debug("adding %s and %s gives %s", a, b, result)
    return result
```

It works! But, now we've run into performance issues so we need to add collection of performance metrics, like the ability to time the execution of the `add` method:

```python
logger = logging.getLogger(__name__)

def add(a: int, b: int) -> int:
    t_start = time.perf_counter()
    result = return a + b
    t_end = time.perf_counter()
    logger.debug("adding %s and %s gives %s", a, b, result)
    took = t_end - t_start
    logger.debug("took %s seconds", took)
    return result
```

Still works, but things are definitely getting a bit messy - in fact, it's becoming difficult to understand what the service is doing in the first place. Not to mention the impact on testability of our code! Granted, if we're logging to the local filesystem or `stdout` testing is probably not much of an issue at this stage, but if we're storing logs remotely our tests are at risk of becoming slow, fragile - and we're likely spamming logs with useless messages every time we run our tests. It's a slippery slope towards spaghetti code - there must be a better way!

## Protocol-based implementation

When I was a kid, my dad used to tell me: "hurry slowly". I find this to be a reasonable principle when applied to coding. Let us start slowly then and begin by defining our service as a pure interface expressing the desired functionality - or, in Python parlance - as a "protocol":

```python
# service.py

from typing import Protocol


class AddServiceProtocol(Protocol):
    "Represents functionality of adding two numbers."

    def add(self, a: int, b: int) -> int:
        ...
```

The protocol of our service is simple: we take two `int` values and we return an `int` value representing their sum. Given the protocol, the concrete implementation might look as follows:

```python
# service.py

class AddService:
    "Implements AddServiceProtocol."

    def add(self, a: int, b: int) -> int:
        return a + b
```

A protocol is Python's take on "structural subtyping" - it's a type that's effectively implemented by anything that matches the signature of the protocol's methods. Concrete implementations can subclass the protocol, in which case implementation correctness will be enforced in runtime on instantiation of a class inheriting from a protocol. Behind the scenes protocols are implemented using abstract base classes, so the runtime behavior follows from that. That said, explicit subclassing is entirely optional. A tool like `mypy` will be able to reason about protocols and their implementations based on method signatures alone. Think - abstract base classes light. Or, think - pythonic duck-typing augmented with static verification tooling.

All that sounds very fancy, but what's the benefit of doing things this way? Let's have a look at what adding logging to our implementation might look like. Instead of adding the logging logic inside the `add` method of the main implementation let's create a separate implementation that will satisfy the service protocol while also wrapping the service itself:

```python
# service.py

class LoggingAddService:
    """
    Implements AddServiceProtocol. Wraps AddService and adds basic logging.
    """

    def __init__(self, service: AddServiceProtocol, logger: Logger) -> None:
        self._inner = service
        self._logger = logger

    def add(self, a: int, b: int) -> int:
        result = a + b
        self._logger.debug("[add] adding %s and %s gives %s", a, b, result)
        return result
```

We use dependency injection and initialize the `LoggingAddService` with a reference to an instance of a class that fulfills the `AddServiceProtocol` contract and an instance of a `logging.Logger`. When called, the `add` method on `LoggingAddService` runs the `add` method on the `_inner` class, while also logging the details of the call using the reference to the `_logger`.

What we have effectively created something like a middleware for our service, one we can safely compose with other similar wrappers as long as they also implement `AddServiceProtocol`. Since we can, let's create another middleware, one that records how long it takes to add numbers:

```python
# service.py

class TimingAddService:
    """
    Implements AddServiceProtocol. Wraps AddService and adds timing of method calls.
    """

    def __init__(self, service: AddServiceProtocol, logger: Logger) -> None:
        self._inner = service
        self._logger = logger

    def add(self, a: int, b: int) -> int:
        start = time.perf_counter()
        result = self._inner.add(a, b)
        end = time.perf_counter()
        elapsed = end - start
        self._logger.debug(f"[add] took {elapsed:0.8f} seconds")
        return result
```

Yes, it's all repetitive and a bit boring, but I'd argue this is a good thing! It doesn't take a lot of effort to understand what this code is doing, and once we've grokked the pattern, we'll recognize it immediately wherever it's applied. It is easy to read and understand, in other words. Since each layer exists as a separate unit with explicitly defined dependencies, each layer can be unit-tested in isolation. Finally, we've effectively deferred the decision about how the service should be configured or wrapped in runtime - this decision can be in fact left to the user as application of individual wrappers can be performed in runtime based on user-selected options.

As means of demonstrating this last property, let's create a simple CLI tool for adding numbers - we'll add logging debug messages and timing reports as optional features that can be enabled using flags. I'm going to use [typer](https://github.com/tiangolo/typer) to turn our service into a CLI application:

```python
# main.py


import typer

from logger import std_out_logger
from service import AddService, AddServiceProtocol, LoggingAddService, TimingAddService


def main(a: int, b: int, debug: bool = False, timing: bool = False) -> None:
    """
    Adding 'a' to 'b' made easy!
    """
    service: AddServiceProtocol = AddService()
    if timing:
        service = TimingAddService(service=service, logger=std_out_logger("timing"))
    if debug:
        service = LoggingAddService(service=service, logger=std_out_logger("logging"))
    print(service.add(a, b))


if __name__ == "__main__":
    typer.run(main)
```

The `main` function is where we wire the parts of our application together. The individual components don't need to know about each other otherwise - all they care about is the contract represented by the protocol and whatever additional dependencies they require to do their thing. The various middlewares are layered on top of the core service based on the values of `debug` and `timing` flags. The main function becomes the only place where we use the conditionals that toggle the timing and logging features - just imagine what our code would look like if these had to be colocated with our business logic!

## Wrapping up

I first learned of this pattern in Go's [go-kit](https://github.com/go-kit/kit) where I've seen it called "service middlewares". The [Design Patterns](https://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) book describes something similar as the "decorator" pattern - not to be confused with Python decorators, which have the unfortunate property of melding themselves with what they decorate, which limits their practical usefulness, at least as far as reducing coupling is concerned.

A similar effect can also be achieved by means of traditional class inheritance, although the composition-based solution is more light-weight and flexible as you don't have to choose between pre-creating classes representing each possible permutation of wrappers (i.e. AddService, LoggingAddService, TimingAddService, LoggingAndTimingAddService, etc.) and overloading classes with features and responsibilities which might not be required given different runtime configurations. Indeed, this particular pattern is a good example for why composition might be preferable to class inheritance in many applications.

A working example of the protocol-based implementation can be found on GitHub: [https://github.com/fwojciec/composition_using_protocols](https://github.com/fwojciec/composition_using_protocols)
