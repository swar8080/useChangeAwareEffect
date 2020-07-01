/**
 * @prettier
 */

import { useChangeAwareEffect } from "../src/index";

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
