---
title: 'How to Structure a Python AWS Serverless Project'
date: '2022-01-03'
author: 'Filip Wojciechowski'
twitterProfile: 'https://twitter.com/filipcodes'
excerpt: "I haven't been able to find much guidance on how to structure larger AWS serverless projects in Python. What is the best way to share code between different lambdas? How to overcome module resolution issues when accessing code deployed as a layer from handlers? How to set things up so that Python tooling - language servers, type checkers and test runners - all work as expected?"
coverImage: 'sendi-gibran-oalS6SkZc_s-unsplash.jpg'
coverImageCreditText: 'Photo by sendi gibran'
coverImageCreditUrl: 'https://unsplash.com/photos/oalS6SkZc_s'
tags: ['python', 'aws', 'lambda', 'serverless']
---

I haven't been able to find much guidance on how to structure AWS serverless projects written in Python. There is plenty of "hello world" examples where all code fits into a single file, and a whole lot of questions about module resolution issues in Python lambda projects on StackOverflow, but precious little advice on how to correctly set up a repository for a larger project. What is the best way to share code between lambdas? How to overcome various module resolution issues that frequently plague these types of projects? In short, how to set things up so that Python tooling - language servers, type checkers and test runners - all work as expected?

After reading this post you'll know how to:

- use Python packaging tools to transparently share code between lambda handlers
- avoid module resolution issues in local development environment
- package shared code as a lambda layer on deployment
- setup `pytest` to correctly run a test suite located in a separate directory
- help `mypy` type-check the project correctly despite its non-standard structure

