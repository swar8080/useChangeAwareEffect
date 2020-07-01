/**
 * @prettier
 */
import React from "react";
import { useChangeAwareEffect } from "../src/index";

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
