import React, { createRef } from "react";

export enum SharedListMode {
    Move,
    Clone,
    None,
    Custom,
}

export interface ISortableSharedListProps {
    name: string;
    mode?: SharedListMode;
}

export interface ISortableProps {
    tag?: string;
    sort?: boolean;
    handle?: string;
    //TODO: Make this as array for handling from source to target list
    sharedListProps?: ISortableSharedListProps[];
    onDragEnd?(event: any, draggedItem: Element, targedItem?: Element): void;
    items?: any[];
    onChange?(
        items: any,
        changedItem?: any,
        oldItemIndex?: number,
        newItemIndex?: number
    ): void;
}

interface ISharedData {
    index: number;
    sharedListProps?: ISortableSharedListProps[];
    item?: any;
    items?: any;
}

export interface ISortableState { }

export class Sortable extends React.Component<ISortableProps, ISortableState> {
    private containerRef = createRef();

    private eventsRegistered: boolean = false;

    private currentDragElement?: HTMLElement;

    private static draggedElement?: HTMLElement;

    private static sourceOnChangeFunc?(
        items: any,
        changedItem?: any,
        oldItemIndex?: number,
        newItemIndex?: number
    ): void;

    private static currentSharedData?: ISharedData = undefined;

    private lastMousePosition = { x: null, y: null };

    private mouseMovesDown: boolean = false;

    public static defaultProps: Partial<ISortableProps> = {
        tag: "div",
        sort: true,
    };

    private get items(): Element[] {
        // return Array.from(this.containerRef.current.children);
        return this.containerRef.current.querySelectorAll("[draggable='true']");
    }

    public constructor(props: ISortableProps) {
        super(props);
        this.onItemDragStart = this.onItemDragStart.bind(this);
        this.onItemDropped = this.onItemDropped.bind(this);
        this.onItemDragEnter = this.onItemDragEnter.bind(this);
        this.onItemDragleave = this.onItemDragleave.bind(this);
        this.onItemDragOver = this.onItemDragOver.bind(this);
        this.onItemDragEnd = this.onItemDragEnd.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
    }

    public componentDidMount(): void {
        if (this.eventsRegistered) {
            return;
        }

        this.eventsRegistered = true;

        this.containerRef.current.addEventListener("mousemove", this.onMouseMove);
        //This is for initial call only, do not use this.items, because at this time the draggable atttribute is not set
        Array.from(this.containerRef.current.children as Element[]).forEach((item: Element): void => {
            this.registerEvents(item);
        });
    }

    public componentDidUpdate(prevProps, prevState): void {
        setTimeout(() => {
            if (this.arraysAreEqual(prevProps.items, this.props.items)) {
                return;
            }
            Array.from(this.containerRef.current.children as Element[]).forEach(
                (item: Element): void => {
                    this.removeEvents(item);
                    this.registerEvents(item);
                }
            );
        }, 150);
    }

    private registerEvents(item: Element): void {
        item.classList.remove("dragging");

        if (!item.getAttribute("draggable")) {
            item.setAttribute("draggable", "true");
        }

        item.addEventListener("dragstart", this.onItemDragStart);
        item.addEventListener("drop", this.onItemDropped);
        item.addEventListener("dragenter", this.onItemDragEnter);
        item.addEventListener("dragleave", this.onItemDragleave);
        item.addEventListener("dragover", this.onItemDragOver);
        item.addEventListener("dragend", this.onItemDragEnd);
    }

    private removeEvents(item: Element): void {
        item.removeEventListener("dragstart", this.onItemDragStart);
        item.removeEventListener("drop", this.onItemDropped);
        item.removeEventListener("dragenter", this.onItemDragEnter);
        item.removeEventListener("dragleave", this.onItemDragleave);
        item.removeEventListener("dragover", this.onItemDragOver);
        item.removeEventListener("dragend", this.onItemDragEnd);
    }

    public render(): JSX.Element {
        const Container: any = this.props.tag;
        return <Container ref={this.containerRef}>{this.props.children}</Container>;
    }

    private onItemDragStart(event: any): void {
        const item = this.getRootDraggableElement(event.target);
        const index: number = [...this.items].indexOf(item);

        event.dataTransfer.effectAllowed = "copy";
        item.classList.add("dragging");

        const sharedData: ISharedData = {
            index: index,
            sharedListProps: this.props.sharedListProps,
            items: this.props.items,
            item:
                this.props.items && this.props.items[index]
                    ? this.props.items[index]
                    : undefined,
        };
        event.dataTransfer.setData("text/plain", JSON.stringify(sharedData));
        this.currentDragElement = event.target;
        Sortable.draggedElement = event.target;
        Sortable.sourceOnChangeFunc = this.props.onChange;
        Sortable.currentSharedData = sharedData;
    }

    private onItemDragEnter(event: any): void {
        event.preventDefault();
        event.stopPropagation();
        this.addVisualElementsAndClasses(event);
    }

