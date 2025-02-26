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
    hasChildren?: boolean;
}

const NestedExample: React.FunctionComponent = () => {
    const [items, setItems] = React.useState<Item[]>([
        { id: 13, text: "Item 1", hasChildren: false },
        { id: 14, text: "Item 2", hasChildren: true },
        { id: 15, text: "Item 3", hasChildren: false },
    ]);

    const [childItems, setChildItems] = React.useState<Item[]>([
        { id: 16, text: "Item 2.1" },
        { id: 17, text: "Item 2.2" },
        { id: 18, text: "Item 2.3" },
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

    const handleOnChildrenChange = (
        items: Item[],
        changedItem?: Item,
        oldIndex?: number,
        newIndex?: number
    ) => {
        // Update your state here.  This example assumes you know which list changed.
        // In a real app, you'd likely need to identify the list.

        setChildItems([...items]);
    };

    return (
        <div>
            <Sortable
                items={items}
                name="parentItems"
                sharedListProps={[{ name: "childItems", mode: SharedListMode.Move }]}
                onChange={handleOnChange}
            >
                {items.map((item: Item): JSX.Element => {
                    return (
                        <div key={item.id} className="list-item">
                            {/* Example of a drag handle */}
                            {item.text}

                            {item.hasChildren &&
                                <Sortable
                                    name="childItems"
                                    sharedListProps={[{ name: "parentItems", mode: SharedListMode.Move }]}
                                    items={childItems}
                                    onChange={handleOnChildrenChange}>
                                    {childItems.map((child: Item): JSX.Element => {
                                        return (
                                            <div key={child.id} className="list-item children">
                                                {/* Example of a drag handle */}
                                                {child.text}
                                            </div>
                                        );
                                    })}
                                </Sortable>
                            }

                        </div>
                    );
                })}
            </Sortable>
        </div>);

}

export default NestedExample;