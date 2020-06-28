/**
 * @prettier
 */
import * as React from "react";
import { useState, useRef } from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import {
    useChangeAwareEffect,
    ChangeAwareEffectCallback,
    Dependencies,
    DidChange,
} from "../src/index";

describe("useChangeAwareEffect", () => {
    let container;
    let rerenderWithDependencies: <D extends Dependencies>(
        dependencies: D,
        changeAwareCallback: ChangeAwareEffectCallback<D>
    ) => void;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterEach(() => {
        ReactDOM.unmountComponentAtNode(container);
        document.body.removeChild(container);
        container = null;
        rerenderWithDependencies = undefined;
    });

    const TestComponent = ({ initialDependencies, changeAwareCallback }) => {
        const [currentDependencies, setDependencies] = useState(initialDependencies);
        const changeAwareCallbackRef = useRef(changeAwareCallback);

        rerenderWithDependencies = (dependencies, nextChangeSummaryConsumer) => {
            changeAwareCallbackRef.current = nextChangeSummaryConsumer;
            setDependencies(dependencies);
        };

        useChangeAwareEffect((result) => {
            return changeAwareCallbackRef.current(result);
        }, currentDependencies);

        return null;
    };

    const renderComponent = <D extends Dependencies>(
        dependencies: D,
        changeAwareCallback: ChangeAwareEffectCallback<D>
    ) => {
        act(() => {
            if (!rerenderWithDependencies) {
                //mount
                ReactDOM.render(
                    <TestComponent
                        initialDependencies={dependencies}
                        changeAwareCallback={changeAwareCallback}
                    />,
                    container
                );
            } else {
                //update
                rerenderWithDependencies(dependencies, changeAwareCallback);
            }
        });
    };

    const expectChanged: <D>(did: DidChange<D>, key: keyof D) => void = (did, key) => {
        expect(did[key].change).toBe(true);
        expect(did[key].notChange).toBe(false);
    };

    const expectNotChanged: <D>(did: DidChange<D>, key: keyof D) => void = (did, key) => {
        expect(did[key].change).toBe(false);
        expect(did[key].notChange).toBe(true);
    };

    test("an effect with changing dependencies", () => {
        let initialDependencies = {
            a: 1,
            b: "foo",
            c: [],
            d: {},
            e: null,
            f: undefined,
            g: () => {},
        };

        //everyting is considered changed after the first render
        renderComponent(initialDependencies, ({ did, previous, changeCount, isMount }) => {
            expectChanged(did, "a");
            expectChanged(did, "b");
            expectChanged(did, "c");
            expectChanged(did, "d");
            expectChanged(did, "e");
            expectChanged(did, "f");
            expectChanged(did, "g");

            expect(previous.a).toBe(undefined);
            expect(previous.b).toBe(undefined);
            expect(previous.c).toBe(undefined);
            expect(previous.d).toBe(undefined);
            expect(previous.e).toBe(undefined);
            expect(previous.f).toBe(undefined);
            expect(previous.g).toBe(undefined);

            expect(changeCount).toBe(7);
            expect(isMount).toBe(true);
        });

        //nothing changes
        //everyting is considered changed after the first render
        const secondDependencies = {
            a: 1,
            b: "foo",
            c: initialDependencies.c,
            d: initialDependencies.d,
            e: null,
            f: undefined,
            g: initialDependencies.g,
        };
        renderComponent(secondDependencies, ({ did, previous, changeCount, isMount }) => {
            expectNotChanged(did, "a");
            expectNotChanged(did, "b");
            expectNotChanged(did, "c");
            expectNotChanged(did, "d");
            expectNotChanged(did, "e");
            expectNotChanged(did, "f");
            expectNotChanged(did, "g");

            expect(previous.a).toBe(1);
            expect(previous.b).toBe('foo');
            expect(previous.c).toBe(initialDependencies.c);
            expect(previous.d).toBe(initialDependencies.d);
            expect(previous.e).toBe(null);
            expect(previous.f).toBe(undefined);
            expect(previous.g).toBe(initialDependencies.g);

            expect(changeCount).toBe(0);
            expect(isMount).toBe(false);
        });

        //everything changes
        const thirdDependencies = {
            a: secondDependencies.a + 1,
            b: secondDependencies.b + "-new",
            c: [],
            d: {},
            e: 'new e',
            f: 'new f',
            g: () => {}
        };
        renderComponent(thirdDependencies, ({did, previous, changeCount, isMount}) => {
            expectChanged(did, "a");
            expectChanged(did, "b");
            expectChanged(did, "c");
            expectChanged(did, "d");
            expectChanged(did, "e");
            expectChanged(did, "f");
            expectChanged(did, "g");

            expect(previous.a).toBe(secondDependencies.a);
            expect(previous.b).toBe(secondDependencies.b);
            expect(previous.c).toBe(secondDependencies.c);
            expect(previous.d).toBe(secondDependencies.d);
            expect(previous.e).toBe(null);
            expect(previous.f).toBe(undefined);
            expect(previous.g).toBe(secondDependencies.g);

            expect(changeCount).toBe(7);
            expect(isMount).toBe(false);
        })
    });

    test("a one time effect is only called on the first render", () => {
        let calledDuringFirstRender = false;
        let calledDuringSecondRender = false;
        renderComponent({}, ({changeCount, isMount}) => {
            calledDuringFirstRender = true;
            expect(changeCount).toBe(0);
            expect(isMount).toBe(true);
        });
        renderComponent({}, ({changeCount, isMount}) => {
            calledDuringSecondRender = true;
            expect(changeCount).toBe(0);
            expect(isMount).toBe(true);
        });
        expect(calledDuringFirstRender && !calledDuringSecondRender);
    });

    test("an effect that's always called", () => {
        let calledDuringFirstRender = false;
        let calledDuringSecondRender = false;
        
        renderComponent(undefined, ({isMount, changeCount}) => {
            calledDuringFirstRender = true;
            expect(changeCount).toBe(0);
            expect(isMount).toBe(true);
        });

        renderComponent(undefined, ({isMount, changeCount}) => {
            calledDuringSecondRender = true;
            expect(changeCount).toBe(0);
            expect(isMount).toBe(true);
        });
        
        expect(calledDuringFirstRender && calledDuringSecondRender);
    });

    test('an effect with a clean-up function', () => {
        const cleanupFunction = jest.fn();
        renderComponent(undefined, ({isMount, changeCount}) => {
            return cleanupFunction;
        });
        ReactDOM.unmountComponentAtNode(container);
        expect(cleanupFunction).toHaveBeenCalled();
    })
});