> Note: A finished reference serverless project is available [on Github](https://github.com/fwojciec/serverless-project-example). Feel free to consult it at any stage or just read the finished code instead of the description below.

## Shared code as an internal package

The basic structure of the [example project repository](https://github.com/fwojciec/serverless-project-example) looks as follows:

```shellsession
├── functions/
│  ├── add/
│  │  └── handler.py
│  └── multiply/
│  │  └── handler.py
├── layer/
│  └── shared/
│     ├── __init__.py
│     ├── math.py
│     └── py.typed
├── tests/
```

The [example application](https://github.com/fwojciec/serverless-project-example) is a service that performs mathematical operations. It's a pointless service, or rather its only point is to give me an excuse to talk about code structure, the code itself is not important. All shared code is located in the `layer/shared` folder while lambda handlers live in the `functions` folder. Tests are separated from application code in the `tests` folder, since we don't want them to be included during deployment.

### The problem and the solution

When functions and the layer are deployed, handlers will be able to import the `shared` package from the global namespace. This "magical" behavior is courtesy of the lambda layer machinery working behind the scenes. Things will work when deployed, that's great, but what about the local development environment? If you clone the example repository and open either of the handlers in your code editor you'll find the import statements referencing the `shared` module decorated with red squiggles. Module resolution is broken, since Python doesn't understand a codebase structured as described above. It seems that many projects end up accepting this state of affairs as the reality of building with lambdas - some really hacky workarounds for this very issue can be found, for example, in [official serverless project examples published by AWS](https://github.com/aws-samples/aws-serverless-shopping-cart/blob/b4b45d97544b840dc5852b39d92f20cf8ecae16b/backend/shopping-cart-service/tests/test_example.py#L4-L7). We can do better!

The proper "Pythonic" solution is to have the `shared` package installed in the development environment so that it can be imported in other parts of the project irrespective of the project directory structure. Python, in fact, has a well established pattern for installing packages in "editable" mode to ease local development. We can leverage this feature to effectively create a simulated editable layer that can be developed along with the handlers. Yes, a little bit of initial setup is required, and we will always need to install the `shared` package locally as a prerequisite to doing development work and/or running the test suite, but the tradeoff is well worth it.

### Creating the internal package

The files and directories that comprise the internal package look as follows:

```shellsession
├── layer/
│  └── shared/
│     ├── __init__.py
│     ├── math.py
│     └── py.typed
├── tests/
├── pyproject.toml
└── setup.cfg
```

The above structure is essentially a variant of what's known as a [src package layout](https://setuptools.pypa.io/en/latest/userguide/declarative_config.html?highlight=src#using-a-src-layout) - with the `src` directory renamed to `layer`. For this project I'm using [setuptools](https://github.com/pypa/setuptools/tree/main/setuptools) as the packaging tool, and I'm configuring the package [declaratively](https://setuptools.pypa.io/en/latest/userguide/declarative_config.html) using a `setup.cfg` file.

Declaring packages in this style requires, per [PEP 621](https://www.python.org/dev/peps/pep-0621/), a tiny bit of boilerplate in the `pyproject.toml` file:

```toml
[build-system]
requires = ["setuptools", "wheel"]
build-backend = "setuptools.build_meta"
```

This is just to instruct the tools (such as `pip` or `build`) on how to build the package.

The bulk of package configuration lives in the `setup.cfg` file:

```ini
[metadata]
name = shared
version = 0.1.0

[options]
package_dir =
    =layer
packages = find:
include_package_data = True

[options.packages.find]
where = layer

[options.package_data]
* = py.typed
```

The `[metadata]` section holds some basic information about the project. We don't need much here, since this package will be only used internally and will not be published to external package repositories.

The `[options]` section accomplishes two things:

1. It informs packaging tools that they should automatically find and include all modules located inside the `layer` subdirectory, and that the `layer` directory itself should be excluded from the packaged module hierarchy. The `[options.packages.find]` section points the package auto-discovery logic at the `layer` directory.

2. It states that the package is allowed to contain data files, i.e. files that don't contain Python code, as long as they are referenced defined in the `[options.package_data]` section. This is required in order to include the `py.typed` file from the `layer/shared` folder in the package. This empty marker file informs `mypy` that the packaged code contains type definitions.

We can install the `shared` package locally in editable mode using the following command:

```shellsession
❯ pip install --editable .
```

The `shared` package is now installed and we can import it like any other package:

```shellsession
❯ python
>>> from shared.math import Addition
>>> a = Addition()
>>> print(a.add(2, 2))
4
```

The red squiggles should now be gone from the handlers and the test suite should run without any issues. If you're using a modern code editor running a Python language server you should be able to jump around the code, find definitions and get completion suggestions for the packaged code throughout the entire codebase. Finally, any changes to the `shared` package code will be immediately applied throughout the project.

### Deploying the internal package in a layer

We managed to get things working nicely in the local environment, now we just have to figure out how to deploy our internal package in a lambda layer. While the [example project repository](https://github.com/fwojciec/serverless-project-example) uses AWS SAM for deployment, the solution I'm going to describe is tool agnostic and should be easy to adapt to any other AWS deployment framework (we use this approach with Terraform at work, for example).

The first step is to turn our internal package into a wheel (`whl`) file. We can use the [build](https://github.com/pypa/build) tool to do it. After installing the tool with `pip` we can run it as follows:

```shellsession
❯ python -m build -w
```

We run it as a Python module with the `-w` flag to build the wheel file only. By default the build artifacts are placed in the `dist` folder:

```shellsession
├── dist
│  └── shared-0.1.0-py3-none-any.whl
```

The second step is to begin assembling the layer. A lambda layer is packaged as a zipped `python` directory containing Python modules. These modules can be anything Python understands as modules - individual Python files or directories containing `__init__.py` files. The example project uses the `build` directory as staging area - let's, therefore, create `python` directory as a subdirectory of `build`:

```shellsession
❯ mkdir -p build/python
```

Now we can use `pip` to install the shared package wheel to `build/python` directory:

```shellsession
❯ python -m pip install dist/*.whl -t build/python
```

This should produce the following structure under the `build` directory:

```shellsession
├── build
│  └── python
│     ├── shared
│     │  ├── __init__.py
│     │  ├── math.py
│     │  └── py.typed
│     └── shared-0.1.0.dist-info
│        ├── (...)
```

We can use analogous approach to install any external dependencies that should be included in the layer:

```shellsession
❯ python -m pip install -r requirements.txt -t build/python
```

The final step is to zip the `python` directory:

```shellsession
❯ cd build; zip -rq ../layer.zip python; cd ..
```

This will produce a `layer.zip` file located in the root directory of the project. This file is ready to be deployed as a layer using any AWS deployment tool you like.

In the [example project repository](https://github.com/fwojciec/serverless-project-example) I use a `Makefile` to perform the above-described manuals steps automatically:

```makefile
ARTIFACTS_DIR ?= build

# (...)

.PHONY: build
build:
	rm -rf dist || true
	python -m build -w

.PHONY: build_layer
build_layer: build
	rm -rf "$(ARTIFACTS_DIR)/python" || true
	mkdir -p "$(ARTIFACTS_DIR)/python"
	python -m pip install -r requirements.txt -t "$(ARTIFACTS_DIR)/python"
	python -m pip install dist/*.whl -t "$(ARTIFACTS_DIR)/python"

.PHONY: package_layer
package_layer: build build_layer
	cd "$(ARTIFACTS_DIR)"; zip -rq ../layer.zip python
```

Running `make build` will build the package, `make build_layer` will assemble the layer `python` directory and `make package_layer` will turn the `python` directory into a zip archive. The `ARTIFACTS_DIR` defaults to "build" if not set, so the default behavior of the make targets will be like in the manual commands described earlier. The single command to create the layer zip file is `make package_layer` (this target will run `build` and `build_layer` targets as its prerequisites/dependencies).

## Getting pytest to work

With the `shared` package installed in the local Python environment, `pytest` mostly works with this repository structure. This is because `pytest` uses its own module discovery logic that's more flexible regarding directory layout compared to Python's internal one.

The tests will always work when `pytest` is invoked as follows from the root of the project:

```shellsession
❯ python -m pytest
```

The handler tests (`tests/unit/functions_add_test.py` and `tests/unit/functions_multiply_test.py`) will fail, however, when invoking `pytest` directly (i.e. not as a Python module with `python -m`) with the following error:

```shellsession
❯ pytest
tests/unit/functions_add_test.py:2: in <module>
    from functions.add.handler import handler
E   ModuleNotFoundError: No module named 'functions'
(...)
tests/unit/functions_multiply_test.py:2: in <module>
    from functions.multiply.handler import handler
E   ModuleNotFoundError: No module named 'functions'
```

The difference in behavior is explained in [pytest documentation](https://docs.pytest.org/en/6.2.x/pythonpath.html#invoking-pytest-versus-python-m-pytest) - running `python -m pytest` has a side-effect of adding the current directory to `sys.path` per standard `python` behavior.

If you prefer calling `pytest` directly you can work around this quirk by including a `conftest.py` file in the root of the project. This will effectively force `pytest` to include project root in its hierarchy of discovered modules and the command will run without any errors.

## Getting mypy to work

This one took a while to figure out. While `mypy` will run happily against the layer directory, it throws an error when asked to type-check the `functions` directory:

```shellsession
❯ mypy functions
functions/multiply/handler.py: error: Duplicate module named "handler" (also at "functions/add/handler.py")
Found 1 error in 1 file (errors prevented further checking)
```

The problem has to do with the fact that the `functions` directory contains multiple subdirectories, each with a file called `handler.py`. From `mypy`'s perspective this indicates an invalid package structure.

There is a [closed issue in the `mypy` repo](https://github.com/python/mypy/issues/4008) with a discussion about this problem. The problem can be boiled down to this: `mypy` only understands Python packages and relationships between them, while our `functions` folder holds multiple discrete, parallel entry-points into the codebase that don't make sense when interpreted as a package. Contents of the `functions` directory, in other words, is a bit like a monorepo with multiple distinct projects located in separate directories and `mypy` doesn't understand monorepos.

There are different possible ways of working around the problem. One way would be to use distinct handler file names for each function, but that seems like addressing the symptom not the cause of the problem. I ended up just writing a simple `make` target that runs `mypy` separately on each directory to be type checked:

```makefile
MYPY_DIRS := $(shell find functions layer ! -path '*.egg-info*' -type d -maxdepth 1 -mindepth 1 | xargs)

# (...)

.PHONY: mypy
mypy: $(MYPY_DIRS)
	$(foreach d, $(MYPY_DIRS), python -m mypy $(d);)
```

The `MYPY_DIRS` variable finds all direct subdirectories of `layer` and `functions` directories (except the `egg-info` directory that's created by installing the `shared` package in editable mode). The `make mypy` command will run `python -m mypy` for each of those directories.

## Conclusion

The general idea I was hoping to get across in this blog post is that it's possible to leverage Python packaging tooling to decouple project directory structure from the issue of module discovery/resolution in Python. This happens to be very helpful in case of Python AWS serverless projects.

The template of the solution described above could be adjusted to suit many types of projects. If you're working on a system that's comprised of multiple micro-services, this project layout might be used for individual micro-services, with an additional abstraction, such as packages published to an internal repository, to share code between services. In case of very large projects it might be beneficial to package shared code into multiple layers, which is also possible in principle, with few adjustments.

## Resources

- [Example project repository](https://github.com/fwojciec/serverless-project-example)
- [Editable installs using pip](https://pip.pypa.io/en/stable/cli/pip_install/#editable-installs)
- [Using setuptools with setup.cfg files](https://setuptools.pypa.io/en/latest/userguide/declarative_config.html)
- [Packaging lambda layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
- [Module resolution rules in pytest](https://docs.pytest.org/en/6.2.x/pythonpath.html#invoking-pytest-versus-python-m-pytest)
- [Issue with mypy and monorepos](https://github.com/python/mypy/issues/4008)
