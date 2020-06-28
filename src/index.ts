/**
 * @prettier
 */
import { useEffect, useLayoutEffect, useRef, EffectCallback, DependencyList } from "react";
import objectIs from "./objectIs";

/**
 * Works exactly like useEffect but gives info on what caused the effect to run.
 *
 * @param {function} effect The useEffect callback to run when any of the dependencies change. The callback's first parameter is an object with properties:
 *  - did: An object with keys matching those provided in the dependencies paramter. Each entry is an object of the form {change: boolean, notChange: boolean}
 *  - previous: An object with keys matching those provided in the dependencies parameter. Each entry contains the previous value for that key from the previous render (always undefined after the first render)
 *  - changeCount: the number of dependencies that changed since the last render (always all of them during the first render)
 *  - isMount: boolean that is true on the first render after the hook is mounted
 * @param {object | undefined} dependencies Equivlanet to useEffect's second parameter except it's an object instead of an array
 */
export const useChangeAwareEffect = <D extends Dependencies>(
    effect: ChangeAwareEffectCallback<D>,
    dependencies?: D
) => {
    useChangeAwareEffectVariant(useEffect, effect, dependencies);
};

/**
 * useLayoutEffect version of @see useChangeAwareEffect
 *
 * @param effect
 * @param dependencies
 */
export const useChangeAwareLayoutEffect = <D extends Dependencies>(
    effect: ChangeAwareEffectCallback<D>,
    dependencies?: D
) => {
    useChangeAwareEffectVariant(useLayoutEffect, effect, dependencies);
};

const useChangeAwareEffectVariant = <D extends Dependencies>(
    useEffectVariant: UseEffectVariant,
    effect: ChangeAwareEffectCallback<D>,
    dependencies?: D
) => {
    const prevDependencies = useRef<D>({} as D);
    const isMount = useRef(true);

    useEffectVariant(() => {
        let changeCount = 0;
        const did: DidChange<D> = Object.keys(dependencies || {}).reduce(
            (accumulator, key: keyof D) => {
                const didChange =
                    isMount.current || !objectIs(dependencies[key], prevDependencies.current[key]);

                changeCount += didChange ? 1 : 0;

                accumulator[key] = {
                    change: didChange,
                    notChange: !didChange,
                };
                return accumulator;
            },
            {} as DidChange<D>
        );

        const changeSummary: ChangeSummary<D> = {
            did,
            previous: copyObject(prevDependencies.current),
            changeCount,
            isMount: isMount.current,
        };

        prevDependencies.current = dependencies;
        isMount.current = false;

        return effect(changeSummary);
    }, getDependencyArray(dependencies));
};

/* Browser support for ie11 */
const copyObject = typeof Object.assign === "function" ? Object.assign : copyObjectPolyfill;
function copyObjectPolyfill(original: object) {
    return Object.keys(original).reduce((copy, key) => {
        copy[key] = original[key];
        return copy;
    }, {});
}

function getDependencyArray(dependencies: Record<string, any> | undefined): any[] | undefined {
    return dependencies && Object.keys(dependencies).map((key) => dependencies[key]);
}

type ChangeSummary<D extends Dependencies> = {
    did: Readonly<DidChange<D>>;
    previous: Readonly<PreviousValues<D>>;
    readonly changeCount: number;
    readonly isMount: boolean;
};

type PreviousValues<D> = {
    [K in keyof D]: D[K];
};

export type DidChange<D> = {
    [K in keyof D]: {
        change: boolean;
        notChange: boolean;
    };
};

type UseEffectVariant = (effect: EffectCallback, deps?: DependencyList) => void;

export type ChangeAwareEffectCallback<D> = (
    changes: ChangeSummary<D>
) => void | (() => void | undefined);

export interface Dependencies {
    [name: string]: any;
}
