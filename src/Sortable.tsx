import * as React from "react";

/**
 * Defines how Sortable lists interact when items are dragged between them.
 * The mode of the *target* list is what matters.
 */
export enum SharedListMode {
    /**
      * Moves the item to the target list.
     */
    Move,

    /**
     * Clones/Copies the item to the target list.
     */
    Clone,

    /**
     *  No interaction.  The item cannot be moved.
     */
    None,

    /**
     * Allows custom logic for the interaction.
     */
    Custom,
}

/**
 *  Properties for interaction between Sortable lists.
 *  Used in the `sharedListProps` array of a Sortable component.
 */
export interface ISortableSharedListProps {

    /**
    *  The name that identifies which Sortable lists can interact.
    *  Only lists with the *same* “name” can interact.
    */
    name: string;

    /**
     * The interaction mode (Move, Clone, None, Custom).
     * The `mode` of the *target* list determines what happens.
     *
     * @default SharedListMode.Move
     */
    mode?: SharedListMode;
}

/**
 * CSS classes for customizing the visual appearance of the drag-and-drop interaction.
 */
export interface IVisualizationCssClasses {
    /**
     * CSS class applied to the element above the drop target.
     * @default 'above-drop-target'
     */
    top: string;

    /**
     * CSS class applied to the element below the drop target.
     * @default 'below-drop-target'
     */
    bottom: string;

    /**
     * CSS class applied to the element below the drop target.
     * @default 'drop-target'
     */
    target: string;
}

/**
 * Properties for the `Sortable` component.
 */
export interface ISortableProps {
    /**
     * The HTML tag to use for the container element.
     *
     * @default 'div'
     */
    tag?: string;

    /**
     *  Standard HTML attributes (like `className`, `style`, etc.) to pass to the container element.
     */
    containerProps?: React.HTMLAttributes<HTMLElement>;

    /**
     * Whether sorting is enabled within this list.
     *
     * @default true
     */
    sort?: boolean;

    /**
     * A CSS selector to specify which elements *within* a list item
     * are used as drag handles.  If not provided, the entire list item is draggable.
     * The handle *must* be a child element of a list item.
     * @example: `.my-handle-class` or `button.drag-handle`
     */
    handle?: string;

    /**
     *  Defines how this Sortable list interacts with other Sortable lists.
     * @see ISortableSharedListProps
     */
    sharedListProps?: ISortableSharedListProps[];

    /**
    * Optional callback function that is called when a drag operation ends.
    *
    * @param event The original drag event.
    * @param draggedItem The DOM element that was dragged.
    * @param targetItem The DOM element where the dragged item was dropped (undefined if dropped outside a valid target).
    */
    onDragEnd?(event: any, draggedItem: Element, targedItem?: Element): void;

    /**
     *  An array of data items that correspond to the list items in the UI.
     *  This is primarily used when cloning/moving items between lists.
     *  It allows the component to keep track of the correct order of items,
     *  even after they have been cloned/moved.  The items in this array should
     *  match the structure of your rendered list items.
     */
    items?: any[];

    /**
     * Optional CSS classes to customize the visual appearance.
     * You can provide any or all of the `top`, `bottom`, and `target` classes.
     * @see IVisualizationCssClasses
     * @default { top: "above-drop-target", bottom: 'below-drop-target', target: 'drop-target' }
     */
    visualizationCssClasses?: Partial<IVisualizationCssClasses>;

    /**
     * Optional callback function called when the order of items changes.
     * Use this to update your application's state.
     *
     * @param items The updated array of items (in the new order).
     * @param changedItem The item that was moved, cloned, or otherwise changed.
     * @param oldItemIndex The original index of the `changedItem` (before the change).
     * @param newItemIndex The new index of the `changedItem` (after the change).
     */
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
    private containerRef = React.createRef<HTMLElement>();

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

    private lastMousePosition = { x: 0, y: 0 };

    private mouseMovesDown: boolean = false;

    private get visualizationCssClasses(): IVisualizationCssClasses {
        const defaultCssClasses = {
            top: "above-drop-target",
            bottom: "below-drop-target",
            target: "drop-target",
        };

        const customCssProps = this.props.visualizationCssClasses || {};
        return { ...defaultCssClasses, ...customCssProps };
    }

    public static defaultProps: Partial<ISortableProps> = {
        tag: "div",
        sort: true,
    };

