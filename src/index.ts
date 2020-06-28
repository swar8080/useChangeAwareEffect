/**
 * @prettier
 */
import { useEffect, useLayoutEffect, useRef, EffectCallback, DependencyList } from "react";
import objectIs from "./objectIs";

const useChangeAwareEffect: ChangeAwareEffectVariant = (effect, dependencies) => {
    useChangeAwareEffectVariant(useEffect, "useEffect", effect, dependencies);
};

const useChangeAwareLayoutEffect: ChangeAwareEffectVariant = (effect, dependencies) => {
    useChangeAwareEffectVariant(useLayoutEffect, "useLayoutEffect", effect, dependencies);
};

const useChangeAwareEffectVariant: (
    useEffectVariant: UseEffectVariant,
    effectVariantName: string,
    ...common: Parameters<ChangeAwareEffectVariant>
) => void = (useEffectVariant, effectVariantName, effect, dependencies) => {
    const prevDependencies = useRef({});

    useEffectVariant(() => {
        let changedCount = 0;
        const changedDependencies = Object.keys(dependencies || {}).reduce((changed, key) => {
            const didChange = !objectIs(dependencies[key], prevDependencies.current[key]);
            changed[key] = didChange;
            changedCount += didChange ? 1 : 0;
            return changed;
        }, {});

        const copiedPrevDependencies = copyObject(prevDependencies.current);
        const changeSummary = {
            length: changedCount,
            hasChanged: (key) =>
                validateKeyInObject(key, changedDependencies, "hasChanged", effectVariantName) &&
                changedDependencies[key],
            previous: (key) =>
                validateKeyInObject(key, changedDependencies, "previous", effectVariantName) &&
                copiedPrevDependencies.current[key],
        };
        prevDependencies.current = dependencies;

        return effect(changeSummary);
    }, getDependencyArray(dependencies));
};

function getDependencyArray(dependencies: Record<string, any> | undefined): any[] | undefined {
    return dependencies && Object.keys(dependencies).map((key) => dependencies[key]);
}

function validateKeyInObject(key: string, o: object, methodName: string, effectVariantName) {
    if (!(key in o)) {
        throw new Error(
            'Invalid key "' +
                key +
                '" specified for ' +
                methodName +
                ". Make sure it matches one of the keys in the object passed to " +
                effectVariantName
        );
    }
    return true;
}

/* Browser support for ie11 */
const copyObject = typeof Object.assign === "function" ? Object.assign : copyObjectPolyfill;
function copyObjectPolyfill(original: object) {
    return Object.keys(original).reduce((copy, key) => {
        copy[key] = original[key];
        return copy;
    }, {});
}

const deps = { foo: 1, bar: "a", 0: "a" };
useChangeAwareEffect((changes) => {
    changes.hasChanged("foo");
    changes.previous("foo");
    changes.length;
}, deps);

type ChangeAwareEffectVariant = <DEPENDENCIES extends Record<string, any>>(
    changeAwareEffect: ChangeAwareEffectCallback<DEPENDENCIES>,
    dependencies?: DEPENDENCIES
) => void;

type UseEffectVariant = (effect: EffectCallback, deps?: DependencyList) => void;

type Changes<DEPENDENCIES extends Record<string, any>> = {
    readonly length: number;
    hasChanged: (dependencyName: keyof DEPENDENCIES) => boolean;
    previous: (dependencyName: keyof DEPENDENCIES) => DEPENDENCIES[keyof DEPENDENCIES];
};

type ChangeAwareEffectCallback<DEPENDENCIES extends Record<string, any>> = (
    changes: Changes<DEPENDENCIES>
) => void | (() => void | undefined);

export { useChangeAwareEffect, useChangeAwareLayoutEffect };