    private onItemDropped(event: any): void {
        event.preventDefault();
        event.stopPropagation();

        let target = this.getRootDraggableElement(event.target);

        this.removeVisualElementsAndClasses();
        target.classList.remove("target");

        const originalItemData: ISharedData = JSON.parse(
            event.dataTransfer.getData("text/plain")
        ) as ISharedData;

        //Do nothing if the "dragged/dropped" element is not in same container
        if (!originalItemData.sharedListProps && !this.currentDragElement) {
            return;
        }

        const currentListProps = this.getFirstOrDefault(
            originalItemData.sharedListProps,
            (i) => {
                return (
                    i.name ===
                    this.getFirstOrDefault(
                        this.props.sharedListProps,
                        (i2) => i2.name === i.name
                    )?.name || undefined
                );
            }
        );

        const isSameList: boolean = this.containerRef.current.contains(
            this.currentDragElement as Node
        );

        if (!isSameList && currentListProps) {
            this.moveOrCloneToTarget(event, originalItemData, currentListProps);
            return;
        }

        if (!isSameList) {
            return;
        }

        this.sortItem(event, originalItemData);
    }

    private moveOrCloneToTarget(
        event: any,
        originalItemData: ISharedData,
        relevantSharedListData: ISortableSharedListProps
    ): void {
        const target = this.getRootDraggableElement(event.target);
        // const newIndex = [...this.items].indexOf(target);

        if (relevantSharedListData?.mode === SharedListMode.None) {
            return;
        }

        let newIndex = [...this.items].indexOf(target);

        let positionToAdd = "beforebegin";

        if (this.mouseMovesDown) {
            positionToAdd = "afterend";
            newIndex += 1;
        }

        if (relevantSharedListData?.mode === SharedListMode.Custom) {
            this.afterMoveOrClone(originalItemData, newIndex);
            return;
        }

        const isOnChangeSet: boolean = typeof this.props.onChange === "function";

        if (relevantSharedListData?.mode === SharedListMode.Clone) {
            if (!isOnChangeSet) {
                const clonedItem = Sortable.draggedElement?.cloneNode(true);
                // const clonedItem = Sortable.draggedElement;
                this.registerEvents(clonedItem as Element);
                target.insertAdjacentElement(positionToAdd, clonedItem);
            }

            this.afterMoveOrClone(originalItemData, newIndex);
            return;
        }

        if (!isOnChangeSet) {
            target.insertAdjacentElement(positionToAdd, Sortable.draggedElement);
        }

        if (
            originalItemData.items &&
            typeof Sortable.sourceOnChangeFunc === "function"
        ) {
            const newItems = { ...originalItemData };
            newItems.items.splice(newItems.index, 1);

            Sortable.sourceOnChangeFunc(
                newItems.items,
                newItems.item,
                newItems.index,
                -1
            );
        } else {
            Sortable.draggedElement?.remove();
        }

        //TODO: trigger onChange FROM "Source"-Sortable List
        this.afterMoveOrClone(originalItemData, newIndex);
    }

    private sortItem(event: any, originalItemData: ISharedData): void {
        if (!this.props.sort) {
            return;
        }

        const oldIndex = originalItemData.index;

        //The element that is to be replaced and NOT the currently "dragged" element
        // const target = event.target;
        const target = this.getRootDraggableElement(event.target);

        let newIndex = [...this.items].indexOf(target);

        if (oldIndex === newIndex) {
            return;
        }

        // if (newIndex < oldIndex) {
        //   target.insertAdjacentElement("beforebegin", this.items[oldIndex]);
        // } else {
        //   target.insertAdjacentElement("afterend", this.items[oldIndex]);
        // }

        if (this.mouseMovesDown) {
            target.insertAdjacentElement("afterend", this.items[oldIndex]);
        } else {
            target.insertAdjacentElement("beforebegin", this.items[oldIndex]);
        }

        if (originalItemData.items && typeof this.props.onChange === "function") {
            originalItemData.items.splice(oldIndex, 1);
            originalItemData.items.splice(newIndex, 0, originalItemData.item);
            this.props.onChange(
                originalItemData.items,
                originalItemData.item,
                oldIndex,
                newIndex
            );
        }

        this.currentDragElement = undefined;
        Sortable.draggedElement = undefined;
    }

    private afterMoveOrClone(
        originalItemData: ISharedData,
        itemIndex: number
    ): void {
        this.currentDragElement = undefined;
        Sortable.draggedElement = undefined;

        if (typeof this.props.onChange !== "function") {
            return;
        }

        let newItems =
            typeof this.props.items === "object" ? [...this.props.items] : [];
        newItems.splice(itemIndex, 0, originalItemData.item);

        this.props.onChange(
            newItems,
            originalItemData.item,
            originalItemData.index,
            itemIndex
        );
    }

    private onItemDragEnd(event: any): void {
        const item: Element = this.getRootDraggableElement(event.target);
        item.classList.remove("dragging");

        if (typeof this.props.onDragEnd === "function") {
            this.props.onDragEnd(event, Sortable.draggedElement);
        }

        this.removeVisualElementsAndClasses();
        this.currentDragElement = undefined;
        Sortable.draggedElement = undefined;
    }