    private get items(): Element[] {
        const items = (this.containerRef.current as HTMLElement).querySelectorAll(
            "[draggable='true']"
        );

        return Array.from<Element>(items);
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

        const container = this.containerRef?.current as HTMLElement;

        container.addEventListener("mousemove", this.onMouseMove);
        const a = container.children[0];
        //This is for initial call only, do not use this.items, because at this time the draggable atttribute is not set
        Array.from<HTMLElement>(
            container.children as HTMLCollectionOf<HTMLElement>
        ).forEach((item: HTMLElement) => {
            this.registerEvents(item);
        });
    }

    public componentDidUpdate(
        prevProps: ISortableProps,
        prevState: ISortableState
    ): void {
        setTimeout(() => {
            if (!prevProps.items || !this.props.items) {
                return;
            }

            if (this.arraysAreEqual(prevProps.items, this.props.items)) {
                return;
            }

            const container = this.containerRef?.current as HTMLElement;

            Array.from<HTMLElement>(
                container.children as HTMLCollectionOf<HTMLElement>
            ).forEach((item: HTMLElement) => {
                this.removeEvents(item);
                this.registerEvents(item);
            });
        }, 150);
    }

    private registerEvents(item: HTMLElement): void {
        item.classList.remove("dragging");
        item.dataset.spfxappdevdraggableroot = "true";

        let draggableAttr = item.getAttribute("draggable");

        // if (draggableAttr === "false") {
        //   return;
        // }

        const itemOrHandle = this.props.handle
            ? item.querySelector(this.props.handle)
            : item;

        if (!itemOrHandle) {
            return;
        }

        draggableAttr = itemOrHandle.getAttribute("draggable");

        if (!draggableAttr) {
            itemOrHandle.setAttribute("draggable", "true");
        }

        item.addEventListener("dragstart", this.onItemDragStart);
        item.addEventListener("drop", this.onItemDropped);
        item.addEventListener("dragenter", this.onItemDragEnter);
        item.addEventListener("dragleave", this.onItemDragleave);
        item.addEventListener("dragover", this.onItemDragOver);
        item.addEventListener("dragend", this.onItemDragEnd);
    }

    private removeEvents(item: HTMLElement): void {
        item.removeEventListener("dragstart", this.onItemDragStart);
        item.removeEventListener("drop", this.onItemDropped);
        item.removeEventListener("dragenter", this.onItemDragEnter);
        item.removeEventListener("dragleave", this.onItemDragleave);
        item.removeEventListener("dragover", this.onItemDragOver);
        item.removeEventListener("dragend", this.onItemDragEnd);
    }

    public render(): JSX.Element {
        const Container: any = this.props.tag;
        return (
            <Container {...this.props.containerProps} ref={this.containerRef}>
                {this.props.children}
            </Container>
        );
    }

    private onItemDragStart(event: any): void {
        const item = this.getRootDraggableElement(event.target);
        this.currentDragElement = item as HTMLElement;
        Sortable.draggedElement = item as HTMLElement;
        Sortable.sourceOnChangeFunc = this.props.onChange;

        const isHandle =
            typeof this.props.handle !== "undefined" && this.props.handle !== null;

        if (isHandle) {
            if (item.getAttribute("draggable") === "false") {
                return;
            }

            item.setAttribute("draggable", "true");
            item
                .querySelector(this.props.handle as string)
                ?.setAttribute("draggable", "false");
        }

        if (item.getAttribute("draggable") === "false") {
            return;
        }

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

        if (
            Sortable.draggedElement &&
            Sortable.draggedElement.getAttribute("draggable") === "false"
        ) {
            return;
        }

        let target = this.getRootDraggableElement(event.target);

        this.removeVisualElementsAndClasses();
        target.classList.remove(this.visualizationCssClasses.target);

        const eventData = event.dataTransfer.getData("text/plain");

        if (!eventData) {
            return;
        }

        const originalItemData: ISharedData = JSON.parse(eventData) as ISharedData;

        //Do nothing if the "dragged/dropped" element is not in same container
        if (!originalItemData.sharedListProps && !this.currentDragElement) {
            return;
        }

        const currentListProps = this.getFirstOrDefault(
            originalItemData.sharedListProps as ISortableSharedListProps[],
            (i: ISortableSharedListProps) => {
                return (
                    i.name ===
                    this.getFirstOrDefault(
                        this.props.sharedListProps as ISortableSharedListProps[],
                        (i2: ISortableSharedListProps) => i2.name === i.name
                    )?.name
                );
            }
        );

        const isSameList: boolean = (
            this.containerRef.current as HTMLElement
        ).contains(this.currentDragElement as Node);

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

        let positionToAdd: InsertPosition = "beforebegin";

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
                const clonedItem = (Sortable.draggedElement as HTMLElement).cloneNode(
                    true
                ) as HTMLElement;
                // const clonedItem = Sortable.draggedElement;
                this.registerEvents(clonedItem);
                target.insertAdjacentElement(positionToAdd, clonedItem);
            }

