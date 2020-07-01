#  How the built-in useEffect hook works
React's built-in [useEffect](https://reactjs.org/docs/hooks-effect.html) hook lets your code run side-effects on a component's first render and whenever any of it's dependencies (second argument to useEffect) change. Shallow equality ([Object.is](https://github.com/facebook/react/blob/30b47103d4354d9187dc0f1fb804855a5208ca9f/packages/shared/objectIs.js "React's Object.is implementation")) is used to check if a dependency changed.

# Motivation for useChangeAwareEffect
Sometimes, `useEffect` does not provide enough information to decide if a side-effect should be run, and also which side-effect should be run:
- A side-effect might need to be skipped during the first render.
- Shallow equality can lead to the side-effect running more than needed. Sometimes custom logic for detecting changes in dependencies is preferred.
- Sometimes the side-effect to run is dependent on which dependencies changed, and also how those dependencies changed since the previous render.

[useRef](https://reactjs.org/docs/hooks-reference.html#useref) can be used to get around these limitations by keeping track of dependency values from the previous render, but that can lead to a bunch of boilerplate code.

`useChangeAwareEffect` works exactly like `useEffect`, but with less code and improved readability compared to using `useRef`.
# Usage

## Installation
`npm install --save use-change-aware-effect`

## API
`useChangeAwareEffect(changeAwareCallback({did, previous, changeCount, isMount}), dependencyObject)`
`useChangeAwareLayoutEffect(changeAwareCallback({did, previous, changeCount, isMount}), dependencyObject)`

#### dependencyObject
Equivalent to the second parameter of `useEffect`, but it's an object and not an array of dependencies. This makes the `changeAwareCallback` easier to use since you can refer to dependencies by their object key.

Internally, the values in the object are converted into an array and passed to react's useEffect. Just like useEffect, the `changeAwareCallback` is executed whenever one of the values change between renders, or always when this parameter is omitted or `undefined`. React's Object.is implementation is used to detect changes.

#### changeAwareCallback
Equivalent to the function used as the first parameter of `useEffect`, but is passed an object containing additional information about what changed between executions of the callback:
- `isMount: boolean` true when the function is executed for the first time after the component using this hook is mounted.

- `did: object` An object summarizing which dependencies changed since the previous execution of `changeAwareCallback`. The object contains the same keys as `dependencyObject`, and each value has properties:
   - `change: boolean` true when the dependency with the given key changed since the last execution (ex: `did.foo.change`). Always true after the initial render.
   - `notChange: boolean` true when the dependency with the given key did not change since the last execution (ex: `did.bar.notChange`). Always false after the initial render.

- `previous: object` The `dependencyObject` passed to `useChangeAwareEffect` that triggered the previous exection of `changeAwareCallback`. During the initial render, the previous value for each dependency is `undefined`.

- `changeCount: number` the number of dependencies from `dependencyObject` that changed since the previous execution of `changeAwareCallback`

Just like `useEffect`, you can optionally return a function from `changeAwareEffectCallback` to perform any clean-up logic.
# Examples
```
import { useChangeAwareEffect } from "use-change-aware-effect";

/**
 * An example hook that shows how useChangeAwareEffect can simplify conditionally running an effect.
 * 
 * The hook records whenever a user finishes all of the todos on their list
 * by identifying when the list went from having some todos to having 0.
 * 
 * Alternatively, this check could be made in all code paths that could remove todos, 
 * although useChangeAwareEffect centralizes this side-effect to one place.
 * 
 * @param todos a list of todo-items for the user
 */
const useTodosEventTracking = (todos: any[]) => {
    useChangeAwareEffect(
        ({ previous, isMount }) => {
            if (!isMount && previous.todos.length > 0 && todos.length === 0)  {
                trackFinishedAllTodosEvent();
            }
        },
        { todos }
    );

    function trackFinishedAllTodosEvent() {
        //record that the user finished all of their todos, maybe with something like google analytics
    }
};

```

```
import React from "react";
import { useChangeAwareEffect } from "use-change-aware-effect";

/**
 * An example hook to run a different side-effect based on what changed during the previous render.
 *
 * The hook is used to efficiently keep track of and reload values in a grid that has filters:
 * - When any filters change, all of the rows and cell data need to be filtered and reloaded from scratch, which is expensive
 * - When just new columns are added to the grid, only reloading cell data for the existing rows is neccesary, which is less expensive
 *
 */
const useGridData = (gridFilterA: object, gridFilterB: object, gridColumns: Set<string>) => {
    const [gridData, setGridData] = React.useState<object[]>([]);

    useChangeAwareEffect(
        ({ did, changeCount, previous }) => {
            //two ways to figure out if just one dependency changed
            let didJustColumnsChange =
                did.gridColumns.change && did.gridFilterA.notChange && did.gridFilterB.notChange;
            didJustColumnsChange = did.gridColumns.change && changeCount == 1;

            if (didJustColumnsChange && wereNewColumnsAdded(gridColumns, previous.gridColumns)) {
                reloadJustCellData();
            } else {
                reloadEverything();
            }
        },
        { gridFilterA, gridFilterB, gridColumns }
    );

    function reloadEverything() {
        //load an entirely new set of grid data based on the new filters
    }

    function reloadJustCellData() {
        //reload cell data for the existing rows in the grid
    }

    function wereNewColumnsAdded(currentColumns: Set<string>, previousColumns: Set<string>) {
        return true;
    }

    return gridData;
};
```
# Typescript Support
If using typescript, your IDE's auto-complete is aware of valid properties on the `did` and `previous` objects:

![Auto-complete in VSCode example](https://i.imgur.com/zt2VJqG.png "Auto-complete in VSCode example")
