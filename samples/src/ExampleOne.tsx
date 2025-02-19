import * as React from "react";
import {
    Sortable,
    SharedListMode,
    ISortableProps,
    ISortableSharedListProps,
} from "@spfxappdev/sortable";

interface Item {
    id: number;
    text: string;
}

const ExampleOne: React.FunctionComponent = () => {
    const [items, setItems] = React.useState<Item[]>([
        { id: 1, text: "Item 1" },
        { id: 2, text: "Item 2" },
        { id: 3, text: "Item 3" },
    ]);

    const handleOnChange = (
        items: Item[],
        changedItem?: Item,
        oldIndex?: number,
        newIndex?: number
    ) => {
        // Update your state here.  This example assumes you know which list changed.
        // In a real app, you'd likely need to identify the list.

        setItems([...items]);
    };

    return (
        <div>
            List 1
            <Sortable
                items={items}
                // // sharedListProps={sharedProps}
                onChange={handleOnChange}
                handle=".drag-handle"
                visualizationCssClasses={{
                    target: "sortable-visual-target", //optional
                    top: "sortable-visual-above", //optional
                    bottom: "sortable-visual-below", //optional
                }}
            >
                {items.map((item: Item): JSX.Element => {
                    return (
                        <div key={item.id} className="list-item">
                            {/* Example of a drag handle */}
                            <span className="drag-handle">|||</span>
                            {item.text}
                        </div>
                    );
                })}
            </Sortable>
        </div>);

}

export default ExampleOne;