            this.afterMoveOrClone(originalItemData, newIndex);
            return;
        }

        if (!isOnChangeSet) {
            target.insertAdjacentElement(
                positionToAdd,
                Sortable.draggedElement as HTMLElement
            );
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

        const isHandle =
            typeof this.props.handle !== "undefined" && this.props.handle !== null;

        if (isHandle) {
            item.removeAttribute("draggable");
            item
                .querySelector(this.props.handle as string)
                ?.setAttribute("draggable", "true");
        }

        if (typeof this.props.onDragEnd === "function") {
            this.props.onDragEnd(event, Sortable.draggedElement as HTMLElement);
        }

        this.removeVisualElementsAndClasses();
        this.currentDragElement = undefined;
        Sortable.draggedElement = undefined;
    }

    private onItemDragleave(event: any): void {
        event.target.classList.remove(this.visualizationCssClasses.target);
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
            Sortable.currentSharedData.sharedListProps as ISortableSharedListProps[],
            (i: ISortableSharedListProps) => {
                return (
                    i.name ===
                    this.getFirstOrDefault(
                        this.props.sharedListProps as ISortableSharedListProps[],
                        (i2: ISortableSharedListProps) => i2.name === i.name
                    )?.name
                );
            }
        );

        const isSameList: boolean = (
            this.containerRef.current as HTMLElement
        ).contains(this.currentDragElement as Node);

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

        if (!this.mouseMovesDown) {
            target.classList.remove(this.visualizationCssClasses.bottom);
            target.classList.add(this.visualizationCssClasses.top);
        } else {
            target.classList.add(this.visualizationCssClasses.bottom);
            target.classList.remove(this.visualizationCssClasses.top);
        }

        target.classList.add(this.visualizationCssClasses.target);
    }

    private removeVisualElementsAndClasses(): void {
        const targetSelector: string = `.${this.visualizationCssClasses.target}`;
        (this.containerRef.current as HTMLElement)
            .querySelectorAll(targetSelector)
            .forEach((el) => {
                // el.classList.remove(this.visualizationCssClasses.target);
                el.classList.remove(this.visualizationCssClasses.bottom);
                el.classList.remove(this.visualizationCssClasses.top);
            });

        if (Sortable.draggedElement && Sortable.draggedElement.parentElement) {
            (Sortable.draggedElement.parentElement as HTMLElement)
                .querySelectorAll(targetSelector)
                .forEach((el) => {
                    // el.classList.remove(this.visualizationCssClasses.target);
                    el.classList.remove(this.visualizationCssClasses.bottom);
                    el.classList.remove(this.visualizationCssClasses.top);
                });
        }

        document.querySelectorAll(targetSelector).forEach((el) => {
            el.classList.remove(this.visualizationCssClasses.bottom);
            el.classList.remove(this.visualizationCssClasses.top);
            el.classList.remove(this.visualizationCssClasses.target);
        });
    }

    private setMouseMovePositions(y: number, x: number): void {
        if (y === this.lastMousePosition.y) {
            return;
        }

        this.mouseMovesDown = y > this.lastMousePosition.y;

        this.lastMousePosition.x = x;
        this.lastMousePosition.y = y;
    }

    private getRootDraggableElement(currentTarget: Element): Element {
        let target: HTMLElement = currentTarget as HTMLElement;

        if (currentTarget instanceof Text) {
            target = (currentTarget as Text).parentElement as HTMLElement;
        }

        if (target.dataset.spfxappdevdraggableroot) {
            return target;
        }

        do {
            if (!target.parentElement) {
                break;
            }

            target = target.parentElement;
        } while (!target.dataset.spfxappdevdraggableroot);

        return target;
    }

    private getFirstOrDefault<T>(
        arr: T[],
        predicateFunc?: (item: T) => boolean,
        defaultValue: T | null = null
    ): T | null {
        if (
            !arr ||
            (arr &&
                typeof arr === "object" &&
                typeof arr.length === "number" &&
                arr.length < 1)
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
            if (keys2.indexOf(key) < 0 || !this.deepEqual(obj1[key], obj2[key])) {
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