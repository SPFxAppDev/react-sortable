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

const SharedExample: React.FunctionComponent = () => {
    const [items, setItems] = React.useState<Item[]>([
        { id: 7, text: "Item 1" },
        { id: 8, text: "Item 2" },
        { id: 9999, text: "Not draggable" },
        { id: 9, text: "Item 3" },

    ]);

    const [itemsRight, setRightItems] = React.useState<Item[]>([
        { id: 10, text: "Item 1" },
        { id: 11, text: "Item 2" },
        { id: 12, text: "Item 3" },
    ]);

    const [itemsBottomLeft, setBottomLeftItems] = React.useState<Item[]>([]);
    const [itemsBottomRight, setBottomRightItems] = React.useState<Item[]>([]);

    const sharedLeftListProps: ISortableSharedListProps[] = [
        { name: "sharedGroupRight", mode: SharedListMode.Clone },
        { name: "sharedGroupLeftBottom", mode: SharedListMode.Clone },
        { name: "sharedGroupRightBottom", mode: SharedListMode.Clone },
    ];

    const sharedRightListProps: ISortableSharedListProps[] = [
        { name: "sharedGroupLeft", mode: SharedListMode.None },
        { name: "sharedGroupLeftBottom", mode: SharedListMode.Move },
        { name: "sharedGroupRightBottom", mode: SharedListMode.Move },
    ];

    const sharedLeftBottomListProps: ISortableSharedListProps[] = [
        { name: "sharedGroupRight", mode: SharedListMode.None },
        { name: "sharedGroupRightBottom", mode: SharedListMode.Move },
    ];

    const sharedRightBottomListProps: ISortableSharedListProps[] = [
        { name: "sharedGroupRight", mode: SharedListMode.Move },
        { name: "sharedGroupLeftBottom", mode: SharedListMode.Move }
    ];

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

    const handleRightOnChange = (
        items: Item[],
        changedItem?: Item,
        oldIndex?: number,
        newIndex?: number
    ) => {
        // Update your state here.  This example assumes you know which list changed.
        // In a real app, you'd likely need to identify the list.

        if (newIndex >= 0) {
            items[newIndex].id = new Date().getTime();
        }

        setRightItems([...items]);
    };

    const handleLeftBottomOnChange = (
        items: Item[],
        changedItem?: Item,
        oldIndex?: number,
        newIndex?: number
    ) => {

        //Because of the "dummy" container "Drop here" you have to check the index as well
        let itemIndex = newIndex >= 0 ? newIndex : -1;

        if (oldIndex < 0) {
            itemIndex = items.length - 1;
        }

        if (itemIndex >= 0) {
            items[itemIndex].id = new Date().getTime();
        }

        setBottomLeftItems([...items]);
    };

    const handleRightBottomOnChange = (
        items: Item[],
        changedItem?: Item,
        oldIndex?: number,
        newIndex?: number
    ) => {
        //Because of the "dummy" container "Drop here" you have to check the index as well
        let itemIndex = newIndex >= 0 ? newIndex : -1;

        if (oldIndex < 0) {
            itemIndex = items.length - 1;
        }

        if (itemIndex >= 0) {
            items[itemIndex].id = new Date().getTime();
        }

        setBottomRightItems([...items]);
    };

    return (
        <>
            <div className="shared-container">
                <Sortable
                    items={items}
                    sort={false}
                    name="sharedGroupLeft"
                    sharedListProps={sharedLeftListProps}
                    onChange={handleOnChange}
                >
                    {items.map((item: Item): JSX.Element => {
                        return (
                            <div key={item.id} className="list-item" draggable={item.id === 9999 ? "false" : "true"}>
                                {item.text}
                            </div>
                        );
                    })}
                </Sortable>

                <Sortable
                    items={itemsRight}
                    name="sharedGroupRight"
                    sharedListProps={sharedRightListProps}
                    onChange={handleRightOnChange}
                >
                    {itemsRight.map((item: Item): JSX.Element => {
                        return (
                            <div key={item.id} className="list-item">
                                {item.text}
                            </div>
                        );
                    })}
                </Sortable>
            </div>
            <div className="shared-container">
                <Sortable
                    items={itemsBottomLeft}
                    name="sharedGroupLeftBottom"
                    sharedListProps={sharedLeftBottomListProps}
                    onChange={handleLeftBottomOnChange}
                >
                    {itemsBottomLeft.length === 0 &&
                        <div draggable="false" className="empty">
                            Drag item here
                        </div>
                    }
                    {itemsBottomLeft.map((item: Item): JSX.Element => {
                        return (
                            <div key={item.id} className="list-item">

                                {item.text}
                            </div>
                        );
                    })}
                </Sortable>

                <Sortable
                    items={itemsBottomRight}
                    name="sharedGroupRightBottom"
                    sharedListProps={sharedRightBottomListProps}
                    onChange={handleRightBottomOnChange}
                >
                    {itemsBottomRight.length === 0 &&
                        <div draggable="false" className="empty">
                            Drag item here
                        </div>
                    }
                    {itemsBottomRight.map((item: Item): JSX.Element => {
                        return (
                            <div key={item.id} className="list-item">
                                {/* Example of a drag handle */}
                                {item.text}
                            </div>
                        );
                    })}
                </Sortable>
            </div>
        </>);

}

export default SharedExample;