    private onItemDragleave(event: any): void {
        event.target.classList.remove("target");
    }

    private onItemDragOver(event: any): void {
        event.preventDefault();
        event.stopPropagation();

        this.setMouseMovePositions(event.pageY, event.pageX);
        this.addVisualElementsAndClasses(event);
    }

    private onMouseMove(e: any): void {
        this.setMouseMovePositions(e.clientY, e.clientX);
    }

    private addVisualElementsAndClasses(event: any): void {
        this.removeVisualElementsAndClasses();
        if (!this.props.sort) {
            return;
        }

        if (!Sortable.currentSharedData) {
            return;
        }

        const currentListProps = this.getFirstOrDefault(
            Sortable.currentSharedData.sharedListProps,
            (i) => {
                return (
                    i.name ===
                    this.getFirstOrDefault(
                        this.props.sharedListProps,
                        (i2) => i2.name === i.name
                    )?.name || undefined
                );
            }
        );

        const isSameList: boolean = this.containerRef.current.contains(
            this.currentDragElement as Node
        );

        if (!isSameList && !currentListProps) {
            return;
        }

        if (
            !isSameList &&
            (currentListProps?.mode === SharedListMode.None ||
                currentListProps?.mode === SharedListMode.Custom)
        ) {
            return;
        }

        const target = this.getRootDraggableElement(event.target);

        const el = document.createElement(this.props.tag);
        el.classList.add("visual-element");

        //TODO: Use another classname
        //TODO: Maybe it is better to set the border top/bottom on target...
        if (!this.mouseMovesDown) {
            target.classList.remove("bottom");
            target.classList.add("top");
            // target.insertAdjacentElement("beforebegin", el);
        } else {
            // target.insertAdjacentElement("afterend", el);
            target.classList.add("bottom");
            target.classList.remove("top");
        }

        // target.insertAdjacentElement("beforebegin", el);

        target.classList.add("target");
    }

    private removeVisualElementsAndClasses(): void {
        // this.containerRef.current
        //   .querySelectorAll(".visual-element")
        //   .forEach((el) => {
        //     el.remove();
        //   });

        this.containerRef.current
            .querySelectorAll(".target, .visual-element")
            .forEach((el) => {
                el.classList.remove("target");
                el.classList.remove("bottom");
                el.classList.remove("top");
                el.classList.remove("visual-element");
            });

        // this.containerRef.current
        //   .querySelectorAll(".visual-element")
        //   .forEach((visual) => {
        //     visual.remove();
        //   });

        Sortable.draggedElement?.parentElement
            .querySelectorAll(".target, .visual-element")
            .forEach((el) => {
                el.classList.remove("target");
                el.classList.remove("bottom");
                el.classList.remove("top");
                el.classList.remove("visual-element");
            });

        document.querySelectorAll(".target, .visual-element").forEach((el) => {
            el.classList.remove("target");
            el.classList.remove("bottom");
            el.classList.remove("top");
            el.classList.remove("visual-element");
        });
    }

    private setMouseMovePositions(y: number, x: number): void {
        if (y === this.lastMousePosition.y) {
            return;
        }

        this.mouseMovesDown =
            y > this.lastMousePosition.y
                ? true
                : y < this.lastMousePosition.y
                    ? false
                    : false;

        this.lastMousePosition.x = x;
        this.lastMousePosition.y = y;
    }

    private getRootDraggableElement(currentTarget: Element): Element {
        if (currentTarget.getAttribute("draggable")) {
            return currentTarget;
        }

        let target = currentTarget;

        do {
            target = target.parentElement;
        } while (!target.getAttribute("draggable"));

        return target;
    }

    private getFirstOrDefault<T>(
        arr: T[],
        predicateFunc?: (item: T) => boolean,
        defaultValue: T | null = null
    ): T | null {
        if (
            arr &&
            typeof arr === "object" &&
            typeof arr.length === "number" &&
            arr.length < 1
        ) {
            return defaultValue;
        }

        if (typeof predicateFunc !== "function") {
            return arr[0];
        }

        for (let i: number = 0; i < arr.length; i++) {
            const item: any = arr[i];
            if (predicateFunc(item)) {
                return item;
            }
        }

        return defaultValue;
    }

    private deepEqual(obj1: any, obj2: any): boolean {
        if (obj1 === obj2) {
            return true;
        }

        if (
            typeof obj1 !== "object" ||
            obj1 === null ||
            typeof obj2 !== "object" ||
            obj2 === null
        ) {
            return false;
        }

        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        for (const key of keys1) {
            if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
                return false;
            }
        }

        return true;
    }

    // Function to perform a deep equality check of arrays
    private arraysAreEqual(array1: any[], array2: any[]): boolean {
        if (array1.length !== array2.length) {
            return false;
        }

        for (let i = 0; i < array1.length; i++) {
            if (!this.deepEqual(array1[i], array2[i])) {
                return false;
            }
        }

        return true;
    }
}
